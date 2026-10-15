// Each branch mirrors real eligibility from shared/content.js.  This is a
// readable map of the build, not a second progression system.
export const UPGRADE_BRANCHES=[
 {title:'ARREMESSO',root:'a_throw',nodes:[['a_throw'],['throwplus','pierce'],['boomerang','explosive'],['storm']]},
 {title:'ÓRBITA INTERNA',root:'double',nodes:[['double'],['inneraxe','innerdamage','innerspeed']]},
 {title:'CRÍTICO ELEMENTAL',root:'eye',nodes:[['eye','critical','precision'],['freeze','fire'],['shatter'],['winter']]},
 {title:'FÚRIA DO BERSERKER',root:'a_fury',nodes:[['a_fury'],['blade','speed'],['berserker']]},
 {title:'HORIZONTE',root:'a_expand',nodes:[['a_expand','a_vortex'],['horizon']]},
 {title:'LOBO COMPANHEIRO',root:'companion',nodes:[['companion'],['wolf_flame','wolf_haste','wolf_guard']]},
 {title:'MESTRE DOS MACHADOS',root:'blade',nodes:[['blade','heavy','light','giant','impact'],['bleed','axe'],['king','sawmill']]},
 {title:'SOBREVIVÊNCIA',root:'bark',nodes:[['bark','vitality'],['rest','breath','shield','vampire'],['heal']]},
 {title:'COLHEITA DE XP',root:'magnet',nodes:[['magnet','learning'],['glutton','wisdom'],['blackhole']]}
];

// Coordinates match the rune circles in skill-tree-pixel-v1.png. These are the
// first roots a player can discover; their complete upgrade paths render below.
const ROOT_POSITIONS=[[50,14],[17,29],[83,29],[11,52],[35,45],[65,45],[89,52],[34,77],[66,77]];

function amount(player,id){return player.build?.[id]||((id.startsWith('a_')&&player.active?.includes(id.slice(2)))?1:0)}
function state(player,card,id){const owned=amount(player,id);if(owned)return {kind:'owned',label:owned>1?`NÍVEL ${owned}`:'OBTIDO'};return card.eligible(player)?{kind:'available',label:'PRÓXIMA ESCOLHA'}:{kind:'locked',label:'BLOQUEADA'}}

export function skillTree(player,cardById,rarities,cardArt){
 const mapped=new Set(UPGRADE_BRANCHES.flatMap(branch=>branch.nodes.flat()));
 const direct=(player.active||[]).map(id=>'a_'+id).filter(id=>!mapped.has(id));
 const branches=[...UPGRADE_BRANCHES];
 if(direct.length)branches.push({title:'HABILIDADES DESBLOQUEADAS',root:direct[0],nodes:[direct]});
 const map=UPGRADE_BRANCHES.map((branch,index)=>{const card=cardById[branch.root],node=state(player,card,branch.root),color=rarities[card.rarity].color,[x,y]=ROOT_POSITIONS[index];return `<div class="tree-map-node ${node.kind}" style="--node-color:${color};--x:${x}%;--y:${y}%" title="${card.name}: ${card.description}"><i style="${cardArt(card.id)}" aria-hidden="true"></i><span>${node.kind==='owned'?'✓':''}</span></div>`}).join('');
 return `<section class="tree-legend"><span class="legend-owned">● OBTIDO</span><span class="legend-available">● PODE EVOLUIR</span><span class="legend-secret">● AINDA NÃO POSSUI</span></section><section class="tree-map" aria-label="Raízes da árvore de habilidades"><div class="tree-map-title">RAÍZES DESCOBERTAS</div>${map}</section><section class="skill-tree" aria-label="Evoluções das habilidades">${branches.map(branch=>{
   const unlocked=branch.nodes.flat().some(id=>amount(player,id));
   return `<article class="tree-branch ${unlocked?'unlocked':'undiscovered'}"><header><span></span><b>${branch.title}</b><span></span></header><div class="tree-path">${branch.nodes.map((tier,index)=>`<div class="tree-tier" data-tier="${index}">${tier.map(id=>{
     const card=cardById[id];if(!card)return '';
     if(!unlocked)return `<div class="tree-node secret" title="Encontre a carta raiz desta habilidade para revelar este galho."><i aria-hidden="true">?</i><strong>DESCONHECIDO</strong><small>ENCONTRE A RAIZ</small></div>`;
     const node=state(player,card,id),color=rarities[card.rarity].color;
     return `<div class="tree-node ${node.kind}" style="--node-color:${color}" title="${card.description}"><i style="${cardArt(card.id)}" aria-hidden="true"></i><strong>${card.name}</strong><small>${node.label}</small></div>`;
   }).join('')}</div>`).join('')}</div></article>`;
 }).join('')}</section>`;
}
