import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
await mkdir('dist/server', { recursive:true });
const html = await readFile('index.html','utf8');
const icons={};
for(const file of await readdir('icons')){
  if(file.endsWith('.webp')) icons['/icons/'+file]=(await readFile('icons/'+file)).toString('base64');
}
await writeFile('dist/server/index.js',(await readFile('worker.js','utf8')).replace("import page from './page.js';", ()=>'const page = '+JSON.stringify(html)+';').replace("import icons from './game-icons.js';",()=> 'const icons = '+JSON.stringify(icons)+';'));

