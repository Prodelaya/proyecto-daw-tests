# 📊 Sesión 10: FASE 4 - TestConfig (Selección Dinámica de Cantidad)

## 🎯 Estado Previo del Proyecto

### ✅ Checkpoint al Inicio
- ✅ Backend 100% funcional (auth + questions + attempts + subjects)
- ✅ Frontend: Login, Dashboard, SubjectDetail completos
- ✅ React Router configurado con rutas protegidas
- ✅ Flujo Dashboard → SubjectDetail funcionando
- ✅ 181 preguntas totales en PostgreSQL (DWEC completo)

**Progreso anterior:** 85% completado

---

## 🆕 Trabajo Realizado en Esta Sesión (2h)

### **Objetivo Principal:**
Implementar página de configuración de test que permite al usuario elegir la cantidad de preguntas antes de comenzar.

---

## 📦 COMPONENTE IMPLEMENTADO

### **TestConfig.tsx - Página de Configuración**

**Propósito:**
Intermediario entre SubjectDetail y TestView que permite al usuario elegir cuántas preguntas quiere responder.

**Funcionalidades implementadas:**

#### **1. Lectura de Query Params**
```typescript
const searchParams = new URLSearchParams(location.search);
const subject = searchParams.get('subject');
const topicStr = searchParams.get('topic');
const type = searchParams.get('type');
```

**Uso de URLSearchParams nativo:**
- Sin dependencias adicionales
- Compatible con todos los navegadores modernos
- Acceso directo a query string

#### **2. Fetch de Contador de Preguntas**
```typescript
useEffect(() => {
  const fetchCount = async () => {
    const data = await getQuestionsCount({
      subjectCode: subject,
      topicNumber: topic,
      type: type as 'tema' | 'final' | 'failed'
    });
    setAvailableCount(data.count);
  };
  fetchCount();
}, [subject, topic, type]);
```

**Llamada al endpoint:**
- `GET /api/questions/count?subject=DWEC&topic=1&type=tema`
- Respuesta: `{ count: 30, ... }`

#### **3. Generación Dinámica de Botones**

**Lógica implementada:**
```
Si count >= 40 → [10] [20] [30] [40] [MAX (count)]
Si count >= 30 → [10] [20] [30] [MAX (count)]
Si count >= 20 → [10] [20] [MAX (count)]
Si count >= 10 → [10] [MAX (count)]
Si count < 10  → [MAX (count)]
```

**Código:**
```typescript
const generateQuantityOptions = () => {
  const options = [10, 20, 30, 40].filter(opt => opt < availableCount);
  return [...options, availableCount]; // Siempre incluye MAX
};
```

#### **4. Estado de Selección**
```typescript
const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
```

**Feedback visual:**
- Botón seleccionado: `bg-blue-600 text-white`
- Botón no seleccionado: `bg-white text-gray-700`
- Indicador textual: "✓ Cantidad seleccionada: 20 preguntas"

#### **5. Navegación con Parámetros**
```typescript
const handleStartTest = () => {
  if (!selectedQuantity) return;
  
  const params = new URLSearchParams({
    subject: subject!,
    type: type!,
    limit: selectedQuantity.toString()
  });
  
  if (topic) {
    params.set('topic', topic.toString());
  }
  
  navigate(`/test?${params.toString()}`);
};
```

**Ejemplo de URL generada:**
```
/test?subject=DWEC&type=tema&limit=20&topic=1
```

---

## 💡 DECISIONES TÉCNICAS DOCUMENTADAS

### **1. URLSearchParams vs useSearchParams (React Router)**

| Opción | Código | Ventaja | Desventaja | Decisión |
|--------|--------|---------|------------|----------|
| URLSearchParams nativo | `new URLSearchParams(location.search)` | Sin dependencias, universal | Más verbose | ✅ Elegido |
| useSearchParams (RRv6) | `const [params] = useSearchParams()` | API limpia de RR | Acoplamiento a React Router | ❌ |

**Justificación:**
URLSearchParams es estándar web, funciona en cualquier contexto, y el código es igualmente legible.

---

### **2. Lógica de Botones Dinámicos**

**Problema:** ¿Qué botones mostrar según cantidad disponible?

**Solución elegida:**
```
Botones fijos: [10, 20, 30, 40]
Filtro: Solo mostrar si opt < availableCount
Siempre añadir: [MAX (count)]
```

**Ejemplo práctico:**
```
28 preguntas → [10] [20] [MAX (28)]
45 preguntas → [10] [20] [30] [40] [MAX (45)]
8 preguntas  → [MAX (8)]
```

**Trade-off:**
- ✅ Predecible (siempre mismos números)
- ✅ Fácil de entender para el usuario
- ❌ No permite cantidad custom (ej: 25)

**Para DAW:** Simplicidad > flexibilidad total

---

### **3. Validación de Cantidad**

**Validación en TestConfig:**
```typescript
if (selectedQuantity > availableCount) {
  alert('Cantidad seleccionada mayor a disponibles');
  return;
}
```

**Validación en backend:**
```typescript
// Backend limita automáticamente
const limitedQuestions = questions.slice(0, limit);
```

**Defensa en profundidad:** Validación en ambos lados.

---

### **4. Estado de "Sin Preguntas"**

**Caso:** `availableCount === 0`

**Mensaje contextual según tipo:**
```typescript
{type === 'failed' && (
  <p>Aún no has fallado ninguna pregunta. ¡Sigue así! 🎉</p>
)}
{type === 'tema' && (
  <p>Este tema no tiene preguntas cargadas aún.</p>
)}
```

**UX mejorada:** Mensajes específicos en lugar de genérico "No hay preguntas".

---

## 🎨 DISEÑO Y UX

### **Estados Visuales Implementados:**

#### **1. Loading**
```tsx
{loading && (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">⏳</div>
    <p>Cargando preguntas disponibles...</p>
  </div>
)}
```

#### **2. Error**
```tsx
{error && (
  <div className="bg-red-100 border border-red-400 ...">
    <p className="font-semibold">{error}</p>
    <Link to="/dashboard">← Volver al Dashboard</Link>
  </div>
)}
```

#### **3. Sin Preguntas (count = 0)**
```tsx
{availableCount === 0 && (
  <div className="bg-yellow-100 ...">
    <h3 className="text-xl font-bold">No hay preguntas disponibles</h3>
    <p>{mensaje contextual según type}</p>
  </div>
)}
```

#### **4. Contenido Normal**
- Tarjeta informativa con emoji según tipo
- Contador de preguntas disponibles
- Grid de botones responsive
- Botón "Comenzar Test" (gris → verde)

---

### **Emojis por Tipo de Test:**

```typescript
{type === 'tema' && '📝'}
{type === 'final' && '🎯'}
{type === 'failed' && '❌'}
```

---

### **Responsive Design:**

```
Botones en flex-wrap:
- Mobile:  2 columnas (apilados)
- Desktop: 1 fila (horizontal)

Padding/spacing:
- px-6 py-8 (móvil)
- max-w-4xl mx-auto (desktop)
```

---

## 🧪 TESTING MANUAL COMPLETO

### **Test 1: Test por Tema (30 preguntas) ✅**
```
URL: /test/config?subject=DWEC&topic=1&type=tema
Resultado: [10] [20] [MAX (30)]
```

### **Test 2: Test Final (181 preguntas) ✅**
```
URL: /test/config?subject=DWEC&type=final
Resultado: [10] [20] [30] [40] [MAX (181)]
```

### **Test 3: Preguntas Falladas (0 preguntas) ✅**
```
URL: /test/config?subject=DWEC&type=failed
Resultado: 
- Fondo amarillo
- "0 preguntas disponibles"
- "Aún no has fallado ninguna pregunta. ¡Sigue así! 🎉"
```

### **Test 4: Selección de Cantidad ✅**
```
1. Clic en [20]
   - Botón se pone azul
   - Aparece "✓ Cantidad seleccionada: 20 preguntas"
2. Clic en [10]
   - [20] vuelve a gris
   - [10] se pone azul
   - Mensaje actualiza: "10 preguntas"
```

### **Test 5: Botón Comenzar Deshabilitado ✅**
```
Sin seleccionar cantidad:
- Botón gris
- cursor-not-allowed
- Hover muestra mensaje: "Selecciona una cantidad primero"
```

### **Test 6: Navegación Completa ✅**
```
1. Seleccionar [20]
2. Clic en "🚀 Comenzar Test"
3. Navega a: /test?subject=DWEC&topic=1&type=tema&limit=20
4. (404 esperado - TestView no existe aún)
```

---

## 🔧 MODIFICACIONES EN OTROS ARCHIVOS

### **App.tsx - Ruta Descomentada**

**Antes:**
```typescript
/* TODO: Descomentar cuando creemos las páginas
<Route path="/test/config" ... />
*/
```

**Después:**
```typescript
import TestConfig from './pages/TestConfig';

<Route
  path="/test/config"
  element={
    <PrivateRoute>
      <TestConfig />
    </PrivateRoute>
  }
/>
```

---

## 📊 MÉTRICAS DE LA SESIÓN

| Métrica | Valor |
|---------|-------|
| **Duración** | 2 horas |
| **Archivos creados** | 1 (TestConfig.tsx ~250 líneas) |
| **Archivos modificados** | 1 (App.tsx - import + ruta) |
| **Tests manuales** | 6/6 pasados ✅ |
| **Problemas encontrados** | 0 (flujo sin bloqueos) |
| **Progreso** | 85% → 95% |

---

## ✅ CHECKLIST COMPLETADO

### **Funcionalidad:**
- [x] Lectura de query params (subject, topic, type)
- [x] Fetch de contador de preguntas
- [x] Generación dinámica de botones
- [x] Estado de selección con feedback visual
- [x] Validación cantidad <= disponibles
- [x] Navegación con todos los parámetros
- [x] Botón comenzar habilitado solo tras selección

### **Estados:**
- [x] Loading mientras carga contador
- [x] Error si falla la petición
- [x] Sin preguntas (count = 0)
- [x] Mensajes contextuales según tipo

### **UX:**
- [x] Diseño responsive mobile-first
- [x] Emojis identificativos por tipo
- [x] Botones con hover effects
- [x] Indicador visual de selección
- [x] Mensajes claros y útiles

### **Integración:**
- [x] Ruta descomentada en App.tsx
- [x] PrivateRoute aplicado
- [x] Navegación desde SubjectDetail funcional
- [x] Query params preparados para TestView

---

## 🎯 PRÓXIMA SESIÓN: TestView

### **Objetivos (2-3 horas):**

**TestView.tsx (1.5-2h):**
- Leer query params (subject, topic, type, limit)
- Fetch de preguntas con `GET /api/questions`
- Estado: `questions[]`, `currentIndex`, `userAnswers[]`
- Renderizar pregunta actual con radio buttons
- Navegación Anterior/Siguiente
- Progreso visual: "Pregunta X de N"
- Validar que todas las preguntas tienen respuesta
- Botón "Finalizar Test" al llegar a la última

**Submit Attempt (30 min):**
- Construir payload con respuestas del usuario
- `POST /api/attempts` con array de answers
- Manejar respuesta con score y resultados
- Navegar a `/results` con data

**Testing (30 min):**
- Flujo completo end-to-end
- Verificar guardado en PostgreSQL
- Comprobar detección de falladas

---

## 🎓 CONCEPTOS APLICADOS

### **Frontend:**
- ✅ URLSearchParams (Web API estándar)
- ✅ Query params en React Router
- ✅ useEffect con dependencias múltiples
- ✅ Generación dinámica de componentes (map)
- ✅ Conditional rendering complejo
- ✅ Estado de selección con feedback
- ✅ Validaciones frontend

### **UX:**
- ✅ Estados visuales claros (loading, error, vacío)
- ✅ Feedback inmediato de interacción
- ✅ Botones disabled con tooltip
- ✅ Mensajes contextuales según tipo
- ✅ Mobile-first responsive

### **Arquitectura:**
- ✅ Página intermedia entre selección y ejecución
- ✅ Query params como contrato entre páginas
- ✅ Validación cliente + servidor (defensa en profundidad)
- ✅ Separación de responsabilidades (config vs ejecución)

---

## 📝 COMMIT REALIZADO

```bash
git commit -m "feat(frontend): Implementar TestConfig con selección dinámica de cantidad

FUNCIONALIDAD:
- Lectura de query params (subject, topic, type)
- Fetch de contador de preguntas disponibles
- Botones dinámicos según cantidad (10, 20, 30, MAX)
- Estados: loading, error, sin preguntas
- Selección de cantidad con feedback visual
- Navegación a /test con limit

MEJORAS:
- Responsive mobile-first
- Validaciones de cantidad
- Mensajes contextuales según tipo de test
- Botón comenzar habilitado solo tras selección

Progreso: 95% completado - Solo falta TestView y Results"
```

---

## 🏆 HITOS ALCANZADOS

- ✅ **TestConfig completo y funcional**
- ✅ **Flujo Dashboard → SubjectDetail → TestConfig OK**
- ✅ **Query params validados y propagados**
- ✅ **UX pulida con estados claros**
- ✅ **6 tests manuales sin errores**
- ✅ **Código limpio y documentado**
- ✅ **95% del proyecto completado**

---

## 📚 ESTRUCTURA FINAL DE ARCHIVOS

```
frontend/src/pages/
├── Login.tsx ✅
├── Dashboard.tsx ✅
├── SubjectDetail.tsx ✅
├── TestConfig.tsx ✅ NUEVO
├── TestView.tsx ⏳ SIGUIENTE
├── Results.tsx ⏳
└── Stats.tsx ⏳

frontend/src/
├── App.tsx (ruta /test/config descomentada)
├── services/api.ts
├── types/index.ts
└── context/AuthContext.tsx
```

---

## 🔗 FLUJO DE USUARIO ACTUAL

```
1. Dashboard (/dashboard):
   Usuario ve asignaturas
   ↓
   Clic en "DWEC"

2. SubjectDetail (/subject/DWEC):
   Usuario elige tipo de test
   ↓
   Clic en "UT1" (tema)

3. TestConfig (/test/config?subject=DWEC&topic=1&type=tema): ✅ NUEVO
   Usuario elige cantidad
   ↓
   Selecciona [20]
   ↓
   Clic "Comenzar Test"

4. TestView (/test?subject=DWEC&topic=1&type=tema&limit=20): 🚧 PENDIENTE
   Usuario responde preguntas
   ↓
   Clic "Finalizar Test"

5. Results (/results): 🚧 PENDIENTE
   Usuario ve score y resultados detallados
```

---

*Última actualización: 20 de octubre de 2025 (Sesión 10)*  
*Progreso total: 95% completado*  
*Backend: COMPLETADO ✅*  
*Frontend: 85% completado*  
*Siguiente: TestView (fetch + navegación + submit)*