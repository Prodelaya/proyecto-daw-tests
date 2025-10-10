# 🎓 Guía de Desarrollo Paso a Paso - Proyecto DAW Tests

---

## 🔧 PASO 0: Preparación del Entorno (1-2 horas)

### ¿Qué vamos a hacer?
Instalar todo el software necesario antes de escribir código.

### Tareas:

#### 0.1 - En tu ordenador local
**Qué hacer:** Instalar Node.js, Git y Visual Studio Code  
**Por qué:** Son las herramientas base para desarrollar. Node ejecuta JavaScript, Git guarda versiones del código, VSCode es el editor.  
**Cómo verificar:** Abre terminal y escribe `node --version` y `git --version`. Deben mostrar números de versión.

#### 0.2 - En Ubuntu Server
**Qué hacer:** Conectar por SSH e instalar Node.js, PostgreSQL y PM2  
**Por qué:** El servidor necesita Node para ejecutar el backend, PostgreSQL para guardar datos, y PM2 para mantener la app corriendo.  
**Cómo verificar:** Después de instalar, ejecuta `sudo systemctl status postgresql` y debe decir "active (running)".

#### 0.3 - Crear base de datos
**Qué hacer:** Entrar a PostgreSQL y crear la base de datos `tests_daw` con un usuario  
**Por qué:** La aplicación necesita un lugar donde guardar usuarios, preguntas y resultados  
**Cómo verificar:** Apunta el nombre de BD, usuario y contraseña. Los necesitarás después.

#### 0.4 - Cuentas online
**Qué hacer:** Crear cuenta en GitHub y Vercel  
**Por qué:** GitHub guarda tu código online, Vercel hospeda el frontend gratis  
**Cómo verificar:** Puedes iniciar sesión en ambas páginas.

---

## 📂 FASE 1: Setup Inicial (2-3 horas)

### ¿Qué vamos a hacer?
Crear carpetas, instalar librerías y configurar la base de datos.

### Tareas:

#### 1.1 - Estructura de carpetas
**Qué hacer:** Crear carpeta principal con subcarpetas `frontend/`, `backend/` y `docs/`  
**Por qué:** Separar frontend (lo que ve el usuario) del backend (servidor con lógica) mantiene todo ordenado  
**Cómo verificar:** Haz `ls` y ves las 3 carpetas.

#### 1.2 - Inicializar Git
**Qué hacer:** Ejecutar `git init` y crear primer commit  
**Por qué:** Git guarda un historial de cambios. Si rompes algo, puedes volver atrás  
**Cómo verificar:** Ejecuta `git log` y ves tu primer commit.

#### 1.3 - Setup Frontend
**Qué hacer:** Crear proyecto React con Vite, instalar Tailwind CSS, React Router y testing libraries  
**Por qué:** Vite es rápido para desarrollar, Tailwind da estilos, React Router maneja páginas, testing permite probar código  
**Cómo verificar:** Ejecuta `npm run dev` y abre localhost:5173 en el navegador. Ves la página de Vite.

#### 1.4 - Setup Backend
**Qué hacer:** Crear proyecto Node con Express, instalar Prisma, JWT, bcrypt, Zod  
**Por qué:** Express crea la API REST, Prisma conecta con PostgreSQL, JWT autentica usuarios, bcrypt cifra contraseñas, Zod valida datos  
**Cómo verificar:** La carpeta backend tiene `package.json` con todas las dependencias listadas.

#### 1.5 - Configurar Prisma
**Qué hacer:** Ejecutar `npx prisma init`, editar `schema.prisma` con las 4 tablas (User, Question, Attempt, UserFailedQuestion), ejecutar migración  
**Por qué:** Prisma traduce código TypeScript a SQL. El schema define qué datos guardamos y cómo se relacionan  
**Cómo verificar:** Ejecuta `npx prisma studio` y ves la interfaz con 4 tablas vacías.

#### 1.6 - Crear Seed
**Qué hacer:** Escribir script que lee tu JSON y lo inserta en la tabla Question  
**Por qué:** Necesitas llenar la BD con preguntas antes de poder hacer tests  
**Cómo verificar:** Ejecuta `npx prisma db seed`, luego abre Prisma Studio y ves preguntas en la tabla Question.

**🎯 Checkpoint:** Frontend arranca, backend tiene estructura, PostgreSQL tiene preguntas cargadas.

---

## 🔐 FASE 2: Sistema de Autenticación (3-4 horas)

### ¿Qué vamos a hacer?
Crear registro y login de usuarios con seguridad.

### Tareas:

#### 2.1 - Estructura backend
**Qué hacer:** Crear carpetas `routes/`, `controllers/`, `middlewares/`, `utils/`, `schemas/` dentro de `src/`  
**Por qué:** Organizar código por responsabilidad. Routes define URLs, controllers tiene lógica, middlewares validan, utils tiene funciones auxiliares  
**Cómo verificar:** Haces `ls src/` y ves las 5 carpetas.

#### 2.2 - Utilidad JWT
**Qué hacer:** Crear funciones `generateToken()` y `verifyToken()` en `utils/jwt.ts`  
**Por qué:** JWT es el "carnet de identidad" digital. Cuando un usuario hace login, le das un token que demuestra quién es en cada petición  
**Cómo verificar:** El archivo existe con las dos funciones.

#### 2.3 - Schemas de validación
**Qué hacer:** Definir con Zod qué datos son válidos para registro y login  
**Por qué:** Evita que usuarios envíen basura (emails mal formados, contraseñas vacías). Zod valida automáticamente  
**Cómo verificar:** Archivo `schemas/auth.schemas.ts` existe con `registerSchema` y `loginSchema`.

#### 2.4 - Middleware validador
**Qué hacer:** Crear middleware que usa Zod para validar `req.body` antes de llegar al controller  
**Por qué:** Si los datos son inválidos, rechaza la petición antes de tocar la BD. Ahorra código repetido  
**Cómo verificar:** Archivo `middlewares/validator.ts` existe con función `validate()`.

#### 2.5 - Controlador Auth
**Qué hacer:** Crear funciones `register()` y `login()` que interactúan con Prisma  
**Por qué:** Aquí está la lógica: register hashea contraseña y crea usuario, login verifica contraseña y genera token  
**Cómo verificar:** Archivo `controllers/auth.controller.ts` existe con ambas funciones.

#### 2.6 - Rutas Auth
**Qué hacer:** Conectar URLs `/api/auth/register` y `/api/auth/login` con los controllers  
**Por qué:** Define qué función se ejecuta cuando alguien llama a cada URL  
**Cómo verificar:** Archivo `routes/auth.routes.ts` existe con 2 rutas POST.

#### 2.7 - Servidor Express
**Qué hacer:** Crear `index.ts` que inicializa Express, añade middlewares (cors, helmet, json) y registra rutas  
**Por qué:** Es el "punto de entrada" del backend. Sin esto, nada funciona  
**Cómo verificar:** Ejecutas `npm run dev` y ves "🚀 Servidor corriendo en http://localhost:3001".

#### 2.8 - Probar con Thunder Client
**Qué hacer:** Enviar peticiones POST a `/register` y `/login` con JSON de prueba  
**Por qué:** Verificar que todo funciona antes de crear el frontend. Si falla aquí, no tiene sentido continuar  
**Cómo verificar:** Register devuelve status 201, login devuelve token JWT.

**🎯 Checkpoint:** Puedes registrar usuarios y hacer login. Recibes un token válido.

---

## 📝 FASE 3: API de Tests (4-5 horas)

### ¿Qué vamos a hacer?
Crear endpoints para obtener preguntas, enviar respuestas y calcular estadísticas.

### Tareas:

#### 3.1 - Middleware de autenticación
**Qué hacer:** Crear middleware que valida el token JWT en cada petición protegida  
**Por qué:** Evita que usuarios no autenticados accedan a preguntas o stats. Lee el token del header `Authorization: Bearer xxx` y verifica que sea válido  
**Cómo verificar:** Archivo `middlewares/auth.middleware.ts` existe. Extrae `userId` del token y lo pone en `req.userId`.

#### 3.2 - Schemas de preguntas
**Qué hacer:** Definir con Zod los parámetros válidos para pedir preguntas (subjectCode, topicNumber, type, limit)  
**Por qué:** Validar que el frontend envía datos correctos al pedir preguntas  
**Cómo verificar:** Archivo `schemas/questions.schemas.ts` con `getQuestionsSchema`.

#### 3.3 - Controlador de preguntas
**Qué hacer:** Crear `getQuestions()` que filtra preguntas según parámetros y `getQuestionsCount()` que cuenta cuántas hay  
**Por qué:**  
- **getQuestions:** Busca en BD con filtros (tema específico / final módulo / falladas), mezcla aleatoriamente, limita cantidad, y NO envía la respuesta correcta (para no hacer trampas)  
- **getQuestionsCount:** Necesario para mostrar botones dinámicos (10, 20, 30... MAX)  
**Cómo verificar:** Archivo `controllers/questions.controller.ts` con ambas funciones.

#### 3.4 - Schemas de intentos
**Qué hacer:** Definir con Zod la estructura de un intento: subjectCode, topicNumber, array de respuestas  
**Por qué:** Validar que el frontend envía las respuestas en el formato correcto  
**Cómo verificar:** Archivo `schemas/attempts.schemas.ts` con `submitAttemptSchema`.

#### 3.5 - Controlador de intentos
**Qué hacer:** Crear `submitAttempt()` y `getStats()`  
**Por qué:**  
- **submitAttempt:** Recibe respuestas del usuario, busca respuestas correctas en BD, compara, calcula score (%), guarda intento, detecta preguntas falladas y las guarda en `UserFailedQuestion`  
- **getStats:** Agrupa todos los intentos del usuario por asignatura/tema, calcula promedios, cuenta preguntas falladas  
**Cómo verificar:** Archivo `controllers/attempts.controller.ts` con ambas funciones. Lógica compleja: lee bien cada paso.

#### 3.6 - Rutas de preguntas y attempts
**Qué hacer:** Crear `routes/questions.routes.ts` y `routes/attempts.routes.ts` conectando URLs con controllers  
**Por qué:** Define qué función se ejecuta para cada endpoint. Añade `authMiddleware` para proteger rutas  
**Cómo verificar:** Ambos archivos existen. Todas las rutas usan `authMiddleware`.

#### 3.7 - Registrar rutas en index.ts
**Qué hacer:** Importar las nuevas rutas y añadirlas con `app.use('/api/questions', ...)` y `app.use('/api/attempts', ...)`  
**Por qué:** Sin esto, Express no sabe que existen esas rutas  
**Cómo verificar:** Reinicias servidor y no hay errores.

#### 3.8 - Probar endpoints
**Qué hacer:** Usar Thunder Client para probar los 4 nuevos endpoints  
**Por qué:** Verificar que la lógica funciona correctamente antes del frontend  
**Tests clave:**  
- GET /questions con filtros devuelve preguntas SIN correctAnswer  
- GET /questions/count devuelve número correcto  
- POST /attempts calcula score bien y guarda falladas  
- GET /stats devuelve objeto con promedios por asignatura  
**Cómo verificar:** Todas las peticiones devuelven datos coherentes. En Prisma Studio ves registros en Attempt y UserFailedQuestion.

**🎯 Checkpoint:** Backend completo. Puedes obtener preguntas, enviar respuestas y ver stats.

---

## 🎨 FASE 4: Frontend Completo (5-6 horas)

### ¿Qué vamos a hacer?
Crear todas las páginas de la web y conectarlas con la API.

### Tareas:

#### 4.1 - Estructura frontend
**Qué hacer:** Crear carpetas `components/`, `pages/`, `context/`, `services/`, `types/`, `hooks/` en `src/`  
**Por qué:** Organizar React por tipo de archivo. Pages = páginas completas, Components = piezas reutilizables, Services = llamadas API, Context = estado global  
**Cómo verificar:** Ejecutas `ls src/` y ves las 6 carpetas.

#### 4.2 - Tipos TypeScript
**Qué hacer:** Definir interfaces para User, Question, Answer, AttemptResult, Stats en `types/index.ts`  
**Por qué:** TypeScript necesita saber la forma de los datos. Evita errores de tipos y da autocompletado  
**Cómo verificar:** Archivo existe con 5 interfaces exportadas.

#### 4.3 - Servicio API
**Qué hacer:** Crear funciones en `services/api.ts` que usan axios para llamar al backend (login, register, getQuestions, submitAttempt, getStats)  
**Por qué:** Centralizar todas las llamadas HTTP en un solo lugar. Usa interceptor para añadir token automáticamente en cada petición  
**Cómo verificar:** Archivo existe con 6 funciones exportadas. Interceptor añade `Authorization: Bearer` si hay token en localStorage.

#### 4.4 - Contexto de autenticación
**Qué hacer:** Crear `AuthContext` con React Context API que guarda user, token, y funciones login/register/logout  
**Por qué:** Compartir el estado de autenticación entre todas las páginas sin prop drilling. Persiste user/token en localStorage para que no se pierda al recargar  
**Cómo verificar:** Archivo `context/AuthContext.tsx` exporta `AuthProvider` y `useAuth()` hook.

#### 4.5 - Página Login
**Qué hacer:** Crear formulario con toggle Login/Registro, campos email/password/name, manejo de errores  
**Por qué:** Primera página que ve el usuario. Debe ser intuitiva. Usa Tailwind para diseño responsive mobile-first  
**Cómo verificar:** Página en `pages/Login.tsx`. Puedes alternar entre login y registro. Después de login exitoso, redirige a /dashboard.

#### 4.6 - Dashboard
**Qué hacer:** Crear página con 3 tarjetas: Test por Tema, Test Final, Preguntas Falladas. Cada una muestra cantidad disponible  
**Por qué:** Hub principal de la app. Usuario elige qué tipo de test hacer. Usa `getQuestionsCount()` para mostrar números dinámicos  
**Cómo verificar:** Página en `pages/Dashboard.tsx`. Ves 3 tarjetas con iconos. Clic en cada una navega a /test/config con parámetros.

#### 4.7 - Configuración de Test
**Qué hacer:** Crear página que muestra botones dinámicos (10, 20, 30... MAX) según cantidad disponible  
**Por qué:** Usuario elige cuántas preguntas quiere antes de empezar. Evita cargar todas si hay 200 preguntas  
**Cómo verificar:** Página en `pages/TestConfig.tsx`. Si hay 28 preguntas disponibles, muestra [10] [20] [MAX(28)]. Clic en número selecciona y botón "Comenzar" navega a /test.

#### 4.8 - Vista de Test
**Qué hacer:** Crear página que muestra preguntas una por una, usuario selecciona respuesta, al finalizar envía todo y muestra resultados  
**Por qué:** Corazón de la aplicación. Debe ser clara: pregunta + 4 opciones + botones Anterior/Siguiente/Finalizar  
**Lógica:**  
- Estado guarda array de respuestas del usuario  
- Navegación entre preguntas (índice actual)  
- Al finalizar: llama `submitAttempt()`, recibe resultados, muestra score y qué preguntas falló  
**Cómo verificar:** Página en `pages/TestView.tsx`. Puedes responder test completo. Al finalizar, ves pantalla de resultados con % acierto y detalle de cada pregunta (correcta/incorrecta con explicación).

#### 4.9 - Página de Estadísticas
**Qué hacer:** Crear página que muestra stats por asignatura y tema: total intentos, promedio score, preguntas falladas  
**Por qué:** Usuario ve su progreso. Motiva a mejorar. Usa `getStats(userId)` y renderiza tablas o gráficos simples  
**Cómo verificar:** Página en `pages/Stats.tsx`. Ves datos agrupados: DWEC → Tema 1 (5 intentos, 85% promedio), etc.

#### 4.10 - Componentes reutilizables
**Qué hacer:** Crear componentes pequeños: QuestionCard (muestra 1 pregunta), Button, LoadingSpinner  
**Por qué:** Evitar repetir código. Si necesitas cambiar estilo de botones, lo haces en un solo lugar  
**Cómo verificar:** Carpeta `components/` tiene archivos .tsx con componentes. TestView usa QuestionCard.

#### 4.11 - Configurar React Router
**Qué hacer:** En `App.tsx` configurar rutas: / → Login, /dashboard → Dashboard (protegida), /test/config → TestConfig (protegida), /test → TestView (protegida), /stats → Stats (protegida)  
**Por qué:** Navegación entre páginas sin recargar. Rutas protegidas verifican que hay token antes de mostrar página  
**Cómo verificar:** App.tsx tiene `<BrowserRouter>` con `<Routes>`. Rutas protegidas tienen componente `<PrivateRoute>` que verifica autenticación.

#### 4.12 - Crear PrivateRoute
**Qué hacer:** Componente que verifica si hay usuario autenticado. Si no, redirige a /login  
**Por qué:** Evita que usuarios no autenticados accedan a páginas protegidas pegando URL  
**Cómo verificar:** Componente en `components/PrivateRoute.tsx`. Si no hay token, redirige automáticamente.

#### 4.13 - Pruebas completas
**Qué hacer:** Flujo completo: registrar → login → elegir test → configurar cantidad → responder → ver resultados → ver stats → logout  
**Por qué:** Verificar que todo funciona integrado. Buscar bugs de UX  
**Cómo verificar:** Haces el flujo completo sin errores en consola. Datos se guardan correctamente en BD.

**🎯 Checkpoint:** Frontend completo y funcional. Puedes hacer tests y ver estadísticas.

---

## 🚀 FASE 5: Deploy (2-3 horas)

### ¿Qué vamos a hacer?
Subir el frontend a Vercel y el backend a tu servidor Ubuntu.

### Tareas:

#### 5.1 - Subir código a GitHub
**Qué hacer:** Crear repositorio en GitHub, hacer `git remote add origin`, `git push`  
**Por qué:** GitHub guarda tu código online. Vercel necesita el repo para desplegar  
**Cómo verificar:** Ves tu código en github.com/tu-usuario/proyecto-daw-tests.

#### 5.2 - Deploy frontend en Vercel
**Qué hacer:** En vercel.com, conectar repo GitHub, elegir carpeta `frontend/`, añadir variable de entorno `VITE_API_URL=http://TU_IP:3001/api`  
**Por qué:** Vercel compila React y lo sirve en CDN global gratis. Variable de entorno dice dónde está tu backend  
**Cómo verificar:** Vercel te da URL tipo `tu-proyecto.vercel.app`. Abres y ves la página de login.

#### 5.3 - Preparar backend para producción
**Qué hacer:** En backend, crear script de build en package.json, compilar TypeScript a JavaScript  
**Por qué:** Producción ejecuta JavaScript compilado, no TypeScript directamente  
**Cómo verificar:** Ejecutas `npm run build` y se crea carpeta `dist/` con archivos .js.

#### 5.4 - Subir backend a Ubuntu
**Qué hacer:** Usar `scp` o GitHub para subir código a servidor, instalar dependencias con `npm install --production`  
**Por qué:** Ubuntu necesita el código y las librerías  
**Cómo verificar:** SSH al servidor, ves carpeta backend/ con node_modules/.

#### 5.5 - Configurar variables de entorno en Ubuntu
**Qué hacer:** Crear archivo `.env` en el servidor con `DATABASE_URL`, `JWT_SECRET`, `PORT=3001`  
**Por qué:** Backend necesita saber cómo conectarse a PostgreSQL local  
**Cómo verificar:** Ejecutas `cat .env` y ves las variables.

#### 5.6 - Iniciar backend con PM2
**Qué hacer:** Ejecutar `pm2 start dist/index.js --name api-tests`, luego `pm2 startup` y `pm2 save`  
**Por qué:** PM2 mantiene el backend corriendo incluso si se reinicia el servidor  
**Cómo verificar:** Ejecutas `pm2 status` y ves "api-tests" online.

#### 5.7 - Abrir puerto en firewall
**Qué hacer:** Ejecutar `sudo ufw allow 3001` para que el puerto sea accesible desde internet  
**Por qué:** Por defecto Ubuntu bloquea puertos. Necesitas abrirlo para que Vercel pueda conectarse  
**Cómo verificar:** Desde tu ordenador, haces `curl http://TU_IP:3001/api/health` y recibes respuesta.

#### 5.8 - Probar flujo completo
**Qué hacer:** Abrir URL de Vercel, registrar usuario, hacer test completo  
**Por qué:** Verificar que frontend en Vercel se comunica con backend en Ubuntu  
**Cómo verificar:** Todo funciona igual que en local. Sin errores CORS ni 404.

**🎯 Checkpoint:** Aplicación desplegada y accesible desde cualquier lugar.

---

## 🧪 FASE 6: Testing y Documentación (2 horas)

### ¿Qué vamos a hacer?
Escribir tests mínimos y documentar el proyecto.

### Tareas:

#### 6.1 - Configurar Vitest
**Qué hacer:** En frontend, crear archivo `vitest.config.ts` y setup para testing-library  
**Por qué:** Vitest ejecuta tests. Testing Library simula interacciones de usuario  
**Cómo verificar:** Ejecutas `npm run test` y dice "no test files found" (normal, aún no hay tests).

#### 6.2 - Test de componente Login
**Qué hacer:** Crear archivo `tests/Login.test.tsx` que verifica: renderiza formulario, cambia entre login/registro, muestra errores  
**Por qué:** Demostrar que sabes escribir tests. Login es componente crítico  
**Cómo verificar:** Ejecutas `npm run test` y el test pasa (verde).

#### 6.3 - Test de servicio API
**Qué hacer:** Mockear axios y verificar que `login()` envía petición correcta y guarda token  
**Por qué:** Verificar lógica de autenticación sin hacer peticiones reales  
**Cómo verificar:** Test pasa. Cubre caso exitoso y caso error.

#### 6.4 - Test de cálculo de stats
**Qué hacer:** Test unitario que verifica que función calcular promedio funciona bien  
**Por qué:** Lógica de stats es importante. Test asegura que no se rompe  
**Cómo verificar:** Test pasa con datos de ejemplo.

#### 6.5 - README del proyecto
**Qué hacer:** Crear README.md con: descripción, tecnologías, cómo instalar, cómo ejecutar, capturas  
**Por qué:** Cualquiera (incluso tú en 6 meses) puede entender y ejecutar el proyecto  
**Cómo verificar:** README tiene al menos: título, descripción, lista de tecnologías, sección "Instalación", sección "Uso".

#### 6.6 - Memoria técnica PDF
**Qué hacer:** Documento con: introducción, objetivos, análisis de requisitos, diseño (diagramas), implementación (decisiones técnicas), pruebas, conclusiones  
**Por qué:** Obligatorio para DAW. Demuestra que entiendes lo que hiciste  
**Cómo verificar:** PDF de 15-25 páginas con capturas de pantalla, diagramas de arquitectura, explicación de decisiones.

#### 6.7 - Capturas de pantalla
**Qué hacer:** Screenshots de: login, dashboard, test en progreso, resultados, stats  
**Por qué:** Demostrar visualmente que funciona. Van en memoria y README  
**Cómo verificar:** Carpeta `docs/screenshots/` con 5-7 imágenes PNG.

**🎯 Checkpoint:** Tests escritos, documentación completa, proyecto listo para entregar.

---

## 📊 Resumen de Tiempos

| Fase | Tiempo estimado | Dificultad |
|------|----------------|------------|
| Fase 0 | 1-2h | Fácil |
| Fase 1 | 2-3h | Media |
| Fase 2 | 3-4h | Media |
| Fase 3 | 4-5h | Alta |
| Fase 4 | 5-6h | Alta |
| Fase 5 | 2-3h | Media |
| Fase 6 | 2h | Fácil |
| **TOTAL** | **19-25h** | - |

---

## 🎯 Consejos para Novatos

### Cuándo pasar a la siguiente fase
✅ **Solo avanza si cumples TODOS los checkpoints de la fase actual**

Si algo no funciona:
1. Lee el error con calma
2. Busca en Google el error exacto
3. Revisa que no hay typos (errores de escritura)
4. Compara tu código con ejemplos online
5. Si llevas 1h bloqueado, pide ayuda

### Errores comunes

**"Cannot find module..."**  
→ No instalaste las dependencias. Ejecuta `npm install`

**"Port 3001 already in use"**  
→ Ya hay algo corriendo en ese puerto. Ejecuta `lsof -ti:3001 | xargs kill`

**"401 Unauthorized"**  
→ Token inválido o expirado. Haz login de nuevo

**CORS error en frontend**  
→ Backend necesita `app.use(cors())` antes de las rutas

**"relation does not exist" en Prisma**  
→ No hiciste la migración. Ejecuta `npx prisma migrate dev`

### Debugging básico

1. **Console.log es tu amigo:** Pon `console.log()` por todas partes para ver qué está pasando
2. **Prisma Studio:** Ábrelo siempre que tengas dudas de qué hay en la BD
3. **Thunder Client:** Prueba cada endpoint antes de conectar frontend
4. **DevTools del navegador:** F12 → pestaña Network para ver peticiones HTTP

---

## ✅ Checklist Final

Antes de entregar, verifica:

### Funcionalidad
- [ ] Puedo registrar un usuario
- [ ] Puedo hacer login
- [ ] Puedo elegir tipo de test
- [ ] Puedo seleccionar cantidad de preguntas
- [ ] Puedo responder test completo
- [ ] Veo resultados con score y explicaciones
- [ ] Veo mis estadísticas
- [ ] Las preguntas falladas se guardan
- [ ] Puedo hacer test solo de falladas
- [ ] El logout funciona

### Técnico
- [ ] Backend corre sin errores en Ubuntu
- [ ] Frontend desplegado en Vercel
- [ ] Base de datos tiene datos de prueba
- [ ] No hay contraseñas en texto plano en el código
- [ ] Variables sensibles están en .env (no en Git)
- [ ] README explica cómo instalar

### Documentación
- [ ] README.md completo
- [ ] Memoria PDF con diagramas
- [ ] Al menos 3 tests escritos y pasando
- [ ] Capturas de pantalla
- [ ] Código comentado en partes críticas

---

## 🚨 Qué hacer si te bloqueas

1. **Respira.** Los bugs son normales.
2. **Lee el error completo.** No solo la primera línea.
3. **Google.** Copia el error y busca. Alguien ya lo tuvo.
4. **Divide el problema.** Si falla "enviar intento", prueba primero obtener preguntas.
5. **Vuelve al último punto donde funcionaba.** Git te permite hacer `git checkout` a commits anteriores.
6. **Pide ayuda con contexto:** "Este código... da este error... ya probé esto..."

---

## 🎓 Lo que habrás aprendido

Al terminar este proyecto dominarás:

✅ React con TypeScript (componentes, hooks, context, routing)  
✅ API REST completa (CRUD, autenticación, validación)  
✅ Base de datos relacional (PostgreSQL + Prisma ORM)  
✅ Seguridad web básica (JWT, bcrypt, CORS, Helmet)  
✅ Deploy real (Vercel + Ubuntu + PM2)  
✅ Git para control de versiones  
✅ Testing básico con Vitest  
✅ Responsive design con Tailwind CSS  

**Todo esto es lo que buscan las empresas en un junior fullstack.**