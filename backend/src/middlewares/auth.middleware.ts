// ============================================
// MIDDLEWARE DE AUTENTICACIÓN JWT
// ============================================

// BLOQUE 1: Imports

// Tipos de Express para middleware
import { Request, Response, NextFunction } from 'express';

// Utilidad JWT para verificar tokens
import { verifyToken } from '../utils/jwt.util';


// BLOQUE 2: Extensión de tipos TypeScript

/**
 * Extensión de la interfaz Request de Express
 * 
 * Añade propiedad userId para que los controllers
 * puedan acceder al ID del usuario autenticado
 * 
 * Uso en controllers:
 * const userId = req.userId; // TypeScript reconoce esta propiedad
 */
declare global {
  namespace Express {
    interface Request {
      userId?: number; // Opcional porque no todas las rutas usan authMiddleware
    }
  }
}


// BLOQUE 3: Función authMiddleware

/**
 * MIDDLEWARE: Validación de autenticación JWT
 * 
 * Flujo:
 * 1. Extrae token del header Authorization
 * 2. Valida formato "Bearer <token>"
 * 3. Verifica token con verifyToken()
 * 4. Si válido → añade req.userId y continúa con next()
 * 5. Si inválido → responde 401 Unauthorized
 * 
 * @remarks
 * Se aplica solo en rutas protegidas (questions, attempts, stats)
 * NO se usa en /auth/register ni /auth/login
 * 
 * @example
 * // En routes:
 * router.get('/questions', authMiddleware, getQuestions);
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Extraer header Authorization
  const authHeader = req.headers.authorization;

  // 2. Verificar que existe el header
  if (!authHeader) {
    return res.status(401).json({
      error: 'Token no proporcionado',
      message: 'Debes incluir el header Authorization: Bearer <token>'
    });
  }

  // 3. Validar formato "Bearer <token>"
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Formato de token inválido',
      message: 'El formato debe ser: Authorization: Bearer <token>'
    });
  }

  // 4. Extraer el token (sin "Bearer ")
  const token = parts[1];

  // 5. Verificar token con la utilidad JWT
  const decoded = verifyToken(token);

  // 6. Si token inválido o expirado
  if (!decoded) {
    return res.status(401).json({
      error: 'Token inválido o expirado',
      message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
    });
  }

  // 7. Token válido → añadir userId a req para que los controllers lo usen
  req.userId = decoded.userId;

  // 8. Continuar al siguiente middleware o controller
  next();
};


