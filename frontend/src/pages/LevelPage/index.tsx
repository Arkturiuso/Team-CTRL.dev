import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevel, getSessionState, resetSession, runCode } from './api';
import { getLevels } from '../LevelsPage/api';
import type { Level as LevelSummary } from '../LevelsPage/types';
import { runsWord } from '../../utils/plural';
import type { Biome, BossFx, BossFxKind, Direction, EnemyFrame, ExecutionResult, GameFrame, HazardFrame, LevelInfo, SessionState } from './types';
import { MazeBoard, parsePos } from './MazeBoard';
import { BossIntro, BossPanel } from './BossPanel';
import type { BossLogEntry } from './BossPanel';
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
  attack_range: 'robot.attack(5)',
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
  key: 520,
  fake_key: 620,
  boss_charge: 560,
  boss_shot: 620,
  boss_miss: 420,
  boss_move: 240,
  boss_rage: 700,
  hazard_warn: 660,
  hazard_hit: 700,
  hazard_end: 200,
  exit: 620,
  cooldown: 260,
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
  const boss = level.mapData.boss;
  const enemies = (level.mapData.enemies ?? []).map((enemy) => {
    const start = parsePos(enemy.patrol?.[0] ?? enemy.position);
    const maxHp = enemy.hp ?? (enemy.boss ? 3 : 1);
    return {
      id: enemy.id,
      type: enemy.type,
      x: start.x,
      y: start.y,
      alive: true,
      hp: maxHp,
      maxHp,
      boss: Boolean(enemy.boss),
      hasKey: Boolean(enemy.carries_key),
      shielded: Boolean(enemy.boss),
    };
  });
  const carrier = enemies.some((enemy) => enemy.hasKey);
  const fakeKeys = (level.mapData.keys ?? []).filter((key) => key.fake).map((key) => key.position);
  const keysTotal = (level.mapData.keys ?? []).filter((key) => !key.fake).length
    || (level.mapData.required_key_position ? 1 : 0);

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
    keyPosition: carrier ? null : level.mapData.required_key_position ?? null,
    fakeKeys,
    bossHint: null,
    bossAim: null,
    bossMark: null,
    bossCharging: false,
    hazards: [],
    bossTarget: null,
    bossRaging: false,
    exit: level.mapData.exit,
    playerHp: boss?.player_hp ?? 0,
    playerMaxHp: boss?.player_hp ?? 0,
    attackCooldown: 0,
    keysCollected: 0,
    keysTotal,
    bossDefeated: false,
    totalCoins: level.mapData.coins?.length ?? 0,
    completed: false,
    attemptNumber: 0,
  };
};

const LevelPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const levelId = Number(id);
  const isAdmin = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') ?? '{}').role === 'admin';
    } catch {
      return false;
    }
  })();
  const isPreview = searchParams.get('preview') === 'true' && isAdmin;

  const [level, setLevel] = useState<LevelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nextLevelId, setNextLevelId] = useState<number | null>(null);

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
  const [keyPosition, setKeyPosition] = useState<string | null>(null);
  const [fakeKeys, setFakeKeys] = useState<string[]>([]);
  const [exitPosition, setExitPosition] = useState<string>('A1');
  const [playerHp, setPlayerHp] = useState(0);
  const [playerMaxHp, setPlayerMaxHp] = useState(0);
  const [attackCooldown, setAttackCooldown] = useState(0);
  const [keysCollected, setKeysCollected] = useState(0);
  const [keysTotal, setKeysTotal] = useState(0);
  const [bossDefeated, setBossDefeated] = useState(false);
  const [bossHint, setBossHint] = useState<string | null>(null);
  const [bossAim, setBossAim] = useState<string | null>(null);
  const [bossMark, setBossMark] = useState<string | null>(null);
  const [bossFx, setBossFx] = useState<BossFx | null>(null);
  const [hazards, setHazards] = useState<HazardFrame[]>([]);
  const [bossTarget, setBossTarget] = useState<string | null>(null);
  const [bossLog, setBossLog] = useState<BossLogEntry[]>([]);
  const [bossIntroOpen, setBossIntroOpen] = useState(false);
  const [introStep, setIntroStep] = useState(0);
  const [keysRevealed, setKeysRevealed] = useState(true);
  const [doorSealed, setDoorSealed] = useState(false);
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [flash, setFlash] = useState<'hit' | 'attack' | null>(null);
  const [boardMessage, setBoardMessage] = useState<string | null>(null);
  const [boardMessageIsError, setBoardMessageIsError] = useState(false);

  const [showCommands, setShowCommands] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [resultModal, setResultModal] = useState<'success' | 'defeat' | null>(null);

  const runToken = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const flashTimer = useRef<number | null>(null);
  const doorSealTimer = useRef<number | null>(null);
  const bossFxTimer = useRef<number | null>(null);
  const bossFxId = useRef(0);
  const bossLogId = useRef(0);
  const commandsMenuRef = useRef<HTMLDivElement>(null);

  const map = level?.mapData;
  const totalCoins = map?.coins?.length ?? 0;
  const threeStarRuns = map?.three_star_runs ?? 3;
  const biome: Biome = map?.biome ?? 'forest';
  const boss = map?.boss;
  const introLines = boss?.intro ?? [];
  const introLinesCount = introLines.length;

  const lines = useMemo(() => (code === '' ? [''] : code.split('\n')), [code]);
  const errorLine = execution?.errorLine ?? null;

  const bossRaging = useMemo(() => {
    const rageAt = boss?.ai?.rage_at_hp ?? 0;
    if (!rageAt) return false;
    const bossEnemy = enemies.find((enemy) => enemy.boss);
    return Boolean(bossEnemy?.alive && bossEnemy.hp <= rageAt);
  }, [boss, enemies]);

  const activeHazard = hazards[0] ?? null;

  const applyServerState = useCallback((state: SessionState) => {
    setBoardEpoch((value) => value + 1);
    setRobot({ x: state.x, y: state.y, direction: state.direction });
    setEnemies(state.enemies);
    setTicks(state.ticks);
    setCollectedCoins(new Set(state.collectedCoins));
    setCollectedKeys(new Set(state.collectedKeys));
    setHasKey(state.hasKey);
    setKeyPosition(state.keyPosition ?? null);
    setFakeKeys(state.fakeKeys ?? []);
    setExitPosition(state.exit ?? 'A1');
    setPlayerHp(state.playerHp ?? 0);
    setPlayerMaxHp(state.playerMaxHp ?? 0);
    setAttackCooldown(state.attackCooldown ?? 0);
    setKeysCollected(state.keysCollected ?? 0);
    setKeysTotal(state.keysTotal ?? 0);
    setBossDefeated(Boolean(state.bossDefeated));
    setBossHint(state.bossHint ?? null);
    setBossAim(state.bossAim ?? null);
    setBossMark(state.bossMark ?? null);
    setHazards(state.hazards ?? []);
    setBossTarget(state.bossTarget ?? null);
    if (bossFxTimer.current) window.clearTimeout(bossFxTimer.current);
    setBossFx(null);
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
        setRuns(0);
        setBossLog([]);
        setBossIntroOpen(false);
        setIntroStep(0);
        setDoorSealed(false);
        setShowWelcome(false);

        // Превью начинается с чистого листа при открытии, но внутри страницы
        // продолжает путь робота между запусками, как обычная игра.
        let state: SessionState | null = null;
        try {
          state = isPreview ? await resetSession(levelId, true) : await getSessionState(levelId);
        } catch {
          state = null;
        }
        if (cancelled) return;
        applyServerState(state ?? entranceState(data));
        setRuns(state?.attemptNumber ?? 0);

        const bossLevel = Boolean(data.mapData.boss);
        const freshFight = bossLevel && (!state
          || (state.ticks === 0
            && state.keysCollected === 0
            && !state.bossDefeated
            && state.playerHp >= state.playerMaxHp));
        setKeysRevealed(!freshFight);

        setTimeout(() => {
          if (cancelled) return;
          if (freshFight) setBossIntroOpen(true);
          else setShowWelcome(true);
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
    if (isPreview) {
      setNextLevelId(null);
      return;
    }

    let cancelled = false;
    getLevels()
      .then((response) => {
        if (cancelled) return;
        const list = (response?.data ?? []) as LevelSummary[];
        const next = list
          .filter((item) => item.levelId > levelId)
          .sort((a, b) => a.levelId - b.levelId)[0];
        setNextLevelId(next ? next.levelId : null);
      })
      .catch(() => {
        if (!cancelled) setNextLevelId(null);
      });

    return () => {
      cancelled = true;
    };
  }, [levelId, isPreview]);

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

  const triggerBossFx = useCallback(
    (kind: BossFxKind, options: { from?: string; to?: string; damage?: number } = {}, duration = 900) => {
      if (bossFxTimer.current) window.clearTimeout(bossFxTimer.current);
      setBossFx({ kind, id: ++bossFxId.current, ...options });
      bossFxTimer.current = window.setTimeout(() => setBossFx(null), duration);
    },
    [],
  );

  useEffect(() => () => {
    if (bossFxTimer.current) window.clearTimeout(bossFxTimer.current);
  }, []);

  const showMessage = (text: string, isError = false) => {
    setBoardMessage(text);
    setBoardMessageIsError(isError);
    window.setTimeout(() => {
      setBoardMessage((current) => (current === text ? null : current));
    }, 1600);
  };

  const pushBossLog = useCallback((text: string, kind: BossLogEntry['kind'] = 'boss') => {
    setBossLog((log) => [
      ...log.slice(-29),
      { id: ++bossLogId.current, text, kind },
    ]);
  }, []);

  const openBossIntro = useCallback(() => {
    if (!map?.boss) return;
    if (doorSealTimer.current) window.clearTimeout(doorSealTimer.current);
    setIntroStep(0);
    setKeysRevealed(false);
    setDoorSealed(false);
    setShowWelcome(false);
    setBossIntroOpen(true);
  }, [map]);

  const finishBossIntro = useCallback(() => {
    setBossIntroOpen(false);
    setIntroStep(0);
    setKeysRevealed(true);
    setDoorSealed(true);
    if (doorSealTimer.current) window.clearTimeout(doorSealTimer.current);
    doorSealTimer.current = window.setTimeout(() => setDoorSealed(false), 1200);
  }, []);

  useEffect(() => {
    if (!bossIntroOpen || introStep >= introLinesCount) return;
    const timer = window.setTimeout(
      () => setIntroStep((value) => Math.min(value + 1, introLinesCount)),
      introStep === 0 ? 650 : 2100,
    );
    return () => window.clearTimeout(timer);
  }, [bossIntroOpen, introStep, introLinesCount]);

  const playFrames = async (
    result: ExecutionResult,
    token: number,
    initialCoins: Set<number>,
    initialKeys: Set<string>,
  ) => {
    const coins = new Set(initialCoins);
    const keys = new Set(initialKeys);
    const cellName = (point: { x: number; y: number }) => `${String.fromCharCode(65 + point.x)}${point.y + 1}`;

    let previousBoss = enemies.find((enemy) => enemy.boss) ?? null;
    let previousBossHp = previousBoss?.alive ? previousBoss.hp : 0;
    let previousPlayerHp = playerHp;
    let lastAim = bossAim;

    for (const frame of result.frames as GameFrame[]) {
      if (runToken.current !== token) return;

      const bossNow = frame.enemies.find((enemy) => enemy.boss) ?? null;
      const bossBefore = previousBoss;
      const bossHpBefore = previousBossHp;
      const bossCell = bossNow?.alive
        ? cellName(bossNow)
        : bossBefore?.alive
          ? cellName(bossBefore)
          : undefined;

      frame.collectedCoins.forEach((coinId) => coins.add(coinId));
      frame.collectedKeys.forEach((keyPos) => keys.add(keyPos));

      setRobot({ x: frame.x, y: frame.y, direction: frame.direction });
      setEnemies(frame.enemies);
      setHasKey(frame.hasKey);
      setKeyPosition(frame.keyPosition ?? null);
      setBossDefeated(Boolean(frame.bossDefeated));
      setTicks(frame.tick);
      setCollectedCoins(new Set(coins));
      setCollectedKeys(new Set(keys));
      setCurrentLine(frame.line ?? null);
      if (frame.fakeKeys) setFakeKeys(frame.fakeKeys);
      if (frame.bossAim !== undefined) setBossAim(frame.bossAim ?? null);
      if (frame.bossMark !== undefined) setBossMark(frame.bossMark ?? null);
      if (frame.hazards !== undefined) setHazards(frame.hazards ?? []);
      if (frame.exit) setExitPosition(frame.exit);
      if (typeof frame.playerHp === 'number') setPlayerHp(frame.playerHp);
      if (typeof frame.attackCooldown === 'number') setAttackCooldown(frame.attackCooldown);

      if (frame.type === 'boss_move' && frame.bossFrom && frame.bossTo) {
        triggerBossFx('step', { from: frame.bossFrom, to: frame.bossTo }, 520);
      }

      if (frame.type === 'boss_charge') {
        triggerBossFx('charge', { from: bossCell, to: frame.bossAim ?? lastAim ?? undefined }, 1100);
      } else if (frame.type === 'boss_shot') {
        const damage = Math.max(0, previousPlayerHp - (frame.playerHp ?? previousPlayerHp));
        triggerBossFx('shot', { from: bossCell, to: lastAim ?? cellName(frame), damage }, 1000);
      } else if (frame.type === 'boss_miss') {
        triggerBossFx('miss', { from: bossCell, to: lastAim ?? undefined }, 900);
      } else if (frame.type === 'boss_touch') {
        triggerBossFx('touch', { from: bossCell, to: cellName(frame) }, 700);
      } else if (frame.type === 'hazard_hit') {
        const damage = Math.max(0, previousPlayerHp - (frame.playerHp ?? previousPlayerHp));
        if (damage > 0) triggerBossFx('hit', { from: cellName(frame), damage }, 820);
      } else if (frame.type === 'boss_rage') {
        flashBoard('attack');
      } else if (frame.type === 'attack' && bossHpBefore > 0 && bossNow) {
        if (!bossNow.alive) {
          triggerBossFx('defeat', { from: cellName(bossBefore ?? bossNow) }, 1500);
        } else if (bossNow.hp < bossHpBefore) {
          triggerBossFx('hit', { from: cellName(bossNow), damage: bossHpBefore - bossNow.hp }, 750);
        }
      }

      if (
        frame.type === 'hit'
        || frame.type === 'fake_key'
        || frame.type === 'defeat'
        || frame.type === 'boss_shot'
        || frame.type === 'boss_touch'
        || frame.type === 'hazard_hit'
      ) {
        flashBoard('hit');
      }
      if (frame.type === 'attack' || frame.type === 'key' || frame.type === 'exit' || frame.type === 'boss_charge') {
        flashBoard('attack');
      }
      if (frame.message) {
        if (frame.speaker === 'boss') {
          pushBossLog(
            frame.message,
            frame.type === 'fake_key'
              || frame.type === 'defeat'
              || frame.type === 'boss_shot'
              || frame.type === 'boss_touch'
              || frame.type === 'boss_charge'
              ? 'danger'
              : 'boss',
          );
        }
        showMessage(
          frame.message,
          frame.type === 'error'
            || frame.type === 'dead'
            || frame.type === 'locked'
            || frame.type === 'fake_key'
            || frame.type === 'defeat'
            || frame.type === 'boss_shot'
            || frame.type === 'boss_touch',
        );
      }

      if (frame.bossAim) lastAim = frame.bossAim;
      else if (frame.type === 'boss_shot' || frame.type === 'boss_miss') lastAim = null;

      if (bossNow) {
        previousBoss = bossNow;
        previousBossHp = bossNow.alive ? bossNow.hp : 0;
      }
      previousPlayerHp = frame.playerHp ?? previousPlayerHp;

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
    if (bossFxTimer.current) window.clearTimeout(bossFxTimer.current);
    setBossFx(null);
    setHazards([]);
    setBossTarget(null);

    try {
      const response = await runCode(levelId, code, isPreview);
      if (runToken.current !== token) return;

      const result = response.execution;
      setExecution(result);
      await playFrames(result, token, collectedCoins, collectedKeys);
      if (runToken.current !== token) return;

      if (result.crashed) {
        applyServerState(response.state);
        showMessage('Робот разбился - следующий запуск стартует с этой точки', true);
      } else if (result.defeated) {
        applyServerState(response.state);
        showMessage('Босс победил - уровень начинается заново', true);
      } else {
        setCollectedCoins(new Set(response.state.collectedCoins));
        setCollectedKeys(new Set(response.state.collectedKeys));
        setHasKey(response.state.hasKey);
        setKeyPosition(response.state.keyPosition ?? null);
        setFakeKeys(response.state.fakeKeys ?? []);
        setExitPosition(response.state.exit);
        setPlayerHp(response.state.playerHp ?? 0);
        setPlayerMaxHp(response.state.playerMaxHp ?? 0);
        setAttackCooldown(response.state.attackCooldown ?? 0);
        setKeysCollected(response.state.keysCollected ?? 0);
        setKeysTotal(response.state.keysTotal ?? 0);
        setBossDefeated(Boolean(response.state.bossDefeated));
        setBossHint(response.state.bossHint ?? null);
        setBossAim(response.state.bossAim ?? null);
        setBossMark(response.state.bossMark ?? null);
        setHazards(response.state.hazards ?? []);
        setBossTarget(response.state.bossTarget ?? null);
        setTicks(response.state.ticks);
      }

      // Поле ввода очищается после каждого запуска, но при ошибке в коде
      // остаётся, чтобы её можно было исправить.
      if (!result.errorInCode || result.crashed) setCode('');

      let stars = result.stars;
      if (!isPreview) {
        stars = response.userStars;
        setRuns(response.attemptNumber);
      }

      setSavedStars(stars);
      if (result.success) {
        setResultModal('success');
      } else if (result.defeated) {
        setResultModal('defeat');
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
    setRuns(0);

    try {
      const state = await resetSession(levelId, isPreview);
      applyServerState(state);
    } catch {
      applyEntrance(level);
    }
    if (level.mapData.boss) {
      setBossLog([]);
      openBossIntro();
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
      : execution.defeated
        ? `Поражение · ${execution.errorMessage ?? 'босс победил'}${runsNote}`
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
  const showNext = !isPreview && nextLevelId !== null;
  const entrancePos = parsePos(map.entrance);
  const robotAtEntrance = robot ? robot.x === entrancePos.x && robot.y === entrancePos.y : true;
  const bossEnemy = enemies.find((enemy) => enemy.boss);
  const hasBoss = Boolean(map.enemies?.some((enemy) => enemy.boss));
  const bossAvatar = boss?.avatar ?? biome;
  const keyCarried = enemies.some((enemy) => enemy.alive && enemy.hasKey);
  const bossShielded = Boolean(bossEnemy?.shielded);

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
          <span className={`stat stat--key${hasKey ? ' is-on' : ''}`}>
            {hasKey ? 'Ключ собран' : keyCarried ? 'Ключ у врага' : 'Ключ не найден'}
          </span>
          {hasBoss && (
            <span className={`stat stat--boss${bossEnemy?.alive ? '' : ' is-on'}`}>
              {bossEnemy?.alive
                ? `Босс ${bossEnemy.hp}/${bossEnemy.maxHp}${bossEnemy.shielded ? ' · щит' : ''}`
                : bossDefeated || bossEnemy
                  ? 'Босс повержен'
                  : 'Босс'}
            </span>
          )}
          {hasBoss && playerMaxHp > 0 && (
            <span className={`stat stat--hp${playerHp <= 1 ? ' is-low' : ''}`}>
              Жизни {Math.max(0, playerHp)}/{playerMaxHp}
            </span>
          )}
          {hasBoss && (
            <span className={`stat stat--keys${hasKey ? ' is-on' : ''}`}>
              Ключи {keysCollected}/{keysTotal}
            </span>
          )}
          {hasBoss && attackCooldown > 0 && (
            <span className="stat stat--cooldown">Перезарядка {attackCooldown}</span>
          )}
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
          {boss && hasBoss && (
            <BossPanel
              boss={boss}
              bossAvatar={bossAvatar}
              bossBiome={biome}
              bossHp={bossEnemy?.alive ? bossEnemy.hp : 0}
              bossMaxHp={bossEnemy?.maxHp ?? boss.hp}
              shielded={bossShielded && Boolean(bossEnemy?.alive)}
              defeated={Boolean(bossDefeated || (bossEnemy && !bossEnemy.alive))}
              playerHp={playerHp}
              playerMaxHp={playerMaxHp}
              cooldown={attackCooldown}
              hint={bossHint}
              aim={bossAim}
              mark={bossMark}
              fx={bossFx?.kind ?? null}
              raging={bossRaging}
              hazard={activeHazard}
              bossTarget={bossTarget}
              log={bossLog}
            />
          )}
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
              <div className="board-3d-shell">
                <MazeBoard
                  map={map}
                  robot={robot}
                  enemies={enemies}
                  collectedCoins={collectedCoins}
                  collectedKeys={collectedKeys}
                  hasKey={hasKey}
                  keyPosition={keyPosition}
                  fakeKeys={fakeKeys}
                  bossAim={bossAim}
                  bossMark={bossMark}
                  bossFx={bossFx}
                  bossRaging={bossRaging}
                  hazards={hazards}
                  exit={exitPosition}
                  hideKeys={!keysRevealed}
                  keysRevealed={keysRevealed}
                  doorSealed={doorSealed}
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

      {boss && hasBoss && bossIntroOpen && (
        <BossIntro
          boss={boss}
          bossAvatar={bossAvatar}
          bossBiome={biome}
          lines={introLines}
          step={introStep}
          onNext={() => setIntroStep((value) => Math.min(value + 1, introLinesCount))}
          onSkip={finishBossIntro}
          onStart={finishBossIntro}
        />
      )}

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
                    if (nextLevelId !== null) navigate(`/user/levels/${nextLevelId}`);
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

      {resultModal === 'defeat' && execution && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 style={{ textAlign: 'center' }}>Босс победил</h2>
            <p className="modal-sub" style={{ textAlign: 'center' }}>
              {boss?.player_defeat_line ?? 'Все жизни потеряны. Уровень начнётся с нуля.'}
            </p>
            <div className="modal-grid">
              <div className="modal-stat"><b>{execution.fakeKeyHits ?? 0}</b><span>фальшивых ключей</span></div>
              <div className="modal-stat"><b>{execution.keysCollected}/{execution.keysTotal}</b><span>ключей собрано</span></div>
              <div className="modal-stat"><b>{execution.playerHp}/{execution.playerMaxHp}</b><span>жизни</span></div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn--primary"
                onClick={() => {
                  setResultModal(null);
                  openBossIntro();
                }}
              >
                Начать заново
              </button>
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
