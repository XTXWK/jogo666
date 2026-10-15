import {EVOLUTION as E} from './progression.js';
import {BALANCE as B} from './content.js';

// Used by both authoritative collision and rendering. Radius upgrades and
// Expansion affect the outer orbit only; the guard orbit never grows.
export function getOrbits(p,time){
 const brutalSize=(p.brutalTier||0)>=3?1.18:1,orbits=[{id:'outer',count:p.axes,radius:p.orbit*(p.effects.expand>time?1.7:1),phase:p.phase,size:p.size*brutalSize,damage:1}];
 if(p.innerAxes>0)orbits.push({id:'inner',count:p.innerAxes,radius:B.innerRadius,phase:p.innerPhase||0,size:.75,damage:p.innerDamage??B.innerDamage});
 if(p.effects.hurricane>time)for(const orbit of orbits)orbit.damage*=E.hurricaneDamage;
 return orbits;
}
