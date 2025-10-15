# 📊 Sesión 5: FASE 3 - Backend API Questions (Parte 1)

## 🎯 Estado Previo del Proyecto

### ✅ Checkpoint al Inicio de la Sesión
- ✅ Sistema de autenticación JWT completo (register + login)
- ✅ Validaciones Zod para body (POST)
- ✅ Servidor Express funcional en puerto 3001
- ✅ 30 preguntas DWEC UT1 en PostgreSQL
- ✅ Tests autenticación pasando (5/5)

**Progreso anterior:** 60% completado

---

## 🆕 Trabajo Realizado en Esta Sesión (3h)

### **FASE 3 - Parte 1: API de Obtención de Preguntas** ✨

---

#### 25. **Middleware de Autenticación JWT** (PASO 24) ✨

**Qué hicimos:**
- Creado `backend/src/middlewares/auth.middleware.ts`
- Implementado validación de tokens JWT en peticiones protegidas
- Extendido interfaz Request con propiedad `userId`

**Para qué:**
Proteger rutas que requieren autenticación. Sin este middleware, cualquiera podría acceder a preguntas sin login.

**Cómo funciona:**
1. Extrae token del header `Authorization: Bearer <token>`
2. Valida formato correcto
3. Verifica token con `verifyToken()` de `jwt.util.ts`
4. Si válido → añade `req.userId` y llama `next()`
5. Si inválido → responde 401 Unauthorized

**Código clave:**
```typescript
// Extensión de tipos TypeScript
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      validatedQuery?: any;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      error: 'Token no proporcionado',
      message: 'Debes incluir el header Authorization: Bearer <token>'
    });
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Formato de token inválido',
      message: 'El formato debe ser: Authorization: Bearer <token>'
    });
  }
  
  const token = parts[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      error: 'Token inválido o expirado',
      message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
    });
  }
  
  req.userId = decoded.userId;
  next();
};
```

**Testing (ruta temporal `/api/protected`):**
```bash
# Test 1: Sin token → 401
curl http://localhost:3001/api/protected
# Resultado: {"error":"Token no proporcionado"}

# Test 2: Token inválido → 401
curl -H "Authorization: Bearer fake_token" http://localhost:3001/api/protected
# Resultado: {"error":"Token inválido o expirado"}

# Test 3: Token válido → 200
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@daw.com","password":"123456"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/protected
# Resultado: {"message":"✅ Acceso autorizado","userId":1}
```

**Resultado:**
- ✅ Middleware funcional y probado
- ✅ Todos los tests pasando (3/3)
- ✅ Ruta temporal borrada después de testing

**Commit:**
```
feat(backend): Implementar middleware de autenticación JWT

- Crear auth.middleware.ts con validación de tokens
- Extender interfaz Request de Express con propiedad userId
- Extraer token del header Authorization: Bearer <token>
- Verificar token con verifyToken() de jwt.util.ts
- Añadir req.userId para acceso en controllers
- Responder 401 si token ausente/inválido/expirado
- Añadir ruta temporal /api/protected para testing

Tests realizados con curl:
✅ Sin token (401)
✅ Token inválido (401)
✅ Token válido (200 + userId extraído)

Middleware auth 100% funcional y listo para API questions
```

---

#### 26. **Schemas Zod para Questions** (PASO 25) ✨

**Qué hicimos:**
- Creado `backend/src/schemas/questions.schemas.ts`
- Definido `getQuestionsSchema` (validar query params GET /questions)
- Definido `countQuestionsSchema` (validar query params GET /questions/count)
- Exportado tipos TypeScript inferidos

**Para qué:**
Validar parámetros de consulta (query params) que llegan en URLs como:
- `?subjectCode=DWEC&topicNumber=1&type=tema&limit=20`

**Reglas implementadas:**

**getQuestionsSchema:**
- `subjectCode`: string requerido, convertido a mayúsculas
- `topicNumber`: string opcional → number (transform)
- `type`: enum opcional ("tema" | "final" | "failed")
- `limit`: string opcional → number (default 20, máximo 100)

**countQuestionsSchema:**
- `subjectCode`: string requerido, convertido a mayúsculas
- `topicNumber`: string opcional → number
- `type`: enum opcional ("tema" | "final" | "failed")

**Código clave:**
```typescript
export const getQuestionsSchema = z.object({
  subjectCode: z
    .string()
    .min(1, 'El código de asignatura es requerido')
    .toUpperCase(), // DWEC, dwec → DWEC
  
  topicNumber: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : undefined) // "1" → 1
    .refine((val) => val === undefined || val > 0, {
      message: 'El número de tema debe ser mayor a 0'
    }),
  
  type: z.enum(['tema', 'final', 'failed']).optional(),
  
  limit: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 20) // Default 20
    .refine((val) => val > 0 && val <= 100, {
      message: 'El límite debe estar entre 1 y 100'
    })
});

export type GetQuestionsInput = z.infer<typeof getQuestionsSchema>;
export type CountQuestionsInput = z.infer<typeof countQuestionsSchema>;
```

**Decisiones técnicas:**
- ✅ **Transform string → number:** Query params son siempre strings en Express
- ✅ **toUpperCase():** Normalizar "dwec" → "DWEC" (como está en BD)
- ✅ **Default limit 20:** Cantidad razonable para un test
- ✅ **Máximo 100:** Evitar sobrecarga si hay muchas preguntas

**Resultado:**
- ✅ Schemas definidos con validaciones robustas
- ✅ Tipos TypeScript automáticos
- ✅ Conversiones automáticas aplicadas

---

#### 27. **Middleware validateQuery** (PASO 26) ✨

**Qué hicimos:**
- Añadido función `validateQuery()` en `validator.middleware.ts`
- Validar `req.query` en lugar de `req.body` (GET vs POST)
- Guardar datos transformados en `req.validatedQuery`

**Por qué era necesario:**
El middleware `validate()` existente validaba `req.body` (POST), pero GET /questions usa **query parameters** (`req.query`).

**Problema encontrado (Express 5):**
```typescript
req.query = result.data; // ❌ Error: Cannot set property query (read-only)
```

**Solución:**
Crear propiedad personalizada `req.validatedQuery` con datos transformados.

**Código clave:**
```typescript
// Extensión de tipos (añadir validatedQuery)
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      validatedQuery?: any; // ← NUEVO
    }
  }
}

// Middleware validateQuery
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Parámetros de consulta inválidos',
        details: result.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    // Guardar datos transformados (topicNumber: "1" → 1)
    req.validatedQuery = result.data;
    next();
  };
};
```

**Resultado:**
- ✅ Middleware para query params funcional
- ✅ Datos transformados correctamente (string → number)
- ✅ Propiedad personalizada `req.validatedQuery`

---

#### 28. **Questions Controller** (PASO 27) ✨

**Qué hicimos:**
- Creado `backend/src/controllers/questions.controller.ts`
- Implementado `getQuestions()` (obtener preguntas filtradas)
- Implementado `getQuestionsCount()` (contar preguntas disponibles)

**Para qué:**
Contener toda la lógica de negocio para consultar preguntas según filtros.

**Función getQuestions - Flujo:**
1. Extraer parámetros de `req.validatedQuery`
2. Obtener `userId` de `req.userId` (añadido por authMiddleware)
3. Construir filtros Prisma según `type`:
   - **"tema"**: Filtrar por `topicNumber`
   - **"final"**: Todas las preguntas del módulo (sin filtro topicNumber)
   - **"failed"**: Join con `UserFailedQuestion` para ese usuario
4. Consultar BD con Prisma
5. **Aleatorizar** array con Fisher-Yates shuffle
6. **Limitar** cantidad según `limit`
7. **🔴 CRÍTICO: Eliminar `correctAnswer`** (seguridad)
8. Responder con array de preguntas

**Código clave - Aleatorización:**
```typescript
// Fisher-Yates shuffle (distribución uniforme)
for (let i = questions.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [questions[i], questions[j]] = [questions[j], questions[i]];
}
```

**Código clave - Eliminar correctAnswer:**
```typescript
const questionsWithoutAnswer = limitedQuestions.map((q) => {
  const { correctAnswer, ...questionWithoutAnswer } = q;
  return questionWithoutAnswer;
});

res.status(200).json(questionsWithoutAnswer);
```

**Función getQuestionsCount - Flujo:**
1. Extraer parámetros de `req.validatedQuery`
2. Construir filtros Prisma
3. Usar `prisma.question.count()` con filtros
4. Responder con número

**Código clave - Count con filtro failed:**
```typescript
if (type === 'failed') {
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
}
```

**Decisiones técnicas:**
- ✅ **Fisher-Yates shuffle:** Algoritmo estándar O(n), distribución uniforme
- ✅ **Eliminar correctAnswer:** Evitar trampas inspeccionando Network
- ✅ **Filtro "failed" con join:** Usar relación Prisma `failedBy`
- ✅ **TypeScript assertion `!`:** `req.userId!` (authMiddleware garantiza que existe)

**Resultado:**
- ✅ Controller con lógica completa
- ✅ 3 tipos de test soportados (tema, final, failed)
- ✅ Seguridad: respuestas correctas nunca expuestas

---

#### 29. **Questions Routes** (PASO 28) ✨

**Qué hicimos:**
- Creado `backend/src/routes/questions.routes.ts`
- Conectado endpoint GET `/count` con `getQuestionsCount`
- Conectado endpoint GET `/` con `getQuestions`
- Aplicado middlewares: `validateQuery` + `authMiddleware`

**Para qué:**
Mapear URLs a funciones controller y aplicar validaciones/autenticación.

**Código clave:**
```typescript
import { Router } from 'express';
import { getQuestions, getQuestionsCount } from '../controllers/questions.controller';
import { validateQuery } from '../middlewares/validator.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getQuestionsSchema, countQuestionsSchema } from '../schemas/questions.schemas';

const router = Router();

// IMPORTANTE: /count ANTES de / (evitar que "count" se interprete como :id)
router.get('/count', validateQuery(countQuestionsSchema), authMiddleware, getQuestionsCount);
router.get('/', validateQuery(getQuestionsSchema), authMiddleware, getQuestions);

export default router;
```

**Patrón Middleware Chain:**
```
Request → validateQuery (valida) → authMiddleware (autentica) → controller (lógica)
```

**Decisiones técnicas:**
- ✅ **Orden de rutas:** `/count` antes de `/` (evitar ambigüedad con `:id`)
- ✅ **Validar antes de autenticar:** Eficiencia (rechazar datos inválidos sin verificar JWT)
- ✅ **Middleware chain:** Separación clara de responsabilidades

**Resultado:**
- ✅ Rutas registradas correctamente
- ✅ Validación + autenticación aplicadas
- ✅ Sin ambigüedades en matching de rutas

---

#### 30. **Registrar Rutas en Express** (PASO 29)

**Qué hicimos:**
- Editado `backend/src/index.ts`
- Importado `questionRoutes` de `./routes/questions.routes`
- Registrado con `app.use('/api/questions', questionRoutes)`
- Borrado ruta temporal `/api/protected`

**Código añadido:**
```typescript
// Imports
import questionRoutes from './routes/questions.routes';

// Registro de rutas
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes); // ← NUEVO
```

**Resultado:**
- ✅ Rutas accesibles en `/api/questions` y `/api/questions/count`
- ✅ Ruta temporal removida (ya cumplió propósito de testing)

---

#### 31. **Testing Completo con curl** (PASO 30) ✨

**Qué hicimos:**
Ejecutado 6 tests exhaustivos para validar toda la funcionalidad.

**Tests realizados:**

**✅ TEST 1: Contar preguntas DWEC Tema 1**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/questions/count?subjectCode=DWEC&topicNumber=1&type=tema"
```
**Resultado:** `{"count":30,"subjectCode":"DWEC","topicNumber":1,"type":"tema"}`

**✅ TEST 2: Obtener 5 preguntas (sin correctAnswer)**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/questions?subjectCode=DWEC&topicNumber=1&type=tema&limit=5"
```
**Resultado:** Array con 5 preguntas, cada una con:
- `id`, `subjectCode`, `subjectName`, `topicNumber`, `topicTitle`
- `text`, `options[]`, `explanation`, `failedCount`
- ❌ **NO contiene `correctAnswer`** (verificado con grep)

**✅ TEST 3: Test final módulo (todas las preguntas)**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/questions/count?subjectCode=DWEC&type=final"
```
**Resultado:** `{"count":30,"subjectCode":"DWEC","topicNumber":null,"type":"final"}`

**✅ TEST 4: Sin token (debe fallar)**
```bash
curl "http://localhost:3001/api/questions/count?subjectCode=DWEC"
```
**Resultado:** `{"error":"Token no proporcionado","message":"Debes incluir el header..."}`

**✅ TEST 5: Parámetros inválidos (topicNumber negativo)**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/questions?subjectCode=DWEC&topicNumber=-5&type=tema"
```
**Resultado:** `{"error":"Parámetros de consulta inválidos","details":[{"field":"topicNumber","message":"El número de tema debe ser mayor a 0"}]}`

**✅ TEST 6: Preguntas falladas (aún no hay)**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/questions/count?subjectCode=DWEC&type=failed"
```
**Resultado:** `{"count":0,"subjectCode":"DWEC","topicNumber":null,"type":"failed"}`

**Resumen de Tests:**
- ✅ 6/6 tests pasando
- ✅ Validaciones Zod funcionando
- ✅ Autenticación JWT aplicada
- ✅ Seguridad verificada (correctAnswer ausente)
- ✅ Filtros funcionando (tema, final, failed)

---

## 🐛 Problemas Encontrados y Soluciones

### Problema 1: Zod validaba req.body en lugar de req.query

**Error:**
```json
{"error":"Datos de entrada inválidos","details":[{"field":"","message":"Invalid input: expected object, received undefined"}]}
```

**Causa:**
El middleware `validate()` estaba diseñado para POST (valida `req.body`), pero GET usa query params (`req.query`).

**Solución:**
Crear middleware `validateQuery()` que valida `req.query` en lugar de `req.body`.

---

### Problema 2: topicNumber llegaba como String en lugar de Number

**Error:**
```
PrismaClientValidationError: Argument `topicNumber`: Invalid value provided. 
Expected IntFilter or Int, provided String.
topicNumber: "1"  ← String
```

**Causa:**
Aunque Zod tenía `.transform()` para convertir string → number, no estábamos usando los datos transformados.

**Solución:**
Hacer que `validateQuery` guarde los datos transformados en `req.validatedQuery` y que los controllers usen esa propiedad.

---

### Problema 3: req.query es read-only en Express 5

**Error:**
```
TypeError: Cannot set property query of #<IncomingMessage> which has only a getter
```

**Causa:**
Intentamos sobrescribir `req.query = result.data`, pero `req.query` es inmutable en Express 5.

**Solución:**
Crear propiedad personalizada `req.validatedQuery` en lugar de sobrescribir `req.query`.

**Código final:**
```typescript
// Extensión de tipos
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      validatedQuery?: any; // ← Propiedad personalizada
    }
  }
}

// En validateQuery
req.validatedQuery = result.data; // ✅ No sobrescribe req.query
```

---

### Problema 4: Git paths incorrectos desde subdirectorios

**Error:**
```bash
fatal: pathspec 'backend/src/...' did not match any files
```

**Causa:**
Ejecutar `git add backend/...` desde `/opt/proyecto-daw-tests/backend/` → Git busca `backend/backend/...`

**Solución:**
Siempre ejecutar comandos Git desde la raíz del proyecto (`/opt/proyecto-daw-tests/`).

---

## 📁 Estructura de Archivos Actualizada

```
/opt/proyecto-daw-tests/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts (sesión 4)
│   │   │   └── questions.controller.ts ✨ NUEVO
│   │   ├── routes/
│   │   │   ├── auth.routes.ts (sesión 4)
│   │   │   └── questions.routes.ts ✨ NUEVO
│   │   ├── middlewares/
│   │   │   ├── validator.middleware.ts ✨ ACTUALIZADO (añadido validateQuery)
│   │   │   └── auth.middleware.ts ✨ NUEVO
│   │   ├── schemas/
│   │   │   ├── auth.schemas.ts (sesión 3)
│   │   │   └── questions.schemas.ts ✨ NUEVO
│   │   ├── utils/
│   │   │   └── jwt.util.ts (sesión 3)
│   │   ├── seed/
│   │   │   ├── seed.ts
│   │   │   └── DWEC/dwec_ut1.json
│   │   └── index.ts ✨ ACTUALIZADO (rutas questions registradas)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── frontend/ (sin cambios)
├── docs/
│   ├── dos_primeras_sesiones.md
│   ├── session_3.md
│   ├── session_4.md
│   └── session_5.md ✨ NUEVO (este archivo)
├── .git/
├── .gitignore
└── README.md
```

---

## 🛠️ Dependencias (sin cambios en esta sesión)

Todas las dependencias necesarias ya estaban instaladas en sesiones anteriores.

---

## 📊 Progreso General del Proyecto

```
[███████████████████████████░░░░░░░░░] 70% Completado

Fases:
✅ Fase 0: Preparación entorno (100%)
✅ Fase 1: Setup inicial (100%)
✅ Fase 2: Backend Auth (100%)
🔄 Fase 3: Backend API Tests (50%) ← Sesión 5 completada
   ✅ Middleware authMiddleware
   ✅ Schemas Zod questions
   ✅ validateQuery middleware
   ✅ Controller questions (getQuestions + count)
   ✅ Routes questions
   ⏳ Controller attempts (POST /attempts)
   ⏳ Controller stats (GET /stats)
⏳ Fase 4: Frontend (0%)
⏳ Fase 5: Deploy (0%)
⏳ Fase 6: Testing (0%)
```

**Tiempo invertido total:** ~10 horas  
**Tiempo invertido hoy (Sesión 5):** ~3 horas  
**Tiempo estimado restante:** 12-15 horas  

---

## ✅ Checkpoint Actual - FASE 3

### **Parte 1: API Questions** ✅ COMPLETADA (Sesión 5)
- [x] Crear auth.middleware.ts
- [x] Probar middleware auth con ruta temporal
- [x] Crear questions.schemas.ts (Zod)
- [x] Crear validateQuery middleware
- [x] Crear questions.controller.ts (getQuestions + count)
- [x] Crear questions.routes.ts
- [x] Registrar rutas en index.ts
- [x] Probar 6 tests con curl (6/6 pasando)
- [x] Commit + push

### **Parte 2: API Attempts y Stats** 🔜 PRÓXIMO
- [ ] Crear attempts.schemas.ts
- [ ] Crear attempts.controller.ts (submitAttempt)
- [ ] Crear stats.controller.ts (getStats)
- [ ] Crear attempts.routes.ts
- [ ] Registrar rutas en index.ts
- [ ] Probar flujo completo (login → questions → submit → stats)
- [ ] Commit + push

---

## 🎯 Próximos Pasos (Sesión 6)

### Objetivo: Completar Backend (FASE 3 - Parte 2)

**1. Schemas Attempts (10 min)**
- `submitAttemptSchema` para validar body con respuestas del usuario

**2. Controller submitAttempt (1h)**
- Recibir array de respuestas: `[{ questionId, userAnswer }]`
- Consultar respuestas correctas en BD
- Calcular score (% acierto)
- Guardar intento en tabla `Attempt`
- Detectar preguntas falladas
- Guardar en `UserFailedQuestion` (relación many-to-many)
- Responder con resultados detallados

**3. Controller getStats (30 min)**
- Agregaciones con Prisma (groupBy por asignatura/tema)
- Calcular promedios de score
- Contar total de intentos
- Contar preguntas falladas pendientes
- Responder con objeto estructurado

**4. Routes Attempts (5 min)**
- POST `/attempts` → validate + auth + submitAttempt
- GET `/stats/:userId` → auth + getStats

**5. Testing end-to-end (15 min)**
- Flujo completo: login → getQuestions → submitAttempt → getStats
- Verificar que falladas se guardan correctamente
- Verificar agregaciones de stats

**Tiempo estimado total:** ~2 horas

---

## 💡 Lecciones Aprendidas en Esta Sesión

### 1. Express 5 tiene propiedades read-only
**Problema:** `req.query` es inmutable  
**Solución:** Crear propiedades personalizadas (`req.validatedQuery`)  
**Lección:** Siempre respetar las restricciones del framework

### 2. Query params son siempre strings
**Problema:** `topicNumber: "1"` (string) vs BD espera `number`  
**Solución:** Zod transforms con `.transform(val => parseInt(val, 10))`  
**Lección:** Validar Y transformar datos de entrada

### 3. Fisher-Yates shuffle para aleatorización
**Código:**
```typescript
for (let i = array.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [array[i], array[j]] = [array[j], array[i]];
}
```
**Lección:** Usar algoritmos estándar probados (O(n), distribución uniforme)

### 4. Seguridad: nunca exponer respuestas correctas
**Código:**
```typescript
const { correctAnswer, ...rest } = question;
return rest;
```
**Lección:** Destructuring para eliminar campos sensibles antes de responder

### 5. Orden de rutas importa en Express
**Problema:** `/count` después de `/` → matchea como `:id`  
**Solución:** Rutas específicas antes de rutas genéricas  
**Lección:** Express evalúa rutas secuencialmente de arriba hacia abajo

### 6. Middleware chain para separación de responsabilidades
**Patrón:**
```typescript
router.get('/', validateQuery(schema), authMiddleware, controller);
```
**Lección:** Cada middleware tiene una responsabilidad (validar, autenticar, ejecutar)

### 7. TypeScript assertion con `!`
**Código:**
```typescript
const userId = req.userId!; // Garantizado por authMiddleware
```
**Lección:** Usar `!` solo cuando tienes certeza lógica (middleware previo garantiza existencia)

### 8. Git siempre desde la raíz del proyecto
**Mejor práctica:** `cd /opt/proyecto-daw-tests` antes de cualquier comando Git  
**Lección:** Consistencia en rutas evita errores

---

## 🔗 Enlaces Útiles

- **Repositorio GitHub:** https://github.com/Prodelaya/proyecto-daw-tests
- **Zod Transforms:** https://zod.dev/?id=transform
- **Fisher-Yates Shuffle:** https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
- **Express Middleware:** https://expressjs.com/en/guide/using-middleware.html
- **Prisma Relations:** https://www.prisma.io/docs/concepts/components/prisma-schema/relations

---

## 🎉 Hitos Alcanzados

- ✅ **Middleware de autenticación JWT funcional y probado**
- ✅ **API de preguntas completa (GET /questions + /count)**
- ✅ **3 tipos de test soportados (tema, final, failed)**
- ✅ **Validación robusta con Zod (query params + transforms)**
- ✅ **Seguridad garantizada (correctAnswer nunca expuesto)**
- ✅ **Aleatorización con algoritmo estándar (Fisher-Yates)**
- ✅ **6/6 tests manuales pasados sin errores**
- ✅ **3 problemas técnicos resueltos (req.query read-only, types, transforms)**
- ✅ **70% del proyecto total completado**

**¡Primera mitad de FASE 3 completada! Backend casi terminado 🚀**

---

## 📝 Commit Final de la Sesión

```bash
git commit -m "feat(backend): Implementar API de preguntas (GET /questions)

- Crear questions.schemas.ts (validación Zod con transforms)
- Crear questions.controller.ts (getQuestions + getQuestionsCount)
- Crear questions.routes.ts (rutas protegidas con auth)
- Añadir validateQuery middleware para query params
- Extender Request con validatedQuery y userId
- Registrar rutas /api/questions en index.ts
- Implementar filtros: tema, final, failed
- Aleatorizar preguntas con Fisher-Yates shuffle
- CRÍTICO: Eliminar correctAnswer de respuesta (seguridad)

Tipos de test soportados:
- tema: Preguntas de un tema específico
- final: Todas las preguntas del módulo
- failed: Solo preguntas falladas por el usuario

Tests realizados con curl:
✅ Count DWEC Tema 1 (30 preguntas)
✅ Obtener preguntas aleatorizadas
✅ Verificar ausencia de correctAnswer
✅ Autenticación JWT funcional
✅ Validación de parámetros (400)
✅ Test final módulo (count 30)
✅ Test falladas (count 0)

API Questions 100% funcional"
```

---

## 📋 Comandos Ejecutados en Esta Sesión

### Setup y navegación
```bash
cd /opt/proyecto-daw-tests/backend
npm run dev
```

### Testing con curl
```bash
# Obtener token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@daw.com","password":"123456"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Test count
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/questions/count?subjectCode=DWEC&topicNumber=1&type=tema"

# Test get questions
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/questions?subjectCode=DWEC&topicNumber=1&type=tema&limit=5"

# Verificar ausencia de correctAnswer
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/questions?subjectCode=DWEC&topicNumber=1&type=tema&limit=1" \
  | grep -o "correctAnswer"
# (Vacío = correcto)
```

### Git commands
```bash
cd /opt/proyecto-daw-tests

git add backend/src/schemas/questions.schemas.ts
git add backend/src/controllers/questions.controller.ts
git add backend/src/routes/questions.routes.ts
git add backend/src/middlewares/validator.middleware.ts
git add backend/src/middlewares/auth.middleware.ts
git add backend/src/index.ts

git status
git commit -m "..."
git push origin main
```

---

## 🔧 Debugging Tips Aprendidos

### 1. Ver logs del servidor
Cuando un test falla con 500, siempre revisar la terminal donde corre `npm run dev`:
```
Error en getQuestions: PrismaClientValidationError...
```

### 2. Verificar tipos transformados
Añadir console.log temporal en controller:
```typescript
console.log('topicNumber type:', typeof topicNumber); // Debe ser "number"
```

### 3. Probar middleware aislado
Crear ruta temporal para probar middleware antes de construir todo el flujo:
```typescript
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ userId: req.userId });
});
```

### 4. Usar python3 -m json.tool para formatear
```bash
curl ... | python3 -m json.tool
```

### 5. Grep para verificar ausencia de campos
```bash
curl ... | grep -o "correctAnswer"
# Si no imprime nada = correcto
```

---

## 📊 Métricas de la Sesión

| Métrica | Valor |
|---------|-------|
| **Duración** | 3 horas |
| **Archivos creados** | 3 (auth.middleware, questions.controller, questions.routes, questions.schemas) |
| **Archivos modificados** | 2 (validator.middleware, index.ts) |
| **Líneas de código** | ~400 líneas |
| **Tests ejecutados** | 6 (todos pasando) |
| **Problemas resueltos** | 4 (req.body vs req.query, string vs number, req.query read-only, git paths) |
| **Commits** | 2 (auth middleware + API questions) |
| **Endpoints funcionales** | 2 (GET /questions, GET /questions/count) |
| **Progreso del proyecto** | 60% → 70% |

---

## 🎓 Conceptos Técnicos Aplicados

### Backend
- ✅ Middleware chains en Express
- ✅ Validación avanzada con Zod (transforms, refine)
- ✅ Prisma queries con filtros dinámicos
- ✅ Prisma relations (failedBy.some)
- ✅ JWT authentication flow
- ✅ TypeScript interface extension
- ✅ Error handling con try-catch
- ✅ Fisher-Yates shuffle algorithm

### Seguridad
- ✅ Token JWT en headers (Authorization: Bearer)
- ✅ Eliminar campos sensibles antes de responder
- ✅ Validación de entrada (prevenir injection)
- ✅ Middleware de autenticación en rutas protegidas

### Buenas Prácticas
- ✅ Separation of Concerns (routes/controllers/middlewares)
- ✅ DRY con middleware reutilizable
- ✅ Naming conventions claras
- ✅ Comentarios explicativos en código complejo
- ✅ Testing incremental antes de integrar
- ✅ Commits atómicos con mensajes descriptivos

---

## 📖 Documentación de Endpoints

### GET /api/questions

**Descripción:** Obtiene preguntas filtradas y aleatorizadas

**Headers:**
```
Authorization: Bearer <token>
```

**Query Params:**
- `subjectCode` (string, required): Código de asignatura (ej: "DWEC")
- `topicNumber` (number, optional): Número de tema (ej: 1)
- `type` (enum, optional): "tema" | "final" | "failed"
- `limit` (number, optional): Cantidad de preguntas (default: 20, max: 100)

**Respuesta 200:**
```json
[
  {
    "id": 17,
    "subjectCode": "DWEC",
    "subjectName": "Desarrollo Web en Entorno Cliente",
    "topicNumber": 1,
    "topicTitle": "Introducción al Desarrollo Web...",
    "text": "¿Qué describe mejor el modelo cliente-servidor?",
    "options": ["...", "...", "...", "..."],
    "explanation": "Patrón request–response...",
    "failedCount": 0
  }
]
```

**Respuesta 401:**
```json
{
  "error": "Token no proporcionado",
  "message": "Debes incluir el header Authorization: Bearer <token>"
}
```

**Respuesta 400:**
```json
{
  "error": "Parámetros de consulta inválidos",
  "details": [
    {
      "field": "topicNumber",
      "message": "El número de tema debe ser mayor a 0"
    }
  ]
}
```

---

### GET /api/questions/count

**Descripción:** Cuenta preguntas disponibles según filtros

**Headers:**
```
Authorization: Bearer <token>
```

**Query Params:**
- `subjectCode` (string, required): Código de asignatura
- `topicNumber` (number, optional): Número de tema
- `type` (enum, optional): "tema" | "final" | "failed"

**Respuesta 200:**
```json
{
  "count": 30,
  "subjectCode": "DWEC",
  "topicNumber": 1,
  "type": "tema"
}
```

---

## 🚀 Resumen Ejecutivo

### ¿Qué se logró?
✅ Sistema completo de obtención de preguntas con 3 modos de test  
✅ Seguridad robusta (JWT + eliminación de respuestas correctas)  
✅ Validaciones exhaustivas (Zod con transforms)  
✅ 6/6 tests manuales pasados sin errores  

### ¿Qué falta?
⏳ Sistema de envío de respuestas (submitAttempt)  
⏳ Sistema de estadísticas (getStats)  
⏳ Frontend completo  
⏳ Deploy en producción  

### ¿Cuándo estará listo el backend?
**Próxima sesión (2h):** Completar submitAttempt + getStats  
**Backend 100% funcional:** Final de próxima sesión  

---

*Última actualización: 15 de octubre de 2025 (Sesión 5)*  
*Próxima sesión: Backend - API Attempts y Stats (FASE 3 Parte 2)*  
*Siguiente commit: feat(backend): Implementar submitAttempt y getStats*