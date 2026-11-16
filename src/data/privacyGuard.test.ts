import { verificarPrivacidade } from './privacyGuard';
import type { ResultadoAgregado } from '../domain/tipos';

const base = (valor: number | null, suprimido: boolean, limiar = 5): ResultadoAgregado => ({
  indicador: 'x',
  agruparPor: ['uf'],
  linhas: [{ chaves: { uf: '33' }, valor, suprimido }],
  total: { valor: 100, suprimido: false },
  meta: { versaoDados: 'v', geradoEm: '2025-01-01', limiarSupressao: limiar, ficticio: false },
});

describe('verificarPrivacidade', () => {
  it('aceita valores suprimidos, zero e acima do limiar', () => {
    expect(() => verificarPrivacidade(base(null, true), 5)).not.toThrow();
    expect(() => verificarPrivacidade(base(0, false), 5)).not.toThrow();
    expect(() => verificarPrivacidade(base(5, false), 5)).not.toThrow();
  });

  it('rejeita valor sensível não suprimido', () => {
    expect(() => verificarPrivacidade(base(3, false), 5)).toThrow(/limiar/);
  });

  it('rejeita fonte com limiar menor que o mínimo', () => {
    expect(() => verificarPrivacidade(base(null, true, 3), 5)).toThrow();
  });
});
