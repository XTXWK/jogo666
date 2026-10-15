import {Simulation,SpatialGrid} from './simulation.js';
export const RULESET='living-forest-sagas-5';
export function createSolo(seed,nick){
 const sim=new Simulation({solo:true,mode:'closing',seed});const p=sim.addPlayer('local',nick);
 sim.spawnTimer=5;sim.spawn('crawler',p.x+480,p.y);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;sim.entities.push({id:sim.id(),type:'tree',x:p.x+Math.cos(a)*(i%2?175:100),y:p.y+Math.sin(a)*(i%2?175:100),r:27,hp:48,maxHp:48,hits:{},freezeUntil:0,variant:i%4});}
 return sim;
}
export function packSimulation(sim){return JSON.stringify({...sim,events:[],grid:undefined})}
export function unpackSimulation(value){const sim=Object.assign(Object.create(Simulation.prototype),JSON.parse(value));sim.grid=new SpatialGrid();sim.events=[];sim.companions??=[];sim.zones??=[];sim.trails??=[];sim.lateStage??=0;return sim}
// Only controls and legitimate card choices are accepted. Never scores or HP.
export function replayCommands(sim,commands){
 if(!Array.isArray(commands)||commands.length>900)throw Error('Comandos inválidos');
 let ticks=0;
 for(const c of commands){
  if(!c||typeof c!=='object')throw Error('Comando inválido');
  const p=sim.players[0];
  if(c.t==='step'){
   if(++ticks>180||sim.ended||!Number.isFinite(c.x)||!Number.isFinite(c.y)||Math.abs(c.x)>1||Math.abs(c.y)>1)throw Error('Movimento inválido');
   if(p.choices.length)throw Error('Escolha uma carta antes de continuar');
   sim.setInput(p,{x:c.x,y:c.y,aim:p.aim,seq:p.ack+1});sim.step(1/30);
  }else if(c.t==='choose'){if(!sim.choose(p,c.card,c.slot))throw Error('Carta inválida')}
  else if(c.t==='reroll'){if(!sim.reroll(p))throw Error('Reroll inválido')}
  else throw Error('Comando não permitido');
  sim.drain();
 }
 return sim;
}
