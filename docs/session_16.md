# 📊 Sesión 16: FASE FINAL - Deploy Frontend en Vercel con Dominio Personalizado

## 🎯 Estado Previo del Proyecto

### ✅ Checkpoint al Inicio
- ✅ Backend 100% funcional en Ubuntu (192.168.1.131:3001)
- ✅ Backend expuesto públicamente vía Cloudflare Tunnel
- ✅ Dominio `prodelaya.dev` registrado y configurado
- ✅ Backend accesible en `https://api-tests.prodelaya.dev`
- ✅ Frontend 100% funcional en desarrollo local
- ✅ Variable `VITE_API_URL` configurada en código
- ✅ Código en GitHub actualizado

**Progreso anterior:** 95% completado - Backend en producción, frontend pendiente

---

## 🆕 Trabajo Realizado en Esta Sesión (1h)

### **Objetivo Principal:**
Desplegar el frontend en Vercel con dominio personalizado, configurar variables de entorno y verificar integración completa end-to-end con el backend en producción.

---

## 📦 FASE 1: PREPARACIÓN Y CONFIGURACIÓN EN VERCEL

### **1. Verificación Previa**

**Archivo verificado:** `frontend/src/services/api.ts`

**Configuración correcta:**
```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.1.131:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

**Decisión técnica:**
- `import.meta.env.VITE_API_URL`: Lee variable de entorno de Vite
- Fallback a IP local para desarrollo
- En producción: Vercel inyecta la variable durante el build

---

### **2. Acceso a Vercel**

**Proceso de registro:**
1. URL: https://vercel.com
2. Método de autenticación: **GitHub OAuth**
3. Autorización de repositorios concedida

**Ventajas de GitHub OAuth:**
- ✅ Deploy automático en cada push a `main`
- ✅ Preview deployments en pull requests
- ✅ Sincronización automática del código

---

### **3. Import del Proyecto**

**Configuración en Vercel:**

| Campo | Valor | Justificación |
|-------|-------|---------------|
| **Repository** | `proyecto-daw-tests` | Repo de GitHub |
| **Framework Preset** | Vite | Auto-detectado ✅ |
| **Root Directory** | `frontend` | ⚠️ CRÍTICO - Carpeta específica |
| **Build Command** | `npm run build` | Comando de package.json |
| **Output Directory** | `dist` | Directorio de salida de Vite |
| **Install Command** | `npm install` | Instalación de dependencias |

**¿Por qué especificar Root Directory?**
- Proyecto monorepo: `/backend` y `/frontend`
- Sin especificar: Vercel buscaría `package.json` en raíz
- Con `frontend`: Vercel solo construye el frontend

---

### **4. Variables de Entorno**

**Variable configurada en Vercel:**

```
Key: VITE_API_URL
Value: https://api-tests.prodelaya.dev/api
Environments: 
  ✅ Production
  ✅ Preview
  ✅ Development
```

**¿Por qué el prefijo `VITE_`?**
- Vite solo expone al cliente variables con prefijo `VITE_`
- Variables sin prefijo: Solo accesibles en servidor (seguridad)
- Alternativa rechazada: `process.env.REACT_APP_*` (Create React App)

**Seguridad:**
- Variables privadas (DB_PASSWORD) nunca se exponen
- Solo `VITE_*` van al bundle del navegador
- Backend gestiona credenciales sensibles

---

### **5. Deploy Inicial**

**Proceso de build:**
```
Running "npm install"...
✓ Dependencies installed

Running "npm run build"...
✓ TypeScript compiled
✓ Vite bundled assets
✓ Build completed successfully

Deploying...
✓ Deployed to: proyecto-daw-tests-xxx.vercel.app
```

**Tiempo de deploy:** ~2 minutos

**URL temporal asignada:**
```
https://proyecto-daw-tests-xxx.vercel.app
```

**Verificación inicial:**
- ✅ Build exitoso sin errores
- ✅ Página accesible
- ✅ Assets cargando correctamente

---

## 🌐 FASE 2: CONFIGURACIÓN DE DOMINIO PERSONALIZADO

### **1. Añadir Dominio en Vercel**

**Proceso:**

1. **Vercel Dashboard** → Proyecto → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Dominio introducido: `tests-daw.prodelaya.dev`
4. Click **"Add"**

**Instrucciones proporcionadas por Vercel:**
```
To use this domain, add the following DNS record:

Type: CNAME
Name: tests-daw
Value: cname.vercel-dns.com
```

---

### **2. Configuración DNS en Cloudflare**

**Dashboard de Cloudflare:**
1. Dominios → `prodelaya.dev` → **DNS**
2. Click **"Add record"**

**Configuración del registro:**

| Campo | Valor | Notas |
|-------|-------|-------|
| **Type** | CNAME | Alias a servidores Vercel |
| **Name** | `tests-daw` | Subdominio |
| **Target** | `cname.vercel-dns.com` | Endpoint de Vercel |
| **Proxy status** | ⚪ **DNS only** | ⚠️ CRÍTICO |
| **TTL** | Auto | Gestión automática |

---

### **3. Decisión Técnica: Proxy Cloudflare Desactivado**

**Problema detectado inicialmente:**
- Usuario configuró proxy **activado** (🟠 naranja)
- Esto causaría conflicto de certificados SSL

**Solución aplicada:**
- Toggle cambiado a **DNS only** (⚪ gris)
- Vercel gestiona certificado SSL directamente

**¿Por qué desactivar el proxy?**

**Con Proxy Activado (🟠):**
```
Usuario → Cloudflare Proxy (SSL propio) → Vercel (SSL propio)
                    ↑
              Conflicto de certificados
```

**Con Proxy Desactivado (⚪):**
```
Usuario → DNS resolve → Vercel (SSL único)
                         ↑
                   Sin conflictos ✅
```

**Trade-offs:**

| Aspecto | Con Proxy | Sin Proxy |
|---------|-----------|-----------|
| **DDoS Protection** | ✅ | ❌ |
| **WAF** | ✅ | ❌ |
| **Caché Cloudflare** | ✅ | ❌ |
| **SSL Vercel** | ❌ Conflicto | ✅ Funciona |
| **Vercel Analytics** | ❌ | ✅ |

**Decisión:** Priorizar funcionamiento SSL sobre protecciones Cloudflare.

---

### **4. Verificación del Dominio**

**Propagación DNS:**
- Tiempo estimado: 1-5 minutos
- Puede tardar hasta 24h en algunos casos

**Estado en Vercel:**
```
tests-daw.prodelaya.dev
⏳ Pending → ✅ Valid
```

**Verificación con dig:**
```bash
dig tests-daw.prodelaya.dev

# Respuesta esperada:
tests-daw.prodelaya.dev. 300 IN CNAME cname.vercel-dns.com.
```

---

### **5. Configurar como Dominio Principal**

**Proceso:**
1. Vercel → Settings → Domains
2. `tests-daw.prodelaya.dev` → Menú `···`
3. **"Set as Primary Domain"**

**Efecto:**
- Redirects automáticos: `.vercel.app` → `.prodelaya.dev`
- SEO mejorado (dominio único)
- Branding consistente

---

## 🐛 FASE 3: RESOLUCIÓN DE PROBLEMAS

### **Problema 1: Variables de Entorno No Aplicadas**

**Síntoma detectado:**
```javascript
console.log(import.meta.env.VITE_API_URL)
// undefined (en lugar de la URL esperada)
```

**Causa raíz:**
- Variables de entorno se inyectan durante el **build**
- No en runtime del navegador
- Cambios en variables requieren **redeploy**

**Diagnóstico realizado:**

**Método 1: Inspección de Network Tab**
```
Request URL: http://192.168.1.131:3001/api/auth/login  ❌
```
→ Usando fallback local, variable no aplicada

**Método 2: Inspección del Bundle**
```javascript
// En assets/index-XXXXX.js
baseURL: "http://192.168.1.131:3001/api"  ❌
```
→ Compilado con valor de fallback

---

**Solución implementada:**

**Verificación en Vercel:**
```
Settings → Environment Variables

✅ VITE_API_URL existe
✅ Value: https://api-tests.prodelaya.dev/api
✅ Applied to: Production ✅
```

**Forzar redeploy:**

**Opción A: Desde Vercel**
```
Deployments → Latest → ··· → Redeploy
```

**Opción B: Commit vacío** (método usado)
```bash
cd /opt/proyecto-daw-tests
git commit --allow-empty -m "chore: Forzar redeploy con variables de entorno"
git push origin main
```

**Resultado:**
- Nuevo deployment triggerado
- Build con variables correctas
- Variable aplicada exitosamente ✅

---

**Verificación post-redeploy:**

**Network Tab mostró:**
```
POST https://api-tests.prodelaya.dev/api/auth/login  ✅
Status: 200 OK
```

**Bundle compilado con:**
```javascript
baseURL: "https://api-tests.prodelaya.dev/api"  ✅
```

---

### **Problema 2: Error al Verificar Variable en Consola**

**Síntoma:**
```javascript
console.log(import.meta.env.VITE_API_URL)
// Uncaught SyntaxError: Cannot use 'import.meta' outside a module
```

**Causa:**
- `import.meta` solo funciona dentro de módulos ES6
- La consola del navegador no es un contexto de módulo

**No es un error real** - Es limitación de DevTools

**Método alternativo de verificación:**
- Inspeccionar Network tab (requests)
- Revisar bundle compilado (Sources)
- Hacer prueba de login real

---

### **Problema 3: Requests Preflight CORS**

**Observado en Network:**
```
login    204 preflight  Preflight  61 ms
subjects 204 preflight  Preflight  61 ms
```

**¿Qué son las preflight requests?**
- Requests HTTP `OPTIONS` automáticas
- El navegador las envía antes de POST/PUT/DELETE cross-origin
- Verifican si el servidor permite CORS

**Flujo CORS completo:**
```
1. Browser: OPTIONS /api/auth/login
   Headers: Access-Control-Request-Method: POST

2. Server: 204 No Content
   Headers: 
     Access-Control-Allow-Origin: https://tests-daw.prodelaya.dev
     Access-Control-Allow-Methods: POST, GET, OPTIONS

3. Browser: POST /api/auth/login (request real)
```

**Estado:** ✅ Funcionando correctamente (204 es éxito)

**Configuración CORS en backend:**
```typescript
// backend/src/index.ts
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://tests-daw.prodelaya.dev'
  ],
  credentials: true
}));
```

---

### **Problema 4: Scripts de Extensiones del Navegador**

**Observado en Network:**
```
local-storage.js
content-script-utils.js
express-fte.js
fte-utils.js
```

**Causa:**
- Scripts inyectados por extensiones de Microsoft Edge
- No forman parte de la aplicación

**Impacto:** Ninguno - Pueden ignorarse

**Verificación:**
- Solo aparecen con extensiones activas
- No se cargan en modo incógnito
- No afectan funcionalidad de la app

---

## 🧪 FASE 4: TESTING END-TO-END

### **Test 1: Verificación de Variables**

**Método de verificación:**
```
Network Tab → Login request
Request URL: https://api-tests.prodelaya.dev/api/auth/login  ✅
```

**Confirmación:**
- Variable `VITE_API_URL` aplicada correctamente
- Frontend conectando con backend público
- No usando fallback de IP local

---

### **Test 2: Login Funcional**

**Flujo ejecutado:**
1. Acceso a: `https://tests-daw.prodelaya.dev`
2. Credenciales introducidas
3. Click "Iniciar Sesión"

**Request capturado:**
```
POST https://api-tests.prodelaya.dev/api/auth/login
Status: 200 OK
Time: 265 ms
Response: 
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@daw.com",
    "name": "Usuario Prueba"
  }
}
```

**Análisis de performance:**
- **265ms** para login: Aceptable
- Incluye: Túnel Cloudflare + Bcrypt + Red local
- Mejorable con caché Redis (futuro)

---

### **Test 3: Dashboard y Asignaturas**

**Navegación post-login:**
- Redirect automático a `/dashboard`
- Asignaturas cargadas correctamente

**Request capturado:**
```
GET https://api-tests.prodelaya.dev/api/subjects
Status: 200 OK
Time: 150 ms
Response:
[
  {
    "subjectCode": "DWEC",
    "subjectName": "Desarrollo Web Entorno Cliente",
    "questionCount": 181
  }
]
```

**Verificación visual:**
- ✅ Lista de asignaturas con emojis
- ✅ Contadores de preguntas
- ✅ Botones: Estadísticas, Ranking, Cerrar Sesión

---

### **Test 4: Flujo Completo de Test**

**Navegación ejecutada:**
```
Dashboard → DWEC → Test por Tema → UT1 → 
Config (10 preguntas) → Test → Finalizar → Results
```

**Requests capturados:**
```
GET /api/subjects/DWEC/topics           200  120 ms
GET /api/questions/count?...            200   80 ms
GET /api/questions?limit=10&...         200  190 ms
POST /api/attempts                      200  310 ms
```

**Verificación de funcionalidad:**
- ✅ Preguntas cargadas correctamente
- ✅ Opciones renderizadas
- ✅ Toggle Práctica/Examen funciona
- ✅ Feedback inmediato en modo práctica
- ✅ Resultados calculados correctamente
- ✅ Explicaciones visibles

---

### **Test 5: Estadísticas**

**Acceso:** Dashboard → "📊 Estadísticas"

**Request capturado:**
```
GET https://api-tests.prodelaya.dev/api/attempts/stats
Status: 200 OK
Time: 95 ms
Response:
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

**Verificación visual:**
- ✅ Resumen global (tests, promedio, falladas)
- ✅ Desglose por asignatura
- ✅ Desglose por tema con badges de color
- ✅ Banner de falladas condicional

---

### **Test 6: Ranking**

**Acceso:** Dashboard → "🏆 Ranking"

**Request capturado:**
```
GET https://api-tests.prodelaya.dev/api/ranking
Status: 200 OK
Time: 88 ms
Response:
[
  {"position": 1, "name": "Estudiante DAW", "totalTests": 67},
  {"position": 2, "name": "Usuario Prueba", "totalTests": 45},
  {"position": 3, "name": "Test Terminal", "totalTests": 38}
]
```

**Verificación visual:**
- ✅ Podio con top 3 (alturas proporcionales)
- ✅ Títulos roast ("Más Tests que Vida Social")
- ✅ Tabla de resto de usuarios
- ✅ Colores por medalla (oro, plata, bronce)

---

## 💡 DECISIONES TÉCNICAS DOCUMENTADAS

### **1. Monorepo con Root Directory**

**Decisión:** Especificar `frontend` como root directory en Vercel

**Alternativas consideradas:**

| Opción | Pros | Contras | Decisión |
|--------|------|---------|----------|
| **Root directory** | Simple, Vercel gestiona | Path hardcodeado | ✅ Elegido |
| Workspaces | Flexible, modular | Complejo, overkill | ❌ |
| Repos separados | Aislamiento total | Gestión dual | ❌ |

**Justificación:**
- Proyecto educativo (no producción enterprise)
- Deploy independiente backend/frontend
- Simplicidad > Complejidad prematura

---

### **2. Variables de Entorno en Build-Time**

**Decisión:** Inyectar variables durante `npm run build`

**Cómo funciona:**
```
1. Vercel lee variables de Settings
2. Durante build: Reemplaza import.meta.env.VITE_API_URL
3. Bundle final tiene valor hardcodeado
4. No se puede cambiar sin redeploy
```

**Alternativa rechazada:** Runtime config
```javascript
// Cargar config desde /api/config en runtime
fetch('/api/config.json')
  .then(r => r.json())
  .then(config => setApiUrl(config.API_URL))
```

**Trade-off:**

| Aspecto | Build-time | Runtime |
|---------|------------|---------|
| **Performance** | ✅ Rápido | ⚠️ Request extra |
| **Seguridad** | ✅ Sin exposición | ⚠️ Endpoint público |
| **Flexibilidad** | ❌ Requiere redeploy | ✅ Cambio sin redeploy |
| **Complejidad** | ✅ Simple | ❌ Estado adicional |

**Decisión:** Build-time suficiente para este proyecto.

---

### **3. CORS Configuration**

**Decisión:** Whitelist explícita de orígenes

**Configuración implementada:**
```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',           // Desarrollo local
    'https://tests-daw.prodelaya.dev'  // Producción
  ],
  credentials: true  // Permite cookies/auth headers
}));
```

**Alternativa rechazada:** CORS permisivo
```typescript
app.use(cors({
  origin: '*',  // ❌ Inseguro
  credentials: true
}));
```

**¿Por qué no `origin: '*'`?**
- ❌ Cualquier sitio podría hacer requests
- ❌ No funciona con `credentials: true`
- ❌ Ataque CSRF potencial

---

### **4. Deploy Automático vs Manual**

**Decisión:** Deploy automático en cada push a `main`

**Configuración Vercel:**
```
GitHub Integration:
  ✅ Auto-deploy: main branch
  ✅ Preview: Pull requests
  ✅ Comments: Deployment URL en PR
```

**Ventajas:**
- ✅ CI/CD sin configuración extra
- ✅ Preview deployments gratis
- ✅ Rollback con un click

**Desventaja:**
- ⚠️ Código roto en `main` = Deploy roto

**Mitigación:** Tests en local antes de push

---

## 📊 MÉTRICAS DE LA SESIÓN

| Métrica | Valor |
|---------|-------|
| **Duración** | 1 hora |
| **Plataforma** | Vercel |
| **Dominio configurado** | tests-daw.prodelaya.dev |
| **Registros DNS creados** | 1 (CNAME) |
| **Variables de entorno** | 1 (VITE_API_URL) |
| **Deployments** | 2 (inicial + redeploy) |
| **Tiempo de build** | ~2 min/deploy |
| **Tests E2E realizados** | 6/6 ✅ |
| **Requests verificados** | 8 endpoints |
| **Problemas resueltos** | 4 |

---

## ✅ CHECKLIST COMPLETADO

### **Configuración Vercel:**
- [x] Cuenta creada con GitHub OAuth
- [x] Proyecto importado
- [x] Root directory: `frontend` configurado
- [x] Framework Vite detectado automáticamente
- [x] Build command: `npm run build`
- [x] Output directory: `dist`
- [x] Variable `VITE_API_URL` añadida
- [x] Variable aplicada a Production
- [x] Deploy inicial exitoso
- [x] URL temporal verificada

### **Dominio Personalizado:**
- [x] Dominio `tests-daw.prodelaya.dev` añadido en Vercel
- [x] Registro CNAME creado en Cloudflare
- [x] Proxy Cloudflare desactivado (DNS only)
- [x] TTL configurado (Auto)
- [x] Propagación DNS completada
- [x] Dominio verificado en Vercel (✅ Valid)
- [x] Configurado como dominio principal
- [x] SSL/HTTPS funcionando

### **Variables de Entorno:**
- [x] `VITE_API_URL` con valor correcto
- [x] Aplicada a Production, Preview, Development
- [x] Redeploy forzado para aplicar
- [x] Variable verificada en Network tab
- [x] Requests usando URL pública (no IP local)

### **Testing End-to-End:**
- [x] Login funcional (200 OK)
- [x] Dashboard cargando asignaturas
- [x] Tests completados sin errores
- [x] Results mostrando correctamente
- [x] Estadísticas cargando
- [x] Ranking visible
- [x] CORS funcionando (sin errores)
- [x] Performance aceptable (150-265ms)

### **Extras:**
- [x] Código commiteado y pusheado
- [x] Documentación de sesión creada
- [x] Problemas documentados y resueltos

---

## 🎯 ARQUITECTURA FINAL COMPLETA

```
                    🌍 INTERNET
                         ↓
        ┌────────────────────────────────┐
        │      CLOUDFLARE DNS            │
        │  Nameservers: guy.ns, tia.ns   │
        │                                │
        │  Registros DNS:                │
        │  ├─ tests-daw → CNAME          │
        │  │  └─ cname.vercel-dns.com    │
        │  └─ api-tests → CNAME          │
        │     └─ xxx.cfargotunnel.com    │
        └────────┬───────────────┬───────┘
                 ↓               ↓
    ┌────────────────┐  ┌───────────────────┐
    │  VERCEL CDN    │  │ CLOUDFLARE TUNNEL │
    │  (Global Edge) │  │ (Madrid mad01/03) │
    │                │  │                   │
    │  Frontend:     │  │  Backend:         │
    │  React SPA     │  │  Túnel cifrado    │
    │  + Routing     │  │  4 conexiones     │
    │  + Assets      │  │  QUIC protocol    │
    └────────┬───────┘  └────────┬──────────┘
             │                   │
             │ HTTPS             │ HTTPS
             │ Requests          │ Tunnel
             │                   ↓
             │         ┌─────────────────────┐
             │         │  UBUNTU SERVER      │
             │         │  192.168.1.131      │
             │         │                     │
             │         │  [PM2 Daemon]       │
             │         │  ├─ api-tests       │
             │         │  │  └─ Express      │
             │         │  │     └─ Port 3001 │
             │         │  └─ cloudflare-     │
             │         │     tunnel          │
             │         │                     │
             │         │  [PostgreSQL 15]    │
             │         │  └─ tests_daw       │
             │         │     └─ 181 preguntas│
             │         └─────────────────────┘
             │                   ↑
             └───────────────────┘
                  API Calls
          https://api-tests.prodelaya.dev/api
```

---

## 🔗 URLS FINALES DEL PROYECTO

### **Aplicación en Producción:**

| Servicio | URL | Estado | Proveedor |
|----------|-----|--------|-----------|
| **Frontend** | https://tests-daw.prodelaya.dev | ✅ Live | Vercel |
| **Backend API** | https://api-tests.prodelaya.dev/api | ✅ Live | Cloudflare Tunnel |
| **Health Check** | https://api-tests.prodelaya.dev/api/health | ✅ Live | - |

### **Endpoints API Principales:**

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/subjects
GET    /api/subjects/:code/topics
GET    /api/questions
GET    /api/questions/count
POST   /api/attempts
GET    /api/attempts/stats
GET    /api/ranking
```

---

## 📈 ANÁLISIS DE PERFORMANCE

### **Tiempos de Respuesta Medidos:**

| Endpoint | Método | Tiempo | Análisis |
|----------|--------|--------|----------|
| `/auth/login` | POST | 265 ms | ⚠️ Mejorable |
| `/subjects` | GET | 150 ms | ✅ Aceptable |
| `/questions` | GET | 190 ms | ✅ Aceptable |
| `/attempts` | POST | 310 ms | ⚠️ Mejorable |
| `/stats` | GET | 95 ms | ✅ Bueno |
| `/ranking` | GET | 88 ms | ✅ Bueno |

### **Factores de Latencia:**

**Request Path:**
```
Usuario (España)
  ↓ ~20ms
Vercel Edge (Madrid)
  ↓ ~50ms
Cloudflare Tunnel
  ↓ ~30ms
Ubuntu Server (Red local)
  ↓ ~50-150ms (DB query + bcrypt)
Backend Response
  ↓ Vuelta por mismo camino
Usuario
```

**Breakdown de 265ms (Login):**
- Network (Vercel → Tunnel): ~50ms
- Bcrypt verify: ~100ms (10 rounds)
- PostgreSQL query: ~20ms
- JWT sign: ~5ms
- Network (vuelta): ~50ms
- Overhead: ~40ms

---

### **Optimizaciones Futuras:**

**Corto Plazo:**
- Reducir bcrypt rounds: 10 → 8 (menos seguro pero más rápido)
- Índices adicionales en PostgreSQL

**Medio Plazo:**
- Redis para sessions caché
- CDN para assets estáticos

**Largo Plazo:**
- Backend en VPS con IP pública (eliminar túnel)
- Load balancer con múltiples instancias

---

## 💰 COSTOS FINALES DEL PROYECTO

### **Desglose de Infraestructura:**

| Componente | Proveedor | Costo Mensual | Costo Anual |
|------------|-----------|---------------|-------------|
| **Dominio .dev** | Cloudflare Registrar | 1€ | 12€ |
| **DNS Management** | Cloudflare | Gratis | 0€ |
| **Cloudflare Tunnel** | Cloudflare | Gratis | 0€ |
| **SSL/TLS Certificates** | Cloudflare + Vercel | Gratis | 0€ |
| **Frontend Hosting** | Vercel | Gratis | 0€ |
| **CDN Global** | Vercel | Gratis | 0€ |
| **Backend Hosting** | Ubuntu (propio) | 0€* | 0€* |
| **PostgreSQL** | Ubuntu (propio) | 0€* | 0€* |
| **TOTAL** | | **1€/mes** | **12€/año** |

**\*Nota:** Servidor ya existente, sin costo adicional

---

### **Límites de Plan Gratuito:**

**Vercel Free Tier:**
- ✅ 100 GB bandwidth/mes
- ✅ Deploys ilimitados
- ✅ Preview deployments ilimitados
- ✅ SSL automático
- ✅ DDoS mitigation
- ❌ Sin analytics avanzado
- ❌ Sin custom serverless functions

**Cloudflare Free Tier:**
- ✅ DNS ilimitado
- ✅ Túnel ilimitado
- ✅ SSL automático
- ✅ DDoS protection básico
- ❌ Sin WAF avanzado
- ❌ Sin cache CDN para backend

---

### **Escalabilidad de Costos:**

**Si el proyecto crece:**

| Usuarios Concurrentes | Bandwidth | Costo Adicional | Necesidad |
|----------------------|-----------|-----------------|-----------|
| < 100 | < 10 GB/mes | 0€ | Plan gratuito suficiente |
| 100-500 | 10-50 GB/mes | 0€ | Aún dentro de límites |
| 500-2000 | 50-100 GB/mes | 0€ | Límite del plan gratuito |
| > 2000 | > 100 GB/mes | 20€/mes | Vercel Pro requerido |

---

## 🎓 CONCEPTOS CLAVE APLICADOS

### **React + Vite:**
- ✅ Build optimization con tree-shaking
- ✅ Code splitting automático
- ✅ Hot Module Replacement (HMR)
- ✅ Variables de entorno con prefijo `VITE_`

### **Deployment:**
- ✅ Static Site Generation (SSG)
- ✅ CDN edge deployment global
- ✅ Atomic deployments (rollback instantáneo)
- ✅ Preview deployments por PR

### **DNS:**
- ✅ Registros CNAME
- ✅ Propagación DNS
- ✅ TTL (Time To Live)
- ✅ Proxy vs DNS-only

### **SSL/TLS:**
- ✅ Certificados automáticos
- ✅ HTTPS obligatorio (.dev domain)
- ✅ Let's Encrypt integration
- ✅ Certificate pinning

### **DevOps:**
- ✅ CI/CD automático con GitHub
- ✅ Build pipelines
- ✅ Environment variables management
- ✅ Zero-downtime deployments

---

## 🏆 HITOS ALCANZADOS

- ✅ **Frontend desplegado** en Vercel con dominio personalizado
- ✅ **Variables de entorno** configuradas y funcionando
- ✅ **DNS configurado** correctamente en Cloudflare
- ✅ **SSL/HTTPS** funcionando sin errores
- ✅ **CORS** configurado para comunicación frontend-backend
- ✅ **Deploy automático** activado (CI/CD)
- ✅ **Testing E2E** completo verificado (6/6 tests)
- ✅ **Performance** aceptable (88-310ms por request)
- ✅ **Proyecto 100% funcional** en producción

---

## 📝 COMANDOS ÚTILES PARA GESTIÓN

### **Vercel CLI (Opcional):**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy manual desde local
vercel --prod

# Ver logs en tiempo real
vercel logs proyecto-daw-tests --follow

# Listar deployments
vercel ls

# Rollback a deployment anterior
vercel rollback [deployment-url]
```

### **Git Workflow:**

```bash
# Push que triggerea deploy automático
git add .
git commit -m "feat: Nueva funcionalidad"
git push origin main

# Ver status del deploy
# (automáticamente en GitHub → Environments)
```

### **Testing Local con Producción:**

```bash
# Frontend apuntando a API de producción
cd frontend
echo "VITE_API_URL=https://api-tests.prodelaya.dev/api" > .env.local
npm run dev

# Verificar requests van a producción
# DevTools → Network → Verificar URLs
```

---

## 🐛 TROUBLESHOOTING COMÚN

### **Problema: Build Falla en Vercel**

**Síntoma:**
```
Build failed
npm ERR! Missing script: "build"
```

**Solución:**
```json
// Verificar frontend/package.json
{
  "scripts": {
    "build": "tsc -b && vite build"  // Debe existir
  }
}
```

---

### **Problema: 404 al Hacer Refresh en Rutas**

**Síntoma:**
- Navegas a `/dashboard` → Funciona
- F5 (refresh) → **404 Not Found**

**Solución:**

Crear `frontend/vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**¿Por qué?**
- React Router funciona en cliente (SPA)
- Servidor no conoce `/dashboard`
- Rewrite envía todo a `index.html`
- React Router gestiona la ruta

---

### **Problema: Variable de Entorno No Aparece**

**Síntoma:**
```javascript
import.meta.env.VITE_API_URL === undefined
```

**Checklist:**
1. ✅ Variable tiene prefijo `VITE_`
2. ✅ Variable configurada en Vercel Settings
3. ✅ Variable aplicada a "Production"
4. ✅ Se hizo redeploy después de añadirla
5. ✅ No hay typos en el nombre

**Forzar nuevo build:**
```bash
git commit --allow-empty -m "chore: Redeploy"
git push origin main
```

---

### **Problema: CORS Error**

**Síntoma:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Verificar backend:**
```typescript
// backend/src/index.ts
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://tests-daw.prodelaya.dev'  // ← Debe estar
  ],
  credentials: true
}));
```

**Aplicar cambio:**
```bash
cd backend
npm run build
pm2 restart api-tests
```

---

### **Problema: Dominio No Resuelve**

**Síntoma:**
```
DNS_PROBE_FINISHED_NXDOMAIN
```

**Verificar DNS:**
```bash
# Comprobar registro CNAME
dig tests-daw.prodelaya.dev

# Debe mostrar:
# tests-daw.prodelaya.dev. 300 IN CNAME cname.vercel-dns.com.
```

**Si no resuelve:**
1. Verificar en Cloudflare DNS que el registro existe
2. Verificar que Proxy está **desactivado** (gris)
3. Esperar propagación (hasta 24h, usualmente 5 min)
4. Usar DNS público: `8.8.8.8` (Google) o `1.1.1.1` (Cloudflare)

---

## 🚀 MEJORAS OPCIONALES FUTURAS

### **1. Vercel Analytics**

**Activar:**
```
Vercel Dashboard → Proyecto → Analytics → Enable
```

**Métricas incluidas:**
- Pageviews
- Top pages
- Top referrers
- Devices (mobile/desktop)
- Países

**Gratis hasta:** 100k pageviews/mes

---

### **2. Monitoring con Sentry**

**Setup frontend:**
```bash
cd frontend
npm install @sentry/react
```

```typescript
// frontend/src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://xxx@sentry.io/xxx",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

**Beneficios:**
- Errores en producción capturados
- Stack traces completos
- User context (email, ID)
- Performance monitoring

---

### **3. SEO Mejorado**

**Crear `frontend/public/robots.txt`:**
```
User-agent: *
Allow: /

Sitemap: https://tests-daw.prodelaya.dev/sitemap.xml
```

**Actualizar `frontend/index.html`:**
```html
<head>
  <title>Tests DAW - Práctica Interactiva para Desarrollo Web</title>
  
  <meta name="description" content="Sistema de tests interactivos para practicar Desarrollo de Aplicaciones Web con feedback inmediato y estadísticas detalladas.">
  
  <meta property="og:title" content="Tests DAW">
  <meta property="og:description" content="Practica tests de DAW con feedback instantáneo">
  <meta property="og:image" content="https://tests-daw.prodelaya.dev/og-image.png">
  <meta property="og:url" content="https://tests-daw.prodelaya.dev">
  
  <meta name="twitter:card" content="summary_large_image">
</head>
```

---

### **4. PWA (Progressive Web App)**

**Instalar plugin:**
```bash
cd frontend
npm install vite-plugin-pwa -D
```

**Configurar `vite.config.ts`:**
```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Tests DAW',
        short_name: 'Tests DAW',
        description: 'Sistema de tests interactivos',
        theme_color: '#3b82f6',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

**Beneficios:**
- Instalable como app nativa
- Funciona offline (básico)
- Notificaciones push
- Icono en home screen

---

### **5. Favicon Personalizado**

**Generar favicon:**
1. Crear logo 512x512px
2. Usar: https://favicon.io/
3. Descargar paquete

**Añadir a `frontend/public/`:**
```
favicon.ico
apple-touch-icon.png
favicon-16x16.png
favicon-32x32.png
```

**Actualizar `index.html`:**
```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

---

### **6. GitHub Actions para Tests**

**Crear `.github/workflows/test.yml`:**
```yaml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm install
      
      - name: Run lint
        working-directory: ./frontend
        run: npm run lint
      
      - name: Build
        working-directory: ./frontend
        run: npm run build
```

**Beneficios:**
- Tests automáticos en cada push
- Bloqueo de PR con errores
- Badge de status en README

---

## 📚 RECURSOS Y DOCUMENTACIÓN

### **Vercel:**
- Docs: https://vercel.com/docs
- CLI: https://vercel.com/docs/cli
- Edge Functions: https://vercel.com/docs/functions

### **Vite:**
- Docs: https://vitejs.dev/guide/
- Env Variables: https://vitejs.dev/guide/env-and-mode.html
- Build: https://vitejs.dev/guide/build.html

### **Cloudflare:**
- DNS Docs: https://developers.cloudflare.com/dns/
- Tunnel Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

### **React Router:**
- Docs: https://reactrouter.com/
- Deployment: https://reactrouter.com/en/main/guides/deployment

---

## 🎉 RESUMEN EJECUTIVO

### **Lo Logrado en Esta Sesión:**

**Configuración:**
- ✅ Proyecto importado en Vercel
- ✅ Root directory configurado (`frontend`)
- ✅ Variables de entorno aplicadas
- ✅ Build exitoso (TypeScript → JavaScript)

**Dominio:**
- ✅ Dominio personalizado configurado
- ✅ DNS CNAME creado en Cloudflare
- ✅ SSL/HTTPS funcionando automáticamente
- ✅ Propagación DNS completada

**Testing:**
- ✅ Login funcional (200 OK)
- ✅ Dashboard cargando asignaturas
- ✅ Flujo completo de tests verificado
- ✅ Estadísticas y ranking operativos
- ✅ CORS funcionando correctamente

**Resolución de Problemas:**
- ✅ Variables de entorno aplicadas tras redeploy
- ✅ Proxy Cloudflare desactivado
- ✅ Preflight requests CORS verificados
- ✅ Performance analizado y documentado

---

### **Estado Final del Proyecto:**

```
[████████████████████████████████] 100% COMPLETADO

✅ Backend: Desplegado en producción (Cloudflare Tunnel)
✅ Frontend: Desplegado en producción (Vercel)
✅ Base de Datos: PostgreSQL operativa (181 preguntas)
✅ Dominio: prodelaya.dev configurado
✅ SSL/HTTPS: Funcionando en ambos servicios
✅ Testing E2E: Verificado completamente
✅ Performance: Aceptable (88-310ms)
```

---

### **URLs Finales Operativas:**

**Aplicación:**
- 🌐 **Frontend:** https://tests-daw.prodelaya.dev
- 🔌 **Backend:** https://api-tests.prodelaya.dev/api
- 💚 **Health:** https://api-tests.prodelaya.dev/api/health

**Características:**
- 🎓 181 preguntas DWEC
- 🎯 Sistema de doble modo (Práctica/Examen)
- 📊 Estadísticas detalladas
- 🏆 Ranking gamificado
- 🔐 Autenticación JWT
- 📱 Responsive design

---

### **Costos Totales:**

| Concepto | Costo |
|----------|-------|
| Dominio .dev | 12€/año |
| Vercel Hosting | GRATIS |
| Cloudflare DNS + Tunnel | GRATIS |
| SSL Certificates | GRATIS |
| **TOTAL** | **1€/mes** |

---

### **Próximos Pasos Sugeridos:**

**Inmediatos:**
1. ⏳ Crear README.md profesional
2. ⏳ Añadir screenshots al repositorio
3. ⏳ Configurar favicon personalizado
4. ⏳ Activar Vercel Analytics

**Corto Plazo:**
5. ⏳ Implementar tests unitarios (Vitest)
6. ⏳ Añadir más asignaturas (DWES, DAW)
7. ⏳ Mejorar SEO con meta tags
8. ⏳ Configurar PWA para instalación

**Medio Plazo:**
9. ⏳ Sistema de badges/logros
10. ⏳ Exportar estadísticas a PDF
11. ⏳ Gráficos de progreso temporal
12. ⏳ Notificaciones push

---

## 📝 COMMIT FINAL REALIZADO

```bash
cd /opt/proyecto-daw-tests

git add .
git commit -m "docs: Documentar deploy frontend en Vercel (Sesión 16)

- Frontend desplegado en https://tests-daw.prodelaya.dev
- Variables de entorno configuradas correctamente
- Dominio personalizado con DNS en Cloudflare
- SSL/HTTPS funcionando automáticamente
- Testing E2E completo verificado (6/6 tests)
- Documentación completa de troubleshooting
- Arquitectura final documentada
- Proyecto 100% funcional en producción

Costos: 1€/mes (solo dominio)
Performance: 88-310ms por request
Estado: COMPLETADO ✅"

git push origin main
```

---

## 🎓 APRENDIZAJES CLAVE DE LA SESIÓN

### **Técnicos:**

1. **Variables de entorno en Vite:**
   - Se inyectan en build-time, no runtime
   - Requieren prefijo `VITE_` para exposición al cliente
   - Cambios requieren redeploy completo

2. **DNS Proxy vs DNS-only:**
   - Proxy Cloudflare conflictúa con SSL de Vercel
   - DNS-only permite SSL gestionado por Vercel
   - Trade-off: Menos protección DDoS pero SSL funcional

3. **CORS Preflight:**
   - Requests OPTIONS automáticas antes de POST/PUT
   - Status 204 es correcto (no es error)
   - Configuración en backend con whitelist explícita

4. **Monorepo con Root Directory:**
   - Vercel necesita saber dónde está `package.json`
   - Root directory evita ambigüedad
   - Alternativa: Workspaces más complejo

### **Estratégicos:**

1. **Deploy automático:**
   - CI/CD gratis con GitHub integration
   - Preview deployments sin costo
   - Rollback instantáneo si algo falla

2. **Performance:**
   - Cloudflare Tunnel añade ~80ms latencia
   - Bcrypt es el mayor cuello de botella (100ms)
   - Optimización futuras: Redis, índices DB

3. **Costos escalables:**
   - Plan gratuito suficiente hasta 2000 usuarios
   - 1€/mes es inversión mínima para portfolio
   - ROI excelente para proyecto profesional

---

*Última actualización: 21 de octubre de 2025 (Sesión 16)*  
*Duración: 1 hora*  
*Resultado: Frontend en producción - Proyecto 100% completado ✅*  
*Siguiente: README.md profesional y mejoras opcionales*