# Gatebox Proxy — deploy no Easypanel

Servidor com IP fixo para saques PIX (Gatebox exige whitelist de IP).

## Deploy no Easypanel

1. **Criar novo app** no Easypanel
2. **Fonte:** Dockerfile (ou repositório Git com esta pasta)
3. **Porta:** 3100
4. **Variáveis de ambiente** (obrigatórias):

   | Variável | Descrição |
   |----------|-----------|
   | `PROXY_AUTH_SECRET` | Token de autenticação (mesmo valor de `GATEBOX_PROXY_SECRET` no Supabase) |
   | `GATEBOX_USERNAME` | Usuário/CNPJ Gatebox |
   | `GATEBOX_PASSWORD` | Senha Gatebox |
   | `GATEBOX_BASE_URL` | (Opcional) Padrão: `https://api.gatebox.com.br` |
   | `PORT` | (Opcional) Padrão: 3100 |

5. **Expor** a porta 3100 para o host (ex: `187.77.61.170:3100`)

## Endpoints

- `GET /health` — Health check
- `POST /api/gatebox/withdraw` — Saques PIX (auth + PIX OUT)
- `POST /` — Proxy genérico (path, method, headers, payload)

## Teste

```bash
curl http://187.77.61.170:3100/health
```
