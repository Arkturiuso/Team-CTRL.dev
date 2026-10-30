import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Text, Flex, Badge, Button } from '@radix-ui/themes';
import { Sidebar } from '../../widgets/Sidebar';
import { getAllLevels, deleteLevel, createLevel, getDifficulties, getLevelStatuses, getAllCommandsForLevel, type Level, type CreateLevelDto } from './api';

type ToolType = 'wall' | 'robot' | 'key' | 'coin' | 'exit' | 'erase';
type CellType = 'empty' | 'wall' | 'key' | 'coin' | 'robot' | 'exit';
interface GridCell { type: CellType; }

const DEFAULT_DIFFICULTIES = [{ difficultyId: 1, name: 'easy' }, { difficultyId: 2, name: 'medium' }, { difficultyId: 3, name: 'hard' }, { difficultyId: 4, name: 'expert' }];
const DEFAULT_STATUSES = [{ levelStatusId: 1, name: 'available' }, { levelStatusId: 2, name: 'blocked' }, { levelStatusId: 3, name: 'hidden' }];
const difficultyLabels: Record<string, string> = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный', expert: 'Эксперт' };
const statusLabels: Record<string, string> = { available: 'Доступен', blocked: 'Заблокирован', hidden: 'Скрыт' };
const MAP_CONTAINER_SIZE = 400;
const MAX_KEYS = 1;
const MAX_COINS = 5;

const EMOJI_ROBOT = '🤖'; const EMOJI_KEY = '🔑'; const EMOJI_COIN = '🪙'; const EMOJI_EXIT = '🚪'; const EMOJI_ERASE = '🧹';

const AdminLevelsPage: React.FC = () => {
  const navigate = useNavigate();
  const [levels, setLevels] = useState<Level[]>([]);
  const [difficulties, setDifficulties] = useState(DEFAULT_DIFFICULTIES);
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
  const [allCommands, setAllCommands] = useState<Array<{ commandId: number; name: string; syntax: string; description: string | null }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [levelName, setLevelName] = useState('');
  const [description, setDescription] = useState('');
  const [mapWidth, setMapWidth] = useState(6);
  const [mapHeight, setMapHeight] = useState(6);
  const [difficultyId, setDifficultyId] = useState(1);
  const [levelStatusId, setLevelStatusId] = useState(1);
  const [selectedCommandIds, setSelectedCommandIds] = useState<number[]>([]);

  const [widthDraft, setWidthDraft] = useState('6');
  const [heightDraft, setHeightDraft] = useState('6');
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>('wall');
  const [isDrawing, setIsDrawing] = useState(false);

  const loadLevels = async () => {
    try {
      setIsLoading(true); setError(null);
      setLevels(await getAllLevels());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить уровни');
    } finally { setIsLoading(false); }
  };

  const loadMetadata = async () => {
    try {
      const [diffs, stats, cmds] = await Promise.all([
        getDifficulties().catch(() => []),
        getLevelStatuses().catch(() => []),
        getAllCommandsForLevel().catch(() => [])
      ]);
      if (diffs.length > 0) setDifficulties(diffs);
      if (stats.length > 0) setStatuses(stats);
      if (cmds.length > 0) setAllCommands(cmds);
    } catch (err) { console.warn('Не удалось загрузить метаданные', err); }
  };

  useEffect(() => { loadLevels(); loadMetadata(); }, []);
  useEffect(() => { if (showCreateModal) initializeGrid(mapWidth, mapHeight); }, [showCreateModal, mapWidth, mapHeight]);

  const initializeGrid = (width: number, height: number) => {
    const newGrid: GridCell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < width; x++) row.push({ type: 'empty' });
      newGrid.push(row);
    }
    if (height > 0 && width > 0) { newGrid[0][0] = { type: 'robot' }; newGrid[height - 1][width - 1] = { type: 'exit' }; }
    setGrid(newGrid);
  };

  const applyWidth = (val: string) => { const num = parseInt(val, 10); if (!isNaN(num)) { const c = Math.min(12, Math.max(3, num)); setMapWidth(c); setWidthDraft(String(c)); } };
  const applyHeight = (val: string) => { const num = parseInt(val, 10); if (!isNaN(num)) { const c = Math.min(12, Math.max(3, num)); setMapHeight(c); setHeightDraft(String(c)); } };

  const countKeys = () => grid.flat().filter(c => c.type === 'key').length;
  const countCoins = () => grid.flat().filter(c => c.type === 'coin').length;

  const handleCellClick = (x: number, y: number) => {
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    const currentCell = newGrid[y][x];
    const currentKeyCount = countKeys();
    const currentCoinCount = countCoins();

    if (selectedTool === 'wall') {
      if (!['robot', 'exit', 'key', 'coin'].includes(currentCell.type)) currentCell.type = currentCell.type === 'wall' ? 'empty' : 'wall';
    } else if (selectedTool === 'key') {
      if (!['robot', 'exit'].includes(currentCell.type)) {
        if (currentCell.type === 'key') currentCell.type = 'empty';
        else if (currentCell.type === 'coin') currentCell.type = 'key';
        else { if (currentKeyCount >= MAX_KEYS) { for (let r of newGrid) for (let c of r) if (c.type === 'key') c.type = 'empty'; } currentCell.type = 'key'; }
      }
    } else if (selectedTool === 'coin') {
      if (!['robot', 'exit', 'key'].includes(currentCell.type)) {
        if (currentCell.type === 'coin') currentCell.type = 'empty';
        else if (currentCoinCount < MAX_COINS) currentCell.type = 'coin';
      }
    } else if (selectedTool === 'robot') {
      if (currentCell.type !== 'exit') {
        for (let r of newGrid) for (let c of r) if (c.type === 'robot') c.type = 'empty';
        if (!['key', 'coin'].includes(currentCell.type)) currentCell.type = 'robot';
      }
    } else if (selectedTool === 'exit') {
      if (currentCell.type !== 'robot') {
        for (let r of newGrid) for (let c of r) if (c.type === 'exit') c.type = 'empty';
        if (!['key', 'coin'].includes(currentCell.type)) currentCell.type = 'exit';
      }
    } else if (selectedTool === 'erase') {
      if (!['robot', 'exit'].includes(currentCell.type)) currentCell.type = 'empty';
    }
    setGrid(newGrid);
  };

  const handleCellMouseDown = (x: number, y: number) => { setIsDrawing(true); handleCellClick(x, y); };
  const handleCellMouseEnter = (x: number, y: number) => { if (isDrawing) handleCellClick(x, y); };
  const handleMouseUp = () => setIsDrawing(false);

  const generateMapData = () => {
    const walls: Array<{side1: string; side2: string}> = [];
    const keys: Array<{id: number; position: string}> = [];
    const coins: Array<{id: number; position: string}> = [];
    let entrance = 'A1', exit = `${String.fromCharCode(65 + mapWidth - 1)}${mapHeight}`;

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        if (grid[y][x].type === 'robot') entrance = `${String.fromCharCode(65 + x)}${y + 1}`;
        if (grid[y][x].type === 'exit') exit = `${String.fromCharCode(65 + x)}${y + 1}`;
        if (grid[y][x].type === 'key') keys.push({ id: 1, position: `${String.fromCharCode(65 + x)}${y + 1}` });
        if (grid[y][x].type === 'coin') coins.push({ id: coins.length + 1, position: `${String.fromCharCode(65 + x)}${y + 1}` });
      }
    }
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        if (grid[y][x].type === 'wall') {
          if (x < mapWidth - 1 && grid[y][x + 1].type === 'wall') walls.push({ side1: `${String.fromCharCode(65 + x)}${y + 1}`, side2: `${String.fromCharCode(65 + x + 1)}${y + 1}` });
          if (y < mapHeight - 1 && grid[y + 1][x].type === 'wall') walls.push({ side1: `${String.fromCharCode(65 + x)}${y + 1}`, side2: `${String.fromCharCode(65 + x)}${y + 2}` });
        }
      }
    }
    return { width: mapWidth, height: mapHeight, entrance, exit, keys, coins, walls, keys_count: keys.length, coins_count: coins.length, level_name: levelName, description };
  };

  const handleCreateSubmit = async () => {
    if (!levelName.trim()) { alert('Введите название уровня'); return; }
    if (countKeys() !== MAX_KEYS) { alert(`На карте должен быть ровно ${MAX_KEYS} ключ`); return; }
    if (countCoins() > MAX_COINS) { alert(`Максимум ${MAX_COINS} монет`); return; }
    if (selectedCommandIds.length === 0) { alert('Выберите хотя бы одну команду для уровня'); return; }

    try {
      await createLevel({ levelName, description, mapData: generateMapData(), difficultyId, levelStatusId, commandIds: selectedCommandIds });
      setShowCreateModal(false); resetForm(); await loadLevels();
    } catch (err) { alert('Ошибка при создании уровня: ' + (err instanceof Error ? err.message : 'неизвестно')); }
  };

  const resetForm = () => {
    setLevelName(''); setDescription(''); setMapWidth(6); setMapHeight(6);
    setWidthDraft('6'); setHeightDraft('6'); setDifficultyId(1); setLevelStatusId(1);
    setSelectedCommandIds([]); setGrid([]); setSelectedTool('wall');
  };

  const handleDelete = async (levelId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Удалить уровень?')) return;
    try { await deleteLevel(levelId); await loadLevels(); } catch { alert('Не удалось удалить уровень'); }
  };

  const handleOpenLevel = (levelId: number) => {
    navigate(`/user/levels/${levelId}?preview=true`);
  };

  const getCellContent = (cell: GridCell) => cell.type === 'key' ? EMOJI_KEY : cell.type === 'coin' ? EMOJI_COIN : cell.type === 'robot' ? EMOJI_ROBOT : cell.type === 'exit' ? EMOJI_EXIT : '';
  const getCellBackground = (cell: GridCell) => cell.type === 'wall' ? '#374151' : cell.type === 'key' ? '#FEF3C7' : cell.type === 'coin' ? '#FEF9C3' : cell.type === 'exit' ? '#D1FAE5' : cell.type === 'robot' ? '#DBEAFE' : 'white';
  const cellSize = Math.floor(MAP_CONTAINER_SIZE / Math.max(mapWidth, mapHeight));

  if (isLoading) return <Flex align="center" justify="center" style={{ height: '100vh', background: '#F9FAFB' }}><Text size="3" color="gray">Загрузка...</Text></Flex>;
  if (error) return <Flex style={{ minHeight: '100vh', background: '#F9FAFB' }}><Sidebar /><Flex align="center" justify="center" style={{ flex: 1 }}><Box style={{ background: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center' }}><Text color="red" size="4" weight="bold">Ошибка</Text><Text color="gray" size="2" style={{ marginTop: '12px', display: 'block' }}>{error}</Text></Box></Flex></Flex>;

  return (
    <Flex style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Sidebar />
      <Box style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <Flex align="center" justify="between" style={{ marginBottom: '32px' }}>
          <Text size="7" weight="bold" style={{ fontSize: '28px', color: '#111827' }}>Управление уровнями</Text>
          <Button size="3" onClick={() => setShowCreateModal(true)} style={{ background: '#3B82F6', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>+ Создать уровень</Button>
        </Flex>

        <Box style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <Text size="4" weight="bold" style={{ fontSize: '18px', color: '#111827', marginBottom: '20px', display: 'block' }}>Все уровни ({levels.length})</Text>
          {levels.length === 0 ? <Flex justify="center" align="center" style={{ minHeight: '200px' }}><Text size="3" color="gray">Уровни не найдены</Text></Flex> : (
            <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {levels.map((level) => (
                <Box
                  key={level.levelId}
                  onClick={() => handleOpenLevel(level.levelId)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '24px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <Flex align="center" justify="between" style={{ marginBottom: '16px' }}>
                    <Flex align="center" gap="12px">
                      <Text size="5" weight="bold" style={{ fontSize: '20px', color: '#111827' }}>{level.levelName || `Уровень ${level.levelId}`}</Text>
                      <Badge color={level.levelStatusName === 'Доступен' ? 'green' : level.levelStatusName === 'Заблокирован' ? 'red' : 'gray'} variant="surface" size="2" style={{ padding: '6px 14px', borderRadius: '16px', fontWeight: 600, fontSize: '13px' }}>{level.levelStatusName}</Badge>
                      <Badge color={level.difficultyName === 'Лёгкий' ? 'green' : level.difficultyName === 'Средний' ? 'yellow' : level.difficultyName === 'Сложный' ? 'orange' : 'red'} variant="soft" size="2" style={{ padding: '6px 14px', borderRadius: '16px', fontSize: '13px' }}>{level.difficultyName}</Badge>
                    </Flex>
                    <Button
                      size="2"
                      variant="soft"
                      color="red"
                      onClick={(e) => handleDelete(level.levelId, e)} // ✅ stopPropagation внутри
                      style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
                    >
                      🗑️ Удалить
                    </Button>
                  </Flex>
                  <Text size="3" color="gray" style={{ display: 'block', marginBottom: '20px', lineHeight: '1.6', fontSize: '14px' }}>{level.description || 'Описание отсутствует'}</Text>
                  <Flex gap="16px" align="center" wrap="wrap">
                    <Box style={{ background: '#F9FAFB', padding: '10px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text size="2" style={{ color: '#6B7280' }}>Размер:</Text><Text size="2" weight="bold" style={{ color: '#111827', fontSize: '13px' }}>{level.width} × {level.height}</Text>
                    </Box>
                    <Box style={{ background: '#F9FAFB', padding: '10px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text size="2" style={{ color: '#6B7280' }}>Создан:</Text><Text size="2" weight="bold" style={{ color: '#111827', fontSize: '13px' }}>{new Date(level.created).toLocaleDateString('ru-RU')}</Text>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onMouseUp={handleMouseUp}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', color: '#111827', fontWeight: 700 }}>Создание уровня</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Название уровня</label>
                  <input type="text" value={levelName} onChange={(e) => setLevelName(e.target.value)} placeholder="Введите название..." style={{ width: '100%', padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Описание уровня</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Введите описание..." rows={3} style={{ width: '100%', padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Ширина карты</label>
                    <input type="text" inputMode="numeric" value={widthDraft} onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) setWidthDraft(v); }} onBlur={(e) => applyWidth(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} style={{ width: '100%', padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Длина карты</label>
                    <input type="text" inputMode="numeric" value={heightDraft} onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) setHeightDraft(v); }} onBlur={(e) => applyHeight(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} style={{ width: '100%', padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', border: '1px solid', background: countKeys() !== MAX_KEYS || countCoins() > MAX_COINS ? '#FEF2F2' : '#F0FDF4', borderColor: countKeys() !== MAX_KEYS || countCoins() > MAX_COINS ? '#FCA5A5' : '#86EFAC' }}>
                  <Text size="3" weight="bold" style={{ color: countKeys() === MAX_KEYS ? '#166534' : '#991B1B', display: 'block', marginBottom: '4px' }}>{EMOJI_KEY} Ключей: {countKeys()} / {MAX_KEYS} {countKeys() === MAX_KEYS ? '✓' : '(нужно ровно 1)'}</Text>
                  <Text size="3" weight="bold" style={{ color: countCoins() <= MAX_COINS ? '#166534' : '#991B1B' }}>{EMOJI_COIN} Монет: {countCoins()} / {MAX_COINS} {countCoins() <= MAX_COINS ? '✓' : '(превышено!)'}</Text>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Доступные команды на уровне *</label>
                  <div style={{ background: '#F9FAFB', border: '2px solid #E5E7EB', borderRadius: '10px', padding: '16px', maxHeight: '200px', overflowY: 'auto' }}>
                    {allCommands.length === 0 ? (
                      <Text size="2" color="gray" style={{ textAlign: 'center', display: 'block', padding: '20px 0' }}>Команды не найдены. Сначала создайте их в "База знаний".</Text>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {allCommands.map(cmd => {
                          const isSelected = selectedCommandIds.includes(cmd.commandId);
                          return (
                            <label key={cmd.commandId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: isSelected ? '#EFF6FF' : 'white', border: `2px solid ${isSelected ? '#3B82F6' : '#E5E7EB'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                              <input type="checkbox" checked={isSelected} onChange={(e) => { if (e.target.checked) setSelectedCommandIds([...selectedCommandIds, cmd.commandId]); else setSelectedCommandIds(selectedCommandIds.filter(id => id !== cmd.commandId)); }} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3B82F6' }} />
                              <Box style={{ flex: 1 }}>
                                <Text size="2" weight="bold" style={{ fontFamily: 'monospace', color: isSelected ? '#1E40AF' : '#374151', display: 'block', marginBottom: '2px' }}>{cmd.syntax}</Text>
                                <Text size="1" style={{ color: '#6B7280', fontSize: '12px' }}>{cmd.description || cmd.name}</Text>
                              </Box>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>Выбрано: <strong style={{ color: selectedCommandIds.length > 0 ? '#3B82F6' : '#9CA3AF' }}>{selectedCommandIds.length}</strong></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Сложность</label>
                    <select value={difficultyId} onChange={(e) => setDifficultyId(parseInt(e.target.value))} style={{ width: '100%', padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'white', cursor: 'pointer', outline: 'none' }}>
                      {difficulties.map(d => <option key={d.difficultyId} value={d.difficultyId}>{difficultyLabels[d.name] || d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Статус</label>
                    <select value={levelStatusId} onChange={(e) => setLevelStatusId(parseInt(e.target.value))} style={{ width: '100%', padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'white', cursor: 'pointer', outline: 'none' }}>
                      {statuses.map(s => <option key={s.levelStatusId} value={s.levelStatusId}>{statusLabels[s.name] || s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Карта уровня</label>
                <div style={{ width: `${MAP_CONTAINER_SIZE}px`, height: `${MAP_CONTAINER_SIZE}px`, background: '#D1D5DB', padding: '2px', borderRadius: '8px', marginBottom: '20px', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${mapWidth}, ${cellSize}px)`, gridTemplateRows: `repeat(${mapHeight}, ${cellSize}px)`, gap: '2px' }}>
                    {grid.map((row, y) => row.map((cell, x) => (
                      <div key={`${x}-${y}`} onMouseDown={() => handleCellMouseDown(x, y)} onMouseEnter={() => handleCellMouseEnter(x, y)} style={{ width: `${cellSize}px`, height: `${cellSize}px`, background: getCellBackground(cell), border: '1px solid #E5E7EB', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `${Math.max(14, cellSize * 0.55)}px`, lineHeight: 1 }}>{getCellContent(cell)}</div>
                    )))}
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Инструменты</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['wall', 'robot', 'key', 'coin', 'exit', 'erase'] as ToolType[]).map(tool => {
                      const cfg: any = {
                        wall: { icon: <div style={{ width: '22px', height: '22px', background: '#374151', borderRadius: '3px' }} />, label: 'Стена' },
                        robot: { icon: <span style={{ fontSize: '22px' }}>{EMOJI_ROBOT}</span>, label: 'Робот' },
                        key: { icon: <span style={{ fontSize: '22px' }}>{EMOJI_KEY}</span>, label: 'Ключ' },
                        coin: { icon: <span style={{ fontSize: '22px' }}>{EMOJI_COIN}</span>, label: 'Монета' },
                        exit: { icon: <span style={{ fontSize: '22px' }}>{EMOJI_EXIT}</span>, label: 'Выход' },
                        erase: { icon: <span style={{ fontSize: '22px' }}>{EMOJI_ERASE}</span>, label: 'Стереть' }
                      }[tool];
                      return (
                        <button key={tool} onClick={() => setSelectedTool(tool)} style={{ flex: 1, padding: '10px 8px', border: `2px solid ${selectedTool === tool ? '#3B82F6' : '#E5E7EB'}`, borderRadius: '8px', background: selectedTool === tool ? '#EFF6FF' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          {cfg.icon}
                          <span style={{ fontSize: '11px', fontWeight: 600, color: selectedTool === tool ? '#3B82F6' : '#6B7280' }}>{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ background: '#F3F4F6', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#6B7280', lineHeight: '1.5' }}>
                  <strong>Подсказка:</strong> Зажмите ЛКМ и водите по карте, чтобы рисовать стены. Клик — поставить элемент.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #F3F4F6' }}>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} style={{ padding: '12px 24px', border: '2px solid #E5E7EB', borderRadius: '10px', background: 'white', color: '#374151', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Отмена</button>
              <button onClick={handleCreateSubmit} style={{ padding: '12px 28px', border: 'none', borderRadius: '10px', background: '#3B82F6', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)' }}>Сохранить уровень</button>
            </div>
          </div>
        </div>
      )}
    </Flex>
  );
};

export default AdminLevelsPage;
