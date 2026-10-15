import {BALANCE as B} from '../../shared/content.js';
import {CLEARINGS,PATHS,REGIONS,distanceToPaths} from '../../shared/level.js';
const TAU=Math.PI*2;
const DECOR_RECTS=[[37,68,153,148],[256,11,225,218],[516,26,239,218],[797,57,214,174],[21,282,196,177],[274,282,216,193],[536,287,232,181],[834,302,158,151],[39,521,176,165],[263,498,246,221],[540,556,220,114],[810,479,194,235],[18,730,215,216],[273,746,223,190],[581,727,164,218],[810,760,200,190]];
function rng(seed=0x7261697a){return ()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296)}
function smoothPath(c,points){c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length-1;i++){const p=points[i],n=points[i+1];c.quadraticCurveTo(p[0],p[1],(p[0]+n[0])/2,(p[1]+n[1])/2)}c.lineTo(...points.at(-1))}
export class WorldArt{
 constructor(decor){this.decor=decor;this.items=[];this.layer=this.makeLayer();this.makeDecor()}
 makeLayer(){const layer=document.createElement('canvas');layer.width=layer.height=B.map/2;const c=layer.getContext('2d');c.scale(.5,.5);const blob=(x,y,rx,ry,inside,outside='transparent')=>{const g=c.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));g.addColorStop(0,inside);g.addColorStop(.72,inside);g.addColorStop(1,outside);c.save();c.scale(1,ry/rx);c.fillStyle=g;c.beginPath();c.arc(x,y/(ry/rx),rx,0,TAU);c.fill();c.restore()};
  const colors={dense:'#102f2470',mountain:'#59625455',swamp:'#193f385e',dry:'#8b70434d',field:'#65885832'};for(const r of REGIONS)blob(r.x,r.y,r.rx,r.ry,colors[r.kind]);
  const random=rng();for(let i=0;i<105;i++){const x=random()*B.map,y=random()*B.map,rad=45+random()*145,tones=['#78945013','#1c493015','#9b895119','#31563a12','#846f4511'];blob(x,y,rad,rad*(.45+random()*.5),tones[i%tones.length])}
  // Shallow wetland and stream remain traversable; they are visual navigation landmarks.
  c.fillStyle='#294f4d75';c.strokeStyle='#486e6866';c.lineWidth=7;c.beginPath();c.ellipse(420,1840,245,112,-.12,0,TAU);c.fill();c.stroke();c.strokeStyle='#315b5870';c.lineWidth=58;c.beginPath();c.moveTo(0,1740);c.bezierCurveTo(190,1670,260,1870,420,1840);c.stroke();
  for(const path of PATHS){const main=path.kind==='main',hidden=path.kind==='hidden';c.lineCap=c.lineJoin='round';smoothPath(c,path.points);c.strokeStyle=hidden?'#6e633447':'#563e2980';c.lineWidth=path.width+(main?24:12);c.stroke();smoothPath(c,path.points);c.strokeStyle=hidden?'#8c78464f':main?'#8c684392':'#79604478';c.lineWidth=path.width;c.stroke();if(main){smoothPath(c,path.points);c.strokeStyle='#b18a5850';c.lineWidth=path.width*.48;c.stroke();for(const side of [-1,1]){smoothPath(c,path.points);c.strokeStyle='#4b392844';c.lineWidth=3;c.setLineDash([18,14]);c.stroke();c.setLineDash([])}}}
  for(const q of CLEARINGS){const g=c.createRadialGradient(q.x,q.y,20,q.x,q.y,q.r);g.addColorStop(0,q.kind==='marsh'?'#51694635':'#88734e2c');g.addColorStop(.75,'#6e76412a');g.addColorStop(1,'transparent');c.fillStyle=g;c.beginPath();c.arc(q.x,q.y,q.r,0,TAU);c.fill()}
  // Readable boss shrine, old battle circle and resource grove.
  for(const q of CLEARINGS){if(q.kind==='arena'||q.kind==='shrine'){c.strokeStyle=q.kind==='shrine'?'#bba56b50':'#8d7b5440';c.lineWidth=7;c.beginPath();c.arc(q.x,q.y,q.r*.48,0,TAU);c.stroke();for(let i=0;i<12;i++){const a=i/12*TAU;c.fillStyle='#9b89604d';c.fillRect(q.x+Math.cos(a)*q.r*.48-4,q.y+Math.sin(a)*q.r*.48-4,8,8)}}}
  return layer}
 makeDecor(){const random=rng(0x62727574),add=(index,x,y,size,alpha=.78,angle=0)=>this.items.push({index,x,y,size,alpha,angle});
  // Natural clusters instead of uniform scatter.
  for(let cluster=0;cluster<76;cluster++){const cx=70+random()*(B.map-140),cy=70+random()*(B.map-140),road=distanceToPaths(cx,cy),count=2+Math.floor(random()*5),dense=REGIONS.find(r=>r.kind==='dense'&&Math.hypot((cx-r.x)/r.rx,(cy-r.y)/r.ry)<1),swamp=cx<850&&cy>1500,dry=cx>1550&&cy>1500;for(let i=0;i<count;i++){let index=dry?(random()<.55?12:7):swamp?(random()<.58?11:2):dense?(random()<.5?2:random()<.7?3:6):Math.floor(random()*10);if(road.distance<road.width*.8)index=random()<.55?5:random()<.7?6:7;add(index,cx+(random()-.5)*125,cy+(random()-.5)*90,18+random()*28,.5+random()*.35,(random()-.5)*.5)}}
  // Fields, wet reeds and storytelling landmarks.
  for(let i=0;i<70;i++){const a=random()*TAU,r=80+Math.sqrt(random())*330;add(random()<.58?1:random()<.82?0:4,1200+Math.cos(a)*r,1200+Math.sin(a)*r,22+random()*26,.48+random()*.25)}
  for(let i=0;i<28;i++){const a=random()*TAU,r=120+random()*180;add(11,420+Math.cos(a)*r,1840+Math.sin(a)*r*.45,26+random()*25,.6)}
  [[14,660,1020,48],[13,790,1090,52],[10,480,560,60],[15,2050,500,48],[14,1870,1830,48],[13,2020,1960,55]].forEach(v=>add(v[0],v[1],v[2],v[3],.9));
 }
 draw(c,visible){if(this.layer)c.drawImage(this.layer,0,0,B.map,B.map);if(!this.decor?.naturalWidth)return;for(const d of this.items){if(!visible(d))continue;const rect=DECOR_RECTS[d.index];c.save();c.globalAlpha=d.alpha;c.translate(d.x,d.y);c.rotate(d.angle);c.drawImage(this.decor,...rect,-d.size/2,-d.size/2,d.size,d.size);c.restore()}}
 drawTreeBase(c,e,visible){if(!visible(e))return;c.save();c.globalAlpha=.5;c.fillStyle='#4d3927';c.beginPath();c.ellipse(e.x,e.y+15,35+(e.id%9),15,0,0,TAU);c.fill();c.strokeStyle='#72523a';c.lineWidth=3;for(let i=0;i<3;i++){const a=(e.id*.9+i*2.1)%TAU;c.beginPath();c.moveTo(e.x,e.y+13);c.quadraticCurveTo(e.x+Math.cos(a)*24,e.y+20+Math.sin(a)*8,e.x+Math.cos(a)*42,e.y+20+Math.sin(a)*12);c.stroke()}c.restore()}
}
