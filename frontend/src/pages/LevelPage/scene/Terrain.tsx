import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { LevelMapData, Terrain as TerrainKind } from '../types';
import { GAP, cellCenter, paletteOf } from './palette';
import { groundAt, makeBackdropGeometry, makeBladeGeometry, makeOuterGroundGeometry, makeParticleSprite, makeSurface, seededRandom, terrainHeight } from './procedural';

const CELL_NAMES_A = 65;
const posName = (x: number, y: number) => `${String.fromCharCode(CELL_NAMES_A + x)}${y + 1}`;

/** Боковые грани плитки в обход против часовой, если смотреть снаружи: иначе three обрежет переднюю сторону. */
const SIDES: Array<{ normal: [number, number, number]; corners: Array<[number, number, number]> }> = [
  { normal: [0, 0, 1], corners: [[-1, 0, 1], [1, 0, 1], [1, 1, 1], [-1, 1, 1]] },
  { normal: [0, 0, -1], corners: [[1, 0, -1], [-1, 0, -1], [-1, 1, -1], [1, 1, -1]] },
  { normal: [1, 0, 0], corners: [[1, 0, 1], [1, 0, -1], [1, 1, -1], [1, 1, 1]] },
  { normal: [-1, 0, 0], corners: [[-1, 0, -1], [-1, 0, 1], [-1, 1, 1], [-1, 1, -1]] },
];

/** sy=1 - верх плитки на общем поле высот, sy=0 - низ на крышке земляного массива. */
const faceHeight = (sy: number, px: number, pz: number) => (sy > 0 ? groundAt(px, pz) : 0);

/** Нормаль вершины по фактическому градиенту: одна грань на всю плитку делала поле смятым фольгой. */
const normalAt = (px: number, pz: number) => {
  const e = 0.08;
  return new THREE.Vector3(
    -(groundAt(px + e, pz) - groundAt(px - e, pz)) / (2 * e),
    1,
    -(groundAt(px, pz + e) - groundAt(px, pz - e)) / (2 * e),
  ).normalize();
};

/** Деление верха клетки: 3x3 квада на плитку уже не выглядят как отдельная столешница. */
const TOP_SUB = 3;

const faceUv = (nx: number, ny: number, px: number, py: number, pz: number): [number, number] => {
  if (ny === 1) return [px, pz];
  if (nx === 1 || nx === -1) return [pz, py];
  return [px, py];
};

/** Вершинный цвет - множитель к текстуре, а не цвет земли: иначе оттенок затемняется дважды. */
const tints: Record<TerrainKind, [number, number, number]> = {
  ice: [0.72, 0.95, 1.3],
  mud: [0.86, 0.66, 0.42],
};

const EXIT_TINT: [number, number, number] = [1.2, 1.08, 0.72];
const ROCK_TINT: [number, number, number] = [0.66, 0.68, 0.66];
const NEUTRAL_TINT: [number, number, number] = [1, 1, 1];

/** Множитель для земляного массива под плитками: глина в щелях, а не чёрная подставка. */
const baseTint = new THREE.Color(0.5, 0.44, 0.36);

/** Дальняя земля темнее доски: иначе фон перетягивает взгляд с поля. */
const outerTint = new THREE.Color(0.32, 0.29, 0.25);

/** Пятна света на грунте: волна на несколько клеток. На частоте клетки соседние плитки антикоррелировали и поле рябило шахматкой. */
const shadeAt = (x: number, z: number) => 0.9 + terrainHeight(x * 0.4 + 9, z * 0.4 - 4, 5, 0.24) * 0.55;

const DECOR: Record<string, { kind: 'grass' | 'shard' | 'pebble' | 'sprig'; count: number }> = {
  forest: { kind: 'grass', count: 5 },
  swamp: { kind: 'sprig', count: 4 },
  desert: { kind: 'pebble', count: 3 },
  snow: { kind: 'shard', count: 3 },
  cave: { kind: 'shard', count: 2 },
  volcano: { kind: 'pebble', count: 4 },
};

interface TerrainProps {
  map: LevelMapData;
  occupied: Set<string>;
}

/** Плитки клеток одним мешем: швы между ними - настоящие щели, а не нарисованная сетка. */
export const Terrain = ({ map, occupied }: TerrainProps) => {
  const palette = paletteOf(map.biome);
  const width = map.width;
  const height = map.height;
  const terrain = map.terrain ?? {};
  const rocks = map.rocks ?? [];
  const exitCell = map.exit;

  const rockSet = useMemo(() => new Set(rocks), [rocks]);

  const groundSurface = useMemo(() => makeSurface('ground', palette, 3, 0.45), [palette]);
  const outerSize = Math.max(width, height) * 7;
  const outerSurface = useMemo(() => makeSurface('ground', palette, 17, outerSize * 0.22), [palette, outerSize]);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const half = (1 - GAP) / 2;
    let vertex = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const name = posName(x, y);
        const { x: cx, z: cz } = cellCenter(x, y, width, height);

        let tint = NEUTRAL_TINT;
        const kind = terrain[name];
        if (kind) tint = tints[kind];
        if (rockSet.has(name)) tint = ROCK_TINT;
        if (name === exitCell) tint = EXIT_TINT;

        const push = (
          nx: number,
          ny: number,
          px: number,
          py: number,
          pz: number,
          dim: number,
          flat: [number, number, number] | null,
        ) => {
          positions.push(px, py, pz);
          if (flat) normals.push(...flat);
          else {
            const n = normalAt(px, pz);
            normals.push(n.x, n.y, n.z);
          }
          const [u, v] = faceUv(nx, ny, px, py, pz);
          uvs.push(u, v);
          const luminance = shadeAt(px, pz);
          colors.push(luminance * tint[0] * dim, luminance * tint[1] * dim, luminance * tint[2] * dim);
        };

        for (const face of SIDES) {
          for (const [sx, sy, sz] of face.corners) {
            const px = cx + sx * half;
            const pz = cz + sz * half;
            push(face.normal[0], face.normal[1], px, faceHeight(sy, px, pz), pz, 0.72, face.normal);
          }
          indices.push(vertex, vertex + 1, vertex + 2, vertex, vertex + 2, vertex + 3);
          vertex += 4;
        }

        const step = (half * 2) / TOP_SUB;
        for (let iy = 0; iy < TOP_SUB; iy++) {
          for (let ix = 0; ix < TOP_SUB; ix++) {
            const x0 = cx - half + ix * step;
            const z0 = cz - half + iy * step;
            for (const [px, pz] of [
              [x0, z0],
              [x0, z0 + step],
              [x0 + step, z0 + step],
              [x0 + step, z0],
            ]) {
              push(0, 1, px, groundAt(px, pz), pz, 1, null);
            }
            indices.push(vertex, vertex + 1, vertex + 2, vertex, vertex + 2, vertex + 3);
            vertex += 4;
          }
        }
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
  }, [width, height, terrain, rockSet, exitCell, palette]);

  const outerGeometry = useMemo(() => makeOuterGroundGeometry(outerSize, Math.max(width, height)), [outerSize, width, height]);

  useLayoutEffect(() => () => outerGeometry.dispose(), [outerGeometry]);

  useLayoutEffect(() => () => geometry.dispose(), [geometry]);

  const spanX = width * (1 - GAP);
  const spanZ = height * (1 - GAP);

  const scatter = useMemo(() => {
    const spec = DECOR[map.biome ?? 'forest'];
    const rand = seededRandom(width * 131 + height * 17 + 3);
    const items: Array<{ x: number; y: number; z: number; yaw: number; tilt: number; scale: number; tint: number }> = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const name = posName(x, y);
        if (rockSet.has(name) || name === exitCell || occupied.has(name)) continue;
        const { x: cx, z: cz } = cellCenter(x, y, width, height);
        // Кочки и камни рассыпаются по всей клетке мелкими группами: 2-3 плотных кучи оставляли половину клетки пустой,
        // и поле рябило шахматкой из светлых и тёмных плиток.
        const clusters = 3 + Math.floor(rand() * 3);
        for (let c = 0; c < clusters; c++) {
          const ox = (rand() - 0.5) * (1 - GAP) * 0.92;
          const oz = (rand() - 0.5) * (1 - GAP) * 0.92;
          const blades = 1 + Math.floor(rand() * Math.max(2, spec.count * 0.6));
          for (let k = 0; k < blades; k++) {
            const px = cx + ox + (rand() - 0.5) * 0.34;
            const pz = cz + oz + (rand() - 0.5) * 0.34;
            items.push({
              x: px,
              z: pz,
              y: groundAt(px, pz) - 0.015,
              yaw: rand() * Math.PI * 2,
              tilt: (rand() - 0.5) * 0.5,
              scale: 0.55 + rand() * 0.6,
              tint: rand(),
            });
          }
        }
      }
    }
    return { spec, items };
  }, [map.biome, width, height, rockSet, exitCell, occupied]);

  const scatterRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = scatterRef.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();
    const light = new THREE.Color(scatter.spec.kind === 'grass' || scatter.spec.kind === 'sprig' ? palette.foliage : palette.rock);
    const dark = new THREE.Color(scatter.spec.kind === 'grass' || scatter.spec.kind === 'sprig' ? palette.foliageDark : palette.rockDark);
    // Камешки и осколки тонут в грунте: светлые точки на тёмной плитке и рисовали ту самую шахматку.
    if (scatter.spec.kind === 'pebble' || scatter.spec.kind === 'shard') {
      light.multiplyScalar(0.72);
      dark.multiplyScalar(0.72);
    }
    const heightFactor = scatter.spec.kind === 'grass' || scatter.spec.kind === 'sprig'
      ? (t: number) => 0.75 + t * 0.4
      : scatter.spec.kind === 'pebble'
        ? () => 0.45
        : (t: number) => 0.9 + t * 0.9;
    scatter.items.forEach((item, index) => {
      euler.set(item.tilt, item.yaw, item.tilt * 0.6);
      quaternion.setFromEuler(euler);
      position.set(item.x, item.y, item.z);
      scale.set(item.scale, item.scale * heightFactor(item.tint), item.scale);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
      color.copy(dark).lerp(light, item.tint);
      mesh.setColorAt(index, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [scatter, palette]);

  const scatterMaterial = useMemo(() => {
    const kind = scatter.spec.kind;
    const blade = kind === 'grass' || kind === 'sprig';
    return new THREE.MeshStandardMaterial({
      // Оттенок берётся из instanceColor: материал нейтральный, иначе цвет удваивается.
      color: '#ffffff',
      vertexColors: blade,
      roughness: kind === 'shard' ? 0.35 : 0.95,
      metalness: kind === 'shard' ? 0.05 : 0.02,
      flatShading: kind === 'pebble',
      side: blade ? THREE.DoubleSide : THREE.FrontSide,
    });
  }, [scatter]);

  const scatterGeometry = useMemo(() => {
    switch (scatter.spec.kind) {
      case 'grass':
        return makeBladeGeometry(0.34, 0.075, 0.2);
      case 'sprig':
        return makeBladeGeometry(0.44, 0.095, 0.28, 5);
      case 'shard':
        return new THREE.ConeGeometry(0.06, 0.3, 5);
      default:
        return new THREE.IcosahedronGeometry(0.07, 0);
    }
  }, [scatter]);

  useLayoutEffect(
    () => () => {
      scatterGeometry.dispose();
      scatterMaterial.dispose();
    },
    [scatterGeometry, scatterMaterial],
  );

  return (
    <group>
      {/* Грунт за краем подходит почти вровень с полем: торец читается как терраса, а не как ящик. */}
      <mesh geometry={outerGeometry} position={[0, -0.62, 0]} receiveShadow>
        <meshStandardMaterial
          map={outerSurface.map}
          normalMap={outerSurface.normalMap}
          roughnessMap={outerSurface.roughnessMap}
          color={outerTint}
          roughness={1}
          metalness={0}
        />
      </mesh>

      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          vertexColors
          map={groundSurface.map}
          normalMap={groundSurface.normalMap}
          roughnessMap={groundSurface.roughnessMap}
          normalScale={new THREE.Vector2(1.4, 1.4)}
          roughness={palette.roughness}
          metalness={0.02}
          color="#ffffff"
        />
      </mesh>

      {/* Земляной массив под плитками: в щелях видна глина, а не пустота. */}
      <mesh position={[0, -0.62, 0]} receiveShadow>
        <boxGeometry args={[spanX + 1.1, 1.2, spanZ + 1.1]} />
        <meshStandardMaterial
          map={groundSurface.map}
          normalMap={groundSurface.normalMap}
          roughnessMap={groundSurface.roughnessMap}
          color={baseTint}
          roughness={1}
          metalness={0}
        />
      </mesh>

      <instancedMesh
        ref={scatterRef}
        args={[scatterGeometry, scatterMaterial, Math.max(1, scatter.items.length)]}
        castShadow
        receiveShadow
      />
    </group>
  );
};

/** Силуэты за дальним краем доски: без пояса за горизонтом биом повисает в плоской пустоте. */
export const Backdrop = ({ map }: { map: LevelMapData }) => {
  const palette = paletteOf(map.biome);
  const span = Math.max(map.width, map.height);
  const count = 340;
  const ref = useRef<THREE.InstancedMesh>(null);

  // Все силуэты высотой 1 с основанием на нуле: тогда scale.y и есть реальная высота.
  const geometry = useMemo(() => makeBackdropGeometry(map.biome), [map.biome]);

  const material = useMemo(
    // Барханы сглажены: гранёный купол на горизонте читался как смятая фольга.
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, metalness: 0, flatShading: map.biome !== 'desert' }),
    [map.biome],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();
    const stone = new THREE.Color(palette.rockDark).multiplyScalar(0.5);
    // Пояс красится по породе: одинаково тёмный силуэт в любом биоме выглядел как уголь.
    const tree = new THREE.Color(palette.foliageDark).multiplyScalar(0.46);
    const dune = new THREE.Color(palette.soil).multiplyScalar(0.3);
    const pale = new THREE.Color(palette.fog);
    const rand = seededRandom(span * 977 + 31);
    for (let i = 0; i < count; i++) {
      // Полный круг, а не дуга за дальним краем: камера крутится на 360, и с противоположной стороны
      // доска иначе висела бы на голом грунте. Дальше пояса уходить нельзя — силуэты уходят за верхнюю кромку кадра и лес исчезает.
      const angle = rand() * Math.PI * 2;
      // Пояс собирается по биому: барханы плоские и широкие, скалы короткие и массивные, деревья высокие и тонкие.
      const kind = map.biome === 'desert' ? 'dune' : map.biome === 'cave' || map.biome === 'volcano' ? 'rock' : 'tree';
      const distance = span * (1.05 + rand() * 0.85);
      const height = kind === 'dune' ? 0.9 + rand() * 1.5 : kind === 'rock' ? 1.6 + rand() * 2.4 : 2 + rand() * 2.4;
      const width = kind === 'dune' ? 5 + rand() * 7 : kind === 'rock' ? 1.6 + rand() * 2.2 : 0.7 + rand() * 1.4;
      const depth = kind === 'dune' ? 1.6 + rand() * 2.4 : kind === 'rock' ? width * (0.7 + rand() * 0.6) : width;
      euler.set((rand() - 0.5) * 0.16, kind === 'tree' ? angle : rand() * Math.PI * 2, (rand() - 0.5) * 0.16);
      quaternion.setFromEuler(euler);
      position.set(Math.cos(angle) * distance, -0.66, Math.sin(angle) * distance);
      scale.set(width, height, depth);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
      // Масса перекрывается, поэтому дальние деревья только чуть светлее ближних: иначе пояс распадается на отдельные конусы.
      const base = kind === 'tree' ? tree : kind === 'dune' ? dune : stone;
      color.copy(base).lerp(pale, Math.min(0.5, 0.06 + (distance / span - 1.0) * 0.3));
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [palette, span, map.biome]);

  useLayoutEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />;
};

const WEATHER_MOTION = {
  spore: { drift: 0.22, fall: -0.08 },
  sand: { drift: 1.5, fall: -0.05 },
  snow: { drift: 0.35, fall: -0.45 },
  dust: { drift: 0.12, fall: -0.02 },
  ash: { drift: 0.4, fall: -0.3 },
  ember: { drift: 0.25, fall: 0.55 },
};

/** Погода объёмом над всей доской: плоский слой дождя/снега выдавал бы макет. */
export const Weather = ({ map }: { map: LevelMapData }) => {
  const palette = paletteOf(map.biome);
  const count = palette.weatherDensity;
  const sprite = useMemo(() => makeParticleSprite(palette.weather), [palette.weather]);
  const motion = WEATHER_MOTION[palette.weather];
  const span = Math.max(map.width, map.height) * 0.9 + 4;
  const depth = Math.max(map.width, map.height) * 1.1 + 4;
  // Крупная доска снимается дальше: частицы надо увеличивать, иначе погода исчезает.
  const dotScale = Math.max(1, Math.max(map.width, map.height) / 9);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);
    const rand = seededRandom(map.width * 71 + map.height * 13 + 5);
    for (let i = 0; i < count; i++) {
      seeds[i * 3] = (rand() - 0.5) * span;
      seeds[i * 3 + 1] = rand() * 3.2 + 0.2;
      seeds[i * 3 + 2] = (rand() - 0.5) * depth;
      positions[i * 3] = seeds[i * 3];
      positions[i * 3 + 1] = seeds[i * 3 + 1];
      positions[i * 3 + 2] = seeds[i * 3 + 2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('seed', new THREE.BufferAttribute(seeds, 3));
    return geo;
  }, [count, span, depth, map.width, map.height]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: sprite,
        size: (palette.weather === 'snow' ? 0.1 : palette.weather === 'ember' ? 0.07 : 0.055) * dotScale,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        opacity: palette.weather === 'sand' ? 0.5 : 0.85,
        blending: palette.weather === 'ember' ? THREE.AdditiveBlending : THREE.NormalBlending,
        color: palette.weather === 'ember' ? palette.accent : '#ffffff',
      }),
    [sprite, palette, dotScale],
  );

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    const attribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    const seeds = geometry.getAttribute('seed') as THREE.BufferAttribute;
    const time = state.clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const sx = seeds.getX(i);
      const sy = seeds.getY(i);
      const sz = seeds.getZ(i);
      const phase = i * 0.37;
      const fall = (sy + time * motion.fall + phase) % 3.4;
      const wrapped = fall < 0 ? fall + 3.4 : fall;
      attribute.setXYZ(
        i,
        sx + Math.sin(time * 0.35 + phase) * 0.5 + ((time * motion.drift + phase * 3) % span) - span * 0.5,
        wrapped + 0.15,
        sz + Math.cos(time * 0.27 + phase) * 0.5,
      );
    }
    attribute.needsUpdate = true;
  });

  useLayoutEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
};
