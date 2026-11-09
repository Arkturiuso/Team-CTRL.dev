import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Text, Flex, Button } from '@radix-ui/themes';
import { Sidebar } from '../../widgets/Sidebar';
import { LevelCard } from '../LevelsPage/components/LevelCard';
import { levelIdOf } from '../LevelsPage/types';
import {
  getAllLevels,
  deleteLevel,
  createLevel,
  getDifficulties,
  getLevelStatuses,
  getAllCommandsForLevel,
  getLevelsActivity,
  type Level,
  type LevelActivity,
} from './api';
import './AdminLevelsPage.less';

// Инструменты конструктора: стены, камни-препятствия, робот, ключ, выход, ластик.
type ToolType = 'wall' | 'rock' | 'robot' | 'key' | 'exit' | 'erase';
type CellType = 'empty' | 'rock' | 'robot' | 'key' | 'exit';

interface GridCell {
  type: CellType;
}

const DEFAULT_DIFFICULTIES = [{ difficultyId: 1, name: 'easy' }, { difficultyId: 2, name: 'medium' }, { difficultyId: 3, name: 'hard' }, { difficultyId: 4, name: 'expert' }];
const DEFAULT_STATUSES = [{ levelStatusId: 1, name: 'available' }, { levelStatusId: 2, name: 'blocked' }, { levelStatusId: 3, name: 'hidden' }];
const difficultyLabels: Record<string, string> = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный', expert: 'Эксперт' };
const statusLabels: Record<string, string> = { available: 'Доступен', blocked: 'Заблокирован', hidden: 'Скрыт' };

const DIRECTIONS = [
  { id: 'right', label: 'Вправо' },
  { id: 'down', label: 'Вниз' },
  { id: 'left', label: 'Влево' },
  { id: 'up', label: 'Вверх' },
];

const MAP_CONTAINER_SIZE = 420;
const MIN_SIZE = 3;
const MAX_SIZE = 14;

// Маркер клетки вместо эмодзи: простая CSS-фигура, тип также виден по фону клетки.
const markerForCell = (cell: GridCell): React.ReactNode => {
  const base: React.CSSProperties = { width: '44%', height: '44%', display: 'block' };
  switch (cell.type) {
    case 'robot': return <span style={{ ...base, background: '#2563EB', borderRadius: '50%' }} />;
    case 'key': return <span style={{ ...base, background: '#B45309', borderRadius: '50%' }} />;
    case 'exit': return <span style={{ ...base, border: '2px solid #047857', borderRadius: 3, boxSizing: 'border-box' }} />;
    case 'rock': return <span style={{ ...base, background: '#374151', borderRadius: 3 }} />;
    default: return null;
  }
};

const backgroundForCell = (cell: GridCell): string => {
  if (cell.type === 'rock') return '#556270';
  if (cell.type === 'key') return '#FEF3C7';
  if (cell.type === 'exit') return '#D1FAE5';
  if (cell.type === 'robot') return '#DBEAFE';
  return '#FFFFFF';
};

const positionOf = (x: number, y: number) => `${String.fromCharCode(65 + x)}${y + 1}`;

// Ребро стены храним как "A1|B1" (отсортированные клетки), как в mapData.
const edgeKey = (a: string, b: string) => [a, b].sort().join('|');

type Side = 'top' | 'right' | 'bottom' | 'left';
const SIDE_DELTA: Record<Side, { dx: number; dy: number }> = {
  top: { dx: 0, dy: -1 },
  bottom: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

const AdminLevelsPage: React.FC = () => {
  const navigate = useNavigate();
  const [levels, setLevels] = useState<Level[]>([]);
  const [activity, setActivity] = useState<LevelActivity[]>([]);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [difficulties, setDifficulties] = useState(DEFAULT_DIFFICULTIES);
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
  const [allCommands, setAllCommands] = useState<Array<{ commandId: number; name: string; syntax: string; description: string | null }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [levelName, setLevelName] = useState('');
  const [description, setDescription] = useState('');
  const [hint, setHint] = useState('');
  const [entranceDirection, setEntranceDirection] = useState('right');
  const [mapWidth, setMapWidth] = useState(6);
  const [mapHeight, setMapHeight] = useState(6);
  const [difficultyId, setDifficultyId] = useState(1);
  const [levelStatusId, setLevelStatusId] = useState(1);
  const [selectedCommandIds, setSelectedCommandIds] = useState<number[]>([]);

  const [widthDraft, setWidthDraft] = useState('6');
  const [heightDraft, setHeightDraft] = useState('6');
  const [grid, setGrid] = useState<GridCell[][]>([]);
  // Стены отдельным множеством рёбер: они живут между клетками, а не внутри.
  const [walls, setWalls] = useState<Set<string>>(new Set());
  const [selectedTool, setSelectedTool] = useState<ToolType>('wall');
  // Реальная ширина контейнера карты: от неё считаем размер клетки, чтобы сетка влезала.
  const [mapBoxWidth, setMapBoxWidth] = useState(MAP_CONTAINER_SIZE);
  const mapBoxRef = useRef<HTMLDivElement>(null);

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
        getAllCommandsForLevel().catch(() => []),
      ]);
      if (diffs.length > 0) setDifficulties(diffs);
      if (stats.length > 0) setStatuses(stats);
      if (cmds.length > 0) setAllCommands(cmds);
    } catch (err) { console.warn('Не удалось загрузить метаданные', err); }
  };

  // Отчёт об активности: при ошибке показываем причину в блоке отчёта.
  const loadActivity = async () => {
    try {
      setActivity(await getLevelsActivity());
      setActivityError(null);
    } catch (err) {
      setActivity([]);
      setActivityError(err instanceof Error ? err.message : 'Не удалось загрузить отчёт');
    }
  };

  useEffect(() => { loadLevels(); loadMetadata(); loadActivity(); }, []);
  useEffect(() => { if (showCreateModal) initializeGrid(mapWidth, mapHeight); }, [showCreateModal]);

  // Следим за шириной контейнера карты: при узком экране ячейки уменьшаются,
  // сетка не вылезает за контейнер и не растягивает страницу.
  useLayoutEffect(() => {
    const box = mapBoxRef.current;
    if (!box) return;
    const update = () => setMapBoxWidth(box.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, [showCreateModal]);

  const initializeGrid = (width: number, height: number) => {
    const newGrid: GridCell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < width; x++) row.push({ type: 'empty' });
      newGrid.push(row);
    }
    newGrid[0][0] = { type: 'robot' };
    newGrid[height - 1][width - 1] = { type: 'exit' };
    setGrid(newGrid);
    setWalls(new Set());
  };

  const resizeGrid = (width: number, height: number) => {
    const next: GridCell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < width; x++) {
        const old = grid[y]?.[x];
        row.push(old ? { ...old } : { type: 'empty' });
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
    // Рёбра, вышедшие за новые границы, просто выбрасываем.
    const valid = new Set<string>();
    for (const edge of walls) {
      const [a, b] = edge.split('|');
      const inBounds = (name: string) => {
        const x = name.charCodeAt(0) - 65;
        const y = parseInt(name.slice(1), 10) - 1;
        return x >= 0 && y >= 0 && x < width && y < height;
      };
      if (inBounds(a) && inBounds(b)) valid.add(edge);
    }
    setWalls(valid);
  };

  const applyWidth = (val: string) => { const num = parseInt(val, 10); if (!isNaN(num)) { const c = Math.min(MAX_SIZE, Math.max(MIN_SIZE, num)); setMapWidth(c); setWidthDraft(String(c)); resizeGrid(c, mapHeight); } };
  const applyHeight = (val: string) => { const num = parseInt(val, 10); if (!isNaN(num)) { const c = Math.min(MAX_SIZE, Math.max(MIN_SIZE, num)); setMapHeight(c); setHeightDraft(String(c)); resizeGrid(mapWidth, c); } };

  const countCells = (type: CellType) => grid.flat().filter((cell) => cell.type === type).length;

  const toggleWall = (x: number, y: number, side: Side) => {
    const delta = SIDE_DELTA[side];
    const nx = x + delta.dx;
    const ny = y + delta.dy;
    if (nx < 0 || ny < 0 || nx >= mapWidth || ny >= mapHeight) return;
    const key = edgeKey(positionOf(x, y), positionOf(nx, ny));
    setWalls((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCellClick = (x: number, y: number) => {
    if (selectedTool === 'wall') return;
    const next = grid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = next[y][x];
    const clearType = (type: CellType) => {
      for (const row of next) for (const item of row) if (item.type === type) item.type = 'empty';
    };

    switch (selectedTool) {
      case 'rock':
        if (cell.type === 'robot' || cell.type === 'exit') return;
        cell.type = cell.type === 'rock' ? 'empty' : 'rock';
        break;
      case 'key':
        if (cell.type === 'robot' || cell.type === 'exit') return;
        if (cell.type === 'key') { cell.type = 'empty'; break; }
        cell.type = 'key';
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
      case 'erase': {
        if (cell.type === 'robot' || cell.type === 'exit') return;
        cell.type = 'empty';
        // Ластик также снимает стены, примыкающие к клетке.
        const removed = new Set(walls);
        (Object.keys(SIDE_DELTA) as Side[]).forEach((side) => {
          const delta = SIDE_DELTA[side];
          const nx = x + delta.dx;
          const ny = y + delta.dy;
          if (nx < 0 || ny < 0 || nx >= mapWidth || ny >= mapHeight) return;
          removed.delete(edgeKey(positionOf(x, y), positionOf(nx, ny)));
        });
        setWalls(removed);
        break;
      }
    }
    setGrid(next);
  };

  const generateMapData = () => {
    const rocks: string[] = [];
    const keys: Array<{ id: number; position: string }> = [];
    const wallList: Array<{ side1: string; side2: string }> = [];
    let entrance = 'A1';
    let exit = positionOf(mapWidth - 1, mapHeight - 1);

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const cell = grid[y][x];
        const pos = positionOf(x, y);
        if (cell.type === 'rock') rocks.push(pos);
        if (cell.type === 'robot') entrance = pos;
        if (cell.type === 'exit') exit = pos;
        if (cell.type === 'key') keys.push({ id: keys.length + 1, position: pos });
      }
    }
    for (const edge of walls) {
      const [side1, side2] = edge.split('|');
      wallList.push({ side1, side2 });
    }

    return {
      version: 3,
      level_name: levelName,
      description,
      hint,
      width: mapWidth,
      height: mapHeight,
      entrance,
      entrance_direction: entranceDirection,
      exit,
      walls: wallList,
      rocks,
      keys,
    };
  };

  const handleCreateSubmit = async () => {
    if (!levelName.trim()) { alert('Введите название уровня'); return; }
    if (selectedCommandIds.length === 0) { alert('Выберите хотя бы одну команду для уровня'); return; }

    try {
      await createLevel({ levelName, description, mapData: generateMapData(), difficultyId, levelStatusId, commandIds: selectedCommandIds });
      setShowCreateModal(false);
      resetForm();
      await loadLevels();
    } catch (err) { alert('Ошибка при создании уровня: ' + (err instanceof Error ? err.message : 'неизвестно')); }
  };

  const resetForm = () => {
    setLevelName(''); setDescription(''); setHint('');
    setEntranceDirection('right');
    setMapWidth(6); setMapHeight(6); setWidthDraft('6'); setHeightDraft('6');
    setDifficultyId(1); setLevelStatusId(1); setSelectedCommandIds([]);
    setGrid([]); setWalls(new Set()); setSelectedTool('wall');
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
  // Размер клетки считаем от фактической ширины контейнера, а не от константы:
  // иначе на узком экране сетка шире контейнера и появляется скролл.
  const mapAvailable = Math.max(0, mapBoxWidth - 4);
  const cellSize = Math.max(16, Math.floor(mapAvailable / longestSide));
  // Иконки инструментов - те же CSS-фигуры, что маркеры клеток, без эмодзи.
  const iconShape = (style: React.CSSProperties): React.ReactNode => (
    <span style={{ width: 18, height: 18, display: 'block', ...style }} />
  );
  const toolConfig: Array<{ id: ToolType; icon: React.ReactNode; label: string }> = [
    { id: 'wall', icon: iconShape({ height: 8, background: '#556270', borderRadius: 2 }), label: 'Стена' },
    { id: 'rock', icon: iconShape({ background: '#374151', borderRadius: 3 }), label: 'Камень' },
    { id: 'robot', icon: iconShape({ background: '#2563EB', borderRadius: '50%' }), label: 'Робот' },
    { id: 'exit', icon: iconShape({ border: '2px solid #047857', borderRadius: 3, boxSizing: 'border-box' }), label: 'Выход' },
    { id: 'key', icon: iconShape({ background: '#B45309', borderRadius: '50%' }), label: 'Ключ' },
    { id: 'erase', icon: iconShape({ border: '2px solid #9CA3AF', borderRadius: 3, boxSizing: 'border-box' }), label: 'Стереть' },
  ];

  if (isLoading) return <Flex align="center" justify="center" style={{ height: '100vh', background: '#F9FAFB' }}><Text size="3" color="gray">Загрузка...</Text></Flex>;
  if (error) return <Flex style={{ minHeight: '100vh', background: '#F9FAFB' }}><Sidebar /><Flex align="center" justify="center" style={{ flex: 1 }}><Box style={{ background: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center' }}><Text color="red" size="4" weight="bold">Ошибка</Text><Text color="gray" size="2" style={{ marginTop: '12px', display: 'block' }}>{error}</Text></Box></Flex></Flex>;

  return (
    <Flex style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Sidebar />
      <Box className="page-content" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <Box className="admin-hero" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap',
          padding: '24px 28px', borderRadius: '20px', marginBottom: '28px',
          background: 'linear-gradient(120deg, #14233c 0%, #1d3357 55%, #1f4a5f 100%)',
          color: '#eaf1ff', boxShadow: '0 18px 40px rgba(17, 34, 63, 0.2)'
        }}>
          <Box>
            <Text size="1" weight="bold" style={{ letterSpacing: '1.6px', textTransform: 'uppercase', color: '#8fdcc9', display: 'block', marginBottom: '6px' }}>RoboCode · Админка</Text>
            <Text size="7" weight="bold" style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>Управление уровнями</Text>
            <Text size="2" style={{ color: '#b9c9e2' }}>Лабиринт: стены между клетками, камни, ключ и выход.</Text>
          </Box>
          <Box className="admin-hero__actions" style={{ display: 'flex', gap: '12px' }}>
            <Button size="3" variant="soft" onClick={loadActivity} style={{ borderRadius: '12px', padding: '14px 20px', fontSize: '14px', fontWeight: 700 }}>↻ Обновить отчёт</Button>
            <Button size="3" onClick={() => setShowCreateModal(true)} style={{ background: '#5b8cff', color: 'white', border: 'none', borderRadius: '12px', padding: '14px 26px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>+ Создать уровень</Button>
          </Box>
        </Box>

        {/* Отчёт об активности игроков по уровням */}
        <Box className="admin-card" style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '28px' }}>
          <Text size="4" weight="bold" style={{ fontSize: '18px', color: '#111827', marginBottom: '16px', display: 'block' }}>Активность игроков по уровням</Text>
          {activityError && (
            <Text size="2" color="gray" style={{ display: 'block', padding: '16px 0' }}>
              Отчёт не загрузился: {activityError}
            </Text>
          )}
          {!activityError && activity.length === 0 && (
            <Text size="2" color="gray" style={{ display: 'block', padding: '16px 0' }}>Активности пока нет.</Text>
          )}
          {activity.length > 0 && (
            <div className="admin-table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#F3F4F6', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>Уровень</th>
                      <th style={{ padding: '10px 12px' }}>Попытки</th>
                      <th style={{ padding: '10px 12px' }}>Успехи</th>
                      <th style={{ padding: '10px 12px' }}>Игроков</th>
                      <th style={{ padding: '10px 12px' }}>Ср. тики</th>
                      <th style={{ padding: '10px 12px' }}>Лучший балл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map((row) => (
                      <tr key={row.levelId} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '10px 12px' }}>{row.levelName ?? `Уровень ${row.levelId}`}</td>
                        <td style={{ padding: '10px 12px' }}>{row.attemptsCount}</td>
                        <td style={{ padding: '10px 12px' }}>{row.successCount}</td>
                        <td style={{ padding: '10px 12px' }}>{row.uniquePlayers}</td>
                        <td style={{ padding: '10px 12px' }}>{row.avgTicks}</td>
                        <td style={{ padding: '10px 12px' }}><strong>{row.bestScore}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          )}
        </Box>

        <Box className="admin-card" style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <Text size="4" weight="bold" style={{ fontSize: '18px', color: '#111827', marginBottom: '20px', display: 'block' }}>Все уровни ({levels.length})</Text>
          {levels.length === 0 ? <Flex justify="center" align="center" style={{ minHeight: '200px' }}><Text size="3" color="gray">Уровни не найдены</Text></Flex> : (
            <div className="admin-levels-grid">
              {levels.map((level) => (
                <LevelCard
                  key={level.levelId}
                  level={level}
                  onOpen={(item) => handleOpenLevel(levelIdOf(item))}
                  allowLocked
                  footerExtra={(
                    <>
                      <span className="level-card__meta">стены {level.mapData?.walls?.length ?? 0}</span>
                      <span className="level-card__meta">создан {new Date(level.created).toLocaleDateString('ru-RU')}</span>
                    </>
                  )}
                  actions={(
                    <Button
                      size="1"
                      variant="soft"
                      color="red"
                      onClick={(e) => handleDelete(level.levelId, e)}
                    >
                      Удалить
                    </Button>
                  )}
                />
              ))}
            </div>
          )}
        </Box>
      </Box>

      {showCreateModal && (
        <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="admin-modal" style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '1100px', width: '100%', maxHeight: '92vh', overflow: 'auto', boxSizing: 'border-box' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', color: '#111827', fontWeight: 700 }}>Создание уровня</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '32px' }}>
              <div style={{ minWidth: 0 }}>
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
                  <textarea value={hint} onChange={(e) => setHint(e.target.value)} placeholder="Например: иди вниз по коридору, ключ в тупике" rows={2} style={{ width: '100%', padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Робот смотрит</label>
                  <select value={entranceDirection} onChange={(e) => setEntranceDirection(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'white', cursor: 'pointer', outline: 'none' }}>
                    {DIRECTIONS.map((dir) => <option key={dir.id} value={dir.id}>{dir.label}</option>)}
                  </select>
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
                            <label key={cmd.commandId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: isSelected ? '#EFF6FF' : 'white', border: `2px solid ${isSelected ? '#3B82F6' : '#E5E7EB'}`, borderRadius: '8px', cursor: 'pointer' }}>
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

                <div className="admin-modal__fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Карта уровня</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" inputMode="numeric" value={widthDraft} onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) setWidthDraft(v); }} onBlur={(e) => applyWidth(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} title="Ширина" style={{ width: '64px', padding: '8px 10px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                    <Text size="2" style={{ color: '#9CA3AF', alignSelf: 'center' }}>×</Text>
                    <input type="text" inputMode="numeric" value={heightDraft} onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) setHeightDraft(v); }} onBlur={(e) => applyHeight(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} title="Длина" style={{ width: '64px', padding: '8px 10px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>

                <div ref={mapBoxRef} style={{ width: '100%', maxWidth: `${MAP_CONTAINER_SIZE}px`, minWidth: 0, aspectRatio: '1', background: '#D1D5DB', padding: '2px', borderRadius: '8px', marginBottom: '16px', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', boxSizing: 'border-box' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${mapWidth}, ${cellSize}px)`, gridTemplateRows: `repeat(${mapHeight}, ${cellSize}px)` }}>
                    {grid.map((row, y) => row.map((cell, x) => {
                      const here = positionOf(x, y);
                      return (
                        <div
                          key={`${x}-${y}`}
                          onClick={() => handleCellClick(x, y)}
                          title={here}
                          style={{
                            position: 'relative',
                            width: `${cellSize}px`, height: `${cellSize}px`,
                            background: backgroundForCell(cell),
                            border: '1px solid #E5E7EB',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: `${Math.max(13, cellSize * 0.52)}px`, lineHeight: 1,
                          }}
                        >
                          {(Object.keys(SIDE_DELTA) as Side[]).map((side) => {
                            const delta = SIDE_DELTA[side];
                            const nx = x + delta.dx;
                            const ny = y + delta.dy;
                            if (nx < 0 || ny < 0 || nx >= mapWidth || ny >= mapHeight) return null;
                            const exists = walls.has(edgeKey(here, positionOf(nx, ny)));
                            return (
                              <button
                                key={side}
                                onClick={(e) => { e.stopPropagation(); toggleWall(x, y, side); }}
                                title={`Стена ${here}–${positionOf(nx, ny)}`}
                                style={{
                                  position: 'absolute',
                                  top: side === 'top' ? '-3px' : side === 'bottom' ? undefined : '2px',
                                  bottom: side === 'bottom' ? '-3px' : side === 'top' ? undefined : '2px',
                                  left: side === 'left' ? '-3px' : side === 'right' ? undefined : '2px',
                                  right: side === 'right' ? '-3px' : side === 'left' ? undefined : '2px',
                                  width: side === 'left' || side === 'right' ? '8px' : '86%',
                                  height: side === 'top' || side === 'bottom' ? '8px' : '86%',
                                  border: 'none',
                                  padding: 0,
                                  borderRadius: '2px',
                                  cursor: 'pointer',
                                  // Кнопки рёбер живые только в режиме стены - иначе мешают клику по клетке.
                                  pointerEvents: selectedTool === 'wall' ? 'auto' : 'none',
                                  background: exists ? '#556270' : 'transparent',
                                  zIndex: 2,
                                }}
                              />
                            );
                          })}
                          {markerForCell(cell)}
                        </div>
                      );
                    }))}
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

                <div style={{ marginBottom: '14px', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                  <Text size="2" weight="bold" style={{ color: '#374151' }}>Ключей: {countCells('key')} · Камней: {countCells('rock')} · Стен: {walls.size}</Text>
                </div>

                <div style={{ background: '#F3F4F6', padding: '12px', borderRadius: '8px', fontSize: '12.5px', color: '#6B7280', lineHeight: '1.55' }}>
                  <strong>Подсказка:</strong> тёмные полосы на границах клеток - это стены лабиринта, их можно ставить и снимать кликом. Камень блокирует клетку целиком. Дверь выхода открывается, только когда робот собрал ключ.
                </div>
              </div>
            </div>
            <div className="admin-modal__actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #F3F4F6' }}>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} style={{ padding: '12px 24px', border: '2px solid #E5E7EB', borderRadius: '10px', background: 'white', color: '#374151', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Отмена</button>
              <button onClick={handleCreateSubmit} style={{ padding: '12px 28px', border: 'none', borderRadius: '10px', background: '#3B82F6', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Сохранить уровень</button>
            </div>
          </div>
        </div>
      )}
    </Flex>
  );
};

export default AdminLevelsPage;
