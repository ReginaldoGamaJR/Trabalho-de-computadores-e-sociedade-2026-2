// Alternativa textual ao mapa (obrigatória para leitores de tela e para quem
// prefere ler números). Contém os mesmos dados exibidos visualmente.

import { textoCelula } from '../../domain/formatacao';
import type { Celula, Unidade } from '../../domain/tipos';
import { textos } from '../../i18n/pt-BR';
import type { ColecaoTerritorios } from './geo';

interface Props {
  malha: ColecaoTerritorios;
  valores: Map<string, Celula>;
  rotuloTerritorio: string;
  unidades: Unidade[];
  valoresUnidades: Map<string, Celula>;
  rotuloIndicador: string;
  limiar: number;
}

const ordenar = (a: Celula | undefined, b: Celula | undefined) =>
  (b?.valor ?? (b?.suprimido ? 0.5 : 0)) - (a?.valor ?? (a?.suprimido ? 0.5 : 0));

export function TabelaMapa(props: Props) {
  const { malha, valores, rotuloTerritorio, unidades, valoresUnidades, rotuloIndicador } = props;
  const t = textos.mapa;
  const linhas = malha.features
    .map((f) => ({ nome: f.properties.nome, c: valores.get(f.properties.codigo) }))
    .filter((l) => l.c)
    .sort((a, b) => ordenar(a.c, b.c));
  const linhasUnidades = unidades
    .map((u) => ({ u, c: valoresUnidades.get(u.id) }))
    .sort((a, b) => ordenar(a.c, b.c));

  return (
    <details className="tabela-mapa">
      <summary>{t.verTabela}</summary>
      <div className="tabela-mapa__grade">
        <div>
          <table>
            <caption>
              {rotuloIndicador} por {rotuloTerritorio.toLowerCase()} de residência
            </caption>
            <thead>
              <tr>
                <th scope="col">{rotuloTerritorio}</th>
                <th scope="col" className="num">
                  {rotuloIndicador}
                </th>
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={2}>{textos.estados.vazio}</td>
                </tr>
              )}
              {linhas.map((l) => (
                <tr key={l.nome}>
                  <th scope="row">{l.nome}</th>
                  <td className="num">{textoCelula(l.c!)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="tabela-mapa__nota">
            Territórios não listados não têm registro neste recorte.
          </p>
        </div>
        <div>
          <table>
            <caption>{rotuloIndicador} por unidade de atendimento</caption>
            <thead>
              <tr>
                <th scope="col">{t.unidade}</th>
                <th scope="col" className="num">
                  {rotuloIndicador}
                </th>
              </tr>
            </thead>
            <tbody>
              {linhasUnidades.map(({ u, c }) => (
                <tr key={u.id}>
                  <th scope="row">
                    {u.nome} <span className="tabela-mapa__uf">({u.uf})</span>
                  </th>
                  <td className="num">{c ? textoCelula(c) : t.semRegistro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
