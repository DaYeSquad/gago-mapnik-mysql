// Copyright 2017 Frank Lin (lin.xiaoe.f@gmail.com). All rights reserved.
// Use of this source code is governed a license that can be found in the LICENSE file.

import * as fs from "fs";
import {MvtCache} from "./mvtcache";
import {DBClient, QueryResult, SelectQuery} from "sakura-node-3";

/**
 * 数据库缓存 TODO: 没有实现 PG
 *
 * 要求新建一张表:
 * 第一个字段名为 "id"，类型是 VARCHAR_255，需要建立唯一索引；
 * 第二个字段名为 "mvt", 类型是 BLOB
 *
 * SQL:
 *  CREATE TABLE IF NOT EXISTS mvt_cache (id VARCHAR(255) NOT NULL PRIMARY KEY, mvt LONGTEXT);
 *  CREATE UNIQUE INDEX tile ON mvt_cache (id);
 */
export class DatabaseCache extends MvtCache {
  private client_: DBClient;
  private tableName_: string;

  constructor(dbClient: DBClient, tableName: string) {
    super();
    this.client_ = dbClient;
    this.tableName_ = tableName;
  }

  /**
   * @override
   */
  async fetch(z: number, x: number, y: number): Promise<Buffer | undefined> {
    const selectQuery: SelectQuery = new SelectQuery().from(this.tableName_).select().where([`id='${this.mvtKeyName_(z, x, y)}'`]);
    const result: QueryResult = await this.client_.query(selectQuery);
    if (result.rows.length === 0) {
      return undefined;
    } else {
      return new Buffer(result.rows[0]["mvt"], "base64");
    }
  }

  /**
   * @override
   */
  save(z: number, x: number, y: number, mvt: Buffer): void {
    const insertRawSql: string = `REPLACE INTO ${this.tableName_} VALUES ('${this.mvtKeyName_(z, x, y)}', '${mvt.toString("base64")}')`;
    this.client_.query(insertRawSql);
  }

  private mvtKeyName_(z: number, x: number, y: number): string {
    return `${z}-${x}-${y}`;
  }
}
