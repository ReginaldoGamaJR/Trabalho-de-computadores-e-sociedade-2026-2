import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Link, Route, Routes } from 'react-router';
import { configDados } from './app/config';
import { DataProviderProvider } from './app/dados';
import { Layout } from './app/Layout';
import { criarProvider } from './data/criarProvider';
import { ehDataError } from './data/DataProvider';
import { ComoFuncionaPage } from './pages/ComoFuncionaPage';
import { GlossarioPage } from './pages/GlossarioPage';
import { MapaPage } from './pages/MapaPage';
import { SobrePage } from './pages/SobrePage';
import './styles/global.css';

const provider = criarProvider(configDados);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Erros de contrato/privacidade não se resolvem tentando de novo.
      retry: (falhas, erro) =>
        !(
          ehDataError(erro) &&
          [
            'resposta_invalida',
            'violacao_privacidade',
            'nao_encontrado',
            'consulta_nao_suportada',
          ].includes(erro.tipo)
        ) && falhas < 2,
    },
  },
});

function NaoEncontrado() {
  return (
    <div className="container pagina">
      <h1>Página não encontrada</h1>
      <p>
        <Link to="/">Voltar ao mapa</Link>
      </p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DataProviderProvider provider={provider}>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<MapaPage />} />
              <Route path="como-funciona" element={<ComoFuncionaPage />} />
              <Route path="sobre" element={<SobrePage />} />
              <Route path="glossario" element={<GlossarioPage />} />
              <Route path="*" element={<NaoEncontrado />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DataProviderProvider>
    </QueryClientProvider>
  </StrictMode>,
);
