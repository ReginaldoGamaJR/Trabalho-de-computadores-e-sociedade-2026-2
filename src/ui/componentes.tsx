import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ehDataError } from '../data/DataProvider';
import { formatarNumero, formatarPercentual, textoCelula } from '../domain/formatacao';
import { animarNumero } from '../lib/animacao';
import type { Celula } from '../domain/tipos';
import { textos } from '../i18n/pt-BR';
import './ui.css';

export function AvisoMock() {
  return (
    <div className="aviso-mock" role="note" aria-label={textos.mock.titulo}>
      <div className="container aviso-mock__conteudo">
        <span className="aviso-mock__selo" aria-hidden="true">
          !
        </span>
        <p>
          <strong>{textos.mock.titulo}.</strong> {textos.mock.texto}
        </p>
      </div>
    </div>
  );
}

export function Carregando({
  rotulo = textos.estados.carregando,
  altura = 120,
}: {
  rotulo?: string;
  altura?: number;
}) {
  return (
    <div className="carregando" style={{ minHeight: altura }} role="status">
      <span className="visualmente-oculto">{rotulo}</span>
    </div>
  );
}

export function Erro({
  erro,
  onTentarNovamente,
}: {
  erro: unknown;
  onTentarNovamente?: () => void;
}) {
  const mensagem = ehDataError(erro) ? erro.mensagemUsuario : 'Ocorreu um erro inesperado.';
  if (import.meta.env.DEV) console.error(erro);
  return (
    <div className="erro" role="alert">
      <p className="erro__titulo">{textos.estados.erroTitulo}</p>
      <p>{mensagem}</p>
      {onTentarNovamente && (
        <button type="button" className="botao botao--secundario" onClick={onTentarNovamente}>
          {textos.estados.tentarNovamente}
        </button>
      )}
    </div>
  );
}

/**
 * Número que "conta" até o valor novo. O valor final fica num texto oculto para
 * leitores de tela, que não precisam ouvir os valores intermediários.
 */
function NumeroAnimado({ valor }: { valor: number }) {
  const [exibido, setExibido] = useState(0);
  const atual = useRef(0);
  useEffect(
    () =>
      animarNumero(atual.current, valor, 700, (n) => {
        atual.current = n;
        setExibido(n);
      }),
    [valor],
  );
  return (
    <>
      <span aria-hidden="true">{formatarNumero(exibido)}</span>
      <span className="visualmente-oculto">{formatarNumero(valor)}</span>
    </>
  );
}

export function CartaoKpi({
  rotulo,
  celula,
  ficticio,
}: {
  rotulo: string;
  celula?: Celula;
  limiar: number;
  ficticio: boolean;
}) {
  return (
    <div className="kpi">
      <dt className="kpi__rotulo">{rotulo}</dt>
      <dd className="kpi__valor">
        {!celula ? (
          <span className="kpi__esqueleto" aria-label={textos.estados.carregando} />
        ) : celula.suprimido || celula.valor === null ? (
          <span className="kpi__suprimido">{textoCelula(celula)}</span>
        ) : (
          <NumeroAnimado valor={celula.valor} />
        )}
        {ficticio && celula && <span className="selo-ficticio">fictício</span>}
      </dd>
    </div>
  );
}

export interface ItemDistribuicao {
  id: string;
  rotulo: string;
  celula: Celula;
}

/** Barras horizontais em HTML: legíveis por leitor de tela e sem depender de cor. */
export function Distribuicao({
  titulo,
  itens,
  total,
}: {
  titulo: string;
  itens: ItemDistribuicao[];
  total: Celula;
  limiar: number;
}) {
  const max = Math.max(1, ...itens.map((i) => i.celula.valor ?? 0));
  const totalNum = total.valor ?? 0;
  return (
    <section className="dist" aria-label={titulo}>
      <h3 className="dist__titulo">{titulo}</h3>
      {itens.length === 0 ? (
        <p className="dist__vazio">{textos.estados.vazio}</p>
      ) : (
        <ul className="dist__lista">
          {itens.map((i) => {
            const v = i.celula.valor;
            const pct = v !== null && totalNum > 0 ? ` (${formatarPercentual(v / totalNum)})` : '';
            return (
              <li key={i.id} className="dist__item">
                <span className="dist__rotulo">{i.rotulo}</span>
                <span className="dist__valor">
                  {textoCelula(i.celula)}
                  {pct}
                </span>
                <span className="dist__trilha" aria-hidden="true">
                  <span
                    className={`dist__barra${i.celula.suprimido ? ' dist__barra--suprimida' : ''}`}
                    style={{ width: i.celula.suprimido ? '100%' : `${((v ?? 0) / max) * 100}%` }}
                  />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function Secao({
  titulo,
  children,
  id,
}: {
  titulo: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="secao" aria-labelledby={id}>
      <h2 id={id}>{titulo}</h2>
      {children}
    </section>
  );
}
