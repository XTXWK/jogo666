import {RULESET} from '../../shared/solo.js';
async function api(path,body){const res=await fetch(path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});const data=await res.json();if(!res.ok)throw Error(data.error||'Ranking indisponível');return data}
export class RankedRun{
 constructor(data,onStatus){Object.assign(this,data);this.onStatus=onStatus;this.seq=0;this.commands=[];this.inflight=null;this.disabled=false;this.finished=false;this.onStatus('Caçada ranqueada · salvamento automático')}
 static async start(nick,onStatus){const d=await api('/api/runs',{nick});if(d.rules!==RULESET)throw Error('Atualize o jogo para disputar o ranking.');return new RankedRun(d,onStatus)}
 record(c){if(this.disabled)return;this.commands.push(c);if(this.commands.length>3000){this.disabled=true;this.onStatus('Conexão perdida. Esta caçada ficará apenas no histórico local.')}}
 async flush(){if(this.disabled||this.finished)return;if(this.inflight)return this.inflight;
  const batch=[];let ticks=0;for(const c of this.commands){if(c.t==='step'&&++ticks>150)break;if(batch.length>=850)break;batch.push(c)}if(!batch.length)return;
  this.inflight=(async()=>{try{let response;for(let n=0;n<2;n++){try{response=await api('/api/runs/'+this.id,{seq:this.seq,commands:batch});break}catch(e){if(n===1)throw e}}this.seq=response.seq;this.commands.splice(0,batch.length);this.finished=response.finished;this.onStatus(this.finished?`Recorde enviado · +${response.rewardXp||0} XP · +${response.rewardCoins||0} moedas`:'Caçada ranqueada · salvamento automático')}catch(e){this.disabled=true;this.onStatus(e.message+' Seu histórico local foi mantido.')}finally{this.inflight=null}})();return this.inflight;
 }
 async finish(){while(!this.disabled&&!this.finished&&(this.commands.length||this.inflight))await this.flush()}
}
export async function loadRanking(){return api('/api/ranking')}
