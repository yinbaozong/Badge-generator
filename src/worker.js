import { buildBadge } from './model.js';

self.onmessage = async ({ data }) => {
  const { id, artwork, params } = data;
  try {
    const result = await buildBadge(artwork, params);
    const buffers = new Set();
    for (const part of result.parts) {
      buffers.add(part.mesh.positions.buffer);
      buffers.add(part.mesh.triangles.buffer);
    }
    buffers.add(result.mergedMesh.positions.buffer);
    buffers.add(result.mergedMesh.triangles.buffer);
    self.postMessage({ id, result }, [...buffers]);
  } catch (error) {
    self.postMessage({ id, error: error.message || String(error) });
  }
};
