import { Link } from 'react-router';
import { useUnidades } from '../app/dados';
import { Carregando, Erro } from '../ui/componentes';
import './paginas.css';

function ListaUnidades() {
  const q = useUnidades();
  if (q.isPending) return <Carregando altura={120} />;
  if (q.isError) return <Erro erro={q.error} onTentarNovamente={() => q.refetch()} />;
  const porUf = new Map<string, string[]>();
  for (const u of q.data) porUf.set(u.uf, [...(porUf.get(u.uf) ?? []), u.cidade]);
  const ufs = [...porUf.keys()].sort();
  return (
    <ul className="lista-unidades">
      {ufs.map((uf) => (
        <li key={uf}>
          <strong>{uf}</strong>: {porUf.get(uf)!.sort().join(', ')}
        </li>
      ))}
    </ul>
  );
}

export function ComoFuncionaPage() {
  return (
    <div className="container pagina">
      <article className="conteudo">
        <h1>Como funciona o Caminhos do Trabalho</h1>
        <p className="pagina__lead">
          O Caminhos do Trabalho Brasil é uma rede que apoia, gratuitamente, pessoas com suspeita de
          adoecimento relacionado ao trabalho e que precisam de orientação sobre seus direitos
          trabalhistas e previdenciários. Os atendimentos podem ser presenciais ou on-line.
        </p>

        <h2 id="quando-procurar">Quando procurar</h2>
        <ul>
          <li>Você sofreu um acidente no trabalho ou no trajeto entre casa e trabalho.</li>
          <li>Você acredita que uma doença, física ou mental, tem relação com o seu trabalho.</li>
          <li>
            A empresa não emitiu a{' '}
            <Link to="/glossario#cat">Comunicação de Acidente de Trabalho (CAT)</Link>.
          </li>
          <li>
            Você recebe auxílio por incapacidade comum (<Link to="/glossario#b31">B31</Link>), mas
            acredita que o afastamento tem relação com o trabalho e deveria ser acidentário (
            <Link to="/glossario#b91">B91</Link>).
          </li>
          <li>
            Você precisa de apoio para pedir um benefício ao INSS ou espera uma resposta há mais de
            três meses.
          </li>
          <li>
            Você tem dúvidas sobre seus direitos, inclusive se trabalha sem carteira assinada, como
            autônomo ou no serviço público.
          </li>
        </ul>

        <h2>O que o projeto pode oferecer</h2>
        <ul>
          <li>Orientação jurídica sobre direitos trabalhistas e previdenciários.</li>
          <li>
            Avaliação de saúde com foco no <Link to="/glossario#nexo">nexo</Link> entre o agravo e o
            trabalho.
          </li>
          <li>Emissão da CAT, quando constatada a relação entre o adoecimento e o trabalho.</li>
          <li>Relatório médico ou de saúde.</li>
          <li>
            <Link to="/glossario#dossie">Dossiê</Link> individualizado, quando há uma demanda
            concreta (por exemplo, perícia marcada ou processo judicial).
          </li>
          <li>Apoio nos pedidos de benefícios ao INSS e acompanhamento do caso.</li>
          <li>Acolhimento e acompanhamento psicológico, em algumas unidades.</li>
        </ul>

        <h2>Como é o atendimento</h2>
        <ol className="passos">
          <li>
            <strong>Triagem.</strong> Primeiro contato, geralmente on-line, para entender sua
            situação e verificar se ela se enquadra no projeto.
          </li>
          <li>
            <strong>Agendamento.</strong> Marcação do atendimento, de preferência presencial.
          </li>
          <li>
            <strong>Orientação sociojurídica.</strong> Conversa sobre sua situação de trabalho, seus
            direitos e o que você precisa.
          </li>
          <li>
            <strong>Levantamento de riscos ocupacionais.</strong> Análise das condições do seu
            ambiente de trabalho.
          </li>
          <li>
            <strong>Avaliação médica ou de saúde.</strong> Investigação do adoecimento e da sua
            relação com o trabalho.
          </li>
          <li>
            <strong>Avaliação da equipe.</strong> Profissionais de diferentes áreas discutem o caso
            e definem os encaminhamentos.
          </li>
          <li>
            <strong>Devolutiva.</strong> Você recebe os documentos e orientações pertinentes, como
            CAT, relatórios e dossiê, quando for o caso.
          </li>
          <li>
            <strong>Acompanhamento.</strong> A equipe mantém contato para acompanhar o andamento do
            seu caso.
          </li>
        </ol>
        <p>
          A ordem das etapas pode variar conforme cada caso. Os documentos e a CAT são emitidos
          sempre com o seu conhecimento e consentimento.
        </p>

        <h2>Onde há unidades</h2>
        <ListaUnidades />
        <p className="aviso-info">
          Os canais de contato de cada unidade serão publicados nesta página.
        </p>

        <p>
          <small>
            Esta página tem caráter informativo e não substitui o atendimento pelas equipes do
            projeto.
          </small>
        </p>
      </article>
    </div>
  );
}
