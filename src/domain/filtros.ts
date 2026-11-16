import type { Filtros } from './tipos';

/** Serializa filtros de forma canônica (ordem estável) para chaves de cache e arquivos. */
export function chaveFiltros(f: Filtros): string {
  const partes: string[] = [];
  const entradas = Object.entries(f).filter(([, v]) => v !== undefined && v !== '');
  entradas.sort(([a], [b]) => a.localeCompare(b));
  for (const [k, v] of entradas) partes.push(`${k}=${String(v)}`);
  return partes.join(';');
}

/** Remove chaves vazias. */
export function limparFiltros(f: Filtros): Filtros {
  const out: Filtros = {};
  for (const [k, v] of Object.entries(f) as [keyof Filtros, Filtros[keyof Filtros]][]) {
    if (v !== undefined && v !== '') (out as Record<string, unknown>)[k] = v;
  }
  return out;
}
