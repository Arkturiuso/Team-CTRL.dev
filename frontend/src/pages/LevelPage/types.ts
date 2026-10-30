export type Biome = 'forest' | 'snow' | 'desert' | 'cave' | 'swamp' | 'volcano';
export type Direction = 'up' | 'right' | 'down' | 'left';
export type Terrain = 'ice' | 'mud';

export interface MapItem {
  id: number;
  position: string;
}

export interface EnemyDef {
  id: number;
  type: string;
  position: string;
  patrol: string[];
  move_every: number;
}

export interface LevelMapData {
  version?: number;
  level_name?: string;
  description?: string;
  hint?: string;
  biome?: Biome;
  width: number;
  height: number;
  entrance: string;
  entrance_direction?: Direction;
  exit: string;
  walls?: Array<{ id?: number; side1: string; side2: string }>;
  rocks?: string[];
  terrain?: Record<string, Terrain>;
  coins?: MapItem[];
  keys?: MapItem[];
  required_key_position?: string;
  enemies?: EnemyDef[];
  three_star_runs?: number;
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
  mapData: LevelMapData;
  allowedCommands: AllowedCommand[];
  userStars?: number;
  userAttempts?: number;
}

export interface EnemyFrame {
  id: number;
  type: string;
  x: number;
  y: number;
  alive: boolean;
}

export interface GameFrame {
  tick: number;
  type: string;
  x: number;
  y: number;
  direction: Direction;
  hasKey: boolean;
  atExit: boolean;
  collectedCoins: number[];
  collectedKeys: string[];
  enemies: EnemyFrame[];
  message?: string | null;
  line?: number | null;
}

export interface ConsoleLine {
  line: number;
  text: string;
  kind: string;
}

export interface ExecutionResult {
  levelId: number;
  levelName: string;
  biome: Biome;
  hint?: string | null;
  width: number;
  height: number;
  entrance: string;
  exit: string;
  success: boolean;
  status: string;
  errorMessage?: string | null;
  errorLine?: number | null;
  stars: number;
  ticks: number;
  hasKey: boolean;
  atExit: boolean;
  collectedCoins: number;
  totalCoins: number;
  threeStarRuns: number;
  frames: GameFrame[];
  console: ConsoleLine[];
}

export interface SessionState {
  levelId: number;
  x: number;
  y: number;
  direction: Direction;
  hasKey: boolean;
  atExit: boolean;
  ticks: number;
  collectedCoins: number[];
  collectedKeys: string[];
  enemies: EnemyFrame[];
  totalCoins: number;
  completed: boolean;
}

export interface RunResponse {
  execution: ExecutionResult;
  state: SessionState;
  userStars: number;
  attemptNumber: number;
  unlockedCommands: AllowedCommand[];
}
