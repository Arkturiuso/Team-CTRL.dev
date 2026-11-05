const API = 'http://localhost:7085/api';
const login = `bosstest_${Date.now()}`;
const password = 'Test1234!';
let token = '';
let checks = 0;
let failed = 0;

function check(name, condition, detail = '') {
  checks++;
  if (!condition) {
    failed++;
    console.log(`FAIL ${name}${detail ? ` :: ${detail}` : ''}`);
  }
}

async function request(path, method = 'GET', body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch { }
  if (!response.ok) throw new Error(`${method} ${path} -> ${response.status} ${text.slice(0, 300)}`);
  return json;
}

const parsePos = (value) => ({ x: value.charCodeAt(0) - 65, y: Number(value.slice(1)) - 1 });
const posName = (x, y) => `${String.fromCharCode(65 + x)}${y + 1}`;
const DIRS = ['up', 'right', 'down', 'left'];
const STEP = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const TURN = { up: 0, right: 1, down: 2, left: 3 };

function bfs(map, from, to, blocked) {
  const rocks = new Set(map.rocks ?? []);
  const walls = new Set((map.walls ?? []).map((w) => [w.side1, w.side2].sort().join('|')));
  const start = posName(from.x, from.y);
  const goal = posName(to.x, to.y);
  const queue = [start];
  const prev = new Map([[start, null]]);
  while (queue.length) {
    const cell = queue.shift();
    if (cell === goal) break;
    const { x, y } = parsePos(cell);
    for (const dir of DIRS) {
      const [dx, dy] = STEP[dir];
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
      const next = posName(nx, ny);
      if (rocks.has(next) || blocked.has(next) || prev.has(next)) continue;
      if (walls.has([cell, next].sort().join('|'))) continue;
      prev.set(next, cell);
      queue.push(next);
    }
  }
  if (!prev.has(goal)) return null;
  const path = [];
  let cell = goal;
  while (cell && cell !== start) {
    path.unshift(cell);
    cell = prev.get(cell);
  }
  return path;
}

function navigate(map, from, dir, targets, blocked = new Set()) {
  const commands = [];
  let current = { ...from };
  let facing = dir;
  for (const target of targets) {
    const path = bfs(map, current, parsePos(target), blocked);
    if (!path) throw new Error(`no path ${posName(current.x, current.y)} -> ${target}`);
    for (const cell of path) {
      const next = parsePos(cell);
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const wanted = dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up';
      const diff = (TURN[wanted] - TURN[facing] + 4) % 4;
      if (diff === 1) { commands.push('robot.turn_right()'); facing = wanted; }
      else if (diff === 3) { commands.push('robot.turn_left()'); facing = wanted; }
      else if (diff === 2) { commands.push('robot.turn_left()', 'robot.turn_left()'); facing = wanted; }
      commands.push('robot.move()');
      current = next;
    }
  }
  return commands;
}

const solutionDuration = { 6: 3, 12: 4, 18: 3, 24: 5 };

function bossSolution(map, boss) {
  const commands = [];
  commands.push('robot.move()', 'robot.move()', 'robot.turn_right()');
  for (let i = 0; i < 7; i++) commands.push('robot.move()');
  commands.push('robot.turn_left()');
  const shots = boss.hp;
  for (let i = 0; i < shots; i++) {
    commands.push(`robot.attack(${Math.min(6, boss.attack_range)})`);
    if (i < shots - 1) {
      for (let t = 0; t < 4; t++) commands.push('robot.turn_left()');
    }
  }
  if (map.alternate_exit === 'O1') {
    commands.push('robot.turn_left()');
    for (let i = 0; i < 7; i++) commands.push('robot.move()');
    commands.push('robot.turn_right()');
    for (let i = 0; i < 12; i++) commands.push('robot.move()');
  } else {
    commands.push('robot.turn_right()');
    for (let i = 0; i < 7; i++) commands.push('robot.move()');
    commands.push('robot.turn_left()');
    for (let i = 0; i < 12; i++) commands.push('robot.move()');
  }
  return commands.join('\n');
}

async function getLevel(levelId) {
  const json = await request(`/level/${levelId}`);
  const level = json.data;
  if (typeof level.mapData === 'string') level.mapData = JSON.parse(level.mapData);
  return level;
}

async function reset(levelId) {
  return (await request(`/execution/reset/${levelId}`, 'POST')).data;
}

async function run(levelId, code) {
  return (await request('/execution/run', 'POST', { levelId, code, preview: false })).data;
}

async function main() {
  await request('/register', 'POST', { login, password });
  const loginData = await request('/auth/login', 'POST', { login, password });
  token = loginData.data.tokens.accessToken;

  // regular level regression
  const l1 = await getLevel(1);
  await reset(1);
  const r1 = await run(1, Array(6).fill('robot.move()').join('\n'));
  check('L1 success', r1.execution.success, r1.execution.errorMessage);
  check('L1 no player hp', r1.execution.playerMaxHp === 0, String(r1.execution.playerMaxHp));

  for (const levelId of [6, 12, 18, 24]) {
    const level = await getLevel(levelId);
    const map = level.mapData;
    const boss = map.boss;
    check(`L${levelId} boss config`, Boolean(boss) && map.width === 15 && map.height === 15);
    check(`L${levelId} boss hp`, map.enemies.some((e) => e.boss && e.hp === boss.hp));
    check(`L${levelId} fake keys`, map.keys.filter((k) => k.fake).length === 4);
    check(`L${levelId} attack_range unlocked`, level.allowedCommands.some((c) => c.name === 'attack_range'));

    await reset(levelId);
    const result = await run(levelId, bossSolution(map, boss));
    check(`L${levelId} success`, result.execution.success, result.execution.errorMessage);
    check(`L${levelId} boss defeated`, result.execution.bossDefeated);
    check(`L${levelId} keys`, result.execution.keysCollected === 1 && result.execution.keysTotal === 1);
    check(`L${levelId} player hp full`, result.execution.playerHp === boss.player_hp, String(result.execution.playerHp));
    check(`L${levelId} exit`, result.execution.exit === (map.alternate_exit ?? map.exit), result.execution.exit);
    check(`L${levelId} cooldown used`, result.execution.frames.some((f) => f.type === 'attack') && result.execution.frames.filter((f) => f.type === 'attack').length >= boss.hp);
    if (map.alternate_exit) {
      check(`L${levelId} exit swapped frame`, result.execution.frames.some((f) => f.type === 'exit' && f.exit === map.alternate_exit));
    }
  }

  // shield before real key on level 6
  {
    const level = await getLevel(6);
    await reset(6);
    const code = [
      ...Array(7).fill('robot.move()'),
      'robot.turn_right()',
      'robot.move()',
      'robot.attack(6)',
    ].join('\n');
    const result = await run(6, code);
    const bossFrame = [...result.execution.frames].reverse().find((f) => f.enemies.some((e) => e.boss));
    const bossEnemy = bossFrame?.enemies.find((e) => e.boss);
    check('L6 shield blocks', !result.execution.bossDefeated && bossEnemy?.hp === level.mapData.boss.hp, `hp=${bossEnemy?.hp}`);
    check('L6 shield message', result.execution.frames.some((f) => (f.message ?? '').includes('щит')));
  }

  // cooldown blocks immediate second shot
  {
    await reset(6);
    const code = [
      'robot.move()', 'robot.move()', 'robot.turn_right()',
      ...Array(7).fill('robot.move()'),
      'robot.turn_left()',
      'robot.attack(6)',
      'robot.attack(6)',
      'robot.turn_left()',
      'robot.turn_left()',
      'robot.turn_left()',
      'robot.turn_left()',
      'robot.attack(6)',
    ].join('\n');
    const result = await run(6, code);
    const attacks = result.execution.frames.filter((f) => f.type === 'attack');
    const cooldowns = result.execution.frames.filter((f) => f.type === 'cooldown');
    const bossFrame = [...result.execution.frames].reverse().find((f) => f.enemies.some((e) => e.boss));
    const bossEnemy = bossFrame?.enemies.find((e) => e.boss);
    check('L6 cooldown frame', cooldowns.length === 1, String(cooldowns.length));
    check('L6 two hits', attacks.length === 2, String(attacks.length));
    check('L6 boss hp after cooldown', bossEnemy?.hp === 1, String(bossEnemy?.hp));
  }

  // fake key loses hp and persists across runs
  {
    await reset(6);
    const first = await run(6, ['robot.move()', 'robot.move()', 'robot.move()', 'robot.move()', 'robot.turn_right()', 'robot.move()', 'robot.move()', 'robot.move()', 'robot.move()'].join('\n'));
    check('L6 fake hit', first.execution.fakeKeyHits === 1, String(first.execution.fakeKeyHits));
    check('L6 hp after fake', first.execution.playerHp === 2, String(first.execution.playerHp));
    check('L6 state hp', first.state.playerHp === 2, String(first.state.playerHp));
    check('L6 fake removed', !first.state.fakeKeys.includes('E5'), first.state.fakeKeys.join(','));
    check('L6 continues from fake', first.state.x === 4 && first.state.y === 4, `${first.state.x},${first.state.y}`);

    const second = await run(6, 'print("next")');
    check('L6 hp persists', second.state.playerHp === 2, String(second.state.playerHp));
    check('L6 position persists', second.state.x === 4 && second.state.y === 4, `${second.state.x},${second.state.y}`);
  }

  // 0 hp -> full level reset
  {
    const level = await getLevel(6);
    const map = level.mapData;
    await reset(6);
    const blocked = new Set(map.enemies.filter((e) => e.boss).map((e) => e.patrol[0]));
    const fakeTargets = ['E5', 'J4', 'M10'];
    const commands = navigate(map, parsePos(map.entrance), map.entrance_direction ?? 'right', fakeTargets, blocked);
    const result = await run(6, commands.join('\n'));
    check('L6 defeat at 0 hp', result.execution.defeated === true, JSON.stringify({ hp: result.execution.playerHp, err: result.execution.errorMessage }));
    check('L6 defeat hp 0', result.execution.playerHp === 0, String(result.execution.playerHp));
    check('L6 defeat resets hp', result.state.playerHp === map.boss.player_hp, String(result.state.playerHp));
    check('L6 defeat resets position', result.state.x === 0 && result.state.y === 0, `${result.state.x},${result.state.y}`);
    check('L6 defeat restores fakes', result.state.fakeKeys.length === 4, String(result.state.fakeKeys.length));
    check('L6 defeat restores boss', result.state.enemies.find((e) => e.boss)?.hp === map.boss.hp);
  }

  console.log(`checks=${checks} failed=${failed}`);
  console.log(`user=${login}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('ERROR', error.message);
  process.exitCode = 1;
});
