// Copyright 2017 huteng (huteng@gagogroup.com). All rights reserved.,
// Use of this source code is governed a license that can be found in the LICENSE file.


import * as express from "express";
import * as os from "os";

/**
 * Error handler is middleware for handling errors.
 */
export function errorHandler(): (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => void {
  return (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(500).send(`Internal Server Error:\n${err.message}`);
    next();
  };
}
