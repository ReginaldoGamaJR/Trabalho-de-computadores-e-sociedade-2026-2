import { useEffect } from 'react';
import { useLocation } from 'react-router';
import './paginas.css';

// Definições baseadas no Documento Orientativo do projeto (2025).
const TERMOS: { id: string; termo: string; definicao: string }[] = [
  {
    id: 'acidente-tipico',
    termo: 'Acidente típico',
    definicao: 'Acidente que acontece durante a realização do trabalho.',
  },
  {
    id: 'acidente-trajeto',
    termo: 'Acidente de trajeto',
    definicao: 'Acidente que acontece no percurso entre a casa e o local de trabalho.',
  },
  {
    id: 'b31',
    termo: 'B31 — Benefício por incapacidade temporária comum',
    definicao:
      'Afastamento do trabalho enquanto durar a incapacidade por doença ou acidente sem relação reconhecida com o trabalho. Em regra, exige 12 contribuições (carência).',
  },
  {
    id: 'b91',
    termo: 'B91 — Benefício por incapacidade temporária acidentária',
    definicao:
      'Afastamento por acidente ou doença relacionados ao trabalho. Não exige carência, mantém o depósito do FGTS durante o afastamento e garante um ano de estabilidade após o fim do benefício. A transformação de B31 em B91 é uma das demandas mais comuns no projeto.',
  },
  {
    id: 'b32',
    termo: 'B32 — Benefício por incapacidade permanente comum',
    definicao: 'Antiga “aposentadoria por invalidez”, sem relação reconhecida com o trabalho.',
  },
  {
    id: 'b92',
    termo: 'B92 — Benefício por incapacidade permanente acidentária',
    definicao: 'Versão acidentária da incapacidade permanente. Não exige carência.',
  },
  {
    id: 'b94',
    termo: 'Auxílio-acidente',
    definicao:
      'Pago quando um acidente de trabalho deixa sequela que reduz a capacidade para o trabalho.',
  },
  {
    id: 'cat',
    termo: 'CAT — Comunicação de Acidente de Trabalho',
    definicao:
      'Documento eletrônico que registra no INSS um acidente de trabalho ou de trajeto, ou uma doença ocupacional. A empresa é obrigada a emiti-la; se não o fizer, podem emitir a própria pessoa, seus dependentes, sindicatos, médicos e autoridades públicas. O projeto emite a CAT quando constata a relação entre o adoecimento e o trabalho.',
  },
  {
    id: 'cbo',
    termo: 'CBO — Classificação Brasileira de Ocupações',
    definicao: 'Código que identifica a ocupação da pessoa trabalhadora.',
  },
  {
    id: 'cid',
    termo: 'CID — Classificação Internacional de Doenças',
    definicao: 'Código que identifica a doença ou o agravo à saúde.',
  },
  {
    id: 'cnae',
    termo: 'CNAE — Classificação Nacional de Atividades Econômicas',
    definicao: 'Código que identifica a atividade econômica da empresa empregadora.',
  },
  {
    id: 'doenca-ocupacional',
    termo: 'Doença ocupacional',
    definicao: 'Doença causada ou agravada pelas condições de trabalho.',
  },
  {
    id: 'dossie',
    termo: 'Dossiê circunstanciado',
    definicao:
      'Documento que reúne as evidências da relação entre o acidente ou a doença e o trabalho, para uso em pedidos ao INSS ou na Justiça. É produzido quando há uma demanda concreta, como perícia marcada ou processo judicial.',
  },
  {
    id: 'nexo',
    termo: 'Nexo causal',
    definicao:
      'Relação entre o adoecimento ou acidente e o trabalho. Sua investigação, jurídica e de saúde, é o centro do trabalho do projeto.',
  },
  {
    id: 'ntep',
    termo: 'NTEP — Nexo Técnico Epidemiológico Previdenciário',
    definicao:
      'Mecanismo do INSS que relaciona atividades econômicas (CNAE) a doenças (CID) com incidência elevada, permitindo reconhecer o caráter acidentário de um benefício.',
  },
  {
    id: 'resistencia-injustificada',
    termo: 'Resistência injustificada',
    definicao:
      'Situação em que o INSS demora mais de três meses para responder a um pedido de benefício, o que, segundo a jurisprudência, permite buscar o benefício na Justiça.',
  },
  {
    id: 'sinan',
    termo: 'SINAN',
    definicao:
      'Sistema de Informação de Agravos de Notificação, do SUS, onde também podem ser notificados acidentes e doenças relacionados ao trabalho.',
  },
  {
    id: 'sofrimento-psiquico',
    termo: 'Sofrimento psíquico relacionado ao trabalho',
    definicao:
      'Adoecimento mental associado às condições e à organização do trabalho, como metas abusivas e assédio.',
  },
];

export function GlossarioPage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  const ordenados = [...TERMOS].sort((a, b) => a.termo.localeCompare(b.termo, 'pt-BR'));
  return (
    <div className="container pagina">
      <article className="conteudo">
        <h1>Glossário</h1>
        <p className="pagina__lead">Termos usados nos atendimentos e nos dados do observatório.</p>
        <dl className="glossario">
          {ordenados.map((t) => (
            <div key={t.id}>
              <dt id={t.id}>{t.termo}</dt>
              <dd>{t.definicao}</dd>
            </div>
          ))}
        </dl>
      </article>
    </div>
  );
}
