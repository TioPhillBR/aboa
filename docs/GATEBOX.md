# Integração Gatebox - PIX

A integração com o gateway Gatebox permite depósitos PIX reais na plataforma.

## Configuração

### 1. Variáveis de ambiente (Supabase Edge Functions)

No **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**, adicione:

| Variável | Descrição |
|----------|-----------|
| `GATEBOX_USERNAME` | CNPJ ou username fornecido pela Gatebox |
| `GATEBOX_PASSWORD` | Senha fornecida pela Gatebox |
| `GATEBOX_BASE_URL` | (Opcional) URL da API. Padrão: `https://api.gatebox.com.br` |

### 2. Webhook no painel Gatebox

Configure esta URL no painel da Gatebox para **todos os eventos** (depósitos, saques, reversões, etc.):

```
https://sarauvembzbneunhssud.supabase.co/functions/v1/webhook-gatebox
```

Esta é a URL do projeto A Boa (aboaloteria.com.br).

### 3. Whitelist de IP

A Gatebox valida o IP do servidor. Adicione o IP de saída das Edge Functions do Supabase na whitelist do painel Gatebox. O IP pode variar; consulte a documentação do Supabase para IPs das Edge Functions.

## Fluxo

1. **Usuário solicita depósito** → `generate-pix` chama a API Gatebox e retorna QR Code real
2. **Usuário paga o PIX** → Gatebox envia webhook para `webhook-gatebox`
3. **Webhook processa** → Credita a carteira e atualiza status do depósito
4. **Frontend** → Polling ou botão "Verificar pagamento" detecta a confirmação

## Modo simulação

Se `GATEBOX_USERNAME` e `GATEBOX_PASSWORD` não estiverem configurados, o sistema usa o modo simulação (QR Code fictício e botão "Já Paguei" para testes).
