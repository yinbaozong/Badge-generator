const translations = {
  '保存参数，下次导入复用；不包含图案。': 'Save settings to reuse later. Artwork is not included.',
  '设置分组': 'Settings sections', '尺寸': 'Dimensions', '磁铁': 'Magnets',
  '启用磁铁槽': 'Enable magnet pockets', '在背面选点': 'Place magnets on back',
  '点击底壳添加位置，最多 8 个；每个位置可删除重选。': 'Click the backing to add up to 8 positions. Remove individual positions to replace them.',
  '恢复中心位置': 'Reset to center', '清空位置': 'Clear positions', '删除': 'Remove',
  '背面选点：点击底壳添加磁铁位置': 'Back view: click the backing to place magnets',
  '完成选点': 'Done placing', '正在选点': 'Placing magnets',
  '选点完成后生成磁铁槽': 'Finish placing to generate magnet pockets',
  '请选择底壳上的位置。': 'Choose a position on the backing.',
  '最多支持 8 个磁铁位置，请先删除一个。': 'Maximum 8 magnet positions. Remove one before adding another.',
  '请添加至少一个磁铁位置，或关闭磁铁槽。': 'Add at least one magnet position, or disable magnet pockets.',
  '磁铁位置无效，请重新选点。': 'Invalid magnet position. Place the magnets again.',
  '预览保留上次有效设置，调整后可导出': 'Preview shows the last valid settings. Adjust settings before exporting.',
  '已去除相近背景色和文字孔洞中的背景；请检查是否误删浅色细节。': 'Removed similar background colors, including inside letter holes. Check for lost light-colored details.',
  '图案预览': 'Artwork preview', '如果效果不理想，可先用': 'If the result needs improvement, use',
  '原图图案分辨率较低，细节无法完全恢复；建议转换为 SVG 后上传。': 'Source artwork is low resolution. Missing detail cannot be fully recovered; consider converting it to SVG first.',
  '转换为 SVG，再上传。': 'to convert your image to SVG, then upload it here.',
  '转载请注明出处。': 'Please credit the original project when sharing.',
  '提交问题 / 建议 ↗': 'Report an issue / Suggest a feature ↗',
  '上传 SVG': 'Upload SVG', '点击上传 SVG': 'Click to upload SVG',
  '上传图案预览': 'Uploaded artwork preview',
  '保存尺寸、外形和磁铁设置，下次导入即可复用；不包含图案文件。': 'Save sizes, shape and magnet settings for reuse. Artwork files are not included.',
  '配置已导入，当前图案将使用这套设置。': 'Settings imported and applied to the current artwork.',
  '上传 PNG / JPG（实验）': 'Upload PNG / JPG · Beta', '自动去除纯色背景': 'Remove solid background',
  '适合透明或纯色背景的图标；照片会简化为最多 6 种颜色。': 'Best for icons with transparent or solid backgrounds. Photos are reduced to up to 6 colors.',
  '正六边形': 'Regular hexagon',
  '六条边等长，长度自动计算；圆角对六个顶点均匀生效。': 'Six equal sides; length is automatic. Corner rounding applies equally to all six vertices.',
  'Logo 外形保持原图 XY 比例，长度自动计算；边缘添加少量圆角。': 'Logo keeps its XY aspect ratio. Length is automatic, with gently rounded edges.',
  '白色底座，黑色凸起；保留独立白色图案。': 'White backing, black relief. Detached white artwork is preserved.',
  '单色模式保留独立白色图案；与彩色图案重叠的白色区域作为留白。': 'Single color keeps detached white artwork. White regions overlapping colored artwork reveal the backing.',
  '请上传 SVG、PNG 或 JPG 文件。': 'Upload an SVG, PNG or JPG file.',
  '请上传 PNG 或 JPG 文件。': 'Upload a PNG or JPG file.',
  '请重新上传图片。': 'Please upload another image.', '请重新上传图片': 'Please upload another image',
  '图片超过 15 MB，请缩小后再上传。': 'Image exceeds 15 MB. Reduce its size before uploading.',
  '图片无法读取，请上传 PNG 或 JPG 文件。': 'Image could not be read. Upload a PNG or JPG file.',
  '图片分辨率过大，请先缩小到 4000 像素以内。': 'Image resolution is too large. Resize it to within 4000 pixels first.',
  '浏览器无法读取图片像素。': 'Your browser could not read the image pixels.',
  '图片转徽章为实验功能：适合清晰图标和纯色背景；照片会简化为最多 6 种颜色。': 'Image tracing is experimental. Best for clear icons and solid backgrounds; photos are reduced to up to 6 colors.',
  '已去除与图片边缘相连的相近背景色；请检查是否误删细节。': 'Removed similar background colors connected to the image edge. Check for lost details.',
  '背景颜色不统一，未自动抠除；建议上传透明背景图片。': 'Background colors vary, so removal was skipped. A transparent image is recommended.',
  '抠图后没有可见图案，请关闭自动去背景或换一张图片。': 'No artwork remains. Turn off background removal or choose another image.',
  '图片细节太小，无法生成轮廓，请使用更清晰的图案。': 'Details are too small to trace. Use clearer artwork.',
  '图片轮廓过于复杂，请使用更简单的图案。': 'Image contours are too complex. Use simpler artwork.',
  '圆角矩形': 'Rounded rectangle', '启用中心磁铁槽': 'Enable centered magnet pocket',
  '磁铁直径': 'Magnet diameter', '磁铁厚度': 'Magnet thickness',
  '自动预留：直径 +0.3 mm，深度 +0.1 mm。': 'Automatic clearance: +0.3 mm diameter, +0.1 mm depth.',
  '配置模板': 'Settings template', '导入配置': 'Import settings', '导出配置': 'Export settings', '导出模型': 'Export model',
  '保存尺寸、外形和磁铁设置，下次导入即可复用；不包含 SVG 图案。': 'Save sizes, shape and magnet settings for reuse. SVG artwork is not included.',
  '配置已导出，可用于后续徽章。': 'Settings exported for your next badges.',
  '配置已导入，当前 SVG 将使用这套设置。': 'Settings imported and applied to the current SVG.',
  '配置文件无效，请使用本工具导出的 JSON 文件。': 'Invalid settings file. Use a JSON file exported by this tool.',
  '配置文件版本不支持。': 'Unsupported settings file version.',
  '配置文件过大，请使用本工具导出的 JSON 文件。': 'Settings file is too large. Use a JSON file exported by this tool.',
  '徽章生成器': 'Badge Generator', '徽章生成器 · SVG to 3D': 'Badge Generator · SVG to 3D',
  '文件在你的浏览器处理': 'Files stay in your browser', '徽章生成器首页': 'Badge Generator home',
  '徽章设置': 'Badge settings', '图案': 'Artwork', '使用示例': 'Load example',
  '上传 SVG 图案': 'Upload SVG artwork', '点击选择，或拖到这里': 'Choose a file or drop it here',
  '上传的 SVG 图案预览': 'Uploaded SVG preview', '图案颜色模式': 'Artwork color mode',
  '单色': 'Single color', '多色': 'Multicolor', '模型颜色': 'Model colors',
  '保留实色，色块相差 0.2 毫米，便于上色。': 'Keep solid colors; 0.2 mm height steps help with painting.',
  '白色底座，黑色凸起；白色图案区域留给底座。': 'White backing, black relief; white regions reveal the backing.',
  '徽章外形': 'Badge outline', '毫米': 'mm', '外形': 'Shape', '矩形': 'Rectangle',
  '六边形': 'Hexagon', '拼图': 'Puzzle', 'Logo 外形': 'Follow logo outline',
  '宽度（X）': 'Width (X)', '长度（Y）': 'Length (Y)', '长度（Y，自动）': 'Length (Y, auto)',
  '底壳厚度（Z）': 'Backing thickness (Z)', '圆角': 'Corner radius',
  '图案厚度与留边': 'Relief thickness & border', '留边': 'Border', 'Logo 厚度（Z）': 'Logo thickness (Z)',
  'Logo 外形保持原图 XY 比例，长度自动计算；不添加额外圆角。': 'Logo keeps its XY aspect ratio. Length is automatic; no extra corner rounding.',
  '背面磁铁槽': 'Rear magnet pockets', '磁铁规格': 'Magnet size', '不需要': 'None',
  '6 × 2 毫米 · 中心 1 个': '6 × 2 mm · 1 centered', '6 × 2 毫米 · 左右 2 个': '6 × 2 mm · 2 side by side',
  '6 × 2 毫米 · 四角 4 个': '6 × 2 mm · 4 corners', '8 × 2 毫米 · 中心 1 个': '8 × 2 mm · 1 centered',
  '10 × 2 毫米 · 中心 1 个': '10 × 2 mm · 1 centered', '10 × 3 毫米 · 中心 1 个': '10 × 3 mm · 1 centered',
  '查看背面磁铁槽': 'View magnet pockets', '拼图间隙': 'Puzzle clearance', '重置尺寸': 'Reset sizes',
  '尺寸变化后自动生成': 'Updates automatically', '三维模型预览': '3D model preview', '模型预览': 'Model preview',
  '你的下一枚徽章': 'Your next badge', '准备生成器': 'Loading generator',
  '上传一张 SVG，从平面开始。': 'Upload an SVG to create your badge.',
  '恢复视角': 'Fit view', '俯视图': 'Top view', '查看背面': 'View back', '背面': 'Back', '显示网格': 'Toggle grid',
  '拖动旋转 · 滚轮缩放': 'Drag to rotate · Scroll to zoom', '准备打印': 'Ready to print',
  '生成后即可下载': 'Download after generation', '彩色打印使用 3MF，单色打印使用 STL。': 'Use 3MF for colors or STL for geometry.',
  '导出代码，可粘贴到 MakerWorld': 'Export code for MakerWorld', '下载 STL': 'Download STL', '下载彩色 3MF': 'Download color 3MF',
  '3MF 保留颜色与部件；导入切片软件后，按实际耗材选择对应颜色。': '3MF keeps colors and parts. Assign your actual filaments in the slicer.',
  'SVG 徽章生成器 · 开源 / MIT': 'SVG Badge Generator · Open source / MIT',
  '实色路径与常见渐变 · 渐变转换为代表实色': 'Solid paths & common gradients · Gradients become representative colors',
  '正在读取图案…': 'Reading artwork…', '读取图案': 'Reading artwork', '正在生成': 'Generating',
  '正在生成模型…': 'Generating model…', '等待生成': 'Waiting to generate', '需要调整': 'Adjustment needed',
  '调整设置后重新生成。': 'Adjust the settings to regenerate.', '调整后重新生成': 'Adjust settings to regenerate',
  '模型已生成，可以直接下载。': 'Model generated. Downloads are available.', '模型已生成': 'Model generated',
  '当前浏览器无法显示三维预览，仍可生成和下载模型。': '3D preview is unavailable in this browser. Model downloads still work.',
  '三维预览加载失败，模型仍可下载。': '3D preview failed to load. Model downloads still work.',
  '请刷新页面后重新上传。': 'Refresh the page and upload again.', '生成器未能启动': 'Generator could not start',
  '生成器加载失败，请刷新页面。若部署到自己的网页，请确认静态文件和 WASM 文件都已上传。': 'Generator failed to load. Refresh the page. For self-hosting, include all static files and the WASM asset.',
  '点击更换 SVG': 'Click to replace SVG', '请重新上传 SVG。': 'Please upload another SVG.', '请重新上传 SVG': 'Please upload another SVG',
  '图案需要处理': 'Artwork needs adjustment', '等待上传': 'Waiting for upload', '准备下载': 'Preparing download',
  '导出失败': 'Export failed', '示例图案未能加载，你可以直接上传自己的 SVG。': 'The example could not load. Upload your own SVG instead.',
  '示例徽章': 'Example badge', '示例徽章.svg': 'Example badge.svg',
  '单色模式把可见白色区域留给白色底座，其余可见图案统一为黑色。': 'Single-color mode exposes the white backing in white regions; other visible artwork becomes black.',
  '这张 SVG 全部为白色，单色模式已将其轮廓转成黑色凸起。': 'This SVG is entirely white; single-color mode turns its outline into black relief.',
  '不同颜色之间自动增加 0.2 毫米高度差，便于使用单色 STL 时在切片软件中上色。': 'Color regions have 0.2 mm height steps to help paint a monochrome STL in your slicer.',
  '渐变已转换为代表实色，保留色块边界和前景图案。': 'Gradients were converted to representative solid colors; region boundaries and foreground artwork are preserved.',
  '半透明填色按不透明实色生成。': 'Semitransparent fills are generated as opaque solid colors.',
  'Logo 轮廓包含分离的底座区域；如需连成一体，请增大留边或改用矩形外形。': 'The logo has separate backing islands. Increase the border or use a rectangle to connect them.',
  'SVG 超过 5 MB，请简化路径后再上传。': 'SVG exceeds 5 MB. Simplify the paths and upload again.',
  '请使用不含外部文档或样式表声明的普通 SVG。': 'Use a plain SVG without external document or stylesheet declarations.',
  '这不是有效的 SVG 文件，请重新导出。': 'Invalid SVG file. Please export it again.',
  'SVG 元素过多，请先简化图案。': 'Too many SVG elements. Simplify the artwork.',
  'SVG 包含文字，请先将文字转换为路径。': 'Convert SVG text to paths before uploading.',
  '暂不支持剪切蒙版、蒙版或滤镜，请展开为普通路径。': 'Clipping, masks and filters are unsupported. Flatten them into plain paths.',
  'SVG 含有脚本事件，请导出为普通 SVG。': 'SVG contains script events. Export a plain SVG.',
  'SVG 不能引用外部文件，请将图案内容内置。': 'External file references are unsupported. Embed the vector artwork.',
  'SVG 的填色只能引用文件内部的渐变。': 'SVG fills may only reference gradients inside the file.',
  'SVG 样式不能引用外部资源。': 'SVG styles cannot reference external resources.',
  '请将 SVG 的克隆或符号展开为普通路径后上传。': 'Expand SVG clones and symbols into plain paths.',
  '请将 currentColor 或 CSS 变量填色转换为明确的实色。': 'Replace currentColor and CSS variables with explicit solid fills.',
  '浏览器无法解析 SVG 颜色，请使用现代浏览器。': 'SVG colors could not be parsed. Use a modern browser.',
  'SVG 渐变存在循环引用。': 'SVG gradients contain circular references.',
  'SVG 填色引用了不支持的图案。': 'SVG fill references an unsupported paint pattern.',
  'SVG 渐变没有颜色节点。': 'SVG gradient has no color stops.',
  'SVG 渐变包含无效的颜色数值。': 'SVG gradient contains invalid color values.',
  'SVG 路径包含无效坐标。': 'SVG path contains invalid coordinates.',
  'SVG 细节过多，请减少节点后上传。': 'SVG is too detailed. Reduce the node count.',
  'SVG 包含描边，请先将描边转换为填色路径。': 'Convert strokes to filled paths before uploading.',
  'SVG 没有可生成的填色路径。': 'SVG contains no usable filled paths.',
  'SVG 图案没有有效尺寸。': 'SVG artwork has no valid dimensions.',
  'SVG 同时包含填色和描边，请先将描边展开为填色路径。': 'SVG contains fills and strokes. Expand strokes into filled paths.',
  'SVG 没有可生成的闭合区域。': 'SVG contains no usable closed regions.',
  'SVG 图案没有有效面积。': 'SVG artwork has no valid area.',
  '徽章外形选项无效。': 'Invalid badge shape.', '请选择单色或多色。': 'Choose single-color or multicolor mode.',
  '磁铁规格选项无效。': 'Invalid magnet preset.',
  '拼图徽章的宽度和高度都至少需要 25 毫米。': 'Puzzle width and length must both be at least 25 mm.',
  'SVG 中的颜色未转换为实色，请重新导入图案。': 'SVG colors are not solid colors. Import the artwork again.',
  'SVG 轮廓数据无效。': 'Invalid SVG contour data.', 'SVG 包含无效的轮廓坐标。': 'SVG contains invalid contour coordinates.',
  'SVG 路径过于复杂，请先简化路径后重新上传。': 'SVG paths are too complex. Simplify and upload again.',
  '模型超过一百万个三角面，请简化 SVG 路径。': 'Model exceeds one million triangles. Simplify the SVG paths.',
  'SVG 中没有可生成的实色矢量路径。': 'SVG contains no usable solid-filled vector paths.',
  'SVG 中没有有面积的可见矢量图案。': 'SVG contains no visible vector artwork with area.',
  '图案留边太大，图案已经放不下：请减小留边或增大徽章。': 'The border leaves no room for artwork. Reduce it or increase the badge size.',
  'SVG 图案的宽度或高度为零。': 'SVG artwork width or length is zero.',
  '徽章底座外形为空，请减小圆角或调整徽章尺寸。': 'Backing outline is empty. Reduce corner rounding or adjust badge dimensions.',
  '图案没有落在底座内，请调整图案留边。': 'Artwork does not fit the backing. Adjust the border.',
  '徽章太窄，放不下多个磁铁槽：请选择中心 1 个或增大宽度。': 'Badge is too narrow for multiple magnet pockets. Choose one centered pocket or increase width.',
  '徽章太矮，放不下四个磁铁槽：请减少数量或增大高度。': 'Badge is too short for four magnet pockets. Reduce the count or increase length.',
  '磁铁槽超出底座，或距离边缘不足 0.5 毫米：请选择更小磁铁、减少数量或增大徽章。': 'Magnet pockets need 0.5 mm clearance from the backing edge. Choose smaller magnets, fewer pockets or a larger badge.',
  '模型坐标无效。': 'Invalid model coordinates.', '部件颜色格式无效。': 'Invalid part color format.',
  '模型缺少顶点或三角面数据。': 'Model vertex or triangle data is missing.',
  '模型的顶点或三角面数据不完整。': 'Model vertex or triangle data is incomplete.',
  '模型过大，请降低图案精度后导出。': 'Model is too large. Simplify the artwork before exporting.',
  '模型存在无效或超出范围的坐标。': 'Model contains invalid or out-of-range coordinates.',
  '模型存在无效的三角面索引。': 'Model contains invalid triangle indices.',
  '部件颜色需要使用 #RRGGBB 格式。': 'Part colors must use #RRGGBB format.',
  'STL 文件过大，无法在浏览器中导出。': 'STL is too large to export in the browser.',
  '3MF 导出需要 1 至 256 个有效部件。': '3MF requires 1–256 valid parts.',
  '3MF 模型过大，请降低图案精度后导出。': '3MF is too large. Simplify the artwork before exporting.',
  '徽章宽度': 'Badge width', '徽章长度（Y）': 'Badge length (Y)', '底座厚度': 'Backing thickness',
  '图案留边': 'Artwork border', '图案凸起高度': 'Logo thickness', '底座': 'Backing', '完整徽章': 'Complete badge', '黑色图案': 'Black artwork',
};

let language = 'en';
export const isEnglish = () => language === 'en';
export function translate(text) {
  if (!isEnglish()) return text;
  return String(text).split('\n').map(line => {
    const source = line.trim();
    let translated = translations[source];
    if (translated === undefined) {
      const rules = [
        [/^(\d+) 号磁铁位置$/, (_, n) => 'Magnet position ' + n],
        [/^(\d+) 号与 (\d+) 号磁铁槽太近，请重新选点。$/, (_, a, b) => 'Magnet pockets ' + a + ' and ' + b + ' are too close. Place them farther apart.'],
        [/^(\d+) 号磁铁槽超出底壳或距离边缘不足 0.5 mm，请重新选点或减小直径。$/, (_, n) => 'Magnet pocket ' + n + ' needs 0.5 mm clearance from the backing edge. Choose a new position or smaller diameter.'],
        [/^(\d+) 个图案色区 · (\d+) 个部件$/, (_, a, b) => a + ' artwork colors · ' + b + ' parts'],
        [/^([\d,]+) 个三角面 · 已生成完整模型$/, (_, n) => n + ' triangles · Complete model'],
        [/^(\d+) 个背面凹槽 · 实际直径 ([\d.]+) mm · 深 ([\d.]+) mm（已含安装余量）$/, (_, n, d, h) => n + ' rear pockets · Ø ' + d + ' mm · ' + h + ' mm deep (includes fit clearance)'],
        [/^底壳 ([\d.]+) mm · Logo ([\d.–]+) mm$/, (_, a, b) => 'Backing ' + a + ' mm · Logo ' + b + ' mm'],
        [/^图案 (\d+) (.+)$/, (_, n, color) => 'Artwork ' + n + ' ' + color],
        [/^颜色 (.+)$/, (_, color) => 'Color ' + color],
        [/^([A-Z0-9]+) 已导出$/, (_, format) => format + ' exported'],
        [/^为容纳磁铁槽并保留顶层，底座已自动加厚到 ([\d.]+) 毫米。$/, (_, h) => 'Backing increased to ' + h + ' mm to fit the magnet pockets and preserve the top skin.'],
        [/^图案含 (\d+) 种可见颜色；本工具最多支持 (\d+) 种，请先减少 SVG 颜色。$/, (_, n, max) => 'Artwork has ' + n + ' colors. Maximum: ' + max + '. Reduce the SVG colors.'],
        [/^暂不支持 SVG 的 (.+) 元素，请将图案展开为填色路径。$/, (_, tag) => 'Unsupported SVG element: ' + tag + '. Expand it into filled paths.'],
        [/^SVG 填色无法识别：(.+)$/, (_, color) => 'Unrecognized SVG fill: ' + color],
        [/^(.+)应在 ([\d.]+)～([\d.]+) 毫米之间。$/, (_, label, a, b) => translate(label) + ' must be between ' + a + ' and ' + b + ' mm.'],
        [/^(.+)生成失败：(.+)。$/, (_, label, status) => translate(label) + ' generation failed: ' + status + '.'],
        [/^(.+)为空，请调整尺寸或图案留边。$/, (_, label) => translate(label) + ' is empty. Adjust size or border.'],
        [/^(.+)的顶点合并数据不完整。$/, (_, label) => translate(label) + ' has incomplete vertex merge data.'],
        [/^(.+)的顶点合并索引无效。$/, (_, label) => translate(label) + ' has invalid vertex merge indices.'],
        [/^(.+)包含无效的模型坐标。$/, (_, label) => translate(label) + ' contains invalid model coordinates.'],
      ];
      for (const [pattern, replacement] of rules) {
        if (pattern.test(source)) { translated = source.replace(pattern, replacement); break; }
      }
    }
    return translated === undefined ? line : line.replace(source, translated);
  }).join('\n');
}

/** Keep source strings separately so language changes never lose dynamic values. */
export function initializeI18n() {
  try { language = localStorage.getItem('badge-language-v2') || 'en'; } catch {}
  if (!['zh', 'en'].includes(language)) language = 'en';
  const texts = new Map(), attributes = new Map();
  const names = ['title', 'aria-label', 'alt', 'placeholder', 'content'];
  function textNode(node) {
    if (!node.parentElement || node.parentElement.closest('script,style,#language-button')) return;
    const previous = texts.get(node);
    const source = previous && node.nodeValue === previous.rendered ? previous.source : node.nodeValue;
    const rendered = translate(source);
    texts.set(node, { source, rendered });
    if (node.nodeValue !== rendered) node.nodeValue = rendered;
  }
  function elementAttributes(element) {
    if (element.id === 'language-button') return;
    let cache = attributes.get(element);
    if (!cache) attributes.set(element, cache = new Map());
    for (const name of names) {
      if (!element.hasAttribute(name)) continue;
      const value = element.getAttribute(name), previous = cache.get(name);
      const source = previous && value === previous.rendered ? previous.source : value;
      const rendered = translate(source);
      cache.set(name, { source, rendered });
      if (value !== rendered) element.setAttribute(name, rendered);
    }
  }
  function scan(root) {
    if (root.nodeType === Node.TEXT_NODE) { textNode(root); return; }
    if (root.nodeType === Node.ELEMENT_NODE) elementAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      if (walker.currentNode.nodeType === Node.TEXT_NODE) textNode(walker.currentNode);
      else elementAttributes(walker.currentNode);
    }
  }
  function refresh() {
    document.documentElement.lang = isEnglish() ? 'en' : 'zh-CN';
    const button = document.getElementById('language-button');
    button.dataset.language = language;
    button.setAttribute('aria-checked', String(isEnglish()));
    button.setAttribute('aria-label', isEnglish() ? '切换为中文' : 'Switch to English');
    for (const [node, state] of texts) {
      if (!node.isConnected) { texts.delete(node); continue; }
      if (node.nodeValue !== state.rendered) state.source = node.nodeValue;
      state.rendered = translate(state.source); node.nodeValue = state.rendered;
    }
    for (const [element] of attributes) {
      if (!element.isConnected) { attributes.delete(element); continue; }
      elementAttributes(element);
    }
  }
  scan(document.head); scan(document.body); refresh();
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') textNode(record.target);
      else if (record.type === 'attributes') elementAttributes(record.target);
      else for (const node of record.addedNodes) scan(node);
    }
    // Remove detached nodes rather than accumulating history during editing.
    for (const node of texts.keys()) if (!node.isConnected) texts.delete(node);
    for (const element of attributes.keys()) if (!element.isConnected) attributes.delete(element);
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: names });
  document.getElementById('language-button').addEventListener('click', () => {
    language = isEnglish() ? 'zh' : 'en';
    try { localStorage.setItem('badge-language-v2', language); } catch {}
    refresh();
  });
}
