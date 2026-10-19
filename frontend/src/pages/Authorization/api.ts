export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    userId: number;
    login: string;
    role: string;
    tokens?: {
      refreshToken: string;
      expiresAt: string;
    };
  };
  timestamp?: string;
}

const API_BASE_URL = 'http://localhost:7085';

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/Auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.message || `Ошибка сервера: ${response.status}`;

    throw new Error(errorMessage);
  }

  return await response.json();
}
