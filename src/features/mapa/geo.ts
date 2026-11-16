// Carregamento das malhas territoriais (arquivos estáticos gerados por scripts/build-geo.mjs).

import { useQuery, type QueryClient } from '@tanstack/react-query';
import { geoArea } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';

export interface PropsTerritorio {
  codigo: string;
  nome: string;
  sigla?: string;
}

export type FeatureTerritorio = Feature<Geometry, PropsTerritorio>;
export type ColecaoTerritorios = FeatureCollection<Geometry, PropsTerritorio>;

/**
 * O d3-geo trabalha em coordenadas esféricas e espera anéis externos em sentido
 * horário. Se um polígono vier no sentido oposto, ele é interpretado como "o globo
 * inteiro menos o polígono". Aqui invertemos os anéis desses casos.
 */
function corrigirOrientacao(f: FeatureTerritorio): FeatureTerritorio {
  if (geoArea(f) <= 2 * Math.PI) return f;
  const g = f.geometry;
  const inverter = (aneis: Position[][]) => aneis.map((a) => [...a].reverse());
  if (g.type === 'Polygon')
    return { ...f, geometry: { ...g, coordinates: inverter(g.coordinates) } };
  if (g.type === 'MultiPolygon')
    return { ...f, geometry: { ...g, coordinates: g.coordinates.map(inverter) } };
  return f;
}

async function carregarMalha(
  url: string,
  objeto: string,
  signal: AbortSignal,
): Promise<ColecaoTerritorios> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Falha ao carregar malha ${url} (HTTP ${res.status})`);
  const topo = (await res.json()) as Topology;
  const obj = topo.objects[objeto] as GeometryCollection<PropsTerritorio>;
  const fc = feature(topo, obj) as ColecaoTerritorios;
  return { ...fc, features: fc.features.map(corrigirOrientacao) };
}

export function useMalhaUfs() {
  return useQuery({
    queryKey: ['malha', 'br-uf'],
    queryFn: ({ signal }) =>
      carregarMalha(`${import.meta.env.BASE_URL}geo/br-uf.json`, 'uf', signal),
    staleTime: Infinity,
  });
}

const opcoesMalhaUf = (codigoUf: string | undefined) => ({
  queryKey: ['malha', 'uf', codigoUf],
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    carregarMalha(`${import.meta.env.BASE_URL}geo/uf/${codigoUf}.json`, 'municipio', signal),
  staleTime: Infinity,
});

export function useMalhaMunicipios(codigoUf: string | undefined) {
  return useQuery({ ...opcoesMalhaUf(codigoUf), enabled: !!codigoUf });
}

/** Pré-carrega a malha de municípios de uma UF (ex.: ao passar o mouse sobre ela). */
export function preCarregarMalhaUf(qc: QueryClient, codigoUf: string) {
  return qc.prefetchQuery(opcoesMalhaUf(codigoUf));
}
