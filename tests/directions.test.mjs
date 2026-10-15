import test from 'node:test';
import assert from 'node:assert/strict';
import {directionIndex,directionalSheet} from '../client/src/art.js';
import {Simulation} from '../shared/simulation.js';

test('the eight movement angles select the expected directional sprite',()=>{
 const angles=[Math.PI/2,3*Math.PI/4,Math.PI,-3*Math.PI/4,-Math.PI/2,-Math.PI/4,0,Math.PI/4];
 assert.deepEqual(angles.map(directionIndex),[0,1,2,3,4,5,6,7]);
});

test('every combat enemy and boss has a directional atlas row',()=>{
 for(const type of ['crawler','runner','tank','shooter','lumber','dasher','volatile','elite','warden','hexer','bramble','scatter','ent','corrupt','spirit','player'])assert.ok(directionalSheet(type),type);
});

test('player keeps its last facing while stopped',()=>{
 const sim=new Simulation({solo:true,seed:91});const p=sim.addPlayer('p','Direcional');
 sim.setInput(p,{x:-1,y:1,aim:0,seq:1});sim.step(.02);
 assert.ok(Math.abs(p.facingAngle-3*Math.PI/4)<1e-9);
 sim.setInput(p,{x:0,y:0,aim:0,seq:2});sim.step(.02);
 assert.ok(Math.abs(p.facingAngle-3*Math.PI/4)<1e-9);
});

test('moving enemies expose their authoritative facing angle',()=>{
 const sim=new Simulation({solo:true,seed:12});const p=sim.addPlayer('p','Alvo');p.x=1200;p.y=1200;
 const e=sim.spawn('crawler',1000,1200);sim.spawnTimer=999;sim.step(.02);
 assert.ok(Math.abs(e.facingAngle)<.05);
});
