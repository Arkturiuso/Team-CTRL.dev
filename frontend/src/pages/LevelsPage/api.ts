import type { Level } from './types';

export interface LevelsResponse {
  success: boolean;
  message?: string;
  data: Level[];
  timestamp?: string;
}

const API_BASE_URL = 'http://localhost:7085';

export async function getLevels(): Promise<LevelsResponse> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${API_BASE_URL}/api/level`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Ошибка сервера: ${response.status}`);
  }

  return await response.json();
}
