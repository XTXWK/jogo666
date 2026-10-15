import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';import {createSolo,packSimulation,unpackSimulation,replayCommands} from '../shared/solo.js';
function database(){
 const sql=new DatabaseSync(':memory:');
 for(const file of ['0000_lame_wonder_man.sql','0001_new_swordsman.sql','0002_conscious_skullbuster.sql','0003_aromatic_xavin.sql'])sql.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8').replaceAll('--> statement-breakpoint',''));
 const db={sql,prepare(query){
  const stmt=sql.prepare(query);
  return {bind(...args){
   return {async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){return {meta:{changes:stmt.run(...args).changes}}}};
  }};
 }};db.batch=statements=>Promise.all(statements.map(statement=>statement.run()));return db;
}
test('Ranked replay survives serialization and cannot accept HP, XP, time or fake scores',()=>{
 const live=createSolo(888,'QA');let saved=packSimulation(live);
 for(let part=0;part<6;part++){
  const commands=[];for(let i=0;i<150&&!live.ended;i++){
   while(live.players[0].choices.length){const card=live.players[0].choices[0];commands.push({t:'choose',card,slot:-1});live.choose(live.players[0],card,-1)}
   const c={t:'step',x:Math.sin(i/40),y:0};commands.push(c);replayCommands(live,[c]);
  }
  const verified=unpackSimulation(saved);replayCommands(verified,commands);saved=packSimulation(verified);
  assert.deepEqual(JSON.parse(saved),JSON.parse(packSimulation(live)));
 }
 for(const t of ['damage','score','xp','time','use'])assert.throws(()=>replayCommands(live,[{t,value:999999}]));
 assert.throws(()=>replayCommands(live,[{t:'step',x:999,y:0}]));
});
test('D1 routes save verified death once and share result between independent visitors',async()=>{
 const DB=database(),env={DB},origin='https://arena.test';let cookie='';
 const request=(path,body,who=cookie)=>worker.fetch(new Request(origin+path,{method:body?'POST':'GET',headers:{origin,'Content-Type':'application/json',cookie:who},body:body?JSON.stringify(body):undefined}),env);
 const started=await request('/api/runs',{nick:'Testador'});assert.equal(started.status,200);cookie=started.headers.get('set-cookie').split(';')[0];const run=await started.json();
 // Advance server wall-clock allowance only, never simulated survival or HP.
 DB.sql.prepare('UPDATE runs SET created = created - 3600000 WHERE id = ?').run(run.id);
 let local=createSolo(run.seed,run.nick),seq=0,lastBody;
 for(let part=0;part<120&&!local.ended;part++){
  const commands=[];for(let i=0;i<150&&!local.ended;i++){
   while(local.players[0].choices.length){const card=local.players[0].choices[0];commands.push({t:'choose',card,slot:-1});local.choose(local.players[0],card,-1)}
   const c={t:'step',x:0,y:0};commands.push(c);replayCommands(local,[c]);
  }
  lastBody={seq,commands};const res=await request('/api/runs/'+run.id,lastBody);const data=await res.json();assert.equal(res.status,200,JSON.stringify(data));seq=data.seq;
 }
 assert(local.ended,'stationary player should eventually die');
 const again=await request('/api/runs/'+run.id,lastBody);assert.equal(again.status,200);
 const ranking=await (await request('/api/ranking',null,'')).json();assert.equal(ranking.rows.length,1);assert.equal(ranking.rows[0].nick,'Testador');assert.equal(ranking.rows[0].seconds,local.time);assert.equal(ranking.rows[0].damageTaken,local.players[0].totalTaken);assert.equal(ranking.rows[0].maxHit,local.players[0].maxHit);assert.equal(typeof JSON.parse(ranking.rows[0].build),'object');
 const thief=await request('/api/runs/'+run.id,{seq,commands:[]},'rb_guest=00000000-0000-0000-0000-000000000000');assert.equal(thief.status,404);
 DB.sql.close();
});
test('Public/private rooms validate passwords, relay signals and migrate the host',async()=>{
 const DB=database(),env={DB},origin='https://arena.test';
 const call=(path,body,cookie='')=>worker.fetch(new Request(origin+path,{method:body?'POST':'GET',headers:{origin,'Content-Type':'application/json',cookie},body:body?JSON.stringify(body):undefined}),env);
 const made=await call('/api/rooms',{name:'Salão dos Amigos',nick:'Host',password:'machado'});assert.equal(made.status,200);const hostCookie=made.headers.get('set-cookie').split(';')[0],room=await made.json();assert(room.host);assert(room.private);
 const listed=await (await call('/api/rooms')).json();assert.equal(listed.rows.length,1);assert.equal(listed.rows[0].name,'Salão dos Amigos');assert.equal(listed.rows[0].players,1);
 assert.equal((await call('/api/rooms/'+room.roomId+'/join',{nick:'Amigo',password:'errada'})).status,403);
 const joined=await call('/api/rooms/'+room.roomId+'/join',{nick:'Amigo',password:'machado'});assert.equal(joined.status,200);const guestCookie=joined.headers.get('set-cookie').split(';')[0],guest=await joined.json();assert(!guest.host);
 assert.equal((await call('/api/rooms/'+room.roomId+'/signal',{to:guest.memberId,payload:{type:'offer',sdp:{type:'offer',sdp:'test'}}},hostCookie)).status,200);
 const signals=await (await call('/api/rooms/'+room.roomId+'/signals?after=0',null,guestCookie)).json();assert.equal(signals.rows.length,1);assert.equal(signals.rows[0].payload.type,'offer');
 assert.equal((await call('/api/rooms/'+room.roomId+'/leave',{},hostCookie)).status,200);const heartbeat=await (await call('/api/rooms/'+room.roomId+'/heartbeat',{},guestCookie)).json();assert.equal(heartbeat.hostId,guest.memberId);DB.sql.close();
});
test('Ranking rejects wrong origin and advancing simulation faster than elapsed wall clock',async()=>{
 const DB=database(),env={DB},origin='https://arena.test';
 const start=await worker.fetch(new Request(origin+'/api/runs',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({nick:'QA'})}),env);const cookie=start.headers.get('set-cookie').split(';')[0],run=await start.json();
 const commands=Array.from({length:150},()=>({t:'step',x:1,y:0}));
 const post=(originHeader)=>worker.fetch(new Request(origin+'/api/runs/'+run.id,{method:'POST',headers:{origin:originHeader,'Content-Type':'application/json',cookie},body:JSON.stringify({seq:0,commands})}),env);
 assert.equal((await post('https://evil.test')).status,403);assert.equal((await post(origin)).status,400);DB.sql.close();
});
test('World ranking keeps only 100 best players while preserving an outsider position',async()=>{
 const DB=database(),env={DB},origin='https://arena.test';
 const token='12345678-1234-1234-1234-123456789abc',hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)),owner=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
 const insert=DB.sql.prepare('INSERT INTO runs (id,owner,nick,rules,created,updated,state,finished,seconds,kills,level,damage,damage_taken,max_hit,build) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
 for(let i=0;i<105;i++)insert.run(crypto.randomUUID(),i===104?owner:'owner-'+i,'Jogador '+i,(await import('../shared/solo.js')).RULESET,i,i,'{}',1,1000-i,i,10,500,0,50,'{}');
 const response=await worker.fetch(new Request(origin+'/api/ranking',{headers:{cookie:'rb_guest='+token}}),env),data=await response.json();
 assert.equal(data.rows.length,100);assert.equal(data.rows[0].position,1);assert.equal(data.me.position,105);assert(!data.rows.some(r=>r.nick==='Jogador 104'));DB.sql.close();
});
