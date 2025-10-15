// BLOQUE 1: Imports
// - z de 'zod'

// BLOQUE 2: Schema getQuestionsSchema
// - subjectCode: string requerido
// - topicNumber: number opcional (puede ser null para "final módulo")
// - type: enum opcional ("tema" | "final" | "failed")
// - limit: number opcional (default 20, máximo 100)

// BLOQUE 3: Schema countQuestionsSchema
// - subjectCode: string requerido
// - topicNumber: number opcional
// - type: enum opcional

// BLOQUE 4: Tipos TypeScript inferidos
// - export type GetQuestionsInput
// - export type CountQuestionsInput

// ============================================
// SCHEMAS ZOD PARA VALIDACIÓN DE QUESTIONS
// ============================================

import { z } from 'zod';

// BLOQUE 2: Schema para GET /questions

/**
 * Schema de validación para obtener preguntas filtradas
 * 
 * Query params esperados:
 * - subjectCode: string (obligatorio) - Código de asignatura (ej: "DWEC")
 * - topicNumber: number (opcional) - Número de tema (ej: 1, 2, 3...)
 * - type: "tema" | "final" | "failed" (opcional) - Tipo de test
 * - limit: number (opcional) - Cantidad de preguntas (default: 20, max: 100)
 * 
 * @remarks
 * - Si type="tema" → requiere topicNumber
 * - Si type="final" → ignora topicNumber (todas las preguntas del módulo)
 * - Si type="failed" → filtra solo preguntas falladas del usuario
 * - limit se valida en el controller (no se puede pedir más de las disponibles)
 */
export const getQuestionsSchema = z.object({
  subjectCode: z
    .string()
    .min(1, 'El código de asignatura es requerido')
    .toUpperCase(), // Convertir a mayúsculas (DWEC, dwec → DWEC)
  
  topicNumber: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : undefined) // Query params son string, convertir a number
    .refine((val) => val === undefined || val > 0, {
      message: 'El número de tema debe ser mayor a 0'
    }),
  
  type: z
    .enum(['tema', 'final', 'failed'])
    .optional(),
  
  limit: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 20) // Default 20 si no se especifica
    .refine((val) => val > 0 && val <= 100, {
      message: 'El límite debe estar entre 1 y 100'
    })
});


// BLOQUE 3: Schema para GET /questions/count

/**
 * Schema de validación para contar preguntas disponibles
 * 
 * Query params esperados:
 * - subjectCode: string (obligatorio)
 * - topicNumber: number (opcional)
 * - type: "tema" | "final" | "failed" (opcional)
 * 
 * @remarks
 * No necesita limit porque solo devuelve un número
 */
export const countQuestionsSchema = z.object({
  subjectCode: z
    .string()
    .min(1, 'El código de asignatura es requerido')
    .toUpperCase(),
  
  topicNumber: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : undefined)
    .refine((val) => val === undefined || val > 0, {
      message: 'El número de tema debe ser mayor a 0'
    }),
  
  type: z
    .enum(['tema', 'final', 'failed'])
    .optional()
});


// BLOQUE 4: Tipos TypeScript inferidos automáticamente

/**
 * Tipos inferidos por Zod para usar en controllers
 */
export type GetQuestionsInput = z.infer<typeof getQuestionsSchema>;
export type CountQuestionsInput = z.infer<typeof countQuestionsSchema>;