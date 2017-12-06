// Copyright 2017 Frank Lin (lin.xiaoe.f@gmail.com). All rights reserved.
// Use of this source code is governed a license that can be found in the LICENSE file.

import * as fs from "fs";

import {MvtCache} from "./mvtcache";

/**
 * 磁盘缓存
 */
export class DiskCache extends MvtCache {
  private cacheDirPath_: string = "/tmp";

  constructor(cacheDirPath: string) {
    super();

    this.cacheDirPath_ = cacheDirPath;

    if (!fs.existsSync(cacheDirPath)) {
      fs.mkdirSync(cacheDirPath);
    }
  }

  /**
   * @override
   */
  async fetch(z: number, x: number, y: number): Promise<Buffer | undefined> {
    return new Promise<Buffer>((resolve, reject) => {
      const fileName: string = this.mvtFileName_(z, x, y);

      fs.exists(fileName, (exists: boolean) => {
        if (exists) {
          fs.readFile(fileName, (err: NodeJS.ErrnoException, data: Buffer) => {
            if (err) reject(err);
            resolve(data);
          });
        } else {
          resolve(undefined);
        }
      });
    });
  }

  /**
   * @override
   */
  save(z: number, x: number, y: number, mvt: Buffer): void {
    fs.writeFile(this.mvtFileName_(z, x, y), mvt); // ignore callback
  }

  private mvtFileName_(z: number, x: number, y: number): string {
    return `${this.cacheDirPath_}/${z}-${x}-${y}.mvt`;
  }
}
