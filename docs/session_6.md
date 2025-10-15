# 📊 Sesión 6: FASE 3 - Backend API Attempts y Stats (Parte 2)

## 🎯 Estado Previo del Proyecto

### ✅ Checkpoint al Inicio de la Sesión
- ✅ Sistema de autenticación JWT completo (register + login)
- ✅ API Questions funcional (GET /questions + /count)
- ✅ Middleware authMiddleware (validar JWT)
- ✅ Validaciones Zod para body y query params
- ✅ 30 preguntas DWEC UT1 en PostgreSQL
- ✅ Servidor Express funcional en puerto 3001

**Progreso anterior:** 70% completado

---

## 🆕 Trabajo Realizado en Esta Sesión (3-4h)

### **FASE 3 - Parte 2: API de Attempts y Estadísticas** ✨

---

## 📦 PASO 32: Schemas Zod para Attempts (10 min)

### **Archivo creado:** `backend/src/schemas/attempts.schemas.ts`

**Qué validamos:**
```typescript
// Schema para una respuesta individual
const answerSchema = z.object({
  questionId: z.number().int().positive(),
  userAnswer: z.string().min(1)
});

// Schema principal
export const submitAttemptSchema = z.object({
  subjectCode: z.string().min(1).toUpperCase(),
  topicNumber: z.number().int().positive().optional().nullable(),
  answers: z.array(answerSchema).min(1).max(100)
});

export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
export type Answer = z.infer<typeof answerSchema>;
```

**Decisiones técnicas:**
- ✅ **Schema anidado** (`answerSchema`) para reutilización
- ✅ **`.toUpperCase()`** normaliza "dwec" → "DWEC"
- ✅ **`.optional().nullable()`** para topicNumber (null en tests finales)
- ✅ **`.min(1).max(100)`** en array de answers (límite de seguridad)

---

## 📦 PASO 33: Controller submitAttempt (1h)

### **Archivo creado:** `backend/src/controllers/attempts.controller.ts`

**Función principal:** Procesar intento del usuario (10 pasos)

### **Flujo Completo:**

```typescript
export const submitAttempt = async (req: Request, res: Response) => {
  try {
    // PASO 1: Extraer datos
    const userId = req.userId!;
    const { subjectCode, topicNumber, answers } = req.body as SubmitAttemptInput;
    
    // PASO 2: Obtener array de IDs
    const questionIds = answers.map(answer => answer.questionId);
    
    // PASO 3: Consultar preguntas en BD
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } }
    });
    
    // PASO 4: Crear Map para acceso O(1)
    const questionsMap = new Map(questions.map(q => [q.id, q]));
    
    // PASO 5: Comparar respuestas
    const results = answers.map(answer => {
      const question = questionsMap.get(answer.questionId);
      if (!question) throw new Error(`Pregunta ${answer.questionId} no encontrada`);
      
      const isCorrect = answer.userAnswer.trim() === question.correctAnswer.trim();
      
      return {
        questionId: question.id,
        userAnswer: answer.userAnswer,
        correctAnswer: question.correctAnswer,
        correct: isCorrect,
        explanation: question.explanation
      };
    });
    
    // PASO 6: Calcular score
    const correctCount = results.filter(r => r.correct).length;
    const totalCount = results.length;
    const score = Math.round((correctCount / totalCount) * 100);
    
    // PASO 7: Guardar intento en BD
    await prisma.attempt.create({
      data: {
        userId,
        subjectCode,
        topicNumber,
        score,
        answers: results // JSON completo
      }
    });
    
    // PASO 8: Detectar preguntas falladas
    const failedQuestionIds = results
      .filter(r => !r.correct)
      .map(r => r.questionId);
    
    // PASO 9: Guardar falladas en UserFailedQuestion
    if (failedQuestionIds.length > 0) {
      await prisma.userFailedQuestion.createMany({
        data: failedQuestionIds.map(questionId => ({
          userId,
          questionId
        })),
        skipDuplicates: true // ← CLAVE: Evita duplicados
      });
    }
    
    // PASO 10: Responder con resultados
    res.status(200).json({
      score,
      correct: correctCount,
      total: totalCount,
      results
    });
    
  } catch (error) {
    console.error('Error en submitAttempt:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
```

### **Decisiones Técnicas Clave:**

#### **1. Map para acceso O(1)**
```typescript
// ❌ Sin Map: O(n²)
answers.forEach(answer => {
  const question = questions.find(q => q.id === answer.questionId); // Lento
});

// ✅ Con Map: O(n)
const questionsMap = new Map(questions.map(q => [q.id, q]));
answers.forEach(answer => {
  const question = questionsMap.get(answer.questionId); // Rápido
});
```

**Complejidad:**
- Crear Map: O(n)
- Acceder por cada respuesta: O(1) × n = O(n)
- **Total: O(n)** vs O(n²) con find()

---

#### **2. skipDuplicates en UserFailedQuestion**

```typescript
await prisma.userFailedQuestion.createMany({
  data: [...],
  skipDuplicates: true // ← CRÍTICO
});
```

**¿Por qué es necesario?**

**Escenario:**
1. Usuario hace test 1 → falla pregunta 5 → se guarda `(userId=1, questionId=5)`
2. Usuario hace test 2 → vuelve a fallar pregunta 5 → intenta guardar `(userId=1, questionId=5)` de nuevo

**Sin `skipDuplicates`:**
```
Error: Unique constraint failed on (userId, questionId)
```

**Con `skipDuplicates: true`:**
```
✅ Ignora el duplicado silenciosamente
✅ La pregunta sigue marcada como fallada (no se duplica)
```

**Tabla `UserFailedQuestion` tiene PK compuesta:**
```prisma
@@id([userId, questionId])
```

---

#### **3. JSON vs Tabla Separada para answers**

**Opción A (elegida):** `answers: Json` en tabla Attempt

**Ventajas:**
- ✅ Simplicidad (menos joins)
- ✅ Auditoría completa en un solo registro
- ✅ Inmutable (aunque cambie la explicación, el intento histórico queda igual)

**Desventajas:**
- ❌ No puedes hacer queries SQL sobre respuestas individuales
- ❌ Menos normalización

**Para DAW:** JSON suficiente (no consultaremos "cuántas veces se eligió opción B")

---

#### **4. Comparación con .trim()**

```typescript
const isCorrect = answer.userAnswer.trim() === question.correctAnswer.trim();
```

**¿Por qué `.trim()`?**
```javascript
// Sin trim
"HTTP" === "HTTP " → false (fallo injusto)

// Con trim
"HTTP".trim() === "HTTP ".trim() → true (justo)
```

---

## 📦 PASO 34: Controller getStats (30 min)

### **Función:** Obtener estadísticas agregadas

```typescript
export const getStats = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    
    // Obtener todos los intentos
    const attempts = await prisma.attempt.findMany({
      where: { userId },
      orderBy: { answeredAt: 'desc' }
    });
    
    // Agrupar por asignatura y tema
    const grouped = attempts.reduce((acc, attempt) => {
      const key = `${attempt.subjectCode}-${attempt.topicNumber || 'final'}`;
      
      if (!acc[key]) {
        acc[key] = {
          subjectCode: attempt.subjectCode,
          topicNumber: attempt.topicNumber,
          attempts: [],
          scores: []
        };
      }
      
      acc[key].attempts.push(attempt);
      acc[key].scores.push(attempt.score);
      
      return acc;
    }, {} as Record<string, any>);
    
    // Calcular promedios
    const stats = Object.values(grouped).map((group: any) => {
      const avgScore = group.scores.reduce((sum: number, score: number) => 
        sum + score, 0) / group.scores.length;
      
      return {
        subjectCode: group.subjectCode,
        topicNumber: group.topicNumber,
        totalAttempts: group.attempts.length,
        avgScore: Math.round(avgScore)
      };
    });
    
    // Contar preguntas falladas
    const failedCount = await prisma.userFailedQuestion.count({
      where: { userId }
    });
    
    res.status(200).json({
      stats,
      totalFailedQuestions: failedCount
    });
    
  } catch (error) {
    console.error('Error en getStats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
```

### **Trade-off: Agregación Manual vs Prisma groupBy**

**Opción A (elegida):** `reduce` manual
```typescript
const grouped = attempts.reduce((acc, attempt) => { ... });
```

**Opción B:** Prisma groupBy
```typescript
const stats = await prisma.attempt.groupBy({
  by: ['subjectCode', 'topicNumber'],
  _avg: { score: true },
  _count: true
});
```

**Decisión: Opción A**
- ✅ **Pro:** Más control sobre estructura final
- ✅ **Pro:** Más flexible (fácil añadir campos calculados)
- ❌ **Contra:** Menos eficiente con millones de registros
- ❌ **Contra:** Lógica en JavaScript en vez de SQL

**Para DAW:** Un usuario no tendrá 10,000 intentos → Opción A suficiente

---

## 📦 PASO 35: Routes Attempts (5 min)

### **Archivo creado:** `backend/src/routes/attempts.routes.ts`

```typescript
import { Router } from 'express';
import { submitAttempt, getStats } from '../controllers/attempts.controller';
import { validate } from '../middlewares/validator.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { submitAttemptSchema } from '../schemas/attempts.schemas';

const router = Router();

// POST /api/attempts
router.post('/', validate(submitAttemptSchema), authMiddleware, submitAttempt);

// GET /api/attempts/stats
router.get('/stats', authMiddleware, getStats);

export default router;
```

**Orden de middlewares:**
```
Request → validate → authMiddleware → controller → Response
```

**¿Por qué validate ANTES de auth?**
- ✅ Eficiencia: rechazamos datos inválidos antes de verificar JWT
- ✅ Seguridad: evitamos validar token innecesariamente

**¿Por qué `/stats` antes de `/:id`?**
- Express evalúa rutas secuencialmente
- Si `/:id` estuviera primero, matchearía "stats" como un parámetro
- Rutas específicas SIEMPRE antes de genéricas

---

## 📦 PASO 36: Registrar Rutas en Express (5 min)

### **Archivo editado:** `backend/src/index.ts`

**Import añadido:**
```typescript
import attemptRoutes from './routes/attempts.routes';
```

**Registro añadido:**
```typescript
app.use('/api/attempts', attemptRoutes);
```

**Endpoints disponibles ahora:**
```
POST /api/attempts        → submitAttempt
GET  /api/attempts/stats  → getStats
```

---

## 🧪 PASO 37: Testing End-to-End (20 min)

### **TEST 1: Login y obtener token** ✅

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@daw.com","password":"123456"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token obtenido: $TOKEN"
```

**Resultado:**
```
Token obtenido: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### **TEST 2: Obtener 3 preguntas** ✅

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/questions?subjectCode=DWEC&topicNumber=1&type=tema&limit=3" \
  | python3 -m json.tool > preguntas_test.json
```

**Resultado:** Array con 3 preguntas (IDs: 8, 16, 27)
- ✅ Sin campo `correctAnswer` (seguridad)
- ✅ Incluye `options`, `explanation`, `text`

---

### **TEST 3: Enviar intento (2 correctas, 1 incorrecta)** ✅

```bash
curl -X POST http://localhost:3001/api/attempts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectCode": "DWEC",
    "topicNumber": 1,
    "answers": [
      {
        "questionId": 8,
        "userAnswer": "Los clientes no acceden a recursos ni servicios alojados"
      },
      {
        "questionId": 16,
        "userAnswer": "RESPUESTA_INCORRECTA"
      },
      {
        "questionId": 27,
        "userAnswer": "HTTP"
      }
    ]
  }' | python3 -m json.tool
```

**Resultado:**
```json
{
  "score": 67,
  "correct": 2,
  "total": 3,
  "results": [
    {
      "questionId": 8,
      "userAnswer": "Los clientes no acceden...",
      "correctAnswer": "Los clientes no acceden...",
      "correct": true,
      "explanation": "Sin backend disponible..."
    },
    {
      "questionId": 16,
      "userAnswer": "RESPUESTA_INCORRECTA",
      "correctAnswer": "En el servidor antes de procesar...",
      "correct": false,
      "explanation": "El backend valida credenciales..."
    },
    {
      "questionId": 27,
      "userAnswer": "HTTP",
      "correctAnswer": "HTTP",
      "correct": true,
      "explanation": "El intercambio de peticiones..."
    }
  ]
}
```

**✅ Verificaciones:**
- Score = 67% (2 de 3 correctas)
- Cada resultado incluye todas las propiedades necesarias
- Frontend puede mostrar pantalla de resultados detallada

---

### **TEST 4: Ver estadísticas** ✅

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/attempts/stats" \
  | python3 -m json.tool
```

**Resultado:**
```json
{
  "stats": [
    {
      "subjectCode": "DWEC",
      "topicNumber": 1,
      "totalAttempts": 1,
      "avgScore": 67
    }
  ],
  "totalFailedQuestions": 1
}
```

**✅ Verificaciones:**
- `totalAttempts: 1` (el intento enviado)
- `avgScore: 67` (mismo que el intento)
- `totalFailedQuestions: 1` (pregunta 16 fallada)

---

### **TEST 5: Verificar en Prisma Studio** ✅

**Configuración port forwarding:**
```bash
ssh -p 1492 -L 5555:localhost:5555 laya92@192.168.1.130
```

**Abrir Prisma Studio:**
```bash
npx prisma studio
# http://localhost:5555
```

**Tabla `Attempt`:**
- ✅ 1 registro nuevo
- ✅ `userId: 1`
- ✅ `subjectCode: "DWEC"`
- ✅ `topicNumber: 1`
- ✅ `score: 67`
- ✅ `answers: [...]` (JSON con 3 objetos)

**Tabla `UserFailedQuestion`:**
- ✅ 1 registro
- ✅ `userId: 1`
- ✅ `questionId: 16`

---

### **TEST 6: Test de preguntas falladas** ✅

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/questions?subjectCode=DWEC&type=failed&limit=10" \
  | python3 -m json.tool
```

**Resultado:**
```json
[
  {
    "id": 16,
    "subjectCode": "DWEC",
    "text": "Un proveedor de API quiere controlar...",
    "options": ["...", "...", "...", "..."],
    "explanation": "El backend valida credenciales...",
    "failedCount": 0
  }
]
```

**✅ Verificaciones:**
- Solo devuelve pregunta 16 (la que fallamos)
- NO incluye `correctAnswer` (seguridad)
- Usuario puede hacer test de repaso con sus falladas

---

## 🐛 Problemas Encontrados y Soluciones

### **Problema 1: Rutas no reconocidas (404)**

**Error:**
```json
{
  "error": "Ruta no encontrada",
  "path": "/api/attempts"
}
```

**Causa:**
Servidor no reiniciado después de añadir rutas en `index.ts`

**Solución:**
1. Ctrl+C en servidor
2. `npm run dev` de nuevo
3. Verificar que el import y registro están presentes

---

### **Problema 2: Token expirado en TEST 6**

**Error:**
```json
{
  "error": "Formato de token inválido"
}
```

**Causa:**
Variable `$TOKEN` vacía (token expiró o shell reiniciada)

**Solución:**
Hacer login de nuevo para obtener token fresco:
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login ...)
```

---

## 📦 PASO 38: Commit + Push a GitHub

### **Archivos commiteados:**
```bash
git add backend/src/schemas/attempts.schemas.ts
git add backend/src/controllers/attempts.controller.ts
git add backend/src/routes/attempts.routes.ts
git add backend/src/index.ts
```

### **Mensaje de commit:**
```
feat(backend): Completar API attempts y stats - FASE 3 finalizada

- Crear attempts.schemas.ts (validación submitAttempt con Zod)
- Implementar attempts.controller.ts:
  - submitAttempt: comparar respuestas, calcular score, guardar intento
  - Detectar y guardar preguntas falladas con skipDuplicates
  - getStats: agregar intentos por asignatura/tema, calcular promedios
- Crear attempts.routes.ts (POST /attempts, GET /stats)
- Registrar rutas en index.ts

Lógica implementada:
✅ Comparación de respuestas con Map O(1)
✅ Cálculo de score (porcentaje redondeado)
✅ Guardado de intento con JSON completo en campo answers
✅ Detección automática de preguntas falladas
✅ Guardado en UserFailedQuestion con skipDuplicates
✅ Agregación manual con reduce para stats
✅ Contador de preguntas falladas totales

Tests realizados con curl (6/6 pasados):
✅ Envío de intento (score 67%, 2/3 correctas)
✅ Pregunta fallada guardada (questionId 16)
✅ Stats devuelve 1 intento, avgScore 67, 1 fallada
✅ Test de falladas devuelve solo pregunta 16
✅ Verificado en Prisma Studio
✅ Seguridad: correctAnswer nunca expuesto

Backend API 100% funcional - Proyecto 80% completado
```

### **Push exitoso:**
```bash
git push origin main
```

---

## 📁 Estructura de Archivos Actualizada

```
/opt/proyecto-daw-tests/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts (sesión 4)
│   │   │   ├── questions.controller.ts (sesión 5)
│   │   │   └── attempts.controller.ts ✨ NUEVO
│   │   ├── routes/
│   │   │   ├── auth.routes.ts (sesión 4)
│   │   │   ├── questions.routes.ts (sesión 5)
│   │   │   └── attempts.routes.ts ✨ NUEVO
│   │   ├── middlewares/
│   │   │   ├── validator.middleware.ts (sesión 3)
│   │   │   └── auth.middleware.ts (sesión 5)
│   │   ├── schemas/
│   │   │   ├── auth.schemas.ts (sesión 3)
│   │   │   ├── questions.schemas.ts (sesión 5)
│   │   │   └── attempts.schemas.ts ✨ NUEVO
│   │   ├── utils/
│   │   │   └── jwt.util.ts (sesión 3)
│   │   ├── seed/
│   │   │   ├── seed.ts
│   │   │   └── DWEC/dwec_ut1.json
│   │   └── index.ts ✨ ACTUALIZADO
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── frontend/ (sin cambios - próxima fase)
├── docs/
│   ├── dos_primeras_sesiones.md
│   ├── session_3.md
│   ├── session_4.md
│   ├── session_5.md
│   └── session_6.md ✨ NUEVO (este archivo)
└── .git/
```

---

## 📊 Progreso General del Proyecto

```
[████████████████████████████████░░░░] 80% Completado

Fases:
✅ Fase 0: Preparación entorno (100%)
✅ Fase 1: Setup inicial (100%)
✅ Fase 2: Backend Auth (100%)
✅ Fase 3: Backend API Tests (100%) ← ✨ COMPLETADA
⏳ Fase 4: Frontend (0%)
⏳ Fase 5: Deploy (0%)
⏳ Fase 6: Testing + Docs (0%)
```

**Tiempo invertido total:** ~12 horas  
**Tiempo invertido hoy (Sesión 6):** ~3-4 horas  
**Tiempo estimado restante:** 10-12 horas  

---

## 🎉 Hitos Alcanzados

- ✅ **Schema attempts con validaciones robustas (nested schema)**
- ✅ **Controller submitAttempt con lógica compleja (10 pasos)**
- ✅ **Optimización con Map para acceso O(1)**
- ✅ **Sistema automático de detección de preguntas falladas**
- ✅ **skipDuplicates para evitar errores de PK compuesta**
- ✅ **Controller getStats con agregaciones manuales (reduce)**
- ✅ **Routes attempts conectadas correctamente**
- ✅ **6/6 tests end-to-end pasados sin errores**
- ✅ **Datos verificados en Prisma Studio**
- ✅ **Backend 100% funcional y probado**
- ✅ **Commit limpio y descriptivo**
- ✅ **Push exitoso a GitHub**

---

## 💡 Conceptos Técnicos Aplicados

### **Backend**
- ✅ Validación avanzada con Zod (nested schemas, transforms)
- ✅ Optimización de algoritmos (Map O(1) vs find O(n))
- ✅ Prisma createMany con skipDuplicates
- ✅ Agregación manual con reduce
- ✅ Manejo de JSON en PostgreSQL
- ✅ Middleware chains en Express
- ✅ Type assertions en TypeScript

### **Base de Datos**
- ✅ Primary Key compuesta (@@id([userId, questionId]))
- ✅ Relaciones many-to-many
- ✅ Campos JSON para datos complejos
- ✅ ON CONFLICT DO NOTHING (skipDuplicates)

### **Testing**
- ✅ Tests end-to-end con curl
- ✅ Verificación en Prisma Studio
- ✅ Port forwarding para herramientas remotas

### **Buenas Prácticas**
- ✅ Comentarios explicativos en lógica compleja
- ✅ Commits descriptivos con contexto completo
- ✅ Testing incremental (cada endpoint antes de continuar)
- ✅ Separación de responsabilidades (MVC)
- ✅ Trade-offs documentados

---

## 🎓 Lecciones Aprendidas

### **1. Complejidad Algorítmica Importa**
```typescript
// ❌ O(n²): 20 respuestas × 20 búsquedas = 400 operaciones
answers.forEach(answer => {
  const question = questions.find(q => q.id === answer.questionId);
});

// ✅ O(n): 20 construcción map + 20 accesos = 40 operaciones
const map = new Map(questions.map(q => [q.id, q]));
answers.forEach(answer => {
  const question = map.get(answer.questionId);
});
```

### **2. skipDuplicates es Esencial con PKs Compuestas**
Sin `skipDuplicates`, cada vez que un usuario vuelve a fallar la misma pregunta, el backend crashearía con error de constraint.

### **3. Agregación Manual vs Query Builder**
- **Manual (reduce):** Más control, menos eficiente en escala masiva
- **Prisma groupBy:** Más eficiente, menos flexible

**Para DAW:** Manual suficiente (un usuario no tendrá 10,000 intentos)

### **4. JSON vs Tabla Normalizada**
- **JSON:** Simplicidad, auditoría completa, inmutabilidad
- **Tabla:** Normalización, queries granulares, eficiencia

**Para DAW:** JSON correcto (no consultamos respuestas individuales frecuentemente)

### **5. Reiniciar Servidor Tras Cambios en Routes**
Express carga rutas al iniciar. Añadir `app.use()` sin reiniciar = ruta no reconocida.

---

## 📖 Documentación de Endpoints

### **POST /api/attempts**

**Descripción:** Enviar intento de test completo

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "subjectCode": "DWEC",
  "topicNumber": 1,
  "answers": [
    { "questionId": 1, "userAnswer": "HTTP" },
    { "questionId": 2, "userAnswer": "..." }
  ]
}
```

**Respuesta 200:**
```json
{
  "score": 85,
  "correct": 17,
  "total": 20,
  "results": [
    {
      "questionId": 1,
      "userAnswer": "HTTP",
      "correctAnswer": "HTTP",
      "correct": true,
      "explanation": "HTTP/HTTPS es el protocolo..."
    }
  ]
}
```

---

### **GET /api/attempts/stats**

**Descripción:** Obtener estadísticas agregadas del usuario

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta 200:**
```json
{
  "stats": [
    {
      "subjectCode": "DWEC",
      "topicNumber": 1,
      "totalAttempts": 5,
      "avgScore": 85
    }
  ],
  "totalFailedQuestions": 12
}
```

---

## 🚀 Próxima Sesión: FASE 4 - Frontend (5-6h)

### **Objetivos:**

1. **Estructura base** (1h)
   - Carpetas: components/, pages/, context/, services/, types/, hooks/
   - Tipos TypeScript (User, Question, Attempt, Stats)

2. **Servicio API** (30 min)
   - axios con interceptor JWT
   - Funciones: login, register, getQuestions, submitAttempt, getStats

3. **AuthContext** (30 min)
   - Login/logout
   - Persistencia en localStorage
   - Estado global de usuario

4. **Páginas principales** (2h)
   - Login/Register
   - Dashboard (elegir tipo de test)
   - TestConfig (elegir cantidad de preguntas)
   - TestView (responder test + pantalla de resultados)
   - Stats (estadísticas por asignatura/tema)

5. **Componentes reutilizables** (1h)
   - Button
   - QuestionCard
   - LoadingSpinner
   - PrivateRoute

6. **React Router** (30 min)
   - Configurar rutas
   - Rutas protegidas
   - Navegación

---

## 📊 Métricas de la Sesión

| Métrica | Valor |
|---------|-------|
| **Duración** | 3-4 horas |
| **Archivos creados** | 3 (attempts.schemas, attempts.controller, attempts.routes) |
| **Archivos modificados** | 1 (index.ts) |
| **Líneas de código** | ~250 líneas |
| **Tests ejecutados** | 6 (todos pasando) |
| **Problemas resueltos** | 2 (servidor no reiniciado, token expirado) |
| **Commits** | 1 (descriptivo y completo) |
| **Endpoints funcionales** | 2 (POST /attempts, GET /stats) |
| **Progreso del proyecto** | 70% → 80% |

---

## 🔗 Enlaces Útiles

- **Repositorio GitHub:** https://github.com/Prodelaya/proyecto-daw-tests
- **Prisma Docs - createMany:** https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#createmany
- **Zod Nested Schemas:** https://zod.dev/?id=objects
- **JavaScript Map:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
- **Array.reduce():** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce

---

## 📝 Comandos Ejecutados en Esta Sesión

### **Crear archivos**
```bash
cd /opt/proyecto-daw-tests/backend/src

# Schemas
nano schemas/attempts.schemas.ts

# Controller
nano controllers/attempts.controller.ts

# Routes
nano routes/attempts.routes.ts

# Editar index.ts
nano index.ts
```

### **Testing con curl**
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@daw.com","password":"123456"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Obtener preguntas
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/questions?subjectCode=DWEC&topicNumber=1&type=tema&limit=3" \
  | python3 -m json.tool > preguntas_test.json

# Enviar intento
curl -X POST http://localhost:3001/api/attempts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}' | python3 -m json.tool

# Ver stats
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/attempts/stats" \
  | python3 -m json.tool

# Test falladas
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/questions?subjectCode=DWEC&type=failed&limit=10" \
  | python3 -m json.tool
```

### **Prisma Studio**
```bash
cd /opt/proyecto-daw-tests/backend
npx prisma studio
```

### **Git commands**
```bash
cd /opt/proyecto-daw-tests

git status
git add backend/src/schemas/attempts.schemas.ts
git add backend/src/controllers/attempts.controller.ts
git add backend/src/routes/attempts.routes.ts
git add backend/src/index.ts

git commit -m "feat(backend): Completar API attempts y stats..."
git push origin main
```

---

## 🔧 Debugging Tips

### **1. Error 404 en rutas nuevas**
```bash
# Verificar que el import existe
grep "attemptRoutes" backend/src/index.ts

# Verificar que el archivo existe
ls -la backend/src/routes/attempts.routes.ts

# Solución: Reiniciar servidor
# Ctrl+C en terminal del servidor
npm run dev
```

### **2. Token expirado**
```bash
# Verificar variable
echo $TOKEN

# Obtener nuevo token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login ...)
```

### **3. Verificar datos en BD**
```bash
# Abrir Prisma Studio
npx prisma studio

# O consultar directo con psql
psql -U tests_user -d tests_daw -c "SELECT * FROM \"Attempt\" ORDER BY id DESC LIMIT 1;"
```

---

## 🎯 Checklist de Verificación Final

Antes de dar por terminada la sesión:

### **Código**
- [x] Archivo `attempts.schemas.ts` creado y funcional
- [x] Archivo `attempts.controller.ts` creado con 2 funciones
- [x] Archivo `attempts.routes.ts` creado con 2 rutas
- [x] Archivo `index.ts` actualizado (import + registro)
- [x] Sin errores de TypeScript (`npx tsc --noEmit`)

### **Testing**
- [x] TEST 1: Login exitoso (token obtenido)
- [x] TEST 2: Obtener 3 preguntas (sin correctAnswer)
- [x] TEST 3: Enviar intento (score 67%, 2/3 correctas)
- [x] TEST 4: Ver stats (1 intento, avgScore 67, 1 fallada)
- [x] TEST 5: Prisma Studio (Attempt + UserFailedQuestion)
- [x] TEST 6: Test falladas (solo pregunta 16)

### **Base de Datos**
- [x] Tabla `Attempt` tiene 1 registro con score 67
- [x] Campo `answers` contiene JSON con 3 resultados
- [x] Tabla `UserFailedQuestion` tiene 1 registro (questionId 16)

### **Git**
- [x] Cambios commiteados con mensaje descriptivo
- [x] Push exitoso a GitHub
- [x] Historial limpio (`git log --oneline`)

---

## 💭 Reflexiones Finales

### **¿Qué salió bien?**
- ✅ Planificación clara antes de codificar (arquitectura conceptual)
- ✅ Testing incremental (cada paso validado antes de continuar)
- ✅ Decisiones técnicas documentadas (trade-offs explicados)
- ✅ Código limpio y comentado
- ✅ Todos los tests pasaron sin errores mayores

### **¿Qué se puede mejorar?**
- ⚠️ Podríamos añadir más validaciones (ej: verificar que todas las preguntas existen antes de comparar)
- ⚠️ Logs más detallados para debugging en producción
- ⚠️ Tests unitarios automatizados (Vitest) en lugar de solo manuales

### **Aprendizajes clave:**
1. **Map es más eficiente que find()** para búsquedas repetidas
2. **skipDuplicates es esencial** con PKs compuestas
3. **JSON en PostgreSQL es válido** para datos complejos no consultables
4. **Reiniciar servidor** tras cambios en rutas es obligatorio
5. **Testing end-to-end** da confianza antes de continuar

---

## 🎊 Resumen Ejecutivo

### **¿Qué se logró?**
✅ Sistema completo de envío de intentos y estadísticas  
✅ Detección automática de preguntas falladas  
✅ Agregaciones por asignatura/tema  
✅ 6/6 tests end-to-end pasados  
✅ Backend 100% funcional  

### **¿Qué falta?**
⏳ Frontend completo (React + TypeScript)  
⏳ Deploy en producción (Vercel + Ubuntu)  
⏳ Tests unitarios automatizados  
⏳ Documentación final (README + memoria)  

### **¿Cuándo estará listo el proyecto?**
- **Próximas 2-3 sesiones (10-12h):** Frontend + Deploy  
- **Proyecto 100% funcional:** Estimado en 2 semanas  

---

## 🏆 Logros Desbloqueados

- 🥇 **Backend Completo:** API REST 100% funcional
- 🎯 **Testing Master:** 6/6 tests pasados sin fallos
- 🧠 **Optimización:** Implementar Map O(1) correctamente
- 🔒 **Seguridad:** skipDuplicates en PKs compuestas
- 📊 **Agregación Pro:** reduce manual para stats
- 🚀 **80% Proyecto:** 4 de 5 fases completadas
- 💾 **Persistencia:** Datos verificados en PostgreSQL
- 🎨 **Clean Code:** Código comentado y estructurado

---

## 📚 Recursos para Profundizar

### **Conceptos aplicados hoy:**
1. **Complejidad algorítmica:** Big O notation
2. **Data structures:** Map vs Array vs Object
3. **Database constraints:** Primary Keys compuestas
4. **JSON in PostgreSQL:** Cuándo usar vs tablas relacionales
5. **Functional programming:** reduce, map, filter
6. **API design:** RESTful conventions
7. **Error handling:** try-catch patterns

### **Lecturas recomendadas:**
- [ ] Prisma Best Practices: https://www.prisma.io/docs/guides/performance-and-optimization
- [ ] JavaScript Map Performance: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#performance
- [ ] Express Error Handling: https://expressjs.com/en/guide/error-handling.html

---

## 🎬 Cierre de Sesión

**Fecha:** 15 de octubre de 2025  
**Duración:** 3-4 horas  
**Progreso:** 70% → 80% (+10%)  
**Estado:** Backend 100% funcional  
**Próxima sesión:** Frontend (FASE 4)  

**Mensaje de cierre:**  
*"La parte más compleja del backend está completada. El sistema de attempts con detección automática de falladas y estadísticas agregadas funciona perfectamente. Todos los tests pasaron sin errores mayores. El código está limpio, comentado y pusheado a GitHub. ¡Listo para construir el frontend!"* 🚀

---

*Última actualización: 15 de octubre de 2025 (Sesión 6)*  
*Próxima sesión: Frontend - Estructura base y páginas principales (FASE 4)*  
*Siguiente commit: feat(frontend): Implementar estructura base y servicio API*