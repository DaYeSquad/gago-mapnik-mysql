// Copyright 2017 huteng (huteng@gagogroup.com). All rights reserved.,
// Use of this source code is governed a license that can be found in the LICENSE file.

/**
 * This file describes routes in beta version (aka "/api/beta").
 */

import * as express from "express";
import * as timeout from "connect-timeout";
import * as bodyParser from "body-parser";

import {corsAllowAll, haltOnTimedout, BadRequestResponse, ApiError, ErrorResponse} from "sakura-node-3";

import {errorHandler} from "../middleware/errorhandler";
import {MapboxImageController} from "../mapboximage/mapboximagecontroller";

const betaRouter: express.Router = express.Router();

// -------------------------------------------------------------------------
// Middleware (before request)
// -------------------------------------------------------------------------

betaRouter.use(timeout("30s"));
betaRouter.use(haltOnTimedout);
betaRouter.use(corsAllowAll());
betaRouter.use(haltOnTimedout);
betaRouter.use(bodyParser.json()); // for parsing application/json
betaRouter.use(haltOnTimedout);
betaRouter.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => { // invalid JSON
  if (error) {
    res.json(new BadRequestResponse([new ApiError("Invalid JSON", error.message)]));
  }
});
betaRouter.use(haltOnTimedout);
betaRouter.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
betaRouter.use(haltOnTimedout);

// -------------------------------------------------------------------------
// image-browser-awa beta api  (before request)
// -------------------------------------------------------------------------

betaRouter.get("/mapbox/pbf/:z/:x/:y",  MapboxImageController.getMapboxImage);

// -------------------------------------------------------------------------
// 404
// -------------------------------------------------------------------------

betaRouter.all("/*", (req: express.Request, res: express.Response) => {
  let errorResponse: ErrorResponse = new ErrorResponse("API_NOT_FOUND", 404);
  res.json(errorResponse);
});

// -------------------------------------------------------------------------
// Middleware (after request)
// -------------------------------------------------------------------------

betaRouter.use(errorHandler());

module.exports = betaRouter;