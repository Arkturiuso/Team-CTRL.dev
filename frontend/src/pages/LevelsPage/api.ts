export interface Level {
  levelId: number;
  levelName: string;
  description: string;
  difficultyId: number;
  difficultyName: string;
  levelStatusId: number;
  levelStatusName: string;
  created: string;
}

export interface LevelsResponse {
  success: boolean;
  message?: string;
  data: Level[];
  timestamp?: string;
}

const API_BASE_URL = 'http://localhost:7085';

export async function getLevels(): Promise<LevelsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/Level`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.message || `Ошибка сервера: ${response.status}`;
    throw new Error(errorMessage);
  }

  return await response.json();
}
