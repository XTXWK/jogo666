import test from 'node:test';import assert from 'node:assert/strict';
import {Simulation} from '../shared/simulation.js';import {ABILITIES,CARD_BY_ID,cardWeight,CARDS} from '../shared/content.js';import {earlyDifficulty,lateDifficulty,lateStage,survivalDifficulty} from '../shared/progression.js';import {CLEARINGS,distanceToPaths,treeAllowed} from '../shared/level.js';
test('No Dash, no firing without nearby enemy, automatic nearest aim, and cooldown authority',()=>{
 const s=new Simulation({solo:false});s.entities=[];s.spawnTimer=999;const p=s.addPlayer('p','QA');p.active=['throw'];
 assert(!ABILITIES.dash);assert(!CARD_BY_ID.a_dash);s.step(1/30);assert.equal(s.shots.length,0);
 s.spawn('tank',p.x+250,p.y);s.spawn('tank',p.x-400,p.y);s.step(1/30);assert(s.shots[0].vx>0);const n=s.shots.length;s.step(1/30);assert.equal(s.shots.length,n);assert(!s.use(p,'throw'));
});
test('More initial trees and respawn waits 45 seconds and a clear space',()=>{
 const s=new Simulation();assert.equal(s.entities.filter(e=>e.type==='tree').length,150);const p=s.addPlayer('p','QA'),tree=s.entities[0];s.damageTarget(tree,999,p);assert.equal(s.treeRespawns.length,1);
 s.spawnTimer=999;s.nextBoss=999;s.nextChampion=999;s.time=44;s.step(.03);assert.equal(s.treeRespawns.length,1);
 p.x=tree.x;p.y=tree.y;s.time=45;s.step(.03);assert.equal(s.treeRespawns.length,1);
 p.x=1200;p.y=1200;tree.x=100;tree.y=100;s.treeRespawns[0].x=100;s.treeRespawns[0].y=100;s.step(.03);assert.equal(s.treeRespawns.length,0);assert(s.entities.some(e=>e.type==='tree'&&e.x===100&&e.y===100));
});
test('Living forest keeps trees out of roads and combat clearings',()=>{
 const s=new Simulation();for(const tree of s.entities.filter(e=>e.type==='tree')){assert(treeAllowed(tree.x,tree.y));assert(distanceToPaths(tree.x,tree.y).distance>20);assert(tree.scale>=.84&&tree.scale<=1.14);for(const clearing of CLEARINGS)assert(Math.hypot(tree.x-clearing.x,tree.y-clearing.y)>=clearing.r)}
});
test('Enemy damage is 10% lower before two minutes and normal afterwards',()=>{
 const s=new Simulation({solo:false}),p=s.addPlayer('p','QA');p.grace=0;s.damageTarget(p,10);assert.equal(p.hp,p.maxHp-9);s.time=120;s.damageTarget(p,10);assert.equal(p.hp,p.maxHp-19);
 assert.equal(earlyDifficulty(0),.9);assert(earlyDifficulty(60)>.9&&earlyDifficulty(60)<1);assert.equal(earlyDifficulty(120),1);
 const total=CARDS.filter(c=>c.rarity==='rare').length;assert(Math.abs(cardWeight(CARD_BY_ID.axe,p)-13/total*2.5)<1e-9);
});
test('Every three-minute wave pauses solo for exactly one distinct three-card reward',()=>{
 const s=new Simulation({solo:true});s.entities=[];s.spawnTimer=s.nextBoss=s.nextChampion=9999;const p=s.addPlayer('p','QA');p.hp=1e9;p.maxHp=1e9;s.time=179.99;
 s.step(.02);assert.equal(s.horde,2);assert.equal(p.choiceKind,'wave');assert.equal(p.wavePending,1);assert.equal(p.choices.length,3);assert.equal(new Set(p.choices).size,3);
 const paused=s.time;s.step(1/30);assert.equal(s.time,paused);assert(s.choose(p,p.choices[0],-1));assert.equal(p.wavePending,0);assert.equal(p.choices.length,0);s.step(1/30);assert(s.time>paused);
});
test('Ricochet reflects hostile projectiles at axes, targets an enemy and remains chance-limited',()=>{
 const s=new Simulation({solo:false,seed:5});s.entities=[];s.spawnTimer=999;const p=s.addPlayer('p','QA');p.grace=0;CARD_BY_ID.ricochet.apply(p);assert.equal(p.ricochet,.35);
 const target=s.spawn('tank',p.x+300,p.y),axeX=p.x+p.orbit;s.shots=[{id:1,kind:'shooter',x:axeX,y:p.y,vx:-200,vy:0,life:3,age:0,enemy:true,damage:12,hits:[]}];s.random=()=>0;
 s.updateShots(0);const q=s.shots[0];assert.equal(q.enemy,false);assert(q.reflected);assert.equal(q.owner,p.id);assert(q.vx>0);assert(s.drain().some(e=>e.type==='ricochet'));
 const before=target.hp;s.grid.cells.clear();s.grid.insert(target);for(let i=0;i<40&&s.shots.length;i++)s.updateShots(1/30);assert(target.hp<before);
 CARD_BY_ID.ricochet.apply(p);CARD_BY_ID.ricochet.apply(p);assert.equal(p.ricochet,.75);assert(!CARD_BY_ID.ricochet.eligible(p));
});
test('Late pressure rises once per minute after minute 15',()=>{
 assert.equal(lateStage(900),0);assert.equal(lateStage(959),0);assert.equal(lateStage(960),1);assert.equal(lateStage(1020),2);assert(lateDifficulty(1020).hp>lateDifficulty(960).hp);
 const s=new Simulation({solo:false});s.entities=[];s.spawnTimer=s.nextBoss=s.nextChampion=9999;const p=s.addPlayer('p','QA');p.hp=p.maxHp=1e9;const enemy=s.spawn('tank',p.x+500,p.y);const hp=enemy.maxHp;s.time=959.99;s.step(.02);assert.equal(s.lateStage,1);assert(enemy.maxHp>hp);assert(s.drain().some(e=>e.type==='surge'));
});
test('One wolf follows at range, rests, spits fire and must be reacquired after death',()=>{
 const s=new Simulation({solo:false});s.entities=[];s.spawnTimer=s.nextBoss=s.nextChampion=9999;const p=s.addPlayer('p','QA');CARD_BY_ID.companion.apply(p);s.step(1/30);assert.equal(s.companions.length,1);const wolf=s.companions[0];assert.equal(wolf.maxHp,100);assert(p.companionAlive);
 assert(!CARD_BY_ID.companion.eligible(p),'the card cannot create a second wolf');s.step(1/30);assert.equal(s.companions.length,1);
 const enemy=s.spawn('tank',wolf.x+300,wolf.y),startX=wolf.x;for(let i=0;i<210;i++)s.step(1/30);assert(s.shots.some(q=>q.kind==='wolfFire')||enemy.hp<enemy.maxHp);assert(Math.hypot(wolf.x-p.x,wolf.y-p.y)<220);assert.notEqual(wolf.x,startX);s.damageTarget(wolf,999,enemy);assert(!p.companionAlive);assert(!s.companions.length);assert(CARD_BY_ID.companion.eligible(p));
});
test('Every player hit emits local feedback for monsters and rival players',()=>{
 const s=new Simulation({solo:false}),p=s.addPlayer('p','Alvo'),rival=s.addPlayer('q','Rival');p.grace=0;rival.grace=0;s.drain();
 s.damageTarget(p,10);let hurt=s.drain().find(e=>e.type==='hurt');assert.equal(hurt.player,p.id);assert.equal(hurt.source,'monster');
 s.damageTarget(p,10,rival,true);hurt=s.drain().find(e=>e.type==='hurt');assert.equal(hurt.player,p.id);assert.equal(hurt.source,'player');
});
test('Centipede burrows, becomes untargetable, leaves a trail and erupts',()=>{
 const s=new Simulation({solo:false,seed:9});s.entities=[];s.spawnTimer=s.nextBoss=s.nextChampion=9999;const p=s.addPlayer('p','Alvo');p.hp=p.maxHp=1e6;p.grace=0;
 const boss=s.spawn('centipede',p.x+280,p.y);boss.nextAttack=0;s.step(1/30);assert.equal(boss.burrowed,true);const hp=boss.hp;s.damageTarget(boss,999,p);assert.equal(boss.hp,hp);
 for(let i=0;i<82;i++){if(i===35)p.y+=320;s.step(1/30)}assert(s.trails.length>0);assert.equal(boss.burrowed,false);assert(s.hazards.some(h=>h.kind==='centipede'));assert(s.drain().some(e=>e.type==='emerge'));
 assert.equal(boss.segments.length,13);assert(boss.segments.some((part,i)=>i&&Math.abs(part.y-boss.segments[i-1].y)>.01),'segmented body must bend instead of using one rigid sprite');
});
test('Survival pressure rises smoothly with time and online player count',()=>{
 const start=survivalDifficulty(0,1),late=survivalDifficulty(600,1),party=survivalDifficulty(600,4);
 assert(late.hp>start.hp&&late.damage>start.damage&&late.speed>start.speed&&late.spawn<start.spawn&&late.intelligence>start.intelligence);
 assert(party.hp>late.hp&&party.damage>late.damage&&party.spawn<late.spawn&&party.pack>late.pack);
});
test('A joining online player immediately reinforces and strengthens the forest',()=>{
 const s=new Simulation({solo:false,seed:17});s.entities=[];s.addPlayer('p','Primeiro');const enemy=s.spawn('tank',900,900),hp=enemy.maxHp,damage=enemy.damage,count=s.entities.length;
 s.addPlayer('q','Segundo');assert(s.entities.length>count);assert(enemy.maxHp>hp);assert(enemy.damage>damage);assert(s.drain().some(e=>e.type==='reinforcements'));
});
