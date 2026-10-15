import test from 'node:test';
import assert from 'node:assert/strict';
import {skillTree} from '../client/src/skill-tree.js';
import {CARD_BY_ID,RARITIES} from '../shared/content.js';

const art=id=>`background-image:url(${id})`;
test('skill tree keeps undiscovered branches as question marks and reveals owned roots',()=>{
 const player={active:['throw'],build:{a_throw:1},damage:24,axes:1,innerAxes:0,crit:0.03,freeze:0,fire:0,active: ['throw']};
 const html=skillTree(player,CARD_BY_ID,RARITIES,art);
 assert.match(html,/ARREMESSO/);assert.match(html,/Arremesso múltiplo/);assert.match(html,/PRÓXIMA ESCOLHA/);assert.match(html,/LOBO COMPANHEIRO/);assert.match(html,/DESCONHECIDO/);
});

test('skill tree shows direct active abilities even without upgrade branches',()=>{
 const player={active:['roots'],build:{a_roots:1},damage:24,axes:1,innerAxes:0,crit:0.03,freeze:0,fire:0};
 const html=skillTree(player,CARD_BY_ID,RARITIES,art);
 assert.match(html,/HABILIDADES DESBLOQUEADAS/);assert.match(html,/Raízes/);assert.match(html,/OBTIDO/);
});
