/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // Trava de segurança: um build de produção com dados fictícios só é permitido
  // quando isso for declarado explicitamente (VITE_ALLOW_MOCK=true).
  if (command === 'build' && mode === 'production') {
    const fonte = env.VITE_DATA_SOURCE ?? 'mock';
    if (fonte === 'mock' && env.VITE_ALLOW_MOCK !== 'true') {
      throw new Error(
        'Build de produção com VITE_DATA_SOURCE=mock bloqueado. ' +
          'Defina uma fonte real ou VITE_ALLOW_MOCK=true para um deploy de demonstração.',
      );
    }
  }

  return {
    // GitHub Pages publica em /<repo>/; BASE_PATH é definido no workflow de deploy.
    base: process.env.BASE_PATH ?? '/',
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
    },
  };
});
