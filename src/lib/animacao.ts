// Utilitários de animação do mapa. Todas as animações respeitam a preferência do
// sistema "reduzir movimento" (prefers-reduced-motion).

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function prefereMovimentoReduzido(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export const suavizar = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Interpola o viewBox de `de` para `para`. A interpolação é feita em escala
 * logarítmica na largura/altura, para que o zoom pareça ter velocidade constante.
 * Retorna uma função que cancela a animação.
 */
export function animarViewBox(
  de: ViewBox,
  para: ViewBox,
  duracao: number,
  aoAtualizar: (vb: ViewBox) => void,
  aoTerminar?: () => void,
): () => void {
  if (prefereMovimentoReduzido() || duracao <= 0) {
    aoAtualizar(para);
    aoTerminar?.();
    return () => {};
  }
  const inicio = performance.now();
  const lw0 = Math.log(de.w);
  const lw1 = Math.log(para.w);
  const cx0 = de.x + de.w / 2;
  const cy0 = de.y + de.h / 2;
  const cx1 = para.x + para.w / 2;
  const cy1 = para.y + para.h / 2;
  const proporcao = para.h / para.w;
  let quadro = 0;

  const passo = (agora: number) => {
    const t = Math.min(1, (agora - inicio) / duracao);
    const k = suavizar(t);
    const w = Math.exp(lw0 + (lw1 - lw0) * k);
    const h = w * proporcao;
    const cx = cx0 + (cx1 - cx0) * k;
    const cy = cy0 + (cy1 - cy0) * k;
    aoAtualizar({ x: cx - w / 2, y: cy - h / 2, w, h });
    if (t < 1) quadro = requestAnimationFrame(passo);
    else aoTerminar?.();
  };
  quadro = requestAnimationFrame(passo);
  return () => cancelAnimationFrame(quadro);
}

/** Anima um número de `de` até `para`, chamando `aoAtualizar` a cada quadro. */
export function animarNumero(
  de: number,
  para: number,
  duracao: number,
  aoAtualizar: (n: number) => void,
): () => void {
  if (prefereMovimentoReduzido() || de === para) {
    aoAtualizar(para);
    return () => {};
  }
  const inicio = performance.now();
  let quadro = 0;
  const passo = (agora: number) => {
    const t = Math.min(1, (agora - inicio) / duracao);
    const k = 1 - (1 - t) ** 3;
    aoAtualizar(Math.round(de + (para - de) * k));
    if (t < 1) quadro = requestAnimationFrame(passo);
  };
  quadro = requestAnimationFrame(passo);
  return () => cancelAnimationFrame(quadro);
}
