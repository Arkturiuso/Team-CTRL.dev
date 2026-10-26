export interface RecentAttempt {
  levelId: number;
  levelTitle: string;
  submittedAt: string;
  statusName: string;
  tickCount: number;
  isSuccess: boolean;
}

export interface ProfileData {
  user: {
    login: string;
    registrationDate: string;
    accountStatusName: string;
    role: string;
    totalStars: number;
    levelsPassedCount: number;
  };
  stats: {
    totalScore: number;
    levelsPassed: number;
    lastUpdate: string;
  };
  rankPosition: number;
  recentAttempts: RecentAttempt[];
}

export interface ProfileResponse {
  success: boolean;
  message?: string;
  data: ProfileData;
  timestamp?: string;
}

const API_BASE_URL = 'http://localhost:7085';

export async function getProfile(): Promise<ProfileResponse> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
    throw new Error('Сессия истекла или аккаунт заблокирован');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Ошибка сервера: ${response.status}`);
  }

  return await response.json();
}

export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/auth/login';
}
