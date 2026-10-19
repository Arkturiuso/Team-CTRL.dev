// src/pages/LevelsPage/LevelsPage.tsx
import { useState, useEffect } from 'react';
import { Flex, Box, Text, Progress } from '@radix-ui/themes';
import './LevelsPage.less';
import { LevelCard } from './components/LevelCard';
import { getLevels, type Level } from './api';

const LevelsPage: React.FC = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getLevels();
        setLevels(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить уровни');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLevels();
  }, []);

  const completedLevels = levels.filter(
    (level) => level.levelStatusName === 'Пройден' || level.levelStatusName === 'Доступен'
  ).length;

  const handleLevelClick = (level: Level) => {
    console.log('Выбран уровень:', level.levelName);
  };

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ height: '100vh' }}>
        <Text size="3" color="gray">
          Загрузка уровней...
        </Text>
      </Flex>
    );
  }

  return (
    <Flex className="levels-page" direction="column" gap="6">
      <Flex align="center" justify="between" className="levels-header">
        <Text size="7" weight="bold">
          Выберите уровень
        </Text>
        <Flex direction="column" gap="1" align="end">
          <Text size="2" color="gray">
            Пройдено: {completedLevels}/{levels.length}
          </Text>
          <Progress
            value={(completedLevels / levels.length) * 100}
            size="2"
            style={{ width: '200px' }}
          />
        </Flex>
      </Flex>

      {error ? (
        <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
          <Text color="red" size="3">
            {error}
          </Text>
        </Flex>
      ) : (
        <Box className="levels-grid">
          {levels.map((level) => (
            <LevelCard
              key={level.levelId}
              level={level}
              onClick={() => handleLevelClick(level)}
            />
          ))}
        </Box>
      )}

      <Flex justify="center" mt="4">
      </Flex>
    </Flex>
  );
};

export default LevelsPage;
