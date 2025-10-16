# 📊 Sesión 8: Autenticación Frontend - AuthContext + Login

## 🎯 Estado Previo del Proyecto

### ✅ Checkpoint al Inicio de la Sesión
- ✅ Backend 100% funcional (autenticación + questions + attempts + stats)
- ✅ Frontend estructura base (types, services con axios + interceptor JWT)
- ✅ 30 preguntas DWEC UT1 en PostgreSQL
- ✅ Todos los endpoints backend testeados con curl

**Progreso anterior:** 82% completado

---

## 🆕 Trabajo Realizado en Esta Sesión (2.5h)

### **Objetivo Principal:**
Implementar sistema completo de autenticación en el frontend con persistencia de sesión.

---

## 📦 COMPONENTES IMPLEMENTADOS

### **1. AuthContext (Context API)**

**Propósito:**
Centralizar el estado de autenticación en toda la aplicación mediante React Context.

**Funcionalidades implementadas:**
- Estado global: `user` (User | null), `loading` (boolean)
- Función `loginUser(email, password)` → Llama API + guarda en localStorage
- Función `registerUser(email, password, name)` → Registra + auto-login
- Función `logoutUser()` → Limpia localStorage + resetea estado
- Hook personalizado `useAuth()` para consumir el contexto
- Persistencia: `useEffect` lee localStorage al montar

**Decisión técnica crítica:**
```
¿Guardar solo token o también user en localStorage?
```

**Opción elegida:** Guardar AMBOS (token + user)

**Ventajas:**
- ✅ No requiere llamada al backend al refrescar página (UX rápida)
- ✅ Datos instantáneos (nombre usuario visible inmediatamente)

**Desventajas:**
- ❌ Si el usuario cambia su nombre en otro dispositivo, este no se actualiza

**Para DAW:** La opción elegida es suficiente (no hay escenario multi-dispositivo).

---

### **2. Página Login/Registro**

**Propósito:**
Punto de entrada de la aplicación con formulario dual (Login/Registro).

**Características implementadas:**
- Toggle entre Login y Registro (useState)
- Inputs controlados (email, password, name)
- Validaciones frontend ANTES de enviar al backend:
  - Email no vacío + formato válido (regex)
  - Password ≥ 6 caracteres
  - Name requerido solo en modo Registro
- Loading state durante peticiones
- Manejo de errores del backend con mensajes claros
- Toggle limpia inputs al cambiar modo (UX)
- Early return si ya hay sesión (muestra mensaje de éxito)

**Diseño:**
- Mobile-first con Tailwind CSS
- Tarjeta blanca centrada vertical y horizontalmente
- Responsive (w-full max-w-md)
- Estados visuales claros (loading, error, éxito)

---

### **3. Actualización de App.tsx**

**Cambios:**
- Eliminado contenido placeholder de Vite
- Envuelto en `<AuthProvider>` (proporciona contexto a toda la app)
- Renderiza `<Login />` como página principal (temporal)
- Eliminado `App.css` (Tailwind lo reemplaza)

**Nota:** Después (con React Router), aquí irán todas las rutas.

---

## 🔧 PROBLEMAS ENCONTRADOS Y SOLUCIONES

### **Problema 1: ESLint Warning - Fast Refresh**

**Error:**
```
Fast refresh only works when a file only exports components.
Use a new file to share constants or functions between components.
```

**Causa:**
AuthContext.tsx exporta tanto componente (`AuthProvider`) como hook (`useAuth`).

**Solución aplicada:**
Añadir comentario al inicio del archivo:
```typescript
/* eslint-disable react-refresh/only-export-components */
```

**Trade-off analizado:**
- **Opción A (elegida):** Suprimir warning (1 archivo, cohesión)
- **Opción B:** Separar en 3 archivos (AuthContext.tsx, useAuth.ts, index.ts)

**Decisión:** Opción A
- **Razón:** Para un proyecto DAW, la simplicidad prima sobre micro-optimizaciones
- **Convención común:** Muchos proyectos profesionales exportan Provider + hook juntos

---

### **Problema 2: Tailwind CSS v4 Incompatibilidad**

**Error:**
```
[postcss] The PostCSS plugin has moved to a separate package.
You need to install @tailwindcss/postcss
```

**Causa:**
npm instaló Tailwind v4 (última versión) que cambió la arquitectura completamente.

**Solución aplicada:**
Downgrade a Tailwind v3.4.1:
```bash
npm uninstall tailwindcss
npm install -D tailwindcss@3.4.1 postcss autoprefixer
```

**Justificación:**
- Tailwind v3 es estable, con más documentación y tutoriales
- v4 requiere configuración diferente (@tailwindcss/postcss)
- Para DAW, mejor usar versión probada

---

### **Problema 3: Frontend No Conecta con Backend**

**Error en navegador:**
```
Error al conectar con el servidor
net::ERR_CONNECTION_REFUSED
```

**Análisis del problema:**
- Backend corriendo en servidor Linux (192.168.1.130:3001)
- Frontend en servidor Linux (192.168.1.130:5173)
- Desarrollo desde Windows vía SSH
- Navegador en Windows intentaba conectar a `localhost:3001` de Windows (no existe)

**Diagnóstico paso a paso:**
1. ✅ curl desde terminal del servidor → Funciona
2. ❌ Navegador Windows → Falla
3. ✅ Test-NetConnection desde Windows → Puertos accesibles
4. 🎯 Conclusión: Configuración de IPs/puertos

**Soluciones aplicadas:**

**Backend:**
```typescript
// ANTES: Solo escucha en localhost del servidor
app.listen(PORT, () => { ... });

// DESPUÉS: Escucha en todas las interfaces de red
app.listen(PORT, '0.0.0.0', () => { ... });
```

**Frontend (Vite):**
```typescript
// vite.config.ts
server: {
  host: '0.0.0.0',  // Accesible desde la red
  port: 5173
}
```

**Frontend (baseURL):**
```typescript
// api.ts
// ANTES: baseURL: 'http://localhost:3001/api'
// DESPUÉS: baseURL: 'http://192.168.1.130:3001/api'
```

**Verificaciones con netstat:**
```bash
# ANTES (problema):
tcp  0.0.0.0:3001  127.0.0.1:3001  LISTEN  # Solo local

# DESPUÉS (solución):
tcp  0.0.0.0:3001  0.0.0.0:*       LISTEN  # Todas las interfaces
```

---

### **Problema 4: Firewall (Falsa Alarma)**

**Verificación:**
```bash
sudo ufw status
# Status: inactive
```

**Conclusión:** No era problema de firewall, sino de configuración de host.

---

## 🧪 TESTING MANUAL COMPLETO

### **Metodología:**
Testing exhaustivo de flujos end-to-end antes de hacer commit.

### **Tests Realizados (10/10 Pasados):**

**TEST 1: Validaciones Frontend**
- ✅ Email vacío → Error "El email es obligatorio"
- ✅ Email inválido → Error "Email inválido"
- ✅ Password corto → Error "La contraseña debe tener al menos 6 caracteres"

**TEST 2: Registro Usuario Nuevo**
- ✅ Botón "Cargando..." durante petición
- ✅ Mensaje verde "✅ Sesión iniciada, Bienvenido [nombre]"
- ✅ Auto-login tras registro (registerUser llama a loginUser)

**TEST 3: localStorage**
- ✅ Token guardado (empieza con "eyJ...")
- ✅ User guardado (JSON con id, email, name)

**TEST 4: Persistencia**
- ✅ Refrescar página (F5) mantiene sesión
- ✅ useEffect lee localStorage correctamente al montar

**TEST 5: Logout Manual**
- ✅ Borrar token + user de localStorage
- ✅ Refrescar vuelve al formulario de Login

**TEST 6: Login Usuario Existente**
- ✅ Login exitoso con credenciales correctas
- ✅ Token y user guardados en localStorage

**TEST 7: Password Incorrecta**
- ✅ Error "Credenciales inválidas" (401)
- ✅ Formulario NO desaparece (buena UX)
- ✅ Inputs mantienen valores (usuario puede corregir)

**TEST 8: Toggle Limpia Inputs**
- ✅ Login → Registro: inputs se vacían
- ✅ Registro → Login: inputs se vacían
- ✅ Input Nombre aparece/desaparece según modo

**TEST 9: Usuario en PostgreSQL**
- ✅ Usuario guardado en tabla "User"
- ✅ Password hasheada con bcrypt ($2b$10$...)
- ✅ Fecha createdAt registrada

**TEST 10: Email Duplicado**
- ✅ Error "El email ya está registrado" (409)
- ✅ Backend detecta violación de constraint UNIQUE

---

## 🎓 DECISIONES TÉCNICAS DOCUMENTADAS

### **1. React Context vs Redux/Zustand**

**Decisión:** React Context API

**Justificación:**
- ✅ Nativo de React (sin dependencias extra)
- ✅ Suficiente para estado de autenticación simple
- ✅ Proyecto DAW no requiere estado global complejo
- ❌ Redux sería overkill para este caso

---

### **2. localStorage vs sessionStorage**

**Decisión:** localStorage

**Justificación:**
- ✅ Persiste tras cerrar navegador (mejor UX)
- ✅ Usuario no tiene que hacer login cada vez
- ❌ sessionStorage se pierde al cerrar pestaña

**Seguridad considerada:**
- Token JWT tiene expiración (24h)
- Para DAW es suficiente (no hay datos ultra-sensibles)
- Producción real: considerar cookies HttpOnly + refresh tokens

---

### **3. Validación Frontend vs Solo Backend**

**Decisión:** Validación en AMBOS

**Frontend:**
- ✅ Feedback instantáneo (UX)
- ✅ Ahorra peticiones HTTP innecesarias

**Backend:**
- ✅ Seguridad (frontend es modificable)
- ✅ Validación definitiva con Zod

**Principio:** "Never trust the client"

---

### **4. Auto-login Tras Registro**

**Decisión:** registerUser() llama a loginUser() automáticamente

**Flujo:**
```
Registro exitoso → Auto-login → Redirect a dashboard
```

**Ventaja UX:**
- Usuario no tiene que hacer login manualmente tras registrarse
- Flujo más fluido y natural

---

### **5. Mensaje de Error Genérico en Login**

**Decisión:** "Credenciales inválidas" (sin distinguir email vs password)

**Razón de seguridad:**
- ❌ Evita: "Email no encontrado" → Revela qué emails existen
- ✅ Mejor: "Credenciales inválidas" → No revela información

---

### **6. Toggle Limpia Inputs**

**Decisión:** Al cambiar Login ↔ Registro, limpiar todos los inputs

**Justificación UX:**
- ✅ Evita confusión (datos de login en formulario de registro)
- ✅ Estado limpio al cambiar de modo
- ✅ Limpia errores previos

---

## 🌐 NETWORKING: DESARROLLO REMOTO

### **Arquitectura de Desarrollo:**

```
┌──────────────────────────────────────┐
│        PC WINDOWS (192.168.1.136)    │
│                                      │
│  - VSCode con Remote SSH            │
│  - Navegador (testing)              │
│  - MobaXterm (terminal SSH)         │
└──────────────┬───────────────────────┘
               │ SSH puerto 1492
               │
               ▼
┌──────────────────────────────────────┐
│   SERVIDOR LINUX (192.168.1.130)    │
│                                      │
│  Backend: 0.0.0.0:3001              │
│  Frontend: 0.0.0.0:5173             │
│  PostgreSQL: localhost:5432         │
└──────────────────────────────────────┘
```

### **Lecciones Aprendidas:**

**localhost vs 0.0.0.0:**
- `localhost` / `127.0.0.1`: Solo accesible desde el propio servidor
- `0.0.0.0`: Escucha en TODAS las interfaces (accesible desde red)

**Acceso desde Windows:**
- Frontend: `http://192.168.1.130:5173`
- Backend: `http://192.168.1.130:3001/api`

**Alternativa considerada (no aplicada):**
SSH Port Forwarding:
```bash
ssh -L 5173:localhost:5173 -L 3001:localhost:3001 user@server
```
- No fue necesario (configuración 0.0.0.0 funcionó)

---

## 📊 MÉTRICAS DE LA SESIÓN

| Métrica | Valor |
|---------|-------|
| **Duración** | 2.5 horas |
| **Archivos creados** | 2 (AuthContext.tsx, Login.tsx) |
| **Archivos modificados** | 6 (App.tsx, api.ts, index.ts, vite.config.ts, package.json) |
| **Archivos eliminados** | 1 (App.css) |
| **Líneas de código** | ~500 líneas (con comentarios) |
| **Tests manuales** | 10/10 pasados |
| **Problemas resueltos** | 4 (ESLint, Tailwind v4, Networking, localStorage) |
| **Commits** | 1 (commit atómico descriptivo) |
| **Progreso del proyecto** | 82% → 85% |

---

## 🎓 CONCEPTOS APRENDIDOS

### **React:**
- ✅ Context API para estado global
- ✅ Custom hooks (useAuth)
- ✅ useEffect con array de dependencias vacío (mount)
- ✅ Inputs controlados con useState
- ✅ Conditional rendering ({condition && <Component />})
- ✅ Event handlers (onChange, onSubmit, onClick)
- ✅ preventDefault en formularios
- ✅ Loading states para UX

### **Autenticación:**
- ✅ JWT (JSON Web Tokens)
- ✅ localStorage para persistencia
- ✅ Hash de passwords con bcrypt
- ✅ Validación de credenciales
- ✅ Status codes HTTP (200, 201, 401, 409)
- ✅ Interceptores axios (añadir JWT automáticamente)

### **Networking:**
- ✅ localhost vs IP de red vs 0.0.0.0
- ✅ Configurar servidores para escuchar en todas las interfaces
- ✅ CORS y comunicación cliente-servidor
- ✅ Port forwarding (concepto)
- ✅ Diagnóstico con netstat, lsof, Test-NetConnection

### **Debugging:**
- ✅ DevTools → Console (errores JavaScript)
- ✅ DevTools → Network (peticiones HTTP)
- ✅ DevTools → Application → Local Storage
- ✅ Testing con curl desde terminal
- ✅ Verificar puertos con lsof y netstat

---

## 🔄 FLUJO DE AUTENTICACIÓN IMPLEMENTADO

### **Registro:**
```
1. Usuario rellena formulario (email, password, name)
2. Frontend valida datos
3. registerUser() llama POST /api/auth/register
4. Backend:
   - Valida con Zod
   - Verifica email único
   - Hashea password (bcrypt 10 rounds)
   - Crea usuario en PostgreSQL
   - Responde 201
5. Frontend auto-login:
   - loginUser(email, password)
6. Guarda token + user en localStorage
7. Muestra mensaje "✅ Sesión iniciada"
```

### **Login:**
```
1. Usuario rellena formulario (email, password)
2. Frontend valida datos
3. loginUser() llama POST /api/auth/login
4. Backend:
   - Busca usuario por email
   - Verifica password con bcrypt.compare()
   - Genera JWT (válido 24h)
   - Responde 200 con {token, user}
5. Frontend guarda en localStorage
6. Muestra mensaje "✅ Sesión iniciada"
```

### **Persistencia:**
```
1. Usuario refresca página (F5)
2. AuthProvider se monta
3. useEffect ejecuta:
   - Lee localStorage.getItem('token')
   - Lee localStorage.getItem('user')
   - Si ambos existen: setUser(JSON.parse(user))
4. Usuario sigue logueado (no vuelve al login)
```

### **Logout:**
```
1. Usuario borra localStorage (manual o botón)
2. localStorage.removeItem('token')
3. localStorage.removeItem('user')
4. setUser(null)
5. Login.tsx detecta user === null
6. Muestra formulario de login
```

---

## ✅ CHECKLIST DE VERIFICACIÓN FINAL

Antes de hacer commit, se verificó:

- [x] AuthContext funciona (estado global accesible)
- [x] useAuth hook funciona (no errores en componentes)
- [x] Registro exitoso guarda en PostgreSQL
- [x] Login exitoso devuelve JWT válido
- [x] localStorage tiene token + user tras login
- [x] Refrescar página mantiene sesión (persistencia)
- [x] Validaciones frontend funcionan
- [x] Errores del backend se muestran correctamente
- [x] Toggle Login/Registro limpia inputs
- [x] Password hasheada en BD (bcrypt)
- [x] Email duplicado rechazado (409)
- [x] Password incorrecta rechazada (401)
- [x] Frontend accesible desde red (192.168.1.130:5173)
- [x] Backend accesible desde red (192.168.1.130:3001)
- [x] Sin errores en consola del navegador
- [x] Código limpio y comentado

---

## 🚀 PRÓXIMA SESIÓN: React Router + Dashboard

### **Objetivos:**

**1. Configurar React Router (30 min)**
- Instalar `react-router-dom`
- Definir rutas: `/`, `/dashboard`, `/test/config`, `/test`, `/stats`
- Crear componente `PrivateRoute` (proteger rutas autenticadas)

**2. Página Dashboard (1h)**
- 3 tarjetas principales:
  - Test por Tema
  - Test Final de Módulo
  - Preguntas Falladas
- Llamar `getQuestionsCount()` para mostrar cantidades dinámicas
- Diseño mobile-first con Tailwind

**3. Navegación básica (30 min)**
- Links entre páginas
- Botón Logout (llama logoutUser + redirect a /)
- Menú de navegación simple

**Tiempo estimado:** 2 horas

---

## 📝 NOTAS PARA FUTURAS SESIONES

### **Mejoras Consideradas (No Implementadas Aún):**

**Refresh Token:**
- Actualmente: Solo access token (24h)
- Mejora: Access token corto (15 min) + Refresh token (7 días)
- Trade-off: Más complejidad vs mejor seguridad
- Para DAW: Access token 24h es suficiente

**Endpoint GET /api/auth/me:**
- Propósito: Obtener user actualizado del backend
- Ventaja: Datos siempre sincronizados
- Desventaja: Latencia extra al cargar app
- Decisión actual: localStorage suficiente

**Logout en Backend:**
- Actualmente: Solo limpia localStorage (frontend)
- Mejora: Endpoint POST /api/auth/logout + blacklist de tokens
- Trade-off: Complejidad vs necesidad real
- Para DAW: Logout frontend suficiente

---

## 🎊 RESUMEN EJECUTIVO

### **Lo Que Se Logró:**
✅ Sistema completo de autenticación frontend-backend funcional  
✅ Persistencia de sesión con localStorage  
✅ Validaciones robustas en frontend y backend  
✅ 10/10 tests manuales pasados sin errores  
✅ Código limpio, comentado y tipado con TypeScript  
✅ UX pulida con loading states y manejo de errores  

### **Lo Que Falta:**
⏳ React Router para navegación entre páginas  
⏳ Páginas: Dashboard, TestView, Stats  
⏳ Componentes reutilizables (Button, Card, etc.)  
⏳ Deploy en producción (Vercel + Ubuntu)  

### **Progreso del Proyecto:**
**85% Completado** - Backend completo, autenticación funcional, faltan páginas principales.

---

*Última actualización: 15 de octubre de 2025 (Sesión 8)*  
*Próxima sesión: React Router + Dashboard (FASE 4 Parte 3)*  
*Siguiente commit: feat(frontend): Implementar React Router y Dashboard*