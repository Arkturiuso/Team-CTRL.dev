import type { Direction, LevelMapData } from './types';
import './Board2D.less';

// Помощники для координат: клетки именуются как "B3" (буква - x, цифра - y).
export const parsePos = (value: string) => ({
  x: value.charCodeAt(0) - 65,
  y: parseInt(value.slice(1), 10) - 1,
});

export const cellName = (x: number, y: number) => `${String.fromCharCode(65 + x)}${y + 1}`;

// Монеты приходят в двух форматах: "B3" или { position: "B3" }.
// Приводим всё к "B3" и отбрасываем пустые/битые значения.
export const coinCells = (map: LevelMapData): string[] => {
  const result: string[] = [];
  for (const coin of map.coins ?? []) {
    const raw = typeof coin === 'string' ? coin : coin?.position;
    const value = (raw ?? '').trim().toUpperCase();
    if (/^[A-Z]\d+$/.test(value) && !result.includes(value)) result.push(value);
  }
  return result;
};

type Side = 'top' | 'right' | 'bottom' | 'left';

const SIDE_DELTA: Record<Side, { dx: number; dy: number }> = {
  top: { dx: 0, dy: -1 },
  bottom: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

// Иконка робота нарисована «носом» вправо, остальные направления доворачиваем.
const ARROW_ROTATION: Record<Direction, number> = { right: 0, down: 90, left: 180, up: 270 };

interface Board2DProps {
  map: LevelMapData;
  robot: { cell: string; direction: Direction } | null;
  hasKey: boolean;
  trail: string[];
  keysRemaining: string[];
  // Клетки с ещё не собранными монетами ("B3").
  coins: string[];
  crashed: boolean;
}

// Стены из mapData идут рёбрами между клетками - собираем множество рёбер и по нему
// решаем, с какой стороны клетки рисовать стену.
const buildWallSet = (walls: LevelMapData['walls']): Set<string> => {
  const set = new Set<string>();
  for (const wall of walls ?? []) {
    if (wall?.side1 && wall?.side2) set.add([wall.side1, wall.side2].sort().join('|'));
  }
  return set;
};

const hasWallBetween = (wallSet: Set<string>, a: { x: number; y: number }, side: Side) => {
  const delta = SIDE_DELTA[side];
  const nx = a.x + delta.dx;
  const ny = a.y + delta.dy;
  if (nx < 0 || ny < 0) return false;
  return wallSet.has([cellName(a.x, a.y), cellName(nx, ny)].sort().join('|'));
};

// Дверь ставим на краю клетки выхода со стороны подхода:
// либо откуда робот пришёл в трейле, либо в первую свободную соседнюю клетку.
const pickDoorSide = (
  exit: { x: number; y: number },
  map: LevelMapData,
  trail: string[],
  wallSet: Set<string>,
): Side => {
  const rocks = new Set(map.rocks ?? []);
  const previous = trail.length > 1 ? parsePos(trail[trail.length - 2]) : null;
  if (previous) {
    for (const side of Object.keys(SIDE_DELTA) as Side[]) {
      const delta = SIDE_DELTA[side];
      if (previous.x === exit.x + delta.dx && previous.y === exit.y + delta.dy) return side;
    }
  }
  const sides = Object.keys(SIDE_DELTA) as Side[];
  const open = sides.find((side) => {
    const delta = SIDE_DELTA[side];
    const nx = exit.x + delta.dx;
    const ny = exit.y + delta.dy;
    if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) return false;
    return !rocks.has(cellName(nx, ny)) && !hasWallBetween(wallSet, exit, side);
  });
  return open ?? 'left';
};

export const Board2D = ({ map, robot, hasKey, trail, keysRemaining, coins, crashed }: Board2DProps) => {
  const wallSet = buildWallSet(map.walls);
  const rocks = new Set(map.rocks ?? []);
  const trailSet = new Set(trail);
  const robotCell = robot?.cell ?? map.entrance;
  const exit = parsePos(map.exit);
  const doorSide = pickDoorSide(exit, map, trail, wallSet);

  const cells = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const name = cellName(x, y);
      const isRock = rocks.has(name);
      const isExit = name === map.exit;
      const isRobot = name === robotCell;
      const inTrail = trailSet.has(name) && !isRobot && !isRock;
      const hasKeyHere = keysRemaining.includes(name);
      // Монету не рисуем под роботом и на камне: она либо уже собрана, либо клетка непроходима.
      const hasCoinHere = coins.includes(name) && !isRobot && !isRock;
      const classNames = ['board2d-cell', `floor-${(x + y) % 2}`];
      // Клетка выхода с роботом: плитка робота уступает место двери, поэтому
      // получает модификатор со стороной двери (сдвиг - в противоположную сторону).
      const robotTileClassNames = ['robot-tile'];
      if (isRobot && isExit) robotTileClassNames.push(`robot-tile--door-${doorSide}`);
      if (isRock) classNames.push('is-rock');
      if (inTrail) classNames.push('is-trail');
      if (isRobot) classNames.push('is-robot');
      if (isRobot && crashed) classNames.push('is-crashed');
      if (hasKeyHere) classNames.push('has-key');
      if (hasCoinHere) classNames.push('has-coin');

      // Ребро рисуем один раз: горизонталь - верхней стороной нижней клетки,
      // вертикаль - левой стороной правой клетки.
      const wallSides = (['top', 'left'] as Side[]).filter((side) => hasWallBetween(wallSet, { x, y }, side));

      cells.push(
        <div key={name} className={classNames.join(' ')} title={name}>
          {wallSides.map((side) => (
            <i key={side} className={`wall wall--${side}`} />
          ))}
          {isRock && (
            // Камень: валун с тремя тонами граней - силуэт читается и на клетке ~20 px.
            <svg className="rock-item" viewBox="0 0 24 24" role="img" aria-label="Камень">
              <title>Камень</title>
              <path
                className="rock-item__body"
                d="M3.6 19.6 L3 12 L6.6 5.4 L13 3.2 L18.9 6.1 L21 12.7 L20.1 19.6 Z"
              />
              <path className="rock-item__top" d="M7.2 5.9 L12.6 4 L12.1 10.2 L8 11.9 Z" />
              <path className="rock-item__shade" d="M12.4 11 L20.2 12.9 L19.4 19 L11.6 19 Z" />
            </svg>
          )}
          {inTrail && <i className="trail-dot" />}
          {hasCoinHere && <i className="coin-item" role="img" aria-label="Монета" title="Монета" />}
          {hasKeyHere && (
            // Ключ - стальной силуэт (кольцо, стержень, зубцы), не пересекается с монетой
            // и роботом: узнаётся и на мелкой клетке.
            <svg className="key-item" viewBox="0 0 24 24" role="img" aria-label="Ключ">
              <title>Ключ</title>
              <g className="key-item__outline" fill="none" strokeLinecap="round">
                <circle cx="7.6" cy="7.6" r="3.6" strokeWidth="5" />
                <path d="M10.6 10.6 L20.1 20.1" strokeWidth="5.2" />
                <path d="M16.2 16.2 L13.2 19.2" strokeWidth="4.6" />
                <path d="M19.3 19.3 L16.3 22.3" strokeWidth="4.6" />
              </g>
              <g className="key-item__body" fill="none" strokeLinecap="round">
                <circle cx="7.6" cy="7.6" r="3.6" strokeWidth="2.9" />
                <path d="M10.6 10.6 L20.1 20.1" strokeWidth="3.1" />
                <path d="M16.2 16.2 L13.2 19.2" strokeWidth="2.5" />
                <path d="M19.3 19.3 L16.3 22.3" strokeWidth="2.5" />
              </g>
              <path className="key-item__shine" d="M10.4 10.4 L18.6 18.6" strokeWidth="1.1" strokeLinecap="round" fill="none" />
            </svg>
          )}
          {isExit && (
            // Дверь: каменная рама с объёмными гранями и тёмное полотно.
            // Заперта - 3 металлические полосы, скважина и ручка;
            // открыта - полос нет, полотно светится (is-open ставится только по hasKey).
            // Классы .door / .door--side / .is-open и title сохранены для проверок реплея.
            <i
              className={`door door--${doorSide}${hasKey ? ' is-open' : ''}`}
              title={hasKey ? 'Дверь открыта' : 'Заперто - нужен ключ'}
            >
              <svg
                viewBox="0 0 24 32"
                role="img"
                aria-label={hasKey ? 'Дверь открыта' : 'Заперто - нужен ключ'}
              >
                <defs>
                  {/* Свечение открытого проёма: свет падает сверху, низ полотна темнее. */}
                  <linearGradient id="door-portal-glow" x1="0.15" y1="0" x2="0.6" y2="1">
                    <stop offset="0" stopColor="#d9fff2" />
                    <stop offset="0.45" stopColor="#8bf3d2" />
                    <stop offset="1" stopColor="#3fbfa0" />
                  </linearGradient>
                </defs>
                {/* Каменная рама: ступенчатые навершия, перекладина, две стойки.
                    Верхние и левые грани светлее, нижние и правые - в тени. */}
                <g className="door__stone">
                  <rect className="door__frame" x="1.2" y="1.5" width="4.8" height="1.6" />
                  <rect className="door__frame-light" x="1.2" y="1.5" width="4.8" height="0.55" />
                  <rect className="door__frame" x="1.9" y="0.2" width="3.4" height="1.3" />
                  <rect className="door__frame-light" x="1.9" y="0.2" width="3.4" height="0.5" />

                  <rect className="door__frame" x="18" y="1.5" width="4.8" height="1.6" />
                  <rect className="door__frame-light" x="18" y="1.5" width="4.8" height="0.55" />
                  <rect className="door__frame" x="18.7" y="0.2" width="3.4" height="1.3" />
                  <rect className="door__frame-light" x="18.7" y="0.2" width="3.4" height="0.5" />

                  <rect className="door__frame" x="1.2" y="3.1" width="21.6" height="3.2" />
                  <rect className="door__frame-light" x="1.2" y="3.1" width="21.6" height="1.05" />
                  <rect className="door__frame-shade" x="1.2" y="5.4" width="21.6" height="0.9" />

                  <rect className="door__frame" x="1.2" y="6.3" width="4.7" height="24.3" />
                  <rect className="door__frame-light" x="1.2" y="6.3" width="1.5" height="24.3" />
                  <rect className="door__frame-shade" x="4.4" y="6.3" width="1.5" height="24.3" />

                  <rect className="door__frame" x="18.1" y="6.3" width="4.7" height="24.3" />
                  <rect className="door__frame-light" x="18.1" y="6.3" width="1.5" height="24.3" />
                  <rect className="door__frame-shade" x="21.3" y="6.3" width="1.5" height="24.3" />

                  <rect className="door__frame-shade" x="1.2" y="30.6" width="21.6" height="1.1" />
                </g>

                {/* Проём: тёмная ниша, в ней полотно. Открытая дверь светится. */}
                <rect className="door__opening" x="5.9" y="6.3" width="12.2" height="24.3" />
                <g className="door__portal">
                  <rect className="door__leaf" x="6.2" y="6.6" width="11.6" height="23.7" rx="0.6" />
                  <rect className="door__leaf-inner" x="7" y="7.6" width="10" height="21.7" rx="0.5" />
                  <rect className="door__leaf-sheen" x="7" y="7.6" width="10" height="1.4" rx="0.5" />
                </g>

                {!hasKey && (
                  <g className="door__bars">
                    {[7.6, 11.4, 15.2].map((cx) => (
                      <g key={`bar-${cx}`}>
                        <rect className="door__bar" x={cx - 0.8} y="6.9" width="1.6" height="23.2" rx="0.5" />
                        <rect className="door__bar-light" x={cx - 0.8} y="6.9" width="0.5" height="23.2" rx="0.25" />
                      </g>
                    ))}
                  </g>
                )}

                <circle className="door__handle-plate" cx="16.8" cy="20.3" r="2.1" />
                <circle className="door__handle" cx="16.8" cy="20.3" r="1.2" />
                <circle className="door__handle-shine" cx="16.45" cy="19.95" r="0.4" />

                {!hasKey && (
                  <g className="door__keyhole">
                    <circle cx="9.5" cy="14" r="0.8" />
                    <path d="M9.5 14.5 L9.05 16.8 L9.95 16.8 Z" />
                  </g>
                )}
              </svg>
            </i>
          )}
          {isRobot && robot && (
            <span className={robotTileClassNames.join(' ')}>
              <span
                className="robot-arrow"
                style={{ transform: `rotate(${ARROW_ROTATION[robot.direction] ?? 0}deg)` }}
              >
                {/* Робот вид сверху по старой 3D-модели: две гусеницы с 3 катками,
                    тёмная рама, металлический корпус с рёбрами решётки, впереди
                    гранёная голова с тёмным визором и оранжевой подсветкой, антенна.
                    Нарисован «вправо», направление задаёт поворот .robot-arrow. */}
                <svg viewBox="0 0 24 24" role="img" aria-label="Робот">
                  <title>Робот</title>
                  {/* Гусеницы: тёмный рельс, светлая полоса верхней ветви, 3 катка. */}
                  <rect className="robot-svg__track" x="3" y="1.4" width="17.4" height="5" rx="2.5" />
                  <rect className="robot-svg__track" x="3" y="17.6" width="17.4" height="5" rx="2.5" />
                  <rect className="robot-svg__tread" x="4.6" y="3.1" width="14.2" height="1.5" rx="0.75" />
                  <rect className="robot-svg__tread" x="4.6" y="19.4" width="14.2" height="1.5" rx="0.75" />
                  {[7.2, 11.8, 16.4].map((cx) => (
                    <g key={`roller-${cx}`}>
                      <circle className="robot-svg__roller" cx={cx} cy="3.85" r="1.15" />
                      <circle className="robot-svg__roller-hub" cx={cx} cy="3.85" r="0.4" />
                      <circle className="robot-svg__roller" cx={cx} cy="20.15" r="1.15" />
                      <circle className="robot-svg__roller-hub" cx={cx} cy="20.15" r="0.4" />
                    </g>
                  ))}
                  <rect className="robot-svg__chassis" x="3.4" y="5.4" width="16.6" height="13.2" rx="1.6" />
                  <rect className="robot-svg__body" x="4.6" y="7" width="13" height="10.2" rx="1.8" />
                  <path className="robot-svg__bevel" d="M5.8 7.6 H16.2" />
                  <path className="robot-svg__shade" d="M5.8 16.6 H15" />
                  {/* Решётка воздухозабора: тёмные рёбра по металлу в задней части корпуса. */}
                  <rect className="robot-svg__grille-plate" x="5" y="7.6" width="0.9" height="9" />
                  {[6.6, 7.7, 8.8, 9.9].map((x) => (
                    <path key={`rib-${x}`} className="robot-svg__grille-rib" d={`M${x} 8 V16.2`} />
                  ))}
                  <path className="robot-svg__seam" d="M11.8 7.4 V16.8" />
                  <circle className="robot-svg__rivet" cx="12.9" cy="9" r="0.5" />
                  <circle className="robot-svg__rivet" cx="12.9" cy="15.2" r="0.5" />
                  {/* Антенна на заднем срезе рамы. */}
                  <g className="robot-svg__antenna">
                    <path className="robot-svg__antenna-rod" d="M6 12 H3.2" />
                    <circle className="robot-svg__antenna-tip" cx="2.3" cy="12" r="1" />
                  </g>
                  {/* Руки-плечи по бокам корпуса и сенсорные «уши». */}
                  <rect className="robot-svg__arm" x="12.8" y="4.9" width="4.2" height="2.3" rx="1.1" />
                  <rect className="robot-svg__arm" x="12.8" y="16.8" width="4.2" height="2.3" rx="1.1" />
                  <rect className="robot-svg__ear" x="16.6" y="6.4" width="2.5" height="1.5" rx="0.6" />
                  <rect className="robot-svg__ear" x="16.6" y="16.1" width="2.5" height="1.5" rx="0.6" />
                  {/* Голова: гранёный блок, светлый верх, тёмная лицевая пластина с визором. */}
                  <path className="robot-svg__head" d="M16.9 8.2 H19.5 L21.3 10 V14 L19.5 15.8 H16.9 Z" />
                  <path className="robot-svg__head-top" d="M17.3 8.7 H19.2 L19.9 9.6 H17.3 Z" />
                  <rect className="robot-svg__brow" x="17" y="8.1" width="2.6" height="0.8" rx="0.4" />
                  <path className="robot-svg__visor" d="M19.4 8.6 L21.1 10.2 V13.8 L19.4 15.4 Z" />
                  <rect className="robot-svg__visor-halo" x="19.85" y="10.1" width="0.8" height="3.8" rx="0.4" />
                  <rect className="robot-svg__visor-glow" x="20.05" y="10.4" width="0.5" height="3.2" rx="0.25" />
                  <path className="robot-svg__nose" d="M21.2 10.9 L22.7 12 L21.2 13.1 Z" />
                  {hasKey && (
                    // Правая рука держит ключ: маленькая латунная связка у гусеницы.
                    <g className="robot-svg__key">
                      <circle cx="19.9" cy="19.9" r="1.4" />
                      <path d="M21.2 19.9 H23.3" />
                      <path d="M22.2 19.9 v1.5" />
                      <path d="M23.1 19.9 v1.1" />
                    </g>
                  )}
                </svg>
              </span>
            </span>
          )}
        </div>,
      );
    }
  }

  return (
    <div className="board2d" aria-label="Карта уровня">
      <div
        className="board2d-grid"
        style={{ gridTemplateColumns: `repeat(${map.width}, minmax(0, 1fr))` }}
      >
        {cells}
      </div>
    </div>
  );
};
