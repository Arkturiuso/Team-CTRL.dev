import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getLevel, runCode } from './api';
import { getLevels } from '../LevelsPage/api';
import { levelIdOf, type Level as LevelSummary } from '../LevelsPage/types';
import { getUserRole } from '../../utils/auth';
import type { Direction, ExecutionResult, LevelInfo } from './types';
import { Board2D, coinCells } from './Board2D';
import './LevelPage.less';

const SNIPPETS: Record<string, string> = {
  move: 'robot.move()',
  turn_left: 'robot.turn_left()',
  turn_right: 'robot.turn_right()',
  for: 'for i in range(3):\n    robot.move()',
  def: 'def walk(n):\n    for i in range(n):\n        robot.move()',
  print: "print('Привет, робот!')",
};

// Скорость показа кадров: мс на один тик.
const SPEEDS = [
  { value: 900, label: 'Медленно' },
  { value: 450, label: 'Обычно' },
  { value: 180, label: 'Быстро' },
];

const DIRECTION_LABEL: Record<Direction, string> = { up: 'вверх', right: 'вправо', down: 'вниз', left: 'влево' };

const LevelPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const levelId = Number(id);
  const isAdmin = getUserRole() === 'admin';
  const isPreview = searchParams.get('preview') === 'true' && isAdmin;

  const [level, setLevel] = useState<LevelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nextLevelId, setNextLevelId] = useState<number | null>(null);

  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [execution, setExecution] = useState<ExecutionResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [resultModal, setResultModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [boardMessage, setBoardMessage] = useState<string | null>(null);

  // Пошаговый реплей: индекс показанного кадра, -1 это "робот на старте".
  const [frameIndex, setFrameIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(SPEEDS[1].value);
  // Окно результата открываем, когда реплей дошёл до конца, а не сразу.
  const [pendingSuccessModal, setPendingSuccessModal] = useState(false);

  const runToken = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const messageTimer = useRef<number | null>(null);
  const commandsMenuRef = useRef<HTMLDivElement>(null);
  const commandsPopoverRef = useRef<HTMLDivElement>(null);
  // Смещение поповера команд относительно триггера: подгоняем, чтобы он влезал во вьюпорт.
  const [commandsOffset, setCommandsOffset] = useState<number | null>(null);

  const map = level?.mapData;
  const frames = execution?.frames ?? [];
  const errorLine = execution?.errorLine ?? null;

  const lines = useMemo(() => (code === '' ? [''] : code.split('\n')), [code]);

  // Поповер команд позиционируем от триггера, но прижимаем к вьюпорту:
  // на узких экранах открытый влево поповер иначе уходит за край.
  useLayoutEffect(() => {
    if (!showCommands) {
      setCommandsOffset(null);
      return;
    }

    const placePopover = () => {
      const menu = commandsMenuRef.current;
      const popover = commandsPopoverRef.current;
      if (!menu || !popover) return;
      const margin = 14;
      const menuRect = menu.getBoundingClientRect();
      const width = popover.offsetWidth;
      // Границы смещения left внутри .commands-menu.
      const minOffset = margin - menuRect.left;
      const maxOffset = Math.max(minOffset, window.innerWidth - margin - width - menuRect.left);
      const preferred = menuRect.width - width; // штатное выравнивание по правому краю триггера
      setCommandsOffset(Math.min(Math.max(preferred, minOffset), maxOffset));
    };

    placePopover();
    window.addEventListener('resize', placePopover);
    window.addEventListener('scroll', placePopover, true);
    return () => {
      window.removeEventListener('resize', placePopover);
      window.removeEventListener('scroll', placePopover, true);
    };
  }, [showCommands]);

  const applyResult = useCallback((result: ExecutionResult) => {
    setExecution(result);
    setFrameIndex(-1);
    setIsPlaying(true);
  }, []);

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
        setFrameIndex(-1);
        setPendingSuccessModal(false);
        setResultModal(false);
        setShowWelcome(true);
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
  }, [levelId]);

  // Следующий уровень для кнопки "Дальше".
  useEffect(() => {
    if (isPreview) {
      setNextLevelId(null);
      return;
    }
    let cancelled = false;
    getLevels()
      .then((response) => {
        if (cancelled) return;
        const list = ((response?.data ?? []) as LevelSummary[]).filter((item) => levelIdOf(item) > 0);
        const next = list
          .filter((item) => levelIdOf(item) > levelId)
          .sort((a, b) => levelIdOf(a) - levelIdOf(b))[0];
        setNextLevelId(next ? levelIdOf(next) : null);
      })
      .catch(() => {
        if (!cancelled) setNextLevelId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [levelId, isPreview]);

  // Автоскролл реплея: пока играет, idём вперёд по кадрам с выбранной скоростью.
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;
    if (frameIndex >= frames.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setFrameIndex((value) => value + 1), speed);
    return () => window.clearTimeout(timer);
  }, [isPlaying, frameIndex, frames.length, speed]);

  // Конец прогона: снять флаг ожидания и показать итог.
  useEffect(() => {
    if (!pendingSuccessModal) return;
    if (frames.length === 0 || frameIndex >= frames.length - 1) {
      setPendingSuccessModal(false);
      setResultModal(true);
    }
  }, [pendingSuccessModal, frameIndex, frames.length]);

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

  useEffect(() => () => {
    if (messageTimer.current) window.clearTimeout(messageTimer.current);
  }, []);

  const showMessage = (text: string) => {
    setBoardMessage(text);
    if (messageTimer.current) window.clearTimeout(messageTimer.current);
    messageTimer.current = window.setTimeout(() => setBoardMessage(null), 2200);
  };

  // Картинка доски = весь реплей до текущего кадра, чистая функция от frames.
  const view = useMemo(() => {
    const shown = frames.slice(0, frameIndex + 1);
    const last = shown[shown.length - 1];
    const entranceDirection: Direction = map?.entrance_direction ?? 'right';
    const robot = last
      ? { cell: last.robot.cell, direction: last.robot.direction }
      : { cell: map?.entrance ?? 'A1', direction: entranceDirection };

    // Дорожка пройденного пути: старт плюс каждая клетка робота по кадрам.
    const trail: string[] = [];
    if (map) trail.push(map.entrance);
    for (const frame of shown) {
      const cell = frame.robot.cell;
      if (trail[trail.length - 1] !== cell) trail.push(cell);
    }

    const keysTaken = shown.filter((frame) => frame.keyTaken).length;
    const keyPositions = (map?.keys ?? []).map((key) => key.position);

    // Монеты: кадр с coinTaken означает, что робот подобрал монету в своей текущей клетке.
    const coinsTaken = shown.filter((frame) => frame.coinTaken).length;
    const coinTakenCells = new Set(shown.filter((frame) => frame.coinTaken).map((frame) => frame.robot.cell));
    const coinPositions = map ? coinCells(map) : [];

    return {
      robot,
      trail,
      keysTaken,
      // Клетки ключов не подписаны тиком подъёма, поэтому прячем первые N поднятых.
      keysRemaining: keyPositions.slice(Math.min(keysTaken, keyPositions.length)),
      // Собранные монеты исчезают: показываем только те клетки, где их ещё не взяли.
      coinsTaken,
      coinsRemaining: coinPositions.filter((cell) => !coinTakenCells.has(cell)),
      hasKey: keysTaken > 0 || Boolean(execution && frameIndex >= frames.length - 1 && execution.keysCollected > 0),
      crashed: Boolean(last?.crashed),
      codeLine: last?.codeLine ?? null,
      ticks: last?.tick ?? 0,
    };
  }, [frames, frameIndex, map, execution]);

  const keysTotal = execution?.keysTotal ?? map?.keys?.length ?? level?.keysCount ?? 0;
  // Монет может не быть на уровне вовсе: тогда метрики не показываем.
  const coinsInMap = map ? coinCells(map).length : 0;
  const coinsTotal = execution?.coinsTotal ?? (coinsInMap || (level?.coinsCount ?? 0));

  const handleRun = async () => {
    if (!level || isRunning || code.trim() === '') return;

    const token = ++runToken.current;
    setIsRunning(true);
    setExecution(null);
    setPendingSuccessModal(false);
    setResultModal(false);
    setRunError(null);
    setBoardMessage(null);

    try {
      const result = await runCode(levelId, code, isPreview);
      if (runToken.current !== token) return;
      applyResult(result);
      if (result.success) setPendingSuccessModal(true);
      else if (result.errorMessage) showMessage(result.errorMessage);
      // При ошибке в коде поле ввода остаётся - иначе ученик потеряет текст.
      if (!(result.status === 'error' && result.errorLine)) setCode('');
      else window.setTimeout(() => textareaRef.current?.focus(), 100);
    } catch (error) {
      if (runToken.current !== token) return;
      setRunError(error instanceof Error ? error.message : 'Не удалось выполнить код');
    } finally {
      if (runToken.current === token) setIsRunning(false);
    }
  };

  const handleReset = () => {
    runToken.current++;
    setIsRunning(false);
    setIsPlaying(false);
    setExecution(null);
    setFrameIndex(-1);
    setRunError(null);
    setPendingSuccessModal(false);
    setResultModal(false);
    setBoardMessage(null);
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

  const replayAtStart = frameIndex < 0;
  const replayAtEnd = frames.length > 0 && frameIndex >= frames.length - 1;
  // В конце реплея доверяем серверу: кадры могут не покрывать последнюю монету.
  const coinsShown = Math.max(view.coinsTaken, replayAtEnd && execution ? execution.coinsCollected ?? 0 : 0);

  return (
    <div className="level-page">
      {isPreview && (
        <div className="preview-banner">
          Режим предпросмотра: результат не сохраняется в статистику
        </div>
      )}

      <header className="level-topbar">
        <div className="topbar-group">
          <button className="btn btn--ghost" onClick={goBack}>
            ← {isPreview ? 'В админку' : 'Уровни'}
          </button>
          <div className="level-heading">
            <strong>Уровень {level.levelId} · {level.levelName}</strong>
            <span>Пишешь код на Python, робот выполняет его шаг за шагом</span>
          </div>
        </div>

        <div className="stats">
          <span className="stat" title="Тики: один вызов команды робота - один тик">
            тики {execution && replayAtEnd ? execution.ticks : view.ticks}
          </span>
          <span className="stat" title="Строки кода без пустых и комментариев - считает сервер">
            строки {execution ? execution.linesCount : '—'}
          </span>
          <span className={`stat stat--key${view.keysTaken > 0 ? ' is-on' : ''}`}>
            ключи {Math.max(view.keysTaken, replayAtEnd && execution ? execution.keysCollected : 0)}/{keysTotal}
          </span>
          {coinsTotal > 0 && (
            <span
              className={`stat stat--coin${coinsShown > 0 ? ' is-on' : ''}`}
              title="Монеты: необязательные коллекционные предметы, на балл не влияют"
            >
              монеты {coinsShown}/{coinsTotal}
            </span>
          )}
          <span className="stat stat--score" title="Балл: сложность ×100 − 2×тики − 5×строки">
            балл {execution ? execution.score : '—'}
          </span>
          {execution?.difficulty && <span className="stat">сложность: {execution.difficulty}</span>}
          <div className="commands-menu" ref={commandsMenuRef}>
            <button
              type="button"
              className={`stat commands-trigger${showCommands ? ' is-open' : ''}`}
              onClick={() => setShowCommands((value) => !value)}
              aria-expanded={showCommands}
              title="Доступные на уровне команды"
            >
              Команды
              <span className="commands-count">{level.allowedCommands.length}</span>
              <span className={`commands-chevron${showCommands ? ' is-open' : ''}`} aria-hidden="true">▾</span>
            </button>
            {showCommands && (
              <div
                className="commands-popover"
                ref={commandsPopoverRef}
                style={commandsOffset === null ? undefined : { left: commandsOffset, right: 'auto' }}
              >
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
              <span className="panel-sub">лабиринт {map.width}×{map.height}</span>
            </div>
            <p className="task-text">{map.description ?? level.description ?? level.levelName}</p>
            {map.hint && <div className="task-hint">{map.hint}</div>}
            <div className="task-meta">
              <span className="chip">Поле {map.width}×{map.height}</span>
              <span className="chip">Ключей {keysTotal}</span>
              {coinsTotal > 0 && <span className="chip chip--gold">Монет {coinsTotal}</span>}
              <span className="chip">Выход {map.exit}</span>
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
                      view.codeLine === index + 1 ? 'is-active' : '',
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
              <button className="btn" onClick={handleReset} disabled={isRunning}>
                Сброс
              </button>
              <span className="editor-hint"><span className="kbd">Ctrl</span> + <span className="kbd">Enter</span> · Tab - отступ</span>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Итог прогона</span>
              {execution && (
                <span className="panel-sub">
                  {execution.status === 'success' ? 'успех' : execution.status === 'error' ? 'ошибка' : 'в процессе'}
                </span>
              )}
            </div>
            <div className="console" ref={consoleRef}>
              {isRunning && <div className="console-empty">Сервер выполняет программу…</div>}
              {!isRunning && !execution && !runError && (
                <div className="console-empty">
                  Запусти код: робот пройдёт маршрут по шагам, а здесь появятся тики, строки, ключи и балл.
                </div>
              )}
              {!isRunning && !execution && runError && (
                <div className="console-line console-line--error">
                  <span className="console-line__idx">[-]</span>
                  {runError}
                </div>
              )}
              {!isRunning && execution && (
                <>
                  <div className={`console-line ${execution.success ? 'console-line--ok' : 'console-line--error'}`}>
                    <span className="console-line__idx">[тики]</span>
                    {execution.ticks}
                  </div>
                  <div className="console-line">
                    <span className="console-line__idx">[строки]</span>
                    {execution.linesCount} (без пустых и комментариев)
                  </div>
                  <div className="console-line">
                    <span className="console-line__idx">[ключи]</span>
                    {execution.keysCollected}/{execution.keysTotal}
                  </div>
                  {coinsTotal > 0 && (
                    <div className="console-line">
                      <span className="console-line__idx">[монеты]</span>
                      {execution.coinsCollected ?? 0}/{coinsTotal}
                    </div>
                  )}
                  <div className="console-line">
                    <span className="console-line__idx">[балл]</span>
                    {execution.score} · сложность ×100 − 2×тики − 5×строки
                  </div>
                  {!execution.success && (
                    <div className="console-line console-line--error">
                      <span className="console-line__idx">[ошибка]</span>
                      {execution.errorMessage ?? 'робот не достиг выхода'}
                      {execution.errorLine ? ` (строка ${execution.errorLine})` : ''}
                    </div>
                  )}
                  {/* Вывод print(): строки в порядке исполнения; старого API-образа без поля не боимся */}
                  {(execution.console ?? []).map((line, index) => (
                    <div
                      key={index}
                      className={`console-line${line.kind === 'error' ? ' console-line--error' : ''}`}
                    >
                      <span className="console-line__idx">[{line.line}]</span>
                      {line.text}
                    </div>
                  ))}
                </>
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
                  : view.codeLine
                    ? `выполняется строка ${view.codeLine}`
                    : replayAtStart
                      ? 'робот на старте'
                      : `тик ${view.ticks}`}
              </span>
            </div>
            <div className="board-shell">
              <Board2D
                map={map}
                robot={view.robot}
                hasKey={view.hasKey}
                trail={view.trail}
                keysRemaining={view.keysRemaining}
                coins={view.coinsRemaining}
                crashed={view.crashed}
              />
              {boardMessage && <div className="board-message">{boardMessage}</div>}
            </div>

            <div className="replay-controls">
              <button className="btn replay-btn" onClick={() => { setIsPlaying(false); setFrameIndex(-1); }} disabled={replayAtStart} title="В начало">
                ⏮
              </button>
              <button className="btn replay-btn" onClick={() => { setIsPlaying(false); setFrameIndex((value) => Math.max(-1, value - 1)); }} disabled={replayAtStart} title="Шаг назад">
                ◀
              </button>
              <button
                className="btn btn--primary replay-btn"
                onClick={() => setIsPlaying((value) => !value)}
                disabled={frames.length === 0 || frameIndex >= frames.length - 1}
                title="Проиграть или пауза"
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button className="btn replay-btn" onClick={() => { setIsPlaying(false); setFrameIndex((value) => Math.min(frames.length - 1, value + 1)); }} disabled={replayAtEnd || frames.length === 0} title="Шаг вперёд">
                ▶|
              </button>
              <button className="btn replay-btn" onClick={() => { setIsPlaying(false); setFrameIndex(frames.length - 1); }} disabled={replayAtEnd || frames.length === 0} title="В конец">
                ⏭
              </button>
              <label className="replay-speed">
                Скорость
                <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
                  {SPEEDS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <span className="replay-progress">
                кадры {Math.max(0, frameIndex + 1)}/{frames.length}
              </span>
            </div>

            <div className="board-status" style={{ padding: '4px 6px 0' }}>
              <span>
                Робот: <strong>{view.robot.cell}</strong>
                {' · '}смотрит <strong>{DIRECTION_LABEL[view.robot.direction] ?? view.robot.direction}</strong>
                {' · '}дверь: {view.hasKey ? <strong>открыта</strong> : <strong>заперта (нужен ключ)</strong>}
              </span>
              <span>
                путь <strong>{view.trail.map((cell) => cell).join(' → ')}</strong>
              </span>
            </div>
          </div>
        </section>
      </main>

      {showWelcome && (
        <div className="modal-overlay" onClick={() => setShowWelcome(false)}>
          <div className="modal modal--wide" onClick={(event) => event.stopPropagation()}>
            <h2>Уровень {level.levelId}: {level.levelName}</h2>
            <p className="modal-sub">{map.description ?? level.description ?? 'Прочитай задание и напиши программу для робота.'}</p>
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

      {resultModal && execution && execution.success && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 style={{ textAlign: 'center' }}>Уровень пройден</h2>
            <p className="modal-sub" style={{ textAlign: 'center' }}>
              {isPreview
                ? 'Предпросмотр: результат не сохранён.'
                : 'Результат засчитан. Балл: сложность ×100 − 2×тики − 5×строки.'}
            </p>
            <div className="modal-grid">
              <div className="modal-stat"><b>{execution.ticks}</b><span>тиков</span></div>
              <div className="modal-stat"><b>{execution.linesCount}</b><span>строк кода</span></div>
              <div className="modal-stat"><b>{execution.keysCollected}/{execution.keysTotal}</b><span>ключей</span></div>
              {coinsTotal > 0 && (
                <div className="modal-stat modal-stat--coin">
                  <b>{execution.coinsCollected ?? 0}/{coinsTotal}</b>
                  <span>монет</span>
                </div>
              )}
              <div className="modal-stat"><b>{execution.score}</b><span>итоговый балл</span></div>
            </div>
            <div className="modal-actions">
              {!isPreview && (
                <button className="btn" onClick={() => navigate(`/user/levels/${levelId}/certificate`)}>
                  Справка о прохождении
                </button>
              )}
              {!isPreview && (
                <button className="btn" onClick={() => navigate(`/user/attempts?levelId=${levelId}`)}>
                  История попыток
                </button>
              )}
              <button className="btn" onClick={() => { setResultModal(false); handleReset(); }}>Повторить</button>
              {!isPreview && nextLevelId !== null && (
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    setResultModal(false);
                    navigate(`/user/levels/${nextLevelId}`);
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
