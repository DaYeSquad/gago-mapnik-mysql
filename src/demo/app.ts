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

// const mapnikQueryFields: string[] = ["id", "crop_type AS cropType", "measured_area AS measuredArea", "plot_type AS plotType",
//   "identify_time AS identifyTime", "location", "inspection_type AS inspectionType",
//   "harvests", "harvests_period AS harvestsPeriod","harvest_area AS harvestArea",
//   "land_contract_number AS landContractNumber","noharvest"];

const mapnikQueryFields: string[] = ["id,farm_id,crop_id,object_code,area,farmwork_id,emerge_rate,attribute, yield, yield_all"];

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
    const pbf: Buffer = await MapnikService.queryTileAsPbf("land", mapnikQueryFields, z, x, y);
    res.contentType("application/x-protobuf");
    res.end(pbf);
  } catch (e) {
    res.json(JSON.stringify(e));
  }
});
app.use(router);
app.listen(3000);
console.log("Server starts and listens on port 3000");
