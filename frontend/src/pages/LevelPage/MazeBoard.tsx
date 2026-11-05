import { useEffect, useMemo } from 'react';
import type { LevelMapData } from './types';
import { Board3D, type BoardSceneProps } from './scene/Board3D';
import { attachBench } from './scene/bench';

export const parsePos = (value: string) => ({
  x: value.charCodeAt(0) - 65,
  y: parseInt(value.slice(1), 10) - 1,
});

export const posName = ({ x, y }: { x: number; y: number }) => `${String.fromCharCode(65 + x)}${y + 1}`;

interface MazeBoardProps extends Omit<BoardSceneProps, 'occupied'> {
  map: LevelMapData;
  flash: 'hit' | 'attack' | null;
  epoch: number;
}

export const MazeBoard = (props: MazeBoardProps) => {
  const { map, robot, enemies, exit, hazards } = props;

  // Мусор и трава не должны расти там, где стоят персонажи и предметы.
  const occupied = useMemo(() => {
    const set = new Set<string>();
    for (const enemy of enemies) if (enemy.alive) set.add(posName({ x: enemy.x, y: enemy.y }));
    for (const hazard of hazards ?? []) for (const cell of hazard.cells) set.add(cell);
    if (robot) set.add(posName(robot));
    if (exit) set.add(exit);
    return set;
  }, [map, robot, enemies, exit, hazards]);

  const scene = useMemo<BoardSceneProps>(() => ({ ...props, occupied }), [props, occupied]);

  // Отладочный стенд монтируется только в dev-сборке: он даёт смотреть кадры при скрытой панели.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    attachBench(scene);
  }, [scene]);

  return (
    <div className="board-3d">
      <Board3D {...scene} />
    </div>
  );
};
