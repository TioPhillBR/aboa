
# Plano: Sistema de Lotes e Premios para Raspadinhas e Sorteios ✅ CONCLUÍDO

## Contexto Atual

O sistema atual possui:
- **Raspadinhas**: formulario com titulo, descricao, preco, imagem de capa, e simbolos individuais
- **Sorteios**: formulario com titulo, descricao, preco por numero, total de numeros, data do sorteio e imagem
- **Tabelas existentes**: `scratch_card_batches` (lotes) e `raffle_prizes` (premios de rifas) ja existem no banco mas nao estao integradas aos formularios

## Objetivo

Modificar os formularios de criacao para permitir:

### Raspadinhas
1. Definir quantidade total de raspadinhas no lote (ex: 1000 unidades)
2. Configurar premios do lote com:
   - Nome/descricao do premio
   - Valor do premio (R$)
   - Quantidade de vezes que este premio sera sorteado
   - Probabilidade de aparecer

### Sorteios (Rifas)
1. Manter preco e total de numeros
2. Adicionar sistema de premios multiplos:
   - Nome do premio
   - Descricao
   - Imagem
   - Valor estimado
   - Quantidade de vezes que sera sorteado
   - Probabilidade de ser o premio principal

---

## Mudancas Necessarias

### 1. Alteracao no Formulario de Raspadinhas

**Arquivo**: `src/pages/admin/Raspadinhas.tsx`

#### Adicionar campos ao formData:
- `total_cards`: quantidade total de raspadinhas no lote
- `prizes`: array de objetos com `{ name, value, quantity, probability, image_url }`

#### Novo fluxo de criacao:
1. Admin define dados basicos (titulo, preco, imagem)
2. Admin define quantidade total de raspadinhas (ex: 1000)
3. Admin adiciona premios dinamicamente na mesma tela:
   - Adicionar linha de premio
   - Definir nome, valor, quantidade, probabilidade
   - Remover premio se necessario
4. Sistema valida que a soma das probabilidades faz sentido
5. Ao criar, insere:
   - Registro em `scratch_cards`
   - Lote em `scratch_card_batches` com `prize_config`
   - Simbolos em `scratch_symbols` para cada premio

### 2. Alteracao no Formulario de Sorteios

**Arquivo**: `src/pages/admin/Sorteios.tsx`

#### Adicionar campos ao formData:
- `prizes`: array de objetos com `{ name, description, image_url, estimated_value, quantity, probability }`

#### Novo fluxo de criacao:
1. Admin define dados basicos (titulo, preco, numeros, data)
2. Admin adiciona premios dinamicamente:
   - 1o Premio, 2o Premio, etc.
   - Cada premio pode aparecer X vezes
   - Probabilidade de ser sorteado
3. Ao criar, insere:
   - Registro em `raffles`
   - Premios em `raffle_prizes` (um registro para cada quantidade)

---

## Detalhes Tecnicos

### Componente Reutilizavel: PrizeConfigList

Criar um componente para configurar lista de premios que sera usado tanto em raspadinhas quanto sorteios.

**Props**:
```typescript
interface PrizeConfigListProps {
  prizes: PrizeConfig[];
  onChange: (prizes: PrizeConfig[]) => void;
  type: 'scratch' | 'raffle';
  showImage?: boolean;
}

interface PrizeConfig {
  id: string; // temporario para React keys
  name: string;
  value: number;
  quantity: number;
  probability: number;
  image_url?: string;
  description?: string;
}
```

### Mudancas no Hook useScratchCards

Atualizar `generateSymbols()` para respeitar:
- Probabilidades configuradas por premio
- Quantidade maxima de cada premio
- Decrementar `remaining_quantity` ao sortear

### Validacoes

1. **Raspadinhas**:
   - Total de premios nao pode exceder quantidade de raspadinhas
   - Soma das probabilidades deve estar entre 0% e 100%

2. **Sorteios**:
   - Pelo menos 1 premio deve ser configurado
   - Soma das probabilidades dos premios principais = 100%

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/admin/Raspadinhas.tsx` | Adicionar campos de lote e premios no formulario de criacao |
| `src/pages/admin/Sorteios.tsx` | Adicionar secao de premios no formulario de criacao |
| `src/components/admin/PrizeConfigList.tsx` | Novo componente para lista de premios |
| `src/hooks/useScratchCards.tsx` | Atualizar logica de geracao de simbolos baseada em probabilidade |
| `src/types/index.ts` | Adicionar interface PrizeConfig |

---

## Interface do Usuario

### Formulario de Nova Raspadinha (Redesenhado)

```text
+------------------------------------------+
| CRIAR NOVA RASPADINHA                    |
+------------------------------------------+
| Titulo*: [___________________________]   |
| Descricao: [________________________]    |
| Preco (R$)*: [____]                      |
| [Imagem de Capa]                         |
+------------------------------------------+
| CONFIGURACAO DO LOTE                     |
| Quantidade de Raspadinhas*: [1000]       |
+------------------------------------------+
| PREMIOS DO LOTE                          |
| +--------------------------------------+ |
| | Premio      | Valor  | Qtd  | Prob % | |
| +--------------------------------------+ |
| | Diamante    | 1000   | 2    | 0.2%   | |
| | Ouro        | 500    | 5    | 0.5%   | |
| | Prata       | 100    | 20   | 2.0%   | |
| | Bronze      | 50     | 50   | 5.0%   | |
| +--------------------------------------+ |
| [+ Adicionar Premio]                     |
|                                          |
| Resumo: 77 premios de 1000 raspadinhas   |
| Total em premios: R$ 9.500,00            |
+------------------------------------------+
| [Cancelar]              [Criar]          |
+------------------------------------------+
```

### Formulario de Novo Sorteio (Redesenhado)

```text
+------------------------------------------+
| CRIAR NOVO SORTEIO                       |
+------------------------------------------+
| Titulo*: [___________________________]   |
| Descricao: [________________________]    |
| Preco por Numero (R$)*: [____]           |
| Total de Numeros*: [____]                |
| Data do Sorteio*: [__/__/____]           |
| [Imagem do Sorteio]                      |
+------------------------------------------+
| PREMIOS DO SORTEIO                       |
| +--------------------------------------+ |
| | Premio           | Valor    | Qtd   | |
| +--------------------------------------+ |
| | iPhone 15 Pro    | 8000     | 1     | |
| | Apple Watch      | 3000     | 2     | |
| | AirPods Pro      | 1500     | 3     | |
| +--------------------------------------+ |
| [+ Adicionar Premio]                     |
|                                          |
| Total de premios: 6                      |
| Valor total: R$ 18.500,00                |
+------------------------------------------+
| [Cancelar]              [Criar]          |
+------------------------------------------+
```

---

## Ordem de Implementacao

1. Criar componente `PrizeConfigList`
2. Atualizar formulario de Raspadinhas com novo layout
3. Integrar criacao de lotes (`scratch_card_batches`)
4. Atualizar formulario de Sorteios com premios
5. Integrar criacao de premios (`raffle_prizes`)
6. Atualizar hook de geracao de simbolos
7. Adicionar validacoes
