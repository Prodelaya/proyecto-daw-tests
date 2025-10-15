// BLOQUE 1: Imports
// - Router de Express
// - Controllers (getQuestions, getQuestionsCount)
// - Middlewares (validate, authMiddleware)
// - Schemas (getQuestionsSchema, countQuestionsSchema)

// BLOQUE 2: Crear instancia del router

// BLOQUE 3: Definir rutas
// - GET /count → validate + auth + getQuestionsCount
// - GET / → validate + auth + getQuestions
// (count ANTES que / para que no haga match con /:id)

// BLOQUE 4: Export router
// ============================================

// ============================================
// RUTAS DE PREGUNTAS
// ============================================

// BLOQUE 1: Imports

// Router de Express
import { Router } from 'express';

// Controllers (lógica de negocio)
import { getQuestions, getQuestionsCount } from '../controllers/questions.controller';

// Middlewares
import { validateQuery } from '../middlewares/validator.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

// Schemas Zod para validación
import { getQuestionsSchema, countQuestionsSchema } from '../schemas/questions.schemas';

// BLOQUE 2: Crear instancia del router

const router = Router();

// BLOQUE 3: Definición de Rutas

/**
 * GET /api/questions/count
 * 
 * Contar preguntas disponibles según filtros
 * 
 * Query params:
 * - subjectCode: string (obligatorio)
 * - topicNumber: number (opcional)
 * - type: "tema" | "final" | "failed" (opcional)
 * 
 * Flujo:
 * 1. validate(countQuestionsSchema) → valida query params con Zod
 * 2. authMiddleware → verifica JWT y añade req.userId
 * 3. getQuestionsCount → cuenta en BD y responde
 * 
 * IMPORTANTE: Esta ruta debe ir ANTES de GET /
 * Si estuviera después, Express matchearía "count" como un parámetro de /:id
 */
router.get('/count', validateQuery(countQuestionsSchema), authMiddleware, getQuestionsCount);

/**
 * GET /api/questions
 * 
 * Obtener preguntas filtradas y aleatorizadas
 * 
 * Query params:
 * - subjectCode: string (obligatorio)
 * - topicNumber: number (opcional)
 * - type: "tema" | "final" | "failed" (opcional)
 * - limit: number (opcional, default 20)
 * 
 * Flujo:
 * 1. validate(getQuestionsSchema) → valida query params con Zod
 * 2. authMiddleware → verifica JWT y añade req.userId
 * 3. getQuestions → consulta BD, aleatoriza, elimina correctAnswer, responde
 * 
 * Respuesta:
 * - Array de preguntas SIN correctAnswer
 * - Aleatorizado (diferente orden cada vez)
 * - Limitado a N preguntas
 */
router.get('/', validateQuery(getQuestionsSchema), authMiddleware, getQuestions);

// BLOQUE 4: Export

// Exportar router para registrarlo en index.ts
export default router;

