// Baixa as malhas territoriais do IBGE (API de Malhas v3 + Localidades v1)
// e gera arquivos estáticos em public/geo/. Rodar com: npm run geo
//
// Saídas:
//   public/geo/br-uf.json            TopoJSON das 27 UFs (props: codigo, nome, sigla)
//   public/geo/uf/{codigoUF}.json    TopoJSON dos municípios da UF (props: codigo, nome)
//   public/geo/fonte.json            Metadados de origem (URL, data de geração)
//   src/data/adapters/mock/territorio.gerado.json
//       Municípios das unidades + vizinhos, usados SOMENTE pelo gerador de mock.
//
// As malhas não são consultadas em tempo de execução: o site serve estes arquivos.

import { mkdir, writeFile } from 'node:fs/promises';
import { geoCentroid, geoDistance } from 'd3-geo';
import { feature } from 'topojson-client';

const MALHAS = 'https://servicodados.ibge.gov.br/api/v3/malhas';
const LOCALIDADES = 'https://servicodados.ibge.gov.br/api/v1/localidades';
const QUALIDADE = 'minima';
const RAIO_VIZINHOS_KM = 120;
const RAIO_TERRA_KM = 6371;

// Cidades com unidade, conforme o Documento Orientativo (2025).
const CIDADES_UNIDADES = [
  ['Salvador', 'BA'],
  ['Brasília', 'DF'],
  ['Belo Horizonte', 'MG'],
  ['Juiz de Fora', 'MG'],
  ['Uberlândia', 'MG'],
  ['João Pessoa', 'PB'],
  ['Rio de Janeiro', 'RJ'],
  ['Volta Redonda', 'RJ'],
  ['Niterói', 'RJ'],
  ['Porto Alegre', 'RS'],
  ['Florianópolis', 'SC'],
  ['São Paulo', 'SP'],
  ['São Carlos', 'SP'],
  ['Campinas', 'SP'],
  ['Palmas', 'TO'],
  ['São Luís', 'MA'],
];

async function getJson(url) {
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    if (tentativa === 3) throw new Error(`HTTP ${res.status} em ${url}`);
    await new Promise((r) => setTimeout(r, 1000 * tentativa));
  }
}

const arred = (n) => Math.round(n * 1e4) / 1e4;
const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

async function main() {
  await mkdir('public/geo/uf', { recursive: true });

  const estados = await getJson(`${LOCALIDADES}/estados`);
  const ufPorCodigo = new Map(estados.map((e) => [String(e.id), e]));

  // --- UFs
  const br = await getJson(
    `${MALHAS}/paises/BR?formato=application/json&intrarregiao=UF&qualidade=${QUALIDADE}`,
  );
  const objUf = Object.keys(br.objects)[0];
  for (const g of br.objects[objUf].geometries) {
    const e = ufPorCodigo.get(g.properties.codarea);
    g.properties = { codigo: g.properties.codarea, nome: e.nome, sigla: e.sigla };
  }
  br.objects = { uf: br.objects[objUf] };
  await writeFile('public/geo/br-uf.json', JSON.stringify(br));

  // --- Municípios por UF
  const municipiosPorUf = new Map(); // sigla -> [{codigo, nome, centro}]
  for (const e of estados) {
    const [topo, munis] = await Promise.all([
      getJson(
        `${MALHAS}/estados/${e.id}?formato=application/json&intrarregiao=municipio&qualidade=${QUALIDADE}`,
      ),
      getJson(`${LOCALIDADES}/estados/${e.id}/municipios`),
    ]);
    const nomes = new Map(munis.map((m) => [String(m.id), m.nome]));
    const obj = Object.keys(topo.objects)[0];
    for (const g of topo.objects[obj].geometries) {
      g.properties = { codigo: g.properties.codarea, nome: nomes.get(g.properties.codarea) ?? '' };
    }
    topo.objects = { municipio: topo.objects[obj] };
    await writeFile(`public/geo/uf/${e.id}.json`, JSON.stringify(topo));

    const fc = feature(topo, topo.objects.municipio);
    municipiosPorUf.set(
      e.sigla,
      fc.features.map((f) => ({
        codigo: f.properties.codigo,
        nome: f.properties.nome,
        centro: geoCentroid(f).map(arred),
      })),
    );
    process.stdout.write(`${e.sigla} `);
  }
  process.stdout.write('\n');

  // --- Municípios das unidades + vizinhos (insumo do mock)
  const unidades = CIDADES_UNIDADES.map(([cidade, uf]) => {
    const lista = municipiosPorUf.get(uf);
    const m = lista.find((x) => x.nome === cidade);
    if (!m) throw new Error(`Município não encontrado: ${cidade}/${uf}`);
    const vizinhos = lista
      .filter(
        (x) =>
          x.codigo !== m.codigo &&
          geoDistance(x.centro, m.centro) * RAIO_TERRA_KM <= RAIO_VIZINHOS_KM,
      )
      .map((x) => x.codigo);
    return {
      id: `${uf.toLowerCase()}-${slug(cidade)}`,
      cidade,
      uf,
      codigoUf: m.codigo.slice(0, 2),
      municipioIbge: m.codigo,
      coord: m.centro,
      vizinhos,
    };
  });
  await writeFile(
    'src/data/adapters/mock/territorio.gerado.json',
    JSON.stringify({ unidades }, null, 1),
  );

  await writeFile(
    'public/geo/fonte.json',
    JSON.stringify(
      {
        fonte: 'IBGE — API de Malhas Territoriais v3 e API de Localidades v1',
        url: 'https://servicodados.ibge.gov.br/api/docs/malhas?versao=3',
        qualidade: QUALIDADE,
        geradoEm: new Date().toISOString().slice(0, 10),
      },
      null,
      2,
    ),
  );
  console.log('Malhas geradas em public/geo/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
