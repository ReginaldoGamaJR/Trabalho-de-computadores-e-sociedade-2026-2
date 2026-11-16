// Adaptador para agregados PRÉ-CALCULADOS publicados como arquivos JSON estáticos
// (ex.: extração periódica gerada por um script e publicada junto ao site ou num CDN).
//
// Layout esperado em {baseUrl}:
//   capacidades.json · catalogo.json · unidades.json
//   consultas/{chave}.json   onde chave = chaveConsulta(consulta)
//
// Só responde às combinações que foram pré-calculadas; as demais geram
// 'consulta_nao_suportada' (a UI trata como recorte indisponível).

import { chaveFiltros } from '../../../domain/filtros';
import type {
  Capacidades,
  Catalogo,
  Consulta,
  ResultadoAgregado,
  Unidade,
} from '../../../domain/tipos';
import { DataError, type DataProvider, type OpcoesChamada } from '../../DataProvider';

/** Nome de arquivo canônico para uma consulta. */
export function chaveConsulta(c: Consulta): string {
  const partes = [`i=${c.indicador}`];
  const f = chaveFiltros(c.filtros);
  if (f) partes.push(f);
  if (c.agruparPor?.length) partes.push(`g=${c.agruparPor.join(',')}`);
  return encodeURIComponent(partes.join(';'));
}

export interface OpcoesStatic {
  baseUrl: string;
  fetch?: typeof fetch;
}

export class StaticFileAdapter implements DataProvider {
  readonly fonte = 'static';
  private readonly base: string;
  private readonly f: typeof fetch;

  constructor(opts: OpcoesStatic) {
    this.base = opts.baseUrl.replace(/\/$/, '');
    this.f = opts.fetch ?? fetch.bind(globalThis);
  }

  private async ler<T>(caminho: string, opts?: OpcoesChamada, seAusente?: DataError): Promise<T> {
    let res: Response;
    try {
      res = await this.f(`${this.base}/${caminho}`, { signal: opts?.signal });
    } catch (e) {
      if (opts?.signal?.aborted) throw e;
      throw new DataError('rede', undefined, { cause: e });
    }
    if (res.status === 404) throw seAusente ?? new DataError('nao_encontrado', caminho);
    if (!res.ok) throw new DataError('rede', `HTTP ${res.status}`);
    try {
      return (await res.json()) as T;
    } catch (e) {
      throw new DataError('resposta_invalida', caminho, { cause: e });
    }
  }

  capacidades(opts?: OpcoesChamada) {
    return this.ler<Capacidades>('capacidades.json', opts);
  }

  catalogo(opts?: OpcoesChamada) {
    return this.ler<Catalogo>('catalogo.json', opts);
  }

  unidades(opts?: OpcoesChamada) {
    return this.ler<Unidade[]>('unidades.json', opts);
  }

  consultar(consulta: Consulta, opts?: OpcoesChamada) {
    return this.ler<ResultadoAgregado>(
      `consultas/${chaveConsulta(consulta)}.json`,
      opts,
      new DataError('consulta_nao_suportada', 'Recorte não pré-calculado.'),
    );
  }
}
