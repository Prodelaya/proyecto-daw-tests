// backend/src/schemas/auth.schemas.ts

import { z } from 'zod'; // Librería para validación y tipado

// Schema para registro de usuario
export const registerSchema = z.object({
  email: z // Validar que el email es correcto
    .string() // Tipo string
    .email('Formato de email inválido') // Formato email
    .min(1, 'El email es requerido'), // No vacío
  
  password: z // Validar que la contraseña tiene al menos 6 caracteres
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  
  name: z // Validar que el nombre tiene al menos 2 caracteres
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
});

// Schema para login
export const loginSchema = z.object({
  email: z
    .string()
    .email('Formato de email inválido')
    .min(1, 'El email es requerido'),
  
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
});

// Exportar tipos inferidos (TypeScript automático)
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;