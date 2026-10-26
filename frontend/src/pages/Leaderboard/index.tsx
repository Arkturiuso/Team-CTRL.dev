import { useState, useEffect } from 'react';
import { Box, Text, Flex } from '@radix-ui/themes';
import { Sidebar } from '../../widgets/Sidebar';

interface LeaderboardEntry {
  position: number;
  userId: number;
  login: string;
  totalStars: number;
  levelsPassed: number;
}

const LeaderboardPage: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [inputPage, setInputPage] = useState('1');
  const pageSize = 10;

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

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `http://localhost:7085/api/leaderboard?page=${page}&pageSize=${pageSize}`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );

        if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);

        const json = await response.json();
        if (!json.success) throw new Error(json.message || 'Ошибка загрузки рейтинга');

        const data = json.data;
        setEntries(data?.items || []);
        setTotalPages(data?.totalPages || 1);
        setTotalPlayers(data?.totalPlayers || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить рейтинг');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [page]);

  const getAvatarColor = (position: number) => {
    if (position === 1) return '#FFD700';
    if (position === 2) return '#C0C0C0';
    if (position === 3) return '#CD7F32';
    return '#E5E7EB';
  };

  const handleGoToPage = () => {
    const num = parseInt(inputPage, 10);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      setPage(num);
    } else {
      setInputPage(String(page));
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleGoToPage();
  };

  useEffect(() => {
    setInputPage(String(page));
  }, [page]);

  if (isLoading) {
    return (
      <Flex style={{ minHeight: '100vh', background: '#F9FAFB' }}>
        <Sidebar />
        <Flex align="center" justify="center" style={{ flex: 1 }}>
          <Text size="3" color="gray">Загрузка рейтинга...</Text>
        </Flex>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex style={{ minHeight: '100vh', background: '#F9FAFB' }}>
        <Sidebar />
        <Flex align="center" justify="center" style={{ flex: 1 }}>
          <Box style={{
            background: 'white', padding: '32px', borderRadius: '12px',
            textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <Text color="red" size="4" weight="bold" style={{ display: 'block', marginBottom: '12px' }}>
              Ошибка загрузки
            </Text>
            <Text color="gray" size="2">{error}</Text>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px', padding: '8px 20px',
                background: '#3B82F6', color: 'white', border: 'none',
                borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500
              }}
            >
              Попробовать снова
            </button>
          </Box>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Sidebar />

      <Box style={{ flex: 1, padding: '40px 48px' }}>
        <Flex align="center" justify="between" style={{ marginBottom: '32px' }}>
          <Text size="7" weight="bold" style={{ color: '#111827' }}>
            Рейтинг игроков
          </Text>
          <Text size="3" style={{ color: '#6B7280' }}>
            Всего игроков: {totalPlayers}
          </Text>
        </Flex>

        <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {entries.map((entry) => {
            const isTopThree = entry.position <= 3;
            const avatarColor = getAvatarColor(entry.position);
            const isCurrentUser = currentUserId !== null && Number(entry.userId) === currentUserId;

            return (
              <Box
                key={entry.userId}
                style={{
                  background: isCurrentUser ? '#EFF6FF' : (isTopThree ? '#FFFBEB' : 'white'),
                  border: isCurrentUser ? '2px solid #3B82F6' : (isTopThree ? '2px solid #FCD34D' : '1px solid #E5E7EB'),
                  borderRadius: '16px',
                  padding: '20px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  boxShadow: isCurrentUser ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 2px 4px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {isCurrentUser && (
                  <Box style={{
                    position: 'absolute', top: '-10px', right: '20px',
                    background: '#3B82F6', color: 'white',
                    padding: '4px 12px', borderRadius: '12px',
                    fontSize: '12px', fontWeight: 600,
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                  }}>
                    Вы
                  </Box>
                )}

                <Box style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: isCurrentUser ? '#3B82F6' : avatarColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', fontWeight: 700, color: 'white', flexShrink: 0
                }}>
                  {entry.position}
                </Box>

                <Box style={{ flex: 1 }}>
                  <Text size="4" weight="bold" style={{
                    color: isCurrentUser ? '#1E40AF' : '#111827',
                    display: 'block', marginBottom: '4px'
                  }}>
                    {entry.login}
                    {isCurrentUser && (
                      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#3B82F6', fontWeight: 500 }}>
                        (вы)
                      </span>
                    )}
                  </Text>
                  <Text size="2" style={{ color: '#6B7280' }}>
                    Пройдено уровней: {entry.levelsPassed}
                  </Text>
                </Box>

                <Box style={{ textAlign: 'right', flexShrink: 0 }}>
                  <Flex align="center" justify="end" gap="1" style={{ marginBottom: '4px' }}>
                    <Text size="5" weight="bold" style={{ color: isCurrentUser ? '#1E40AF' : '#111827' }}>
                      {entry.totalStars}
                    </Text>
                    <span style={{ fontSize: '22px', lineHeight: 1 }}>⭐</span>
                  </Flex>
                  <Text size="2" style={{ color: '#6B7280' }}>
                    всего звёзд
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Box>

        {entries.length === 0 && (
          <Flex justify="center" align="center" style={{ minHeight: '300px' }}>
            <Text size="3" color="gray">Пока нет игроков в рейтинге.</Text>
          </Flex>
        )}

        {/* ✅ Пагинация с нормальными отступами */}
        {entries.length > 0 && (
          <Box style={{
            marginTop: '48px',
            paddingTop: '24px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Flex align="center" style={{ gap: '16px' }}>
              {/* Кнопка "Назад" */}
              <button
                onClick={() => { if (page > 1) setPage(page - 1); }}
                disabled={page <= 1}
                style={{
                  padding: '12px 24px',
                  background: page <= 1 ? '#F3F4F6' : 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { if (page > 1) e.currentTarget.style.background = '#F9FAFB'; }}
                onMouseLeave={(e) => { if (page > 1) e.currentTarget.style.background = 'white'; }}
              >
                ← Назад
              </button>

              {/* Поле ввода страницы с отступами */}
              <Flex align="center" style={{ gap: '12px' }}>
                <Text size="3" style={{ color: '#6B7280', whiteSpace: 'nowrap' }}>
                  Страница:
                </Text>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={inputPage}
                  onChange={(e) => setInputPage(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onBlur={handleGoToPage}
                  style={{
                    width: '70px',
                    padding: '12px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    outline: 'none',
                    color: '#111827',
                    background: 'white',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; }}
                />
                <Text size="3" style={{ color: '#6B7280', whiteSpace: 'nowrap' }}>
                  из {totalPages}
                </Text>
                <button
                  onClick={handleGoToPage}
                  style={{
                    padding: '12px 20px',
                    background: '#3B82F6',
                    border: '1px solid #3B82F6',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'white',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#2563EB'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#3B82F6'; }}
                >
                  OK
                </button>
              </Flex>

              {/* Кнопка "Вперёд" */}
              <button
                onClick={() => { if (page < totalPages) setPage(page + 1); }}
                disabled={page >= totalPages}
                style={{
                  padding: '12px 24px',
                  background: page >= totalPages ? '#F3F4F6' : 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.5 : 1,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { if (page < totalPages) e.currentTarget.style.background = '#F9FAFB'; }}
                onMouseLeave={(e) => { if (page < totalPages) e.currentTarget.style.background = 'white'; }}
              >
                Вперёд →
              </button>
            </Flex>
          </Box>
        )}
      </Box>
    </Flex>
  );
};

export default LeaderboardPage;
