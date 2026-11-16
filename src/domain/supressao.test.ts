import { suprimirConjunto } from './supressao';

describe('suprimirConjunto', () => {
  it('suprime células de 1 a 4 e mantém zero', () => {
    const { celulas } = suprimirConjunto([10, 3, 0, 2, 8], 23, 5);
    expect(celulas.map((c) => c.valor)).toEqual([10, null, 0, null, 8]);
  });

  it('aplica supressão complementar quando só uma célula seria oculta', () => {
    const { celulas, total } = suprimirConjunto([20, 9, 3], 32, 5);
    expect(total.valor).toBe(32);
    expect(celulas.filter((c) => c.suprimido)).toHaveLength(2);
    expect(celulas[1]).toEqual({ valor: null, suprimido: true }); // menor positiva restante
  });

  it('suprime tudo quando o total é sensível', () => {
    const { celulas, total } = suprimirConjunto([2, 1], 3, 5);
    expect(total.suprimido).toBe(true);
    expect(celulas.every((c) => c.suprimido)).toBe(true);
  });
});
