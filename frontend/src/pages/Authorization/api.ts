// src/pages/Authorization/api.ts

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
      accessToken: string; 
      AccessToken: string;
      refreshToken: string;
      RefreshToken: string;
      expiresAt: string;
    };
  };
  timestamp?: string;
}

const API_BASE_URL = 'http://localhost:7085';

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Ошибка сервера: ${response.status}`);
  }

  const result = await response.json();

  console.log("=== ПОЛНЫЙ ОТВЕТ TOKENS ОТ БЕКЕНДА ===", result.data?.tokens);

  const jwtToken = result.data?.tokens?.accessToken || result.data?.tokens?.AccessToken;
  const refreshTok = result.data?.tokens?.refreshToken || result.data?.tokens?.RefreshToken;

  if (jwtToken && jwtToken.startsWith('eyJ')) {
    localStorage.setItem('accessToken', jwtToken);
    console.log("JWT Access Token успешно сохранен!");
  } else {
    console.error("ОШИБКА: JWT токен не найден или не начинается на 'eyJ'!");
    console.error("Полученное значение:", jwtToken);
  }

  if (refreshTok) {
    localStorage.setItem('refreshToken', refreshTok);
  }

  if (result.data) {
    const { tokens, ...userData } = result.data;
    localStorage.setItem('user', JSON.stringify(userData));
  }

  return result;
}
