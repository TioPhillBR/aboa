

# Plano: Rebranding para "A Boa"

## Resumo
Renomear o aplicativo de "Sorteio" para "A Boa", adicionar o logotipo fornecido no cabecalho (ocupando o maximo de espaco possivel) e ajustar a paleta de cores do tema claro para combinar com as cores do logotipo (verde e dourado/laranja).

---

## Analise do Logotipo

O logotipo apresenta:
- **Verde escuro/esmeralda** como cor principal (texto "A Boa")
- **Dourado/Laranja** como cor de destaque (trevo de 4 folhas e slogan)
- Estilo moderno e limpo

---

## Mudancas Necessarias

### 1. Adicionar a Imagem do Logotipo

**Acao**: Copiar o arquivo do logotipo para a pasta de assets do projeto.

| De | Para |
|---|---|
| `user-uploads://LOGO_A_BOA_-_CABEÇALHO.png` | `src/assets/logo-a-boa.png` |

---

### 2. Atualizar Metadados da Aplicacao

**Arquivo**: `index.html`

| Campo | Antes | Depois |
|---|---|---|
| `<title>` | Lovable App | A Boa - Vai na Certa, Vai na Boa |
| `og:title` | Lovable App | A Boa - Sorteios e Raspadinhas |
| `description` | Lovable Generated Project | Participe de sorteios e raspadinhas. Premios reais, diversao garantida! |

---

### 3. Atualizar Cabecalho Principal

**Arquivo**: `src/components/layout/Header.tsx`

Mudancas no componente:
- Remover o icone `Trophy` e o texto "Sorteio"
- Importar e exibir a imagem do logotipo
- Aplicar altura maxima de `h-10` ou `h-12` para ocupar o maior espaco possivel sem desconfigurar
- Manter o logotipo responsivo

**Exemplo do novo codigo**:
```tsx
import logoABoa from '@/assets/logo-a-boa.png';

// No JSX:
<Link to="/" className="flex items-center">
  <img 
    src={logoABoa} 
    alt="A Boa - Vai na Certa, Vai na Boa" 
    className="h-10 md:h-12 w-auto"
  />
</Link>
```

---

### 4. Atualizar Paleta de Cores (Tema Claro)

**Arquivo**: `src/index.css`

Ajustar as variaveis CSS do `:root` (tema claro) para refletir as cores do logotipo:

| Variavel | Antes (HSL) | Depois (HSL) | Cor |
|---|---|---|---|
| `--primary` | 262 83% 58% (roxo) | 152 70% 35% | Verde esmeralda |
| `--primary-foreground` | 0 0% 100% | 0 0% 100% | Branco (manter) |
| `--accent` | 45 100% 51% | 38 95% 50% | Dourado/laranja |
| `--accent-foreground` | 0 0% 10% | 0 0% 10% | Preto (manter) |
| `--ring` | 262 83% 58% | 152 70% 35% | Verde esmeralda |
| `--sidebar-primary` | 262 83% 58% | 152 70% 35% | Verde esmeralda |
| `--sidebar-ring` | 262 83% 58% | 152 70% 35% | Verde esmeralda |

Atualizar os gradientes:
| Variavel | Antes | Depois |
|---|---|---|
| `--gradient-primary` | roxo/magenta | Verde escuro para verde claro |
| `--gradient-gold` | (manter) | Dourado/laranja (ajustar tonalidade) |
| `--shadow-glow-primary` | roxo | Verde esmeralda |

**Nota**: O tema escuro (`.dark`) NAO sera alterado para manter a experiencia noturna.

---

### 5. Atualizar Pagina Inicial

**Arquivo**: `src/pages/Index.tsx`

Mudancas pontuais:
- Alterar o titulo hero de "Sorteios & Raspadinhas" para "A Boa" com subtitulo
- Ajustar gradientes de texto para usar as novas cores (verde/dourado)

---

### 6. Atualizar Menu Mobile

**Arquivo**: `src/components/layout/MobileNav.tsx`

Nenhuma mudanca estrutural necessaria - as cores serao atualizadas automaticamente via CSS.

---

## Resumo de Arquivos

| Arquivo | Tipo de Mudanca |
|---|---|
| `src/assets/logo-a-boa.png` | Novo arquivo (copia do upload) |
| `index.html` | Atualizar titulo e meta tags |
| `src/components/layout/Header.tsx` | Substituir icone/texto por imagem do logo |
| `src/index.css` | Ajustar paleta de cores do tema claro |
| `src/pages/Index.tsx` | Atualizar textos do hero |

---

## Preview Visual das Cores

```text
ANTES (Tema Claro)              DEPOIS (Tema Claro)
+------------------+            +------------------+
|  Roxo/Magenta    |    -->     |  Verde Esmeralda |
|  Primary Color   |            |  Primary Color   |
+------------------+            +------------------+
|  Amarelo         |    -->     |  Dourado/Laranja |
|  Accent Color    |            |  Accent Color    |
+------------------+            +------------------+
```

---

## Consideracoes

1. **Apenas o tema claro sera alterado** - o tema escuro permanece igual para manter contraste noturno
2. **Estrutura das paginas nao sera modificada** - apenas cores e branding
3. **O logotipo usara altura maxima que nao quebre o layout do header** (h-10 a h-12)

