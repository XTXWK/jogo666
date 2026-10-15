import {EVOLUTION as E} from './progression.js';
export const BALANCE = Object.freeze({ map:2400, tick:30, snapshot:15, hp:120, speed:245, damage:24, orbit:88, orbitSpeed:3.2, axes:1, maxAxes:8, innerRadius:48, innerMaxAxes:6, innerSpeed:4.4, innerDamage:.7, crit:.03, critMax:.75, critMult:2, magnet:165, xpSpeed:640, xpNeed:22, xpGrowth:1.17, maxMobs:110, maxDrops:450, treeCount:150, bossAt:120, spawnGrace:3, maxParticles:450 });
export const MODES={arena:{name:'Arena 15 min',duration:900,respawn:3,cap:16},infinite:{name:'Topo infinito',duration:0,respawn:5,cap:20},closing:{name:'Hora do fechamento',duration:0,respawn:8,cap:12}};
export const ABILITIES={
 rebirth:{name:'Renascimento',icon:'✦',cd:0,automatic:true,description:'Ocupa um slot. Ao morrer, renasça com 50% de vida e 3s de proteção. Uma vez por caçada.'},
 hurricane:{name:'Furacão de machados',icon:'🌪',cd:E.hurricaneCooldown,description:'Órbitas 3× mais rápidas e +60% de dano orbital por 6s.'},
 throw:{name:'Arremesso',icon:'🪓',cd:6,description:'Lança automaticamente um machado no inimigo mais próximo.'},
 expand:{name:'Expansão',icon:'◎',cd:13,description:'Órbita 70% maior por 5 segundos.'},
 shout:{name:'Grito brutal',icon:'◉',cd:11,description:'Uma onda de dano e repulsão.'},
 fury:{name:'Fúria',icon:'♨',cd:20,description:'Mais movimento e órbita por 7 segundos.'},
 magnet:{name:'Ímã brutal',icon:'✧',cd:18,description:'Recolha XP de uma enorme região.'},
 roots:{name:'Raízes',icon:'♧',cd:14,description:'Prenda inimigos próximos por 4 segundos.'},
 vortex:{name:'Redemoinho',icon:'🌀',cd:16,description:'Puxe inimigos para seus machados.'},
 totem:{name:'Totem',icon:'♜',cd:22,description:'Um guardião ataca por 12 segundos.'},
 execute:{name:'Execução',icon:'⚔',cd:10,description:'Um golpe devastador à sua frente.'},
 axe_burst:{name:'Explosão de machados',icon:'✹',cd:14,description:'Dispara 16 machados giratórios em todas as direções.'}
};
export const RARITIES={common:{name:'Comum',color:'#b1b8ad',weight:54},uncommon:{name:'Incomum',color:'#77d28e',weight:26},rare:{name:'Rara',color:'#70b6f3',weight:13},epic:{name:'Épica',color:'#c697fa',weight:5},legendary:{name:'Lendária',color:'#ffc86b',weight:1.3},cursed:{name:'Amaldiçoada',color:'#fa6972',weight:1.8}};
const card=(id,name,rarity,icon,description,apply,eligible=()=>true)=>({id,name,rarity,icon,description,apply,eligible});
const owned=(p,id)=>!!p.build[id]; const hp=(p,m)=>{p.maxHp=Math.max(25,p.maxHp*m);p.hp=Math.min(p.hp,p.maxHp)};
export const CARDS=[
card('blade','Lâmina afiada','common','⚔','+12% de dano. Corte mais fundo.',p=>p.damage*=1.12),
card('speed','Órbita veloz','common','↻','+10% de velocidade orbital.',p=>p.spin*=1.1),
card('reach','Cabo longo','common','◎','+8% de raio. Controle mais espaço.',p=>p.orbit*=1.08),
card('heavy','Machado pesado','uncommon','🪓','+25% dano · −8% velocidade orbital.',p=>{p.damage*=1.25;p.spin*=.92}),
card('light','Machado leve','uncommon','➶','+20% velocidade orbital · −8% dano.',p=>{p.spin*=1.2;p.damage*=.92}),
card('axe','Machado extra','rare','🪓','+1 machado na órbita.',p=>p.axes++,p=>p.axes<BALANCE.maxAxes),
card('giant','Lâmina gigante','uncommon','⚒','+25% tamanho dos machados.',p=>p.size*=1.25,p=>p.size<2.5),
card('impact','Impacto brutal','uncommon','◈','Golpes empurram os inimigos.',p=>p.knock+=22),
card('ricochet','Ricochete','epic','✦','Machados têm 35% de chance de rebater tiros inimigos. Novas cartas aumentam até 75%.',p=>p.ricochet=Math.min(.75,p.ricochet+(p.ricochet?.2:.35)),p=>p.ricochet<.75),
card('bleed','Machado serrilhado','rare','〽','Golpes causam sangramento por 3s.',p=>p.bleed+=3),
card('double','Órbita dupla','rare','◎','Uma órbita interna fixa com 1 machado. Protege de inimigos que atravessam a órbita maior.',p=>{p.innerAxes=1;p.innerSpin=BALANCE.innerSpeed;p.innerDamage=BALANCE.innerDamage},p=>!p.innerAxes),
card('inneraxe','Guarda reforçada','uncommon','🪓','+1 machado só na órbita interna. Máximo 6.',p=>p.innerAxes++,p=>p.innerAxes>0&&p.innerAxes<BALANCE.innerMaxAxes),
card('innerdamage','Corte de defesa','uncommon','⚔','+20% dano só da órbita interna.',p=>p.innerDamage*=1.2,p=>p.innerAxes>0),
card('innerspeed','Guarda veloz','uncommon','↻','+15% velocidade só da órbita interna.',p=>p.innerSpin*=1.15,p=>p.innerAxes>0),
card('king','Rei dos machados','legendary','♛','+2 machados · +30% dano. Limite +2.',p=>{p.axes=Math.min(12,p.axes+2);p.damage*=1.3}),
card('eye','Olho do carrasco','uncommon','◉','+5 pontos de chance de crítico.',p=>p.crit=Math.min(.75,p.crit+.05),p=>p.crit<.75),
card('critical','Golpe brutal','rare','✦','+0,30× multiplicador de crítico.',p=>p.critMult+=.3),
card('precision','Precisão mortal','epic','⌖','+10 pontos de crítico · −8% dano.',p=>{p.crit=Math.min(.75,p.crit+.1);p.damage*=.92},p=>p.crit<.75),
card('freeze','Machado congelante','rare','❄','Críticos têm +28% de chance de congelar por 4s.',p=>p.freeze=Math.min(.85,p.freeze+.28),p=>p.freeze<.85),
card('fire','Machado de fogo','rare','🔥','Críticos têm +28% de chance de incendiar por 4s. Queima causa 30% do dano por segundo.',p=>p.fire=Math.min(E.fireMax,p.fire+E.fireChance),p=>p.fire<E.fireMax),
card('luck','Sorte da floresta','uncommon','☘','+20% de sorte: aumenta o peso de cartas raras, épicas e lendárias. Não altera críticos.',p=>p.luck=Math.min(E.luckMax,p.luck+E.luckStep),p=>p.luck<E.luckMax),
card('shatter','Estilhaçar','rare','❖','+40% dano contra alvos congelados.',p=>p.shatter+=.4,p=>p.freeze>0),
card('winter','Inverno brutal','legendary','❄','Alvos congelados explodem e espalham gelo.',p=>p.winter=true,p=>p.freeze>0&&p.shatter>0&&p.crit>=.25&&!p.winter),
card('sawmill','Serraria','legendary','⚙','Órbita +70%, lâminas menores, hits mais frequentes.',p=>{p.sawmill=true;p.spin*=1.7;p.size*=.75},p=>p.axes>=5&&owned(p,'speed')&&!p.sawmill),
card('berserker','Berserker','legendary','♨','Abates prolongam Fúria em 0,5s.',p=>p.berserker=true,p=>p.active.includes('fury')&&p.damage>=40&&p.spin>=4&&!p.berserker),
card('horizon','Event horizon','legendary','◉','Expansão amplifica alcance do Redemoinho.',p=>p.horizon=true,p=>p.active.includes('expand')&&p.active.includes('vortex')&&!p.horizon),
card('reroll','Segunda chance','rare','↻','Receba 1 reroll para escolhas de cartas.',p=>p.rerolls++),
card('bark','Casca grossa','common','⬡','+25 vida máxima e cura 25.',p=>{p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+25)}),
card('vitality','Vitalidade','uncommon','♥','+20% vida máxima e atual.',p=>{p.maxHp*=1.2;p.hp*=1.2}),
card('rest','Cura de descanso','rare','☘','Parado 3s e fora de combate 5s: cura 25%. Recarga 18s.',p=>p.rest=true,p=>!p.rest),
card('heal','Regeneração instantânea','legendary','✚','Restaure toda a vida imediatamente.',p=>p.hp=p.maxHp),
card('breath','Último suspiro','uncommon','➶','Abaixo de 20% de vida: +25% movimento.',p=>p.breath=true,p=>!p.breath),
card('shield','Escudo de madeira','epic','⬡','Bloqueia um golpe a cada 14 segundos.',p=>p.shield=true,p=>!p.shield),
card('vampire','Vampirismo','rare','♥','Recupere 2 de vida por inimigo abatido.',p=>p.vamp+=2),
card('companion','Lobo companheiro','rare','🐺','Invoca um único lobo. Ele segue você, descansa e cospe bolas de fogo sem correr até os inimigos.',p=>p.companionPending=true,p=>!p.companionAlive&&!p.companionPending),
card('wolf_flame','Presa de brasa','uncommon','🔥','Bolas de fogo do lobo causam +35% de dano.',p=>p.companionDamage*=1.35,p=>p.companionAlive||p.companionPending),
card('wolf_haste','Fôlego lupino','rare','🐺','O lobo atira 25% mais rápido e descansa por menos tempo.',p=>{p.companionCooldown*=.75;p.companionRest=Math.max(.8,p.companionRest-.4)},p=>p.companionAlive||p.companionPending),
card('wolf_guard','Couro rúnico','uncommon','⬡','+60 de vida para o lobo e cura completa.',p=>p.companionHp+=60,p=>p.companionAlive||p.companionPending),

card('magnet','Ímã de XP','common','✧','+30% raio de atração de XP.',p=>p.magnet*=1.3),
card('learning','Aprendizado rápido','common','✦','+10% XP recebido.',p=>p.xpBonus+=.1),
card('glutton','Gula','uncommon','✧','+20% atração · +5% XP.',p=>{p.magnet*=1.2;p.xpBonus+=.05}),
card('wisdom','Sabedoria perigosa','rare','◈','+20% XP · −10% vida máxima.',p=>{p.xpBonus+=.2;hp(p,.9)}),
card('blackhole','Buraco negro','legendary','◉','Raio de atração de XP +800.',p=>p.magnet+=800),
card('blood','Pacto de sangue','cursed','♥','+70% dano · −30% vida máxima.',p=>{p.damage*=1.7;hp(p,.7)}),
card('madness','Loucura do lenhador','cursed','⚒','+2 machados · +35% órbita · −20% vida.',p=>{p.axes=Math.min(12,p.axes+2);p.spin*=1.35;hp(p,.8)}),
card('greed','Ganância','cursed','✧','+40% XP · recebe 25% mais dano.',p=>{p.xpBonus+=.4;p.received*=1.25}),
card('glass','Vidro quebrado','cursed','❖','+1× dano crítico · −40% vida máxima.',p=>{p.critMult+=1;hp(p,.6)}),
...Object.entries(ABILITIES).map(([id,a])=>card('a_'+id,a.name,id==='rebirth'?'legendary':'rare',a.icon,a.description,p=>p.active.push(id),p=>!p.active.includes(id)&&(id!=='rebirth'||!p.build.a_rebirth))),
card('throwplus','Arremesso múltiplo','rare','🪓','+1 projétil. Máximo 3.',p=>p.throwCount++,p=>p.active.includes('throw')&&p.throwCount<3),
card('pierce','Perfuração','rare','➶','Arremessos atravessam +2 alvos.',p=>p.pierce+=2,p=>p.active.includes('throw')),
card('boomerang','Bumerangue','epic','↶','Machados arremessados voltam.',p=>p.boomerang=true,p=>p.active.includes('throw')&&!p.boomerang),
card('explosive','Arremesso explosivo','epic','✹','Machados arremessados explodem no impacto.',p=>p.explosive=true,p=>p.active.includes('throw')&&!p.explosive),
card('storm','Tempestade de machados','legendary','✹','Arremesso lança 12 machados ao redor.',p=>p.storm=true,p=>p.active.includes('throw')&&!p.storm),
card('relic_ent','Relíquia · Coração do Ent','cursed','♥','+40% vida máxima, mas sua regeneração para.',p=>{p.maxHp*=1.4;p.hp*=1.4;p.noRegen=true;p.relics.push('Coração do Ent')},p=>p.choiceKind==='relic'&&!p.relics.includes('Coração do Ent')),
card('relic_eye','Relíquia · Olho da Centopeia','cursed','◉','Revela a Centopeia enterrada, mas você recebe +18% de dano.',p=>{p.seeBurrowed=true;p.received*=1.18;p.relics.push('Olho da Centopeia')},p=>p.choiceKind==='relic'&&!p.relics.includes('Olho da Centopeia')),
card('relic_hungry','Relíquia · Machado Faminto','cursed','🪓','Cada abate aumenta seu machado, mas consome 1 de vida.',p=>{p.hungryAxe=true;p.relics.push('Machado Faminto')},p=>p.choiceKind==='relic'&&!p.relics.includes('Machado Faminto')),
card('relic_crown','Relíquia · Coroa do Lenhador','cursed','♛','Árvores dão recompensa dobrada, mas sua posição fica marcada.',p=>{p.woodCrown=true;p.relics.push('Coroa do Lenhador')},p=>p.choiceKind==='relic'&&!p.relics.includes('Coroa do Lenhador')),
card('relic_void','Relíquia · Ídolo do Vazio','cursed','◎','Cria uma segunda órbita, mas reduz 20% da velocidade dos machados.',p=>{p.innerAxes=Math.max(1,p.innerAxes);p.innerSpin=BALANCE.innerSpeed;p.spin*=.8;p.relics.push('Ídolo do Vazio')},p=>p.choiceKind==='relic'&&!p.relics.includes('Ídolo do Vazio'))
];
export const CARD_BY_ID=Object.fromEntries(CARDS.map(c=>[c.id,c]));
export function cardWeight(c,p){const bonus={rare:1,epic:2,legendary:3}[c.rarity]||0,luck=(p.luck||0)+(p.eventLuck||0);return (c.id==='axe'?2.5:1)*RARITIES[c.rarity].weight*(1+luck*bonus)/CARDS.filter(x=>x.rarity===c.rarity).length}
export function rollCards(p,rng=Math.random){const pool=CARDS.filter(c=>!c.id.startsWith('relic_')&&c.eligible(p));const out=[];while(out.length<3&&pool.length){const weights=pool.map(c=>cardWeight(c,p));let x=rng()*weights.reduce((a,b)=>a+b,0),i=0;for(;i<weights.length-1;i++){x-=weights[i];if(x<=0)break}out.push(pool.splice(i,1)[0].id)}if(p.level===2&&!p.active.length){out[0]=['a_expand','a_throw','a_shout'][Math.floor(rng()*3)];if(out[1]===out[0])out[1]='blade';if(out[2]===out[0]||out[2]===out[1])out[2]='bark'}return out}
