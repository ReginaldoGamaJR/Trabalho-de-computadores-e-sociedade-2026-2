import { comValidacao } from '../comValidacao';
import { testarConformidade } from '../conformidade.testutil';
import { MockAdapter } from './mock/MockAdapter';
import { RestApiAdapter } from './rest/RestApiAdapter';
import { StaticFileAdapter, chaveConsulta } from './static/StaticFileAdapter';
import type { Consulta } from '../../domain/tipos';

const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } });

// "Servidor" falso que cumpre o contrato REST usando o MockAdapter por trás.
function fetchRestFalso(): typeof fetch {
  const mock = new MockAdapter();
  return (async (url: string, init?: RequestInit) => {
    const caminho = new URL(url).pathname;
    if (caminho === '/v1/catalogo') return json(await mock.catalogo());
    if (caminho === '/v1/capacidades') return json(await mock.capacidades());
    if (caminho === '/v1/unidades') return json(await mock.unidades());
    if (caminho === '/v1/consultas') {
      const c = JSON.parse(String(init?.body)) as Consulta;
      if ((c.agruparPor?.length ?? 0) > 2) return json({ erro: 'max 2' }, 422);
      return json(await mock.consultar(c));
    }
    return json({}, 404);
  }) as typeof fetch;
}

// Arquivos estáticos falsos: apenas algumas consultas "pré-calculadas".
function fetchStaticFalso(): typeof fetch {
  const mock = new MockAdapter();
  const pre: Consulta[] = [
    { indicador: 'atendimentos', filtros: {} },
    { indicador: 'atendimentos', filtros: {}, agruparPor: ['uf'] },
  ];
  return (async (url: string) => {
    const arq = url.replace('http://x/data/', '');
    if (arq === 'catalogo.json') return json(await mock.catalogo());
    if (arq === 'capacidades.json') return json(await mock.capacidades());
    if (arq === 'unidades.json') return json(await mock.unidades());
    for (const c of pre) {
      if (arq === `consultas/${chaveConsulta(c)}.json`) return json(await mock.consultar(c));
    }
    return new Response('', { status: 404 });
  }) as typeof fetch;
}

testarConformidade('MockAdapter', () => comValidacao(new MockAdapter()));
testarConformidade('RestApiAdapter', () =>
  comValidacao(new RestApiAdapter({ baseUrl: 'http://api.test', fetch: fetchRestFalso() })),
);

describe('StaticFileAdapter', () => {
  const p = () =>
    comValidacao(new StaticFileAdapter({ baseUrl: 'http://x/data', fetch: fetchStaticFalso() }));

  it('lê consultas pré-calculadas', async () => {
    const r = await p().consultar({ indicador: 'atendimentos', filtros: {}, agruparPor: ['uf'] });
    expect(r.linhas.length).toBeGreaterThan(0);
  });

  it('sinaliza recorte não pré-calculado', async () => {
    await expect(
      p().consultar({ indicador: 'cat_emitidas', filtros: { ano: 2024 } }),
    ).rejects.toMatchObject({ tipo: 'consulta_nao_suportada' });
  });
});

describe('MockAdapter', () => {
  const q: Consulta = { indicador: 'atendimentos', filtros: {}, agruparPor: ['unidade'] };

  it('é determinístico', async () => {
    expect(await new MockAdapter().consultar(q)).toEqual(await new MockAdapter().consultar(q));
  });

  it('declara os dados como fictícios', async () => {
    expect((await new MockAdapter().catalogo()).ficticio).toBe(true);
  });

  it('quebras somam o total quando nada é suprimido', async () => {
    const m = new MockAdapter();
    const t = await m.consultar({ indicador: 'atendimentos', filtros: {} });
    const s = await m.consultar({ indicador: 'atendimentos', filtros: {}, agruparPor: ['sexo'] });
    const soma = s.linhas.reduce((acc, l) => acc + (l.valor ?? 0), 0);
    if (s.linhas.every((l) => !l.suprimido)) expect(soma).toBe(t.total.valor);
  });

  it('produz células suprimidas no nível municipal', async () => {
    const r = await new MockAdapter().consultar({
      indicador: 'atendimentos',
      filtros: { uf: '33' },
      agruparPor: ['municipio'],
    });
    expect(r.linhas.some((l) => l.suprimido)).toBe(true);
  });
});

describe('comValidacao', () => {
  it('rejeita resposta fora do contrato (campo extra)', async () => {
    const quebrado = new MockAdapter();
    quebrado.unidades = async () => [{ id: 'x', cpf: '123' }] as never;
    await expect(comValidacao(quebrado).unidades()).rejects.toMatchObject({
      tipo: 'resposta_invalida',
    });
  });
});
