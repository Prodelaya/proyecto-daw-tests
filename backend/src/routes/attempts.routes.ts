// ============================================
// RUTAS DE ATTEMPTS
// ============================================

// BLOQUE 1: Imports

// Router de Express
import { Router } from 'express';

// Controllers (lógica de negocio)
import { submitAttempt, getStats } from '../controllers/attempts.controller';

// Middlewares
import { validate } from '../middlewares/validator.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

// Schemas Zod para validación
import { submitAttemptSchema } from '../schemas/attempts.schemas';


// BLOQUE 2: Crear instancia del router

const router = Router();


// BLOQUE 3: Definición de Rutas

/**
 * POST /api/attempts
 * 
 * Enviar intento de test completo
 * 
 * Body esperado:
 * {
 *   subjectCode: "DWEC",
 *   topicNumber: 1,
 *   answers: [
 *     { questionId: 1, userAnswer: "..." },
 *     { questionId: 2, userAnswer: "..." }
 *   ]
 * }
 * 
 * Flujo:
 * 1. validate(submitAttemptSchema) → valida body con Zod
 * 2. authMiddleware → verifica JWT y añade req.userId
 * 3. submitAttempt → procesa intento, calcula score, guarda falladas
 * 
 * Respuesta:
 * {
 *   score: 85,
 *   correct: 17,
 *   total: 20,
 *   results: [...]
 * }
 */
router.post('/', validate(submitAttemptSchema), authMiddleware, submitAttempt);

/**
 * GET /api/attempts/stats
 * 
 * Obtener estadísticas agregadas del usuario autenticado
 * 
 * Flujo:
 * 1. authMiddleware → verifica JWT y añade req.userId
 * 2. getStats → obtiene intentos, agrupa, calcula promedios
 * 
 * Respuesta:
 * {
 *   stats: [
 *     { subjectCode: "DWEC", topicNumber: 1, totalAttempts: 5, avgScore: 85 }
 *   ],
 *   totalFailedQuestions: 12
 * }
 * 
 * IMPORTANTE: Esta ruta debe ir ANTES de cualquier ruta con parámetro /:id
 * para que "stats" no se interprete como un ID
 */
router.get('/stats', authMiddleware, getStats);


// BLOQUE 4: Export

// Exportar router para registrarlo en index.ts
export default router;