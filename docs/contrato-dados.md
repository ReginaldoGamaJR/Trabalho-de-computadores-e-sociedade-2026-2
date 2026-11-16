# Contrato de dados — v0 (rascunho)

Documento para quem for construir o backend ou a extração de dados do observatório.
O frontend **não sabe** de onde vêm os dados: qualquer fonte que cumpra este contrato
funciona sem mudança na interface. Os tipos de referência estão em
[`src/domain/tipos.ts`](../src/domain/tipos.ts) e a validação em
[`src/data/schemas.ts`](../src/data/schemas.ts).

> ⚠ Indicadores e dimensões são **hipóteses** até a estrutura real das fichas de atendimento
> ser conhecida. Ver [modelo-fichas.md](modelo-fichas.md).

## Princípios (obrigatórios)

1. **Somente agregados.** Nenhuma resposta pode conter registro individual, texto livre,
   nome, documento, data exata de nascimento ou de atendimento, nem nome de empresa.
2. **Supressão no servidor.** Toda contagem entre 1 e `limiarSupressao - 1` (padrão 5) é
   enviada como `{ "valor": null, "suprimido": true }`. Zero pode ser enviado.
3. **Supressão complementar.** Se, num conjunto que soma ao total publicado, restar uma
   única célula suprimida, suprima também a menor célula positiva restante. Se o total for
   sensível, suprima todas as células do conjunto.
4. **Ataque por diferença.** O servidor deve evitar que duas consultas válidas permitam
   deduzir um valor suprimido por subtração (ex.: limitar combinações de filtros, granularidade
   mínima de período, arredondamento). Recomenda-se revisão de um estatístico.
5. **Consentimento.** Atendimentos de pessoas que recusaram o termo de consentimento para
   pesquisa **não entram** em nenhum agregado público (regra provisória, a confirmar).
6. **Máximo de 2 dimensões** por consulta. Códigos CNAE/CBO/CID só em grupos amplos
   (seção, grande grupo, capítulo), se forem incluídos.

O frontend **revalida** os itens 1, 2 e 6 e se recusa a exibir respostas que os violem
(`PrivacyGuard`). Isso é defesa em profundidade e não substitui o servidor.

## Endpoints REST (adaptador `rest`)

Base configurada em `VITE_API_BASE_URL`. Respostas em JSON, `UTF-8`.

| Método | Caminho | Resposta |
|---|---|---|
| GET | `/v1/capacidades` | `Capacidades` |
| GET | `/v1/catalogo` | `Catalogo` |
| GET | `/v1/unidades` | `Unidade[]` |
| POST | `/v1/consultas` | corpo `Consulta` → `ResultadoAgregado` |

Erros: `400/422` consulta não suportada · `401/403` não autorizado · `404` inexistente ·
`5xx` falha. Campos não previstos são **rejeitados** pelo frontend (schemas estritos).

### Consulta

```json
{
  "indicador": "atendimentos",
  "filtros": { "ano": 2025, "uf": "33", "tipoOcorrencia": "doenca_ocupacional" },
  "agruparPor": ["municipio"]
}
```

Filtros disponíveis: `ano`, `uf` (UF de residência, 2 dígitos IBGE), `municipio`
(7 dígitos IBGE), `unidade` (id), `tipoOcorrencia`, `vinculo`.

### ResultadoAgregado

```json
{
  "indicador": "atendimentos",
  "agruparPor": ["municipio"],
  "linhas": [
    { "chaves": { "municipio": "3303302" }, "valor": 132, "suprimido": false },
    { "chaves": { "municipio": "3304904" }, "valor": null, "suprimido": true }
  ],
  "total": { "valor": 260, "suprimido": false },
  "meta": {
    "versaoDados": "2026-03",
    "geradoEm": "2026-03-01T10:00:00Z",
    "limiarSupressao": 5,
    "ficticio": false
  }
}
```

Grupos sem registro podem ser omitidos (a interface trata ausência como zero).

### Catálogo

Define os indicadores (`id`, `titulo`, `rotuloCurto`, `descricao`, `medida`, `origem`,
`dimensoes`, `status`), as dimensões com rótulos dos valores, os anos disponíveis, o limiar,
a versão dos dados e `ficticio` (sempre `false` em produção). Rótulos vêm do catálogo: mudar
uma categoria nas fichas não exige mudar a interface.

### Unidade

`id`, `nome`, `cidade`, `uf` (sigla), `codigoUf`, `municipioIbge`, `coord` ([lon, lat]),
`instituicao` (ou `null`), `servicos` (lista, pode ser vazia).

## Arquivos estáticos (adaptador `static`)

Alternativa sem API: um script gera os agregados periodicamente e publica em
`VITE_STATIC_BASE_URL`:

```
capacidades.json  catalogo.json  unidades.json
consultas/{chave}.json
```

`chave` = `encodeURIComponent("i=<indicador>;<filtros em ordem alfabética k=v;…>;g=<dims>")`,
gerada por `chaveConsulta()` em `src/data/adapters/static/StaticFileAdapter.ts`. Só as
combinações publicadas ficam disponíveis; as demais aparecem como “recorte indisponível”.

## Banco de dados

O navegador **nunca** acessa banco de dados. Um backend (qualquer linguagem) lê o banco ou
as planilhas, agrega, aplica as regras acima e expõe o contrato REST.
