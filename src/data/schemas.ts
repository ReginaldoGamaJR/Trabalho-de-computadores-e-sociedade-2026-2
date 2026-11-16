// Schemas de validação da fronteira de dados (contrato público).
// `.strict()` rejeita campos não previstos: impede que uma fonte envie, por engano,
// dados além dos agregados definidos no contrato.

import { z } from 'zod';
import type { Capacidades, Catalogo, ResultadoAgregado, Unidade } from '../domain/tipos';

const codigoUf = z.string().regex(/^\d{2}$/);
const codigoMunicipio = z.string().regex(/^\d{7}$/);
const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}/);

export const unidadeSchema: z.ZodType<Unidade> = z
  .object({
    id: z.string().min(1),
    nome: z.string().min(1),
    cidade: z.string().min(1),
    uf: z.string().length(2),
    codigoUf,
    municipioIbge: codigoMunicipio,
    coord: z.tuple([z.number().min(-75).max(-28), z.number().min(-35).max(6)]),
    instituicao: z.string().nullable(),
    servicos: z.array(z.string()),
  })
  .strict();

export const unidadesSchema = z.array(unidadeSchema);

const valorDimensao = z.object({ id: z.string(), rotulo: z.string() }).strict();

export const catalogoSchema: z.ZodType<Catalogo> = z
  .object({
    versaoDados: z.string().min(1),
    atualizadoEm: dataIso,
    limiarSupressao: z.number().int().min(1),
    ficticio: z.boolean(),
    anos: z.array(z.number().int()),
    indicadores: z.array(
      z
        .object({
          id: z.string().min(1),
          titulo: z.string(),
          rotuloCurto: z.string(),
          descricao: z.string(),
          medida: z.enum(['contagem', 'percentual', 'dias']),
          origem: z.string(),
          dimensoes: z.array(z.string()),
          status: z.enum(['hipotese', 'validado']),
        })
        .strict(),
    ),
    dimensoes: z.array(
      z
        .object({
          id: z.string().min(1),
          rotulo: z.string(),
          descricao: z.string(),
          valores: z.array(valorDimensao).optional(),
        })
        .strict(),
    ),
    notas: z.array(z.string()),
  })
  .strict();

export const capacidadesSchema: z.ZodType<Capacidades> = z
  .object({
    dimensoes: z.array(z.string()),
    maxDimensoes: z.number().int().min(0).max(2),
    consultaEmLote: z.boolean(),
  })
  .strict();

const celula = z
  .object({ valor: z.number().nonnegative().nullable(), suprimido: z.boolean() })
  .strict()
  .refine((c) => (c.suprimido ? c.valor === null : c.valor !== null), {
    message: 'Célula suprimida deve ter valor null; célula não suprimida deve ter valor.',
  });

export const resultadoSchema: z.ZodType<ResultadoAgregado> = z
  .object({
    indicador: z.string(),
    agruparPor: z.array(z.string()).max(2),
    linhas: z.array(
      z
        .object({
          chaves: z.record(z.string(), z.string()),
          valor: z.number().nonnegative().nullable(),
          suprimido: z.boolean(),
        })
        .strict()
        .refine((c) => (c.suprimido ? c.valor === null : c.valor !== null)),
    ),
    total: celula,
    meta: z
      .object({
        versaoDados: z.string(),
        geradoEm: z.string(),
        limiarSupressao: z.number().int().min(1),
        ficticio: z.boolean(),
      })
      .strict(),
  })
  .strict();
