import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Text, Flex } from '@radix-ui/themes';
import { Sidebar } from '../../widgets/Sidebar';
import { getKnowledgeBase, type Command } from './api';

const KnowledgeBasePage: React.FC = () => {
  const navigate = useNavigate();
  const [commands, setCommands] = useState<Command[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchKnowledgeBase = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getKnowledgeBase();

        const all = [...data.unlocked, ...data.locked];
        setCommands(all);
        setUnlockedIds(new Set(data.unlocked.map(c => c.commandId)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить базу знаний');
      } finally {
        setIsLoading(false);
      }
    };

    fetchKnowledgeBase();
  }, []);

  const INITIAL_COUNT = 6;
  const displayedCommands = showAll ? commands : commands.slice(0, INITIAL_COUNT);

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ height: '100vh', background: '#E8E4F0' }}>
        <Text size="3" color="gray">Загрузка базы знаний...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex align="center" justify="center" style={{ height: '100vh', background: '#E8E4F0' }}>
        <Box style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <Text color="red" size="4" weight="bold" style={{ display: 'block', marginBottom: '12px' }}>
            Ошибка загрузки
          </Text>
          <Text color="gray" size="2">{error}</Text>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 20px',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Попробовать снова
          </button>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex style={{ minHeight: '100vh', background: '#E8E4F0' }}>
      <Sidebar />

      <Box style={{ flex: 1, padding: '32px 40px' }}>
        <Text size="7" weight="bold" style={{ color: '#111827', marginBottom: '24px', display: 'block' }}>
          База знаний
        </Text>

        <Box style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayedCommands.map((command) => {
            const isUnlocked = unlockedIds.has(command.commandId);

            return (
              <Box
                key={command.commandId}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '32px',
                  opacity: isUnlocked ? 1 : 0.55,
                  transition: 'all 0.2s ease',
                  border: isUnlocked ? '1px solid #F3F4F6' : '1px solid #E5E7EB'
                }}
              >
                <Text
                  size="3"
                  weight="bold"
                  style={{
                    fontFamily: 'monospace',
                    color: '#111827',
                    minWidth: '160px'
                  }}
                >
                  {command.syntax}
                </Text>
                <Text
                  size="3"
                  style={{
                    color: '#374151',
                    flex: 1,
                    lineHeight: '1.5'
                  }}
                >
                  {command.description}
                </Text>
                {!isUnlocked && (
                  <Text size="2" style={{ color: '#9CA3AF', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    🔒 Заблокировано
                  </Text>
                )}
              </Box>
            );
          })}
        </Box>

        {commands.length === 0 && (
          <Flex justify="center" align="center" style={{ minHeight: '300px' }}>
            <Text size="3" color="gray">База знаний пуста. Пройдите первый уровень, чтобы открыть команды.</Text>
          </Flex>
        )}

        {commands.length > INITIAL_COUNT && !showAll && (
          <Flex justify="center" style={{ marginTop: '32px' }}>
            <button
              onClick={() => setShowAll(true)}
              style={{
                background: 'white',
                border: '2px solid #3B82F6',
                borderRadius: '24px',
                padding: '12px 28px',
                fontSize: '15px',
                fontWeight: 600,
                color: '#3B82F6',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3B82F6';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#3B82F6';
              }}
            >
              Показать ещё
              <span style={{ fontSize: '18px' }}>↓</span>
            </button>
          </Flex>
        )}
      </Box>
    </Flex>
  );
};

export default KnowledgeBasePage;
