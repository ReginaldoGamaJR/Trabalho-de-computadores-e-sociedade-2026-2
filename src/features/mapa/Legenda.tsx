import { textos } from '../../i18n/pt-BR';
import { COR_VAZIO, type ClasseLegenda } from './escala';

interface Props {
  titulo: string;
  classes: ClasseLegenda[];
  limiar: number;
}

export function Legenda({ titulo, classes, limiar }: Props) {
  const t = textos.mapa;
  return (
    <div className="legenda">
      <p className="legenda__titulo">{titulo}</p>
      <ul className="legenda__itens">
        {classes.map((c) => (
          <li key={c.rotulo}>
            <span className="legenda__amostra" style={{ background: c.cor }} aria-hidden="true" />
            {c.rotulo}
          </li>
        ))}
        <li>
          <span className="legenda__amostra" style={{ background: COR_VAZIO }} aria-hidden="true" />
          {t.semRegistro}
        </li>
        <li>
          <span className="legenda__amostra legenda__amostra--hachura" aria-hidden="true" />
          {t.suprimido(limiar)}
        </li>
        <li>
          <span className="legenda__marcador" aria-hidden="true" />
          {t.marcadorUnidade}
        </li>
      </ul>
    </div>
  );
}
