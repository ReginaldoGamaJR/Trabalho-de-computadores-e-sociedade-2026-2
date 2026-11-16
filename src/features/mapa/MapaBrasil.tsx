import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { geoConicEqualArea, geoMercator, geoPath, type GeoProjection } from 'd3-geo';
import { textoCelula } from '../../domain/formatacao';
import type { Celula, Unidade } from '../../domain/tipos';
import { textos } from '../../i18n/pt-BR';
import { criarEscalaRaio, type EscalaCoropletica } from './escala';
import type { ColecaoTerritorios } from './geo';
import { animarViewBox, prefereMovimentoReduzido, type ViewBox } from '../../lib/animacao';
import './mapa.css';

export interface PropsMapa {
  malha: ColecaoTerritorios;
  nivel: 'br' | 'uf';
  valores: Map<string, Celula>;
  escala: EscalaCoropletica;
  unidades: Unidade[];
  valoresUnidades: Map<string, Celula>;
  ufSelecionada?: string;
  unidadeSelecionada?: string;
  limiar: number;
  rotuloIndicador: string;
  ficticio: boolean;
  atualizando: boolean;
  /** No nível Brasil: ao montar, parte do zoom nesta UF e se afasta (volta animada). */
  animarDeUf?: string;
  onSelecionarTerritorio?: (codigo: string) => void;
  /** Chamado ao passar o mouse/foco numa UF, para pré-carregar seus dados. */
  onPreCarregarTerritorio?: (codigo: string) => void;
  onSelecionarUnidade: (u: Unidade) => void;
}

interface Dica {
  x: number;
  y: number;
  titulo: string;
  texto: string;
}

const LARGURA = 800;
const ALTURA_MAX = 760;
const MARGEM = 12;
const RAIO_MAX = 30;
const LARGURA_ROTULO = 130;
const DURACAO_ZOOM = 650;

function criarProjecao(nivel: 'br' | 'uf', malha: ColecaoTerritorios): GeoProjection {
  // Brasil: projeção cônica de áreas iguais (adequada a mapas coropléticos).
  // Estados: Mercator, suficiente para áreas pequenas.
  const p =
    nivel === 'br' ? geoConicEqualArea().parallels([-2, -22]).rotate([54, 0]) : geoMercator();
  return p.fitExtent(
    [
      [MARGEM, MARGEM],
      [LARGURA - MARGEM, ALTURA_MAX - MARGEM],
    ],
    malha,
  );
}

/** Ajusta um retângulo para a mesma proporção do viewBox base (zoom sem distorção). */
function enquadrar(
  [[x0, y0], [x1, y1]]: [[number, number], [number, number]],
  base: ViewBox,
): ViewBox {
  const folga = 0.12;
  let w = (x1 - x0) * (1 + 2 * folga);
  let h = (y1 - y0) * (1 + 2 * folga);
  const proporcao = base.w / base.h;
  if (w / h > proporcao) h = w / proporcao;
  else w = h * proporcao;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

const codigoDoEvento = (e: { target: EventTarget }) =>
  (e.target as Element).closest?.('[data-codigo]')?.getAttribute('data-codigo') ?? null;

export function MapaBrasil(props: PropsMapa) {
  const {
    malha,
    nivel,
    valores,
    escala,
    unidades,
    valoresUnidades,
    ufSelecionada,
    unidadeSelecionada,
    rotuloIndicador,
    ficticio,
    atualizando,
    animarDeUf,
    onSelecionarTerritorio,
    onPreCarregarTerritorio,
    onSelecionarUnidade,
  } = props;
  const idTitulo = useId();
  const contRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const cancelarAnimacao = useRef<(() => void) | null>(null);
  const [dica, setDica] = useState<Dica | null>(null);
  const [realce, setRealce] = useState<string | null>(null);
  const [realceViaTeclado, setRealceViaTeclado] = useState(false);
  const [zoomando, setZoomando] = useState(false);
  const t = textos.mapa;

  const { caminho, projecao, viewBoxBase } = useMemo(() => {
    const projecao = criarProjecao(nivel, malha);
    const caminho = geoPath(projecao);
    const [[x0, y0], [x1, y1]] = caminho.bounds(malha);
    // Folga extra para que marcadores de unidades no litoral/fronteira não sejam cortados.
    const folga = MARGEM + RAIO_MAX;
    const vb: ViewBox = {
      x: Math.floor(x0 - folga),
      y: Math.floor(y0 - folga),
      w: Math.ceil(x1 - x0 + 2 * folga),
      h: Math.ceil(y1 - y0 + 2 * folga),
    };
    return { caminho, projecao, viewBoxBase: vb };
  }, [malha, nivel]);

  const territorios = useMemo(
    () =>
      new Map(
        malha.features.map((f) => [
          f.properties.codigo,
          { f, d: caminho(f) ?? '', centro: caminho.centroid(f), limites: caminho.bounds(f) },
        ]),
      ),
    [malha, caminho],
  );

  // Enquadramento inicial da volta animada (aproximado na UF de onde se veio).
  const [vbEntrada] = useState<ViewBox | null>(() => {
    const origem = animarDeUf ? territorios.get(animarDeUf) : undefined;
    return origem && !prefereMovimentoReduzido() ? enquadrar(origem.limites, viewBoxBase) : null;
  });
  // viewBox animado; null = enquadramento base.
  const [vbAnimado, setVbAnimado] = useState<ViewBox | null>(vbEntrada);
  const viewBox = vbAnimado ?? viewBoxBase;

  useEffect(() => () => cancelarAnimacao.current?.(), []);

  // Volta animada: começa na UF de origem e se afasta até o Brasil inteiro.
  // (Com cleanup, para funcionar também com a dupla montagem do StrictMode.)
  useEffect(() => {
    if (!vbEntrada) return;
    setZoomando(true);
    const cancelar = animarViewBox(vbEntrada, viewBoxBase, DURACAO_ZOOM, setVbAnimado, () => {
      setVbAnimado(null);
      setZoomando(false);
    });
    return cancelar;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- apenas na montagem

  const raio = useMemo(
    () => criarEscalaRaio(valoresUnidades.values(), nivel === 'br' ? 26 : RAIO_MAX),
    [valoresUnidades, nivel],
  );

  const marcadores = useMemo(() => {
    const lista = unidades
      .map((u) => {
        const p = projecao(u.coord);
        const c = valoresUnidades.get(u.id);
        return p ? { u, x: p[0], y: p[1], r: raio(c), c } : null;
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => b.r - a.r); // maiores atrás, menores na frente
    // Rótulo à esquerda quando há outra unidade logo à direita ou falta espaço na borda.
    return lista.map((m) => {
      const vizinhoADireita = lista.some(
        (o) => o !== m && o.x > m.x && o.x - m.x < LARGURA_ROTULO && Math.abs(o.y - m.y) < 24,
      );
      const semEspaco = m.x + m.r + LARGURA_ROTULO > viewBoxBase.x + viewBoxBase.w;
      return { ...m, rotuloEsquerda: vizinhoADireita || semEspaco };
    });
  }, [unidades, projecao, valoresUnidades, raio, viewBoxBase]);

  const descricaoCelula = useCallback(
    (c: Celula | undefined) => (c ? textoCelula(c) : t.semRegistro.toLowerCase()),
    [t.semRegistro],
  );

  // Converte coordenadas do SVG para pixels do contêiner (para posicionar a dica no foco).
  function pontoParaTela(x: number, y: number) {
    const svg = svgRef.current?.getBoundingClientRect();
    const cont = contRef.current?.getBoundingClientRect();
    if (!svg || !cont) return { x: 0, y: 0 };
    const s = Math.min(svg.width / viewBox.w, svg.height / viewBox.h);
    const offX = (svg.width - viewBox.w * s) / 2 + svg.left - cont.left;
    const offY = (svg.height - viewBox.h * s) / 2 + svg.top - cont.top;
    return { x: offX + (x - viewBox.x) * s, y: offY + (y - viewBox.y) * s };
  }

  function mostrarNoPonteiro(e: MouseEvent, titulo: string, texto: string) {
    const cont = contRef.current?.getBoundingClientRect();
    if (!cont) return;
    setDica({ x: e.clientX - cont.left, y: e.clientY - cont.top, titulo, texto });
  }

  const interativo = nivel === 'br' && !!onSelecionarTerritorio;

  function selecionarTerritorio(codigo: string) {
    if (!onSelecionarTerritorio || zoomando) return;
    onPreCarregarTerritorio?.(codigo);
    const alvo = territorios.get(codigo);
    setDica(null);
    setRealce(null);
    if (!alvo || prefereMovimentoReduzido()) {
      onSelecionarTerritorio(codigo);
      return;
    }
    // Zoom animado até a UF; ao terminar, troca para o mapa de municípios.
    setZoomando(true);
    cancelarAnimacao.current = animarViewBox(
      viewBox,
      enquadrar(alvo.limites, viewBoxBase),
      DURACAO_ZOOM,
      setVbAnimado,
      () => onSelecionarTerritorio(codigo),
    );
  }

  // Eventos delegados no grupo de territórios (evita um handler por município).
  const eventosTerritorios = {
    onMouseMove: (e: MouseEvent) => {
      if (zoomando) return;
      const codigo = codigoDoEvento(e);
      const item = codigo ? territorios.get(codigo) : undefined;
      if (!codigo || !item) return;
      if (realce !== codigo) {
        setRealce(codigo);
        setRealceViaTeclado(false);
        if (interativo) onPreCarregarTerritorio?.(codigo);
      }
      mostrarNoPonteiro(e, item.f.properties.nome, descricaoCelula(valores.get(codigo)));
    },
    onMouseLeave: () => setRealce(null),
    onClick: (e: MouseEvent) => {
      const codigo = codigoDoEvento(e);
      if (interativo && codigo) selecionarTerritorio(codigo);
    },
    onKeyDown: (e: KeyboardEvent) => {
      const codigo = codigoDoEvento(e);
      if (interativo && codigo && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        selecionarTerritorio(codigo);
      }
    },
    onFocus: (e: FocusEvent) => {
      const codigo = codigoDoEvento(e);
      const item = codigo ? territorios.get(codigo) : undefined;
      if (!item) return;
      setRealce(codigo);
      setRealceViaTeclado(true);
      onPreCarregarTerritorio?.(codigo!);
      setDica({
        ...pontoParaTela(item.centro[0], item.centro[1]),
        titulo: item.f.properties.nome,
        texto: descricaoCelula(valores.get(codigo!)),
      });
    },
    onBlur: () => {
      setRealce(null);
      setDica(null);
    },
  };

  // Caminhos memorizados: o realce do mouse não re-renderiza centenas de municípios.
  const caminhos = useMemo(
    () =>
      [...territorios.values()].map(({ f, d }) => {
        const c = valores.get(f.properties.codigo);
        const base = {
          d,
          'data-codigo': f.properties.codigo,
          className: interativo
            ? 'mapa__territorio mapa__territorio--interativo'
            : 'mapa__territorio',
          style: { fill: escala.preencher(c) },
        };
        if (!interativo) return <path key={f.properties.codigo} {...base} />;
        return (
          <path
            key={f.properties.codigo}
            {...base}
            role="button"
            tabIndex={0}
            aria-label={`${f.properties.nome}: ${descricaoCelula(c)} — ${rotuloIndicador.toLowerCase()}. Ver municípios.`}
          />
        );
      }),
    [territorios, valores, escala, interativo, rotuloIndicador, descricaoCelula],
  );

  const itemRealce = realce ? territorios.get(realce) : undefined;
  const selecionado = nivel === 'br' && ufSelecionada ? territorios.get(ufSelecionada) : undefined;
  const classes = [
    'mapa',
    zoomando ? 'mapa--zoomando' : '',
    animarDeUf ? '' : 'mapa--entrada',
  ].join(' ');

  return (
    <div className={classes} ref={contRef} onMouseLeave={() => setDica(null)}>
      <svg
        ref={svgRef}
        className="mapa__svg"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        role="group"
        aria-labelledby={idTitulo}
        aria-busy={zoomando}
      >
        <title id={idTitulo}>
          {`Mapa: ${rotuloIndicador} por ${nivel === 'br' ? 'UF' : 'município'} de residência`}
        </title>
        <defs>
          <pattern
            id="padrao-suprimido"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" style={{ fill: 'var(--mapa-hachura-fundo)' }} />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              style={{ stroke: 'var(--mapa-hachura)' }}
              strokeWidth="2"
            />
          </pattern>
        </defs>

        {/* Eventos delegados: cada território dentro do grupo é um botão focável. */}
        <g
          className="mapa__territorios"
          aria-hidden={interativo ? undefined : true}
          {...eventosTerritorios}
        >
          {caminhos}
        </g>

        {selecionado && <path d={selecionado.d} className="mapa__selecao" aria-hidden="true" />}

        {itemRealce && !zoomando && (
          <path
            key={realce}
            d={itemRealce.d}
            className={`mapa__realce${realceViaTeclado ? ' mapa__realce--foco' : ''}`}
            style={{ fill: escala.preencher(valores.get(realce!)) }}
            aria-hidden="true"
          />
        )}

        <g className="mapa__unidades">
          {marcadores.map(({ u, x, y, r, c, rotuloEsquerda }, i) => {
            const ativo = u.id === unidadeSelecionada;
            const texto = descricaoCelula(c);
            const selecionar = () => onSelecionarUnidade(u);
            return (
              <g
                key={u.id}
                className={`mapa__unidade${ativo ? ' mapa__unidade--ativa' : ''}${c?.suprimido ? ' mapa__unidade--suprimida' : ''}`}
                style={{ '--atraso': `${150 + i * 35}ms` } as CSSProperties}
                role="button"
                tabIndex={0}
                aria-pressed={ativo}
                aria-label={`${u.nome} (${u.cidade}/${u.uf}): ${texto} — ${rotuloIndicador.toLowerCase()} na unidade.`}
                onClick={selecionar}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selecionar();
                  }
                }}
                onMouseMove={(e) => mostrarNoPonteiro(e, u.nome, texto)}
                onFocus={() => setDica({ ...pontoParaTela(x, y - r), titulo: u.nome, texto })}
                onBlur={() => setDica(null)}
              >
                {ativo && <circle className="mapa__pulso" cx={x} cy={y} r={r} />}
                <circle
                  className="mapa__circulo"
                  cx={x}
                  cy={y}
                  r={r}
                  style={{ r } as CSSProperties}
                />
                {(nivel === 'uf' || ativo) && (
                  <text
                    x={rotuloEsquerda ? x - r - 4 : x + r + 4}
                    y={y + 5}
                    textAnchor={rotuloEsquerda ? 'end' : 'start'}
                    className="mapa__rotulo"
                    aria-hidden="true"
                  >
                    {u.cidade}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {ficticio && (
          <text
            className="mapa__marca-dagua"
            x={viewBoxBase.x + viewBoxBase.w / 2}
            y={viewBoxBase.y + viewBoxBase.h / 2}
            transform={`rotate(-24 ${viewBoxBase.x + viewBoxBase.w / 2} ${viewBoxBase.y + viewBoxBase.h / 2})`}
            textAnchor="middle"
            aria-hidden="true"
          >
            {textos.mock.marcaDagua}
          </text>
        )}
      </svg>

      {dica && !zoomando && (
        <div className="mapa__dica" style={{ left: dica.x, top: dica.y }} aria-hidden="true">
          <strong>{dica.titulo}</strong>
          <span>
            {dica.texto} · {rotuloIndicador}
          </span>
        </div>
      )}

      {atualizando && !zoomando && (
        <div className="mapa__atualizando" role="status">
          Atualizando…
        </div>
      )}
    </div>
  );
}
