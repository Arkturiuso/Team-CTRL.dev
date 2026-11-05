import fs from 'node:fs';

const FILES = [
  'C:/Team-CTRL.dev/ROBOCODEDBFINAL.sql',
  'C:/Team-CTRL.dev/Server_RoboCode/ROBOCODEDBFINAL.sql',
  'C:/Team-CTRL.dev/docs/ROBOCODEDBFINAL (1).sql'
];

const CONFIG = {
  6: {
    player_hp: 4,
    ability: 'Путает тропы: после находки ключа меняет выход местами. Уходит с пробитой клетки по земле, а лес роняет на робота дерево.',
    ai: { move_every: 2, flee_after_hit: true, rage_at_hp: 1, min_distance: 2 },
    hazard: { kind: 'tree', every: 6, fuse: 3, damage: 1, linger: 2 },
    relocate_line: 'Пробил? Тогда лес укажет мне новую поляну - догоняй.',
    step_line: 'Корни уносят меня между деревьями.',
    rage_line: 'Это моя последняя жизнь! Теперь шагаю на каждое твоё действие, а деревья падают чаще.',
    hazard_line: 'Крона затрещала! Дерево падает на клетку {cell} - уходи.',
    intro_add: [
      'Попал в меня - и я ухожу с простреленной поляны. Ищи новую линию.',
      'Следи за кронами: дерево падает не сразу, успеешь соскочить с клетки.'
    ],
    description: 'Лесной босс Древень запер дверь. Собери настоящий ключ среди фальшивок и пробей боссу ракету. Он не ждёт на месте: уходит с пробитой клетки по земле, а лес сверху роняет деревья.',
    hint: 'Ключи каждый запуск лежат по-новому, босс подскажет сторону. Встань на линию и стреляй: robot.attack(5). После попадания Древень уходит - ищи его снова. От залпа и от падающего дерева уходи с клетки: телеграф висит 3 действия.'
  },
  12: {
    player_hp: 4,
    ability: 'Песчаная буря: фальшивые ключи отнимают 2 жизни. Уходит за дюну после попадания, а буря накрывает две клетки рядом.',
    ai: { move_every: 3, flee_after_hit: true, rage_at_hp: 2, min_distance: 2 },
    hazard: { kind: 'sandstorm', every: 7, fuse: 4, damage: 1, linger: 2 },
    relocate_line: 'Панцирь треснул. Песок уносит меня за дюну.',
    step_line: 'Лапы перебирают раскалённый песок.',
    rage_line: 'Жажда крови! Двигаюсь быстрее, а буря накрывает шире.',
    hazard_line: 'Небо желтеет: буря идёт на клетку {cell} и на соседнюю справа.',
    intro_add: [
      'Попал в панцирь - я ухожу в песок. Догоняй и целись заново.',
      'Буря приходит не сразу: уходи с намеченных клеток, две клетки в ряд.'
    ],
    description: 'Скорпион-хан вызывает робота на бой. Настоящий ключ один, четыре обманки отнимают по две жизни. Хан уходит с пробитой клетки, а песчаная буря накрывает сразу две клетки.',
    hint: 'Босс подскажет, где настоящий ключ; фальшивки отнимают 2 HP. Встань на линию и стреляй: robot.attack(5). После попадания хан уходит за дюну - ищи новую линию. Буря накрывает две клетки: уходи заранее, телеграф держится 4 действия.'
  },
  18: {
    player_hp: 4,
    ability: 'Вечная мерзлота: перезарядка ракеты 3 действия. Королева уходит на новый гребень, а снежная доска накрывает три клетки.',
    ai: { move_every: 2, flee_after_hit: true, rage_at_hp: 1, min_distance: 3 },
    hazard: { kind: 'avalanche', every: 7, fuse: 4, damage: 1, linger: 3 },
    relocate_line: 'Трон слишком холоден. Ищу новый гребень - догоняй по льду.',
    step_line: 'Королева скользит по снегу.',
    rage_line: 'Метель крепчает! Иду быстрее, лавины сходят чаще.',
    hazard_line: 'Снежная шапка треснула: доска идёт на клетку {cell} и на обе соседние.',
    intro_add: [
      'Попал - и я ухожу на другой гребень. Целись заново.',
      'Лавина не мгновенна: она накрывает три клетки в ряд, уходи с линии.'
    ],
    hint: 'Настоящий ключ подскажет босс. Между выстрелами 3 действия перезарядки. После попадания королева уходит на новый гребень. Лавина накрывает три клетки: уходи заранее, телеграф держится 4 действия. Стреляй: robot.attack(5).',
    description: 'Ледяная королева заморозила дверь. Настоящий ключ один, остальные - ледяные ловушки, а перезарядка ракеты дольше обычного. Королева не стоит на месте: она уходит на новый гребень, а со склона сходит снежная доска.'
  },
 24: {
    player_hp: 5,
    ability: 'Лавовый панцирь: 5 жизней. Титан уходит с остывшей клетки, а фонтаны магмы бьют из-под ног чаще всех.',
    ai: { move_every: 2, flee_after_hit: true, rage_at_hp: 2, min_distance: 2 },
    hazard: { kind: 'lava', every: 5, fuse: 3, damage: 1, linger: 3 },
    relocate_line: 'Жерло под мной остыло - ухожу на новый выступ.',
    step_line: 'Титан тяжело переступает через камни.',
    rage_line: 'Извержение! Шагаю на каждое действие, фонтаны бьют чаще.',
    hazard_line: 'Кора под тобой трескается: фонтан магмы бьёт из клетки {cell}.',
    intro_add: [
      'Попал - и я ухожу на новый выступ. Догоняй, если сможешь.',
      'Пол под тобой дырявый: фонтан бьёт не сразу, уходи с намеченной клетки.'
    ],
    hint: 'У титана 5 HP, дальность ракеты до 7 клеток. После попадания он уходит с клетки - ищи новую линию. Фонтан магмы бьёт по твоей клетке: телеграф держится 3 действия. Стреляй: robot.attack(5).',
    description: 'Магмовый титан поднялся из жерла. Его броня выдержит пять ракет, а сам титан уходит с пробитой позиции и жжёт пол фонтанами магмы прямо под роботом.'
  }
};

const escapeSql = value => value.replace(/'/g, "''");

function patchJson(json, config) {
  const map = JSON.parse(json);
  const boss = map.boss;
  if (!boss) throw new Error('no boss block');

  boss.player_hp = config.player_hp;
  boss.ability = config.ability;
  boss.ai = config.ai;
  boss.hazard = config.hazard;
  boss.relocate_line = config.relocate_line;
  boss.step_line = config.step_line;
  boss.rage_line = config.rage_line;
  boss.hazard_line = config.hazard_line;
  boss.intro = [...boss.intro, ...config.intro_add];
  map.description = config.description;
  map.hint = config.hint;

  return JSON.stringify(map);
}

let updated = 0;
const updates = [];

for (const file of FILES) {
  if (!fs.existsSync(file)) {
    console.log(`skip (missing): ${file}`);
    continue;
  }

  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = /^\((\d+),'/.exec(line);
    if (!match || !CONFIG[match[1]]) continue;
    if (!line.includes('"boss":')) continue;

    const levelId = Number(match[1]);
    const start = line.indexOf(",'") + 2;
    const end = line.lastIndexOf("',");
    const original = line.slice(start, end);
    if (!original.startsWith('{')) continue;

    const patched = patchJson(original.replaceAll("''", "'"), CONFIG[levelId]);
    lines[i] = line.slice(0, start) + escapeSql(patched) + line.slice(end);
    updates.push({ levelId, json: patched });
    updated++;
  }

  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log(`written: ${file}`);
}

const sqlFile = 'C:/Team-CTRL.dev/.tmp_boss/boss-ai-update.sql';
const statements = [
  'SET NAMES utf8mb4;',
  'USE robocode;',
  ...updates.map(u => `UPDATE \`level\` SET \`map_data\` = '${escapeSql(u.json)}' WHERE \`level_id\` = ${u.levelId};`)
];
fs.writeFileSync(sqlFile, statements.join('\n') + '\n', 'utf8');

console.log(`levels patched: ${updated}`);
console.log(`sql file: ${sqlFile}`);
