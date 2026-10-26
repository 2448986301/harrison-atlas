# Harrison Atlas

一个可静态部署的虚构国家 Wiki 与原图交互地图。React + Vite + TypeScript + Tailwind CSS 4 + Motion + Leaflet CRS.Simple，无服务器、远程数据库、地图 API 或付费域名依赖。

## 启动

需要 Node.js 22（建议 22.12 或更高）和 pnpm 11.25.0。

```sh
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

打开终端显示的本地地址。检查与生产预览：

```sh
pnpm test
pnpm build
pnpm preview
```

`dist/` 是可直接部署的静态网站。请通过 HTTP 服务打开，不能双击 `index.html` 使用 `file://` 协议。

## 页面与交互

- 地图集：按编号切换五张原图，完整图像预览、首都数据与百科索引。
- 探索地图：五种独立图像视角；拖动、双击及按钮缩放、适应画面、全屏、参考网格、图像下载。滚轮保留给页面滚动；地图也支持键盘方向键与加减键。
- 百科：首都、睿明道、涵宇道、国旗；搜索后打开词条；原生对话框支持 Escape、焦点约束和关闭后焦点恢复。
- 原始档案：分辨率、SHA-256、原图下载。本地替换预览使用 IndexedDB，不上传、不改变随站保存的原始文件。AI 图像必须选择“AI 美术重绘”，会显示非事实标识，可恢复内置原图。
- 手机、桌面布局；遵循减少动态效果与减少透明度设置。

## GitHub Pages 部署

1. 在 GitHub 建立免费的 **Public** 仓库，例如 `harrison-atlas`。发布时这些原图也会随网页可公开访问。
2. 将本文件夹的内容作为仓库根目录，包含隐藏的 `.github/` 文件夹与 `pnpm-lock.yaml`，不要上传 `node_modules/`。
3. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
4. 推送 `main` 分支；内置工作流自动安装、验证原图、构建、部署。也可在 Actions 手动运行。
5. 部署完成后访问 Actions 输出的网址，通常为 `https://你的用户名.github.io/harrison-atlas/`。

Vite 使用 `base: './'`，资源相对路径与 `import.meta.env.BASE_URL` 可适配项目子目录和用户主页。页面使用 hash 路由，例如 `/#wiki`，刷新无需服务端回退规则。无需购买域名。

本次交付未建立 GitHub 仓库，也未实际上线；配置已随代码交付。

## 事实边界

详见 [EVIDENCE.md](EVIDENCE.md)。五张原始地图与新增国旗 JPEG 均与用户附件逐字节一致，保留手写、打码和模糊文字；运行时校验哈希，测试固定附件原始哈希。

- 睿明道、涵宇道：用户明确确认名称；未将其对应到无标签的区划图形。
- 首都人口 **8,942,013**、海拔 **5 米**、面积 **4,712 平方公里**：第五张原始截图清晰可见。
- “金陵城”：道路图存在手写标注，但遵照用户要求仍标为待确认，不作正式标题。
- 未命名、模糊、打码的城市、车站与行政区不转写、不补名，不做 OCR 猜测。
- 五张图分别使用自己的像素空间；没有假设卫星、区划、道路、地铁已经配准，没有编造经纬度、比例尺、站点坐标或可点击的行政边界。
- 国旗：用户提供并明确确认，原图位于 `public/symbols/flag.jpg`；图像尺寸不等于已确认的官方旗帜比例，不推断象征含义。
- 本版本未使用 AI 重绘素材。美术图像不能用于生成事实标签、边界或线路。

## 维护资料

`public/originals/manifest.json` 记录来源、尺寸与哈希；`src/data.ts` 保存经确认的百科内容。添加资料应保留原文件，独立记录证据和不确定性，并同步测试中的哈希基线。不要用清晰化或生成图片覆盖原图。

本地替换仅影响当前浏览器，不能作为站点内容发布；要永久更新站点，请明确核实资料后修改项目文件并重新部署。

## 项目结构

```text
src/main.tsx             页面、搜索、词条与档案
src/MapView.tsx          延迟加载的 Leaflet 图像查看器
src/data.ts              已确认内容与地图视角
src/storage.ts           本机图像存储与哈希
src/styles.css           Tailwind 入口、界面与响应式样式
public/originals/        五张未修改的地图原图与清单
public/symbols/          国旗原图与来源清单
tests/originals.test.mjs 原始附件完整性测试
.github/workflows/      GitHub Pages 自动部署
```

参考官方资料：[Vite 静态部署](https://vite.dev/guide/static-deploy)、[Leaflet CRS.Simple](https://leafletjs.com/examples/crs-simple/crs-simple.html)。

## 已知限制

卫星原图约 21 MB，首次加载地图需要下载完整图像；当前保留原始分辨率，尚未制作地图瓦片。图像查看器支持缩放与拖动，没有可检索的站点拓扑、路线规划或可点击的区划多边形，这些功能需要先取得可确认的文字和坐标资料。
