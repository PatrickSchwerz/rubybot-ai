#!/bin/bash
# RubyBot AI Health Check — roda a cada 5 min via cron
# Se o Ollama não responder, reinicia tunnel + limpa runners duplicados

OLLAMA_URL="http://127.0.0.1:11435"
VAST_HOST="ssh5.vast.ai"
VAST_PORT="21250"
VAST_KEY="/root/.ssh/id_vast"
LOG="/var/log/rubybot-ai-health.log"

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

# 1. Testar se Ollama responde
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$OLLAMA_URL/" --connect-timeout 5 2>/dev/null)

if [ "$RESPONSE" = "200" ]; then
    # Ollama responde, testar se modelo carrega
    MODEL_CHECK=$(curl -s "$OLLAMA_URL/api/ps" --connect-timeout 5 2>/dev/null)
    if echo "$MODEL_CHECK" | grep -q "qwen"; then
        exit 0  # Tudo OK, sai silencioso
    fi
    echo "$(timestamp) WARN: Ollama rodando mas modelo não carregado. Fazendo warm-up..." >> "$LOG"
    curl -s "$OLLAMA_URL/api/generate" -d '{"model":"qwen2.5:14b","prompt":"hi","stream":false}' --max-time 60 > /dev/null 2>&1 &
    exit 0
fi

echo "$(timestamp) ERROR: Ollama não responde (HTTP $RESPONSE). Reiniciando..." >> "$LOG"

# 2. Matar tunnel antigo
pkill -f "ssh.*${VAST_HOST}.*11435" 2>/dev/null
sleep 2

# 3. Reiniciar Ollama na Vast.ai (matar runners duplicados)
ssh -p "$VAST_PORT" -i "$VAST_KEY" "root@${VAST_HOST}" \
    -o ConnectTimeout=10 -o StrictHostKeyChecking=no \
    -o BatchMode=yes \
    "pkill -f 'ollama runner'; sleep 1; pkill -f 'ollama serve'; sleep 2; OLLAMA_HOST=0.0.0.0 nohup ollama serve &>/tmp/ollama.log &" 2>/dev/null

echo "$(timestamp) Ollama reiniciado na Vast.ai" >> "$LOG"
sleep 5

# 4. Recriar tunnel
/usr/bin/ssh -N -f \
    -L 11435:localhost:11434 \
    -p "$VAST_PORT" "root@${VAST_HOST}" \
    -i "$VAST_KEY" \
    -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes 2>/dev/null

echo "$(timestamp) Tunnel recriado" >> "$LOG"
sleep 3

# 5. Warm-up do modelo
curl -s "$OLLAMA_URL/api/generate" -d '{"model":"qwen2.5:14b","prompt":"hi","stream":false}' --max-time 90 > /dev/null 2>&1

# 6. Verificar
FINAL=$(curl -s -o /dev/null -w "%{http_code}" "$OLLAMA_URL/" --connect-timeout 5 2>/dev/null)
if [ "$FINAL" = "200" ]; then
    echo "$(timestamp) OK: Recuperado com sucesso" >> "$LOG"
    pm2 restart rubybot-ai --silent 2>/dev/null
else
    echo "$(timestamp) FAIL: Não conseguiu recuperar (HTTP $FINAL)" >> "$LOG"
fi
