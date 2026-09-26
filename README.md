# 全球家族办公室地图

这是一个由网页地图和抖音小程序 `web-view` 壳组成的项目。网页负责地图、搜索、筛选、家办选择和知识库阅读；小程序只负责承载网页。

## 文件树

```text
.
├── index.html                         本地网页快捷入口，跳转到 demo/index.html
├── 9oAv5fPVTF.txt                     GitHub Pages 域名校验文件，请保留在根目录
├── demo/                              网页地图应用
│   ├── index.html                     页面结构、样式和地图交互逻辑
│   ├── knowledge-reader.js             多组件知识库阅读器
│   ├── data/
│   │   ├── countries.js                国家和行政区边界数据
│   │   ├── family-office-locations.js  282 个城市的家办聚合数据
│   │   └── knowledge/
│   │       ├── index.js                文章索引和元数据
│   │       └── articles/               687 篇独立家办文章
│   │           └── 42-north.js         42 North 精编文章
│   └── vendor/
│       └── globe.gl.min.js             Globe.gl 本地依赖
├── 全球家族办公室地图/                 抖音小程序项目
│   ├── app.js                          小程序应用入口
│   ├── app.json                        页面和导航配置
│   ├── project.config.json             开发者工具配置
│   └── pages/index/                    全屏 web-view 页面
└── output/                             本地截图等生成物，不参与应用运行
```

`.playwright-cli/`、`output/playwright/`、系统文件和环境文件均属于本地生成物，已在 `.gitignore` 中忽略。

## 运行方式

直接打开根目录的 `index.html`，或通过静态服务器打开 `demo/index.html`。

抖音小程序加载的网页地址是：

```text
https://komorgiaogiao.github.io/foc_microapp/demo/index.html
```

小程序壳位于 `全球家族办公室地图/`，其中 `pages/index/index.js` 只配置这个网页地址。

## 数据维护

- 城市和家办聚合数据维护在 `demo/data/family-office-locations.js`。
- 文章元数据维护在 `demo/data/knowledge/index.js`。
- 每篇文章正文维护为 `demo/data/knowledge/articles/<slug>.js`，阅读器按需加载。
- 地图和阅读器代码目前集中在 `demo/index.html` 与 `demo/knowledge-reader.js`，数据文件与界面文件已经分开。
