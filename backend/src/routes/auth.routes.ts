// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

// Router de Express
import { Router } from 'express';

// Controllers (lógica de negocio)
import { register, login } from '../controllers/auth.controller';

// Middleware validador + Schemas Zod
import { validate } from '../middlewares/validator.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schemas';

// Crear instancia del router
const router = Router();

// ============================================
// DEFINICIÓN DE RUTAS
// ============================================

/**
 * POST /api/auth/register
 * 
 * Flujo:
 * 1. validate(registerSchema) → valida body con Zod
 * 2. register controller → crea usuario en BD
 * 
 * Body esperado: { email, password, name }
 */
router.post('/register', validate(registerSchema), register);

/**
 * POST /api/auth/login
 * 
 * Flujo:
 * 1. validate(loginSchema) → valida body con Zod
 * 2. login controller → verifica credenciales y genera JWT
 * 
 * Body esperado: { email, password }
 */
router.post('/login', validate(loginSchema), login);

// Exportar router para registrarlo en index.ts
export default router;