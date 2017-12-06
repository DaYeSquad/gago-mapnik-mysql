// Copyright 2017 Frank Lin (lin.xiaoe.f@gmail.com). All rights reserved.
// Use of this source code is governed a license that can be found in the LICENSE file.

/**
 * Cache 的策略，所有的缓存都会实现该类定义的方法
 */
export abstract class MvtCache {

  // ---------- For subclass eyes only ----------

  abstract fetch(z: number, x: number, y: number): Promise<Buffer | undefined>;

  abstract save(z: number, x: number, y: number, mvt: Buffer): void;
}
