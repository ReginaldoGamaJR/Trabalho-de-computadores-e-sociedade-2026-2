// Porta de dados: o ÚNICO ponto de contato entre a interface e qualquer fonte.
// Componentes e hooks dependem desta interface, nunca de um adaptador concreto.

import type { Capacidades, Catalogo, Consulta, ResultadoAgregado, Unidade } from '../domain/tipos';

export interface OpcoesChamada {
  signal?: AbortSignal;
}

export interface DataProvider {
  /** Identificador da fonte (ex.: "mock", "rest", "static"). Apenas informativo. */
  readonly fonte: string;
  capacidades(opts?: OpcoesChamada): Promise<Capacidades>;
  catalogo(opts?: OpcoesChamada): Promise<Catalogo>;
  unidades(opts?: OpcoesChamada): Promise<Unidade[]>;
  consultar(consulta: Consulta, opts?: OpcoesChamada): Promise<ResultadoAgregado>;
}

export type TipoErroDados =
  | 'rede'
  | 'timeout'
  | 'nao_encontrado'
  | 'nao_autorizado'
  | 'consulta_nao_suportada'
  | 'resposta_invalida'
  | 'violacao_privacidade';

const MENSAGENS: Record<TipoErroDados, string> = {
  rede: 'Não foi possível conectar à fonte de dados.',
  timeout: 'A fonte de dados demorou demais para responder.',
  nao_encontrado: 'O dado solicitado não foi encontrado.',
  nao_autorizado: 'Acesso não autorizado a este dado.',
  consulta_nao_suportada: 'Este recorte não está disponível.',
  resposta_invalida: 'A fonte de dados respondeu em um formato inesperado.',
  violacao_privacidade:
    'Os dados recebidos não respeitam as regras de privacidade e não serão exibidos.',
};

export class DataError extends Error {
  readonly tipo: TipoErroDados;
  readonly mensagemUsuario: string;

  constructor(tipo: TipoErroDados, detalhe?: string, options?: { cause?: unknown }) {
    super(detalhe ?? MENSAGENS[tipo], options);
    this.name = 'DataError';
    this.tipo = tipo;
    this.mensagemUsuario = MENSAGENS[tipo];
  }
}

export function ehDataError(e: unknown): e is DataError {
  return e instanceof DataError;
}
