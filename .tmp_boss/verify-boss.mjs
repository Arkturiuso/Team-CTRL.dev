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
const DIRS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
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

const sector = (p, boss) => `${Math.sign(p.x - boss.x)},${Math.sign(p.y - boss.y)}`;
const directionWord = (p, boss) => {
  const dx = Math.sign(p.x - boss.x);
  const dy = Math.sign(p.y - boss.y);
  if (dy < 0 && dx < 0) return 'северо-западнее';
  if (dy < 0 && dx > 0) return 'северо-восточнее';
  if (dy < 0) return 'севернее';
  if (dy === 0 && dx < 0) return 'западнее';
  if (dy === 0 && dx > 0) return 'восточнее';
  if (dy > 0 && dx < 0) return 'юго-западнее';
  if (dy > 0 && dx > 0) return 'юго-восточнее';
  return 'южнее';
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

const chooseFiring = (start, map, rocks, boss, range, blocked, minDistance = 2, avoid = null, minAvoid = 0) => {
  let best = null;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const cell = { x, y };
      if ((x === boss.x && y === boss.y) || rocks.has(key(cell)) || blocked.has(key(cell))) continue;
      if (avoid && Math.abs(x - avoid.x) + Math.abs(y - avoid.y) < minAvoid) continue;
      const dx = x - boss.x;
      const dy = y - boss.y;
      if (!((dx === 0 && dy !== 0) || (dy === 0 && dx !== 0))) continue;
      const distance = Math.abs(dx) + Math.abs(dy);
      if (distance < minDistance || distance > range || !lineClear(cell, boss, rocks)) continue;
      const path = bfs(start, cell, map, blocked);
      if (!path) continue;
      const dodge = { x: x + Math.sign(boss.x - x), y: y + Math.sign(boss.y - y) };
      if (rocks.has(key(dodge)) || blocked.has(key(dodge))) continue;
      const facing = DIRS.findIndex((d) => d.dx === Math.sign(boss.x - x) && d.dy === Math.sign(boss.y - y));
      const score = path.length + Math.abs(distance - range);
      if (!best || score < best.score) best = { cell, dodge, facing, distance, score };
    }
  }
  return best;
};

const setup = async (levelId, token) => {
  const state = (await api(`/api/execution/reset/${levelId}`, { method: 'POST', token })).json.data;
  const map = (await api(`/api/level/${levelId}`, { token })).json.data.mapData;
  const bossEnemy = state.enemies.find((enemy) => enemy.boss);
  const boss = { x: bossEnemy.x, y: bossEnemy.y };
  const entrance = parsePos(map.entrance);
  const realKey = parsePos(state.keyPosition);
  const fakeNames = state.fakeKeys;
  const fakes = new Set(fakeNames.map((p) => key(parsePos(p))));
  const rocks = new Set((map.rocks ?? []).map((p) => key(parsePos(p))));
  const range = map.boss.attack_range ?? 6;
  const bossHp = map.boss.hp;
  const blocked = new Set([...fakes, key(boss)]);
  const walkBlocked = new Set([...blocked, ...rocks]);

  const toKey = walk(entrance, realKey, 1, map, walkBlocked);
  const firing = toKey && chooseFiring(realKey, map, rocks, boss, range, walkBlocked);
  const toFiring = firing && walk(realKey, firing.cell, toKey.direction, map, walkBlocked);
  const path = toKey && toFiring ? [...toKey.commands, ...toFiring.commands, ...turnCommands(toFiring.direction, firing.facing)] : null;

  return {
    state, map, boss, realKey, fakeNames, fakes, rocks, range, bossHp,
    blocked, walkBlocked, toKey, firing, toFiring, path,
    firingDir: firing?.facing,
    fakeNames,
  };
};

const run = async (levelId, code, token) => {
  const res = await api('/api/execution/run', { method: 'POST', token, body: { levelId, code, preview: false } });
  const execution = res.json?.data?.execution;
  if (!execution) throw new Error(`no execution: ${JSON.stringify(res.json)}`);
  const types = {};
  for (const f of execution.frames ?? []) types[f.type] = (types[f.type] ?? 0) + 1;
  return { execution, types };
};

const allChecks = [];
const check = (name, ok, detail) => allChecks.push({ name, ok, detail });

const verifyRandom = async (token) => {
  const keys = [];
  const bosses = [];
  let hintsOk = true;
  let uniqueOk = true;
  let shapeOk = true;
  let bossOk = true;
  for (let i = 0; i < 8; i++) {
    const state = (await api('/api/execution/reset/6', { method: 'POST', token })).json.data;
    const bossEnemy = state.enemies.find((enemy) => enemy.boss);
    const boss = { x: bossEnemy.x, y: bossEnemy.y };
    const real = parsePos(state.keyPosition);
    keys.push(state.keyPosition);
    bosses.push(posName(boss));
    shapeOk &&= Boolean(state.keyPosition) && state.fakeKeys.length === 4;
    hintsOk &&= (state.bossHint ?? '').includes(directionWord(real, boss));
    uniqueOk &&= !state.fakeKeys.some((f) => sector(parsePos(f), boss) === sector(real, boss));
    bossOk &&= Math.abs(boss.x - 7) <= 2 && Math.abs(boss.y - 7) <= 2;
  }
  const distinct = new Set(keys).size;
  const distinctBoss = new Set(bosses).size;
  check('рандомизация: 1 ключ + 4 фальшивки каждый сброс', shapeOk, '');
  check('рандомизация: подсказка всегда совпадает с настоящим ключом', hintsOk, '');
  check('рандомизация: фальшивки не в секторе настоящего ключа', uniqueOk, '');
  check('рандомизация: ключ меняет позицию между сбросами', distinct >= 4, `разных позиций за 8 сбросов: ${distinct}; ${keys.join(', ')}`);
  check('босс: стоит в центральной зоне арены', bossOk, bosses.join(', '));
  check('босс: меняет клетку между сбросами', distinctBoss >= 3, `разных клеток за 8 сбросов: ${distinctBoss}; ${bosses.join(', ')}`);
};

const verifyLevel = async (levelId, token) => {
  // 1. Победа с уклонениями
  let s = await setup(levelId, token);
  if (!s.path) { check(`L${levelId}: маршрут найден`, false, 'планировщик не построил путь'); return; }
  const dodge = [...s.path];
  for (let hit = 0; hit < s.bossHp; hit++) {
    dodge.push(`robot.attack(${s.range})`);
    if (hit === s.bossHp - 1) break;
    dodge.push('robot.move()');
    dodge.push('robot.turn_right()', 'robot.turn_right()');
    dodge.push('robot.move()');
    dodge.push('robot.turn_right()', 'robot.turn_right()');
  }
  const exit = parsePos(s.map.alternate_exit ?? s.map.exit);
  const back = walk(s.firing.cell, exit, s.firingDir, s.map, new Set([...s.fakes, ...s.rocks]));
  if (back) dodge.push(...back.commands);
  let r = await run(levelId, dodge.join('\n'), token);
  check(`L${levelId}: победа за 1 запуск с уклонениями`, r.execution.success && r.execution.bossDefeated, `status=${r.execution.status}, hp=${r.execution.playerHp}/${r.execution.playerMaxHp}, ticks=${r.execution.ticks}`);
  check(`L${levelId}: уклонение сохраняет HP`, r.execution.playerHp === r.execution.playerMaxHp, `hp=${r.execution.playerHp}/${r.execution.playerMaxHp}`);
  check(`L${levelId}: босс отвечает залпом (boss_charge + boss_miss)`, (r.types.boss_charge ?? 0) > 0 && (r.types.boss_miss ?? 0) > 0 && (r.types.boss_shot ?? 0) === 0, `charge=${r.types.boss_charge ?? 0}, miss=${r.types.boss_miss ?? 0}, shot=${r.types.boss_shot ?? 0}`);

  // 2. Спам атаки без уклонения
  s = await setup(levelId, token);
  if (!s.path) { check(`L${levelId}: спам-план`, false, 'нет пути'); return; }
  const spam = [...s.path];
  for (let hit = 0; hit < s.bossHp; hit++) {
    spam.push(`robot.attack(${s.range})`);
    spam.push('robot.turn_left()', 'robot.turn_right()', 'robot.turn_left()');
  }
  r = await run(levelId, spam.join('\n'), token);
  check(`L${levelId}: спам attack не проходит уровень`, !r.execution.success && r.execution.defeated, `success=${r.execution.success}, defeated=${r.execution.defeated}, hp=${r.execution.playerHp}/${r.execution.playerMaxHp}`);
  check(`L${levelId}: спам получает ответные попадания`, (r.types.boss_shot ?? 0) > 0 && r.execution.playerHp === 0, `boss_shot=${r.types.boss_shot ?? 0}, hp=${r.execution.playerHp}`);

  // 3. Стоять на месте после выстрела
  s = await setup(levelId, token);
  if (!s.path) { check(`L${levelId}: стойка на месте`, false, 'нет пути'); return; }
  const stand = [...s.path, `robot.attack(${s.range})`];
  for (let i = 0; i < 4; i++) stand.push('robot.turn_left()', 'robot.turn_right()');
  r = await run(levelId, stand.join('\n'), token);
  const expectedHp = Math.max(0, r.execution.playerMaxHp - (s.map.boss.shot_damage ?? 1));
  check(`L${levelId}: повороты не уклоняются от залпа`, (r.types.boss_shot ?? 0) > 0 && r.execution.playerHp === expectedHp, `boss_shot=${r.types.boss_shot ?? 0}, hp=${r.execution.playerHp} (ожидалось ${expectedHp})`);
};

const verifyMark = async (token) => {
  const s = await setup(24, token);
  if (!s.path) { check('метка: маршрут найден', false, 'планировщик не построил путь'); return; }
  const mark = s.firing.cell;
  const escape = chooseFiring(mark, s.map, s.rocks, s.boss, s.range, s.walkBlocked, 3, mark, 2);
  const toEscape = escape && walk(mark, escape.cell, s.firingDir, s.map, s.walkBlocked);
  if (!escape || !toEscape) { check('метка: путь для снятия метки', false, 'не найдена безопасная клетка'); return; }

  const attack = `robot.attack(${s.range})`;
  const code = [
    ...s.path,
    attack,
    'robot.turn_left()',
    'robot.turn_right()',
    attack,
    'robot.turn_left()',
    'robot.turn_right()',
    ...toEscape.commands,
    ...turnCommands(toEscape.direction, escape.facing),
    attack,
    'robot.move()',
  ];
  const r = await run(24, code.join('\n'), token);
  const shots = r.execution.frames.filter((frame) => frame.type === 'boss_shot');
  const charges = r.execution.frames.filter((frame) => frame.type === 'boss_charge');
  const marks = r.execution.frames.map((frame) => frame.bossMark).filter(Boolean);

  check(
    'метка: после попадания босс помечает клетку',
    shots.length > 0 && shots[0].bossMark === posName(mark),
    `mark=${shots[0]?.bossMark}, firing=${posName(mark)}`,
  );
  check(
    'метка: зарядка по метке нацелена в метку',
    charges[1]?.bossAim === posName(mark) && charges[1]?.bossMark === posName(mark),
    `aim=${charges[1]?.bossAim}, mark=${charges[1]?.bossMark}`,
  );
  check(
    'метка: повторный залп по метке наносит урон',
    shots.length >= 2 && r.execution.playerHp <= r.execution.playerMaxHp - 2,
    `boss_shot=${shots.length}, hp=${r.execution.playerHp}/${r.execution.playerMaxHp}`,
  );
  check(
    'метка: уход на 2 клетки снимает метку',
    charges[2]?.bossAim === posName(escape.cell) && charges[2]?.bossMark == null,
    `aim=${charges[2]?.bossAim}, mark=${charges[2]?.bossMark}, escape=${posName(escape.cell)}`,
  );
  check('метка: кадры содержат bossMark', marks.length > 0, `marks=${marks.join(', ')}`);
};

(async () => {
  const login = process.env.LOGIN ?? `bosscheck_${Date.now()}`;
  let token = process.env.ACCESS_TOKEN;
  if (!token) {
    if (!process.env.LOGIN) {
      await api('/api/register', { method: 'POST', body: { login, password } });
    }
    const auth = await api('/api/auth/login', { method: 'POST', body: { login, password } });
    token = auth.json?.data?.tokens?.accessToken;
  }
  console.log('TEST_LOGIN', login);
  console.log('TOKEN', Boolean(token));

  if (process.env.PRINT_UI_CODE === '1') {
    const s = await setup(24, token);
    const mark = s.firing.cell;
    const escape = chooseFiring(mark, s.map, s.rocks, s.boss, s.range, s.walkBlocked, 3, mark, 2);
    const toEscape = escape && walk(mark, escape.cell, s.firingDir, s.map, s.walkBlocked);
    const attack = `robot.attack(${s.range})`;
    const code = [
      ...s.path,
      attack,
      'robot.turn_left()',
      'robot.turn_right()',
      attack,
      'robot.turn_left()',
      'robot.turn_right()',
      ...(toEscape?.commands ?? []),
      ...(toEscape ? turnCommands(toEscape.direction, escape.facing) : []),
      attack,
      'robot.move()',
    ];
    console.log('UI_CODE_START');
    console.log(code.join('\n'));
    console.log('UI_CODE_END');
    process.exit(0);
  }

  await verifyRandom(token);
  for (const lvl of [6, 12, 18, 24]) await verifyLevel(lvl, token);
  await verifyMark(token);

  console.log('');
  let failed = 0;
  for (const c of allChecks) {
    if (!c.ok) failed++;
    console.log(`${c.ok ? 'PASS' : 'FAIL'} | ${c.name}${c.detail ? ' | ' + c.detail : ''}`);
  }
  console.log(`\nИТОГ: ${allChecks.length - failed}/${allChecks.length} проверок пройдено`);
  process.exit(failed ? 1 : 0);
})();
