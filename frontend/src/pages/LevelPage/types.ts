// Типы по новому контракту: лабиринт, ключи, монеты, выход, пошаговые кадры.
// Боевых типов (enemies/boss/hp/hazard) здесь больше нет.
// Монеты - доменный коллекционный предмет лабиринта: они необязательные,
// балл не меняют и на прохождение не влияют.

export type Direction = 'up' | 'right' | 'down' | 'left';

// Стена между двумя соседними клетками, например side1 "A1" - side2 "B1".
export interface WallEdge {
  id?: number;
  side1: string;
  side2: string;
}

export interface KeyItem {
  id?: number;
  position: string;
}

// Конфигурация карты для игрока: стены, камни, ключи, монеты, вход, выход.
export interface LevelMapData {
  width: number;
  height: number;
  entrance: string;
  entrance_direction?: Direction;
  exit: string;
  walls?: WallEdge[];
  rocks?: string[];
  keys?: KeyItem[];
  // Монеты: сервер отдаёт либо "B3", либо { position: "B3" } - оба формата нормализуем на фронте.
  coins?: Array<string | { position?: string }>;
  hint?: string;
  description?: string;
}

export interface AllowedCommand {
  commandId: number;
  name: string;
  syntax: string;
  description: string;
}

export interface LevelInfo {
  levelId: number;
  levelName: string;
  description?: string | null;
  width?: number;
  height?: number;
  keysCount?: number;
  // Колонка level.coins_count: приходит вместе с уровнем, поля может не быть.
  coinsCount?: number;
  difficulty?: string;
  status?: string;
  // Последовательная блокировка: игроку закрыт, пока не пройден предыдущий уровень.
  // Для админа сервер всегда отдаёт false.
  isLocked?: boolean;
  // Засчитанный результат игрока: балл > 0 значит, что уровень уже пройден.
  userBestScore?: number;
  userAttempts?: number;
  mapData: LevelMapData;
  allowedCommands: AllowedCommand[];
}

// Один кадр прогона: где робот, какая строка кода, что случилось на этом тике.
export interface Frame {
  tick: number;
  robot: { cell: string; direction: Direction };
  codeLine?: number | null;
  keyTaken?: boolean;
  // На этом тике робот подобрал монету (монета исчезает из реплея).
  coinTaken?: boolean;
  atExit?: boolean;
  crashed?: boolean;
}

export type ExecutionStatus = 'in_progress' | 'success' | 'error';

// Состояние робота на доске: клетка, направление и собранное на текущий момент.
// Сервер отдаёт его как startState/endState прогона и как состояние сессии.
export interface RunState {
  robot: { cell: string; direction: Direction };
  keysCollected: number;
  keysTotal: number;
  coinsCollected: number;
  coinsTotal: number;
  // Клетки уже собранных монет: их не рисуем на доске.
  collectedCoinCells: string[];
}

// Одна строка вывода print(): текст, код-строка и вид (обычный вывод или ошибка).
export interface ConsoleLine {
  line: number;
  text: string;
  kind: 'output' | 'error';
}

// Ответ POST /api/execution/run.
export interface ExecutionResult {
  attemptId: number | string;
  status: ExecutionStatus;
  success: boolean;
  ticks: number;
  linesCount: number;
  keysCollected: number;
  keysTotal: number;
  // Собранные монеты: необязательное поле, на балл не влияет.
  coinsCollected?: number;
  coinsTotal?: number;
  score: number;
  difficulty: string;
  errorMessage?: string | null;
  errorLine?: number | null;
  finalRobot: { cell: string; direction: Direction };
  // Состояние до и после запуска: неудачный прогон оставляет робота в конечной клетке.
  // Поля необязательные: старый образ API их ещё не отдаёт.
  startState?: RunState;
  endState?: RunState;
  frames: Frame[];
  // Вывод print(): массив строк в порядке исполнения.
  // Поле необязательное: старый образ API его ещё не отдаёт, фронт не должен падать.
  console?: ConsoleLine[];
}
