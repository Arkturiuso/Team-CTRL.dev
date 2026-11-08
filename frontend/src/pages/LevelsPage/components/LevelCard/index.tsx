import { useNavigate } from 'react-router-dom';
import type { Level, LevelMapData } from '../../types';
import {
  levelDifficultyOf,
  levelHeightOf,
  levelIdOf,
  levelKeysOf,
  levelNameOf,
  levelStatusOf,
  levelStatusLabel,
  levelWidthOf,
} from '../../types';
import './LevelCard.less';

const posName = (x: number, y: number) => `${String.fromCharCode(65 + x)}${y + 1}`;

// Мини-карта: те же сущности, что на большом поле, только мельче.
const MiniMap = ({ map }: { map?: LevelMapData | null }) => {
  const width = map?.width ?? 6;
  const height = map?.height ?? 6;
  const cell = Math.max(4, Math.min(9, Math.floor(92 / Math.max(width, height))));
  const rocks = new Set(map?.rocks ?? []);
  const keys = new Set((map?.keys ?? []).map((key) => key.position));

  // Стены-рёбра: для каждой клетки собираем стороны, где стоит стена.
  const wallSides = new Map<string, Set<string>>();
  const addWallSide = (name: string, side: string) => {
    if (!wallSides.has(name)) wallSides.set(name, new Set());
    wallSides.get(name)!.add(side);
  };
  for (const wall of map?.walls ?? []) {
    const parse = (value: string) => ({ x: value.charCodeAt(0) - 65, y: parseInt(value.slice(1), 10) - 1 });
    const a = parse(wall.side1);
    const b = parse(wall.side2);
    if (a.y === b.y) {
      const left = a.x < b.x ? a : b;
      addWallSide(posName(left.x, left.y), 'right');
      addWallSide(posName(left.x + 1, left.y), 'left');
    } else {
      const top = a.y < b.y ? a : b;
      addWallSide(posName(top.x, top.y), 'bottom');
      addWallSide(posName(top.x, top.y + 1), 'top');
    }
  }

  const cells = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const name = posName(x, y);
      const isRock = rocks.has(name);
      const isExit = name === map?.exit;
      const isEntrance = name === map?.entrance;
      const isKey = keys.has(name);
      const sides = wallSides.get(name);
      const wallStyle: React.CSSProperties = {
        borderTop: sides?.has('top') ? '2px solid #8a94a6' : undefined,
        borderBottom: sides?.has('bottom') ? '2px solid #8a94a6' : undefined,
        borderLeft: sides?.has('left') ? '2px solid #8a94a6' : undefined,
        borderRight: sides?.has('right') ? '2px solid #8a94a6' : undefined,
      };
      const background = isRock
        ? '#556270'
        : isExit
          ? '#2f9b86'
          : isKey
            ? '#f0b429'
            : isEntrance
              ? '#5b8cff'
              : (x + y) % 2 === 0
                ? '#dce6f2'
                : '#cbd8e8';
      cells.push(
        <span
          key={name}
          className="level-minimap__cell"
          style={{ width: cell, height: cell, background, borderRadius: isKey ? '50%' : 1, ...wallStyle }}
        />,
      );
    }
  }

  return (
    <div
      className="level-minimap"
      style={{ gridTemplateColumns: `repeat(${width}, ${cell}px)`, gridTemplateRows: `repeat(${height}, ${cell}px)` }}
    >
      {cells}
    </div>
  );
};

export const LevelCard = ({ level }: { level: Level }) => {
  const navigate = useNavigate();
  const status = levelStatusOf(level);
  const isBlocked = status === 'blocked';

  const open = () => {
    if (!isBlocked) navigate(`/user/levels/${levelIdOf(level)}`);
  };

  return (
    <article
      className={`level-card${isBlocked ? ' level-card--locked' : ''}`}
      onClick={isBlocked ? undefined : open}
      onKeyDown={(event) => {
        if (isBlocked) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      }}
      role="button"
      tabIndex={isBlocked ? -1 : 0}
      aria-disabled={isBlocked || undefined}
    >
      <div className="level-card__banner">
        <span className="level-card__index">{String(levelIdOf(level)).padStart(2, '0')}</span>
        <span className="level-card__difficulty">{levelDifficultyOf(level)}</span>
      </div>

      <div className="level-card__body">
        <div className="level-card__info">
          <h3>{levelNameOf(level)}</h3>
          <p>{level.description || 'Описание пока не добавлено.'}</p>
        </div>
        <div className="level-card__preview" aria-hidden="true">
          <MiniMap map={level.mapData} />
        </div>
      </div>

      <footer className="level-card__footer">
        <div className="level-card__tags">
          <span className="level-card__ticks">{levelWidthOf(level)}×{levelHeightOf(level)}</span>
          <span className="level-card__ticks">ключей {levelKeysOf(level)}</span>
          <span className={`level-card__status level-card__status--${status}`}>{levelStatusLabel(level)}</span>
        </div>
      </footer>

      {isBlocked && (
        <div className="level-card__locked-overlay">
          <span className="level-card__locked-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="10" width="14" height="11" rx="3" fill="#8fa3bf" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#8fa3bf" strokeWidth="2" />
              <circle cx="12" cy="15.5" r="1.6" fill="#0b1220" />
            </svg>
            Заблокировано
          </span>
          <span className="level-card__locked-hint">Уровень закрыт администратором</span>
        </div>
      )}
    </article>
  );
};
