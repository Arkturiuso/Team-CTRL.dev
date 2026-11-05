const BASE = 'http://localhost:7085';
const password = 'Test1234!';

const api = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
};

const parsePos = (name) => ({ x: name.charCodeAt(0) - 65, y: Number(name.slice(1)) - 1 });
const posName = ({ x, y }) => `${String.fromCharCode(65 + x)}${y + 1}`;
const key = (p) => `${p.x},${p.y}`;
const DIRS = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
const DIR_INDEX = { up: 0, right: 1, down: 2, left: 3 };

const bfs = (start, goal, map, blocked) => {
  const queue = [start];
  const prev = new Map([[key(start), null]]);
  while (queue.length) {
    const cell = queue.shift();
    if (cell.x === goal.x && cell.y === goal.y) break;
    for (const dir of DIRS) {
      const next = { x: cell.x + dir.dx, y: cell.y + dir.dy };
      if (next.x < 0 || next.y < 0 || next.x >= map.width || next.y >= map.height) continue;
      if (blocked.has(key(next)) || prev.has(key(next))) continue;
      prev.set(key(next), cell);
      queue.push(next);
    }
  }
  if (!prev.has(key(goal))) return null;
  const path = [];
  for (let cur = goal; cur; cur = prev.get(key(cur))) path.unshift(cur);
  return path;
};

const turnCommands = (current, target) => {
  const delta = (target - current + 4) % 4;
  if (delta === 0) return [];
  if (delta === 1) return ['robot.turn_right()'];
  if (delta === 3) return ['robot.turn_left()'];
  return ['robot.turn_right()', 'robot.turn_right()'];
};

const walk = (from, to, direction, map, blocked) => {
  const path = bfs(from, to, map, blocked);
  if (!path) return null;
  const commands = [];
  let dir = direction;
  for (let i = 1; i < path.length; i++) {
    const target = DIRS.findIndex((d) => d.dx === path[i].x - path[i - 1].x && d.dy === path[i].y - path[i - 1].y);
    commands.push(...turnCommands(dir, target));
    dir = target;
    commands.push('robot.move()');
  }
  return { commands, direction: dir };
};

const lineClear = (from, to, rocks) => {
  let cell = { ...from };
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  while (!(cell.x === to.x && cell.y === to.y)) {
    cell = { x: cell.x + dx, y: cell.y + dy };
    if (cell.x === to.x && cell.y === to.y) break;
    if (rocks.has(key(cell))) return false;
  }
  return true;
};

const chooseFiring = (start, ctx, boss, blocked, minDistance = 2, avoid = null, minAvoid = 0, options = {}) => {
  const { requireAdvance = false, danger = new Set() } = options;
  let best = null;
  for (let y = 0; y < ctx.map.height; y++) {
    for (let x = 0; x < ctx.map.width; x++) {
      const cell = { x, y };
      if ((x === boss.x && y === boss.y) || ctx.rocks.has(key(cell)) || blocked.has(key(cell))) continue;
      if (danger.has(key(cell))) continue;
      if (avoid && Math.abs(x - avoid.x) + Math.abs(y - avoid.y) < minAvoid) continue;
      const dx = x - boss.x;
      const dy = y - boss.y;
      if (!((dx === 0 && dy !== 0) || (dy === 0 && dx !== 0))) continue;
      const distance = Math.abs(dx) + Math.abs(dy);
      if (distance < minDistance || distance > ctx.range || !lineClear(cell, boss, ctx.rocks)) continue;
      const path = bfs(start, cell, ctx.map, blocked);
      if (!path) continue;
      const facing = DIRS.findIndex((d) => d.dx === Math.sign(boss.x - x) && d.dy === Math.sign(boss.y - y));
      let advance = null;
      if (requireAdvance) {
        const next = { x: x + DIRS[facing].dx, y: y + DIRS[facing].dy };
        const outside = next.x < 0 || next.y < 0 || next.x >= ctx.map.width || next.y >= ctx.map.height;
        const busy = ctx.rocks.has(key(next)) || blocked.has(key(next)) || danger.has(key(next))
          || (next.x === boss.x && next.y === boss.y);
        if (outside || busy) continue;
        advance = next;
      }
      const score = path.length * 2 + Math.abs(distance - ctx.range);
      if (!best || score < best.score) best = { cell, facing, distance, advance, pathLength: path.length, score };
    }
  }
  return best;
};

const safeNeighbours = (cell, ctx, blocked, avoidCells) => {
  const options = [];
  for (let index = 0; index < DIRS.length; index++) {
    const dir = DIRS[index];
    const next = { x: cell.x + dir.dx, y: cell.y + dir.dy };
    if (next.x < 0 || next.y < 0 || next.x >= ctx.map.width || next.y >= ctx.map.height) continue;
    if (ctx.rocks.has(key(next)) || blocked.has(key(next)) || avoidCells.has(key(next))) continue;
    options.push({ cell: next, facing: index });
  }
  return options;
};

const stateOf = async (levelId, token) => (await api(`/api/execution/state/${levelId}`, { token })).json.data;

const runSegment = async (levelId, commands, token) => {
  const res = await api('/api/execution/run', {
    method: 'POST',
    token,
    body: { levelId, code: commands.join('\n'), preview: false },
  });
  const data = res.json?.data;
  if (!data?.execution) throw new Error(`no execution: ${JSON.stringify(res.json).slice(0, 300)}`);
  return { execution: data.execution, state: data.state, frames: data.execution.frames ?? [] };
};

const allChecks = [];
const check = (name, ok, detail = '') => allChecks.push({ name, ok, detail });

const dangerCells = (hazards) =>
  new Set((hazards ?? []).filter((h) => h.state === 'warn' || h.state === 'impact').flatMap((h) => h.cells.map((c) => key(parsePos(c)))));

const isHazardHit = (frame) => frame.type === 'hazard_hit' && (frame.message ?? '').includes('HP');

const escapeOptions = (cell, frame, ctx) => {
  const busy = new Set((frame.fakeKeys ?? []).map((name) => key(parsePos(name))));
  for (const enemy of frame.enemies ?? []) if (enemy.alive) busy.add(key(enemy));
  const danger = dangerCells(frame.hazards);
  const options = [];
  for (const dir of DIRS) {
    const next = { x: cell.x + dir.dx, y: cell.y + dir.dy };
    if (next.x < 0 || next.y < 0 || next.x >= ctx.map.width || next.y >= ctx.map.height) continue;
    if (ctx.rocks.has(key(next)) || busy.has(key(next)) || danger.has(key(next))) continue;
    options.push(next);
  }
  return options;
};

const hazardHitsOnRobot = (frames) =>
  frames.filter((frame) => isHazardHit(frame)
    && (frame.hazards ?? []).some((h) => h.state === 'impact' && h.cells.some((c) => c === posName({ x: frame.x, y: frame.y }))))
    .length;

const hpLoss = (frames) => {
  const byType = {};
  let lost = 0;
  frames.forEach((frame, index) => {
    if (index === 0) return;
    const delta = frames[index - 1].playerHp - frame.playerHp;
    if (delta <= 0) return;
    lost += delta;
    byType[frame.type] = (byType[frame.type] ?? 0) + delta;
  });
  return { lost, byType };
};

const bossTrail = (frames) => {
  const steps = [];
  let teleports = 0;
  for (const frame of frames) {
    if (frame.type !== 'boss_move' || !frame.bossFrom || !frame.bossTo) continue;
    const from = parsePos(frame.bossFrom);
    const to = parsePos(frame.bossTo);
    steps.push(`${frame.bossFrom}->${frame.bossTo}`);
    if (Math.abs(from.x - to.x) + Math.abs(from.y - to.y) !== 1) teleports++;
  }
  return { steps, teleports };
};

// телеграф живёт ровно fuse действий робота; тик симулятора наследуется между запусками сессии
const fuseGaps = (frames, fuse) => {
  const gaps = [];
  const warned = new Map();
  for (const frame of frames) {
    for (const hazard of frame.hazards ?? []) {
      if (hazard.state === 'warn' && !warned.has(hazard.id)) warned.set(hazard.id, frame.tick);
      if (hazard.state === 'impact' && warned.has(hazard.id)) {
        gaps.push(frame.tick - warned.get(hazard.id));
        warned.delete(hazard.id);
      }
    }
  }
  return { gaps, fuse };
};

const buildCtx = (levelId, token, state, map) => {
  const ctx = {
    levelId,
    token,
    map,
    rocks: new Set((map.rocks ?? []).map((p) => key(parsePos(p)))),
    range: map.boss.attack_range ?? 6,
    minDistance: map.boss.ai?.min_distance ?? 2,
    fuse: map.boss.hazard?.fuse ?? 3,
  };
  refresh(ctx, state);
  return ctx;
};

const fetchMap = async (levelId, token) => (await api(`/api/level/${levelId}`, { token })).json.data.mapData;

const prepare = async (levelId, token) => {
  const res = await api(`/api/execution/reset/${levelId}`, { method: 'POST', token });
  const state = res.json?.data;
  if (!state?.enemies) throw new Error(`reset/${levelId} вернул не состояние: ${JSON.stringify(res.json).slice(0, 400)}`);
  return buildCtx(levelId, token, state, await fetchMap(levelId, token));
};

// то же, но без сброса: расположение ключей и босса остаётся таким, каким его видит браузер
const peek = async (levelId, token) => {
  const res = await api(`/api/execution/state/${levelId}`, { token });
  const state = res.json?.data;
  if (!state?.enemies) throw new Error(`state/${levelId} вернул не состояние: ${JSON.stringify(res.json).slice(0, 400)}`);
  return buildCtx(levelId, token, state, await fetchMap(levelId, token));
};

const refresh = (ctx, state) => {
  const bossEnemy = state.enemies.find((enemy) => enemy.boss);
  ctx.here = { x: state.x, y: state.y };
  ctx.dir = DIR_INDEX[state.direction] ?? 1;
  ctx.boss = bossEnemy ? { x: bossEnemy.x, y: bossEnemy.y } : null;
  ctx.bossAlive = Boolean(bossEnemy?.alive);
  ctx.blocked = new Set([...(state.fakeKeys ?? []).map((p) => key(parsePos(p))), ...(bossEnemy ? [key(bossEnemy)] : [])]);
  ctx.walkBlocked = new Set([...ctx.blocked, ...ctx.rocks]);
  ctx.state = state;
};

const DEBUG = process.env.DEBUG === '1';
const log = (...args) => { if (DEBUG) console.log(...args); };

const playFight = async (ctx) => {
  const { levelId, token } = ctx;
  const frames = [];
  const runs = [];

  let state = ctx.state;
  let teleports = 0;
  let steps = 0;

  const push = (result, commands) => {
    frames.push(...result.frames);
    runs.push(commands.length);

    if (!DEBUG) return;
    for (const frame of result.frames) {
      for (const hazard of frame.hazards ?? []) {
        log(`    hazard tick=${frame.tick} id=${hazard.id} ${hazard.state} fuse=${hazard.fuse} (${frame.type})`);
      }
    }
  };

  for (let iteration = 0; iteration < 60; iteration++) {
    refresh(ctx, state);
    if (!ctx.bossAlive) break;

    const danger = dangerCells(state.hazards);
    const pathBlocked = new Set([...ctx.walkBlocked, ...danger]);
    const commands = [];

    log(`#${iteration} here=${posName(ctx.here)} dir=${state.direction} key=${state.hasKey} boss=${ctx.boss ? posName(ctx.boss) : 'нет'} bossHp=${state.enemies?.find((e) => e.boss)?.hp} playerHp=${state.playerHp} aim=${state.bossAim ?? '-'} mark=${state.bossMark ?? '-'} danger=[${[...danger].map((k) => posName({ x: Number(k.split(',')[0]), y: Number(k.split(',')[1]) })).join(' ')}]`);

    // с текущей клетки, намеченной опасностью, уходим сразу
    if (danger.has(key(ctx.here))) {
      const escape = safeNeighbours(ctx.here, ctx, ctx.walkBlocked, danger)[0];
      if (escape) {
        log(`  -> побег из опасности в ${posName(escape.cell)}`);
        commands.push(...turnCommands(ctx.dir, escape.facing), 'robot.move()');
        const result = await runSegment(levelId, commands, token);
        push(result, commands);
        state = result.state;
        continue;
      }
      log('  -> выбраться из опасности некуда');
    }

    if (!state.hasKey && state.keyPosition) {
      const target = parsePos(state.keyPosition);
      const toKey = walk(ctx.here, target, ctx.dir, ctx.map, pathBlocked) ?? walk(ctx.here, target, ctx.dir, ctx.map, ctx.walkBlocked);
      if (!toKey) { log(`  -> ключ ${state.keyPosition} недостижим, стоп`); break; }
      log(`  -> идём за ключом ${state.keyPosition} (${toKey.commands.length} команд)`);
      commands.push(...toKey.commands);
      const result = await runSegment(levelId, commands, token);
      push(result, commands);
      state = result.state;
      continue;
    }

    // после выстрела босс целится в нашу клетку и стреляет по следующему действию,
    // поэтому уходим шагом вперёд (там же, куда смотрим) - поворот стоил бы жизни
    const firing = chooseFiring(ctx.here, ctx, ctx.boss, ctx.walkBlocked, ctx.minDistance, null, 0, { requireAdvance: true, danger })
      ?? chooseFiring(ctx.here, ctx, ctx.boss, ctx.walkBlocked, ctx.minDistance, null, 0, { danger });
    if (!firing) { log('  -> нет клетки для выстрела, стоп'); break; }
    const toFiring = walk(ctx.here, firing.cell, ctx.dir, ctx.map, pathBlocked) ?? walk(ctx.here, firing.cell, ctx.dir, ctx.map, ctx.walkBlocked);
    if (!toFiring) { log(`  -> клетка ${posName(firing.cell)} недостижима, стоп`); break; }
    commands.push(...toFiring.commands, ...turnCommands(toFiring.direction, firing.facing), `robot.attack(${ctx.range})`);
    if (firing.advance) commands.push('robot.move()');
    log(`  -> стреляем из ${posName(firing.cell)} (дист ${firing.distance}), уход ${firing.advance ? posName(firing.advance) : 'невозможен'}, команд ${commands.length}`);

    const result = await runSegment(levelId, commands, token);
    push(result, commands);
    const trail = bossTrail(result.frames);
    steps += trail.steps.length;
    teleports += trail.teleports;
    state = result.state;

    if (result.execution.success || result.execution.defeated) break;
  }

  const trail = bossTrail(frames);

  // бой окончен победой - надо ещё дойти до выхода, уровень должен засчитаться
  let escape = { success: false, stars: 0 };
  if (state.bossDefeated && !state.completed) {
    refresh(ctx, state);
    const blocked = new Set([...ctx.rocks, ...(state.fakeKeys ?? []).map((name) => key(parsePos(name)))]);
    for (const enemy of state.enemies ?? []) if (enemy.alive) blocked.add(key(enemy));
    const toExit = walk(ctx.here, parsePos(state.exit ?? ctx.map.exit ?? 'A1'), ctx.dir, ctx.map, blocked);
    if (toExit) {
      const result = await runSegment(levelId, toExit.commands, token);
      push(result, toExit.commands);
      state = result.state;
      escape = { success: Boolean(result.execution.success), stars: result.execution.stars ?? 0 };
    } else {
      log('  -> до выхода не дойти');
    }
  }

  return {
    state,
    frames,
    runs,

    escape,
    teleports: teleports + trail.teleports,
    steps: steps + trail.steps.length
  };
};

const playSpam = async (ctx) => {
  const { levelId, token } = ctx;
  let state = ctx.state;
  if (!state.hasKey && state.keyPosition) {
    refresh(ctx, state);
    const toKey = walk(ctx.here, parsePos(state.keyPosition), ctx.dir, ctx.map, ctx.walkBlocked);
    if (toKey) state = (await runSegment(levelId, toKey.commands, token)).state;
  }
  refresh(ctx, state);
  const firing = chooseFiring(ctx.here, ctx, ctx.boss, ctx.walkBlocked, ctx.minDistance);
  const commands = [];
  if (firing) {
    const toFiring = walk(ctx.here, firing.cell, ctx.dir, ctx.map, ctx.walkBlocked);
    if (toFiring) commands.push(...toFiring.commands, ...turnCommands(toFiring.direction, firing.facing));
  }
  const attack = `robot.attack(${ctx.range})`;
  for (let i = 0; i < 24; i++) commands.push(attack);
  const result = await runSegment(levelId, commands, token);
  return { execution: result.execution, frames: result.frames };
};

const playStand = async (ctx) => {
  const { levelId, token } = ctx;
  let state = ctx.state;
  if (!state.hasKey && state.keyPosition) {
    refresh(ctx, state);
    const toKey = walk(ctx.here, parsePos(state.keyPosition), ctx.dir, ctx.map, ctx.walkBlocked);
    if (toKey) state = (await runSegment(levelId, toKey.commands, token)).state;
  }
  refresh(ctx, state);
  const firing = chooseFiring(ctx.here, ctx, ctx.boss, ctx.walkBlocked, ctx.minDistance);
  const commands = [];
  if (firing) {
    const toFiring = walk(ctx.here, firing.cell, ctx.dir, ctx.map, ctx.walkBlocked);
    if (toFiring) commands.push(...toFiring.commands, ...turnCommands(toFiring.direction, firing.facing));
  }
  const attack = `robot.attack(${ctx.range})`;
  // повороты не спасают: стоим на месте и под залпами, и под опасностями
  for (let i = 0; i < 40 && commands.length < 90; i++) commands.push(attack, 'robot.turn_left()', 'robot.turn_right()');
  const result = await runSegment(levelId, commands, token);
  return { execution: result.execution, frames: result.frames };
};

const playIgnoreTelegraph = async (ctx) => {
  const { levelId, token } = ctx;
  let state = ctx.state;
  const frames = [];
  refresh(ctx, state);
  if (!state.hasKey && state.keyPosition) {
    const toKey = walk(ctx.here, parsePos(state.keyPosition), ctx.dir, ctx.map, ctx.walkBlocked);
    if (!toKey) return { frames, state, startHp: state.playerHp, hazardState: [], blocked: true };
    const first = await runSegment(levelId, toKey.commands, token);
    frames.push(...first.frames);
    state = first.state;
  }

  // стоим на месте и крутимся на месте: опасность бьёт ровно по нашей клетке, если не уходить
  const startHp = state.playerHp;
  let hazardState = [];
  let hazardTarget = null;
  let hazardRaging = false;
  for (let i = 0; i < 14 && hazardHitsOnRobot(frames) === 0; i++) {
    const result = await runSegment(levelId, SPIN, token);
    frames.push(...result.frames);
    state = result.state;
    refresh(ctx, state);
    if (result.frames.some((frame) => (frame.hazards ?? []).length > 0) && hazardState.length === 0) {
      // состояние отдельно: фронт читает его при перезагрузке страницы, опасности должны быть там же
      const live = (await api(`/api/execution/state/${levelId}`, { token })).json.data;
      if (live.hazards?.length) {
        hazardState = live.hazards;
        hazardTarget = live.bossTarget;
        hazardRaging = live.bossRaging;
      }
    }
  }
  return { frames, state, startHp, hpNow: state.playerHp, hazardState, hazardTarget, hazardRaging };
};

const SPIN = ['robot.turn_left()', 'robot.turn_left()', 'robot.turn_left()', 'robot.turn_left()', 'robot.turn_left()', 'robot.turn_left()'];

// следующий осмысленный кусок кода для текущей сессии: его можно вставить в браузер как есть
const nextSequence = (ctx, state) => {
  refresh(ctx, state);
  const danger = dangerCells(state.hazards);
  const pathBlocked = new Set([...ctx.walkBlocked, ...danger]);

  if (danger.has(key(ctx.here))) {
    const escape = safeNeighbours(ctx.here, ctx, ctx.walkBlocked, danger)[0];
    if (escape) return [...turnCommands(ctx.dir, escape.facing), 'robot.move()'];
  }

  if (!state.hasKey && state.keyPosition) {
    const toKey = walk(ctx.here, parsePos(state.keyPosition), ctx.dir, ctx.map, pathBlocked)
      ?? walk(ctx.here, parsePos(state.keyPosition), ctx.dir, ctx.map, ctx.walkBlocked);
    if (toKey) return toKey.commands;
  }

  const firing = chooseFiring(ctx.here, ctx, ctx.boss, ctx.walkBlocked, ctx.minDistance, null, 0, { requireAdvance: true, danger })
    ?? chooseFiring(ctx.here, ctx, ctx.boss, ctx.walkBlocked, ctx.minDistance, null, 0, { danger });
  if (!firing) return [];
  const toFiring = walk(ctx.here, firing.cell, ctx.dir, ctx.map, pathBlocked) ?? walk(ctx.here, firing.cell, ctx.dir, ctx.map, ctx.walkBlocked);
  if (!toFiring) return [];
  return [
    ...toFiring.commands,
    ...turnCommands(toFiring.direction, firing.facing),
    `robot.attack(${ctx.range})`,
    ...(firing.advance ? ['robot.move()'] : [])
  ];
};

// по одному действию, пока в сессии не зависнет телеграф: так скриншот браузера ловит реальное состояние
const stageBossFight = async (ctx) => {
  const { levelId, token } = ctx;
  let state = ctx.state;
  let sent = 0;

  for (let i = 0; i < 140; i++) {
    refresh(ctx, state);
    if (!ctx.bossAlive) return { state, sent, reason: 'босс повален' };
    if ((state.hazards ?? []).some((h) => h.state === 'warn')) return { state, sent, reason: 'телеграф висит' };

    const command = nextSequence(ctx, state)[0] ?? null;
    if (!command) return { state, sent, reason: 'нечего отправить' };
    const result = await runSegment(levelId, [command], token);
    sent++;
    state = result.state;
    if (result.execution.defeated) return { state, sent, reason: 'робот повален' };
  }
  return { state, sent, reason: 'лимит шагов' };
};

const verifyRandom = async (token) => {
  const keysSeen = [];
  const bossSeen = [];
  let shapeOk = true;
  let hintsOk = true;

  for (let i = 0; i < 8; i++) {
    const res = await api('/api/execution/reset/12', { method: 'POST', token });
    const state = res.json?.data;
    if (!state?.enemies) throw new Error(`reset/12 вернул не состояние: ${JSON.stringify(res.json).slice(0, 400)}`);
    const real = state.keyPosition;
    keysSeen.push(real);
    const bossEnemy = state.enemies.find((enemy) => enemy.boss);
    bossSeen.push(posName(bossEnemy));
    if (state.fakeKeys.length !== 4 || !real) shapeOk = false;
    const hint = state.bossHint ?? '';
    const dx = Math.sign(bossEnemy.x - parsePos(real).x);
    const dy = Math.sign(bossEnemy.y - parsePos(real).y);
    const expected = dy < 0 ? 'ернее' : dy > 0 ? 'жнее' : dx < 0 ? 'паднее' : 'точнее';
    if (!hint.toLowerCase().includes('лож')) hintsOk = hint.toLowerCase().includes(expected) || hintsOk;
    if (!hint.includes('люч')) hintsOk = false;
  }

  check('рандом: ключ и босс меняют клетки между сбросами',
    new Set(keysSeen).size >= 4 && new Set(bossSeen).size >= 3,
    `ключей=${new Set(keysSeen).size}, боссов=${new Set(bossSeen).size}`);
  check('рандом: 1 настоящий + 4 фальшивки и подсказка всегда есть', shapeOk && hintsOk, '');
};

const main = async () => {
  const login = process.env.LOGIN ?? `bossv3_${Date.now()}`;
  let token = process.env.ACCESS_TOKEN;
  if (!token) {
    if (!process.env.LOGIN) await api('/api/register', { method: 'POST', body: { login, password } });
    const auth = await api('/api/auth/login', { method: 'POST', body: { login, password } });
    token = auth.json?.data?.tokens?.accessToken;
  }
  console.log('TEST_LOGIN', login);
  if (!token) {
    console.log('NO TOKEN');
    process.exit(1);
  }

  await verifyRandom(token);

  if (process.env.PRINT_UI === '1') {
    const levelId = Number((process.env.LEVELS ?? '6').split(',')[0]);
    const ctx = await peek(levelId, token);
    const before = posName(ctx.boss);
    const staged = await stageBossFight(ctx);
    refresh(ctx, staged.state);
    console.log(`СТАРТ: босс=${before} робот=${posName(ctx.here)} ключ=${staged.state.keyPosition}`);
    console.log(`СТОП: ${staged.reason} после ${staged.sent} действий`);
    console.log(`БОСС: было ${before}, стало ${staged.state.enemies?.find((e) => e.boss) ? posName(staged.state.enemies.find((e) => e.boss)) : 'нет'}`,
      `цель=${staged.state.bossTarget ?? '-'} ярость=${staged.state.bossRaging}`);
    console.log(`РОБОТ: клетка=${posName(staged.state)} hp=${staged.state.playerHp}/${staged.state.playerMaxHp} ключ=${staged.state.hasKey}`,
      `прицел=${staged.state.bossAim ?? '-'} метка=${staged.state.bossMark ?? '-'}`);
    console.log(`ОПАСНОСТЬ: ${JSON.stringify(staged.state.hazards)}`);
    console.log('UI_CODE_START');
    console.log(nextSequence(ctx, staged.state).join('\n'));
    console.log('UI_CODE_END');
    process.exit(0);
  }

  for (const levelId of (process.env.LEVELS ?? '6,12,18,24').split(',').map(Number)) {
    const ctx = await prepare(levelId, token);
    const biome = ctx.map.biome;
    const fight = await playFight(ctx);
    // отдельный сценарий: ключ взят, робот топчется на месте - телеграф обязан сработать и ударить
    const ctx4 = await prepare(levelId, token);
    const idle = await playIgnoreTelegraph(ctx4);
    const types = {};
    for (const frame of fight.frames) types[frame.type] = (types[frame.type] ?? 0) + 1;
    const finalState = fight.state;

    check(`L${levelId} (${biome}): босс побеждается в интерактивном бою`,
      Boolean(finalState.bossDefeated),
      `runs=${fight.runs.length}, hp=${finalState.playerHp}/${finalState.playerMaxHp}, ticks=${finalState.ticks}`);
    check(`L${levelId}: после победы робот доходит до выхода и уровень засчитан`,
      fight.escape.success && fight.escape.stars >= 1,
      `success=${fight.escape.success}, звёзд=${fight.escape.stars}, completed=${finalState.completed}`);
    check(`L${levelId}: босс уходит с пробитой клетки шагом, без телепортов`,
      fight.steps >= 3 && fight.teleports === 0,
      `шагов=${fight.steps}, телепортов=${fight.teleports}`);
    check(`L${levelId}: ярость включается (boss_rage)`,
      (types.boss_rage ?? 0) >= 1,
      `boss_rage=${types.boss_rage ?? 0}`);
    const warnFrames = [...fight.frames, ...idle.frames].filter((frame) => frame.type === 'hazard_warn');
    check(`L${levelId}: опасность телеграфируется (hazard_warn ${ctx.map.boss.hazard?.kind})`,
      warnFrames.length > 0,
      `warn=${warnFrames.length}`);

    const warnOnRobot = warnFrames.every((frame) =>
      (frame.hazards ?? []).some((h) => h.cells.includes(posName({ x: frame.x, y: frame.y }))));
    check(`L${levelId}: телеграф всегда накрывает клетку робота в момент предупреждения`,
      warnOnRobot && warnFrames.length > 0, '');

    const fuseInfo = fuseGaps(fight.frames, ctx.map.boss.hazard?.fuse ?? 3);
    const idleFuse = fuseGaps(idle.frames, ctx.map.boss.hazard?.fuse ?? 3);
    const gaps = [...fuseInfo.gaps, ...idleFuse.gaps];
    const warnFuses = [...fight.frames, ...idle.frames]
      .flatMap((frame) => (frame.hazards ?? []).filter((h) => h.state === 'warn').map((h) => h.fuse));
    check(`L${levelId}: телеграф не короче обещанных ${fuseInfo.fuse} действий`,
      gaps.length > 0 && gaps.every((gap) => gap >= fuseInfo.fuse && gap <= fuseInfo.fuse + 2)
        && warnFuses.length > 0 && warnFuses.every((value) => value >= 1),
      `промежутки=${gaps.join(',') || 'нет завершённых опасностей'}, fuse=${fuseInfo.fuse}, счётчики=${[...new Set(warnFuses)].join('/')}`);

    const footprint = [...fight.frames, ...idle.frames].flatMap((frame) => (frame.hazards ?? []).map((h) => h.cells.length));
    const expectedCells = { tree: 1, lava: 1, sandstorm: 2, avalanche: 3 }[ctx.map.boss.hazard?.kind] ?? 1;
    check(`L${levelId}: ${ctx.map.boss.hazard?.kind} накрывает не больше ${expectedCells} соседних клет(ки)`,
      footprint.length > 0 && footprint.every((size) => size >= 1 && size <= expectedCells),
      `размеры=[${[...new Set(footprint)].join('/')}]`);

    const loss = hpLoss(fight.frames);
    check(`L${levelId}: уклончивый бой проходится почти без урона`,
      loss.lost <= 1 && hazardHitsOnRobot(fight.frames) <= 1,
      `потеряно=${loss.lost} (${JSON.stringify(loss.byType)}), попаданий опасности=${hazardHitsOnRobot(fight.frames)}`);

    // из телеграфа всегда должен быть куда шагнуть, иначе опасность = гарантированная смерть
    const trapped = warnFrames.filter((frame) =>
      (frame.hazards ?? []).some((h) => h.state === 'warn' && h.cells.includes(posName({ x: frame.x, y: frame.y })))
      && escapeOptions({ x: frame.x, y: frame.y }, frame, ctx).length === 0);
    check(`L${levelId}: из-под телеграфа всегда есть куда уйти`,
      trapped.length === 0,
      trapped.length ? `клетка ${posName({ x: trapped[0].x, y: trapped[0].y })} без свободных соседей` : '');

    check(`L${levelId}: состояние отдаёт опасности, цель и ярость босса`,
      'hazards' in finalState && 'bossTarget' in finalState && 'bossRaging' in finalState && idle.hazardState.length > 0,
      `опасностей в состоянии=${idle.hazardState.length}, вид=${idle.hazardState[0]?.kind}, target=${idle.hazardTarget}, raging=${idle.hazardRaging}`);

    // сброс и проверка "стоим на месте" - должны прилетать залпы
    const ctx2 = await prepare(levelId, token);
    const stand = await playStand(ctx2);
    const standTypes = {};
    for (const frame of stand.frames) standTypes[frame.type] = (standTypes[frame.type] ?? 0) + 1;
    check(`L${levelId}: без движения босс наказывает залпами (defeat)`,
      stand.execution.defeated && standTypes.boss_shot >= 1,
      `defeated=${stand.execution.defeated}, boss_shot=${standTypes.boss_shot ?? 0}`);

    check(`L${levelId}: игнор телеграфа опасности снимает жизнь`,
      hazardHitsOnRobot(idle.frames) >= 1 && idle.startHp - idle.hpNow >= 1,
      `попаданий=${hazardHitsOnRobot(idle.frames)}, hp ${idle.startHp}->${idle.hpNow}`);

    // спам атакой без прицеливания не проходит
    const ctx3 = await prepare(levelId, token);
    const spam = await playSpam(ctx3);
    check(`L${levelId}: спам attack не даёт пройти уровень`,
      !spam.execution.success,
      `success=${spam.execution.success}, defeated=${spam.execution.defeated}, hp=${spam.execution.playerHp}`);

    const errors = [...new Set(fight.frames.filter((frame) => frame.type === 'error').map((frame) => frame.message))];
    console.log(`L${levelId} ${biome}: бой ${JSON.stringify(types)} | стой ${JSON.stringify(standTypes)} | ошибки планировщика: ${errors.join(' | ') || 'нет'}`);
  }

  // метка по-прежнему работает: били по нам -> метка -> ушли далеко -> метки нет
  const ctx = await prepare(24, token);
  let state = ctx.state;
  let markFrames = [];
  for (let i = 0; i < 12; i++) {
    refresh(ctx, state);
    if (!ctx.bossAlive) break;
    if (!state.hasKey && state.keyPosition) {
      const toKey = walk(ctx.here, parsePos(state.keyPosition), ctx.dir, ctx.map, ctx.walkBlocked);
      if (!toKey) break;
      const r = await runSegment(ctx.levelId, toKey.commands, token);
      state = r.state;
      continue;
    }
    const firing = chooseFiring(ctx.here, ctx, ctx.boss, ctx.walkBlocked, ctx.minDistance);
    if (!firing) break;
    const toFiring = walk(ctx.here, firing.cell, ctx.dir, ctx.map, ctx.walkBlocked);
    const commands = [...toFiring.commands, ...turnCommands(toFiring.direction, firing.facing), `robot.attack(${ctx.range})`, 'robot.turn_left()', 'robot.turn_right()'];
    const r = await runSegment(ctx.levelId, commands, token);
    markFrames.push(...r.frames);
    state = r.state;
    if (state.bossMark) break;
  }

  const marks = markFrames.filter((frame) => frame.bossMark).map((frame) => frame.bossMark);
  check('метка: остаётся на клетке после попадания босса',
    Boolean(state.bossMark) || marks.length > 0,
    `mark=${state.bossMark ?? 'нет'}, кадры=${marks.join(',') || 'нет'}`);

  if (state.bossMark) {
    refresh(ctx, state);
    const marked = parsePos(state.bossMark);
    const firing = chooseFiring(ctx.here, ctx, ctx.boss, ctx.walkBlocked, ctx.minDistance, marked, 3);
    if (firing) {
      const toFiring = walk(ctx.here, firing.cell, ctx.dir, ctx.map, ctx.walkBlocked);
      const r = await runSegment(ctx.levelId, [...toFiring.commands, ...turnCommands(toFiring.direction, firing.facing), `robot.attack(${ctx.range})`], token);
      const cleared = !r.state.bossMark || r.state.bossMark !== state.bossMark;
      const types = {};
      for (const frame of r.frames) types[frame.type] = (types[frame.type] ?? 0) + 1;
      check('метка: уход на 3 клетки снимает её', cleared, `mark было=${state.bossMark}, стало=${r.state.bossMark ?? 'нет'}, shot=${types.boss_shot ?? 0}, miss=${types.boss_miss ?? 0}`);
    } else {
      check('метка: уход на 3 клетки снимает её', false, 'не найдена далёкая клетка');
    }
  }

  console.log('');
  let failed = 0;
  for (const c of allChecks) {
    if (!c.ok) failed++;
    console.log(`${c.ok ? 'PASS' : 'FAIL'} | ${c.name}${c.detail ? ' | ' + c.detail : ''}`);
  }
  console.log(`\nИТОГ: ${allChecks.length - failed}/${allChecks.length} проверок пройдено`);
  process.exit(failed ? 1 : 0);
};

main().catch((error) => {
  console.log('ERROR', error.message);
  process.exit(2);
});
