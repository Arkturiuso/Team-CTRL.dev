import { checkResponse, handleAuthError } from '../../utils/auth';

const API_BASE_URL = 'http://localhost:7085/api';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export async function getLevel(levelId: number): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/level/${levelId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const json = await checkResponse(response);
  const levelData = json.data;
  if (typeof levelData.mapData === 'string') {
    levelData.mapData = JSON.parse(levelData.mapData);
  }
  return levelData;
}

export interface AttemptPayload {
  levelId: number;
  commands: string[];
  sourceCode: string;
  tickCount: number;
  totalScore: number;
  status: 'success' | 'error' | 'in_progress';
  errorMessage?: string;
}

export async function submitAttempt(data: AttemptPayload): Promise<any> {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    handleAuthError();
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/attempt`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (response.status === 401) {
    handleAuthError();
    return null;
  }

  if (!response.ok) return null;
  const json = await response.json();
  return json;
}
