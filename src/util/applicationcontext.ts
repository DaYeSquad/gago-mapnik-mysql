// Copyright 2017 huteng (huteng@gagogroup.com). All rights reserved.,
// Use of this source code is governed a license that can be found in the LICENSE file.

import * as path from "path";

/**
 *  local machine, development server on Microsoft Azure, production server on Aliyun and local mocha test.
 */
export enum NodeEnv {
  PRODUCTION_SERVER,
  TEST
}

/**
 * Application context for some metadata storage.
 */
export class ApplicationContext {
  private static instance_: ApplicationContext;
  private static nodeEnv_: NodeEnv;
  private configJson_: any;

  constructor() {
    this.configJson_ = require(ApplicationContext.projectConfigPath());
  }

  static getInstance(): ApplicationContext {
    if (!ApplicationContext.instance_) {
      ApplicationContext.instance_ = new ApplicationContext();
    }
    return ApplicationContext.instance_;
  }

  static setInstance(instance: ApplicationContext): void {
    ApplicationContext.instance_ = instance;
  }

  /**
   * Gets Node.js environment.
   * @returns {NodeEnv} Node.js environment.
   */
  static getNodeEnv(): NodeEnv {
    let nodeEnv: string = process.env["NODE_ENV"];

    if (ApplicationContext.nodeEnv_) {
      return ApplicationContext.nodeEnv_;
    }

    if (nodeEnv === "production") {
      ApplicationContext.nodeEnv_ = NodeEnv.PRODUCTION_SERVER;
    } else if (nodeEnv === "test") {
      ApplicationContext.nodeEnv_ = NodeEnv.TEST;
    } else {
      throw Error("Undefined NODE_ENV");
    }
    return ApplicationContext.nodeEnv_;
  }

  /**
   * Returns project config file path.
   * @returns {string} config path.
   */
  static projectConfigPath(nodeEnv?: NodeEnv): string {
    if (!nodeEnv) {
      nodeEnv = ApplicationContext.getNodeEnv();
    }
    return path.resolve(`${__dirname}/../../config/${ApplicationContext.configSubFolderName_(nodeEnv)}/project.config.json`);
  }

  /**
   * Returns base URL by env.
   */
  static baseUrl(): string {
    const baseConfigJson: any = require(ApplicationContext.projectConfigPath())["base"];
    return baseConfigJson["url"];
  }

  /**
   * 返回Mapbox GeoJson表名
   */
  static getMapboxGeoTableName(): string {
    const tableName: string = require(ApplicationContext.projectConfigPath())["mapbox"]["geoTableName"];
    return tableName;
  }

  private static configSubFolderName_(env?: NodeEnv): string {
    let nodeEnv: NodeEnv = env;
    if (nodeEnv === undefined) {
      nodeEnv = ApplicationContext.getNodeEnv();
    }

    switch (nodeEnv) {
      case NodeEnv.PRODUCTION_SERVER: return "azure";
      case NodeEnv.TEST: return "test";
    }
  }
}
