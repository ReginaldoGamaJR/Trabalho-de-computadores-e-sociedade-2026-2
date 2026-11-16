// Catálogo usado pelo MockAdapter. As definições de indicadores e dimensões são
// HIPÓTESES baseadas no Documento Orientativo, a validar com a coordenação quando a
// estrutura real das fichas de atendimento estiver disponível.

import type { DimensaoDef, IndicadorDef } from '../../../domain/tipos';

export const DIMENSOES: DimensaoDef[] = [
  {
    id: 'uf',
    rotulo: 'UF de residência',
    descricao: 'Unidade da Federação onde reside a pessoa atendida.',
  },
  {
    id: 'municipio',
    rotulo: 'Município de residência',
    descricao: 'Município onde reside a pessoa atendida (código IBGE).',
  },
  {
    id: 'unidade',
    rotulo: 'Unidade de atendimento',
    descricao: 'Unidade do projeto que realizou o atendimento.',
  },
  { id: 'ano', rotulo: 'Ano', descricao: 'Ano da triagem.' },
  {
    id: 'tipoOcorrencia',
    rotulo: 'Tipo de ocorrência',
    descricao: 'Natureza do agravo relatado.',
    valores: [
      { id: 'acidente_tipico', rotulo: 'Acidente típico' },
      { id: 'acidente_trajeto', rotulo: 'Acidente de trajeto' },
      { id: 'doenca_ocupacional', rotulo: 'Doença ocupacional' },
      { id: 'sofrimento_psiquico', rotulo: 'Sofrimento psíquico' },
      { id: 'outra', rotulo: 'Outras demandas' },
    ],
  },
  {
    id: 'vinculo',
    rotulo: 'Vínculo de trabalho',
    descricao: 'Tipo de vínculo da pessoa atendida no momento do agravo.',
    valores: [
      { id: 'clt', rotulo: 'Com carteira (CLT)' },
      { id: 'sem_carteira', rotulo: 'Assalariado sem carteira' },
      { id: 'autonomo', rotulo: 'Autônomo' },
      { id: 'servidor', rotulo: 'Servidor público' },
      { id: 'outro', rotulo: 'Outro / não informado' },
    ],
  },
  {
    id: 'sexo',
    rotulo: 'Sexo',
    descricao: 'Sexo declarado.',
    valores: [
      { id: 'feminino', rotulo: 'Feminino' },
      { id: 'masculino', rotulo: 'Masculino' },
      { id: 'nao_informado', rotulo: 'Não informado' },
    ],
  },
  {
    id: 'faixaEtaria',
    rotulo: 'Faixa etária',
    descricao: 'Idade na data da triagem, em faixas de 10 anos.',
    valores: [
      { id: '18-29', rotulo: '18 a 29 anos' },
      { id: '30-39', rotulo: '30 a 39 anos' },
      { id: '40-49', rotulo: '40 a 49 anos' },
      { id: '50-59', rotulo: '50 a 59 anos' },
      { id: '60+', rotulo: '60 anos ou mais' },
    ],
  },
];

const TODAS = DIMENSOES.map((d) => d.id);

export const INDICADORES: IndicadorDef[] = [
  {
    id: 'atendimentos',
    titulo: 'Pessoas atendidas',
    rotuloCurto: 'Pessoas atendidas',
    descricao: 'Número de pessoas que passaram pela triagem e foram atendidas pelo projeto.',
    medida: 'contagem',
    origem: 'Ficha de triagem',
    dimensoes: TODAS,
    status: 'hipotese',
  },
  {
    id: 'cat_emitidas',
    titulo: 'CATs emitidas pelo projeto',
    rotuloCurto: 'CATs emitidas',
    descricao:
      'Comunicações de Acidente de Trabalho emitidas pelo projeto após identificação do nexo com o trabalho.',
    medida: 'contagem',
    origem: 'Ficha de elementos clínico-médicos / planilha local',
    dimensoes: TODAS,
    status: 'hipotese',
  },
  {
    id: 'dossies_relatorios',
    titulo: 'Dossiês e relatórios elaborados',
    rotuloCurto: 'Dossiês e relatórios',
    descricao:
      'Dossiês circunstanciados e relatórios médicos/de saúde entregues às pessoas atendidas.',
    medida: 'contagem',
    origem: 'Planilha local',
    dimensoes: TODAS,
    status: 'hipotese',
  },
  {
    id: 'pedidos_b91',
    titulo: 'Pedidos de transformação B31 → B91',
    rotuloCurto: 'Pedidos B31 → B91',
    descricao:
      'Casos em que o projeto apoiou o pedido de transformação do benefício comum (B31) em acidentário (B91).',
    medida: 'contagem',
    origem: 'Ficha sociojurídica / planilha local',
    dimensoes: TODAS,
    status: 'hipotese',
  },
];
