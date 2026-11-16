// Slots de identidade visual. NÃO inclua logos oficiais sem autorização:
// adicione os arquivos autorizados em public/marca/ e referencie-os aqui.

export interface Marca {
  /** Caminho em /public, ex.: "/marca/fundacentro.svg". */
  src: string;
  alt: string;
  href?: string;
}

export const branding = {
  /** Nome provisório: a plataforma ainda não tem nome definido. */
  nome: 'Observatório Caminhos do Trabalho',
  subtitulo: 'Dados da rede Caminhos do Trabalho Brasil',
  /** Logo principal (cabeçalho). null = usa marca tipográfica. */
  logoPrincipal: null as Marca | null,
  /** Logos de realizadores/parceiros (rodapé e página Sobre). */
  parceiros: [] as Marca[],
};
