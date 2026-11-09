import { checkResponse, handleAuthError } from '../../utils/auth';
import type { Direction, ExecutionResult, LevelInfo, RunState } from './types';

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

const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left'];

interface RawRunState {
  robot?: { cell?: unknown; direction?: unknown };
  cell?: unknown;
  direction?: unknown;
  keysCollected?: unknown;
  keysTotal?: unknown;
  coinsCollected?: unknown;
  coinsTotal?: unknown;
  collectedCoinCells?: unknown;
}

const toNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

// Нормализуем состояние робота: сервер может прислать его плоско или в { robot }.
const normalizeState = (data: unknown): RunState | null => {
  if (!data || typeof data !== 'object') return null;
  const raw = data as RawRunState;
  const robot = (raw.robot && typeof raw.robot === 'object' ? raw.robot : raw) as {
    cell?: unknown;
    direction?: unknown;
  };
  const cell = typeof robot.cell === 'string' && robot.cell.trim() !== '' ? robot.cell : null;
  const rawDirection = String(robot.direction ?? '').toLowerCase();
  const direction = DIRECTIONS.includes(rawDirection as Direction)
    ? (rawDirection as Direction)
    : 'right';
  if (!cell) return null;
  return {
    robot: { cell, direction },
    keysCollected: toNumber(raw.keysCollected),
    keysTotal: toNumber(raw.keysTotal),
    coinsCollected: toNumber(raw.coinsCollected),
    coinsTotal: toNumber(raw.coinsTotal),
    collectedCoinCells: Array.isArray(raw.collectedCoinCells)
      ? raw.collectedCoinCells.filter((cellName): cellName is string => typeof cellName === 'string')
      : [],
  };
};

// Состояние текущей сессии уровня: откуда робот продолжит после неудачного запуска.
// Пока образ API не обновлён, эндпоинта нет - тогда просто рисуем вход.
export async function getRunState(levelId: number): Promise<RunState | null> {
  const response = await fetch(`${API_BASE_URL}/execution/state/${levelId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    handleAuthError();
    throw new Error('Сессия истекла - войдите заново');
  }
  if (!response.ok) return null;

  const json = await checkResponse(response);
  return normalizeState(json.data);
}

// Сброс сессии уровня: робот на входе, ключи и монеты восстановлены, код не трогаем.
export async function resetRun(levelId: number, preview: boolean): Promise<RunState | null> {
  const response = await fetch(
    `${API_BASE_URL}/execution/reset/${levelId}?preview=${preview ? 'true' : 'false'}`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    },
  );

  if (response.status === 401) {
    handleAuthError();
    throw new Error('Сессия истекла - войдите заново');
  }
  // Старый образ API не знает сброса: сбрасываем только локально, без ошибки.
  if (response.status === 404 || response.status === 405 || response.status === 501) return null;

  const json = await checkResponse(response);
  return normalizeState(json.data);
}
