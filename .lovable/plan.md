
# Plano: Corrigir Métricas de Compartilhamentos no Admin

## Diagnóstico do Problema

A página `/admin/compartilhamentos` está consultando as tabelas erradas. O sistema possui **dois mecanismos de compartilhamento paralelos**:

1. **Sistema `share_tracking`** (usado atualmente pela página admin)
   - Tabelas: `share_tracking`, `share_events`
   - Estado: **VAZIO** - nenhum registro

2. **Sistema `referral_codes`** (sistema real em uso)
   - Tabelas: `referral_codes`, `referrals`
   - Estado: **COM DADOS** - 12 indicações de Júlio Cesar para diversos usuários incluindo "josé das couves"

O usuário `juliocsm90@gmail.com` (Júlio Cesar dos Santos Moya) tem 12 indicações registradas na tabela `referrals`, mas a página admin busca dados de `share_tracking` que está vazia.

---

## Solução Proposta

Unificar a página `/admin/compartilhamentos` para exibir dados do sistema `referral_codes` + `referrals`, que é o sistema real em uso pela aplicação.

---

## Etapas de Implementação

### 1. Atualizar Hook `useShareTracking.tsx`

Modificar as queries para buscar dados das tabelas corretas:

- **Query de referrers (quem indica)**:
  ```sql
  SELECT 
    rc.*,
    p.full_name,
    p.avatar_url,
    COUNT(r.id) as total_referrals,
    SUM(r.bonus_awarded) as total_bonus
  FROM referral_codes rc
  JOIN profiles p ON rc.user_id = p.id
  LEFT JOIN referrals r ON r.referral_code_id = rc.id
  GROUP BY rc.id, p.id
  ```

- **Métricas calculadas**:
  - Total Links = Contagem de `referral_codes`
  - Cadastros = Contagem de `referrals`
  - Créditos = Soma de `bonus_awarded` em `referrals`
  - Conversão = (cadastros / uses_count) * 100

### 2. Atualizar Interface `AdminCompartilhamentos.tsx`

Adaptar a tabela e métricas para refletir os novos dados:

| Campo Atual | Campo Novo |
|-------------|------------|
| `share_code` | `code` (de referral_codes) |
| `clicks` | `uses_count` |
| `signups` | Contagem de referrals |
| `credits_earned` | Soma de `bonus_awarded` |
| `sharer` | Profile do user_id |

### 3. Adicionar Lista de Indicados

Para cada referrer, mostrar os usuários indicados:
- Nome do indicado
- Data do cadastro
- Bônus pago

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useShareTracking.tsx` | Trocar queries de `share_tracking` para `referral_codes` + `referrals` |
| `src/pages/admin/Compartilhamentos.tsx` | Atualizar colunas, métricas e adicionar expansão de detalhes |

---

## Resultado Esperado

Após a implementação:
- O admin verá as 12 indicações de Júlio Cesar
- Métricas mostrarão: 15 links, 12 cadastros, R$ 60,00 em bônus
- Cada linha terá opção de expandir e ver os indicados

---

## Seção Técnica

### Queries Supabase

**Buscar todos os referrers com estatísticas:**
```typescript
const { data } = await supabase
  .from('referral_codes')
  .select(`
    *,
    owner:profiles!referral_codes_user_id_fkey(full_name, avatar_url),
    referrals(id, referred_id, bonus_awarded, created_at)
  `)
  .order('uses_count', { ascending: false });
```

**Buscar detalhes dos indicados:**
```typescript
const { data } = await supabase
  .from('referrals')
  .select(`
    *,
    referred:profiles!referrals_referred_id_fkey(full_name, avatar_url)
  `)
  .eq('referral_code_id', codeId);
```

### Métricas Atualizadas

```typescript
const metrics = {
  totalLinks: referralCodes?.length || 0,
  totalSignups: referralCodes?.reduce((sum, rc) => 
    sum + (rc.referrals?.length || 0), 0) || 0,
  totalCredits: referralCodes?.reduce((sum, rc) => 
    sum + rc.referrals?.reduce((s, r) => s + Number(r.bonus_awarded), 0), 0) || 0,
  // Cliques e compras não existem neste sistema - remover ou adaptar
};
```

### Considerações sobre Tabelas Órfãs

As tabelas `share_tracking` e `share_events` ficarão sem uso após esta mudança. Opções:
1. Mantê-las para uso futuro (rastreamento de cliques detalhado)
2. Migrar funcionalidades para trabalhar junto com `referral_codes`
3. Remover se não forem necessárias
