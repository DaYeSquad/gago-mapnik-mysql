// Copyright 2017 huteng (huteng@gagogroup.com). All rights reserved.,
// Use of this source code is governed a license that can be found in the LICENSE file.

import * as express from "express";
import {DBClient, DriverOptions, DriverType} from "sakura-node-3";
import {ApplicationContext} from "./util/applicationcontext";

let projectConfigPath: string = ``;
let mysqlConfig:  any = require(ApplicationContext.projectConfigPath())["mysql"];

const driverOptions: DriverOptions = {type: DriverType.MYSQL,
                                      username: mysqlConfig["username"],
                                      password: mysqlConfig["password"],
                                      database: mysqlConfig["database"],
                                      host: mysqlConfig["host"],
                                      port: mysqlConfig["port"]
                                      };
const mysqlClientInstance: DBClient = DBClient.createClient(driverOptions);

const app: express.Application = express();

let betaRouter: express.Router = require("./routes/beta");

// beta route
app.use("/api/beta", betaRouter);

// show project api docs

app.listen(3000);

