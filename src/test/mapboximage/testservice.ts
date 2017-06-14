// Copyright 2017 huteng (huteng@gagogroup.com). All rights reserved.,
// Use of this source code is governed a license that can be found in the LICENSE file.

import * as chai from "chai";

import {MapboxImageService} from "../../mapboximage/mapboximageservice";
import {MapboxImageRepository} from "../../mapboximage/mapboximagerepository";

interface GeoInfoCollection {
  type: string;
  crs: {type: string, properties: any};
  features: Array<ColumnGeoInfo>;
}

interface ColumnGeoInfo {
  type: string;
  properties: any;
  geometry: any;
}

describe("ImageComposeService", () => {
  describe("test calculate polygon number array with z,x,y", () => {
    it("test calculate polygon number array with z,x,y", (done: MochaDone) => {
      let polygonNumberArray: number [] = MapboxImageService.calculatePolygonNumberArray(9, 432, 175);
      console.log(polygonNumberArray);
      chai.expect(polygonNumberArray[0]).to.closeTo(123.750000, 0.01);
      chai.expect(polygonNumberArray[1]).to.closeTo(48.9224992, 0.01);
      done();
    });
  });

  describe("test translate Rows To GeoFormat", () => {
    it("test translate Rows To GeoFormat", function(done: MochaDone) {
                    this.timeout(100000);
      let array: number[] =
                         [123.75000000000001,
                          48.922499263758255,
                          123.75000000000001,
                          49.38237278700955,
                          124.45312500000001,
                          49.38237278700955,
                          124.45312500000001,
                          48.922499263758255,
                          123.75000000000001,
                          48.922499263758255 ];
      let startTime = new Date().getTime();
      let endTime ;
      MapboxImageRepository.findGeoJsonInfo(array, 9).then((results: any) => {
        endTime = new Date().getTime();
        console.log((endTime - startTime) / 1000);
        let geoFormatInfo: GeoInfoCollection = MapboxImageService.translateRowsToGeoFormat(results);
        let geoProperties = geoFormatInfo["features"][0]["properties"];
        let coordinates = geoFormatInfo["features"][0]["geometry"]["coordinates"];
        let key: string[] = Object.keys(geoProperties);
        chai.expect(key.length).to.be.above(0);
        chai.expect(coordinates.length).to.be.above(0);
        done();
      });
    });
  });
});
