import fs from 'node:fs';

const levelId = Number(process.argv[2] ?? 6);
const files = [
  'C:/Team-CTRL.dev/ROBOCODEDBFINAL.sql',
  'C:/Team-CTRL.dev/Server_RoboCode/ROBOCODEDBFINAL.sql',
  'C:/Team-CTRL.dev/docs/ROBOCODEDBFINAL (1).sql'
];

for (const file of files) {
  const line = fs.readFileSync(file, 'utf8').split('\n').find(l => l.startsWith(`(${levelId},'{`));
  const json = line.slice(line.indexOf(",'") + 2, line.lastIndexOf("',")).replaceAll("''", "'");
  const map = JSON.parse(json);
  if (file === files[0]) {
    console.log(JSON.stringify({ boss: map.boss, description: map.description, hint: map.hint }, null, 1));
  }
  console.log(`${file}\n  ai=${JSON.stringify(map.boss.ai)} hazard=${JSON.stringify(map.boss.hazard)} hp=${map.boss.player_hp} intro=${map.boss.intro.length}`);
}
