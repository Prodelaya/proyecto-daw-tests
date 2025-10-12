// ============================================
// SCHEMAS ZOD PARA VALIDACIÓN DE AUTENTICACIÓN
// ============================================

import { z } from 'zod';

/**
 * Schema de validación para registro de nuevo usuario
 * 
 * Reglas aplicadas:
 * - Email: formato válido según RFC 5322
 * - Password: mínimo 6 caracteres (balance seguridad/usabilidad para proyecto educativo)
 * - Name: mínimo 2 caracteres (evitar inputs tipo "a" o espacios vacíos)
 * 
 * @remarks
 * El hash bcrypt tolerará cualquier longitud, pero validamos mínimo
 * para evitar contraseñas débiles tipo "123"
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('Formato de email inválido')
    .min(1, 'El email es requerido'),
  
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
});

/**
 * Schema de validación para login de usuario existente
 * 
 * @remarks
 * Nota importante: NO validamos longitud mínima de password aquí
 * porque el usuario ya está registrado en BD. Solo verificamos
 * que envíe algo (no vacío). La comparación con bcrypt se hace
 * en el controller.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Formato de email inválido')
    .min(1, 'El email es requerido'),
  
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
});

/**
 * Tipos TypeScript inferidos automáticamente por Zod
 * 
 * Equivalente a escribir manualmente:
 * type RegisterInput = { email: string; password: string; name: string }
 * type LoginInput = { email: string; password: string }
 * 
 * Ventaja: Si cambias el schema, los tipos se actualizan automáticamente
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;