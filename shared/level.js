export const CLEARINGS=Object.freeze([
 {x:1200,y:1200,r:260,kind:'arena'},
 {x:430,y:480,r:170,kind:'grove'},
 {x:1980,y:430,r:185,kind:'shrine'},
 {x:1930,y:1900,r:175,kind:'ruins'},
 {x:520,y:1840,r:150,kind:'marsh'}
]);
export const PATHS=Object.freeze([
 {kind:'main',width:92,points:[[70,1390],[360,1120],[720,1080],[1020,1260],[1200,1200],[1450,1040],[1740,790],[2050,430],[2360,250]]},
 {kind:'main',width:78,points:[[160,2220],[500,1840],[760,1510],[1020,1260],[1380,1370],[1660,1640],[1930,1900],[2300,2130]]},
 {kind:'trail',width:45,points:[[430,480],[610,720],[720,1080]]},
 {kind:'trail',width:42,points:[[1200,1200],[1310,820],[1570,520],[1980,430]]},
 {kind:'trail',width:38,points:[[520,1840],[820,1780],[1120,1510],[1380,1370]]},
 {kind:'hidden',width:24,points:[[1930,1900],[2120,1590],[2220,1240],[2130,900],[1980,430]]}
]);
export const REGIONS=Object.freeze([
 {x:330,y:360,rx:500,ry:430,kind:'dense'},
 {x:2050,y:330,rx:430,ry:370,kind:'mountain'},
 {x:430,y:1900,rx:470,ry:390,kind:'swamp'},
 {x:1990,y:1990,rx:500,ry:430,kind:'dry'},
 {x:1200,y:1200,rx:590,ry:500,kind:'field'}
]);
function segmentDistance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/l)):0;return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)}
export function distanceToPaths(x,y){let best=Infinity,width=0,kind='';for(const path of PATHS)for(let i=1;i<path.points.length;i++){const d=segmentDistance(x,y,path.points[i-1],path.points[i]);if(d<best){best=d;width=path.width;kind=path.kind}}return {distance:best,width,kind}}
export function treeAllowed(x,y){if(CLEARINGS.some(c=>Math.hypot(x-c.x,y-c.y)<c.r))return false;const road=distanceToPaths(x,y);return road.distance>road.width*.62+22}
