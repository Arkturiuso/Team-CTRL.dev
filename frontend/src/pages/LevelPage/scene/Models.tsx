import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { Biome } from '../types';
import type { BiomePalette } from './palette';
import { seededRandom } from './procedural';
import { plainMaterial, surfaceMaterial } from './materials';
import { Lump, Plate, Spike, Tube } from './Sculpt';

type Vec3 = [number, number, number];

/** Углы модели по направлению: фронт смотрит на -z, то есть на «север» поля. */
export const DIRECTION_Y: Record<string, number> = {
  up: 0,
  right: -Math.PI / 2,
  down: Math.PI,
  left: Math.PI / 2,
};

const RUBBER = '#26282a';

interface PartProps {
  args: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  material: THREE.Material;
  radius?: number;
}

/** Коробка со скруглёнными рёбрами: острый куб на клетке читается как игрушка. */
const Part = ({ args, position, rotation, scale, material, radius = 0.02 }: PartProps) => (
  <RoundedBox
    args={args}
    radius={Math.min(radius, Math.min(...args) * 0.42)}
    smoothness={2}
    steps={1}
    position={position}
    rotation={rotation}
    scale={scale}
    material={material}
    castShadow
    receiveShadow
  />
);

const Bar = ({
  args,
  position,
  rotation,
  material,
  shadow = true,
}: {
  args: [number, number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  material: THREE.Material;
  shadow?: boolean;
}) => (
  <mesh position={position} rotation={rotation} material={material} castShadow={shadow}>
    <cylinderGeometry args={args} />
  </mesh>
);

const Blob = ({
  args,
  position,
  rotation,
  scale,
  material,
  shadow = true,
}: {
  args: [number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  material: THREE.Material;
  shadow?: boolean;
}) => (
  <mesh position={position} rotation={rotation} scale={scale} material={material} castShadow={shadow} receiveShadow={shadow}>
    <sphereGeometry args={args} />
  </mesh>
);

/** Конечность как цилиндр между двумя точками: углы вручную ломались при любой правке размеров модели. */
export const Limb = ({
  from,
  to,
  r0,
  r1,
  segments = 6,
  material,
  shadow = true,
  ref,
}: {
  from: [number, number, number];
  to: [number, number, number];
  r0: number;
  r1?: number;
  segments?: number;
  material: THREE.Material;
  shadow?: boolean;
  ref?: React.Ref<THREE.Mesh>;
}) => {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  const length = dir.length();
  const mid = a.clone().addScaledVector(dir, 0.5);
  const euler = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()),
  );
  return (
    <mesh ref={ref} position={mid} rotation={euler} material={material} castShadow={shadow}>
      <cylinderGeometry args={[r1 ?? r0, r0, length, segments]} />
    </mesh>
  );
};

const Shard = ({
  args,
  position,
  rotation,
  scale,
  material,
}: {
  args: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  material: THREE.Material;
}) => (
  <mesh position={position} rotation={rotation} scale={scale} material={material} castShadow>
    <coneGeometry args={args} />
  </mesh>
);

/** Перепонка: лист между «шпангоутами» крыла. Пластина-эллипсоид давал линзу вместо membrane. */
const Membrane = ({
  spars,
  sag = 0.02,
  seed = 1,
  material,
}: {
  spars: { root: Vec3; tip: Vec3 }[];
  sag?: number;
  seed?: number;
  material: THREE.Material;
}) => {
  const key = JSON.stringify([spars, sag]);
  const geo = useMemo(() => {
    const rnd = seededRandom(seed);
    const pos: number[] = [];
    const idx: number[] = [];
    for (const s of spars) {
      const drop = sag * (0.6 + rnd() * 0.8);
      pos.push(...s.root);
      // Средний ряд провисает и чуть оттянут внутрь: натянутый лист фанеры крылом не читается.
      pos.push(
        s.root[0] + (s.tip[0] - s.root[0]) * 0.44,
        s.root[1] - drop,
        s.root[2] + (s.tip[2] - s.root[2]) * 0.44 + drop * 0.3,
      );
      pos.push(...s.tip);
    }
    for (let k = 0; k < spars.length - 1; k++) {
      for (let c = 0; c < 2; c++) {
        const a = k * 3 + c;
        const b = (k + 1) * 3 + c;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [key, seed]);
  return <mesh geometry={geo} material={material} castShadow receiveShadow />;
};

/* ------------------------------------------------------------------ робот */

export const RobotModel = ({ palette, hasKey }: { palette: BiomePalette; hasKey: boolean }) => {
  const body = surfaceMaterial('metal', palette, { tint: '#c6c9cb', metalness: 0.72, roughness: 0.46 });
  const plate = plainMaterial('#666d74', { metalness: 0.78, roughness: 0.44 });
  const dark = plainMaterial('#31363b', { metalness: 0.6, roughness: 0.58 });
  const tire = plainMaterial(RUBBER, { roughness: 0.95 });
  // Визор - тёмное стекло с тусклой подсветкой: залитая оранжевым пластина выглядела как наклейка.
  const visor = plainMaterial('#0a0806', { emissive: '#c25a1c', emissiveIntensity: 0.22, roughness: 0.2, metalness: 0.3 });
  const blade = plainMaterial('#b9c0c6', { metalness: 0.9, roughness: 0.3 });
  const breath = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (breath.current) breath.current.position.y = Math.sin(state.clock.elapsedTime * 2.2) * 0.006;
  });

  return (
    <group>
      <group ref={breath}>
        {/* Гусеницы: нижняя ветвь, катки, верхняя ветвь и крыло. Две коробки вместо хода выглядели игрушкой. */}
        {[-1, 1].map((s) => (
          <group key={`track-${s}`}>
            <Part args={[0.12, 0.1, 0.46]} position={[s * 0.19, 0.055, 0]} material={tire} radius={0.045} />
            {[-0.15, 0, 0.15].map((z) => (
              <Bar key={z} args={[0.042, 0.042, 0.135, 10]} position={[s * 0.19, 0.055, z]} rotation={[0, 0, Math.PI / 2]} material={plate} />
            ))}
            <Part args={[0.115, 0.03, 0.44]} position={[s * 0.19, 0.115, 0]} material={tire} radius={0.012} />
            <Part args={[0.16, 0.028, 0.47]} position={[s * 0.19, 0.155, 0]} material={dark} radius={0.01} />
          </group>
        ))}
        <Part args={[0.34, 0.05, 0.4]} position={[0, 0.2, 0]} material={dark} radius={0.012} />
        <Part args={[0.3, 0.16, 0.34]} position={[0, 0.3, 0]} material={body} radius={0.028} />
        <Part args={[0.33, 0.022, 0.36]} position={[0, 0.39, 0]} material={plate} radius={0.008} />
        {[[-0.14, -0.15], [0.14, -0.15], [-0.14, 0.15], [0.14, 0.15]].map(([x, z], i) => (
          <Bar key={`rivet-${i}`} args={[0.012, 0.012, 0.012, 8]} position={[x, 0.405, z]} material={dark} shadow={false} />
        ))}
        {/* Решётка воздухозабора спереди: гладкий корпус читался как кусок фольги. */}
        <Part args={[0.19, 0.08, 0.02]} position={[0, 0.3, -0.172]} material={dark} radius={0.008} />
        {[0.27, 0.3, 0.33].map((y) => (
          <Bar key={`slat-${y}`} args={[0.006, 0.006, 0.17, 6]} position={[0, y, -0.183]} rotation={[0, 0, Math.PI / 2]} material={plate} shadow={false} />
        ))}
        {[-1, 1].map((s) => (
          <Part key={`fin-${s}`} args={[0.02, 0.11, 0.2]} position={[s * 0.158, 0.31, 0.02]} material={plate} radius={0.006} />
        ))}
        {[-1, 1].map((s) => (
          <Bar key={`exhaust-${s}`} args={[0.017, 0.02, 0.1, 8]} position={[s * 0.085, 0.44, 0.15]} rotation={[0.35, 0, 0]} material={dark} />
        ))}
        <Bar args={[0.05, 0.055, 0.05, 10]} position={[0, 0.425, 0]} material={dark} />
        {/* Голова: гранёный блок с козырьком и щелью-визором, по бокам - сенсорные capsule. */}
        <Part args={[0.17, 0.105, 0.15]} position={[0, 0.495, 0]} material={body} radius={0.018} />
        <Part args={[0.18, 0.026, 0.05]} position={[0, 0.535, -0.064]} material={plate} radius={0.008} />
        <Part args={[0.12, 0.024, 0.012]} position={[0, 0.495, -0.076]} material={visor} radius={0.005} />
        {[-1, 1].map((s) => (
          <Bar key={`ear-${s}`} args={[0.03, 0.03, 0.028, 10]} position={[s * 0.092, 0.495, 0.01]} rotation={[0, 0, Math.PI / 2]} material={dark} />
        ))}
        <Limb from={[0.05, 0.54, 0.03]} to={[0.082, 0.66, 0.05]} r0={0.006} material={plate} shadow={false} />
        <Bar args={[0.01, 0.007, 0.022, 6]} position={[0.084, 0.67, 0.051]} material={dark} shadow={false} />
        {[-1, 1].map((s) => (
          <Part key={`shoulder-${s}`} args={[0.075, 0.08, 0.1]} position={[s * 0.168, 0.355, 0]} material={dark} radius={0.018} />
        ))}
        {/* Правая рука держит ключ, левая - кулак: симметричные культи выглядели как у фигурки лего. */}
        <Limb from={[0.17, 0.355, -0.02]} to={[0.235, 0.29, -0.13]} r0={0.032} r1={0.026} material={plate} />
        <Lump opts={{ radius: 0.03, detail: 1, seed: 49, amp: 0.16 }} material={dark} position={[0.235, 0.29, -0.13]} shadow={false} />
        <Limb from={[0.235, 0.29, -0.13]} to={[0.25, 0.2, -0.2]} r0={0.024} r1={0.02} material={plate} />
        {[0, 1, 2].map((f) => (
          <Spike
            key={f}
            height={0.075}
            base={0.012}
            seed={51 + f}
            lean={0.85}
            material={blade}
            position={[0.25 + (f - 1) * 0.02, 0.195, -0.215]}
            rotation={[-2.1, 0, (f - 1) * 0.28]}
          />
        ))}
        <Limb from={[-0.17, 0.355, 0.01]} to={[-0.235, 0.27, 0.03]} r0={0.032} r1={0.026} material={plate} />
        <Limb from={[-0.235, 0.27, 0.03]} to={[-0.248, 0.18, 0.05]} r0={0.024} r1={0.022} material={plate} />
        <Part args={[0.062, 0.062, 0.075]} position={[-0.25, 0.145, 0.055]} material={dark} radius={0.016} />
        {hasKey && <KeyModel position={[0.25, -0.055, -0.2]} />}
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.3, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} depthWrite={false} />
      </mesh>
    </group>
  );
};

/* ------------------------------------------------------------------ вещи */

export const CoinModel = ({ palette }: { palette: BiomePalette }) => {
  // Почти чистый металл без сильного окружения даёт чёрный блин: золото чуть диффузное и со своим светом.
  const gold = plainMaterial('#c8a34a', { metalness: 0.6, roughness: 0.26 });
  const spin = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (spin.current) {
      spin.current.rotation.y = state.clock.elapsedTime * 1.1;
      spin.current.position.y = 0.16 + Math.sin(state.clock.elapsedTime * 1.8) * 0.02;
    }
  });
  return (
    <group ref={spin} position={[0, 0.16, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={gold} castShadow>
        <cylinderGeometry args={[0.085, 0.085, 0.022, 20]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.012]} material={plainMaterial('#8d6d2c', { metalness: 0.5, roughness: 0.42 })}>
        <cylinderGeometry args={[0.055, 0.055, 0.004, 16]} />
      </mesh>
      <pointLight position={[0, 0.1, 0]} intensity={palette.accentIntensity * 0.4} distance={0.8} color={palette.accent} />
    </group>
  );
};

export const KeyModel = ({ position, fake = false }: { position?: [number, number, number]; fake?: boolean }) => {
  const brass = plainMaterial(fake ? '#7d7166' : '#c3a057', { metalness: 0.55, roughness: 0.3 });
  const float = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (float.current) {
      float.current.rotation.y = state.clock.elapsedTime * 0.6;
      // 0.26 - высота подвеса внутри группы: без неё анимация обнуляла смещение и ключ тонул в земле.
      float.current.position.y = 0.26 + Math.sin(state.clock.elapsedTime * 1.4) * 0.015;
    }
  });
  return (
    <group position={position}>
      <group ref={float} position={[0, 0.26, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={brass} castShadow>
          <torusGeometry args={[0.055, 0.016, 8, 18]} />
        </mesh>
        <Part args={[0.02, 0.02, 0.17]} position={[0, 0, -0.11]} material={brass} radius={0.008} />
        <Part args={[0.05, 0.018, 0.018]} position={[0.02, 0, -0.17]} material={brass} radius={0.006} />
        <Part args={[0.04, 0.018, 0.018]} position={[0.015, 0, -0.2]} material={brass} radius={0.006} />
      </group>
    </group>
  );
};

export const DoorModel = ({
  palette,
  sealed,
  open,
}: {
  palette: BiomePalette;
  sealed: boolean;
  open: boolean;
}) => {
  const stone = surfaceMaterial('rock', palette, { flatShading: true });
  const bar = plainMaterial('#4a4f55', { metalness: 0.8, roughness: 0.45 });
  const glow = plainMaterial(open ? '#2f3a2c' : '#121417', {
    emissive: open ? palette.accent : '#000000',
    emissiveIntensity: open ? palette.accentIntensity : 0,
    roughness: 0.8,
  });
  return (
    <group position={[0, 0, 0]}>
      <Part args={[0.16, 0.62, 0.16]} position={[-0.32, 0.31, 0]} material={stone} radius={0.03} />
      <Part args={[0.16, 0.62, 0.16]} position={[0.32, 0.31, 0]} material={stone} radius={0.03} />
      <Part args={[0.86, 0.14, 0.22]} position={[0, 0.68, 0]} material={stone} radius={0.03} />
      <mesh position={[0, 0.3, 0]} material={glow}>
        <planeGeometry args={[0.5, 0.56]} />
      </mesh>
      {sealed &&
        [-0.16, 0, 0.16].map((x) => (
          <Bar key={x} args={[0.022, 0.022, 0.56, 6]} position={[x, 0.3, 0.02]} rotation={[0, 0, 0]} material={bar} />
        ))}
      <Shard args={[0.06, 0.14, 6]} position={[-0.32, 0.72, 0]} material={stone} />
      <Shard args={[0.06, 0.14, 6]} position={[0.32, 0.72, 0]} material={stone} />
    </group>
  );
};

/* ------------------------------------------------------------------ враги */

/** Каменный титан: глыбы на трубчатых конечностях. Скруглённые коробки делали из него игрушечный кубик. */
const Golem = ({ palette, magma = false, scale = 1 }: { palette: BiomePalette; magma?: boolean; scale?: number }) => {
  const rock = magma
    ? surfaceMaterial('magma', palette, { tint: '#e8dcd0', emissiveIntensity: 0.85, normalScale: 1.6 })
    : surfaceMaterial('rock', palette, { tint: '#cbc4b3', normalScale: 1.6 });
  const rockDark = surfaceMaterial('rock', palette, { tint: '#8f887c', roughness: 0.98, normalScale: 1.5 });
  // Прожилки расплава между плитами: без них магмовый титан выглядел просто серой глыбой.
  const crack = plainMaterial('#1c0c05', { emissive: '#ff5a1e', emissiveIntensity: 1.05, roughness: 0.6 });
  const slit = plainMaterial('#1a0d05', {
    emissive: magma ? '#ff7a2a' : palette.accent,
    emissiveIntensity: magma ? 1.5 : 0.55,
    roughness: 0.5,
  });
  const breath = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (breath.current) breath.current.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.014;
  });

  const limbs = useMemo(
    () => ({
      legs: [-1, 1].map((s) => ({
        leg: [
          [s * 0.2, 0.62, 0.02],
          [s * 0.24, 0.36, -0.03],
          [s * 0.19, 0.06, 0.05],
        ] as Vec3[],
        foot: [
          [s * 0.19, 0.08, 0.05],
          [s * 0.21, 0.03, -0.1],
        ] as Vec3[],
      })),
      arms: [-1, 1].map((s) => ({
        upper: [
          [s * 0.42, 1.24, 0.0],
          [s * 0.56, 1.0, 0.04],
          [s * 0.6, 0.74, -0.02],
        ] as Vec3[],
        fore: [
          [s * 0.6, 0.74, -0.02],
          [s * 0.64, 0.5, 0.04],
          [s * 0.62, 0.3, -0.06],
        ] as Vec3[],
        s,
      })),
    }),
    [],
  );

  return (
    <group scale={scale}>
      {limbs.legs.map((l, i) => (
        <group key={`leg-${i}`}>
          <Tube points={l.leg} radii={[0.2, 0.18, 0.15]} seed={300 + i} wobble={0.3} material={rock} />
          <Tube points={l.foot} radii={[0.15, 0.11]} seed={310 + i} wobble={0.3} material={rockDark} />
          <Lump opts={{ radius: 0.16, detail: 2, seed: 320 + i, amp: 0.36, stretch: [1, 0.85, 1.1] }} material={rockDark} position={[l.leg[1][0], 0.38, 0.0]} />
        </group>
      ))}
      <group ref={breath}>
        <Lump opts={{ radius: 0.3, detail: 2, seed: 330, amp: 0.3, stretch: [1.15, 0.7, 0.9] }} material={rock} position={[0, 0.7, 0.01]} />
        <Lump opts={{ radius: 0.42, detail: 2, seed: 331, amp: 0.26, stretch: [1.1, 0.85, 0.82] }} material={rock} position={[0, 1.0, 0]} />
        <Lump opts={{ radius: 0.46, detail: 2, seed: 332, amp: 0.28, stretch: [1.15, 0.55, 0.8] }} material={rockDark} position={[0, 1.24, 0]} />
        {/* Наплечники разного размера: симметрия - первый признак «сделано из набора». */}
        <Lump opts={{ radius: 0.26, detail: 2, seed: 333, amp: 0.38, stretch: [1.1, 0.8, 1] }} material={rock} position={[-0.4, 1.3, 0]} />
        <Lump opts={{ radius: 0.21, detail: 2, seed: 334, amp: 0.38, stretch: [1, 0.75, 1.05] }} material={rock} position={[0.42, 1.26, -0.02]} />
        {magma && (
          <group>
            {/* Жилы - узкие щели в пазах: широкие светящиеся плашки складывались на груди в рожицу. */}
            <Plate width={0.4} depth={0.075} thickness={0.02} seed={340} amp={0.62} material={crack} position={[0, 0.84, -0.25]} rotation={[0.1, 0, 0.07]} />
            <Plate width={0.26} depth={0.06} thickness={0.018} seed={341} amp={0.62} material={crack} position={[0.03, 1.13, -0.25]} rotation={[-0.06, 0, -0.09]} />
            <Tube points={[[0, 0.72, -0.25], [0.03, 0.86, -0.27], [-0.01, 1.02, -0.26]]} radii={[0.02, 0.015, 0.01]} seed={342} wobble={0.5} material={crack} shadow={false} />
            <Lump opts={{ radius: 0.045, detail: 2, seed: 343, amp: 0.4, stretch: [0.5, 1.3, 0.4] }} material={crack} position={[0.005, 0.99, -0.252]} shadow={false} />
          </group>
        )}
        {limbs.arms.map((a, i) => (
          <group key={`arm-${i}`}>
            <Tube points={a.upper} radii={[0.16, 0.14, 0.13]} seed={350 + i} wobble={0.3} material={rock} />
            {/* Наколенник на стыке: две трубки с разными сидами давали плоский срез и «руку из набора». */}
            <Lump opts={{ radius: 0.15, detail: 2, seed: 355 + i, amp: 0.3, stretch: [1, 0.9, 1] }} material={rockDark} position={[a.upper[2][0], a.upper[2][1], a.upper[2][2]]} />
            <Tube points={a.fore} radii={[0.13, 0.12, 0.1]} seed={360 + i} wobble={0.3} material={rockDark} />
            <Lump opts={{ radius: 0.19, detail: 2, seed: 370 + i, amp: 0.34, stretch: [1, 0.9, 1.1] }} material={rock} position={[a.fore[2][0], a.fore[2][1] - 0.04, a.fore[2][2] - 0.04]} />
            {[0, 1, 2].map((f) => (
              <Spike
                key={f}
                height={0.12}
                base={0.045}
                seed={380 + i * 4 + f}
                lean={0.8}
                material={rockDark}
                position={[a.fore[2][0] + (f - 1) * 0.07 * a.s, a.fore[2][1] - 0.12, a.fore[2][2] - 0.08]}
                rotation={[Math.PI * 0.85, 0, a.s * 0.2]}
              />
            ))}
          </group>
        ))}
        {/* Голова втянута в наплечники, из-под надбровья - две щели света, а не шарики-глаза. */}
        <Lump opts={{ radius: 0.22, detail: 2, seed: 390, amp: 0.3, stretch: [1, 0.88, 1] }} material={rockDark} position={[0, 1.46, -0.02]} rotation={[0.12, 0, 0]} />
        <Plate width={0.34} depth={0.16} thickness={0.07} seed={391} amp={0.4} material={rock} position={[0, 1.55, -0.1]} rotation={[-0.25, 0, 0]} />
        <Plate width={0.1} depth={0.03} thickness={0.02} seed={392} amp={0.4} material={slit} position={[-0.08, 1.45, -0.2]} rotation={[0, 0, -0.22]} />
        <Plate width={0.09} depth={0.03} thickness={0.02} seed={393} amp={0.4} material={slit} position={[0.078, 1.43, -0.2]} rotation={[0, 0, 0.26]} />
      </group>
      {magma && <pointLight position={[0, 0.95, -0.3]} intensity={0.85} distance={2.2} color="#ff6a2c" />}
    </group>
  );
};

const Slime = ({ palette }: { palette: BiomePalette }) => {
  // Мокрая оболочка без граней: flatShading на низком полигоне превращал слизня в зелёный валун.
  // Полупрозрачность обязательна: непрозрачный шар не пропускал ядро, и вместо желе получался пластиковый мяч.
  // roughness 0.45: на 0.16 точечные света пещеры лепили на теле отдельные блики, и лужа блестела как нарисованная.
  const jelly = plainMaterial('#6d8a4f', { roughness: 0.45, metalness: 0.05, opacity: 0.78, doubleSided: true });
  const skin = plainMaterial('#2f4022', { roughness: 0.42, metalness: 0.05 });
  const core = plainMaterial('#16240f', { roughness: 0.5, emissive: palette.accent, emissiveIntensity: 0.18 });
  const grit = plainMaterial('#1d2a14', { roughness: 0.85, flatShading: true });
  // Пузыри темнее тела: светлые шары на оболочке читались наростами, а не пузырьками в желе.
  const bubble = plainMaterial('#3f5230', { roughness: 0.55, flatShading: true, opacity: 0.9 });
  const pulse = useRef<THREE.Group>(null);
  useFrame((state) => {
    const k = 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.06;
    if (pulse.current) pulse.current.scale.set(1 / k, k, 1 / k);
  });
  return (
    <group>
      {/* Лужа у основания: без неё ком выглядел шариком на грядке. */}
      <Lump opts={{ radius: 0.26, detail: 3, seed: 470, amp: 0.24, stretch: [1.2, 0.18, 1.15], smooth: true }} material={skin} position={[0, 0.04, 0]} />
      <group ref={pulse}>
        {/* Ком с двумя боковыми наплывами: ровная сфера читалась как нарисованный круг. */}
        <Lump opts={{ radius: 0.2, detail: 3, seed: 471, amp: 0.3, stretch: [1, 0.84, 1], smooth: true }} material={jelly} position={[0, 0.2, 0]} shadow={false} />
        <Lump opts={{ radius: 0.1, detail: 2, seed: 474, amp: 0.3, stretch: [1, 0.8, 1], smooth: true }} material={jelly} position={[-0.13, 0.14, 0.03]} shadow={false} />
        <Lump opts={{ radius: 0.085, detail: 2, seed: 475, amp: 0.3, stretch: [1, 0.85, 1], smooth: true }} material={jelly} position={[0.12, 0.13, -0.05]} shadow={false} />
        {/* Ядро маленькое и в глубине: крупный светлый шар у переднего края был хрусталиком, а комик под ним - зрачком. */}
        <Lump opts={{ radius: 0.05, detail: 2, seed: 472, amp: 0.3 }} material={core} position={[0.01, 0.16, 0.07]} shadow={false} />
        {/* Взвесь внутри тела: мусор, застывший в желе, - то, чего непрозрачному шару не хватало. */}
        {[[-0.06, 0.24, 0.05, 0.026], [0.08, 0.21, 0.06, 0.02], [-0.05, 0.14, 0.07, 0.022], [0.04, 0.27, 0.02, 0.016]].map((g, i) => (
          <Lump key={`grit-${i}`} opts={{ radius: g[3], detail: 1, seed: 486 + i, amp: 0.4 }} material={grit} position={[g[0], g[1], g[2]]} shadow={false} />
        ))}
      </group>
      {/* Пузыри на поверхности вместо глаз: два чёрных шарика делали из лужи мультяшку. */}
      {[[-0.11, 0.28, -0.13, 0.035], [0.07, 0.32, -0.09, 0.026], [0.02, 0.24, 0.14, 0.03]].map((b, i) => (
        <Lump key={`bub-${i}`} opts={{ radius: b[3], detail: 1, seed: 480 + i, amp: 0.3 }} material={bubble} position={[b[0], b[1], b[2]]} shadow={false} />
      ))}
      {/* Тёмная кайма там, где ком входит в лужу: без неё стык выглядел как шар, положенный на блин. */}
      <Lump opts={{ radius: 0.17, detail: 2, seed: 478, amp: 0.26, stretch: [1.1, 0.22, 1.05], smooth: true }} material={skin} position={[0, 0.08, 0]} />
    </group>
  );
};

/** Скорпион: сегменты брюшка, сочленённые лапы и хвост по дуге с тельсоном. */
const Scorpion = ({ palette, scale = 1 }: { palette: BiomePalette; scale?: number }) => {
  // Панцирь тёмный: песочного оттенка скорпион сливался с грунтом и читался как куча щебня.
  const shell = surfaceMaterial('cloth', palette, { tint: '#8f7050', metalness: 0.2, roughness: 0.42, normalScale: 1.4 });
  const chitin = surfaceMaterial('cloth', palette, { tint: '#bd9c6c', metalness: 0.24, roughness: 0.36, normalScale: 1.2 });
  const dark = plainMaterial('#3a2412', { roughness: 0.44, metalness: 0.2 });
  const grain = plainMaterial('#0f0a06', { roughness: 0.25, metalness: 0.4 });
  const tail = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (tail.current) tail.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.15) * 0.05;
  });

  // Хвост: пять самостоятельных звеньев по дуге, каждое чуть тоньше предыдущего.
  const links = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 0.16, 0.42),
        new THREE.Vector3(0, 0.52, 0.56),
        new THREE.Vector3(0, 0.86, 0.42),
        new THREE.Vector3(0, 0.98, 0.06),
        new THREE.Vector3(0, 0.82, -0.24),
        new THREE.Vector3(0, 0.56, -0.4),
      ],
      false,
      'catmullrom',
      0.4,
    );
    return Array.from({ length: 5 }, (_, i) => {
      // Звенья идут с нахлёстом: без него wobble с разными сидами расходятся на стыке и между пластинами чёрная щель.
      const t0 = Math.max(0, i / 5 - 0.02);
      const tm = (i + 0.5) / 5;
      const t1 = Math.min(1, (i + 1) / 5 + 0.02);
      const at = (t: number) => curve.getPointAt(t).toArray() as Vec3;
      const r = (t: number) => 0.135 - t * 0.07;
      return {
        points: [at(t0), at(tm), at(t1)],
        radii: [r(t0), r(tm), r(t1)],
        seed: 500 + i * 3,
      };
    });
  }, []);
  const tip = links[links.length - 1].points[2];

  const legs = useMemo(() => {
    const rand = seededRandom(77);
    return [-0.14, 0.04, 0.22, 0.4].flatMap((z, i) =>
      [-1, 1].map((s) => {
        const out = 0.34 + rand() * 0.06;
        const lift = 0.3 + rand() * 0.05;
        const step = (i % 2 ? 0.1 : -0.1) + rand() * 0.04;
        return {
          points: [
            [s * 0.12, 0.15, z] as Vec3,
            [s * (0.12 + out * 0.5), lift, z + step * 0.4] as Vec3,
            [s * (0.12 + out), 0.05, z + step] as Vec3,
            [s * (0.12 + out * 1.16), 0.012, z + step * 1.5] as Vec3,
          ],
          radii: [0.05, 0.042, 0.028, 0.009],
          seed: 520 + i * 3 + (s > 0 ? 1 : 0),
        };
      }),
    );
  }, []);

  return (
    <group scale={scale}>
      {/* Брюшко из наложенных друг на друга пластин: один шар looked как жук. */}
      {[0.62, 0.5, 0.4, 0.31, 0.24].map((size, i) => (
        <Lump
          key={`opistho-${i}`}
          opts={{ radius: size * 0.42, detail: 2, seed: 540 + i * 4, amp: 0.16, stretch: [1.15, 0.5, 1.1] }}
          material={i % 2 ? chitin : shell}
          position={[0, 0.15 + i * 0.012, 0.16 + i * 0.13]}
        />
      ))}
      <Lump opts={{ radius: 0.3, detail: 2, seed: 560, amp: 0.14, stretch: [1.2, 0.44, 1.05] }} material={shell} position={[0, 0.15, -0.06]} />
      <Plate width={0.34} depth={0.34} thickness={0.06} seed={561} amp={0.22} material={chitin} position={[0, 0.22, -0.08]} />
      {/* Голова с клешнями смотрит на -z: с камеры видно силуэт, а не подбрюшье. */}
      <Lump opts={{ radius: 0.16, detail: 2, seed: 562, amp: 0.18, stretch: [1.1, 0.6, 1] }} material={shell} position={[0, 0.14, -0.28]} />
      {/* Глаза - крошечные тёмные бусины, светящиеся шары превращали босса в мультяшку. */}
      {[-1, 1].map((s) => (
        <group key={`eyes-${s}`}>
          <Blob args={[0.016, 8]} position={[s * 0.05, 0.2, -0.36]} material={grain} />
          <Blob args={[0.011, 6]} position={[s * 0.085, 0.19, -0.31]} material={grain} />
          <Blob args={[0.01, 6]} position={[s * 0.1, 0.185, -0.24]} material={grain} />
        </group>
      ))}

      <group ref={tail}>
        {links.map((l, i) => (
          <Tube key={`tail-${i}`} points={l.points} radii={l.radii} seed={l.seed} wobble={0.24} material={i % 2 ? chitin : shell} />
        ))}
        <Lump opts={{ radius: 0.09, detail: 2, seed: 580, amp: 0.24, stretch: [1, 0.9, 1.2] }} material={dark} position={[tip[0], tip[1] - 0.02, tip[2] - 0.03]} />
        <Tube
          points={[
            [tip[0], tip[1] - 0.02, tip[2] - 0.05],
            [tip[0], tip[1] - 0.12, tip[2] - 0.14],
            [tip[0], tip[1] - 0.1, tip[2] - 0.26],
          ]}
          radii={[0.045, 0.022, 0.004]}
          seed={581}
          wobble={0.12}
          material={grain}
        />
      </group>

      {[-1, 1].map((s) => (
        <group key={`palm-${s}`}>
          <Tube
            points={[
              [s * 0.1, 0.16, -0.24],
              [s * 0.24, 0.26, -0.38],
              [s * 0.32, 0.2, -0.54],
            ]}
            radii={[0.062, 0.05, 0.042]}
            seed={590 + s}
            wobble={0.2}
            material={chitin}
          />
          <Lump opts={{ radius: 0.1, detail: 2, seed: 600 + s, amp: 0.2, stretch: [0.7, 0.85, 1.5] }} material={shell} position={[s * 0.34, 0.17, -0.66]} rotation={[0, s * 0.2, 0]} />
          {/* Два пальца клешни: неподвижный и подвижный, расходятся под углом. */}
          <Tube
            points={[
              [s * 0.34, 0.17, -0.72],
              [s * 0.38, 0.18, -0.82],
              [s * 0.34, 0.2, -0.9],
            ]}
            radii={[0.032, 0.018, 0.004]}
            seed={610 + s}
            wobble={0.16}
            material={dark}
          />
          <Tube
            points={[
              [s * 0.34, 0.15, -0.72],
              [s * 0.3, 0.1, -0.82],
              [s * 0.34, 0.11, -0.9],
            ]}
            radii={[0.03, 0.017, 0.004]}
            seed={620 + s}
            wobble={0.16}
            material={dark}
          />
        </group>
      ))}

      {legs.map((l, i) => (
        <group key={`leg-${i}`}>
          <Tube points={l.points} radii={l.radii} seed={l.seed} radial={7} wobble={0.22} material={dark} />
          {/* Колено отдельным комом: гладкая дуга читалась как проволока. */}
          <Lump opts={{ radius: 0.05, detail: 1, seed: 640 + i, amp: 0.3, stretch: [0.8, 0.7, 1.1] }} material={chitin} position={l.points[1]} shadow={false} />
        </group>
      ))}
      <pointLight position={[0, 0.5, 0]} intensity={palette.accentIntensity * 0.25} distance={1.4} color={palette.accent} />
    </group>
  );
};

const Wolf = ({ palette }: { palette: BiomePalette }) => {
  const fur = surfaceMaterial('cloth', palette, { tint: '#a89a8a', roughness: 1 });
  // Голень в той же ткани, что и бедро: гладкий тёмный цилиндр выглядел водосточной трубой под шерстью.
  // Оттенок светлее прежнего: на '#54493c' задние лапы читались штанами, а не более тёмной шерстью того же зверя.
  const socks = surfaceMaterial('cloth', palette, { tint: '#7d7060', roughness: 1 });
  // Лапы тоже мех, а не гладкий чёрный шарик: плоская тёмная шайба читалась ластой.
  const paw = surfaceMaterial('cloth', palette, { tint: '#5c5346', roughness: 1 });
  const darkFur = plainMaterial('#3f382f', { roughness: 0.95 });
  const eye = plainMaterial('#171208', { emissive: '#b08a3c', emissiveIntensity: 0.35, roughness: 0.3 });
  const legs = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (legs.current) {
      const t = state.clock.elapsedTime * 4.5;
      legs.current.children.forEach((leg, i) => {
        leg.rotation.x = Math.sin(t + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.32;
      });
    }
  });

  // Конечности считаются от бедра: четыре прямых бруска по углам делали из волка табуретку.
  const limbs: { hip: Vec3; points: Vec3[]; radii: number[] }[] = [
    {
      hip: [-0.055, 0.33, -0.13],
      points: [
        [0, 0, 0],
        [0, -0.15, 0.02],
        [0, -0.28, -0.01],
        [0, -0.31, 0.02],
      ],
      radii: [0.046, 0.034, 0.023, 0.018],
    },
    {
      hip: [0.055, 0.33, -0.13],
      points: [
        [0, 0, 0],
        [0, -0.15, 0.02],
        [0, -0.28, -0.01],
        [0, -0.31, 0.02],
      ],
      radii: [0.046, 0.034, 0.023, 0.018],
    },
    // Задняя нога: колено вперёд, скакатель назад. На прямых столбах волка садят, а не ставят.
    {
      hip: [-0.06, 0.32, 0.15],
      points: [
        [0, 0, 0],
        [0.006, -0.12, -0.05],
        [0, -0.23, 0.06],
        [0, -0.3, -0.01],
        [0, -0.32, 0.03],
      ],
      radii: [0.054, 0.04, 0.027, 0.02, 0.016],
    },
    {
      hip: [0.06, 0.32, 0.15],
      points: [
        [0, 0, 0],
        [-0.006, -0.12, -0.05],
        [0, -0.23, 0.06],
        [0, -0.3, -0.01],
        [0, -0.32, 0.03],
      ],
      radii: [0.054, 0.04, 0.027, 0.02, 0.016],
    },
  ];

  return (
    <group position={[0, 0.02, 0]}>
      {/* Узкая глубокая грудь и крупный зад: квадратный корпус читался как коробка на ножках. */}
      <Tube
        points={[
          [0, 0.3, 0.16],
          [0, 0.32, 0],
          [0, 0.33, -0.15],
        ]}
        radii={[0.1, 0.105, 0.075]}
        seed={301}
        wobble={0.22}
        material={fur}
      />
      <Lump opts={{ radius: 0.095, detail: 2, seed: 302, amp: 0.28, stretch: [0.9, 0.95, 1.15] }} material={fur} position={[0, 0.3, 0.18]} />
      <Tube
        points={[
          [0, 0.34, -0.16],
          [0, 0.39, -0.24],
          [0, 0.42, -0.29],
        ]}
        radii={[0.068, 0.05, 0.045]}
        seed={303}
        wobble={0.24}
        material={fur}
      />
      <Lump opts={{ radius: 0.062, detail: 2, seed: 304, amp: 0.24, stretch: [0.85, 0.82, 1.1] }} material={fur} position={[0, 0.43, -0.31]} />
      <Tube
        points={[
          [0, 0.42, -0.35],
          [0, 0.405, -0.4],
          [0, 0.395, -0.435],
        ]}
        radii={[0.033, 0.026, 0.018]}
        seed={305}
        wobble={0.2}
        material={fur}
      />
      <Lump opts={{ radius: 0.015, detail: 1, seed: 306, amp: 0.2 }} material={darkFur} position={[0, 0.4, -0.445]} shadow={false} />
      {[-1, 1].map((s) => (
        <Shard key={`ear-${s}`} args={[0.03, 0.08, 5]} position={[s * 0.038, 0.48, -0.28]} rotation={[0.15, 0, s * 0.22]} material={darkFur} />
      ))}
      <Blob args={[0.01, 8]} position={[-0.032, 0.44, -0.35]} material={eye} shadow={false} />
      <Blob args={[0.01, 8]} position={[0.032, 0.44, -0.35]} material={eye} shadow={false} />
      <group ref={legs}>
        {limbs.map((l, i) => {
          const foot = l.points[l.points.length - 1];
          return (
            <group key={`leg-${i}`} position={l.hip}>
              <Tube points={l.points.slice(0, 2)} radii={l.radii.slice(0, 2)} seed={330 + i} wobble={0.16} material={fur} />
              <Tube points={l.points.slice(1)} radii={l.radii.slice(1)} seed={350 + i} wobble={0.14} material={socks} />
              <Lump opts={{ radius: 0.026, detail: 1, seed: 310 + i, amp: 0.26, stretch: [1, 0.45, 1.35] }} material={paw} position={[foot[0], foot[1] - 0.006, foot[2] - 0.016]} shadow={false} />
            </group>
          );
        })}
      </group>
      <Tube
        points={[
          [0, 0.32, 0.26],
          [0, 0.24, 0.36],
          [0, 0.2, 0.44],
        ]}
        radii={[0.052, 0.044, 0.026]}
        seed={320}
        wobble={0.34}
        material={fur}
        shadow={false}
      />
      {/* Мохнатая кисть на конце: голый конус превращал хвост в крысиный хлыст, а тёмная шайба на его конце - в надетый носок. */}
      <Lump opts={{ radius: 0.042, detail: 2, seed: 321, amp: 0.34, stretch: [0.9, 0.8, 1.3] }} material={socks} position={[0, 0.19, 0.46]} shadow={false} />
    </group>
  );
};

const Bird = ({ palette, big = false }: { palette: BiomePalette; big?: boolean }) => {
  const feather = surfaceMaterial('cloth', palette, { tint: '#77706a', roughness: 0.98 });
  // Двусторонняя та же ткань: с изнанки крыло проваливалось и на повороте исчезало.
  const covert = surfaceMaterial('cloth', palette, { tint: '#6b645e', roughness: 0.98, doubleSided: true });
  const dark = plainMaterial('#2b2724', { roughness: 0.9 });
  const skin = plainMaterial('#5c4038', { roughness: 0.75 });
  const beak = plainMaterial('#4b4741', { metalness: 0.15, roughness: 0.45 });
  const wings = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (wings.current) {
      const flap = Math.sin(state.clock.elapsedTime * (big ? 2.4 : 6.5));
      wings.current.children.forEach((wing, i) => {
        // Среднее -0.34: крыло поднято диэдром, иначе в уровень с камерой лопасть видна ребром и крыло = палка.
        wing.rotation.z = (i === 0 ? 1 : -1) * (flap * 0.2 - 0.34);
      });
    }
  });
  const size = big ? 1.5 : 1;
  return (
    <group position={[0, big ? 0.5 : 0.34, 0]} scale={size}>
      {/* Каплевидное тело и голое горло: шар с двумя досками вместо крыльев был детской поделкой. */}
      <Lump opts={{ radius: 0.13, detail: 3, seed: 330, amp: 0.16, stretch: [0.8, 0.82, 1.4] }} material={feather} />
      <Lump opts={{ radius: 0.09, detail: 3, seed: 331, amp: 0.18, stretch: [0.9, 0.55, 1.1] }} material={feather} position={[0, -0.05, 0.02]} />
      <Tube
        points={[
          [0, 0.03, -0.11],
          [0, 0.11, -0.19],
          [0, 0.16, -0.24],
        ]}
        radii={[0.042, 0.028, 0.026]}
        seed={332}
        wobble={0.24}
        material={skin}
      />
      <Lump opts={{ radius: 0.042, detail: 2, seed: 333, amp: 0.18, stretch: [0.85, 0.85, 1.05] }} material={skin} position={[0, 0.175, -0.255]} />
      <Lump opts={{ radius: 0.036, detail: 2, seed: 334, amp: 0.22, stretch: [0.95, 0.55, 1] }} material={dark} position={[0, 0.198, -0.245]} />
      {/* Клюв начинается внутри черепа: с зазором он выглядел отдельным обломком. */}
      <Shard args={[0.026, 0.1, 5]} position={[0, 0.163, -0.285]} rotation={[-1.45, 0, 0]} material={beak} />
      <Blob args={[0.007, 8]} position={[-0.024, 0.185, -0.283]} material={dark} shadow={false} />
      <Blob args={[0.007, 8]} position={[0.024, 0.185, -0.283]} material={dark} shadow={false} />
      {/* Пуховой воротник: прижатые к шее короткие пучки, а не торчащие в стороны иглы. */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((f) => {
        const a = (f / 8) * Math.PI * 2;
        return (
          <Spike
            key={`ruff-${f}`}
            height={0.045}
            base={0.017}
            seed={336 + f}
            lean={0.85}
            material={f % 2 ? dark : feather}
            position={[Math.sin(a) * 0.026, 0.05 - Math.cos(a) * 0.012, -0.115 + Math.cos(a) * 0.028]}
            rotation={[1.15 - Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.4]}
          />
        );
      })}
      <group ref={wings}>
        {[-1, 1].map((s) => (
          <group key={`wing-${s}`} position={[s * 0.055, 0.065, 0]}>
            <Limb from={[0, 0, 0]} to={[s * 0.18, -0.004, 0.012]} r0={0.028} r1={0.019} material={feather} />
            <Limb from={[s * 0.18, -0.004, 0.012]} to={[s * 0.32, 0.002, 0.032]} r0={0.019} r1={0.012} material={feather} />
            {/* Лопасть - широкий треугольник от тела к кончику: с узкой полосой крыло читалось дубинкой с метлой на конце. */}
            <Membrane
              spars={[
                { root: [0, 0, 0], tip: [s * 0.33, -0.005, 0.02] },
                { root: [s * 0.02, -0.015, 0.07], tip: [s * 0.32, -0.012, 0.13] },
                { root: [0, -0.028, 0.14], tip: [s * 0.26, -0.018, 0.21] },
                { root: [-s * 0.03, -0.035, 0.2], tip: [s * 0.14, -0.024, 0.27] },
              ]}
              sag={0.03}
              seed={404 + s * 2}
              material={covert}
            />
            <Lump opts={{ radius: 0.05, detail: 2, seed: 410 + s, amp: 0.2, stretch: [1.1, 0.5, 0.9] }} material={feather} position={[s * 0.06, -0.01, 0.02]} shadow={false} />
            {[0, 1, 2, 3, 4, 5].map((f) => {
              const k = f / 5;
              return (
                <Spike
                  key={`prim-${f}`}
                  height={0.19 - k * 0.05}
                  base={0.019 - k * 0.004}
                  seed={341 + f}
                  lean={0.88}
                  material={f % 2 ? dark : feather}
                  position={[s * (0.3 - k * 0.055), -0.012 - k * 0.006, 0.03 + k * 0.045]}
                  rotation={[Math.PI / 2 - 0.16 - k * 0.16, 0, s * (0.1 + k * 0.42)]}
                />
              );
            })}
            {[0, 1, 2, 3].map((f) => {
              const k = f / 3;
              return (
                <Spike
                  key={`sec-${f}`}
                  height={0.11 - k * 0.03}
                  base={0.016}
                  seed={349 + f}
                  lean={0.88}
                  material={feather}
                  position={[s * (0.04 + k * 0.14), -0.026, 0.075 + k * 0.045]}
                  rotation={[Math.PI / 2 + 0.1, 0, s * (0.05 + k * 0.1)]}
                />
              );
            })}
          </group>
        ))}
      </group>
      {/* Веер из пяти перьев: три плотных шипа сливались в одну доску на конце хвоста. */}
      {[0, 1, 2, 3, 4].map((f) => {
        const d = (f - 2) / 2;
        return (
          <Spike
            key={`tail-${f}`}
            height={0.15 - Math.abs(d) * 0.03}
            base={0.019}
            seed={352 + f}
            lean={0.82}
            material={f % 2 ? dark : feather}
            position={[d * 0.045, -0.012, 0.165]}
            rotation={[Math.PI / 2 + 0.25, 0, d * 0.34]}
          />
        );
      })}
      {[-1, 1].map((s) => (
        <group key={`leg-${s}`}>
          <Limb from={[s * 0.035, -0.09, 0.01]} to={[s * 0.04, -0.155, 0.02]} r0={0.013} r1={0.009} material={skin} shadow={false} />
          <Limb from={[s * 0.04, -0.155, 0.02]} to={[s * 0.042, -0.195, 0.006]} r0={0.009} r1={0.007} material={dark} shadow={false} />
          {/* Пальцы вместо плоской шайбы: шайба висела под ногой как отдельная тарелка. */}
          {[-0.5, 0, 0.5].map((d, i) => (
            <Spike
              key={i}
              height={0.05}
              base={0.008}
              seed={350 + s * 3 + i}
              lean={0.55}
              material={dark}
              position={[s * 0.042, -0.195, 0.006]}
              rotation={[-1.35 + i * 0.12, d * 1.1, d * 0.5]}
            />
          ))}
        </group>
      ))}
    </group>
  );
};

const Bat = ({ palette }: { palette: BiomePalette }) => {
  const fur = surfaceMaterial('cloth', palette, { tint: '#6d655f', roughness: 1 });
  const membrane = plainMaterial('#241f1e', { roughness: 0.82, flatShading: true, doubleSided: true });
  const bone = plainMaterial('#4a423b', { roughness: 0.8 });
  const claw = plainMaterial('#171311', { roughness: 0.55 });
  const eye = plainMaterial('#0c0a09', { emissive: '#8a6a3a', emissiveIntensity: 0.22, roughness: 0.3 });
  const hover = useRef<THREE.Group>(null);
  const wings = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (hover.current) hover.current.position.y = 0.52 + Math.sin(t * 2.6) * 0.06;
    if (wings.current) {
      const flap = Math.sin(t * 7.5);
      wings.current.children.forEach((w, i) => {
        const s = i === 0 ? -1 : 1;
        w.rotation.z = -s * (0.1 + flap * 0.3);
        w.rotation.x = flap * 0.1;
      });
    }
  });
  // Пальцы разведены от запястья, перепонка натянула межу ними: раньше крыло было палкой с двумя линзами.
  const wingSpars = (s: number) => [
    { root: [0, 0, 0] as Vec3, tip: [s * 0.37, -0.012, 0.05] as Vec3 },
    { root: [s * 0.2, -0.008, 0.066] as Vec3, tip: [s * 0.33, -0.02, 0.15] as Vec3 },
    { root: [s * 0.2, -0.008, 0.066] as Vec3, tip: [s * 0.265, -0.026, 0.23] as Vec3 },
    { root: [s * 0.012, -0.058, 0.115] as Vec3, tip: [s * 0.175, -0.032, 0.29] as Vec3 },
    { root: [-s * 0.006, -0.082, 0.15] as Vec3, tip: [s * 0.062, -0.06, 0.235] as Vec3 },
  ];
  return (
    <group ref={hover} position={[0, 0.52, 0]}>
      <Lump opts={{ radius: 0.062, detail: 2, seed: 360, amp: 0.26, stretch: [0.8, 0.86, 1.15] }} material={fur} position={[0, 0, -0.005]} />
      <Lump opts={{ radius: 0.05, detail: 2, seed: 361, amp: 0.3, stretch: [0.72, 0.62, 0.95] }} material={fur} position={[0, -0.035, 0.03]} />
      <Lump opts={{ radius: 0.044, detail: 2, seed: 362, amp: 0.2, stretch: [0.92, 0.88, 0.95] }} material={fur} position={[0, 0.008, -0.075]} />
      <Lump opts={{ radius: 0.02, detail: 2, seed: 363, amp: 0.25, stretch: [0.8, 0.7, 0.9] }} material={bone} position={[0, -0.006, -0.112]} />
      {/* Уши - конусы, уходящие основанием в череп: пластина в воздухе сверху читалась отдельным предметом. */}
      {[-1, 1].map((s) => (
        <group key={`ear-${s}`}>
          <Spike height={0.062} base={0.02} seed={364 + s} lean={0.8} material={membrane} position={[s * 0.026, 0.03, -0.058]} rotation={[0.45, s * 0.2, -s * 0.42]} />
          <Spike height={0.022} base={0.008} seed={370 + s} lean={0.75} material={membrane} position={[s * 0.008, -0.004, -0.116]} rotation={[1.5, s * 0.4, -s * 0.5]} />
        </group>
      ))}
      <Blob args={[0.0065, 8]} position={[-0.017, 0.014, -0.104]} material={eye} shadow={false} />
      <Blob args={[0.0065, 8]} position={[0.017, 0.014, -0.104]} material={eye} shadow={false} />
      {[-1, 1].map((s) => (
        <group key={`leg-${s}`}>
          <Limb from={[s * 0.028, -0.05, 0.055]} to={[s * 0.036, -0.09, 0.11]} r0={0.011} r1={0.007} material={fur} shadow={false} />
          <Spike height={0.016} base={0.005} seed={380 + s} lean={0.7} material={claw} position={[s * 0.036, -0.092, 0.11]} rotation={[1.9, 0, s * 0.3]} />
          <Spike height={0.014} base={0.0045} seed={384 + s} lean={0.7} material={claw} position={[s * 0.036, -0.092, 0.11]} rotation={[1.6, s * 0.5, s * 0.5]} />
        </group>
      ))}
      <Spike height={0.038} base={0.012} seed={388} lean={0.8} material={membrane} position={[0, -0.045, 0.1]} rotation={[1.35, 0, 0]} />
      <group ref={wings}>
        {[-1, 1].map((s) => (
          <group key={`wing-${s}`} position={[s * 0.03, 0.024, -0.028]}>
            <Membrane spars={wingSpars(s)} sag={0.026} seed={390 + s * 2} material={membrane} />
            <Limb from={[0, 0, 0]} to={[s * 0.115, -0.005, 0.033]} r0={0.006} r1={0.005} material={bone} shadow={false} />
            <Limb from={[s * 0.115, -0.005, 0.033]} to={[s * 0.2, -0.008, 0.066]} r0={0.005} r1={0.004} material={bone} shadow={false} />
            {[0, 1, 2, 3].map((f) => (
              <Limb
                key={f}
                from={[s * 0.2, -0.008, 0.066]}
                to={wingSpars(s)[f].tip}
                r0={0.0042}
                r1={0.0022}
                material={bone}
                shadow={false}
              />
            ))}
            <Spike height={0.02} base={0.005} seed={398 + s} lean={0.6} material={claw} position={[s * 0.2, -0.006, 0.062]} rotation={[-1.2, 0, -s * 0.4]} />
          </group>
        ))}
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.46, 0]}>
        <circleGeometry args={[0.18, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 0.1, 0]} intensity={0.25} distance={1.2} color={palette.accent} />
    </group>
  );
};

/** Ледяная королева: подол из обломков, торс из гранёного льда, свечение только в груди и в глазах. */
const IceWraith = ({
  palette,
  queen = false,
  scale = 1,
}: {
  palette: BiomePalette;
  queen?: boolean;
  scale?: number;
}) => {
  // Грани вместо шаров: сглаженные сферы на снегу давали снеговика, а не ледяную королеву.
  // tint темнее снега на поле: на прежнем оттенке королева сливалась с плитками и оставалась белым пятном.
  const ice = surfaceMaterial('ice', palette, { tint: '#9fb8ca', metalness: 0.05, roughness: 0.55, opacity: 0.9, normalScale: 1.6 });
  const shard = plainMaterial('#5b819c', {
    metalness: 0.1,
    roughness: 0.32,
    flatShading: true,
    emissive: palette.accent,
    emissiveIntensity: 0.05,
  });
  // Светится только сердце внутри груди: светящийся торс превращал фигуру в мармеладную колбасу.
  const core = plainMaterial('#0a1a22', { roughness: 0.7, emissive: palette.accent, emissiveIntensity: 0.22 });
  const void_ = plainMaterial('#04080b', { roughness: 1 });
  const glint = plainMaterial('#0f1a20', { emissive: '#9fd2ec', emissiveIntensity: 0.34, roughness: 0.4 });
  const glow = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (glow.current) glow.current.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.025;
  });

  const h = queen ? 2.3 : 0.95;
  const hem = useMemo(
    () =>
      Array.from({ length: queen ? 8 : 5 }, (_, i) => {
        const n = queen ? 8 : 5;
        const rand = seededRandom(640 + i * 3);
        const a = (i / n) * Math.PI * 2 + rand() * 0.3;
        // Обломки ложатся почти плашмя: торчащие вверх шипы читались как связка бананов у ног.
        return {
          position: [Math.cos(a) * h * 0.22, h * 0.015, Math.sin(a) * h * 0.22] as Vec3,
          rotation: [Math.sin(a) * 1.15, -a, -Math.cos(a) * 1.15] as Vec3,
          height: h * (0.15 + rand() * 0.09),
          base: h * (0.05 + rand() * 0.02),
          seed: 660 + i,
        };
      }),
    [h, queen],
  );
  const spurs = useMemo(
    () =>
      Array.from({ length: queen ? 5 : 3 }, (_, i) => {
        const n = queen ? 5 : 3;
        const rand = seededRandom(700 + i * 5);
        // Осколки врастают в спину и плечи: веер через всю грудь читался как связка ножей.
        const a = Math.PI * (0.1 + (i / (n - 1)) * 0.8);
        return {
          position: [Math.cos(a) * h * 0.11, h * (0.82 + rand() * 0.06), Math.sin(a) * h * 0.11] as Vec3,
          rotation: [Math.sin(a) * 1.0, 0, -Math.cos(a) * 1.0] as Vec3,
          height: h * (0.1 + rand() * 0.08),
          base: h * 0.022,
          seed: 705 + i,
        };
      }),
    [h, queen],
  );

  return (
    <group ref={glow} scale={scale}>
      {/* Подол - гранёная воронка изо льда: фигура вырастает из наледи, а не стоит в луже. */}
      <Tube
        points={[
          [0, 0.02, 0],
          [0, h * 0.26, 0.01],
          [0, h * 0.58, -0.01],
        ]}
        radii={[h * 0.28, h * 0.18, h * 0.11]}
        radial={9}
        seed={720}
        wobble={0.32}
        material={ice}
      />
      {hem.map((s, i) => (
        <Spike key={`hem-${i}`} height={s.height} base={s.base} seed={s.seed} lean={0.8} material={shard} position={s.position} rotation={s.rotation} />
      ))}
      <Tube
        points={[
          [0, h * 0.52, 0],
          [0.01, h * 0.78, 0],
          [0, h * 0.95, -0.01],
        ]}
        radii={[h * 0.12, h * 0.105, h * 0.075]}
        radial={9}
        seed={733}
        wobble={0.3}
        material={ice}
      />
      {/* Сердце в груди: узкая щель с тусклым ядром, иначе чёрный ком со светлым шаром читался ртом. */}
      <Lump opts={{ radius: h * 0.038, detail: 2, seed: 731, amp: 0.3, stretch: [0.62, 1.2, 0.3] }} material={void_} position={[0, h * 0.78, -h * 0.088]} />
      <Lump opts={{ radius: h * 0.014, detail: 1, seed: 730, amp: 0.3 }} material={core} position={[0, h * 0.785, -h * 0.086]} shadow={false} />
      {[-1, 1].map((s) => (
        <Spike
          key={`rib-${s}`}
          height={h * 0.16}
          base={h * 0.022}
          seed={735 + s}
          lean={0.75}
          material={shard}
          position={[s * h * 0.075, h * 0.7, -h * 0.05]}
          rotation={[0.35, 0, s * -0.5]}
        />
      ))}
      {[-1, 1].map((s) => (
        <Lump
          key={`shoulder-${s}`}
          opts={{ radius: h * 0.07, detail: 2, seed: 734 + s, amp: 0.4, stretch: [1.2, 0.72, 1] }}
          material={ice}
          position={[s * h * 0.145, h * 0.88, 0]}
        />
      ))}
      {spurs.map((s, i) => (
        <Spike key={`spur-${i}`} height={s.height} base={s.base} seed={s.seed} lean={0.82} material={shard} position={s.position} rotation={s.rotation} />
      ))}
      {[-1, 1].map((s) => (
        <group key={`arm-${s}`}>
          <Tube
            points={[
              [s * h * 0.145, h * 0.85, 0],
              [s * h * 0.24, h * 0.68, -h * 0.03],
              [s * h * 0.27, h * 0.5, -h * 0.02],
            ]}
            radii={[h * 0.05, h * 0.038, h * 0.024]}
            seed={740 + s}
            radial={8}
            wobble={0.34}
            material={ice}
          />
          {/* Кисть из того же льда, что и рука: три отдельных шипа в воздухе выглядели как набор зубов. */}
          <Lump
            opts={{ radius: h * 0.032, detail: 2, seed: 748 + s, amp: 0.34, stretch: [0.9, 1.05, 0.85] }}
            material={ice}
            position={[s * h * 0.275, h * 0.475, -h * 0.03]}
          />
          {[0, 1, 2].map((f) => (
            <Spike
              key={f}
              height={h * 0.055}
              base={h * 0.011}
              seed={750 + f}
              lean={0.75}
              material={shard}
              position={[s * h * 0.275 + (f - 1) * h * 0.019, h * 0.462, -h * 0.042]}
              rotation={[Math.PI * 0.95, 0, s * 0.1]}
            />
          ))}
        </group>
      ))}
      {/* Капюшон наклонён вперёд, под козырьком только тень: овальное «лицо» просилось в снеговики. */}
      <Lump opts={{ radius: h * 0.115, detail: 2, seed: 760, amp: 0.32, stretch: [1, 1.2, 1.1] }} material={ice} position={[0, h * 1.04, 0]} rotation={[0.2, 0, 0]} />
      <Lump opts={{ radius: h * 0.052, detail: 2, seed: 761, amp: 0.24, stretch: [0.92, 0.4, 0.3] }} material={void_} position={[0, h * 1.03, -h * 0.094]} />
      {/* Несимметричные щели по примеру дупла древа: два ровных светлых кружка в чёрном овале собирались в тыкву. */}
      <Plate width={h * 0.032} depth={0.014} thickness={0.008} seed={762} amp={0.3} material={glint} position={[-h * 0.027, h * 1.042, -h * 0.108]} rotation={[0.2, 0, -0.55]} />
      <Plate width={h * 0.027} depth={0.014} thickness={0.008} seed={763} amp={0.3} material={glint} position={[h * 0.024, h * 1.024, -h * 0.108]} rotation={[0.2, 0, 0.45]} />
      {queen &&
        Array.from({ length: 5 }, (_, i) => {
          const rand = seededRandom(770 + i * 7);
          // Гребень прилегает к затылку: осколки по всему кругу торчали ушами.
          const a = Math.PI * (0.24 + (i / 4) * 0.52);
          return (
            <Spike
              key={`crown-${i}`}
              height={h * (i === 2 ? 0.09 : 0.045 + rand() * 0.03)}
              base={h * 0.015}
              seed={780 + i}
              lean={0.85}
              material={shard}
              position={[Math.cos(a) * h * 0.078, h * 1.03, Math.sin(a) * h * 0.078]}
              rotation={[Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2]}
            />
          );
        })}
      {/* Огонь в груди светит вниз и вперёд: на полной яркости он подсвечивал капюшон снизу и делал из королеву призрака. */}
      <pointLight position={[0, h * 0.72, -h * 0.1]} intensity={queen ? 0.4 : 0.2} distance={queen ? 1.6 : 1} color={palette.accent} />
    </group>
  );
};

/** Древесный исполин: гнутый ствол с корневой пяткой, рваная крона, дупло с углями вместо лица. */
const TRUNK: Vec3[] = [
  [0, -0.08, 0],
  [0.07, 0.5, -0.05],
  [-0.06, 1.05, 0.06],
  [0.05, 1.6, -0.04],
  [0.0, 2.1, 0.02],
];

const trunkRadius = (k: number) => 0.52 - k * 0.3;

const Treant = ({ palette }: { palette: BiomePalette }) => {
  // tint перемножается с уже тонированной текстурой: абсолютные тёмные цвета давали чёрный силуэт.
  const bark = surfaceMaterial('bark', palette, { roughness: 0.92, normalScale: 2 });
  const barkDark = surfaceMaterial('bark', palette, { tint: '#b8ad9c', roughness: 0.96, normalScale: 1.8 });
  const moss = surfaceMaterial('foliage', palette, { tint: '#b6c2a2', roughness: 1 });
  const leafDark = surfaceMaterial('foliage', palette, { tint: '#94a182', roughness: 0.95 });
  const leafMid = surfaceMaterial('foliage', palette, { tint: '#a3ad8e', roughness: 0.95 });
  const leafLight = surfaceMaterial('foliage', palette, { tint: '#c0c4ad', roughness: 0.92 });
  const ember = plainMaterial('#2a1607', { emissive: '#c9691f', emissiveIntensity: 1.5, roughness: 0.7 });
  const hollow = plainMaterial('#1b1409', { roughness: 1 });
  const arms = useRef<THREE.Group>(null);

  const roots = useMemo(() => {
    const rand = seededRandom(13);
    return [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const a = (i / 7) * Math.PI * 2 + rand() * 0.5;
      const len = 0.58 + rand() * 0.34;
      return {
        points: [
          [Math.cos(a) * 0.12, 0.52, Math.sin(a) * 0.12],
          [Math.cos(a) * len * 0.52, 0.14, Math.sin(a) * len * 0.52],
          [Math.cos(a) * len, 0.015, Math.sin(a) * len],
        ] as Vec3[],
        radii: [0.15, 0.1, 0.032],
        seed: 20 + i,
      };
    });
  }, []);

  // Грёбы коры идут вдоль ствола: без него он выглядел отлитым из пластика.
  const ridges = useMemo(() => {
    const rand = seededRandom(17);
    const curve = new THREE.CatmullRomCurve3(TRUNK.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.4);
    return Array.from({ length: 7 }, (_, i) => {
      const a0 = rand() * Math.PI * 2;
      const twist = 0.3 + rand() * 0.7;
      const points: Vec3[] = [];
      const radii: number[] = [];
      for (let s = 0; s <= 4; s++) {
        const k = 0.04 + (s / 4) * 0.86;
        const p = curve.getPointAt(k);
        const rr = trunkRadius(k) * 0.86;
        const a = a0 + k * twist;
        points.push([p.x + Math.cos(a) * rr, p.y, p.z + Math.sin(a) * rr]);
        radii.push(0.062 - k * 0.036);
      }
      return { points, radii, seed: 60 + i * 3 };
    });
  }, []);

  const branches = useMemo(() => {
    const rand = seededRandom(31);
    return Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 + rand() * 0.7;
      const y0 = 1.45 + rand() * 0.6;
      const len = 0.5 + rand() * 0.45;
      const lift = 0.28 + rand() * 0.4;
      return {
        points: [
          [Math.cos(a) * 0.08, y0, Math.sin(a) * 0.08],
          [Math.cos(a) * len * 0.55, y0 + lift * 0.5, Math.sin(a) * len * 0.55],
          [Math.cos(a) * len, y0 + lift, Math.sin(a) * len],
        ] as Vec3[],
        radii: [0.13, 0.075, 0.026],
        seed: 70 + i,
      };
    });
  }, []);

  const canopy = useMemo(() => {
    const rand = seededRandom(23);
    const tones = [leafDark, leafDark, leafMid, leafLight];
    // Крона куполом, а не блином: гладкие надутые линзы читались как брокколи на палке.
    return Array.from({ length: 84 }, (_, i) => {
      const a = rand() * Math.PI * 2;
      const r = 0.16 + Math.sqrt(rand()) * 0.98;
      return {
        position: [Math.cos(a) * r, 1.98 + rand() * 0.82 - r * r * 0.34, Math.sin(a) * r] as Vec3,
        rotation: [(rand() - 0.5) * 1.6, rand() * 3, (rand() - 0.5) * 1.6] as Vec3,
        radius: 0.1 + rand() * 0.11,
        squash: 0.42 + rand() * 0.3,
        seed: 100 + i * 5,
        tone: tones[Math.floor(rand() * tones.length)],
      };
    });
  }, []);

  const vines = useMemo(() => {
    const rand = seededRandom(44);
    return Array.from({ length: 5 }, (_, i) => {
      const a = rand() * Math.PI * 2;
      const r = 0.42 + rand() * 0.34;
      const top = 1.9 + rand() * 0.4;
      const drop = 0.5 + rand() * 0.6;
      return {
        points: [
          [Math.cos(a) * r, top, Math.sin(a) * r],
          [Math.cos(a) * (r + 0.06), top - drop * 0.55, Math.sin(a) * (r + 0.06)],
          [Math.cos(a) * (r + 0.02), top - drop, Math.sin(a) * (r + 0.02)],
        ] as Vec3[],
        radii: [0.028, 0.018, 0.006],
        seed: 130 + i,
      };
    });
  }, []);

  useFrame((state) => {
    if (arms.current) {
      const t = state.clock.elapsedTime * 0.8;
      arms.current.children.forEach((arm, i) => {
        arm.rotation.z = (i === 0 ? 0.55 : -0.55) + Math.sin(t + i) * 0.08;
      });
    }
  });

  return (
    <group>
      {roots.map((r, i) => (
        <Tube key={`root-${i}`} points={r.points} radii={r.radii} seed={r.seed} wobble={0.3} material={barkDark} />
      ))}
      <Tube points={TRUNK} radii={[0.52, 0.42, 0.35, 0.28, 0.21]} radial={14} seed={4} wobble={0.22} material={bark} />
      {ridges.map((r, i) => (
        <Tube key={`ridge-${i}`} points={r.points} radii={r.radii} seed={r.seed} wobble={0.4} material={barkDark} />
      ))}
      {branches.map((b, i) => (
        <Tube key={`branch-${i}`} points={b.points} radii={b.radii} seed={b.seed} wobble={0.3} material={bark} />
      ))}
      {vines.map((v, i) => (
        <Tube key={`vine-${i}`} points={v.points} radii={v.radii} seed={v.seed} wobble={0.5} material={moss} shadow={false} />
      ))}
      <group ref={arms}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.24, 1.46, 0]} rotation={[0, 0, s * 0.95]}>
            <Tube points={[[0, 0, 0], [s * 0.3, -0.12, -0.08], [s * 0.58, -0.3, -0.14]]} radii={[0.12, 0.085, 0.05]} seed={180 + s} wobble={0.28} material={bark} />
            <Tube points={[[s * 0.58, -0.3, -0.14], [s * 0.7, -0.5, -0.26]]} radii={[0.045, 0.016]} seed={190 + s} wobble={0.3} material={barkDark} />
            <Tube points={[[s * 0.58, -0.3, -0.14], [s * 0.76, -0.42, -0.34]]} radii={[0.04, 0.012]} seed={200 + s} wobble={0.3} material={barkDark} />
            <Tube points={[[s * 0.58, -0.3, -0.14], [s * 0.62, -0.52, -0.06]]} radii={[0.036, 0.011]} seed={210 + s} wobble={0.3} material={barkDark} />
          </group>
        ))}
      </group>
      {/* Дупло: узкая щель в стволе, а не чёрный овал снаружи. Круглые зрачки и полоска-губы делали из босса смайлик. */}
      <Lump
        opts={{ radius: 0.2, detail: 2, seed: 220, amp: 0.26, stretch: [0.85, 1.35, 0.36] }}
        material={hollow}
        position={[0, 1.47, -0.27]}
      />
      {/* Глаза - щели, а не круглые точки: две светящиеся шайпы в стволе собирались в рожицу. */}
      <Plate width={0.075} depth={0.02} thickness={0.012} seed={221} amp={0.3} material={ember} position={[-0.062, 1.53, -0.35]} rotation={[0.1, 0, 0.22]} />
      <Plate width={0.065} depth={0.02} thickness={0.012} seed={222} amp={0.3} material={ember} position={[0.055, 1.44, -0.36]} rotation={[0.1, 0, -0.26]} />
      <Tube points={[[0, 1.68, -0.3], [-0.05, 1.8, -0.26], [-0.02, 1.9, -0.19]]} radii={[0.045, 0.028, 0.011]} seed={224} wobble={0.35} material={barkDark} />
      {canopy.map((f, i) => (
        <Lump
          key={`leaf-${i}`}
          opts={{ radius: f.radius, detail: 2, seed: f.seed, amp: 0.66, stretch: [1, f.squash, 1] }}
          material={f.tone}
          position={f.position}
          rotation={f.rotation}
        />
      ))}
      <pointLight position={[0, 1.47, -0.44]} intensity={0.5} distance={1.6} color="#c9691f" />
      <pointLight position={[0, 2.2, 0]} intensity={0.4} distance={3} color={palette.accent} />
    </group>
  );
};

export const EnemyModel = ({
  type,
  palette,
  biome,
  boss,
  avatar,
}: {
  type: string;
  palette: BiomePalette;
  biome: Biome;
  boss?: boolean;
  avatar?: string;
}) => {
  if (boss) {
    // Аватар из конфига босса, биом - подстраховка: сверять босса с цветом палитры значило сломать его при любой правке оттенков.
    const kind = avatar ?? biome;
    if (kind === 'forest') return <Treant palette={palette} />;
    if (kind === 'desert') return <Scorpion palette={palette} scale={1.6} />;
    if (kind === 'snow') return <IceWraith palette={palette} queen />;
    if (kind === 'volcano') return <Golem palette={palette} magma scale={1.35} />;
  }
  switch (type) {
    case 'golem':
      return <Golem palette={palette} />;
    case 'slime':
      return <Slime palette={palette} />;
    case 'scorpion':
      return <Scorpion palette={palette} />;
    case 'wolf':
      return <Wolf palette={palette} />;
    case 'vulture':
      return <Bird palette={palette} />;
    case 'bat':
      return <Bat palette={palette} />;
    case 'snowman':
      return <IceWraith palette={palette} />;
    default:
      return <Golem palette={palette} />;
  }
};
