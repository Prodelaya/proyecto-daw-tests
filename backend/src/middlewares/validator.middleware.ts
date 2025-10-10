// backend/src/middlewares/validator.middleware.ts

import { Request, Response, NextFunction } from 'express'; // Tipos de Express
import { ZodSchema } from 'zod'; // Tipo de schema de Zod sirve para cualquier schema

/**
 * Middleware genérico de validación con Zod
 * @param schema - Schema de Zod para validar
 * @returns Middleware de Express
 */
export const validate = (schema: ZodSchema) => { 
  return (req: Request, res: Response, next: NextFunction) => {
    // Validar req.body con el schema
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      // Si la validación falla, devolver errores
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: result.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    // Si la validación pasa, continuar al siguiente middleware/controller
    next();
  };
};