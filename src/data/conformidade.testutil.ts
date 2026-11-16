// Suíte de conformidade: qualquer adaptador deve passar nestes testes
// (sempre embrulhado por comValidacao, como em produção).
import { describe, expect, it } from 'vitest';
import type { DataProvider } from './DataProvider';

export function testarConformidade(nome: string, criar: () => DataProvider) {
  describe(`conformidade: ${nome}`, () => {
    it('entrega catálogo, capacidades e unidades válidos', async () => {
      const p = criar();
      const cat = await p.catalogo();
      expect(cat.indicadores.length).toBeGreaterThan(0);
      expect(cat.limiarSupressao).toBeGreaterThanOrEqual(5);
      const cap = await p.capacidades();
      expect(cap.maxDimensoes).toBeLessThanOrEqual(2);
      const us = await p.unidades();
      expect(us.length).toBeGreaterThan(0);
    });

    it('responde total e agrupamento por UF sem valores sensíveis expostos', async () => {
      const p = criar();
      const total = await p.consultar({ indicador: 'atendimentos', filtros: {} });
      expect(total.linhas).toEqual([]);
      const r = await p.consultar({ indicador: 'atendimentos', filtros: {}, agruparPor: ['uf'] });
      for (const l of r.linhas) {
        expect(l.chaves.uf).toMatch(/^\d{2}$/);
        if (!l.suprimido) {
          expect(l.valor === 0 || (l.valor ?? 0) >= r.meta.limiarSupressao).toBe(true);
        }
      }
    });

    it('recusa mais de 2 dimensões', async () => {
      const p = criar();
      await expect(
        p.consultar({ indicador: 'atendimentos', filtros: {}, agruparPor: ['uf', 'sexo', 'ano'] }),
      ).rejects.toMatchObject({ tipo: 'consulta_nao_suportada' });
    });
  });
}
