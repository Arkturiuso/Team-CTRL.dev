type SpriteProps = { size?: number };

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
