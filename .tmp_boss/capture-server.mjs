import { createServer } from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'C:/Team-CTRL.dev/.tmp_boss/captures';
mkdirSync(dir, { recursive: true });

createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }
  const url = new URL(req.url, 'http://127.0.0.1:8791');
  if (req.method === 'GET' && url.pathname === '/ping') {
    res.end('ok');
    return;
  }
  if (req.method !== 'POST' || url.pathname !== '/save') {
    res.statusCode = 400;
    res.end('bad request');
    return;
  }
  const raw = (url.searchParams.get('name') ?? 'shot').replace(/[^a-zA-Z0-9_.-]/g, '_');
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  writeFileSync(join(dir, `${raw}.png`), body);
  res.end(`saved ${raw}.png ${body.length}`);
}).listen(8791, '127.0.0.1', () => console.log('capture server on 8791'));
