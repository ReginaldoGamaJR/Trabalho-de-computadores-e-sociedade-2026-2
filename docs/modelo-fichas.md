# Modelo das fichas — hipótese de trabalho

A estrutura real das fichas de atendimento (Google Forms do sistema nacional) ainda não está
disponível. Este é o modelo **provisório** usado para os indicadores e o mock, derivado do
Documento Orientativo (2025). Ajuste quando as fichas forem conhecidas: o lugar a mudar é o
catálogo (`src/data/adapters/mock/catalogoMock.ts`) e, depois, o backend.

| Ficha | Campos que o observatório usa (agregados) | Uso |
|---|---|---|
| Triagem | data (→ ano), unidade, município de residência, sexo, idade (→ faixa), vínculo, tipo de ocorrência, consentimento para pesquisa | Pessoas atendidas, perfil, mapa |
| Agendamento | — | (futuro: tempo entre triagem e atendimento) |
| Sociojurídica | benefício atual (B31, B91…), pedido de transformação B31→B91, pedido de benefício, data do pedido ao INSS | Pedidos B31→B91; (futuro: espera > 3 meses no INSS) |
| Riscos ocupacionais | CNAE, CBO | (futuro: por atividade/ocupação, em grupos amplos) |
| Clínico-médica | CID, nexo identificado, CAT emitida | CATs emitidas; (futuro: por capítulo da CID) |
| Planilha local | dossiê/relatório entregue, CAT emitida (atualizado), benefício concedido | Dossiês e relatórios |

## Pontos em aberto

- Desfechos (CAT emitida, benefício concedido, transformação) podem existir **só nas
  planilhas locais**, não no sistema nacional.
- O funil do atendimento depende de as fichas de uma mesma pessoa estarem ligadas por um
  identificador.
- Município: assumido como **município de residência**.
- Recusa do consentimento: excluída de todo agregado público (regra provisória).
