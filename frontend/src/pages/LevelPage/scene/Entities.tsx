import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BossFx, Direction, EnemyFrame, HazardFrame, LevelMapData } from '../types';
import { cellCenter, paletteOf } from './palette';
import { groundAt } from './procedural';
import { CoinModel, DIRECTION_Y, DoorModel, EnemyModel, KeyModel, RobotModel } from './Models';

const CELL_NAMES_A = 65;

export const parseCell = (value: string) => ({
  x: value.charCodeAt(0) - CELL_NAMES_A,
  y: parseInt(value.slice(1), 10) - 1,
});

/** Верх плитки в мировых координатах: тот же шум, что и в Terrain, иначе предметы провалятся в грунт. */
export const cellTop = (x: number, y: number, width: number, height: number) => {
  const { x: cx, z: cz } = cellCenter(x, y, width, height);
  return groundAt(cx, cz);
};

/** Поворот модели к цели: фронт всех моделей смотрит на -z. */
const faceYaw = (fromX: number, fromY: number, toX: number, toY: number) => Math.atan2(-(toX - fromX), -(toY - fromY));

export interface EntitiesProps {
  map: LevelMapData;
  robot: { x: number; y: number; direction: Direction } | null;
  enemies: EnemyFrame[];
  collectedCoins: Set<number>;
  collectedKeys: Set<string>;
  hasKey: boolean;
  keyPosition?: string | null;
  fakeKeys?: string[];
  bossFx?: BossFx | null;
  bossAim?: string | null;
  bossMark?: string | null;
  bossRaging?: boolean;
  hazards?: HazardFrame[];
  exit?: string;
  hideKeys?: boolean;
  keysRevealed?: boolean;
  doorSealed?: boolean;
}

/** Плавный ход к целевой клетке: телепорт выдавал бы кукольный спектакль. */
const Mover = ({
  target,
  children,
}: {
  target: [number, number, number];
  children: React.ReactNode;
}) => {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const k = 1 - Math.exp(-delta * 9);
    g.position.x += (target[0] - g.position.x) * k;
    g.position.y += (target[1] - g.position.y) * k;
    g.position.z += (target[2] - g.position.z) * k;
  });
  return (
    <group ref={group} position={target}>
      {children}
    </group>
  );
};

export const Entities = (props: EntitiesProps) => {
  const { map, robot, enemies, exit, hazards } = props;
  const palette = paletteOf(map.biome);
  const width = map.width;
  const height = map.height;
  const boss = map.boss;

  const place = (x: number, y: number): [number, number, number] => {
    const c = cellCenter(x, y, width, height);
    return [c.x, cellTop(x, y, width, height), c.z];
  };

  const placeName = (name: string): [number, number, number] => {
    const p = parseCell(name);
    return place(p.x, p.y);
  };

  const doorCell = exit ?? map.exit;
  const requiredKey = map.required_key_position ?? map.keys?.[0]?.position ?? props.keyPosition ?? null;

  return (
    <group>
      {doorCell && (
        <group position={placeName(doorCell)} scale={1.55}>
          <DoorModel palette={palette} sealed={!!props.doorSealed} open={!props.doorSealed && (!!props.hasKey || !!robot?.x)} />
        </group>
      )}

      {(map.coins ?? [])
        .filter((coin) => !props.collectedCoins.has(coin.id))
        .map((coin) => (
          <group key={`coin-${coin.id}`} position={placeName(coin.position)} scale={1.5}>
            <CoinModel palette={palette} />
          </group>
        ))}

      {!props.hideKeys &&
        requiredKey &&
        !props.collectedKeys.has(requiredKey) && (
          <group position={placeName(requiredKey)} scale={1.4}>
            <KeyModel />
          </group>
        )}

      {!props.hideKeys &&
        (map.keys ?? [])
          .filter((key) => key.fake)
          .map((key) => (
            <group key={`fake-${key.id}`} position={placeName(key.position)} scale={1.4}>
              <KeyModel fake />
            </group>
          ))}

      {!props.hideKeys &&
        (props.fakeKeys ?? [])
          .filter((cell) => !requiredKey || cell !== requiredKey)
          .map((cell) => (
            <group key={`fakecell-${cell}`} position={placeName(cell)} scale={1.4}>
              <KeyModel fake />
            </group>
          ))}

      {enemies.map((enemy) =>
        enemy.alive ? (
          <Mover key={`enemy-${enemy.id}`} target={place(enemy.x, enemy.y)}>
            <group
              rotation={[0, robot ? faceYaw(enemy.x, enemy.y, robot.x, robot.y) : Math.PI, 0]}
              scale={enemy.boss ? 2.1 : 1.9}
            >
              <EnemyModel
                type={enemy.type}
                palette={palette}
                biome={map.biome ?? 'forest'}
                boss={enemy.boss}
                avatar={enemy.boss ? boss?.avatar : undefined}
              />
              {enemy.shielded && (
                <mesh position={[0, 0.4, 0]}>
                  <sphereGeometry args={[0.42, 16, 12]} />
                  <meshStandardMaterial
                    color={palette.accent}
                    emissive={palette.accent}
                    emissiveIntensity={0.4}
                    transparent
                    opacity={0.16}
                    roughness={0.3}
                  />
                </mesh>
              )}
            </group>
          </Mover>
        ) : null,
      )}

      {robot && (
        <Mover target={place(robot.x, robot.y)}>
          <group rotation={[0, DIRECTION_Y[robot.direction] ?? 0, 0]} scale={2.2}>
            <RobotModel palette={palette} hasKey={props.hasKey} />
          </group>
        </Mover>
      )}

      {(hazards ?? []).map((hazard) => (
        <group key={`hazard-${hazard.id}`}>
          {hazard.cells.map((cell) => (
            <group key={cell} position={placeName(cell)}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <circleGeometry args={[0.46, 24]} />
                <meshBasicMaterial
                  color={hazard.state === 'warn' ? palette.accent : '#000000'}
                  transparent
                  opacity={hazard.state === 'warn' ? 0.22 : 0.3}
                  depthWrite={false}
                />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
};
