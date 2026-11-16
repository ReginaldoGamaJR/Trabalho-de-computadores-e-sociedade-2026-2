import type { Celula } from './tipos';

const nf = new Intl.NumberFormat('pt-BR');
const pf = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

export function formatarNumero(n: number): string {
  return nf.format(n);
}

export function formatarPercentual(fracao: number): string {
  return pf.format(fracao);
}

export const TEXTO_OCULTO = 'oculto';

/**
 * Texto curto de uma célula para exibição. Células suprimidas aparecem como "oculto"
 * (e não "menos de N"): pela supressão complementar, um valor oculto pode ser maior
 * que o limiar, e dizer "menos de N" seria falso.
 */
export function textoCelula(c: Celula): string {
  if (c.suprimido || c.valor === null) return TEXTO_OCULTO;
  return formatarNumero(c.valor);
}

export function formatarData(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR');
}
