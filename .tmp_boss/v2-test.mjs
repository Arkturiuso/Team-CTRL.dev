const BASE = 'http://localhost:7085';
const password = 'Test1234!';

const api = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
};

const parsePos = (name) => ({ x: name.charCodeAt(0) - 65, y: Number(name.slice(1)) - 1 });
const posName = ({ x, y }) => `${String.fromCharCode(65 + x)}${y + 1}`;
const key = (p) => `${p.x},${p.y}`;

const DIRS = [
  { dx: 0, dy: -1, name: 'up' },
  { dx: 1, dy: 0, name: 'right' },
  { dx: 0, dy: 1, name: 'down' },
  { dx: -1, dy: 0, name: 'left' },
];

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
  let current = goal;
  while (current) {
    path.unshift(current);
    current = prev.get(key(current));
  }
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
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    const target = DIRS.findIndex((d) => d.dx === dx && d.dy === dy);
    if (target < 0) throw new Error('bad step');
    commands.push(...turnCommands(dir, target));
    dir = target;
    commands.push('robot.move()');
  }
  return { commands, direction: dir, at: to };
};

const face = (direction, target) => turnCommands(direction, target);

const sector = (p, boss) => `${Math.sign(p.x - boss.x)},${Math.sign(p.y - boss.y)}`;
const directionWord = (p, boss) => {
  const dx = Math.sign(p.x - boss.x);
  const dy = Math.sign(p.y - boss.y);
  if (dy < 0) return dx < 0 ? 'северо-западнее' : dx > 0 ? 'северо-восточнее' : 'севернее';
  if (dy === 0) return dx < 0 ? 'западнее' : dx > 0 ? 'восточнее' : 'на месте';
  return dx < 0 ? 'юго-западнее' : dx > 0 ? 'юго-восточнее' : 'южнее';
};

const lineClear = (from, to, map, rocks) => {
  let cell = from;
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  while (!(cell.x === to.x && cell.y === to.y)) {
    cell = { x: cell.x + dx, y: cell.y + dy };
    if (cell.x === to.x && cell.y === to.y) break;
    if (rocks.has(key(cell))) return false;
  }
  return true;
};

const chooseFiring = (start, map, rocks, boss, range, blocked, dirsToBoss) => {
  let best = null;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const cell = { x, y };
      if ((x === boss.x && y === boss.y) || rocks.has(key(cell)) || blocked.has(key(cell))) continue;
      const dx = x - boss.x;
      const dy = y - boss.y;
      const aligned = (dx === 0 && dy !== 0) || (dy === 0 && dx !== 0);
      if (!aligned) continue;
      const distance = Math.abs(dx) + Math.abs(dy);
      if (distance < 2 || distance > range) continue;
      if (!lineClear(cell, boss, map, rocks)) continue;
      const path = bfs(start, cell, map, blocked);
      if (!path) continue;
      const dodge = { x: x + Math.sign(boss.x - x), y: y + Math.sign(boss.y - y) };
      if (dodge.x === boss.x && dodge.y === boss.y) continue;
      if (rocks.has(key(dodge)) || dodge.x < 0 || dodge.y < 0 || dodge.x >= map.width || dodge.y >= map.height) continue;
      const facing = DIRS.findIndex((d) => d.dx === Math.sign(boss.x - x) && d.dy === Math.sign(boss.y - y));
      if (facing < 0) continue;
      const score = path.length + Math.abs(distance - range);
      if (!best || score < best.score) best = { cell, dodge, facing, distance, score, path };
    }
  }
  return best;
};

const runFight = async (levelId, token) => {
  const reset = await api(`/api/execution/reset/${levelId}`, { method: 'POST', token });
  const state = reset.json?.data;
  const level = await api(`/api/level/${levelId}`, { token });
  const map = level.json?.data?.mapData;
  const bossDef = (map.enemies ?? []).find((e) => e.boss);
  const boss = parsePos(bossDef.position);
  const entrance = parsePos(map.entrance);
  const realKey = parsePos(state.keyPosition);
  const fakes = new Set(state.fakeKeys.map((p) => key(parsePos(p))));
  const rocks = new Set((map.rocks ?? []).map((p) => key(parsePos(p))));
  const range = map.boss.attack_range ?? 6;
  const bossHp = map.boss.hp;

  // hint checks
  const expected = directionWord(realKey, boss);
  const hintOk = (state.bossHint ?? '').includes(expected);
  const unique = !state.fakeKeys.some((pos) => sector(parsePos(pos), boss) === sector(realKey, boss));
  const keysOk = Boolean(state.keyPosition) && state.fakeKeys.length === 4;

  const blocked = new Set([...fakes, key(boss)]);
  const walkBlocked = new Set([...blocked, ...rocks]);
  const toKey = walk(entrance, realKey, 1, map, walkBlocked);
  if (!toKey) return { levelId, error: 'no path to key', realKey: posName(realKey), hint: state.bossHint };
  const dirAfterKey = toKey.direction;

  const firing = chooseFiring(realKey, map, rocks, boss, range, walkBlocked, null);
  if (!firing) return { levelId, error: 'no firing cell', realKey: posName(realKey) };

  const commands = [...toKey.commands];
  const toFiring = walk(realKey, firing.cell, dirAfterKey, map, walkBlocked);
  if (!toFiring) return { levelId, error: 'no path to firing cell' };
  commands.push(...toFiring.commands);
  commands.push(...face(toFiring.direction, firing.facing));

  let dir = firing.facing;
  let at = firing.cell;
  for (let hit = 0; hit < bossHp; hit++) {
    commands.push(`robot.attack(${range})`);
    if (hit === bossHp - 1) break;

    commands.push('robot.move()');
    at = firing.dodge;
    const turnBack = face(dir, (dir + 2) % 4);
    commands.push(...turnBack);
    dir = (dir + 2) % 4;
    commands.push('robot.move()');
    at = firing.cell;
    commands.push(...face(dir, firing.facing));
    dir = firing.facing;
  }

  const exitName = map.alternate_exit ?? map.exit;
  const exit = parsePos(exitName);
  const toExit = walk(at, exit, dir, map, new Set([...fakes, ...rocks]));
  if (!toExit) return { levelId, error: 'no path to exit', realKey: posName(realKey) };
  commands.push(...toExit.commands);

  const code = commands.join('\n');
  const run = await api('/api/execution/run', {
    method: 'POST',
    token,
    body: { levelId, code, preview: false },
  });
  const execution = run.json?.data?.execution;
  if (!execution) return { levelId, error: 'no execution', status: run.status, body: run.json };

  const types = {};
  for (const frame of execution.frames ?? []) types[frame.type] = (types[frame.type] ?? 0) + 1;

  return {
    levelId,
    keysOk,
    hintOk,
    unique,
    realKey: posName(realKey),
    hint: state.bossHint,
    firing: posName(firing.cell),
    distance: firing.distance,
    success: execution.success,
    bossDefeated: execution.bossDefeated,
    playerHp: `${execution.playerHp}/${execution.playerMaxHp}`,
    fakeHits: execution.fakeKeyHits,
    ticks: execution.ticks,
    types,
    error: execution.errorMessage,
    frameLog: (execution.frames ?? [])
      .filter((f) => ['attack', 'boss_charge', 'boss_shot', 'boss_miss', 'key', 'success', 'defeat', 'error', 'locked'].includes(f.type))
      .map((f) => `${f.type}${f.message ? `: ${f.message}` : ''}`),
  };
};

const runSpam = async (levelId, token) => {
  const reset = await api(`/api/execution/reset/${levelId}`, { method: 'POST', token });
  const state = reset.json?.data;
  const level = await api(`/api/level/${levelId}`, { token });
  const map = level.json?.data?.mapData;
  const bossDef = (map.enemies ?? []).find((e) => e.boss);
  const boss = parsePos(bossDef.position);
  const entrance = parsePos(map.entrance);
  const realKey = parsePos(state.keyPosition);
  const fakes = new Set(state.fakeKeys.map((p) => key(parsePos(p))));
  const rocks = new Set((map.rocks ?? []).map((p) => key(parsePos(p))));
  const range = map.boss.attack_range ?? 6;
  const bossHp = map.boss.hp;

  const blocked = new Set([...fakes, key(boss)]);
  const walkBlocked = new Set([...blocked, ...rocks]);
  const toKey = walk(entrance, realKey, 1, map, walkBlocked);
  const firing = chooseFiring(realKey, map, rocks, boss, range, walkBlocked, null);
  if (!toKey || !firing) return { levelId, error: 'plan failed' };
  const toFiring = walk(realKey, firing.cell, toKey.direction, map, walkBlocked);
  if (!toFiring) return { levelId, error: 'plan failed' };

  const commands = [...toKey.commands, ...toFiring.commands, ...face(toFiring.direction, firing.facing)];
  for (let hit = 0; hit < bossHp; hit++) {
    commands.push(`robot.attack(${range})`);
    commands.push('robot.turn_left()');
    commands.push('robot.turn_right()');
  }
  const code = commands.join('\n');
  const run = await api('/api/execution/run', { method: 'POST', token, body: { levelId, code, preview: false } });
  const execution = run.json?.data?.execution;
  if (!execution) return { levelId, error: 'no execution', body: run.json };
  const types = {};
  for (const frame of execution.frames ?? []) types[frame.type] = (types[frame.type] ?? 0) + 1;
  return {
    levelId,
    defeated: execution.defeated,
    playerHp: `${execution.playerHp}/${execution.playerMaxHp}`,
    success: execution.success,
    ticks: execution.ticks,
    types,
    error: execution.errorMessage,
    plan: { realKey: posName(realKey), firing: posName(firing.cell), path: toFiring.at ? posName(toFiring.at) : null },
    tail: (execution.frames ?? []).slice(-3).map((f) => `${f.type} @${posName({ x: f.x, y: f.y })}${f.message ? `: ${f.message}` : ''}`),
  };
};

(async () => {
  const login = `bossv2_${Date.now()}`;
  await api('/api/register', { method: 'POST', body: { login, password } });
  const auth = await api('/api/auth/login', { method: 'POST', body: { login, password } });
  const token = auth.json?.data?.tokens?.accessToken;
  console.log('user', login, 'token', Boolean(token));

  for (const levelId of [6, 12, 18, 24]) {
    const result = await runFight(levelId, token);
    console.log('\nVICTORY', JSON.stringify(result, null, 2));
  }

  for (const levelId of [6, 12, 18, 24]) {
    const result = await runSpam(levelId, token);
    console.log('\nSPAM', JSON.stringify(result, null, 2));
  }

  console.log('\nTEST_LOGIN', login);
})();
