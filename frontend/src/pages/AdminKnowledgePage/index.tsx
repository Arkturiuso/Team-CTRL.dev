import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Text, Flex, Badge } from '@radix-ui/themes';
import { Sidebar } from '../../widgets/Sidebar';
import { getAllCommands, type Command } from './api';
import { ROUTES } from '../../routes';

const AdminKnowledgePage: React.FC = () => {
  const navigate = useNavigate();
  const [commands, setCommands] = useState<Command[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommands = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAllCommands();
        setCommands(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить команды');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommands();
  }, []);

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ height: '100vh', background: '#F3F4F6' }}>
        <Text size="3" color="gray">Загрузка базы знаний...</Text>
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
              Ошибка доступа
            </Text>
            <Text color="gray" size="2">{error}</Text>
            <button
              onClick={() => navigate(ROUTES.USER.LEVELS)}
              style={{
                marginTop: '16px', padding: '8px 20px',
                background: '#3B82F6', color: 'white', border: 'none',
                borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500
              }}
            >
              На главную
            </button>
          </Box>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex style={{ minHeight: '100vh', background: '#F3F4F6' }}>
      <Sidebar />

      <Box style={{ flex: 1, padding: '40px 48px', overflowY: 'auto', maxWidth: '1200px' }}>
        <Flex align="center" justify="between" style={{ marginBottom: '32px' }}>
          <Text size="7" weight="bold" style={{ fontSize: '32px', color: '#111827' }}>
            База знаний
          </Text>
          <Badge color="orange" variant="soft" size="3" style={{ padding: '8px 16px', borderRadius: '20px' }}>
            Режим администратора
          </Badge>
        </Flex>

        <Box style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          marginBottom: '32px'
        }}>
          <Flex align="center" justify="between" style={{ marginBottom: '24px' }}>
            <Text size="4" weight="bold" style={{ color: '#111827' }}>
              Полный список команд системы
            </Text>
            <Text size="2" color="gray">
              Всего: {commands.length}
            </Text>
          </Flex>

          {commands.length === 0 ? (
            <Flex justify="center" align="center" style={{ minHeight: '200px' }}>
              <Text size="3" color="gray">Команды не найдены</Text>
            </Flex>
          ) : (
            <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {commands.map((cmd) => (
                <Box
                  key={cmd.commandId}
                  style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3B82F6';
                    e.currentTarget.style.background = '#EFF6FF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.background = '#F9FAFB';
                  }}
                >
                  <Flex align="center" justify="between" style={{ marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                    <Text size="4" weight="bold" style={{
                      fontFamily: 'monospace',
                      color: '#1E40AF',
                      background: '#DBEAFE',
                      padding: '8px 16px',
                      borderRadius: '8px'
                    }}>
                      {cmd.syntax}
                    </Text>
                    <Text size="2" style={{ color: '#9CA3AF', fontWeight: 500 }}>
                      ID: {cmd.commandId}
                    </Text>
                  </Flex>
                  <Text size="3" style={{ color: '#374151', lineHeight: '1.5' }}>
                    {cmd.description || 'Описание отсутствует'}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box style={{
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '12px',
          padding: '20px 24px'
        }}>
          <Flex gap="3" align="start">
            <Text size="4">💡</Text>
            <Box>
              <Text size="3" weight="bold" style={{ color: '#1E40AF', display: 'block', marginBottom: '4px' }}>
                Информация для администратора
              </Text>
              <Text size="2" style={{ color: '#1E3A8A', lineHeight: '1.5' }}>
                Здесь отображаются все команды, существующие в системе, включая те, которые ещё не разблокированы для обычных пользователей.
              </Text>
            </Box>
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
};

export default AdminKnowledgePage;
