// ⚠ GERADOR DE DADOS FICTÍCIOS — uso exclusivo em desenvolvimento e testes.
//
// Gera, de forma determinística (seed fixa), "casos sintéticos" que existem apenas
// dentro deste módulo para que o MockAdapter produza AGREGADOS coerentes entre si
// (totais que batem com as quebras). Nada aqui representa pessoas ou números reais.
// Fora do mock, a plataforma não possui nenhum tipo de registro individual.

import territorio from './territorio.gerado.json';

export interface CasoSintetico {
  unidade: string;
  municipio: string;
  ano: number;
  tipoOcorrencia: string;
  vinculo: string;
  sexo: string;
  faixaEtaria: string;
  catEmitida: boolean;
  dossieOuRelatorio: boolean;
  pedidoB91: boolean;
  /** Recusou o termo de consentimento para pesquisa (excluído dos agregados públicos). */
  recusouConsentimento: boolean;
}

export const ANOS_MOCK = [2024, 2025];

/** PRNG determinístico (mulberry32). */
export function criarAleatorio(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function escolherPonderado<T extends string>(rnd: () => number, pesos: Record<T, number>): T {
  const entradas = Object.entries(pesos) as [T, number][];
  const soma = entradas.reduce((s, [, p]) => s + p, 0);
  let r = rnd() * soma;
  for (const [k, p] of entradas) {
    r -= p;
    if (r <= 0) return k;
  }
  return entradas[entradas.length - 1]![0];
}

export function gerarCasos(seed = 20251109): CasoSintetico[] {
  const rnd = criarAleatorio(seed);
  const casos: CasoSintetico[] = [];
  const todosVizinhos = territorio.unidades.flatMap((u) => u.vizinhos);

  for (const u of territorio.unidades) {
    const n = 30 + Math.floor(rnd() * 260);
    // Cada unidade recebe um viés próprio, para que os mapas tenham variação.
    const viesPsiquico = 0.5 + rnd() * 1.5;
    for (let i = 0; i < n; i++) {
      let municipio: string;
      const r = rnd();
      if (r < 0.55 || u.vizinhos.length === 0) municipio = u.municipioIbge;
      else if (r < 0.96) municipio = u.vizinhos[Math.floor(rnd() * u.vizinhos.length)]!;
      else municipio = todosVizinhos[Math.floor(rnd() * todosVizinhos.length)]!;

      const tipoOcorrencia = escolherPonderado(rnd, {
        acidente_tipico: 18,
        acidente_trajeto: 7,
        doenca_ocupacional: 35,
        sofrimento_psiquico: 30 * viesPsiquico,
        outra: 8,
      });
      const comNexo = tipoOcorrencia !== 'outra';
      casos.push({
        unidade: u.id,
        municipio,
        ano: rnd() < 0.42 ? 2024 : 2025,
        tipoOcorrencia,
        vinculo: escolherPonderado(rnd, {
          clt: 62,
          sem_carteira: 12,
          autonomo: 8,
          servidor: 14,
          outro: 4,
        }),
        sexo: escolherPonderado(rnd, { feminino: 50, masculino: 48, nao_informado: 2 }),
        faixaEtaria: escolherPonderado(rnd, {
          '18-29': 12,
          '30-39': 26,
          '40-49': 32,
          '50-59': 22,
          '60+': 8,
        }),
        catEmitida: comNexo && rnd() < 0.38,
        dossieOuRelatorio: comNexo && rnd() < 0.55,
        pedidoB91: comNexo && rnd() < 0.18,
        recusouConsentimento: rnd() < 0.02,
      });
    }
  }
  return casos;
}

export const UNIDADES_MOCK = territorio.unidades;
