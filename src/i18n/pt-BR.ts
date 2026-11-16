// Textos de interface (não de conteúdo). Centralizados para facilitar uma futura
// tradução: basta criar outro arquivo com a mesma forma (tipo Textos).

export const ptBR = {
  nav: {
    dados: 'Mapa e dados',
    comoFunciona: 'Como funciona',
    sobre: 'Sobre e metodologia',
    glossario: 'Glossário',
    pularConteudo: 'Pular para o conteúdo',
    menu: 'Menu principal',
  },
  estados: {
    carregando: 'Carregando…',
    erroTitulo: 'Não foi possível carregar estes dados',
    tentarNovamente: 'Tentar novamente',
    vazio: 'Nenhum registro neste recorte.',
    suprimidoTotal:
      'Há poucos casos neste recorte. O número foi ocultado para proteger a privacidade.',
  },
  mock: {
    titulo: 'Dados fictícios',
    texto:
      'Ambiente de demonstração. Os números exibidos foram gerados automaticamente e não representam atendimentos reais.',
    marcaDagua: 'DADOS FICTÍCIOS',
  },
  filtros: {
    titulo: 'Filtros',
    indicador: 'Indicador no mapa',
    ano: 'Ano',
    tipoOcorrencia: 'Tipo de ocorrência',
    vinculo: 'Vínculo',
    todos: 'Todos',
    limpar: 'Limpar filtros',
  },
  mapa: {
    brasil: 'Brasil',
    voltarBrasil: 'Voltar ao Brasil',
    verTabela: 'Ver dados do mapa em tabela',
    territorio: 'Território',
    unidade: 'Unidade',
    semRegistro: 'Nenhum registro',
    suprimido: (limiar: number) => `Oculto (menos de ${limiar} ou proteção complementar)`,
    marcadorUnidade: 'Unidade do projeto (tamanho proporcional ao valor)',
    dicaUf: 'Selecione um estado para ver os municípios.',
    dicaMunicipio:
      'Cores indicam o município de residência das pessoas atendidas. Selecione uma unidade para ver seus dados.',
  },
} as const;

export type Textos = typeof ptBR;
export const textos: Textos = ptBR;
