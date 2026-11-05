const API = 'http://localhost:7085/api';
const login = `alltest_${Date.now()}`;
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
  if (!response.ok) throw new Error(`${method} ${path} -> ${response.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

const parsePos = (value) => ({ x: value.charCodeAt(0) - 65, y: Number(value.slice(1)) - 1 });
const posName = (x, y) => `${String.fromCharCode(65 + x)}${y + 1}`;
const DIRS = ['up', 'right', 'down', 'left'];
const STEP = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const TURN = { up: 0, right: 1, down: 2, left: 3 };

function bfs(map, from, to) {
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
      if (rocks.has(next) || prev.has(next)) continue;
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

function turnCode(facing, wanted) {
  const diff = (TURN[wanted] - TURN[facing] + 4) % 4;
  if (diff === 0) return '';
  if (diff === 1) return 'robot.turn_right()';
  if (diff === 3) return 'robot.turn_left()';
  if (diff === 2) return 'robot.turn_left()';
  return '';
}

function dirBetween(from, to) {
  if (to.x === from.x + 1) return 'right';
  if (to.x === from.x - 1) return 'left';
  if (to.y === from.y + 1) return 'down';
  return 'up';
}

function stepCode(map, state, target) {
  const path = bfs(map, { x: state.x, y: state.y }, parsePos(target));
  if (!path || path.length === 0) return null;
  const next = parsePos(path[0]);
  const wanted = dirBetween({ x: state.x, y: state.y }, next);
  const turn = turnCode(state.direction, wanted);
  return `${turn ? `${turn}\n` : ''}robot.move()`;
}

async function getLevel(levelId) {
  const json = await request(`/level/${levelId}`);
  const level = json.data;
  if (typeof level.mapData === 'string') level.mapData = JSON.parse(level.mapData);
  return level;
}

const getState = async (levelId) => (await request(`/execution/state/${levelId}`)).data;
const reset = (levelId) => request(`/execution/reset/${levelId}`, 'POST');
const run = async (levelId, code) =>
  (await request('/execution/run', 'POST', { levelId, code, preview: false })).data;

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

// One robot action per run: always works from the latest server state and
// survives ice slides and moving enemies.
async function solveRegular(levelId, map) {
  await reset(levelId);
  let crashes = 0;
  let resets = 0;

  for (let step = 0; step < 320; step++) {
    const state = await getState(levelId);
    if (state.completed) return { ok: true, runs: step };

    const adjacent = state.enemies.find(
      (enemy) => enemy.alive && Math.abs(enemy.x - state.x) + Math.abs(enemy.y - state.y) === 1,
    );
    const carrier = state.enemies.find((enemy) => enemy.alive && enemy.hasKey);
    let code = null;

    if (adjacent) {
      const wanted = dirBetween({ x: state.x, y: state.y }, { x: adjacent.x, y: adjacent.y });
      code = state.direction === wanted
        ? 'robot.attack()'
        : turnCode(state.direction, wanted);
    }

    if (!code) {
      let goal = null;
      if (!state.hasKey) {
        if (carrier) goal = posName(carrier.x, carrier.y);
        else if (state.keyPosition) goal = state.keyPosition;
      } else {
        goal = state.exit ?? map.exit;
      }
      if (!goal) {
        // No key required on this level.
        goal = state.exit ?? map.exit;
      }
      code = stepCode(map, state, goal);
    }

    if (!code) {
      if (resets >= 2) return { ok: false, reason: 'no path' };
      resets++;
      await reset(levelId);
      continue;
    }

    const execution = (await run(levelId, code)).execution;
    if (execution.success) return { ok: true, runs: step + 1 };
    if (execution.errorInCode) return { ok: false, reason: execution.errorMessage };
    if (execution.crashed || execution.status === 'dead') {
      crashes++;
      if (crashes > 25) {
        if (resets >= 2) return { ok: false, reason: `stuck: ${execution.errorMessage}` };
        resets++;
        crashes = 0;
        await reset(levelId);
      }
    }
  }
  return { ok: false, reason: 'out of steps' };
}

async function main() {
  await request('/register', 'POST', { login, password });
  const loginData = await request('/auth/login', 'POST', { login, password });
  token = loginData.data.tokens.accessToken;

  for (const levelId of Array.from({ length: 24 }, (_, i) => i + 1)) {
    const level = await getLevel(levelId);
    const map = level.mapData;
    if (map.boss) {
      await reset(levelId);
      const result = await run(levelId, bossSolution(map, map.boss));
      const exec = result.execution;
      check(`L${levelId} boss success`, exec.success, exec.errorMessage);
      check(`L${levelId} boss defeated`, exec.bossDefeated);
      check(`L${levelId} boss player hp`, exec.playerHp === map.boss.player_hp, `${exec.playerHp}`);
      check(`L${levelId} boss exit`, exec.exit === (map.alternate_exit ?? map.exit), exec.exit);
      check(`L${levelId} boss stars`, exec.stars >= 1, String(exec.stars));
      console.log(`L${levelId} boss ${exec.success ? 'ok' : 'FAIL'}`);
      continue;
    }

    const solved = await solveRegular(levelId, map);
    check(`L${levelId} solved`, solved.ok, solved.reason);
    const after = await getLevel(levelId);
    check(`L${levelId} stars saved`, (after.userStars ?? 0) >= 1, String(after.userStars));
    console.log(`L${levelId} ${map.biome} ${map.width}x${map.height} ${solved.ok ? `ok (${solved.runs} actions)` : `FAIL ${solved.reason}`}`);
  }

  console.log(`checks=${checks} failed=${failed}`);
  console.log(`login=${login}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
