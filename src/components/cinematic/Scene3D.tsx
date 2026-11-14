"use client";
/* eslint-disable react-hooks/immutability -- react-three-fiber render loops mutate Three.js objects every frame by design */
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useMemo, useRef } from "react";

/** Scroll progress (0..1) shared between the GSAP ScrollTrigger and the render loop. */
export const scrollState = { p: 0 };

const sm = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const lerp = THREE.MathUtils.lerp;

type Kind = "incisor" | "canine" | "premolar" | "molar";

/* ------------------------------------------------------------------ tooth anatomy */
const CROWN: Record<Kind, [number, number][]> = {
  incisor: [[0.3, 0], [0.38, 0.2], [0.47, 0.55], [0.5, 0.85], [0.47, 1.12], [0.4, 1.26], [0.22, 1.31], [0, 1.32]],
  canine: [[0.28, 0], [0.38, 0.25], [0.45, 0.6], [0.44, 0.9], [0.38, 1.1], [0.26, 1.25], [0.12, 1.35], [0, 1.39]],
  premolar: [[0.3, 0], [0.4, 0.2], [0.46, 0.5], [0.46, 0.85], [0.4, 1.05], [0.28, 1.14], [0.12, 1.16], [0, 1.16]],
  molar: [[0.34, 0], [0.45, 0.18], [0.5, 0.45], [0.5, 0.7], [0.45, 0.88], [0.3, 0.95], [0.12, 0.96], [0, 0.96]],
};
const SXZ: Record<Kind, [number, number]> = { incisor: [1, 0.62], canine: [1, 0.86], premolar: [1, 0.96], molar: [1.4, 1.35] };
const ROOT: [number, number][] = [[0, -1.6], [0.06, -1.55], [0.13, -1.25], [0.2, -0.85], [0.27, -0.4], [0.3, 0]];
const MOLAR_ROOT: [number, number][] = [[0, -1.45], [0.04, -1.4], [0.1, -1.0], [0.17, -0.5], [0.2, 0]];

const C = {
  neck: new THREE.Color("#dcc79b"), body: new THREE.Color("#f4eedd"), edge: new THREE.Color("#e4ebe8"),
  root: new THREE.Color("#d3bf95"),
};

function lathe(points: [number, number][], seg: number) {
  const g = new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  g.deleteAttribute("uv"); g.deleteAttribute("normal");
  return mergeVertices(g, 1e-4);
}

function makeTooth(kind: Kind, seg: number) {
  const single = kind !== "molar";
  const crown = lathe(single ? [...ROOT.slice(0, -1), ...CROWN[kind]] : CROWN[kind], seg);
  const [sx, sz] = SXZ[kind];
  const top = CROWN[kind][CROWN[kind].length - 1][1];
  const cp = crown.attributes.position as THREE.BufferAttribute;
  const cc = new Float32Array(cp.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < cp.count; i++) {
    let x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i);
    const r = Math.hypot(x, z), ang = Math.atan2(z, x);
    if (y > top * 0.8) {
      const w = sm(top * 0.8, top, y);
      if (kind === "incisor") y -= 0.1 * (x / 0.5) ** 2 * w;
      else if (kind === "canine") y -= 0.03 * Math.abs(x) * w;
      else if (kind === "premolar") y += 0.11 * Math.cos(2 * (ang - Math.PI / 2)) * smoothR(r) * w;
      else y += (0.07 * Math.cos(2 * ang) + 0.05 * Math.cos(4 * ang + Math.PI / 4) - 0.07 * (1 - r / 0.5)) * w;
    }
    // faint labial convexity and surface undulation, so highlights break up naturally
    const n = Math.sin(x * 9.3 + y * 4.1) * Math.sin(z * 7.7 + y * 5.3) * 0.006;
    x += (x / (r || 1)) * n; z += (z / (r || 1)) * n;
    cp.setXYZ(i, x * sx, y, z * sz);
    const t = sm(0.0, 0.7, y / top);
    c.copy(C.root).lerp(C.neck, sm(-0.3, 0.18, y)).lerp(C.body, t);
    if (kind === "incisor" || kind === "canine") c.lerp(C.edge, sm(0.78, 1.0, y / top) * 0.85); // translucent edge
    cc[i * 3] = c.r; cc[i * 3 + 1] = c.g; cc[i * 3 + 2] = c.b;
  }
  crown.setAttribute("color", new THREE.BufferAttribute(cc, 3));

  const roots: THREE.BufferGeometry[] = [];
  const mkRoot = (pts: [number, number][], ox: number, oz: number) => {
    const g = lathe(pts, Math.max(12, seg >> 1));
    const p = g.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      p.setXYZ(i, p.getX(i) * sx + ox, p.getY(i), p.getZ(i) * sz + oz);
      col[i * 3] = C.root.r; col[i * 3 + 1] = C.root.g; col[i * 3 + 2] = C.root.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    roots.push(g);
  };
  if (kind === "molar") { mkRoot(MOLAR_ROOT, -0.32, 0); mkRoot(MOLAR_ROOT, 0.32, 0); }

  const merged = mergeGeometries([crown, ...roots], false)!;
  merged.computeVertexNormals();
  merged.computeBoundingBox();
  return merged;
}
function smoothR(r: number) { return sm(0.02, 0.35, r); }

/* ------------------------------------------------------------------ arch layout */
const R = 3.4, ZC = 1.0, LOWER_Y = -0.8, UPPER_Y = 0.8, PIVOT_Z = -3, FOCUS_RANK = 1;
const KINDS: Kind[] = ["incisor", "incisor", "canine", "premolar", "premolar", "molar", "molar"];
const WIDTHS = [0.66, 0.54, 0.62, 0.58, 0.58, 0.86, 0.82];
const GAP = 0.012;

type Slot = { kind: Kind; x: number; z: number; ry: number; rank: number; side: 1 | -1; scale: number };
function layout(widthOf: (k: Kind) => number): { slots: Slot[]; bounds: number[]; total: number } {
  const slots: Slot[] = []; const bounds: number[] = [0]; let s = 0;
  WIDTHS.forEach((w, rank) => {
    const mid = s + w / 2; const th = mid / R;
    ([1, -1] as const).forEach((side) => {
      slots.push({ kind: KINDS[rank], x: side * R * Math.sin(th), z: ZC - R * (1 - Math.cos(th)), ry: side * th, rank, side, scale: w / widthOf(KINDS[rank]) });
    });
    s += w + GAP; bounds.push(s - GAP / 2);
  });
  return { slots, bounds, total: s };
}

/** Gum: a cross-section swept along the arch, with scalloped papillae between teeth. */
function makeGum(bounds: number[], total: number, mobile: boolean) {
  const rings = mobile ? 90 : 170, M = mobile ? 28 : 44;
  const pos: number[] = [], idx: number[] = [];
  const a = 0.4, b = 0.6, e = 2.7, ext = total + 0.35;
  for (let i = 0; i <= rings; i++) {
    const s = -ext + (2 * ext * i) / rings;
    const th = s / R, as = Math.abs(s);
    const endTaper = 1 - sm(total - 0.1, ext, as) * 0.97;
    let d = 9; for (const bnd of bounds) d = Math.min(d, Math.abs(as - bnd));
    const papilla = as > 0.02 && as < total - 0.02 ? 0.13 * Math.exp(-((d / 0.075) ** 2)) : 0;
    for (let k = 0; k < M; k++) {
      const t = (2 * Math.PI * k) / M, ct = Math.cos(t), st = Math.sin(t);
      const pn = a * Math.sign(ct) * Math.abs(ct) ** (2 / e) * endTaper;
      let py = -b + b * Math.sign(st) * Math.abs(st) ** (2 / e) * endTaper;
      if (st > 0.2) py += papilla * st * st;
      const rad = R + pn;
      pos.push(rad * Math.sin(th), py, ZC - R + rad * Math.cos(th));
    }
  }
  for (let i = 0; i < rings; i++) for (let k = 0; k < M; k++) {
    const k2 = (k + 1) % M, p0 = i * M + k, p1 = i * M + k2, p2 = (i + 1) * M + k, p3 = (i + 1) * M + k2;
    idx.push(p0, p2, p1, p1, p2, p3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------ materials */
const toothMaterial = () => new THREE.MeshPhysicalMaterial({
  vertexColors: true, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25,
  sheen: 0.5, sheenColor: new THREE.Color("#fff3d6"), sheenRoughness: 0.5,
  emissive: new THREE.Color("#fff1d0"), emissiveIntensity: 0.05,
});

/** Smooth, patchy plaque film that peels away from -x to +x as the scaler passes. */
function plaqueMaterial() {
  const uClean = { value: -2 }, uAmt = { value: 0 };
  const m = new THREE.MeshStandardMaterial({ color: "#cfb67e", roughness: 0.95, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uClean = uClean; sh.uniforms.uAmt = uAmt;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vP;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvP = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
        varying vec3 vP; uniform float uClean; uniform float uAmt;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
        float fbm(vec2 p){return vn(p)*.55+vn(p*2.1)*.3+vn(p*4.3)*.15;}`)
      .replace("#include <dithering_fragment>", `#include <dithering_fragment>
        float nz = fbm(vP.xy * 5.0 + vP.z * 2.0);
        float cover = smoothstep(uAmt + 0.12, uAmt - 0.02, nz);
        cover *= smoothstep(uClean - 0.03, uClean + 0.07, vP.x);
        cover *= smoothstep(0.0, 0.25, vP.y + 0.1);           /* hug the gum line */
        gl_FragColor.a *= cover * 0.72;
        if (gl_FragColor.a < 0.02) discard;`);
  };
  return { m, uClean, uAmt };
}

/* ------------------------------------------------------------------ scene */
function Scaler({ refG }: { refG: React.RefObject<THREE.Group | null> }) {
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d4dbe0", metalness: 1, roughness: 0.18 }), []);
  const grip = useMemo(() => new THREE.MeshStandardMaterial({ color: "#23454a", metalness: 0.35, roughness: 0.4 }), []);
  const handle = useMemo(() => {
    const pts: [number, number][] = [[0.0, 0], [0.035, 0.02], [0.055, 0.15], [0.085, 0.35], [0.095, 0.9], [0.095, 1.7], [0.085, 2.0], [0.05, 2.12], [0.0, 2.15]];
    return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 32);
  }, []);
  // Working end: shaft leaves the handle, dips, then hooks into a sickle tip. Tip sits at the origin.
  const shaft = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(0.0, 0.62, 0), new THREE.Vector3(-0.02, 0.28, 0),
    new THREE.Vector3(-0.07, 0.1, 0), new THREE.Vector3(-0.15, 0.03, 0), new THREE.Vector3(-0.22, 0.0, 0),
  ]), 40, 0.018, 12, false), []);
  const tip = useMemo(() => new THREE.ConeGeometry(0.02, 0.1, 12), []);
  const ring = useMemo(() => new THREE.TorusGeometry(0.097, 0.012, 10, 28), []);
  return (
    <group ref={refG} visible={false} scale={0.8}>
      <mesh geometry={shaft} material={steel} />
      <mesh geometry={tip} material={steel} position={[-0.26, -0.005, 0]} rotation={[0, 0, Math.PI / 2 + 0.1]} />
      <group position={[0, 1.08, 0]}>
        <mesh geometry={handle} material={grip} />
        {[0.5, 0.62, 1.55, 1.67].map((y) => <mesh key={y} geometry={ring} material={steel} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} />)}
      </group>
    </group>
  );
}

function Scene({ mobile }: { mobile: boolean }) {
  const seg = mobile ? 28 : 56;
  const geos = useMemo(() => ({
    incisor: makeTooth("incisor", seg), canine: makeTooth("canine", seg), premolar: makeTooth("premolar", seg), molar: makeTooth("molar", seg),
  }), [seg]);
  const widthOf = (k: Kind) => { const b = geos[k].boundingBox!; return b.max.x - b.min.x; };
  const { slots, bounds, total } = useMemo(() => layout(widthOf), [geos]); // eslint-disable-line react-hooks/exhaustive-deps
  const gum = useMemo(() => makeGum(bounds, total, mobile), [bounds, total, mobile]);
  const toothMat = useMemo(() => toothMaterial(), []);
  const gumMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#cf8a86", roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.5, sheen: 0.6, sheenColor: new THREE.Color("#ffb9b0"), side: THREE.DoubleSide,
  }), []);
  const plaque = useMemo(() => plaqueMaterial(), []);

  const hero = useRef<THREE.Mesh>(null);
  const upper = useRef<THREE.Group>(null);
  const lower = useRef<THREE.Group>(null);
  const lowerInner = useRef<THREE.Group>(null);
  const focusRef = useRef<THREE.Mesh>(null);
  const scaler = useRef<THREE.Group>(null);
  const sp = useRef(0);
  const tmp = useMemo(() => ({ f: new THREE.Vector3(), cam: new THREE.Vector3(), look: new THREE.Vector3(), v: new THREE.Vector3() }), []);
  const focusSlot = useMemo(() => slots.find((q) => q.rank === FOCUS_RANK && q.side === 1)!, [slots]);

  useFrame(({ camera, clock, size }) => {
    sp.current += (scrollState.p - sp.current) * 0.14;
    const p = sp.current, t = clock.elapsedTime;
    const portrait = size.width / size.height < 0.9;

    // jaw: lower arch hinges at the back; opens through the cleaning, relaxes into a closed smile
    const open = sm(0.3, 0.46, p) * 0.3 - sm(0.84, 0.97, p) * 0.28;
    lower.current?.rotation.set(open, 0, 0);
    lower.current?.updateMatrixWorld(true);
    upper.current?.rotation.set(-open * 0.1, 0, 0);

    // teeth and gums grow in outward from the centre line
    const grow = (ch: THREE.Object3D) => {
      if (ch.userData.gum) return;
      const d = ch.userData.rank as number;
      const a = ch.userData.focus ? (p > 0.285 ? 1 : 0) : sm(0.2 + d * 0.012, 0.3 + d * 0.012, p);
      ch.scale.setScalar(Math.max(0.0001, ch.userData.scale * a));
    };
    upper.current?.children.forEach(grow);
    lowerInner.current?.children.forEach(grow);
    const gumA = Math.max(0.0001, sm(0.22, 0.34, p));
    [upper.current, lowerInner.current].forEach((g) => g?.children.forEach((ch) => { if (ch.userData.gum) ch.scale.set(gumA, ch.userData.flip * gumA, gumA); }));

    // hero tooth: floats at centre-right, then glides into its place in the lower arch
    const heroT = sm(0.14, 0.29, p);
    if (hero.current) {
      const hx = portrait ? 0 : 1.9, hy = portrait ? 0.95 : 0.15;
      hero.current.visible = p < 0.29;
      hero.current.position.set(lerp(hx, focusSlot.x, heroT), lerp(hy, LOWER_Y, heroT), lerp(0, focusSlot.z, heroT));
      hero.current.scale.setScalar(lerp(portrait ? 0.55 : 0.85, focusSlot.scale, heroT));
      hero.current.rotation.set(lerp(0.06, 0, heroT), lerp(t * 0.35, focusSlot.ry, heroT), lerp(0.04 * Math.sin(t * 0.6), 0, heroT));
    }

    // world position of the patient tooth as the jaw moves
    tmp.f.set(focusSlot.x, LOWER_Y + 0.35, focusSlot.z - PIVOT_Z).applyMatrix4(lower.current?.matrixWorld ?? new THREE.Matrix4());

    // plaque builds, then the scaler sweeps it away
    const build = sm(0.4, 0.5, p);
    const sweep = sm(0.58, 0.78, p), inA = sm(0.5, 0.58, p), out = sm(0.78, 0.86, p);
    plaque.uAmt.value = 0.5 * build;
    const localX = lerp(-0.62, 0.62, sweep);
    plaque.uClean.value = localX;
    if (focusRef.current) focusRef.current.children[0].visible = p > 0.4 && p < 0.88;
    if (scaler.current) {
      const k = focusSlot.scale, cs = Math.cos(focusSlot.ry);
      const tipX = tmp.f.x + localX * k * cs * 1.02 + 0.22;
      const wob = Math.sin(sweep * 34) * 0.014 * inA * (1 - out);
      scaler.current.position.set(lerp(lerp(tipX - 2.2, tipX, inA), tipX - 2.4, out), tmp.f.y - 0.12 + wob + (1 - inA) * 0.5, tmp.f.z + 0.2 + (1 - inA) * 0.7);
      scaler.current.rotation.set(0.1, 0.0, 0.45 + (1 - inA) * 0.2);
      scaler.current.visible = p > 0.49 && p < 0.88;
    }
    const polish = sm(0.78, 0.9, p);
    toothMat.clearcoat = 0.6 + polish * 0.4;
    toothMat.clearcoatRoughness = 0.25 - polish * 0.13;
    toothMat.emissiveIntensity = 0.05 + polish * 0.1;

    // camera
    const heroCam = tmp.cam.set(0, 0.2, portrait ? 9.6 : 6.6);
    const arch = new THREE.Vector3(0, 0.6, portrait ? 13.5 : 10.5);
    const mid = new THREE.Vector3(0.2, -0.1, portrait ? 11 : 7.0);
    const focus = new THREE.Vector3(tmp.f.x + 0.5, tmp.f.y + 0.05, tmp.f.z + (portrait ? 6.2 : 3.7));
    const end = new THREE.Vector3(0, 0.3, portrait ? 15.5 : 13.2);
    heroCam.lerp(arch, sm(0.14, 0.32, p)).lerp(mid, sm(0.32, 0.46, p)).lerp(focus, sm(0.46, 0.6, p)).lerp(end, sm(0.84, 0.97, p));
    tmp.look.set(0, 0, 0).lerp(tmp.v.set(0, -0.3, 0), sm(0.3, 0.46, p)).lerp(tmp.f, sm(0.46, 0.6, p)).lerp(tmp.v.set(0, -0.2, 0.3), sm(0.84, 0.97, p));
    // leave room for the copy: desktop copy sits left, mobile copy sits low; the finale lifts the jaws to the top
    const shiftX = portrait ? 0 : 1.2 * sm(0.14, 0.3, p) * (1 - sm(0.84, 0.95, p));
    const shiftY = portrait ? 0.7 * sm(0.14, 0.3, p) * (1 - sm(0.84, 0.95, p)) : 0;
    const lift = sm(0.86, 0.97, p) * (portrait ? 2.4 : 1.95); // raise the camera so the jaws sit low, under the headline
    heroCam.x += Math.sin(t * 0.3) * 0.04 - shiftX;
    heroCam.y += Math.cos(t * 0.27) * 0.025 - shiftY + lift;
    tmp.look.x -= shiftX; tmp.look.y += -shiftY + lift;
    camera.position.copy(heroCam);
    camera.lookAt(tmp.look);
  });

  const gumFlipped = { flip: -1 };
  return (
    <>
      <color attach="background" args={["#efe8da"]} />
      <hemisphereLight args={["#fff7e8", "#b9a98a", 0.7]} />
      <directionalLight position={[4, 6, 7]} intensity={2.2} color="#fff4e2" castShadow={!mobile} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0006} shadow-normalBias={0.03} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={5} shadow-camera-bottom={-5} />
      <directionalLight position={[-5, 2, 4]} intensity={0.9} color="#d6eee9" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 5, 4]} scale={[8, 3, 1]} color="#fff7ea" />
        <Lightformer form="rect" intensity={1.4} position={[-6, 1, 2]} scale={[3, 6, 1]} color="#cfe9e4" />
        <Lightformer form="rect" intensity={1.2} position={[6, 0, -2]} scale={[3, 6, 1]} color="#ffffff" />
      </Environment>

      <mesh ref={hero} geometry={geos.incisor} material={toothMat} castShadow />

      {/* upper arch: teeth hang down, nudged forward so incisors overlap the lowers like a real bite */}
      <group ref={upper} position={[0, 0, 0.1]}>
        <mesh geometry={gum} material={gumMat} position={[0, UPPER_Y - 0.09, 0]} scale={[1, -1, 1]} userData={{ gum: true, flip: gumFlipped.flip }} receiveShadow />
        {slots.map((s) => (
          <mesh key={`u${s.rank}${s.side}`} geometry={geos[s.kind]} material={toothMat} position={[s.x, UPPER_Y, s.z]} rotation={[Math.PI, s.ry, 0]} scale={s.scale} userData={{ rank: s.rank, scale: s.scale }} castShadow receiveShadow />
        ))}
      </group>

      {/* lower arch hinges around the back of the jaw */}
      <group ref={lower} position={[0, 0, PIVOT_Z]}>
        <group ref={lowerInner} position={[0, 0, -PIVOT_Z]}>
          <mesh geometry={gum} material={gumMat} position={[0, LOWER_Y + 0.09, 0]} userData={{ gum: true, flip: 1 }} receiveShadow />
          {slots.map((s) => {
            const focus = s.rank === FOCUS_RANK && s.side === 1;
            return (
              <mesh key={`l${s.rank}${s.side}`} ref={focus ? focusRef : undefined} geometry={geos[s.kind]} material={toothMat}
                position={[s.x, LOWER_Y, s.z]} rotation={[0, s.ry, 0]} scale={s.scale} userData={{ rank: s.rank, scale: s.scale, focus }} castShadow receiveShadow>
                {focus && <mesh geometry={geos.incisor} material={plaque.m} scale={1.05} visible={false} />}
              </mesh>
            );
          })}
        </group>
      </group>

      <Scaler refG={scaler} />
    </>
  );
}

export default function Scene3D({ mobile, frameloop }: { mobile: boolean; frameloop: "always" | "demand" }) {
  return (
    <Canvas
      frameloop={frameloop}
      shadows={!mobile}
      dpr={mobile ? [1, 1.25] : [1, 1.75]}
      camera={{ fov: 32, near: 0.1, far: 60, position: [0, 0.2, 6.6] }}
      gl={{ antialias: !mobile, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
      aria-hidden="true"
    >
      <Scene mobile={mobile} />
    </Canvas>
  );
}
