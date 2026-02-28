# Servidor Gatebox - IP Fixo

Servidor Node.js para rodar no VPS com IP fixo (whitelistado na Gatebox).
Processa **depósitos** (proxy genérico) e **saques** (endpoint dedicado).

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/gatebox/withdraw` | **Saque dedicado** — autentica na Gatebox e envia PIX OUT |
| POST | `/` | Proxy genérico para outras operações |

## Requisitos

- Node.js 18+ no VPS
- PM2 (ou systemd) para manter o processo rodando
- IP fixo do VPS adicionado na whitelist da Gatebox

## Instalação no VPS

```bash
# 1. Copie os arquivos para o VPS
scp -r docs/gatebox-proxy/ user@seu-vps:/opt/gatebox-proxy/

# 2. No VPS:
cd /opt/gatebox-proxy
npm install

# 3. Configure as variáveis de ambiente
export PROXY_AUTH_SECRET="gere_um_token_seguro_aqui"
export GATEBOX_USERNAME="seu_usuario_gatebox"
export GATEBOX_PASSWORD="sua_senha_gatebox"
export GATEBOX_BASE_URL="https://api.gatebox.com.br"

# 4. Inicie com PM2
pm2 start server.js --name gatebox-server
pm2 save
pm2 startup
```

## Configuração no Supabase

Adicione estes secrets nas Edge Functions do Supabase:

| Secret | Valor |
|--------|-------|
| `GATEBOX_PROXY_URL` | `http://SEU_VPS_IP:3100` |
| `GATEBOX_PROXY_SECRET` | Mesmo valor de `PROXY_AUTH_SECRET` |

## Como funciona

### Saques (PIX OUT)
A Edge Function `process-withdrawal` chama `POST /api/gatebox/withdraw` no servidor.
O servidor autentica na Gatebox internamente e envia o PIX OUT — tudo com o mesmo IP fixo.

### Depósitos (PIX IN)
Depósitos continuam chamando a Gatebox diretamente das Edge Functions (sem servidor).

## Segurança

- O servidor valida um token Bearer em cada request
- Endpoint de saque valida campos obrigatórios
- Proxy genérico só aceita rotas da Gatebox (`/v1/customers/`)
- Credenciais Gatebox ficam no servidor (não nas Edge Functions para saques)
- Use HTTPS (nginx reverse proxy + Let's Encrypt) em produção
