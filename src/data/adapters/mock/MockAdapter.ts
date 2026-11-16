// ⚠ ADAPTADOR DE DADOS FICTÍCIOS — desenvolvimento, testes e demonstração.
// Simula um backend que cumpre o contrato: só devolve agregados, já com supressão.

import { LIMIAR_PADRAO, suprimirConjunto } from '../../../domain/supressao';
import type {
  Capacidades,
  Catalogo,
  Consulta,
  ResultadoAgregado,
  Unidade,
} from '../../../domain/tipos';
import { DataError, type DataProvider, type OpcoesChamada } from '../../DataProvider';
import { DIMENSOES, INDICADORES } from './catalogoMock';
import { ANOS_MOCK, gerarCasos, UNIDADES_MOCK, type CasoSintetico } from './gerador';

const VERSAO = 'mock-1';
const DATA_GERACAO = '2025-11-09';

const PREDICADOS: Record<string, (c: CasoSintetico) => boolean> = {
  atendimentos: () => true,
  cat_emitidas: (c) => c.catEmitida,
  dossies_relatorios: (c) => c.dossieOuRelatorio,
  pedidos_b91: (c) => c.pedidoB91,
};

function valorDimensao(c: CasoSintetico, dim: string): string {
  switch (dim) {
    case 'uf':
      return c.municipio.slice(0, 2);
    case 'municipio':
      return c.municipio;
    case 'unidade':
      return c.unidade;
    case 'ano':
      return String(c.ano);
    case 'tipoOcorrencia':
      return c.tipoOcorrencia;
    case 'vinculo':
      return c.vinculo;
    case 'sexo':
      return c.sexo;
    case 'faixaEtaria':
      return c.faixaEtaria;
    default:
      throw new DataError('consulta_nao_suportada', `Dimensão desconhecida: ${dim}`);
  }
}

function esperar(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Abortado', 'AbortError'));
    });
  });
}

export interface OpcoesMock {
  seed?: number;
  /** Latência simulada (ms), para exercitar estados de carregamento. */
  latencia?: number;
  limiar?: number;
}

export class MockAdapter implements DataProvider {
  readonly fonte = 'mock';
  private readonly casos: CasoSintetico[];
  private readonly latencia: number;
  private readonly limiar: number;

  constructor(opts: OpcoesMock = {}) {
    // Casos de quem recusou o consentimento ficam fora de todo agregado público.
    this.casos = gerarCasos(opts.seed).filter((c) => !c.recusouConsentimento);
    this.latencia = opts.latencia ?? 0;
    this.limiar = opts.limiar ?? LIMIAR_PADRAO;
  }

  async capacidades(opts?: OpcoesChamada): Promise<Capacidades> {
    await esperar(this.latencia, opts?.signal);
    return { dimensoes: DIMENSOES.map((d) => d.id), maxDimensoes: 2, consultaEmLote: false };
  }

  async catalogo(opts?: OpcoesChamada): Promise<Catalogo> {
    await esperar(this.latencia, opts?.signal);
    return {
      versaoDados: VERSAO,
      atualizadoEm: DATA_GERACAO,
      limiarSupressao: this.limiar,
      ficticio: true,
      anos: ANOS_MOCK,
      indicadores: INDICADORES,
      dimensoes: DIMENSOES,
      notas: [
        'Dados FICTÍCIOS gerados automaticamente para demonstração. Não representam atendimentos reais.',
      ],
    };
  }

  async unidades(opts?: OpcoesChamada): Promise<Unidade[]> {
    await esperar(this.latencia, opts?.signal);
    return UNIDADES_MOCK.map((u) => ({
      id: u.id,
      nome: `Unidade ${u.cidade}`,
      cidade: u.cidade,
      uf: u.uf,
      codigoUf: u.codigoUf,
      municipioIbge: u.municipioIbge,
      coord: [u.coord[0]!, u.coord[1]!],
      instituicao: null,
      servicos: [],
    }));
  }

  async consultar(consulta: Consulta, opts?: OpcoesChamada): Promise<ResultadoAgregado> {
    await esperar(this.latencia, opts?.signal);
    const pred = PREDICADOS[consulta.indicador];
    if (!pred) throw new DataError('nao_encontrado', `Indicador ${consulta.indicador}`);
    const dims = consulta.agruparPor ?? [];
    if (dims.length > 2) throw new DataError('consulta_nao_suportada');

    const f = consulta.filtros;
    const filtrados = this.casos.filter(
      (c) =>
        pred(c) &&
        (f.ano === undefined || c.ano === f.ano) &&
        (f.uf === undefined || c.municipio.startsWith(f.uf)) &&
        (f.municipio === undefined || c.municipio === f.municipio) &&
        (f.unidade === undefined || c.unidade === f.unidade) &&
        (f.tipoOcorrencia === undefined || c.tipoOcorrencia === f.tipoOcorrencia) &&
        (f.vinculo === undefined || c.vinculo === f.vinculo),
    );

    const grupos = new Map<string, { chaves: Record<string, string>; n: number }>();
    for (const c of filtrados) {
      const chaves: Record<string, string> = {};
      for (const d of dims) chaves[d] = valorDimensao(c, d);
      const k = dims.map((d) => chaves[d]).join('|');
      const g = grupos.get(k);
      if (g) g.n++;
      else grupos.set(k, { chaves, n: 1 });
    }
    const lista = [...grupos.values()].sort((a, b) => b.n - a.n);
    const { celulas, total } = suprimirConjunto(
      lista.map((g) => g.n),
      filtrados.length,
      this.limiar,
    );

    return {
      indicador: consulta.indicador,
      agruparPor: dims,
      linhas: dims.length ? lista.map((g, i) => ({ chaves: g.chaves, ...celulas[i]! })) : [],
      total,
      meta: {
        versaoDados: VERSAO,
        geradoEm: DATA_GERACAO,
        limiarSupressao: this.limiar,
        ficticio: true,
      },
    };
  }
}
