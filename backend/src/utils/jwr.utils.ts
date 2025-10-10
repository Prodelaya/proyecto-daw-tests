// backend/src/utils/jwt.util.ts

import jwt from 'jsonwebtoken'; // Librería para manejar JWTs

// Clave secreta para firmar los tokens (en producción, usar una variable de entorno segura)

const SECRET_KEY = process.env.JWT_SECRET || 'clave-super-secreta-cambiar-en-produccion'; // Carga de .env la clave

// Función para generar un token JWT
export const generateToken = (userId: number): string => {
  const payload = { userId }; // Payload simple: solo el ID del usuario
  
  const token = jwt.sign(payload, SECRET_KEY, {
    expiresIn: '24h' // Expira en 24 horas
  });
  
  return token;
};

// Función para verificar y decodificar un token JWT
export const verifyToken = (token: string): { userId: number } | null => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { userId: number };
    return decoded; // Devuelve el payload con userId
  } catch (error) {
    // Token inválido, expirado o malformado
    return null;
  }
};

