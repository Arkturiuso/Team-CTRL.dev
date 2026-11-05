import fs from 'node:fs';

const files = [
  'C:/Team-CTRL.dev/ROBOCODEDBFINAL.sql',
  'C:/Team-CTRL.dev/Server_RoboCode/ROBOCODEDBFINAL.sql',
  'C:/Team-CTRL.dev/docs/ROBOCODEDBFINAL (1).sql',
];

const bossExtra = {
  6: {
    shot_damage: 2,
    charge_line: 'Я отвечаю залпом! Уходи с клетки, иначе получишь ракету.',
    shot_line: 'Попадание! В лесу нельзя стоять на месте.',
    miss_line: 'Мимо! Ты успел отойти.',
    key_hint_line: 'Мой настоящий ключ лежит {direction} меня. Остальные ключи - ловушки.',
    ability: 'Путает тропы: после находки настоящего ключа меняет выход местами. Отвечает залпом в клетку, откуда стреляли.',
    intro_line: 'И ещё: после твоего попадания я бью по клетке, откуда стрелял. Не стой на месте!',
  },
  12: {
    shot_damage: 2,
    charge_line: 'Песчаная буря наводится на твою клетку!',
    shot_line: 'Буря накрыла тебя! Минус жизнь.',
    miss_line: 'Ветер унёс бурю в сторону - ты ушёл.',
    key_hint_line: 'Настоящий ключ зарыт {direction} меня. Песок скрыл остальные.',
    ability: 'Песчаная буря: фальшивые ключи отнимают 2 жизни. После попадания отвечает залпом в твою клетку.',
    intro_line: 'Попал в меня - и я бью туда же. Не задерживайся на клетке!',
  },
  18: {
    shot_damage: 2,
    charge_line: 'Лёд под тобой трещит - я целюсь!',
    shot_line: 'Сосулька пробила броню! Минус жизнь.',
    miss_line: 'Сосулька вонзилась в снег - ты сменил клетку.',
    key_hint_line: 'Настоящий ключ замёрз {direction} меня. Прочие - ледяные обманки.',
    ability: 'Вечная мерзлота: перезарядка ракеты дольше - 3 действия. После попадания бьёт по твоей клетке.',
    intro_line: 'Я отвечаю залпом в клетку, откуда ты стрелял. Уходи сразу.',
  },
  24: {
    shot_damage: 1,
    charge_line: 'Лава наводится на твою клетку!',
    shot_line: 'Лавовый залп попал! Минус жизнь.',
    miss_line: 'Лава прожгла пол там, где ты стоял. Ушёл.',
    key_hint_line: 'Настоящий ключ раскалён {direction} меня. Остальные - пепел.',
    ability: 'Лавовый панцирь: у босса 5 жизней. После попадания отвечает залпом в твою клетку.',
    intro_line: 'Попадание по мне - и я бью в ответ по твоей клетке. Успей уйти!',
  },
};

for (const file of files) {
  let sql = fs.readFileSync(file, 'utf8');
  const blockMatch = sql.match(/INSERT INTO `level` VALUES ([\s\S]*?);\n\nDROP TABLE IF EXISTS `level_command`/);
  if (!blockMatch) throw new Error(`level block missing in ${file}`);

  let block = blockMatch[1];
  const rowRegex = /\((\d+),'(\{.*?\})',(\d+),(\d+),'([^']+)'\)/gs;

  for (const row of block.matchAll(rowRegex)) {
    const levelId = Number(row[1]);
    const extra = bossExtra[levelId];
    if (!extra) continue;

    const map = JSON.parse(row[2].replaceAll("''", "'"));
    if (!map.boss) throw new Error(`level ${levelId} has no boss block`);

    Object.assign(map.boss, {
      shot_damage: extra.shot_damage,
      charge_line: extra.charge_line,
      shot_line: extra.shot_line,
      miss_line: extra.miss_line,
      key_hint_line: extra.key_hint_line,
      ability: extra.ability,
    });

    const intro = Array.isArray(map.boss.intro) ? map.boss.intro : [];
    if (intro[intro.length - 1] !== extra.intro_line) intro.push(extra.intro_line);
    map.boss.intro = intro;

    const json = JSON.stringify(map).replaceAll("'", "''");
    const rebuilt = `(${row[1]},'${json}',${row[3]},${row[4]},'${row[5]}')`;
    block = block.replace(row[0], rebuilt);
  }

  sql = sql.replace(blockMatch[1], block);
  fs.writeFileSync(file, sql, 'utf8');
  console.log(`updated ${file}`);
}
