import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../shared/simulation.js';
import {BALANCE as B,CARD_BY_ID} from '../shared/content.js';
import {getOrbits} from '../shared/orbits.js';
import {resetRunPresentation,interpolateSolo} from '../client/src/presentation.js';

function setup(){const s=new Simulation({solo:false});s.entities=[];s.spawnTimer=100;const p=s.addPlayer('p','QA');return {s,p}}
test('Double orbit unlocks a fixed inner guard without consuming an active slot',()=>{
 const {s,p}=setup();const outer=p.axes;
 assert.equal(CARD_BY_ID.inneraxe.eligible(p),false);
 p.choices=['double'];assert(s.choose(p,'double'));
 assert.equal(p.innerAxes,1);assert.equal(p.axes,outer);assert.equal(p.active.length,0);
 assert.equal(CARD_BY_ID.double.eligible(p),false);
 p.orbit*=4;p.effects.expand=100;
 const [a,b]=getOrbits(p,s.time);
 assert.equal(a.radius,p.orbit*1.7);assert.equal(b.radius,B.innerRadius);
 assert.equal(b.count,1);assert.equal(b.damage,B.innerDamage);
});
test('Inner cards affect only inner stats, respect six-axe limit and gate before unlock',()=>{
 const {p}=setup();for(const id of ['inneraxe','innerdamage','innerspeed'])assert(!CARD_BY_ID[id].eligible(p));
 CARD_BY_ID.double.apply(p);const before={axes:p.axes,spin:p.spin,damage:p.damage,orbit:p.orbit};
 for(let i=1;i<6;i++){assert(CARD_BY_ID.inneraxe.eligible(p));CARD_BY_ID.inneraxe.apply(p)}
 assert.equal(p.innerAxes,6);assert(!CARD_BY_ID.inneraxe.eligible(p));
 CARD_BY_ID.innerdamage.apply(p);CARD_BY_ID.innerspeed.apply(p);
 assert.equal(p.innerDamage,B.innerDamage*1.2);assert.equal(p.innerSpin,B.innerSpeed*1.15);
 assert.deepEqual({axes:p.axes,spin:p.spin,damage:p.damage,orbit:p.orbit},before);
 const orbit=getOrbits(p,0)[1];const points=Array.from({length:orbit.count},(_,i)=>[Math.cos(orbit.phase+i/6*2*Math.PI),Math.sin(orbit.phase+i/6*2*Math.PI)]);
 for(let i=0;i<6;i++){const next=points[(i+1)%6];assert(Math.abs(Math.hypot(points[i][0]-next[0],points[i][1]-next[1])-1)<1e-9)}
});
test('Inner orbit actually damages an enemy inside enlarged outer radius',()=>{
 const {s,p}=setup();p.orbit=400;p.crit=0;CARD_BY_ID.double.apply(p);
 const mob=s.spawn('tank',p.x+B.innerRadius,p.y),hp=mob.hp;s.step(1/30);
 assert.equal(mob.hp,hp-p.damage*p.innerDamage);
 assert(Object.keys(mob.hits).some(k=>k.includes(':inner:')));
 assert(!Object.keys(mob.hits).some(k=>k.includes(':outer:')));
 assert(p.innerPhase<0);assert(p.phase>0);
});
test('New hunt empties old HUD and all lingering visual effects before next unlock',()=>{
 const renderer={parts:[{}],rings:[{}],texts:[{}],shake:9,arrowAlpha:1};
 const hud={children:['Dash','Fúria'],replaceChildren(){this.children=[]}};
 resetRunPresentation(renderer,hud);
 assert.deepEqual(hud.children,[]);assert.equal(renderer.parts.length+renderer.rings.length+renderer.texts.length,0);
 assert.equal(renderer.shake,0);assert.equal(renderer.arrowAlpha,0);
 resetRunPresentation(renderer,hud);assert.deepEqual(hud.children,[]);
});
test('Solo rendering interpolates movement, never authority, and snaps dash teleports',()=>{
 const {s,p}=setup();const previous=s.snapshot();p.x+=8;p.phase+=.1;p.innerPhase-=.2;const current=s.snapshot();
 const rendered=interpolateSolo(previous,current,.5);
 assert.equal(rendered.players[0].x,previous.players[0].x+4);
 assert.equal(rendered.players[0].phase,.05);assert.equal(rendered.players[0].innerPhase,-.1);
 assert.equal(p.x,current.players[0].x);
 p.x+=210;const dash=interpolateSolo(current,s.snapshot(),.2);assert.equal(dash.players[0].x,p.x);
});
