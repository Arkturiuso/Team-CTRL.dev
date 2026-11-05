import { useEffect, useRef } from 'react';
import type { Biome, BossConfig, BossFxKind, HazardFrame } from './types';
import { HazardSprite } from './sprites';
import { BossPortrait } from './scene/BossPortrait';

const HAZARD_LABEL: Record<string, string> = {
  tree: 'Дерево падает',
  sandstorm: 'Песчаная буря',
  avalanche: 'Снежная доска',
  lava: 'Фонтан магмы',
};

export interface BossLogEntry {
  id: number;
  text: string;
  kind: 'boss' | 'info' | 'danger';
}

interface BossPanelProps {
  boss: BossConfig;
  bossAvatar: string;
  bossBiome: Biome;
  bossHp: number;
  bossMaxHp: number;
  shielded: boolean;
  defeated: boolean;
  playerHp: number;
  playerMaxHp: number;
  cooldown: number;
  hint?: string | null;
  aim?: string | null;
  mark?: string | null;
  fx?: BossFxKind | null;
  raging?: boolean;
  hazard?: HazardFrame | null;
  bossTarget?: string | null;
  log: BossLogEntry[];
}

const actionsWord = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'действие';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'действия';
  return 'действий';
};

const Pips = ({ value, max, kind }: { value: number; max: number; kind: 'boss' | 'player' }) => (
  <span className={`hp-pips hp-pips--${kind}`}>
    {Array.from({ length: Math.max(0, max) }).map((_, index) => (
      <i key={index} className={index < value ? 'is-full' : ''} />
    ))}
  </span>
);

export const BossPanel = ({
  boss,
  bossAvatar,
  bossBiome,
  bossHp,
  bossMaxHp,
  shielded,
  defeated,
  playerHp,
  playerMaxHp,
  cooldown,
  hint,
  aim,
  mark,
  fx,
  raging,
  hazard,
  bossTarget,
  log,
}: BossPanelProps) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  return (
    <aside className={`boss-panel${defeated ? ' is-defeated' : ''}`}>
      <div className="boss-panel__head">
        <div className={`boss-panel__avatar${shielded ? ' is-shielded' : ''}${raging ? ' is-raging' : ''}${fx ? ` is-${fx}` : ''}`}>
          <BossPortrait avatar={bossAvatar} biome={bossBiome} />
        </div>
        <div className="boss-panel__info">
          <strong className="boss-panel__name">{boss.name}</strong>
          {boss.title && <span className="boss-panel__title">{boss.title}</span>}
          <div className="boss-panel__hp">
            <span className="boss-panel__hp-label">Босс</span>
            <Pips value={bossHp} max={bossMaxHp} kind="boss" />
            <span className="boss-panel__hp-value">{Math.max(0, bossHp)}/{bossMaxHp}</span>
          </div>
        </div>
      </div>

      <div className="boss-panel__stats">
        <div className="boss-panel__hp boss-panel__hp--player">
          <span className="boss-panel__hp-label">Ты</span>
          <Pips value={playerHp} max={playerMaxHp} kind="player" />
          <span className="boss-panel__hp-value">{Math.max(0, playerHp)}/{playerMaxHp}</span>
        </div>
        <span className={`boss-panel__state${aim ? ' is-aim' : shielded ? ' is-shield' : defeated ? ' is-down' : ''}${raging ? ' is-rage' : ''}${aim && mark && aim === mark ? ' is-mark' : ''}`}>
          {defeated
            ? 'повержен'
            : fx === 'charge'
              ? 'заряжает залп'
              : fx === 'shot'
                ? 'огонь!'
                : aim && mark && aim === mark
                  ? `накрывает метку ${aim}`
                  : aim
                    ? `целится в ${aim}`
                    : fx === 'step'
                      ? 'уходит с клетки'
                      : bossTarget
                        ? `идёт к ${bossTarget}`
                        : raging
                          ? 'в ярости'
                          : shielded
                            ? 'под щитом'
                            : cooldown > 0
                              ? `перезарядка ${cooldown}`
                              : 'готов к бою'}
        </span>
      </div>

      {boss.ability && <div className="boss-panel__ability">{boss.ability}</div>}
      {hazard && !defeated && (
        <div className={`boss-panel__hazard is-${hazard.state}`}>
          <span className="boss-panel__hazard-icon">
            <HazardSprite kind={hazard.kind} size={22} />
          </span>
          <span>
            <strong>{HAZARD_LABEL[hazard.kind] ?? 'Опасность'}</strong>
            {hazard.state === 'warn'
              ? `: клетки ${hazard.cells.join(', ')}. Уходи - через ${hazard.fuse} ${actionsWord(hazard.fuse)}`
              : `: клетки ${hazard.cells.join(', ')} накрыты`}
          </span>
        </div>
      )}
      {mark && !defeated && (
        <div className="boss-panel__mark">
          <span>Метка</span>
          Клетка {mark} под ударом. Следующий залп накроет её и соседние клетки - уходи на 2 клетки.
        </div>
      )}
      {hint && (
        <div className="boss-panel__hint">
          <span>Подсказка</span>
          {hint}
        </div>
      )}

      <div className="boss-panel__console" ref={logRef} aria-readonly="true">
        {log.length === 0 && (
          <div className="boss-panel__line boss-panel__line--muted">
            {boss.name} ждёт твоего первого хода.
          </div>
        )}
        {log.map((entry) => (
          <div key={entry.id} className={`boss-panel__line boss-panel__line--${entry.kind}`}>
            <span className="boss-panel__speaker">{entry.kind === 'danger' ? `${boss.name}!` : boss.name}:</span>{' '}
            {entry.text}
          </div>
        ))}
      </div>
      <span className="boss-panel__note">консоль босса - только для чтения</span>
    </aside>
  );
};

interface BossIntroProps {
  boss: BossConfig;
  bossAvatar: string;
  bossBiome: Biome;
  lines: string[];
  step: number;
  onNext: () => void;
  onSkip: () => void;
  onStart: () => void;
}

export const BossIntro = ({ boss, bossAvatar, bossBiome, lines, step, onNext, onSkip, onStart }: BossIntroProps) => {
  const consoleRef = useRef<HTMLDivElement>(null);
  const finished = step >= lines.length;

  useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [step]);

  return (
    <div className="modal-overlay">
      <div className="modal boss-intro">
        <div className="boss-intro__stage">
          <div className="boss-intro__avatar">
            <span className="boss-intro__pulse" aria-hidden="true" />
            <BossPortrait avatar={bossAvatar} biome={bossBiome} yaw={0.34} pitch={0.1} />
          </div>
          <div className="boss-intro__meta">
            <span className="boss-intro__kicker">Босс локации</span>
            <h2>{boss.name}</h2>
            {boss.title && <span className="boss-intro__title">{boss.title}</span>}
            <div className="boss-intro__hp">
              <span>HP</span>
              <Pips value={boss.hp} max={boss.hp} kind="boss" />
              <span>{boss.hp}</span>
            </div>
            {boss.ability && <p className="boss-intro__ability">{boss.ability}</p>}
          </div>
        </div>

        <div className="boss-intro__console" ref={consoleRef}>
          {lines.slice(0, step).map((line, index) => (
            <div key={index} className="boss-intro__line">
              <span className="boss-intro__speaker">{boss.name}:</span> {line}
            </div>
          ))}
          {!finished && <span className="boss-intro__typing" aria-label="Босс говорит" />}
        </div>

        <p className="boss-intro__hint">
          После разговора босс разбросает ключи: настоящий только один, остальные - фальшивки.
          Куда смотреть - подскажет сам босс. Найди настоящий ключ и выстрели ракетой через{' '}
          <code>robot.attack(x)</code>. После попадания босс бьёт по твоей клетке и уходит с неё -
          он не телепортируется, а идёт по карте, поэтому целься заново.
          Если он попал, на клетке останется метка: следующий залп накроет метку и соседние клетки,
          поэтому уходи от неё на 2 клетки.
          А ещё локация бьёт сама: дерево, буря, лавина или лава намечают клетки заранее -
          уходи с них, пока не ударило.
        </p>

        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={onSkip}>Пропустить</button>
          {finished ? (
            <button className="btn btn--primary" onClick={onStart}>В бой</button>
          ) : (
            <button className="btn" onClick={onNext}>Дальше</button>
          )}
        </div>
      </div>
    </div>
  );
};
