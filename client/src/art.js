export const TYPES=['crawler','runner','tank','shooter','lumber','dasher','volatile','elite','warden','hexer','bramble','scatter','ent','corrupt','spirit','player'];
// The generated atlas has uneven gutters. Explicit source bounds keep neighbors
// out of each sprite and preserve tall crowns instead of assuming square cells.
export const CHARACTER_RECTS=[[5,25,323,282],[376,0,233,309],[627,0,343,309],[993,0,261,309],[12,314,290,284],[368,310,250,285],[642,311,290,290],[976,310,278,299],[23,599,288,304],[338,595,279,319],[654,598,286,305],[966,608,288,312],[0,886,386,368],[328,914,337,340],[665,903,302,351],[985,918,269,336]];
export function spriteArt(type){if(type==='centipede')return `background-image:url('/art/centipede-boss.webp');background-size:contain;background-position:center;background-repeat:no-repeat`;const i=TYPES.indexOf(type),[x,y,w,h]=CHARACTER_RECTS[Math.max(0,i)];return `background-size:${1254/w*100}% ${1254/h*100}%;background-position:${x/(1254-w)*100}% ${y/(1254-h)*100}%`}
export const ENEMIES={
 crawler:['Raiz rastejante','Persegue e ataca de perto.','#8fba66'],runner:['Lobo do breu','Muito rápido e frágil.','#80bfed'],tank:['Golem musgoso','Lento, resistente e perigoso de perto.','#cab58e'],shooter:['Arqueiro espectral','Mantém distância. Dispara flechas douradas.','#f6c46c'],lumber:['Lenhador renegado','Arremessa machados giratórios.','#e6a27b'],dasher:['Javali de guerra','Prepara uma investida em linha reta.','#ffa274'],volatile:['Cogumelo brasa','Explode após morrer. Saia do círculo.','#ff8344'],elite:['Espinho real','Combatente de elite resistente e agressivo.','#de87d2'],warden:['Guardião de casca','Intermediário. Marca três explosões de raízes.','#e9c566'],hexer:['Arauto das cinzas','Intermediário. Dispara uma roda de orbes violetas.','#ca8eff'],bramble:['Xamã espinheiro','Marca raízes sob seus pés.','#a8d573'],scatter:['Cuspidor abissal','Lança três gotas de veneno em leque.','#55f0bf'],ent:['Ent ancião','Chefe. Raízes em sequência e invocações.','#d5c086'],corrupt:['Lenhador corrompido','Chefe. Machados radiais e investidas.','#ff836d'],spirit:['Espírito da floresta','Chefe. Orbes de gelo, teleporte e cerco.','#70e5ff'],centipede:['Centopeia abissal','Chefe. Cava, persegue pelo subsolo e irrompe sob os jogadores.','#e18748']};
const skillIds=['fire','freeze','luck','a_rebirth','a_hurricane','double','learning','a_throw','a_expand','a_shout','a_fury','a_magnet','a_roots','a_vortex','a_totem','a_execute'];
const sheets={
 'passives-a':['blade','speed','reach','heavy','light','axe','giant','impact','bleed','inneraxe','innerdamage','innerspeed','king','eye','critical','precision'],
 'passives-b':['shatter','winter','sawmill','berserker','horizon','reroll','bark','vitality','rest','heal','breath','shield','vampire','magnet','glutton','wisdom'],
 'passives-c':['blackhole','blood','madness','greed','glass','throwplus','pierce','boomerang','explosive','storm']
};
export function cardArt(id){if(id==='ricochet')return `background-image:url('/art/ricochet.webp');background-size:cover;background-position:center`;if(id==='companion')return `background-image:url('/art/companion-card.webp');background-size:cover;background-position:center`;let file='skills',i=skillIds.indexOf(id);if(i<0)for(const [sheet,ids]of Object.entries(sheets)){const found=ids.indexOf(id);if(found>=0){file=sheet;i=found;break}}i=Math.max(0,i);const row=Math.floor(i/4),col=i%4;
 if(file==='skills'||file==='passives-b'){const ys=file==='skills'?[0,314,601,889,1254]:[0,314,620,911,1254],h=ys[row+1]-ys[row];return `background-image:url('/art/${file}.webp');background-size:400% ${1254/h*100}%;background-position:${col/3*100}% ${ys[row]/(1254-h)*100}%`}
 return `background-image:url('/art/${file}.webp');background-size:400% 400%;background-position:${col/3*100}% ${row/3*100}%`;
}
export function enemyGuide(){return '<div class="bestiary-grid">'+Object.entries(ENEMIES).map(([id,[name,desc,color]])=>`<article class="bestiary-entry" style="--enemy-color:${color}"><div class="bestiary-art" style="${spriteArt(id)}"></div><h3>${name}</h3><p>${desc}</p></article>`).join('')+'</div>'}
export const DIRECTIONAL_GROUPS={
 player:['player'],
 companion:['companion'],
 'enemies-a':['crawler','runner','tank','shooter'],
 'enemies-b':['lumber','dasher','volatile','elite'],
 'enemies-c':['warden','hexer','bramble','scatter'],
 bosses:['ent','corrupt','spirit']
};
export function directionalSheet(type){for(const [sheet,types]of Object.entries(DIRECTIONAL_GROUPS)){const row=types.indexOf(type==='rival'?'player':type);if(row>=0)return {sheet,row,rows:types.length}}return null}
export function directionIndex(angle){return ((Math.round((angle-Math.PI/2)/(Math.PI/4))%8)+8)%8}
export function loadArt(){const images={};for(const name of ['characters','ground','trees-v8','forest-decor','props','axe-skins','directions-player','directions-companion','directions-enemies-a','directions-enemies-b','directions-enemies-c','directions-bosses','centipede-boss']){const image=new Image();image.src='/art/'+name+'.webp';images[name.replace('directions-','').replace('trees-v8','trees').replace('centipede-boss','centipede')]=image}return images}
