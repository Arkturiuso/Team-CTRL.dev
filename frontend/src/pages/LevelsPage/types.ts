export interface LevelMapData {
  biome?: string;
  width?: number;
  height?: number;
  entrance?: string;
  exit?: string;
  rocks?: string[];
  walls?: Array<{ id?: number; side1: string; side2: string }>;
  coins?: Array<{ id: number; position: string }>;
  keys?: Array<{ id: number; position: string }>;
  required_key_position?: string;
  enemies?: Array<{ id: number; type: string; position: string }>;
  terrain?: Record<string, string>;
  three_star_runs?: number;
  description?: string;
  hint?: string;
}

export interface Level {
  levelId: number;
  levelName: string;
  description: string;
  width: number | null;
  height: number | null;
  difficultyId: number;
  difficultyName: string;
  levelStatusId: number;
  levelStatusName: string;
  created: string;
  userStars: number;
  mapData?: LevelMapData | null;
  allowedCommands: Array<{
    commandId: number;
    name: string;
    syntax: string;
    description: string;
  }>;
  newCommands: Array<{
    commandId: number;
    name: string;
    syntax: string;
    description: string;
  }>;
}
