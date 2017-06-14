// Copyright 2017 huteng (huteng@gagogroup.com). All rights reserved.,
// Use of this source code is governed a license that can be found in the LICENSE file.

import {SelectQuery, MySqlQueryBuilder, DBClient, QueryResult} from "sakura-node-3";

import {BaseRepository} from "../base/baserepository";
import {ApplicationContext} from "../util/applicationcontext";

export class MapboxImageRepository extends BaseRepository {
  static async findGeoJsonInfo(polygonNumberArray: number[], zoom: number): Promise<QueryResult> {
    return new Promise<QueryResult>((resolve, reject) => {

      let queryBuilder: MySqlQueryBuilder = new MySqlQueryBuilder();

      let tableName: string = ApplicationContext.getMapboxGeoTableName();

      let where: string = `Contains(GeomFromText('POLYGON((${polygonNumberArray[0]} ${polygonNumberArray[1]}, 
                                                          ${polygonNumberArray[2]} ${polygonNumberArray[3]},  
                                                          ${polygonNumberArray[4]} ${polygonNumberArray[5]}, 
                                                          ${polygonNumberArray[6]} ${polygonNumberArray[7]},    
                                                          ${polygonNumberArray[8]} ${polygonNumberArray[9]}))'
                                                          , 1), SHAPE)`;
      const tolerance: number = Math.pow(2, zoom) / (2 * Math.PI * 6378137 / 256) / 20;
      console.log(tolerance);
      const query: SelectQuery = new SelectQuery().fromTable(tableName).select(["area", `ST_AsGeoJSON(ST_SIMPLIFY(SHAPE, ${tolerance})) AS geojson`]).where(where);
      const sql: string = queryBuilder.buildSelectQuery(query);
      console.log(sql);
      DBClient.getClient().query(sql).then((result: QueryResult) => {
        if (result.rows && result.rows.length > 0 ) {
          resolve(result);
        } else {
          reject(new Error("NO_DATA"));
        }
      });
    });
  }
}