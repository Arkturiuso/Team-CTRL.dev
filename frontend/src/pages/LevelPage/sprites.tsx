import { useId } from 'react';
import type { Biome } from './types';

type SpriteProps = { size?: number };

export const RobotSprite = ({ size = 48 }: SpriteProps) => {
  const uid = useId().replace(/:/g, '');
  const body = `rb-${uid}`;
  const visor = `rv-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4f2ff" />
          <stop offset="0.55" stopColor="#a3c7ea" />
          <stop offset="1" stopColor="#5c83ad" />
        </linearGradient>
        <radialGradient id={visor} cx="0.5" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#b5f6ff" />
          <stop offset="1" stopColor="#178fc2" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="91" rx="30" ry="5" fill="rgba(0,0,0,0.35)" />
      <rect x="4" y="24" width="16" height="52" rx="8" fill="#243447" />
      <rect x="80" y="24" width="16" height="52" rx="8" fill="#243447" />
      {[33, 44, 55, 66].map((y) => (
        <g key={y} stroke="#3d566f" strokeWidth="3" strokeLinecap="round">
          <line x1="7" y1={y} x2="17" y2={y} />
          <line x1="83" y1={y} x2="93" y2={y} />
        </g>
      ))}
      <circle cx="50" cy="50" r="30" fill={`url(#${body})`} stroke="#1b2a3d" strokeWidth="4" />
      <circle cx="50" cy="50" r="21" fill="#102638" stroke="#2e4c6a" strokeWidth="2" />
      <rect x="35" y="15" width="30" height="14" rx="7" fill={`url(#${visor})`} stroke="#0a2436" strokeWidth="2" />
      <circle cx="43" cy="22" r="3" fill="#06202e" />
      <circle cx="57" cy="22" r="3" fill="#06202e" />
      <circle cx="50" cy="50" r="6" fill="#35e0c3" opacity="0.9" />
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
      <ellipse cx="50" cy="95" rx="34" ry="4" fill="rgba(111,231,193,0.35)" />
    </svg>
  );
};

export const RockSprite = ({ biome, size = 40 }: SpriteProps & { biome: Biome }) => {
  switch (biome) {
    case 'snow':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <ellipse cx="50" cy="92" rx="26" ry="5" fill="rgba(0,0,0,0.25)" />
          <rect x="45" y="70" width="10" height="22" rx="3" fill="#6b4a2f" />
          <path d="M50 8 L32 40 H68 Z" fill="#e9f3fb" stroke="#b7cfe2" strokeWidth="2" />
          <path d="M50 26 L27 60 H73 Z" fill="#d7e8f6" stroke="#b7cfe2" strokeWidth="2" />
          <path d="M50 46 L21 82 H79 Z" fill="#c6dcee" stroke="#b7cfe2" strokeWidth="2" />
        </svg>
      );
    case 'desert':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <ellipse cx="50" cy="92" rx="24" ry="5" fill="rgba(0,0,0,0.22)" />
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
          <ellipse cx="50" cy="92" rx="28" ry="5" fill="rgba(0,0,0,0.35)" />
          <path d="M22 90 L36 30 L52 52 L64 18 L80 90 Z" fill="#6b7280" stroke="#3f4650" strokeWidth="2" />
          <path d="M36 30 L44 66 L52 52 Z" fill="#8b95a3" opacity="0.7" />
          <path d="M64 18 L68 62 L80 90 Z" fill="#565e6b" opacity="0.8" />
        </svg>
      );
    case 'swamp':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <ellipse cx="50" cy="92" rx="28" ry="5" fill="rgba(0,0,0,0.3)" />
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
          <ellipse cx="50" cy="92" rx="28" ry="5" fill="rgba(0,0,0,0.4)" />
          <path d="M18 90 L38 26 L52 46 L64 22 L84 90 Z" fill="#3f3437" stroke="#241c1f" strokeWidth="2" />
          <path d="M38 26 L46 62 L52 46 Z" fill="#57464a" opacity="0.8" />
          <path d="M40 60 L50 74 L58 60 L66 74" stroke="#ff7a3d" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="50" cy="80" r="2.5" fill="#ffb066" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <ellipse cx="50" cy="92" rx="26" ry="5" fill="rgba(0,0,0,0.28)" />
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
          <ellipse cx="50" cy="88" rx="30" ry="5" fill="rgba(0,0,0,0.3)" />
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
          <ellipse cx="50" cy="92" rx="26" ry="5" fill="rgba(0,0,0,0.22)" />
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
          <ellipse cx="50" cy="92" rx="28" ry="5" fill="rgba(0,0,0,0.35)" />
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
          <ellipse cx="50" cy="90" rx="28" ry="5" fill="rgba(0,0,0,0.25)" />
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
          <ellipse cx="50" cy="92" rx="24" ry="5" fill="rgba(0,0,0,0.28)" />
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
          <ellipse cx="50" cy="90" rx="28" ry="5" fill="rgba(0,0,0,0.25)" />
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
