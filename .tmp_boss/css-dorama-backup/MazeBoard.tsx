import type { CSSProperties, ReactNode } from 'react';
import type { BossFx, Direction, EnemyFrame, HazardFrame, LevelMapData } from './types';
import {
  AmbientLayer,
  BossSprite,
  CoinSprite,
  DoorSprite,
  EnemySprite,
  HazardSprite,
  KeySprite,
  RockSprite,
  RobotSprite,
} from './sprites';

export const parsePos = (value: string) => ({
  x: value.charCodeAt(0) - 65,
  y: parseInt(value.slice(1), 10) - 1,
});

const posName = ({ x, y }: { x: number; y: number }) => `${String.fromCharCode(65 + x)}${y + 1}`;

const ROTATION: Record<Direction, number> = { up: 0, right: 90, down: 180, left: 270 };

// Наклон «стола»: без перспективы проекция равна cos(угла), поэтому линейки координат считаются точно.
const TILT_DEG = 48;
const TILT_COS = Math.cos((TILT_DEG * Math.PI) / 180);
const RULER_W = 22;
const SLAB_H = 15;

// Дальние ряды чуть меньше, ближние - больше: псевдоперспектива без риска разъехать сетке.
const depthScale = (y: number, rows: number) => (0.86 + (0.26 * y) / Math.max(1, rows - 1)).toFixed(3);

const standStyle = (x: number, y: number, cell: number, z: number): CSSProperties => ({
  width: cell,
  height: cell,
  zIndex: z + y,
  transform: `translate(${x * cell}px, ${y * cell}px)`,
});

interface StandProps {
  x: number;
  y: number;
  yRows: number;
  cell: number;
  size: number;
  z?: number;
  lift?: number;
  air?: boolean;
  className?: string;
  faceClassName?: string;
  faceStyle?: CSSProperties;
  ground?: ReactNode;
  overlay?: ReactNode;
  children: ReactNode;
}

/** Объект, который стоит на клетке вертикально, а не лежит на ней плашмя. */
const Stand = ({
  x,
  y,
  yRows,
  cell,
  size,
  z = 10,
  lift = 0,
  air = false,
  className = '',
  faceClassName = '',
  faceStyle,
  ground,
  overlay,
  children,
}: StandProps) => (
  <div className={`stand ${className}`} style={standStyle(x, y, cell, z)}>
    <span className={`stand__shadow${air ? ' is-air' : ''}`} style={{ '--ds': depthScale(y, yRows) } as CSSProperties} />
    {ground}
    <span
      className="stand__card"
      style={
        {
          width: size,
          height: size,
          // Отрыв считается в пикселях экрана: в плоскости поля он сжался бы в cos(наклона) раз.
          '--lift': `${Math.round(lift / TILT_COS)}px`,
          '--ds': depthScale(y, yRows),
        } as CSSProperties
      }
    >
      <span className={`stand__face ${faceClassName}`} style={faceStyle}>
        {children}
      </span>
      {overlay}
    </span>
  </div>
);

interface StandUpProps {
  x: number;
  y: number;
  row: number;
  yRows: number;
  cell: number;
  size: number;
  z?: number;
  className?: string;
  children: ReactNode;
}

/** Тот же вертикальный объект, но внутри слоя эффектов: сам ищет свою клетку. */
const StandUp = ({ x, y, row, yRows, cell, size, z = 1, className = '', children }: StandUpProps) => (
  <span className="cell-anchor" style={{ left: x * cell, top: y * cell, width: cell, height: cell, zIndex: z }}>
    <span className={`stand__card ${className}`} style={{ width: size, height: size, '--ds': depthScale(row, yRows) } as CSSProperties}>
      <span className="stand__face">{children}</span>
    </span>
  </span>
);

interface MazeBoardProps {
  map: LevelMapData;
  robot: { x: number; y: number; direction: Direction } | null;
  enemies: EnemyFrame[];
  collectedCoins: Set<number>;
  collectedKeys: Set<string>;
  hasKey: boolean;
  keyPosition?: string | null;
  fakeKeys?: string[];
  bossAim?: string | null;
  bossMark?: string | null;
  bossFx?: BossFx | null;
  bossRaging?: boolean;
  hazards?: HazardFrame[];
  exit?: string;
  hideKeys?: boolean;
  keysRevealed?: boolean;
  doorSealed?: boolean;
  flash: 'hit' | 'attack' | null;
  epoch: number;
}

export const MazeBoard = ({
  map,
  robot,
  enemies,
  collectedCoins,
  collectedKeys,
  hasKey,
  keyPosition,
  fakeKeys,
  bossAim,
  bossMark,
  bossFx,
  bossRaging,
  hazards,
  exit,
  hideKeys = false,
  keysRevealed = true,
  doorSealed = false,
  flash,
  epoch,
}: MazeBoardProps) => {
  const width = map.width;
  const height = map.height;
  const cell = Math.max(26, Math.min(58, Math.floor(680 / Math.max(width, height))));
  const biome = map.biome ?? 'forest';
  const rocks = new Set(map.rocks ?? []);
  const terrain = map.terrain ?? {};
  const coins = map.coins ?? [];
  const isBossLevel = Boolean(map.boss);
  const keys = isBossLevel ? [] : (map.keys ?? []).filter((key) => !key.fake && key.position !== map.required_key_position);
  const fakeKeyPositions = isBossLevel
    ? (fakeKeys ?? [])
    : (map.keys ?? []).filter((key) => key.fake).map((key) => key.position);
  const exitPos = parsePos(exit ?? map.exit);

  const planeW = cell * width;
  const planeH = cell * height;
  const groundH = Math.round(planeH * TILT_COS);
  const headroom = Math.round(cell * 1.5);
  const stageH = groundH + SLAB_H + headroom;

  const bossAvatar = map.boss?.avatar ?? biome;
  const bossSize = Math.round(cell * 1.12);

  const tiles = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = posName({ x, y });
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
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ left: x * cell, top: y * cell, width: cell, height: cell }}
        />,
      );
    }
  }

  // Стена между соседними клетками: поперёк поля - видна её плоскость, вдоль поля - только ребро.
  const wallSegments = (map.walls ?? []).map((wall, index) => {
    const a = parsePos(wall.side1);
    const b = parsePos(wall.side2);
    if (a.x === b.x && Math.abs(a.y - b.y) === 1) {
      const hingeY = Math.max(a.y, b.y);
      const wallH = Math.round(cell * 0.78);
      return (
        <div
          key={`w-${index}`}
          className="wall-face"
          style={
            {
              left: a.x * cell,
              top: hingeY * cell - wallH,
              width: cell,
              height: wallH,
              zIndex: 5 + hingeY,
              '--ds': depthScale(hingeY, height),
            } as CSSProperties
          }
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
    <div className="board-frame" style={{ '--tilt': `${TILT_DEG}deg`, '--slab': `${SLAB_H}px`, '--headroom': `${headroom}px` } as CSSProperties}>
      <div className="board-cols" style={{ marginLeft: RULER_W + 4, width: planeW }}>
        {Array.from({ length: width }).map((_, x) => (
          <span key={x} style={{ width: cell }}>
            {String.fromCharCode(65 + x)}
          </span>
        ))}
      </div>
      <div className="board-body">
        <div className="board-rows" style={{ width: RULER_W, height: stageH }}>
          {Array.from({ length: height }).map((_, y) => (
            <span
              key={y}
              style={{
                top: headroom + y * cell * TILT_COS,
                height: cell * TILT_COS,
              }}
            >
              {y + 1}
            </span>
          ))}
        </div>
        <div
          className={[
            'board-stage',
            `biome-${biome}`,
            flash ? `is-${flash}` : '',
            bossFx?.kind === 'shot' || bossFx?.kind === 'touch' ? 'is-boss-shot' : '',
            bossFx?.kind === 'hit' ? 'is-boss-hit' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ width: planeW, height: stageH }}
        >
          <div
            className={['board', `biome-${biome}`].filter(Boolean).join(' ')}
            style={{ width: planeW, height: planeH }}
          >
            {tiles}

            {[...rocks].map((pos) => {
              const p = parsePos(pos);
              const treeSize = Math.round(cell * 1.15);
              return (
                <Stand
                  key={`rock-${pos}`}
                  className="board-rock"
                  faceClassName="is-sway"
                  faceStyle={{ animationDelay: `${-((p.x * 3 + p.y * 5) % 7) * 0.8}s` }}
                  x={p.x}
                  y={p.y}
                  yRows={height}
                  cell={cell}
                  size={treeSize}
                  z={7}
                >
                  <RockSprite biome={biome} size={treeSize} />
                </Stand>
              );
            })}

            {wallSegments}

            <Stand
              key={`door-${exit ?? map.exit}`}
              className={[
                'board-door',
                robot && robot.x === exitPos.x && robot.y === exitPos.y ? 'board-door--reached' : '',
                doorSealed ? 'board-door--sealed' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              x={exitPos.x}
              y={exitPos.y}
              yRows={height}
              cell={cell}
              size={Math.round(cell * 0.98)}
              z={5}
            >
              <DoorSprite size={Math.round(cell * 0.95)} />
              {doorSealed && <span className="board-door__seal" aria-hidden="true" />}
            </Stand>

            {coins.map((coin) => {
              if (collectedCoins.has(coin.id)) return null;
              const p = parsePos(coin.position);
              const size = Math.round(cell * 0.5);
              return (
                <Stand
                  key={`coin-${coin.id}`}
                  className="board-coin"
                  faceClassName="is-spin"
                  faceStyle={{ animationDelay: `${-coin.id * 0.35}s` }}
                  x={p.x}
                  y={p.y}
                  yRows={height}
                  cell={cell}
                  size={size}
                  lift={Math.round(cell * 0.1)}
                  z={8}
                >
                  <CoinSprite size={size} />
                </Stand>
              );
            })}

            {!hideKeys &&
              keys.map((key, index) => {
                if (collectedKeys.has(key.position)) return null;
                const p = parsePos(key.position);
                return (
                  <Stand
                    key={`key-${key.id}`}
                    className={`board-key board-key--slot-${index % 5}${keysRevealed ? ' is-revealed' : ''}`}
                    faceClassName="is-float"
                    x={p.x}
                    y={p.y}
                    yRows={height}
                    cell={cell}
                    size={Math.round(cell * 0.66)}
                    lift={Math.round(cell * 0.18)}
                    z={9}
                  >
                    <KeySprite size={Math.round(cell * 0.66)} />
                  </Stand>
                );
              })}

            {!hideKeys &&
              fakeKeyPositions.map((position, index) => {
                if (collectedKeys.has(position)) return null;
                const p = parsePos(position);
                return (
                  <Stand
                    key={`fake-${position}`}
                    className={`board-key board-key--slot-${(index + 2) % 5}${keysRevealed ? ' is-revealed' : ''}`}
                    faceClassName="is-float"
                    x={p.x}
                    y={p.y}
                    yRows={height}
                    cell={cell}
                    size={Math.round(cell * 0.66)}
                    lift={Math.round(cell * 0.18)}
                    z={9}
                  >
                    <KeySprite size={Math.round(cell * 0.66)} />
                  </Stand>
                );
              })}

            {!hideKeys &&
              keyPosition &&
              !collectedKeys.has(keyPosition) &&
              (() => {
                const p = parsePos(keyPosition);
                return (
                  <Stand
                    key={`required-key-${keyPosition}`}
                    className={`board-key board-key--slot-0${keysRevealed ? ' is-revealed' : ''}`}
                    faceClassName="is-float"
                    x={p.x}
                    y={p.y}
                    yRows={height}
                    cell={cell}
                    size={Math.round(cell * 0.66)}
                    lift={Math.round(cell * 0.18)}
                    z={9}
                  >
                    <KeySprite size={Math.round(cell * 0.66)} />
                  </Stand>
                );
              })()}

            {bossAim &&
              (() => {
                const p = parsePos(bossAim);
                return (
                  <div
                    className="board-boss-aim"
                    style={{ left: p.x * cell, top: p.y * cell, width: cell, height: cell }}
                    aria-hidden="true"
                  >
                    <span className="board-boss-aim__ring" />
                    <span className="board-boss-aim__cross" />
                  </div>
                );
              })()}

            {bossMark &&
              (() => {
                const p = parsePos(bossMark);
                return (
                  <div
                    key={`mark-${bossMark}`}
                    className="board-boss-mark"
                    style={{ left: p.x * cell, top: p.y * cell, width: cell, height: cell }}
                    aria-hidden="true"
                  >
                    <span className="board-boss-mark__ring" />
                    <span
                      className="stand__card board-boss-mark__label-stand"
                      style={{ width: cell, height: cell, '--ds': depthScale(p.y, height) } as CSSProperties}
                    >
                      <span className="stand__face">
                        <span className="board-boss-mark__label">метка</span>
                      </span>
                    </span>
                  </div>
                );
              })()}

            {(hazards ?? []).map((hazard) => (
              <div
                key={`hazard-${hazard.id}-${hazard.state}`}
                className={[
                  'board-hazard',
                  `board-hazard--${hazard.kind}`,
                  `is-${hazard.state}`,
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-hidden="true"
              >
                {hazard.cells.map((cellName) => {
                  const p = parsePos(cellName);
                  return (
                    <div
                      key={`hazard-${hazard.id}-${cellName}`}
                      className="board-hazard__cell"
                      style={{ left: p.x * cell, top: p.y * cell, width: cell, height: cell }}
                    >
                      <span className="board-hazard__zone" />
                      <StandUp
                        className={`board-hazard__art board-hazard__art--${hazard.kind}`}
                        x={0}
                        y={0}
                        row={p.y}
                        yRows={height}
                        cell={cell}
                        size={Math.round(cell * 1.5)}
                        z={2}
                      >
                        <HazardSprite kind={hazard.kind} size={Math.round(cell * 1.5)} />
                      </StandUp>
                      {hazard.state === 'warn' && (
                        <StandUp
                          className="board-hazard__count-stand"
                          x={0}
                          y={0}
                          row={p.y}
                          yRows={height}
                          cell={cell}
                          size={Math.round(cell * 0.44)}
                          z={3}
                        >
                          <span className="board-hazard__count">{hazard.fuse}</span>
                        </StandUp>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {aliveEnemies.map((enemy) => {
              const hover = enemy.type === 'bat' || enemy.type === 'vulture';
              const size = enemy.boss ? bossSize : Math.round(cell * 0.92);
              return (
                <Stand
                  key={`enemy-${enemy.id}-${epoch}`}
                  className={[
                    'board-enemy',
                    `board-enemy--${enemy.type}`,
                    enemy.boss ? 'board-enemy--boss' : '',
                    enemy.boss && enemy.shielded ? 'is-shielded' : '',
                    enemy.boss && bossRaging ? 'is-raging' : '',
                    enemy.boss && bossFx?.kind === 'charge' ? 'is-charging' : '',
                    enemy.boss && bossFx?.kind === 'shot' ? 'is-firing' : '',
                    enemy.boss && bossFx?.kind === 'hit' ? 'is-recoil' : '',
                    enemy.boss && bossFx?.kind === 'step' ? 'is-stepping' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  air={hover}
                  lift={hover ? Math.round(cell * 0.42) : 0}
                  x={enemy.x}
                  y={enemy.y}
                  yRows={height}
                  cell={cell}
                  size={size}
                  z={enemy.boss ? 11 : 10}
                  overlay={
                    <>
                      {enemy.hasKey && (
                        <span className="board-enemy__key" title="У врага ключ">
                          <KeySprite size={Math.round(cell * 0.32)} />
                        </span>
                      )}
                      {enemy.boss && (
                        <span className="board-boss-hud">
                          <span className="board-boss-hud__label">{enemy.shielded ? 'щит' : 'босс'}</span>
                          <span className="board-boss-hud__bar">
                            <i
                              style={{
                                width: `${(Math.max(0, enemy.hp) / Math.max(1, enemy.maxHp)) * 100}%`,
                              }}
                            />
                          </span>
                        </span>
                      )}
                    </>
                  }
                >
                  {enemy.boss ? <BossSprite avatar={bossAvatar} size={size} /> : <EnemySprite type={enemy.type} size={size} />}
                </Stand>
              );
            })}

            {robot && (
              <Stand
                key={`robot-${epoch}`}
                className="board-robot"
                x={robot.x}
                y={robot.y}
                yRows={height}
                cell={cell}
                size={Math.round(cell * 0.98)}
                z={12}
                ground={
                  <span
                    className="board-robot__dir"
                    style={{ width: cell, height: cell, transform: `rotate(${ROTATION[robot.direction]}deg)` }}
                    aria-hidden="true"
                  />
                }
              >
                <RobotSprite size={Math.round(cell * 0.98)} direction={robot.direction} />
              </Stand>
            )}

            {flash === 'attack' && robot && (
              <div
                className="fx-attack"
                style={{ left: robot.x * cell + cell / 2, top: robot.y * cell + cell / 2, width: cell, height: cell }}
              />
            )}

            {bossFx &&
              (() => {
                const from = bossFx.from ? parsePos(bossFx.from) : null;
                const to = bossFx.to ? parsePos(bossFx.to) : null;
                const fromX = from ? from.x * cell + cell / 2 : 0;
                const fromY = from ? from.y * cell + cell / 2 : 0;
                const toX = to ? to.x * cell + cell / 2 : 0;
                const toY = to ? to.y * cell + cell / 2 : 0;

                return (
                  <div key={`boss-fx-${bossFx.id}`} className="board-fx-layer" aria-hidden="true">
                    {bossFx.kind === 'charge' && from && to && (
                      <svg
                        className="board-fx-svg"
                        width={planeW}
                        height={planeH}
                        viewBox={`0 0 ${planeW} ${planeH}`}
                      >
                        <line x1={fromX} y1={fromY} x2={toX} y2={toY} className="board-boss-beam" />
                      </svg>
                    )}

                    {bossFx.kind === 'step' && from && to && (
                      <>
                        <svg
                          className="board-fx-svg"
                          width={planeW}
                          height={planeH}
                          viewBox={`0 0 ${planeW} ${planeH}`}
                        >
                          <line x1={fromX} y1={fromY} x2={toX} y2={toY} className="board-boss-trail" />
                        </svg>
                        <StandUp
                          className="board-boss-trail-ghost"
                          x={from.x}
                          y={from.y}
                          row={from.y}
                          yRows={height}
                          cell={cell}
                          size={bossSize}
                          z={1}
                        >
                          <BossSprite avatar={bossAvatar} size={bossSize} />
                        </StandUp>
                      </>
                    )}

                    {(bossFx.kind === 'shot' || bossFx.kind === 'miss') && from && to && (
                      <>
                        <span className="board-boss-muzzle" style={{ left: fromX, top: fromY }} />
                        <span
                          className={`board-boss-projectile${bossFx.kind === 'miss' ? ' is-miss' : ''}`}
                          style={
                            {
                              left: fromX,
                              top: fromY,
                              '--dx': `${toX - fromX}px`,
                              '--dy': `${toY - fromY}px`,
                            } as CSSProperties
                          }
                        />
                        <span
                          className={`board-boss-impact${bossFx.kind === 'miss' ? ' is-miss' : ''}`}
                          style={{ left: to.x * cell, top: to.y * cell, width: cell, height: cell }}
                        />
                      </>
                    )}

                    {bossFx.kind === 'touch' && to && (
                      <span
                        className="board-boss-impact"
                        style={{ left: to.x * cell, top: to.y * cell, width: cell, height: cell }}
                      />
                    )}

                    {bossFx.kind === 'hit' && from && (
                      <StandUp
                        className="board-float-damage-stand"
                        x={from.x}
                        y={from.y}
                        row={from.y}
                        yRows={height}
                        cell={cell}
                        size={cell}
                        z={4}
                      >
                        <span className="board-float-damage">-{bossFx.damage ?? 1}</span>
                      </StandUp>
                    )}

                    {bossFx.kind === 'defeat' && from && (
                      <StandUp
                        className="board-boss-ghost"
                        x={from.x}
                        y={from.y}
                        row={from.y}
                        yRows={height}
                        cell={cell}
                        size={bossSize}
                        z={2}
                      >
                        <BossSprite avatar={bossAvatar} size={bossSize} />
                      </StandUp>
                    )}

                    {(bossFx.kind === 'shot' || bossFx.kind === 'touch' || bossFx.kind === 'hit') && (
                      <span className="board-damage-vignette" />
                    )}
                  </div>
                );
              })()}

          </div>

          <div className="board-slab" style={{ width: planeW }} aria-hidden="true" />
          <div className="board-vignette" aria-hidden="true" />

          {/* Погоде нужен объём: на коридорах в одну клетку слой выглядел бы замершим. */}
          {!isBossLevel && width >= 5 && height >= 5 && (
            <AmbientLayer biome={biome} width={planeW} height={stageH} />
          )}
        </div>
      </div>
      <div className="board-legend" style={{ marginLeft: RULER_W + 4 }}>
        <span>
          <i className="legend-dot legend-dot--coin" />
          монета
        </span>
        <span>
          <i className="legend-dot legend-dot--key" />
          ключ
        </span>
        <span>
          <i className="legend-dot legend-dot--exit" />
          выход
        </span>
        {Object.keys(terrain).length > 0 && (
          <span>
            <i className="legend-dot legend-dot--ice" />
            лёд / грязь
          </span>
        )}
        {hasKey && <span className="legend-key">ключ собран</span>}
      </div>
    </div>
  );
};
