// BLOQUE 1: Imports
// - Request, Response de Express
// - PrismaClient
// - Tipos de questions.schemas.ts

// BLOQUE 2: Inicializar Prisma

// BLOQUE 3: Función getQuestions
// - Extraer parámetros validados
// - Construir filtros Prisma según type (tema/final/failed)
// - Consultar BD con filtros
// - Aleatorizar preguntas (shuffle)
// - Limitar cantidad
// - IMPORTANTE: Eliminar correctAnswer antes de enviar
// - Responder con array de preguntas

// BLOQUE 4: Función getQuestionsCount
// - Extraer parámetros validados
// - Construir filtros Prisma
// - Contar preguntas en BD
// - Responder con número


// ============================================
// CONTROLLER DE PREGUNTAS
// ============================================

// BLOQUE 1: Imports

// Tipos de Express
import { Request, Response } from 'express';

// Prisma Client
import { PrismaClient } from '@prisma/client';


// BLOQUE 2: Inicializar Prisma Client

const prisma = new PrismaClient();


// BLOQUE 3: Función getQuestions

/**
 * CONTROLADOR: Obtener preguntas filtradas
 * 
 * Query params (validados por Zod):
 * - subjectCode: string (obligatorio)
 * - topicNumber: number (opcional)
 * - type: "tema" | "final" | "failed" (opcional)
 * - limit: number (opcional, default 20)
 * 
 * Tipos de test:
 * 1. "tema": Preguntas de un tema específico (requiere topicNumber)
 * 2. "final": Todas las preguntas del módulo (ignora topicNumber)
 * 3. "failed": Solo preguntas falladas por el usuario autenticado
 * 
 * Flujo:
 * 1. Extraer parámetros validados
 * 2. Construir filtros Prisma según type
 * 3. Consultar BD
 * 4. Aleatorizar array (shuffle)
 * 5. Limitar cantidad
 * 6. ELIMINAR correctAnswer (seguridad)
 * 7. Responder JSON
 * 
 * @route GET /api/questions
 * @access Privado (requiere authMiddleware)
 */
export const getQuestions = async (req: Request, res: Response) => {
  try {
    // 1. Extraer parámetros del query (ya validados por Zod en middleware)
    const { subjectCode, topicNumber, type, limit } = req.validatedQuery;
    
    // 2. Obtener userId del middleware auth (req.userId fue añadido por authMiddleware)
    const userId = req.userId!; // ! porque authMiddleware garantiza que existe
    
    // 3. Construir filtros base de Prisma
    const filters: any = {
      subjectCode: subjectCode
    };
    
    // 4. Aplicar filtros según tipo de test
    if (type === 'tema') {
      // Test por tema específico
      if (!topicNumber) {
        return res.status(400).json({
          error: 'El tipo "tema" requiere especificar topicNumber'
        });
      }
      filters.topicNumber = topicNumber;
      
    } else if (type === 'final') {
      // Test final de módulo (todas las preguntas de la asignatura)
      // No añadimos filtro de topicNumber (queremos todas)
      
    } else if (type === 'failed') {
      // Test de preguntas falladas por el usuario
      // Necesitamos hacer join con UserFailedQuestion
      // Filtraremos después de la consulta
      
    }
    // Si no hay type, devolvemos todas las preguntas de la asignatura (igual que "final")
    
    // 5. Consultar BD
    let questions;
    
    if (type === 'failed') {
      // Para "failed" necesitamos filtrar por UserFailedQuestion
      questions = await prisma.question.findMany({
        where: {
          ...filters,
          failedBy: {
            some: {
              userId: userId
            }
          }
        }
      });
    } else {
      // Para "tema" y "final" consulta normal
      questions = await prisma.question.findMany({
        where: filters
      });
    }
    
    // 6. Aleatorizar array de preguntas (shuffle Fisher-Yates)
    // https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    
    // 7. Limitar cantidad de preguntas
    const limitedQuestions = questions.slice(0, limit);
    
    // 8. 🔴 CRÍTICO: Eliminar correctAnswer de cada pregunta
    // El frontend NO debe conocer la respuesta correcta hasta enviar el intento
    const questionsWithoutAnswer = limitedQuestions.map((q) => {
      const { correctAnswer, ...questionWithoutAnswer } = q;
      return questionWithoutAnswer;
    });
    
    // 9. Responder con array de preguntas
    res.status(200).json(questionsWithoutAnswer);
    
  } catch (error) {
    console.error('Error en getQuestions:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener preguntas'
    });
  }
};


// BLOQUE 4: Función getQuestionsCount

/**
 * CONTROLADOR: Contar preguntas disponibles
 * 
 * Query params (validados por Zod):
 * - subjectCode: string (obligatorio)
 * - topicNumber: number (opcional)
 * - type: "tema" | "final" | "failed" (opcional)
 * 
 * Propósito:
 * Frontend usa este endpoint para mostrar botones dinámicos:
 * - Si hay 28 preguntas disponibles → mostrar [10] [20] [MAX(28)]
 * - Si hay 15 preguntas disponibles → mostrar [10] [MAX(15)]
 * 
 * Flujo:
 * 1. Extraer parámetros validados
 * 2. Construir filtros Prisma
 * 3. Contar en BD
 * 4. Responder con número
 * 
 * @route GET /api/questions/count
 * @access Privado (requiere authMiddleware)
 */
export const getQuestionsCount = async (req: Request, res: Response) => {
  try {
    // 1. Extraer parámetros del query (ya validados por Zod)
    const { subjectCode, topicNumber, type } = req.validatedQuery;
    
    // 2. Obtener userId del middleware auth
    const userId = req.userId!;
    
    // 3. Construir filtros base
    const filters: any = {
      subjectCode: subjectCode
    };
    
    // 4. Aplicar filtros según tipo
    if (type === 'tema' && topicNumber) {
      filters.topicNumber = topicNumber;
    }
    // Si type="final" no añadimos filtro de topicNumber
    
    // 5. Contar preguntas en BD
    let count;
    
    if (type === 'failed') {
      // Contar solo preguntas falladas por el usuario
      count = await prisma.question.count({
        where: {
          ...filters,
          failedBy: {
            some: {
              userId: userId
            }
          }
        }
      });
    } else {
      // Contar preguntas normales
      count = await prisma.question.count({
        where: filters
      });
    }
    
    // 6. Responder con el número
    res.status(200).json({
      count: count,
      subjectCode: subjectCode,
      topicNumber: topicNumber || null,
      type: type || 'all'
    });
    
  } catch (error) {
    console.error('Error en getQuestionsCount:', error);
    res.status(500).json({
      error: 'Error interno del servidor al contar preguntas'
    });
  }
};