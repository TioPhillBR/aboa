/**
 * Cliente Gatebox para Supabase Edge Functions (Deno)
 * 
 * PIX IN (depósito/QR Code) → chamada DIRETA à Gatebox (sem proxy)
 * PIX OUT (saque/payout)     → via proxy VPS com IP fixo
 */

export interface GateboxConfig {
  username: string;
  password: string;
  baseUrl?: string;
}

export interface GateboxCreatePixPayload {
  externalId: string;
  amount: number;
  document?: string;
  name?: string;
  email?: string;
  phone?: string;
  identification?: string;
  expire?: number;
  description?: string;
}

export interface GateboxCreatePixResponse {
  qrCode?: string;
  qrCodeText?: string;
  transactionId?: string;
  endToEnd?: string;
  expiresAt?: string;
}

export interface GateboxPayoutPayload {
  externalId: string;
  amount: number;
  key: string;
  pixKeyType: string;
  name: string;
  description?: string;
}

export interface GateboxPayoutResponse {
  transactionId?: string;
  status?: string;
  endToEnd?: string;
}

let tokenCache: { token: string; expiresAt: number } | null = null;

function sanitizeSecret(value?: string): string {
  if (!value) return "";
  return value
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/^=/, "")
    .replace(/^GATEBOX_(?:USERNAME|PASSWORD|BASE_URL)\s*=\s*/i, "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

function sanitizeBaseUrl(value?: string): string {
  const cleaned = sanitizeSecret(value || "https://api.gatebox.com.br").replace(/\/$/, "");
  return cleaned || "https://api.gatebox.com.br";
}

// --- Proxy helper ---

interface ProxyConfig {
  proxyUrl: string;
  proxySecret: string;
}

function getProxyConfig(): ProxyConfig | null {
  const proxyUrl = (Deno.env.get("GATEBOX_PROXY_URL") || "").trim().replace(/\/$/, "");
  const proxySecret = (Deno.env.get("GATEBOX_PROXY_SECRET") || "").trim();
  if (proxyUrl && proxySecret) {
    return { proxyUrl, proxySecret };
  }
  return null;
}

/**
 * Faz uma chamada à Gatebox, diretamente ou via proxy.
 * @param useProxy - se true, tenta usar o proxy. Se false, sempre chama direto.
 */
async function gateboxFetch(
  path: string,
  method: string,
  headers: Record<string, string>,
  body?: Record<string, unknown>,
  useProxy = true
): Promise<{ status: number; text: string }> {
  const proxy = useProxy ? getProxyConfig() : null;
  const TIMEOUT_MS = 25_000;

  if (proxy) {
    console.log(`Gatebox via PROXY → ${method} ${path}`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const proxyResponse = await fetch(proxy.proxyUrl, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${proxy.proxySecret}`,
        },
        body: JSON.stringify({ path, method, headers, payload: body }),
      });
      const text = await proxyResponse.text();
      console.log(`Proxy respondeu: ${proxyResponse.status} (${text.length} bytes)`);
      return { status: proxyResponse.status, text };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error(`Proxy timeout: sem resposta em ${TIMEOUT_MS / 1000}s. Verifique se o VPS está online.`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // Chamada direta
  const baseUrl = sanitizeBaseUrl(Deno.env.get("GATEBOX_BASE_URL"));
  const url = `${baseUrl}${path}`;
  console.log(`Gatebox DIRETO → ${method} ${url}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    return { status: response.status, text };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`Gatebox timeout: sem resposta em ${TIMEOUT_MS / 1000}s.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// --- Auth ---

/**
 * @param useProxy - repassado ao gateboxFetch
 */
export async function gateboxAuthenticate(config: GateboxConfig, useProxy = true): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  const username = sanitizeSecret(config.username);
  const password = sanitizeSecret(config.password);

  if (!username || !password) {
    throw new Error("Credenciais Gatebox ausentes ou mal formatadas nos secrets");
  }

  console.log("Gatebox auth metadata", {
    usernameLength: username.length,
    passwordLength: password.length,
    usingProxy: useProxy && !!getProxyConfig(),
  });

  const result = await gateboxFetch(
    "/v1/customers/auth/sign-in",
    "POST",
    {},
    { username, password },
    useProxy
  );

  if (result.status >= 400) {
    if (result.status === 400 && (/statusCode.*420/.test(result.text) || /username or password/i.test(result.text))) {
      throw new Error(`Gatebox auth error (${result.status}): credenciais inválidas. Detalhe: ${result.text}`);
    }
    throw new Error(`Gatebox auth error (${result.status}): ${result.text}`);
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(result.text);
  } catch {
    throw new Error(`Gatebox auth: resposta não-JSON: ${result.text.substring(0, 200)}`);
  }

  if (!data.access_token) {
    throw new Error("Token não retornado pela Gatebox");
  }

  const expiresIn = (data.expires_in as number) || 3600;
  tokenCache = {
    token: data.access_token as string,
    expiresAt: Date.now() + (expiresIn - 60) * 1000,
  };

  return data.access_token as string;
}

// --- PIX IN (QR Code) — DIRETO (sem proxy) ---

export async function gateboxCreatePix(
  config: GateboxConfig,
  payload: GateboxCreatePixPayload
): Promise<GateboxCreatePixResponse> {
  // Depósitos usam chamada DIRETA (sem proxy) — o proxy é só para PIX OUT
  const token = await gateboxAuthenticate(config, false);

  const body: Record<string, unknown> = {
    externalId: payload.externalId,
    amount: payload.amount,
    expire: payload.expire ?? 3600,
  };
  if (payload.document) body.document = payload.document;
  if (payload.name) body.name = payload.name;
  if (payload.email) body.email = payload.email;
  if (payload.phone) body.phone = payload.phone;
  if (payload.identification) body.identification = payload.identification;
  if (payload.description) body.description = payload.description;

  console.log("Gatebox PIX IN (depósito) → chamada DIRETA (sem proxy)");

  const result = await gateboxFetch(
    "/v1/customers/pix/create-immediate-qrcode",
    "POST",
    { Authorization: `Bearer ${token}` },
    body,
    false // DIRETO — sem proxy para depósitos
  );

  if (result.status >= 400) {
    throw new Error(`Gatebox PIX error (${result.status}): ${result.text}`);
  }

  let responseData: Record<string, unknown>;
  try {
    responseData = JSON.parse(result.text);
  } catch {
    throw new Error(`Gatebox PIX: resposta não-JSON: ${result.text.substring(0, 200)}`);
  }

  const data = (responseData.data as Record<string, unknown>) || responseData;

  return {
    qrCode: (data.qrCode || data.qrCodeImage || data.qrcode || data.qrcodeImage) as string | undefined,
    qrCodeText: (data.key || data.qrCodeText || data.qrCode || data.qrcodeText || data.qrcode) as string | undefined,
    transactionId: (data.identifier || data.uuid || data.transactionId || data.id || data.transaction_id) as string | undefined,
    endToEnd: (data.endToEnd || data.end_to_end || data.endToEndId) as string | undefined,
    expiresAt: (data.expiresAt || data.expireAt || data.expires_at) as string | undefined,
  };
}

// --- PIX OUT (Saque / Payout) — VIA PROXY (IP fixo) ---

export async function gateboxCreatePayout(
  config: GateboxConfig,
  payload: GateboxPayoutPayload
): Promise<GateboxPayoutResponse> {
  const token = await gateboxAuthenticate(config, true); // VIA PROXY

  const body: Record<string, unknown> = {
    externalId: payload.externalId,
    amount: payload.amount,
    key: payload.key,
    pixKeyType: payload.pixKeyType,
    name: payload.name,
  };
  if (payload.description) body.description = payload.description;

  const result = await gateboxFetch(
    "/v1/customers/pix/withdraw",
    "POST",
    { Authorization: `Bearer ${token}` },
    body,
    true // VIA PROXY
  );

  if (result.status >= 400) {
    throw new Error(`Gatebox Payout error (${result.status}): ${result.text}`);
  }

  let parsedBody: unknown = null;
  try {
    parsedBody = JSON.parse(result.text);
  } catch {
    parsedBody = result.text;
  }

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === "object" && !Array.isArray(value);

  const responseObj = isRecord(parsedBody) ? parsedBody : null;
  const dataCandidate = responseObj?.data;
  const data = isRecord(dataCandidate) ? dataCandidate : responseObj;

  if (!data) {
    console.error("Gatebox payout response inválida", { status: result.status, rawBody: result.text });
    throw new Error("Gatebox Payout response inválida: corpo vazio ou formato não suportado");
  }

  const transactionIdRaw = data.identifier ?? data.uuid ?? data.transactionId ?? data.id ?? data.transaction_id;
  const statusRaw = data.status;
  const endToEndRaw = data.endToEnd ?? data.end_to_end;

  const transactionId = (typeof transactionIdRaw === "string" || typeof transactionIdRaw === "number") ? String(transactionIdRaw) : undefined;
  const status = (typeof statusRaw === "string" || typeof statusRaw === "number") ? String(statusRaw) : undefined;
  const endToEnd = (typeof endToEndRaw === "string" || typeof endToEndRaw === "number") ? String(endToEndRaw) : undefined;

  if (!transactionId && !status && !endToEnd) {
    console.error("Gatebox payout response sem campos esperados", { statusCode: result.status, rawBody: result.text });
    throw new Error("Gatebox Payout response sem transactionId/status/endToEnd");
  }

  return { transactionId, status, endToEnd };
}
