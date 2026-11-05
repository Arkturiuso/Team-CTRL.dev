import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'C:/Team-CTRL.dev';
const sql = fs.readFileSync(path.join(ROOT, 'ROBOCODEDBFINAL.sql'), 'utf8');

const levelMatch = sql.match(/INSERT INTO `level` VALUES ([\s\S]*?);\n\nDROP TABLE IF EXISTS `level_command`/);
if (!levelMatch) throw new Error('level block missing');
const rows = [...levelMatch[1].matchAll(/\((\d+),'(\{.*?\})',(\d+),(\d+),'([^']+)'\)/gs)];
if (rows.length !== 24) throw new Error(`expected 24 rows, got ${rows.length}`);

const levelRows = rows
  .map((row) => `(${row[1]},'${row[2]}',${row[3]},${row[4]},'${row[5]}')`)
  .join(',\n');

const commandMatch = sql.match(/INSERT INTO `command` VALUES ([\s\S]*?);\n\nDROP TABLE IF EXISTS `difficulty`/);
if (!commandMatch) throw new Error('command block missing');
const commandBody = commandMatch[1].trim().replace(/;\s*$/, '');

const levelCommandMatch = sql.match(/INSERT INTO `level_command` VALUES ([\s\S]*?);\n\nDROP TABLE IF EXISTS `level_status`/);
if (!levelCommandMatch) throw new Error('level_command block missing');

const apply = [
  'SET FOREIGN_KEY_CHECKS = 0;',
  `INSERT INTO \`command\` VALUES ${commandBody} ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`syntax\`=VALUES(\`syntax\`), \`description\`=VALUES(\`description\`);`,
  'DELETE FROM `level_command` WHERE `level_id` BETWEEN 1 AND 24;',
  `INSERT INTO \`level\` (\`level_id\`,\`map_data\`,\`difficulty_id\`,\`level_status_id\`,\`created\`) VALUES \n${levelRows}\nON DUPLICATE KEY UPDATE \`map_data\`=VALUES(\`map_data\`), \`difficulty_id\`=VALUES(\`difficulty_id\`), \`level_status_id\`=VALUES(\`level_status_id\`), \`created\`=VALUES(\`created\`);`,
  `INSERT INTO \`level_command\` VALUES \n${levelCommandMatch[1].trim()};`,
  'ALTER TABLE `level` AUTO_INCREMENT = 25;',
  'ALTER TABLE `command` AUTO_INCREMENT = 13;',
  'SET FOREIGN_KEY_CHECKS = 1;',
].join('\n');

fs.writeFileSync(path.join(ROOT, '.tmp_boss/apply.sql'), apply, 'utf8');
console.log(`apply.sql rows=${rows.length}`);
