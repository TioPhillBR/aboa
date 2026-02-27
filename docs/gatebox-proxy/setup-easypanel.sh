#!/bin/bash
# ============================================
# Proxy Gatebox - Instalação para EasyPanel
# Cole este script inteiro no console do EasyPanel
# ============================================

set -e

echo "=========================================="
echo "  Proxy Gatebox - Setup EasyPanel"
echo "=========================================="

# 1. Criar diretório
mkdir -p /opt/gatebox-proxy/logs
cd /opt/gatebox-proxy

# 2. Verificar/instalar Node.js
if ! command -v node &> /dev/null; then
  echo "→ Instalando Node.js..."
  if command -v apk &> /dev/null; then
    apk add --no-cache nodejs npm
  elif command -v apt-get &> /dev/null; then
    apt-get update && apt-get install -y curl
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  elif command -v yum &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
  fi
fi
echo "✓ Node.js $(node -v)"

# 3. Gerar token
TOKEN=$(cat /dev/urandom | tr -dc 'a-f0-9' | head -c 64)
echo ""
echo "=========================================="
echo "  TOKEN GERADO (GUARDE!):"
echo "  $TOKEN"
echo "=========================================="
echo ""

# 4. Criar package.json
cat > /opt/gatebox-proxy/package.json << 'PKGEOF'
{
  "name": "gatebox-proxy",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": { "start": "node server.js" }
}
PKGEOF

# 5. Criar server.js
cat > /opt/gatebox-proxy/server.js << 'SRVEOF'
const http = require("http");

const PORT = parseInt(process.env.PORT || "3100", 10);
const PROXY_AUTH_SECRET = process.env.PROXY_AUTH_SECRET || "";
const GATEBOX_BASE_URL = "https://api.gatebox.com.br";

if (!PROXY_AUTH_SECRET) {
  console.error("ERRO: PROXY_AUTH_SECRET nao configurado!");
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  const authHeader = req.headers["authorization"] || "";
  if (authHeader !== "Bearer " + PROXY_AUTH_SECRET) {
    res.writeHead(401, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Unauthorized" }));
  }

  let body = "";
  for await (const chunk of req) { body += chunk; }

  let parsed;
  try { parsed = JSON.parse(body); } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Invalid JSON" }));
  }

  const { path, method, headers, payload } = parsed;

  if (!path || !path.startsWith("/v1/customers/")) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Invalid path" }));
  }

  const targetUrl = GATEBOX_BASE_URL + path;
  console.log("[" + new Date().toISOString() + "] Proxy -> " + (method || "POST") + " " + targetUrl);

  try {
    const response = await fetch(targetUrl, {
      method: method || "POST",
      headers: { "Content-Type": "application/json", ...(headers || {}) },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    const responseText = await response.text();
    console.log("[" + new Date().toISOString() + "] Gatebox: " + response.status);

    res.writeHead(response.status, { "Content-Type": "application/json" });
    res.end(responseText);
  } catch (err) {
    console.error("[" + new Date().toISOString() + "] Erro:", err.message);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Proxy error: " + err.message }));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Gatebox Proxy rodando na porta " + PORT);
});
SRVEOF

# 6. Instalar deps
cd /opt/gatebox-proxy && npm install

# 7. Iniciar o proxy
export PROXY_AUTH_SECRET="$TOKEN"
echo "PROXY_AUTH_SECRET=$TOKEN" > /opt/gatebox-proxy/.env

# Tentar PM2, senão roda com nohup
if command -v pm2 &> /dev/null; then
  pm2 delete gatebox-proxy 2>/dev/null || true
  PROXY_AUTH_SECRET="$TOKEN" pm2 start /opt/gatebox-proxy/server.js --name gatebox-proxy
  pm2 save
  echo "✓ Rodando via PM2"
else
  # Instalar PM2
  npm install -g pm2 2>/dev/null || true
  if command -v pm2 &> /dev/null; then
    PROXY_AUTH_SECRET="$TOKEN" pm2 start /opt/gatebox-proxy/server.js --name gatebox-proxy
    pm2 save
    echo "✓ Rodando via PM2"
  else
    # Fallback: nohup
    nohup env PROXY_AUTH_SECRET="$TOKEN" node /opt/gatebox-proxy/server.js > /opt/gatebox-proxy/logs/output.log 2>&1 &
    echo "✓ Rodando via nohup (PID: $!)"
  fi
fi

echo ""
echo "=========================================="
echo "  ✅ PROXY ATIVO NA PORTA 3100"
echo "=========================================="
echo ""
echo "  No Supabase (Edge Functions → Secrets):"
echo "  GATEBOX_PROXY_URL = http://IP_DO_VPS:3100"
echo "  GATEBOX_PROXY_SECRET = $TOKEN"
echo ""
echo "  Teste: curl http://localhost:3100 (deve retornar 405)"
echo ""
