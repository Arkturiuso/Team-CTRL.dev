import { checkResponse } from '../../utils/auth';

const API_BASE_URL = 'http://localhost:7085/api';

// Попытка: имена полей ровно как их отдаёт сервер (AttemptsController).
export interface AttemptItem {
  attemptId: number | string;
  levelId: number;
  levelName?: string;
  sourceCode: string;
  submitted: string;
  status: 'in_progress' | 'success' | 'error' | string;
  ticks: number;
  linesCount: number;
}

export interface AttemptsPageResponse {
  items: AttemptItem[];
  page: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

export async function getAttempts(levelId: number | null, page: number): Promise<AttemptsPageResponse> {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const params = new URLSearchParams();
  if (levelId) params.set('levelId', String(levelId));
  params.set('page', String(page));

  const response = await fetch(`${API_BASE_URL}/attempts?${params.toString()}`, { headers });
  const json = await checkResponse(response);
  return json.data as AttemptsPageResponse;
}
