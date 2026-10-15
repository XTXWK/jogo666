const KEY='rb-hunt-history-v1';
export function readRecords(storage){try{const data=JSON.parse(storage.get(KEY)||'[]');return Array.isArray(data)?data.filter(r=>Number.isFinite(r.time)&&r.time>=0).slice(0,20):[]}catch{return []}}
export function saveHunt(storage,state,p){
 const runs=readRecords(storage),old=Math.max(0,Number(storage.get('rb-record'))||0,...runs.map(r=>r.time));
 const record={time:Math.floor(state.time),date:new Date().toISOString(),level:p.level,pve:p.pve,damage:Math.round(p.totalDamage),build:{...p.build},horde:state.horde||0};
 const isRecord=record.time>old;
 storage.set(KEY,JSON.stringify([record,...runs].slice(0,20)));
 if(isRecord)storage.set('rb-record',String(record.time));
 return {record,isRecord,best:Math.max(old,record.time)};
}
