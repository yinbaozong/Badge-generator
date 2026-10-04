export const DEFAULTS = {
  width: 40, height: 40, baseThickness: 3, cornerRadius: 3,
  margin: 4, reliefHeight: 1, puzzleClearance: 0.2,
  magnetDiameter: 6, magnetThickness: 2,
};
const ranges = {
  width: [15, 150], height: [15, 150], baseThickness: [1.5, 20],
  cornerRadius: [0, 15], margin: [0.5, 20], reliefHeight: [0.2, 20],
  puzzleClearance: [0.05, 0.6], magnetDiameter: [2, 30], magnetThickness: [0.5, 10],
};
export function validateSettings(input) {
  const invalid = () => { throw new Error('配置文件无效，请使用本工具导出的 JSON 文件。'); };
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalid();
  if (!['rect', 'hexagon', 'puzzle', 'logo'].includes(input.shape) ||
      !['single', 'multi'].includes(input.mode) || typeof input.magnetEnabled !== 'boolean') invalid();
  const settings = { shape: input.shape, mode: input.mode, magnetEnabled: input.magnetEnabled };
  for (const [key, [min, max]] of Object.entries(ranges)) {
    const value = input[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) invalid();
    settings[key] = value;
  }
  const points = input.magnetPoints ?? [[.5, .5]];
  if (!Array.isArray(points) || points.length > 8 || points.some(p =>
      !Array.isArray(p) || p.length !== 2 || p.some(v => typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1))) invalid();
  settings.magnetPoints = points.map(p => [...p]);
  if (settings.shape === 'puzzle' && Math.min(settings.width, settings.height) < 25) invalid();
  return settings;
}
export function serializeSettings(input) {
  return JSON.stringify({ format: 'svg-badge-settings', version: 2, settings: validateSettings(input) }, null, 2);
}
export function parseSettings(text) {
  let file;
  try { file = JSON.parse(text); } catch { throw new Error('配置文件无效，请使用本工具导出的 JSON 文件。'); }
  if (!file || file.format !== 'svg-badge-settings') throw new Error('配置文件无效，请使用本工具导出的 JSON 文件。');
  if (![1, 2].includes(file.version)) throw new Error('配置文件版本不支持。');
  return validateSettings(file.settings);
}
