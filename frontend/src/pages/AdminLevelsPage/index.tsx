import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Text, Flex, Badge, Button } from '@radix-ui/themes';
import { Sidebar } from '../../widgets/Sidebar';
import { getAllLevels, deleteLevel, createLevel, getDifficulties, getLevelStatuses, getAllCommandsForLevel, type Level } from './api';

type ToolType = 'rock' | 'robot' | 'key' | 'coin' | 'exit' | 'enemy' | 'ice' | 'mud' | 'erase';
type CellType = 'empty' | 'rock' | 'robot' | 'key' | 'coin' | 'exit' | 'enemy';
type TerrainType = 'ground' | 'ice' | 'mud';

interface GridCell {
  type: CellType;
  terrain: TerrainType;
  enemyType?: string;
}

const DEFAULT_DIFFICULTIES = [{ difficultyId: 1, name: 'easy' }, { difficultyId: 2, name: 'medium' }, { difficultyId: 3, name: 'hard' }, { difficultyId: 4, name: 'expert' }];
const DEFAULT_STATUSES = [{ levelStatusId: 1, name: 'available' }, { levelStatusId: 2, name: 'blocked' }, { levelStatusId: 3, name: 'hidden' }];
const difficultyLabels: Record<string, string> = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный', expert: 'Эксперт' };
const statusLabels: Record<string, string> = { available: 'Доступен', blocked: 'Заблокирован', hidden: 'Скрыт' };

const BIOMES = [
  { id: 'forest', label: 'Лес', emoji: '🌲', enemy: 'wolf' },
  { id: 'snow', label: 'Снега', emoji: '❄️', enemy: 'snowman' },
  { id: 'desert', label: 'Пустыня', emoji: '🏜️', enemy: 'scorpion' },
  { id: 'cave', label: 'Пещеры', emoji: '⛰️', enemy: 'bat' },
  { id: 'swamp', label: 'Болото', emoji: '🌿', enemy: 'slime' },
  { id: 'volcano', label: 'Вулкан', emoji: '🌋', enemy: 'golem' },
];

const ENEMIES = [
  { id: 'wolf', label: 'Волк', emoji: '🐺' },
  { id: 'snowman', label: 'Снеговик', emoji: '☃️' },
  { id: 'scorpion', label: 'Скорпион', emoji: '🦂' },
  { id: 'vulture', label: 'Стервятник', emoji: '🦅' },
  { id: 'bat', label: 'Летучая мышь', emoji: '🦇' },
  { id: 'golem', label: 'Голем', emoji: '🗿' },
  { id: 'slime', label: 'Слизь', emoji: '🟢' },
];

const DIRECTIONS = [
  { id: 'right', label: 'Вправо' },
  { id: 'down', label: 'Вниз' },
  { id: 'left', label: 'Влево' },
  { id: 'up', label: 'Вверх' },
];

const MAP_CONTAINER_SIZE = 420;
const MIN_SIZE = 3;
const MAX_SIZE = 14;
const MAX_KEYS = 1;
const MAX_COINS = 10;
const MAX_ENEMIES = 8;

const emojiForCell = (cell: GridCell): string => {
  switch (cell.type) {
    case 'robot': return '🤖';
    case 'key': return '🔑';
    case 'coin': return '🪙';
    case 'exit': return '🚪';
    case 'rock': return '🪨';
    case 'enemy': return ENEMIES.find((enemy) => enemy.id === cell.enemyType)?.emoji ?? '👾';
    default: return '';
  }
};

const backgroundForCell = (cell: GridCell): string => {
  if (cell.type === 'rock') return '#4B5563';
  if (cell.type === 'key') return '#FEF3C7';
  if (cell.type === 'coin') return '#FEF9C3';
  if (cell.type === 'exit') return '#D1FAE5';
  if (cell.type === 'robot') return '#DBEAFE';
  if (cell.type === 'enemy') return '#FEE2E2';
  if (cell.terrain === 'ice') return '#DBEAFE';
  if (cell.terrain === 'mud') return '#E8D7B8';
  return '#FFFFFF';
};

const positionOf = (x: number, y: number) => `${String.fromCharCode(65 + x)}${y + 1}`;

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
  const [hint, setHint] = useState('');
  const [biome, setBiome] = useState('forest');
  const [entranceDirection, setEntranceDirection] = useState('right');
  const [threeStarDraft, setThreeStarDraft] = useState('');
  const [mapWidth, setMapWidth] = useState(6);
  const [mapHeight, setMapHeight] = useState(6);
  const [difficultyId, setDifficultyId] = useState(1);
  const [levelStatusId, setLevelStatusId] = useState(1);
  const [selectedCommandIds, setSelectedCommandIds] = useState<number[]>([]);

  const [widthDraft, setWidthDraft] = useState('6');
  const [heightDraft, setHeightDraft] = useState('6');
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>('rock');
  const [selectedEnemyType, setSelectedEnemyType] = useState('wolf');
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
  useEffect(() => { if (showCreateModal) initializeGrid(mapWidth, mapHeight); }, [showCreateModal]);

  const initializeGrid = (width: number, height: number) => {
    const newGrid: GridCell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < width; x++) row.push({ type: 'empty', terrain: 'ground' });
      newGrid.push(row);
    }
    newGrid[0][0] = { type: 'robot', terrain: 'ground' };
    newGrid[height - 1][width - 1] = { type: 'exit', terrain: 'ground' };
    setGrid(newGrid);
  };

  const resizeGrid = (width: number, height: number) => {
    const next: GridCell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < width; x++) {
        const old = grid[y]?.[x];
        row.push(old ? { ...old } : { type: 'empty', terrain: 'ground' });
      }
      next.push(row);
    }
    let robot: [number, number] | null = null;
    let exit: [number, number] | null = null;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (next[y][x].type === 'robot') robot = [x, y];
      if (next[y][x].type === 'exit') exit = [x, y];
    }
    if (!robot) next[0][0].type = 'robot';
    if (!exit) next[height - 1][width - 1].type = 'exit';
    setGrid(next);
  };

  const applyWidth = (val: string) => { const num = parseInt(val, 10); if (!isNaN(num)) { const c = Math.min(MAX_SIZE, Math.max(MIN_SIZE, num)); setMapWidth(c); setWidthDraft(String(c)); resizeGrid(c, mapHeight); } };
  const applyHeight = (val: string) => { const num = parseInt(val, 10); if (!isNaN(num)) { const c = Math.min(MAX_SIZE, Math.max(MIN_SIZE, num)); setMapHeight(c); setHeightDraft(String(c)); resizeGrid(mapWidth, c); } };

  const countCells = (type: CellType) => grid.flat().filter((cell) => cell.type === type).length;

  const handleCellClick = (x: number, y: number) => {
    const next = grid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = next[y][x];
    const clearType = (type: CellType) => {
      for (const row of next) for (const item of row) if (item.type === type) item.type = 'empty';
    };

    switch (selectedTool) {
      case 'rock':
        if (cell.type === 'robot' || cell.type === 'exit') return;
        cell.type = cell.type === 'rock' ? 'empty' : 'rock';
        if (cell.type === 'rock') cell.terrain = 'ground';
        break;
      case 'key':
        if (cell.type === 'robot' || cell.type === 'exit') return;
        if (cell.type === 'key') { cell.type = 'empty'; break; }
        if (countCells('key') >= MAX_KEYS) clearType('key');
        cell.type = 'key';
        break;
      case 'coin':
        if (cell.type === 'robot' || cell.type === 'exit' || cell.type === 'key') return;
        if (cell.type === 'coin') { cell.type = 'empty'; break; }
        if (countCells('coin') >= MAX_COINS) return;
        cell.type = 'coin';
        break;
      case 'robot':
        if (cell.type === 'exit') return;
        clearType('robot');
        cell.type = 'robot';
        break;
      case 'exit':
        if (cell.type === 'robot') return;
        clearType('exit');
        cell.type = 'exit';
        break;
      case 'enemy':
        if (cell.type === 'robot' || cell.type === 'exit' || cell.type === 'key') return;
        if (cell.type === 'enemy') { cell.type = 'empty'; delete cell.enemyType; break; }
        if (countCells('enemy') >= MAX_ENEMIES) return;
        cell.type = 'enemy';
        cell.enemyType = selectedEnemyType;
        break;
      case 'ice':
        cell.terrain = cell.terrain === 'ice' ? 'ground' : 'ice';
        break;
      case 'mud':
        cell.terrain = cell.terrain === 'mud' ? 'ground' : 'mud';
        break;
      case 'erase':
        if (cell.type === 'robot' || cell.type === 'exit') return;
        cell.type = 'empty';
        delete cell.enemyType;
        cell.terrain = 'ground';
        break;
    }
    setGrid(next);
  };

  const handleCellMouseDown = (x: number, y: number) => { setIsDrawing(true); handleCellClick(x, y); };
  const handleCellMouseEnter = (x: number, y: number) => { if (isDrawing) handleCellClick(x, y); };
  const handleMouseUp = () => setIsDrawing(false);

  const generateMapData = () => {
    const rocks: string[] = [];
    const terrain: Record<string, string> = {};
    const coins: Array<{ id: number; position: string }> = [];
    const enemies: Array<{ id: number; type: string; position: string; patrol: string[]; move_every: number }> = [];
    let entrance = 'A1';
    let exit = positionOf(mapWidth - 1, mapHeight - 1);
    let keyPosition: string | null = null;

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const cell = grid[y][x];
        const pos = positionOf(x, y);
        if (cell.terrain !== 'ground') terrain[pos] = cell.terrain;
        if (cell.type === 'rock') rocks.push(pos);
        if (cell.type === 'robot') entrance = pos;
        if (cell.type === 'exit') exit = pos;
        if (cell.type === 'key') keyPosition = pos;
        if (cell.type === 'coin') coins.push({ id: coins.length + 1, position: pos });
        if (cell.type === 'enemy') enemies.push({ id: enemies.length + 1, type: cell.enemyType ?? 'slime', position: pos, patrol: [pos], move_every: 2 });
      }
    }

    const runs = parseInt(threeStarDraft, 10);
    return {
      version: 2,
      level_name: levelName,
      description,
      hint,
      biome,
      width: mapWidth,
      height: mapHeight,
      entrance,
      entrance_direction: entranceDirection,
      exit,
      walls: [],
      rocks,
      terrain,
      coins,
      keys: keyPosition ? [{ id: 1, position: keyPosition }] : [],
      required_key_position: keyPosition,
      enemies,
      ...(runs > 0 ? { three_star_runs: runs } : {}),
    };
  };

  const handleCreateSubmit = async () => {
    if (!levelName.trim()) { alert('Введите название уровня'); return; }
    if (countCells('key') !== MAX_KEYS) { alert(`На карте должен быть ровно ${MAX_KEYS} ключ`); return; }
    if (countCells('coin') > MAX_COINS) { alert(`Максимум ${MAX_COINS} монет`); return; }
    if (countCells('enemy') > MAX_ENEMIES) { alert(`Максимум ${MAX_ENEMIES} врагов`); return; }
    if (selectedCommandIds.length === 0) { alert('Выберите хотя бы одну команду для уровня'); return; }

    try {
      await createLevel({ levelName, description, mapData: generateMapData(), difficultyId, levelStatusId, commandIds: selectedCommandIds });
      setShowCreateModal(false);
      resetForm();
      await loadLevels();
    } catch (err) { alert('Ошибка при создании уровня: ' + (err instanceof Error ? err.message : 'неизвестно')); }
  };

  const resetForm = () => {
    setLevelName(''); setDescription(''); setHint(''); setBiome('forest');
    setEntranceDirection('right'); setThreeStarDraft('');
    setMapWidth(6); setMapHeight(6); setWidthDraft('6'); setHeightDraft('6');
    setDifficultyId(1); setLevelStatusId(1); setSelectedCommandIds([]);
    setGrid([]); setSelectedTool('rock'); setSelectedEnemyType('wolf'); setIsDrawing(false);
  };

  const handleDelete = async (levelId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Удалить уровень?')) return;
    try { await deleteLevel(levelId); await loadLevels(); } catch { alert('Не удалось удалить уровень'); }
  };

  const handleOpenLevel = (levelId: number) => {
    navigate(`/user/levels/${levelId}?preview=true`);
  };

  const longestSide = Math.max(mapWidth, mapHeight);
  const cellSize = Math.max(16, Math.floor((MAP_CONTAINER_SIZE - (longestSide - 1) * 2 - 4) / longestSide));
  const biomeMeta = BIOMES.find((item) => item.id === biome) ?? BIOMES[0];
  const keysOk = countCells('key') === MAX_KEYS;
  const toolConfig: Array<{ id: ToolType; icon: React.ReactNode; label: string }> = [
    { id: 'rock', icon: <span style={{ fontSize: '22px' }}>🪨</span>, label: 'Скала' },
    { id: 'robot', icon: <span style={{ fontSize: '22px' }}>🤖</span>, label: 'Робот' },
    { id: 'exit', icon: <span style={{ fontSize: '22px' }}>🚪</span>, label: 'Выход' },
    { id: 'key', icon: <span style={{ fontSize: '22px' }}>🔑</span>, label: 'Ключ' },
    { id: 'coin', icon: <span style={{ fontSize: '22px' }}>🪙</span>, label: 'Монета' },
    { id: 'enemy', icon: <span style={{ fontSize: '22px' }}>👾</span>, label: 'Враг' },
    { id: 'ice', icon: <span style={{ fontSize: '20px' }}>🧊</span>, label: 'Лёд' },
    { id: 'mud', icon: <span style={{ fontSize: '20px' }}>🟫</span>, label: 'Грязь' },
    { id: 'erase', icon: <span style={{ fontSize: '20px' }}>🧹</span>, label: 'Стереть' },
  ];

  if (isLoading) return <Flex align="center" justify="center" style={{ height: '100vh', background: '#F9FAFB' }}><Text size="3" color="gray">Загрузка...</Text></Flex>;
  if (error) return <Flex style={{ minHeight: '100vh', background: '#F9FAFB' }}><Sidebar /><Flex align="center" justify="center" style={{ flex: 1 }}><Box style={{ background: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center' }}><Text color="red" size="4" weight="bold">Ошибка</Text><Text color="gray" size="2" style={{ marginTop: '12px', display: 'block' }}>{error}</Text></Box></Flex></Flex>;

  return (
    <Flex style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Sidebar />
      <Box style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <Box style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap',
          padding: '24px 28px', borderRadius: '20px', marginBottom: '28px',
          background: 'linear-gradient(120deg, #14233c 0%, #1d3357 55%, #1f4a5f 100%)',
          color: '#eaf1ff', boxShadow: '0 18px 40px rgba(17, 34, 63, 0.2)'
        }}>
          <Box>
            <Text size="1" weight="bold" style={{ letterSpacing: '1.6px', textTransform: 'uppercase', color: '#8fdcc9', display: 'block', marginBottom: '6px' }}>RoboCode · Админка</Text>
            <Text size="7" weight="bold" style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>Управление уровнями</Text>
            <Text size="2" style={{ color: '#b9c9e2' }}>Биомы, скалы, лёд и грязь, враги - всё, что попадёт в симулятор.</Text>
          </Box>
          <Button size="3" onClick={() => setShowCreateModal(true)} style={{ background: '#5b8cff', color: 'white', border: 'none', borderRadius: '12px', padding: '14px 26px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 22px rgba(91, 140, 255, 0.35)' }}>+ Создать уровень</Button>
        </Box>

        <Box style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <Text size="4" weight="bold" style={{ fontSize: '18px', color: '#111827', marginBottom: '20px', display: 'block' }}>Все уровни ({levels.length})</Text>
          {levels.length === 0 ? <Flex justify="center" align="center" style={{ minHeight: '200px' }}><Text size="3" color="gray">Уровни не найдены</Text></Flex> : (
            <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {levels.map((level) => {
                const meta = BIOMES.find((item) => item.id === level.mapData?.biome) ?? BIOMES[0];
                return (
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
                      <Flex align="center" gap="12px" wrap="wrap">
                        <Text size="5" weight="bold" style={{ fontSize: '20px', color: '#111827' }}>{level.levelName || `Уровень ${level.levelId}`}</Text>
                        <Badge color="gray" variant="soft" size="2" style={{ padding: '6px 14px', borderRadius: '16px', fontSize: '13px' }}>{meta.emoji} {meta.label}</Badge>
                        <Badge color={level.levelStatusName === 'Доступен' ? 'green' : level.levelStatusName === 'Заблокирован' ? 'red' : 'gray'} variant="surface" size="2" style={{ padding: '6px 14px', borderRadius: '16px', fontWeight: 600, fontSize: '13px' }}>{level.levelStatusName}</Badge>
                        <Badge color={level.difficultyName === 'Лёгкий' ? 'green' : level.difficultyName === 'Средний' ? 'yellow' : level.difficultyName === 'Сложный' ? 'orange' : 'red'} variant="soft" size="2" style={{ padding: '6px 14px', borderRadius: '16px', fontSize: '13px' }}>{level.difficultyName}</Badge>
                      </Flex>
                      <Button
                        size="2"
                        variant="soft"
                        color="red"
                        onClick={(e) => handleDelete(level.levelId, e)}
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
                        <Text size="2" style={{ color: '#6B7280' }}>Скалы:</Text><Text size="2" weight="bold" style={{ color: '#111827', fontSize: '13px' }}>{level.mapData?.rocks?.length ?? 0}</Text>
                      </Box>
                      <Box style={{ background: '#F9FAFB', padding: '10px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Text size="2" style={{ color: '#6B7280' }}>Враги:</Text><Text size="2" weight="bold" style={{ color: '#111827', fontSize: '13px' }}>{level.mapData?.enemies?.length ?? 0}</Text>
                      </Box>
                      <Box style={{ background: '#F9FAFB', padding: '10px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Text size="2" style={{ color: '#6B7280' }}>3★ за:</Text><Text size="2" weight="bold" style={{ color: '#111827', fontSize: '13px' }}>{level.mapData?.three_star_runs ?? '-'} запусков</Text>
                      </Box>
                      <Box style={{ background: '#F9FAFB', padding: '10px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Text size="2" style={{ color: '#6B7280' }}>Создан:</Text><Text size="2" weight="bold" style={{ color: '#111827', fontSize: '13px' }}>{new Date(level.created).toLocaleDateString('ru-RU')}</Text>
                      </Box>
                    </Flex>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onMouseUp={handleMouseUp}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '1100px', width: '100%', maxHeight: '92vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', boxSizing: 'border-box' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', color: '#111827', fontWeight: 700 }}>Создание уровня</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Название уровня</label>
                  <input type="text" value={levelName} onChange={(e) => setLevelName(e.target.value)} placeholder="Введите название..." style={{ width: '100%', padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Описание уровня</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Введите описание..." rows={2} style={{ width: '100%', padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Подсказка ученику</label>
                  <textarea value={hint} onChange={(e) => setHint(e.target.value)} placeholder="Например: лёд скользит, а врага бей attack()" rows={2} style={{ width: '100%', padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Биом</label>
                    <select
                      value={biome}
                      onChange={(e) => {
                        const nextBiome = e.target.value;
                        setBiome(nextBiome);
                        const defaultEnemy = BIOMES.find((item) => item.id === nextBiome)?.enemy;
                        if (defaultEnemy) setSelectedEnemyType(defaultEnemy);
                      }}
                      style={{ width: '100%', padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'white', cursor: 'pointer', outline: 'none' }}
                    >
                      {BIOMES.map((item) => <option key={item.id} value={item.id}>{item.emoji} {item.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Робот смотрит</label>
                    <select value={entranceDirection} onChange={(e) => setEntranceDirection(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'white', cursor: 'pointer', outline: 'none' }}>
                      {DIRECTIONS.map((dir) => <option key={dir.id} value={dir.id}>{dir.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>3 звезды за (запусков)</label>
                  <input type="text" inputMode="numeric" value={threeStarDraft} onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) setThreeStarDraft(v); }} placeholder="Авто" style={{ width: '100%', padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>Сколько запусков даётся на 3 звезды. Пусто - сервер поставит 3.</div>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Карта уровня · {biomeMeta.emoji} {biomeMeta.label}</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" inputMode="numeric" value={widthDraft} onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) setWidthDraft(v); }} onBlur={(e) => applyWidth(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} title="Ширина" style={{ width: '64px', padding: '8px 10px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                    <Text size="2" style={{ color: '#9CA3AF', alignSelf: 'center' }}>×</Text>
                    <input type="text" inputMode="numeric" value={heightDraft} onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) setHeightDraft(v); }} onBlur={(e) => applyHeight(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} title="Длина" style={{ width: '64px', padding: '8px 10px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ width: '100%', maxWidth: `${MAP_CONTAINER_SIZE}px`, aspectRatio: '1', background: '#D1D5DB', padding: '2px', borderRadius: '8px', marginBottom: '16px', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', boxSizing: 'border-box' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${mapWidth}, ${cellSize}px)`, gridTemplateRows: `repeat(${mapHeight}, ${cellSize}px)`, gap: '2px' }}>
                    {grid.map((row, y) => row.map((cell, x) => (
                      <div
                        key={`${x}-${y}`}
                        onMouseDown={() => handleCellMouseDown(x, y)}
                        onMouseEnter={() => handleCellMouseEnter(x, y)}
                        title={positionOf(x, y)}
                        style={{
                          width: `${cellSize}px`, height: `${cellSize}px`,
                          background: backgroundForCell(cell),
                          border: '1px solid #E5E7EB', borderRadius: '4px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: `${Math.max(13, cellSize * 0.52)}px`, lineHeight: 1,
                          outline: cell.terrain === 'ice' ? '2px solid #93C5FD' : cell.terrain === 'mud' ? '2px solid #C9A46B' : 'none',
                          outlineOffset: '-3px',
                        }}
                      >
                        {emojiForCell(cell)}
                      </div>
                    )))}
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {toolConfig.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => setSelectedTool(tool.id)}
                        style={{
                          padding: '8px 6px',
                          border: `2px solid ${selectedTool === tool.id ? '#3B82F6' : '#E5E7EB'}`,
                          borderRadius: '8px',
                          background: selectedTool === tool.id ? '#EFF6FF' : 'white',
                          cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                        }}
                      >
                        {tool.icon}
                        <span style={{ fontSize: '11px', fontWeight: 600, color: selectedTool === tool.id ? '#3B82F6' : '#6B7280' }}>{tool.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedTool === 'enemy' && (
                  <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Тип врага:</label>
                    <select value={selectedEnemyType} onChange={(e) => setSelectedEnemyType(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', background: 'white', cursor: 'pointer', outline: 'none' }}>
                      {ENEMIES.map((enemy) => <option key={enemy.id} value={enemy.id}>{enemy.emoji} {enemy.label}</option>)}
                    </select>
                  </div>
                )}

                <div style={{ marginBottom: '14px', padding: '12px 16px', borderRadius: '8px', border: '1px solid', background: !keysOk || countCells('coin') > MAX_COINS ? '#FEF2F2' : '#F0FDF4', borderColor: !keysOk || countCells('coin') > MAX_COINS ? '#FCA5A5' : '#86EFAC' }}>
                  <Text size="2" weight="bold" style={{ color: keysOk ? '#166534' : '#991B1B', display: 'block', marginBottom: '2px' }}>🔑 Ключей: {countCells('key')} / {MAX_KEYS} {keysOk ? '✓' : '(нужен ровно 1)'}</Text>
                  <Text size="2" weight="bold" style={{ color: countCells('coin') <= MAX_COINS ? '#166534' : '#991B1B', display: 'block' }}>🪙 Монет: {countCells('coin')} / {MAX_COINS}</Text>
                  <Text size="2" weight="bold" style={{ color: '#374151' }}>👾 Врагов: {countCells('enemy')} / {MAX_ENEMIES} · 🪨 Скал: {countCells('rock')}</Text>
                </div>

                <div style={{ background: '#F3F4F6', padding: '12px', borderRadius: '8px', fontSize: '12.5px', color: '#6B7280', lineHeight: '1.55' }}>
                  <strong>Подсказка:</strong> зажми ЛКМ и веди по карте, чтобы рисовать. Скалы и стены блокируют путь, лёд скользит на 3 клетки, грязь добавляет тик, враг бьёт на 1 HP при контакте. Ключ обязателен для выхода.
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
