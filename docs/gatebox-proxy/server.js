/**
 * Servidor Gatebox - IP Fixo
 * 
 * Recebe chamadas das Edge Functions do Supabase e encaminha para a API Gatebox.
 * Rode no seu VPS com IP fixo para evitar bloqueio de IP dinâmico.
 * 
 * Endpoints:
 *   POST /api/gatebox/withdraw  — Endpoint dedicado para saques (autentica + envia PIX OUT)
 *   POST /                      — Proxy genérico (depósitos e outras operações)
 * 
 * Variáveis de ambiente:
 *   PROXY_AUTH_SECRET   - Token para autenticar as Edge Functions
 *   GATEBOX_USERNAME    - Usuário da API Gatebox
 *   GATEBOX_PASSWORD    - Senha da API Gatebox
 *   GATEBOX_BASE_URL    - URL base da Gatebox (padrão: https://api.gatebox.com.br)
 *   PORT                - Porta (padrão: 3100)
 */

const http = require("http");

const PORT = parseInt(process.env.PORT || "3100", 10);
const PROXY_AUTH_SECRET = process.env.PROXY_AUTH_SECRET || "";
const GATEBOX_BASE_URL = (process.env.GATEBOX_BASE_URL || "https://api.gatebox.com.br").replace(/\/$/, "");
const GATEBOX_USERNAME = process.env.GATEBOX_USERNAME || "";
const GATEBOX_PASSWORD = process.env.GATEBOX_PASSWORD || "";

if (!PROXY_AUTH_SECRET) {
  console.error("ERRO: PROXY_AUTH_SECRET não configurado!");
  process.exit(1);
}

// --- Token cache ---
let tokenCache = null; // { token, expiresAt }

async function gateboxAuth() {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  if (!GATEBOX_USERNAME || !GATEBOX_PASSWORD) {
    throw new Error("GATEBOX_USERNAME/GATEBOX_PASSWORD não configurados no servidor");
  }

  const url = `${GATEBOX_BASE_URL}/v1/customers/auth/sign-in`;
  console.log(`[${new Date().toISOString()}] Auth → ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: GATEBOX_USERNAME, password: GATEBOX_PASSWORD }),
  });

  const text = await response.text();
  if (response.status >= 400) {
    throw new Error(`Gatebox auth error (${response.status}): ${text}`);
  }

  const data = JSON.parse(text);
  if (!data.access_token) {
    throw new Error("Token não retornado pela Gatebox");
  }

  const expiresIn = data.expires_in || 3600;
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn - 60) * 1000,
  };

  return data.access_token;
}

// --- Auth middleware ---
function checkAuth(req) {
  const authHeader = req.headers["authorization"] || "";
  return authHeader === `Bearer ${PROXY_AUTH_SECRET}`;
}

// --- Parse URL ---
function getPathname(req) {
  try {
    return new URL(req.url, `http://localhost:${PORT}`).pathname;
  } catch {
    return req.url;
  }
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === "GET" && getPathname(req) === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, ts: Date.now() }));
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  // Autenticação
  if (!checkAuth(req)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Unauthorized" }));
  }

  // Ler body
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Invalid JSON" }));
  }

  const pathname = getPathname(req);

  // ====== ENDPOINT DEDICADO: /api/gatebox/withdraw ======
  if (pathname === "/api/gatebox/withdraw") {
    const { externalId, amount, key, pixKeyType, name, description, documentNumber } = parsed;

    if (!externalId || !amount || !key || !pixKeyType || !name) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Campos obrigatórios: externalId, amount, key, pixKeyType, name" }));
    }

    console.log(`[${new Date().toISOString()}] Withdraw → externalId=${externalId} amount=${amount} key=${key} documentNumber=${documentNumber || 'N/A'}`);

    try {
      // 1. Autenticar na Gatebox (com cache)
      const token = await gateboxAuth();

      // 2. Chamar PIX OUT — Gatebox NÃO usa pixKeyType (Postman); envia só key, documentNumber
      // Enviar pixKeyType faz a Gatebox interpretar como telefone e dar "invalid phone format"
      const withdrawUrl = `${GATEBOX_BASE_URL}/v1/customers/pix/withdraw`;
      const withdrawBody = { externalId, amount, key, name };
      if (description) withdrawBody.description = description;
      if (documentNumber) {
        const cleanDoc = String(documentNumber).replace(/\D/g, "");
        if (cleanDoc.length === 11 || cleanDoc.length === 14) {
          withdrawBody.documentNumber = cleanDoc;
        }
      }

      console.log(`[${new Date().toISOString()}] Withdraw → POST ${withdrawUrl}`);

      const response = await fetch(withdrawUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(withdrawBody),
      });

      const responseText = await response.text();
      console.log(`[${new Date().toISOString()}] Gatebox withdraw respondeu: ${response.status}`);

      res.writeHead(response.status, { "Content-Type": "application/json" });
      return res.end(responseText);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Erro withdraw:`, err.message);
      res.writeHead(502, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: `Server withdraw error: ${err.message}` }));
    }
  }

  // ====== PROXY GENÉRICO (depósitos e outras operações) ======
  const { path, method, headers, payload } = parsed;

  if (!path || !path.startsWith("/v1/customers/")) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Invalid path. Must start with /v1/customers/" }));
  }

  const targetUrl = `${GATEBOX_BASE_URL}${path}`;
  console.log(`[${new Date().toISOString()}] Proxy → ${method || "POST"} ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: method || "POST",
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    const responseText = await response.text();
    console.log(`[${new Date().toISOString()}] Gatebox respondeu: ${response.status}`);

    res.writeHead(response.status, { "Content-Type": "application/json" });
    res.end(responseText);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Erro no proxy:`, err.message);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: `Proxy error: ${err.message}` }));
  }
});

server.listen(PORT, () => {
  console.log(`Gatebox Server rodando na porta ${PORT}`);
  console.log(`  POST /api/gatebox/withdraw  → Saques (auth + PIX OUT)`);
  console.log(`  POST /                      → Proxy genérico`);
});
