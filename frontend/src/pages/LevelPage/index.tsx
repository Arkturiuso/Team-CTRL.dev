import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Flex, Box, Text, Button, Progress } from '@radix-ui/themes';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevel } from './api';

const ROBOT_EMOJI = String.fromCodePoint(0x1F916);
const KEY_EMOJI = String.fromCodePoint(0x1F511);
const DOOR_EMOJI = String.fromCodePoint(0x1F6AA);
const COIN_EMOJI = String.fromCodePoint(0x1FA99);

interface RobotState {
  x: number;
  y: number;
  direction: 'up' | 'right' | 'down' | 'left';
}

interface ConsoleLine {
  line: number;
  command: string;
  success: boolean;
  error?: string;
  isWarning?: boolean;
}

interface LevelData {
  levelId: number;
  levelName: string;
  description: string;
  difficultyName: string;
  mapData: {
    width: number;
    height: number;
    entrance: string;
    exit: string;
    coins?: Array<{ id: number; position: string }>;
    coins_count?: number;
    requiredKey?: { id: number; position: string } | null;
    keys?: Array<{ id: number; position: string }>;
    keys_count?: number;
    walls: Array<{ id: number; side1: string; side2: string }>;
  };
  userStars: number;
}

function parsePosition(pos: string): { x: number; y: number } {
  const x = pos.charCodeAt(0) - 65;
  const y = parseInt(pos.slice(1)) - 1;
  return { x, y };
}

function hasWall(
  walls: Array<{ side1: string; side2: string }>,
  pos1: string,
  pos2: string
): boolean {
  return walls.some(
    w =>
      (w.side1 === pos1 && w.side2 === pos2) ||
      (w.side1 === pos2 && w.side2 === pos1)
  );
}

const DIRECTIONS = ['up', 'right', 'down', 'left'];

const LevelPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [level, setLevel] = useState<LevelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [code, setCode] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<ConsoleLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [collectedCoins, setCollectedCoins] = useState<Set<number>>(new Set());
  const [hasRequiredKey, setHasRequiredKey] = useState(false);
  const [ticks, setTicks] = useState(0);
  const [showCommands, setShowCommands] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorLines, setErrorLines] = useState<Set<number>>(new Set());

  const [robot, setRobot] = useState<RobotState>({ x: 0, y: 0, direction: 'right' });

  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLevel = async () => {
      try {
        setIsLoading(true);
        const response = await getLevel(Number(id));
        setLevel(response.data);

        const entrance = parsePosition(response.data.mapData.entrance);
        setRobot({ x: entrance.x, y: entrance.y, direction: 'right' });
        setHasRequiredKey(false);
        setCollectedCoins(new Set());
      } catch (err) {
        console.error('Failed to load level:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLevel();
  }, [id]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  const getCoins = () => level?.mapData?.coins ?? level?.mapData?.keys ?? [];
  const getCoinsCount = () => level?.mapData?.coins_count ?? level?.mapData?.keys_count ?? getCoins().length;
  const getWalls = () => level?.mapData?.walls ?? [];

  const getRequiredKey = () => {
    if (level?.mapData?.requiredKey) {
      return level.mapData.requiredKey;
    }
    return { id: 999, position: 'I1' };
  };

  const executeCommand = async (
    command: string,
    currentRobot: RobotState,
    currentCoins: Set<number>,
    currentHasKey: boolean,
    levelData: LevelData
  ): Promise<{
    robot: RobotState;
    coins: Set<number>;
    hasKey: boolean;
    success: boolean;
    error?: string;
    isCritical: boolean
  }> => {
    const { x, y, direction } = currentRobot;
    const pos = `${String.fromCharCode(65 + x)}${y + 1}`;
    const coins = getCoins();
    const walls = getWalls();
    const requiredKey = getRequiredKey();

    switch (command) {
      case 'move()': {
        let newX = x, newY = y;
        if (direction === 'up') newY = y - 1;
        else if (direction === 'right') newX = x + 1;
        else if (direction === 'down') newY = y + 1;
        else if (direction === 'left') newX = x - 1;

        if (newX < 0 || newX >= levelData.mapData.width || newY < 0 || newY >= levelData.mapData.height) {
          return { robot: currentRobot, coins: currentCoins, hasKey: currentHasKey, success: false, error: 'Выход за границы карты', isCritical: true };
        }

        const newPos = `${String.fromCharCode(65 + newX)}${newY + 1}`;
        if (hasWall(walls, pos, newPos)) {
          return { robot: currentRobot, coins: currentCoins, hasKey: currentHasKey, success: false, error: 'Стена на пути', isCritical: true };
        }

        const newRobot = { ...currentRobot, x: newX, y: newY };
        const newCoins = new Set(currentCoins);
        const coinAtPos = coins.find(c => c.position === newPos);
        if (coinAtPos && !newCoins.has(coinAtPos.id)) {
          newCoins.add(coinAtPos.id);
        }

        let newHasKey = currentHasKey;
        if (requiredKey && requiredKey.position === newPos) {
          newHasKey = true;
        }

        return { robot: newRobot, coins: newCoins, hasKey: newHasKey, success: true, isCritical: false };
      }

      case 'turn_left()': {
        const dirIndex = DIRECTIONS.indexOf(direction);
        const newDirection = DIRECTIONS[(dirIndex - 1 + 4) % 4] as RobotState['direction'];
        return { robot: { ...currentRobot, direction: newDirection }, coins: currentCoins, hasKey: currentHasKey, success: true, isCritical: false };
      }

      case 'turn_right()': {
        const dirIndex = DIRECTIONS.indexOf(direction);
        const newDirection = DIRECTIONS[(dirIndex + 1) % 4] as RobotState['direction'];
        return { robot: { ...currentRobot, direction: newDirection }, coins: currentCoins, hasKey: currentHasKey, success: true, isCritical: false };
      }

      case 'collect_coin()': {
        const coinAtPos = coins.find(c => c.position === pos);
        if (coinAtPos && !currentCoins.has(coinAtPos.id)) {
          const newCoins = new Set(currentCoins);
          newCoins.add(coinAtPos.id);
          return { robot: currentRobot, coins: newCoins, hasKey: currentHasKey, success: true, isCritical: false };
        }
        return { robot: currentRobot, coins: currentCoins, hasKey: currentHasKey, success: false, error: 'Здесь нет монетки', isCritical: true };
      }

      default:
        return { robot: currentRobot, coins: currentCoins, hasKey: currentHasKey, success: false, error: `Неизвестная команда: ${command}`, isCritical: false };
    }
  };

  const handleRunCode = async () => {
    const lines = code.split('\n').filter(line => line.trim());
    if (lines.length === 0) return;

    setIsRunning(true);
    setExecutionProgress(0);
    setErrorLines(new Set());

    let currentRobot = { ...robot };
    let currentCoins = new Set(collectedCoins);
    let currentHasKey = hasRequiredKey;
    const results: ConsoleLine[] = [];
    const newErrorLines = new Set<number>();

    const startLine = consoleOutput.length + 1;

    for (let i = 0; i < lines.length; i++) {
      const command = lines[i].trim();
      if (!command) continue;

      setCurrentLine(i);
      setExecutionProgress(((i + 1) / lines.length) * 100);

      await new Promise(resolve => setTimeout(resolve, 600));

      const result = await executeCommand(command, currentRobot, currentCoins, currentHasKey, level!);

      results.push({
        line: startLine + i,
        command,
        success: result.success,
        error: result.error,
        isWarning: !result.isCritical && !result.success
      });

      if (!result.success) {
        if (result.isCritical) {
          newErrorLines.add(i);
          setConsoleOutput(prev => [...prev, ...results]);
          setErrorLines(new Set(newErrorLines));
          setCurrentLine(null);
          setExecutionProgress(0);
          setErrorMessage(result.error || 'Неизвестная ошибка');
          setShowFailModal(true);
          setIsRunning(false);
          return;
        } else {
          newErrorLines.add(i);
        }
      } else {
        currentRobot = result.robot;
        currentCoins = result.coins;
        currentHasKey = result.hasKey;
        setRobot({ ...currentRobot });
        setCollectedCoins(new Set(currentCoins));
        setHasRequiredKey(currentHasKey);
      }

      setConsoleOutput(prev => [...prev, results[i]]);
    }

    setCurrentLine(null);
    setExecutionProgress(100);
    setIsRunning(false);
    setErrorLines(new Set(newErrorLines));

    setTicks(prev => prev + 1);
    setCode('');

    const exitPos = parsePosition(level!.mapData.exit);
    const requiredKey = getRequiredKey();

    if (currentRobot.x === exitPos.x && currentRobot.y === exitPos.y) {
      if (requiredKey && !currentHasKey) {
        setConsoleOutput(prev => [
          ...prev,
          {
            line: prev.length + 1,
            command: '—',
            success: false,
            error: 'Дверь заперта! Найдите и соберите обязательный ключ'
          }
        ]);
      } else {
        setTimeout(() => setShowSuccessModal(true), 500);
      }
    } else {
      setConsoleOutput(prev => [
        ...prev,
        {
          line: prev.length + 1,
          command: '—',
          success: false,
          error: 'Робот не достиг выхода. Продолжайте писать код!'
        }
      ]);
    }
  };

  const handleReset = () => {
    const entrance = parsePosition(level!.mapData.entrance);
    setRobot({ x: entrance.x, y: entrance.y, direction: 'right' });
    setCollectedCoins(new Set());
    setHasRequiredKey(false);
    setTicks(0);
    setConsoleOutput([]);
    setCode('');
    setCurrentLine(null);
    setExecutionProgress(0);
    setErrorLines(new Set());
  };

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ height: '100vh', background: '#F3F4F6' }}>
        <Text size="3" color="gray">Загрузка уровня...</Text>
      </Flex>
    );
  }

  if (!level) {
    return (
      <Flex align="center" justify="center" style={{ height: '100vh', background: '#F3F4F6' }}>
        <Text color="red" size="3">Уровень не найден</Text>
      </Flex>
    );
  }

  const coins = getCoins();
  const totalCoins = getCoinsCount();
  const requiredKey = getRequiredKey();
  const codeLines = code.split('\n');
  const CELL_SIZE = 50;

  const getRotation = (dir: string) => {
    switch (dir) {
      case 'up': return 0;
      case 'right': return 90;
      case 'down': return 180;
      case 'left': return 270;
      default: return 0;
    }
  };

  const robotLeft = robot.x * CELL_SIZE + (CELL_SIZE - 36) / 2;
  const robotTop = robot.y * CELL_SIZE + (CELL_SIZE - 36) / 2;
  const keyLeft = requiredKey ? parsePosition(requiredKey.position).x * CELL_SIZE + 8 : 0;
  const keyTop = requiredKey ? parsePosition(requiredKey.position).y * CELL_SIZE + 8 : 0;

  return (
    <Box style={{ minHeight: '100vh', background: '#F3F4F6' }}>
      <Box style={{
        background: 'white',
        padding: '16px 24px',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Flex align="center" justify="between">
          <Flex gap="3" align="center">
            <button
              onClick={() => navigate('/user/levels')}
              style={{
                background: 'white',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginRight: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F3F4F6';
                e.currentTarget.style.borderColor = '#9CA3AF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#D1D5DB';
              }}
            >
              ← Уровни
            </button>

            <span style={{
              fontSize: '16px',
              fontWeight: 500,
              color: hasRequiredKey ? '#10B981' : '#EF4444',
              marginRight: '16px'
            }}>
              {hasRequiredKey ? 'Ключ собран' : 'Ключ не найден'}
            </span>
            <span style={{ fontSize: '16px', fontWeight: 500, color: '#374151', marginRight: '16px' }}>
              Монеты: {collectedCoins.size}/{totalCoins}
            </span>
            <span style={{ fontSize: '16px', fontWeight: 500, color: '#374151', marginRight: '16px' }}>
              Тики: {ticks}
            </span>
            <Text size="5" weight="bold">
              Уровень {level.levelId}: {level.levelName}
            </Text>
          </Flex>

          <Flex gap="2" align="center">
            <button
              onClick={() => setShowCommands(!showCommands)}
              style={{
                background: showCommands ? '#EFF6FF' : 'white',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginRight: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#EFF6FF';
                e.currentTarget.style.borderColor = '#3B82F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = showCommands ? '#EFF6FF' : 'white';
                e.currentTarget.style.borderColor = '#D1D5DB';
              }}
            >
              Команды
            </button>
            <button
              onClick={() => navigate('/user/levels')}
              style={{
                background: 'white',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FEE2E2';
                e.currentTarget.style.borderColor = '#EF4444';
                e.currentTarget.style.color = '#EF4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#D1D5DB';
                e.currentTarget.style.color = '#374151';
              }}
            >
              Выйти
            </button>
          </Flex>
        </Flex>

        {isRunning && (
          <Box style={{ marginTop: '12px' }}>
            <Flex align="center" gap="2" style={{ marginBottom: '6px' }}>
              <Text size="2" color="gray">Выполнение кода...</Text>
              <Text size="2" weight="bold" style={{ color: '#3B82F6' }}>
                {Math.round(executionProgress)}%
              </Text>
            </Flex>
            <Progress
              value={executionProgress}
              size="2"
              style={{ width: '100%' }}
            />
          </Box>
        )}
      </Box>

      <Box style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
        <Flex gap="3" style={{ marginBottom: '20px', flexWrap: 'wrap' }}>

          <Box style={{
            flex: '1 1 320px',
            background: 'white',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <Text size="4" weight="bold" style={{ marginBottom: '12px', display: 'block' }}>
              Код
            </Text>

            <Box style={{
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              overflow: 'hidden',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {codeLines.map((line, index) => {
                const isCurrentLine = currentLine === index;
                const isErrorLine = errorLines.has(index);

                return (
                  <Flex key={index} align="center" style={{
                    borderBottom: index < codeLines.length - 1 ? '1px solid #E5E7EB' : 'none',
                    minHeight: '32px',
                    background: isCurrentLine
                      ? '#FEF3C7'
                      : isErrorLine
                        ? '#FEE2E2'
                        : 'transparent',
                    transition: 'background 0.2s ease'
                  }}>
                    <Box style={{
                      width: '36px',
                      padding: '0 8px',
                      background: isCurrentLine ? '#FDE68A' : isErrorLine ? '#FECACA' : '#F3F4F6',
                      color: isErrorLine ? '#991B1B' : '#6B7280',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      textAlign: 'right',
                      borderRight: '1px solid #E5E7EB',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      flexShrink: 0,
                      fontWeight: isCurrentLine ? 700 : 400
                    }}>
                      {index + 1}
                    </Box>
                    <input
                      type="text"
                      value={line}
                      onChange={(e) => {
                        if (!isRunning) {
                          const newLines = [...codeLines];
                          newLines[index] = e.target.value;
                          setCode(newLines.join('\n'));
                          if (errorLines.has(index)) {
                            const newErrors = new Set(errorLines);
                            newErrors.delete(index);
                            setErrorLines(newErrors);
                          }
                        }
                      }}
                      placeholder="Введите команду..."
                      disabled={isRunning}
                      style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        padding: '6px 12px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        outline: 'none',
                        minWidth: 0,
                        color: isErrorLine ? '#991B1B' : '#111827'
                      }}
                    />
                    {isCurrentLine && (
                      <Box style={{
                        padding: '0 8px',
                        color: '#F59E0B',
                        fontSize: '16px'
                      }}>
                        ▶
                      </Box>
                    )}
                  </Flex>
                );
              })}
            </Box>

            <Button
              variant="ghost"
              size="1"
              onClick={() => setCode(code + '\n')}
              disabled={isRunning}
              style={{ marginTop: '8px', color: '#3B82F6' }}
            >
              + Добавить строку
            </Button>

            <Button
              size="3"
              onClick={handleRunCode}
              disabled={isRunning || !code.trim()}
              style={{
                marginTop: '12px',
                width: '100%',
                background: isRunning ? '#9CA3AF' : '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: isRunning ? 'not-allowed' : 'pointer'
              }}
            >
              {isRunning ? 'Выполнение...' : 'Запустить'}
            </Button>
          </Box>

          <Box style={{
            flex: '2 1 400px',
            background: 'white',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <Text size="4" weight="bold" style={{ marginBottom: '12px', display: 'block' }}>
              Лабиринт
            </Text>

            <Box style={{
              background: 'white',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              justifyContent: 'center',
              overflow: 'auto'
            }}>
              <div style={{
                position: 'relative',
                width: `${level.mapData.width * CELL_SIZE}px`,
                height: `${level.mapData.height * CELL_SIZE}px`,
                background: 'white',
                borderRadius: '8px',
                border: '2px solid #374151',
                overflow: 'hidden'
              }}>
                {/* Ячейки + ДВЕРЬ */}
                {Array.from({ length: level.mapData.height * level.mapData.width }).map((_, index) => {
                  const x = index % level.mapData.width;
                  const y = Math.floor(index / level.mapData.width);
                  const pos = `${String.fromCharCode(65 + x)}${y + 1}`;
                  const isExit = pos === level.mapData.exit;

                  return (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        left: `${x * CELL_SIZE}px`,
                        top: `${y * CELL_SIZE}px`,
                        width: `${CELL_SIZE}px`,
                        height: `${CELL_SIZE}px`,
                        background: isExit ? '#D1FAE5' : 'white',
                        border: '1px solid #E5E7EB',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '26px'
                      }}
                    >
                      {isExit && DOOR_EMOJI}
                    </div>
                  );
                })}

                {/* Стены */}
                {getWalls().map(wall => {
                  const pos1 = parsePosition(wall.side1);
                  const pos2 = parsePosition(wall.side2);
                  const isHorizontal = pos1.y === pos2.y;

                  let wallStyle: React.CSSProperties = {};

                  if (isHorizontal) {
                    const minX = Math.min(pos1.x, pos2.x);
                    const maxX = Math.max(pos1.x, pos2.x);
                    wallStyle = {
                      position: 'absolute',
                      left: `${minX * CELL_SIZE}px`,
                      top: `${pos1.y * CELL_SIZE}px`,
                      width: `${(maxX - minX + 1) * CELL_SIZE}px`,
                      height: '4px',
                      background: '#1F2937',
                      zIndex: 10
                    };
                  } else {
                    const minY = Math.min(pos1.y, pos2.y);
                    const maxY = Math.max(pos1.y, pos2.y);
                    wallStyle = {
                      position: 'absolute',
                      left: `${pos1.x * CELL_SIZE}px`,
                      top: `${minY * CELL_SIZE}px`,
                      width: '4px',
                      height: `${(maxY - minY + 1) * CELL_SIZE}px`,
                      background: '#1F2937',
                      zIndex: 10
                    };
                  }

                  return <div key={wall.id} style={wallStyle} />;
                })}

                {/* ВСЕ монетки — фильтр убран, ключ поверх (zIndex 15 > 5) */}
                {coins.map(coin => {
                  const pos = parsePosition(coin.position);
                  if (collectedCoins.has(coin.id)) return null;

                  return (
                    <div
                      key={coin.id}
                      className="coin-anim"
                      style={{
                        position: 'absolute',
                        left: `${pos.x * CELL_SIZE + 8}px`,
                        top: `${pos.y * CELL_SIZE + 8}px`,
                        width: `${CELL_SIZE - 16}px`,
                        height: `${CELL_SIZE - 16}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        zIndex: 5,
                        pointerEvents: 'none',
                        background: 'transparent'
                      }}
                    >
                      {COIN_EMOJI}
                    </div>
                  );
                })}

                {/* КЛЮЧ — поверх монетки на той же клетке */}
                {requiredKey && !hasRequiredKey && (
                  <div
                    className="key-anim"
                    style={{
                      position: 'absolute',
                      left: `${keyLeft}px`,
                      top: `${keyTop}px`,
                      width: `${CELL_SIZE - 16}px`,
                      height: `${CELL_SIZE - 16}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      zIndex: 15,
                      pointerEvents: 'none',
                      background: 'transparent',
                      filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))'
                    }}
                  >
                    {KEY_EMOJI}
                  </div>
                )}

                {/* РОБОТ */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${robotLeft}px`,
                    top: `${robotTop}px`,
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    zIndex: 20,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    transition: 'left 0.3s ease, top 0.3s ease',
                    transform: `rotate(${getRotation(robot.direction)}deg)`
                  }}
                >
                  {ROBOT_EMOJI}
                </div>
              </div>
            </Box>
          </Box>

          {showCommands && (
            <Box style={{
              width: '240px',
              flexShrink: 0,
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <Flex align="center" justify="between" style={{ marginBottom: '12px' }}>
                <Text size="4" weight="bold">Доступные команды</Text>
                <Button variant="ghost" size="1" onClick={() => setShowCommands(false)}>

                </Button>
              </Flex>

              {[
                { cmd: 'move()', desc: 'шаг вперед' },
                { cmd: 'turn_left()', desc: 'поворот налево' },
                { cmd: 'turn_right()', desc: 'поворот направо' },
                { cmd: 'collect_coin()', desc: 'собрать монетку' }
              ].map(item => (
                <Box
                  key={item.cmd}
                  style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginBottom: '8px',
                    cursor: 'default'
                  }}
                >
                  <Text size="2" weight="bold" style={{ display: 'block', fontFamily: 'monospace' }}>
                    {item.cmd}
                  </Text>
                  <Text size="1" color="gray">
                    • {item.desc}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Flex>

        <Box style={{
          background: 'white',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <Text size="4" weight="bold" style={{ marginBottom: '12px', display: 'block' }}>
            Консоль
          </Text>

          <Box
            ref={consoleRef}
            style={{
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '16px',
              minHeight: '120px',
              maxHeight: '200px',
              overflowY: 'auto',
              fontFamily: 'monospace'
            }}
          >
            {consoleOutput.length === 0 ? (
              <Text size="2" color="gray">
                Запустите код, чтобы увидеть результат выполнения...
              </Text>
            ) : (
              <AnimatePresence>
                {consoleOutput.map((output, index) => (
                  <motion.div
                    key={`${output.line}-${output.command}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      background: output.isWarning ? '#FEF2F2' : 'transparent',
                      padding: output.isWarning ? '4px 8px' : '0',
                      margin: output.isWarning ? '-4px -8px' : '0',
                      borderRadius: '4px'
                    }}
                  >
                    <Flex align="center" justify="between" style={{
                      padding: '6px 0',
                      borderBottom: index < consoleOutput.length - 1 ? '1px solid #E5E7EB' : 'none'
                    }}>
                      <Text size="2" style={{
                        fontFamily: 'monospace',
                        color: output.isWarning ? '#991B1B' : (output.command ? '#111827' : '#9CA3AF'),
                        fontWeight: output.success ? 400 : 600
                      }}>
                        [{output.line}] {output.command || <em>пустая строка</em>}
                      </Text>
                      <Text size="2" style={{
                        color: output.isWarning ? '#DC2626' : (output.success ? '#10B981' : '#EF4444'),
                        fontWeight: 600,
                        marginLeft: '16px'
                      }}>
                        {output.success ? '✓' : ` ${output.error}`}
                      </Text>
                    </Flex>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </Box>
        </Box>
      </Box>

      <style>{`
        @keyframes coinFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(180deg); }
        }
        @keyframes keyFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .coin-anim {
          animation: coinFloat 2s ease-in-out infinite;
        }
        .key-anim {
          animation: keyFloat 1.5s ease-in-out infinite;
        }
      `}</style>

      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{
              textAlign: 'center',
              fontSize: '24px',
              fontWeight: 700,
              color: '#111827',
              margin: '0 0 24px 0'
            }}>
              Уровень пройден!
            </h2>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <div style={{ background: '#F3F4F6', padding: '10px 16px', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>
                Монеты: {collectedCoins.size}/{totalCoins}
              </div>
              <div style={{ background: '#F3F4F6', padding: '10px 16px', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>
                Ключ: {hasRequiredKey ? 'собран' : 'не собран'}
              </div>
              <div style={{ background: '#F3F4F6', padding: '10px 16px', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>
                Тики: {ticks}
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <button
                onClick={() => { setShowSuccessModal(false); handleReset(); }}
                style={{
                  background: 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Повторить
              </button>
              <button
                onClick={() => { setShowSuccessModal(false); navigate(`/user/levels/${Number(id) + 1}`); }}
                style={{
                  background: '#3B82F6',
                  border: '1px solid #3B82F6',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Следующий уровень
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/user/levels')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6B7280',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '8px 16px'
                }}
              >
                К уровням
              </button>
            </div>
          </div>
        </div>
      )}

      {showFailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{
              textAlign: 'center',
              fontSize: '24px',
              fontWeight: 700,
              color: '#EF4444',
              margin: '0 0 16px 0'
            }}>
              Уровень не пройден
            </h2>

            <p style={{
              textAlign: 'center',
              fontSize: '16px',
              color: '#374151',
              margin: '0 0 24px 0'
            }}>
              {errorMessage}
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px'
            }}>
              <button
                onClick={() => { setShowFailModal(false); handleReset(); }}
                style={{
                  background: 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Попробовать снова
              </button>
              <button
                onClick={() => { setShowFailModal(false); navigate('/user/levels'); }}
                style={{
                  background: '#3B82F6',
                  border: '1px solid #3B82F6',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};

export default LevelPage;
