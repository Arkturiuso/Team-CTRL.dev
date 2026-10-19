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

  return (
    <Box
      className={`level-card ${!isAvailable ? 'level-card--locked' : ''}`}
      onClick={isAvailable ? onClick : undefined}
    >
      <Flex align="center" gap="3">
        {/* Номер уровня */}
        <Flex className="level-number" align="center" justify="center">
          <Text size="4" weight="bold">
            {level.levelId}
          </Text>
        </Flex>

        <Flex direction="column" gap="1" style={{ flex: 1 }}>
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
          <Flex gap="1">
            {Array.from({ length: 3 }).map((_, index) => (
              <Text
                key={index}
                size="2"
                style={{
                  color: '#FFD700',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                }}
              >
                ★
              </Text>
            ))}
          </Flex>
        ) : (
          <Text size="4">🔒</Text>
        )}
      </Flex>
    </Box>
  );
};
