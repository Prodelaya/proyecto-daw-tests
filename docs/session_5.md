# 📊 Sesión 5: FASE 3 - Backend API Questions

## 🎯 Estado Previo del Proyecto

### ✅ Checkpoint al Inicio
- ✅ Sistema de autenticación JWT completo
- ✅ Validaciones Zod funcionando
- ✅ Servidor Express en puerto 3001
- ✅ 30 preguntas DWEC UT1 en PostgreSQL

**Progreso anterior:** 60% completado

---

## 🎯 Objetivos de la Sesión

Implementar sistema completo de obtención de preguntas con:
1. Middleware de autenticación JWT
2. Validación de query params con Zod
3. 3 tipos de test (tema, final, failed)
4. Aleatorización y límites
5. **Seguridad:** Eliminar correctAnswer

---

## 🏗️ Arquitectura del Flujo

```
GET /api/questions?subjectCode=DWEC&topicNumber=1&type=tema&limit=20
         ↓
validateQuery(schema) → Valida y transforma query params
         ↓
authMiddleware → Verifica JWT y extrae userId
         ↓
getQuestions Controller → Lógica de negocio
         ↓
     Prisma Query
         ↓
  Aleatorizar (Fisher-Yates)
         ↓
  Eliminar correctAnswer
         ↓
  Responder Array<Question>
```

---

## 📦 Componentes Desarrollados

### 1. Middleware de Autenticación
**Archivo:** `backend/src/middlewares/auth.middleware.ts`

**Flujo de validación:**
```
1. Extraer header Authorization
         ↓
2. Validar formato "Bearer <token>"
         ↓
3. Verificar token con verifyToken()
         ↓
4. Si válido → req.userId = decoded.userId
         ↓
5. Si inválido → 401 Unauthorized
```

**Extensión de tipos TypeScript:**
```typescript
declare global {
  namespace Express {
    interface Request {
      userId?: number;        // Añadido por authMiddleware
      validatedQuery?: any;   // Añadido por validateQuery
    }
  }
}
```

---

### 2. Schemas para Query Params
**Archivo:** `backend/src/schemas/questions.schemas.ts`

**Transformaciones clave:**
```
Query String → Zod Transform → Tipo Final
"dwec"       → toUpperCase()  → "DWEC"
"1"          → parseInt()      → 1
undefined    → default        → 20 (limit)
```

**Validaciones:**
- `subjectCode`: Requerido, mayúsculas
- `topicNumber`: Opcional, > 0
- `type`: Enum ("tema" | "final" | "failed")
- `limit`: 1-100, default 20

---

### 3. Questions Controller
**Archivo:** `backend/src/controllers/questions.controller.ts`

#### Función `getQuestions` - Flujo de 8 pasos:

```
1. Extraer parámetros (req.validatedQuery)
         ↓
2. Construir filtros Prisma según type
   - "tema" → filtrar por topicNumber
   - "final" → todas del módulo
   - "failed" → join con UserFailedQuestion
         ↓
3. Consultar BD con filtros
         ↓
4. ALEATORIZAR con Fisher-Yates
         ↓
5. Limitar cantidad (slice)
         ↓
6. 🔴 ELIMINAR correctAnswer
         ↓
7. Responder array
```

#### Algoritmo Fisher-Yates:
```
for (i = length-1; i > 0; i--)
    j = random(0, i)
    swap(array[i], array[j])
```

**Características:**
- ✅ O(n) complejidad
- ✅ Distribución uniforme
- ✅ In-place (no crea nuevo array)

#### Seguridad - Eliminar correctAnswer:
```javascript
// Antes: { id: 1, text: "...", correctAnswer: "HTTP", ... }
const { correctAnswer, ...rest } = question;
// Después: { id: 1, text: "...", ... }  // Sin correctAnswer
```

---

### 4. Optimización con Map
**Archivo:** `backend/src/controllers/questions.controller.ts`

**Problema:** Buscar preguntas por ID

**Opción A - Array.find() ❌**
```javascript
answers.forEach(answer => {
  const q = questions.find(q => q.id === answer.questionId); // O(n)
});
// Total: O(n²) - 20 respuestas × 20 búsquedas = 400 operaciones
```

**Opción B - Map ✅**
```javascript
const map = new Map(questions.map(q => [q.id, q]));
answers.forEach(answer => {
  const q = map.get(answer.questionId); // O(1)
});
// Total: O(n) - 20 + 20 = 40 operaciones
```

---

## 🐛 Problemas Encontrados y Soluciones

### Problema 1: validateQuery vs validate
**Error:** `req.body` undefined en GET requests

**Causa:** GET usa query params, no body

**Solución:** Crear `validateQuery` que valida `req.query`:
```javascript
// validate → req.body (POST)
// validateQuery → req.query (GET)
```

### Problema 2: req.query es read-only
**Error:** `Cannot set property query (read-only)`

**Causa:** Express 5 protege req.query

**Solución:** Usar propiedad personalizada:
```javascript
req.validatedQuery = result.data; // ✅
req.query = result.data;          // ❌ Error
```

### Problema 3: String vs Number
**Error:** Prisma espera `topicNumber: number`, recibe `"1"`

**Causa:** Query params son siempre strings

**Solución:** Transform en Zod:
```javascript
z.string().transform(val => parseInt(val, 10))
```

---

## 🧪 Testing Completo

### Test 1: Contar preguntas ✅
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/questions/count?subjectCode=DWEC&topicNumber=1&type=tema"
```
**Resultado:** `{"count":30,"subjectCode":"DWEC","topicNumber":1,"type":"tema"}`

### Test 2: Obtener 5 preguntas ✅
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/questions?subjectCode=DWEC&topicNumber=1&type=tema&limit=5"
```
**Verificación:** 
- ✅ Array con 5 preguntas
- ✅ Orden aleatorio cada vez
- ✅ **SIN correctAnswer** (seguridad)

### Test 3: Sin token (debe fallar) ✅
```bash
curl "http://localhost:3001/api/questions?subjectCode=DWEC"
```
**Resultado:** `401 Unauthorized` - "Token no proporcionado"

### Test 4: Parámetros inválidos ✅
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/questions?subjectCode=DWEC&topicNumber=-5"
```
**Resultado:** `400 Bad Request` - "El número de tema debe ser mayor a 0"

### Test 5: Preguntas falladas (vacío inicialmente) ✅
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/questions/count?subjectCode=DWEC&type=failed"
```
**Resultado:** `{"count":0}` - Aún no hay falladas

---

## 💡 Decisiones Técnicas Clave

### 1. Orden de Rutas en Express
```javascript
// ✅ CORRECTO: Específicas primero
router.get('/count', ...);  // /api/questions/count
router.get('/', ...);       // /api/questions

// ❌ INCORRECTO: "count" matchearía como :id
router.get('/:id', ...);
router.get('/count', ...);  // Nunca se ejecuta
```

### 2. Middleware Chain - Orden Importa
```javascript
router.get('/', 
  validateQuery(schema),  // 1º Validar datos
  authMiddleware,        // 2º Autenticar
  controller            // 3º Ejecutar lógica
);
```

### 3. Filtros Dinámicos Prisma
```javascript
// type === 'failed'
where: {
  subjectCode,
  failedBy: {
    some: { userId }  // Join con UserFailedQuestion
  }
}
```

---

## 📊 Métricas de la Sesión

| Métrica | Valor |
|---------|-------|
| Duración | 3 horas |
| Archivos creados | 4 |
| Tests ejecutados | 6 (todos pasando) |
| Problemas resueltos | 3 |
| Endpoints funcionales | 2 |
| Progreso | 60% → 70% |

---

## ✅ Checklist Completado

- [x] Middleware authMiddleware funcional
- [x] Schemas Zod con transforms
- [x] validateQuery para GET requests
- [x] Controller questions completo
- [x] Fisher-Yates implementado
- [x] correctAnswer eliminado (seguridad)
- [x] 3 tipos de test soportados
- [x] 6 tests pasando
- [x] Commit + push

---

## 🎯 Próxima Sesión

**Objetivo:** API Attempts y Stats
- submitAttempt con cálculo de score
- Detección de preguntas falladas
- skipDuplicates en UserFailedQuestion
- Agregaciones para estadísticas

---

## 🎓 Conceptos Aplicados

- **Fisher-Yates:** Algoritmo de shuffle O(n)
- **Map vs Array:** Estructuras de datos y complejidad
- **Query params:** Siempre strings, requieren transformación
- **Read-only properties:** Express 5 protege req.query
- **Middleware composition:** Cadena de responsabilidades
- **Security by design:** Nunca exponer datos sensibles

---

## 📝 Commit Realizado

```bash
feat(backend): Implementar API de preguntas (GET /questions)

- Middleware authMiddleware con JWT
- validateQuery para query params
- 3 tipos de test: tema, final, failed
- Fisher-Yates shuffle O(n)
- Eliminación de correctAnswer (seguridad)
- Tests: 6/6 pasando

API Questions 100% funcional
```

---

*Última actualización: 15 de octubre de 2025*
*Progreso total: 70% completado*
*Siguiente: API Attempts*