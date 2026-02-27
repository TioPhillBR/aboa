#!/bin/bash
# ============================================
# Script de instalação do Proxy Gatebox
# Execute no VPS com: bash setup.sh
# ============================================

set -e

echo "=========================================="
echo "  Instalação do Proxy Gatebox - IP Fixo"
echo "=========================================="

# 1. Instalar Node.js 20 LTS (se não existir)
if ! command -v node &> /dev/null; then
  echo ""
  echo "→ Instalando Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  echo "✓ Node.js $(node -v) instalado"
else
  echo "✓ Node.js já instalado: $(node -v)"
fi

# 2. Instalar PM2 globalmente (se não existir)
if ! command -v pm2 &> /dev/null; then
  echo ""
  echo "→ Instalando PM2 (gerenciador de processos)..."
  sudo npm install -g pm2
  echo "✓ PM2 instalado"
else
  echo "✓ PM2 já instalado: $(pm2 -v)"
fi

# 3. Criar diretório do proxy
echo ""
echo "→ Configurando diretório /opt/gatebox-proxy..."
sudo mkdir -p /opt/gatebox-proxy
sudo chown $USER:$USER /opt/gatebox-proxy

# 4. Copiar arquivos (se não estiver rodando do diretório correto)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "$SCRIPT_DIR" != "/opt/gatebox-proxy" ]; then
  cp "$SCRIPT_DIR/server.js" /opt/gatebox-proxy/
  cp "$SCRIPT_DIR/package.json" /opt/gatebox-proxy/
fi

cd /opt/gatebox-proxy

# 5. Instalar dependências
echo ""
echo "→ Instalando dependências..."
npm install

# 6. Configurar token de autenticação
echo ""
echo "=========================================="
echo "  CONFIGURAÇÃO DO TOKEN DE SEGURANÇA"
echo "=========================================="

if [ -z "$PROXY_AUTH_SECRET" ]; then
  # Gerar token aleatório
  GENERATED_TOKEN=$(openssl rand -hex 32)
  echo ""
  echo "Token gerado automaticamente:"
  echo ""
  echo "  $GENERATED_TOKEN"
  echo ""
  echo "⚠️  GUARDE ESTE TOKEN! Você precisará adicioná-lo como"
  echo "   secret GATEBOX_PROXY_SECRET no Supabase."
  echo ""

  # Salvar em arquivo .env local
  echo "PROXY_AUTH_SECRET=$GENERATED_TOKEN" > /opt/gatebox-proxy/.env
  echo "✓ Token salvo em /opt/gatebox-proxy/.env"
else
  echo "✓ Token já configurado via variável de ambiente"
  echo "PROXY_AUTH_SECRET=$PROXY_AUTH_SECRET" > /opt/gatebox-proxy/.env
fi

# 7. Criar arquivo ecosystem para PM2
cat > /opt/gatebox-proxy/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: "gatebox-proxy",
    script: "server.js",
    cwd: "/opt/gatebox-proxy",
    env_file: "/opt/gatebox-proxy/.env",
    env: {
      NODE_ENV: "production",
      PORT: 3100
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "100M",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "/opt/gatebox-proxy/logs/error.log",
    out_file: "/opt/gatebox-proxy/logs/output.log",
  }]
};
EOF

# 8. Criar diretório de logs
mkdir -p /opt/gatebox-proxy/logs

# 9. Carregar .env e iniciar com PM2
echo ""
echo "→ Iniciando proxy com PM2..."
set -a
source /opt/gatebox-proxy/.env
set +a

pm2 delete gatebox-proxy 2>/dev/null || true
pm2 start /opt/gatebox-proxy/ecosystem.config.js
pm2 save

# 10. Configurar PM2 para iniciar no boot
echo ""
echo "→ Configurando auto-start no boot..."
pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || echo "(execute manualmente o comando sugerido pelo PM2 acima)"
pm2 save

# 11. Mostrar status
echo ""
echo "=========================================="
echo "  ✅ INSTALAÇÃO CONCLUÍDA!"
echo "=========================================="
echo ""
echo "  Proxy rodando na porta 3100"
echo "  Status: pm2 status"
echo "  Logs:   pm2 logs gatebox-proxy"
echo ""
echo "  Próximos passos:"
echo "  1. Adicione o IP deste VPS na whitelist da Gatebox"
echo "  2. No Supabase (Edge Functions → Secrets), adicione:"
echo "     - GATEBOX_PROXY_URL = http://$(hostname -I | awk '{print $1}'):3100"
echo "     - GATEBOX_PROXY_SECRET = (token mostrado acima)"
echo ""
echo "  Para HTTPS (recomendado em produção):"
echo "  - Instale nginx + certbot"
echo "  - Configure proxy_pass para localhost:3100"
echo ""
