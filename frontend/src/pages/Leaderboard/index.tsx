import { useState, useEffect } from 'react';
import { Flex, Box, Text, Button } from '@radix-ui/themes';
import './LeaderboardPage.less';
import { getLeaderboard, type LeaderboardItem } from './api';
import { Sidebar } from '../../widgets/Sidebar';

const LeaderboardPage: React.FC = () => {
  const [leaders, setLeaders] = useState<LeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getLeaderboard(currentPage, 10);
        setLeaders(response.data.items || []);
        setTotalPages(response.data.totalPages);
        setTotalPlayers(response.data.totalPlayers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить таблицу лидеров');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentPage]);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const getMedalIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return null;
  };

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ height: '100vh' }}>
        <Text size="3" color="gray">Загрузка таблицы лидеров...</Text>
      </Flex>
    );
  }

  return (
    <Flex className="leaderboard-page-layout">
      <Sidebar />

      <Box className="leaderboard-page-content">
        <Flex
          align="center"
          justify="between"
          style={{ padding: '32px 40px', borderBottom: '1px solid #E5E7EB', marginBottom: '32px' }}
        >
          <Text size="7" weight="bold" style={{ fontSize: '32px' }}>Рейтинг игроков</Text>
          <Text size="3" color="gray">Всего игроков: {totalPlayers}</Text>
        </Flex>

        {error ? (
          <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
            <Text color="red" size="3">{error}</Text>
          </Flex>
        ) : leaders.length === 0 ? (
          <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
            <Text size="3" color="gray">Пока нет игроков в рейтинге</Text>
          </Flex>
        ) : (
          <Box style={{ padding: '0 40px 40px 40px' }}>
            <Box className="leaderboard-list">
              {leaders.map((leader) => (
                <Flex
                  key={leader.userId}
                  className={`leaderboard-item ${leader.position <= 3 ? 'leaderboard-item--top' : ''}`}
                  align="center"
                  justify="between"
                >
                  <Flex align="center" gap="4">
                    <Flex className="leaderboard-position" align="center" justify="center">
                      {getMedalIcon(leader.position) || (
                        <Text size="4" weight="bold">{leader.position}</Text>
                      )}
                    </Flex>

                    <Flex direction="column" gap="1">
                      <Text size="3" weight="medium" style={{ fontSize: '16px' }}>{leader.login}</Text>
                      <Text size="2" color="gray">Пройдено уровней: {leader.levelsPassed}</Text>
                    </Flex>
                  </Flex>

                  <Flex direction="column" align="end" gap="1">
                    <Text size="4" weight="bold" style={{ color: '#3B82F6', fontSize: '20px' }}>
                      {leader.totalStars} ★
                    </Text>
                    <Text size="2" color="gray">всего звёзд</Text>
                  </Flex>
                </Flex>
              ))}
            </Box>

            {totalPages > 1 && (
              <Flex justify="center" gap="4" mt="6">
                <Button variant="outline" size="3" onClick={handlePrevious} disabled={currentPage === 1}>
                  ← Назад
                </Button>
                <Text size="3" style={{ padding: '8px 16px' }}>Страница {currentPage} из {totalPages}</Text>
                <Button variant="outline" size="3" onClick={handleNext} disabled={currentPage === totalPages}>
                  Вперёд →
                </Button>
              </Flex>
            )}
          </Box>
        )}
      </Box>
    </Flex>
  );
};

export default LeaderboardPage;
