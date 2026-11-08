import { checkResponse } from '../../utils/auth';

const API_BASE_URL = 'http://localhost:7085/api';

// Справка о прохождении: поля ровно как их отдаёт сервер (LevelsController).
// hasResult:false - штатное "результата пока нет", все цифры тогда null.
export interface CertificateData {
  levelId: number;
  levelName?: string;
  hasResult: boolean;
  tickCount: number | null;
  linesCount: number | null;
  keysCollected: number | null;
  keysTotal?: number | null;
  score: number | null;
  difficulty?: string;
  fixedAt?: string | null;
}

export async function getCertificate(levelId: number): Promise<CertificateData> {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/levels/${levelId}/certificate`, { headers });
  const json = await checkResponse(response);
  return json.data as CertificateData;
}
