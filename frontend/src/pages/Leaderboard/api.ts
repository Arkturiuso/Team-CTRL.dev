// src/features/leaderboard/api.ts (или твой путь к этому файлу)

export interface LeaderboardItem {
  position: number;
  userId: number;
  login: string;
  totalStars: number;      // <-- ИСПРАВЛЕНО по документации
  levelsPassed: number;    // <-- ДОБАВЛЕНО по документации
}

export interface LeaderboardResponse {
  success: boolean;
  message?: string;
  data: {
    items: LeaderboardItem[];
    page: number;
    pageSize: number;
    totalPlayers: number;
    totalPages: number;
  };
  timestamp?: string;
}

const API_BASE_URL = 'http://localhost:7085';

export async function getLeaderboard(page: number = 1, pageSize: number = 10): Promise<LeaderboardResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/leaderboard?page=${page}&pageSize=${pageSize}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Ошибка сервера: ${response.status}`);
  }

  return await response.json();
}
