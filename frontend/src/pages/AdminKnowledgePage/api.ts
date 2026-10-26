const API_BASE_URL = 'http://localhost:7085/api';

export interface Command {
  commandId: number;
  name: string;
  syntax: string;
  description: string | null;
}

export async function getAllCommands(): Promise<Command[]> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${API_BASE_URL}/knowledge-base/all`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('Доступ запрещён. Требуются права администратора.');
  }

  if (!response.ok) {
    throw new Error(`Ошибка сервера: ${response.status}`);
  }

  const json = await response.json();
  return json.data || [];
}
