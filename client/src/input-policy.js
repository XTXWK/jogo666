export function movementBlocked({paused=false,dialogOpen=false,dialogKind='',solo=true}={}){
 return paused||(dialogOpen&&!(dialogKind==='cards'&&solo===false));
}

export function multiplayerCardShortcut(key,choices=[],solo=true){
 if(solo!==false||!Array.isArray(choices)||!['1','2','3'].includes(key))return null;
 return choices[Number(key)-1]||null;
}
