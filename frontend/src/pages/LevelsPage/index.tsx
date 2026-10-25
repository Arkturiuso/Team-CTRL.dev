// src/pages/LevelsPage/index.tsx
import { useState, useEffect } from 'react';
import { Flex, Box, Text, Progress } from '@radix-ui/themes';
import './LevelsPage.less';
import { Sidebar } from '../../widgets/Sidebar';
import { LevelCard } from './components/LevelCard'; // Убедись, что путь правильный!
import type { Level } from './types';
import { getLevels } from './api'; // <-- ИМПОРТИРУЕМ getLevels (во множественном числе)

const LevelsPage: React.FC = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // <-- ВЫЗЫВАЕМ getLevels() БЕЗ АРГУМЕНТОВ, чтобы получить массив
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
    (level) => level.userStars > 0
  ).length;

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
    <Flex className="levels-page-layout">
      <Sidebar />

      <Box className="levels-page-content">
        {/* Заголовок с отступами */}
        <Flex
          align="center"
          justify="between"
          style={{
            padding: '32px 40px',
            borderBottom: '1px solid #E5E7EB',
            marginBottom: '32px'
          }}
        >
          <Text size="7" weight="bold" style={{ fontSize: '32px' }}>
            Выберите уровень
          </Text>
          <Flex direction="column" gap="2" align="end">
            <Text size="3" weight="medium">
              Пройдено: {completedLevels}/{levels.length}
            </Text>
            <Progress
              value={levels.length > 0 ? (completedLevels / levels.length) * 100 : 0}
              size="3"
              style={{ width: '240px', height: '12px' }}
            />
          </Flex>
        </Flex>

        {/* Сетка уровней с отступами */}
        {error ? (
          <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
            <Text color="red" size="3">
              {error}
            </Text>
          </Flex>
        ) : (
          <Box style={{ padding: '0 40px 40px 40px' }}>
            <Box className="levels-grid">
              {levels.map((level) => (
                <LevelCard
                  key={level.levelId}
                  level={level}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Flex>
  );
};

export default LevelsPage;
