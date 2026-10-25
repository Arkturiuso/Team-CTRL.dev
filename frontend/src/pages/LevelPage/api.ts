const API_BASE_URL = 'http://localhost:7085';

// Получение данных уровня по ID
export async function getLevel(levelId: number) {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${API_BASE_URL}/api/level/${levelId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Ошибка сервера: ${response.status}`);
  }

  return await response.json();
}

// Заглушка для выполнения кода на бэкенде (пока не реализовано)
// Когда бэкенд будет готов, раскомментируй и используй вместо локальной симуляции
export async function executeCodeOnServer(levelId: number, code: string[]) {
  const token = localStorage.getItem('accessToken');

  // TODO: заменить на реальный запрос, когда бэкенд будет готов
  /*
  const response = await fetch(`${API_BASE_URL}/api/level/${levelId}/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error(`Ошибка сервера: ${response.status}`);
  }

  return await response.json();
  */

  // Пока используем локальную симуляцию
  await new Promise(resolve => setTimeout(resolve, 800));

  const VALID_COMMANDS = ['move()', 'turn_left()', 'turn_right()', 'collect_key()'];

  return code.map((cmd, index) => {
    const trimmed = cmd.trim();
    if (!trimmed) return { line: index + 1, command: trimmed, success: true };
    const isValid = VALID_COMMANDS.includes(trimmed);
    return {
      line: index + 1,
      command: trimmed,
      success: isValid,
      error: isValid ? undefined : `Неизвестная команда: ${trimmed}`
    };
  });
}
