import { NavLink, Outlet } from 'react-router';
import { formatarData } from '../domain/formatacao';
import { textos } from '../i18n/pt-BR';
import { AvisoMock } from '../ui/componentes';
import { branding } from './branding';
import { configDados, versaoApp } from './config';
import { useCatalogo } from './dados';
import './layout.css';

export function Layout() {
  const catalogo = useCatalogo();
  const t = textos.nav;
  // O aviso aparece se a fonte declarar dados fictícios OU se a configuração for mock
  // (garante o aviso mesmo antes de o catálogo carregar).
  const ficticio = configDados.fonte === 'mock' || catalogo.data?.ficticio === true;

  return (
    <>
      <a href="#conteudo" className="pular-link">
        {t.pularConteudo}
      </a>
      {ficticio && <AvisoMock />}
      <header className="topo">
        <div className="container topo__conteudo">
          <NavLink to="/" className="topo__marca">
            {branding.logoPrincipal ? (
              <img src={branding.logoPrincipal.src} alt={branding.logoPrincipal.alt} height={40} />
            ) : (
              <span className="topo__simbolo" aria-hidden="true" />
            )}
            <span>
              <span className="topo__nome">{branding.nome}</span>
              <span className="topo__sub">{branding.subtitulo}</span>
            </span>
          </NavLink>
          <nav aria-label={t.menu} className="topo__nav">
            <NavLink to="/" end>
              {t.dados}
            </NavLink>
            <NavLink to="/como-funciona">{t.comoFunciona}</NavLink>
            <NavLink to="/sobre">{t.sobre}</NavLink>
            <NavLink to="/glossario">{t.glossario}</NavLink>
          </nav>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="rodape">
        <div className="container rodape__conteudo">
          <div>
            <p className="rodape__nome">{branding.nome}</p>
            <p>
              Plataforma de dados agregados e anônimos. Nenhuma informação individual é publicada.
            </p>
          </div>
          {branding.parceiros.length > 0 && (
            <ul className="rodape__parceiros" aria-label="Realização e parceiros">
              {branding.parceiros.map((p) => (
                <li key={p.src}>
                  <img src={p.src} alt={p.alt} height={36} />
                </li>
              ))}
            </ul>
          )}
          <p className="rodape__meta">
            Fonte de dados:{' '}
            {catalogo.data?.ficticio ? 'fictícia (demonstração)' : configDados.fonte}
            {catalogo.data &&
              ` · versão ${catalogo.data.versaoDados} · atualizada em ${formatarData(catalogo.data.atualizadoEm)}`}
            {` · aplicação v${versaoApp}`}
          </p>
        </div>
      </footer>
    </>
  );
}
