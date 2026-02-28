/**
 * Cliente Gatebox para Supabase Edge Functions (Deno)
 * Baseado na API documentada na coleção Postman
 */

const GATEBOX_TIMEOUT_MS = 25000; // 25 segundos - evita espera de 2+ minutos

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = GATEBOX_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`Gatebox timeout (${timeoutMs / 1000}s) - verifique conexão e credenciais`);
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

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

let tokenCache: { token: string; expiresAt: number } | null = null;

export async function gateboxAuthenticate(config: GateboxConfig): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  const baseUrl = (config.baseUrl || "https://api.gatebox.com.br").replace(/\/$/, "");
  const url = `${baseUrl}/v1/customers/auth/sign-in`;

  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: config.username,
      password: config.password,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gatebox auth error (${response.status}): ${errText}`);
  }

  const data = await response.json();
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

export async function gateboxCreatePix(
  config: GateboxConfig,
  payload: GateboxCreatePixPayload
): Promise<GateboxCreatePixResponse> {
  const baseUrl = (config.baseUrl || "https://api.gatebox.com.br").replace(/\/$/, "");
  const url = `${baseUrl}/v1/customers/pix/create-immediate-qrcode`;

  const token = await gateboxAuthenticate(config);

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

  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gatebox PIX error (${response.status}): ${errText}`);
  }

  const responseData = await response.json();
  const data = responseData.data || responseData;

  return {
    qrCode: data.qrCode || data.qrCodeImage || data.qrcode || data.qrcodeImage,
    qrCodeText: data.key || data.qrCodeText || data.qrCode || data.qrcodeText || data.qrcode,
    transactionId: data.identifier || data.uuid || data.transactionId || data.id || data.transaction_id,
    endToEnd: data.endToEnd || data.end_to_end || data.endToEndId,
    expiresAt: data.expiresAt || data.expireAt || data.expires_at,
  };
}

/** Payload para Cash-Out (saque) - conforme Postman Gatebox */
export interface GateboxWithdrawPayload {
  externalId: string;
  key: string;
  name: string;
  amount: number;
  description?: string;
  documentNumber?: string; // CPF/CNPJ do recebedor - obrigatório se validação de chave ativa
}

/** Resposta do Cash-Out */
export interface GateboxWithdrawResponse {
  transactionId?: string;
  endToEnd?: string;
  status?: string;
}

/**
 * Cash-Out: envia PIX para o recebedor (saque).
 * Quando GATEBOX_PROXY_URL está configurado, usa o endpoint dedicado do servidor
 * (IP fixo whitelistado na Gatebox). Caso contrário, chama a Gatebox diretamente.
 */
export async function gateboxWithdraw(
  config: GateboxConfig,
  payload: GateboxWithdrawPayload
): Promise<GateboxWithdrawResponse> {
  const serverUrl = (Deno.env.get("GATEBOX_PROXY_URL") || "").trim().replace(/\/$/, "");
  const serverSecret = (Deno.env.get("GATEBOX_PROXY_SECRET") || "").trim();

  if (serverUrl && serverSecret) {
    // Via servidor dedicado (IP fixo) — Gatebox exige whitelist para saques
    const withdrawEndpoint = `${serverUrl}/api/gatebox/withdraw`;

    const body: Record<string, unknown> = {
      externalId: payload.externalId,
      key: payload.key,
      name: payload.name,
      amount: payload.amount,
    };
    if (payload.description) body.description = payload.description;
    if (payload.documentNumber) {
      const doc = payload.documentNumber.replace(/\D/g, "");
      if (doc.length === 11 || doc.length === 14) body.documentNumber = doc;
    }

    const response = await fetchWithTimeout(withdrawEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serverSecret}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gatebox withdraw error (${response.status}): ${errText}`);
    }

    const responseData = await response.json();
    const data = responseData.data || responseData;

    return {
      transactionId: data.identifier || data.uuid || data.transactionId || data.id,
      endToEnd: data.endToEnd || data.end_to_end,
      status: data.status,
    };
  }

  // Chamada direta (sem proxy) — útil para dev/teste; em produção pode dar 403
  const baseUrl = (config.baseUrl || "https://api.gatebox.com.br").replace(/\/$/, "");
  const url = `${baseUrl}/v1/customers/pix/withdraw`;

  const token = await gateboxAuthenticate(config);

  const body: Record<string, unknown> = {
    externalId: payload.externalId,
    key: payload.key,
    name: payload.name,
    amount: payload.amount,
  };
  if (payload.description) body.description = payload.description;
  if (payload.documentNumber) {
    const doc = payload.documentNumber.replace(/\D/g, "");
    if (doc.length === 11 || doc.length === 14) {
      body.documentNumber = doc;
    }
  }

  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gatebox withdraw error (${response.status}): ${errText}`);
  }

  const responseData = await response.json();
  const data = responseData.data || responseData;

  return {
    transactionId: data.identifier || data.uuid || data.transactionId || data.id,
    endToEnd: data.endToEnd || data.end_to_end,
    status: data.status,
  };
}
