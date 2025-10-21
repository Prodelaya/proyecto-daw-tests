// ============================================
// CONTROLLER DE RANKING
// ============================================

// BLOQUE 1: Imports (dependencias externas + internas)

// Imports de Express (tipos para req/res)
import { Request, Response } from 'express';

// Prisma Client (conexión a PostgreSQL)
import { PrismaClient } from '@prisma/client';

// Inicializar Prisma Client
const prisma = new PrismaClient();

// BLOQUE 2: Función getRanking - Obtener ranking de usuarios

/**
 * CONTROLADOR: Obtener ranking de usuarios por cantidad de tests
 * 
 * Flujo:
 * 1. Consultar usuarios con contador de attempts
 * 2. Ordenar por cantidad descendente
 * 3. Mapear con número de posición
 * 4. Responder JSON
 * 
 * @route GET /api/ranking
 * @access Privado (requiere authMiddleware)
 */
export const getRanking = async (req: Request, res: Response) => {
  try {
    // PASO 1: Consultar usuarios con contador de attempts
    // Usamos findMany con include + select para traer solo lo necesario
    const rankings = await prisma.user.findMany({
      select: {
        name: true,           // Nombre del usuario
        _count: {
          select: { attempts: true }  // Contar attempts relacionados
        }
      },
      orderBy: {
        attempts: { _count: 'desc' }  // Ordenar por cantidad DESC
      },
      take: 100  // Top 100 (ajustable según necesidades)
    });

    // PASO 2: Formatear respuesta con número de posición
    // Map para añadir position (1, 2, 3, ...)
    const formattedRanking = rankings.map((user, index) => ({
      position: index + 1,
      name: user.name,
      totalTests: user._count.attempts
    }));

    // PASO 3: Responder con array JSON
    res.status(200).json(formattedRanking);
    
  } catch (error) {
    // Manejo de errores
    console.error('Error en getRanking:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener ranking'
    });
  }
};

