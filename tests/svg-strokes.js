import { parseArtwork } from '../src/svg.js';
import { buildBadge } from '../src/model.js';

const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`;
const checks = [];
function assert(condition, message) { if (!condition) throw new Error(message); }
function bounds(shape) {
  const points = shape.contours.flat();
  return [Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1])),
    Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))];
}
async function check(name, run) {
  try { await run(); checks.push({ name, passed: true }); }
  catch (error) { checks.push({ name, passed: false, error: error.message }); }
}
await check('Filled path with outline keeps both colors and stroke dimensions', () => {
  const result = parseArtwork(svg('<path fill="#cc0000" stroke="black" stroke-width="4" d="M10 10H30V30H10Z"/>'));
  assert(result.shapes.length === 2, 'Expected fill followed by stroke');
  assert(result.shapes[0].color === '#CC0000' && result.shapes[1].color === '#000000', 'Paint order or colors changed');
  const fill = bounds(result.shapes[0]), stroke = bounds(result.shapes[1]);
  assert(Math.abs((fill[2] - fill[0]) / (stroke[2] - stroke[0]) - 20 / 24) < .001, 'Stroke width lost');
});
await check('Open stroke-only line produces area and round caps', () => {
  const result = parseArtwork(svg('<path fill="none" stroke="#123456" stroke-width="10" stroke-linecap="round" d="M20 50H80"/>'));
  assert(result.shapes.length === 1 && result.shapes[0].color === '#123456', 'Stroke-only artwork missing');
  const box = bounds(result.shapes[0]);
  assert(Math.abs((box[3] - box[1]) / (box[2] - box[0]) - 10 / 70) < .005, 'Round caps incorrect');
});
await check('Transparent and zero-width outlines do not reject the fill', () => {
  for (const attrs of ['stroke="black" stroke-opacity="0"', 'stroke="transparent"', 'stroke="black" stroke-width="0"']) {
    const result = parseArtwork(svg(`<rect x="10" y="10" width="40" height="40" fill="red" ${attrs}/>`));
    assert(result.shapes.length === 1, 'Invisible stroke became geometry');
  }
});
await check('Inherited stroke and uniform transforms retain their proportions', () => {
  const result = parseArtwork(svg('<g transform="translate(10 20) scale(2)" fill="none" stroke="blue" stroke-width="4"><path d="M0 0H20"/></g>'));
  const box = bounds(result.shapes[0]);
  assert(Math.abs((box[3] - box[1]) / (box[2] - box[0]) - .2) < .001, 'Transformed stroke width incorrect');
});
await check('Non-uniform scaling transforms the stroke outline, not only its width', () => {
  const result = parseArtwork(svg('<path transform="scale(2 3)" fill="none" stroke="blue" stroke-width="4" d="M0 0H20"/>'));
  const box = bounds(result.shapes[0]);
  assert(Math.abs((box[3] - box[1]) / (box[2] - box[0]) - 12 / 40) < .001, 'Non-uniform transform distorted the outline');
});
await check('Later fill still paints over an earlier outline', () => {
  const result = parseArtwork(svg('<rect x="10" y="10" width="40" height="40" fill="red" stroke="black"/><rect x="20" y="20" width="40" height="40" fill="blue"/>'));
  assert(result.shapes.map(s => s.color).join(',') === '#FF0000,#000000,#0000FF', 'SVG paint order changed');
});
await check('Existing fill-only SVG holes and unsafe-content rejection stay intact', () => {
  const result = parseArtwork(svg('<path fill-rule="evenodd" d="M0 0H80V80H0Z M20 20H60V60H20Z"/>'));
  assert(result.shapes.length === 1 && result.shapes[0].fillRule === 'EvenOdd' && result.shapes[0].contours.length === 2, 'Fill hole changed');
  let rejected = false;
  try { parseArtwork(svg('<script>alert(1)</script>')); } catch { rejected = true; }
  assert(rejected, 'Unsafe SVG allowed');
});
await check('Closed stroke-only ring builds a printable model with its center open', async () => {
  const artwork = parseArtwork(svg('<rect x="20" y="20" width="60" height="60" fill="none" stroke="red" stroke-width="8"/>'));
  const result = await buildBadge(artwork, { backingEnabled: false, width: 40, reliefHeight: 2, mode: 'multi' });
  assert(result.parts?.length > 0, 'No printable stroke part');
  const mesh = result.mergedMesh;
  const edges = new Map();
  for (let i = 0; i < mesh.triangles.length; i += 3) {
    const ids = Array.from(mesh.triangles.slice(i, i + 3));
    const [a, b, c] = ids.map(id => Array.from(mesh.positions.slice(id * 3, id * 3 + 3)));
    // A top or bottom triangle covering the origin would fill the ring's hole.
    if (Math.abs(a[2] - b[2]) < 1e-6 && Math.abs(a[2] - c[2]) < 1e-6) {
      const sides = [[a,b],[b,c],[c,a]].map(([p,q]) => (q[0]-p[0]) * -p[1] - (q[1]-p[1]) * -p[0]);
      assert(!(sides.every(v => v >= 0) || sides.every(v => v <= 0)), 'Stroke center hole filled');
    }
    for (let j = 0; j < 3; j++) {
      const key = [ids[j], ids[(j + 1) % 3]].sort((a,b) => a-b).join(',');
      edges.set(key, (edges.get(key) || 0) + 1);
    }
  }
  assert([...edges.values()].every(count => count === 2), 'Stroke mesh is not watertight');
});
await check('Repeated backing offsets clean redundant vertices without changing size or colors', async () => {
  const artwork = parseArtwork(svg('<path d="M10 10H45V70H10Z" fill="red" stroke="red" stroke-width="0.25" stroke-linejoin="round"/><path d="M55 20H90V65H55Z" fill="blue" stroke="blue" stroke-width="0.25" stroke-linejoin="round"/>'));
  const start = performance.now();
  const result = await buildBadge(artwork, { shape:'logo', width:40, margin:4, mode:'multi' });
  assert(performance.now()-start < 5000, 'Small logo outline exceeded 5 second budget');
  assert(Math.abs(result.stats.dimensions[0]-40) < .01, 'Final backing width changed');
  assert(result.parts.some(p=>p.color==='#FF0000') && result.parts.some(p=>p.color==='#0000FF'), 'Artwork color was lost');
  assert(result.stats.mergedTriangleCount < 5000, 'Redundant offset vertices inflated the mesh');
});
document.getElementById('results').textContent = JSON.stringify({ passed: checks.filter(c => c.passed).length, total: checks.length, checks }, null, 2);
