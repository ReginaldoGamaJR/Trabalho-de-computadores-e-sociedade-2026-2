// Fábrica: escolhe o adaptador pela configuração. É o único arquivo que conhece
// todos os adaptadores. Trocar a fonte de dados = trocar VITE_DATA_SOURCE.

import { comValidacao } from './comValidacao';
import type { DataProvider } from './DataProvider';
import { MockAdapter } from './adapters/mock/MockAdapter';
import { RestApiAdapter } from './adapters/rest/RestApiAdapter';
import { StaticFileAdapter } from './adapters/static/StaticFileAdapter';

export type FonteDados = 'mock' | 'rest' | 'static';

export interface ConfigDados {
  fonte: FonteDados;
  apiBaseUrl?: string;
  staticBaseUrl?: string;
}

export function criarProvider(cfg: ConfigDados): DataProvider {
  switch (cfg.fonte) {
    case 'mock':
      return comValidacao(new MockAdapter({ latencia: 250 }));
    case 'rest':
      if (!cfg.apiBaseUrl) throw new Error('VITE_API_BASE_URL é obrigatório para fonte "rest".');
      return comValidacao(new RestApiAdapter({ baseUrl: cfg.apiBaseUrl }));
    case 'static':
      return comValidacao(new StaticFileAdapter({ baseUrl: cfg.staticBaseUrl ?? '/data' }));
  }
}
