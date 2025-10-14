// ============================================
// SERVIDOR EXPRESS - PUNTO DE ENTRADA BACKEND
// ============================================

// BLOQUE 1: Imports (dependencias)

// Express (framework web)
import express, { Request, Response, NextFunction } from 'express';

// Middlewares de seguridad y utilidades
import cors from 'cors';
import helmet from 'helmet';

// Rutas de autenticación
import authRoutes from './routes/auth.routes';

// Prisma Client (para cerrar conexión al apagar servidor)
import { PrismaClient } from '@prisma/client';

// Inicializar Prisma
const prisma = new PrismaClient();

// BLOQUE 2: Inicialización Express + Middlewares Globales

// ============================================
// INICIALIZACIÓN DE EXPRESS
// ============================================

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARES GLOBALES (se aplican a TODAS las rutas)
// ============================================

/**
 * CORS (Cross-Origin Resource Sharing)
 * 
 * Permite que el frontend (localhost:5173) haga peticiones al backend (localhost:3001)
 * Sin esto, el navegador bloquearía las peticiones por política de seguridad
 * 
 * Configuración actual: acepta peticiones desde cualquier origen
 * Producción: restringir a dominios específicos
 */
app.use(cors());

/**
 * Helmet
 * 
 * Añade headers HTTP de seguridad automáticamente:
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - X-XSS-Protection: 1; mode=block
 * - Strict-Transport-Security (si HTTPS)
 * 
 * Protege contra ataques comunes (XSS, clickjacking, etc.)
 */
app.use(helmet());

/**
 * express.json()
 * 
 * Parsea el body de las peticiones con Content-Type: application/json
 * Convierte el JSON string en objeto JavaScript accesible vía req.body
 * 
 * Sin esto: req.body sería undefined
 */
app.use(express.json());

/**
 * Middleware de logging básico (opcional pero útil)
 * 
 * Registra en consola cada petición recibida
 * Ayuda a debuggear durante desarrollo
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// BLOQUE 3: Registro de Rutas

// ============================================
// REGISTRO DE RUTAS
// ============================================

/**
 * Rutas de Autenticación
 * 
 * Prefijo: /api/auth
 * 
 * Endpoints disponibles:
 * - POST /api/auth/register → Crear nuevo usuario
 * - POST /api/auth/login → Autenticar usuario existente
 */
app.use('/api/auth', authRoutes);

/**
 * Ruta de health check (verificar que el servidor está vivo)
 * 
 * Útil para:
 * - Monitoreo en producción
 * - Testing automatizado
 * - Verificar deploy exitoso
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

/**
 * Ruta raíz (información básica)
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API Tests DAW - Backend',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      health: '/api/health'
    }
  });
});

// BLOQUE 4: Manejo de Errores Global

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================

/**
 * Middleware para rutas no encontradas (404)
 * 
 * Si ninguna ruta anterior hizo match, llega aquí
 * Importante: debe ir DESPUÉS de todas las rutas válidas
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    message: `La ruta ${req.method} ${req.path} no existe en esta API`
  });
});

/**
 * Middleware para errores generales (500)
 * 
 * Captura cualquier error no manejado en los controllers
 * Evita que el servidor crashee y muestre stack traces al cliente
 * 
 * IMPORTANTE: debe tener 4 parámetros (err, req, res, next)
 * Express lo reconoce como error handler por la firma
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error no manejado:', err);
  
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Ha ocurrido un error inesperado'
  });
});

// BLOQUE 5: Inicio del Servidor

// ============================================
// INICIO DEL SERVIDOR
// ============================================

/**
 * Arranca el servidor HTTP en el puerto especificado
 * 
 * Callback se ejecuta cuando el servidor está listo para aceptar conexiones
 */
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 Servidor Express iniciado correctamente');
  console.log('='.repeat(50));
  console.log(`📡 Escuchando en: http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`🔑 Auth login: POST http://localhost:${PORT}/api/auth/login`);
  console.log('='.repeat(50));
  console.log('✅ Listo para recibir peticiones');
  console.log('='.repeat(50));
});

/**
 * Manejo de cierre graceful del servidor
 * 
 * Cuando se detiene el servidor (Ctrl+C), cierra conexiones limpiamente
 * Evita dejar conexiones huérfanas en PostgreSQL
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  
  // Cerrar conexión Prisma
  await prisma.$disconnect();
  console.log('✅ Conexión a PostgreSQL cerrada');
  
  // Salir del proceso
  process.exit(0);
});