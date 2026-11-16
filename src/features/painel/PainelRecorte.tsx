// Painel lateral: números-chave e distribuições do recorte selecionado
// (Brasil, UF de residência ou unidade de atendimento).

import { useConsulta } from '../../app/dados';
import type { Catalogo, Filtros, Unidade } from '../../domain/tipos';
import { CartaoKpi, Carregando, Distribuicao, Erro } from '../../ui/componentes';
import './painel.css';

export type Recorte =
  | { tipo: 'br' }
  | { tipo: 'uf'; codigo: string; nome: string }
  | { tipo: 'unidade'; unidade: Unidade };

interface Props {
  recorte: Recorte;
  catalogo: Catalogo;
  filtrosBase: Filtros;
  onFechar?: () => void;
}

const DISTRIBUICOES = ['tipoOcorrencia', 'vinculo', 'sexo', 'faixaEtaria'] as const;

function filtrosDoRecorte(r: Recorte, base: Filtros): Filtros {
  if (r.tipo === 'uf') return { ...base, uf: r.codigo };
  if (r.tipo === 'unidade') return { ...base, unidade: r.unidade.id };
  return base;
}

function KpiIndicador(props: {
  indicador: string;
  rotulo: string;
  filtros: Filtros;
  limiar: number;
  ficticio: boolean;
}) {
  const q = useConsulta({ indicador: props.indicador, filtros: props.filtros });
  if (q.isError) return <Erro erro={q.error} onTentarNovamente={() => q.refetch()} />;
  return (
    <CartaoKpi
      rotulo={props.rotulo}
      celula={q.data?.total}
      limiar={props.limiar}
      ficticio={props.ficticio}
    />
  );
}

function DistribuicaoDimensao(props: { dimensao: string; catalogo: Catalogo; filtros: Filtros }) {
  const { dimensao, catalogo, filtros } = props;
  const def = catalogo.dimensoes.find((d) => d.id === dimensao);
  const q = useConsulta({ indicador: 'atendimentos', filtros, agruparPor: [dimensao] });
  if (!def) return null;
  if (q.isPending) return <Carregando altura={140} />;
  if (q.isError) return <Erro erro={q.error} onTentarNovamente={() => q.refetch()} />;
  const rotulos = new Map(def.valores?.map((v) => [v.id, v.rotulo]));
  // Mantém a ordem definida no catálogo (ex.: faixas etárias em sequência).
  const ordem = def.valores?.map((v) => v.id) ?? [];
  const itens = q.data.linhas
    .map((l) => ({
      id: l.chaves[dimensao]!,
      rotulo: rotulos.get(l.chaves[dimensao]!) ?? l.chaves[dimensao]!,
      celula: l,
    }))
    .sort((a, b) => ordem.indexOf(a.id) - ordem.indexOf(b.id));
  return (
    <Distribuicao
      titulo={def.rotulo}
      itens={itens}
      total={q.data.total}
      limiar={q.data.meta.limiarSupressao}
    />
  );
}

export function PainelRecorte({ recorte, catalogo, filtrosBase, onFechar }: Props) {
  const filtros = filtrosDoRecorte(recorte, filtrosBase);
  const { limiarSupressao: limiar, ficticio } = catalogo;

  const titulo =
    recorte.tipo === 'br' ? 'Brasil' : recorte.tipo === 'uf' ? recorte.nome : recorte.unidade.nome;
  const subtitulo =
    recorte.tipo === 'br'
      ? 'Todas as unidades da rede'
      : recorte.tipo === 'uf'
        ? 'Pessoas atendidas que residem neste estado'
        : `${recorte.unidade.cidade}/${recorte.unidade.uf} · atendimentos realizados nesta unidade`;

  return (
    <aside className="painel cartao" aria-labelledby="painel-titulo">
      <header className="painel__cabecalho">
        <div>
          <p className="painel__tipo">
            {recorte.tipo === 'br'
              ? 'Visão nacional'
              : recorte.tipo === 'uf'
                ? 'Estado'
                : 'Unidade'}
          </p>
          <h2 id="painel-titulo" className="painel__titulo">
            {titulo}
          </h2>
          <p className="painel__subtitulo">{subtitulo}</p>
          {recorte.tipo === 'unidade' && recorte.unidade.instituicao && (
            <p className="painel__subtitulo">{recorte.unidade.instituicao}</p>
          )}
        </div>
        {onFechar && (
          <button
            type="button"
            className="botao botao--secundario painel__fechar"
            onClick={onFechar}
          >
            Fechar<span className="visualmente-oculto"> painel da unidade</span>
          </button>
        )}
      </header>

      <dl className="kpis">
        {catalogo.indicadores.map((i) => (
          <KpiIndicador
            key={i.id}
            indicador={i.id}
            rotulo={i.rotuloCurto}
            filtros={filtros}
            limiar={limiar}
            ficticio={ficticio}
          />
        ))}
      </dl>

      <h3 className="painel__secao">Perfil das pessoas atendidas</h3>
      {DISTRIBUICOES.map((d) => (
        <DistribuicaoDimensao key={d} dimensao={d} catalogo={catalogo} filtros={filtros} />
      ))}

      <p className="painel__nota">
        “Oculto”: valor entre 1 e {limiar - 1}, ou valor ocultado para impedir que outro seja
        deduzido por subtração. Categorias ausentes não tiveram registro no recorte.
      </p>
    </aside>
  );
}
