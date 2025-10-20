# 📊 Sesión 9: FASE 4 - React Router + Dashboard Completo

## 🎯 Estado Previo del Proyecto

### ✅ Checkpoint al Inicio
- ✅ Backend 100% funcional (auth + questions + attempts + stats)
- ✅ Frontend: AuthContext + Login funcional
- ✅ Dashboard.tsx vacío (placeholder)
- ✅ PrivateRoute.tsx con contenido
- ✅ IP del servidor cambiada a 192.168.1.131

**Progreso anterior:** 85% completado

---

## 🆕 Trabajo Realizado en Esta Sesión (2.5h)

### **Objetivo Principal:**
Implementar arquitectura completa de navegación con React Router y Dashboard dinámico con asignaturas desde base de datos.

---

## 📦 COMPONENTES IMPLEMENTADOS

### **1. React Router - Configuración Base**

**Propósito:**
Habilitar navegación SPA (Single Page Application) entre múltiples páginas sin recargas.

**Estructura de Rutas Implementada:**
```
/                    → Login (público)
/dashboard           → Dashboard (protegido)
/subject/:code       → SubjectDetail (protegido)
/test/config         → TestConfig (pendiente)
/test                → TestView (pendiente)
/results             → Results (pendiente)
/stats               → Stats (pendiente)
*                    → Redirect a / (404)
```

**Archivo modificado:** `frontend/src/App.tsx`

**Cambios clave:**
- Importado `BrowserRouter`, `Routes`, `Route`, `Navigate`
- Envuelto en `<AuthProvider>` + `<BrowserRouter>`
- Rutas públicas sin protección
- Rutas protegidas con componente `<PrivateRoute>`
- Manejo de 404 con redirect automático

**Decisión técnica:**
- BrowserRouter (modo history) vs HashRouter (modo hash)
- **Elegido:** BrowserRouter (URLs limpias sin #)
- **Trade-off:** Requiere configuración en servidor de producción

---

### **2. Login con Redirect Automático**

**Propósito:**
Redirigir al usuario a Dashboard tras login exitoso en lugar de mostrar mensaje temporal.

**Archivo modificado:** `frontend/src/pages/Login.tsx`

**Cambios implementados:**

**Import de React Router:**
```typescript
import { useNavigate, Navigate } from 'react-router-dom';
```

**Hook navigate inicializado:**
```typescript
const navigate = useNavigate();
```

**Redirect tras login exitoso:**
```typescript
try {
  if (isLogin) {
    await loginUser(email, password);
  } else {
    await registerUser(email, password, name);
  }
  
  // Redirigir a dashboard
  navigate('/dashboard');
  
} catch (err: unknown) {
  // Manejo de errores...
}
```

**Redirect si ya hay sesión:**
```typescript
if (user) {
  return <Navigate to="/dashboard" replace />;
}
```

**Decisión técnica:**
- `navigate()` vs `<Navigate>` component
- **navigate():** Tras acción (login button)
- **<Navigate>:** Condicional en render (ya tiene sesión)
- **replace:** No añade entrada al historial (no puede volver con Back)

---

### **3. Backend - Endpoint de Asignaturas**

**Propósito:**
Obtener lista única de asignaturas desde PostgreSQL con contador de preguntas por cada una.

**Archivo nuevo:** `backend/src/controllers/subjects.controller.ts`

**Función `getSubjects`:**

**Flujo:**
1. Usar Prisma `groupBy` para agrupar preguntas por `subjectCode` y `subjectName`
2. Contar preguntas con `_count`
3. Formatear respuesta con estructura limpia
4. Ordenar alfabéticamente por código

**Query Prisma utilizado:**
```typescript
const subjectsData = await prisma.question.groupBy({
  by: ['subjectCode', 'subjectName'],
  _count: {
    id: true
  }
});
```

**Respuesta típica:**
```json
[
  {
    "subjectCode": "DWEC",
    "subjectName": "Desarrollo Web en Entorno Cliente",
    "questionCount": 30
  }
]
```

**Decisión técnica:**
- groupBy vs query + lodash grouping
- **groupBy:** Nativo SQL, más eficiente
- **Trade-off:** Requiere Prisma 2.20+

---

**Archivo nuevo:** `backend/src/routes/subjects.routes.ts`

**Ruta configurada:**
```typescript
router.get('/', authMiddleware, getSubjects);
```

**Protección:** Requiere JWT válido (authMiddleware)

---

**Archivo modificado:** `backend/src/index.ts`

**Import añadido:**
```typescript
import subjectRoutes from './routes/subjects.routes';
```

**Registro de ruta:**
```typescript
app.use('/api/subjects', subjectRoutes);
```

---

### **4. Dashboard con Tarjetas Dinámicas**

**Propósito:**
Mostrar todas las asignaturas disponibles en formato de tarjetas responsive, obtenidas dinámicamente del backend.

**Archivo modificado:** `frontend/src/pages/Dashboard.tsx`

**Funcionalidades implementadas:**

**Fetch de asignaturas al montar:**
```typescript
useEffect(() => {
  const fetchSubjects = async () => {
    try {
      const data = await getSubjects();
      setSubjects(data);
    } catch (err) {
      setError('Error al cargar las asignaturas');
    } finally {
      setLoading(false);
    }
  };

  fetchSubjects();
}, []);
```

**Estados gestionados:**
- `subjects: Subject[]` - Array de asignaturas
- `loading: boolean` - Indicador de carga
- `error: string` - Mensaje de error

**Diseño responsive:**
```
Mobile:   1 columna  (grid-cols-1)
Tablet:   2 columnas (md:grid-cols-2)
Desktop:  3 columnas (lg:grid-cols-3)
XL:       4 columnas (xl:grid-cols-4)
```

**Cada tarjeta incluye:**
- Emoji representativo según asignatura
- Código (DWEC, DWES, etc.)
- Nombre completo de la asignatura
- Badge con contador de preguntas
  - Verde si > 0
  - Gris si = 0
- Link a `/subject/:code`
- Hover effect (shadow-lg → shadow-xl)

**Mapeo de emojis:**
```typescript
DWEC  → 🌐 (Web)
DWES  → ⚙️ (Server)
DAW   → 🚀 (Deploy)
DIW   → 🎨 (Design)
DASP  → 🔐 (Security)
IPE   → 💼 (Business)
CIBER → 🛡️ (Cybersecurity)
SASP  → 🔧 (Admin)
Otro  → 📖 (Book)
```

**Estados visuales:**
- **Loading:** Texto "Cargando asignaturas..."
- **Error:** Banner rojo con mensaje
- **Vacío:** Banner amarillo con instrucción de seed
- **Datos:** Grid de tarjetas

---

**Archivo modificado:** `frontend/src/services/api.ts`

**Función añadida:**
```typescript
export const getSubjects = async (): Promise<{
  subjectCode: string;
  subjectName: string;
  questionCount: number;
}[]> => {
  const { data } = await apiClient.get('/subjects');
  return data;
};
```

**Ventaja TypeScript:**
Tipo de retorno explícito → Autocompletado + validación

---

### **5. Backend - Endpoint de Temas por Asignatura**

**Propósito:**
Obtener lista de temas (UTs) de una asignatura específica con contador de preguntas.

**Archivo modificado:** `backend/src/controllers/subjects.controller.ts`

**Función `getTopicsBySubject` añadida:**

**Flujo:**
1. Extraer `subjectCode` de path param
2. Agrupar preguntas por `topicNumber` y `topicTitle`
3. Filtrar por `subjectCode` (WHERE)
4. Contar preguntas con `_count`
5. Ordenar por número de tema

**Query Prisma:**
```typescript
const topicsData = await prisma.question.groupBy({
  by: ['topicNumber', 'topicTitle'],
  where: {
    subjectCode: subjectCode.toUpperCase()
  },
  _count: {
    id: true
  }
});
```

**Respuesta típica:**
```json
[
  {
    "topicNumber": 1,
    "topicTitle": "Introducción al Desarrollo Web...",
    "questionCount": 30
  },
  {
    "topicNumber": 3,
    "topicTitle": "JavaScript Avanzado",
    "questionCount": 15
  }
]
```

**Decisión técnica:**
- `.toUpperCase()` para normalizar input
- Sort por `topicNumber` (ascendente)

---

**Archivo modificado:** `backend/src/routes/subjects.routes.ts`

**Ruta añadida:**
```typescript
router.get('/:subjectCode/topics', authMiddleware, getTopicsBySubject);
```

**Uso:** `GET /api/subjects/DWEC/topics`

---

### **6. SubjectDetail - Página de Tipos de Test**

**Propósito:**
Mostrar las 3 opciones de test para una asignatura + lista de temas disponibles.

**Archivo nuevo:** `frontend/src/pages/SubjectDetail.tsx`

**Funcionalidades implementadas:**

**Extracción de parámetros de URL:**
```typescript
const { subjectCode } = useParams<{ subjectCode: string }>();
```

**Fetch de datos al montar:**
```typescript
useEffect(() => {
  const fetchData = async () => {
    // 1. Obtener temas con contadores
    const topicsData = await getTopicsBySubject(subjectCode);
    setTopics(topicsData);

    // 2. Obtener contador de preguntas falladas
    const failedData = await getQuestionsCount({
      subjectCode,
      type: 'failed'
    });
    setFailedCount(failedData.count);
  };

  fetchData();
}, [subjectCode]);
```

**3 Opciones de Test:**

**1. Test por Tema:**
- Botón "Seleccionar Tema" (toggle)
- Lista expandible/colapsable con temas
- Cada tema muestra:
  - "UT1" (número)
  - Título del tema (truncado)
  - Contador "30 pregs"
- Al hacer clic en tema:
  - `navigate('/test/config?subject=DWEC&topic=1&type=tema')`

**2. Test Completo:**
- Botón verde "Comenzar Test"
- Al hacer clic:
  - `navigate('/test/config?subject=DWEC&type=final')`

**3. Preguntas Falladas:**
- Badge dinámico con contador
  - Rojo si > 0
  - Gris si = 0
- Botón "Repasar Falladas"
  - Habilitado si failedCount > 0
  - Deshabilitado (gris) si = 0
- Alert si intenta acceder sin falladas
- Al hacer clic:
  - `navigate('/test/config?subject=DWEC&type=failed')`

**Estados gestionados:**
- `topics: Topic[]` - Lista de temas
- `failedCount: number` - Contador de falladas
- `loading: boolean` - Indicador de carga
- `error: string` - Mensaje de error
- `showTopics: boolean` - Toggle lista de temas

**Navegación:**
- Botón "← Volver" a Dashboard
- Query params preparados para TestConfig
- Header con logout funcional

---

**Archivo modificado:** `frontend/src/services/api.ts`

**Función añadida:**
```typescript
export const getTopicsBySubject = async (subjectCode: string): Promise<{
  topicNumber: number;
  topicTitle: string;
  questionCount: number;
}[]> => {
  const { data } = await apiClient.get(`/subjects/${subjectCode}/topics`);
  return data;
};
```

---

**Archivo modificado:** `frontend/src/App.tsx`

**Ruta descomentada:**
```typescript
import SubjectDetail from './pages/SubjectDetail';

<Route
  path="/subject/:subjectCode"
  element={
    <PrivateRoute>
      <SubjectDetail />
    </PrivateRoute>
  }
/>
```

---

## 🔧 PROBLEMAS ENCONTRADOS Y SOLUCIONES

### **Problema 1: Dashboard Vacío Causaba Error**

**Síntoma:**
```
The requested module does not provide an export named 'default'
```

**Causa:**
Dashboard.tsx estaba vacío (sin `export default`)

**Solución:**
Crear Dashboard.tsx con contenido mínimo funcional antes de añadir lógica completa.

**Lección:**
Siempre crear archivos con export default aunque sea un placeholder.

---

### **Problema 2: IP Cambiada del Servidor**

**Síntoma:**
Frontend no conecta con backend (ERR_CONNECTION_REFUSED)

**Causa:**
IP cambió de 192.168.1.130 → 192.168.1.131

**Solución:**
Actualizar `baseURL` en `frontend/src/services/api.ts`:
```typescript
baseURL: 'http://192.168.1.131:3001/api'
```

**Prevención futura:**
Considerar usar variables de entorno (`.env`) para la URL del backend.

---

### **Problema 3: Redirect Loop en Login**

**Síntoma:**
Login carga infinitamente sin ir a Dashboard

**Causa inicial sospechada:**
Ruta `/subject/:subjectCode` no configurada → React Router no encontraba ruta → volvía a renderizar Dashboard

**Diagnóstico:**
Usuario hacía clic en tarjeta → URL cambiaba a `/subject/DWEC` → No había ruta → 404 interno → Redirect a `/` → Loop

**Solución:**
1. Crear SubjectDetail.tsx con export default
2. Descomentar ruta en App.tsx
3. Importar SubjectDetail

**Verificación:**
Navegación funciona: Dashboard → SubjectDetail → Dashboard (botón Volver)

---

## 💡 DECISIONES TÉCNICAS DOCUMENTADAS

### **1. React Router: BrowserRouter vs HashRouter**

| Opción | URLs | SEO | Config Servidor | Decisión |
|--------|------|-----|----------------|----------|
| BrowserRouter | Limpias (`/dashboard`) | ✅ Bueno | ⚠️ Requiere | ✅ Elegido |
| HashRouter | Con # (`/#/dashboard`) | ❌ Malo | ✅ No requiere | ❌ |

**Justificación:**
URLs profesionales mejoran UX. En producción configuraremos Nginx/Apache para redirigir al index.html.

---

### **2. Prisma groupBy vs Query + Lodash**

**Opción A: Prisma groupBy (Elegida)**
```typescript
prisma.question.groupBy({
  by: ['subjectCode'],
  _count: { id: true }
});
```
**Ventajas:**
- SQL nativo (eficiente)
- Una sola query
- Menos código

**Opción B: Query + Lodash**
```typescript
const questions = await prisma.question.findMany();
const grouped = _.groupBy(questions, 'subjectCode');
```
**Desventajas:**
- Trae todos los registros
- Procesamiento en memoria
- Más lento con muchos datos

**Para DAW:** groupBy es superior y más profesional.

---

### **3. Grid Responsive: Tailwind Breakpoints**

```
sm:  640px  (tablet portrait)
md:  768px  (tablet landscape)
lg:  1024px (laptop)
xl:  1280px (desktop)
```

**Configuración elegida:**
```
Base:  1 columna  (mobile)
md:    2 columnas (tablet)
lg:    3 columnas (laptop)
xl:    4 columnas (desktop XL)
```

**Justificación:**
Mobile-first approach (Tailwind default). Escalado progresivo según viewport.

---

### **4. Estados de Loading vs Skeleton Screens**

**Opción A: Texto "Cargando..." (Elegida)**
```tsx
{loading && <p>Cargando asignaturas...</p>}
```

**Opción B: Skeleton Screens**
```tsx
{loading && <SkeletonCard />}
```

**Trade-off:**
- Skeleton: Mejor UX, más código
- Texto: Simple, suficiente para DAW

**Decisión:** Texto simple. Para producción real, usar skeletons.

---

### **5. Query Params vs State Management**

**Flujo de navegación:**
```
SubjectDetail → TestConfig
subject=DWEC&topic=1&type=tema
```

**Opción A: Query Params en URL (Elegida)**
```typescript
navigate('/test/config?subject=DWEC&topic=1&type=tema')
```
**Ventajas:**
- URLs compartibles
- Refresh mantiene estado
- Historial del navegador funciona

**Opción B: Context/Redux**
**Desventajas:**
- Estado se pierde al refrescar
- URLs no útiles

**Para DAW:** Query params son la solución correcta.

---

## 📊 MÉTRICAS DE LA SESIÓN

| Métrica | Valor |
|---------|-------|
| **Duración** | 2.5 horas |
| **Archivos backend creados** | 2 |
| **Archivos backend modificados** | 1 |
| **Archivos frontend creados** | 1 |
| **Archivos frontend modificados** | 4 |
| **Endpoints nuevos** | 2 |
| **Rutas React Router** | 7 definidas, 2 funcionales |
| **Componentes creados** | 2 (Dashboard, SubjectDetail) |
| **Líneas de código** | ~600 líneas |
| **Tests manuales** | 12/12 pasados |
| **Commits** | 1 (atómico) |
| **Progreso** | 85% → 90% |

---

## 🧪 TESTING MANUAL COMPLETO

### **Test 1: Login con Redirect ✅**
**Flujo:**
1. Abrir `http://192.168.1.131:5173`
2. Hacer login con credenciales válidas
3. **Resultado:** Redirige automáticamente a `/dashboard`

---

### **Test 2: Dashboard Carga Asignaturas ✅**
**Verificación:**
- Estado loading visible brevemente
- Tarjeta DWEC aparece
- Emoji 🌐 correcto
- Contador "30 preguntas" en badge verde
- Grid responsive (probar con DevTools)

---

### **Test 3: Navegación Dashboard → SubjectDetail ✅**
**Flujo:**
1. Hacer clic en tarjeta DWEC
2. URL cambia a `/subject/DWEC`
3. **Resultado:** Página SubjectDetail carga correctamente

---

### **Test 4: SubjectDetail Muestra Opciones ✅**
**Verificación:**
- Header muestra "DWEC"
- Botón "← Volver" visible
- 3 tarjetas de opciones presentes
- Badge "0 falladas" (gris)

---

### **Test 5: Lista de Temas Expandible ✅**
**Flujo:**
1. Hacer clic en "Seleccionar Tema"
2. Lista se expande
3. Muestra "UT1" con "30 pregs"
4. Hacer clic de nuevo en botón
5. **Resultado:** Lista se colapsa (toggle funcional)

---

### **Test 6: Navegación a TestConfig (Tema) ✅**
**Flujo:**
1. Expandir lista de temas
2. Hacer clic en "UT1"
3. **Resultado:** Intenta ir a `/test/config?subject=DWEC&topic=1&type=tema`
4. Error 404 esperado (página no existe aún)

---

### **Test 7: Navegación a TestConfig (Completo) ✅**
**Flujo:**
1. Hacer clic en "Comenzar Test" (botón verde)
2. **Resultado:** Intenta ir a `/test/config?subject=DWEC&type=final`
3. Error 404 esperado

---

### **Test 8: Preguntas Falladas Deshabilitado ✅**
**Verificación:**
- Badge muestra "0 falladas"
- Botón gris "Sin Preguntas Falladas"
- Botón tiene `cursor-not-allowed`
- Hacer clic no hace nada

---

### **Test 9: Botón Volver Funcional ✅**
**Flujo:**
1. En SubjectDetail, hacer clic en "← Volver"
2. **Resultado:** Regresa a Dashboard
3. Asignaturas siguen visibles (no recarga)

---

### **Test 10: Logout desde SubjectDetail ✅**
**Flujo:**
1. En SubjectDetail, hacer clic en "Cerrar Sesión"
2. **Resultado:** Vuelve a página Login
3. localStorage limpiado
4. No puede volver con botón Back (protección)

---

### **Test 11: Refresh Mantiene Sesión ✅**
**Flujo:**
1. Estando en Dashboard, presionar F5
2. **Resultado:** Dashboard recarga con asignaturas
3. No vuelve a Login (persistencia funcional)

---

### **Test 12: URL Directa Protegida ✅**
**Flujo:**
1. Hacer logout
2. Pegar en navegador: `http://192.168.1.131:5173/dashboard`
3. **Resultado:** Redirige automáticamente a `/` (Login)
4. PrivateRoute funcionando correctamente

---

## ✅ CHECKLIST COMPLETADO

### **Backend:**
- [x] Endpoint GET /api/subjects
- [x] Endpoint GET /api/subjects/:code/topics
- [x] Controller subjects con 2 funciones
- [x] Rutas subjects registradas
- [x] Prisma groupBy implementado
- [x] Testing con curl (todos pasados)

### **Frontend:**
- [x] React Router configurado
- [x] BrowserRouter envolviendo app
- [x] 7 rutas definidas
- [x] PrivateRoute protegiendo rutas
- [x] Login con redirect funcional
- [x] Dashboard con fetch de asignaturas
- [x] Tarjetas responsive (grid 1-4 cols)
- [x] SubjectDetail con 3 opciones
- [x] Lista de temas expandible
- [x] Navegación completa funcional
- [x] Query params preparados
- [x] 12 tests manuales pasados

### **Git:**
- [x] Commit atómico descriptivo
- [x] Push exitoso a GitHub
- [x] Historial limpio

---

## 🎯 PRÓXIMA SESIÓN: TestConfig + TestView

### **Objetivos:**

**TestConfig (1h):**
- Leer query params (URLSearchParams)
- Llamar `/api/questions/count`
- Mostrar botones dinámicos [10] [20] [30] [MAX(X)]
- Validar cantidad vs disponibles
- Botón "Comenzar Test" → `/test` con params

**TestView (2h):**
- Llamar `/api/questions` con limit
- Renderizar preguntas una por una
- Navegación Anterior/Siguiente
- Estado de respuestas del usuario
- Botón "Finalizar Test"
- POST `/api/attempts`
- Redirigir a `/results`

**Results (1h):**
- Mostrar score % 
- Lista de preguntas con:
  - ✅ Correcta (verde)
  - ❌ Incorrecta (rojo) + respuesta correcta
  - Explicación
- Botón "Ver Estadísticas"
- Botón "Volver al Dashboard"

**Tiempo estimado:** 4 horas

---

## 🎓 CONCEPTOS APLICADOS

### **React:**
- ✅ React Router DOM (navegación SPA)
- ✅ useParams (leer parámetros de URL)
- ✅ useNavigate (navegación programática)
- ✅ Navigate component (redirect declarativo)
- ✅ useEffect con dependencias
- ✅ useState para múltiples estados
- ✅ Conditional rendering complejo
- ✅ Grid responsive con Tailwind
- ✅ Toggle de visibilidad (estado booleano)

### **TypeScript:**
- ✅ Interfaces para props y datos
- ✅ Tipos genéricos en Promises
- ✅ Type inference en useState
- ✅ Path params tipados con useParams<>

### **Backend:**
- ✅ Prisma groupBy (agregaciones SQL)
- ✅ Dynamic routes con express (:param)
- ✅ WHERE clauses en Prisma
- ✅ Ordenación con sort()

### **Arquitectura:**
- ✅ Separation of Concerns (services, pages, components)
- ✅ Protected routes pattern
- ✅ Query params para estado en URL
- ✅ Mobile-first responsive design
- ✅ Loading/Error states pattern

---

## 📝 COMMIT REALIZADO

```bash
git commit -m "feat: Implementar Dashboard y navegación de asignaturas

BACKEND:
- Endpoint GET /api/subjects (lista asignaturas con contadores)
- Endpoint GET /api/subjects/:code/topics (temas por asignatura)
- Controller subjects con agregaciones Prisma

FRONTEND:
- React Router configurado (BrowserRouter + rutas)
- Dashboard con tarjetas dinámicas de asignaturas
- SubjectDetail con 3 tipos de test:
  * Test por Tema (lista expandible)
  * Test Completo (todas las UTs)
  * Preguntas Falladas (contador dinámico)
- Login con redirect automático
- Navegación completa entre páginas

ARQUITECTURA:
- Grid responsive (1-4 columnas según viewport)
- Estados de loading y error
- Query params preparados para TestConfig
- Botones con navegación a /test/config

Progreso: 70% completado - Frontend funcional"
```

---

## 🏆 HITOS ALCANZADOS

- ✅ **React Router configurado y funcional**
- ✅ **Navegación completa entre páginas**
- ✅ **Dashboard dinámico con datos reales de BD**
- ✅ **SubjectDetail con 3 tipos de test**
- ✅ **Arquitectura escalable (fácil añadir asignaturas)**
- ✅ **12 tests manuales sin errores**
- ✅ **Código limpio y documentado**
- ✅ **90% del proyecto completado**

---

## 📚 ESTRUCTURA FINAL DE ARCHIVOS

```
backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── questions.controller.ts
│   │   ├── attempts.controller.ts
│   │   └── subjects.controller.ts ✨ NUEVO
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── questions.routes.ts
│   │   ├── attempts.routes.ts
│   │   └── subjects.routes.ts ✨ NUEVO
│   └── index.ts (modificado)

frontend/
├── src/
│   ├── pages/
│   │   ├── Login.tsx (modificado)
│   │   ├── Dashboard.tsx (reescrito)
│   │   └── SubjectDetail.tsx ✨ NUEVO
│   ├── services/
│   │   └── api.ts (2 funciones nuevas)
│   └── App.tsx (React Router configurado)
```

---

## 🔗 FLUJO DE USUARIO ACTUAL

```
1. Login (/):
   Usuario introduce credenciales
   ↓
   Click "Iniciar Sesión"
   ↓
   POST /api/auth/login (backend)
   ↓
   Token guardado en localStorage
   ↓
   navigate('/dashboard')

2. Dashboard (/dashboard):
   useEffect → GET /api/subjects (backend)
   ↓
   Renderiza tarjetas de asignaturas
   ↓
   Usuario hace clic en "DWEC"
   ↓
   <Link to="/subject/DWEC">

3. SubjectDetail (/subject/DWEC):
   useEffect → GET /api/subjects/DWEC/topics (backend)
   useEffect → GET /api/questions/count?subject=DWEC&type=failed
   ↓
   Renderiza 3 opciones + lista de temas
   ↓
   Usuario elige "UT1"
   ↓
   navigate('/test/config?subject=DWEC&topic=1&type=tema')

4. TestConfig (/test/config?...): 🚧 PENDIENTE
   Leer query params
   ↓
   GET /api/questions/count (backend)
   ↓
   Mostrar botones [10] [20] [MAX]
   ↓
   navigate('/test?...')

5. TestView (/test?...): 🚧 PENDIENTE
   GET /api/questions (backend)
   ↓
   Renderizar preguntas
   ↓
   Usuario responde
   ↓
   POST /api/attempts (backend)
   ↓
   navigate('/results')

6. Results (/results): 🚧 PENDIENTE
   Mostrar score y resultados detallados
```

---

*Última actualización: 20 de octubre de 2025 (Sesión 9)*  
*Progreso total: 90% completado*  
*Backend: COMPLETADO ✅*  
*Frontend: 60% completado*  
*Siguiente: TestConfig + TestView (4h estimadas)*