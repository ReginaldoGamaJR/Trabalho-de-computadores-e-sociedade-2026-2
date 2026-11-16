import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCatalogo, useConsulta, usePreCarregarConsulta, useUnidades } from '../app/dados';
import type { Catalogo, Celula, ResultadoAgregado, Unidade } from '../domain/tipos';
import { formatarData } from '../domain/formatacao';
import { BarraFiltros } from '../features/filtros/BarraFiltros';
import { useEstadoPainel } from '../features/filtros/useFiltros';
import { criarEscala } from '../features/mapa/escala';
import { preCarregarMalhaUf, useMalhaMunicipios, useMalhaUfs } from '../features/mapa/geo';
import { Legenda } from '../features/mapa/Legenda';
import { MapaBrasil } from '../features/mapa/MapaBrasil';
import { TabelaMapa } from '../features/mapa/TabelaMapa';
import { PainelRecorte, type Recorte } from '../features/painel/PainelRecorte';
import { textos } from '../i18n/pt-BR';
import { Carregando, Erro } from '../ui/componentes';
import './paginas.css';

function porChave(r: ResultadoAgregado | undefined, dim: string): Map<string, Celula> {
  const m = new Map<string, Celula>();
  // Ignora resultados de outro agrupamento (ex.: dado anterior mantido durante a troca de nível).
  if (r?.agruparPor[0] !== dim) return m;
  r.linhas.forEach((l) => m.set(l.chaves[dim]!, { valor: l.valor, suprimido: l.suprimido }));
  return m;
}

export function MapaPage() {
  const catalogo = useCatalogo();
  const unidades = useUnidades();

  if (catalogo.isError)
    return <Erro erro={catalogo.error} onTentarNovamente={() => catalogo.refetch()} />;
  if (unidades.isError)
    return <Erro erro={unidades.error} onTentarNovamente={() => unidades.refetch()} />;
  if (!catalogo.data || !unidades.data) {
    return (
      <div className="container pagina">
        <Carregando altura={480} rotulo="Carregando o mapa…" />
      </div>
    );
  }
  return <MapaConteudo catalogo={catalogo.data} unidades={unidades.data} />;
}

function MapaConteudo({ catalogo, unidades }: { catalogo: Catalogo; unidades: Unidade[] }) {
  const { estado, atualizar, filtrosBase } = useEstadoPainel();
  const t = textos.mapa;
  const nivel = estado.uf ? 'uf' : 'br';
  const dimTerritorio = nivel === 'br' ? 'uf' : 'municipio';
  const indicador =
    catalogo.indicadores.find((i) => i.id === estado.indicador) ?? catalogo.indicadores[0]!;

  const malhaUfs = useMalhaUfs();
  const malhaMunicipios = useMalhaMunicipios(estado.uf);
  const malha = nivel === 'br' ? malhaUfs : malhaMunicipios;

  const qTerritorios = useConsulta({
    indicador: indicador.id,
    filtros: { ...filtrosBase, uf: estado.uf },
    agruparPor: [dimTerritorio],
  });
  const qUnidades = useConsulta({
    indicador: indicador.id,
    filtros: filtrosBase,
    agruparPor: ['unidade'],
  });

  const valores = useMemo(
    () => porChave(qTerritorios.data, dimTerritorio),
    [qTerritorios.data, dimTerritorio],
  );
  const valoresUnidades = useMemo(() => porChave(qUnidades.data, 'unidade'), [qUnidades.data]);
  const escala = useMemo(
    () => criarEscala(valores.values(), catalogo.limiarSupressao),
    [valores, catalogo.limiarSupressao],
  );

  const nomeUf = malhaUfs.data?.features.find((f) => f.properties.codigo === estado.uf)?.properties
    .nome;
  const unidadesVisiveis =
    nivel === 'br' ? unidades : unidades.filter((u) => u.codigoUf === estado.uf);
  const unidadeSel = unidades.find((u) => u.id === estado.unidade);

  const recorte: Recorte = unidadeSel
    ? { tipo: 'unidade', unidade: unidadeSel }
    : estado.uf && nomeUf
      ? { tipo: 'uf', codigo: estado.uf, nome: nomeUf }
      : { tipo: 'br' };

  // Ao trocar de nível, leva o foco ao título do mapa (orientação para leitor de tela).
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const nivelAnterior = useRef(nivel + (estado.uf ?? ''));
  useEffect(() => {
    const atual = nivel + (estado.uf ?? '');
    if (nivelAnterior.current !== atual) tituloRef.current?.focus({ preventScroll: true });
    nivelAnterior.current = atual;
  }, [nivel, estado.uf]);

  // UF de onde se voltou ao Brasil: o mapa nacional começa aproximado nela e se afasta.
  const ufAnterior = useRef(estado.uf);
  const animarDeUf = nivel === 'br' ? ufAnterior.current : undefined;
  useEffect(() => {
    ufAnterior.current = estado.uf;
  }, [estado.uf]);

  // Pré-carrega malha e dados de uma UF (no hover/foco), para o zoom cair já pronto.
  const qc = useQueryClient();
  const preCarregarConsulta = usePreCarregarConsulta();
  const preCarregarUf = useCallback(
    (codigo: string) => {
      void preCarregarMalhaUf(qc, codigo);
      void preCarregarConsulta({
        indicador: indicador.id,
        filtros: { ...filtrosBase, uf: codigo },
        agruparPor: ['municipio'],
      });
    },
    [qc, preCarregarConsulta, indicador.id, filtrosBase],
  );

  const tituloMapa =
    nivel === 'br'
      ? `${indicador.titulo} por UF de residência`
      : `${indicador.titulo} por município de residência — ${nomeUf ?? ''}`;

  return (
    <div className="container pagina pagina--mapa">
      <div className="pagina__intro">
        <h1>Atendimentos da rede Caminhos do Trabalho</h1>
        <p className="pagina__lead">
          Explore no mapa onde vivem as pessoas atendidas e o que acontece em cada unidade. Todos os
          números são agregados e anônimos.
        </p>
      </div>

      <div className="cartao">
        <BarraFiltros catalogo={catalogo} />
      </div>

      <div className="mapa-layout">
        <section className="cartao mapa-layout__mapa" aria-labelledby="titulo-mapa">
          <nav aria-label="Navegação territorial" className="trilha">
            <ol>
              <li>
                {nivel === 'br' ? (
                  <span aria-current="page">{t.brasil}</span>
                ) : (
                  <button
                    type="button"
                    className="trilha__link"
                    onClick={() => atualizar({ uf: undefined, unidade: undefined })}
                  >
                    {t.brasil}
                  </button>
                )}
              </li>
              {nivel === 'uf' && (
                <li>
                  {unidadeSel ? (
                    <button
                      type="button"
                      className="trilha__link"
                      onClick={() => atualizar({ unidade: undefined })}
                    >
                      {nomeUf}
                    </button>
                  ) : (
                    <span aria-current="page">{nomeUf}</span>
                  )}
                </li>
              )}
              {unidadeSel && (
                <li>
                  <span aria-current="page">{unidadeSel.nome}</span>
                </li>
              )}
            </ol>
          </nav>

          <h2 id="titulo-mapa" ref={tituloRef} tabIndex={-1} className="mapa-layout__titulo">
            {tituloMapa}
          </h2>
          <p className="mapa-layout__dica">{nivel === 'br' ? t.dicaUf : t.dicaMunicipio}</p>

          {malha.isError ? (
            <Erro erro={malha.error} onTentarNovamente={() => malha.refetch()} />
          ) : qTerritorios.isError ? (
            <Erro erro={qTerritorios.error} onTentarNovamente={() => qTerritorios.refetch()} />
          ) : !malha.data || !qTerritorios.data ? (
            <Carregando altura={460} rotulo="Carregando o mapa…" />
          ) : (
            <>
              <MapaBrasil
                key={nivel === 'br' ? 'br' : `uf-${estado.uf}`}
                animarDeUf={animarDeUf}
                onPreCarregarTerritorio={preCarregarUf}
                malha={malha.data}
                nivel={nivel}
                valores={valores}
                escala={escala}
                unidades={unidadesVisiveis}
                valoresUnidades={valoresUnidades}
                ufSelecionada={estado.uf}
                unidadeSelecionada={estado.unidade}
                limiar={catalogo.limiarSupressao}
                rotuloIndicador={indicador.rotuloCurto}
                ficticio={catalogo.ficticio}
                atualizando={qTerritorios.isPlaceholderData || qUnidades.isFetching}
                onSelecionarTerritorio={(codigo) => atualizar({ uf: codigo, unidade: undefined })}
                onSelecionarUnidade={(u) =>
                  atualizar({ uf: u.codigoUf, unidade: u.id === estado.unidade ? undefined : u.id })
                }
              />
              <Legenda
                titulo={`${indicador.rotuloCurto} (${nivel === 'br' ? 'por UF' : 'por município'})`}
                classes={escala.classes}
                limiar={catalogo.limiarSupressao}
              />
              <TabelaMapa
                malha={malha.data}
                valores={valores}
                rotuloTerritorio={nivel === 'br' ? 'UF' : 'Município'}
                unidades={unidadesVisiveis}
                valoresUnidades={valoresUnidades}
                rotuloIndicador={indicador.rotuloCurto}
                limiar={catalogo.limiarSupressao}
              />
            </>
          )}
          <p className="mapa-layout__fonte">
            Fonte:{' '}
            {catalogo.ficticio ? 'dados fictícios de demonstração' : 'Caminhos do Trabalho Brasil'}{' '}
            · versão {catalogo.versaoDados} · atualizado em {formatarData(catalogo.atualizadoEm)}.
            Malhas territoriais: IBGE.
            {indicador.status === 'hipotese' && ' Definição do indicador em validação.'}
          </p>
        </section>

        <PainelRecorte
          key={
            recorte.tipo === 'br'
              ? 'br'
              : recorte.tipo === 'uf'
                ? recorte.codigo
                : recorte.unidade.id
          }
          recorte={recorte}
          catalogo={catalogo}
          filtrosBase={filtrosBase}
          onFechar={unidadeSel ? () => atualizar({ unidade: undefined }) : undefined}
        />
      </div>
    </div>
  );
}
