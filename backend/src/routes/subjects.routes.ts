// ============================================
// RUTAS DE SUBJECTS
// ============================================

import { Router } from 'express';
import { getSubjects, getTopicsBySubject } from '../controllers/subjects.controller'; 
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * GET /api/subjects
 * 
 * Obtener lista de asignaturas con contador de preguntas
 * 
 * Respuesta:
 * [
 *   { subjectCode: "DWEC", subjectName: "...", questionCount: 30 }
 * ]
 */
router.get('/', authMiddleware, getSubjects);

/**
 * GET /api/subjects/:subjectCode/topics
 * 
 * Obtener lista de temas de una asignatura con contador
 * 
 * Ejemplo: GET /api/subjects/DWEC/topics
 * 
 * Respuesta:
 * [
 *   { topicNumber: 1, topicTitle: "Intro...", questionCount: 30 },
 *   { topicNumber: 3, topicTitle: "...", questionCount: 15 }
 * ]
 */
router.get('/:subjectCode/topics', authMiddleware, getTopicsBySubject);

export default router;