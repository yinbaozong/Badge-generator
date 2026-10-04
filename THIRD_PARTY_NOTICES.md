# Third-party notices

This application includes the following open-source components. Their complete license texts are distributed in public/licenses and copied into dist/licenses by the build.

| Component | Version | License | Project |
| --- | --- | --- | --- |
| Manifold / manifold-3d | 3.5.4 | Apache-2.0 | https://github.com/elalish/manifold |
| Three.js | 0.186.1 | MIT | https://github.com/mrdoob/three.js |
| fflate | 0.8.3 | MIT | https://github.com/101arrowz/fflate |

Manifold is used as its unmodified npm WebAssembly distribution. Three.js supplies SVG path parsing and the preview. fflate supplies ZIP packaging for 3MF. The application does not imply endorsement by their authors.

Vite 8.3.2 is a development/build dependency licensed under MIT. Its upstream license and dependency notices are available in node_modules/vite/LICENSE.md after npm ci.

3MF is implemented from the published Core and Materials specifications:
- https://github.com/3MFConsortium/spec_core
- https://github.com/3MFConsortium/spec_materials

Redistributors must retain the applicable license files. The project LICENSE applies only to this project's original code and example SVG.
