# 📊 Sesión 6: FASE 3 - Backend API Attempts y Stats

## 🎯 Estado Previo del Proyecto

### ✅ Checkpoint al Inicio
- ✅ API Questions funcional (GET /questions + /count)
- ✅ 3 tipos de test implementados
- ✅ Middleware authMiddleware validando JWT
- ✅ Fisher-Yates y seguridad aplicados

**Progreso anterior:** 70% completado

---

## 🎯 Objetivos de la Sesión

Completar el backend con:
1. Sistema de envío de intentos (submitAttempt)
2. Detección automática de preguntas falladas
3. Estadísticas agregadas por usuario
4. Testing end-to-end completo

---

## 🏗️ Arquitectura del Sistema

```
POST /api/attempts
    ↓
validate(schema) → Valida array de respuestas
    ↓
authMiddleware → Extrae userId del JWT
    ↓
submitAttempt Controller
    ↓
┌─────────────────────────────┐
│  10 PASOS DE PROCESAMIENTO  │
├─────────────────────────────┤
│ 1. Extraer datos            │
│ 2. Obtener IDs preguntas    │
│ 3. Consultar BD             │
│ 4. Crear Map O(1)           │
│ 5. Comparar respuestas      │
│ 6. Calcular score %         │
│ 7. Guardar intento          │
│ 8. Detectar falladas        │
│ 9. Guardar en UserFailed    │
│ 10. Responder resultados    │
└─────────────────────────────┘
```

---

## 📦 Componentes Desarrollados

### 1. Schemas de Validación
**Archivo:** `backend/src/schemas/attempts.schemas.ts`

**Schema anidado para reutilización:**
```javascript
answerSchema → { questionId: number, userAnswer: string }
     ↓
submitAttemptSchema → {
  subjectCode: string,
  topicNumber: number | null,
  answers: Answer[]  // Array de answerSchema
}
```

**Validaciones:**
- `answers`: Mínimo 1, máximo 100 (límite seguridad)
- `topicNumber`: nullable para tests finales
- `subjectCode`: Normalizado a mayúsculas

---

### 2. Controller submitAttempt
**Archivo:** `backend/src/controllers/attempts.controller.ts`

#### Flujo de los 10 pasos:

**PASO 1-4: Preparación**
```
1. Extraer userId del JWT + datos del body
2. Map answers → array de questionIds
3. Consultar preguntas en PostgreSQL
4. Crear Map(id → question) para O(1)
```

**PASO 5-6: Procesamiento**
```
5. Comparar respuestas:
   userAnswer.trim() === correctAnswer.trim()
   
6. Calcular score:
   Math.round((correctas / total) × 100)
```

**PASO 7-9: Persistencia**
```
7. Guardar intento con JSON completo
8. Filtrar preguntas incorrectas
9. Guardar en UserFailedQuestion con skipDuplicates
```

**PASO 10: Respuesta**
```javascript
{
  score: 67,
  correct: 2,
  total: 3,
  results: [
    { questionId, userAnswer, correctAnswer, correct, explanation }
  ]
}
```

---

### 3. Decisión: skipDuplicates
**Archivo:** `backend/src/controllers/attempts.controller.ts`

**Problema:** Usuario falla pregunta 5 en múltiples tests

**Sin skipDuplicates ❌:**
```
Test 1: Falla pregunta 5 → INSERT (userId=1, questionId=5) ✅
Test 2: Falla pregunta 5 → INSERT (userId=1, questionId=5) ❌
Error: Unique constraint failed
```

**Con skipDuplicates ✅:**
```javascript
await prisma.userFailedQuestion.createMany({
  data: failedQuestionIds.map(id => ({ userId, questionId: id })),
  skipDuplicates: true  // Ignora si ya existe
});
```

---

### 4. Controller getStats
**Archivo:** `backend/src/controllers/attempts.controller.ts`

#### Agregación con reduce:

```javascript
// Agrupar intentos por "DWEC-1", "DWEC-final", etc.
const grouped = attempts.reduce((acc, attempt) => {
  const key = `${subjectCode}-${topicNumber || 'final'}`;
  if (!acc[key]) {
    acc[key] = { attempts: [], scores: [] };
  }
  acc[key].attempts.push(attempt);
  acc[key].scores.push(attempt.score);
  return acc;
}, {});
```

**Trade-off: Manual vs Prisma groupBy**

| Opción | Pros | Contras | Decisión |
|--------|------|---------|----------|
| reduce manual | Control total, flexible | Menos eficiente con millones | ✅ Elegido |
| Prisma groupBy | SQL nativo, eficiente | Menos flexible | ❌ |

**Para DAW:** Un usuario no tendrá 10,000 intentos → Manual OK

---

## 🔍 Decisiones de Diseño

### 1. Map vs Array.find()

**Comparación de complejidad:**
```
20 respuestas × búsqueda:
- Array.find(): O(n) × 20 = O(n²) = 400 operaciones
- Map.get(): O(1) × 20 = O(n) = 40 operaciones
```

**Implementación:**
```javascript
// Crear Map una vez: O(n)
const map = new Map(questions.map(q => [q.id, q]));

// Acceder múltiples veces: O(1) cada vez
const question = map.get(questionId);
```

### 2. JSON vs Tabla Normalizada

**Opción elegida:** Campo `answers: Json`

```javascript
// En tabla Attempt
answers: [
  { questionId: 1, userAnswer: "...", correct: true, ... },
  { questionId: 2, userAnswer: "...", correct: false, ... }
]
```

**Ventajas:**
- ✅ Auditoría completa en un registro
- ✅ Inmutable (snapshot histórico)
- ✅ Simplicidad (menos joins)

**Desventajas:**
- ❌ No consultable con SQL
- ❌ Menos normalizado

**Decisión:** Para DAW, JSON es suficiente

---

## 🧪 Testing End-to-End

### Flujo completo probado:

**1. Login → Obtener token**
```bash
TOKEN=$(curl -s -X POST .../login ... | grep -o '"token":"[^"]*' | cut -d'"' -f4)
```

**2. Obtener 3 preguntas**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  ".../questions?subjectCode=DWEC&topicNumber=1&limit=3"
```
Resultado: Preguntas con IDs 8, 16, 27

**3. Enviar intento (2 correctas, 1 incorrecta)**
```bash
curl -X POST .../attempts \
  -d '{"answers":[
    {"questionId":8,"userAnswer":"correcta"},
    {"questionId":16,"userAnswer":"INCORRECTA"},
    {"questionId":27,"userAnswer":"correcta"}
  ]}'
```
Resultado: `score: 67%` (2/3 correctas)

**4. Verificar estadísticas**
```bash
curl .../attempts/stats
```
Resultado: 
- 1 intento en DWEC-1
- avgScore: 67
- totalFailedQuestions: 1

**5. Test de falladas**
```bash
curl ".../questions?type=failed"
```
Resultado: Solo pregunta 16 (la que falló)

---

## 🔍 Verificación en Base de Datos

**Tabla Attempt:**
- ✅ 1 registro con score 67
- ✅ Campo `answers` con JSON completo
- ✅ userId y timestamps correctos

**Tabla UserFailedQuestion:**
- ✅ 1 registro (userId=1, questionId=16)
- ✅ PK compuesta funcionando
- ✅ skipDuplicates evitando errores

---

## 📊 Métricas de la Sesión

| Métrica | Valor |
|---------|-------|
| Duración | 3-4 horas |
| Archivos creados | 3 |
| Tests end-to-end | 6 (todos pasando) |
| Problemas resueltos | 2 |
| Endpoints funcionales | 2 |
| Progreso | 70% → 80% |

---

## ✅ Checklist Completado

- [x] Schema attempts con validaciones
- [x] submitAttempt (10 pasos)
- [x] Optimización con Map O(1)
- [x] Detección automática de falladas
- [x] skipDuplicates implementado
- [x] getStats con agregaciones
- [x] 6 tests end-to-end pasando
- [x] Verificación en Prisma Studio
- [x] Commit + push

---

## 🎯 Próxima Sesión

**Objetivo:** Iniciar Frontend
- Estructura de carpetas
- Tipos TypeScript
- Servicio API con axios
- Interceptor JWT
- AuthContext

---

## 🎓 Conceptos Aplicados

- **Complejidad algorítmica:** O(n) vs O(n²)
- **Map:** Estructura de datos para búsqueda O(1)
- **PK compuesta:** skipDuplicates en Prisma
- **JSON en PostgreSQL:** Trade-offs de desnormalización
- **Agregación funcional:** reduce para groupBy manual
- **Testing E2E:** Flujo completo usuario real

---

## 📝 Commit Realizado

```bash
feat(backend): Completar API attempts y stats - FASE 3 finalizada

- submitAttempt con 10 pasos de procesamiento
- Detección automática de falladas
- skipDuplicates para PK compuesta
- getStats con agregaciones manuales
- Optimización Map O(1)
- Tests: 6/6 E2E pasando

Backend 100% funcional - Proyecto 80% completado
```

---

## 🏆 Logros de la Fase 3

- ✅ **Backend completo:** 100% funcional
- ✅ **Optimización:** Map vs find() aplicado
- ✅ **Resiliencia:** skipDuplicates evita crashes
- ✅ **Testing E2E:** Flujo usuario completo
- ✅ **80% proyecto:** Solo falta frontend

---

*Última actualización: 15 de octubre de 2025*
*Progreso total: 80% completado*
*Backend: COMPLETADO ✅*
*Siguiente: Frontend*