# Raiz Bruta Arena — Edição Renascida (0.2)

Uma reconstrução jogável da primeira versão, com direção visual de floresta ancestral, combate automático orbital e builds roguelike. A versão hospedada abre diretamente no navegador, sem instalação.

## O que está disponível no link

**Sobrevivência solo completa:** iniciar, combater, coletar XP, escolher cartas, desbloquear até cinco habilidades, enfrentar bosses, morrer e tentar novamente. O recorde solo fica neste navegador. Não é um ranking online nem prova anti-cheat.

**Multiplayer:** cliente de conexão e servidor Node real estão implementados e testados com duas conexões WebSocket. O servidor NÃO é executado pela hospedagem estática deste Site. Para PvP pela internet é necessário hospedar `server/main.mjs` e informar seu endereço `wss://.../ws` na interface. A UI explica isso antes de conectar; não simula jogadores nem afirma uma conexão inexistente.

## Controles

WASD move. O corpo não gira. A seta separada segue o movimento pelo menor arco e desaparece ao parar. Mouse mira habilidades. Roda ajusta zoom 0,75–1,6. Teclas 1–5 usam ativas adquiridas. B mostra build; Esc abre menu. Em dispositivos com toque há controle virtual e botões de habilidade.

No solo, cartas e menu pausam. Multiplayer não pausa o mundo e o menu não concede invulnerabilidade. Essa diferença evita que abrir uma escolha vire uma forma de fugir de ataques.

## Loop e conteúdo

- 59 cartas: melhorias de órbita, dano, crítico, vida, XP, ativas, arremesso, cartas amaldiçoadas e sinergias condicionais. O grimório mostra o catálogo real.
- Órbita dupla agora desbloqueia uma órbita interna passiva: raio fixo 48, 1 machado inicial, rotação contrária e 70% do dano base. Guarda reforçada adiciona machados internos até 6; Corte de defesa e Guarda veloz melhoram apenas essa órbita. Alcance e Expansão nunca alteram seu raio.
- 11 habilidades automáticas com lógica funcional: Renascimento, Furacão de machados, Arremesso, Expansão, Grito brutal, Fúria, Ímã brutal, Raízes, Redemoinho, Totem e Execução.
- Inverno brutal, Serraria, Berserker e Event horizon dependem de pré-requisitos reais.
- Arremesso múltiplo (máximo 3), perfuração, bumerangue, explosão e Tempestade de machados.
- Crítico base 3%, multiplicador 2×, chance máxima 75%. Congelamento só após crítico e segundo sorteio, até 85%.
- XP físico com dispersão, atração, velocidade máxima, parada rápida fora do raio, coleta única e limites de quantidade com conservação de valor.
- Reroll inicial zero; carta Segunda chance concede uma carga. Nunca há botões de habilidades bloqueadas.
- PvE: comum, rápido, tanque, atirador, lenhador, dasher com aviso, explosivo e elite.
- Três bosses em sequência a cada 2 minutos: Ent (raízes e invocações), Corrompido (rajada de machados e avanço) e Espírito (rajadas radiais e teleporte). Vida abaixo de 50% acelera seus ataques.
- Árvores destrutíveis, fumaça/fragmentos, impactos, números de dano, raios, trilhas, brilhos, ondas e áudio sintetizado via Web Audio, sem precisar baixar arquivos sonoros.
- Arena 15 min com fim único, Topo infinito e Hora do fechamento no servidor. Empate de kills usa dano e depois menos mortes. Respawn 3/5/8 segundos, proteção de 3s e busca de posições afastadas. Morte nos modos infinitos remove XP parcial, preservando a build.

### Decisões de ritmo

Primeiro level-up garante uma opção de habilidade para introduzir controles sem esperar sorte excessiva. Cada nível cura 12% da vida máxima. O primeiro jogador nasce na clareira central. Raridades subsequentes são ponderadas, sem garantia de lendária. O objetivo é diversão e domínio de builds; não há monetização, compra de vantagem ou mecânicas de gasto compulsivo.

## Arquitetura

| Módulo | Responsabilidade |
|---|---|
| `shared/content.js` | Configuração central, cartas, pesos, elegibilidade e habilidades |
| `shared/simulation.js` | Mundo determinístico por seed, grid espacial, combate, XP, AI, modos |
| `client/src/app.js` | Ciclo do cliente, menus, cartas, HUD, teclado e toque |
| `client/src/renderer.js` | Render Canvas, sprites em cache, culling, partículas em pool |
| `client/src/network.js` | WebSocket, predição, ack/reconciliação, buffer de interpolação, reconexão |
| `client/src/audio.js` | Som sintetizado, mute e limitação de vozes por evento |
| `server/main.mjs` | Salas, autoridade, sessões, validações, limites e arquivos estáticos |
| `tests/` | Regressões da simulação e integração com dois sockets reais |

No solo a mesma simulação roda localmente, explicitamente sem alegação de autoridade remota. No multiplayer o navegador só envia input, escolha e pedido de habilidade. Vida, dano, crítica, XP, morte, ranking, relógio e cooldown vêm do servidor. O código antigo foi substituído; o ZIP 0.1 da conversa anterior não foi modificado.

## Desenvolver / executar localmente

Node 20+ e npm são necessários somente para desenvolver ou hospedar o servidor, não para jogar o solo publicado.

```sh
npm ci
npm run build
npm start
```

Abra `http://localhost:8787`. No multiplayer, use `ws://localhost:8787/ws` e entre no mesmo modo em duas abas. `npm run dev` inicia Vite para o solo; `npm run dev:full` inicia Vite e o servidor. O iniciador Windows conserva a janela aberta em caso de erro.

```sh
npm run check
npm test
```

## QA realizado

Atualização de órbita interna/HUD: testes automatizados aprovados, incluindo limpeza dos botões e efeitos ao recomeçar, interpolação sem alterar a simulação, dash sem arrasto de interpolação, dano real da órbita interna e independência de seus upgrades. A câmera acompanha a posição de exibição sem o atraso anterior. Isso não constitui validação de ghosting físico de monitores.

16 testes automáticos: direção WASD/diagonais, ângulos negativos/180°, XP não direto, frenagem, velocidade e coleta única; reroll; substituição/recusa; morte e kill únicas; congelamento condicionado; dez habilidades e cooldown; totem/raízes; pausa solo versus multiplayer; relógio/fim; boss não duplicado; sinergias/sorteio; grid; simulação de 15 minutos e reconexão/dano falso em dois sockets.

Também verificado no navegador: menu, início do solo, combate renderizado, primeiro level-up e interface de cartas. QA não equivale a teste de carga com 20 jogadores humanos ou certificação comercial.

## Limitações e próximos passos

- O PvP multiplayer não está hospedado neste link e requer servidor WSS. O ranking mundial solo usa Worker + D1 persistente, porém ainda não possui contas ou matchmaking global.
- Salas ficam em memória; reiniciar processo perde partidas. Retomada de conexão mantém jogador por 20 segundos no mesmo processo.
- Limites de mensagens, payload, conexões, input e habilidades reduzem abusos, mas não substituem autenticação, moderação, proteção DDoS e observabilidade de produção.
- Predição usa movimento básico; efeitos de movimento e colisões podem provocar correções visuais em redes ruins. Snapshots são JSON completos a 15 Hz, não delta binário nem relevância por jogador.
- Os bosses e builds precisam de balanceamento com jogadores reais. Não há promessa de retenção ou sucesso comercial.
- Há culling, cache de sprites, grid e pool de partículas; não há promessa de FPS em todo aparelho. O toque está implementado, ainda precisa de validação em celulares físicos.
- A seleção atual de elite não inclui os quatro modificadores da especificação original; lenhador usa contato, não órbita própria. Madeira como recurso, assists, partidas ranqueadas persistentes e port Steam são etapas futuras.

## Publicação

Veja `docs/DEPLOY.md`. O Site serve `dist`. O repositório conserva servidor e testes; não publica código de servidor como um serviço Node por engano.


## Atualização: fogo e escalada da caçada

- Machado de fogo: após um crítico, 28% de chance por cópia (máximo 85%) de aplicar 4 segundos de queimadura. Dano por segundo = 30% do dano base do atacante no momento da aplicação. Reaplicar renova o efeito, sem empilhar queimaduras; gelo e fogo podem coexistir.
- Sorte da floresta: +20% por cópia, até 200%. Multiplica os pesos de raras por (1+sorte), épicas por (1+2×sorte) e lendárias por (1+3×sorte), antes da normalização. Não garante raridade e não muda crítico ou amaldiçoadas.
- Renascimento substitui a antiga carta passiva Segunda vida. Ocupa um dos cinco slots, é automático e consome o slot ao disparar. Restaura 50% de HP com proteção de 3 segundos. Não gera morte, kill ou XP. Depois de adquirido, nunca volta ao pool da mesma caçada, inclusive se for substituído. Uma nova caçada permite encontrá-lo novamente.
- Furacão de machados: 6 segundos, velocidade orbital ×3 e dano orbital +60% nas duas órbitas, recarga de 24 segundos. Não aumenta dano de projéteis ou queimaduras.
- Ondas de 3 minutos durante toda a partida. Ao concluir cada onda, cada jogador recebe uma escolha entre 3 cartas diferentes; no solo, a ação pausa até a escolha. O relógio de simulação pausa nas cartas solo. Aumentam frequência e tamanho dos grupos, respeitando os limites de entidades para desempenho. No multiplayer, a escalada usa o relógio da sala.
- Intermediários aos 90 segundos e a cada 3 minutos: Guardião de casca (linhas de raízes com aviso) e Arauto das cinzas (rajada radial). Há espaço reservado no limite para intermediários. Bosses continuam separados e mais fortes.
- Novos inimigos: Espinheiro marca raízes no chão; Cuspidor atira em leque. Lenhadores agora arremessam machados/projéteis em linha.
- Dano produz vinheta vermelha e som próprio. Abaixo de 25% de HP, vinheta pulsa e coração bate. Efeitos param na pausa, morte e menu; respeitam som desligado e preferência por movimento reduzido.
- O menu Suas caçadas salva as últimas 20 partidas solo, com duração, nível, abates, dano, horda e build, neste navegador. Recorde de tempo permanece separado do limite de histórico. Superar o recorde mostra uma mensagem de parabéns na derrota. Sem conta ou sincronização entre dispositivos; limpar os dados do navegador remove os registros.
- QA: 42 testes automatizados cobrem as adições, incluindo duração do fogo, morte única por queimadura, renascimento com slots cheios, sorte, horários das hordas, ataques intermediários, histórico e feedback de dano. Os testes do renderizador usam Canvas simulado; não equivalem a uma validação visual em monitor real.


## Edição cartoon: combate automático e ranking mundial

Todos os inimigos têm arte e silhueta próprias, descritas no Bestiário. As 59 cartas possuem ilustrações, o chão e quatro árvores receberam texturas, e machados, XP e os disparos usam um atlas de objetos. Atiradores mostram clarão de saída e recuo; tiros têm cor, rastro e textura por tipo. Os personagens recebem balanço de movimento sem rotação do corpo. Os sprites são imagens com animação por transformação, não sequências completas de caminhada desenhadas quadro a quadro. As artes geradas e seus prompts estão em `client/public/art` e `docs/art`.

Dash foi removido do catálogo e da simulação. Habilidades adquiridas disparam automaticamente, cada uma respeitando seu alcance e cooldown, mirando o inimigo mais próximo. A mira não inclui árvores; sem inimigo ao alcance, a habilidade aguarda. Renascimento continua automático na morte. Teclas 1–5 e cliques nos slots não lançam habilidades. O peso de Machado extra é 2,5 vezes o anterior. O início tem 150 árvores do mapa e 8 próximas do jogador; árvores cortadas voltam após 45s em local livre. O dano de inimigos/ambiente começa 10% menor e aumenta suavemente até o normal aos 120s.

### Ranking mundial persistente

A hospedagem agora usa um Worker e D1, além dos arquivos do cliente. `.openai/hosting.json` mantém o mesmo projeto e declara a ligação lógica DB. Schema em `db/schema.ts`, migração gerada em `drizzle`. Nenhuma tabela é criada em runtime. A build limpa a saída antiga, gera `dist/client`, empacota `dist/server/index.js` e inclui metadados/migração.

Ao iniciar solo com conexão, o servidor emite uma seed e um ID de caçada. O cliente envia somente movimentos e escolhas, em lotes de até 150 ticks. O Worker refaz a simulação, valida relógio real, comandos, cooldowns, dano, XP e morte, e salva o resultado calculado em D1. Nunca aceita tempo de sobrevivência, HP ou score declarados pelo cliente. Lotes usam sequência e atualização condicional para evitar gravação dupla; repetição após resposta perdida é idempotente. Um cookie HttpOnly/Secure anônimo identifica o navegador. Apelidos são saneados e não são exclusivos. Não há conta ou recuperação desse identificador entre dispositivos. A lista pública mostra a melhor caçada de cada navegador nesta versão de regras. Mudar regras de gameplay exige mudar RULESET em `shared/solo.js`.

Sem conexão, o jogo continua local e avisa que não participa do ranking. O histórico local anterior é preservado; recordes antigos não são importados ao mundial porque não foram validados. Perda prolongada de conexão pode invalidar o envio daquela caçada. Partidas em andamento não podem ser retomadas após fechar a página; salvamento compartilhado é do resultado, não um checkpoint de campanha. A identificação anônima não impede múltiplas identidades, automação de inputs ou apelidos repetidos: o ranking valida o combate, mas não equivale a anti-bot completo. Dados de simulações abandonadas precisam de uma política futura de retenção/limpeza para escala comercial.

`npm run build` agora produz cliente + Worker. O servidor Node/WebSocket continua disponível para execução local e serve `dist/client`. O ranking D1 só funciona na hospedagem compatível; o desenvolvimento Vite sem Worker entra em modo local. O site público permanece sem PvP hospedado: ranking mundial não significa partidas multiplayer compartilhadas.

QA desta edição: replay em blocos com serialização, rejeição de score/HP/XP falsos e relógio acelerado, morte real e ranking compartilhado entre visitantes com SQLite, retries idempotentes, origem e proprietário da caçada, auto-mira, cooldown, ausência de alvo, árvores, dano inicial, regressões de explosões e carga de 15 minutos. Também foi renderizada e inspecionada uma cena com Canvas nativo e as imagens reais; não houve teste no navegador nesta atualização.


### Ricochete e recompensa de onda

Ricochete é uma carta épica ilustrada. A primeira cópia dá 35% de chance; as seguintes dão +20%, até 75%. Cada tiro testa uma única vez ao encostar em cada machado, evitando que vários frames transformem a chance em garantia. Quando reflete, o servidor troca a propriedade do projétil, procura um inimigo num raio de 700, recalcula direção/velocidade e aplica dano inimigo. Sem alvo, o tiro volta na direção oposta. O efeito usa faísca, flash, rastro dourado e som. O dano refletido é pelo menos 70% do dano base do jogador e preserva o dano do tiro quando ele for maior.

As ondas são numeradas desde a Onda 1 (0:00–3:00). Ao cruzar cada múltiplo de 180 segundos, o servidor coloca uma recompensa na fila de cada jogador vivo. Recompensas de nível e onda não se perdem quando acontecem juntas. No solo, a simulação pausa; no multiplayer, somente o jogador escolhe enquanto a sala continua. Cada tela oferece três cartas únicas e aceita apenas uma.

### Personagens em oito direções e leitura do chão

Player, inimigos comuns, intermediários e os três bosses agora possuem poses próprias para Sul, Sudoeste, Oeste, Noroeste, Norte, Nordeste, Leste e Sudeste. A simulação guarda a direção autoritativa do deslocamento; quando uma entidade para, ela conserva a última direção em vez de retornar para uma pose arbitrária. Inimigos que recuam usam a direção real do recuo. O renderizador troca a célula do atlas, sem girar a imagem inteira.

O chão foi substituído por uma grama fosca de baixo contraste com poucos detalhes, para que silhuetas e projéteis continuem legíveis durante ondas cheias. Cada inimigo recebe uma elipse luminosa discreta na cor da própria classe. Intermediários e bosses têm aura um pouco mais marcada, sem encobrir avisos de área, XP ou projéteis. Os cinco atlas direcionais ficam em `client/public/art/directions-*.webp`.

QA desta atualização: 46 testes aprovados. Os testes adicionais verificam a ordem dos oito ângulos, cobertura direcional de todas as classes, conservação da direção ao parar e atualização da direção dos inimigos pela simulação.

## Salas entre jogadores, personalização e caçada tardia

O modo Infinito Online agora abre um navegador de salas. É possível criar uma sala pública ou protegida por senha, definir seu nome e entrar pela lista sem instalar servidor. O primeiro jogador executa a simulação autoritativa no navegador e os demais se conectam por WebRTC. O Worker/D1 guarda apenas o diretório temporário da sala e os sinais de conexão; vida, inimigos e combate são transmitidos entre os jogadores. Se o host sair, o membro ativo mais antigo assume e restaura o último checkpoint recebido. A eleição preserva a sala, mas pode levar até cerca de 12 segundos quando a saída não é voluntária.

Essas salas casuais não enviam resultados ao ranking mundial: como a autoridade está no computador de um jogador, atribuir recordes globais seria vulnerável a adulteração. O ranking solo continua reexecutado e validado pelo Worker. WebRTC usa STUN público; redes com NAT muito restritivo podem exigir um serviço TURN em uma versão futura.

O menu Personalização salva localmente tom de pele, olhos, cabelo/barba, pintura facial, capacete, traje e um de oito machados. Cosméticos não alteram colisão, dano ou chance de cartas. A nova arte inclui menu cinematográfico, grama fosca simplificada, quatro árvores top-down, oito machados e lobo direcional.

A carta rara Lobo companheiro invoca um aliado de 100 HP que segue, procura ameaças e ataca. Ao morrer, desaparece e a carta volta a poder aparecer. O XP de bosses ficou maior e luminoso. Cada boss ativa um tema musical sintetizado próprio. Depois de 15 minutos, a pressão aumenta uma vez por minuto: vida, dano, velocidade e densidade sobem progressivamente. Atiradores agora antecipam o movimento, recuam, circulam o alvo e os inimigos evitam se empilhar.

O ranking mundial passou a registrar tempo, abates PvE, nível, dano causado, dano recebido, maior golpe e todas as cartas da build. QA atual: 49 testes aprovados, incluindo companheiro, escalada tardia, persistência das novas estatísticas, senha de sala, sinais de conexão e migração de host.

## Floresta viva — level design visual

O mapa não é mais um piso verde uniforme. `shared/level.js` define uma composição determinística compartilhada: clareira central, bosque de recursos, santuário de boss, ruínas e área pantanosa; duas estradas principais curvas; três trilhas secundárias e uma trilha escondida. As árvores são posicionadas fora dos caminhos e centros de combate, sem perder a contagem total nem o respawn.

`client/src/world.js` desenha em uma camada pré-calculada floresta densa, campo aberto, montanha, pântano e zona seca, com transições suaves, terra exposta, estrada desgastada, marcas de roda, riacho e lagoa rasa. Um atlas 4×4 reutilizado compõe agrupamentos naturais de capim, samambaias, moitas, flores, folhas, galhos, pedras, cogumelos, raízes, troncos, juncos, grama seca, cercas, placas e cascalho. São elementos puramente visuais, sem colisão ou atualização individual. Apenas itens visíveis são desenhados.

As bases das árvores recebem terra e raízes procedurais para integrá-las ao solo. O atlas de árvores foi substituído por quatro copas exclusivamente verdes — árvore clara, árvore escura, pinheiro e árvore ancestral — com variação discreta de escala. Vegetação e detalhes permanecem abaixo dos avisos, projéteis, XP e personagens. A mudança inaugura uma nova versão das regras do ranking, porque a distribuição autoritativa das árvores mudou.

QA desta edição: 50 testes aprovados, incluindo garantia de 150 árvores, exclusão de estradas e clareiras, variação de escala, respawn, renderização de ataques e simulação de carga completa de 15 minutos.
