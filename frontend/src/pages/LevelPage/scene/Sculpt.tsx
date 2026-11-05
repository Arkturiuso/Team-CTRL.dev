import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Скульптурные примитивы: шум смещает вершины, поэтому силуэты получаются
 * рваными и органичными. Гладкие шары и конусы читаются как детская plastic-игрушка.
 */

const hash3 = (x: number, y: number, z: number, seed: number) => {
  let h = seed + x * 374761393 + y * 668265263 + z * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  return (((h ^ (h >>> 16)) >>> 0) % 100000) / 100000;
};

const noise3 = (x: number, y: number, z: number, seed: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const zf = smooth(z - zi);
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz, seed);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), xf), lerp(c(0, 1, 0), c(1, 1, 0), xf), yf),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), xf), lerp(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  );
};

const fbm3 = (x: number, y: number, z: number, seed: number, octaves: number) => {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let fx = x;
  let fy = y;
  let fz = z;
  for (let o = 0; o < octaves; o++) {
    sum += noise3(fx, fy, fz, seed + o * 101) * amp;
    norm += amp;
    amp *= 0.5;
    fx *= 2.03;
    fy *= 2.03;
    fz *= 2.03;
  }
  return sum / norm;
};

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

export interface LumpOpts {
  radius: number;
  detail?: number;
  seed?: number;
  amp?: number;
  stretch?: [number, number, number];
  /** Сужение к верху: 1 - конус, 0 - цилиндр, отрицательное - расширение к верху. */
  taper?: number;
  /** Где начинается сужение по высоте (в долях radius). */
  taperFrom?: number;
  /** Мокрые тела: у икосаэдра нет индексов, и computeVertexNormals даёт грани. Тут нормаль = радиус. */
  smooth?: boolean;
}

/** Ком: икосаэдр, гнать который нельзя, - база для листвы, камней, голов и брюшек. */
export const makeLumpGeometry = ({ radius, detail = 2, seed = 1, amp = 0.24, stretch, taper = 0, taperFrom = 0.2, smooth = false }: LumpOpts) => {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const dir = v.clone().normalize();
    const bump = fbm3(dir.x * 1.9 + seed, dir.y * 1.9, dir.z * 1.9, seed, 3);
    let scale = 1 + (bump - 0.5) * 2 * amp;
    if (taper !== 0) {
      const up = Math.max(0, (v.y / radius - taperFrom) / (1 - taperFrom));
      scale *= 1 - up * taper;
    }
    v.copy(dir).multiplyScalar(radius * scale);
    if (stretch) v.multiply(new THREE.Vector3(...stretch));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  if (smooth) {
    const nrm = geo.attributes.normal as THREE.BufferAttribute;
    const inv = stretch ? new THREE.Vector3(1 / stretch[0], 1 / stretch[1], 1 / stretch[2]) : new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).multiply(inv).normalize();
      nrm.setXYZ(i, v.x, v.y, v.z);
    }
    nrm.needsUpdate = true;
  } else {
    geo.computeVertexNormals();
  }
  return geo;
};

/** Плита: сплюснутый ком с обломанными краями - панцирь, надгробная плита, наплечник. */
export const makePlateGeometry = (width: number, depth: number, thickness: number, seed = 3, amp = 0.3) =>
  makeLumpGeometry({ radius: 0.5, detail: 2, seed, amp, stretch: [width, thickness, depth] });

export interface TubeOpts {
  points: [number, number, number][];
  radii: number[];
  radial?: number;
  seed?: number;
  /** Доля радиуса, на которую шум гнёт поверхность вдоль оси. */
  wobble?: number;
  taperTwist?: number;
}

/** Трубка по кривой с переменным радиусом: стволы, ветки, лапы, хвосты, щупальца. */
export const makeTubeGeometry = ({ points, radii, radial = 9, seed = 1, wobble = 0.16, taperTwist = 0 }: TubeOpts) => {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.4);
  const tubular = Math.max(8, points.length * 6);
  const frames = curve.computeFrenetFrames(tubular, false);
  const position: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  const ring = new THREE.Vector3();

  for (let i = 0; i <= tubular; i++) {
    const k = i / tubular;
    const center = curve.getPointAt(k);
    const base = radii.length === 1 ? radii[0] : lerpList(radii, k);
    const twist = k * taperTwist;
    const n = frames.normals[Math.min(tubular, i)];
    const b = frames.binormals[Math.min(tubular, i)];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2 + twist;
      // Шум по углу, а не по высоте: иначе кора идёт горизонтальными кольцами и ствол похож на кукурузу.
      const wob = 1 + (fbm3(Math.cos(a) * 2.8 + center.x * 0.5, Math.sin(a) * 2.8 + center.z * 0.5, k * 1.5 + center.y * 0.4, seed, 3) - 0.5) * 2 * wobble;
      const r = Math.max(0.004, base * wob);
      ring.copy(n).multiplyScalar(Math.cos(a) * r).addScaledVector(b, Math.sin(a) * r).add(center);
      position.push(ring.x, ring.y, ring.z);
      // v - вокруг, u - вдоль: в текстуре коры частоты именно такие, иначе ствол в кольцах.
      uv.push(k, j / radial);
    }
  }

  const stride = radial + 1;
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * stride + j;
      const c = (i + 1) * stride + j;
      // Обход против часовой снаружи: иначе нормали смотрят внутрь и трубка рендерится тёмной изнанкой.
      index.push(a, a + 1, c, a + 1, c + 1, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
};

const lerpList = (values: number[], k: number) => {
  const last = values.length - 1;
  const at = Math.min(0.999, Math.max(0, k)) * last;
  const i = Math.floor(at);
  return values[i] + (values[i + 1] - values[i]) * (at - i);
};

type Vec3 = [number, number, number];

export const Lump = ({
  opts,
  material,
  position,
  rotation,
  shadow = true,
}: {
  opts: LumpOpts;
  material: THREE.Material;
  position?: Vec3;
  rotation?: Vec3;
  shadow?: boolean;
}) => {
  const geo = useMemo(() => makeLumpGeometry(opts), [opts.radius, opts.detail, opts.seed, opts.amp, JSON.stringify(opts.stretch), opts.taper, opts.smooth]);
  return <mesh geometry={geo} material={material} position={position} rotation={rotation} castShadow={shadow} receiveShadow />;
};

export const Plate = ({
  width,
  depth,
  thickness,
  seed = 3,
  amp = 0.3,
  material,
  position,
  rotation,
}: {
  width: number;
  depth: number;
  thickness: number;
  seed?: number;
  amp?: number;
  material: THREE.Material;
  position?: Vec3;
  rotation?: Vec3;
}) => {
  const geo = useMemo(() => makePlateGeometry(width, depth, thickness, seed, amp), [width, depth, thickness, seed, amp]);
  return <mesh geometry={geo} material={material} position={position} rotation={rotation} castShadow receiveShadow />;
};

export const Tube = ({
  points,
  radii,
  radial = 9,
  seed = 1,
  wobble = 0.16,
  taperTwist = 0,
  material,
  shadow = true,
}: {
  points: Vec3[];
  radii: number[];
  radial?: number;
  seed?: number;
  wobble?: number;
  taperTwist?: number;
  material: THREE.Material;
  shadow?: boolean;
}) => {
  const key = JSON.stringify([points, radii]);
  const geo = useMemo(() => makeTubeGeometry({ points, radii, radial, seed, wobble, taperTwist }), [key, radial, seed, wobble, taperTwist]);
  return <mesh geometry={geo} material={material} castShadow={shadow} receiveShadow />;
};

/** Осколок: вытянутый шумом конус с гранями - ледяные шипы, обломки, клешни. */
export const Spike = ({
  height,
  base,
  seed = 5,
  lean,
  material,
  position,
  rotation,
}: {
  height: number;
  base: number;
  seed?: number;
  lean?: number;
  material: THREE.Material;
  position?: Vec3;
  rotation?: Vec3;
}) => {
  const geo = useMemo(() => {
    const g = makeLumpGeometry({ radius: 0.5, detail: 1, seed, amp: 0.34, stretch: [base * 2, height * 2, base * 2], taper: lean ?? 0.92 });
    g.translate(0, height, 0);
    return g;
  }, [height, base, seed, lean]);
  return <mesh geometry={geo} material={material} position={position} rotation={rotation} castShadow receiveShadow />;
};
