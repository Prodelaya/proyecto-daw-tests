// ============================================
// CONTROLLER DE ATTEMPTS
// ============================================

// BLOQUE 1: Imports (dependencias externas + internas)

// Imports de Express (tipos para req/res)
import { Request, Response } from 'express';

// Prisma Client (conexión a PostgreSQL)
import { PrismaClient } from '@prisma/client';

// Tipos del schema Zod (datos validados)
import { SubmitAttemptInput } from '../schemas/attempts.schemas';

// Inicializar Prisma Client
const prisma = new PrismaClient();


// BLOQUE 2: Función submitAttempt - Parte 1 (Preparación y Consulta)

/**
 * CONTROLADOR: Envío de intento de test
 * 
 * Flujo:
 * 1. Extraer datos validados (userId, subjectCode, topicNumber, answers)
 * 2. Obtener IDs de preguntas del array de respuestas
 * 3. Consultar preguntas en BD para obtener respuestas correctas
 * 4. Crear mapa questionId → pregunta para acceso rápido O(1)
 * 
 * @route POST /api/attempts
 * @access Privado (requiere authMiddleware)
 */
export const submitAttempt = async (req: Request, res: Response) => {
  try {
    // PASO 1: Extraer datos validados
    const userId = req.userId!; // authMiddleware garantiza que existe
    const { subjectCode, topicNumber, answers } = req.body as SubmitAttemptInput;
    
    // PASO 2: Obtener array de IDs de preguntas
    // De: [{ questionId: 1, userAnswer: "..." }, { questionId: 2, userAnswer: "..." }]
    // A: [1, 2]
    const questionIds = answers.map(answer => answer.questionId);
    
    // PASO 3: Consultar preguntas en BD
    // Necesitamos los correctAnswer para comparar
    const questions = await prisma.question.findMany({
      where: {
        id: {
          in: questionIds // Buscar por array de IDs: WHERE id IN (1, 2, 17, ...)
        }
      }
    });
    
    // PASO 4: Crear mapa questionId → pregunta completa
    // Para acceso rápido O(1) en lugar de find() en cada iteración
    // Map: { 1 => questionObj1, 2 => questionObj2, 17 => questionObj17 }
    const questionsMap = new Map(
      questions.map(q => [q.id, q])
    );

    // PASO 5: Comparar respuestas del usuario con las correctas
    // Construir array de resultados con toda la información
    const results = answers.map(answer => {
      const question = questionsMap.get(answer.questionId);
      
      // Verificación de seguridad (la pregunta debería existir siempre)
      if (!question) {
        throw new Error(`Pregunta con ID ${answer.questionId} no encontrada`);
      }
      
      // Comparar respuesta del usuario con la correcta
      const isCorrect = answer.userAnswer.trim() === question.correctAnswer.trim();
      
      return {
        questionId: question.id,
        userAnswer: answer.userAnswer,
        correctAnswer: question.correctAnswer,
        correct: isCorrect,
        explanation: question.explanation
      };
    });
    
    // PASO 6: Calcular score (porcentaje de acierto)
    const correctCount = results.filter(r => r.correct).length;
    const totalCount = results.length;
    const score = Math.round((correctCount / totalCount) * 100);
    
    // PASO 7: Guardar intento en la base de datos
    const attempt = await prisma.attempt.create({
      data: {
        userId: userId,
        subjectCode: subjectCode,
        topicNumber: topicNumber,
        score: score,
        answers: results // Guardamos el array completo como JSON
      }
    });

    // PASO 8: Detectar preguntas falladas
    // Filtrar solo las respuestas incorrectas y extraer sus IDs
    const failedQuestionIds = results
      .filter(r => !r.correct)
      .map(r => r.questionId);
    
    // PASO 9: Guardar preguntas falladas en UserFailedQuestion
    // Solo si hay preguntas falladas
    if (failedQuestionIds.length > 0) {
      await prisma.userFailedQuestion.createMany({
        data: failedQuestionIds.map(questionId => ({
          userId: userId,
          questionId: questionId
        })),
        skipDuplicates: true // Evita error si la pregunta ya estaba marcada como fallada
      });
    }
    
    // PASO 10: Responder al cliente con resultados detallados
    res.status(200).json({
      score: score,
      correct: correctCount,
      total: totalCount,
      results: results // Array con cada pregunta, respuestas y explicaciones
    });
    
  } catch (error) {
    // Manejo de errores
    console.error('Error en submitAttempt:', error);
    res.status(500).json({
      error: 'Error interno del servidor al procesar el intento'
    });
  }
};


// BLOQUE 5: Función getStats - Obtener estadísticas del usuario

/**
 * CONTROLADOR: Obtener estadísticas agregadas del usuario
 * 
 * Flujo:
 * 1. Extraer userId del middleware auth
 * 2. Obtener todos los intentos del usuario
 * 3. Agrupar intentos por asignatura y tema
 * 4. Calcular promedios de score por grupo
 * 5. Contar preguntas falladas pendientes
 * 6. Estructurar y responder con datos agregados
 * 
 * @route GET /api/attempts/stats
 * @access Privado (requiere authMiddleware)
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    // PASO 1: Extraer userId del middleware auth
    const userId = req.userId!;
    
    // PASO 2: Obtener todos los intentos del usuario
    const attempts = await prisma.attempt.findMany({
      where: { userId: userId },
      orderBy: { answeredAt: 'desc' } // Más recientes primero
    });
    
    // PASO 3: Agrupar intentos por asignatura y tema usando reduce
    // Estructura: { "DWEC-1": { attempts: [...], scores: [85, 90] }, "DWEC-final": { ... } }
    const grouped = attempts.reduce((acc, attempt) => {
      // Crear clave única: "DWEC-1" o "DWEC-final" (si topicNumber es null)
      const key = `${attempt.subjectCode}-${attempt.topicNumber || 'final'}`;
      
      // Inicializar grupo si no existe
      if (!acc[key]) {
        acc[key] = {
          subjectCode: attempt.subjectCode,
          topicNumber: attempt.topicNumber,
          attempts: [],
          scores: []
        };
      }
      
      // Añadir intento al grupo
      acc[key].attempts.push(attempt);
      acc[key].scores.push(attempt.score);
      
      return acc;
    }, {} as Record<string, any>);
    
    // PASO 4: Calcular promedios y construir array de stats
    const stats = Object.values(grouped).map((group: any) => {
      // Calcular promedio de scores
      const avgScore = group.scores.reduce((sum: number, score: number) => sum + score, 0) / group.scores.length;
      
      return {
        subjectCode: group.subjectCode,
        topicNumber: group.topicNumber,
        totalAttempts: group.attempts.length,
        avgScore: Math.round(avgScore) // Redondear para legibilidad
      };
    });
    
    // PASO 5: Contar preguntas falladas pendientes
    const failedCount = await prisma.userFailedQuestion.count({
      where: { userId: userId }
    });
    
    // PASO 6: Responder con estructura organizada
    res.status(200).json({
      stats: stats,
      totalFailedQuestions: failedCount
    });
    
  } catch (error) {
    // Manejo de errores
    console.error('Error en getStats:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener estadísticas'
    });
  }
};