# 全球家族办公室地图

这是一个由网页地图和抖音小程序壳组成的项目。

## 运行结构

```text
demo/
  index.html                    地球网页入口
  data/countries.js             国家边界数据
  data/family-office-locations.js  家族办公室城市数据
  vendor/globe.gl.min.js        globe.gl 依赖

全球家族办公室地图/
  app.json                      抖音小程序配置
  project.config.json           开发者工具项目配置
  pages/index/index.ttml        全屏 web-view 页面
  pages/index/index.js          web-view 地址配置
```

抖音小程序加载的网页地址是：

```text
https://komorgiaogiao.github.io/demo/map.html
```

`index.html` 是本地打开网页时的快捷入口。网页中的地球、按钮、搜索、图例和详情面板都由 `demo/index.html` 负责。
