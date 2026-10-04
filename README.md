# SVG 徽章生成器

**[在线使用 / Open the app](https://yinbaozong.github.io/badge-generator/)** · **[提交问题 / Report an issue](https://github.com/yinbaozong/badge-generator/issues)**

Open-source, browser-based badge generator by [yinbaozong](https://github.com/yinbaozong). Upload SVG artwork, or try PNG / JPG tracing, to export printable STL, colored 3MF and SCAD. All image and model processing stays in your browser. English and Chinese interfaces are available. MIT licensed: keep the copyright and license notice, and credit this project when sharing or republishing.

上传 SVG，在浏览器里生成徽章并下载 STL、带颜色的标准 3MF 或 SCAD。源码采用 MIT 许可证，可以公开、修改及自行部署。当前版本为 0.1.0。

## 本地打开

Windows 双击“启动网页.cmd”，保持命令窗口开启，然后打开 http://127.0.0.1:4173 。

首次下载源码需要先安装 Node.js 22.12+（推荐 24），在本目录执行：

    npm ci
    npm run build

交付目录已经包含构建好的 dist。启动脚本只使用 Node.js 提供本地静态文件，不上传 SVG。不要直接双击 dist/index.html；浏览器模块和 WASM 需要通过 HTTP 或 HTTPS 加载。

## 使用

1. 点击独立的“上传 SVG”按钮或拖入 SVG，选择单色或多色；PNG / JPG 使用下方实验上传入口。
2. 在“尺寸”标签中设置外形、尺寸、留边和图案厚度；“磁铁”标签中设置可选凹槽。
3. 下载彩色 3MF 后用 Bambu Studio 打开，并为部件选择实际耗材；STL 只含几何，不含颜色。
4. 若需要 MakerWorld 代码流程，导出 SCAD 后将代码粘贴到参数化编辑器。

标题旁的 EN / 中文开关可切换语言，首次打开默认英文；语言选择保存在本机，切换语言不会重建或改变模型。参数、按钮、状态、错误及提示均提供英文。英文模式的 3MF 部件名也使用英文。

配置模板支持导入／导出 JSON，保存尺寸、外形、颜色模式和磁铁设置，不包含图案文件。新版模板（v2）保存磁铁选点，位置相对于底壳包围盒记录，调整尺寸时随底壳缩放；兼容旧版 v1 的中心槽模板。不同图案的可用区域不同，导入后仍会检查槽位。语言偏好与图案文件不会被模板覆盖。

桌面界面使用固定工作区：左侧“图案／尺寸／磁铁”标签和独立滚动的设置，右侧保持模型、顶部导出按钮及尺寸统计可见。错误位于预览上方，数值范围和错误也显示在对应字段下方；移动端错误固定在页面顶部。无效设置保留上次有效预览，并禁用模型导出，避免下载旧参数的模型。

磁铁槽支持 1–8 个自定义位置。开启后输入直径（2–30 mm）与厚度（0.5–10 mm），点击“在背面选点”，在背面俯视图的底壳上点击放置，完成后点击“完成选点”生成实际凹槽。选点时暂时使用没有凹槽的底壳，编号和圆形标记仅供定位；每个位置都可以删除，也可清空或恢复中心位置。槽自动增加直径 0.3 mm 和深度 0.1 mm 安装余量，侧壁及槽之间至少保留 0.5 mm。越界或距离过近时，错误会注明槽编号；分离的底壳可分别选点。选点需要支持 WebGL 的浏览器。

尺寸分为宽度 X、长度 Y、底壳厚度 Z 和 Logo 厚度 Z。Logo 外形模式只调整最终底壳宽度 X，图案按原始 XY 比例等比缩放，长度 Y 自动计算；底壳沿真实外轮廓留边，不使用凸包，使用圆形留边及最多 0.35 mm 的局部平滑来减少尖角。底壳内部孔洞补实以支撑图案，图案自身的孔洞保留。分离轮廓可能仍形成多个底座区域，界面会提示增大留边或改用矩形。

默认外形为圆角矩形，圆角为 3 mm，可自行调整或设为 0。正六边形按六个等长边构造，Y 自动计算，不能分别拉伸；圆角对六个顶点一致生效，并补偿最终宽度，右下角显示圆角后的实际包围盒。调整 XY 不改变 Z 厚度；磁铁槽需要更厚底壳时仍会保留安全顶层并明确提示。右下角显示实际 X/Y/Z 总尺寸，以及底壳与 Logo 各自厚度；多色 Logo 显示最小至最大厚度，包含 0.2 mm 色区台阶。

底壳厚度允许 1.5–20 mm，Logo 基础厚度允许 0.2–20 mm，两个厚度独立调节。磁铁较厚时底壳可能自动加厚，以保留顶部安全层。

单色模式：白底、黑色图案；独立的白色路径（例如 AWS 的白色文字）会转为黑色凸起，全白图案也会转为黑色。与原始彩色路径有面积重叠的白色区域作为留白。SVG 不携带“背景／前景”语义，这一规则不能自动判断所有设计；白色文字压在彩色背景上的图案，请使用多色模式或先去除背景。

PNG / JPG 上传为实验功能，独立于 SVG 上传入口。图片在本地解码，透明度低于 50% 的像素略去；对不透明图片，从相近的角落颜色推断纯色背景，并清除文字孔洞中同色背景。自动去背景可关闭；浅色设计可能被误删，出现这种情况请关闭该选项。

先裁掉背景空白，再按最长边最多 1024 像素采样，用稳定的内部像素提取最多 6 个主色；过滤小碎片，清理靠近透明边缘的少量白色混色，对均匀像素边界先平滑再简化。各色块共用整体轮廓并填补轮廓拟合带来的色区缝隙，减少白色底座在色块侧面形成的碎片。处理仍属于近似矢量化，不能恢复低清晰度图片已经丢失的细节；细线、浅色细节和锐角可能改变，建议优先上传清晰 SVG。文件上限 15 MB、解码后上限 4000 万像素。所有处理均在访问者浏览器中完成，不上传图片、不使用 AI 服务。复杂照片不提供主体智能分割。模板不包含图片或抠图选项。

如果位图效果不理想，可自行打开 [PNG to SVG](https://pngtosvg.com/) 转换成 SVG，再使用本工具的 SVG 上传入口。该链接为外部工具，本工具不会自动向它传送文件，也不与该网站共享模型数据。

三维预览保留平面与侧壁的锐利交界，只平滑曲面侧壁的光照，避免平顶出现三角面明暗。点击预览区“背面”或磁铁设置下方“查看背面磁铁槽”，可查看倾斜背面；地面和网格在背面视角自动隐藏。凹槽以真实锐边勾勒，设置下方显示实际直径、深度及数量。预览法线和边线不写入导出模型。

多色模式：保留可见的实色色区及遮挡关系，色区依次增加 0.2 毫米高度，方便单色 STL 上色。相同颜色归为同一部件。不同部件共用位置，底座为图案预留浅槽，避免不同材料占用重叠体积。STL 使用合并后的整体网格。

SCAD 是已生成模型的快照，包含明确颜色和网格，不依赖 MakerWorld 读取 SVG 填色；它不是能重新上传任意 SVG 的参数化生成器。尺寸及图案设置在网页调整后重新导出。SCAD 中的整体缩放也会改变磁铁槽尺寸。

## 支持范围

- 实色填充的路径、矩形、圆形、椭圆、多边形及常见曲线；路径孔洞、evenodd/nonzero 填充规则、普通分组变换。
- 常见颜色写法和内联填色；普通 SVG 类/ID 填色样式由 SVGLoader 解析。复杂 CSS 选择器、动态样式和布局不保证与浏览器显示一致；建议导出明确填色的普通 SVG。
- 线性或径向渐变转换为每个路径的一种代表实色，不能打印连续渐变。半透明按不透明实色处理，完全透明填色忽略。
- 文字、描边、克隆/符号需先转为填色路径。暂不支持位图、剪切蒙版、蒙版、滤镜、图案填充及动画。
- 自动按图案实际轮廓包围盒居中，不依赖 SVG 画布空白。
- 输入上限 5 MB、20 万离散点、16 个可见图案颜色；复杂图案可能需要简化。

3MF 使用标准颜色组、命名部件及单个组件装配，提供颜色信息，不含打印机配置、耗材品牌或 AMS 槽位映射。切片软件如何解释颜色和部件取决于其版本，实际导入行为需要你确认。

## 静态部署：无需购买服务器或域名

这个工具是静态网页，但有计算：SVG 解析在访问者浏览器中执行，三维布尔运算由 Web Worker 内的 Manifold WebAssembly 执行，模型导出也在浏览器完成。托管服务只提供 HTML、CSS、JS、WASM 等文件，不负责生成模型，不需要后端、数据库、AI API 或服务器计算任务。

开发环境执行 npm run dev。发布前执行 npm run build，将 dist 中的全部内容部署，包含 assets 中的 WASM 文件及 licenses 文件夹。依赖已经随构建打包，不使用外部 CDN。相对资源路径支持放在网站子目录。

### Cloudflare Workers 静态托管：官方推荐的新项目路径

Cloudflare 目前推荐新项目使用 Workers，也能只托管静态文件，本项目无需编写服务器 Worker。已附 wrangler.json，完成本地构建后可执行 npx wrangler deploy；登录自己的 Cloudflare 账户并确认后发布。该命令会真正发布，交付时没有替你执行。若设置 Git 自动构建，构建命令为 npm run build，部署命令为 npx wrangler deploy。官方说明：https://developers.cloudflare.com/workers/static-assets/get-started/ 。

### Cloudflare Pages：直接上传也可用

1. 登录 Cloudflare，进入 Workers & Pages，创建 Pages 项目，选择直接上传静态文件。
2. 将 dist 整个文件夹拖入上传区域，然后部署；不需要压缩包。
3. 使用平台提供的“项目名.pages.dev”网址，之后也可以绑定自己的域名。

直接上传项目后续不能直接改为 Git 自动部署模式；如果计划持续维护，推荐一开始就选择连接 GitHub 仓库的新 Pages 项目。

### GitHub 开源 + Cloudflare Pages：适合长期维护

将本目录源码上传到自己的 GitHub 仓库，保留 package-lock.json、LICENSE 和第三方声明，排除 node_modules。Cloudflare Pages 连接这个仓库，构建命令设置为 npm run build，输出目录设置为 dist，Node 版本使用 24。若本项目在仓库子目录，需要相应设置构建根目录。之后推送源码可自动重新构建和发布。

### GitHub Pages：源码和网页在同一平台

源码目录附带 .github/workflows/pages.yml。将本目录作为仓库根目录，默认分支使用 main，进入仓库 Settings → Pages，将 Source 设为 GitHub Actions。推送 main 后工作流构建 dist 并部署网页。也可手动运行工作流。

网址通常为 https://你的用户名.github.io/仓库名/。本项目使用相对资源路径，支持这个子目录结构。

部署说明依据：
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/get-started/git-integration/
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## 源码结构

- src/svg.js：SVG 校验、颜色解析、路径离散与归一化。
- src/raster.js：实验性 PNG / JPG 背景去除、分色及轮廓转换。
- src/model.js：色区遮挡、居中、底座、磁铁槽和三维布尔运算。
- src/worker.js：后台计算，避免阻塞交互。
- src/viewer.js：Three.js 三维预览。
- src/workspace.css：固定预览、分组设置及移动端布局。
- src/exporters.js：二进制 STL 和标准彩色 3MF。
- src/scad.js：带明确颜色的 SCAD 网格快照。
- dist：可以直接部署的构建文件。
- public/licenses、THIRD_PARTY_NOTICES.md：分发所需第三方许可证。

## 验证状态

已进行源码审阅并完成静态构建。遵照需求，没有运行浏览器、生成测试模型或验证 Bambu Studio 导入，不应将本版本视为已经完成打印验证。请先确认上传、预览、颜色、尺寸及导出，再发布给其他使用者。

MakerWorld 的现有证据是：用户上传的两个明确实色色块在 SVG 缩略图有颜色，最小直接导入/拉伸后的三维预览变成白色；代码明确指定颜色的参考方块能显示颜色。只能据此定位到 SVG 导入/拉伸/显示链路，尚不能断言是网站缺陷、未支持的功能，或确认导出的 3MF 也丢色。工单正文在上级目录。

## 许可证

作者：[yinbaozong](https://github.com/yinbaozong)。项目出处：https://github.com/yinbaozong/badge-generator 。转载、分享或二次发布时请注明作者和项目地址，并保留 MIT 版权及许可证声明。

本项目代码及原创示例为 MIT；Manifold 为 Apache-2.0，Three.js 与 fflate 为 MIT。发布 dist 时请保留 licenses 文件夹和第三方声明。原始品牌素材不包含在此网页项目中。
