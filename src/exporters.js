import { zipSync, strToU8 } from 'fflate';

// Keep accidental giant downloads within a practical browser memory budget.
const MAX_TRIANGLES = 5_000_000;
const MAX_VERTICES = 5_000_000;
const CORE_NS = 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02';
const MATERIAL_NS = 'http://schemas.microsoft.com/3dmanufacturing/material/2015/02';

function validateMesh(mesh) {
  if (!mesh || !mesh.positions || !mesh.triangles) {
    throw new Error('模型缺少顶点或三角面数据。');
  }
  const { positions, triangles } = mesh;
  if (!positions.length || positions.length % 3 || !triangles.length || triangles.length % 3) {
    throw new Error('模型的顶点或三角面数据不完整。');
  }
  const vertexCount = positions.length / 3;
  const triangleCount = triangles.length / 3;
  if (vertexCount > MAX_VERTICES || triangleCount > MAX_TRIANGLES) {
    throw new Error('模型过大，请降低图案精度后导出。');
  }
  for (let i = 0; i < positions.length; i += 1) {
    if (!Number.isFinite(positions[i]) || Math.abs(positions[i]) > 1e6) {
      throw new Error('模型存在无效或超出范围的坐标。');
    }
  }
  for (let i = 0; i < triangles.length; i += 1) {
    if (!Number.isInteger(triangles[i]) || triangles[i] < 0 || triangles[i] >= vertexCount) {
      throw new Error('模型存在无效的三角面索引。');
    }
  }
  return { positions, triangles, vertexCount, triangleCount };
}

function xmlEscape(value) {
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizedColor(color) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) {
    throw new Error('部件颜色需要使用 #RRGGBB 格式。');
  }
  return `${color.toUpperCase()}FF`;
}

// Input must be the final union mesh. STL cannot retain part colors.
export function exportSTL(mesh, name = 'Badge') {
  const { positions, triangles, triangleCount } = validateMesh(mesh);
  const byteLength = 84 + triangleCount * 50;
  if (!Number.isSafeInteger(byteLength) || byteLength > 0x7fffffff) {
    throw new Error('STL 文件过大，无法在浏览器中导出。');
  }
  const result = new Uint8Array(byteLength);
  const view = new DataView(result.buffer);
  const header = strToU8(`SVG Badge Generator | ${String(name).replace(/[^\x20-\x7e]/g, '_')}`);
  result.set(header.subarray(0, 80));
  view.setUint32(80, triangleCount, true);
  let offset = 84;

  for (let face = 0; face < triangles.length; face += 3) {
    const a = triangles[face] * 3;
    const b = triangles[face + 1] * 3;
    const c = triangles[face + 2] * 3;
    const ux = positions[b] - positions[a];
    const uy = positions[b + 1] - positions[a + 1];
    const uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a];
    const vy = positions[c + 1] - positions[a + 1];
    const vz = positions[c + 2] - positions[a + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const length = Math.hypot(nx, ny, nz);
    view.setFloat32(offset, length ? nx / length : 0, true);
    view.setFloat32(offset + 4, length ? ny / length : 0, true);
    view.setFloat32(offset + 8, length ? nz / length : 0, true);
    offset += 12;
    for (const vertex of [a, b, c]) {
      view.setFloat32(offset, positions[vertex], true);
      view.setFloat32(offset + 4, positions[vertex + 1], true);
      view.setFloat32(offset + 8, positions[vertex + 2], true);
      offset += 12;
    }
    view.setUint16(offset, 0, true);
    offset += 2;
  }
  return result;
}

// Each part is a closed physical volume in the same coordinate system.
// A single component assembly preserves their placement as one badge.
export function export3MF(parts, name = 'Badge') {
  if (!Array.isArray(parts) || parts.length === 0 || parts.length > 256) {
    throw new Error('3MF 导出需要 1 至 256 个有效部件。');
  }
  const checked = parts.map((part, index) => ({
    name: part.name || `Part ${index + 1}`,
    color: normalizedColor(part.color),
    mesh: validateMesh(part.mesh),
  }));
  const totalTriangles = checked.reduce((sum, part) => sum + part.mesh.triangleCount, 0);
  const totalVertices = checked.reduce((sum, part) => sum + part.mesh.vertexCount, 0);
  if (totalTriangles > MAX_TRIANGLES || totalVertices > MAX_VERTICES) {
    throw new Error('3MF 模型过大，请降低图案精度后导出。');
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<model unit="millimeter" xml:lang="en-US" xmlns="${CORE_NS}" xmlns:m="${MATERIAL_NS}" recommendedextensions="m">`,
    '<metadata name="Application">SVG Badge Generator</metadata>',
    `<metadata name="Title">${xmlEscape(name)}</metadata>`,
    '<resources><m:colorgroup id="1">',
  ];
  for (const part of checked) xml.push(`<m:color color="${part.color}"/>`);
  xml.push('</m:colorgroup>');

  for (let partIndex = 0; partIndex < checked.length; partIndex += 1) {
    const part = checked[partIndex];
    const { positions, triangles } = part.mesh;
    xml.push(`<object id="${partIndex + 2}" type="model" name="${xmlEscape(part.name)}" pid="1" pindex="${partIndex}"><mesh><vertices>`);
    for (let i = 0; i < positions.length; i += 3) {
      xml.push(`<vertex x="${positions[i]}" y="${positions[i + 1]}" z="${positions[i + 2]}"/>`);
    }
    xml.push('</vertices><triangles>');
    for (let i = 0; i < triangles.length; i += 3) {
      xml.push(`<triangle v1="${triangles[i]}" v2="${triangles[i + 1]}" v3="${triangles[i + 2]}" pid="1" p1="${partIndex}" p2="${partIndex}" p3="${partIndex}"/>`);
    }
    xml.push('</triangles></mesh></object>');
  }

  const assemblyId = checked.length + 2;
  xml.push(`<object id="${assemblyId}" type="model" name="${xmlEscape(name)}"><components>`);
  for (let i = 0; i < checked.length; i += 1) {
    xml.push(`<component objectid="${i + 2}"/>`);
  }
  xml.push(`</components></object></resources><build><item objectid="${assemblyId}"/></build></model>`);

  const contentTypes = '<?xml version="1.0" encoding="UTF-8"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>'
    + '</Types>';
  const relationships = '<?xml version="1.0" encoding="UTF-8"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model"/>'
    + '</Relationships>';

  return zipSync({
    '[Content_Types].xml': strToU8(contentTypes),
    '_rels/.rels': strToU8(relationships),
    '3D/3dmodel.model': strToU8(xml.join('')),
  }, { level: 6 });
}

export function downloadFile(data, filename, mime = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = String(filename).replace(/[\\/:*?"<>|]/g, '_');
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
