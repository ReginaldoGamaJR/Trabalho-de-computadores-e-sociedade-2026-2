import { useCatalogo } from '../app/dados';
import { branding } from '../app/branding';
import { formatarData } from '../domain/formatacao';
import { Carregando, Erro } from '../ui/componentes';
import './paginas.css';

function ListaIndicadores() {
  const q = useCatalogo();
  if (q.isPending) return <Carregando altura={160} />;
  if (q.isError) return <Erro erro={q.error} onTentarNovamente={() => q.refetch()} />;
  return (
    <>
      <dl className="glossario">
        {q.data.indicadores.map((i) => (
          <div key={i.id}>
            <dt>
              {i.titulo}
              {i.status === 'hipotese' && <span className="tag-hipotese">em validação</span>}
            </dt>
            <dd>
              {i.descricao} <br />
              <small>Origem: {i.origem}.</small>
            </dd>
          </div>
        ))}
      </dl>
      <p>
        <small>
          Versão dos dados: {q.data.versaoDados}, atualizada em {formatarData(q.data.atualizadoEm)}.
        </small>
      </p>
      {q.data.notas.map((n) => (
        <p key={n} className="aviso-info">
          {n}
        </p>
      ))}
    </>
  );
}

export function SobrePage() {
  const limiar = useCatalogo().data?.limiarSupressao ?? 5;
  return (
    <div className="container pagina">
      <article className="conteudo">
        <h1>Sobre e metodologia</h1>

        <h2>A rede Caminhos do Trabalho Brasil</h2>
        <p>
          O Caminhos do Trabalho Brasil é uma rede de extensão, pesquisa e formação que apoia
          trabalhadoras e trabalhadores com agravos e doenças relacionados ao trabalho. É coordenado
          pela Fundacentro, em cooperação com a Secretaria de Inspeção do Trabalho (SIT) e o
          Ministério Público do Trabalho (MPT), em parceria com universidades públicas e com a
          Empresa Brasileira de Serviços Hospitalares (EBSERH).
        </p>
        <p>
          Este observatório reúne, de forma agregada, informações sobre os atendimentos realizados
          pela rede, para prestação de contas, acompanhamento do que acontece em cada território e
          apoio à pesquisa.
        </p>

        <h2>De onde vêm os dados</h2>
        <p>
          Cada atendimento é registrado em fichas padronizadas nacionalmente (triagem, agendamento,
          atendimento sociojurídico, levantamento de riscos ocupacionais e elementos
          clínico-médicos). O observatório publica apenas <strong>contagens agregadas</strong>{' '}
          calculadas a partir dessas fichas.
        </p>

        <h2>Privacidade</h2>
        <ul>
          <li>Nenhuma informação individual é publicada ou transmitida para esta página.</li>
          <li>
            Contagens entre 1 e {limiar - 1} são ocultadas e aparecem como “oculto”. No mapa, esses
            territórios aparecem com textura listrada.
          </li>
          <li>
            Quando uma única contagem oculta poderia ser descoberta por subtração do total, outra
            contagem do mesmo grupo também é ocultada (supressão complementar). Por isso, um valor
            “oculto” nem sempre é pequeno.
          </li>
          <li>
            Códigos de atividade econômica, ocupação e doença são exibidos apenas em grupos amplos.
          </li>
          <li>
            Pessoas que não consentiram com o uso dos seus dados em pesquisa não são incluídas nas
            estatísticas públicas.
          </li>
        </ul>

        <h2>Território</h2>
        <p>
          Os mapas de cores mostram o <strong>local de residência</strong> informado pelas pessoas
          atendidas. Os círculos mostram as <strong>unidades</strong> onde os atendimentos foram
          realizados. As malhas territoriais são do Instituto Brasileiro de Geografia e Estatística
          (IBGE).
        </p>

        <h2>Indicadores</h2>
        <p>As definições abaixo estão em validação com a coordenação do projeto e podem mudar.</p>
        <ListaIndicadores />

        <h2>Limitações</h2>
        <ul>
          <li>Os números podem ser revisados quando houver correção nos registros.</li>
          <li>As unidades começaram a atender em datas diferentes.</li>
          <li>
            Os atendimentos refletem quem procurou o projeto, não o total de agravos no território.
          </li>
        </ul>

        <h2>Realização e parceiros</h2>
        {branding.parceiros.length === 0 ? (
          <p className="aviso-info">
            As marcas das instituições participantes serão incluídas mediante autorização.
          </p>
        ) : (
          <ul className="rodape__parceiros">
            {branding.parceiros.map((p) => (
              <li key={p.src}>
                <img src={p.src} alt={p.alt} height={48} />
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}
