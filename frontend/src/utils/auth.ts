export const handleAuthError = () => {
  const currentPath = window.location.pathname + window.location.search;
  localStorage.setItem('returnUrl', currentPath);
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
};

export const getReturnUrl = (): string | null => {
  const url = localStorage.getItem('returnUrl');
  localStorage.removeItem('returnUrl');
  return url;
};

export const checkResponse = async (response: Response): Promise<any> => {
  if (response.status === 401) {
    handleAuthError();
    throw new Error('Сессия истекла');
  }
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка сервера: ${response.status}. ${errorText}`);
  }
  const json = await response.json();
  if (!json.success) {
    throw new Error(json.message || 'Ошибка запроса');
  }
  return json;
};
