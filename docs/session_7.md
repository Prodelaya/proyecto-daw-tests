# 📊 Sesión 7: FASE 4 - Frontend Estructura Base

## 🎯 Estado Previo del Proyecto

### ✅ Checkpoint al Inicio
- ✅ Backend 100% funcional
- ✅ Todos los endpoints testeados
- ✅ Frontend setup inicial (Vite + React + TypeScript + Tailwind)
- ✅ Sin código frontend específico

**Progreso anterior:** 80% completado

---

## 🎯 Objetivos de la Sesión

Establecer la arquitectura base del frontend:
1. Estructura de carpetas profesional
2. Tipos TypeScript sincronizados con backend
3. Servicio API con axios
4. Interceptor JWT automático

---

## 🏗️ Arquitectura Frontend

```
src/
├── types/        → Contratos de datos (interfaces)
├── services/     → Comunicación HTTP (axios)
├── context/      → Estado global (React Context)
├── pages/        → Páginas completas (rutas)
└── components/   → Componentes reutilizables

Flujo de datos:
Component → services/api.ts → Backend
            ↓
        Interceptor JWT
            ↓
        Authorization: Bearer <token>
```

---

## 📦 Componentes Desarrollados

### 1. Estructura de Carpetas
**Ubicación:** `frontend/src/`

**Responsabilidades:**

| Carpeta | Propósito | Ejemplos |
|---------|-----------|----------|
| `types/` | Interfaces TypeScript | User, Question, Answer |
| `services/` | Llamadas HTTP | login(), getQuestions() |
| `context/` | Estado global | AuthContext |
| `pages/` | Rutas principales | Login, Dashboard, TestView |
| `components/` | Piezas reutilizables | Button, Card, QuestionCard |

**Decisión:** Separación por tipo, no por feature (más escalable para DAW)

---

### 2. Tipos TypeScript
**Archivo:** `frontend/src/types/index.ts`

#### Interfaces implementadas:

```typescript
User           → Usuario autenticado
Question       → Pregunta (SIN correctAnswer)
Answer         → Respuesta del usuario
QuestionResult → Resultado (CON correctAnswer)
AttemptResult  → Resultado completo del test
SubjectStats   → Estadística por asignatura
Stats          → Respuesta de /stats
```

#### Decisión de seguridad:

**Question vs QuestionResult:**
```typescript
// Durante el test (no muestra respuesta correcta)
interface Question {
  text: string;
  options: string[];
  // NO incluye correctAnswer ❌
}

// Después de enviar (muestra resultados)
interface QuestionResult {
  userAnswer: string;
  correctAnswer: string; // Ahora SÍ ✅
  correct: boolean;
}
```

---

### 3. Servicio API con Axios
**Archivo:** `frontend/src/services/api.ts`

#### Configuración base:
```javascript
const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' }
});
```

#### Interceptor JWT (⭐ Componente clave):

```
Flujo del interceptor:
1. Usuario hace login → localStorage.setItem('token', jwt)
2. Cualquier petición → interceptor se ejecuta
3. Lee token de localStorage
4. Añade header: Authorization: Bearer <token>
5. Petición sale con JWT automático
```

**Sin interceptor (repetitivo):**
```javascript
// ❌ Hay que añadir header en CADA petición
axios.get('/questions', {
  headers: { Authorization: `Bearer ${token}` }
});
```

**Con interceptor (automático):**
```javascript
// ✅ Token añadido automáticamente
apiClient.get('/questions');
```

---

### 4. Funciones del Servicio

#### Autenticación:
```typescript
register(email, password, name) → Promise<{message}>
login(email, password) → Promise<{token, user}>
```

#### Preguntas:
```typescript
getQuestions(params) → Promise<Question[]>
getQuestionsCount(params) → Promise<{count}>
```

#### Attempts:
```typescript
submitAttempt(data) → Promise<AttemptResult>
getStats() → Promise<Stats>
```

**Nota:** userId no se envía (backend lo extrae del JWT)

---

## 💡 Decisiones Técnicas Clave

### 1. localStorage vs Cookies

| Opción | Pros | Contras | Decisión |
|--------|------|---------|----------|
| localStorage | Simple, accesible JS | Vulnerable XSS | ✅ OK para DAW |
| HttpOnly Cookie | Seguro contra XSS | Complejo CORS | ❌ Overkill |

### 2. Interceptor vs Manual

**Manual:** 6 funciones × header = repetición
**Interceptor:** 1 configuración = DRY

### 3. Params en GET
```javascript
// axios convierte objeto → query string
apiClient.get('/questions', {
  params: { subjectCode: 'DWEC', limit: 20 }
});
// → GET /questions?subjectCode=DWEC&limit=20
```

---

## 📊 Métricas de la Sesión

| Métrica | Valor |
|---------|-------|
| Duración | 1 hora |
| Carpetas creadas | 5 |
| Archivos creados | 2 |
| Interfaces TypeScript | 7 |
| Funciones API | 6 |
| Progreso | 80% → 82% |

---

## ✅ Checklist Completado

- [x] Estructura de carpetas frontend
- [x] 7 interfaces TypeScript
- [x] Servicio API con axios
- [x] Interceptor JWT configurado
- [x] 6 funciones de comunicación
- [x] Sincronización con backend
- [x] Documentación de decisiones

---

## 🎯 Próxima Sesión

**Objetivo:** AuthContext y Login
- Context API para estado global
- Persistencia con localStorage
- Página Login/Register
- Toggle entre modos
- Validaciones frontend

---

## 🎓 Conceptos Aplicados

- **Service Layer:** Centralizar comunicación HTTP
- **DTO Pattern:** Interfaces como contratos
- **Interceptor Pattern:** Middleware en cliente
- **Separation of Concerns:** Carpetas por responsabilidad
- **Type Safety:** TypeScript para prevención de errores

---

## 🏆 Estado del Frontend

```
[██░░░░░░░░] 20% Frontend
             ↓
✅ Estructura base
✅ Tipos TypeScript  
✅ Servicio API
⏳ AuthContext
⏳ Páginas
⏳ Componentes
⏳ React Router
```

---

## 📝 Arquitectura Visual

```
Frontend (React)
    ↓
services/api.ts
    ↓
Interceptor JWT → localStorage.getItem('token')
    ↓
axios.create() → baseURL: 'http://localhost:3001/api'
    ↓
Backend Express
```

---

## 🔑 Puntos Clave para Recordar

1. **Question NO tiene correctAnswer** (seguridad durante test)
2. **QuestionResult SÍ tiene correctAnswer** (mostrar resultados)
3. **Interceptor añade JWT automáticamente** (DRY)
4. **userId se extrae del JWT en backend** (no enviarlo)
5. **topicNumber puede ser null** (tests finales)

---

*Última actualización: 15 de octubre de 2025*
*Progreso total: 82% completado*
*Frontend: 20% completado*
*Siguiente: AuthContext + Login*