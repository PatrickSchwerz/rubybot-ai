<p align="center">
  <img src="https://img.shields.io/badge/RubyBOT-AI-E50914?style=for-the-badge&logo=openai&logoColor=white" alt="RubyBOT AI"/>
</p>

<h1 align="center">RubyBOT AI</h1>

<p align="center">
  Servico de inteligencia artificial da plataforma RubyBOT. Gera insights, mensagens de remarketing personalizadas e analises de funil usando modelos de linguagem.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/DeepSeek-API-4B6BFF?logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/PM2-Managed-2B037A?logo=pm2&logoColor=white" />
</p>

---

## O que faz

Servico standalone que fornece capacidades de IA para a plataforma RubyBOT:

### Insights de Dashboard
- Analisa metricas do usuario (receita, leads, conversao)
- Gera insights acionaveis em tempo real
- Identifica tendencias e oportunidades

### Remarketing Inteligente
- Gera mensagens personalizadas para leads que nao compraram
- Analisa contexto do lead (produto, horario, comportamento)
- Adapta tom e abordagem conforme configuracao do dono do bot
- Sugere horario ideal de envio baseado em atividade

### Analise de Funil
- Identifica gargalos no funil de vendas
- Sugere otimizacoes baseadas em dados
- Compara com benchmarks do mercado

## Arquitetura

```
index.js                 # Server Express com endpoints de IA
ecosystem.config.js      # Configuracao PM2
package.json             # Dependencias
```

## Endpoints

| Metodo | Rota                    | Descricao                          |
|--------|-------------------------|------------------------------------|
| POST   | `/ai/insights`          | Gera insights do dashboard         |
| POST   | `/ai/remarketing`       | Gera mensagem de remarketing       |
| POST   | `/ai/funnel-analysis`   | Analisa funil e sugere melhorias   |
| GET    | `/ai/health`            | Health check                       |

## Stack

| Componente   | Tecnologia   |
|--------------|--------------|
| Runtime      | Node.js 20   |
| Framework    | Express      |
| LLM Provider | DeepSeek API |
| Process Mgr  | PM2          |

## Configuracao

```bash
npm install
# Configurar DEEPSEEK_API_KEY no .env
pm2 start ecosystem.config.js
```

## Seguranca

O servico roda apenas localmente e aceita requisicoes somente com header `X-Internal-Auth` valido, impedindo acesso externo.

---

<p align="center">
  <sub>IA a servico da automacao RubyBOT</sub>
</p>
