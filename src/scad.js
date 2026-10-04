const decimal = n => { if (!Number.isFinite(n)) throw new Error('模型坐标无效。'); return Number(n.toFixed(7)); };

/** A snapshot of the current printable model, with explicit per-part colors. */
export function exportSCAD(parts, name) {
  const safeName = String(name)
    .replace(/[\r\n\u2028\u2029]/g, ' ')
    .replace(/\*\//g, '* /')
    .replace(/\/\*/g, '/ *');
  const lines = [
    '/*', '  SVG 徽章生成器：当前模型快照', `  图案：${safeName}`, '  单位：毫米。色块与几何已内置，可粘贴到MakerWorld。',
    '  尺寸、外形、磁铁槽等设置在生成网页中调整后重新导出。', '*/', '',
    '/* [整体缩放] */', '// 100为原始尺寸；整体缩放也会改变磁铁槽尺寸', 'scale_percent = 100; // [25:1:200]', '', '/* [Hidden] */', '',
  ];
  parts.forEach((part, index) => {
    if (!/^#[0-9a-f]{6}$/i.test(part.color)) throw new Error('部件颜色格式无效。');
    lines.push(`module part_${index}() {`, '  polyhedron(points=[');
    for (let i = 0; i < part.mesh.positions.length; i += 3) lines.push(`    [${decimal(part.mesh.positions[i])},${decimal(part.mesh.positions[i + 1])},${decimal(part.mesh.positions[i + 2])}]${i + 3 < part.mesh.positions.length ? ',' : ''}`);
    // Manifold/3MF use outward CCW triangles; OpenSCAD polyhedron faces use
    // the opposite winding (clockwise when viewed from outside).
    lines.push('  ], faces=[');
    for (let i = 0; i < part.mesh.triangles.length; i += 3) lines.push(`    [${part.mesh.triangles[i]},${part.mesh.triangles[i + 2]},${part.mesh.triangles[i + 1]}]${i + 3 < part.mesh.triangles.length ? ',' : ''}`);
    lines.push('  ], convexity=20);', '}', '');
  });
  parts.forEach((part, index) => lines.push(`color("${part.color}") scale(scale_percent/100) part_${index}();`));
  lines.push('', '// END OF FILE');
  return new TextEncoder().encode(lines.join('\n'));
}
