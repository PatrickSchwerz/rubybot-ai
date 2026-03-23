const http = require('http');
const https = require('https');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = process.env.AI_MODEL || 'deepseek-chat';
const PORT = process.env.PORT || 2997;

// ─── System prompts ───
const SYSTEM_FLOW = `Voce e um gerador de funis de vendas em JSON para bots do Telegram (plataforma RubyBot).

SAIDA: um UNICO objeto JSON. Cada chave e o ID do node. IDs curtos (m1,m2,p1,w1). Position sempre {"x":0,"y":0}. Textos curtos (o usuario edita depois). Sem explicacao, sem markdown. APENAS o JSON.

TIPOS DE NODE:
- trigger: id sempre "start", next: "id" (1 unico destino linear)
- message: items:[{type:"text",content:"..."}]. Com midia: {type:"media",url:"",fileName:"Adicione sua midia"}. Com botoes: buttons:[{label:"...",next:"id"}] e next:null
- interval: value, unit (seconds/minutes/hours/days), next:"id"
- payment: amount, description, timeout(min). next:{"paid":"id","timeout":"id"} — AMBOS obrigatorios
- fake_call: next:{"call_completed":"id","call_declined":"id"} — AMBOS obrigatorios
- group: next:{"next":"id","expired":"id"}
- kick: next:null (usar so depois de group)
- pixel: event ("ViewContent"/"Purchase"/"CompleteRegistration"), next:"id"
- ab_test: variants:[{label:"A",weight:50,next:"id"},{label:"B",weight:50,next:"id"}]

REGRAS ABSOLUTAS:
1. Flow SEMPRE avanca pra frente. NUNCA linke de volta pra node anterior ou pro start
2. Start -> 1 unico destino (mensagem linear, SEM botoes)
3. Primeiros nodes sao lineares: msg -> espera -> msg -> espera (aquecimento)
4. Bifurcacao so quando chegar na decisao (botoes comprar/recusar ou payment)
5. Botao de recusa -> node adiante (downsell/encerramento), NUNCA null, NUNCA pra tras
6. Todo payment tem paid E timeout preenchidos com IDs existentes
7. Ultimo node de cada ramo: next:null (fim, nao volta)
8. NUNCA use "content":"texto" em message. SEMPRE items:[{type:"text",content:"..."}]
9. Sem nodes soltos. Todo node alcancavel a partir do start

EXEMPLO 1 — Funil simples com pagamento:
{"start":{"id":"start","type":"trigger","next":"m1","position":{"x":0,"y":0}},"m1":{"id":"m1","type":"message","items":[{"type":"text","content":"Oi! Descubra como ganhar dinheiro online"}],"next":"w1","position":{"x":0,"y":0}},"w1":{"id":"w1","type":"interval","value":3,"unit":"seconds","next":"m2","position":{"x":0,"y":0}},"m2":{"id":"m2","type":"message","items":[{"type":"media","url":"","fileName":"Adicione sua midia"},{"type":"text","content":"Assista o video e veja os resultados"}],"next":"w2","position":{"x":0,"y":0}},"w2":{"id":"w2","type":"interval","value":5,"unit":"seconds","next":"m3","position":{"x":0,"y":0}},"m3":{"id":"m3","type":"message","items":[{"type":"text","content":"Oferta especial por tempo limitado! De R$197 por apenas R$97"}],"buttons":[{"label":"Quero comprar","next":"p1"},{"label":"Nao tenho interesse","next":"ds1"}],"next":null,"position":{"x":0,"y":0}},"p1":{"id":"p1","type":"payment","amount":97,"description":"Curso Completo","timeout":15,"next":{"paid":"px1","timeout":"m4"},"position":{"x":0,"y":0}},"px1":{"id":"px1","type":"pixel","event":"Purchase","next":"g1","position":{"x":0,"y":0}},"g1":{"id":"g1","type":"group","next":{"next":"m5","expired":"m6"},"position":{"x":0,"y":0}},"m5":{"id":"m5","type":"message","items":[{"type":"text","content":"Bem-vindo ao grupo VIP! Seu acesso foi liberado"}],"next":null,"position":{"x":0,"y":0}},"m6":{"id":"m6","type":"message","items":[{"type":"text","content":"Seu acesso ao grupo expirou"}],"next":null,"position":{"x":0,"y":0}},"m4":{"id":"m4","type":"message","items":[{"type":"text","content":"Pagamento expirou. Tente novamente se mudar de ideia"}],"next":null,"position":{"x":0,"y":0}},"ds1":{"id":"ds1","type":"message","items":[{"type":"text","content":"Sem problema! Que tal um mini curso por apenas R$27?"}],"buttons":[{"label":"Quero por R$27","next":"p2"},{"label":"Nao quero nada","next":"m7"}],"next":null,"position":{"x":0,"y":0}},"p2":{"id":"p2","type":"payment","amount":27,"description":"Mini Curso","timeout":15,"next":{"paid":"g1","timeout":"m7"},"position":{"x":0,"y":0}},"m7":{"id":"m7","type":"message","items":[{"type":"text","content":"Tudo bem! Se mudar de ideia estamos aqui"}],"next":null,"position":{"x":0,"y":0}}}

EXEMPLO 2 — Funil com upsell/downsell:
{"start":{"id":"start","type":"trigger","next":"m1","position":{"x":0,"y":0}},"m1":{"id":"m1","type":"message","items":[{"type":"text","content":"Boas vindas! Tenho algo especial pra voce"}],"next":"w1","position":{"x":0,"y":0}},"w1":{"id":"w1","type":"interval","value":5,"unit":"seconds","next":"m2","position":{"x":0,"y":0}},"m2":{"id":"m2","type":"message","items":[{"type":"text","content":"Metodo completo por R$97. Oferta especial!"}],"buttons":[{"label":"Comprar agora","next":"p1"},{"label":"Nao quero","next":"rec1"}],"next":null,"position":{"x":0,"y":0}},"p1":{"id":"p1","type":"payment","amount":97,"description":"Metodo Completo","timeout":15,"next":{"paid":"up1","timeout":"tout1"},"position":{"x":0,"y":0}},"up1":{"id":"up1","type":"message","items":[{"type":"text","content":"Parabens! Oferta unica: mentoria por R$197"}],"buttons":[{"label":"Quero a mentoria","next":"p2"},{"label":"So o curso","next":"ok1"}],"next":null,"position":{"x":0,"y":0}},"p2":{"id":"p2","type":"payment","amount":197,"description":"Mentoria","timeout":15,"next":{"paid":"ok1","timeout":"ok1"},"position":{"x":0,"y":0}},"ok1":{"id":"ok1","type":"message","items":[{"type":"text","content":"Acesso liberado! Bem-vindo ao grupo"}],"next":"g1","position":{"x":0,"y":0}},"g1":{"id":"g1","type":"group","next":{"next":"fim1","expired":"fim2"},"position":{"x":0,"y":0}},"fim1":{"id":"fim1","type":"message","items":[{"type":"text","content":"Aproveite o conteudo!"}],"next":null,"position":{"x":0,"y":0}},"fim2":{"id":"fim2","type":"message","items":[{"type":"text","content":"Acesso expirado"}],"next":null,"position":{"x":0,"y":0}},"tout1":{"id":"tout1","type":"message","items":[{"type":"text","content":"Tempo esgotado! Ultimas vagas"}],"next":null,"position":{"x":0,"y":0}},"rec1":{"id":"rec1","type":"interval","value":1,"unit":"hours","next":"m3","position":{"x":0,"y":0}},"m3":{"id":"m3","type":"message","items":[{"type":"text","content":"Vi que nao finalizou. Ultima chance por R$97!"}],"buttons":[{"label":"Comprar agora","next":"p1"},{"label":"Nao quero","next":"ds1"}],"next":null,"position":{"x":0,"y":0}},"ds1":{"id":"ds1","type":"message","items":[{"type":"text","content":"Entendido. Mini curso por R$27?"}],"buttons":[{"label":"Quero por R$27","next":"p3"},{"label":"Nao","next":"fim3"}],"next":null,"position":{"x":0,"y":0}},"p3":{"id":"p3","type":"payment","amount":27,"description":"Mini Curso","timeout":15,"next":{"paid":"ok1","timeout":"fim3"},"position":{"x":0,"y":0}},"fim3":{"id":"fim3","type":"message","items":[{"type":"text","content":"Tudo bem! Ate a proxima"}],"next":null,"position":{"x":0,"y":0}}}

Gere o flow seguindo exatamente esses padroes. APENAS o JSON, nada mais.`;

const SYSTEM_IMPROVE = `Voce e o melhor estrategista de marketing digital e funis de vendas do mundo.
Voce domina TODOS os gatilhos mentais e sabe exatamente onde aplicar cada um:

GATILHOS TIER S (fecham venda sozinhos):
- Escassez: "Ultimas X vagas" / limitar quantidade
- Urgencia: "So hoje" / timer / prazo curto
- Prova Social: prints, depoimentos, numero de alunos
- Autoridade: cases, resultados, vocabulario tecnico

TIER A (potencializam):
- Dor vs Prazer: apertar a ferida, depois mostrar a saida
- Antecipacao: criar expectativa antes da oferta
- Reciprocidade: dar valor antes de vender (PDF, aula gratis)
- Comprometimento: micro-sim antes do sim grande
- Novidade: "metodo inedito" / "estrategia nova"

TIER B (reforco):
- Identidade: "isso e pra quem leva a serio"
- Inimigo Comum: "eles nao querem que voce saiba"
- Storytelling: historia pessoal antes da oferta
- Especificidade: R$4.732 em 18 dias > R$5.000 em 20 dias
- Simplicidade: "3 passos simples" / "sem aparecer"
- Exclusividade: "grupo fechado" / "so pra quem ta aqui"

TIER C (ancoragem):
- Ancoragem de Preco: mostrar preco alto primeiro
- Contraste: "menos que um lanche por dia"
- Garantia: "7 dias incondicional"
- Curiosidade: loop aberto que o cerebro quer fechar

ONDE APLICAR NO FUNIL:
- Aquecimento: Dor + Storytelling + Inimigo Comum
- Oferta: Ancoragem + Escassez + Exclusividade
- Fake Call: Surpresa + Autoridade + Reciprocidade
- Upsell: Identidade + Novidade + Contraste
- Downsell: Simplicidade + Garantia + Urgencia
- Recuperacao: Escassez + Comprometimento + Manada

FORMATO DE RESPOSTA — duas partes:

PARTE 1 — ANALISE (texto para o usuario):
Voce vai receber os nodes no formato: #1 [Tipo] (id: xxx) — conteudo atual

## Diagnostico
[2-3 linhas do que ta bom e o que ta fraco]

## Melhorias
Para cada melhoria, use este formato EXATO:
**#N [Tipo do node]** — Gatilho: [nome do gatilho]
Trocar: "texto atual resumido..."
Por: "texto novo com gatilho aplicado..."
Motivo: [por que isso melhora a conversao]

Exemplo:
**#3 [Mensagem]** — Gatilho: Escassez + Urgencia
Trocar: "Compre nosso curso completo"
Por: "Ultimas 7 vagas! Essa oferta encerra em 15 minutos. De R$497 por apenas R$97"
Motivo: Escassez de vagas + urgencia de tempo forçam decisao imediata

(maximo 5 melhorias, da mais impactante pra menos)

PARTE 2 — JSON DE MELHORIAS (para aplicacao automatica):
Apos a analise, gere um bloco JSON com as alteracoes. Use o ID REAL do node (que aparece entre parenteses no resumo).
\`\`\`json
{"changes":[{"nodeId":"ID_REAL_DO_NODE","field":"items","value":[{"type":"text","content":"Novo texto com gatilho"}]},{"nodeId":"ID_REAL","field":"buttons","value":[{"label":"Novo texto botao","next":"ID_DESTINO_EXISTENTE"}]}]}
\`\`\`

Campos alteraveis: items, buttons, description, amount.
NUNCA altere: id, type, next (estrutura), position.
Em buttons, MANTENHA os mesmos "next" originais, so mude o "label".
Responda em portugues brasileiro. Sem enrolacao.`;

const SYSTEM_METRICS = `Voce e o melhor analista de funis de vendas do mundo para Telegram.
Sem enrolacao. Sem elogios. Sem "otima pergunta". So o que importa.

Ao receber metricas, responda SEMPRE neste formato:

## Diagnostico Rapido
[2-3 linhas maximo. O que ta acontecendo no funil em numeros.]

## Problemas (do mais critico pro menos)
- **[Nome do problema]** — [dado que prova] — impacto estimado em R$
- ...

## O que fazer (prioridade 1 primeiro)
1. **[Acao especifica]** — onde, como, prazo
2. ...

## Projecao
Se corrigir o problema #1: +R$X/dia ou +X% conversao estimada.

Regras:
- Sempre cite o numero/metrica que embasou cada conclusao
- Se a taxa de abertura caiu, diz exatamente onde o funil sangra
- Compara com benchmarks reais: abertura Telegram ~80%, conversao funil frio ~1-3%, funil quente ~5-15%
- Se os dados forem insuficientes, lista exatamente quais metricas faltam
- Zero achismo — so o que os numeros dizem
- Se tiver A/B test, aponta o vencedor e o motivo
- Sempre termina com UMA acao prioritaria em negrito`;

const SYSTEM_DASHBOARD = `Voce e o Ruby IA — consultor de performance de bots de vendas no Telegram.
Voce recebe as metricas do dashboard do usuario e ajuda a tomar decisoes.

CAPACIDADES:
- Analisar qual bot converte mais e por que
- Comparar campanhas/criativos e recomendar onde investir mais
- Identificar gargalos no funil (muitos leads, poucas vendas)
- Sugerir otimizacoes de copy, timing e segmentacao
- Calcular ROI por fonte de trafego
- Analisar distribuicao geografica e de dispositivos

FORMATO:
- Seja direto, use bullet points
- Cite numeros especificos das metricas
- Compare com benchmarks: CVR funil frio 1-3%, funil quente 5-15%, ticket medio ideal > R$97
- Sempre termine com 1 acao concreta prioritaria

REGRAS:
- Portugues brasileiro, informal mas profissional
- Nunca invente dados — use apenas o que recebeu
- Se os dados forem insuficientes, diga o que falta
- Nao repita as metricas de volta — analise e de insights`;

// ─── Helper: call DeepSeek API (non-streaming) ───
async function ask(messages, options = {}) {
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    }),
  });
  const data = await res.json();

  if (data.error) {
    console.error('[ask] DeepSeek error:', JSON.stringify(data.error));
    throw new Error(data.error.message || 'DeepSeek API error');
  }

  const content = data.choices?.[0]?.message?.content || '';
  const finishReason = data.choices?.[0]?.finish_reason;

  if (finishReason === 'length') {
    console.warn('[ask] Response truncated (hit max_tokens)');
  }

  return content;
}

// ─── Chat personality detection ───
const GIRIAS = /\b(porra|caralho|foda|foder|fuder|fodeu|fudeu|merda|cacete|puta|puto|fdp|vsf|pqp|tnc|krl|kct|arrombad[oa]?|viado|veado|cuz[aã]o|cu|buceta|pau|rola|piroca|pinto|xota|xoxota|ppk|desgra[cç]a|desgra[cç]ado|maldito|inferno|diacho|bronha|punheta|siririca|safad[oa]|vadia|vagabund[oa]|putaria|sacanagem|tarad[oa]|mano|mlk|muleque|lek|slk|cara|v[eé]i|v[eé]io|truta|cria|brother|br[oó]der|parceir[oa]|parcero|noix|nois|n[oó]iz|namoral|bgl|bagulho|fita|corre|desenrola|firmeza|tmj|suave|noia|brisa|viagem|del[ií]rio|otári[oa]|bund[aã]o|medroso|froux[oa]|lerd[oa]|burr[oa]|idiota|imbecil|palha[cç]o|retardado|in[uú]til|pilantra|canalha|corno|corna|chifrudo|tra[ií]ra|lixo|esc[oó]ria|bandido|ladr[aã]o|golpista|171|caraio|carai|oxe|uai|eita|poha|poxa)\b/gi;

const SYSTEM_CHAT_FORMAL = `Voce e o Ruby IA — assistente de funis de vendas para Telegram na plataforma RubyBot.
Responda em portugues brasileiro, de forma direta, profissional e util.
Voce entende de marketing digital, funis de vendas, copy, gatilhos mentais, Telegram bots, pagamentos PIX e grupos.
Seja objetivo mas amigavel.`;

// Modo LEK removido — mantém apenas o modo formal/profissional
const SYSTEM_CHAT_LEK = null;

function detectLekMode(messages) {
  return false; // Modo LEK desativado
}

// ─── Summarize nodes for human-readable context ───
function summarizeNodes(nodes) {
  if (!nodes || typeof nodes !== 'object') return 'Nenhum node';
  const typeLabels = {
    trigger: 'Gatilho', message: 'Mensagem', interval: 'Espera',
    payment: 'Pagamento', fake_call: 'Fake Call', group: 'Grupo',
    kick: 'Remover', pixel: 'Pixel', ab_test: 'Teste A/B',
  };
  let idx = 1;
  const lines = [];
  for (const [id, node] of Object.entries(nodes)) {
    const label = typeLabels[node.type] || node.type;
    let detail = '';
    if (node.type === 'message') {
      const text = node.items?.find(i => i.type === 'text')?.content || '';
      const preview = text.slice(0, 60) + (text.length > 60 ? '...' : '');
      const hasMedia = node.items?.some(i => i.type === 'media');
      const btnLabels = (node.buttons || []).map(b => b.label).join(' | ');
      detail = preview ? `"${preview}"` : '(vazio)';
      if (hasMedia) detail += ' + midia';
      if (btnLabels) detail += ` [Botoes: ${btnLabels}]`;
    } else if (node.type === 'payment') {
      detail = `R$${node.amount || 0} - ${node.description || 'sem descricao'}`;
    } else if (node.type === 'interval') {
      detail = `${node.value || 0} ${node.unit || 'seconds'}`;
    } else if (node.type === 'pixel') {
      detail = node.event || '';
    } else if (node.type === 'fake_call') {
      detail = node.callerName || 'chamada';
    } else if (node.type === 'ab_test') {
      detail = (node.variants || []).map(v => `${v.label}(${v.weight}%)`).join(' vs ');
    }
    lines.push(`#${idx} [${label}] (id: ${id}) — ${detail}`);
    idx++;
  }
  return lines.join('\n');
}

// ─── Build messages for each action ───
function buildMessages(body) {
  const { action, prompt, messages, nodes, stats } = body;

  if (action === 'generate') {
    return {
      msgs: [
        { role: 'system', content: SYSTEM_FLOW },
        { role: 'user', content: prompt },
      ],
      opts: { temperature: 0.6, maxTokens: 8192 },
    };
  }
  if (action === 'improve') {
    // Build a human-readable summary of nodes with sequential IDs
    const nodesSummary = summarizeNodes(nodes);
    return {
      msgs: [
        { role: 'system', content: SYSTEM_IMPROVE },
        { role: 'user', content: `Analise este flow e sugira melhorias:\n\n${nodesSummary}\n\nJSON completo dos nodes:\n${JSON.stringify(nodes, null, 2)}` },
      ],
      opts: { temperature: 0.5 },
    };
  }
  if (action === 'metrics') {
    return {
      msgs: [
        { role: 'system', content: SYSTEM_METRICS },
        { role: 'user', content: `Analise as metricas deste funil:\nFlow: ${JSON.stringify(nodes, null, 2)}\nMetricas: ${JSON.stringify(stats, null, 2)}` },
      ],
      opts: { temperature: 0.4 },
    };
  }
  if (action === 'dashboard') {
    const metricsCtx = stats ? `\nMetricas do dashboard:\n${JSON.stringify(stats, null, 2)}` : '';
    return {
      msgs: [{ role: 'system', content: SYSTEM_DASHBOARD + metricsCtx }, ...(messages || [])],
      opts: { temperature: 0.5, maxTokens: 2048 },
    };
  }
  if (action === 'chat') {
    const sysContent = SYSTEM_CHAT_FORMAL;
    const flowCtx = nodes ? `\nFlow atual do usuario:\n${JSON.stringify(nodes, null, 2)}` : '';
    return {
      msgs: [{ role: 'system', content: sysContent + flowCtx }, ...(messages || [])],
      opts: { temperature: 0.7 },
    };
  }
  return null;
}

// ─── Content Safety Filter ───
const BLOCKED_PATTERNS = [
  // Abuso sexual / pedofilia / menores
  /\b(pedofil|pedófil|cp\b|child\s*porn|menor\s*de\s*idade|crian[cç]a.*sex|sex.*crian[cç]a|infantil.*sex|sex.*infantil|l[0o]lit|shotacon|lolicon|grooming|abus[oa].*menor|menor.*abus[oa]|estupro.*menor|menor.*estupro|molest)/gi,
  // Estupro / violência sexual
  /\b(estupr[oa]|rape\b|violência\s*sexual|violen[cç]a\s*sexual|abus[oa]\s*sexual|assédio\s*sexual|assedio\s*sexual|forc[aá]r\s*sex|sex.*for[cç]ad|agress[aã]o\s*sexual)/gi,
  // Zoofilia / bestialidade
  /\b(zoofil|bestialid|bestialit|sex.*animal|animal.*sex|bicho.*sex|sex.*bicho)/gi,
  // Terrorismo
  /\b(terroris|bombas?\s*caseira|como\s*fazer\s*bomba|explos[ãa]o\s*caseira|ataque\s*terrorista|jihad|estado\s*isl[aâ]mico|isis\b|al[\s-]?qaeda|atentado|massacre|chacina\s*planej)/gi,
  // Armas / drogas produção
  /\b(como\s*fazer\s*(arma|droga|metanfetamina|crack|cocaína|cocaina|heroína|heroina|lsd)|sintetizar\s*droga|fabricar\s*(arma|explosivo|veneno)|ricina\b|antraz|sarin\b)/gi,
  // Gore / snuff / necrofilia
  /\b(necrofil|snuff|gore.*real|tortura.*real|video.*morte.*real|assassin.*encomenda|matar\s*algu[eé]m|como\s*matar|envenenar\s*algu)/gi,
  // Tráfico de pessoas
  /\b(tr[aá]fico\s*de\s*(pessoas|humanos|mulheres|crian[cç]as|[oó]rg[aã]os)|escravid[aã]o\s*sexual|explora[cç][aã]o\s*sexual)/gi,
  // Hacking / invasão / fraude
  /\b(hack(ear|ar|ing|er)|invadir\s*(conta|sistema|site|servidor|whatsapp|instagram|facebook|email|banco)|como\s*(clonar|hackear|invadir|roubar)\s*(cart[aã]o|whatsapp|instagram|conta|dados|senha|wifi|rede)|clonar\s*(whatsapp|cart[aã]o|chip|celular)|roubar\s*(dados|identidade|conta|senha|dinheiro|pix|cart[aã]o)|phishing|ransomware|carding\b|skimmer|keylogger|exploit|brute\s*force|ddos|sql\s*injection|xss|engenharia\s*social|rat\s*(trojan|remoto)|malware|spyware|trojan|virus.*criar|criar.*virus)/gi,
  // Suicídio / autolesão (incitação)
  /\b(como\s*(se\s*matar|suicidar|enforcar|cortar\s*pulso)|melhores?\s*formas?\s*de\s*morrer|incita[cç][aã]o.*suic[ií]dio)/gi,
  // Discriminação violenta
  /\b(supremacia\s*(branca|ariana)|neonaz|genocid|extermin.*ra[cç]a|limpe[sz]a\s*[eé]tnica|holocausto.*bom)/gi,
  // Pornografia ILEGAL (revenge porn, deepfake, menores - pornografia adulta consensual é permitida)
  /\b(deep\s*fake\s*porn|revenge\s*porn|porn[oô]?\s*de?\s*vingan[cç]a|nudes?\s*vaz|vazar\s*nudes?|porn[oô]?\s*infant|snuff\s*porn|cp\s*porn)/gi,
  // Golpes / estelionato
  /\b(pir[aâ]mide\s*financeira|esquema\s*ponzi|golpe\s*pix|como\s*dar\s*golpe|estelionat|lavar\s*dinheiro|lavagem\s*de\s*dinheiro|nota\s*falsa|dinheiro\s*falso|falsificar\s*(documento|rg|cpf|cnh|diploma|receita))/gi,
  // Armas de fogo ilegais
  /\b(comprar\s*arma\s*ilegal|arma\s*caseira|arma\s*sem\s*registro|ghost\s*gun|impressora\s*3d\s*arma|arma\s*3d|muni[cç][aã]o\s*ilegal)/gi,
  // Doxxing / stalking
  /\b(doxxing|doxing|como\s*encontrar\s*endere[cç]o|rastrear\s*pessoa|stalke?ar|espionar\s*(whatsapp|celular|namorad|espos)|grampo|grampe|escuta\s*telefon)/gi,
];

function containsBlockedContent(text) {
  if (!text || typeof text !== 'string') return null;
  for (const pattern of BLOCKED_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}

function checkAllContent(body) {
  // Checar prompt
  if (body.prompt) {
    const found = containsBlockedContent(body.prompt);
    if (found) return { blocked: true, word: found, source: 'prompt', text: body.prompt };
  }
  // Checar messages
  if (body.messages && Array.isArray(body.messages)) {
    for (const msg of body.messages) {
      if (msg.content) {
        const found = containsBlockedContent(msg.content);
        if (found) return { blocked: true, word: found, source: 'message', text: msg.content };
      }
    }
  }
  // Checar nodes (flow text content)
  if (body.nodes && typeof body.nodes === 'object') {
    const nodesStr = JSON.stringify(body.nodes);
    const found = containsBlockedContent(nodesStr);
    if (found) return { blocked: true, word: found, source: 'flow_nodes', text: nodesStr.slice(0, 500) };
  }
  return { blocked: false };
}

async function sendBlockAlert(req, blockResult, userData) {
  try {
    const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?';
    const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const user = userData || {};

    const messageBody = `🚨 *CONTEÚDO ILEGAL BLOQUEADO NA IA!*\n\n`
      + `👤 Usuário: *${user.name || 'Desconhecido'}* (@${user.username || '?'})\n`
      + `🆔 ID: *${user.id || '?'}*\n`
      + `📧 Email: *${user.email || '?'}*\n`
      + `🌐 IP: *${ip}*\n`
      + `🚫 Palavra: *${blockResult.word}*\n`
      + `📋 Origem: *${blockResult.source}*\n`
      + `📝 Trecho: ${(blockResult.text || '').slice(0, 200)}\n`
      + `📅 Data: ${now}`;

    await fetch('https://app.whatsgw.com.br/api/WhatsGw/Send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: 'b5c730c2-b423-46bc-bad4-24bf540cbcd3',
        phone_number: '5544988246381',
        contact_phone_number: '120363424931200668',
        message_custom_id: 'ai_blocked_' + Date.now(),
        message_type: 'text',
        message_to_group: '1',
        message_body: messageBody,
      }),
    });
  } catch (e) {
    console.error('[safety] alert error:', e.message);
  }
}

// ─── Parse JSON body from request ───
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

// ─── Security ───
const AI_KEY = process.env.AI_KEY || 'rb_ai_k7m9x2pL4wQn8vR3';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://rubybot.pro');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-AI-Key');
}

function jsonReply(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ─── Pure HTTP server ───
const server = http.createServer(async (req, res) => {
  setCors(res);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ─── Security: only accept requests from nginx (localhost) with correct host ───
  const isHealth = req.url === '/ai/health' || req.url === '/health';
  if (!isHealth) {
    const fromLocal = req.socket.remoteAddress === '127.0.0.1' || req.socket.remoteAddress === '::1' || req.socket.remoteAddress === '::ffff:127.0.0.1';
    const host = req.headers['host'] || '';
    const validHost = host.includes('rubybot.pro') || host.startsWith('127.0.0.1');
    const hasApiKey = req.headers['x-ai-key'] === AI_KEY;

    if (!fromLocal || (!validHost && !hasApiKey)) {
      console.log('[BLOCKED]', req.url, 'host:', host, 'from:', req.socket.remoteAddress);
      return jsonReply(res, 403, { error: 'Acesso negado' });
    }
  }

  // Health check
  if (isHealth) {
    try {
      const testRes = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: 'ping' }], max_tokens: 1, stream: false }),
        signal: AbortSignal.timeout(5000),
      });
      const ok = testRes.status === 200;
      jsonReply(res, 200, {
        status: ok ? 'ok' : 'degraded',
        model: MODEL,
        engine: 'deepseek-api',
        api: ok ? 'connected' : `error ${testRes.status}`,
      });
    } catch (e) {
      jsonReply(res, 200, { status: 'degraded', model: MODEL, engine: 'deepseek-api', api: 'unreachable' });
    }
    return;
  }

  // ─── Content Safety Check (all POST endpoints) ───
  if (req.method === 'POST') {
    const rawBody = await parseBody(req);
    const safety = checkAllContent(rawBody);
    if (safety.blocked) {
      const userData = rawBody._user || {};
      console.warn(`[SAFETY BLOCK] user: ${userData.username || '?'} word: "${safety.word}" source: ${safety.source}`);
      sendBlockAlert(req, safety, userData);
      jsonReply(res, 403, { error: 'Conteúdo não permitido. Este tipo de solicitação viola nossos termos de uso.' });
      return;
    }
    // Attach parsed body to request for reuse
    req._body = rawBody;
  }

  // ─── SSE Streaming endpoint ───
  if (req.url === '/ai/stream' && req.method === 'POST') {
    const body = req._body || {};
    const built = buildMessages(body);

    if (!built) {
      jsonReply(res, 400, { error: 'action invalida' });
      return;
    }

    const { msgs, opts } = built;
    const start = Date.now();

    // SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    try {
      const deepseekRes = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: msgs,
          stream: true,
          temperature: opts.temperature ?? 0.7,
          max_tokens: opts.maxTokens ?? 4096,
        }),
      });

      let fullText = '';
      let tokenCount = 0;
      const reader = deepseekRes.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6);
          if (jsonStr === '[DONE]') {
            const elapsed = ((Date.now() - start) / 1000).toFixed(1);
            res.write(`data: ${JSON.stringify({ done: true, full: fullText, tokens: tokenCount, elapsed })}\n\n`);
            continue;
          }
          try {
            const obj = JSON.parse(jsonStr);
            const token = obj.choices?.[0]?.delta?.content || '';
            if (token) {
              fullText += token;
              tokenCount++;
              res.write(`data: ${JSON.stringify({ token })}\n\n`);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error('[stream] error:', e.message);
      res.write(`data: ${JSON.stringify({ error: 'Falha na conexao com a IA. Tente novamente.' })}\n\n`);
    }

    res.end();
    return;
  }

  // ─── Non-streaming JSON endpoints ───
  if (req.method === 'POST') {
    const body = req._body || {};

    if (req.url === '/ai/generate-flow') {
      let raw = '';
      try {
        // Primeira tentativa
        raw = await ask([
          { role: 'system', content: SYSTEM_FLOW },
          { role: 'user', content: body.prompt },
        ], { temperature: 0.6, maxTokens: 8192 });

        let jsonStr = raw.trim();

        // Remover markdown wrapping
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) jsonStr = jsonMatch[1].trim();

        // Extrair JSON
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
        }

        // Tentar parsear
        let nodes;
        try {
          nodes = JSON.parse(jsonStr);
        } catch (parseErr) {
          // JSON truncado — pedir continuação
          console.warn('[generate-flow] JSON truncado, pedindo continuação...');
          const continuation = await ask([
            { role: 'system', content: SYSTEM_FLOW },
            { role: 'user', content: body.prompt },
            { role: 'assistant', content: raw },
            { role: 'user', content: 'Continue EXATAMENTE de onde parou. Retorne APENAS o restante do JSON, sem repetir o que ja foi enviado.' },
          ], { temperature: 0.3, maxTokens: 8192 });

          // Juntar resposta original + continuação
          let fullJson = raw + continuation;
          const fm = fullJson.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (fm) fullJson = fm[1].trim();
          const fb = fullJson.indexOf('{');
          const lb = fullJson.lastIndexOf('}');
          if (fb !== -1 && lb !== -1) fullJson = fullJson.slice(fb, lb + 1);

          nodes = JSON.parse(fullJson);
        }

        jsonReply(res, 200, { nodes });
      } catch (e) {
        console.error('[generate-flow] error:', e.message);
        console.error('[generate-flow] raw (500 chars):', (raw || '').slice(0, 500));
        jsonReply(res, 500, { error: 'Falha ao gerar flow', detail: e.message });
      }
      return;
    }

    if (req.url === '/ai/chat') {
      try {
        const sysMsg = {
          role: 'system',
          content: `Voce e um assistente de funis de vendas para Telegram na plataforma RubyBot.\nResponda em portugues brasileiro, de forma direta e util.\n${body.nodes ? `\nFlow atual:\n${JSON.stringify(body.nodes, null, 2)}` : ''}`,
        };
        const text = await ask([sysMsg, ...(body.messages || [])], { temperature: 0.7 });
        jsonReply(res, 200, { response: text });
      } catch {
        jsonReply(res, 500, { error: 'Falha na conversa' });
      }
      return;
    }
  }

  // 404
  jsonReply(res, 404, { error: 'Not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`rubybot-ai listening on port ${PORT} | model: ${MODEL} | engine: DeepSeek API`);
});
