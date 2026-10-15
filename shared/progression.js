// Match clock is authoritative; pausing solo does not advance a wave.
export function hordeStage(time){
 return 1+Math.floor(Math.max(0,time)/180);
}
export function nextHorde(time){return hordeStage(time)*180}
export function earlyDifficulty(time){const t=Math.max(0,Math.min(1,time/120));return .9+.1*t*t*(3-2*t)}
export function lateStage(time){return Math.max(0,Math.floor((Math.max(0,time)-900)/60))}
export function lateDifficulty(time){const n=lateStage(time);return {stage:n,hp:1+n*.1,damage:1+n*.07,speed:1+Math.min(.3,n*.02),spawn:Math.pow(.92,n)}}
// Smooth pressure starts immediately. Extra online players add bodies and
// awareness more aggressively than raw damage, keeping co-op difficult but fair.
export function survivalDifficulty(time,players=1){
 const minutes=Math.max(0,time)/60,count=Math.max(1,Math.floor(players)),extra=count-1;
 return {
  hp:1+minutes*.045+extra*.16,
  damage:1+minutes*.032+extra*.055,
  speed:1+Math.min(.36,minutes*.012)+Math.min(.12,extra*.012),
  spawn:Math.max(.38,1-minutes*.028)/(1+extra*.3),
  intelligence:1+Math.min(.65,minutes*.035)+Math.min(.35,extra*.04),
  pack:Math.min(4,Math.floor(minutes/3))+Math.min(4,Math.floor((extra+1)/2))
 };
}
export const EVOLUTION=Object.freeze({fireDuration:4,fireChance:.28,fireMax:.85,fireDps:.3,luckStep:.2,luckMax:2,hurricaneDuration:6,hurricaneCooldown:24,hurricaneSpeed:3,hurricaneDamage:1.6,lowHp:.25,championAt:90,championInterval:180,wolfHp:100,wolfDamage:18,wolfRange:260});
