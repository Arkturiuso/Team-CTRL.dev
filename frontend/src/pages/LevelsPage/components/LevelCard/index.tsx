import { useNavigate } from 'react-router-dom';
import { LockIcon, StarIcon } from '../../../LevelPage/sprites';
import { biomeMeta } from '../../biomeMeta';
import { runsWord } from '../../../../utils/plural';
import type { Level, LevelMapData } from '../../types';
import './LevelCard.less';

interface LevelCardProps {
  level: Level;
  allLevels: Level[];
}

const MiniMap = ({ map }: { map?: LevelMapData | null }) => {
  const width = map?.width ?? 6;
  const height = map?.height ?? 6;
  const cell = Math.max(3, Math.min(8, Math.floor(92 / Math.max(width, height))));
  const meta = biomeMeta(map?.biome);
  const rocks = new Set(map?.rocks ?? []);
  const coins = new Set((map?.coins ?? []).map((coin) => coin.position));
  const keys = new Set((map?.keys ?? []).map((key) => key.position));
  const exit = map?.exit;

  const cells = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = `${String.fromCharCode(65 + x)}${y + 1}`;
      const isRock = rocks.has(pos);
      const isExit = pos === exit;
      const isCoin = coins.has(pos);
      const isKey = keys.has(pos);
      const background = isRock
        ? '#556270'
        : isExit
          ? '#2f9b86'
          : isKey
            ? '#f0b429'
            : isCoin
              ? '#ffd166'
              : (x + y) % 2 === 0
                ? meta.floor
                : meta.floorAlt;
      cells.push(
        <span
          key={pos}
          className="level-minimap__cell"
          style={{
            width: cell,
            height: cell,
            background,
            borderRadius: isCoin || isKey ? '50%' : 1,
          }}
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

export const LevelCard = ({ level, allLevels }: LevelCardProps) => {
  const navigate = useNavigate();
  const meta = biomeMeta(level.mapData?.biome);

  const previousLevels = allLevels.filter((item) => item.levelId < level.levelId);
  const previous = previousLevels.sort((a, b) => b.levelId - a.levelId)[0];
  const isLocked = Boolean(previous && previous.userStars === 0);
  const stars = Math.max(0, Math.min(3, Number(level.userStars) || 0));

  const open = () => {
    if (!isLocked) navigate(`/user/levels/${level.levelId}`);
  };

  return (
    <article
      className={`level-card${isLocked ? ' level-card--locked' : ''}`}
      onClick={isLocked ? undefined : open}
      onKeyDown={(event) => {
        if (isLocked) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      }}
      role="button"
      tabIndex={isLocked ? -1 : 0}
      aria-disabled={isLocked || undefined}
    >
      <div className="level-card__banner" style={{ background: meta.banner }}>
        <span className="level-card__index">{String(level.levelId).padStart(2, '0')}</span>
        <span className="level-card__biome">{meta.label}</span>
      </div>

      <div className="level-card__body">
        <div className="level-card__info">
          <h3>{level.levelName}</h3>
          <p>{level.description || 'Описание пока не добавлено.'}</p>
        </div>
        <div className="level-card__preview" aria-hidden="true">
          <MiniMap map={level.mapData} />
        </div>
      </div>

      <footer className="level-card__footer">
        <div className="level-card__tags">
          <span className="level-card__difficulty">{level.difficultyName || 'Неизвестно'}</span>
          {typeof level.mapData?.three_star_runs === 'number' && (
            <span className="level-card__ticks">3★ в {level.mapData.three_star_runs} {runsWord(level.mapData.three_star_runs)}</span>
          )}
        </div>
        <div className="level-card__stars" aria-label={`Звёзды: ${stars} из 3`}>
          {[1, 2, 3].map((star) => (
            <StarIcon key={star} size={17} filled={star <= stars} />
          ))}
        </div>
      </footer>

      {isLocked && (
        <div className="level-card__locked-overlay">
          <span className="level-card__locked-badge">
            <LockIcon size={18} />
            Заблокировано
          </span>
          <span className="level-card__locked-hint">
            Пройди уровень {previous?.levelId} хотя бы на 1 звезду
          </span>
        </div>
      )}
    </article>
  );
};
