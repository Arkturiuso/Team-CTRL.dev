export interface RegisterRequest {
  login: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  data?: any;
  timestamp?: string;
}

const API_BASE_URL = 'http://localhost:7085';

export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Ошибка сервера: ${response.status}`);
  }

  return await response.json();
}
