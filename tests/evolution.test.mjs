import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../shared/simulation.js';
import {CARD_BY_ID,cardWeight,CARDS} from '../shared/content.js';
import {EVOLUTION as E,hordeStage,nextHorde} from '../shared/progression.js';
import {getOrbits} from '../shared/orbits.js';
import {saveHunt,readRecords} from '../client/src/records.js';
import {HealthFeedback} from '../client/src/feedback.js';
function world(){const s=new Simulation({solo:true,seed:42});s.entities=[];s.spawnTimer=9999;s.nextBoss=9999;s.nextChampion=9999;const p=s.addPlayer('p','QA');p.grace=0;return {s,p}}
function choose(s,p,id,slot){p.choices=[id];assert(s.choose(p,id,slot))}
test('Fire requires a critical AND a second successful roll; lasts exactly four seconds',()=>{
 const {s,p}=world();choose(s,p,'fire');const e=s.spawn('tank',p.x+400,p.y);e.hp=e.maxHp=1000;
 p.crit=0;s.random=()=>0;s.hit(e,p);assert.equal(e.burnUntil,0);
 p.crit=1;let values=[0,.99];s.random=()=>values.shift()??.99;s.hit(e,p);assert.equal(e.burnUntil,0);
 s.random=()=>0;s.hit(e,p);assert.equal(e.burnUntil,4);
 const start=e.hp;for(let i=1;i<=50;i++){s.time=i/10;s.updateBurn(e,.1)}
 assert(Math.abs(start-e.hp-p.damage*E.fireDps*4)<1e-7);
 assert.equal(s.drops.length,0);
});
test('Burn kills once, credits its owner and drops physical XP without direct collection',()=>{
 const {s,p}=world();const e=s.spawn('crawler',p.x+400,p.y);e.hp=1;e.burnUntil=4;e.burnDps=10;e.burnOwner=p.id;s.time=.2;
 s.updateBurn(e,.2);const drops=s.drops.length;s.updateBurn(e,.2);
 assert(e.dead);assert.equal(p.pve,1);assert(drops>0);assert.equal(s.drops.length,drops);assert.equal(p.xp,0);
});
test('Luck increases better-card probability, leaves critical chance unchanged and respects cap',()=>{
 const {p}=world();const probability=()=>{const total=CARDS.reduce((sum,c)=>sum+cardWeight(c,p),0);return cardWeight(CARD_BY_ID.king,p)/total};
 const before=probability(),crit=p.crit;choose(new Simulation(),p,'luck');assert(probability()>before);assert.equal(p.crit,crit);
 for(let i=0;i<20&&CARD_BY_ID.luck.eligible(p);i++)CARD_BY_ID.luck.apply(p);
 assert.equal(p.luck,E.luckMax);assert(!CARD_BY_ID.luck.eligible(p));
});
test('Rebirth consumes a real slot, triggers once, prevents death drops, and never returns to cards',()=>{
 const {s,p}=world();p.active=['dash','throw','expand','shout','fury'];choose(s,p,'a_rebirth');assert.equal(p.replacement,'a_rebirth');
 assert(s.choose(p,'a_rebirth',2));assert.equal(p.active.length,5);assert.equal(p.active[2],'rebirth');assert(!s.use(p,'rebirth',true));
 s.damageTarget(p,999);assert(p.alive);assert.equal(p.hp,p.maxHp*.5);assert.equal(p.active.length,4);assert.equal(s.drops.length,0);assert(!s.ended);
 assert(!CARD_BY_ID.a_rebirth.eligible(p));s.damageTarget(p,999);assert(p.alive);
 s.time=4;s.damageTarget(p,999);assert(!p.alive);assert(s.ended);assert.equal(p.deaths,1);
});
test('Replacing unused Rebirth does not allow acquiring a second copy in the same run',()=>{
 const {s,p}=world();choose(s,p,'a_rebirth');p.active.push('dash','throw','expand','shout');choose(s,p,'a_fury',0);
 assert(!p.active.includes('rebirth'));assert(!CARD_BY_ID.a_rebirth.eligible(p));
});
test('Hurricane boosts both orbits temporarily and enforces cooldown',()=>{
 const {s,p}=world();choose(s,p,'double');choose(s,p,'a_hurricane');const spin=p.spin,inner=p.innerSpin,damage=p.damage;
 assert(s.use(p,'hurricane',true));assert(!s.use(p,'hurricane',true));s.movement(p,1);
 assert.equal(p.phase,spin*3);assert.equal(p.innerPhase,-inner*3);
 assert.equal(getOrbits(p,1)[0].damage,1.6);assert.equal(getOrbits(p,1)[1].damage,p.innerDamage*1.6);
 assert.equal(getOrbits(p,6)[0].damage,1);assert.equal(p.damage,damage);
});
test('Expansion enlarges only the axes and ends after its five-second duration',()=>{
 const {s,p}=world();p.active=['expand'];const base=p.orbit;
 assert(s.use(p,'expand',true));
 assert.equal(getOrbits(p,4.99)[0].radius,base*1.7);
 assert.equal(getOrbits(p,5)[0].radius,base);
});
test('Hordes advance every three minutes, once per boundary',()=>{
 for(const [time,stage,next] of [[0,1,180],[179.9,1,180],[180,2,360],[360,3,540],[540,4,720],[720,5,900],[900,6,1080]]){assert.equal(hordeStage(time),stage);assert.equal(nextHorde(time),next)}
 const {s}=world();s.time=179.99;s.step(.02);s.step(.02);assert.equal(s.drain().filter(e=>e.type==='horde').length,1);
 const early=world(),late=world();early.s.spawnTimer=late.s.spawnTimer=0;late.s.time=780;early.s.step(.03);late.s.step(.03);
 assert(late.s.entities.length>early.s.entities.length);assert(late.s.spawnTimer<early.s.spawnTimer);
});
test('Intermediate enemies are between regular mobs and bosses and use different attacks',()=>{
 for(const type of ['warden','hexer','bramble','scatter','lumber']){const {s,p}=world();const e=s.spawn(type,p.x+300,p.y);e.nextAttack=0;s.step(.03);
 if(['warden','bramble'].includes(type))assert(s.hazards.length>0);else assert(s.shots.length>0);
 if(e.champion){const boss=s.spawn('ent',100,100),normal=s.spawn('tank',200,200);assert(e.maxHp>normal.maxHp&&e.maxHp<boss.maxHp);assert(!e.boss)}
 }
 const {s}=world();s.nextChampion=90;s.time=89.99;s.step(.02);s.step(.02);assert.equal(s.entities.filter(e=>e.champion).length,1);
});
test('History persists stats and builds, congratulates strict records only and recovers corrupt storage',()=>{
 const map=new Map(),storage={get:k=>map.get(k),set:(k,v)=>map.set(k,v)};const {s,p}=world();s.time=125;p.build.fire=1;
 assert(saveHunt(storage,s,p).isRecord);assert(!saveHunt(storage,s,p).isRecord);s.time=126;assert(saveHunt(storage,s,p).isRecord);
 assert.equal(readRecords(storage)[0].build.fire,1);assert.equal(map.get('rb-record'),'126');
 for(let i=0;i<25;i++)saveHunt(storage,s,p);assert.equal(readRecords(storage).length,20);
 map.set('rb-hunt-history-v1','bad json');assert.deepEqual(readRecords(storage),[]);
});
test('Damage flashes and shakes the camera on every health loss; low HP heartbeat stops on recovery, pause and reset',()=>{
 const sounds=[],classes=new Set(),element={style:{},classList:{toggle:(k,v)=>v?classes.add(k):classes.delete(k),remove:k=>classes.delete(k)}};
 const impacts=[],renderer={impact:amount=>impacts.push(amount)},f=new HealthFeedback(element,{play:k=>sounds.push(k)},renderer),p={hp:100,maxHp:100,alive:true};f.update(p,.1,true);
 p.hp=20;f.update(p,.1,true);assert(sounds.includes('hurt'));assert(sounds.includes('heartbeat'));assert(classes.has('danger'));
 assert(impacts[0]>=10,'health loss must trigger a visible camera shake even when the damage came from a monster');
 const before=sounds.length;f.update(p,2,false);assert.equal(sounds.length,before);assert.equal(element.style.opacity,'0');
 p.hp=90;f.update(p,2,true);assert(!classes.has('danger'));f.reset();assert.equal(f.hp,null);
});
