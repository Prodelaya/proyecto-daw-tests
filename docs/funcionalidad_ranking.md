# 🏆 Guía: Añadir Sistema de Ranking

---

## 🎯 ¿Qué vamos a hacer?

Crear una página que muestre un **podio visual** con los 3 usuarios que más tests han realizado, y una **tabla** con el resto del ranking ordenado por cantidad de tests completados.

**Tiempo estimado:** 1-2 horas  
**Dificultad:** Baja-Media

---

## 📋 PASO 1: Backend - Controller (20 min)

### ¿Qué hacer?
Crear un controller que consulte la base de datos y devuelva el ranking de usuarios ordenados por cantidad de intentos.

### Por qué
Prisma permite usar `_count` para contar relaciones sin cargar todos los datos en memoria. Es más eficiente que traer todos los `attempts[]` y contarlos en JavaScript.

### Cómo

**Crear archivo:** `backend/src/controllers/ranking.controller.ts`

```typescript
import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getRanking = async (req: Request, res: Response) => {
  try {
    const rankings = await prisma.user.findMany({
      select: {
        name: true,
        _count: {
          select: { attempts: true }
        }
      },
      orderBy: {
        attempts: { _count: 'desc' }
      },
      take: 100 // Top 100, ajusta si quieres menos
    });

    const formattedRanking = rankings.map((user, index) => ({
      position: index + 1,
      name: user.name,
      totalTests: user._count.attempts
    }));

    res.json(formattedRanking);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ranking' });
  }
};
```

### Cómo verificar
El archivo existe en la ruta correcta con la función `getRanking` exportada.

---

## 📋 PASO 2: Backend - Rutas (10 min)

### ¿Qué hacer?
Conectar la URL `/api/ranking` con el controller que acabas de crear.

### Por qué
Express necesita saber qué función ejecutar cuando alguien hace `GET /api/ranking`. Añadimos `authMiddleware` para que solo usuarios logueados puedan ver el ranking.

### Cómo

**Crear archivo:** `backend/src/routes/ranking.routes.ts`

```typescript
import { Router } from 'express';
import { getRanking } from '../controllers/ranking.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getRanking);

export default router;
```

### Cómo verificar
El archivo existe con la ruta GET configurada.

---

## 📋 PASO 3: Backend - Registrar ruta en Express (5 min)

### ¿Qué hacer?
Importar las rutas de ranking y registrarlas en el servidor Express.

### Por qué
Sin este paso, Express no sabe que existe la ruta `/api/ranking`. Es como crear una función pero nunca llamarla.

### Cómo

**Editar archivo:** `backend/src/index.ts`

```typescript
// Al inicio del archivo, añadir con los otros imports:
import rankingRoutes from './routes/ranking.routes';

// Después de las otras rutas (auth, questions, attempts), añadir:
app.use('/api/ranking', rankingRoutes);
```

### Cómo verificar
Reinicia el servidor (`npm run dev`). No hay errores en consola y al hacer `GET http://localhost:3001/api/ranking` con Thunder Client (añadiendo token JWT en header) recibes un array JSON.

**🎯 Checkpoint Backend:** Endpoint funciona y devuelve ranking ordenado.

---

## 📋 PASO 4: Frontend - Tipo TypeScript (5 min)

### ¿Qué hacer?
Definir la interfaz que describe la forma de cada entrada del ranking.

### Por qué
TypeScript necesita saber qué propiedades tiene cada objeto para darte autocompletado y evitar errores.

### Cómo

**Editar archivo:** `frontend/src/types/index.ts`

```typescript
// Al final del archivo, añadir:

export interface RankingEntry {
  position: number;
  name: string;
  totalTests: number;
}
```

### Cómo verificar
El archivo compila sin errores y puedes importar `RankingEntry` en otros archivos.

---

## 📋 PASO 5: Frontend - Servicio API (10 min)

### ¿Qué hacer?
Crear función que llama al endpoint `/api/ranking` usando axios.

### Por qué
Centralizar las llamadas HTTP. El interceptor de axios añadirá automáticamente el token JWT del `localStorage`.

### Cómo

**Editar archivo:** `frontend/src/services/api.ts`

```typescript
// Al final del archivo, después de las otras funciones, añadir:

export const getRanking = async (): Promise<RankingEntry[]> => {
  const { data } = await apiClient.get('/ranking');
  return data;
};
```

**Nota:** No olvides importar el tipo al inicio:
```typescript
import { User, Question, AttemptResult, Stats, RankingEntry } from '../types';
```

### Cómo verificar
No hay errores de TypeScript. La función está disponible para ser importada en componentes.

---

## 📋 PASO 6: Frontend - Página Ranking (30-40 min)

### ¿Qué hacer?
Crear la página completa con podio visual para top 3 y tabla para el resto de usuarios.

### Por qué
Es el corazón de la funcionalidad. Muestra de forma atractiva quién lidera el ranking. El diseño de podio (1º más alto, 2º y 3º más bajos) es más visual que una simple lista.

### Cómo

**Crear archivo:** `frontend/src/pages/Ranking.tsx`

```tsx
import { useEffect, useState } from 'react';
import { getRanking } from '../services/api';
import { RankingEntry } from '../types';

export default function Ranking() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRanking()
      .then(setRanking)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center p-8">Cargando ranking...</div>;
  }

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">🏆 Ranking de Tests</h1>

      {/* Podio - Top 3 */}
      <div className="flex justify-center items-end gap-4 mb-12">
        {/* 2º Puesto */}
        {top3[1] && (
          <div className="text-center">
            <div className="bg-gray-200 rounded-lg p-6 h-32 flex flex-col justify-end">
              <div className="text-4xl mb-2">🥈</div>
              <p className="font-bold">{top3[1].name}</p>
              <p className="text-sm text-gray-600">{top3[1].totalTests} tests</p>
            </div>
          </div>
        )}

        {/* 1º Puesto (más alto) */}
        {top3[0] && (
          <div className="text-center">
            <div className="bg-yellow-300 rounded-lg p-6 h-40 flex flex-col justify-end">
              <div className="text-5xl mb-2">🥇</div>
              <p className="font-bold text-lg">{top3[0].name}</p>
              <p className="text-sm">{top3[0].totalTests} tests</p>
            </div>
          </div>
        )}

        {/* 3º Puesto */}
        {top3[2] && (
          <div className="text-center">
            <div className="bg-orange-200 rounded-lg p-6 h-24 flex flex-col justify-end">
              <div className="text-3xl mb-2">🥉</div>
              <p className="font-bold">{top3[2].name}</p>
              <p className="text-sm text-gray-600">{top3[2].totalTests} tests</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabla - Resto del ranking */}
      {rest.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Posición
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Tests realizados
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rest.map((entry) => (
                <tr key={entry.position} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    #{entry.position}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {entry.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-right">
                    {entry.totalTests}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mensaje si no hay datos */}
      {ranking.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          Aún no hay usuarios con tests completados
        </div>
      )}
    </div>
  );
}
```

### Cómo verificar
La página compila sin errores. Puedes navegar manualmente a `http://localhost:5173/ranking` (aunque aún no hay botón visible, puedes escribir la URL).

---

## 📋 PASO 7: Frontend - Añadir ruta en React Router (5 min)

### ¿Qué hacer?
Registrar la página Ranking como una ruta protegida en la aplicación.

### Por qué
React Router necesita saber que `/ranking` debe renderizar el componente `<Ranking />`. Al envolverlo en `<PrivateRoute>`, solo usuarios autenticados pueden acceder.

### Cómo

**Editar archivo:** `frontend/src/App.tsx`

```tsx
// Al inicio, añadir import:
import Ranking from './pages/Ranking';

// Dentro de <Routes>, añadir la nueva ruta:
<Route 
  path="/ranking" 
  element={
    <PrivateRoute>
      <Ranking />
    </PrivateRoute>
  } 
/>
```

### Cómo verificar
Ejecutas `npm run dev` sin errores. Puedes navegar a `/ranking` escribiendo la URL manualmente.

---

## 📋 PASO 8: Frontend - Añadir enlace visible (10 min)

### ¿Qué hacer?
Añadir un botón o enlace en el Dashboard (o navbar) para que los usuarios puedan acceder al ranking fácilmente.

### Por qué
Los usuarios no van a adivinar que existe `/ranking`. Necesitan un botón visible. Lo colocamos en Dashboard porque es la página principal tras login.

### Cómo

**Editar archivo:** `frontend/src/pages/Dashboard.tsx` (o donde tengas la navegación principal)

```tsx
// Al inicio, importar Link si no está:
import { Link } from 'react-router-dom';

// Dentro del JSX, añadir junto a las otras tarjetas/botones:
<Link 
  to="/ranking"
  className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition flex items-center justify-center gap-2"
>
  <span className="text-2xl">🏆</span>
  <span>Ver Ranking</span>
</Link>
```

**Alternativa (botón completo tipo tarjeta):**
```tsx
<Link 
  to="/ranking"
  className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition"
>
  <div className="text-4xl mb-2">🏆</div>
  <h3 className="text-xl font-bold text-white mb-2">Ranking</h3>
  <p className="text-purple-100">Compite con tus compañeros</p>
</Link>
```

### Cómo verificar
Recargas el navegador, ves el botón "Ver Ranking" en el Dashboard. Al hacer clic, navegas a la página de ranking.

**🎯 Checkpoint Final:** Flujo completo funciona: Dashboard → Ranking → Ver podio y tabla.

---

## ✅ Checklist de Verificación

Antes de dar por terminado, verifica:

- [ ] Backend responde en `/api/ranking` con array JSON
- [ ] Array está ordenado por `totalTests` descendente
- [ ] Frontend carga ranking sin errores en consola
- [ ] Podio muestra top 3 visualmente diferenciados (1º más alto)
- [ ] Tabla muestra usuarios desde posición #4 en adelante
- [ ] Diseño es responsive (prueba en móvil con DevTools)
- [ ] Botón de acceso visible en Dashboard
- [ ] Ruta protegida (si no estás logueado, redirige a login)

---

## 🐛 Errores Comunes

### "Cannot read property '_count' of undefined"
→ No hay usuarios en la BD o no tienen `attempts`. Crea usuarios y realiza tests de prueba.

### "404 Not Found" al llamar `/api/ranking`
→ Olvidaste registrar las rutas en `index.ts` o no reiniciaste el servidor backend.

### El podio no se ve centrado
→ Verifica que el contenedor padre tenga `justify-center` en Tailwind. Prueba reducir el ancho de las tarjetas.

### "Module not found: Can't resolve './pages/Ranking'"
→ Revisa que el archivo `Ranking.tsx` esté en la carpeta correcta y tenga `export default`.

---

## 💡 Mejoras Opcionales (Para Después)

Si quieres llevar el ranking más allá:

1. **Destacar tu posición:** Resaltar con color diferente la fila del usuario logueado
   ```tsx
   className={entry.name === user.name ? 'bg-blue-50' : ''}
   ```

2. **Filtro por asignatura:** Dropdown para ver ranking específico de DWEC, DWES, etc.
   ```tsx
   <select onChange={(e) => setSubjectFilter(e.target.value)}>
   ```

3. **Período temporal:** Botones "Esta semana / Este mes / Todo"
   ```tsx
   const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
   ```

4. **Porcentaje promedio:** Añadir columna con avg score además de cantidad
   ```prisma
   // En Prisma query:
   _avg: { select: { score: true } }
   ```

5. **Paginación:** Si hay muchos usuarios, mostrar de 20 en 20
   ```tsx
   const [page, setPage] = useState(1);
   ```

---

## 🎯 Lo Que Has Aprendido

Al completar esta funcionalidad dominas:

✅ Agregaciones de Prisma con `_count`  
✅ Ordenación SQL con `orderBy`  
✅ Diseño de podio responsive con Flexbox  
✅ Tablas HTML semánticas con Tailwind  
✅ Navegación en React Router con `Link`  
✅ Rutas protegidas con `PrivateRoute`  

**Esto demuestra conocimiento de fullstack completo: desde la consulta SQL hasta la UI final.**