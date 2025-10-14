# 📊 Sesión 4: FASE 2 - Backend Autenticación (Bloque 2)

## 🎯 Estado Actual del Proyecto

### ✅ Checkpoint Previo (Sesión 3)
- ✅ Utilidad JWT (generateToken + verifyToken)
- ✅ Schemas Zod (registerSchema + loginSchema)
- ✅ Middleware validador genérico
- ✅ Estructura de carpetas backend completa

**Progreso anterior:** 50% completado

---

## 🆕 Trabajo Realizado en Esta Sesión (2h)

### **FASE 2 - Bloque 2: Controllers + Routes + Servidor Express** ✨

---

#### 17. **Instalación de bcrypt Types** (PASO 16)
**Qué hicimos:**
- Instalado `@types/bcrypt` como dependencia de desarrollo

**Para qué:**
- Proporcionar tipos TypeScript para la librería bcrypt
- Habilitar autocompletado de métodos (hash, compare)
- Evitar errores de tipos en auth.controller.ts

**Comando ejecutado:**
```bash
cd /opt/proyecto-daw-tests/backend
npm install --save-dev @types/bcrypt
```

**Resultado:** 
- ✅ TypeScript reconoce bcrypt correctamente
- ✅ Autocompletado funcional en VSCode

---

#### 18. **Controlador de Autenticación** (PASO 17) ✨
**Qué hicimos:**
- Creado `backend/src/controllers/auth.controller.ts`
- Implementado función `register` (crear usuario)
- Implementado función `login` (autenticar usuario)

**Para qué:**
- Contener toda la **lógica de negocio** de autenticación
- Interactuar con PostgreSQL vía Prisma
- Cifrar contraseñas con bcrypt
- Generar tokens JWT tras login exitoso

**Cómo funciona:**

**Función register:**
1. Extrae `{ email, password, name }` del body (ya validados por Zod)
2. Verifica que el email no exista en BD con `prisma.user.findUnique()`
3. Si existe → responde 409 (Conflict) con mensaje de error
4. Si no existe → hashea password con `bcrypt.hash(password, 10)`
5. Crea usuario en BD con `prisma.user.create()`
6. Responde 201 (Created) con usuario (sin password)

**Función login:**
1. Extrae `{ email, password }` del body (ya validados por Zod)
2. Busca usuario por email con `prisma.user.findUnique()`
3. Si no existe → responde 401 (Unauthorized) con mensaje genérico
4. Verifica password con `bcrypt.compare(password, user.password)`
5. Si no coincide → responde 401 con mismo mensaje genérico
6. Si coincide → genera JWT con `generateToken(user.id)`
7. Responde 200 (OK) con token + datos usuario (sin password)

**Decisiones técnicas:**
- ✅ **bcrypt rounds: 10** (estándar industria, ~60-100ms)
- ✅ **Status 409** para email duplicado (Conflict, no Bad Request)
- ✅ **Status 401** para credenciales incorrectas (Unauthorized)
- ✅ **Mensaje genérico** "Credenciales inválidas" (seguridad: no revela si es email o password)
- ✅ **No devolver password** en respuestas (nunca exponer hashes)
- ✅ **Manejo de errores** con try-catch y log en consola

**Código clave:**
```typescript
// Registro: hashear password
const hashedPassword = await bcrypt.hash(password, 10);

const newUser = await prisma.user.create({
  data: { email, password: hashedPassword, name }
});

// Login: verificar password
const isPasswordValid = await bcrypt.compare(password, user.password);

if (!isPasswordValid) {
  return res.status(401).json({ error: 'Credenciales inválidas' });
}

const token = generateToken(user.id);
```

**Resultado:**
- ✅ Archivo creado sin errores TypeScript
- ✅ Funciones exportadas correctamente
- ✅ Lógica de negocio completa y segura

---

#### 19. **Rutas de Autenticación** (PASO 18) ✨
**Qué hicimos:**
- Creado `backend/src/routes/auth.routes.ts`
- Conectado endpoint POST `/register` con controller register
- Conectado endpoint POST `/login` con controller login
- Aplicado middleware validador en ambas rutas

**Para qué:**
- Mapear URLs a funciones controller
- Aplicar validaciones Zod antes de ejecutar lógica
- Crear módulo reutilizable para registrar en el servidor

**Cómo funciona:**

**Patrón Middleware Chain:**
```typescript
router.post('/register', validate(registerSchema), register);
```

**Flujo de ejecución:**
1. Cliente envía `POST /api/auth/register`
2. Express ejecuta `validate(registerSchema)` (middleware 1)
3. Si válido → llama `next()` → ejecuta `register` (controller)
4. Si inválido → responde 400 y corta cadena (no llega al controller)

**Ventajas:**
- ✅ **Separation of Concerns:** Validación separada de lógica
- ✅ **Reutilización:** Mismo middleware en todas las rutas
- ✅ **Testing:** Controller testeable sin preocuparse de validación
- ✅ **Mantenibilidad:** Cambiar validación en un solo lugar

**Código clave:**
```typescript
import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { validate } from '../middlewares/validator.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schemas';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

export default router;
```

**Resultado:**
- ✅ Archivo ~25 líneas (sin comentarios)
- ✅ Rutas tipadas correctamente
- ✅ Exports funcionales

---

#### 20. **Servidor Express Completo** (PASO 19) ✨
**Qué hicimos:**
- Creado `backend/src/index.ts` (punto de entrada del backend)
- Inicializado Express con middlewares globales
- Registrado rutas de autenticación
- Implementado error handlers (404, 500)
- Añadido cierre graceful de Prisma

**Para qué:**
- Arrancar el servidor HTTP en puerto 3001
- Aplicar middlewares de seguridad a todas las rutas
- Centralizar manejo de errores
- Proporcionar endpoints de health check

**Componentes principales:**

**1. Middlewares globales (orden importa):**
```typescript
app.use(cors());              // Permitir peticiones desde frontend
app.use(helmet());            // Headers de seguridad HTTP
app.use(express.json());      // Parsear body JSON
app.use(loggerMiddleware);    // Registrar peticiones en consola
```

**2. Registro de rutas:**
```typescript
app.use('/api/auth', authRoutes);     // Rutas autenticación
app.get('/api/health', healthCheck);  // Health check
app.get('/', rootHandler);            // Info API
```

**3. Error handlers:**
```typescript
// 404 - Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// 500 - Errores no manejados (debe tener 4 parámetros)
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});
```

**4. Inicio del servidor:**
```typescript
app.listen(PORT, () => {
  console.log('🚀 Servidor Express iniciado correctamente');
  console.log(`📡 Escuchando en: http://localhost:${PORT}`);
});
```

**5. Cierre graceful:**
```typescript
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await prisma.$disconnect();
  console.log('✅ Conexión a PostgreSQL cerrada');
  process.exit(0);
});
```

**Decisiones técnicas:**
- ✅ **Puerto 3001** (evitar conflictos con frontend 5173)
- ✅ **CORS abierto en desarrollo** (producción: restringir dominios)
- ✅ **Logger básico** (timestamp + método + ruta)
- ✅ **Health check** en `/api/health` (monitoreo/testing)
- ✅ **Error handler con 4 params** (Express lo reconoce así)
- ✅ **SIGINT handler** (Ctrl+C cierra Prisma limpiamente)

**Resultado:**
- ✅ Archivo ~120 líneas (con comentarios)
- ✅ Servidor arranca sin errores
- ✅ Estructura profesional y escalable

---

#### 21. **Instalación de nodemon** (PASO 20)
**Qué hicimos:**
- Instalado `nodemon` y `tsx` como devDependencies

**Para qué:**
- **nodemon:** Reinicia automáticamente el servidor al detectar cambios
- **tsx:** Ejecuta TypeScript directamente sin compilar

**Por qué:**
- Script `npm run dev` requería estas dependencias
- Mejora DX (Developer Experience): editas código → servidor se reinicia solo

**Comandos ejecutados:**
```bash
npm install --save-dev nodemon tsx
```

**Resultado:**
- ✅ `npm run dev` funciona correctamente
- ✅ Hot reload habilitado

---

#### 22. **Testing con curl** (PASO 21) ✨
**Qué hicimos:**
- Ejecutado 5 tests completos con `curl` desde terminal
- Verificado todos los flujos de autenticación

**Por qué curl:**
- Thunder Client no funciona en VSCode Remote SSH (versión gratuita)
- curl es herramienta estándar en producción
- Resultados igual de confiables

**Tests ejecutados:**

**Test 1: Health Check (GET)**
```bash
curl http://localhost:3001/api/health
```
**Resultado:** ✅ `200 OK`
```json
{"status":"OK","message":"Servidor funcionando correctamente","timestamp":"2025-10-14T11:33:28.201Z"}
```

**Test 2: Registro Exitoso (POST)**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@daw.com","password":"123456","name":"Usuario Prueba"}'
```
**Resultado:** ✅ `201 Created`
```json
{"message":"Usuario registrado exitosamente","user":{"id":1,"email":"test@daw.com","name":"Usuario Prueba"}}
```

**Test 3: Registro Duplicado (POST)**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@daw.com","password":"otra","name":"Otro Usuario"}'
```
**Resultado:** ✅ `409 Conflict`
```json
{"error":"El email ya está registrado"}
```

**Test 4: Login Exitoso (POST)**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@daw.com","password":"123456"}'
```
**Resultado:** ✅ `200 OK`
```json
{"message":"Login exitoso","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","user":{"id":1,"email":"test@daw.com","name":"Usuario Prueba"}}
```

**Test 5: Login Fallido (POST)**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@daw.com","password":"password_incorrecta"}'
```
**Resultado:** ✅ `401 Unauthorized`
```json
{"error":"Credenciales inválidas"}
```

**Verificaciones realizadas:**
- ✅ Servidor responde a todas las peticiones
- ✅ Status codes correctos (200, 201, 401, 409)
- ✅ Validaciones Zod funcionando
- ✅ bcrypt hash/compare operativo
- ✅ JWT generado correctamente
- ✅ Password nunca expuesto en respuestas
- ✅ Mensajes de error claros y seguros

---

#### 23. **Verificación en Prisma Studio** (PASO 22)
**Qué hicimos:**
- Configurado port forwarding en MobaXterm
- Abierto Prisma Studio en `localhost:5555`
- Verificado usuario en tabla User

**Para qué:**
- Confirmar que el usuario se guardó en PostgreSQL
- Verificar que password está hasheado (no texto plano)
- Inspección visual de datos

**Hallazgos:**
- ✅ Usuario ID 1 creado correctamente
- ✅ Email: "test@daw.com"
- ✅ Password: `$2b$10$pj5ICtudezfj9ZBV...` (hasheado con bcrypt)
- ✅ Name: "Usuario Prueba"
- ✅ CreatedAt: 2025-10-14T11:34:50.284Z
- ✅ Attempts: 0 (relación funcional)

**Nota técnica:**
Password hash empieza con `$2b$10$` indicando:
- `$2b$`: Algoritmo bcrypt
- `$10$`: 10 rounds (2^10 = 1024 iteraciones)

---

#### 24. **Git Commit + Push** (PASO 23) ✨
**Qué hicimos:**
- Detenido servidor Express (Ctrl+C con cierre graceful)
- Verificado cambios con `git status`
- Commit con mensaje descriptivo
- Push a GitHub

**Archivos commiteados:**
```
✅ backend/src/controllers/auth.controller.ts (nuevo)
✅ backend/src/routes/auth.routes.ts (nuevo)
✅ backend/src/index.ts (nuevo)
✅ backend/package.json (modificado - nodemon + tsx)
```

**Mensaje de commit:**
```
feat(backend): Completar sistema de autenticación (FASE 2 Bloque 2)

- Crear auth.controller.ts (register + login)
- Implementar registro con bcrypt hash (10 rounds)
- Implementar login con verificación bcrypt + JWT
- Crear auth.routes.ts (conectar endpoints)
- Crear index.ts (servidor Express completo)
- Configurar middlewares: cors, helmet, json, logger
- Añadir error handlers (404, 500)
- Implementar cierre graceful con Prisma
- Instalar nodemon + tsx como devDependencies

Tests realizados con curl:
✅ Health check (200)
✅ Registro exitoso (201)
✅ Registro duplicado rechazado (409)
✅ Login exitoso con JWT (200)
✅ Login fallido rechazado (401)

Backend autenticación 100% funcional
```

**Resultado:**
- ✅ Commit exitoso en repositorio local
- ✅ Push exitoso a GitHub
- ✅ Historial limpio con commit atómico

---

## 📁 Estructura de Archivos Actualizada

```
/opt/proyecto-daw-tests/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── auth.controller.ts ✨ NUEVO
│   │   ├── routes/
│   │   │   └── auth.routes.ts ✨ NUEVO
│   │   ├── middlewares/
│   │   │   └── validator.middleware.ts (sesión 3)
│   │   ├── schemas/
│   │   │   └── auth.schemas.ts (sesión 3)
│   │   ├── utils/
│   │   │   └── jwt.util.ts (sesión 3)
│   │   ├── seed/
│   │   │   ├── seed.ts
│   │   │   └── DWEC/dwec_ut1.json
│   │   └── index.ts ✨ NUEVO
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── package.json ✨ ACTUALIZADO (nodemon + tsx)
│   ├── tsconfig.json
│   └── .env
│
├── frontend/ (sin cambios)
├── docs/
│   ├── dos_primeras_sesiones.md
│   ├── session_3.md
│   ├── session_4.md ✨ NUEVO (este archivo)
│   └── ...
├── .git/
├── .gitignore
└── README.md
```

---

## 🛠️ Dependencias Añadidas

### Backend (nuevas en esta sesión)
- ✅ `nodemon` v3.1.x (desarrollo - hot reload)
- ✅ `tsx` v4.20.x (desarrollo - ejecutar TypeScript)
- ✅ `@types/bcrypt` v5.0.x (desarrollo - tipos TypeScript)

### Backend (ya instaladas antes)
- ✅ express v5.1.x
- ✅ prisma / @prisma/client v6.17.x
- ✅ bcrypt v5.1.x
- ✅ jsonwebtoken v9.0.x + @types/jsonwebtoken
- ✅ zod v4.1.x
- ✅ cors
- ✅ helmet
- ✅ typescript / @types/node / @types/express

---

## 📊 Progreso General del Proyecto

```
[████████████████████████░░░░░░░░░░░░] 60% Completado

Fases:
✅ Fase 0: Preparación entorno (100%)
✅ Fase 1: Setup inicial (100%)
✅ Fase 2: Backend Auth (100%) ← ✨ COMPLETADA HOY
   ✅ Bloque 1: Utilidades JWT + Zod + Validator
   ✅ Bloque 2: Controllers + Routes + Servidor
⏳ Fase 3: Backend API Tests (0%)
⏳ Fase 4: Frontend (0%)
⏳ Fase 5: Deploy (0%)
⏳ Fase 6: Testing (0%)
```

**Tiempo invertido total:** ~8 horas  
**Tiempo invertido hoy (Sesión 4):** ~2 horas  
**Tiempo estimado restante:** 15-18 horas  
**Próxima sesión:** Backend - API de Tests (FASE 3)

---

## ✅ Checkpoint Actual - FASE 2 COMPLETADA

### **Bloque 1: Utilidades Base** ✅ COMPLETADO (Sesión 3)
- [x] Instalar jsonwebtoken
- [x] Crear jwt.util.ts
- [x] Crear auth.schemas.ts
- [x] Crear validator.middleware.ts
- [x] Commit + push

### **Bloque 2: Controllers + Routes** ✅ COMPLETADO (Sesión 4)
- [x] Instalar @types/bcrypt
- [x] Crear auth.controller.ts (register + login)
- [x] Crear auth.routes.ts
- [x] Crear index.ts (servidor Express)
- [x] Instalar nodemon + tsx
- [x] Probar 5 tests con curl (todos pasados)
- [x] Verificar en Prisma Studio
- [x] Commit + push

### **FASE 3: Backend API Tests** 🔜 PRÓXIMO
- [ ] Crear middleware authMiddleware (validar JWT)
- [ ] Crear questions.controller.ts
- [ ] Crear attempts.controller.ts
- [ ] Implementar GET /questions con filtros
- [ ] Implementar GET /questions/count
- [ ] Implementar POST /attempts
- [ ] Implementar GET /stats/:userId
- [ ] Probar todos los endpoints
- [ ] Commit + push

---

## 🎯 Próximos Objetivos Inmediatos

### Objetivo 1: Middleware de Autenticación (30 min)
- [ ] Crear `backend/src/middlewares/auth.middleware.ts`
- [ ] Extraer token del header `Authorization: Bearer <token>`
- [ ] Verificar token con `verifyToken()` (utils/jwt.util.ts)
- [ ] Si válido → añadir `req.userId` y llamar `next()`
- [ ] Si inválido → responder 401

### Objetivo 2: API Questions (2h)
- [ ] Schemas Zod (getQuestionsSchema, countSchema)
- [ ] Controller getQuestions (filtros: subjectCode, topicNumber, type, limit)
- [ ] Controller getQuestionsCount
- [ ] Routes questions.routes.ts
- [ ] Registrar en index.ts
- [ ] Probar con curl

### Objetivo 3: API Attempts y Stats (2h)
- [ ] Schemas Zod (submitAttemptSchema)
- [ ] Controller submitAttempt (calcular score, detectar falladas)
- [ ] Controller getStats (agregaciones por asignatura/tema)
- [ ] Routes attempts.routes.ts
- [ ] Registrar en index.ts
- [ ] Probar flujo completo
- [ ] Commit + push

---

## 💡 Lecciones Aprendidas en Esta Sesión

### **1. Patrón Middleware Chain es fundamental**
```typescript
router.post('/register', validate(schema), controller);
```
**Ventaja:** Separación clara entre validación y lógica de negocio

### **2. bcrypt.compare() NO admite texto plano como segundo parámetro**
```typescript
// ✅ CORRECTO
await bcrypt.compare(plaintextPassword, hashedPassword);

// ❌ INCORRECTO
await bcrypt.compare(hashedPassword, plaintextPassword);
```

### **3. Status codes HTTP importan para APIs RESTful**
- **201** → Recurso creado (register)
- **200** → Operación exitosa (login)
- **401** → Credenciales incorrectas (login fallido)
- **409** → Conflicto (email duplicado)

### **4. Mensajes de error genéricos mejoran seguridad**
```typescript
// ✅ SEGURO: No revela información
if (!user || !isPasswordValid) {
  return res.status(401).json({ error: 'Credenciales inválidas' });
}

// ❌ INSEGURO: Revela si email existe
if (!user) {
  return res.status(404).json({ error: 'Email no encontrado' });
}
```

### **5. Error handlers en Express requieren 4 parámetros**
```typescript
// ✅ Express lo reconoce como error handler
app.use((err, req, res, next) => { ... });

// ❌ Express lo trata como middleware normal
app.use((req, res, next) => { ... });
```

### **6. Cierre graceful evita conexiones huérfanas**
```typescript
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```
**Evita:** "too many connections" error en PostgreSQL

### **7. curl es herramienta profesional para testing APIs**
Ventajas sobre GUI (Thunder Client, Postman):
- ✅ Funciona en SSH/remoto
- ✅ Scriptable (automatizar tests)
- ✅ Universal (cualquier SO)
- ✅ Formato estándar en documentación

---

## 📝 Notas Importantes

### **Orden de Middlewares Importa**
```typescript
// ✅ CORRECTO
app.use(express.json());      // 1. Parsear JSON
app.use('/api/auth', routes); // 2. Rutas (pueden leer req.body)

// ❌ INCORRECTO
app.use('/api/auth', routes); // req.body = undefined
app.use(express.json());
```

### **Variables de Entorno Críticas**
```bash
DATABASE_URL="postgresql://..."  # Conexión PostgreSQL
JWT_SECRET="clave-secreta..."     # Firma JWT
PORT=3001                         # Puerto servidor
```

### **bcrypt Rounds: Trade-off Seguridad vs Performance**
- **8 rounds:** ~30ms (rápido, menos seguro)
- **10 rounds:** ~60-100ms (estándar industria) ← **ELEGIDO**
- **12 rounds:** ~250ms (más seguro, perceptible)
- **14 rounds:** ~1000ms (muy seguro, lento para UX)

### **JWT Payload Mínimo**
```json
{
  "userId": 1,
  "iat": 1760442066,  // Issued At (automático)
  "exp": 1760528466   // Expiration (automático)
}
```
**No incluimos:**
- ❌ Email (puede cambiar)
- ❌ Name (puede cambiar)
- ❌ Password (nunca en JWT)
- ❌ Roles/permisos (añadirlos en FASE 3 si necesario)

---

## 🔗 Enlaces Útiles

- **Repositorio GitHub:** https://github.com/Prodelaya/proyecto-daw-tests
- **bcrypt Docs:** https://www.npmjs.com/package/bcrypt
- **Express Error Handling:** https://expressjs.com/en/guide/error-handling.html
- **JWT Debugger:** https://jwt.io/
- **curl Manual:** https://curl.se/docs/manual.html

---

## 🎉 Hitos Alcanzados

- ✅ **Sistema de autenticación JWT completo y funcional**
- ✅ **Contraseñas cifradas con bcrypt (10 rounds)**
- ✅ **Validaciones Zod en todas las rutas**
- ✅ **Servidor Express profesional con middlewares de seguridad**
- ✅ **5/5 tests manuales pasados sin errores**
- ✅ **Manejo de errores robusto (404, 500)**
- ✅ **Código limpio, comentado y tipado**
- ✅ **Usuario real en PostgreSQL con password hasheado**
- ✅ **Port forwarding configurado para Prisma Studio**
- ✅ **Commit limpio y descriptivo en GitHub**

**¡60% del proyecto completado! FASE 2 TERMINADA 🚀**

---

*Última actualización: 14 de octubre de 2025 (Sesión 4)*  
*Próxima sesión: Backend - API de Tests (FASE 3)*  
*Siguiente commit: feat(backend): Implementar middleware auth y API questions*