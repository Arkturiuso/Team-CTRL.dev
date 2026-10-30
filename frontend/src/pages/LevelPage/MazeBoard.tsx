import type { Direction, EnemyFrame, LevelMapData } from './types';
import { CoinSprite, DoorSprite, EnemySprite, KeySprite, RockSprite, RobotSprite } from './sprites';

export const parsePos = (value: string) => ({
  x: value.charCodeAt(0) - 65,
  y: parseInt(value.slice(1), 10) - 1,
});

const ROTATION: Record<Direction, number> = { up: 0, right: 90, down: 180, left: 270 };

interface MazeBoardProps {
  map: LevelMapData;
  robot: { x: number; y: number; direction: Direction } | null;
  enemies: EnemyFrame[];
  collectedCoins: Set<number>;
  collectedKeys: Set<string>;
  hasKey: boolean;
  flash: 'hit' | 'attack' | null;
  epoch: number;
}

export const MazeBoard = ({ map, robot, enemies, collectedCoins, collectedKeys, hasKey, flash, epoch }: MazeBoardProps) => {
  const width = map.width;
  const height = map.height;
  const cell = Math.max(26, Math.min(58, Math.floor(680 / Math.max(width, height))));
  const biome = map.biome ?? 'forest';
  const rocks = new Set(map.rocks ?? []);
  const terrain = map.terrain ?? {};
  const coins = map.coins ?? [];
  const keys = map.keys ?? [];
  const requiredKey = map.required_key_position;
  const exitPos = parsePos(map.exit);

  const tiles = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = `${String.fromCharCode(65 + x)}${y + 1}`;
      const tileTerrain = terrain[pos];
      const isExit = x === exitPos.x && y === exitPos.y;
      const isRock = rocks.has(pos);
      tiles.push(
        <div
          key={pos}
          className={[
            'tile',
            (x + y) % 2 === 0 ? 'tile--light' : 'tile--dark',
            tileTerrain ? `tile--${tileTerrain}` : '',
            isExit ? 'tile--exit' : '',
            isRock ? 'tile--rock' : '',
          ].filter(Boolean).join(' ')}
          style={{ left: x * cell, top: y * cell, width: cell, height: cell }}
        />,
      );
    }
  }

  const wallSegments = (map.walls ?? []).map((wall, index) => {
    const a = parsePos(wall.side1);
    const b = parsePos(wall.side2);
    if (a.x === b.x && Math.abs(a.y - b.y) === 1) {
      return (
        <div
          key={`w-${index}`}
          className="wall-seg wall-seg--h"
          style={{ left: a.x * cell, top: Math.max(a.y, b.y) * cell - 3, width: cell, height: 6 }}
        />
      );
    }
    if (a.y === b.y && Math.abs(a.x - b.x) === 1) {
      return (
        <div
          key={`w-${index}`}
          className="wall-seg wall-seg--v"
          style={{ left: Math.max(a.x, b.x) * cell - 3, top: a.y * cell, width: 6, height: cell }}
        />
      );
    }
    return null;
  });

  const aliveEnemies = enemies.filter((enemy) => enemy.alive);

  return (
    <div className="board-frame">
      <div className="board-cols" style={{ marginLeft: 18 }}>
        {Array.from({ length: width }).map((_, x) => (
          <span key={x} style={{ width: cell }}>{String.fromCharCode(65 + x)}</span>
        ))}
      </div>
      <div className="board-body">
        <div className="board-rows" style={{ width: 18 }}>
          {Array.from({ length: height }).map((_, y) => (
            <span key={y} style={{ height: cell }}>{y + 1}</span>
          ))}
        </div>
        <div
          className={`board biome-${biome}${flash ? ` is-${flash}` : ''}`}
          style={{ width: cell * width, height: cell * height }}
        >
          {tiles}

          {[...rocks].map((pos) => {
            const p = parsePos(pos);
            return (
              <div
                key={`rock-${pos}`}
                className="board-rock"
                style={{ left: p.x * cell, top: p.y * cell, width: cell, height: cell }}
              >
                <RockSprite biome={biome} size={cell * 0.94} />
              </div>
            );
          })}

          {wallSegments}

          <div
            className={`board-door${robot && robot.x === exitPos.x && robot.y === exitPos.y ? ' board-door--reached' : ''}`}
            style={{ left: exitPos.x * cell, top: exitPos.y * cell, width: cell, height: cell }}
          >
            <DoorSprite size={cell * 0.92} />
          </div>

          {coins.map((coin) => {
            if (collectedCoins.has(coin.id)) return null;
            const p = parsePos(coin.position);
            const size = Math.round(cell * 0.46);
            return (
              <div
                key={`coin-${coin.id}`}
                className="board-coin"
                style={{
                  left: p.x * cell + (cell - size) / 2,
                  top: p.y * cell + (cell - size) / 2,
                  width: size,
                  height: size,
                }}
              >
                <CoinSprite size={size} />
              </div>
            );
          })}

          {keys.map((key) => {
            if (collectedKeys.has(key.position)) return null;
            const p = parsePos(key.position);
            const size = Math.round(cell * 0.62);
            const isRequired = key.position === requiredKey;
            return (
              <div
                key={`key-${key.id}`}
                className={`board-key${isRequired ? ' board-key--required' : ''}`}
                style={{
                  left: p.x * cell + (cell - size) / 2,
                  top: p.y * cell + (cell - size) / 2,
                  width: size,
                  height: size,
                }}
              >
                <KeySprite size={size} />
              </div>
            );
          })}

          {aliveEnemies.map((enemy) => {
            const size = Math.round(cell * 0.84);
            return (
              <div
                key={`enemy-${enemy.id}-${epoch}`}
                className={`board-enemy board-enemy--${enemy.type}`}
                style={{
                  left: (cell - size) / 2,
                  top: (cell - size) / 2,
                  width: size,
                  height: size,
                  transform: `translate(${enemy.x * cell}px, ${enemy.y * cell}px)`,
                }}
              >
                <EnemySprite type={enemy.type} size={size} />
              </div>
            );
          })}

          {robot && (
            <div
              key={`robot-${epoch}`}
              className="board-robot"
              style={{
                left: (cell - Math.round(cell * 0.9)) / 2,
                top: (cell - Math.round(cell * 0.9)) / 2,
                width: Math.round(cell * 0.9),
                height: Math.round(cell * 0.9),
                transform: `translate(${robot.x * cell}px, ${robot.y * cell}px)`,
              }}
            >
              <div className="board-robot__spin" style={{ transform: `rotate(${ROTATION[robot.direction]}deg)` }}>
                <RobotSprite size={Math.round(cell * 0.9)} />
              </div>
            </div>
          )}

          {flash === 'attack' && robot && (
            <div
              className="fx-attack"
              style={{
                left: robot.x * cell + cell / 2,
                top: robot.y * cell + cell / 2,
                width: cell,
                height: cell,
              }}
            />
          )}

          <div className="board-vignette" />
        </div>
      </div>
      <div className="board-legend">
        <span><i className="legend-dot legend-dot--coin" />монета</span>
        <span><i className="legend-dot legend-dot--key" />ключ</span>
        <span><i className="legend-dot legend-dot--exit" />выход</span>
        {Object.keys(terrain).length > 0 && <span><i className="legend-dot legend-dot--ice" />лёд / грязь</span>}
        {hasKey && <span className="legend-key">ключ собран</span>}
      </div>
    </div>
  );
};
