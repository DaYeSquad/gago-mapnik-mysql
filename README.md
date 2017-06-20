# OVERVIEW

gago-mapnik-mysql 是用来支持 Mapnik + MySQL 渲染 pbf 的方案

# USAGE

```typescript
MapnikService.init({client: client}); // 其中 client 为初始化过的 DBClient
const pbf: Buffer = await MapnikService.queryTileAsPbf("lands", ["owner", "displayName"], 3, 7, 5);
```