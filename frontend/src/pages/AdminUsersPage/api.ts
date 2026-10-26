const API_BASE_URL = 'http://localhost:7085/api';

export interface AdminUser {
  userId: number;
  login: string;
  role: string;
  accountStatusId: number;
  accountStatusName: string;
  registration: string;
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${API_BASE_URL}/users`, {
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

export async function updateUserStatus(userId: number, accountStatusId: number): Promise<void> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ accountStatusId }),
  });

  if (!response.ok) {
    throw new Error(`Ошибка сервера: ${response.status}`);
  }
}
