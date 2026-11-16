// Defesa em profundidade: confere, no navegador, se um resultado agregado respeita
// a supressão de células pequenas. NÃO substitui a supressão no backend (quando o
// dado chega aqui, ele já trafegou); serve para impedir a EXIBIÇÃO de uma resposta
// que viole a regra e para tornar o erro visível durante o desenvolvimento.

import { ehSensivel } from '../domain/supressao';
import type { ResultadoAgregado } from '../domain/tipos';
import { DataError } from './DataProvider';

export function verificarPrivacidade(
  r: ResultadoAgregado,
  limiarMinimo: number,
): ResultadoAgregado {
  // A fonte não pode declarar um limiar menor do que o exigido pela plataforma.
  const limiar = Math.max(r.meta.limiarSupressao, limiarMinimo);
  if (r.meta.limiarSupressao < limiarMinimo) {
    throw new DataError(
      'violacao_privacidade',
      `Limiar da fonte (${r.meta.limiarSupressao}) menor que o mínimo (${limiarMinimo}).`,
    );
  }
  const celulas = [r.total, ...r.linhas];
  for (const c of celulas) {
    if (!c.suprimido && c.valor !== null && ehSensivel(c.valor, limiar)) {
      throw new DataError(
        'violacao_privacidade',
        `Valor ${c.valor} abaixo do limiar ${limiar} sem supressão (indicador ${r.indicador}).`,
      );
    }
  }
  return r;
}
