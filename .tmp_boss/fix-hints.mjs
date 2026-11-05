import fs from 'node:fs';

const hints = {
  6: 'Ключи: один настоящий и четыре фальшивки, каждый запуск они лежат по-новому. Босс подскажет, в какой стороне настоящий. Собери его, встань на линию с боссом и запусти ракету: robot.attack(5). После попадания босс бьёт по твоей клетке - уходи.',
  12: 'Настоящий ключ подскажет босс. Фальшивки отнимают 2 HP. Встань на линию с боссом и стреляй: robot.attack(5). После попадания уходи с клетки, иначе босс ответит залпом.',
  18: 'Настоящий ключ подскажет босс. Босс на H8. Между выстрелами - 3 действия: перезарядка и уход с клетки. Стреляй: robot.attack(5).',
  24: 'Настоящий ключ подскажет босс. У босса 5 HP, дальность ракеты - до 7 клеток. После попадания босс бьёт по твоей клетке - уходи. Стреляй: robot.attack(5).',
};

const files = [
  'ROBOCODEDBFINAL.sql',
  'Server_RoboCode/ROBOCODEDBFINAL.sql',
  'docs/ROBOCODEDBFINAL (1).sql',
];

for (const file of files) {
  let sql = fs.readFileSync(file, 'utf8');
  let changed = 0;
  sql = sql.replace(/\((\d+),'(\{.*?\})',(\d+),(\d+),'([^']+)'\)/gs, (row, id, json, diff, status, created) => {
    if (!hints[id] || !json.includes('"boss"')) return row;
    const data = JSON.parse(json);
    data.hint = hints[id];
    changed++;
    return `(${id},'${JSON.stringify(data)}',${diff},${status},'${created}')`;
  });
  fs.writeFileSync(file, sql, 'utf8');
  console.log(file, 'updated', changed);
}

const apply = Object.entries(hints)
  .map(([id, hint]) => `UPDATE \`level\` SET \`map_data\` = JSON_SET(\`map_data\`, '$.hint', ${JSON.stringify(hint)}) WHERE \`level_id\` = ${id};`)
  .join('\n');
fs.writeFileSync('.tmp_boss/apply-hints.sql', apply + '\n', 'utf8');
console.log('sql written, rows', Object.keys(hints).length);
