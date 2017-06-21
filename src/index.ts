// Copyright 2017 huteng (huteng@gagogroup.com). All rights reserved.,
// Use of this source code is governed a license that can be found in the LICENSE file.

import * as path from "path";
import * as proj4 from "proj4";

import {DBClient, QueryResult, SelectQuery} from "sakura-node-3";

let mapnik = require("mapnik");


/**
 * 初始化参数
 */
export interface MapnikServiceOptions {
  client: DBClient // 用于查询的数据库
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
 *  MapnikService.init({client: client}); // 其中 client 为初始化过的 DBClient
 *  const pbf: Buffer = await MapnikService.queryTileAsPbf("lands", ["owner", "displayName"], 3, 7, 5);
 */
export class MapnikService {
  private static client_: DBClient;

  /**
   * 初始化 service
   * @param options 可选参数
   */
  static init(options: MapnikServiceOptions): void {
    MapnikService.client_ = options.client;
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
      vt.addGeoJSON(JSON.stringify(featureCollection), "demo", {});
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

    let firstProjection: string = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs";
    let secondProjection: string = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

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
    let where: string = `st_Contains(GeomFromText(${polygon}, 1), SHAPE) or st_overlaps(GeomFromText(${polygon}, 1), SHAPE)`;
    const query: SelectQuery = new SelectQuery().fromTable(tableName).select([`ST_AsGeoJSON(SHAPE) AS geojson`, ...fields]).where(where);
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
      delete row["SHAPE"];
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
}
