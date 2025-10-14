// ============================================
// CONTROLLER DE AUTENTICACIÓN
// ============================================

// BLOQUE 1: Imports (dependencias externas + internas)

// Imports de Express (tipos para req/res)
import { Request, Response } from 'express';

// Prisma Client (conexión a PostgreSQL)
import { PrismaClient } from '@prisma/client';

// bcrypt (hashear y comparar contraseñas)
import bcrypt from 'bcrypt';

// Utilidad JWT creada en utils/jwt.util.ts
import { generateToken } from '../utils/jwt.util';

// Inicializar Prisma Client
const prisma = new PrismaClient();

// BLOQUE 2: Función register (crear usuario)

/**
 * CONTROLADOR: Registro de nuevo usuario
 * 
 * Flujo:
 * 1. Recibe { email, password, name } validados por Zod
 * 2. Verifica que email no exista en BD
 * 3. Hashea password con bcrypt (10 rounds)
 * 4. Crea usuario en PostgreSQL
 * 5. Responde 201 Created
 * 
 * @route POST /api/auth/register
 * @access Público
 */
export const register = async (req: Request, res: Response) => { // <-- exportar para usar en routes
  try {
    // 1. Extraer datos del body (ya validados por middleware Zod)
    const { email, password, name } = req.body;

    // 2. Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'El email ya está registrado'
      });
    }

    // 3. Hashear contraseña (10 rounds = estándar seguridad)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Crear usuario en la base de datos
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    });

    // 5. Responder exitosamente (sin auto-login)
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      }
    });

  } catch (error) {
    // Manejo de errores inesperados
    console.error('Error en register:', error);
    res.status(500).json({
      error: 'Error interno del servidor al registrar usuario'
    });
  }
};

// BLOQUE 3: Función login (autenticar usuario)

/**
 * CONTROLADOR: Login de usuario existente
 * 
 * Flujo:
 * 1. Recibe { email, password } validados por Zod
 * 2. Busca usuario por email
 * 3. Verifica contraseña con bcrypt.compare()
 * 4. Genera token JWT (24h de validez)
 * 5. Responde 200 OK con token + datos usuario
 * 
 * @route POST /api/auth/login
 * @access Público
 */
export const login = async (req: Request, res: Response) => { // <-- exportar para usar en routes
  try {
    // 1. Extraer credenciales del body (ya validadas por Zod)
    const { email, password } = req.body;

    // 2. Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Si no existe el usuario
    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // 3. Verificar contraseña (compara texto plano con hash)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // 4. Generar token JWT (válido 24h)
    const token = generateToken(user.id);

    // 5. Responder con token y datos del usuario (sin password)
    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    // Manejo de errores inesperados
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor al hacer login'
    });
  }
};

