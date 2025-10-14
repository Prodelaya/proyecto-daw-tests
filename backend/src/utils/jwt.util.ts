// ============================================
// UTILIDADES JWT PARA AUTENTICACIÓN
// ============================================

import jwt from 'jsonwebtoken';

// Clave secreta para firmar tokens - CRÍTICO: debe estar en .env en producción
// Fallback solo válido para desarrollo local
const SECRET_KEY = process.env.JWT_SECRET || 'clave-super-secreta-cambiar-en-produccion';

/**
 * Genera un token JWT válido por 24 horas
 * 
 * @param userId - ID del usuario autenticado en PostgreSQL
 * @returns Token JWT firmado que contiene { userId, iat, exp }
 * 
 * @example
 * const token = generateToken(5);
 * // Retorna: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * 
 * @remarks
 * - Payload mínimo: solo userId (no datos sensibles)
 * - JWT está firmado pero NO cifrado (payload es visible con base64)
 * - Expiración: 24h (trade-off UX vs seguridad para proyecto DAW)
 * - jwt.sign() añade automáticamente iat (issued at) y exp (expiration)
 */
export const generateToken = (userId: number): string => {
  const payload = { userId };
  
  return jwt.sign(payload, SECRET_KEY, {
    expiresIn: '24h'
  });
};

/**
 * Verifica firma y expiración de un token JWT
 * 
 * @param token - Token JWT recibido del cliente (sin prefijo "Bearer ")
 * @returns Payload decodificado con userId si válido, null si inválido/expirado
 * 
 * @example
 * const result = verifyToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
 * if (result) {
 *   console.log(result.userId); // 5
 * } else {
 *   console.log('Token inválido o expirado');
 * }
 * 
 * @remarks
 * Casos que retornan null:
 * - Token expirado (>24h desde emisión) → TokenExpiredError
 * - Firma inválida (token manipulado o SECRET_KEY incorrecta) → JsonWebTokenError
 * - Formato JWT malformado → JsonWebTokenError
 * 
 * TODO: En producción, loggear tipo específico de error para métricas
 */
export const verifyToken = (token: string): { userId: number } | null => {
  try {
    // jwt.verify() verifica firma Y expiración - lanza error si fallan
    const decoded = jwt.verify(token, SECRET_KEY) as { userId: number };
    return decoded;
  } catch (error) {
    // Devolvemos null en lugar de lanzar error para facilitar uso en middlewares
    return null;
  }
}