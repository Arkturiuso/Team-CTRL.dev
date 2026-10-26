import { useState, useEffect } from 'react';
import { Box, Text, Flex, Progress } from '@radix-ui/themes';
import { Sidebar } from '../../widgets/Sidebar';
import { LevelCard } from './components/LevelCard';
import { getLevels } from './api'; // Убедись, что путь к api правильный

interface Level {
  levelId: number;
  levelName: string;
  description: string;
  difficultyName: string;
  userStars: number;
}

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

        // ✅ Берём данные как есть. Если userStars везде 3, проблема в бэкенде или токене.
        const levelsData = response.data || [];
        setLevels(levelsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить уровни');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLevels();
  }, []);

  // ✅ Вычисляем прогресс для шкалы
  const totalLevels = levels.length;
  const passedLevels = levels.filter((l) => l.userStars > 0).length;
  const progressPercent = totalLevels > 0 ? (passedLevels / totalLevels) * 100 : 0;

  if (isLoading) {
    return (
      <Flex style={{ minHeight: '100vh', background: '#F3F4F6' }}>
        <Sidebar />
        <Flex align="center" justify="center" style={{ flex: 1 }}>
          <Text size="3" color="gray">Загрузка уровней...</Text>
        </Flex>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex style={{ minHeight: '100vh', background: '#F3F4F6' }}>
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
          </Box>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex style={{ minHeight: '100vh', background: '#F3F4F6' }}>
      <Sidebar />

      <Box style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
        {/* Заголовок */}
        <Text size="8" weight="bold" style={{ fontSize: '32px', color: '#111827', marginBottom: '24px', display: 'block' }}>
          Уровни
        </Text>

        {/* ✅ Шкала общего прогресса */}
        <Box style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px 32px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          marginBottom: '32px'
        }}>
          <Flex align="center" justify="between" style={{ marginBottom: '12px' }}>
            <Text size="4" weight="bold" style={{ color: '#111827' }}>
              Общий прогресс
            </Text>
            <Text size="3" style={{ color: '#6B7280', fontWeight: 500 }}>
              Пройдено: {passedLevels} из {totalLevels}
            </Text>
          </Flex>

          <Box style={{
            width: '100%',
            height: '12px',
            background: '#E5E7EB',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <Box style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
              borderRadius: '8px',
              transition: 'width 0.5s ease',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
            }} />
          </Box>

          <Text size="2" style={{ color: '#9CA3AF', marginTop: '8px', display: 'block' }}>
            {Math.round(progressPercent)}% завершено
          </Text>
        </Box>

        {/* Сетка уровней */}
        {levels.length === 0 ? (
          <Flex justify="center" align="center" style={{ minHeight: '300px' }}>
            <Text size="3" color="gray">Уровни пока не добавлены.</Text>
          </Flex>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {levels.map((level) => (
              <LevelCard
                key={level.levelId}
                level={level}
                allLevels={levels}
              />
            ))}
          </div>
        )}
      </Box>
    </Flex>
  );
};

export default LevelsPage;
