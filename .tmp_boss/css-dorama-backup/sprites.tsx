import { useId, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { Biome, Direction } from './types';

type SpriteProps = { size?: number };

export const RobotSprite = ({ size = 48, direction = 'down' }: SpriteProps & { direction?: Direction }) => {
  const uid = useId().replace(/:/g, '');
  const hull = `rh-${uid}`;
  const hullSide = `rs-${uid}`;
  const visor = `rv-${uid}`;
  const core = `rc-${uid}`;

  const back = direction === 'up';
  const side = direction === 'left' || direction === 'right';
  const flip = direction === 'left';

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={hull} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0" stopColor="#f4fbff" />
          <stop offset="0.42" stopColor="#c3ddf3" />
          <stop offset="0.78" stopColor="#8dadd1" />
          <stop offset="1" stopColor="#5d7ba3" />
        </linearGradient>
        <linearGradient id={hullSide} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#dbeaf7" />
          <stop offset="0.55" stopColor="#9dbdd9" />
          <stop offset="1" stopColor="#5f7d9f" />
        </linearGradient>
        <radialGradient id={visor} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#d6fbff" />
          <stop offset="0.5" stopColor="#4fd2f2" />
          <stop offset="1" stopColor="#0c5f86" />
        </radialGradient>
        <radialGradient id={core} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#b8fff0" />
          <stop offset="0.6" stopColor="#35e0c3" />
          <stop offset="1" stopColor="#0f6f63" />
        </radialGradient>
      </defs>
      <g transform={flip ? 'translate(100, 0) scale(-1, 1)' : undefined}>
        {/* ноги и опоры */}
        <rect x="31" y="70" width="13" height="19" rx="5" fill="#33465e" />
        <rect x="56" y="70" width="13" height="19" rx="5" fill="#2b3c52" />
        <rect x="27" y="86" width="20" height="8" rx="4" fill="#1d2a3a" />
        <rect x="53" y="86" width="20" height="8" rx="4" fill="#1d2a3a" />
        {/* руки: в профиль видна только ближняя */}
        <rect x="15" y="44" width="12" height="26" rx="6" fill={side ? '#41566f' : '#3a4d66'} />
        {!side && <rect x="73" y="44" width="12" height="26" rx="6" fill="#33465e" />}
        <circle cx="21" cy="70" r="6" fill="#5f7d9f" stroke="#22303f" strokeWidth="1.6" />
        {!side && <circle cx="79" cy="70" r="6" fill="#57748f" stroke="#22303f" strokeWidth="1.6" />}
        {/* корпус */}
        <path
          d={side ? 'M36 42 h26 q6 0 6 8 v18 q0 8 -8 8 H42 q-8 0 -8 -8 V50 q0 -8 2 -8 z' : 'M30 42 h40 q6 0 6 8 v18 q0 8 -8 8 H32 q-8 0 -8 -8 V50 q0 -8 6 -8 z'}
          fill={side ? `url(#${hullSide})` : `url(#${hull})`}
          stroke="#1b2a3d"
          strokeWidth="3"
        />
        <path d="M34 50 h32" stroke="rgba(27,42,61,0.45)" strokeWidth="2.4" strokeLinecap="round" />
        {!side && <circle cx="50" cy="62" r="7" fill={`url(#${core})`} stroke="#0d3b39" strokeWidth="2" />}
        {/* плечи */}
        <rect x="26" y="38" width="48" height="9" rx="4.5" fill="#7f9ec2" stroke="#1b2a3d" strokeWidth="2.2" />
        {/* голова */}
        <rect x="34" y="12" width="32" height="25" rx="9" fill={side ? `url(#${hullSide})` : `url(#${hull})`} stroke="#1b2a3d" strokeWidth="3" />
        {back ? (
          <>
            <rect x="40" y="18" width="20" height="13" rx="5" fill="#2e4257" />
            <circle cx="50" cy="24" r="3" fill="#6de3ff" opacity="0.5" />
          </>
        ) : side ? (
          <>
            <path d="M46 19 h15 q4 0 4 4 v4 q0 4 -4 4 H46 z" fill={`url(#${visor})`} stroke="#0a2436" strokeWidth="1.8" />
            <circle cx="63" cy="25" r="2.2" fill="#eafcff" />
          </>
        ) : (
          <>
            <rect x="39" y="19" width="22" height="11" rx="5" fill={`url(#${visor})`} stroke="#0a2436" strokeWidth="2" />
            <circle cx="45" cy="24.5" r="2.4" fill="#06202e" />
            <circle cx="55" cy="24.5" r="2.4" fill="#06202e" />
          </>
        )}
        {/* антенна */}
        <path d="M64 14 l7 -8" stroke="#8fa3bf" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="72" cy="5" r="3.2" fill={back ? '#ff6b6b' : '#ffd166'} stroke="#7a4a00" strokeWidth="1.2" />
      </g>
    </svg>
  );
};

export const CoinSprite = ({ size = 26 }: SpriteProps) => {
  const uid = useId().replace(/:/g, '');
  const gold = `coin-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={gold} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#fff6bf" />
          <stop offset="0.5" stopColor="#ffd166" />
          <stop offset="1" stopColor="#c98a12" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="52" r="34" fill={`url(#${gold})`} stroke="#8a5a00" strokeWidth="3" />
      <circle cx="50" cy="52" r="25" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeDasharray="4 5" />
      <path
        d="M50 34 l6 12 h13 l-10 9 4 14-13-8-13 8 4-14-10-9h13z"
        fill="#8a5a00"
        opacity="0.5"
      />
    </svg>
  );
};

export const KeySprite = ({ size = 30 }: SpriteProps) => {
  const uid = useId().replace(/:/g, '');
  const gold = `key-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3b0" />
          <stop offset="0.5" stopColor="#ffd166" />
          <stop offset="1" stopColor="#d69a1f" />
        </linearGradient>
      </defs>
      <g transform="rotate(-18 50 50)">
        <circle cx="50" cy="28" r="14" fill="none" stroke={`url(#${gold})`} strokeWidth="9" />
        <circle cx="50" cy="28" r="6" fill="rgba(10,20,30,0.45)" />
        <rect x="46" y="42" width="8" height="40" rx="4" fill={`url(#${gold})`} />
        <rect x="46" y="64" width="18" height="8" rx="3" fill={`url(#${gold})`} />
        <rect x="46" y="76" width="14" height="8" rx="3" fill={`url(#${gold})`} />
      </g>
    </svg>
  );
};

export const DoorSprite = ({ size = 54 }: SpriteProps) => {
  const uid = useId().replace(/:/g, '');
  const glow = `door-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={glow} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9f5dd" />
          <stop offset="1" stopColor="#2f9b86" />
        </linearGradient>
      </defs>
      <path d="M18 92 V40 Q18 12 50 12 Q82 12 82 40 V92 Z" fill="#142c34" stroke="#6fe7c1" strokeWidth="3" />
      <path d="M28 92 V42 Q28 22 50 22 Q72 22 72 42 V92 Z" fill={`url(#${glow})`} opacity="0.85" />
      <path d="M50 24 V92" stroke="rgba(8,28,26,0.35)" strokeWidth="2" />
      <circle cx="62" cy="60" r="4" fill="#0b2b26" />
    </svg>
  );
};

export const RockSprite = ({ biome, size = 40 }: SpriteProps & { biome: Biome }) => {
  switch (biome) {
    case 'snow':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <rect x="45" y="70" width="10" height="22" rx="3" fill="#6b4a2f" />
          <path d="M50 8 L32 40 H68 Z" fill="#e9f3fb" stroke="#b7cfe2" strokeWidth="2" />
          <path d="M50 26 L27 60 H73 Z" fill="#d7e8f6" stroke="#b7cfe2" strokeWidth="2" />
          <path d="M50 46 L21 82 H79 Z" fill="#c6dcee" stroke="#b7cfe2" strokeWidth="2" />
        </svg>
      );
    case 'desert':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <rect x="41" y="22" width="18" height="62" rx="9" fill="#4c8b45" stroke="#2f6130" strokeWidth="2" />
          <path d="M41 48 H30 q-7 0 -7 -8 V32 q0 -5 5 -5 t5 5 v6 h8" fill="#4c8b45" stroke="#2f6130" strokeWidth="2" />
          <path d="M59 56 H71 q7 0 7 -8 V40 q0 -5 -5 -5 t-5 5 v6 h-9" fill="#4c8b45" stroke="#2f6130" strokeWidth="2" />
          <g stroke="#d9f0c9" strokeWidth="1.6" strokeLinecap="round">
            <line x1="50" y1="30" x2="50" y2="24" />
            <line x1="50" y1="44" x2="50" y2="38" />
            <line x1="50" y1="58" x2="50" y2="52" />
          </g>
        </svg>
      );
    case 'cave':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <path d="M22 90 L36 30 L52 52 L64 18 L80 90 Z" fill="#6b7280" stroke="#3f4650" strokeWidth="2" />
          <path d="M36 30 L44 66 L52 52 Z" fill="#8b95a3" opacity="0.7" />
          <path d="M64 18 L68 62 L80 90 Z" fill="#565e6b" opacity="0.8" />
        </svg>
      );
    case 'swamp':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <path d="M30 88 L36 54 Q38 40 50 40 Q62 40 64 54 L70 88 Z" fill="#5a4632" stroke="#3a2c1e" strokeWidth="2" />
          <ellipse cx="50" cy="42" rx="14" ry="6" fill="#7a6146" stroke="#3a2c1e" strokeWidth="2" />
          <path d="M30 88 L18 82 M70 88 L82 82 M50 88 L50 92" stroke="#3a2c1e" strokeWidth="4" strokeLinecap="round" />
          <path d="M36 46 Q50 34 64 46" fill="#5f8a3d" opacity="0.8" />
          <circle cx="42" cy="44" r="2" fill="#37501f" />
          <circle cx="58" cy="46" r="2" fill="#37501f" />
        </svg>
      );
    case 'volcano':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <path d="M18 90 L38 26 L52 46 L64 22 L84 90 Z" fill="#3f3437" stroke="#241c1f" strokeWidth="2" />
          <path d="M38 26 L46 62 L52 46 Z" fill="#57464a" opacity="0.8" />
          <path d="M40 60 L50 74 L58 60 L66 74" stroke="#ff7a3d" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="50" cy="80" r="2.5" fill="#ffb066" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <rect x="44" y="58" width="12" height="32" rx="4" fill="#6b4a2f" />
          <circle cx="50" cy="38" r="23" fill="#2f7d32" />
          <circle cx="34" cy="50" r="15" fill="#3f9142" />
          <circle cx="66" cy="50" r="15" fill="#35853a" />
          <circle cx="44" cy="32" r="8" fill="#57a95a" opacity="0.7" />
        </svg>
      );
  }
};

export const EnemySprite = ({ type, size = 40 }: SpriteProps & { type: string }) => {
  switch (type) {
    case 'wolf':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <path d="M24 62 Q14 54 18 42" stroke="#7c8795" strokeWidth="7" fill="none" strokeLinecap="round" />
          <ellipse cx="48" cy="62" rx="26" ry="16" fill="#8b95a3" />
          <rect x="32" y="70" width="7" height="15" rx="3" fill="#6d7683" />
          <rect x="44" y="70" width="7" height="15" rx="3" fill="#6d7683" />
          <rect x="58" y="70" width="7" height="15" rx="3" fill="#6d7683" />
          <ellipse cx="74" cy="50" rx="14" ry="12" fill="#9aa4b2" />
          <path d="M64 42 l4 -13 8 10 z" fill="#7c8795" />
          <path d="M84 42 l-2 -13 -8 10 z" fill="#7c8795" />
          <ellipse cx="85" cy="54" rx="8" ry="6" fill="#c7ced8" />
          <circle cx="89" cy="53" r="2.4" fill="#1b2430" />
          <circle cx="72" cy="48" r="2.2" fill="#ffd166" />
          <circle cx="82" cy="47" r="2.2" fill="#ffd166" />
        </svg>
      );
    case 'snowman':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="72" r="20" fill="#eef5ff" stroke="#c4d6ea" strokeWidth="2" />
          <circle cx="50" cy="48" r="15" fill="#f7fbff" stroke="#c4d6ea" strokeWidth="2" />
          <circle cx="50" cy="27" r="11" fill="#ffffff" stroke="#cfdcec" strokeWidth="2" />
          <rect x="36" y="7" width="28" height="7" rx="2" fill="#243447" />
          <rect x="42" y="14" width="16" height="5" fill="#243447" />
          <circle cx="46" cy="25" r="1.8" fill="#1b2430" />
          <circle cx="54" cy="25" r="1.8" fill="#1b2430" />
          <path d="M50 29 l9 4 -9 4 z" fill="#f08a24" />
          <path d="M38 39 q12 7 24 0" stroke="#e2574c" strokeWidth="5" fill="none" />
          <circle cx="50" cy="56" r="2" fill="#1b2430" />
          <circle cx="50" cy="64" r="2" fill="#1b2430" />
        </svg>
      );
    case 'golem':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <rect x="16" y="44" width="12" height="26" rx="6" fill="#4b5462" />
          <rect x="72" y="44" width="12" height="26" rx="6" fill="#4b5462" />
          <rect x="26" y="36" width="48" height="44" rx="10" fill="#5b6472" stroke="#39414d" strokeWidth="2" />
          <rect x="34" y="16" width="32" height="24" rx="8" fill="#6c7582" stroke="#39414d" strokeWidth="2" />
          <circle cx="43" cy="28" r="3.5" fill="#ff9f43" />
          <circle cx="57" cy="28" r="3.5" fill="#ff9f43" />
          <path d="M40 44 l6 8 -8 4" stroke="#39414d" strokeWidth="2" fill="none" />
          <rect x="34" y="80" width="12" height="10" rx="4" fill="#444c59" />
          <rect x="54" y="80" width="12" height="10" rx="4" fill="#444c59" />
        </svg>
      );
    case 'scorpion':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <path d="M62 58 q18 -4 15 -22 q-2 -9 7 -12" stroke="#c98a4b" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M84 22 l9 7 -11 6 z" fill="#a86a2f" />
          <ellipse cx="44" cy="62" rx="19" ry="12" fill="#d99a55" stroke="#a86a2f" strokeWidth="2" />
          <path d="M26 58 q-12 -9 -17 1 q10 8 17 2" fill="#c98a4b" />
          <path d="M62 58 q12 -9 17 1 q-10 8 -17 2" fill="#c98a4b" />
          <g stroke="#a86a2f" strokeWidth="3" strokeLinecap="round">
            <line x1="34" y1="72" x2="28" y2="84" />
            <line x1="44" y1="74" x2="42" y2="86" />
            <line x1="54" y1="74" x2="58" y2="86" />
            <line x1="62" y1="70" x2="70" y2="82" />
          </g>
          <circle cx="40" cy="60" r="2" fill="#2b1b10" />
        </svg>
      );
    case 'vulture':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <path d="M50 52 Q22 28 6 52 Q24 64 44 62 Z" fill="#4a3b52" />
          <path d="M50 52 Q78 28 94 52 Q76 64 56 62 Z" fill="#3f3247" />
          <ellipse cx="50" cy="58" rx="12" ry="16" fill="#5b4a63" />
          <circle cx="50" cy="40" r="8" fill="#b5564f" />
          <path d="M54 40 l13 4 -13 5 z" fill="#e9c46a" />
          <circle cx="48" cy="38" r="1.8" fill="#111" />
        </svg>
      );
    case 'bat':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <path d="M50 52 Q30 28 8 40 Q22 58 42 60 Z" fill="#3d3450" />
          <path d="M50 52 Q70 28 92 40 Q78 58 58 60 Z" fill="#332b45" />
          <ellipse cx="50" cy="58" rx="10" ry="13" fill="#4f4466" />
          <path d="M42 44 l-2 -13 8 8 z" fill="#4f4466" />
          <path d="M58 44 l2 -13 -8 8 z" fill="#4f4466" />
          <circle cx="46" cy="54" r="2" fill="#ff6b6b" />
          <circle cx="54" cy="54" r="2" fill="#ff6b6b" />
          <path d="M46 64 l2 5 2 -5" stroke="#f4f6ff" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'slime':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <path d="M20 74 q-5 -32 30 -32 q35 0 30 32 q-2 12 -16 12 H36 q-14 0 -16 -12 z" fill="#66c46b" opacity="0.95" />
          <path d="M30 60 q10 -15 26 -11" stroke="rgba(255,255,255,0.5)" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="42" cy="62" r="4" fill="#12261a" />
          <circle cx="58" cy="62" r="4" fill="#12261a" />
          <path d="M44 71 q6 5 12 0" stroke="#12261a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="28" cy="84" r="3" fill="#66c46b" opacity="0.8" />
          <circle cx="72" cy="84" r="2.4" fill="#66c46b" opacity="0.8" />
        </svg>
      );
  }
};

/**
 * Четыре босса выглядят по-разному: аватар берётся из конфига уровня (boss.avatar),
 * иначе все четыре бои рисовались бы одним и тем же големом.
 */
export const BossSprite = ({ avatar, size = 64 }: SpriteProps & { avatar?: string }) => {
  const uid = useId().replace(/:/g, '');
  const paint = (name: string) => `${name}-${uid}`;

  if (avatar === 'desert') {
    const shell = paint('shell');
    const sting = paint('sting');
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id={shell} x1="0" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#ffd89b" />
            <stop offset="0.45" stopColor="#d99a55" />
            <stop offset="1" stopColor="#8f4f18" />
          </linearGradient>
          <radialGradient id={sting} cx="0.4" cy="0.35" r="0.8">
            <stop offset="0" stopColor="#fff3b0" />
            <stop offset="1" stopColor="#e2574c" />
          </radialGradient>
        </defs>
        <g stroke="#7c4212" strokeWidth="3.4" strokeLinecap="round">
          <path d="M36 74 l-10 14 M46 78 l-6 12 M58 78 l6 12 M68 74 l10 14" fill="none" />
        </g>
        <path d="M62 60 q22 -6 20 -26 q-1 -10 8 -14" fill="none" stroke={`url(#${shell})`} strokeWidth="13" strokeLinecap="round" />
        <path d="M90 20 l11 6 -12 9 z" fill={`url(#${sting})`} stroke="#8f2f24" strokeWidth="2" />
        <ellipse cx="46" cy="66" rx="26" ry="17" fill={`url(#${shell})`} stroke="#7c4212" strokeWidth="3" />
        <path d="M28 60 q18 -10 36 0 M26 70 q20 -9 40 0" stroke="rgba(124,66,18,0.5)" strokeWidth="2.4" fill="none" />
        <path d="M24 58 q-14 -12 -22 -2 q8 14 22 8" fill={`url(#${shell})`} stroke="#7c4212" strokeWidth="2.6" />
        <path d="M30 52 q-8 -18 -20 -16 q0 16 16 20" fill={`url(#${shell})`} stroke="#7c4212" strokeWidth="2.6" />
        <ellipse cx="30" cy="46" rx="13" ry="11" fill="#e8b274" stroke="#7c4212" strokeWidth="2.6" />
        <circle cx="25" cy="43" r="2.4" fill="#2b1608" />
        <circle cx="35" cy="42" r="2.4" fill="#2b1608" />
        <path d="M14 30 l5 -9 5 8 5 -10 5 10 z" fill="#ffd166" stroke="#a26b00" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }

  if (avatar === 'snow') {
    const ice = paint('ice');
    const cape = paint('cape');
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id={ice} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.5" stopColor="#bfe4ff" />
            <stop offset="1" stopColor="#5f9fd0" />
          </linearGradient>
          <linearGradient id={cape} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d8f1ff" />
            <stop offset="1" stopColor="#3f6d9c" />
          </linearGradient>
        </defs>
        <path d="M50 26 q-30 8 -34 62 q34 -10 68 0 q-4 -54 -34 -62 z" fill={`url(#${cape})`} opacity="0.8" />
        <path d="M50 34 l-14 12 4 40 h20 l4 -40 z" fill={`url(#${ice})`} stroke="#4d84b4" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M36 50 l-16 10 6 6 12 -8 M64 50 l16 10 -6 6 -12 -8" fill="#cfeaff" stroke="#4d84b4" strokeWidth="2" strokeLinejoin="round" />
        <path d="M32 40 l-8 -12 12 4 z M68 40 l8 -12 -12 4 z" fill="#eaf7ff" stroke="#4d84b4" strokeWidth="1.8" />
        <circle cx="50" cy="24" r="12" fill={`url(#${ice})`} stroke="#4d84b4" strokeWidth="2.4" />
        <path d="M38 14 l4 -12 4 9 4 -12 4 12 4 -9 4 12 z" fill="#eaf7ff" stroke="#6fa8d8" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="46" cy="23" r="2.4" fill="#0d3f66" />
        <circle cx="54" cy="23" r="2.4" fill="#0d3f66" />
        <path d="M46 30 q4 3 8 0" stroke="#1f5f8c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (avatar === 'volcano') {
    const rock = paint('rock');
    const magma = paint('magma');
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id={rock} x1="0.1" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5a4a4e" />
            <stop offset="0.55" stopColor="#33282c" />
            <stop offset="1" stopColor="#170f12" />
          </linearGradient>
          <linearGradient id={magma} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#ff4d1a" />
            <stop offset="0.6" stopColor="#ff9f43" />
            <stop offset="1" stopColor="#ffe08a" />
          </linearGradient>
        </defs>
        <rect x="34" y="74" width="14" height="20" rx="4" fill={`url(#${rock})`} stroke="#0e090b" strokeWidth="2" />
        <rect x="53" y="74" width="14" height="20" rx="4" fill={`url(#${rock})`} stroke="#0e090b" strokeWidth="2" />
        <path d="M28 40 h44 l6 34 q-28 8 -56 0 z" fill={`url(#${rock})`} stroke="#0e090b" strokeWidth="2.6" />
        <path d="M42 46 l-4 12 8 4 -4 12 M60 44 l5 14 -8 5" stroke={`url(#${magma})`} strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M26 42 l-14 10 6 12 14 -8 z" fill={`url(#${rock})`} stroke="#0e090b" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M74 42 l14 10 -6 12 -14 -8 z" fill={`url(#${rock})`} stroke="#0e090b" strokeWidth="2.4" strokeLinejoin="round" />
        <circle cx="16" cy="60" r="9" fill={`url(#${magma})`} opacity="0.9" />
        <circle cx="84" cy="60" r="9" fill={`url(#${magma})`} opacity="0.9" />
        <path d="M38 16 h24 l4 22 h-32 z" fill={`url(#${rock})`} stroke="#0e090b" strokeWidth="2.6" />
        <path d="M36 18 l-6 -12 12 6 z M64 18 l6 -12 -12 6 z" fill="#6b565b" stroke="#0e090b" strokeWidth="2" />
        <circle cx="45" cy="27" r="3" fill={`url(#${magma})`} />
        <circle cx="57" cy="27" r="3" fill={`url(#${magma})`} />
      </svg>
    );
  }

  // Лесной Древень по умолчанию: ствол-корпус, кроновая голова, ветки-руки.
  const bark = paint('bark');
  const crown = paint('crown');
  const sap = paint('sap');
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={bark} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#8a613c" />
          <stop offset="0.5" stopColor="#5d3f26" />
          <stop offset="1" stopColor="#33200f" />
        </linearGradient>
        <radialGradient id={crown} cx="0.4" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#6fbf5e" />
          <stop offset="1" stopColor="#1f5d24" />
        </radialGradient>
        <radialGradient id={sap} cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="1" stopColor="#f08a24" />
        </radialGradient>
      </defs>
      <path d="M38 92 l-10 4 M62 92 l10 4" stroke="#3a2716" strokeWidth="6" strokeLinecap="round" />
      <path d="M40 88 q-8 -34 -4 -48 h28 q4 14 -4 48 z" fill={`url(#${bark})`} stroke="#2a1a0c" strokeWidth="2.6" />
      <path d="M44 52 q6 8 12 0 M44 66 q6 8 12 0" stroke="rgba(42,26,12,0.7)" strokeWidth="2.2" fill="none" />
      <path d="M38 50 q-16 -4 -22 10 q12 6 22 -2 z" fill={`url(#${bark})`} stroke="#2a1a0c" strokeWidth="2.4" />
      <path d="M62 50 q16 -4 22 10 q-12 6 -22 -2 z" fill={`url(#${bark})`} stroke="#2a1a0c" strokeWidth="2.4" />
      <circle cx="50" cy="30" r="16" fill={`url(#${crown})`} stroke="#174a1c" strokeWidth="2.4" />
      <circle cx="30" cy="36" r="11" fill={`url(#${crown})`} opacity="0.9" />
      <circle cx="70" cy="36" r="11" fill={`url(#${crown})`} opacity="0.9" />
      <circle cx="50" cy="14" r="10" fill={`url(#${crown})`} />
      <circle cx="44" cy="30" r="4.4" fill={`url(#${sap})`} stroke="#2a1a0c" strokeWidth="1.6" />
      <circle cx="58" cy="30" r="4.4" fill={`url(#${sap})`} stroke="#2a1a0c" strokeWidth="1.6" />
      <path d="M44 42 q6 5 12 0" stroke="#2a1a0c" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </svg>
  );
};

export const HazardSprite = ({ kind, size = 40 }: SpriteProps & { kind: string }) => {
  switch (kind) {
    case 'sandstorm':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <g fill="none" stroke="#e8c07d" strokeWidth="9" strokeLinecap="round" opacity="0.92">
            <path d="M8 30 q22 -14 42 0 t42 0" />
            <path d="M4 54 q24 -14 46 0 t44 0" stroke="#d9a55c" />
            <path d="M10 78 q22 -14 42 0 t40 0" stroke="#c78f45" />
          </g>
          <g fill="#fff2cf" opacity="0.75">
            <circle cx="26" cy="22" r="3" />
            <circle cx="66" cy="44" r="2.4" />
            <circle cx="40" cy="70" r="2" />
          </g>
        </svg>
      );
    case 'avalanche':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <path d="M6 22 L94 8 L88 52 L12 66 Z" fill="#eef6fd" stroke="#b7cfe2" strokeWidth="2.5" />
          <path d="M12 66 L88 52 L84 74 L16 88 Z" fill="#cfe1f0" stroke="#a9c4da" strokeWidth="2" />
          <g fill="#ffffff" opacity="0.9">
            <circle cx="30" cy="16" r="4" />
            <circle cx="62" cy="12" r="3" />
            <circle cx="78" cy="34" r="3.4" />
          </g>
        </svg>
      );
    case 'lava':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <path d="M50 96 L44 60 L52 44 L46 22 L54 4 L60 26 L52 46 L62 62 L56 96 Z" fill="#ff7a2f" />
          <path d="M50 96 L47 62 L54 46 L49 26 L54 10 L57 30 L52 48 L59 64 L55 96 Z" fill="#ffd166" />
          <g fill="#ff9f45" opacity="0.9">
            <circle cx="30" cy="70" r="4" />
            <circle cx="72" cy="58" r="3" />
            <circle cx="24" cy="40" r="2.4" />
          </g>
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <rect x="45" y="52" width="11" height="42" rx="4" fill="#6b4a2f" />
          <circle cx="50" cy="32" r="24" fill="#2f7d32" />
          <circle cx="32" cy="46" r="15" fill="#3f9142" />
          <circle cx="68" cy="46" r="15" fill="#35853a" />
          <circle cx="45" cy="26" r="8" fill="#57a95a" opacity="0.7" />
        </svg>
      );
  }
};

export const StarIcon = ({ size = 18, filled = true }: SpriteProps & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"
      fill={filled ? '#ffd166' : 'transparent'}
      stroke={filled ? '#ffb703' : '#41506a'}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

export const LockIcon = ({ size = 18 }: SpriteProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="10" width="14" height="11" rx="3" fill="#8fa3bf" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#8fa3bf" strokeWidth="2" />
    <circle cx="12" cy="15.5" r="1.6" fill="#0b1220" />
  </svg>
);

type AmbientGroup = { kind: string; count: number; dur: [number, number]; size: [number, number] };

// Только видимость, без урона: скорость и размер подобраны под живую погоду биома.
const AMBIENT_MIX: Record<Biome, AmbientGroup[]> = {
  forest: [
    { kind: 'leaf', count: 5, dur: [12, 19], size: [9, 15] },
    { kind: 'mote', count: 3, dur: [17, 26], size: [2, 4] },
  ],
  snow: [
    { kind: 'flake', count: 8, dur: [10, 17], size: [3, 6] },
    { kind: 'mote', count: 2, dur: [18, 28], size: [2, 3] },
  ],
  desert: [
    { kind: 'sand', count: 5, dur: [5, 9], size: [30, 62] },
    { kind: 'mote', count: 3, dur: [15, 24], size: [2, 4] },
  ],
  cave: [
    { kind: 'mote', count: 7, dur: [14, 24], size: [2, 5] },
    { kind: 'glow', count: 1, dur: [8, 12], size: [70, 120] },
  ],
  swamp: [
    { kind: 'bubble', count: 5, dur: [9, 15], size: [4, 9] },
    { kind: 'fog', count: 2, dur: [28, 42], size: [120, 190] },
    { kind: 'mote', count: 2, dur: [16, 25], size: [2, 4] },
  ],
  volcano: [
    { kind: 'ember', count: 6, dur: [6, 11], size: [3, 6] },
    { kind: 'glow', count: 2, dur: [7, 11], size: [80, 140] },
  ],
};

export const AmbientLayer = ({ biome, width, height }: { biome: Biome; width: number; height: number }) => {
  const items = useMemo(() => {
    // Сид по названию биома: одна и та же раскладка на каждый рендер, иначе слой дёргается при перемотке кадров.
    let state = biome.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
    const roll = () => {
      state = (state * 1103515245 + 12345) % 2147483648;
      return state / 2147483648;
    };
    const between = ([min, max]: [number, number]) => Math.round((min + roll() * (max - min)) * 10) / 10;

    return (AMBIENT_MIX[biome] ?? []).flatMap((group) =>
      Array.from({ length: group.count }, (_, index) => ({
        id: `${group.kind}-${index}`,
        kind: group.kind,
        style: {
          '--l': `${Math.round(roll() * 1000) / 10}%`,
          '--t': `${Math.round(roll() * 100) / 10}%`,
          '--s': `${between(group.size)}px`,
          '--drift': `${Math.round(-70 + roll() * 140)}px`,
          animationDuration: `${between(group.dur)}s`,
          // Отрицательная задержка впускает часть частиц в середине пути - поле не пустует на старте.
          animationDelay: `-${Math.round(roll() * 100) / 10}s`,
        } as CSSProperties,
      })),
    );
  }, [biome]);

  return (
    <div
      className={`ambient-layer ambient-layer--${biome}`}
      aria-hidden="true"
      style={{ '--h': `${height}px`, '--w': `${width}px` } as CSSProperties}
    >
      {items.map((item) => (
        <span key={item.id} className={`ambient ambient--${item.kind}`} style={item.style}>
          <i />
        </span>
      ))}
    </div>
  );
};
