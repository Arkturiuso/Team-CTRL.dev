// Конфигурация карты для предпросмотра в карточке: только лабиринт, без боя.
export interface LevelMapData {
  width?: number;
  height?: number;
  entrance?: string;
  exit?: string;
  walls?: Array<{ id?: number; side1: string; side2: string }>;
  rocks?: string[];
  keys?: Array<{ id?: number; position: string }>;
  hint?: string;
  description?: string;
}

// Уровень по новому контракту. Часть полей сервер ещё отдаёт по-старому,
// поэтому имена читаем через помощники ниже.
export interface Level {
  levelId?: number;
  id?: number;
  // null приходит с сервера, если поле не заполнено: читаем через levelNameOf.
  levelName?: string | null;
  name?: string;
  description?: string | null;
  width?: number | null;
  height?: number | null;
  keysCount?: number | null;
  difficultyId?: number;
  difficultyName?: string;
  difficulty?: string;
  levelStatusId?: number;
  levelStatusName?: string;
  status?: string;
  // Последовательная блокировка: уровень закрыт, пока не пройден предыдущий.
  // Для админа сервер всегда отдаёт false.
  isLocked?: boolean;
  created?: string;
  mapData?: LevelMapData | null;
  allowedCommands?: Array<{ commandId: number; name: string; syntax: string; description: string }>;
}

export const levelIdOf = (level: Level): number => level.levelId ?? level.id ?? 0;

export const levelNameOf = (level: Level): string =>
  level.levelName ?? level.name ?? `Уровень ${levelIdOf(level)}`;

export const levelWidthOf = (level: Level): number => level.width ?? level.mapData?.width ?? 0;

export const levelHeightOf = (level: Level): number => level.height ?? level.mapData?.height ?? 0;

export const levelKeysOf = (level: Level): number =>
  level.keysCount ?? level.mapData?.keys?.length ?? 0;

export const levelDifficultyOf = (level: Level): string =>
  level.difficultyName ?? level.difficulty ?? 'неизвестно';

// Статус уровня: "скрыт" | "заблокирован" | "доступен".
export type LevelStatus = 'hidden' | 'blocked' | 'available';

export const levelStatusOf = (level: Level): LevelStatus => {
  // Прогресс важнее серверного статуса: закрытый по цепочке уровень - "blocked".
  if (level.isLocked) return 'blocked';
  const raw = (level.levelStatusName ?? level.status ?? '').toLowerCase();
  if (raw.includes('скры') || raw.includes('hidden')) return 'hidden';
  if (raw.includes('заблок') || raw.includes('blocked')) return 'blocked';
  return 'available';
};

export const levelStatusLabel = (level: Level): string => {
  const status = levelStatusOf(level);
  return status === 'hidden' ? 'Скрыт' : status === 'blocked' ? 'Заблокирован' : 'Доступен';
};
