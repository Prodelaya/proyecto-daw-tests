// ============================================
// SCHEMAS ZOD PARA VALIDACIÓN DE ATTEMPTS
// ============================================

import { z } from 'zod';

// BLOQUE 2: Schema para un objeto Answer individual

/**
 * Schema de validación para una respuesta individual del usuario
 * 
 * Estructura:
 * {
 *   questionId: 1,
 *   userAnswer: "El cliente realiza una solicitud y el servidor responde"
 * }
 * 
 * Validaciones:
 * - questionId: número entero positivo (ID de pregunta en BD)
 * - userAnswer: string no vacío (respuesta seleccionada por el usuario)
 */
const answerSchema = z.object({
  questionId: z
    .number()
    .int('El ID de pregunta debe ser un número entero')
    .positive('El ID de pregunta debe ser positivo'),
  
  userAnswer: z
    .string()
    .min(1, 'La respuesta no puede estar vacía')
});

// BLOQUE 3: Schema principal para submitAttempt

/**
 * Schema de validación para envío de intento completo
 * 
 * Body esperado:
 * {
 *   subjectCode: "DWEC",
 *   topicNumber: 1,              // Opcional (null para test final)
 *   answers: [
 *     { questionId: 1, userAnswer: "..." },
 *     { questionId: 2, userAnswer: "..." }
 *   ]
 * }
 * 
 * Validaciones:
 * - subjectCode: string requerido, convertido a mayúsculas
 * - topicNumber: número opcional (puede ser null para tests finales)
 * - answers: array de answerSchema, mínimo 1 elemento
 */
export const submitAttemptSchema = z.object({
  subjectCode: z
    .string()
    .min(1, 'El código de asignatura es requerido')
    .toUpperCase(), // Normalizar: "dwec" → "DWEC"
  
  topicNumber: z
    .number()
    .int('El número de tema debe ser un número entero')
    .positive('El número de tema debe ser positivo')
    .optional()
    .nullable(), // Puede ser null para tests finales de módulo
  
  answers: z
    .array(answerSchema) // Usa el schema definido arriba
    .min(1, 'Debes responder al menos 1 pregunta')
    .max(100, 'No puedes enviar más de 100 respuestas') // Límite de seguridad
});

// BLOQUE 4: Tipos TypeScript inferidos automáticamente

/**
 * Tipos inferidos por Zod para usar en controllers
 * 
 * Equivalente a escribir manualmente:
 * 
 * type SubmitAttemptInput = {
 *   subjectCode: string;
 *   topicNumber?: number | null;
 *   answers: Answer[];
 * }
 * 
 * type Answer = {
 *   questionId: number;
 *   userAnswer: string;
 * }
 * 
 * Ventaja: Si cambias el schema, los tipos se actualizan automáticamente
 */
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
export type Answer = z.infer<typeof answerSchema>;