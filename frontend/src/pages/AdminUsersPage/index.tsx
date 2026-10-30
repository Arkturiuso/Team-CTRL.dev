import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Text, Flex, Badge, Button } from '@radix-ui/themes';
import { Sidebar } from '../../widgets/Sidebar';
import { getAllUsers, type AdminUser } from './api';
import { ROUTES } from '../../routes';

const API_BASE_URL = 'http://localhost:7085/api';

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const userId =
            payload.NameIdentifier ||
            payload.nameidentifier ||
            payload.userId ||
            payload.sub ||
            payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
          if (userId) setCurrentUserId(Number(userId));
        }
      } catch (err) {
        console.error('Ошибка декодирования JWT:', err);
      }
    }
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ✅ ИСПРАВЛЕННАЯ функция разблокировки/блокировки с детальной обработкой ошибок
  const handleToggleStatus = async (userId: number, currentStatusId: number) => {
    const newStatusId = currentStatusId === 1 ? 2 : 1;
    const action = newStatusId === 2 ? 'заблокировать' : 'разблокировать';

    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ accountStatusId: newStatusId }),
      });

      // ✅ Детальная обработка ошибок
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Ошибка сервера: ${response.status}`;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.Message || errorText;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        console.error(`Не удалось ${action} пользователя:`, {
          userId,
          newStatusId,
          status: response.status,
          error: errorMessage
        });

        alert(`Не удалось ${action} пользователя:\n${errorMessage}`);
        return;
      }

      // ✅ Успех - перезагружаем список
      await loadUsers();
    } catch (err) {
      console.error(`Ошибка при ${action} пользователя:`, err);
      alert(`Ошибка сети при попытке ${action} пользователя. Проверьте подключение к серверу.`);
    }
  };

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ height: '100vh', background: '#F9FAFB' }}>
        <Text size="3" color="gray">Загрузка списка пользователей...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex style={{ minHeight: '100vh', background: '#F9FAFB' }}>
        <Sidebar />
        <Flex align="center" justify="center" style={{ flex: 1 }}>
          <Box style={{ background: 'white', padding: '32px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <Text color="red" size="4" weight="bold" style={{ display: 'block', marginBottom: '12px' }}>Ошибка доступа</Text>
            <Text color="gray" size="2">{error}</Text>
            <button onClick={() => navigate(ROUTES.USER.LEVELS)} style={{ marginTop: '16px', padding: '8px 20px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
              На главную
            </button>
          </Box>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Sidebar />

      <Box style={{ flex: 1, padding: '48px', overflowY: 'auto', maxWidth: '1200px' }}>
        <Flex align="center" justify="between" style={{ marginBottom: '40px' }}>
          <Box>
            <Text size="8" weight="bold" style={{ fontSize: '32px', color: '#111827', display: 'block', marginBottom: '8px' }}>
              Управление пользователями
            </Text>
            <Text size="3" color="gray">Просмотр и блокировка аккаунтов</Text>
          </Box>
          <Badge color="orange" variant="soft" size="3" style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 600 }}>
            Режим администратора
          </Badge>
        </Flex>

        <Box style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <Flex align="center" justify="between" style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: '2px solid #F3F4F6' }}>
            <Text size="5" weight="bold" style={{ fontSize: '20px', color: '#111827' }}>
              Все зарегистрированные пользователи
            </Text>
            <Badge color="gray" variant="soft" size="3" style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '14px' }}>
              Всего: {users.length}
            </Badge>
          </Flex>

          {users.length === 0 ? (
            <Flex justify="center" align="center" style={{ minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
              <Text size="7">👥</Text>
              <Text size="3" color="gray" weight="medium">Пользователи не найдены</Text>
            </Flex>
          ) : (
            <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {users.map((user) => {
                const isActive = user.accountStatusId === 1;
                const isAdmin = user.role === 'admin';
                const isCurrentUser = currentUserId !== null && user.userId === currentUserId;

                return (
                  <Box
                    key={user.userId}
                    style={{
                      background: isCurrentUser
                        ? '#EFF6FF'
                        : isActive
                          ? '#FFFFFF'
                          : '#FEF2F2',
                      border: isCurrentUser
                        ? '2px solid #3B82F6'
                        : `2px solid ${isActive ? '#E5E7EB' : '#FECACA'}`,
                      borderRadius: '12px',
                      padding: '24px 28px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      boxShadow: isCurrentUser ? '0 4px 16px rgba(59, 130, 246, 0.15)' : 'none',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentUser && isActive) {
                        e.currentTarget.style.borderColor = '#3B82F6';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentUser) {
                        e.currentTarget.style.borderColor = isActive ? '#E5E7EB' : '#FECACA';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {isCurrentUser && (
                      <Box style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '20px',
                        background: '#3B82F6',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        boxShadow: '0 2px 6px rgba(59, 130, 246, 0.4)',
                        letterSpacing: '0.5px'
                      }}>
                        ВЫ
                      </Box>
                    )}

                    <Box style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: isAdmin
                        ? 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)'
                        : (isActive ? '#DBEAFE' : '#FECACA'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 700,
                      color: isAdmin ? 'white' : (isActive ? '#1E40AF' : '#991B1B'),
                      flexShrink: 0,
                      boxShadow: isCurrentUser
                        ? '0 0 0 3px rgba(59, 130, 246, 0.3)'
                        : (isAdmin ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none')
                    }}>
                      {user.login.charAt(0).toUpperCase()}
                    </Box>

                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Flex align="center" gap="10px" style={{ marginBottom: '6px', flexWrap: 'wrap' }}>
                        <Text size="4" weight="bold" style={{
                          color: isCurrentUser ? '#1E40AF' : '#111827',
                          fontSize: '16px'
                        }}>
                          {user.login}
                        </Text>
                        {isAdmin && (
                          <Badge color="purple" variant="surface" size="2" style={{ padding: '4px 12px', borderRadius: '12px', fontWeight: 600, fontSize: '12px' }}>
                            Админ
                          </Badge>
                        )}
                      </Flex>
                      <Text size="2" color="gray" style={{ fontSize: '13px' }}>
                        Регистрация: {new Date(user.registration).toLocaleDateString('ru-RU')}
                      </Text>
                    </Box>

                    <Flex align="center" gap="16px" style={{ flexShrink: 0 }}>
                      <Badge
                        color={isActive ? 'green' : 'red'}
                        variant="surface"
                        size="3"
                        style={{ padding: '8px 18px', borderRadius: '20px', fontWeight: 600, fontSize: '14px', minWidth: '110px', textAlign: 'center' }}
                      >
                        {isActive ? 'Активен' : 'Заблокирован'}
                      </Badge>

                      {isCurrentUser ? (
                        <Button
                          size="3"
                          variant="soft"
                          color="gray"
                          disabled
                          style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            fontSize: '14px',
                            minWidth: '140px',
                            cursor: 'not-allowed',
                            opacity: 0.5
                          }}
                        >
                          Это вы
                        </Button>
                      ) : (
                        <Button
                          size="3"
                          variant={isActive ? 'soft' : 'solid'}
                          color={isActive ? 'red' : 'green'}
                          onClick={() => handleToggleStatus(user.userId, user.accountStatusId)}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            fontSize: '14px',
                            minWidth: '140px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {isActive ? 'Заблокировать' : 'Разблокировать'}
                        </Button>
                      )}
                    </Flex>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>
    </Flex>
  );
};

export default AdminUsersPage;
