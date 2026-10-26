import { useState, useEffect } from 'react';
import { Flex, Box, Text, Badge } from '@radix-ui/themes';
import { Sidebar } from '../../widgets/Sidebar';
import { getProfile, logout, type RecentAttempt } from './api';

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getProfile();
        setProfile(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить профиль');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getAttemptStatus = (attempt: RecentAttempt) => {
  if (attempt.isSuccess) {
    return { color: 'green' as const, text: '✓ Пройден' };
  }
  return { color: 'red' as const, text: '✗ Ошибка' };
};

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ height: '100vh' }}>
        <Text size="3" color="gray">Загрузка профиля...</Text>
      </Flex>
    );
  }

  if (error || !profile) {
    return (
      <Flex style={{ minHeight: '100vh', background: '#F3F4F6' }}>
        <Sidebar />
        <Box style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
          <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
            <Text color="red" size="3">{error || 'Профиль не найден'}</Text>
          </Flex>
        </Box>
      </Flex>
    );
  }

  const badgeStyle: React.CSSProperties = {
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '13px',
    fontWeight: 500,
  };

  const statBoxStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 12px',
    borderRadius: '8px',
    minWidth: '55px',
    textAlign: 'center',
  };

  return (
    <Flex style={{ minHeight: '100vh', background: '#F3F4F6' }}>
      <Sidebar />

      <Box style={{ flex: 1, padding: '40px 48px', overflowY: 'auto', maxWidth: '1200px' }}>
        <Flex align="center" justify="between" style={{ marginBottom: '32px', marginTop: '8px' }}>
          <Text size="8" weight="bold" style={{ fontSize: '32px', color: '#111827' }}>
            Профиль игрока
          </Text>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: '1px solid #EF4444',
              color: '#EF4444',
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#EF4444';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#EF4444';
            }}
          >
            Выйти
          </button>
        </Flex>

        <Box style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px 40px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          marginBottom: '40px'
        }}>
          <Flex align="center" style={{ flexWrap: 'wrap' }}>
            <Box style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              marginRight: '24px'
            }}>
              <Text size="6" weight="bold" style={{ color: 'white' }}>
                {profile.user.login.charAt(0).toUpperCase()}
              </Text>
            </Box>

            <div style={{ flex: 1, minWidth: '200px', marginRight: '32px' }}>
              <Text size="6" weight="bold" style={{ fontSize: '24px', color: '#111827', marginBottom: '8px', display: 'block' }}>
                {profile.user.login}
              </Text>

              <Text size="2" color="gray" style={{ fontSize: '13px', marginBottom: '12px', display: 'block' }}>
                Зарегистрирован: {formatDate(profile.user.registrationDate)}
              </Text>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Badge
                  color={profile.user.accountStatusName.toLowerCase().includes('актив') ? 'green' : 'red'}
                  variant="solid"
                  size="2"
                  style={badgeStyle}
                >
                  {profile.user.accountStatusName}
                </Badge>
                <Badge
                  color="blue"
                  variant="surface"
                  size="2"
                  style={badgeStyle}
                >
                  {profile.user.role === 'admin' ? 'Администратор' : 'Игрок'}
                </Badge>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
              <Box style={{
                ...statBoxStyle,
                background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFFFF 100%)',
                border: '1.5px solid #FFD700',
                boxShadow: '0 2px 8px rgba(255, 215, 0, 0.15)'
              }}>
                <span style={{ color: '#FFD700', fontSize: '18px', fontWeight: 800, lineHeight: '1', marginBottom: '3px' }}>
                  {profile.user.totalStars}
                </span>
                <span style={{ color: '#6B7280', fontSize: '10px', fontWeight: 600, lineHeight: '1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  звёзд
                </span>
              </Box>

              <Box style={{
                ...statBoxStyle,
                background: 'linear-gradient(135deg, #E6F3FF 0%, #FFFFFF 100%)',
                border: '1.5px solid #3B82F6',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)'
              }}>
                <span style={{ color: '#3B82F6', fontSize: '18px', fontWeight: 800, lineHeight: '1', marginBottom: '3px' }}>
                  {profile.user.levelsPassedCount}
                </span>
                <span style={{ color: '#6B7280', fontSize: '10px', fontWeight: 600, lineHeight: '1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  уровней
                </span>
              </Box>

              <Box style={{
                ...statBoxStyle,
                background: 'linear-gradient(135deg, #F0E6FF 0%, #FFFFFF 100%)',
                border: '1.5px solid #8B5CF6',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.15)'
              }}>
                <span style={{ color: '#8B5CF6', fontSize: '18px', fontWeight: 800, lineHeight: '1', marginBottom: '3px' }}>
                  #{profile.rankPosition}
                </span>
                <span style={{ color: '#6B7280', fontSize: '10px', fontWeight: 600, lineHeight: '1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  место
                </span>
              </Box>
            </div>
          </Flex>
        </Box>

        <Text size="6" weight="bold" style={{ fontSize: '24px', color: '#111827', marginBottom: '20px', display: 'block' }}>
          Последние попытки
        </Text>

        {profile.recentAttempts.length === 0 ? (
          <Box style={{
            background: 'white',
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
            border: '2px dashed #E5E7EB'
          }}>
            <Text size="3" color="gray" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Пока нет попыток
            </Text>
            <Text size="2" color="gray" style={{ fontSize: '13px' }}>
              Пройди первый уровень, чтобы увидеть статистику
            </Text>
          </Box>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.recentAttempts.map((attempt: RecentAttempt, index: number) => {
              const status = getAttemptStatus(attempt);

              return (
                <Box
                  key={`${attempt.levelId}-${index}`}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <Flex align="center" justify="between" style={{ flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <Text size="3" weight="medium" style={{ color: '#111827', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Уровень {attempt.levelId}: {attempt.levelTitle}
                      </Text>
                      <Text size="2" color="gray" style={{ fontSize: '13px' }}>
                        {formatDate(attempt.submittedAt)}
                      </Text>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Badge
                        color={status.color}
                        variant="soft"
                        size="2"
                        style={badgeStyle}
                      >
                        {status.text}
                      </Badge>
                      <Box style={{
                        background: '#F3F4F6',
                        padding: '6px 12px',
                        borderRadius: '16px'
                      }}>
                        <Text size="2" color="gray" style={{ fontSize: '13px' }}>
                          {attempt.tickCount} тиков
                        </Text>
                      </Box>
                    </div>
                  </Flex>
                </Box>
              );
            })}
          </div>
        )}
      </Box>
    </Flex>
  );
};

export default ProfilePage;
