// Regras de supressão de células pequenas (controle de divulgação estatística).
//
// IMPORTANTE: a supressão é responsabilidade de quem produz os agregados (backend).
// Este módulo é usado (1) pelo MockAdapter, que simula o backend, e (2) pelo
// PrivacyGuard, que confere no navegador se a regra foi respeitada.

import type { Celula } from './tipos';

export const LIMIAR_PADRAO = 5;

/** Uma contagem entre 1 e limiar-1 é sensível; zero não identifica ninguém. */
export function ehSensivel(valor: number, limiar: number): boolean {
  return valor > 0 && valor < limiar;
}

export function celula(valor: number, limiar: number): Celula {
  return ehSensivel(valor, limiar) ? { valor: null, suprimido: true } : { valor, suprimido: false };
}

/**
 * Aplica supressão primária (1..limiar-1) e complementar: se, num conjunto que
 * soma ao total publicado, restar exatamente UMA célula suprimida, ela poderia
 * ser deduzida por subtração. Nesse caso suprime-se também a menor célula
 * positiva restante.
 */
export function suprimirConjunto(
  valores: number[],
  total: number,
  limiar: number,
): { celulas: Celula[]; total: Celula } {
  const celulas = valores.map((v) => celula(v, limiar));
  const totalCel = celula(total, limiar);

  if (!totalCel.suprimido) {
    const suprimidas = celulas.filter((c) => c.suprimido).length;
    if (suprimidas === 1) {
      let idx = -1;
      valores.forEach((v, i) => {
        const c = celulas[i]!;
        if (!c.suprimido && v > 0 && (idx === -1 || v < valores[idx]!)) idx = i;
      });
      if (idx >= 0) celulas[idx] = { valor: null, suprimido: true };
    }
  } else {
    // Total sensível: nenhuma célula do conjunto pode ser divulgada.
    for (let i = 0; i < celulas.length; i++) {
      if (valores[i]! > 0) celulas[i] = { valor: null, suprimido: true };
    }
  }
  return { celulas, total: totalCel };
}
