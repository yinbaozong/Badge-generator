# SVG import regression checks

Run `npm ci` and `npm run dev`, then open `/tests/svg-strokes.html` on the local development server. All checks should pass. The page uses the real browser XML/color parsers, SVGLoader and Manifold geometry engine; no additional test dependencies are needed.

Checks cover fill/stroke paint order, stroke-only artwork, invisible strokes, round caps, inherited styles, uniform/non-uniform transforms, existing fill holes, unsafe SVG rejection, and watertight ring geometry with an open center. These test pages are not included in the production Vite build.
