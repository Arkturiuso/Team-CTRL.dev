import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Biome } from '../types';
import { PLATEAU_H } from './palette';
import type { BiomePalette } from './palette';

/** Детерминированный шум: одна и та же карта выглядит одинаково от кадра к кадру. */
const hash2 = (x: number, y: number, seed: number) => {
  let h = seed + x * 374761393 + y * 668265263;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
};

const smooth = (t: number) => t * t * (3 - 2 * t);

const valueNoise = (x: number, y: number, seed: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const tx = smooth(x - xi);
  const ty = smooth(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
};

const fbm = (x: number, y: number, seed: number, octaves = 4) => {
  let value = 0;
  let amplitude = 0.5;
  let freq = 1;
  for (let o = 0; o < octaves; o++) {
    value += amplitude * valueNoise(x * freq, y * freq, seed + o * 101);
    amplitude *= 0.5;
    freq *= 2.07;
  }
  return value;
};

/**
 * Шум с решёткой, замкнутой по модулю: текстура становится бесшовной.
 * Без этого каждая плитка обказывается видимой квадратной рамкой.
 */
const valueNoiseTiled = (x: number, y: number, seed: number, period: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const tx = smooth(x - xi);
  const ty = smooth(y - yi);
  const w = (a: number, b: number) => hash2(((a % period) + period) % period, ((b % period) + period) % period, seed);
  const a = w(xi, yi);
  const b = w(xi + 1, yi);
  const c = w(xi, yi + 1);
  const d = w(xi + 1, yi + 1);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
};

const fbmTiled = (u: number, v: number, seed: number, octaves: number, cells: number) => {
  let value = 0;
  let amplitude = 0.5;
  let freq = cells;
  for (let o = 0; o < octaves; o++) {
    value += amplitude * valueNoiseTiled(u * freq, v * freq, seed + o * 101, freq);
    amplitude *= 0.5;
    freq *= 2;
  }
  return value;
};

const ridgeTiled = (u: number, v: number, seed: number, octaves: number, cells: number) => {
  let value = 0;
  let amplitude = 0.5;
  let freq = cells;
  for (let o = 0; o < octaves; o++) {
    value += amplitude * (1 - Math.abs(valueNoiseTiled(u * freq, v * freq, seed + o * 71, freq) * 2 - 1));
    amplitude *= 0.5;
    freq *= 2;
  }
  return value;
};

const mix = (a: THREE.Color, b: THREE.Color, t: number, out: THREE.Color) => {
  out.setRGB(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
  return out;
};

/** THREE.Color хранит линейный цвет, а canvas - sRGB: без обратного преобразования текстура темнеет вдвое. */
const encode = (value: number) => {
  const s = value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
  return Math.round(THREE.MathUtils.clamp(s, 0, 1) * 255);
};

type SurfaceKind = 'ground' | 'bark' | 'rock' | 'metal' | 'ice' | 'magma' | 'cloth' | 'foliage';

export interface Surface {
  map: THREE.CanvasTexture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  emissiveMap?: THREE.Texture;
}

const surfaces = new Map<string, Surface>();

const writeCanvas = (size: number, fill: (x: number, y: number, ctx: ImageData) => void) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const data = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      fill(x, y, data);
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
};

const asTexture = (canvas: HTMLCanvasElement, srgb: boolean, repeat = 1) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 4;
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
};

/**
 * Процедурная PBR-поверхность: цвет, нормаль и шероховатость считаются из шума.
 * Без внешних файлов: карта выглядит материалом, а не плашечкой.
 */
export const makeSurface = (kind: SurfaceKind, palette: BiomePalette, seed = 7, repeat = 1): Surface => {
  const key = `${kind}-${seed}-${palette.soil}-${repeat}`;
  const cached = surfaces.get(key);
  if (cached) return cached;

  const size = 256;
  const height = new Float32Array(size * size);
  const dark = new THREE.Color(palette.soilDark);
  const light = new THREE.Color(palette.soilLight);
  const rockCol = new THREE.Color(palette.rock);
  const rockDarkCol = new THREE.Color(palette.rockDark);
  const barkCol = new THREE.Color(palette.bark);
  const leafCol = new THREE.Color(palette.foliage);
  const leafDark = new THREE.Color(palette.foliageDark);
  const metalCol = new THREE.Color(palette.metal);
  const lavaCol = new THREE.Color(palette.lava ?? palette.accent);
  const tint = new THREE.Color();

  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];

  const colorCanvas = writeCanvas(size, (x, y, data) => {
    const u = x / size;
    const v = y / size;
    let h = 0.5;
    let i = (y * size + x) * 4;

    if (kind === 'ground') {
      h = fbmTiled(u, v, seed, 5, 7);
      // Пятна крупнее клетки и слабее по контрасту: на частоте 2 на плитку они ложились ровно в шахматку.
      const patch = fbmTiled(u, v, seed + 61, 3, 1);
      const pebbles = fbmTiled(u, v, seed + 21, 3, 34);
      const litter = fbmTiled(u, v, seed + 44, 2, 52);
      const cracks = ridgeTiled(u, v, seed + 9, 3, 5);
      const crackLine = cracks > 0.86 ? (cracks - 0.86) * 5 : 0;
      mix(dark, light, h * 0.9, tint);
      // Пятна прели и мха: однородная площадь читается как бетон, а не как почва.
      tint.lerp(leafDark, THREE.MathUtils.clamp((patch - 0.52) * 0.8, 0, 0.4));
      tint.multiplyScalar(0.93 + patch * 0.14);
      tint.multiplyScalar(1 - crackLine * 0.55);
      if (pebbles > 0.74) tint.lerp(rockCol, (pebbles - 0.74) * 2.4);
      if (litter > 0.85) tint.lerp(barkCol, (litter - 0.85) * 2.6);
      h = h * 0.75 + pebbles * 0.25 - crackLine * 0.2;
    } else if (kind === 'rock') {
      h = fbmTiled(u, v, seed, 4, 5);
      const facets = ridgeTiled(u, v, seed + 3, 3, 11);
      mix(rockDarkCol, rockCol, h, tint);
      tint.multiplyScalar(0.82 + facets * 0.36);
      h = h * 0.6 + facets * 0.4;
    } else if (kind === 'bark') {
      const grooves = valueNoiseTiled(u * 4, v * 26, seed, 4) * 0.6 + valueNoiseTiled(u * 9, v * 60, seed + 5, 9) * 0.4;
      // Раньше кора уходила в soilDark на 0.9: ствол босса выходил чёрным силуэтом при любом свете.
      mix(barkCol, dark, grooves * 0.5, tint);
      tint.multiplyScalar(0.8 + grooves * 0.42);
      const moss = fbmTiled(u, v, seed + 31, 3, 6);
      if (moss > 0.66) tint.lerp(leafDark, (moss - 0.66) * 1.5);
      h = grooves;
    } else if (kind === 'foliage') {
      h = fbmTiled(u, v, seed, 4, 9);
      mix(leafDark, leafCol, h, tint);
      tint.multiplyScalar(0.85 + fbmTiled(u, v, seed + 2, 2, 26) * 0.35);
    } else if (kind === 'metal') {
      // Шлифовка в одну сторону: перекрёстные полосы u*90/v*4 + u*26/v*80 ложились клеткой и обшивка выглядела тканью.
      const brushed = valueNoiseTiled(u * 70, v * 5, seed, 70) * 0.5 + fbmTiled(u, v, seed + 4, 3, 9) * 0.5;
      const grime = fbmTiled(u, v, seed + 8, 3, 6);
      mix(metalCol, dark, grime * 0.55, tint);
      tint.multiplyScalar(0.9 + brushed * 0.18);
      const scratch = ridgeTiled(u, v, seed + 12, 2, 40);
      if (scratch > 0.93) tint.lerp(light, 0.5);
      // Рельеф почти весь из пятен: частые рёбра превращали корпус в гофру.
      h = brushed * 0.2 + grime * 0.8;
    } else if (kind === 'ice') {
      h = fbmTiled(u, v, seed, 4, 6);
      const veins = ridgeTiled(u, v, seed + 6, 3, 12);
      const depth = fbmTiled(u, v, seed + 14, 3, 3);
      // Почти белый лёд на ярком снегу превращал королеву в световое пятно; у настоящего льда синий нутряной тон.
      mix(new THREE.Color('#3c647e'), new THREE.Color('#a7cbdc'), THREE.MathUtils.clamp(h * 0.8 + depth * 0.2, 0, 1), tint);
      if (veins > 0.85) tint.multiplyScalar(0.62);
      h = h * 0.35 + veins * 0.65;
    } else if (kind === 'magma') {
      h = fbmTiled(u, v, seed, 4, 6);
      mix(rockDarkCol, rockCol, h, tint);
      const cracks = ridgeTiled(u, v, seed + 17, 4, 4);
      const glow = THREE.MathUtils.clamp((cracks - 0.72) * 3.4, 0, 1);
      if (glow > 0) mix(tint, lavaCol, glow, tint);
      h = h * 0.7 + (1 - cracks) * 0.3;
    } else {
      // cloth: плотная ткань с ворсом и пылью
      h = fbmTiled(u, v, seed, 4, 18);
      mix(new THREE.Color('#4a3c3a'), new THREE.Color('#7a6257'), h, tint);
      // Мягкие редкие полосы: частые давали вельвет, а не шерсть.
      const nap = valueNoiseTiled(u * 22, v * 9, seed, 22) * 0.6 + fbmTiled(u, v, seed + 3, 3, 7) * 0.4;
      tint.multiplyScalar(0.92 + nap * 0.16);
      h = h * 0.6 + nap * 0.4;
    }

    data.data[i] = encode(tint.r);
    data.data[i + 1] = encode(tint.g);
    data.data[i + 2] = encode(tint.b);
    data.data[i + 3] = 255;
    height[y * size + x] = h;
  });

  const emissiveKind = kind === 'magma';
  const emissiveCanvas = emissiveKind
    ? writeCanvas(size, (x, y, data) => {
        const cracks = ridgeTiled(x / size, y / size, seed + 17, 4, 4);
        const glow = THREE.MathUtils.clamp((cracks - 0.74) * 4, 0, 1);
        const i = (y * size + x) * 4;
        data.data[i] = Math.round(255 * glow);
        data.data[i + 1] = Math.round(120 * glow);
        data.data[i + 2] = Math.round(40 * glow);
        data.data[i + 3] = 255;
      })
    : null;

  const normalCanvas = writeCanvas(size, (x, y, data) => {
    const dx = (at(x + 1, y) - at(x - 1, y)) * 2.4;
    const dy = (at(x, y + 1) - at(x, y - 1)) * 2.4;
    const len = Math.hypot(-dx, -dy, 1);
    const i = (y * size + x) * 4;
    data.data[i] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
    data.data[i + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
    data.data[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
    data.data[i + 3] = 255;
  });

  const roughCanvas = writeCanvas(size, (x, y, data) => {
    const h = height[y * size + x];
    const base = kind === 'metal' ? 0.32 : kind === 'ice' ? 0.22 : 0.62;
    const rough = THREE.MathUtils.clamp(base + (1 - h) * 0.38, 0.05, 1);
    const i = (y * size + x) * 4;
    data.data[i] = Math.round(rough * 255);
    data.data[i + 1] = Math.round(rough * 255);
    data.data[i + 2] = Math.round(rough * 255);
    data.data[i + 3] = 255;
  });

  const surface: Surface = {
    map: asTexture(colorCanvas, true, repeat),
    normalMap: asTexture(normalCanvas, false, repeat),
    roughnessMap: asTexture(roughCanvas, false, repeat),
  };
  if (emissiveCanvas) surface.emissiveMap = asTexture(emissiveCanvas, true, repeat);
  surfaces.set(key, surface);
  return surface;
};

/** Мягкое пятно под объектом: контактная тень там, где shadow map не вытягивает. */
export const makeShadowBlob = () => {
  const size = 128;
  const canvas = writeCanvas(size, (x, y, data) => {
    const d = Math.hypot(x - size / 2, y - size / 2) / (size / 2);
    const a = THREE.MathUtils.clamp(1 - d, 0, 1) ** 1.7;
    const i = (y * size + x) * 4;
    data.data[i] = 0;
    data.data[i + 1] = 0;
    data.data[i + 2] = 0;
    data.data[i + 3] = Math.round(a * 190);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

/** Текстура частицы для погоды: от снежинки до искры. */
export const makeParticleSprite = (kind: 'spore' | 'sand' | 'snow' | 'dust' | 'ash' | 'ember') => {
  const size = 64;
  const core =
    kind === 'ember' ? '#ffb066' : kind === 'snow' ? '#eef6fb' : kind === 'sand' ? '#d8bd8f' : kind === 'ash' ? '#9a9a9a' : '#cfd8c4';
  const canvas = writeCanvas(size, (x, y, data) => {
    const d = Math.hypot(x - size / 2, y - size / 2) / (size / 2);
    const a = THREE.MathUtils.clamp(1 - d, 0, 1) ** (kind === 'snow' ? 1.4 : 2.2);
    const c = new THREE.Color(core);
    const i = (y * size + x) * 4;
    data.data[i] = encode(c.r);
    data.data[i + 1] = encode(c.g);
    data.data[i + 2] = encode(c.b);
    data.data[i + 3] = Math.round(a * 255);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

/** Надписи только через canvas: трёхмерный шрифт тянул бы файл из сети. */
export const makeLabelTexture = (text: string, color = '#f0e6d2', size = 128) => {
  const canvas = document.createElement('canvas');
  canvas.width = size * 2;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `700 ${Math.round(size * 0.62)}px 'Segoe UI', system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.round(size * 0.07);
  ctx.strokeStyle = 'rgba(8, 10, 12, 0.85)';
  ctx.fillStyle = color;
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

/** Небо-градиент: без него за краем доски висит плоская серая подложка. */
export const makeSkyGradient = (zenith: string, horizon: string, ground: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, zenith);
  gradient.addColorStop(0.52, horizon);
  gradient.addColorStop(0.62, horizon);
  gradient.addColorStop(1, ground);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
};

/** Мягкая рамка для туманного края доски: без резкого обрыва. */
export const makeRadialFade = (inner = 0.45, outer = 0.98, strength = 0.85) => {
  const size = 256;
  const canvas = writeCanvas(size, (x, y, data) => {
    const d = Math.hypot(x - size / 2, y - size / 2) / (size / 2);
    const a = THREE.MathUtils.clamp((d - inner) / (outer - inner), 0, 1) * strength;
    const i = (y * size + x) * 4;
    data.data[i] = 0;
    data.data[i + 1] = 0;
    data.data[i + 2] = 0;
    data.data[i + 3] = Math.round(a * 255);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

/** Шум для смещения вершин рельефа. */
export const terrainHeight = (x: number, z: number, seed = 7, amp = 0.06) =>
  (fbm(x * 1.6 + 40, z * 1.6 + 40, seed, 4) - 0.5) * amp;

/**
 * Высота грунта в мировых координатах: плитки и модели берут её из одной функции.
 * Волна широкая (несколько клеток) и умеренная: на частоте одной клетки поле распадалось на плитки-столешницы.
 */
export const groundAt = (x: number, z: number) => PLATEAU_H + terrainHeight(x * 0.34, z * 0.34, 11, 0.3);

/**
 * Земля за краем доски: плоский лист выглядел как подложка из фотостудии, поэтому к горизонту он нарастает холмами.
 * Под самой доской рельеф выключен: иначе плиты висели бы над впадинами.
 */
export const makeOuterGroundGeometry = (size: number, plateauSpan: number) => {
  const geo = new THREE.PlaneGeometry(size, size, 72, 72);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const mask = THREE.MathUtils.smoothstep(Math.hypot(x, z), plateauSpan * 0.8, plateauSpan * 2.4);
    const hills = terrainHeight(x * 0.3, z * 0.3, 5, 5.2) - 0.5 * mask;
    pos.setY(i, hills * mask);
  }
  geo.computeVertexNormals();
  return geo;
};

/**
 * Травинка-ленточка с изгибом: конус на клетке читается как ёлка-оригами.
 * Нормали наклонены к небу, иначе вертикальная лента не ловит верхний свет.
 */
export const makeBladeGeometry = (height = 0.26, width = 0.055, lean = 0.15, segments = 4) => {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const normal = new THREE.Vector3();

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const half = width * 0.5 * (1 - t * t * 0.9);
    const y = height * (t - t * t * 0.3);
    const z = lean * t * t;
    const slope = new THREE.Vector3(0, height * (1 - 0.6 * t), 2 * lean * t);
    normal.set(0, slope.z, -slope.y).normalize().lerp(up, 0.55).normalize();
    // Кончик темнее середины: прежнее 0.5+t*0.8 с жёлтым сдвигом давало светящиеся зелёные иголки поверх грунта.
    const shade = 0.46 + t * 0.4;
    for (const side of [-1, 1]) {
      positions.push(side * half, y, z);
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(side < 0 ? 0 : 1, t);
      colors.push(shade, shade * 0.98, shade * 0.88);
    }
    if (i > 0) {
      const a = (i - 1) * 2;
      indices.push(a, a + 2, a + 3, a, a + 3, a + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  return geo;
};

export const seededRandom = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Силуэт дальнего пояса высотой 1 с основанием на y=0.
 * Одинокий конус читается как вбитый штырь, поэтому хвойный профиль собирается из трёх ярусов.
 */
export const makeBackdropGeometry = (biome: Biome | undefined) => {
  let geo: THREE.BufferGeometry;
  switch (biome) {
    case 'desert': {
      // Купол вместо конуса: четырёхгранный конус на горизонте читался как смятый лист, а не бархан.
      geo = new THREE.SphereGeometry(1, 24, 9, 0, Math.PI * 2, 0, Math.PI / 2);
      // Гребень и сдутый наветренный склон: ровный купол выглядел как надутый мяч.
      const dp = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < dp.count; i++) {
        const x = dp.getX(i);
        const y = dp.getY(i);
        const z = dp.getZ(i);
        const carve = valueNoiseTiled(x * 1.3 + 9, z * 1.3 + 3, 21, 4);
        dp.setXYZ(i, x * (0.9 + carve * 0.35), y * (0.55 + valueNoiseTiled(x * 2.1, z * 2.1, 7, 5) * 0.6), z * (0.9 + carve * 0.35));
      }
      geo.computeVertexNormals();
      break;
    }
    case 'cave':
    case 'volcano':
      // Два слипшихся массива: одиночный конус на горизонте выглядел как игла, а не скала.
      geo = mergeGeometries(
        [
          new THREE.ConeGeometry(0.85, 0.8, 6, 1).translate(0, 0.4, 0),
          new THREE.ConeGeometry(0.5, 0.6, 5, 1).rotateY(0.7).translate(0.42, 0.26, 0.18),
        ],
        false,
      )!;
      break;
    case 'swamp':
      geo = mergeGeometries(
        [
          new THREE.CylinderGeometry(0.06, 0.1, 0.7, 5).translate(0, 0.35, 0),
          new THREE.ConeGeometry(0.45, 0.6, 5, 1).translate(0, 0.85, 0),
        ],
        false,
      )!;
      break;
    default:
      geo = mergeGeometries(
        [0, 1, 2].map((i) => new THREE.ConeGeometry(0.62 - i * 0.17, 0.62, 7).translate(0, 0.5 + i * 0.34, 0)),
        false,
      )!;
  }
  geo.computeBoundingBox();
  const height = geo.boundingBox?.max.y || 1;
  geo.scale(1, 1 / height, 1);
  geo.computeBoundingSphere();
  return geo;
};
