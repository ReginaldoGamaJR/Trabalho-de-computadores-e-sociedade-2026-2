// Tipos de domínio da plataforma. Não dependem de onde os dados vêm (API, arquivos,
// mock). Toda informação aqui é AGREGADA: não existe tipo para registro individual.

/** Código IBGE: 2 dígitos (UF) ou 7 dígitos (município). */
export type CodigoIbge = string;

/** [longitude, latitude] em graus decimais (WGS84). */
export type Coordenada = [number, number];

export interface Unidade {
  id: string;
  nome: string;
  cidade: string;
  /** Sigla da UF, ex.: "RJ". */
  uf: string;
  codigoUf: CodigoIbge;
  municipioIbge: CodigoIbge;
  coord: Coordenada;
  /** Instituição parceira. Preenchida pela fonte de dados; null se não informada. */
  instituicao: string | null;
  /** Serviços oferecidos na unidade, quando a fonte informar. */
  servicos: string[];
}

export type MedidaIndicador = 'contagem' | 'percentual' | 'dias';

export interface IndicadorDef {
  id: string;
  titulo: string;
  /** Rótulo curto para cartões e legendas. */
  rotuloCurto: string;
  descricao: string;
  medida: MedidaIndicador;
  /** Ficha(s) de atendimento de onde o dado se origina. */
  origem: string;
  /** Dimensões pelas quais o indicador pode ser agrupado ou filtrado. */
  dimensoes: string[];
  /** "hipotese" enquanto a definição não for validada pela coordenação. */
  status: 'hipotese' | 'validado';
}

export interface ValorDimensao {
  id: string;
  rotulo: string;
}

export interface DimensaoDef {
  id: string;
  rotulo: string;
  descricao: string;
  /** Valores possíveis. Ausente para dimensões territoriais (códigos IBGE). */
  valores?: ValorDimensao[];
}

export interface Catalogo {
  versaoDados: string;
  atualizadoEm: string; // ISO 8601 (data)
  limiarSupressao: number;
  /** true quando a fonte é fictícia (mock). A UI exibe aviso permanente. */
  ficticio: boolean;
  /** Anos com dados disponíveis. */
  anos: number[];
  indicadores: IndicadorDef[];
  dimensoes: DimensaoDef[];
  notas: string[];
}

/** Filtros aplicáveis a qualquer consulta. Todos opcionais (ausente = sem filtro). */
export interface Filtros {
  ano?: number;
  /** UF de residência da pessoa atendida (código IBGE de 2 dígitos). */
  uf?: CodigoIbge;
  /** Município de residência da pessoa atendida (código IBGE de 7 dígitos). */
  municipio?: CodigoIbge;
  unidade?: string;
  tipoOcorrencia?: string;
  vinculo?: string;
}

export interface Consulta {
  indicador: string;
  filtros: Filtros;
  /** Até 2 dimensões. Vazio = apenas o total. */
  agruparPor?: string[];
}

export interface Celula {
  valor: number | null;
  suprimido: boolean;
}

export interface LinhaAgregada extends Celula {
  /** Valor de cada dimensão agrupada, ex.: { uf: "33" }. */
  chaves: Record<string, string>;
}

export interface ResultadoAgregado {
  indicador: string;
  agruparPor: string[];
  linhas: LinhaAgregada[];
  total: Celula;
  meta: {
    versaoDados: string;
    geradoEm: string;
    limiarSupressao: number;
    ficticio: boolean;
  };
}

export interface Capacidades {
  dimensoes: string[];
  maxDimensoes: number;
  consultaEmLote: boolean;
}
