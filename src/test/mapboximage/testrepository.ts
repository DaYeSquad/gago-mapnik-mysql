// // Copyright 2017 huteng (huteng@gagogroup.com). All rights reserved.,
// // Use of this source code is governed a license that can be found in the LICENSE file.

// import * as chai from "chai";
// import {MapboxImageRepository} from "../../mapboximage/mapboximagerepository";

// describe("MapboxImageRepository", () => {
//   describe("Mapbox GeoJson serach", () => {
//     it("find one zone all GeoJson info", function(done: MochaDone) {
//       this.timeout(100000);
//       let array: number[] = [ 124.365234375,
//                               49.32512199104003,
//                               124.365234375,
//                               49.38237278700955,
//                               124.45312500000001,
//                               49.38237278700955,
//                               56.865234375000036,
//                               76.9999351181161,
//                               124.365234375,
//                               49.32512199104003 ];
//       let startTime = new Date().getTime();
//       let endTime ;
//       MapboxImageRepository.findGeoJsonInfo(array, 12).then((results: any) => {
//         endTime = new Date().getTime();
//         console.log((endTime - startTime) / 1000);
//         chai.expect(results["rows"].length).to.above(0);
//         done();
//       });
//     });
//   });
// });
