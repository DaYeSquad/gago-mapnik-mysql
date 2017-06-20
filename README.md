# OVERVIEW

gago-mapnik-mysql 是用来支持 Mapnik + MySQL 渲染 pbf 的方案


# USAGE

```
MapnikService.init({client: client}); // 其中 client 为初始化过的 DBClient
const pbf: Buffer = await MapnikService.queryTileAsPbf("lands", ["owner", "displayName"], 3, 7, 5);
```

# 将 GeoJSON 导入 MySQL

1.首先安装[conda](https://conda.io/miniconda.html)

2.安装 `gdal` - 运行 `conda install gdal`

3.将 GeoJSON 转为 CSV，其中 Geometry 使用 WKT 格式 - 运行 `ogr2ogr -f "CSV" -lco GEOMETRY=AS_WKT -overwrite {输出的 csv 文件路径} {输入的 geojson 文件路径}`

4.按照需求建临时表(因为最终要的是 geometry 类型，目前是 TEXT，内容是 WKT)

5.导入 csv - `LOAD DATA LOCAL INFILE '/Users/FrankLin/Downloads/2_min.csv' INTO TABLE test_lands_1 FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n' (land_id,WKT)`

6.将该表的 WKT 列转为 SHAPE 列，类型为 Geometry (正在编写转换器)
