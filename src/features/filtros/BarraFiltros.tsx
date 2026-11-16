import { useId } from 'react';
import type { Catalogo } from '../../domain/tipos';
import { textos } from '../../i18n/pt-BR';
import { INDICADOR_PADRAO, useEstadoPainel } from './useFiltros';
import './filtros.css';

interface Props {
  catalogo: Catalogo;
}

export function BarraFiltros({ catalogo }: Props) {
  const { estado, atualizar } = useEstadoPainel();
  const id = useId();
  const t = textos.filtros;
  const valores = (dim: string) => catalogo.dimensoes.find((d) => d.id === dim)?.valores ?? [];
  const algumFiltro =
    estado.ano !== undefined ||
    estado.tipoOcorrencia !== undefined ||
    estado.vinculo !== undefined ||
    estado.indicador !== INDICADOR_PADRAO;

  return (
    <form className="filtros" aria-label={t.titulo} onSubmit={(e) => e.preventDefault()}>
      <div className="filtros__campo">
        <label htmlFor={`${id}-ind`}>{t.indicador}</label>
        <select
          id={`${id}-ind`}
          value={estado.indicador}
          onChange={(e) => atualizar({ indicador: e.target.value })}
        >
          {catalogo.indicadores.map((i) => (
            <option key={i.id} value={i.id}>
              {i.rotuloCurto}
            </option>
          ))}
        </select>
      </div>

      <div className="filtros__campo">
        <label htmlFor={`${id}-ano`}>{t.ano}</label>
        <select
          id={`${id}-ano`}
          value={estado.ano ?? ''}
          onChange={(e) => atualizar({ ano: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">{t.todos}</option>
          {catalogo.anos.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="filtros__campo">
        <label htmlFor={`${id}-tipo`}>{t.tipoOcorrencia}</label>
        <select
          id={`${id}-tipo`}
          value={estado.tipoOcorrencia ?? ''}
          onChange={(e) => atualizar({ tipoOcorrencia: e.target.value || undefined })}
        >
          <option value="">{t.todos}</option>
          {valores('tipoOcorrencia').map((v) => (
            <option key={v.id} value={v.id}>
              {v.rotulo}
            </option>
          ))}
        </select>
      </div>

      <div className="filtros__campo">
        <label htmlFor={`${id}-vinculo`}>{t.vinculo}</label>
        <select
          id={`${id}-vinculo`}
          value={estado.vinculo ?? ''}
          onChange={(e) => atualizar({ vinculo: e.target.value || undefined })}
        >
          <option value="">{t.todos}</option>
          {valores('vinculo').map((v) => (
            <option key={v.id} value={v.id}>
              {v.rotulo}
            </option>
          ))}
        </select>
      </div>

      {algumFiltro && (
        <button
          type="button"
          className="botao botao--secundario filtros__limpar"
          onClick={() =>
            atualizar({
              indicador: INDICADOR_PADRAO,
              ano: undefined,
              tipoOcorrencia: undefined,
              vinculo: undefined,
            })
          }
        >
          {t.limpar}
        </button>
      )}
    </form>
  );
}
