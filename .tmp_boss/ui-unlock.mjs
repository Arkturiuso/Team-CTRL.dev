const API = 'http://localhost:7085/api';
const login = process.env.UI_LOGIN ?? 'bossui_stage';
const password = 'Test1234!';
let token = '';

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

function route(map, targets, startPos, startDir) {
  const commands = [];
  let current = { ...startPos };
  let facing = startDir;
  for (const target of targets) {
    const path = bfs(map, current, parsePos(target));
    if (!path) throw new Error(`no path to ${target}`);
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
  return commands.join('\n');
}

async function getLevel(id) {
  const json = await request(`/level/${id}`);
  const level = json.data;
  if (typeof level.mapData === 'string') level.mapData = JSON.parse(level.mapData);
  return level;
}

async function main() {
  await request('/register', 'POST', { login, password });
  const data = await request('/auth/login', 'POST', { login, password });
  token = data.data.tokens.accessToken;

  for (const id of [1, 2, 3, 4, 5]) {
    const level = await getLevel(id);
    const map = level.mapData;
    await request(`/execution/reset/${id}`, 'POST');
    const targets = [map.required_key_position, map.exit].filter(Boolean);
    const code = route(map, targets, parsePos(map.entrance), map.entrance_direction ?? 'right');
    const run = await request('/execution/run', 'POST', { levelId: id, code, preview: false });
    console.log(`L${id} ${run.data.execution.success ? 'ok' : 'FAIL ' + run.data.execution.errorMessage}`);
  }

  console.log(`login=${login}`);
  console.log(`password=${password}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
