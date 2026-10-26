import { checkResponse } from '../../utils/auth';

const API_BASE_URL = 'http://localhost:7085/api';

export interface Command {
  commandId: number;
  name: string;
  syntax: string;
  description: string;
}

export interface KnowledgeBaseResponse {
  unlocked: Command[];
  locked: Command[];
}

export async function getKnowledgeBase(): Promise<KnowledgeBaseResponse> {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Не авторизован');
  }

  const response = await fetch(`${API_BASE_URL}/knowledge-base`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const json = await checkResponse(response);
  return json.data;
}
