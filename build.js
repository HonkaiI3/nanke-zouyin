import { mkdir, readFile, writeFile } from 'node:fs/promises';
await mkdir('dist/server', { recursive:true });
const html = await readFile('index.html','utf8');
await writeFile('dist/server/index.js',(await readFile('worker.js','utf8')).replace("import page from './page.js';", ()=>'const page = '+JSON.stringify(html)+';'));

