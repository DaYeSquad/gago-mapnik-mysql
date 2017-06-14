// Copyright 2017 huteng (huteng@gagogroup.com). All rights reserved.,
// Use of this source code is governed a license that can be found in the LICENSE file.

import * as path from "path";
import * as proj4 from "proj4";

import {QueryResult} from "sakura-node-3";

import {MapboxImageRepository} from "./mapboximagerepository";

let mapnik = require("mapnik");

interface ColumnGeoInfo {
  type: string;
  properties: any;
  geometry: any;
}

interface GeoInfoCollection {
  type: string;
  crs: {type: string, properties: any};
  features: Array<ColumnGeoInfo>;
}

export class MapboxImageService {
  /**
   * calculate polygon by image z,x,y
   *
   * @private
   * @static
   * @param {number} x image x
   * @param {number} y image y
   * @param {number} z image zoom
   * @returns {number[]}
   *
   * @memberOf MapboxImageService
   */
  static calculatePolygonNumberArray(z: number, x: number, y: number): number[] {
    let vt: any = new mapnik.VectorTile(z, x, y);
    let extent: number[] = vt.extent();
    // let minX: number = extent[0];
    // let minY: number = extent[1];;
    // let maxX: number = extent[2];
    // let maxY: number = extent[3];

    let firstProjection: string = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs";
    let secondProjection: string = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

    let leftDown: any = proj4(firstProjection, secondProjection, [extent[0], extent[1]]);
    let rightUp: any = proj4(firstProjection, secondProjection, [extent[2], extent[3]]);
    let leftUp: any = proj4(firstProjection, secondProjection, [extent[0], extent[3]]);
    let rightDown: any = proj4(firstProjection, secondProjection, [extent[2], extent[1]]);

    return [...leftDown, ...leftUp, ...rightUp, ...rightDown, ...leftDown];
  }

  /**
   *
   *
   * @static
   * @param {number} x image x
   * @param {number} y image y
   * @param {number} z image zoom
   * @returns {Promise<Buffer>}
   *
   * @memberOf MapboxImageService
   */
  static async getMapboxImage(z: number, x: number, y: number): Promise<Buffer> {
    try {
      // Calculate coordinate of zone
      let polygonNumberArray: number[] = MapboxImageService.calculatePolygonNumberArray(z, x, y);

      // Get geography info from mysql
      let geoJsonInfoFromDB: any = await MapboxImageRepository.findGeoJsonInfo(polygonNumberArray, z);

      // Translate rows info to standard mapbox library handle format
      let geoFormatInfo: GeoInfoCollection = MapboxImageService.translateRowsToGeoFormat(geoJsonInfoFromDB);
    // let geo1 =
// {
//     "type": "FeatureCollection",
//     "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
//     "features": [
//         {
//             "type": "Feature",
//             "properties": {},
//             "geometry": {
//                 "type": "Polygon",
//                 "coordinates": [[[124.45312499999999, 49.83798245308486], [125.15625000000001, 49.83798245308486], [125.15625000000001, 49.38237278700958], [124.45312499999999, 49.38237278700958], [124.45312499999999, 49.83798245308486]]]
//             }
//         },
//         {
//             "type": "Feature",
//             "properties": {},
//             "geometry": {
//                 "type": "Polygon",
//                 "coordinates": [[[124.45312499999999, 49.83798245308486], [125.15625000000001, 49.38237278700958], [124.45312499999999, 49.38237278700958], [124.45312499999999, 49.83798245308486]]]
//             }
//         }
//     ]
// };
      console.log(geoFormatInfo["features"][0]["properties"]);
      console.log(JSON.stringify(geoFormatInfo["features"][0]["geometry"]));

      mapnik.register_datasource((path.join(mapnik.settings.paths.input_plugins, "geojson.input")));
      let vt1: any = new mapnik.VectorTile(z, x, y);
      vt1.addGeoJSON(JSON.stringify(geoFormatInfo), "demo", {});
      vt1.toGeoJSONSync(0);
      return vt1.getDataSync({
          level: 9,
          strategy: "FILTERED"
      });
    } catch (err) {
      throw err;
    }
  }

  static translateRowsToGeoFormat(geoJsonInfoFromDB: QueryResult): GeoInfoCollection {
    let featrues: Array<ColumnGeoInfo> = [];

    for (let row of geoJsonInfoFromDB["rows"]) {
      let geojson: any = JSON.parse(row["geojson"]);
      delete row["SHAPE"];
      delete row["geojson"];
      let columnGeoInfo: ColumnGeoInfo = {
        "type": "Feature",
        "properties": row,
        "geometry": geojson
      };
      featrues.push(columnGeoInfo);
    }

    let geoInfoCollection: GeoInfoCollection = {
      "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
      "type": "FeatureCollection",
      "features": featrues
    };

    return geoInfoCollection;
  }
}