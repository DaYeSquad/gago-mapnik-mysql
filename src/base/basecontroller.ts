// Copyright 2017 huteng (huteng@gagogroup.com). All rights reserved.,
// Use of this source code is governed a license that can be found in the LICENSE file.

import * as express from "express";

/**
 * Someday we may migrate to koa or some other RESTful framework, so we give Request/Response a type alias.
 */
export type Request = express.Request;
export type Response = express.Response;
export type NextFunction = express.NextFunction;

/**
 * Nothing but a controller subclass should inherits.
 */
export class BaseController {}
