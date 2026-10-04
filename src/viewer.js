import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

export function createViewer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 2000);
  camera.up.set(0, 1, 0);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .08;
  controls.maxPolarAngle = Math.PI * .98;
  controls.minDistance = 5;
  controls.maxDistance = 1500;
  const group = new THREE.Group();
  group.rotation.x = -Math.PI / 2;
  scene.add(group);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc1c5cd, 1.1));
  scene.add(new THREE.AmbientLight(0xffffff, .25));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-70, 150, 90);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -150;
  key.shadow.camera.right = key.shadow.camera.top = 150;
  key.shadow.camera.near = .1; key.shadow.camera.far = 500;
  key.shadow.normalBias = .04;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe8ff, .9);
  fill.position.set(90, 50, -100);
  scene.add(fill);
  // Camera-side illumination also lights recessed floors when viewing below.
  const inspectionLight = new THREE.DirectionalLight(0xffffff, 1.25);
  camera.add(inspectionLight);
  scene.add(camera, inspectionLight.target);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.ShadowMaterial({ color: 0x334037, opacity: .13 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.03;
  ground.receiveShadow = true;
  scene.add(ground);
  const grid = new THREE.GridHelper(300, 30, 0xbfc5b9, 0xd9ded3);
  grid.position.y = -.02;
  grid.material.transparent = true;
  grid.material.opacity = .55;
  grid.visible = false;
  scene.add(grid);
  let gridEnabled = false;
  let currentBox = null;
  function syncInspectionView() {
    const back = camera.position.y < controls.target.y;
    ground.visible = !back;
    grid.visible = gridEnabled && !back;
    inspectionLight.target.position.copy(controls.target);
  }
  function resize() {
    const width = Math.max(1, container.clientWidth), height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  function fit(view = 'front') {
    if (!currentBox) return;
    const center = currentBox.getCenter(new THREE.Vector3());
    const size = currentBox.getSize(new THREE.Vector3());
    const extent = Math.max(size.x, size.z, size.y * 2);
    const distance = extent / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.55 / Math.min(1, camera.aspect);
    const direction = view === 'top' ? new THREE.Vector3(0, 1, .0001)
      : view === 'back' ? new THREE.Vector3(.35, -1, .55).normalize()
        : view === 'current' ? camera.position.clone().sub(controls.target).normalize()
          : new THREE.Vector3(.7, 1.05, 1.35).normalize();
    camera.position.copy(center).addScaledVector(direction, distance);
    controls.target.copy(center);
    camera.near = Math.max(.05, distance / 500);
    camera.far = Math.max(1500, distance * 20);
    camera.updateProjectionMatrix();
    controls.update();
    syncInspectionView();
  }
  function disposeObject(object) {
    object.traverse(child => {
      child.geometry?.dispose();
      if (Array.isArray(child.material)) child.material.forEach(material => material.dispose());
      else child.material?.dispose();
    });
  }
  function clearModel() {
    for (const child of [...group.children]) {
      disposeObject(child);
      group.remove(child);
    }
    currentBox = null;
    container.classList.remove('has-model');
  }
  return {
    clear: clearModel,
    update(parts, resetCamera = false) {
      const hadModel = group.children.length > 0;
      const oldSize = currentBox?.getSize(new THREE.Vector3());
      for (const child of [...group.children]) { disposeObject(child); group.remove(child); }
      for (const [index, part] of parts.entries()) {
        const source = new THREE.BufferGeometry();
        source.setAttribute('position', new THREE.BufferAttribute(part.mesh.positions, 3));
        source.setIndex(new THREE.BufferAttribute(part.mesh.triangles, 1));
        // Smooth curved walls, but keep cap/wall and cavity edges separate.
        // This only changes GPU preview normals, never the exported mesh.
        const geometry = toCreasedNormals(source, Math.PI / 6);
        source.dispose();
        const material = new THREE.MeshStandardMaterial({ color: part.color, roughness: .85, metalness: 0 });
        const object = new THREE.Mesh(geometry, material);
        object.castShadow = true;
        // Self-shadow acne can falsely reveal planar triangulation. Keep the
        // contact shadow on the ground and use lighting for the model itself.
        object.receiveShadow = false;
        if (index === 0) {
          material.polygonOffset = true; material.polygonOffsetFactor = 1; material.polygonOffsetUnits = 1;
          const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 35),
            new THREE.LineBasicMaterial({ color: 0x46505d, transparent: true, opacity: .24, depthWrite: false }));
          object.add(edges);
        }
        group.add(object);
      }
      currentBox = new THREE.Box3().setFromObject(group);
      if (!hadModel || resetCamera) fit();
      else if (oldSize && oldSize.distanceTo(currentBox.getSize(new THREE.Vector3())) > .01) fit('current');
      container.classList.add('has-model');
    },
    fit: () => fit(),
    top: () => fit('top'),
    back: () => fit('back'),
    toggleGrid: () => { gridEnabled = !gridEnabled; syncInspectionView(); return gridEnabled; },
    dispose() {
      renderer.setAnimationLoop(null);
      controls.dispose(); observer.disconnect();
      for (const child of group.children) disposeObject(child);
      ground.geometry.dispose(); ground.material.dispose(); grid.geometry.dispose(); grid.material.dispose();
      renderer.dispose(); renderer.domElement.remove();
    },
    start() { renderer.setAnimationLoop(() => { controls.update(); syncInspectionView(); renderer.render(scene, camera); }); },
  };
}
