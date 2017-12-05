// Copyright 2017 Frank Lin (lin.xiaoe.f@gmail.com). All rights reserved.
// Use of this source code is governed a license that can be found in the LICENSE file.

import {BadRequestResponse, DBClient, DriverOptions, DriverType, Validator} from "sakura-node-3";
import * as express from "express";

import {MapnikService, SpatialReference} from "../index";

const driverOptions: DriverOptions = {
  type: DriverType.MYSQL,
  username: "root",
  password: "111111",
  database: "gagotest",
  host: "localhost",
  port: 3306
};

DBClient.createClient(driverOptions);

// 初始化 Mapnik for MySQL
MapnikService.init({
  client: DBClient.getClient(),
  spatialReference: SpatialReference.WGS84,
  mapboxVectorSourceLayerName: "zyra",
  shapeColumnAlias: "geom"
});

const tableName: string = "plot";
const mapnikQueryFields: string[] = ["id", "crop_type AS cropType", "measured_area AS measuredArea", "plot_type AS plotType",
  "identify_time AS identifyTime", "location", "inspection_type AS inspectionType",
  "harvests", "harvests_period AS harvestsPeriod","harvest_area AS harvestArea",
  "land_contract_number AS landContractNumber","noharvest"];

// const tableName: string = "land";
// const mapnikQueryFields: string[] = ["id,farm_id,crop_id,object_code,area,farmwork_id,emerge_rate,attribute, yield, yield_all"];

// 设置路由启动 server
const app: express.Application = express();
let router: express.Router = express.Router();
router.get("/land/:z/:x/:y", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // validation
  let validator: Validator = new Validator();
  const z: number = validator.toNumber(req.params["z"]);
  const x: number = validator.toNumber(req.params["x"]);
  const y: number = validator.toNumber(req.params["y"]);

  if (validator.hasErrors()) {
    next(new BadRequestResponse(validator.errors));
    return;
  }

  // logic
  try {
    const pbf: Buffer | undefined = await MapnikService.queryTileAsPbf(tableName, mapnikQueryFields, z, x, y);
    if (pbf) {
      res.contentType("application/x-protobuf");
      res.end(pbf);
    } else {
      res.status(404).json(undefined);
    }
  } catch (e) {
    res.status(500).json({
      error: {
        code: 500,
        message: "Internal Server Error"
      }
    });
  }
});
app.use(router);
app.listen(3000);
console.log("Server starts and listens on port 3000");
