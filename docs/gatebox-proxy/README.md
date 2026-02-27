# Proxy Gatebox - IP Fixo

Script Node.js leve para rodar no seu VPS com IP fixo.
Ele recebe chamadas das Edge Functions do Supabase e as encaminha para a API Gatebox.

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

# 3. Configure o secret de autenticação
export PROXY_AUTH_SECRET="gere_um_token_seguro_aqui"

# 4. Inicie com PM2
pm2 start server.js --name gatebox-proxy
pm2 save
pm2 startup
```

## Configuração no Supabase

Adicione este secret nas Edge Functions do Supabase:

| Secret | Valor |
|--------|-------|
| `GATEBOX_PROXY_URL` | `http://SEU_VPS_IP:3100` |
| `GATEBOX_PROXY_SECRET` | Mesmo valor de `PROXY_AUTH_SECRET` |

## Segurança

- O proxy valida um token Bearer em cada request
- Só aceita rotas da Gatebox (`/v1/customers/`)
- Não armazena nenhum dado
- Use HTTPS (nginx reverse proxy + Let's Encrypt) em produção
