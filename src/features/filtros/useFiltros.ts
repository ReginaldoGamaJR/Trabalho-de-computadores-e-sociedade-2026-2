// Estado de navegação e filtros guardado na URL: qualquer visão pode ser
// compartilhada por link e o botão "voltar" do navegador funciona.

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { Filtros } from '../../domain/tipos';

export interface EstadoPainel {
  indicador: string;
  ano?: number;
  tipoOcorrencia?: string;
  vinculo?: string;
  /** UF em foco no mapa (código IBGE). */
  uf?: string;
  /** Unidade selecionada. */
  unidade?: string;
}

export const INDICADOR_PADRAO = 'atendimentos';

const PARAMS: Record<keyof EstadoPainel, string> = {
  indicador: 'ind',
  ano: 'ano',
  tipoOcorrencia: 'tipo',
  vinculo: 'vinculo',
  uf: 'uf',
  unidade: 'unidade',
};

function ler(sp: URLSearchParams): EstadoPainel {
  const ano = Number(sp.get(PARAMS.ano));
  const uf = sp.get(PARAMS.uf);
  return {
    indicador: sp.get(PARAMS.indicador) || INDICADOR_PADRAO,
    ano: Number.isInteger(ano) && ano > 1900 ? ano : undefined,
    tipoOcorrencia: sp.get(PARAMS.tipoOcorrencia) || undefined,
    vinculo: sp.get(PARAMS.vinculo) || undefined,
    uf: uf && /^\d{2}$/.test(uf) ? uf : undefined,
    unidade: sp.get(PARAMS.unidade) || undefined,
  };
}

export function useEstadoPainel() {
  const [sp, setSp] = useSearchParams();
  const estado = useMemo(() => ler(sp), [sp]);

  const atualizar = useCallback(
    (parcial: Partial<EstadoPainel>) => {
      setSp(
        (atual) => {
          const novo = { ...ler(atual), ...parcial };
          const out = new URLSearchParams();
          for (const k of Object.keys(PARAMS) as (keyof EstadoPainel)[]) {
            const v = novo[k];
            if (v === undefined || v === '') continue;
            if (k === 'indicador' && v === INDICADOR_PADRAO) continue;
            out.set(PARAMS[k], String(v));
          }
          return out;
        },
        { replace: false },
      );
    },
    [setSp],
  );

  /** Filtros temáticos (sem o recorte territorial), aplicados a todas as consultas. */
  const filtrosBase: Filtros = useMemo(
    () => ({
      ano: estado.ano,
      tipoOcorrencia: estado.tipoOcorrencia,
      vinculo: estado.vinculo,
    }),
    [estado.ano, estado.tipoOcorrencia, estado.vinculo],
  );

  return { estado, atualizar, filtrosBase };
}
