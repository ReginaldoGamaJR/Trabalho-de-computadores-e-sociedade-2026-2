// Adaptador para uma API REST que cumpra docs/contrato-dados.md.
// Não valida nada sozinho: a validação é feita pelo decorador comValidacao().

import type {
  Capacidades,
  Catalogo,
  Consulta,
  ResultadoAgregado,
  Unidade,
} from '../../../domain/tipos';
import { DataError, type DataProvider, type OpcoesChamada } from '../../DataProvider';

export interface OpcoesRest {
  baseUrl: string;
  timeoutMs?: number;
  /** Injetável para testes. */
  fetch?: typeof fetch;
  headers?: Record<string, string>;
}

function erroPorStatus(status: number): DataError {
  if (status === 404) return new DataError('nao_encontrado', `HTTP ${status}`);
  if (status === 401 || status === 403) return new DataError('nao_autorizado', `HTTP ${status}`);
  if (status === 400 || status === 422)
    return new DataError('consulta_nao_suportada', `HTTP ${status}`);
  return new DataError('rede', `HTTP ${status}`);
}

export class RestApiAdapter implements DataProvider {
  readonly fonte = 'rest';
  private readonly base: string;
  private readonly timeoutMs: number;
  private readonly f: typeof fetch;
  private readonly headers: Record<string, string>;

  constructor(opts: OpcoesRest) {
    this.base = opts.baseUrl.replace(/\/$/, '');
    this.timeoutMs = opts.timeoutMs ?? 15000;
    this.f = opts.fetch ?? fetch.bind(globalThis);
    this.headers = opts.headers ?? {};
  }

  private async requisitar<T>(
    caminho: string,
    init: RequestInit,
    opts?: OpcoesChamada,
  ): Promise<T> {
    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort('timeout'), this.timeoutMs);
    opts?.signal?.addEventListener('abort', () => controle.abort(opts.signal?.reason));
    let res: Response;
    try {
      res = await this.f(`${this.base}${caminho}`, {
        ...init,
        headers: { Accept: 'application/json', ...this.headers, ...init.headers },
        signal: controle.signal,
      });
    } catch (e) {
      if (controle.signal.aborted && controle.signal.reason === 'timeout')
        throw new DataError('timeout', undefined, { cause: e });
      if (opts?.signal?.aborted) throw e; // cancelamento pelo chamador: repassa
      throw new DataError('rede', undefined, { cause: e });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw erroPorStatus(res.status);
    try {
      return (await res.json()) as T;
    } catch (e) {
      throw new DataError('resposta_invalida', 'JSON inválido', { cause: e });
    }
  }

  capacidades(opts?: OpcoesChamada) {
    return this.requisitar<Capacidades>('/v1/capacidades', { method: 'GET' }, opts);
  }

  catalogo(opts?: OpcoesChamada) {
    return this.requisitar<Catalogo>('/v1/catalogo', { method: 'GET' }, opts);
  }

  unidades(opts?: OpcoesChamada) {
    return this.requisitar<Unidade[]>('/v1/unidades', { method: 'GET' }, opts);
  }

  consultar(consulta: Consulta, opts?: OpcoesChamada) {
    return this.requisitar<ResultadoAgregado>(
      '/v1/consultas',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consulta),
      },
      opts,
    );
  }
}
