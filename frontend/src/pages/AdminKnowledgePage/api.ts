const API_BASE_URL = 'http://localhost:7085/api';

export interface Command {
  commandId: number;
  name: string;
  syntax: string;
  description: string | null;
}

export async function getAllCommands(): Promise<Command[]> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${API_BASE_URL}/commands`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Ошибка сервера: ${response.status}`);
  }

  const json = await response.json();
  return json.data || [];
}

export async function createCommand(data: { name: string; syntax: string; description?: string }): Promise<Command> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${API_BASE_URL}/commands`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Ошибка сервера: ${response.status}`);
  }

  const json = await response.json();
  return json.data;
}

export async function updateCommand(commandId: number, data: { syntax?: string; description?: string }): Promise<void> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${API_BASE_URL}/commands/${commandId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Ошибка сервера: ${response.status}`);
  }
}

export async function deleteCommand(commandId: number): Promise<void> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${API_BASE_URL}/commands/${commandId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Ошибка сервера: ${response.status}`);
  }
}
