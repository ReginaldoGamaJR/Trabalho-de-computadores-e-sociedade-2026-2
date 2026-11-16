import type { ConfigDados, FonteDados } from '../data/criarProvider';

const FONTES: FonteDados[] = ['mock', 'rest', 'static'];

function lerFonte(v: string | undefined): FonteDados {
  const f = (v ?? 'mock') as FonteDados;
  if (!FONTES.includes(f)) throw new Error(`VITE_DATA_SOURCE inválido: ${v}`);
  return f;
}

export const configDados: ConfigDados = {
  fonte: lerFonte(import.meta.env.VITE_DATA_SOURCE),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || undefined,
  staticBaseUrl: import.meta.env.VITE_STATIC_BASE_URL || undefined,
};

export const versaoApp = import.meta.env.VITE_APP_VERSION ?? '0.1.0';
