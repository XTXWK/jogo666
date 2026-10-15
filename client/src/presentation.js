// Clear both visual caches and actual buttons. An empty active list is a
// valid state and must not reuse the previous run's populated HUD.
export function resetRunPresentation(renderer,actives){
 actives.replaceChildren();
 renderer.parts.length=0;renderer.rings.length=0;renderer.texts.length=0;
 renderer.muzzles=[];renderer.shake=0;renderer.arrowAlpha=0;
}

// Simulation runs at 30 Hz. Blend positions for display frames, without
// changing authoritative state or smearing teleports/dashes into a long slide.
export function interpolateSolo(previous,current,alpha){
 if(!previous)return current;
 alpha=Math.max(0,Math.min(1,alpha));
 const interpolate=(key)=>{const before=new Map((previous[key]||[]).map(e=>[e.id,e]));return (current[key]||[]).map(e=>{
   const old=before.get(e.id);
   if(!old||old.alive!==e.alive||Math.hypot(e.x-old.x,e.y-old.y)>80)return e;
   const phases=key==='players'?{phase:old.phase+(e.phase-old.phase)*alpha,innerPhase:old.innerPhase+(e.innerPhase-old.innerPhase)*alpha}:{};
   return {...e,...phases,x:old.x+(e.x-old.x)*alpha,y:old.y+(e.y-old.y)*alpha};
 })};
 return {...current,players:interpolate('players'),entities:interpolate('entities'),companions:interpolate('companions')};
}
