import fs from 'node:fs';

const sql = fs.readFileSync('C:/Team-CTRL.dev/ROBOCODEDBFINAL.sql', 'utf8');
const block = sql.match(/INSERT INTO `level` VALUES ([\s\S]*?);\n\nDROP TABLE IF EXISTS `level_command`/);
if (!block) throw new Error('level block missing');

const updates = [];
for (const row of block[1].matchAll(/\((\d+),'(\{.*?\})',(\d+),(\d+),'([^']+)'\)/gs)) {
  const levelId = Number(row[1]);
  if (![6, 12, 18, 24].includes(levelId)) continue;
  updates.push(`UPDATE \`level\` SET \`map_data\`='${row[2]}' WHERE \`level_id\`=${levelId};`);
}

fs.writeFileSync('C:/Team-CTRL.dev/.tmp_boss/boss-v2-apply.sql', updates.join('\n') + '\n', 'utf8');
console.log('statements', updates.length);
