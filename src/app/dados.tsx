// Injeção do DataProvider e hooks de acesso a dados. A interface usa apenas estes
// hooks; nenhum componente importa adaptadores diretamente.

import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { DataProvider } from '../data/DataProvider';
import { chaveFiltros, limparFiltros } from '../domain/filtros';
import type { Consulta } from '../domain/tipos';

const Ctx = createContext<DataProvider | null>(null);

export function DataProviderProvider({
  provider,
  children,
}: {
  provider: DataProvider;
  children: ReactNode;
}) {
  return <Ctx.Provider value={provider}>{children}</Ctx.Provider>;
}

export function useProvider(): DataProvider {
  const p = useContext(Ctx);
  if (!p) throw new Error('DataProvider não configurado.');
  return p;
}

const LONGO = 10 * 60 * 1000;

export function useCatalogo() {
  const p = useProvider();
  return useQuery({
    queryKey: ['catalogo', p.fonte],
    queryFn: ({ signal }) => p.catalogo({ signal }),
    staleTime: LONGO,
  });
}

export function useUnidades() {
  const p = useProvider();
  return useQuery({
    queryKey: ['unidades', p.fonte],
    queryFn: ({ signal }) => p.unidades({ signal }),
    staleTime: LONGO,
  });
}

/** Executa uma consulta agregada. Passe null para não consultar. */
export function useConsulta(consulta: Consulta | null) {
  const p = useProvider();
  return useQuery({
    ...opcoesConsulta(p, consulta ?? { indicador: '', filtros: {} }),
    enabled: consulta !== null,
    placeholderData: (anterior) => anterior,
  });
}

/** Opções compartilhadas por useConsulta e pelo pré-carregamento (mesma chave de cache). */
export function opcoesConsulta(p: DataProvider, consulta: Consulta) {
  const c = { ...consulta, filtros: limparFiltros(consulta.filtros) };
  return {
    queryKey: [
      'consulta',
      p.fonte,
      c.indicador,
      chaveFiltros(c.filtros),
      c.agruparPor?.join(',') ?? '',
    ],
    queryFn: ({ signal }: { signal: AbortSignal }) => p.consultar(c, { signal }),
    staleTime: LONGO,
  };
}

/** Pré-carrega uma consulta no cache (ex.: dados de uma UF antes do clique). */
export function usePreCarregarConsulta() {
  const p = useProvider();
  const qc = useQueryClient();
  return useCallback(
    (consulta: Consulta) => qc.prefetchQuery(opcoesConsulta(p, consulta)),
    [p, qc],
  );
}
