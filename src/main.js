import './style.css';
import { parseArtwork } from './svg.js';
import { traceRaster } from './raster.js';
import { createViewer } from './viewer.js';
import { exportSTL, export3MF, downloadFile } from './exporters.js';
import { exportSCAD } from './scad.js';
import { initializeI18n, isEnglish } from './i18n.js';
import { DEFAULTS, parseSettings, serializeSettings } from './settings.js';

initializeI18n();

const $ = id => document.getElementById(id);
const defaults = DEFAULTS;
const numericFields = Object.keys(defaults);
let artwork = null, result = null, filename = '示例徽章', mode = 'multi';
let requestId = 0, uploadId = 0, timer = null, thumbnailUrl = null, needsCameraReset = true;
let viewer = null;
let previousShape = 'rect', standardHeight = defaults.height;
let rasterFile = null;
function syncShapeControls() {
  const logo = $('shape').value === 'logo', hexagon = $('shape').value === 'hexagon';
  const autoLength = logo || hexagon, wasAuto = ['logo', 'hexagon'].includes(previousShape);
  if (autoLength && !wasAuto) standardHeight = $('height').value;
  if (!autoLength && wasAuto) $('height').value = standardHeight;
  $('height').readOnly = autoLength; $('height').disabled = autoLength;
  $('height-label').textContent = autoLength ? '长度（Y，自动）' : '长度（Y）';
  $('corner-field').hidden = logo; $('logo-size-note').hidden = !logo;
  $('hex-size-note').hidden = !hexagon;
  $('magnet-fields').hidden = !$('magnetEnabled').checked;
  previousShape = $('shape').value;
}
const viewerWarnings = [];
try { viewer = createViewer($('viewport')); viewer.start(); }
catch { viewerWarnings.push('当前浏览器无法显示三维预览，仍可生成和下载模型。'); }
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
const exportButtons = [...document.querySelectorAll('[data-export]')];

function status(state, text) { $('status-pill').dataset.state = state; $('status-label').textContent = text; }
function feedback(messages, error = false) {
  $('feedback').hidden = messages.length === 0;
  $('feedback').classList.toggle('error', error);
  $('feedback').textContent = messages.join('\n');
}
function setExportEnabled(enabled) {
  for (const button of exportButtons) button.disabled = !enabled;
  $('view-back-button').disabled = !enabled || !viewer || !result?.stats.magnets?.count;
}
function clearPreview(message = '上传一张 SVG，从平面开始。') {
  try { viewer?.clear(); } catch { /* Downloads remain independent of rendering. */ }
  $('preview-placeholder').hidden = false;
  $('preview-placeholder').querySelector('p').textContent = message;
  $('model-dimensions').textContent = '—';
  $('palette').replaceChildren();
  $('magnet-note').hidden = true;
}
function beginUpload() {
  const token = ++uploadId;
  ++requestId; result = null; artwork = null; clearTimeout(timer);
  rasterFile = null; $('raster-options').hidden = true;
  setExportEnabled(false); clearPreview('正在读取图案…');
  $('svg-thumbnail').hidden = true;
  status('loading', '读取图案');
  return token;
}
function parameters() {
  const values = { shape: $('shape').value, mode, magnetEnabled: $('magnetEnabled').checked };
  for (const field of numericFields) values[field] = $('' + field).value === '' ? NaN : Number($(field).value);
  return values;
}
function generate() {
  clearTimeout(timer);
  syncShapeControls();
  if (!artwork) return;
  setExportEnabled(false); result = null;
  status('loading', '正在生成');
  $('export-summary').textContent = '正在生成模型…';
  feedback(viewerWarnings);
  $('puzzle-field').hidden = $('shape').value !== 'puzzle';
  const { shapes, warnings } = artwork;
  worker.postMessage({ id: ++requestId, artwork: { shapes, warnings }, params: parameters() });
}
function schedule() {
  syncShapeControls();
  ++requestId;
  setExportEnabled(false); result = null;
  if (!artwork) return;
  status('loading', '等待生成');
  clearTimeout(timer); timer = setTimeout(generate, 250);
}
worker.onmessage = ({ data }) => {
  if (data.id !== requestId) return;
  if (data.error) {
    clearPreview('调整设置后重新生成。');
    status('error', '需要调整'); feedback([data.error], true);
    $('export-summary').textContent = '调整后重新生成';
    return;
  }
  result = data.result;
  try { viewer?.update(result.parts, needsCameraReset); }
  catch {
    try { viewer?.dispose(); } catch { /* Keep a valid model available for download. */ }
    viewer = null;
    viewerWarnings.push('三维预览加载失败，模型仍可下载。');
  }
  needsCameraReset = false;
  $('preview-placeholder').hidden = !!viewer;
  if (!viewer) $('preview-placeholder').querySelector('p').textContent = '模型已生成，可以直接下载。';
  status('ready', '模型已生成');
  $('model-title').textContent = filename;
  const [x, y, z] = result.stats.dimensions;
  const reliefRange = result.stats.reliefHeightMax > result.stats.reliefHeight
    ? `${result.stats.reliefHeight.toFixed(1)}–${result.stats.reliefHeightMax.toFixed(1)}` : result.stats.reliefHeight.toFixed(1);
  $('model-dimensions').textContent = `X ${x.toFixed(1)} × Y ${y.toFixed(1)} × Z ${z.toFixed(1)} mm\n底壳 ${result.stats.baseThickness.toFixed(1)} mm · Logo ${reliefRange} mm`;
  if (['logo', 'hexagon'].includes($('shape').value)) $('height').value = y.toFixed(1);
  $('export-summary').textContent = `${result.stats.colorCount} 个图案色区 · ${result.stats.partCount} 个部件`;
  $('export-detail').textContent = `${result.stats.mergedTriangleCount.toLocaleString()} 个三角面 · 已生成完整模型`;
  const magnets = result.stats.magnets;
  $('magnet-note').hidden = !magnets?.count;
  if (magnets?.count) $('magnet-note').textContent = `${magnets.count} 个背面凹槽 · 实际直径 ${magnets.diameter.toFixed(1)} mm · 深 ${magnets.depth.toFixed(1)} mm（已含安装余量）`;
  feedback([...viewerWarnings, ...result.warnings]);
  $('palette').replaceChildren();
  const uniqueColors = [...new Set(result.parts.map(p => p.color))];
  for (const color of uniqueColors) {
    const swatch = document.createElement('span');
    swatch.className = 'swatch'; swatch.style.backgroundColor = color;
    swatch.title = color; swatch.setAttribute('aria-label', `颜色 ${color}`);
    $('palette').append(swatch);
  }
  setExportEnabled(true);
};
worker.onerror = () => {
  ++requestId; clearPreview('请刷新页面后重新上传。');
  result = null; setExportEnabled(false);
  status('error', '生成器未能启动');
  feedback(['生成器加载失败，请刷新页面。若部署到自己的网页，请确认静态文件和 WASM 文件都已上传。'], true);
};

async function loadSVG(text, name, token) {
  if (token !== uploadId) return;
  setExportEnabled(false);
  // Invalidate any earlier in-flight model before parsing a replacement SVG.
  ++requestId; result = null; clearTimeout(timer);
  status('loading', '读取图案');
  try {
    const parsed = parseArtwork(text);
    rasterFile = null; $('raster-options').hidden = true;
    artwork = parsed;
    filename = name.replace(/\.svg$/i, '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').slice(0, 120).trim() || '徽章';
    $('upload-filename').textContent = name; $('upload-filename').hidden = false;
    $('upload-hint').textContent = '点击上传 SVG';
    $('drop-zone').classList.add('has-file');
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    thumbnailUrl = URL.createObjectURL(new Blob([parsed.safeText], { type: 'image/svg+xml' }));
    $('svg-thumbnail').src = thumbnailUrl; $('svg-thumbnail').hidden = false;
    needsCameraReset = true;
    generate();
  } catch (error) {
    artwork = null;
    clearPreview('请重新上传 SVG。');
    status('error', '图案需要处理');
    feedback([error.message], true);
    $('export-summary').textContent = '请重新上传 SVG';
  }
}
async function loadFile(file) {
  if (!file) return;
  if (/\.(png|jpe?g)$/i.test(file.name) || ['image/png', 'image/jpeg'].includes(file.type)) return loadRasterFile(file);
  const token = beginUpload();
  try {
    if (!/\.svg$/i.test(file.name)) throw new Error('请上传 SVG、PNG 或 JPG 文件。');
    if (file.size > 5 * 1024 * 1024) throw new Error('SVG 超过 5 MB，请简化路径后再上传。');
    await loadSVG(await file.text(), file.name, token);
  } catch (error) {
    if (token !== uploadId) return;
    status('error', '图案需要处理'); clearPreview('请重新上传 SVG。');
    feedback([error.message], true); $('export-summary').textContent = '请重新上传 SVG';
  }
}
async function loadRasterFile(file) {
  if (!file) return;
  const token = beginUpload();
  rasterFile = file; $('raster-options').hidden = false;
  try {
    if (!/\.(png|jpe?g)$/i.test(file.name)) throw new Error('请上传 PNG 或 JPG 文件。');
    const parsed = await traceRaster(file, $('remove-background').checked);
    if (token !== uploadId) return;
    artwork = parsed;
    filename = file.name.replace(/\.(png|jpe?g)$/i, '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').slice(0, 120).trim() || '徽章';
    $('upload-filename').textContent = file.name; $('upload-filename').hidden = false;
    $('upload-hint').textContent = '点击上传 SVG';
    $('drop-zone').classList.add('has-file');
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    thumbnailUrl = URL.createObjectURL(parsed.previewBlob || file);
    $('svg-thumbnail').src = thumbnailUrl; $('svg-thumbnail').hidden = false;
    needsCameraReset = true; generate();
  } catch (error) {
    if (token !== uploadId) return;
    artwork = null; clearPreview('请重新上传图片。');
    status('error', '图案需要处理'); feedback([error.message], true);
    $('export-summary').textContent = '请重新上传图片';
  }
}
$('svg-button').addEventListener('click', () => $('svg-file').click());
$('raster-button').addEventListener('click', () => $('raster-file').click());
$('raster-file').addEventListener('change', async event => {
  await loadRasterFile(event.target.files[0]); event.target.value = '';
});
$('remove-background').addEventListener('change', () => { if (rasterFile) loadRasterFile(rasterFile); });
$('svg-file').addEventListener('change', async event => {
  await loadFile(event.target.files[0]); event.target.value = '';
});
for (const event of ['dragenter', 'dragover']) $('drop-zone').addEventListener(event, e => { e.preventDefault(); $('drop-zone').classList.add('dragging'); });
for (const event of ['dragleave', 'drop']) $('drop-zone').addEventListener(event, e => { e.preventDefault(); $('drop-zone').classList.remove('dragging'); });
$('drop-zone').addEventListener('drop', e => loadFile(e.dataTransfer.files[0]));
for (const field of [...numericFields, 'shape', 'magnetEnabled']) $(field).addEventListener('input', schedule);
function setMode(selectedMode) {
  mode = selectedMode;
  for (const button of document.querySelectorAll('.mode-button')) {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
  }
  $('mode-note').textContent = mode === 'single' ? '白色底座，黑色凸起；保留独立白色图案。' : '保留实色，色块相差 0.2 毫米，便于上色。';
}
for (const button of document.querySelectorAll('.mode-button')) button.addEventListener('click', () => {
  setMode(button.dataset.mode);
  schedule();
});
$('reset-button').addEventListener('click', () => { for (const [field, value] of Object.entries(defaults)) $(field).value = value; standardHeight = defaults.height; needsCameraReset = true; generate(); });
$('fit-button').addEventListener('click', () => viewer?.fit());
$('top-button').addEventListener('click', () => viewer?.top());
$('back-button').addEventListener('click', () => viewer?.back());
$('view-back-button').addEventListener('click', () => viewer?.back());
$('grid-button').addEventListener('click', () => { const enabled = viewer?.toggleGrid() ?? false; $('grid-button').setAttribute('aria-pressed', String(enabled)); });

async function loadExample() {
  const token = beginUpload();
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}example.svg`);
    if (!response.ok) throw new Error('示例图案未能加载，你可以直接上传自己的 SVG。');
    await loadSVG(await response.text(), '示例徽章.svg', token);
  } catch (error) {
    if (token !== uploadId) return;
    clearPreview(); status('error', '等待上传'); feedback([error.message], true);
  }
}
$('example-button').addEventListener('click', loadExample);

async function download(kind) {
  if (!result) return;
  const snapshot = result, savedName = filename;
  const exportParts = isEnglish() ? snapshot.parts.map((part, i) => ({ ...part, name: i === 0 ? 'White backing' : `Artwork ${i} ${part.color}` })) : snapshot.parts;
  const suffix = isEnglish() ? 'badge' : '徽章';
  setExportEnabled(false); status('loading', '准备下载');
  await new Promise(resolve => setTimeout(resolve, 0));
  try {
    if (kind === 'stl') downloadFile(exportSTL(snapshot.mergedMesh, savedName), `${savedName}-${suffix}.stl`, 'model/stl');
    if (kind === '3mf') downloadFile(export3MF(exportParts, savedName), `${savedName}-${suffix}.3mf`, 'model/3mf');
    if (kind === 'scad') downloadFile(exportSCAD(exportParts, savedName), `${savedName}-${suffix}.scad`, 'text/plain;charset=utf-8');
    if (result === snapshot) status('ready', `${kind.toUpperCase()} 已导出`);
  } catch (error) { status('error', '导出失败'); feedback([error.message], true); }
  finally { if (result) setExportEnabled(true); }
}
for (const button of document.querySelectorAll('[data-export]')) button.addEventListener('click', () => download(button.dataset.export));
function configNotice(message, error = false) {
  $('config-notice').hidden = false;
  $('config-notice').textContent = message;
  $('config-notice').classList.toggle('error', error);
}
$('export-config').addEventListener('click', () => {
  try {
    const settings = parameters();
    if (['logo', 'hexagon'].includes(settings.shape)) settings.height = Number(standardHeight);
    downloadFile(new TextEncoder().encode(serializeSettings(settings)), 'badge-settings.json', 'application/json');
    configNotice('配置已导出，可用于后续徽章。');
  } catch (error) { configNotice(error.message, true); }
});
$('import-config').addEventListener('click', () => $('config-file').click());
$('config-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 32 * 1024) throw new Error('配置文件过大，请使用本工具导出的 JSON 文件。');
    const settings = parseSettings(await file.text());
    // Validate the full file before changing any controls; SVG stays untouched.
    for (const field of numericFields) $(field).value = settings[field];
    $('shape').value = settings.shape; previousShape = settings.shape; standardHeight = settings.height;
    $('magnetEnabled').checked = settings.magnetEnabled; setMode(settings.mode);
    needsCameraReset = true; syncShapeControls(); schedule();
    configNotice('配置已导入，当前图案将使用这套设置。');
  } catch (error) { configNotice(error.message, true); }
  finally { event.target.value = ''; }
});
window.addEventListener('beforeunload', () => { worker.terminate(); viewer?.dispose(); if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl); });
loadExample();
