import Module from 'manifold-3d';
import wasmUrl from 'manifold-3d/manifold.wasm?url';

const EPSILON = 0.01;
const ANCHOR = 0.15;
const COLOR_STEP = 0.2;
const MAX_COLORS = 16;
const MAX_TRIANGLES = 1_000_000;
const MAX_POINTS = 250_000;
const AREA_EPSILON = 1e-7;
const SEGMENTS = 64;

let modulePromise;

/** Load the geometry engine once. No files are sent to a server. */
export function initializeModeler() {
  if (!modulePromise) {
    modulePromise = Module({ locateFile: () => wasmUrl })
      .then((module) => {
        module.setup();
        return module;
      })
      .catch((error) => {
        modulePromise = undefined;
        throw error;
      });
  }
  return modulePromise;
}

function numberInRange(value, min, max, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${label}应在 ${min}～${max} 毫米之间。`);
  }
  return number;
}

function readParameters(params) {
  const shape = params.shape ?? 'rect';
  const mode = params.mode ?? 'multi';
  const backingEnabled = params.backingEnabled !== false;
  const magnetEnabled = backingEnabled && params.magnetEnabled === true;
  const magnetPoints = params.magnetPoints ?? [[.5, .5]];
  if (!Array.isArray(magnetPoints) || magnetPoints.length > 8 || magnetPoints.some(p =>
      !Array.isArray(p) || p.length !== 2 || p.some(v => !Number.isFinite(v) || v < 0 || v > 1))) {
    throw new Error('磁铁位置无效，请重新选点。');
  }
  if (magnetEnabled && magnetPoints.length === 0) throw new Error('请添加至少一个磁铁位置，或关闭磁铁槽。');
  if (!['rect', 'hexagon', 'puzzle', 'logo'].includes(shape)) {
    throw new Error('徽章外形选项无效。');
  }
  if (!['single', 'multi'].includes(mode)) {
    throw new Error('请选择单色或多色。');
  }
  const values = {
    shape,
    mode,
    backingEnabled,
    magnetEnabled,
    magnetPoints,
    keyringEnabled: params.keyringEnabled === true,
    keyringPosition: params.keyringPosition ?? 'auto',
    keyringDiameter: params.keyringEnabled ? numberInRange(params.keyringDiameter ?? 4, 1, 20, '钥匙扣孔径') : 4,
    keyringX: params.keyringEnabled && params.keyringPosition === 'custom' ? numberInRange(params.keyringX ?? 0,-300,300,'孔中心 X') : 0,
    keyringY: params.keyringEnabled && params.keyringPosition === 'custom' ? numberInRange(params.keyringY ?? 0,-300,300,'孔中心 Y') : 0,
    magnetDiameter: magnetEnabled ? numberInRange(params.magnetDiameter ?? 6, 2, 30, '磁铁直径') : 6,
    magnetThickness: magnetEnabled ? numberInRange(params.magnetThickness ?? 2, 0.5, 10, '磁铁厚度') : 2,
    width: numberInRange(params.width ?? 40, 5, 300, '徽章宽度'),
    height: !backingEnabled || shape === 'logo' || shape === 'hexagon' ? 40 : numberInRange(params.height ?? 40, 5, 300, '徽章长度（Y）'),
    baseThickness: backingEnabled ? numberInRange(params.baseThickness ?? 3, 0.5, 50, '底座厚度') : 0,
    cornerRadius: !backingEnabled || shape === 'logo' ? 0 : numberInRange(params.cornerRadius ?? 3, 0, 50, '圆角'),
    margin: backingEnabled ? numberInRange(params.margin ?? 4, 0.1, 50, '图案留边') : 0,
    reliefHeight: numberInRange(params.reliefHeight ?? 1, 0.2, 50, '图案凸起高度'),
    puzzleClearance: backingEnabled && shape === 'puzzle' ? numberInRange(params.puzzleClearance ?? 0.2, 0.05, 0.6, '拼图间隙') : 0.2,
  };
  if (shape === 'hexagon') values.height = values.width * Math.sqrt(3) / 2;
  if (backingEnabled && shape === 'puzzle' && Math.min(values.width, values.height) < 25) {
    throw new Error('拼图徽章的宽度和高度都至少需要 25 毫米。');
  }
  return values;
}

function canonicalColor(value) {
  const color = String(value).trim();
  const short = /^#([0-9a-f]{3})$/i.exec(color);
  if (short) return `#${[...short[1]].map((part) => part + part).join('').toUpperCase()}`;
  if (/^#[0-9a-f]{6}$/i.test(color)) return color.toUpperCase();
  throw new Error('SVG 中的颜色未转换为实色，请重新导入图案。');
}

function validatedContours(contours, pointCounter) {
  if (!Array.isArray(contours)) throw new Error('SVG 轮廓数据无效。');
  const result = [];
  for (const contour of contours) {
    if (!Array.isArray(contour)) throw new Error('SVG 轮廓数据无效。');
    const points = [];
    for (const vertex of contour) {
      if (!Array.isArray(vertex) || vertex.length < 2 ||
          !Number.isFinite(vertex[0]) || !Number.isFinite(vertex[1])) {
        throw new Error('SVG 包含无效的轮廓坐标。');
      }
      pointCounter.count += 1;
      if (pointCounter.count > MAX_POINTS) {
        throw new Error('SVG 路径过于复杂，请先简化路径后重新上传。');
      }
      const previous = points.at(-1);
      if (!previous || previous[0] !== vertex[0] || previous[1] !== vertex[1]) {
        points.push([vertex[0], vertex[1]]);
      }
    }
    if (points.length > 1 && points[0][0] === points.at(-1)[0] &&
        points[0][1] === points.at(-1)[1]) {
      points.pop();
    }
    if (points.length >= 3) result.push(points);
  }
  return result;
}

/** Copy and weld geometry using Manifold's authoritative vertex merge map. */
function copyMesh(solid, label) {
  const status = solid.status();
  if (status !== 'NoError') throw new Error(`${label}生成失败：${status}。`);
  if (solid.isEmpty()) throw new Error(`${label}为空，请调整尺寸或图案留边。`);
  const mesh = solid.getMesh();
  const triangleCount = mesh.triVerts.length / 3;
  if (triangleCount > MAX_TRIANGLES) {
    throw new Error('模型超过一百万个三角面，请简化 SVG 路径。');
  }
  const count = mesh.vertProperties.length / mesh.numProp;
  const parent = new Uint32Array(count);
  for (let i = 0; i < count; i += 1) parent[i] = i;
  function root(index) {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  }
  const mergeFrom = mesh.mergeFromVert ?? new Uint32Array();
  const mergeTo = mesh.mergeToVert ?? new Uint32Array();
  if (mergeFrom.length !== mergeTo.length) throw new Error(`${label}的顶点合并数据不完整。`);
  for (let i = 0; i < mergeFrom.length; i += 1) {
    if (mergeFrom[i] >= count || mergeTo[i] >= count) {
      throw new Error(`${label}的顶点合并索引无效。`);
    }
    parent[root(mergeFrom[i])] = root(mergeTo[i]);
  }
  const reindex = new Map();
  const positions = [];
  const triangles = new Uint32Array(mesh.triVerts.length);
  for (let i = 0; i < mesh.triVerts.length; i += 1) {
    const original = root(mesh.triVerts[i]);
    if (!reindex.has(original)) {
      const offset = original * mesh.numProp;
      const position = [mesh.vertProperties[offset], mesh.vertProperties[offset + 1], mesh.vertProperties[offset + 2]];
      if (!position.every(Number.isFinite)) throw new Error(`${label}包含无效的模型坐标。`);
      reindex.set(original, positions.length / 3);
      positions.push(...position);
    }
    triangles[i] = reindex.get(original);
  }
  return { positions: new Float32Array(positions), triangles };
}

/**
 * Convert opaque SVG paint regions into touching, non-overlapping print parts.
 * All input geometry remains in browser memory. Intermediate WASM objects are
 * owned by this invocation and released even when an input is rejected.
 */
export async function buildBadge(artwork, params = {}) {
  const options = readParameters(params);
  if (!Array.isArray(artwork?.shapes) || artwork.shapes.length === 0) {
    throw new Error('SVG 中没有可生成的实色矢量路径。');
  }
  const { CrossSection, Manifold } = await initializeModeler();
  const owned = new Set();
  const keep = (object) => { owned.add(object); return object; };
  const keyringHole = support => {
    if (!options.keyringEnabled) return null;
    if (!['auto','custom'].includes(options.keyringPosition)) throw new Error('钥匙扣位置选项无效。');
    const radius = options.keyringDiameter / 2;
    let point = [options.keyringX, options.keyringY];
    if (options.keyringPosition === 'auto') {
      // Erode the actual material footprint, including its internal holes.
      // Its uppermost point provides clearance even on a concave logo.
      const inner = keep(support.offset(-radius-1.2, 'Round', 2, SEGMENTS));
      if (inner.isEmpty()) throw new Error('图案太窄，放不下钥匙扣孔，请减小孔径或增大尺寸。');
      const polygons = inner.toPolygons(), points = polygons.flat();
      for (const polygon of polygons) for (let i=0;i<polygon.length;i++) {
        const a=polygon[i], b=polygon[(i+1)%polygon.length];
        const t=b[0]===a[0] ? 0.5 : Math.max(0,Math.min(1,-a[0]/(b[0]-a[0])));
        points.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);
      }
      points.sort((a,b)=>b[1]-a[1] || Math.abs(a[0])-Math.abs(b[0]));
      point = points[0];
    }
    const wall = keep(keep(CrossSection.circle(radius+1,SEGMENTS)).translate(point));
    if (keep(wall.subtract(support)).area()>AREA_EPSILON) throw new Error('钥匙扣孔超出图案或距离边缘不足 1 mm，请调整孔位置或减小孔径。');
    return keep(keep(CrossSection.circle(radius,SEGMENTS)).translate(point));
  };
  // The 3.5.4 JavaScript polygon adapter reads contours[0].length, so an empty
  // polygon array cannot be passed to its constructor. A zero-size square is
  // the documented native empty constructor and bypasses that adapter.
  const empty = () => keep(CrossSection.square([0, 0], true));
  const warnings = Array.isArray(artwork.warnings) ? [...artwork.warnings] : [];
  const pointCounter = { count: 0 };
  const unionSections = (sections) => sections.length === 0 ? empty() : keep(CrossSection.union(sections));
  const round = (section, radius) => radius > 0
    ? keep(keep(section.offset(-radius, 'Miter', 2, SEGMENTS)).offset(radius, 'Round', 2, SEGMENTS))
    : section;

  try {
    const rasterMask = Array.isArray(artwork.silhouette)
      ? keep(new CrossSection(validatedContours(artwork.silhouette, pointCounter), 'NonZero')) : null;
    // SVG paints from back to front. Later shapes hide earlier regions even
    // when the later shape is white; white is never treated as transparency.
    let covered = empty();
    const visible = [];
    const coloredSources = [];
    for (let index = artwork.shapes.length - 1; index >= 0; index -= 1) {
      const shape = artwork.shapes[index];
      const color = canonicalColor(shape.color);
      const contours = validatedContours(shape.contours, pointCounter);
      if (contours.length === 0) continue;
      const fillRule = shape.fillRule === 'EvenOdd' ? 'EvenOdd' : 'NonZero';
      let section = keep(new CrossSection(contours, fillRule));
      if (rasterMask) section = keep(section.intersect(rasterMask));
      if (section.isEmpty()) continue;
      if (color !== '#FFFFFF') coloredSources.push(section);
      const painted = keep(section.subtract(covered));
      if (!painted.isEmpty() && painted.area() > AREA_EPSILON) visible.push({ color, section: painted, original: section });
      covered = keep(covered.add(section));
    }
    visible.reverse();
    if (visible.length === 0) throw new Error('SVG 中没有有面积的可见矢量图案。');

    let colorRegions;
    if (options.mode === 'single') {
      const colored = unionSections(coloredSources);
      // Detached white artwork (e.g. AWS letters) is positive geometry. White
      // shapes overlapping colored source artwork remain contrast/cutout regions.
      let positive = visible.filter(({ color, original }) => color !== '#FFFFFF' ||
        colored.isEmpty() || keep(original.intersect(colored)).area() <= AREA_EPSILON);
      // A white foreground may completely hide a colored background. Keep it
      // as relief rather than leaving a valid upload with no printable artwork.
      if (positive.length === 0) positive = visible;
      colorRegions = [{ color: '#000000', section: unionSections(positive.map(({ section }) => section)) }];
      if (positive.length !== visible.length) warnings.push('单色模式保留独立白色图案；与彩色图案重叠的白色区域作为留白。');
    } else {
      const groups = new Map();
      for (const { color, section } of visible) {
        if (!groups.has(color)) groups.set(color, []);
        groups.get(color).push(section);
      }
      if (groups.size > MAX_COLORS) {
        throw new Error(`图案含 ${groups.size} 种可见颜色；本工具最多支持 ${MAX_COLORS} 种，请先减少 SVG 颜色。`);
      }
      colorRegions = [...groups].map(([color, sections]) => ({ color, section: unionSections(sections) }));
      if (colorRegions.length > 1) {
        warnings.push('不同颜色之间自动增加 0.2 毫米高度差，便于使用单色 STL 时在切片软件中上色。');
      }
    }

    if (!options.backingEnabled) {
      const box = unionSections(colorRegions.map(({section})=>section)).bounds();
      const span = box.max[0]-box.min[0];
      if (span<=0) throw new Error('SVG 图案的宽度或高度为零。');
      const center = [(box.min[0]+box.max[0])/2,(box.min[1]+box.max[1])/2];
      let regions = colorRegions.map(({color,section})=>({color,section:keep(keep(section.translate(center.map(v=>-v))).scale(options.width/span))}));
      const hole = keyringHole(unionSections(regions.map(({section})=>section)));
      if (hole) regions = regions.map(({color,section})=>({color,section:keep(section.subtract(hole))})).filter(({section})=>!section.isEmpty() && section.area()>AREA_EPSILON);
      const solids = regions.map(({color,section},index)=>({
        color,name:options.mode==='single'?'黑色图案':`图案 ${index+1} ${color}`,
        solid:keep(section.extrude(options.reliefHeight+(options.mode==='multi'?index*COLOR_STEP:0))),
      }));
      const merged = keep(Manifold.union(solids.map(({solid})=>solid)));
      const parts = solids.map(({color,name,solid})=>({color,name,mesh:copyMesh(solid,name)}));
      const triangleCount = parts.reduce((sum,p)=>sum+p.mesh.triangles.length/3,0);
      if(triangleCount>MAX_TRIANGLES) throw new Error('模型超过一百万个三角面，请简化 SVG 路径。');
      const mergedMesh=copyMesh(merged,'完整徽章'), meshBox=merged.boundingBox();
      const bounds={min:[...meshBox.min],max:[...meshBox.max]};
      warnings.push('仅 Logo 模式不包含底壳和磁铁槽；分离的图案会作为独立部分导出。');
      return {parts,mergedMesh,bounds,warnings:[...new Set(warnings)],
        regionsForScad:regions.map(({color,section})=>({color,contours:section.toPolygons()})),
        stats:{backingEnabled:false,colorCount:regions.length,partCount:parts.length,triangleCount,
          mergedTriangleCount:mergedMesh.triangles.length/3,sourceShapes:artwork.shapes.length,
          baseThickness:0,reliefHeight:options.reliefHeight,
          reliefHeightMax:options.reliefHeight+(options.mode==='multi'?(regions.length-1)*COLOR_STEP:0),
          magnets:{count:0,diameter:0,depth:0,positions:[]},
          dimensions:bounds.max.map((v,i)=>v-bounds.min[i])}};
    }

    const jointScale = Math.min(options.width, options.height) / 40;
    const neck = 3 * jointScale;
    const headRadius = 2.5 * jointScale;
    const headCenter = 2.8 * jointScale;
    const puzzleDepth = headCenter + headRadius;
    const effectiveMargin = options.shape === 'puzzle'
      ? Math.max(options.margin, puzzleDepth + options.puzzleClearance + 1)
      : options.margin;
    const fitBox = [options.width - 2 * effectiveMargin, options.height - 2 * effectiveMargin];
    if (fitBox[0] < 0.1 || (options.shape !== 'logo' && fitBox[1] < 0.1)) {
      throw new Error('图案留边太大，图案已经放不下：请减小留边或增大徽章。');
    }

    const artworkBounds = unionSections(colorRegions.map(({ section }) => section)).bounds();
    const spanX = artworkBounds.max[0] - artworkBounds.min[0];
    const spanY = artworkBounds.max[1] - artworkBounds.min[1];
    if (spanX <= 0 || spanY <= 0) throw new Error('SVG 图案的宽度或高度为零。');
    let scale = Math.min(fitBox[0] / spanX, fitBox[1] / spanY);
    const center = [
      (artworkBounds.min[0] + artworkBounds.max[0]) / 2,
      (artworkBounds.min[1] + artworkBounds.max[1]) / 2,
    ];
    let logoOutline;
    if (options.shape === 'logo') {
      const raw = unionSections(colorRegions.map(({ section }) => section));
      const signedArea = contour => contour.reduce((sum, point, i) => {
        const next = contour[(i + 1) % contour.length];
        return sum + point[0] * next[1] - next[0] * point[1];
      }, 0);
      // Fill only interior holes in the backing. Preserve all outer concavities;
      // a convex hull previously replaced the logo with a rounded blob.
      const outers = raw.decompose().map(component => {
        keep(component);
        return component.toPolygons().sort((a, b) => Math.abs(signedArea(b)) - Math.abs(signedArea(a)))[0];
      }).filter(Boolean);
      const profile = keep(keep(new CrossSection(outers, 'NonZero')).translate([-center[0], -center[1]]));
      scale = (options.width - 2 * options.margin) / spanX;
      // Fit FINAL backing width, including the border. Uniform XY scale only;
      // the hidden Y input never limits a logo's requested width.
      for (let i = 0; i < 3; i += 1) {
        if (!Number.isFinite(scale) || scale <= 0) throw new Error('图案留边太大，图案已经放不下：请减小留边或增大徽章。');
        const expanded = keep(keep(profile.scale(scale)).offset(options.margin, 'Round', 2, SEGMENTS));
        // A small closing radius softens concave notches without shrinking the
        // support under the artwork; uniform width fitting still runs afterward.
        const softRadius = Math.min(0.35, options.margin / 3);
        logoOutline = keep(keep(expanded.offset(softRadius, 'Round', 2, SEGMENTS)).offset(-softRadius, 'Round', 2, SEGMENTS));
        const box = logoOutline.bounds();
        const correction = (options.width - (box.max[0] - box.min[0])) / spanX;
        if (Math.abs(correction * spanX) < 0.0001) break;
        if (i < 2) scale += correction;
      }
      const box = logoOutline.bounds();
      options.height = box.max[1] - box.min[1];
      const pieces = logoOutline.decompose();
      pieces.forEach(keep);
      if (pieces.length > 1) warnings.push('Logo 轮廓包含分离的底座区域；如需连成一体，请增大留边或改用矩形外形。');
    }
    const sourceColorRegions = colorRegions;
    colorRegions = colorRegions.map(({ color, section }) => ({
      color,
      section: keep(keep(section.translate([-center[0], -center[1]])).scale(scale)),
    }));
    const safeRadius = Math.min(options.cornerRadius, Math.min(options.width, options.height) / 4);

    let outline;
    if (options.shape === 'hexagon') {
      // Add the inradius consumed by rounding before the opening operation,
      // so the final opposite-vertex width still matches the requested width.
      const vertexWidth = options.width + 2 * safeRadius * (2 / Math.sqrt(3) - 1);
      const vertexHeight = vertexWidth * Math.sqrt(3) / 2;
      const vertices = [
        [-vertexWidth / 4, vertexHeight / 2], [vertexWidth / 4, vertexHeight / 2],
        [vertexWidth / 2, 0], [vertexWidth / 4, -vertexHeight / 2],
        [-vertexWidth / 4, -vertexHeight / 2], [-vertexWidth / 2, 0],
      ];
      outline = round(keep(new CrossSection([vertices], 'NonZero')), safeRadius);
    } else if (options.shape === 'logo') {
      outline = logoOutline;
    } else {
      outline = round(keep(CrossSection.square([options.width, options.height], true)), safeRadius);
      if (options.shape === 'puzzle') {
        const neckSection = keep(keep(CrossSection.square([headCenter + EPSILON, neck]))
          .translate([-EPSILON, -neck / 2]));
        const headSection = keep(keep(CrossSection.circle(headRadius, SEGMENTS)).translate([headCenter, 0]));
        const knob = keep(neckSection.add(headSection));
        const socket = keep(keep(knob.offset(options.puzzleClearance, 'Miter', 2, SEGMENTS)).mirror([1, 0]));
        const rightKnob = keep(knob.translate([options.width / 2, 0]));
        const topKnob = keep(keep(knob.rotate(90)).translate([0, options.height / 2]));
        const leftSocket = keep(keep(socket.rotate(180)).translate([-options.width / 2, 0]));
        const bottomSocket = keep(keep(socket.rotate(270)).translate([0, -options.height / 2]));
        outline = keep(unionSections([outline, rightKnob, topKnob]).subtract(unionSections([leftSocket, bottomSocket])));
      }
    }
    if (outline.isEmpty() || outline.area() <= AREA_EPSILON) {
      throw new Error('徽章底座外形为空，请减小圆角或调整徽章尺寸。');
    }

    if (options.shape==='hexagon') {
      // Fit the actual artwork into the actual inset hexagon. A fixed 72% box
      // left a wide border even when the requested clearance was only 1 mm.
      const inner = keep(outline.offset(-options.margin,'Round',2,SEGMENTS));
      if(inner.isEmpty()) throw new Error('图案留边太大，图案已经放不下：请减小留边或增大徽章。');
      const box=inner.bounds();
      const raw=keep(unionSections(sourceColorRegions.map(({section})=>section)).translate(center.map(v=>-v)));
      let low=0,high=Math.min((box.max[0]-box.min[0])/spanX,(box.max[1]-box.min[1])/spanY);
      for(let i=0;i<28;i++){
        const candidate=(low+high)/2;
        const outside=keep(keep(raw.scale(candidate)).subtract(inner));
        if(outside.area()<=AREA_EPSILON) low=candidate; else high=candidate;
      }
      colorRegions=sourceColorRegions.map(({color,section})=>({color,section:keep(keep(section.translate(center.map(v=>-v))).scale(low))}));
    }

    colorRegions = colorRegions.map(({ color, section }) => ({ color, section: keep(section.intersect(outline)) }))
      .filter(({ section }) => !section.isEmpty() && section.area() > AREA_EPSILON);
    if (colorRegions.length === 0) throw new Error('图案没有落在底座内，请调整图案留边。');

    // Cut the same through-hole from both the backing and all artwork layers.
    const hole = keyringHole(outline);
    if (hole) {
      outline = keep(outline.subtract(hole));
      colorRegions = colorRegions.map(({color,section})=>({color,section:keep(section.subtract(hole))})).filter(({section})=>!section.isEmpty() && section.area()>AREA_EPSILON);
      if (!colorRegions.length) throw new Error('钥匙扣孔移除了全部图案，请调整孔位置或减小孔径。');
    }

    const magnetDiameter = options.magnetDiameter, magnetThickness = options.magnetThickness;
    const magnetCount = options.magnetEnabled ? options.magnetPoints.length : 0;
    const pocketDiameter = magnetDiameter + 0.3;
    const pocketDepth = magnetThickness + 0.1;
    const baseHeight = magnetCount > 0
      ? Math.max(options.baseThickness, pocketDepth + 0.5 + ANCHOR)
      : options.baseThickness;
    const outlineBox = outline.bounds();
    const magnetPositions = options.magnetEnabled ? options.magnetPoints.map(([u, v]) => [
      outlineBox.min[0] + u * (outlineBox.max[0] - outlineBox.min[0]),
      outlineBox.min[1] + v * (outlineBox.max[1] - outlineBox.min[1]),
    ]) : [];

    let base = keep(outline.extrude(baseHeight));
    for (const [index, [x, y]] of magnetPositions.entries()) {
      for (let other = 0; other < index; other++) {
        if (Math.hypot(x-magnetPositions[other][0], y-magnetPositions[other][1]) < pocketDiameter + .5) {
          throw new Error(`${index + 1} 号与 ${other + 1} 号磁铁槽太近，请重新选点。`);
        }
      }
      // Keep at least a 0.5 mm side wall, including on irregular logo bases.
      const wallCircle = keep(keep(CrossSection.circle(pocketDiameter / 2 + 0.5, SEGMENTS)).translate([x, y]));
      if (keep(wallCircle.subtract(outline)).area() > AREA_EPSILON) {
        throw new Error(`${index + 1} 号磁铁槽超出底壳或距离边缘不足 0.5 mm，请重新选点或减小直径。`);
      }
      const pocket = keep(keep(Manifold.cylinder(pocketDepth + EPSILON, pocketDiameter / 2,
        pocketDiameter / 2, SEGMENTS)).translate([x, y, -EPSILON]));
      base = keep(base.subtract(pocket));
    }

    const colorSolids = colorRegions.map(({ color, section }, index) => ({
      name: options.mode === 'single' ? '黑色图案' : `图案 ${index + 1} ${color}`,
      color,
      solid: keep(keep(section.extrude(ANCHOR + options.reliefHeight +
        (options.mode === 'multi' ? index * COLOR_STEP : 0)))
        .translate([0, 0, baseHeight - ANCHOR])),
    }));
    const artworkSolid = keep(Manifold.union(colorSolids.map(({ solid }) => solid)));
    base = keep(base.subtract(artworkSolid));
    const allSolids = [base, ...colorSolids.map(({ solid }) => solid)];
    const merged = keep(Manifold.union(allSolids));
    const parts = [{ name: '白色底座', color: '#FFFFFF', mesh: copyMesh(base, '底座') },
      ...colorSolids.map(({ name, color, solid }) => ({ name, color, mesh: copyMesh(solid, name) }))];
    const triangleCount = parts.reduce((sum, part) => sum + part.mesh.triangles.length / 3, 0);
    if (triangleCount > MAX_TRIANGLES) throw new Error('模型超过一百万个三角面，请简化 SVG 路径。');
    const mergedMesh = copyMesh(merged, '完整徽章');
    const meshBounds = merged.boundingBox();
    const bounds = { min: [...meshBounds.min], max: [...meshBounds.max] };
    const regionsForScad = colorRegions.map(({ color, section }) => ({
      color,
      contours: section.toPolygons().map((contour) => contour.map((point) => [point[0], point[1]])),
    }));
    if (baseHeight > options.baseThickness + 1e-6) {
      warnings.push(`为容纳磁铁槽并保留顶层，底座已自动加厚到 ${baseHeight.toFixed(2)} 毫米。`);
    }
    return {
      parts,
      mergedMesh,
      bounds,
      regionsForScad,
      warnings: [...new Set(warnings)],
      stats: {
        backingEnabled: true,
        colorCount: colorRegions.length,
        partCount: parts.length,
        triangleCount,
        mergedTriangleCount: mergedMesh.triangles.length / 3,
        sourceShapes: artwork.shapes.length,
        baseThickness: baseHeight,
        reliefHeight: options.reliefHeight,
        reliefHeightMax: options.reliefHeight + (options.mode === 'multi' ? (colorRegions.length - 1) * COLOR_STEP : 0),
        magnets: { count: magnetCount, diameter: magnetCount ? pocketDiameter : 0, depth: magnetCount ? pocketDepth : 0, positions: magnetPositions },
        dimensions: bounds.max.map((value, index) => value - bounds.min[index]),
      },
    };
  } finally {
    for (const object of [...owned].reverse()) object.delete();
  }
}
