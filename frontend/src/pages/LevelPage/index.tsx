import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevel, getSessionState, resetSession, runCode } from './api';
import { runsWord } from '../../utils/plural';
import type { Biome, Direction, EnemyFrame, ExecutionResult, GameFrame, LevelInfo, SessionState } from './types';
import { MazeBoard, parsePos } from './MazeBoard';
import { StarIcon } from './sprites';
import './LevelPage.less';

const BIOME_LABEL: Record<Biome, string> = {
  forest: 'Лес',
  snow: 'Снега',
  desert: 'Пустыня',
  cave: 'Пещера',
  swamp: 'Болото',
  volcano: 'Вулкан',
};

const SNIPPETS: Record<string, string> = {
  move: 'robot.move()',
  turn_left: 'robot.turn_left()',
  turn_right: 'robot.turn_right()',
  attack: 'robot.attack()',
  for: 'for i in range(3):\n    robot.move()',
  def: 'def walk(n):\n    for i in range(n):\n        robot.move()',
  print: "print('Привет, робот!')",
};

const FRAME_DELAY: Record<string, number> = {
  start: 90,
  move: 210,
  slide: 150,
  turn: 150,
  attack: 240,
  hit: 480,
  error: 420,
  dead: 520,
  locked: 420,
  success: 460,
};

const frameDelay = (type: string) => FRAME_DELAY[type] ?? 200;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface RobotView {
  x: number;
  y: number;
  direction: Direction;
}

const entranceState = (level: LevelInfo): SessionState => {
  const entrance = parsePos(level.mapData.entrance);
  const enemies = (level.mapData.enemies ?? []).map((enemy) => {
    const start = parsePos(enemy.patrol?.[0] ?? enemy.position);
    return { id: enemy.id, type: enemy.type, x: start.x, y: start.y, alive: true };
  });

  return {
    levelId: level.levelId,
    x: entrance.x,
    y: entrance.y,
    direction: level.mapData.entrance_direction ?? 'right',
    hasKey: false,
    atExit: false,
    ticks: 0,
    collectedCoins: [],
    collectedKeys: [],
    enemies,
    totalCoins: level.mapData.coins?.length ?? 0,
    completed: false,
  };
};

const LevelPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const levelId = Number(id);
  const isPreview = searchParams.get('preview') === 'true';

  const [level, setLevel] = useState<LevelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [execution, setExecution] = useState<ExecutionResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [savedStars, setSavedStars] = useState(0);
  const [runs, setRuns] = useState(0);

  const [robot, setRobot] = useState<RobotView | null>(null);
  const [enemies, setEnemies] = useState<EnemyFrame[]>([]);
  const [boardEpoch, setBoardEpoch] = useState(0);
  const [ticks, setTicks] = useState(0);
  const [collectedCoins, setCollectedCoins] = useState<Set<number>>(new Set());
  const [collectedKeys, setCollectedKeys] = useState<Set<string>>(new Set());
  const [hasKey, setHasKey] = useState(false);
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [flash, setFlash] = useState<'hit' | 'attack' | null>(null);
  const [boardMessage, setBoardMessage] = useState<string | null>(null);
  const [boardMessageIsError, setBoardMessageIsError] = useState(false);

  const [showCommands, setShowCommands] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [resultModal, setResultModal] = useState<'success' | null>(null);

  const runToken = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const flashTimer = useRef<number | null>(null);
  const commandsMenuRef = useRef<HTMLDivElement>(null);

  const map = level?.mapData;
  const totalCoins = map?.coins?.length ?? 0;
  const threeStarRuns = map?.three_star_runs ?? 3;
  const biome: Biome = map?.biome ?? 'forest';

  const lines = useMemo(() => (code === '' ? [''] : code.split('\n')), [code]);
  const errorLine = execution?.errorLine ?? null;

  const applyServerState = useCallback((state: SessionState) => {
    setBoardEpoch((value) => value + 1);
    setRobot({ x: state.x, y: state.y, direction: state.direction });
    setEnemies(state.enemies);
    setTicks(state.ticks);
    setCollectedCoins(new Set(state.collectedCoins));
    setCollectedKeys(new Set(state.collectedKeys));
    setHasKey(state.hasKey);
    setCurrentLine(null);
    setFlash(null);
    setBoardMessage(null);
  }, []);

  const applyEntrance = useCallback((current: LevelInfo) => {
    applyServerState(entranceState(current));
  }, [applyServerState]);

  useEffect(() => {
    let cancelled = false;
    const fetchLevel = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await getLevel(levelId);
        if (cancelled) return;
        setLevel(data);
        setCode('');
        setExecution(null);
        setSavedStars(data.userStars ?? 0);
        setRuns(data.userAttempts ?? 0);

        let state: SessionState | null = null;
        if (!isPreview) {
          try {
            state = await getSessionState(levelId);
          } catch {
            state = null;
          }
        }
        if (cancelled) return;
        applyServerState(state ?? entranceState(data));

        setTimeout(() => {
          if (!cancelled) setShowWelcome(true);
        }, 250);
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Не удалось загрузить уровень');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchLevel();
    return () => {
      cancelled = true;
      runToken.current++;
    };
  }, [levelId, isPreview, applyServerState]);

  useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [execution, isRunning]);

  useEffect(() => {
    if (!showCommands) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (commandsMenuRef.current && !commandsMenuRef.current.contains(event.target as Node)) {
        setShowCommands(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowCommands(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCommands]);

  const flashBoard = (kind: 'hit' | 'attack') => {
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    setFlash(kind);
    flashTimer.current = window.setTimeout(() => setFlash(null), kind === 'hit' ? 460 : 320);
  };

  const showMessage = (text: string, isError = false) => {
    setBoardMessage(text);
    setBoardMessageIsError(isError);
    window.setTimeout(() => {
      setBoardMessage((current) => (current === text ? null : current));
    }, 1600);
  };

  const playFrames = async (
    result: ExecutionResult,
    token: number,
    initialCoins: Set<number>,
    initialKeys: Set<string>,
  ) => {
    const coins = new Set(initialCoins);
    const keys = new Set(initialKeys);

    for (const frame of result.frames as GameFrame[]) {
      if (runToken.current !== token) return;

      frame.collectedCoins.forEach((coinId) => coins.add(coinId));
      frame.collectedKeys.forEach((keyPos) => keys.add(keyPos));

      setRobot({ x: frame.x, y: frame.y, direction: frame.direction });
      setEnemies(frame.enemies);
      setHasKey(frame.hasKey);
      setTicks(frame.tick);
      setCollectedCoins(new Set(coins));
      setCollectedKeys(new Set(keys));
      setCurrentLine(frame.line ?? null);

      if (frame.type === 'hit') flashBoard('hit');
      if (frame.type === 'attack') flashBoard('attack');
      if (frame.message) {
        showMessage(frame.message, frame.type === 'error' || frame.type === 'dead' || frame.type === 'locked');
      }

      await sleep(frameDelay(frame.type));
    }

    if (runToken.current === token) setCurrentLine(null);
  };

  const handleRun = async () => {
    if (!level || isRunning || code.trim() === '') return;

    const token = ++runToken.current;
    setIsRunning(true);
    setExecution(null);
    setRunError(null);
    setResultModal(null);
    setBoardMessage(null);

    if (isPreview) applyEntrance(level);

    try {
      const response = await runCode(levelId, code, isPreview);
      if (runToken.current !== token) return;

      const result = response.execution;
      setExecution(result);
      await playFrames(result, token, collectedCoins, collectedKeys);
      if (runToken.current !== token) return;

      setCollectedCoins(new Set(response.state.collectedCoins));
      setCollectedKeys(new Set(response.state.collectedKeys));
      setHasKey(response.state.hasKey);
      setTicks(response.state.ticks);

      let stars = result.stars;
      if (!isPreview) {
        stars = response.userStars;
        setRuns(response.attemptNumber);
      }

      setSavedStars(stars);
      if (result.success) {
        setResultModal('success');
      } else {
        window.setTimeout(() => textareaRef.current?.focus(), 100);
      }
    } catch (error) {
      if (runToken.current !== token) return;
      const message = error instanceof Error ? error.message : 'Не удалось выполнить код';
      setRunError(message);
    } finally {
      if (runToken.current === token) setIsRunning(false);
    }
  };

  const handleResetPlayback = async () => {
    if (!level) return;
    runToken.current++;
    setIsRunning(false);
    setExecution(null);
    setRunError(null);
    setResultModal(null);
    setBoardMessage(null);
    setFlash(null);

    if (isPreview) {
      applyEntrance(level);
      return;
    }

    try {
      const state = await resetSession(levelId);
      applyServerState(state);
    } catch {
      applyEntrance(level);
    }
  };

  const updateCode = (next: string, caret: number) => {
    setCode(next);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const handleEditorKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    const value = el.value;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handleRun();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      if (event.shiftKey) {
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const line = value.slice(lineStart, start);
        const removable = Math.min(4, (line.match(/^ +/) ?? [''])[0].length);
        if (removable === 0) return;
        updateCode(
          value.slice(0, lineStart) + value.slice(lineStart + removable),
          Math.max(lineStart, start - removable),
        );
      } else {
        updateCode(value.slice(0, start) + '    ' + value.slice(end), start + 4);
      }
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.slice(lineStart, start);
      const indent = (currentLine.match(/^[ \t]*/) ?? [''])[0];
      const extra = currentLine.trimEnd().endsWith(':') ? '    ' : '';
      const insertion = `\n${indent}${extra}`;
      updateCode(value.slice(0, start) + insertion + value.slice(end), start + insertion.length);
    }
  };

  const insertSnippet = (name: string, fallback: string) => {
    if (isRunning) return;
    const el = textareaRef.current;
    if (!el) return;

    const snippet = SNIPPETS[name] ?? fallback;
    const value = el.value;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.slice(0, start);
    const lineStart = before.lastIndexOf('\n') + 1;
    const indent = (before.slice(lineStart).match(/^[ \t]*/) ?? [''])[0];
    const needsBreak = before.length > 0 && !before.endsWith('\n');
    const body = snippet
      .split('\n')
      .map((line, index) => (index === 0 ? line : indent + line))
      .join('\n');
    const insertion = `${needsBreak ? `\n${indent}` : ''}${body}`;

    updateCode(value.slice(0, start) + insertion + value.slice(end), start + insertion.length);
  };

  const goBack = () => navigate(isPreview ? '/admin/levels' : '/user/levels');

  const consoleLines = useMemo(() => {
    if (!execution) return [];
    const entries = execution.console.map((entry) => ({
      key: `c-${entry.line}-${entry.text}`,
      node: (
        <div key={`c-${entry.line}-${entry.text}`} className={`console-line${entry.kind === 'error' ? ' console-line--error' : ''}`}>
          <span className="console-line__idx">{entry.line > 0 ? `[${entry.line}]` : '[-]'}</span>
          {entry.text}
        </div>
      ),
    }));

    const runsNote = !isPreview && runs > 0 ? ` · запусков ${runs}` : '';
    const summary = execution.success
      ? `Уровень пройден · монет ${execution.collectedCoins}/${execution.totalCoins} · звёзд ${savedStars || execution.stars}${runsNote}`
      : `Не пройдено · ${execution.errorMessage ?? 'робот не достиг выхода'}${execution.errorLine ? ` (строка ${execution.errorLine})` : ''}${runsNote}`;

    entries.push({
      key: 'summary',
      node: (
        <div
          key="summary"
          className={`console-line ${execution.success ? 'console-line--ok' : 'console-line--error'}`}
        >
          <span className="console-line__idx">[итог]</span>
          {summary}
        </div>
      ),
    });

    return entries;
  }, [execution, savedStars, runs, isPreview]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <span className="spinner" />
        Загрузка уровня…
      </div>
    );
  }

  if (loadError || !level || !map) {
    return (
      <div className="error-screen" style={{ flexDirection: 'column' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#ffb3b3' }}>Не удалось открыть уровень</div>
        <div style={{ fontSize: 13 }}>{loadError ?? 'Уровень не найден'}</div>
        <button className="btn" onClick={goBack} style={{ marginTop: 12 }}>← Назад к уровням</button>
      </div>
    );
  }

  const enemyCount = map.enemies?.length ?? 0;
  const terrainCount = Object.keys(map.terrain ?? {}).length;
  const showNext = !isPreview && levelId < 10;
  const entrancePos = parsePos(map.entrance);
  const robotAtEntrance = robot ? robot.x === entrancePos.x && robot.y === entrancePos.y : true;

  return (
    <div className="level-page">
      {isPreview && (
        <div className="preview-banner">
          Режим предпросмотра: результат не сохраняется, звёзды не начисляются
        </div>
      )}

      <header className="level-topbar">
        <div className="topbar-group">
          <button className="btn btn--ghost" onClick={goBack}>
            ← {isPreview ? 'В админку' : 'Уровни'}
          </button>
          <div className="level-heading">
            <strong>Уровень {level.levelId} · {level.levelName}</strong>
            <span>Пиши код на Python и запускай его на сервере</span>
          </div>
          <span className="biome-chip">{BIOME_LABEL[biome]}</span>
        </div>

        <div className="stats">
          <span className="stat">{collectedCoins.size}/{totalCoins} монет</span>
          <span className={`stat stat--key${hasKey ? ' is-on' : ''}`}>{hasKey ? 'Ключ собран' : 'Ключ не найден'}</span>
          <span className="stat" title="Сколько раз программа запускалась на этом уровне">
            запусков {runs}
          </span>
          <div className="commands-menu" ref={commandsMenuRef}>
            <button
              type="button"
              className={`stat commands-trigger${showCommands ? ' is-open' : ''}`}
              onClick={() => setShowCommands((value) => !value)}
              aria-expanded={showCommands}
              aria-controls="level-commands"
              aria-haspopup="true"
              title="Доступные на уровне команды"
            >
              Команды
              <span className="commands-count">{level.allowedCommands.length}</span>
              <span className={`commands-chevron${showCommands ? ' is-open' : ''}`} aria-hidden="true">▾</span>
            </button>
            {showCommands && (
              <div id="level-commands" className="commands-popover">
                <div className="commands-popover__head">
                  <strong>Команды уровня</strong>
                  <span>клик вставит шаблон в код</span>
                </div>
                <div className="commands-list">
                  {level.allowedCommands.length === 0 && <span className="panel-sub">Команд пока нет.</span>}
                  {level.allowedCommands.map((command) => (
                    <button
                      key={command.commandId}
                      type="button"
                      className="command-item"
                      onClick={() => insertSnippet(command.name, command.syntax)}
                    >
                      <strong>{command.syntax}</strong>
                      <span>{command.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="level-layout">
        <section>
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Задание</span>
              <span className="panel-sub">{BIOME_LABEL[biome]}</span>
            </div>
            <p className="task-text">{map.description ?? level.levelName}</p>
            {map.hint && <div className="task-hint">{map.hint}</div>}
            <div className="task-meta">
              <span className="chip">Поле {map.width}×{map.height}</span>
              <span className="chip">Монет {totalCoins}</span>
              {enemyCount > 0 && <span className="chip">Врагов {enemyCount}</span>}
              {terrainCount > 0 && <span className="chip">Особый рельеф</span>}
              <span className="chip chip--gold">3★, если уложиться в {threeStarRuns} {runsWord(threeStarRuns)}</span>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Код</span>
              <span className="panel-sub">Python · отступы важны</span>
            </div>

            <div className="editor-wrap">
              <div className="editor-gutter" ref={gutterRef}>
                {lines.map((_, index) => (
                  <span
                    key={index}
                    className={[
                      currentLine === index + 1 ? 'is-active' : '',
                      errorLine === index + 1 ? 'is-error' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {index + 1}
                  </span>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                className="editor-area"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                onKeyDown={handleEditorKeyDown}
                onScroll={(event) => {
                  if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
                }}
                placeholder={'robot.move()\n# Ctrl+Enter - запустить'}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                disabled={isRunning}
              />
            </div>

            <div className="editor-toolbar">
              <button className="btn btn--primary" onClick={handleRun} disabled={isRunning || code.trim() === ''}>
                {isRunning ? 'Выполнение…' : '▶ Запустить'}
              </button>
              <button className="btn" onClick={handleResetPlayback} disabled={isRunning}>
                Сброс
              </button>
              <span className="editor-hint"><span className="kbd">Ctrl</span> + <span className="kbd">Enter</span> · Tab - отступ</span>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Консоль</span>
              {execution && (
                <span className="panel-sub">
                  {execution.status === 'success' ? 'успех' : 'ошибка'} · шагов {execution.ticks}
                </span>
              )}
            </div>
            <div className="console" ref={consoleRef}>
              {isRunning && <div className="console-empty">Сервер выполняет программу…</div>}
              {!isRunning && !execution && !runError && (
                <div className="console-empty">
                  Запусти код: кадры появятся на поле, а print('текст') выведет сообщение сюда, в консоль.
                </div>
              )}
              {!isRunning && !execution && runError && (
                <div className="console-line console-line--error">
                  <span className="console-line__idx">[-]</span>
                  {runError}
                </div>
              )}
              {!isRunning && execution && (
                <AnimatePresence initial={false}>
                  {consoleLines.map((line) => (
                    <motion.div
                      key={line.key}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      {line.node}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </section>

        <section className="play-panel">
          <div className="panel" style={{ padding: 14 }}>
            <div className="panel-head" style={{ padding: '0 4px' }}>
              <span className="panel-title">Поле</span>
              <span className="panel-sub">
                {isRunning
                  ? 'выполнение…'
                  : currentLine
                    ? `строка ${currentLine}`
                    : robotAtEntrance
                      ? 'робот на старте'
                      : 'робот продолжит путь'}
              </span>
            </div>
            <div className="board-shell">
              <div style={{ position: 'relative' }}>
                <MazeBoard
                  map={map}
                  robot={robot}
                  enemies={enemies}
                  collectedCoins={collectedCoins}
                  collectedKeys={collectedKeys}
                  hasKey={hasKey}
                  flash={flash}
                  epoch={boardEpoch}
                />
                {boardMessage && (
                  <div className={`board-message${boardMessageIsError ? ' is-error' : ''}`}>{boardMessage}</div>
                )}
              </div>
            </div>
            <div className="board-status" style={{ padding: '4px 6px 0' }}>
              <span>
                Робот: <strong>{robot ? `${String.fromCharCode(65 + robot.x)}${robot.y + 1}` : '-'}</strong>
                {' · '}
                направление <strong>{robot?.direction ?? '-'}</strong>
              </span>
              <span>
                шагов <strong>{ticks}</strong> · запуски <strong>{runs}</strong> · 3★ в <strong>{threeStarRuns}</strong> {runsWord(threeStarRuns)}
              </span>
            </div>
          </div>
        </section>
      </main>

      {showWelcome && (
        <div className="modal-overlay">
          <div className="modal modal--wide">
            <h2>Уровень {level.levelId}: {level.levelName}</h2>
            <p className="modal-sub">{map.description ?? 'Прочитай задание и напиши программу для робота.'}</p>
            {map.hint && <div className="task-hint" style={{ marginBottom: 16 }}>{map.hint}</div>}
            <div className="panel-title" style={{ marginBottom: 8 }}>Команды уровня</div>
            <div className="modal-commands">
              {level.allowedCommands.length === 0 && <span className="panel-sub">Команд пока нет.</span>}
              {level.allowedCommands.map((command) => (
                <div key={command.commandId} className="modal-command">
                  <code>{command.syntax}</code>
                  <span>{command.description}</span>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn--primary" onClick={() => setShowWelcome(false)}>Начать</button>
            </div>
          </div>
        </div>
      )}

      {resultModal === 'success' && execution && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 style={{ textAlign: 'center' }}>Уровень пройден</h2>
            <p className="modal-sub" style={{ textAlign: 'center' }}>
              {isPreview
                ? 'Предпросмотр: результат не сохранён.'
                : 'Результат сохранён и засчитан в статистику.'}
            </p>
            <div className="modal-stars">
              {[1, 2, 3].map((star) => (
                <span key={star}>
                  <StarIcon size={34} filled={star <= (savedStars || execution.stars)} />
                </span>
              ))}
            </div>
            <div className="modal-grid">
              <div className="modal-stat"><b>{runs}</b><span>{runsWord(runs)}</span></div>
              <div className="modal-stat"><b>{execution.collectedCoins}/{execution.totalCoins}</b><span>монет</span></div>
              <div className="modal-stat"><b>{threeStarRuns}</b><span>запусков для 3★</span></div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => { setResultModal(null); handleResetPlayback(); }}>Повторить</button>
              {showNext && (
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    setResultModal(null);
                    navigate(`/user/levels/${levelId + 1}`);
                  }}
                >
                  Следующий уровень
                </button>
              )}
              <button className="btn btn--ghost" onClick={goBack}>
                {isPreview ? 'В админку' : 'К списку уровней'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LevelPage;
