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
            // Дверь: рама, полотно и ручка. Заперта - тёмная со скважиной,
            // открыта - светлая с подсветкой (is-open ставится только по hasKey).
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
                <rect className="door__frame" x="2.6" y="2.4" width="18.8" height="27.2" rx="3.2" />
                <rect className="door__leaf" x="5.6" y="5.4" width="12.8" height="21.2" rx="1.6" />
                <circle className="door__handle" cx="15.4" cy="17" r="1.9" />
                {!hasKey && (
                  <g className="door__keyhole">
                    <circle cx="10.4" cy="12.8" r="1.5" />
                    <path d="M10.4 14.2 L9.7 18.2 L11.1 18.2 Z" />
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
                {/* Робот вид сверху: корпус, тёмная фронтальная панель с глазами
                    и нос-указатель. Нарисован «вправо», направление задаёт поворот .robot-arrow. */}
                <svg viewBox="0 0 24 24" role="img" aria-label="Робот">
                  <title>Робот</title>
                  <path className="robot-svg__nose" d="M17.8 12 L23.2 8.3 L23.2 15.7 Z" />
                  <rect className="robot-svg__body" x="3.4" y="3.4" width="15.4" height="17.2" rx="5.2" />
                  <rect className="robot-svg__visor" x="14.6" y="6.2" width="3.6" height="11.6" rx="1.7" />
                  <circle className="robot-svg__eye" cx="16.4" cy="9.4" r="1.6" />
                  <circle className="robot-svg__eye" cx="16.4" cy="14.6" r="1.6" />
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
