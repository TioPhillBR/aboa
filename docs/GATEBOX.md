# Integração Gatebox - PIX

A integração com o gateway Gatebox permite depósitos e saques PIX reais na plataforma.

---

## 1. PIX IN — generate-pix (Depósito)

**Endpoint Gatebox:** `POST /v1/customers/pix/create-immediate-qrcode`

| Campo | Tipo | Obrigatório | Regra |
|-------|------|-------------|-------|
| externalId | string | ✅ | `deposito_{userId}_{timestamp}` |
| amount | number | ✅ | Mínimo R$ 5,00, 2 casas decimais |
| expire | number | ✅ | 3600 (1h) |
| description | string | ✅ | Texto descritivo |
| document | string | ❌ | CPF 11 dígitos, só se válido |
| name | string | ❌ | Nome sem acentos/especiais, ≥2 palavras |
| email | string | ❌ | Só se document+name válidos |
| phone | string | ❌ | Formato +55XXXXXXXXXXX |

**Lógica "tudo ou nada":** `document` e `name` só são enviados juntos e ambos válidos.

---

## 2. PIX OUT — process-withdrawal (Saque)

**Endpoint Gatebox:** `POST /v1/customers/pix/withdraw`

| Campo | Tipo | Obrigatório | Regra |
|-------|------|-------------|-------|
| externalId | string | ✅ | `saque_{userId}_{timestamp}` |
| amount | number | ✅ | Mínimo R$ 1,00 |
| key | string | ✅ | Chave PIX do usuário (Gatebox usa `key`) |
| name | string | ✅ | Nome completo do recebedor |
| pixKeyType | string | ✅ | cpf, email, phone, random |
| keyType | string | ❌ | CPF, CNPJ, PHONE, EMAIL — evita "invalid phone format" em chaves CPF |
| description | string | ❌ | Texto descritivo |
| documentNumber | string | ❌ | CPF/CNPJ do recebedor (obrigatório se validação ativa) |

---

## 3. Autenticação Gatebox

**Endpoint:** `POST /v1/customers/auth/sign-in`

```json
{ "username": "...", "password": "..." }
```

**Resposta:** `{ "access_token": "...", "expires_in": 3600 }`

---

## 4. Roteamento via Proxy

Quando `GATEBOX_PROXY_URL` e `GATEBOX_PROXY_SECRET` estão configurados, as chamadas passam pelo proxy (IP fixo para whitelist):

```json
{
  "path": "/v1/customers/pix/create-immediate-qrcode",
  "method": "POST",
  "headers": { "Authorization": "Bearer {gatebox_token}" },
  "payload": { /* payload original */ }
}
```

**Header na requisição ao proxy:** `Authorization: Bearer {GATEBOX_PROXY_SECRET}`

---

## Configuração

### Secrets (Supabase Edge Functions)

| Variável | Descrição |
|----------|-----------|
| `GATEBOX_USERNAME` | CNPJ ou username |
| `GATEBOX_PASSWORD` | Senha |
| `GATEBOX_BASE_URL` | (Opcional) Padrão: `https://api.gatebox.com.br` |
| `GATEBOX_PROXY_URL` | (Opcional) URL do proxy, ex: `http://IP_VPS:3100` |
| `GATEBOX_PROXY_SECRET` | (Opcional) Token de auth do proxy |

### Webhook

```
https://sarauvembzbneunhssud.supabase.co/functions/v1/webhook-gatebox
```

### Whitelist de IP

Cash-Out exige IP na whitelist. Use o proxy com IP fixo ou adicione o IP do VPS na Gatebox.

---

## Modo simulação

Sem `GATEBOX_USERNAME` e `GATEBOX_PASSWORD`: QR Code fictício e botão "Já Paguei" para testes.
