import { checkResponse, handleAuthError } from '../../utils/auth';
import type { ExecutionResult, LevelInfo } from './types';

const API_BASE_URL = 'http://localhost:7085/api';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export async function getLevel(levelId: number): Promise<LevelInfo> {
  const response = await fetch(`${API_BASE_URL}/level/${levelId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const json = await checkResponse(response);
  const levelData = json.data;
  // Сервер иногда отдаёт mapData строкой - распаковываем, чтобы доске был объект.
  if (typeof levelData.mapData === 'string') {
    levelData.mapData = JSON.parse(levelData.mapData);
  }
  return levelData as LevelInfo;
}

// Прогон кода: сервер считает метрики и возвращает кадры для пошагового реплея.
export async function runCode(
  levelId: number,
  code: string,
  preview: boolean,
): Promise<ExecutionResult> {
  const response = await fetch(`${API_BASE_URL}/execution/run`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ levelId, code, preview }),
  });

  if (response.status === 401) {
    handleAuthError();
    throw new Error('Сессия истекла - войдите заново');
  }

  const json = await checkResponse(response);
  return json.data as ExecutionResult;
}
