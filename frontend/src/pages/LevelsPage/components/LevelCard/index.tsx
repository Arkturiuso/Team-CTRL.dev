import { Box, Flex, Text } from '@radix-ui/themes';
import type { FC } from 'react';
import type { Level } from '../../api';
import './LevelCard.less';

interface LevelCardProps {
  level: Level;
  onClick?: () => void;
}

export const LevelCard: FC<LevelCardProps> = ({ level, onClick }) => {
  const isAvailable = level.levelStatusName === 'Доступен';
  const filledStars = Math.min(Math.max(level.userStars ?? 0, 0), 3);

  return (
    <Box
      className={`level-card ${!isAvailable ? 'level-card--locked' : ''}`}
      onClick={isAvailable ? onClick : undefined}
    >
      <Flex align="center" style={{ gap: '20px' }}>

        <Flex
          className="level-number"
          align="center"
          justify="center"
          style={{
            width: '48px',
            height: '48px',
            flexShrink: 0
          }}
        >
          <Text size="4" weight="bold">
            {level.levelId}
          </Text>
        </Flex>

        <Flex direction="column" style={{ flex: 1, gap: '6px' }}>
          <Text size="3" weight="medium" className="level-name">
            {level.levelName}
          </Text>
          <Text size="2" color="gray" className="level-description">
            {level.description}
          </Text>
          <Text size="1" color="gray" className="level-difficulty">
            {level.difficultyName}
          </Text>
        </Flex>

        {isAvailable ? (
          <Flex style={{ gap: '6px', flexShrink: 0 }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Text
                key={index}
                size="2"
                style={{
                  color: index < filledStars ? '#FFD700' : '#D1D5DB',
                  filter: index < filledStars ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' : 'none',
                  fontSize: '22px',
                  lineHeight: 1,
                }}
              >
                ★
              </Text>
            ))}
          </Flex>
        ) : (
          <Text size="4" style={{ flexShrink: 0 }}>🔒</Text>
        )}
      </Flex>
    </Box>
  );
};
