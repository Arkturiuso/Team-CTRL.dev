const API_BASE_URL = 'http://localhost:7085/api';

export interface Level {
  levelId: number;
  levelName: string | null;
  description: string | null;
  width: number | null;
  height: number | null;
  difficultyName: string;
  levelStatusName: string;
  created: string;
  mapData?: { biome?: string; three_star_runs?: number; rocks?: string[]; enemies?: unknown[] } | null;
}

export interface CreateLevelDto {
  levelName: string;
  description: string;
  mapData: any;
  difficultyId: number;
  levelStatusId: number;
  commandIds: number[];
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...options?.headers },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Ошибка сервера: ${response.status}`);
  }
  const json = await response.json();
  return json.data;
}

export async function getAllLevels(): Promise<Level[]> { return fetchApi<Level[]>('/level'); }
export async function deleteLevel(levelId: number): Promise<void> { await fetchApi<any>(`/level/${levelId}`, { method: 'DELETE' }); }
export async function createLevel(dto: CreateLevelDto): Promise<void> { await fetchApi<any>('/level', { method: 'POST', body: JSON.stringify(dto) }); }
export async function getDifficulties(): Promise<Array<{ difficultyId: number; name: string }>> { return fetchApi<Array<{ difficultyId: number; name: string }>>('/difficulty'); }
export async function getLevelStatuses(): Promise<Array<{ levelStatusId: number; name: string }>> { return fetchApi<Array<{ levelStatusId: number; name: string }>>('/levelstatus'); }
export async function getAllCommandsForLevel(): Promise<Array<{ commandId: number; name: string; syntax: string; description: string | null }>> { return fetchApi<Array<{ commandId: number; name: string; syntax: string; description: string | null }>>('/commands'); }
