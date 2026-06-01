// Eldo — custom Three.js kitchen viewer that matches the 3D planer's exact render pipeline
// (ColorManagement OFF, LinearSRGB output, NoToneMapping, same lights). No HDR/environment.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Match the planer's exact pipeline (this is what looked good)
THREE.ColorManagement.enabled = false;

function initPlannerViewer(container, src) {
  const width = container.clientWidth || 600;
  const height = container.clientHeight || 400;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // matches planer (this looked good)
  renderer.toneMapping = THREE.NoToneMapping;                // matches planer
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // transparent background so it blends into the cream section (bg color doesn't affect model lighting)

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
  camera.position.set(3, 2, 3);

  // Lights — identical to planer
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
  dir1.position.set(8, 12, 8);
  dir1.castShadow = true;
  dir1.shadow.mapSize.width = 1024;
  dir1.shadow.mapSize.height = 1024;
  dir1.shadow.camera.far = 50;
  dir1.shadow.camera.left = -10;
  dir1.shadow.camera.right = 10;
  dir1.shadow.camera.top = 10;
  dir1.shadow.camera.bottom = -10;
  dir1.shadow.bias = -0.001;
  dir1.shadow.normalBias = 0.15;
  scene.add(dir1);
  const dir2 = new THREE.DirectionalLight(0xffffff, 0.6);
  dir2.position.set(-4, 8, -4);
  scene.add(dir2);
  const dir3 = new THREE.DirectionalLight(0xffffff, 0.08);
  dir3.position.set(0, 4, 8);
  scene.add(dir3);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb0b0b0, 0.5));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.minPolarAngle = THREE.MathUtils.degToRad(14);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
  controls.minDistance = 0.5;
  controls.maxDistance = 20;
  controls.target.set(0, 0, 0);
  // Limit horizontal rotation so you can't see behind the kitchen (set after framing)
  const AZ_RANGE = THREE.MathUtils.degToRad(85);
  let baseAz = 0, userInteracted = false, oscT = 0, autoRadius = 0, autoPolar = 0;
  controls.addEventListener('start', () => { userInteracted = true; container.classList.add('touched'); });

  const loader = new GLTFLoader();
  loader.load(
    src,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          var mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach(function (m) {
            if (!m) return;
            // Matte the surfaces so no light produces a shiny hotspot (e.g. on the backsplash)
            if ('roughness' in m) m.roughness = Math.max(m.roughness != null ? m.roughness : 1, 0.92);
            if ('metalness' in m) m.metalness = Math.min(m.metalness != null ? m.metalness : 0, 0.0);
            if ('envMapIntensity' in m) m.envMapIntensity = 0;
            m.needsUpdate = true;
          });
        }
      });

      // Center model and frame camera to fit
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      model.position.sub(center); // center at origin
      scene.add(model);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fitDist = (maxDim / 2) / Math.tan((camera.fov * Math.PI) / 360);
      const dist = fitDist * 1.22;
      // Center the view on the kitchen FRONT (shallow axis) so left/right are symmetric
      const depthIsZ = size.z <= size.x;
      const frontAz = depthIsZ ? 0 : Math.PI / 2;   // doors face +z (or +x)
      autoPolar = THREE.MathUtils.degToRad(66);
      autoRadius = dist;
      baseAz = frontAz;
      const sphFront = new THREE.Spherical(autoRadius, autoPolar, frontAz);
      camera.position.copy(new THREE.Vector3().setFromSpherical(sphFront).add(controls.target));
      camera.lookAt(controls.target);
      controls.minDistance = maxDim * 0.4;
      controls.maxDistance = maxDim * 4;
      controls.update();
      // Equal horizontal rotation each side; never reaches the empty back
      controls.minAzimuthAngle = frontAz - AZ_RANGE;
      controls.maxAzimuthAngle = frontAz + AZ_RANGE;

      const poster = container.querySelector('.pv-poster');
      if (poster) poster.style.opacity = '0';

      // ─── Texture swap swatches (Front / RadnaPloca / Obloga) ───
      const texLoader = new THREE.TextureLoader();
      const texCache = {};
      function loadTex(url, repeat) {
        const key = url + '|' + (repeat || '');
        if (texCache[key]) return texCache[key];
        const t = texLoader.load(url);
        t.colorSpace = THREE.LinearSRGBColorSpace; // match planer pipeline
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.flipY = false; // glTF textures are not flipped
        if (repeat) { const p = repeat.split(',').map(Number); t.repeat.set(p[0] || 1, p[1] || 1); }
        t.needsUpdate = true;
        texCache[key] = t;
        return t;
      }
      function applyTextureToGroup(prefix, tex) {
        let count = 0;
        model.traverse((obj) => {
          if (!obj.isMesh) return;
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            if (!m || !m.name || m.name.indexOf(prefix) !== 0) return;
            m.map = tex;
            m.needsUpdate = true;
            count++;
          });
        });
        return count;
      }
      document.querySelectorAll('#pvSwatches .pv-swatch-set').forEach((setEl) => {
        const prefix = setEl.getAttribute('data-group');
        const repeat = setEl.getAttribute('data-repeat');
        setEl.addEventListener('click', (e) => {
          const btn = e.target.closest('.pv-swatch');
          if (!btn) return;
          setEl.querySelectorAll('.pv-swatch').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          applyTextureToGroup(prefix, loadTex(btn.getAttribute('data-tex'), repeat));
        });
      });
    },
    undefined,
    (err) => { console.warn('Kitchen GLB load error', err); }
  );

  function onResize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  let raf;
  function animate() {
    raf = requestAnimationFrame(animate);
    if (!userInteracted && autoRadius) {
      // Gentle left-right sway via spherical coords (no setAzimuthalAngle needed)
      oscT += 0.0022;
      const az = baseAz + Math.sin(oscT) * AZ_RANGE * 0.8;
      const sph = new THREE.Spherical(autoRadius, autoPolar, az);
      camera.position.copy(new THREE.Vector3().setFromSpherical(sph).add(controls.target));
      camera.lookAt(controls.target);
    } else {
      controls.update();
    }
    renderer.render(scene, camera);
  }
  animate();
}

function boot() {
  const container = document.getElementById('plannerViewer');
  if (!container) return;
  const src = container.getAttribute('data-src') || 'assets/models/kuhinja-demo.glb';
  initPlannerViewer(container, src);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
