# OVERVIEW

gago-mapnik-mysql 是用来支持 Mapnik + MySQL 渲染 pbf 的方案


# USAGE

```TypeScript
MapnikService.init({
client: client, // 其中 client 为初始化过的 DBClient，可以通过 DBClient.createClient 返回 (依赖 sakura-node-ts)
spatialReference: SpatialReference.WGS84,  // 暂时只支持 WGS84
mapboxVectorSourceLayerName: "street", // 需要和前端校对的名字，详情见注释
shapeColumnAlias: "geom"}); // 如果 geometry 列名要更改则需要修改此处
const pbf: Buffer = await MapnikService.queryTileAsPbf("lands", ["owner", "displayName"], 3, 7, 5);
```

# 缓存

该库支持磁盘缓存(DiskCache)、数据库缓存(DatabaseCache)两种，使用方法见 `src/cache/diskcache.ts` 和 `src/cache/databasecache`。
特别要注意用 DatabaseCache 时需先按以下 SQL 构建表:

```SQL
CREATE TABLE IF NOT EXISTS mvt_cache (id VARCHAR(255) NOT NULL PRIMARY KEY, mvt TEXT);
CREATE UNIQUE INDEX tile ON mvt_cache (id);
```


# 将 GeoJSON 导入 MySQL

1.首先安装[conda](https://conda.io/miniconda.html)

2.安装 `gdal` - 运行 `conda install gdal`

3.将 GeoJSON 转为 CSV，其中 Geometry 使用 WKT 格式 - 运行 `ogr2ogr -f "CSV" -lco GEOMETRY=AS_WKT -overwrite {输出的 csv 文件路径} {输入的 geojson 文件路径}`

4.按照需求建临时表(因为最终要的是 geometry 类型，目前是 TEXT，内容是 WKT)

5.导入 csv - `LOAD DATA LOCAL INFILE '/Users/FrankLin/Downloads/2_min.csv' INTO TABLE test_lands_1 FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n' (land_id,WKT)`

6.将该表的 WKT 列转为 SHAPE 列，类型为 Geometry (正在编写转换器)

7.为 SHAPE 列构建索引 - `CREATE SPATIAL INDEX g ON table (SHAPE);`


# 运行环境

由于底层 gcc 的限制，目前测试过的环境为 Ubuntu，如果需要在其他环境上编译可能需要自己 build gcc，可以参考[此处](https://github.com/DaYeSquad/gago-mapnik-mysql/blob/master/rhel7.2%E7%BC%96%E8%AF%91%E5%AE%89%E8%A3%85GCC5.3.md)。
