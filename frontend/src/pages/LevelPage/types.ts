export type Biome = 'forest' | 'snow' | 'desert' | 'cave' | 'swamp' | 'volcano';
export type Direction = 'up' | 'right' | 'down' | 'left';
export type Terrain = 'ice' | 'mud';

export interface MapItem {
  id: number;
  position: string;
  fake?: boolean;
}

export interface BossAiConfig {
  move_every?: number;
  flee_after_hit?: boolean;
  rage_at_hp?: number;
  min_distance?: number;
}

export interface BossHazardConfig {
  kind?: HazardKind;
  every?: number;
  fuse?: number;
  damage?: number;
  linger?: number;
}

export interface BossConfig {
  name: string;
  title?: string;
  avatar?: string;
  hp: number;
  player_hp?: number;
  attack_range?: number;
  cooldown?: number;
  fake_key_damage?: number;
  shot_damage?: number;
  ability?: string;
  intro?: string[];
  key_line?: string;
  fake_key_line?: string;
  hit_line?: string;
  defeat_line?: string;
  player_defeat_line?: string;
  charge_line?: string;
  shot_line?: string;
  miss_line?: string;
  mark_line?: string;
  mark_shot_line?: string;
  mark_miss_line?: string;
  key_hint_line?: string;
  relocate_line?: string;
  step_line?: string;
  rage_line?: string;
  hazard_line?: string;
  ai?: BossAiConfig;
  hazard?: BossHazardConfig;
}

export type HazardKind = 'tree' | 'sandstorm' | 'avalanche' | 'lava';
export type HazardState = 'warn' | 'impact';

export interface HazardFrame {
  id: number;
  kind: HazardKind;
  cells: string[];
  state: HazardState;
  fuse: number;
  damage: number;
}

export interface EnemyDef {
  id: number;
  type: string;
  position: string;
  patrol: string[];
  move_every: number;
  hp?: number;
  boss?: boolean;
  carries_key?: boolean;
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
  alternate_exit?: string;
  boss?: BossConfig;
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
  hp: number;
  maxHp: number;
  boss: boolean;
  hasKey: boolean;
  shielded: boolean;
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
  keyPosition?: string | null;
  fakeKeys?: string[];
  bossAim?: string | null;
  bossMark?: string | null;
  hazards?: HazardFrame[];
  bossFrom?: string | null;
  bossTo?: string | null;
  exit?: string;
  playerHp?: number;
  playerMaxHp?: number;
  attackCooldown?: number;
  bossDefeated?: boolean;
  message?: string | null;
  speaker?: string | null;
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
  crashed: boolean;
  errorInCode: boolean;
  bossDefeated: boolean;
  defeated: boolean;
  playerHp: number;
  playerMaxHp: number;
  attackCooldown: number;
  keysCollected: number;
  keysTotal: number;
  fakeKeyHits: number;
  bossName?: string | null;
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
  keyPosition?: string | null;
  fakeKeys: string[];
  bossHint?: string | null;
  bossAim?: string | null;
  bossMark?: string | null;
  bossCharging?: boolean;
  hazards?: HazardFrame[];
  bossTarget?: string | null;
  bossRaging?: boolean;
  exit: string;
  playerHp: number;
  playerMaxHp: number;
  attackCooldown: number;
  keysCollected: number;
  keysTotal: number;
  bossDefeated: boolean;
  totalCoins: number;
  completed: boolean;
  attemptNumber: number;
}

export interface RunResponse {
  execution: ExecutionResult;
  state: SessionState;
  userStars: number;
  attemptNumber: number;
  unlockedCommands: AllowedCommand[];
}

export type BossFxKind = 'charge' | 'shot' | 'miss' | 'hit' | 'defeat' | 'touch' | 'step';

export interface BossFx {
  kind: BossFxKind;
  id: number;
  from?: string;
  to?: string;
  damage?: number;
}
