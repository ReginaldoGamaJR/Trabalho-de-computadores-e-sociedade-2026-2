import { scaleQuantize, scaleSqrt } from 'd3-scale';
import { formatarNumero } from '../../domain/formatacao';
import type { Celula } from '../../domain/tipos';

export const CORES_SEQUENCIAIS = [
  'var(--mapa-1)',
  'var(--mapa-2)',
  'var(--mapa-3)',
  'var(--mapa-4)',
  'var(--mapa-5)',
];
export const COR_VAZIO = 'var(--mapa-vazio)';
export const PADRAO_SUPRIMIDO = 'url(#padrao-suprimido)';

export interface ClasseLegenda {
  cor: string;
  rotulo: string;
}

export interface EscalaCoropletica {
  preencher(c: Celula | undefined): string;
  classes: ClasseLegenda[];
}

/** Escala em classes de mesma amplitude (0..máximo, arredondado). */
export function criarEscala(celulas: Iterable<Celula>, limiar: number): EscalaCoropletica {
  let max = 0;
  for (const c of celulas) if (!c.suprimido && c.valor !== null) max = Math.max(max, c.valor);

  const preencherBase = (c: Celula | undefined, s?: (v: number) => string) => {
    if (!c) return COR_VAZIO;
    if (c.suprimido) return PADRAO_SUPRIMIDO;
    if (!c.valor || !s) return COR_VAZIO;
    return s(c.valor);
  };

  if (max === 0) return { preencher: (c) => preencherBase(c), classes: [] };

  const nClasses = Math.min(CORES_SEQUENCIAIS.length, Math.max(1, Math.ceil(max / limiar)));
  const cores = CORES_SEQUENCIAIS.slice(CORES_SEQUENCIAIS.length - nClasses);
  const s = scaleQuantize<string>().domain([0, max]).nice(nClasses).range(cores);
  const limites = s.thresholds();
  const topo = s.domain()[1]!;

  const classes = cores.map((cor, i) => {
    const de = i === 0 ? limiar : Math.floor(limites[i - 1]!) + 1;
    const ate = i === cores.length - 1 ? topo : Math.floor(limites[i]!);
    return { cor, rotulo: `${formatarNumero(de)} a ${formatarNumero(Math.max(de, ate))}` };
  });

  return { preencher: (c) => preencherBase(c, s), classes };
}

/** Raio dos marcadores de unidade (área proporcional ao valor). */
export function criarEscalaRaio(celulas: Iterable<Celula>, raioMax: number) {
  let max = 0;
  for (const c of celulas) if (c.valor !== null) max = Math.max(max, c.valor);
  const s = scaleSqrt()
    .domain([0, Math.max(1, max)])
    .range([0, raioMax]);
  const minimo = raioMax * 0.22;
  return (c: Celula | undefined) =>
    !c || c.suprimido || c.valor === null ? minimo : Math.max(minimo, s(c.valor));
}
