/**
 * Servidor Gatebox - IP fixo para whitelist
 * Endpoint dedicado para saques + proxy genérico
 */
const http = require("http");

const PORT = parseInt(process.env.PORT || "3100", 10);
const PROXY_AUTH_SECRET = process.env.PROXY_AUTH_SECRET || "";
const GATEBOX_USERNAME = process.env.GATEBOX_USERNAME || "";
const GATEBOX_PASSWORD = process.env.GATEBOX_PASSWORD || "";
const GATEBOX_BASE_URL = (process.env.GATEBOX_BASE_URL || "https://api.gatebox.com.br").replace(/\/$/, "");

if (!PROXY_AUTH_SECRET) {
  console.error("ERRO: PROXY_AUTH_SECRET não configurado!");
  process.exit(1);
}

let tokenCache = { token: null, expiresAt: 0 };

async function gateboxAuth() {
  if (tokenCache.token && tokenCache.expiresAt > Date.now()) {
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

function checkAuth(req) {
  const authHeader = req.headers["authorization"] || "";
  return authHeader === `Bearer ${PROXY_AUTH_SECRET}`;
}

function getPathname(req) {
  try {
    return new URL(req.url, `http://localhost:${PORT}`).pathname;
  } catch {
    return req.url;
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");

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

  if (!checkAuth(req)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Unauthorized" }));
  }

  let body = "";
  for await (const chunk of req) body += chunk;

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
    const { externalId, amount, key, name, description, documentNumber } = parsed;

    if (!externalId || !amount || !key || !name) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Campos obrigatórios: externalId, amount, key, name" }));
    }

    console.log(`[${new Date().toISOString()}] Withdraw → externalId=${externalId} amount=${amount} key=${key}`);

    try {
      const token = await gateboxAuth();

      const withdrawUrl = `${GATEBOX_BASE_URL}/v1/customers/pix/withdraw`;
      const withdrawBody = { externalId, amount: parseFloat(amount), key, name };
      if (description) withdrawBody.description = description;
      if (documentNumber) {
        const doc = String(documentNumber).replace(/\D/g, "");
        if (doc.length === 11 || doc.length === 14) withdrawBody.documentNumber = doc;
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
      headers: { "Content-Type": "application/json", ...(headers || {}) },
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
  console.log(`  GET  /health              → Health check`);
  console.log(`  POST /api/gatebox/withdraw → Saques (auth + PIX OUT)`);
  console.log(`  POST /                    → Proxy genérico`);
});
