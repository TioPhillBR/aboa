
# Plano de Implementação: Painel Administrativo Completo para Plataforma de Rifas e Raspadinhas

## Visão Geral

Este plano aborda a criação de um painel administrativo completo com sistema de afiliados, analytics avançados e controle financeiro. O sistema atual já possui uma base sólida com dashboard, gestão de sorteios, raspadinhas e usuários. Iremos expandir significativamente suas funcionalidades.

---

## 1. Mudanças no Banco de Dados

### 1.1 Novas Tabelas

#### Tabela: `affiliates` (Sistema de Afiliados)
```sql
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  avatar_url TEXT,
  instagram TEXT,
  facebook TEXT,
  tiktok TEXT,
  commission_percentage NUMERIC NOT NULL DEFAULT 10,
  affiliate_code VARCHAR(10) NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, suspended
  total_sales NUMERIC DEFAULT 0,
  total_commission NUMERIC DEFAULT 0,
  pending_commission NUMERIC DEFAULT 0,
  paid_commission NUMERIC DEFAULT 0,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### Tabela: `affiliate_sales` (Vendas via Afiliados)
```sql
CREATE TABLE affiliate_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  buyer_id UUID NOT NULL,
  product_type TEXT NOT NULL, -- raffle, scratch_card
  product_id UUID NOT NULL,
  sale_amount NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  commission_status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, paid
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### Tabela: `affiliate_withdrawals` (Saques de Afiliados)
```sql
CREATE TABLE affiliate_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, paid, rejected
  pix_key TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### Tabela: `payment_transactions` (Transações de Pagamento)
```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- deposit, purchase, refund
  amount NUMERIC NOT NULL,
  gateway_fee NUMERIC DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL, -- pix, credit_card
  gateway_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, cancelled, refunded
  product_type TEXT, -- raffle, scratch_card
  product_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### Tabela: `share_tracking` (Rastreamento de Compartilhamentos)
```sql
CREATE TABLE share_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sharer_id UUID NOT NULL,
  share_code VARCHAR(20) NOT NULL UNIQUE,
  clicks INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  credits_earned NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### Tabela: `share_events` (Eventos de Compartilhamento)
```sql
CREATE TABLE share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_tracking_id UUID NOT NULL REFERENCES share_tracking(id),
  event_type TEXT NOT NULL, -- click, signup, purchase
  visitor_ip TEXT,
  user_agent TEXT,
  referred_user_id UUID,
  purchase_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### Tabela: `user_locations` (Localização de Usuários para Mapa)
```sql
CREATE TABLE user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'BR',
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### Tabela: `raffle_prizes` (Gestão de Prêmios de Rifas)
```sql
CREATE TABLE raffle_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES raffles(id),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  estimated_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, delivered
  winner_id UUID,
  delivery_notes TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### Tabela: `scratch_card_batches` (Lotes de Raspadinhas)
```sql
CREATE TABLE scratch_card_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scratch_card_id UUID NOT NULL REFERENCES scratch_cards(id),
  batch_name TEXT NOT NULL,
  total_cards INTEGER NOT NULL,
  cards_sold INTEGER DEFAULT 0,
  total_prizes INTEGER NOT NULL,
  prizes_distributed INTEGER DEFAULT 0,
  prize_config JSONB NOT NULL, -- Array de {quantity, value}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 1.2 Alterações em Tabelas Existentes

#### Adicionar à tabela `profiles`:
```sql
ALTER TABLE profiles ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN registration_source TEXT; -- direct, share, affiliate
ALTER TABLE profiles ADD COLUMN source_code TEXT; -- código de referência usado
```

#### Adicionar à tabela `wallet_transactions`:
```sql
ALTER TABLE wallet_transactions ADD COLUMN source_type TEXT; -- direct, share, affiliate
ALTER TABLE wallet_transactions ADD COLUMN source_id UUID;
```

---

## 2. Novas Páginas do Painel Admin

### 2.1 Dashboard Aprimorado (`/admin`)
- **Gráficos de vendas** usando Recharts (dia/mês/ano)
- **KPIs principais**: vendas totais, valor arrecadado, prêmios entregues, usuários ativos
- **Gráfico de receita por canal** (direto, compartilhamento, afiliado)
- **Taxa de conversão de cliques em vendas**
- **Novos cadastros por período**

### 2.2 Mapa de Usuários (`/admin/mapa`)
- Integração com Google Maps API
- Pins mostrando localização dos logins
- Filtros por dia, mês e ano
- Heatmap de concentração de usuários

### 2.3 Módulo de Vendas (`/admin/vendas`)
- Lista de todas as vendas (rifas + raspadinhas)
- Filtros: data, status de pagamento, tipo de produto
- Métricas: quantidade vendida, valor total, ticket médio
- Exportação CSV/Excel/PDF

### 2.4 Módulo Financeiro (`/admin/financeiro`)
- Total arrecadado por período
- Valores pendentes de processamento
- Taxas do gateway de pagamento
- Saldo líquido
- Gráfico de fluxo de caixa

### 2.5 Gestão de Prêmios de Rifas (`/admin/premios`)
- CRUD de prêmios por rifa
- Status: pendente, em processamento, entregue
- Associação com ganhadores
- Histórico completo de entregas

### 2.6 Sistema de Raspadinhas Aprimorado (`/admin/raspadinhas`)
- Configuração de lotes (ex: 1000 raspadinhas)
- Definição de prêmios por lote (2x R$1000, 5x R$500, etc.)
- Controle de prêmios disponíveis vs resgatados
- Relatório de distribuição de prêmios

### 2.7 Sistema de Afiliados (`/admin/afiliados`)
- Lista de afiliados com status
- Aprovação/rejeição de novos afiliados
- Ajuste de percentual de comissão
- Dashboard de desempenho por afiliado
- Gestão de saques de comissões

### 2.8 Sistema de Compartilhamento (`/admin/compartilhamentos`)
- Painel de quem compartilhou
- Cadastros/vendas gerados por compartilhamento
- Total de créditos concedidos
- Métricas de conversão

### 2.9 Relatórios e Exportação (`/admin/relatorios`)
- Geração de relatórios em CSV/Excel/PDF
- Vendas, comissões, prêmios, usuários
- Filtros por período e tipo de produto

---

## 3. Novas Páginas para Afiliados

### 3.1 Cadastro de Afiliado (`/afiliado/cadastro`)
- Formulário completo com dados pessoais
- Upload de foto de perfil
- Redes sociais
- Termos e condições

### 3.2 Painel do Afiliado (`/afiliado`)
- Dashboard com vendas e comissões
- Histórico de transações
- Status de pagamentos
- Link único de afiliado
- Solicitação de saque

---

## 4. Novos Hooks e Serviços

### 4.1 Hooks
- `useAffiliates.tsx` - Gestão de afiliados
- `useFinancial.tsx` - Dados financeiros e relatórios
- `useShareTracking.tsx` - Rastreamento de compartilhamentos
- `useExport.tsx` - Exportação de relatórios
- `useUserLocations.tsx` - Dados de localização

### 4.2 Edge Functions
- `track-share-click` - Registrar clique em link compartilhado
- `process-affiliate-sale` - Processar venda via afiliado
- `generate-report` - Gerar relatórios PDF/Excel
- `update-user-location` - Atualizar localização do usuário

---

## 5. Componentes Reutilizáveis

### 5.1 Componentes de UI
- `DateRangeFilter` - Filtro de período
- `DataTable` - Tabela com paginação e filtros
- `ExportButton` - Botão de exportação
- `StatCard` - Card de estatística
- `ChartCard` - Card com gráfico
- `StatusBadge` - Badge de status

### 5.2 Componentes de Gráficos
- `SalesChart` - Gráfico de vendas
- `RevenueByChannelChart` - Receita por canal
- `ConversionFunnelChart` - Funil de conversão
- `UserGrowthChart` - Crescimento de usuários

### 5.3 Componentes de Mapas
- `UserMapView` - Mapa com pins de usuários
- `LocationFilter` - Filtros de localização

---

## 6. Integrações Necessárias

### 6.1 Google Maps API
- Será necessário configurar uma API key do Google Maps
- O sistema solicitará a key via ferramenta de secrets

### 6.2 Exportação de Relatórios
- Utilizaremos bibliotecas client-side para CSV/Excel (xlsx)
- Para PDF, usaremos jspdf + jspdf-autotable

---

## 7. Estrutura de Arquivos

```text
src/
├── pages/
│   └── admin/
│       ├── Dashboard.tsx (aprimorar)
│       ├── Vendas.tsx (novo)
│       ├── Financeiro.tsx (novo)
│       ├── Mapa.tsx (novo)
│       ├── Premios.tsx (novo)
│       ├── Afiliados.tsx (novo)
│       ├── Compartilhamentos.tsx (novo)
│       ├── Relatorios.tsx (novo)
│       ├── Raspadinhas.tsx (aprimorar)
│       └── Sorteios.tsx (aprimorar)
│   └── afiliado/
│       ├── Index.tsx (novo)
│       └── Cadastro.tsx (novo)
├── components/
│   └── admin/
│       ├── AdminLayout.tsx (aprimorar)
│       ├── charts/ (novo diretório)
│       ├── tables/ (novo diretório)
│       └── maps/ (novo diretório)
├── hooks/
│   ├── useAffiliates.tsx (novo)
│   ├── useFinancial.tsx (novo)
│   ├── useShareTracking.tsx (novo)
│   └── useExport.tsx (novo)
└── types/
    └── index.ts (aprimorar)
```

---

## 8. Ordem de Implementação

### Fase 1: Banco de Dados e Tipos
1. Criar migrações SQL para novas tabelas
2. Atualizar tipos TypeScript
3. Configurar RLS policies

### Fase 2: Dashboard e Analytics
4. Aprimorar Dashboard com gráficos Recharts
5. Criar componentes de gráficos reutilizáveis
6. Implementar filtros de período

### Fase 3: Módulos Financeiros
7. Criar página de Vendas
8. Criar página Financeiro
9. Implementar exportação de relatórios

### Fase 4: Sistema de Afiliados
10. Criar tabelas e RLS de afiliados
11. Criar página de gestão de afiliados (admin)
12. Criar painel do afiliado (usuário)
13. Implementar processamento de comissões

### Fase 5: Sistema de Compartilhamento
14. Criar tracking de compartilhamentos
15. Implementar edge function de rastreamento
16. Criar painel de acompanhamento

### Fase 6: Mapa de Usuários
17. Configurar Google Maps API
18. Implementar coleta de localização
19. Criar visualização do mapa

### Fase 7: Gestão de Prêmios
20. Criar gestão de prêmios de rifas
21. Aprimorar sistema de lotes de raspadinhas
22. Implementar controle de entrega

---

## 9. Considerações Técnicas

### Suposições Feitas:
1. **Gateway de Pagamento**: Será simulado conforme solicitado, mas estruturado para fácil integração futura
2. **Geolocalização**: Usaremos IP geolocation como fallback caso o usuário não permita GPS
3. **Percentual de Afiliado**: Configurável por afiliado (padrão 10%)
4. **Crédito de Compartilhamento**: Padrão R$ 5,00 por cadastro, configurável

### Dependências a Adicionar:
- `xlsx` - Exportação Excel
- `jspdf` + `jspdf-autotable` - Exportação PDF
- `@react-google-maps/api` - Integração Google Maps

### Segurança:
- Todas as novas tabelas terão RLS policies
- Afiliados só podem ver seus próprios dados
- Admin tem acesso total
- Logs de auditoria para ações críticas
