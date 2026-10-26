import { Box, Text, Flex } from '@radix-ui/themes';
import { useNavigate } from 'react-router-dom';

interface LevelCardProps {
  level: {
    levelId: number;
    levelName: string;
    description: string;
    difficultyName: string;
    userStars: number;
    allowedCommands?: any[];
  };
  allLevels?: any[];
}

export const LevelCard: React.FC<LevelCardProps> = ({ level, allLevels = [] }) => {
  const navigate = useNavigate();

  const isLocked = level.levelId > 1 && allLevels.some(
    (l) => l.levelId < level.levelId && l.userStars === 0
  );

  const renderStars = (stars: number) => {
    const safeStars = Math.max(0, Math.min(3, Number(stars) || 0));
    return (
      <Flex gap="1">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              fontSize: '22px',
              color: i <= safeStars ? '#FCD34D' : '#D1D5DB',
              lineHeight: 1,
              filter: i <= safeStars ? 'none' : 'grayscale(100%)'
            }}
          >
            ⭐
          </span>
        ))}
      </Flex>
    );
  };

  const handleClick = () => {
    if (isLocked) {
      return;
    }
    navigate(`/user/levels/${level.levelId}`);
  };

  return (
    <Box
      onClick={handleClick}
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${isLocked ? '#F3F4F6' : '#E5E7EB'}`,
        cursor: isLocked ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '200px',
        boxShadow: isLocked ? 'none' : '0 2px 4px rgba(0,0,0,0.04)',
        opacity: isLocked ? 0.5 : 1,
        filter: isLocked ? 'grayscale(100%)' : 'none',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isLocked) {
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
          e.currentTarget.style.borderColor = '#3B82F6';
        }
      }}
      onMouseLeave={(e) => {
        if (!isLocked) {
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
          e.currentTarget.style.borderColor = '#E5E7EB';
        }
      }}
    >
      {isLocked && (
        <Box style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          fontSize: '28px',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))'
        }}>
          🔒
        </Box>
      )}

      <Flex align="center" style={{ marginBottom: '16px' }}>
        <Box
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: `2px solid ${isLocked ? '#D1D5DB' : '#3B82F6'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 700,
            color: isLocked ? '#9CA3AF' : '#111827',
            flexShrink: 0,
            background: isLocked ? '#F9FAFB' : 'white'
          }}
        >
          {level.levelId}
        </Box>

        <Text
          size="5"
          weight="bold"
          style={{
            color: isLocked ? '#9CA3AF' : '#111827',
            lineHeight: 1.3,
            marginLeft: '20px',
            flex: 1
          }}
        >
          {level.levelName}
        </Text>
      </Flex>

      <Text
        size="3"
        style={{
          color: isLocked ? '#9CA3AF' : '#6B7280',
          lineHeight: 1.5,
          marginBottom: '16px',
          flex: 1
        }}
      >
        {level.description}
      </Text>

      <Flex align="center" justify="between" style={{ marginTop: 'auto' }}>
        <Text size="2" style={{ color: '#9CA3AF', fontWeight: 500 }}>
          {level.difficultyName || 'Недоступно'}
        </Text>
        {renderStars(level.userStars)}
      </Flex>
    </Box>
  );
};
