import {createServer} from 'node:http';
import worker from './dist/server/index.js';
createServer(async (req,res)=>{
  try {
    const reply=await worker.fetch(new Request('http://localhost'+req.url,{method:req.method,headers:req.headers}));
    res.writeHead(reply.status,Object.fromEntries(reply.headers));
    res.end(Buffer.from(await reply.arrayBuffer()));
  } catch {res.writeHead(500);res.end('Server error');}
}).listen(Number(process.env.PORT || 8742),process.env.HOST || '127.0.0.1');


