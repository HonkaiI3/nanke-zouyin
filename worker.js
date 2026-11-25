import page from './page.js';
const source='https://docs.qq.com/smartsheet/DQlV6bXRGdWhpQVBI';
let latest, inflight, failure;
async function request(url,headers={}) {
  const response=await fetch(url,{headers,redirect:'manual',signal:AbortSignal.timeout(15000)});
  if(!response.ok) throw Error('腾讯文档返回 HTTP '+response.status);
  return response;
}
function scoreValue(text) {
  const match=text.normalize('NFKC').trim().match(/^((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)([kK万]?)(?:\s*[,，、]\s*[^\d].*)?$/u);
  if(!match) return null;
  const n=Number(match[1].replaceAll(',',''))*({k:1000,K:1000,'万':10000}[match[2]]||1);
  return Number.isSafeInteger(n)?n:null;
}
async function unpack(part) {
  const bytes=Uint8Array.from(atob(part.smartsheet),ch=>ch.charCodeAt(0));
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  return (await new Response(stream).json()).flat();
}
async function load() {
  const entry=await request(source);
  const setCookies=entry.headers.getSetCookie?.() ?? entry.headers.getAll('Set-Cookie');
  const cookies=setCookies.map(s=>s.split(';')[0]).join('; ');
  const html=await entry.text();
  const links=[...html.matchAll(/href="([^"]*\/dop-api\/opendoc\?[^"]+)"/g)].map(m=>m[1].replaceAll('&amp;','&'));
  const link=links.find(s=>s.includes('tab='))||links[0];
  if(!link) throw Error('腾讯文档的数据入口已变更');
  const url=new URL(link,source);
  if(url.origin!==new URL(source).origin) throw Error('数据入口域名已变更');
  const records=new Map();
  let fields;
  for(let start=0;;){
    url.searchParams.set('startrow',start);
    url.searchParams.set('endrow',start+60);
    const response=await request(url,{referer:source,cookie:cookies});
    const raw=await response.text();
    const payload=JSON.parse(raw.slice(raw.indexOf('(')+1,raw.lastIndexOf(')')));
    const part=payload.clientVars.collab_client_vars.initialAttributedText.text[0];
    for(const mutation of await unpack(part)){
      if(mutation.t===3005) fields=mutation.c.k3.k3;
      if(mutation.t===3028) for(const [id,row] of Object.entries(mutation.c.k2.k1)) records.set(id,row.k1);
    }
    const total=Number(part.total_record_count);
    if(records.size===total) break;
    const next=Number(part.end_row_index)+1;
    if(!Number.isSafeInteger(next)||next<=start||next>=total) throw Error('未能完整读取全部提交');
    start=next;
  }
  function field(label){
    const key=Object.keys(fields||{}).find(k=>fields[k].k30?.split(/[（(]/)[0]===label);
    if(!key) throw Error('找不到原表的'+label+'列');
    return key;
  }
  const nameField=field('提交者'),scoreField=field('预选课题曲总分');
  const scores=new Map(),pending=[];
  const cell=(row,key)=>(row[key]?.k1||[]).map(v=>v.k2||'').join('').trim();
  for(const row of records.values()){
    const name=cell(row,nameField),score=scoreValue(cell(row,scoreField));
    if(!name||score===null) pending.push(name||'未填写提交者');
    else scores.set(name,Math.max(score,scores.get(name)??0));
  }
  const rows=[...scores].map(([name,score])=>({name,score})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'zh'));
  rows.forEach((row,i)=>row.rank=i&&row.score===rows[i-1].score?rows[i-1].rank:i+1);
  return {rows,pending,updated:Date.now()};
}
export default {async fetch(req){
  const path=new URL(req.url).pathname;
  if(path==='/') return new Response(page,{headers:{'content-type':'text/html; charset=utf-8'}});
  if(path!=='/api/ranking') return new Response('',{status:404});
  if(req.method==='POST' && req.headers.get('sec-fetch-site')!=='cross-site') failure=null;
  if(!failure && (!latest||Date.now()-latest.updated>=25000)){
    inflight??=load().then(data=>{latest=data}).catch(err=>{failure=err.message}).finally(()=>{inflight=null});
    await inflight;
  }
  return Response.json({data:latest,error:failure},{status:failure?503:200,headers:{'cache-control':'no-store'}});
}};



