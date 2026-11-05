import fs from 'node:fs';

const sql = fs.readFileSync('ROBOCODEDBFINAL.sql', 'utf8');
const levels = [];

for (const row of sql.matchAll(/\((\d+),'(\{.*?\})',(\d+),(\d+),'([^']+)'\)/gs)) {
  const id = Number(row[1]);
  if (![6, 12, 18, 24].includes(id)) continue;
  const data = JSON.parse(row[2]);
  if (!data.boss) throw new Error(`level ${id} has no boss`);
  levels.push({ id, data });
}

const lines = ['SET NAMES utf8mb4;'];
for (const { id, data } of levels) {
  const json = JSON.stringify(data).replace(/'/g, "''");
  lines.push(`UPDATE \`level\` SET \`map_data\` = '${json}' WHERE \`level_id\` = ${id};`);
}

fs.writeFileSync('.tmp_boss/apply-boss-map.sql', lines.join('\n') + '\n', 'utf8');
console.log('levels', levels.map((l) => `${l.id}:${l.data.level_name}`).join(', '));
