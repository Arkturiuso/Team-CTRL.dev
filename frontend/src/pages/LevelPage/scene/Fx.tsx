import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BiomePalette } from './palette';
import type { BossFx, HazardFrame, LevelMapData } from '../types';
import { cellCenter, paletteOf } from './palette';
import { groundAt, seededRandom } from './procedural';
import { Limb } from './Models';

const parseCell = (value: string) => ({ x: value.charCodeAt(0) - 65, y: parseInt(value.slice(1), 10) - 1 });

type Vec3 = [number, number, number];

/** Прогресс эффекта по часам сцены: id в ключевом слове нужен, чтобы повторный выстрел начал анимацию заново. */
const useTimeline = (key: string | number | undefined, seconds: number, apply: (t: number, live: boolean) => void) => {
  const start = useRef(-1);
  const seen = useRef<string | number | undefined>(undefined);
  useFrame((state) => {
    if (seen.current !== key) {
      seen.current = key;
      start.current = state.clock.elapsedTime;
    }
    const live = key !== undefined;
    apply(live ? Math.min(1, (state.clock.elapsedTime - start.current) / seconds) : 1, live);
  });
};

/** Свет, а не поверхность: additive basic-материал не ловит тени и не тонирован туманом. */
const useGlow = (color: string) =>
  useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      }),
    [color],
  );

const useCellPoint = (map: LevelMapData) => (name: string): Vec3 => {
  const { x, y } = parseCell(name);
  const c = cellCenter(x, y, map.width, map.height);
  return [c.x, groundAt(c.x, c.z), c.z];
};

const fade = (material: THREE.Material | THREE.Material[] | undefined, opacity: number) => {
  const list = material ? [material].flat() : [];
  for (const item of list) (item as THREE.MeshBasicMaterial).opacity = opacity;
};

/** Выстрел босса: луч от груди до клетки, снаряд вдоль него и кольцо вспышки в точке попадания. */
const ShotFx = ({ map, fx }: { map: LevelMapData; fx: BossFx | null }) => {
  const palette = paletteOf(map.biome);
  const glow = useGlow(fx?.kind === 'hit' ? '#ffe9c4' : palette.accent);
  const point = useCellPoint(map);
  const beam = useRef<THREE.Mesh>(null);
  const bullet = useRef<THREE.Mesh>(null);
  const burst = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);

  const path = useMemo(() => {
    if (!fx?.from || !fx.to) return null;
    const a = point(fx.from);
    const b = point(fx.to);
    a[1] += 0.6;
    b[1] += 0.32;
    return { a, b };
  }, [fx, map]);

  // Удар по боссу приходит без цели: вспышка прямо на нём, иначе эффект терялся бы в пустоте.
  const solo = fx?.from && !fx.to ? point(fx.from) : null;
  const burstAt = path ? path.b : solo;

  useTimeline(fx?.id, 0.8, (t, live) => {
    if (beam.current) {
      beam.current.visible = !!live && !!path && t < 0.5;
      const k = live && path ? Math.max(0, 1 - t / 0.5) : 0;
      fade(beam.current.material, 0.9 * k);
      beam.current.scale.set(0.4 + k * 0.6, 1, 0.4 + k * 0.6);
    }
    if (bullet.current && path) {
      const k = Math.min(1, t / 0.42);
      bullet.current.visible = live && t < 0.42;
      bullet.current.position.set(
        path.a[0] + (path.b[0] - path.a[0]) * k,
        path.a[1] + (path.b[1] - path.a[1]) * k,
        path.a[2] + (path.b[2] - path.a[2]) * k,
      );
    }
    if (burst.current && burstAt) {
      const hit = live && t >= 0.34;
      burst.current.visible = hit;
      if (hit) {
        const k = (t - 0.34) / 0.66;
        burst.current.scale.setScalar(0.25 + k * 1.6);
        fade(burst.current.material, 0.85 * (1 - k));
      }
    }
    if (light.current) light.current.intensity = live && burstAt && t >= 0.34 ? 10 * (1 - (t - 0.34) / 0.66) : 0;
  });

  if (!fx) return null;
  return (
    <group>
      {path && (
        <>
          <Limb ref={beam} shadow={false} segments={8} from={path.a} to={path.b} r0={0.06} r1={0.02} material={glow} />
          <mesh ref={bullet} material={glow}>
            <sphereGeometry args={[0.12, 10, 8]} />
          </mesh>
        </>
      )}
      {burstAt && (
        <group position={[burstAt[0], burstAt[1] + 0.32, burstAt[2]]}>
          <mesh ref={burst} rotation={[-Math.PI / 2, 0, 0]} material={glow}>
            <torusGeometry args={[0.5, 0.05, 6, 26]} />
          </mesh>
          <pointLight ref={light} position={[0, 0.25, 0]} distance={4.5} decay={2} color={palette.accent} intensity={0} />
        </group>
      )}
    </group>
  );
};

/** Заряд перед ударом: сжимающееся свечение в груди босса и бегущее по земле кольцо. */
const ChargeFx = ({ map, fx }: { map: LevelMapData; fx: BossFx | null }) => {
  const palette = paletteOf(map.biome);
  const glow = useGlow(palette.accent);
  const point = useCellPoint(map);
  const core = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const at = fx?.from ? point(fx.from) : null;

  useTimeline(fx?.id, 1.1, (t, live) => {
    if (core.current) {
      core.current.visible = live;
      core.current.scale.setScalar(0.1 + t * 0.42);
      core.current.rotation.y = t * 4;
    }
    if (ring.current) {
      ring.current.visible = live;
      ring.current.scale.setScalar(0.3 + t * 1.5);
      fade(ring.current.material, 0.7 * (1 - t * 0.7));
    }
  });

  if (!at) return null;
  return (
    <group position={at}>
      <mesh ref={core} position={[0, 0.75, 0]} material={glow}>
        <icosahedronGeometry args={[0.6, 1]} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} material={glow}>
        <torusGeometry args={[0.55, 0.03, 6, 26]} />
      </mesh>
    </group>
  );
};

/** Метка: вращающийся обруч с иглами и столб света над клеткой - без неё игрок не видит, куда бьёт босс. */
const MarkFx = ({ map, cell, palette, raging }: { map: LevelMapData; cell: string; palette: BiomePalette; raging?: boolean }) => {
  const glow = useGlow(raging ? '#ff5a3c' : palette.accent);
  const point = useCellPoint(map);
  const spin = useRef<THREE.Group>(null);
  const at = point(cell);

  useFrame((state) => {
    if (spin.current) {
      spin.current.rotation.y = state.clock.elapsedTime * 1.1;
      spin.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.06;
    }
  });

  return (
    <group position={at}>
      <group ref={spin} position={[0, 1, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={glow}>
          <torusGeometry args={[0.36, 0.03, 6, 22]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <Limb
            key={i}
            shadow={false}
            segments={4}
            from={[0, 0, 0]}
            to={[Math.cos((i / 4) * Math.PI * 2) * 0.36, 0, Math.sin((i / 4) * Math.PI * 2) * 0.36]}
            r0={0.055}
            r1={0.004}
            material={glow}
          />
        ))}
      </group>
      <Limb shadow={false} segments={8} from={[0, 0.03, 0]} to={[0, 1.7, 0]} r0={0.17} r1={0.02} material={glow} />
    </group>
  );
};

/** Прицел: кольцо с засечками на грунте, пока босс выбирает клетку. */
const AimFx = ({ map, cell, palette }: { map: LevelMapData; cell: string; palette: BiomePalette }) => {
  const glow = useGlow(palette.accent);
  const point = useCellPoint(map);
  const spin = useRef<THREE.Group>(null);
  const at = point(cell);

  useFrame((state) => {
    if (spin.current) spin.current.rotation.y = -state.clock.elapsedTime * 0.8;
  });

  return (
    <group position={[at[0], at[1] + 0.04, at[2]]}>
      <group ref={spin}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} material={glow}>
          <ringGeometry args={[0.34, 0.4, 24, 1, 0, Math.PI * 1.5]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[Math.cos((i / 4) * Math.PI * 2) * 0.48, 0, Math.sin((i / 4) * Math.PI * 2) * 0.48]}
            material={glow}
          >
            <boxGeometry args={[0.11, 0.02, 0.02]} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const CHUNKS = Array.from({ length: 10 }, (_, i) => {
  const rand = seededRandom(41 + i * 7);
  return { a: rand() * Math.PI * 2, r: 0.12 + rand() * 0.42, size: 0.07 + rand() * 0.14, rise: 0.9 + rand() * 1.1, spin: rand() };
});

/** Клетка опасности: дерево валится, лавина и лава сыплют обломками, песчаная стена проходит столпом. */
const HazardCell = ({
  hazard,
  at,
  palette,
}: {
  hazard: HazardFrame;
  at: Vec3;
  palette: BiomePalette;
}) => {
  const lava = useGlow('#ff6a2c');
  const frost = useGlow('#d8eefb');
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: palette.bark, roughness: 0.95, flatShading: true }), [palette]);
  const leaf = useMemo(() => new THREE.MeshStandardMaterial({ color: palette.foliageDark, roughness: 0.95, flatShading: true }), [palette]);
  const group = useRef<THREE.Group>(null);
  const falling = hazard.kind === 'tree';
  const dropping = falling || hazard.kind === 'avalanche' || hazard.kind === 'lava';

  useTimeline(`${hazard.id}:${hazard.state}:${at.join(',')}`, 0.7, (t, live) => {
    const mesh = group.current;
    if (!mesh) return;
    mesh.visible = live;
    const k = Math.min(1, t);
    mesh.children.forEach((child) => {
      if (child.name === 'trunk') {
        // Валится вокруг основания: вокруг середины ствол улетал бы за клетку.
        child.rotation.z = (1 - k) * Math.PI * 0.5 - 0.06;
        return;
      }
      if (child.name.startsWith('chunk')) {
        const c = CHUNKS[Number(child.name.slice(5)) % CHUNKS.length];
        child.position.set(Math.cos(c.a) * c.r * k, Math.max(0.05, c.rise * (1 - k) * (1 - k)), Math.sin(c.a) * c.r * k);
        child.rotation.set(k * (1 + c.spin) * 3, k * (2 + c.spin) * 3, 0);
      }
      if (child.name === 'fountain') child.scale.set(1, 0.3 + k * 1.1, 1);
    });
  });

  return (
    <group ref={group} position={at}>
      {falling && (
        <group name="trunk">
          <Limb segments={7} from={[0, 0, 0]} to={[0, 2, 0]} r0={0.15} r1={0.08} material={wood} />
          <mesh position={[0, 2.2, 0]} material={leaf} castShadow>
            <icosahedronGeometry args={[0.6, 0]} />
          </mesh>
        </group>
      )}
      {dropping &&
        CHUNKS.map((c, i) => (
          <mesh key={i} name={`chunk${i}`} material={hazard.kind === 'avalanche' ? frost : falling ? wood : lava} castShadow={falling}>
            <icosahedronGeometry args={[c.size, 0]} />
          </mesh>
        ))}
      {hazard.kind === 'lava' && (
        <>
          <mesh name="fountain" position={[0, 0.7, 0]} material={lava}>
            <coneGeometry args={[0.36, 1.4, 8]} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} material={lava}>
            <circleGeometry args={[0.55, 20]} />
          </mesh>
        </>
      )}
      {hazard.kind === 'sandstorm' && (
        <Limb shadow={false} segments={8} from={[0, 0.1, 0]} to={[0, 1.8, 0]} r0={0.5} r1={0.22} material={frost} />
      )}
    </group>
  );
};

const HazardFx = ({ map, hazards }: { map: LevelMapData; hazards?: HazardFrame[] }) => {
  const palette = paletteOf(map.biome);
  const point = useCellPoint(map);
  const striking = (hazards ?? []).filter((h) => h.state === 'impact');
  return (
    <group>
      {striking.map((hazard) =>
        hazard.cells.map((cell) => <HazardCell key={`${hazard.id}-${cell}`} hazard={hazard} at={point(cell)} palette={palette} />),
      )}
    </group>
  );
};

export interface FxProps {
  map: LevelMapData;
  bossFx?: BossFx | null;
  bossAim?: string | null;
  bossMark?: string | null;
  bossRaging?: boolean;
  hazards?: HazardFrame[];
}

export const FxLayer = ({ map, bossFx, bossAim, bossMark, bossRaging, hazards }: FxProps) => {
  const palette = paletteOf(map.biome);
  const shooting = bossFx && (bossFx.kind === 'shot' || bossFx.kind === 'miss' || bossFx.kind === 'hit') ? bossFx : null;
  return (
    <group>
      <ShotFx map={map} fx={shooting} />
      <ChargeFx map={map} fx={bossFx?.kind === 'charge' ? bossFx : null} />
      {bossMark && <MarkFx map={map} cell={bossMark} palette={palette} raging={bossRaging} />}
      {bossAim && <AimFx map={map} cell={bossAim} palette={palette} />}
      <HazardFx map={map} hazards={hazards} />
    </group>
  );
};
