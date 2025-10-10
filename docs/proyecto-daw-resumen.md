# 📚 Proyecto Final DAW - Plataforma de Tests Interactivos

## 🎯 Objetivo

Desarrollar una aplicación web responsive (mobile-first) para practicar tests de módulos DAW, con sistema de autenticación, tracking de estadísticas personales y gestión inteligente de preguntas falladas.

**Público objetivo:** Estudiantes DAW (compañeros de clase)  
**Valor diferencial:** Alta empleabilidad del stack + funcionalidad útil real

---

## ⚙️ Funcionalidades Core

### Autenticación
- Registro de usuarios con email único
- Login con JWT (token 24h)
- Sesión persistente en cliente

### Tipos de Test
1. **Test por tema:** Preguntas específicas de un tema (ej: DWEC - UT1 "Introducción...")
2. **Test final de módulo:** Todas las preguntas de todos los temas del módulo mezcladas
3. **Test aleatorio completo:** Todos los temas + finales del módulo (si hubiera tests finales separados)
4. **Test de preguntas falladas:** Solo preguntas que el usuario ha fallado previamente de ese módulo

### Selector de Cantidad
- Usuario elige número de preguntas: **10, 20, 30, 40... o MÁXIMO**
- Opciones dinámicas según preguntas disponibles
- Ejemplo: Si hay 28 preguntas → mostrar [10, 20, MAX(28)]

### Jerarquía de datos
```
Asignatura (code: "DWEC", name: "Desarrollo Web...")
  └─ Tema (number: 1, title: "Introducción al...")
      └─ Preguntas (text, options[], correctAnswer...)
```

### Estadísticas en Tiempo Real
- % de aciertos por módulo
- Total de intentos realizados
- Historial de tests (fecha, score, tema)
- Contador de preguntas falladas pendientes

### Gestión de Preguntas
- Base de datos cargada desde JSON (seed único)
- Tracking automático de preguntas falladas por usuario
- Explicaciones de respuestas correctas tras finalizar

---

## 🛠️ Stack Tecnológico

### Frontend
```
React 18 + TypeScript
Vite (build tool)
Tailwind CSS (estilos)
React Router v6 (navegación)
Vitest + Testing Library (testing)
```

### Backend
```
Node.js 20 LTS
Express (API REST)
Prisma ORM
PostgreSQL 15
JWT + bcrypt (autenticación)
Zod (validación de DTOs)
Cors + Helmet (seguridad)
```

### Deploy
```
Frontend: Vercel (free tier)
Backend: Ubuntu Server (puerto 3001)
Base de datos: PostgreSQL local en Ubuntu
```

### Decisiones Técnicas
- **Sin Docker:** Simplifica setup y debugging
- **Sin CI/CD:** Despliegue manual suficiente para DAW
- **Sin Swagger:** Documentación en README
- **JWT simple:** Solo access token (sin refresh)

---

## 🏗️ Arquitectura

### Diagrama de Componentes
```
┌─────────────────────────────────────────┐
│           NAVEGADOR (Cliente)           │
│  React SPA + Tailwind + React Router    │
└──────────────┬──────────────────────────┘
               │ HTTPS (fetch API)
               │ Authorization: Bearer <JWT>
               ▼
┌─────────────────────────────────────────┐
│         VERCEL (CDN Global)             │
│     Hosting Frontend Estático           │
└──────────────┬──────────────────────────┘
               │
               │ API REST (JSON)
               │ http://TU_IP:3001/api
               ▼
┌─────────────────────────────────────────┐
│      UBUNTU SERVER (Backend)            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Express API (Node.js)         │   │
│  │   Puerto 3001                   │   │
│  │                                 │   │
│  │  Middlewares:                   │   │
│  │  • authJWT (validar token)      │   │
│  │  • validator (Zod schemas)      │   │
│  │  • errorHandler                 │   │
│  └──────────┬──────────────────────┘   │
│             │                           │
│             │ Prisma Client             │
│             ▼                           │
│  ┌─────────────────────────────────┐   │
│  │   PostgreSQL 15                 │   │
│  │   localhost:5432                │   │
│  │                                 │   │
│  │   Tablas:                       │   │
│  │   • User                        │   │
│  │   • Question                    │   │
│  │   • Attempt                     │   │
│  │   • UserFailedQuestion          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Flujo de Autenticación
```
1. POST /api/auth/register → bcrypt hash password
2. POST /api/auth/login → valida + genera JWT (24h)
3. Cliente guarda JWT en localStorage
4. Cada request incluye: Authorization: Bearer <token>
5. Middleware authJWT valida token antes de controllers
```

### Flujo de Test
```
1. Usuario elige: asignatura + tema + cantidad (10/20/30/MAX)
   Frontend cuenta preguntas disponibles y genera botones

2. GET /api/questions?subjectCode=DWEC&topicNumber=1&type=tema&limit=20
   → Backend filtra y devuelve N preguntas aleatorias
   
3. Usuario responde en frontend (sin enviar hasta finalizar)

4. POST /api/attempts
   Body: { subjectCode: "DWEC", topicNumber: 1, answers: [...] }
   → Backend calcula score
   → Detecta preguntas falladas
   → Guarda en UserFailedQuestion
   → Retorna stats actualizadas

5. GET /api/stats/:userId
   → Devuelve agregación de intentos por asignatura/tema
```

---

## 📐 Modelo de Datos (Prisma)

### Tabla User
```
id         → Int (PK, autoincrement)
email      → String (unique)
password   → String (bcrypt hash)
name       → String
attempts[] → Relation Attempt[]
```

### Tabla Question
```
id            → Int (PK)
subjectCode   → String (ej: "DWEC")
subjectName   → String (ej: "Desarrollo Web en Entorno Cliente")
topicNumber   → Int (ej: 1)
topicTitle    → String (ej: "Introducción al Desarrollo Web...")
text          → String (enunciado pregunta)
options       → Json (array strings)
correctAnswer → String
explanation   → String
failedCount   → Int (contador global)
```

### Tabla Attempt
```
id          → Int (PK)
userId      → Int (FK User)
subjectCode → String (ej: "DWEC")
topicNumber → Int | null (null = test final)
score       → Int (porcentaje 0-100)
answeredAt  → DateTime
answers     → Json ([{questionId, userAnswer, correct}])
```

### Tabla UserFailedQuestion
```
userId     → Int (FK User)
questionId → Int (FK Question)
@@id([userId, questionId]) → PK compuesta
```

---

## 📋 Endpoints API

### Autenticación
```http
POST   /api/auth/register
Body:  { email, password, name }
Response: { message: "Usuario creado" }

POST   /api/auth/login
Body:  { email, password }
Response: { token: "jwt...", user: {...} }
```

### Preguntas
```http
GET    /api/questions?subjectCode=DWEC&topicNumber=1&type=tema&limit=20
Query params:
  - subjectCode: string (obligatorio, ej: "DWEC")
  - topicNumber: number (opcional, ej: 1)
  - type: "tema" | "final" | "failed"
  - limit: number (10, 20, 30... o null=max)
Response: Question[] (aleatorias hasta limit)
```

### Intentos
```http
POST   /api/attempts
Headers: Authorization: Bearer <token>
Body: {
  subjectCode: "DWEC",
  topicNumber: 1,
  answers: [
    { questionId: 1, userAnswer: "opción A" }
  ]
}
Response: {
  score: 85,
  correct: 17,
  total: 20,
  failedQuestions: [2, 5, 8]
}
```

### Estadísticas
```http
GET    /api/stats/:userId
Response: {
  bySubject: {
    "DWEC": {
      subjectName: "Desarrollo Web en Entorno Cliente",
      totalAttempts: 15,
      avgScore: 82,
      failedCount: 12,
      topics: {
        "1": {
          topicTitle: "Introducción al Desarrollo Web...",
          attempts: 5,
          avgScore: 85
        }
      }
    }
  }
}
```

---

## 🚀 Fases de Desarrollo

### FASE 1: Setup (1-2h)
- [x] Inicializar repos (frontend + backend)
- [x] Instalar dependencias
- [x] Configurar Prisma + migración
- [x] Seed desde JSON → tabla Question
- [x] Probar conexión PostgreSQL

### FASE 2: Backend Auth (3-4h)
- [x] Middleware authJWT
- [x] POST /auth/register (bcrypt)
- [x] POST /auth/login (JWT)
- [x] Validación Zod en DTOs
- [x] Probar con Postman/Thunder Client

### FASE 3: Lógica Tests (4-5h)
- [x] GET /questions con filtros
- [x] POST /attempts + cálculo score
- [x] Detectar falladas → UserFailedQuestion
- [x] GET /stats con agregaciones
- [x] Probar todos los tipos de test

### FASE 4: Frontend (5-6h)
- [x] AuthContext + localStorage
- [x] Páginas: Login, Dashboard, TestView, Stats
- [x] Servicio API (axios + interceptor JWT)
- [x] Componentes: QuestionCard, StatsChart
- [x] Responsive design (mobile-first)

### FASE 5: Deploy (2-3h)
- [x] Frontend → Vercel (conectar repo GitHub)
- [x] Backend → Ubuntu (pm2 + puerto 3001)
- [x] Variables entorno (.env.production)
- [x] Abrir firewall puerto 3001
- [x] Prueba end-to-end

### FASE 6: Testing + Docs (2h)
- [x] 3 tests Vitest (Login, API, Stats)
- [x] README con instrucciones
- [x] Memoria PDF (arquitectura + capturas)

**⏱️ Tiempo total estimado:** 27-34 horas

---

## 📊 Priorización de Features

| Feature | Prioridad | Tiempo | Sprint |
|---------|-----------|--------|--------|
| Auth JWT | 🔴 CRÍTICA | 3h | 2 |
| Tests por tema | 🔴 CRÍTICA | 2h | 3 |
| Stats básicas | 🔴 CRÍTICA | 3h | 4 |
| Tests falladas | 🟡 ALTA | 2h | 3 |
| Test final módulo | 🟢 MEDIA | 1h | 3 |
| Gráficos avanzados | 🔵 BAJA | 2h | 4 |

### MVP (Versión 1.0)
✅ Auth + Tests tema + Stats texto plano

### Versión Completa (1.5)
✅ MVP + Tests falladas + Test final + Gráficos Chart.js

---

## 💡 Decisiones de Diseño y Trade-offs

### ¿Por qué React y no Vue?
- **React:** 75% ofertas empleo España
- **Vue:** 25% ofertas empleo España
- **Trade-off:** React tiene curva aprendizaje mayor, pero mejor ROI para portfolio

### ¿Por qué PostgreSQL y no MySQL?
- **PostgreSQL:** JSON nativo, mejor para escalar, preferido en startups
- **MySQL:** Más tradicional en empresas legacy
- **Trade-off:** PostgreSQL requiere más RAM pero ofrece más features

### ¿Por qué sin Docker?
- **Con Docker:** Setup más profesional, portabilidad
- **Sin Docker:** Menos complejidad, debugging más directo
- **Trade-off:** Para DAW, la simplicidad gana (proyecto individual, no equipo)

### ¿Por qué JWT sin refresh?
- **Con refresh:** Más seguro (tokens cortos)
- **Sin refresh:** Implementación más simple
- **Trade-off:** Para app de práctica interna, token de 24h es suficiente

### ¿Por qué Tailwind y no CSS puro?
- **Tailwind:** Desarrollo 3x más rápido, estándar industria
- **CSS puro:** Mayor control, menos dependencias
- **Trade-off:** Tailwind es lo que buscan empresas en 2025

---

## 📦 Entregables Finales

1. **Repositorio GitHub** (público)
   - README con instrucciones setup
   - Commits semánticos
   - .gitignore correcto

2. **Aplicación desplegada**
   - Frontend en Vercel (URL pública)
   - Backend en tu servidor Ubuntu

3. **Memoria técnica (PDF)**
   - Decisiones arquitectónicas
   - Diagramas de flujo
   - Capturas de pantalla
   - Problemas encontrados + soluciones

4. **Tests automatizados**
   - Mínimo 3 tests con Vitest
   - Coverage básico (no obligatorio 100%)

5. **Presentación (opcional)**
   - Demo en vivo
   - Explicación de código clave
   - Métricas (líneas código, tiempo desarrollo)

---

## 🎓 Criterios de Evaluación DAW

### Técnica (60%)
- ✅ Stack moderno y empleable
- ✅ Arquitectura clara cliente-servidor
- ✅ Seguridad básica (JWT, bcrypt, CORS)
- ✅ Validación de datos (Zod)
- ✅ Responsive design
- ✅ Testing mínimo

### Funcionalidad (25%)
- ✅ CRUD implícito (usuarios, intentos, stats)
- ✅ Filtros y búsquedas
- ✅ Gestión de estado compleja (falladas)
- ✅ UX fluida

### Documentación (15%)
- ✅ README completo
- ✅ Memoria técnica
- ✅ Código comentado en partes críticas