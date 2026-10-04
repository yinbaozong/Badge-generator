import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

const MAX_FILE = 5 * 1024 * 1024;
const MAX_POINTS = 200000;
const UNSUPPORTED = new Set(['script', 'image', 'foreignobject', 'text', 'textpath', 'mask', 'clippath', 'filter', 'pattern', 'animate', 'animatetransform', 'animatemotion', 'set']);

function externalURL(value) {
  return [...value.matchAll(/url\s*\(([^)]*)\)/gi)].some(match => !match[1].trim().replace(/^['"]|['"]$/g, '').trim().startsWith('#'));
}

function styleValue(element, name) {
  return element.style?.getPropertyValue(name) || element.getAttribute(name) || '';
}

function validateDocument(text) {
  if (new TextEncoder().encode(text).length > MAX_FILE) throw new Error('SVG 超过 5 MB，请简化路径后再上传。');
  if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(text)) throw new Error('请使用不含外部文档或样式表声明的普通 SVG。');
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') throw new Error('这不是有效的 SVG 文件，请重新导出。');
  const all = [...doc.querySelectorAll('*')];
  if (all.length > 10000) throw new Error('SVG 元素过多，请先简化图案。');
  for (const element of all) {
    const tag = element.localName.toLowerCase();
    if (UNSUPPORTED.has(tag)) {
      if (tag === 'text' || tag === 'textpath') throw new Error('SVG 包含文字，请先将文字转换为路径。');
      throw new Error(`暂不支持 SVG 的 ${element.localName} 元素，请将图案展开为填色路径。`);
    }
    if (element.hasAttribute('clip-path') || element.hasAttribute('mask') || element.hasAttribute('filter') || /clip-path|mask\s*:|filter\s*:/i.test(element.getAttribute('style') || '')) throw new Error('暂不支持剪切蒙版、蒙版或滤镜，请展开为普通路径。');
    for (const attribute of [...element.attributes]) {
      if (/^on/i.test(attribute.name)) throw new Error('SVG 含有脚本事件，请导出为普通 SVG。');
      if (attribute.localName === 'href' && attribute.value && !attribute.value.startsWith('#')) throw new Error('SVG 不能引用外部文件，请将图案内容内置。');
      if (externalURL(attribute.value)) throw new Error('SVG 的填色只能引用文件内部的渐变。');
    }
    if (tag === 'style' && (/@import/i.test(element.textContent) || externalURL(element.textContent))) throw new Error('SVG 样式不能引用外部资源。');
    if (tag === 'use') throw new Error('请将 SVG 的克隆或符号展开为普通路径后上传。');
  }
  // Resolve currentColor without attaching an uploaded document to the page.
  function visit(element, inheritedColor = '#000000') {
    const ownColor = styleValue(element, 'color');
    const color = ownColor && ownColor !== 'currentColor' ? ownColor : inheritedColor;
    const fill = styleValue(element, 'fill');
    const stroke = styleValue(element, 'stroke');
    if (fill === 'currentColor') { element.setAttribute('fill', color); element.style?.setProperty('fill', color); }
    if (stroke === 'currentColor') { element.setAttribute('stroke', color); element.style?.setProperty('stroke', color); }
    if (styleValue(element, 'display') === 'none' || ['hidden', 'collapse'].includes(styleValue(element, 'visibility'))) { element.remove(); return; }
    for (const child of [...element.children]) visit(child, color);
  }
  visit(doc.documentElement);
  return doc;
}

let colorContext;
const colorCache = new Map();
function colorChannels(css) {
  if (colorCache.has(css)) return colorCache.get(css);
  if (/currentColor|var\s*\(/i.test(css)) throw new Error('请将 currentColor 或 CSS 变量填色转换为明确的实色。');
  if (!colorContext) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    colorContext = canvas.getContext('2d', { willReadFrequently: true });
    if (!colorContext) throw new Error('浏览器无法解析 SVG 颜色，请使用现代浏览器。');
  }
  // Invalid canvas colors leave fillStyle unchanged; two sentinels detect that.
  colorContext.fillStyle = '#010203'; colorContext.fillStyle = css;
  const first = colorContext.fillStyle;
  colorContext.fillStyle = '#040506'; colorContext.fillStyle = css;
  if (first !== colorContext.fillStyle) throw new Error(`SVG 填色无法识别：${css}`);
  colorContext.clearRect(0, 0, 1, 1); colorContext.fillRect(0, 0, 1, 1);
  const result = Array.from(colorContext.getImageData(0, 0, 1, 1).data, n => n / 255);
  colorCache.set(css, result);
  return result;
}

function representativeGradient(doc, id, seen = new Set()) {
  if (seen.has(id)) throw new Error('SVG 渐变存在循环引用。');
  seen.add(id);
  const gradient = doc.getElementById(id);
  if (!gradient || !['linearGradient', 'radialGradient'].includes(gradient.localName)) throw new Error('SVG 填色引用了不支持的图案。');
  let stops = [...gradient.children].filter(e => e.localName === 'stop');
  if (!stops.length) {
    const ref = gradient.getAttribute('href') || gradient.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    if (ref?.startsWith('#')) return representativeGradient(doc, ref.slice(1), seen);
    throw new Error('SVG 渐变没有颜色节点。');
  }
  stops = stops.map(element => {
    const offset = element.getAttribute('offset') || '0';
    const t = Math.max(0, Math.min(1, offset.endsWith('%') ? parseFloat(offset) / 100 : parseFloat(offset)));
    const channels = colorChannels(styleValue(element, 'stop-color') || '#000000');
    const opacity = Math.max(0, Math.min(1, parseFloat(styleValue(element, 'stop-opacity') || '1'))) * channels[3];
    const rgb = channels.slice(0, 3).map(v => v * opacity + 1 - opacity);
    return { t, rgb };
  }).sort((a, b) => a.t - b.t);
  if (!stops.every(s => Number.isFinite(s.t) && s.rgb.every(Number.isFinite))) throw new Error('SVG 渐变包含无效的颜色数值。');
  if (stops[0].t > 0) stops.unshift({ t: 0, rgb: stops[0].rgb });
  if (stops.at(-1).t < 1) stops.push({ t: 1, rgb: stops.at(-1).rgb });
  const average = [0, 0, 0];
  for (let i = 1; i < stops.length; i++) for (let channel = 0; channel < 3; channel++) average[channel] += (stops[i].t - stops[i - 1].t) * (stops[i].rgb[channel] + stops[i - 1].rgb[channel]) / 2;
  return '#' + average.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function chordDistance(point, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len)) : 0;
  return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
}

function flatten(subpath, tolerance, budget) {
  const points = [];
  const append = p => {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new Error('SVG 路径包含无效坐标。');
    const previous = points.at(-1);
    if (!previous || Math.hypot(p.x - previous[0], p.y - previous[1]) > 1e-10) {
      if (++budget.points > MAX_POINTS) throw new Error('SVG 细节过多，请减少节点后上传。');
      points.push([p.x, p.y]);
    }
  };
  for (const curve of subpath.curves) {
    const start = curve.getPoint(0), end = curve.getPoint(1);
    append(start);
    function split(t0, p0, t1, p1, depth) {
      const span = t1 - t0;
      const probes = [.25, .5, .75].map(r => curve.getPoint(t0 + span * r));
      if (depth >= 18 || Math.max(...probes.map(p => chordDistance(p, p0, p1))) <= tolerance) { append(p1); return; }
      const middle = (t0 + t1) / 2;
      split(t0, p0, middle, probes[1], depth + 1);
      split(middle, probes[1], t1, p1, depth + 1);
    }
    split(0, start, 1, end, 0);
  }
  if (points.length > 1 && Math.hypot(points[0][0] - points.at(-1)[0], points[0][1] - points.at(-1)[1]) < tolerance * .001) points.pop();
  return points;
}

export function parseArtwork(text) {
  colorCache.clear();
  const document = validateDocument(text);
  const safeText = new XMLSerializer().serializeToString(document);
  const loaded = new SVGLoader().parse(safeText);
  const visible = loaded.paths.filter(path => {
    const style = path.userData.style;
    if (style.fill === 'none') {
      if (style.stroke && style.stroke !== 'none' && (style.strokeOpacity ?? 1) > 0) throw new Error('SVG 包含描边，请先将描边转换为填色路径。');
      return false;
    }
    if (['hidden', 'collapse'].includes(style.visibility)) return false;
    if (!/^url\s*\(/i.test(style.fill || '') && colorChannels(style.fill || '#000000')[3] === 0) return false;
    return (style.fillOpacity ?? 1) > 0 && (style.opacity ?? 1) > 0;
  });
  if (!visible.length) throw new Error('SVG 没有可生成的填色路径。');
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const path of visible) for (const subpath of path.subPaths) for (const point of subpath.getPoints(12)) {
    x0 = Math.min(x0, point.x); y0 = Math.min(y0, point.y); x1 = Math.max(x1, point.x); y1 = Math.max(y1, point.y);
  }
  const roughSpan = Math.max(x1 - x0, y1 - y0);
  if (!Number.isFinite(roughSpan) || roughSpan <= 0) throw new Error('SVG 图案没有有效尺寸。');
  const tolerance = roughSpan * .00015;
  const warnings = new Set();
  const budget = { points: 0 };
  const shapes = visible.map(path => {
    const style = path.userData.style;
    const fill = style.fill || '#000000';
    const reference = /^url\(\s*['"]?#([^)'"\s]+)['"]?\s*\)$/.exec(fill);
    let color;
    if (reference) {
      color = representativeGradient(document, reference[1]);
      warnings.add('渐变已转换为代表实色，保留色块边界和前景图案。');
    } else {
      color = '#' + colorChannels(fill).slice(0, 3).map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
    }
    const opacity = (style.opacity ?? 1) * (style.fillOpacity ?? 1);
    if (opacity < 1 || (!reference && colorChannels(fill)[3] < 1)) warnings.add('半透明填色按不透明实色生成。');
    if (style.stroke && style.stroke !== 'none' && style.strokeWidth > 0) throw new Error('SVG 同时包含填色和描边，请先将描边展开为填色路径。');
    return { color, fillRule: style.fillRule === 'evenodd' ? 'EvenOdd' : 'NonZero', contours: path.subPaths.map(p => flatten(p, tolerance, budget)).filter(p => p.length >= 3) };
  }).filter(shape => shape.contours.length);
  if (!shapes.length) throw new Error('SVG 没有可生成的闭合区域。');
  x0 = Infinity; y0 = Infinity; x1 = -Infinity; y1 = -Infinity;
  for (const shape of shapes) for (const contour of shape.contours) for (const [x, y] of contour) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  const span = Math.max(x1 - x0, y1 - y0), cx = (x1 + x0) / 2, cy = (y1 + y0) / 2;
  if (!Number.isFinite(span) || span <= 0) throw new Error('SVG 图案没有有效面积。');
  for (const shape of shapes) shape.contours = shape.contours.map(contour => contour.map(([x, y]) => [(x - cx) * 100 / span, (cy - y) * 100 / span]));
  return { shapes, warnings: [...warnings], safeText, pointCount: budget.points };
}
