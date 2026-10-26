import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Flex, Box, Text, Button, Progress } from '@radix-ui/themes';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevel, submitAttempt } from './api';

const ROBOT_EMOJI = String.fromCodePoint(0x1F916);
const KEY_EMOJI = String.fromCodePoint(0x1F511);
const DOOR_EMOJI = String.fromCodePoint(0x1F6AA);
const COIN_EMOJI = String.fromCodePoint(0x1FA99);

interface RobotState { x: number; y: number; direction: 'up' | 'right' | 'down' | 'left'; }
interface ConsoleLine { line: number; command: string; success: boolean; error?: string; isWarning?: boolean; }

const LevelPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const levelId = Number(id);

  const [level, setLevel] = useState<any>(null);
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
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorLines, setErrorLines] = useState<Set<number>>(new Set());
  const [lastAttemptResult, setLastAttemptResult] = useState<any>(null);

  const [robot, setRobot] = useState<RobotState>({ x: 0, y: 0, direction: 'right' });
  const consoleRef = useRef<HTMLDivElement>(null);

  const REQUIRED_KEY_POSITION = level?.mapData?.required_key_position || 'C3';

  useEffect(() => {
    const fetchLevel = async () => {
      try {
        setIsLoading(true);
        const data = await getLevel(levelId);
        setLevel(data);
        const entrance = parsePosition(data.mapData.entrance);
        setRobot({ x: entrance.x, y: entrance.y, direction: 'right' });
        setHasRequiredKey(false);
        setCollectedCoins(new Set());
        setTimeout(() => setShowWelcomeModal(true), 300);
      } catch (err) {
        console.error('Failed to load level:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLevel();
  }, [levelId]);

  useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [consoleOutput]);

  function parsePosition(pos: string): { x: number; y: number } {
    return { x: pos.charCodeAt(0) - 65, y: parseInt(pos.slice(1)) - 1 };
  }

  function hasWall(walls: any[], pos1: string, pos2: string): boolean {
    return walls.some(w => (w.side1 === pos1 && w.side2 === pos2) || (w.side1 === pos2 && w.side2 === pos1));
  }

  // ✅ Новая функция: проверяет, есть ли стена впереди робота
  function isWallAhead(robot: RobotState, walls: any[], mapWidth: number, mapHeight: number): boolean {
    const { x, y, direction } = robot;
    let newX = x, newY = y;
    if (direction === 'up') newY = y - 1;
    else if (direction === 'down') newY = y + 1;
    else if (direction === 'left') newX = x - 1;
    else if (direction === 'right') newX = x + 1;

    if (newX < 0 || newX >= mapWidth || newY < 0 || newY >= mapHeight) return true;

    const pos = `${String.fromCharCode(65 + x)}${y + 1}`;
    const newPos = `${String.fromCharCode(65 + newX)}${newY + 1}`;
    return hasWall(walls, pos, newPos);
  }

  const DIRECTIONS = ['up', 'right', 'down', 'left'];
  const getCoins = () => (level?.mapData?.keys || []).filter((k: any) => k.position !== REQUIRED_KEY_POSITION);
  const getCoinsCount = () => getCoins().length;
  const getWalls = () => level?.mapData?.walls || [];

  // ✅ Обновлённая логика выполнения команд под новый синтаксис
  const executeCommand = async (command: string, currentRobot: RobotState, currentCoins: Set<number>, currentHasKey: boolean) => {
    const { x, y, direction } = currentRobot;
    const pos = `${String.fromCharCode(65 + x)}${y + 1}`;
    const coins = getCoins();
    const walls = getWalls();

    // ✅ move() — движение вперёд по текущему направлению
    if (command === 'move()') {
      let newX = x, newY = y;
      if (direction === 'up') newY = y - 1;
      else if (direction === 'down') newY = y + 1;
      else if (direction === 'left') newX = x - 1;
      else if (direction === 'right') newX = x + 1;

      if (newX < 0 || newX >= level.mapData.width || newY < 0 || newY >= level.mapData.height) {
        return { robot: currentRobot, coins: currentCoins, hasKey: currentHasKey, success: false, error: 'Выход за границы карты', isCritical: true };
      }

      const newPos = `${String.fromCharCode(65 + newX)}${newY + 1}`;
      if (hasWall(walls, pos, newPos)) {
        return { robot: currentRobot, coins: currentCoins, hasKey: currentHasKey, success: false, error: 'Стена на пути', isCritical: true };
      }

      const newRobot = { ...currentRobot, x: newX, y: newY };
      const newCoins = new Set(currentCoins);
      const coinAtPos = coins.find((c: any) => c.position === newPos);
      if (coinAtPos && !newCoins.has(coinAtPos.id)) newCoins.add(coinAtPos.id);

      const newHasKey = currentHasKey || (newPos === REQUIRED_KEY_POSITION);

      return { robot: newRobot, coins: newCoins, hasKey: newHasKey, success: true, isCritical: false };
    }

    // ✅ turn_left()
    if (command === 'turn_left()') {
      const dirIndex = DIRECTIONS.indexOf(direction);
      return { robot: { ...currentRobot, direction: DIRECTIONS[(dirIndex - 1 + 4) % 4] as any }, coins: currentCoins, hasKey: currentHasKey, success: true, isCritical: false };
    }

    // ✅ turn_right()
    if (command === 'turn_right()') {
      const dirIndex = DIRECTIONS.indexOf(direction);
      return { robot: { ...currentRobot, direction: DIRECTIONS[(dirIndex + 1) % 4] as any }, coins: currentCoins, hasKey: currentHasKey, success: true, isCritical: false };
    }

    // ✅ if_clear(команда) — выполняем внутреннюю команду только если впереди нет стены
    const ifClearMatch = command.match(/^if_clear\((.+)\)$/i);
    if (ifClearMatch) {
      const innerCommand = ifClearMatch[1].trim();
      const wallAhead = isWallAhead(currentRobot, walls, level.mapData.width, level.mapData.height);

      if (wallAhead) {
        // Стена впереди — пропускаем действие, но это не считается ошибкой
        return { robot: currentRobot, coins: currentCoins, hasKey: currentHasKey, success: true, isCritical: false, skipped: true };
      }

      // Рекурсивно выполняем внутреннюю команду
      return await executeCommand(innerCommand, currentRobot, currentCoins, currentHasKey);
    }

    return { robot: currentRobot, coins: currentCoins, hasKey: currentHasKey, success: false, error: `Неизвестная команда: ${command}`, isCritical: false };
  };

  const handleDeleteLine = (index: number) => {
    if (isRunning) return;
    const newLines = codeLines.filter((_, i) => i !== index);
    const newCode = newLines.join('\n');
    setCode(newCode);
    if (currentLine === index) {
      setCurrentLine(null);
    } else if (currentLine !== null && currentLine > index) {
      setCurrentLine(currentLine - 1);
    }
    if (errorLines.has(index)) {
      const newErrors = new Set<number>();
      errorLines.forEach(errIdx => {
        if (errIdx !== index) {
          newErrors.add(errIdx > index ? errIdx - 1 : errIdx);
        }
      });
      setErrorLines(newErrors);
    }
  };

  // ✅ Функция разворачивания repeat(команда, количество)
  const expandRepeatCommands = (rawLines: string[]): string[] => {
    const expanded: string[] = [];
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      const repeatMatch = line.match(/^repeat\(\s*(.+?)\s*,\s*(\d+)\s*\)$/i);

      if (repeatMatch) {
        const commandToRepeat = repeatMatch[1].trim();
        const count = parseInt(repeatMatch[2], 10);
        const safeCount = Math.min(Math.max(count, 0), 100); // защита от зависания

        for (let j = 0; j < safeCount; j++) {
          expanded.push(commandToRepeat);
        }
      } else {
        expanded.push(line);
      }
    }
    return expanded;
  };

  const handleRunCode = async () => {
    const rawLines = code.split('\n').filter(line => line.trim());
    if (rawLines.length === 0) return;

    // ✅ Разворачиваем repeat() перед выполнением
    const lines = expandRepeatCommands(rawLines);

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

      const result = await executeCommand(command, currentRobot, currentCoins, currentHasKey);
      results.push({ line: startLine + i, command, success: result.success, error: result.error, isWarning: !result.isCritical && !result.success });

      if (!result.success) {
        if (result.isCritical) {
          newErrorLines.add(i);
          setConsoleOutput(prev => [...prev, ...results]);
          setErrorLines(new Set(newErrorLines));
          setErrorMessage(result.error || 'Неизвестная ошибка');

          await submitAttempt({
            levelId,
            commands: lines.slice(0, i + 1),
            sourceCode: lines.slice(0, i + 1).join('\n'),
            tickCount: i + 1,
            totalScore: 0,
            status: 'error',
            errorMessage: result.error
          });

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
    setTicks(prev => prev + lines.length);
    setCode('');

    const exitPos = parsePosition(level.mapData.exit);
    const reachedExit = currentRobot.x === exitPos.x && currentRobot.y === exitPos.y;

    if (reachedExit) {
      if (!currentHasKey) {
        setConsoleOutput(prev => [...prev, { line: prev.length + 1, command: '—', success: false, error: 'Дверь заперта! Найдите и соберите обязательный ключ 🔑' }]);
        await submitAttempt({ levelId, commands: lines, sourceCode: lines.join('\n'), tickCount: lines.length, totalScore: 0, status: 'error', errorMessage: 'Дверь заперта! Ключ не собран.' });
      } else {
        const result = await submitAttempt({
          levelId,
          commands: lines,
          sourceCode: lines.join('\n'),
          tickCount: lines.length,
          totalScore: 3,
          status: 'success'
        });

        setLastAttemptResult(result?.data || result);
        setTimeout(() => setShowSuccessModal(true), 500);
      }
    } else {
      setConsoleOutput(prev => [...prev, { line: prev.length + 1, command: '—', success: false, error: 'Робот не достиг выхода. Продолжайте писать код!' }]);
    }
  };

  const handleAddCommand = (command: string) => {
    if (isRunning) return;
    setCode(prev => {
      const trimmed = prev.trimEnd();
      // ✅ Шаблоны для новых команд
      let cmdToAdd = command;
      if (command === 'repeat()') cmdToAdd = 'repeat(move(), 3)';
      if (command === 'if_clear()') cmdToAdd = 'if_clear(move())';

      return trimmed === '' ? cmdToAdd + '\n' : trimmed + '\n' + cmdToAdd + '\n';
    });
  };

  const handleReset = () => {
    const entrance = parsePosition(level.mapData.entrance);
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

  if (isLoading) return <Flex align="center" justify="center" style={{ height: '100vh', background: '#F3F4F6' }}><Text size="3" color="gray">Загрузка уровня...</Text></Flex>;
  if (!level) return <Flex align="center" justify="center" style={{ height: '100vh', background: '#F3F4F6' }}><Text color="red" size="3">Уровень не найден</Text></Flex>;

  const coins = getCoins();
  const totalCoins = getCoinsCount();
  const codeLines = code === '' ? [''] : code.split('\n');
  const CELL_SIZE = 50;
  const getRotation = (dir: string) => ({ up: 0, right: 90, down: 180, left: 270 }[dir] || 0);

  const robotLeft = robot.x * CELL_SIZE + (CELL_SIZE - 36) / 2;
  const robotTop = robot.y * CELL_SIZE + (CELL_SIZE - 36) / 2;
  const keyPos = parsePosition(REQUIRED_KEY_POSITION);
  const keyLeft = keyPos.x * CELL_SIZE + 8;
  const keyTop = keyPos.y * CELL_SIZE + 8;

  return (
    <Box style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>
      {/* === ПРИВЕТСТВЕННАЯ МОДАЛКА === */}
      {showWelcomeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '32px',
            maxWidth: '500px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 16px 0' }}>
              Правила уровня {level.levelId}
            </h2>
            <p style={{ textAlign: 'center', fontSize: '15px', color: '#6B7280', marginBottom: '24px', lineHeight: '1.5' }}>
              Для прохождения этого уровня вы можете использовать только следующие команды. Они также доступны в правой панели «Команды».
            </p>
            <Box style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', marginBottom: '24px', maxHeight: '220px', overflowY: 'auto', border: '1px solid #E5E7EB' }}>
              {(level.allowedCommands || []).map((cmd: any, idx: number) => (
                <Flex key={idx} gap="2" align="center" style={{ marginBottom: idx < (level.allowedCommands.length - 1) ? '10px' : '0' }}>
                  <Text size="2" weight="bold" style={{ fontFamily: 'monospace', color: '#3B82F6', minWidth: '140px' }}>{cmd.syntax}</Text>
                  <Text size="2" color="gray" style={{ lineHeight: '1.4' }}>{cmd.description}</Text>
                </Flex>
              ))}
              {(level.allowedCommands || []).length === 0 && (
                <Text size="2" color="gray" style={{ textAlign: 'center', display: 'block' }}>На этом уровне пока нет доступных команд.</Text>
              )}
            </Box>
            <Flex justify="center" gap="2">
              <button
                onClick={() => setShowWelcomeModal(false)}
                style={{
                  background: '#3B82F6', border: '1px solid #3B82F6', borderRadius: '8px',
                  padding: '10px 24px', fontSize: '14px', fontWeight: 600, color: 'white',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
              >
                Понятно, начать!
              </button>
            </Flex>
          </div>
        </div>
      )}

      {/* ВЕРХНЯЯ ПАНЕЛЬ */}
      <Box style={{
        background: 'white',
        padding: '20px 32px',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/user/levels')}
              style={{
                background: 'white', border: '1px solid #D1D5DB', borderRadius: '8px',
                padding: '10px 18px', fontSize: '14px', fontWeight: 500, color: '#374151',
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.borderColor = '#9CA3AF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
            >
              ← Уровни
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '0 8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: hasRequiredKey ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 {hasRequiredKey ? 'Ключ собран' : 'Ключ не найден'}
              </span>
              <span style={{ fontSize: '15px', fontWeight: 500, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🪙 Монеты: {collectedCoins.size}/{totalCoins}
              </span>
              <span style={{ fontSize: '15px', fontWeight: 500, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⏱ Тики: {ticks}
              </span>
            </div>

            <Text size="5" weight="bold" style={{ color: '#111827', whiteSpace: 'nowrap' }}>
              Уровень {level.levelId}: {level.levelName}
            </Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setShowCommands(!showCommands)}
              style={{
                background: showCommands ? '#EFF6FF' : 'white', border: '1px solid #D1D5DB',
                borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: 500,
                color: '#374151', cursor: 'pointer', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#3B82F6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = showCommands ? '#EFF6FF' : 'white'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
            >
              ⌨ Команды
            </button>
            <button
              onClick={() => navigate('/user/levels')}
              style={{
                background: 'white', border: '1px solid #D1D5DB', borderRadius: '8px',
                padding: '10px 18px', fontSize: '14px', fontWeight: 500, color: '#374151',
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#374151'; }}
            >
              Выйти
            </button>
          </div>
        </div>

        {isRunning && (
          <Box style={{ marginTop: '16px', maxWidth: '1400px', margin: '16px auto 0 auto' }}>
            <Flex align="center" gap="2" style={{ marginBottom: '8px' }}>
              <Text size="2" color="gray" weight="medium">Выполнение...</Text>
              <Text size="2" weight="bold" style={{ color: '#3B82F6' }}>{Math.round(executionProgress)}%</Text>
            </Flex>
            <Progress value={executionProgress} size="2" style={{ width: '100%' }} />
          </Box>
        )}
      </Box>

      {/* ОСНОВНАЯ ОБЛАСТЬ */}
      <Box style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto', position: 'relative' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* РЕДАКТОР КОДА */}
          <Box style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <Text size="4" weight="bold" style={{ marginBottom: '16px', display: 'block' }}>Редактор кода</Text>
            <Box style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', maxHeight: '400px', overflowY: 'auto' }}>
              {codeLines.map((line, index) => {
                const isCurrent = currentLine === index;
                const isError = errorLines.has(index);
                return (
                  <Flex key={index} align="center" style={{ borderBottom: index < codeLines.length - 1 ? '1px solid #E5E7EB' : 'none', minHeight: '36px', background: isCurrent ? '#FEF3C7' : isError ? '#FEE2E2' : 'transparent' }}>
                    <Box style={{ width: '40px', padding: '0 8px', background: isCurrent ? '#FDE68A' : isError ? '#FECACA' : '#F3F4F6', color: isError ? '#991B1B' : '#6B7280', fontSize: '13px', fontFamily: 'monospace', textAlign: 'right', borderRight: '1px solid #E5E7EB', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{index + 1}</Box>
                    <input type="text" value={line} onChange={(e) => {
                      if (!isRunning) {
                        const newLines = [...codeLines]; newLines[index] = e.target.value; setCode(newLines.join('\n'));
                        if (errorLines.has(index)) { const n = new Set(errorLines); n.delete(index); setErrorLines(n); }
                      }
                    }} placeholder="Введите команду..." disabled={isRunning} style={{ flex: 1, border: 'none', background: 'transparent', padding: '8px 12px', fontSize: '14px', fontFamily: 'monospace', outline: 'none', color: isError ? '#991B1B' : '#111827' }} />
                    {isCurrent && <Box style={{ padding: '0 8px', color: '#F59E0B', fontSize: '14px' }}>▶</Box>}
                    {!isRunning && codeLines.length > 1 && (
                      <button
                        onClick={() => handleDeleteLine(index)}
                        style={{
                          background: 'transparent', border: 'none', color: '#9CA3AF', fontSize: '18px',
                          cursor: 'pointer', padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s ease', lineHeight: 1
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEE2E2'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.background = 'transparent'; }}
                        title="Удалить строку"
                      >
                        ×
                      </button>
                    )}
                  </Flex>
                );
              })}
            </Box>
            <Button variant="ghost" size="1" onClick={() => setCode(code + '\n')} disabled={isRunning} style={{ marginTop: '12px', color: '#3B82F6' }}>+ Добавить строку</Button>
            <Button size="3" onClick={handleRunCode} disabled={isRunning || code.trim() === ''} style={{ marginTop: '12px', width: '100%', background: isRunning ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '15px', fontWeight: 600, cursor: isRunning ? 'not-allowed' : 'pointer' }}>
              {isRunning ? '⏳ Выполнение...' : '▶ Запустить'}
            </Button>
          </Box>

          {/* ИГРОВОЕ ПОЛЕ */}
          <Box style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <Text size="4" weight="bold" style={{ marginBottom: '16px', display: 'block' }}>Игровое поле</Text>
            <Box style={{ background: '#F9FAFB', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'center', overflow: 'auto', border: '1px solid #E5E7EB' }}>
              <div style={{ position: 'relative', width: `${level.mapData.width * CELL_SIZE}px`, height: `${level.mapData.height * CELL_SIZE}px`, background: 'white', borderRadius: '8px', border: '2px solid #374151', overflow: 'hidden' }}>
                {Array.from({ length: level.mapData.height * level.mapData.width }).map((_, index) => {
                  const x = index % level.mapData.width;
                  const y = Math.floor(index / level.mapData.width);
                  const pos = `${String.fromCharCode(65 + x)}${y + 1}`;
                  const isExit = pos === level.mapData.exit;
                  return (
                    <div key={index} style={{ position: 'absolute', left: `${x * CELL_SIZE}px`, top: `${y * CELL_SIZE}px`, width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, background: isExit ? '#D1FAE5' : 'white', border: '1px solid #E5E7EB', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>
                      {isExit && DOOR_EMOJI}
                    </div>
                  );
                })}
                {getWalls().map((wall: any) => {
                  const pos1 = parsePosition(wall.side1);
                  const pos2 = parsePosition(wall.side2);
                  const isHorizontal = pos1.y === pos2.y;
                  const style: React.CSSProperties = isHorizontal
                    ? { position: 'absolute', left: `${Math.min(pos1.x, pos2.x) * CELL_SIZE}px`, top: `${pos1.y * CELL_SIZE}px`, width: `${(Math.max(pos1.x, pos2.x) - Math.min(pos1.x, pos2.x) + 1) * CELL_SIZE}px`, height: '4px', background: '#1F2937', zIndex: 10, borderRadius: '2px' }
                    : { position: 'absolute', left: `${pos1.x * CELL_SIZE}px`, top: `${Math.min(pos1.y, pos2.y) * CELL_SIZE}px`, width: '4px', height: `${(Math.max(pos1.y, pos2.y) - Math.min(pos1.y, pos2.y) + 1) * CELL_SIZE}px`, background: '#1F2937', zIndex: 10, borderRadius: '2px' };
                  return <div key={wall.id} style={style} />;
                })}

                {coins.map((coin: any) => {
                  const pos = parsePosition(coin.position);
                  if (collectedCoins.has(coin.id)) return null;
                  return (
                    <div key={coin.id} className="coin-anim" style={{ position: 'absolute', left: `${pos.x * CELL_SIZE + 8}px`, top: `${pos.y * CELL_SIZE + 8}px`, width: `${CELL_SIZE - 16}px`, height: `${CELL_SIZE - 16}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', zIndex: 5, pointerEvents: 'none' }}>
                      {COIN_EMOJI}
                    </div>
                  );
                })}

                {!hasRequiredKey && (
                  <div className="key-anim" style={{ position: 'absolute', left: `${keyLeft}px`, top: `${keyTop}px`, width: `${CELL_SIZE - 16}px`, height: `${CELL_SIZE - 16}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', zIndex: 15, pointerEvents: 'none', filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))' }}>
                    {KEY_EMOJI}
                  </div>
                )}

                <div style={{ position: 'absolute', left: `${robotLeft}px`, top: `${robotTop}px`, width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', zIndex: 20, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))', transition: 'left 0.3s ease, top 0.3s ease', transform: `rotate(${getRotation(robot.direction)}deg)` }}>
                  {ROBOT_EMOJI}
                </div>
              </div>
            </Box>
          </Box>
        </div>

        {/* ✅ ПАНЕЛЬ КОМАНД — ПОВЕРХ КОНТЕНТА (position: absolute) */}
        {showCommands && (
          <Box style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            width: '300px',
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 50,
            border: '1px solid #E5E7EB'
          }}>
            <Flex align="center" justify="between" style={{ marginBottom: '16px' }}>
              <Text size="4" weight="bold">Доступные команды</Text>
              <Button variant="ghost" size="1" onClick={() => setShowCommands(false)} style={{ padding: '4px' }}>✕</Button>
            </Flex>
            {(level.allowedCommands || []).map((item: any) => (
              <Box key={item.commandId} onClick={() => handleAddCommand(item.syntax)} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', marginBottom: '10px', cursor: isRunning ? 'not-allowed' : 'pointer', opacity: isRunning ? 0.5 : 1, transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => { if (!isRunning) { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#3B82F6'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#E5E7EB'; }}>
                <Text size="2" weight="bold" style={{ display: 'block', fontFamily: 'monospace', color: '#111827', marginBottom: '4px' }}>{item.syntax}</Text>
                <Text size="1" color="gray" style={{ lineHeight: '1.4' }}>• {item.description}</Text>
              </Box>
            ))}
          </Box>
        )}

        {/* КОНСОЛЬ */}
        <Box style={{ marginTop: '24px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <Text size="4" weight="bold" style={{ marginBottom: '16px', display: 'block' }}>Консоль выполнения</Text>
          <Box ref={consoleRef} style={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '16px', minHeight: '140px', maxHeight: '200px', overflowY: 'auto', fontFamily: 'monospace', color: '#E5E7EB' }}>
            {consoleOutput.length === 0 ? (
              <Text size="2" style={{ color: '#9CA3AF' }}>Запустите код, чтобы увидеть результат...</Text>
            ) : (
              <AnimatePresence>
                {consoleOutput.map((output, index) => (
                  <motion.div key={`${output.line}-${output.command}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} style={{ background: output.isWarning ? 'rgba(254, 242, 242, 0.1)' : 'transparent', padding: output.isWarning ? '6px 8px' : '6px 0', margin: output.isWarning ? '-6px -8px 4px -8px' : '0', borderRadius: '4px', borderBottom: index < consoleOutput.length - 1 ? '1px solid #374151' : 'none' }}>
                    <Flex align="center" justify="between">
                      <Text size="2" style={{ fontFamily: 'monospace', color: output.isWarning ? '#FCA5A5' : (output.command ? '#E5E7EB' : '#9CA3AF'), fontWeight: output.success ? 400 : 600 }}>
                        [{output.line}] {output.command || <em style={{ color: '#6B7280' }}>пустая строка</em>}
                      </Text>
                      <Text size="2" style={{ color: output.isWarning ? '#F87171' : (output.success ? '#34D399' : '#F87171'), fontWeight: 600, marginLeft: '16px' }}>
                        {output.success ? '✓ OK' : `⚠ ${output.error}`}
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
        @keyframes coinFloat { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-6px) rotate(180deg); } }
        @keyframes keyFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .coin-anim { animation: coinFloat 2s ease-in-out infinite; }
        .key-anim { animation: keyFloat 1.5s ease-in-out infinite; }
      `}</style>

      {/* МОДАЛКА УСПЕХА — С ЗВЁЗДАМИ С БЭКЕНДА */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '32px',
            maxWidth: '450px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{
              textAlign: 'center', fontSize: '24px', fontWeight: 700,
              color: '#111827', margin: '0 0 24px 0'
            }}>
              🎉 Уровень пройден!
            </h2>

            {/* ✅ ЗВЁЗДЫ — отображаем полученные с бэкенда */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '8px',
              marginBottom: '24px', fontSize: '32px'
            }}>
              {[1, 2, 3].map((star) => (
                <span
                  key={star}
                  style={{
                    color: star <= (lastAttemptResult?.userStars || 0) ? '#FCD34D' : '#E5E7EB',
                    transition: 'color 0.3s ease'
                  }}
                >
                  ⭐
                </span>
              ))}
            </div>

            <div style={{
              display: 'flex', justifyContent: 'center', gap: '12px',
              marginBottom: '24px', flexWrap: 'wrap'
            }}>
              <div style={{
                background: '#F3F4F6', padding: '12px 16px', borderRadius: '8px',
                textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#374151'
              }}>
                🪙 Монеты: {collectedCoins.size}/{totalCoins}
              </div>
              <div style={{
                background: '#F3F4F6', padding: '12px 16px', borderRadius: '8px',
                textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#374151'
              }}>
                🔑 Ключ: {hasRequiredKey ? 'собран' : 'не нужен'}
              </div>
              <div style={{
                background: '#F3F4F6', padding: '12px 16px', borderRadius: '8px',
                textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#374151'
              }}>
                ⏱ Тики: {ticks}
              </div>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px'
            }}>
              <button
                onClick={() => { setShowSuccessModal(false); handleReset(); }}
                style={{
                  background: 'white', border: '1px solid #D1D5DB', borderRadius: '8px',
                  padding: '10px 20px', fontSize: '14px', fontWeight: 600, color: '#374151',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                Повторить
              </button>
              <button
                onClick={() => { setShowSuccessModal(false); navigate(`/user/levels/${levelId + 1}`); }}
                style={{
                  background: '#3B82F6', border: '1px solid #3B82F6', borderRadius: '8px',
                  padding: '10px 20px', fontSize: '14px', fontWeight: 600, color: 'white',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
              >
                Следующий уровень
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/user/levels')}
                style={{
                  background: 'transparent', border: 'none', color: '#6B7280',
                  fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: '8px 16px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
              >
                К списку уровней
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА ОШИБКИ */}
      {showFailModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '32px',
            maxWidth: '400px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{
              textAlign: 'center', fontSize: '24px', fontWeight: 700,
              color: '#EF4444', margin: '0 0 16px 0'
            }}>
              ❌ Уровень не пройден
            </h2>
            <p style={{
              textAlign: 'center', fontSize: '16px', color: '#374151',
              margin: '0 0 24px 0', lineHeight: '1.5'
            }}>
              {errorMessage}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => { setShowFailModal(false); handleReset(); }}
                style={{
                  background: 'white', border: '1px solid #D1D5DB', borderRadius: '8px',
                  padding: '10px 20px', fontSize: '14px', fontWeight: 600, color: '#374151',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                Попробовать снова
              </button>
              <button
                onClick={() => { setShowFailModal(false); navigate('/user/levels'); }}
                style={{
                  background: '#3B82F6', border: '1px solid #3B82F6', borderRadius: '8px',
                  padding: '10px 20px', fontSize: '14px', fontWeight: 600, color: 'white',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
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
