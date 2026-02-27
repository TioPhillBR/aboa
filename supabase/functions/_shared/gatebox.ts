/**
 * Cliente Gatebox para Supabase Edge Functions (Deno)
 * Baseado na API documentada na coleção Postman
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

export async function gateboxAuthenticate(config: GateboxConfig): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  const username = sanitizeSecret(config.username);
  const password = sanitizeSecret(config.password);

  if (!username || !password) {
    throw new Error("Credenciais Gatebox ausentes ou mal formatadas nos secrets");
  }

  const baseUrl = sanitizeBaseUrl(config.baseUrl);
  const url = `${baseUrl}/v1/customers/auth/sign-in`;

  console.log("Gatebox auth metadata", {
    usernameLength: username.length,
    passwordLength: password.length,
    usernameHasWhitespace: /\s/.test(username),
    passwordHasWhitespace: /\s/.test(password),
    baseUrl,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 400 && (errText.includes('"statusCode":420') || /username or password/i.test(errText))) {
      throw new Error(`Gatebox auth error (${response.status}): credenciais inválidas (verifique GATEBOX_USERNAME/GATEBOX_PASSWORD no ambiente correto). Detalhe: ${errText}`);
    }
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
  const baseUrl = sanitizeBaseUrl(config.baseUrl);
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

  const response = await fetch(url, {
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

// --- PIX Payout (Transferência / Saque) ---

export interface GateboxPayoutPayload {
  externalId: string;
  amount: number;
  pixKey: string;
  pixKeyType: string; // cpf, cnpj, email, phone, random
  description?: string;
}

export interface GateboxPayoutResponse {
  transactionId?: string;
  status?: string;
  endToEnd?: string;
}

export async function gateboxCreatePayout(
  config: GateboxConfig,
  payload: GateboxPayoutPayload
): Promise<GateboxPayoutResponse> {
  const baseUrl = sanitizeBaseUrl(config.baseUrl);
  const url = `${baseUrl}/v1/customers/pix/create-payout`;

  const token = await gateboxAuthenticate(config);

  const body: Record<string, unknown> = {
    externalId: payload.externalId,
    amount: payload.amount,
    pixKey: payload.pixKey,
    pixKeyType: payload.pixKeyType,
  };
  if (payload.description) body.description = payload.description;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const rawBody = await response.text();
  let parsedBody: unknown = null;

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = rawBody;
    }
  }

  if (!response.ok) {
    const errText = typeof parsedBody === "string"
      ? parsedBody
      : JSON.stringify(parsedBody ?? { message: "Sem corpo de resposta" });

    throw new Error(`Gatebox Payout error (${response.status}): ${errText}`);
  }

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === "object" && !Array.isArray(value);

  const responseObj = isRecord(parsedBody) ? parsedBody : null;
  const dataCandidate = responseObj?.data;
  const data = isRecord(dataCandidate) ? dataCandidate : responseObj;

  if (!data) {
    console.error("Gatebox payout response inválida (formato inesperado)", {
      status: response.status,
      rawBody,
    });
    throw new Error("Gatebox Payout response inválida: corpo vazio ou formato não suportado");
  }

  const transactionIdRaw = data.identifier ?? data.uuid ?? data.transactionId ?? data.id ?? data.transaction_id;
  const statusRaw = data.status;
  const endToEndRaw = data.endToEnd ?? data.end_to_end;

  const transactionId =
    typeof transactionIdRaw === "string" || typeof transactionIdRaw === "number"
      ? String(transactionIdRaw)
      : undefined;
  const status =
    typeof statusRaw === "string" || typeof statusRaw === "number"
      ? String(statusRaw)
      : undefined;
  const endToEnd =
    typeof endToEndRaw === "string" || typeof endToEndRaw === "number"
      ? String(endToEndRaw)
      : undefined;

  if (!transactionId && !status && !endToEnd) {
    console.error("Gatebox payout response sem campos esperados", {
      statusCode: response.status,
      rawBody,
    });
    throw new Error("Gatebox Payout response sem transactionId/status/endToEnd");
  }

  return {
    transactionId,
    status,
    endToEnd,
  };
}
