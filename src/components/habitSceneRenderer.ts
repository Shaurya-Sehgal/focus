import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

// Draws one Blender habit scene (GLB) in the Habits panel. Loaded on demand by HabitScene.tsx,
// so three.js never sits in the main bundle.
// Static objects carry lighting baked in Blender, with Blender's AgX view already applied, so they are shown
// unlit and without tone mapping: their colours match the still exactly (concepts/tools/bake_export.py).
// The phone keeps live materials and lights so it can move. Illustrative only.

export type SceneConfig = {
  glb: string;
  phone: string; // name of the phone's parent object in the GLB
  // Live lights (Blender z-up direction, colour, strength). They only reach the phone.
  lights: { dir: [number, number, number]; color: [number, number, number]; intensity: number; point?: boolean }[];
  away?: { dx: number; dz: number; rot: number }; // where "phone-free" moves the phone, metres / radians
  shift: number; // the Blender camera's shift_y (fraction of the frame width; positive moves the view up)
};
export type SceneApi = { setAway: (away: boolean, instant: boolean) => void; dispose: () => void };

const EXPOSURE = 2 ** 0.3; // Blender's exposure is +0.3 (only the live phone is tone mapped here)
// Both stills are 1600 × 1280 (5:4, the panel's own ratio), rendered with a shifted camera and shown with
// object-fit: cover. The live camera reproduces exactly that frame.
const STILL = { w: 1600, h: 1280 };
// Scene parallax: a small orbit, eased like the panel tilt (Habits.tsx TILT) so both settle together. It turns
// the view a little against the panel, so the objects seem to sit behind the glass.
const PARALLAX = { x: 1.6, y: 1.0, tau: 0.16 };
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function mountScene(
  el: HTMLElement,
  config: SceneConfig,
  opts: { reduced: () => boolean; onReady: () => void; onFail: () => void },
): SceneApi | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  } catch {
    opts.onFail(); // no WebGL: the still image stays
    return null;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = EXPOSURE;
  renderer.domElement.className = 'habit-scene__canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  for (const l of config.lights) {
    const light = l.point ? new THREE.PointLight(new THREE.Color(...l.color), l.intensity, 0, 2) : new THREE.DirectionalLight(new THREE.Color(...l.color), l.intensity);
    light.position.set(l.dir[0], l.dir[2], -l.dir[1]); // Blender z-up → three y-up
    scene.add(light);
  }

  const camera = new THREE.PerspectiveCamera(30, 1, 0.02, 20);
  const target = new THREE.Vector3();
  const base = { pos: new THREE.Vector3(), tanH: 0.3 }; // tan(half horizontal field of view)
  const phone = { obj: null as THREE.Object3D | null, home: new THREE.Vector3(), homeRot: 0, t: 0, from: 0, to: 0, start: 0 };
  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  let raf = 0, last = 0, disposed = false;

  function resize() {
    const r = el.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    // object-fit: cover, positioned at the top centre, applied to the shifted still frame.
    const scale = Math.max(w / STILL.w, h / STILL.h);
    const W = STILL.w * scale;
    const H = STILL.h * scale;
    const shift = config.shift * W;
    const fullH = H + 2 * Math.abs(shift); // the unshifted frame that contains the shifted one
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan((base.tanH * fullH) / W));
    camera.aspect = W / fullH;
    camera.setViewOffset(W, fullH, (W - w) / 2, (shift < 0 ? 2 * -shift : 0) + (H - h) / 2, w, h);
    camera.updateProjectionMatrix();
    render();
  }

  function render() {
    // Depth parallax inside the frame: a small orbit around the point the camera looks at.
    // Under 2°, because the panel itself tilts too.
    const off = base.pos.clone().sub(target);
    off.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(-PARALLAX.x) * look.x);
    const side = new THREE.Vector3().crossVectors(off, new THREE.Vector3(0, 1, 0)).normalize();
    off.applyAxisAngle(side, THREE.MathUtils.degToRad(PARALLAX.y) * look.y);
    camera.position.copy(target).add(off);
    camera.lookAt(target);
    if (phone.obj && config.away) {
      const k = easeInOut(phone.t);
      phone.obj.position.set(phone.home.x + config.away.dx * k, phone.home.y, phone.home.z + config.away.dz * k);
      phone.obj.rotation.y = phone.homeRot + config.away.rot * k;
    }
    renderer.render(scene, camera);
  }

  function frame(now: number) {
    const dt = Math.min((now - (last || now)) / 1000, 0.05);
    last = now;
    const k = 1 - Math.exp(-dt / PARALLAX.tau);
    look.x += (look.tx - look.x) * k;
    look.y += (look.ty - look.y) * k;
    let moving = Math.abs(look.tx - look.x) > 0.001 || Math.abs(look.ty - look.y) > 0.001;
    if (phone.t !== phone.to) {
      const p = Math.min(1, (now - phone.start) / 900);
      phone.t = phone.from + (phone.to - phone.from) * p;
      moving = true;
    }
    render();
    raf = moving ? requestAnimationFrame(frame) : 0;
  }
  function wake() {
    if (!raf && !disposed) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  // Pointer area: the frame's untransformed stage, so the tilting card never changes the hit area.
  const stage = el.closest('.habit-stage') ?? el;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  function onMove(e: Event) {
    if (opts.reduced()) return;
    const pe = e as PointerEvent;
    const r = stage.getBoundingClientRect();
    look.tx = Math.max(-1, Math.min(1, ((pe.clientX - r.left) / r.width) * 2 - 1));
    look.ty = Math.max(-1, Math.min(1, ((pe.clientY - r.top) / r.height) * 2 - 1));
    wake();
  }
  function onLeave() {
    look.tx = look.ty = 0;
    wake();
  }

  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(
    config.glb,
    (gltf) => {
      if (disposed) return;
      gltf.scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const m = mesh.material as THREE.MeshPhysicalMaterial;
        if (m.name.startsWith('Baked_Shadow') || m.name.startsWith('Baked_PhoneShadow')) {
          mesh.material = new THREE.MeshBasicMaterial({ color: 0x000000, map: m.map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, toneMapped: false });
          mesh.renderOrder = 1;
        } else if (m.name.startsWith('Baked_')) {
          mesh.material = new THREE.MeshBasicMaterial({ map: m.map, toneMapped: false }); // lighting and view are in the texture
        } else if (m.name.startsWith('M_ScreenGlass')) {
          // Blender reflects soft area lights in the glass; the generic studio environment here is much
          // brighter all round, so the screen only gets a trace of it and stays near-black.
          m.envMap = env;
          m.envMapIntensity = 0.03;
          m.clearcoat = 0.2;
        } else {
          m.envMap = env;
          m.envMapIntensity = 0.3;
        }
      });
      scene.add(gltf.scene);
      const cam = gltf.cameras[0] as THREE.PerspectiveCamera | undefined;
      if (cam) {
        cam.updateMatrixWorld(true);
        base.pos.setFromMatrixPosition(cam.matrixWorld);
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.getWorldQuaternion(new THREE.Quaternion()));
        // Where the view meets the surface the objects stand on.
        const box = new THREE.Box3().setFromObject(gltf.scene.getObjectByName(config.phone) ?? gltf.scene);
        const surface = box.min.y;
        target.copy(base.pos).addScaledVector(dir, (surface - base.pos.y) / dir.y);
        base.tanH = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * cam.aspect;
      }
      phone.obj = gltf.scene.getObjectByName(config.phone) ?? null;
      if (phone.obj) {
        phone.home.copy(phone.obj.position);
        phone.homeRot = phone.obj.rotation.y;
      }
      resize();
      requestAnimationFrame(() => !disposed && opts.onReady());
    },
    undefined,
    () => !disposed && opts.onFail(), // keep the still image
  );

  const ro = new ResizeObserver(resize);
  ro.observe(el);
  if (finePointer) {
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);
  }

  return {
    setAway(away, instant) {
      const to = away ? 1 : 0;
      if (instant) {
        phone.t = phone.from = phone.to = to;
        render();
        return;
      }
      phone.from = phone.t; // starts from wherever it is, so it can be reversed mid-way
      phone.to = to;
      phone.start = performance.now();
      wake();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const m = mesh.material as THREE.MeshBasicMaterial;
        m.map?.dispose();
        m.dispose();
      });
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
