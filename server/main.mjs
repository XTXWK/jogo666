import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {WebSocketServer} from 'ws';
import {Simulation} from '../shared/simulation.js';
import {BALANCE as B,MODES} from '../shared/content.js';
const root=resolve(fileURLToPath(new URL('../dist/client',import.meta.url))),rooms=new Map(),sessions=new Map(),ips=new Map();let uid=0;
const server=http.createServer(async(req,res)=>{
 if(req.url==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,rooms:rooms.size,players:[...rooms.values()].reduce((n,r)=>n+r.sim.players.length,0)}));return}
 try{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name==='/')name='/index.html';const path=resolve(root,'.'+name);if(!path.startsWith(root+sep)){res.writeHead(403).end();return}const bytes=await readFile(path);const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json'}[extname(path)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type,'X-Content-Type-Options':'nosniff','Cache-Control':name==='/index.html'?'no-cache':'public,max-age=3600'});res.end(bytes)}catch{res.writeHead(404,{'Content-Type':'text/plain'}).end('Arquivo não encontrado. Execute npm run build.')}});
const wss=new WebSocketServer({noServer:true,maxPayload:2048,perMessageDeflate:false});
server.on('upgrade',(req,socket,head)=>{if(req.url!=='/ws'){socket.destroy();return}const allowed=(process.env.ALLOWED_ORIGINS||'').split(',').filter(Boolean);if(allowed.length&&!allowed.includes(req.headers.origin)){socket.destroy();return}const ip=req.socket.remoteAddress;if((ips.get(ip)||0)>=32){socket.destroy();return}wss.handleUpgrade(req,socket,head,ws=>{ws.ip=ip;ips.set(ip,(ips.get(ip)||0)+1);wss.emit('connection',ws,req)})});
function send(ws,data){if(ws?.readyState===1&&ws.bufferedAmount<1024*1024)ws.send(JSON.stringify(data))}
function match(mode){for(const r of rooms.values())if(r.mode===mode&&!r.sim.ended&&r.sim.players.length<MODES[mode].cap)return r;if(rooms.size>=24)return null;const id='r'+(++uid),r={id,mode,sim:new Simulation({mode,solo:false,seed:Date.now()>>>0}),ticks:0,emptyAt:0};rooms.set(id,r);return r}
function broadcast(r,data){for(const s of sessions.values())if(s.room===r)send(s.ws,data)}
wss.on('connection',ws=>{ws.budget=80;ws.refill=Date.now();ws.lastInput=0;ws.strikes=0;ws.alive=true;const joinTimeout=setTimeout(()=>{if(!ws.session)ws.close(1008,'Join required')},10000);ws.on('pong',()=>ws.alive=true);
 ws.on('message',raw=>{const t=Date.now();ws.budget=Math.min(80,ws.budget+(t-ws.refill)*.055);ws.refill=t;if(--ws.budget<0){if(++ws.strikes>20)ws.close(1008,'Rate limit');return}let m;try{m=JSON.parse(raw.toString())}catch{return}if(!m||typeof m!=='object'||Array.isArray(m))return;
 if(m.t==='join'){if(ws.session)return;if(!Object.hasOwn(MODES,m.mode)||typeof m.nick!=='string')return;const old=typeof m.token==='string'?sessions.get(m.token):null;if(old&&old.expires>Date.now()&&old.room.mode===m.mode&&!old.room.sim.ended){old.ws?.close(1000,'Reconnected elsewhere');old.ws=ws;old.expires=Infinity;ws.session=old}else{const room=match(m.mode);if(!room){send(ws,{t:'error',message:'Todas as salas estão cheias. Tente novamente em instantes.'});ws.close();return}const token=randomBytes(24).toString('hex');const nick=m.nick.normalize('NFKC').replace(/[^\p{L}\p{N} _-]/gu,'').slice(0,16)||'Lenhador';const p=room.sim.addPlayer('p'+(++uid),nick);const s={token,room,p,ws,expires:Infinity};sessions.set(token,s);ws.session=s}clearTimeout(joinTimeout);send(ws,{t:'joined',id:ws.session.p.id,token:ws.session.token,room:ws.session.room.id});send(ws,{t:'snapshot',state:ws.session.room.sim.snapshot()});return}
 const s=ws.session;if(!s||s.ws!==ws||s.room.sim.ended)return;const sim=s.room.sim,p=s.p;
 if(m.t==='input'){if(t-ws.lastInput<20)return;ws.lastInput=t;if(!Number.isSafeInteger(m.seq)||m.seq<0||m.seq<=(p.input.seq||0))return;sim.setInput(p,m)}
 else if(m.t==='use'&&typeof m.key==='string')sim.use(p,m.key);
 else if(m.t==='choose'&&typeof m.card==='string')sim.choose(p,m.card,m.slot);
 else if(m.t==='reroll')sim.reroll(p);
 });
 ws.on('close',()=>{clearTimeout(joinTimeout);ips.set(ws.ip,Math.max(0,(ips.get(ws.ip)||1)-1));const s=ws.session;if(s&&s.ws===ws){s.ws=null;s.expires=Date.now()+20000;s.p.input={x:0,y:0,aim:s.p.aim,seq:s.p.ack};}});ws.on('error',()=>{});
});
setInterval(()=>{const t=Date.now();for(const [token,s]of sessions)if(s.expires<t){s.room.sim.removePlayer(s.p.id);sessions.delete(token)}for(const [key,r]of rooms){if(!r.sim.players.length){r.emptyAt||=t;if(t-r.emptyAt>30000)rooms.delete(key);continue}r.emptyAt=0;for(const s of sessions.values())if(s.room===r&&s.ws&&t-s.ws.lastInput>300)s.p.input={...s.p.input,x:0,y:0};r.sim.step(1/B.tick);const events=r.sim.drain();if(events.length)broadcast(r,{t:'events',events});if(++r.ticks%2===0)broadcast(r,{t:'snapshot',state:r.sim.snapshot()})}},1000/B.tick);
setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue}ws.alive=false;ws.ping()}},15000).unref();
const port=Number(process.env.PORT)||8787;server.listen(port,'0.0.0.0',()=>console.log(`Raiz Bruta Arena: http://localhost:${port} | WebSocket /ws`));
