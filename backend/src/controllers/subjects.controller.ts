// ============================================
// CONTROLLER DE SUBJECTS (ASIGNATURAS)
// ============================================

// BLOQUE 1: Imports

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


// BLOQUE 2: Función getSubjects

/**
 * CONTROLADOR: Obtener lista de asignaturas únicas con contadores
 * 
 * Flujo:
 * 1. Agrupar preguntas por subjectCode usando groupBy
 * 2. Contar preguntas por cada asignatura con _count
 * 3. Obtener subjectName de la primera pregunta de cada asignatura
 * 4. Devolver array ordenado alfabéticamente
 * 
 * @route GET /api/subjects
 * @access Privado (requiere authMiddleware)
 */
export const getSubjects = async (req: Request, res: Response) => {
  try {
    // Obtener todas las preguntas agrupadas por asignatura
    const subjectsData = await prisma.question.groupBy({
      by: ['subjectCode', 'subjectName'],
      _count: {
        id: true
      }
    });

    // Formatear respuesta
    const subjects = subjectsData.map(subject => ({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      questionCount: subject._count.id
    }));

    // Ordenar alfabéticamente por código
    subjects.sort((a, b) => a.subjectCode.localeCompare(b.subjectCode));

    res.status(200).json(subjects);

  } catch (error) {
    console.error('Error en getSubjects:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener asignaturas'
    });
  }
};

/**
 * CONTROLADOR: Obtener temas de una asignatura con contadores
 * 
 * Flujo:
 * 1. Recibir subjectCode del path param
 * 2. Agrupar preguntas por topicNumber
 * 3. Contar preguntas por tema
 * 4. Devolver array ordenado por topicNumber
 * 
 * @route GET /api/subjects/:subjectCode/topics
 * @access Privado (requiere authMiddleware)
 */
export const getTopicsBySubject = async (req: Request, res: Response) => {
  try {
    const { subjectCode } = req.params;

    // Agrupar por topicNumber y topicTitle
    const topicsData = await prisma.question.groupBy({
      by: ['topicNumber', 'topicTitle'],
      where: {
        subjectCode: subjectCode.toUpperCase()
      },
      _count: {
        id: true
      }
    });

    // Formatear respuesta
    const topics = topicsData.map(topic => ({
      topicNumber: topic.topicNumber,
      topicTitle: topic.topicTitle,
      questionCount: topic._count.id
    }));

    // Ordenar por número de tema
    topics.sort((a, b) => a.topicNumber - b.topicNumber);

    res.status(200).json(topics);

  } catch (error) {
    console.error('Error en getTopicsBySubject:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener temas'
    });
  }
};