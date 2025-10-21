// ============================================
// RUTAS DE RANKING
// ============================================

// BLOQUE 1: Imports

// Router de Express
import { Router } from 'express';

// Controllers (lógica de negocio)
import { getRanking } from '../controllers/ranking.controller';

// Middlewares
import { authMiddleware } from '../middlewares/auth.middleware';


// BLOQUE 2: Crear instancia del router

const router = Router();


// BLOQUE 3: Definición de Rutas

/**
 * GET /api/ranking
 * 
 * Obtener ranking de usuarios ordenado por cantidad de tests
 * 
 * Flujo:
 * 1. authMiddleware → verifica JWT y añade req.userId
 * 2. getRanking → consulta BD, ordena y responde
 * 
 * Respuesta:
 * [
 *   { position: 1, name: "Ana García", totalTests: 67 },
 *   { position: 2, name: "Juan Pérez", totalTests: 45 },
 *   { position: 3, name: "Luis López", totalTests: 38 }
 * ]
 */
router.get('/', authMiddleware, getRanking);


// BLOQUE 4: Export

// Exportar router para registrarlo en index.ts
export default router;