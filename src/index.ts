// Copyright 2017 Frank Lin (lin.xiaoe.f@gmail.com). All rights reserved.
// Use of this source code is governed a license that can be found in the LICENSE file.

import * as path from "path";
import * as proj4 from "proj4";

import {DBClient, QueryResult, SelectQuery} from "sakura-node-3";

let mapnik = require("mapnik");


/**
 * 初始化参数
 */
export interface MapnikServiceOptions {
  client: DBClient; // 用于查询的数据库

  spatialReference: SpatialReference; // 用于构建坐标系

  /**
   * 需要和前端校对该字段 (见下文的 source-layer)，用于前端展示 protobuf 数据控制图层时候使用
   * @程正豪说: 如果没有这个值，或者传的值不对，地块是加载不出来的，控制台也不报错，非常恐怖
   *
   * const vectorSourceOptions = {
        type: 'fill',
        id: 'LandVectorLayer',
        'source-layer': 'zed',
        interactive: true,
        minzoom: 0,
        maxzoom: 18,
        layout: {
          visibility: 'visible',
        },
        paint: {
          'fill-color': this.props.fillColorStops,
          'fill-outline-color': '#000',
        },
        filter: this.props.emptyFilter ? ['!has', 'cropType'] : ['has', 'cropType']
      };
   */
  mapboxVectorSourceLayerName: string;

  shapeColumnAlias?: string; // 用于重命名 shape 字段 (geometry 类型)
}

/**
 * 坐标系
 */
export enum SpatialReference {
  WGS84 = 0
}

interface GeoJson {
  type: string;
  properties: any;
  geometry: any;
}

interface GeoJsonFeatureCollection {
  type: string;
  crs: {type: string, properties: any};
  features: GeoJson[];
}


/**
 * Mapnik 对 MySQL 的兼容性支持
 *
 * Usage:
 *  MapnikService.init({client: client, spatialReference: SpatialReference.WGS84}); // 其中 client 为初始化过的 DBClient
 *  const pbf: Buffer = await MapnikService.queryTileAsPbf("lands", ["owner", "displayName"], 3, 7, 5);
 */
export class MapnikService {
  private static client_: DBClient;
  private static spatialReference_: SpatialReference;
  private static shapeColumnName: string = "SHAPE";
  private static mapboxVectorSourceLayerName: string = "demo";

  /**
   * 初始化 service
   * @param options 可选参数
   */
  static async init(options: MapnikServiceOptions): Promise<void> {
    const client: DBClient = options.client;

    MapnikService.client_ = client;
    MapnikService.spatialReference_ = options.spatialReference;
    MapnikService.mapboxVectorSourceLayerName = options.mapboxVectorSourceLayerName;

    if (options.shapeColumnAlias) {
      MapnikService.shapeColumnName = options.shapeColumnAlias;
    }

    // MySQL 依赖 spatial_ref_sys 表来索引坐标系，故在初始化时应建表并插入数据
    //  SRID int(11)
    //  AUTH_NAME varchar(256)
    //  AUTH_SRID int(11)
    //  SRTEXT varchar(2048)
    const createTableSql: string =
      `CREATE TABLE IF NOT EXISTS spatial_ref_sys
(
    SRID INT(11) PRIMARY KEY NOT NULL,
    AUTH_NAME VARCHAR(256),
    AUTH_SRID INT(11),
    SRTEXT VARCHAR(2048)
);
CREATE UNIQUE INDEX spatial_ref_sys_SRID_uindex ON spatial_ref_sys (SRID);`;
    try {
      await client.query(createTableSql);
    } catch(e) {
      if (e.message !== "ER_DUP_KEYNAME: Duplicate key name 'spatial_ref_sys_SRID_uindex'") {
        throw e;
      }
    }

    // 根据用户指定的坐标系加入
    const replaceSql: string = MapnikService.spaRefSysReplaceSql_(options.spatialReference);
    await client.query(replaceSql);
  }

  /**
   * 根据 Google 瓦片行列号查询数据并将其转为 pbf 返回
   * @param tableName 数据库表名
   * @param fields 需要查询的列名
   * @param z Tile Zoom Level
   * @param x Tile X
   * @param y Tile Y
   * @param compression 压缩，默认不压缩，如果压缩可以支持 gzip
   * @returns {Promise<Buffer>} pbf 流
   */
  static async queryTileAsPbf(tableName: string, fields: string[], z: number, x: number, y: number,
                              compression: "none" | "gzip" = "none"): Promise<Buffer> {
    // 查询 Polygon 并返回 GeoJSON 格式
    let result: QueryResult = await MapnikService.queryFeaturesAsGeoJson_(tableName, fields, z, x, y);

    // 转为 GeoJSON Feature Collection 的格式
    let featureCollection: GeoJsonFeatureCollection = MapnikService.queryResultToFeatureCollection_(result);

    // 使用 Mapnik 转 pbf
    return new Promise<Buffer>((resolve, reject) => {
      mapnik.register_datasource((path.join(mapnik.settings.paths.input_plugins, "geojson.input")));
      let vt: any = new mapnik.VectorTile(z, x, y);
      vt.addGeoJSON(JSON.stringify(featureCollection), MapnikService.mapboxVectorSourceLayerName, {});
      vt.toGeoJSONSync(0);
      vt.getData({
        compression: compression,
        level: 9,
        strategy: "FILTERED"
      }, (err: any, data: Buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   *
   * @param tableName
   * @param fields
   * @param z
   * @param x
   * @param y
   * @returns {Promise<QueryResult>}
   * @private
   */
  private static async queryFeaturesAsGeoJson_(tableName: string, fields: string[], z: number, x: number, y: number): Promise<QueryResult> {
    let vt: any = new mapnik.VectorTile(z, x, y);
    let extent: number[] = vt.extent();

    // TODO(lin.xiaoe.f@gmail.com): 暂时只支持墨卡托
    let firstProjection: string = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs";
    let secondProjection: string = MapnikService.proj4StringFromSpatialReference_(MapnikService.spatialReference_);

    let leftDown: any = proj4(firstProjection, secondProjection, [extent[0], extent[1]]);
    let rightUp: any = proj4(firstProjection, secondProjection, [extent[2], extent[3]]);
    let leftUp: any = proj4(firstProjection, secondProjection, [extent[0], extent[3]]);
    let rightDown: any = proj4(firstProjection, secondProjection, [extent[2], extent[1]]);

    // 闭合的 POLYGON
    const coordinates: number[] = [...leftDown, ...leftUp, ...rightUp, ...rightDown, ...leftDown];

    let polygon: string = `'POLYGON((${coordinates[0]} ${coordinates[1]}, 
                                                          ${coordinates[2]} ${coordinates[3]},  
                                                          ${coordinates[4]} ${coordinates[5]}, 
                                                          ${coordinates[6]} ${coordinates[7]},    
                                                          ${coordinates[8]} ${coordinates[9]}))'`;
    let where: string = `st_Contains(GeomFromText(${polygon}, ${MapnikService.spatialReference_}), ${MapnikService.shapeColumnName}) or st_overlaps(GeomFromText(${polygon}, ${MapnikService.spatialReference_}), ${MapnikService.shapeColumnName})`;
    const query: SelectQuery = new SelectQuery().fromTable(tableName).select([`ST_AsGeoJSON(${MapnikService.shapeColumnName}) AS geojson`, ...fields]).where(where);
    console.log(DBClient.getClient().queryToString(query));
    return await MapnikService.client_.query(query);
  }

  /**
   * 转为 Mapnik 需要的 GeoJSON Feature Collection 格式
   * @param result QueryResult
   * @returns {GeoJsonFeatureCollection} GeoJSON Feature Collection
   * @private
   */
  private static queryResultToFeatureCollection_(result: QueryResult): GeoJsonFeatureCollection {
    let features: Array<GeoJson> = [];

    for (let row of result.rows) {
      let geoJson: any = JSON.parse(row["geojson"]);
      delete row[`${MapnikService.shapeColumnName}`];
      delete row["geojson"];
      let columnGeoInfo: GeoJson = {
        "type": "Feature",
        "properties": row,
        "geometry": geoJson
      };
      features.push(columnGeoInfo);
    }

    return {
      "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
      "type": "FeatureCollection",
      "features": features
    };
  }

  /**
   * 根据坐标系给出 MySQL 创建 spa_ref_sys 表的 sql
   * @param spf 坐标系
   * @returns {string} 插入的 SQL
   * @private
   */
  private static spaRefSysReplaceSql_(spf: SpatialReference): string {
    if (spf === SpatialReference.WGS84) {
      return `REPLACE INTO spatial_ref_sys (SRID, AUTH_NAME, AUTH_SRID, SRTEXT) VALUES (${SpatialReference.WGS84}, null, null, 'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]');`;
    } else {
      throw new Error("Unknown spatial reference");
    }
  }

  /**
   * 转出坐标系的 string 表达式
   * @private
   */
  private static proj4StringFromSpatialReference_(spf: SpatialReference): string {
    if (spf === SpatialReference.WGS84) {
      return `+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs`;
    } else {
      throw new Error("Unknown spatial reference");
    }
  }
}
