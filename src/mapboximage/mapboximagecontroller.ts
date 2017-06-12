// Copyright 2017 huteng (huteng@gagogroup.com). All rights reserved.,
// Use of this source code is governed a license that can be found in the LICENSE file.

import {Validator, BadRequestResponse, SuccessResponse, ErrorResponse, DateUtil} from "sakura-node";

import {BaseController, Request, Response, NextFunction} from "../base/basecontroller";

import {MapboxImageService} from "./mapboximageservice";

export class MapboxImageController extends BaseController {
  static async getMapboxImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let validator: Validator = new Validator();

      const x: number = validator.toNumber(req.params["x"], "invalid x");
      const y: number = validator.toNumber(req.params["y"], "invalid y");
      const z: number = validator.toNumber(req.params["z"], "invalid zoom");

      if (validator.hasErrors()) {
        res.json(new BadRequestResponse(validator.errors));
        return;
      }

      let imageData: Buffer = await MapboxImageService.getMapboxImage(x, y, z);
          console.log(imageData);
      res.send(imageData);

    } catch (err) {
      next(err);
    }
  }
}