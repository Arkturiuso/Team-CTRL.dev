export interface Level {
  levelId: number;
  levelName: string;
  description: string | null;
  width: number | null;
  height: number | null;
  difficultyId: number;
  difficultyName: string;
  levelStatusId: number;
  levelStatusName: string;
  created: string;
  userStars: number;
  mapData?: {
    exit: string;
    keys: Array<{ id: number; position: string }>;
    walls: Array<{ id: number; side1: string; side2: string }>;
    width: number;
    height: number;
    entrance: string;
    keys_count: number;
    level_name: string;
    description: string;
  };
}
