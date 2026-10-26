import { checkResponse } from '../../utils/auth';

const API_BASE_URL = 'http://localhost:7085/api';

export async function getLevels() {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/level`, {
    method: 'GET',
    headers,
  });

  const json = await checkResponse(response);
  return json;
}
