// ============================================
// MIDDLEWARE GENÉRICO DE VALIDACIÓN CON ZOD
// ============================================

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Middleware factory para validar req.body con schemas Zod
 * 
 * Patrón Higher-Order Function: validate(schema) devuelve un middleware
 * que captura el schema en su closure, permitiendo reutilización.
 * 
 * @param schema - Schema de Zod a aplicar (registerSchema, loginSchema, etc.)
 * @returns Middleware de Express que valida req.body y responde 400 si falla
 * 
 * @example
 * // En auth.routes.ts:
 * router.post('/register', validate(registerSchema), registerController);
 * router.post('/login', validate(loginSchema), loginController);
 * 
 * @remarks
 * Ventajas de este patrón:
 * - DRY: Un solo middleware para todas las validaciones
 * - Type-safe: TypeScript infiere tipos del schema
 * - Errores consistentes: Mismo formato en toda la API
 * - Separation of Concerns: Validación separada de lógica de negocio
 * 
 * Flujo de ejecución:
 * 1. Cliente envía POST con JSON body
 * 2. Middleware valida con schema.safeParse(req.body)
 * 3. Si válido → next() → controller procesa
 * 4. Si inválido → res.status(400) → cliente recibe errores
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // safeParse() no lanza errores - devuelve { success: boolean, data/error }
    // Preferimos esto sobre parse() que lanza excepciones
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      // Formateamos errores Zod para que sean legibles por el frontend
      // Cada error tiene: path (campo), message (descripción)
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: result.error.issues.map(err => ({
          field: err.path.join('.'),  // "email", "password", "user.name", etc.
          message: err.message         // Mensaje definido en el schema
        }))
      });
    }
    
    // Validación exitosa - continuar al siguiente middleware o controller
    // IMPORTANTE: No olvidar llamar next(), o la petición quedará colgada
    next();
  };
}