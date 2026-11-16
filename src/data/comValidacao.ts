// Decorador aplicado a TODO adaptador: valida as respostas com os schemas do contrato
// e passa os resultados pelo PrivacyGuard. Assim nenhum adaptador precisa lembrar
// de validar, e a interface só recebe dados que cumprem o contrato.

import type { ZodType } from 'zod';
import { LIMIAR_PADRAO } from '../domain/supressao';
import type { Consulta } from '../domain/tipos';
import { DataError, type DataProvider, type OpcoesChamada } from './DataProvider';
import { verificarPrivacidade } from './privacyGuard';
import { capacidadesSchema, catalogoSchema, resultadoSchema, unidadesSchema } from './schemas';

function validar<T>(schema: ZodType<T>, dado: unknown, contexto: string): T {
  const r = schema.safeParse(dado);
  if (!r.success) {
    throw new DataError(
      'resposta_invalida',
      `${contexto}: ${r.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join('.')} ${i.message}`)
        .join('; ')}`,
    );
  }
  return r.data;
}

export function comValidacao(
  provider: DataProvider,
  limiarMinimo: number = LIMIAR_PADRAO,
): DataProvider {
  return {
    fonte: provider.fonte,
    async capacidades(opts?: OpcoesChamada) {
      return validar(capacidadesSchema, await provider.capacidades(opts), 'capacidades');
    },
    async catalogo(opts?: OpcoesChamada) {
      return validar(catalogoSchema, await provider.catalogo(opts), 'catalogo');
    },
    async unidades(opts?: OpcoesChamada) {
      return validar(unidadesSchema, await provider.unidades(opts), 'unidades');
    },
    async consultar(consulta: Consulta, opts?: OpcoesChamada) {
      if ((consulta.agruparPor?.length ?? 0) > 2) {
        throw new DataError('consulta_nao_suportada', 'Máximo de 2 dimensões por consulta.');
      }
      const r = validar(resultadoSchema, await provider.consultar(consulta, opts), 'consulta');
      return verificarPrivacidade(r, limiarMinimo);
    },
  };
}
