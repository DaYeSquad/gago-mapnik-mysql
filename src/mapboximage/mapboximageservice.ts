// Copyright 2017 huteng (huteng@gagogroup.com). All rights reserved.,
// Use of this source code is governed a license that can be found in the LICENSE file.

import * as path from "path";

let mapnik = require('mapnik');

export class MapboxImageService {

  static async getMapboxImage(x: number, y: number, z: number): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      let path = require("path");
      let geo1 = 
{
    "type": "FeatureCollection",
    "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
    "features": [
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[124.52086, 49.65901], [124.52085, 49.65902], [124.52084, 49.65904], [124.5208, 49.65909], [124.52076, 49.65915], [124.52072, 49.65923], [124.52073, 49.65927], [124.52072, 49.65932], [124.52071, 49.65936], [124.5207, 49.65938], [124.52066, 49.65947], [124.52067, 49.65955], [124.52068, 49.65956], [124.52067, 49.65963], [124.52067, 49.65964], [124.52089, 49.65948], [124.52098, 49.6593], [124.52086, 49.65901]]]
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[124.50009, 49.65396], [124.50008, 49.65396], [124.49998, 49.65403], [124.49989, 49.65411], [124.49979, 49.65416], [124.49999, 49.65418], [124.50009, 49.65396]]]
            }
        }
    ]
};

      mapnik.register_datasource((path.join(mapnik.settings.paths.input_plugins, 'geojson.input')));
      var vt1 = new mapnik.VectorTile(9, 433, 174);

      vt1.addGeoJSON(JSON.stringify(geo1), "demo", {});

      vt1.getData({
          level: 9,
          strategy: 'FILTERED'
      }, (err: Error, data: Buffer) => {
          if (err) throw err;
          resolve(data);
      });
    });
  }
}