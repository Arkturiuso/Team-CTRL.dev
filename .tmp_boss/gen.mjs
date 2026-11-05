import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'C:/Team-CTRL.dev';
const SEED_PATHS = [
  path.join(ROOT, 'ROBOCODEDBFINAL.sql'),
  path.join(ROOT, 'Server_RoboCode/ROBOCODEDBFINAL.sql'),
  path.join(ROOT, 'docs/ROBOCODEDBFINAL (1).sql'),
];

const source = fs.readFileSync(SEED_PATHS[0], 'utf8');

function block(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start < 0) throw new Error(`start marker not found: ${startMarker}`);
  const end = text.indexOf(endMarker, start);
  if (end < 0) throw new Error(`end marker not found: ${endMarker}`);
  return { start, end };
}

const levelStart = 'INSERT INTO `level` VALUES ';
const levelEnd = ';\n\nDROP TABLE IF EXISTS `level_command`';
const levelBlock = block(source, levelStart, levelEnd);
const levelText = source.slice(levelBlock.start + levelStart.length, levelBlock.end);

const rowRegex = /\((\d+),'(\{.*?\})',(\d+),(\d+),'([^']+)'\)/gs;
const oldLevels = new Map();
for (const match of levelText.matchAll(rowRegex)) {
  const id = Number(match[1]);
  const json = JSON.parse(match[2].replaceAll("''", "'"));
  oldLevels.set(id, { id, map: json, difficulty: Number(match[3]), status: Number(match[4]), created: match[5] });
}
if (oldLevels.size !== 20) throw new Error(`expected 20 levels, got ${oldLevels.size}`);

const bossMaps = {
  6: {
    level_name: 'Сердце леса',
    biome: 'forest',
    description: 'Лесной босс Древень запер дверь. Собери настоящий ключ среди фальшивок, выстрели ракетой и выйди. Босс хитрый: после находки ключа он переставит выход.',
    hint: 'Ключи: один настоящий и четыре фальшивки. Собери настоящий, встань на линию с боссом и запусти ракету: robot.attack(5). Перезарядка - 2 действия, их можно потратить на повороты. Настоящий ключ лежит на C3, босс стоит на H8.',
    boss: {
      name: 'Древень',
      title: 'Хранитель леса',
      avatar: 'forest',
      hp: 3,
      player_hp: 3,
      attack_range: 6,
      cooldown: 2,
      fake_key_damage: 1,
      ability: 'Путает тропы: после находки настоящего ключа меняет выход местами',
      intro: [
        'Я Древень, хранитель этого леса.',
        'Ты робот? Забавно. Давно ко мне не заходили гости.',
        'Дверь заперта. Открою её только тому, кто победит меня в честном бою.',
        'Смотри: я разбросал по поляне пять ключей. Настоящий только один.',
        'Собери его, не трогай фальшивки и выстрели в меня ракетой. Начнём!',
      ],
      key_line: 'Настоящий ключ у тебя. Но дверь откроется только после боя!',
      fake_key_line: 'Фальшивка! Минус одна жизнь. Внимательнее.',
      hit_line: 'Метко! Но я ещё держусь.',
      defeat_line: 'Ха! Ты сильнее, чем кажешься. Дверь открыта - я переставил её наверх, не сердись.',
      player_defeat_line: 'Ты потерял все жизни. Лес начинает бой заново!',
    },
    alternate_exit: 'O1',
    rocks: ['B3','D5','F3','G11','J3','K6','L10','M4','N12','E13','J13','K11','B12','B9','N6','F12','H12'],
    keys: [['C3', false], ['E5', true], ['J4', true], ['M10', true], ['D13', true]],
    coins: ['F1','H1','K15','N11'],
    bossType: 'golem',
  },
  12: {
    level_name: 'Пески под солнцем',
    biome: 'desert',
    description: 'Скорпион-хан вызывает робота на бой. На карте пять ключей, но четыре фальшивки отнимают по две жизни. Найди настоящий ключ и пробей панцирь ракетой.',
    hint: 'Настоящий ключ лежит на C3. Фальшивки отнимают 2 HP. Встань на линию с боссом H8 и стреляй: robot.attack(5). Перезарядка - 2 действия.',
    boss: {
      name: 'Скорпион-хан',
      title: 'Песчаный владыка',
      avatar: 'desert',
      hp: 4,
      player_hp: 3,
      attack_range: 6,
      cooldown: 2,
      fake_key_damage: 2,
      ability: 'Песчаная буря: фальшивые ключи отнимают 2 жизни',
      intro: [
        'Я Скорпион-хан, гроза этих песков.',
        'Мой панцирь не пробить обычной атакой. Сначала найди настоящий ключ.',
        'Ключей пять, но четыре из них - песчаные обманки. Каждая отнимет две жизни.',
        'Собери настоящий ключ, прицелься и запусти ракету. Посмотрим, кто сильнее.',
      ],
      key_line: 'Настоящий ключ? Неплохо. Но дверь всё ещё моя.',
      fake_key_line: 'Обманка! Песчаная буря выпивает две жизни.',
      hit_line: 'Ты попал?! Песок не защитил меня.',
      defeat_line: 'Достойный выстрел. Забирай выход, путник.',
      player_defeat_line: 'Пески поглотили тебя. Начинаем заново!',
    },
    rocks: ['B4','D3','F6','G3','J6','K3','L6','M10','N4','B10','E11','H12','K12','B12','F10','J12','M13'],
    keys: [['C3', false], ['E5', true], ['J4', true], ['M12', true], ['D13', true]],
    coins: ['F1','H1','K15','N11'],
    bossType: 'scorpion',
  },
  18: {
    level_name: 'Трон вечной зимы',
    biome: 'snow',
    description: 'Ледяная королева заморозила дверь. Настоящий ключ один, остальные - ледяные ловушки. Перезарядка ракеты длится дольше обычного.',
    hint: 'Настоящий ключ на C3, босс на H8. Между выстрелами проходят 3 действия: потрать их на повороты. Стреляй: robot.attack(5).',
    boss: {
      name: 'Ледяная королева',
      title: 'Хозяйка вечной зимы',
      avatar: 'snow',
      hp: 3,
      player_hp: 3,
      attack_range: 6,
      cooldown: 3,
      fake_key_damage: 1,
      ability: 'Вечная мерзлота: перезарядка ракеты дольше - 3 действия',
      intro: [
        'Я Ледяная королева. Здесь всё замерзает, даже время.',
        'Пять ключей лежат на снегу. Настоящий один, остальные - ловушки.',
        'Мои чары замедляют перезарядку. Три действия между выстрелами.',
        'Найди ключ, выжди перезарядку и стреляй. Докажи, что не замёрз.',
      ],
      key_line: 'Ключ у тебя. Лёд треснул, но дверь ещё заперта.',
      fake_key_line: 'Ловушка! Мороз отнимает жизнь.',
      hit_line: 'Трещина в моей броне! Ещё выстрел.',
      defeat_line: 'Ты растопил мой трон. Проходи, герой.',
      player_defeat_line: 'Холод победил. Бой начинается с начала.',
    },
    rocks: ['B3','D6','F4','G10','J4','K7','L11','M3','N13','E9','H11','K13','B11','F13','J10','M11','N5'],
    keys: [['C3', false], ['E5', true], ['J6', true], ['M10', true], ['D13', true]],
    coins: ['F1','H1','K15','N11'],
    bossType: 'snowman',
  },
  24: {
    level_name: 'Сердце вулкана',
    biome: 'volcano',
    description: 'Магмовый титан поднялся из жерла. Его броня выдержит пять ракет. Найди настоящий ключ среди обманок и не подходи к боссу вплотную.',
    hint: 'Настоящий ключ на C3, босс на H8. У босса 5 HP, дальность ракеты - до 7 клеток. Между выстрелами - 2 действия. Стреляй: robot.attack(5).',
    boss: {
      name: 'Магмовый титан',
      title: 'Сердце вулкана',
      avatar: 'volcano',
      hp: 5,
      player_hp: 3,
      attack_range: 7,
      cooldown: 2,
      fake_key_damage: 1,
      ability: 'Лавовый панцирь: у босса 5 жизней',
      intro: [
        'Я Магмовый титан, сердце этого вулкана.',
        'Моя броня крепка: пять попаданий, не меньше.',
        'Пять ключей спрятаны среди камней. Настоящий только один.',
        'Найди его, перезаряди ракету и стреляй. Только не подходи слишком близко.',
      ],
      key_line: 'Ключ найден. Но дверь откроется лишь после боя.',
      fake_key_line: 'Обманка! Лава обжигает - минус жизнь.',
      hit_line: 'Искры летят! Но я ещё стою.',
      defeat_line: 'Моя магма остыла. Выход открыт.',
      player_defeat_line: 'Лава забрала тебя. Начнём заново!',
    },
    rocks: ['B5','D4','F5','G4','J5','K4','L9','M5','N10','E12','H13','K10','B13','F11','J11','M12','N7'],
    keys: [['C3', false], ['E5', true], ['J4', true], ['M10', true], ['D13', true]],
    coins: ['F1','H1','K15','N11'],
    bossType: 'golem',
  },
};

function makeBossMap(id, spec) {
  return {
    version: 3,
    level_name: spec.level_name,
    description: spec.description,
    hint: spec.hint,
    biome: spec.biome,
    width: 15,
    height: 15,
    entrance: 'A1',
    entrance_direction: 'right',
    exit: 'O15',
    ...(spec.alternate_exit ? { alternate_exit: spec.alternate_exit } : {}),
    rocks: spec.rocks,
    walls: [],
    terrain: {},
    coins: spec.coins.map((position, index) => ({ id: index + 1, position })),
    keys: spec.keys.map(([position, fake], index) => ({ id: index + 1, position, fake })),
    required_key_position: 'C3',
    enemies: [{
      id: 1,
      type: spec.bossType,
      position: 'H8',
      patrol: ['H8'],
      move_every: 3,
      boss: true,
      hp: spec.boss.hp,
    }],
    boss: spec.boss,
    three_star_runs: 6,
  };
}

const plan = [
  { newId: 1, oldId: 1, biome: 'forest' },
  { newId: 2, oldId: 2, biome: 'forest' },
  { newId: 3, oldId: 3, biome: 'forest' },
  { newId: 4, oldId: 4, biome: 'forest' },
  { newId: 5, oldId: 11, biome: 'forest' },
  { newId: 6, boss: 6 },
  { newId: 7, oldId: 8, biome: 'desert' },
  { newId: 8, oldId: 14, biome: 'desert' },
  { newId: 9, oldId: 19, biome: 'desert' },
  {
    newId: 10, oldId: 7, biome: 'desert',
    level_name: 'Развалины каравана',
    description: 'Занесённые песком руины каравана. Каменные глыбы образуют лабиринт, а голем охраняет проход.',
    hint: 'Планируй маршрут по каменным глыбам. Понадобится своя функция: один раз описал - много раз вызвал.',
  },
  {
    newId: 11, oldId: 15, biome: 'desert',
    level_name: 'Забытые галереи',
    description: 'Три галереи древнего города соединены узкими проходами. В первом проходе стоит голем, во втором кружит стервятник.',
    hint: 'Иди вниз до дальнего прохода, через зал поднимайся наверх и переходи в следующий зал. Голема в проходе снимай атакой.',
  },
  { newId: 12, boss: 12 },
  { newId: 13, oldId: 5, biome: 'snow' },
  { newId: 14, oldId: 12, biome: 'snow' },
  { newId: 15, oldId: 17, biome: 'snow' },
  { newId: 16, oldId: 6, biome: 'snow' },
  {
    newId: 17, oldId: 18, biome: 'snow',
    level_name: 'Занесённый храм',
    description: 'Снежный храм с запертым залом в центре. Ключ лежит внутри, а вход охраняют снежные слизни.',
  },
  { newId: 18, boss: 18 },
  {
    newId: 19, oldId: 10, biome: 'volcano',
    level_name: 'Кратер кузнеца',
    description: 'В кратере остывают каменные големы. Пройди между ними к ключу и выходу.',
    hint: 'Големы патрулируют проходы. Атакуй вплотную или обходи их стороной.',
  },
  { newId: 20, oldId: 16, biome: 'volcano' },
  {
    newId: 21, oldId: 9, biome: 'volcano',
    level_name: 'Лавовая топь',
    description: 'Застывшие лавовые потоки замедляют робота. Обязательный ключ спрятан в глубине, а жерло кишит слизнями.',
  },
  {
    newId: 22, oldId: 13, biome: 'volcano',
    level_name: 'Пепельная трясина',
    description: 'Пепел затягивает шаги, а в узком проходе дежурит слизень. Без атаки дальше не пройти.',
  },
  {
    newId: 23, oldId: 20, biome: 'volcano',
    level_name: 'Обсидиановый каньон',
    description: 'Стеклянные стены каньона ведут к выходу. Големы дежурят у каждого разрыва.',
    hint: 'Войди в зал через верхний разрыв, а выйди через боковой. Атакуй голема до входа.',
  },
  { newId: 24, boss: 24 },
];

const newLevels = [];
for (const item of plan) {
  if (item.boss) {
    newLevels.push({ id: item.newId, map: makeBossMap(item.newId, bossMaps[item.boss]), difficulty: item.newId === 24 ? 4 : 4, status: 1 });
    continue;
  }

  const sourceLevel = oldLevels.get(item.oldId);
  if (!sourceLevel) throw new Error(`old level ${item.oldId} not found`);
  const map = structuredClone(sourceLevel.map);
  map.biome = item.biome;
  map.enemies = (map.enemies ?? []).filter((enemy) => !enemy.boss);
  if (item.level_name) map.level_name = item.level_name;
  if (item.description) map.description = item.description;
  if (item.hint) map.hint = item.hint;
  if (map.hint?.includes('босс') || map.hint?.includes('щит')) {
    map.hint = 'Найди ключ, победи стражей и доберись до выхода.';
  }
  newLevels.push({ id: item.newId, map, difficulty: sourceLevel.difficulty, status: sourceLevel.status });
}

function validate(level) {
  const m = level.map;
  const errors = [];
  const inBounds = (x, y) => x >= 0 && y >= 0 && x < m.width && y < m.height;
  const parse = (pos) => ({ x: pos.charCodeAt(0) - 65, y: Number(pos.slice(1)) - 1 });
  const rocks = new Set(m.rocks ?? []);
  const coins = new Set((m.coins ?? []).map((c) => c.position));
  const keys = new Set((m.keys ?? []).map((k) => k.position));
  const entrance = parse(m.entrance);
  const exit = parse(m.exit);
  if (!inBounds(entrance.x, entrance.y)) errors.push('entrance out of bounds');
  if (!inBounds(exit.x, exit.y)) errors.push('exit out of bounds');
  if (rocks.has(m.entrance)) errors.push('rock on entrance');
  if (rocks.has(m.exit)) errors.push('rock on exit');
  for (const pos of rocks) {
    const p = parse(pos);
    if (!inBounds(p.x, p.y)) errors.push(`rock out of bounds: ${pos}`);
  }
  for (const pos of [...coins, ...keys]) {
    if (rocks.has(pos)) errors.push(`item on rock: ${pos}`);
  }
  if (m.required_key_position && !keys.has(m.required_key_position)) errors.push('required key missing from keys');
  if (m.boss) {
    const bossPos = m.enemies.find((e) => e.boss)?.patrol?.[0];
    if (!bossPos) errors.push('boss enemy missing');
    if (bossPos && rocks.has(bossPos)) errors.push('boss on rock');
    const realKeys = (m.keys ?? []).filter((k) => !k.fake);
    if (realKeys.length !== 1) errors.push(`expected 1 real key, got ${realKeys.length}`);
    if ((m.keys ?? []).filter((k) => k.fake).length < 1) errors.push('no fake keys');
    for (let x = 2; x <= 7; x++) {
      const pos = `${String.fromCharCode(65 + x)}8`;
      if (rocks.has(pos)) errors.push(`firing row blocked at ${pos}`);
    }
  }
  return errors;
}

for (const level of newLevels) {
  const errors = validate(level);
  if (errors.length) throw new Error(`level ${level.id}: ${errors.join('; ')}`);
}

const difficultyById = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 3, 7: 4, 8: 3, 9: 4, 10: 3, 11: 3, 12: 4, 13: 2, 14: 2, 15: 3, 16: 3, 17: 4, 18: 4, 19: 4, 20: 3, 21: 4, 22: 3, 23: 4, 24: 4 };
for (const level of newLevels) level.difficulty = difficultyById[level.id];

const sqlEscape = (json) => JSON.stringify(json).replace(/'/g, "''");
const levelRows = newLevels
  .map((level) => `(${level.id},'${sqlEscape(level.map)}',${level.difficulty},${level.status},'2026-11-02 12:00:00')`)
  .join(',\n');

const commandRows = `INSERT INTO \`command\` VALUES 
(1,'move','robot.move()','Шаг вперёд на одну клетку. Если впереди стена или препятствие - ошибка.'),
(2,'turn_left','robot.turn_left()','Повернуть налево на 90 градусов.'),
(3,'turn_right','robot.turn_right()','Повернуть направо на 90 градусов.'),
(6,'attack','robot.attack()','Атаковать врага прямо перед роботом.'),
(8,'for','for i in range(n):','Цикл for: повторить блок n раз или пройти по списку.'),
(10,'def','def имя():','Определить функцию - многоразовый блок кода.'),
(11,'print','print(...)','Печатает текст или значение в консоль под кодом - удобно проверять переменные и ход программы.'),
(12,'attack_range','robot.attack(x)','Запустить ракету вперёд на x клеток. Каждая ракета снимает 1 HP босса, между выстрелами нужна перезарядка.');`;

const allowed = new Map();
for (let level = 1; level <= 24; level++) {
  if (level === 1) allowed.set(level, [1, 11]);
  else if (level === 2) allowed.set(level, [1, 2, 3, 11]);
  else if (level === 3) allowed.set(level, [1, 2, 3, 8, 11]);
  else if (level === 4) allowed.set(level, [1, 2, 3, 8, 11]);
  else if (level === 5) allowed.set(level, [1, 2, 3, 6, 8, 11]);
  else if (level === 6) allowed.set(level, [1, 2, 3, 6, 8, 11, 12]);
  else if (level === 7) allowed.set(level, [1, 2, 3, 6, 8, 10, 11, 12]);
  else allowed.set(level, [1, 2, 3, 6, 8, 10, 11, 12]);
}

const levelCommandRows = [...allowed.entries()]
  .flatMap(([level, commands]) => commands.map((command) => `(${level},${command})`))
  .join(',\n');

const commandBlockStart = source.indexOf('INSERT INTO `command` VALUES ');
const commandBlockEnd = source.indexOf(';\n\nDROP TABLE IF EXISTS `difficulty`', commandBlockStart);
if (commandBlockStart < 0 || commandBlockEnd < 0) throw new Error('command block not found');

const levelCommandStart = source.indexOf('INSERT INTO `level_command` VALUES ');
const levelCommandEnd = source.indexOf(';\n\nDROP TABLE IF EXISTS `level_status`', levelCommandStart);
if (levelCommandStart < 0 || levelCommandEnd < 0) throw new Error('level_command block not found');

let updated = source;
updated = updated.slice(0, levelCommandStart) + `INSERT INTO \`level_command\` VALUES \n${levelCommandRows}` + updated.slice(levelCommandEnd);
updated = updated.slice(0, levelBlock.start + levelStart.length) + `\n${levelRows}` + updated.slice(levelBlock.end);
updated = updated.slice(0, commandBlockStart) + commandRows + updated.slice(commandBlockEnd);
updated = updated.replace('ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;', 'ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
updated = updated.replace('ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;', 'ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');

for (const target of SEED_PATHS) fs.writeFileSync(target, updated, 'utf8');

const commandBody = commandRows.split('VALUES ')[1].replace(/;\s*$/, '');
const applyLines = [
  'SET FOREIGN_KEY_CHECKS = 0;',
  `INSERT INTO \`command\` VALUES ${commandBody} ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`syntax\`=VALUES(\`syntax\`), \`description\`=VALUES(\`description\`);`,
  'DELETE FROM `level_command` WHERE `level_id` BETWEEN 1 AND 24;',
  `INSERT INTO \`level\` (\`level_id\`,\`map_data\`,\`difficulty_id\`,\`level_status_id\`,\`created\`) VALUES \n${levelRows}\nON DUPLICATE KEY UPDATE \`map_data\`=VALUES(\`map_data\`), \`difficulty_id\`=VALUES(\`difficulty_id\`), \`level_status_id\`=VALUES(\`level_status_id\`), \`created\`=VALUES(\`created\`);`,
  `INSERT INTO \`level_command\` VALUES \n${levelCommandRows};`,
  'ALTER TABLE `level` AUTO_INCREMENT = 25;',
  'ALTER TABLE `command` AUTO_INCREMENT = 13;',
  'SET FOREIGN_KEY_CHECKS = 1;',
];
fs.writeFileSync(path.join(ROOT, '.tmp_boss/apply.sql'), applyLines.join('\n'), 'utf8');

fs.writeFileSync(path.join(ROOT, '.tmp_boss/levels.json'), JSON.stringify(newLevels.map((level) => ({ id: level.id, map: level.map })), null, 2), 'utf8');

console.log(`levels=${newLevels.length} boss=${newLevels.filter((l) => l.map.boss).length}`);
console.log('ids=' + newLevels.map((l) => l.id).join(','));
console.log('biomes=' + newLevels.map((l) => l.map.biome).join(','));
console.log('commands=' + [...allowed.entries()].map(([k, v]) => `${k}:${v.length}`).join(' '));
