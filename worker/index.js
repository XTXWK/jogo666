import {createSolo,packSimulation,unpackSimulation,replayCommands,RULESET} from '../shared/solo.js';
const json=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const cleanNick=s=>String(s||'').normalize('NFKC').replace(/[^\p{L}\p{N} _-]/gu,'').slice(0,16)||'Lenhador';
function db(env){if(!env.DB)throw Error('Ranking indisponível');return env.DB}
async function digest(s){const a=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(a)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function owner(request){const token=request.headers.get('cookie')?.match(/(?:^|;\s*)rb_guest=([a-f0-9-]{36})/)?.[1];return token?digest(token):null}
async function identity(request){const found=request.headers.get('cookie')?.match(/(?:^|;\s*)rb_guest=([a-f0-9-]{36})/)?.[1],token=found||crypto.randomUUID(),hash=await digest(token);return {hash,member:hash.slice(0,24),cookie:found?null:`rb_guest=${token}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Strict`}}
const roomName=s=>String(s||'Sala da floresta').normalize('NFKC').replace(/[^\p{L}\p{N} _-]/gu,'').slice(0,28)||'Sala da floresta';
export default {async fetch(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/'))return env.ASSETS.fetch(request);
 try{
  if(request.method==='GET'&&path==='/api/ranking'){
   const me=await owner(request),ranked=`WITH personal AS (SELECT *,ROW_NUMBER() OVER (PARTITION BY owner ORDER BY seconds DESC,kills DESC,created ASC) personal_place FROM runs WHERE rules=? AND finished=1), board AS (SELECT owner,nick,seconds,kills,level,damage,damage_taken,max_hit,build,ROW_NUMBER() OVER (ORDER BY seconds DESC,kills DESC,created ASC) position FROM personal WHERE personal_place=1)`;
   const rows=await db(env).prepare(ranked+' SELECT nick,seconds,kills,level,damage,damage_taken AS damageTaken,max_hit AS maxHit,build,position FROM board ORDER BY position LIMIT 100').bind(RULESET).all();
   const mine=me?await db(env).prepare(ranked+' SELECT nick,seconds,kills,level,damage,damage_taken AS damageTaken,max_hit AS maxHit,build,position FROM board WHERE owner=?').bind(RULESET,me).first():null;
   let profile=null;if(me)try{profile=await db(env).prepare('SELECT xp,coins,best_brutality AS bestBrutality FROM profiles WHERE owner=?').bind(me).first()}catch{}
   return json({rows:rows.results,me:mine,profile:profile||{xp:0,coins:0,bestBrutality:0},rules:RULESET});
  }
  if(request.method==='GET'&&path==='/api/rooms'){
   await db(env).prepare('DELETE FROM room_signals WHERE created < ?').bind(Date.now()-120000).run();
   const rows=await db(env).prepare('SELECT r.id,r.name,r.mode,r.private,r.max_players AS maxPlayers,r.host,COUNT(m.id) AS players FROM rooms r LEFT JOIN room_members m ON m.room_id=r.id AND m.updated>? WHERE r.updated>? GROUP BY r.id ORDER BY r.created DESC LIMIT 60').bind(Date.now()-12000,Date.now()-18000).all();
   return json({rows:rows.results.map(r=>({...r,private:!!r.private,host:undefined}))});
  }
  const signalGet=path.match(/^\/api\/rooms\/([a-f0-9-]{36})\/signals$/);
  if(request.method==='GET'&&signalGet){const who=await identity(request),after=Math.max(0,Number(url.searchParams.get('after'))||0),member=await db(env).prepare('SELECT id FROM room_members WHERE room_id=? AND member=? AND updated>?').bind(signalGet[1],who.member,Date.now()-15000).first();if(!member)return json({error:'Você não está mais nesta sala.'},404);const rows=await db(env).prepare('SELECT id,sender,payload FROM room_signals WHERE room_id=? AND recipient=? AND id>? ORDER BY id LIMIT 100').bind(signalGet[1],who.member,after).all();return json({rows:rows.results.map(r=>({...r,payload:JSON.parse(r.payload)}))});}
  if(request.method!=='POST')return json({error:'Não encontrado'},404);
  if(request.headers.get('origin')!==url.origin)return json({error:'Origem inválida'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON necessário'},415);
  if(Number(request.headers.get('content-length'))>100000)return json({error:'Pacote grande demais'},413);
  const raw=await request.text();if(raw.length>100000)return json({error:'Pacote grande demais'},413);
  let body;try{body=JSON.parse(raw)}catch{return json({error:'JSON inválido'},400)}
  if(!body||typeof body!=='object')return json({error:'Pedido inválido'},400);
  const now=Date.now();let me=await owner(request);
  if(path==='/api/rooms'){
   const who=await identity(request),id=crypto.randomUUID(),password=String(body.password||'').slice(0,40),secret=password?await digest(id+':'+password):'';
   await db(env).batch([db(env).prepare('INSERT INTO rooms (id,name,host,password,private,mode,max_players,created,updated) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,roomName(body.name),who.member,secret,password?1:0,'infinite',Math.max(2,Math.min(16,Number(body.maxPlayers)||12)),now,now),db(env).prepare('INSERT INTO room_members (id,room_id,member,nick,joined,updated) VALUES (?,?,?,?,?,?)').bind(id+':'+who.member,id,who.member,cleanNick(body.nick),now,now)]);
   return json({roomId:id,memberId:who.member,hostId:who.member,host:true,private:!!password,members:[{id:who.member,nick:cleanNick(body.nick)}]},200,who.cookie?{'Set-Cookie':who.cookie}:{});
  }
  const roomAction=path.match(/^\/api\/rooms\/([a-f0-9-]{36})\/(join|heartbeat|signal|leave)$/);
  if(roomAction){const who=await identity(request),roomId=roomAction[1],action=roomAction[2],room=await db(env).prepare('SELECT * FROM rooms WHERE id=? AND updated>?').bind(roomId,now-20000).first();if(!room)return json({error:'Sala encerrada ou host desconectado.'},404);
   if(action==='join'){const count=await db(env).prepare('SELECT COUNT(*) n FROM room_members WHERE room_id=? AND updated>?').bind(roomId,now-12000).first();if(count.n>=room.max_players)return json({error:'Sala cheia.'},409);if(room.private&&await digest(roomId+':'+String(body.password||'').slice(0,40))!==room.password)return json({error:'Senha incorreta.'},403);await db(env).prepare('INSERT OR REPLACE INTO room_members (id,room_id,member,nick,joined,updated) VALUES (?,?,?,?,COALESCE((SELECT joined FROM room_members WHERE id=?),?),?)').bind(roomId+':'+who.member,roomId,who.member,cleanNick(body.nick),roomId+':'+who.member,now,now).run();const members=await db(env).prepare('SELECT member AS id,nick FROM room_members WHERE room_id=? AND updated>? ORDER BY joined').bind(roomId,now-12000).all();await db(env).prepare('UPDATE rooms SET updated=? WHERE id=?').bind(now,roomId).run();return json({roomId,memberId:who.member,hostId:room.host,host:room.host===who.member,members:members.results},200,who.cookie?{'Set-Cookie':who.cookie}:{})}
   const membership=await db(env).prepare('SELECT id FROM room_members WHERE room_id=? AND member=?').bind(roomId,who.member).first();if(!membership)return json({error:'Entre na sala novamente.'},404);
   if(action==='signal'){const to=String(body.to||'').slice(0,24),payload=JSON.stringify(body.payload||{});if(payload.length>24000)return json({error:'Sinal grande demais.'},413);const target=await db(env).prepare('SELECT id FROM room_members WHERE room_id=? AND member=? AND updated>?').bind(roomId,to,now-15000).first();if(!target)return json({error:'Jogador desconectado.'},404);await db(env).prepare('INSERT INTO room_signals (room_id,sender,recipient,payload,created) VALUES (?,?,?,?,?)').bind(roomId,who.member,to,payload,now).run();return json({ok:true})}
   if(action==='leave'){await db(env).prepare('DELETE FROM room_members WHERE room_id=? AND member=?').bind(roomId,who.member).run()}
   else await db(env).prepare('UPDATE room_members SET updated=? WHERE room_id=? AND member=?').bind(now,roomId,who.member).run();
   const active=await db(env).prepare('SELECT member AS id,nick FROM room_members WHERE room_id=? AND updated>? ORDER BY joined').bind(roomId,now-12000).all();if(!active.results.length){await db(env).prepare('DELETE FROM rooms WHERE id=?').bind(roomId).run();return json({closed:true})}const host=active.results.some(m=>m.id===room.host)?room.host:active.results[0].id;await db(env).prepare('UPDATE rooms SET host=?,updated=? WHERE id=?').bind(host,now,roomId).run();return json({roomId,memberId:who.member,hostId:host,members:active.results,closed:false});
  }
  if(path==='/api/runs'){
   const token=me?null:crypto.randomUUID();if(token)me=await digest(token);
   const count=await db(env).prepare('SELECT COUNT(*) AS n FROM runs WHERE owner = ? AND created > ?').bind(me,now-60000).first();
   if(count.n>=6)return json({error:'Aguarde um minuto antes de iniciar outra caçada ranqueada.'},429);
   const id=crypto.randomUUID(),seed=crypto.getRandomValues(new Uint32Array(1))[0],nick=cleanNick(body.nick),sim=createSolo(seed,nick);
   await db(env).prepare('INSERT INTO runs (id, owner, nick, rules, created, updated, state) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id,me,nick,RULESET,now,now,packSimulation(sim)).run();
   const headers=token?{'Set-Cookie':`rb_guest=${token}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Strict`}:{};
   return json({id,seed,nick,rules:RULESET},200,headers);
  }
  const match=path.match(/^\/api\/runs\/([a-f0-9-]{36})$/);if(!match||!me)return json({error:'Caçada não encontrada'},404);
  const row=await db(env).prepare('SELECT * FROM runs WHERE id = ? AND owner = ?').bind(match[1],me).first();
  if(!row)return json({error:'Caçada não encontrada'},404);
  if(row.rules!==RULESET)return json({error:'O jogo foi atualizado. Inicie outra caçada para disputar o ranking.'},409);
  if(body.seq===row.seq-1)return json({seq:row.seq,finished:!!row.finished,seconds:row.seconds}); // retry after lost response
  if(!Number.isSafeInteger(body.seq)||body.seq!==row.seq||row.finished)return json({error:'Sequência de partida inválida'},409);
  if(now-row.created>86400000)return json({error:'Caçada expirada'},410);
  const sim=unpackSimulation(row.state);
  try{replayCommands(sim,body.commands)}catch{return json({error:'Partida não validada: comandos incompatíveis.'},400)}
  if(sim.time>(now-row.created)/1000+2)return json({error:'Relógio de partida inválido'},400);
  const p=sim.players[0],finished=sim.ended&&!p.alive;
  const update=db(env).prepare('UPDATE runs SET state = ?, seq = seq + 1, updated = ?, finished = ?, seconds = ?, kills = ?, level = ?, damage = ?, damage_taken = ?, max_hit = ?, build = ? WHERE id = ? AND owner = ? AND seq = ?').bind(finished?'{}':packSimulation(sim),now,finished?1:0,sim.time,p.pve,p.level,p.totalDamage,p.totalTaken||0,p.maxHit||0,JSON.stringify(p.build),row.id,me,row.seq);
  const rewardXp=finished?Math.max(1,Math.round(sim.time*.6+p.pve*12+p.level*18+p.totalDamage/120-(p.totalTaken||0)*.25+(p.maxBrutality||0)*2)):0,rewardCoins=Math.floor(rewardXp/50);
  const result=await update.run();if(finished)try{await db(env).prepare('INSERT INTO profiles (owner,xp,coins,best_brutality,updated) VALUES (?,?,?,?,?) ON CONFLICT(owner) DO UPDATE SET xp=xp+excluded.xp,coins=coins+excluded.coins,best_brutality=MAX(best_brutality,excluded.best_brutality),updated=excluded.updated').bind(me,rewardXp,rewardCoins,Math.round(p.maxBrutality||0),now).run()}catch{}
  if(!result.meta.changes)return json({error:'Envio simultâneo. Tente novamente.'},409);
  return json({seq:row.seq+1,finished,seconds:sim.time,rewardXp,rewardCoins});
 }catch(error){console.error('Ranking:',error.message);return json({error:'Não foi possível acessar o ranking. Tente novamente.'},503)}
}};
