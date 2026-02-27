/**
 * Proxy Gatebox - IP Fixo
 * 
 * Recebe chamadas das Edge Functions do Supabase e encaminha para a API Gatebox.
 * Rode no seu VPS com IP fixo para evitar bloqueio de IP dinâmico.
 * 
 * Variáveis de ambiente:
 *   PROXY_AUTH_SECRET  - Token para autenticar as Edge Functions
 *   PORT               - Porta (padrão: 3100)
 */

const http = require("http");

const PORT = parseInt(process.env.PORT || "3100", 10);
const PROXY_AUTH_SECRET = process.env.PROXY_AUTH_SECRET || "";
const GATEBOX_BASE_URL = "https://api.gatebox.com.br";

if (!PROXY_AUTH_SECRET) {
  console.error("ERRO: PROXY_AUTH_SECRET não configurado!");
  process.exit(1);
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

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  // Autenticação
  const authHeader = req.headers["authorization"] || "";
  if (authHeader !== `Bearer ${PROXY_AUTH_SECRET}`) {
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

  const { path, method, headers, payload } = parsed;

  // Validação de segurança: só permite rotas Gatebox
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
  console.log(`Gatebox Proxy rodando na porta ${PORT}`);
});
