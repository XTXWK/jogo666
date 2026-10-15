import {EVOLUTION as E} from '../../shared/progression.js';
export class HealthFeedback{
 constructor(element,audio,renderer=null){this.element=element;this.audio=audio;this.renderer=renderer;this.reset()}
 reset(){this.hp=null;this.flash=0;this.beat=0;this.element.style.opacity='0';this.element.classList.remove('danger')}
 hit(amount=0){this.flash=.7;this.audio.play('hurt');this.renderer?.impact(amount)}
 update(p,dt,active){
  if(this.hp!==null&&p.hp<this.hp)this.hit(this.hp-p.hp);this.hp=p.hp;
  this.flash=Math.max(0,this.flash-dt*2);
  const low=active&&p.alive&&p.hp/p.maxHp<E.lowHp;
  this.element.classList.toggle('danger',low);
  this.element.style.opacity=String(active?Math.max(this.flash,low?.8:0):0);
  this.beat-=dt;if(low&&this.beat<=0){this.audio.play('heartbeat');this.beat=1}if(!low)this.beat=0;
 }
}
