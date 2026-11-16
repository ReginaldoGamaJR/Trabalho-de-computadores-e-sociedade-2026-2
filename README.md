# Observatório Caminhos do Trabalho (nome provisório)

Plataforma web de visualização de dados **agregados e anônimos** da rede Caminhos do Trabalho
Brasil, com o mapa do Brasil como elemento central.

> Estado atual: **MVP com dados fictícios**. Ainda não há fonte de dados real; a interface
> exibe aviso permanente de “Dados fictícios”.

## Rodar localmente

Requer Node.js 20+ (testado com 22).

```bash
npm install
npm run dev        # http://localhost:5173
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Typecheck + build de produção em `dist/` |
| `npm test` | Testes (Vitest) |
| `npm run lint` | ESLint (inclui regras de acessibilidade) |
| `npm run geo` | Baixa de novo as malhas do IBGE para `public/geo/` (não é necessário no dia a dia) |

## Fonte de dados

Configurada por variável de ambiente; a interface não sabe de onde os dados vêm.

| Variável | Valores |
|---|---|
| `VITE_DATA_SOURCE` | `mock` (padrão), `rest`, `static` |
| `VITE_API_BASE_URL` | URL da API (fonte `rest`) |
| `VITE_STATIC_BASE_URL` | Pasta/URL dos JSON pré-calculados (fonte `static`, padrão `/data`) |
| `VITE_ALLOW_MOCK` | `true` permite build de produção com mock (deploy de demonstração) |

O build de produção **falha** com `mock` se `VITE_ALLOW_MOCK` não for `true`. Hoje o
`.env.production` libera o mock porque ainda não existem dados reais; ao conectar a fonte
real, troque `VITE_DATA_SOURCE` e remova essa linha.

O contrato que o backend deve cumprir está em [docs/contrato-dados.md](docs/contrato-dados.md).

## Arquitetura

```
UI (pages/, features/, ui/)
  └─ hooks (app/dados.tsx, TanStack Query)
       └─ DataProvider (data/DataProvider.ts)  ← porta
            └─ comValidacao: schemas Zod + PrivacyGuard
                 └─ adaptadores: mock | rest | static
```

- `src/domain/` tipos e regras puras (supressão, formatação), sem dependência da origem dos dados.
- `src/data/adapters/mock/` **dados fictícios** determinísticos (seed fixa), só para dev/demo.
- `src/features/mapa/` mapa em SVG (d3-geo) com malhas do IBGE em `public/geo/`.
- Estado (indicador, filtros, UF, unidade) fica na URL: qualquer visão pode ser compartilhada.

## Deploy na Vercel

1. Importe o repositório na Vercel (framework detectado: Vite).
2. Nenhuma variável é necessária para a demonstração (`.env.production` já define o mock).
3. `vercel.json` já configura o roteamento da SPA e cabeçalhos de segurança.

## Identidade visual

Logos oficiais **não** estão incluídos. Para adicionar marcas autorizadas, coloque os arquivos
em `public/marca/` e preencha `src/app/branding.ts`.

## Privacidade

Somente agregados; contagens de 1 a 4 e células que permitiriam dedução por subtração
aparecem como “oculto”. Detalhes em [docs/contrato-dados.md](docs/contrato-dados.md).
