

# Plano: Aplicativo de Apostas com Sorteios e Raspadinhas

## Resumo do Projeto

Vamos criar um aplicativo completo de apostas com duas modalidades de jogos:

1. **Sorteios (Roleta)**: Usuários compram números, uma roleta animada com fotos dos participantes gira e para no ganhador com contagem regressiva
2. **Raspadinhas**: Usuários compram chances e raspam com o dedo - 3 imagens iguais = prêmio

O sistema incluirá cadastro de usuários, carteira de créditos, histórico de ganhadores e um painel administrativo completo.

---

## Arquitetura do Sistema

```text
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  Páginas Públicas    │  Área do Usuário    │  Admin Dashboard    │
│  - Login/Cadastro    │  - Carteira         │  - CRUD Sorteios    │
│  - Home              │  - Meus Sorteios    │  - CRUD Raspadinhas │
│                      │  - Minhas Raspadinhas│  - Ganhadores      │
│                      │  - Histórico        │  - Usuários         │
├─────────────────────────────────────────────────────────────────┤
│                     BACKEND (Supabase)                           │
├─────────────────────────────────────────────────────────────────┤
│  Auth  │  Database (PostgreSQL)  │  Storage  │  Edge Functions   │
│        │  - profiles             │  - avatars │  - processar      │
│        │  - user_roles           │  - prizes  │    sorteio        │
│        │  - wallets              │            │  - processar      │
│        │  - sorteios             │            │    raspadinha     │
│        │  - raspadinhas          │            │  - carregar       │
│        │  - transactions         │            │    creditos       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fases de Implementação

### Fase 1: Infraestrutura Base

**1.1 Configuração do Supabase**
- Habilitar Lovable Cloud para backend
- Configurar autenticação com email/senha

**1.2 Banco de Dados - Tabelas Principais**

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Dados do usuário (nome, avatar_url) |
| `user_roles` | Sistema de roles (admin/user) separado |
| `wallets` | Saldo de créditos do usuário |
| `wallet_transactions` | Histórico de transações |

**1.3 Storage**
- Bucket `avatars` para fotos de perfil
- Bucket `prizes` para imagens das raspadinhas

---

### Fase 2: Sistema de Autenticação e Usuários

**2.1 Páginas de Auth**
- Página de Login
- Página de Cadastro (com upload de foto)
- Recuperação de senha

**2.2 Componentes**
- Header com menu do usuário
- Avatar do usuário
- Proteção de rotas (usuário e admin)

---

### Fase 3: Sistema de Carteira/Créditos

**3.1 Banco de Dados**
```sql
-- Tabela de carteira
CREATE TABLE wallets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  balance DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP
);

-- Tabela de transações
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY,
  wallet_id UUID REFERENCES wallets(id),
  amount DECIMAL(10,2),
  type TEXT, -- 'deposit', 'purchase', 'prize'
  description TEXT,
  created_at TIMESTAMP
);
```

**3.2 Interface**
- Página de carteira mostrando saldo
- Histórico de transações
- Botão para carregar créditos (simulado inicialmente)

---

### Fase 4: Sistema de Sorteios

**4.1 Banco de Dados**
```sql
-- Sorteios
CREATE TABLE raffles (
  id UUID PRIMARY KEY,
  title TEXT,
  description TEXT,
  price DECIMAL(10,2),
  total_numbers INTEGER,
  draw_date TIMESTAMP,
  status TEXT, -- 'open', 'drawing', 'completed'
  winner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP
);

-- Números comprados
CREATE TABLE raffle_tickets (
  id UUID PRIMARY KEY,
  raffle_id UUID REFERENCES raffles(id),
  user_id UUID REFERENCES auth.users(id),
  number INTEGER,
  purchased_at TIMESTAMP
);
```

**4.2 Interface do Usuário**
- Lista de sorteios disponíveis
- Página de compra de números
- Visualização dos números comprados

**4.3 Componente da Roleta**
- Animação de roleta com fotos dos participantes
- Efeito de giro em alta velocidade
- Contagem regressiva nos últimos 5 segundos
- Revelação do ganhador com foto e nome
- Confetes/animação de celebração

---

### Fase 5: Sistema de Raspadinhas

**5.1 Banco de Dados**
```sql
-- Tipos de raspadinha
CREATE TABLE scratch_cards (
  id UUID PRIMARY KEY,
  title TEXT,
  description TEXT,
  price DECIMAL(10,2),
  cover_image TEXT,
  active BOOLEAN,
  created_at TIMESTAMP
);

-- Símbolos/imagens da raspadinha
CREATE TABLE scratch_symbols (
  id UUID PRIMARY KEY,
  scratch_card_id UUID REFERENCES scratch_cards(id),
  image_url TEXT,
  prize_value DECIMAL(10,2),
  quantity INTEGER -- quantidade disponível
);

-- Chances compradas pelo usuário
CREATE TABLE scratch_chances (
  id UUID PRIMARY KEY,
  scratch_card_id UUID REFERENCES scratch_cards(id),
  user_id UUID REFERENCES auth.users(id),
  symbols JSONB, -- array com os 9 símbolos
  revealed BOOLEAN,
  prize_won DECIMAL(10,2),
  created_at TIMESTAMP
);
```

**5.2 Componente de Raspadinha Interativa**
- Canvas com 9 áreas para raspar
- Detecção de toque/mouse para "raspar"
- Efeito visual de raspar (revelando imagem por baixo)
- Verificação de 3 imagens iguais
- Animação de vitória

---

### Fase 6: Dashboard Administrativo

**6.1 Layout Admin**
- Sidebar com navegação
- Header com informações do admin

**6.2 CRUD de Sorteios**
- Listar todos os sorteios
- Criar novo sorteio (título, descrição, preço, quantidade de números, data)
- Editar sorteio existente
- Realizar sorteio manualmente
- Ver participantes

**6.3 CRUD de Raspadinhas**
- Listar todas as raspadinhas
- Criar nova raspadinha com:
  - Título e descrição
  - Preço por chance
  - Upload de imagens dos símbolos
  - Definir prêmios para cada símbolo
  - Quantidade de cada prêmio
- Editar raspadinha existente
- Ativar/desativar raspadinha

**6.4 Gestão**
- Lista de usuários
- Histórico de ganhadores
- Estatísticas gerais

---

### Fase 7: Histórico e Estatísticas

- Página de histórico de sorteios realizados
- Lista de ganhadores com fotos
- Minhas participações (usuário)
- Meus prêmios ganhos

---

## Estrutura de Arquivos

```text
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── games/
│   │   ├── RouletteWheel.tsx
│   │   ├── ScratchCard.tsx
│   │   └── Countdown.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── AdminSidebar.tsx
│   └── wallet/
│       ├── WalletBalance.tsx
│       └── TransactionHistory.tsx
├── pages/
│   ├── Index.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Raffles.tsx
│   ├── RaffleDetail.tsx
│   ├── ScratchCards.tsx
│   ├── Wallet.tsx
│   ├── History.tsx
│   └── admin/
│       ├── Dashboard.tsx
│       ├── ManageRaffles.tsx
│       ├── ManageScratchCards.tsx
│       └── Winners.tsx
├── hooks/
│   ├── useAuth.tsx
│   ├── useWallet.tsx
│   └── useAdmin.tsx
├── lib/
│   └── supabase.ts
└── types/
    └── index.ts
```

---

## Detalhes Técnicos

### Segurança (RLS Policies)
- Usuários só podem ver seus próprios dados de carteira
- Apenas admins podem criar/editar sorteios e raspadinhas
- Roles armazenadas em tabela separada (não no profile)
- Funções SECURITY DEFINER para verificação de roles

### Animações
- Roleta: CSS transforms + requestAnimationFrame
- Raspadinha: Canvas API para efeito de raspar
- Transições suaves com Tailwind animations

### Edge Functions (se necessário)
- Processamento seguro do sorteio
- Geração aleatória dos símbolos da raspadinha
- Validação de prêmios server-side

---

## Próximos Passos Após Aprovação

1. Configurar Supabase/Lovable Cloud
2. Criar estrutura do banco de dados
3. Implementar autenticação
4. Desenvolver sistema de carteira
5. Criar componente da roleta animada
6. Desenvolver raspadinha interativa
7. Construir dashboard admin
8. Testes e ajustes finais

---

## Estimativa de Complexidade

| Componente | Complexidade |
|------------|--------------|
| Autenticação | Média |
| Carteira de Créditos | Média |
| Roleta Animada | Alta |
| Raspadinha Interativa | Alta |
| Dashboard Admin | Média |
| RLS e Segurança | Alta |

Este é um projeto robusto que vai resultar em uma plataforma completa de apostas!

