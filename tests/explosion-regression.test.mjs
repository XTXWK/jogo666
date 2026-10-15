import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../shared/simulation.js';
import {Renderer} from '../client/src/renderer.js';

// Canvas arc() rejects negative radii in browsers. Keep this strict so a
// rendering exception cannot hide behind simulation-only combat tests.
function rendererHarness(p) {
  let arcs=0;
  const ctx=new Proxy({
    arc(x,y,r){assert(Number.isFinite(r)&&r>=0,`Canvas arc radius: ${r}`);arcs++},
    createRadialGradient(){return {addColorStop(){}}}
  },{get(target,key){return key in target?target[key]:()=>{}}});
  const renderer=Object.assign(Object.create(Renderer.prototype),{
    ctx,dpr:1,w:1280,h:720,zoom:1,targetZoom:1,camera:{x:p.x,y:p.y},
    shake:0,reduced:true,floor:{},parts:[],pool:[],rings:[],texts:[],
    arrow:0,arrowAlpha:0,sprite:()=>({})
  });
  return {renderer,getArcs:()=>arcs};
}

test('staggered Ent telegraphs render before their countdown, during it and after blast',()=>{
  const sim=new Simulation({solo:false});sim.entities=[];sim.spawnTimer=100;
  const p=sim.addPlayer('p','QA');p.grace=999;p.hp=p.maxHp=100000;
  sim.time=120;sim.nextBoss=1000;
  const boss=sim.spawn('ent',p.x+350,p.y);boss.nextAttack=120;
  sim.step(1/30);
  assert.equal(sim.hazards.length,5);
  assert(sim.hazards.some(h=>h.at-sim.time>1.2));
  const {renderer,getArcs}=rendererHarness(p);
  // A level-up during the warning pauses solo simulation. The renderer must
  // still finish so the UI can open the card picker and resume the game.
  sim.solo=true;sim.addXp(p,p.nextXp);
  renderer.draw(sim.snapshot(),p.id,{x:0,y:0},1/30);
  const pausedTime=sim.time;sim.step(1/30);assert.equal(sim.time,pausedTime);
  assert(sim.choose(p,p.choices[0]));sim.solo=false;
  for(let frame=0;frame<90;frame++){
    sim.drain().forEach(e=>renderer.emit(e));
    renderer.draw(sim.snapshot(),p.id,{x:0,y:0},1/30);
    sim.step(1/30);
  }
  assert(getArcs()>0);assert(sim.time>123);assert(p.alive);
});

test('frontal execution, explosive enemies and XP level choices continue rendering',()=>{
  const sim=new Simulation({solo:true});sim.entities=[];sim.spawnTimer=100;
  const p=sim.addPlayer('p','QA');p.active=['execute'];p.aim=0;p.grace=999;
  for(let i=0;i<10;i++)sim.spawn('volatile',p.x+80+i*4,p.y+5);
  assert(sim.use(p,'execute',true));assert.equal(p.pve,10);
  const {renderer}=rendererHarness(p);
  for(let i=0;i<90;i++){
    while(p.choices.length)assert(sim.choose(p,p.choices[0],-1));
    sim.step(1/30);sim.drain().forEach(e=>renderer.emit(e));
    renderer.draw(sim.snapshot(),p.id,{x:0,y:0},1/30);
  }
  assert(p.level>1);assert(sim.time>2);assert(p.alive);
});

test('Dash is removed and automatic throw targets closest enemy opposite movement',()=>{
  const sim=new Simulation({solo:false});sim.entities=[];sim.spawnTimer=999;
  const p=sim.addPlayer('p','QA');p.active=['throw'];
  sim.spawn('tank',p.x+100,p.y);sim.spawn('tank',p.x-300,p.y);
  sim.setInput(p,{x:-1,y:0,aim:Math.PI,seq:1});sim.step(1/30);
  assert(sim.shots[0].vx>0);assert(!sim.use(p,'dash',true));
});

test('Abilities and blasts use particles without adding an orange player-area ring',()=>{
 const p={x:1200,y:1200};const {renderer}=rendererHarness(p);
 renderer.emit({type:'ability',x:p.x,y:p.y});
 renderer.emit({type:'blast',x:p.x,y:p.y,radius:100});
 assert.equal(renderer.rings.length,0);
 renderer.emit({type:'level',x:p.x,y:p.y});
 assert.equal(renderer.rings.length,1);
});
