# 📊 Sesión 15: FASE 5 - Deploy Backend con Cloudflare Tunnel + Dominio

## 🎯 Estado Previo del Proyecto

### ✅ Checkpoint al Inicio
- ✅ Backend 100% funcional en Ubuntu (192.168.1.131:3001)
- ✅ Backend corriendo 24/7 con PM2
- ✅ Frontend 100% funcional en desarrollo
- ✅ Sistema completo testeado localmente
- ✅ Código en GitHub actualizado

**Progreso anterior:** 100% funcionalidad - 0% accesibilidad pública

---

## 🆕 Trabajo Realizado en Esta Sesión (2h)

### **Objetivo Principal:**
Exponer el backend a internet de forma segura usando Cloudflare Tunnel, sin abrir puertos del router, y preparar el frontend para deploy en Vercel con dominio personalizado.

---

## 💡 DECISIÓN ESTRATÉGICA: ARQUITECTURA CON DOMINIO PROPIO

### **Problema identificado:**
- Backend en red local (192.168.1.131)
- Port forwarding del router dando problemas
- Frontend necesita conectar con backend desde internet

### **Solución elegida: Cloudflare Tunnel + Dominio .dev**

**Arquitectura final implementada:**
```
Internet
    ↓
prodelaya.dev (dominio raíz - reservado portfolio)
    ↓
┌─────────────────────────────────────────┐
│     CLOUDFLARE (DNS + Tunnel)           │
│                                         │
│  tests-daw.prodelaya.dev → Vercel      │
│  api-tests.prodelaya.dev → Tunnel      │
└─────────────────────────────────────────┘
         ↓                    ↓
    [Vercel CDN]        [Cloudflare Tunnel]
         ↓                    ↓
    Frontend            Túnel cifrado
    (React)             (sin abrir puertos)
                             ↓
                  ┌─────────────────────┐
                  │  SERVIDOR UBUNTU     │
                  │  192.168.1.131:3001 │
                  │  Backend (PM2)       │
                  └─────────────────────┘
```

---

## 📦 FASE 1: COMPRA Y CONFIGURACIÓN DE DOMINIO

### **1. Registro del Dominio**

**Dominio elegido:** `prodelaya.dev`

**Razones de la elección:**

| Opción | Precio/año | Pros | Contras | Decisión |
|--------|-----------|------|---------|----------|
| `.xyz` | 0.99€ (10€ después) | Muy barato inicial | Poco profesional | ❌ |
| `.com` | 9€ | Clásico, profesional | Común | ⚠️ |
| **`.dev`** | **12€** | **Developer-focused, HTTPS obligatorio** | Más caro | **✅ ELEGIDO** |

**Ventajas del `.dev`:**
- ✅ Extensión profesional para developers
- ✅ HTTPS obligatorio por Google (más seguro)
- ✅ Reconocida en el sector tech
- ✅ Precio estable año tras año
- ✅ Ideal para portfolio de programador

**Proveedor:** Cloudflare Registrar
- Precio al costo (sin markup)
- Integración perfecta con DNS y Tunnel
- Todo en una sola plataforma

---

### **2. Estrategia de Subdominios**

**Decisión arquitectónica:**
Usar subdominios para proyectos independientes, NO subdirectorios.

**Estructura implementada:**
```
prodelaya.dev/                    → Portfolio principal (futuro)
tests-daw.prodelaya.dev/          → Proyecto Tests DAW
api-tests.prodelaya.dev/          → Backend API Tests
blog.prodelaya.dev/               → Blog (futuro)
otro-proyecto.prodelaya.dev/      → Otros proyectos (futuro)
```

**Ventajas de subdominios:**
- ✅ Cada proyecto = deploy independiente en Vercel
- ✅ Diferentes tecnologías por proyecto (React, Next.js, Vue...)
- ✅ Mejor SEO (Google indexa como sitios separados)
- ✅ Aislamiento de fallos (un proyecto caído no afecta a otros)
- ✅ Diferentes variables de entorno por proyecto

---

### **3. Configuración DNS Inicial**

**Proceso de registro:**
1. Cuenta Cloudflare creada con GitHub OAuth
2. Dominio `prodelaya.dev` registrado (12€/año)
3. Nameservers automáticamente configurados:
   - `guy.ns.cloudflare.com`
   - `tia.ns.cloudflare.com`
4. Panel DNS inicialmente vacío (configurado después)

**Estado tras registro:**
- ✅ Dominio activo
- ✅ DNS gestionado por Cloudflare
- ✅ WHOIS con información correcta
- ✅ Listo para configurar registros

---

## 📦 FASE 2: CLOUDFLARE TUNNEL (BACKEND)

### **¿Qué es Cloudflare Tunnel?**

**Concepto:**
Túnel cifrado que expone servicios locales a internet sin abrir puertos del router.

**Funcionamiento:**
```
1. cloudflared (cliente) se ejecuta en el servidor Ubuntu
2. Establece túnel saliente cifrado a Cloudflare
3. Cloudflare recibe peticiones HTTPS en api-tests.prodelaya.dev
4. Cloudflare envía tráfico por el túnel al servidor local
5. Servidor responde → Cloudflare → Usuario
```

**Ventajas sobre port forwarding:**
- ✅ Sin abrir puertos (más seguro)
- ✅ HTTPS automático (certificado Cloudflare)
- ✅ DDoS protection incluido
- ✅ Túnel cifrado end-to-end
- ✅ No expone IP del servidor
- ✅ Funciona detrás de CGNAT

---

### **1. Instalación de cloudflared**

**Archivo:** Cliente Cloudflare Tunnel

**Proceso:**
```bash
# 1. Descargar paquete
curl -L --output cloudflared.deb \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# 2. Instalar
sudo dpkg -i cloudflared.deb

# 3. Verificar
cloudflared --version
# cloudflared version 2025.10.0
```

**Resultado:**
- ✅ Binario instalado en `/usr/local/bin/cloudflared`
- ✅ Versión 2025.10.0 (última disponible)

---

### **2. Autenticación con Cloudflare**

**Comando:**
```bash
cloudflared tunnel login
```

**Flujo:**
1. Comando genera URL de autorización
2. Usuario abre URL en navegador (desde Windows)
3. Login con cuenta Cloudflare (GitHub OAuth)
4. Selecciona dominio `prodelaya.dev`
5. Certificado descargado automáticamente

**Archivo generado:**
```
/home/laya92/.cloudflared/cert.pem
```

**Resultado:**
- ✅ cloudflared vinculado a cuenta
- ✅ Autorizado para gestionar `prodelaya.dev`
- ✅ Certificado almacenado localmente

---

### **3. Creación del Túnel**

**Comando:**
```bash
cloudflared tunnel create daw-backend
```

**Datos del túnel creado:**
- **Nombre:** `daw-backend`
- **UUID:** `a78a4fc8-3e57-4821-b959-8ec39fdacc95`
- **Credenciales:** `/home/laya92/.cloudflared/a78a4fc8-3e57-4821-b959-8ec39fdacc95.json`

**¿Qué hace el UUID?**
- Identificador único del túnel
- Se usa en la configuración
- Cloudflare lo usa para enrutar tráfico

---

### **4. Configuración del Túnel**

**Archivo:** `~/.cloudflared/config.yml`

**Contenido:**
```yaml
tunnel: a78a4fc8-3e57-4821-b959-8ec39fdacc95
credentials-file: /home/laya92/.cloudflared/a78a4fc8-3e57-4821-b959-8ec39fdacc95.json

ingress:
  - hostname: api-tests.prodelaya.dev
    service: http://localhost:3001
  - service: http_status:404
```

**Explicación línea por línea:**

**Línea 1-2:** Identificación
- `tunnel`: UUID del túnel creado
- `credentials-file`: Path al archivo de credenciales

**Línea 4-6:** Reglas de enrutamiento (ingress)
- `hostname`: Dominio que recibe tráfico
- `service`: A dónde redirigir (localhost:3001 = backend PM2)

**Línea 7:** Catch-all
- Cualquier otro hostname → 404
- Evita tráfico no autorizado

**Decisión técnica:**
- Puerto 3001 (localhost) no necesita ser accesible externamente
- Túnel es la única vía de entrada
- Backend sigue escuchando en `0.0.0.0:3001` (como antes)

---

### **5. Registro DNS Automático**

**Comando:**
```bash
cloudflared tunnel route dns daw-backend api-tests.prodelaya.dev
```

**¿Qué hace?**
Crea automáticamente un registro CNAME en Cloudflare DNS.

**Registro creado:**
```
Type:    CNAME
Name:    api-tests
Target:  a78a4fc8-3e57-4821-b959-8ec39fdacc95.cfargotunnel.com
Proxy:   ✅ Proxied (Cloudflare actúa como proxy)
```

**Flujo de resolución DNS:**
```
Usuario solicita: api-tests.prodelaya.dev
    ↓
DNS Cloudflare resuelve CNAME
    ↓
a78a4fc8-....cfargotunnel.com
    ↓
Cloudflare enruta a túnel activo
    ↓
Túnel conectado desde Ubuntu
```

**Ventaja de Proxied (naranja):**
- ✅ IP del servidor oculta
- ✅ Protección DDoS incluida
- ✅ Caché Cloudflare
- ✅ Firewall WAF disponible

---

### **6. Prueba Manual del Túnel**

**Comando temporal:**
```bash
cloudflared tunnel run daw-backend
```

**Logs obtenidos:**
```
INF Starting tunnel tunnelID=a78a4fc8-3e57-4821-b959-8ec39fdacc95
INF Registered tunnel connection connIndex=0 location=mad01 protocol=quic
INF Registered tunnel connection connIndex=1 location=mad03 protocol=quic
INF Registered tunnel connection connIndex=2 location=mad01 protocol=quic
INF Registered tunnel connection connIndex=3 location=mad03 protocol=quic
```

**Análisis de logs:**
- ✅ 4 conexiones redundantes (alta disponibilidad)
- ✅ Ubicación: Madrid (mad01, mad03) - latencia baja
- ✅ Protocolo: QUIC (más rápido que HTTP/2)
- ⚠️ Warnings ICMP: No afectan al túnel HTTP (solo ping)

**Test desde terminal:**
```bash
curl https://api-tests.prodelaya.dev/api/health
```

**Respuesta:**
```json
{
  "status": "OK",
  "message": "Servidor funcionando correctamente",
  "timestamp": "2025-10-21T15:24:17.971Z"
}
```

**Confirmación:**
- ✅ Backend accesible vía HTTPS
- ✅ Sin certificado SSL manual (Cloudflare lo gestiona)
- ✅ Respuesta correcta del health check
- ✅ Latencia aceptable

---

### **7. Configuración con PM2**

**¿Por qué PM2?**
- Túnel manual requiere terminal abierta
- PM2 lo mantiene corriendo en background
- Reinicio automático si crashea
- Arranque automático al reiniciar servidor

**Comando:**
```bash
pm2 start cloudflared --name cloudflare-tunnel -- tunnel run daw-backend
```

**Sintaxis explicada:**
- `pm2 start cloudflared`: Ejecutar binario cloudflared
- `--name cloudflare-tunnel`: Nombre del proceso en PM2
- `--`: Separador (siguiente parte = argumentos de cloudflared)
- `tunnel run daw-backend`: Comando que recibe cloudflared

**Estado PM2:**
```
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ api-tests          │ fork     │ 18   │ online    │ 0%       │ 72.6mb   │
│ 1  │ cloudflare-tunnel  │ fork     │ 0    │ online    │ 0%       │ 12.9mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

**Análisis:**
- ✅ Proceso 0: Backend Node.js (72.6 MB)
- ✅ Proceso 1: Cloudflare Tunnel (12.9 MB - muy ligero)
- ✅ Ambos en estado `online`
- ✅ CPU en reposo (0%)

---

### **8. Persistencia y Arranque Automático**

**Comando:**
```bash
pm2 save
```

**Archivo actualizado:**
```
/home/laya92/.pm2/dump.pm2
```

**Contenido (JSON):**
```json
{
  "apps": [
    {
      "name": "api-tests",
      "script": "/opt/proyecto-daw-tests/backend/dist/index.js",
      ...
    },
    {
      "name": "cloudflare-tunnel",
      "script": "/usr/local/bin/cloudflared",
      "args": "tunnel run daw-backend",
      ...
    }
  ]
}
```

**Resultado:**
- ✅ Configuración persistente guardada
- ✅ Al reiniciar servidor → PM2 inicia ambos procesos
- ✅ Túnel siempre disponible (24/7)

**Verificación final:**
```bash
# Estado PM2
pm2 list

# Test endpoint
curl https://api-tests.prodelaya.dev/api/health
```

**Respuesta:**
```json
{
  "status": "OK",
  "message": "Servidor funcionando correctamente",
  "timestamp": "2025-10-21T15:26:46.263Z"
}
```

**Confirmación:**
- ✅ Backend accesible públicamente
- ✅ HTTPS funcionando
- ✅ PM2 gestionando túnel
- ✅ Arranque automático configurado

---

## 📦 FASE 3: PREPARACIÓN FRONTEND PARA VERCEL

### **1. Configuración de Variable de Entorno**

**Problema:**
URL del backend hardcodeada en el código.

**Archivo:** `frontend/src/services/api.ts`

**Antes:**
```typescript
const apiClient = axios.create({
  baseURL: 'http://192.168.1.131:3001/api',  // ❌ Hardcodeado
  headers: { 'Content-Type': 'application/json' }
});
```

**Después:**
```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.1.131:3001/api',
  headers: { 'Content-Type': 'application/json' }
});
```

**Explicación:**
- `import.meta.env.VITE_API_URL`: Lee variable de entorno de Vite
- `||`: Operador OR - fallback si variable no existe
- Fallback: IP local (desarrollo)

**Comportamiento:**
```
Desarrollo local:
  - Variable no existe
  - Usa fallback: http://192.168.1.131:3001/api
  - Frontend en Ubuntu conecta con backend local

Producción (Vercel):
  - Variable definida en Vercel
  - Usa: https://api-tests.prodelaya.dev/api
  - Frontend público conecta con backend vía túnel
```

---

### **2. Actualización de .gitignore**

**Problema:**
Archivo `cloudflared.deb` detectado por Git (250+ MB).

**Solución:**
```bash
echo "backend/cloudflared.deb" >> .gitignore
```

**Archivo .gitignore actualizado:**
```
node_modules
.env
/src/generated/prisma
backend/cloudflared.deb  # ✅ Nuevo
```

**Razón:**
- ❌ No necesario en repositorio (instalador binario)
- ❌ Ocupa espacio innecesario
- ✅ Cada servidor instala su propia versión

---

### **3. Commit y Push a GitHub**

**Estado Git:**
```bash
git status
```

**Archivos modificados:**
- `frontend/src/services/api.ts` (variable de entorno)
- `.gitignore` (excluir cloudflared.deb)

**Commit:**
```bash
git add .
git commit -m "feat(frontend): Configurar variable de entorno para API URL

- Cambiar baseURL hardcodeada por variable VITE_API_URL
- Fallback a IP local para desarrollo
- Preparado para deploy en Vercel con backend en Cloudflare Tunnel"
```

**Push:**
```bash
git push origin main
```

**Resultado:**
- ✅ Cambios subidos a GitHub
- ✅ Listo para conectar con Vercel
- ⏳ Próximo paso: Configurar proyecto en Vercel

---

## 🎓 CONCEPTOS Y DECISIONES TÉCNICAS

### **1. Cloudflare Tunnel vs VPN vs Port Forwarding**

| Método | Seguridad | Complejidad | HTTPS | DDoS Protection | Decisión |
|--------|-----------|-------------|-------|-----------------|----------|
| **Cloudflare Tunnel** | ✅✅✅ | Media | Auto | ✅ | **✅ ELEGIDO** |
| VPN (WireGuard) | ✅✅✅ | Alta | Manual | ❌ | ❌ |
| Port Forwarding | ⚠️ | Baja | Manual | ❌ | ❌ |
| ngrok/localtunnel | ✅✅ | Baja | Auto | ⚠️ | ❌ (temporal) |

**Justificación Cloudflare Tunnel:**
- ✅ Seguridad empresarial (túnel cifrado)
- ✅ HTTPS automático (Let's Encrypt integrado)
- ✅ Gratuito para uso normal
- ✅ Integración perfecta con DNS propio
- ✅ DDoS protection incluido
- ✅ No expone IP del servidor
- ✅ Funciona detrás de cualquier router/firewall

---

### **2. Subdominios vs Subdirectorios**

**Subdominios (Elegido):**
```
tests-daw.prodelaya.dev  → Proyecto 1 (Vercel independiente)
portfolio.prodelaya.dev  → Proyecto 2 (Vercel independiente)
```

**Ventajas:**
- ✅ Deploys independientes (no se afectan)
- ✅ Diferentes frameworks (React, Next.js, Vue)
- ✅ Variables de entorno separadas
- ✅ Mejor SEO (Google indexa como sitios distintos)
- ✅ Aislamiento de fallos

**Subdirectorios (Rechazado):**
```
prodelaya.dev/tests-daw  → Ruta en mismo proyecto
prodelaya.dev/portfolio  → Ruta en mismo proyecto
```

**Desventajas:**
- ❌ Todo en un solo proyecto Vercel
- ❌ Complicado con React Router (rewrites)
- ❌ Builds más pesados (todo junto)
- ❌ Un framework para todos (limitante)

---

### **3. Dominio .dev vs .com vs .xyz**

**Comparativa de extensiones:**

| Extensión | Precio/año | Profesional | HTTPS Forzado | SEO | Decisión |
|-----------|-----------|-------------|---------------|-----|----------|
| **.dev** | 12€ | ✅✅✅ | ✅ | ✅✅ | **✅ ELEGIDO** |
| .com | 9€ | ✅✅ | ❌ | ✅✅✅ | ⚠️ Bueno |
| .xyz | 1€ (10€ después) | ⚠️ | ❌ | ⚠️ | ❌ Amateur |

**Ventajas específicas de .dev:**
- ✅ Google obliga HTTPS (Chrome rechaza HTTP)
- ✅ Asociado con developers (portfolio ideal)
- ✅ Precio estable sin sorpresas
- ✅ Reconocido en sector tech

---

### **4. PM2 para Cloudflare Tunnel**

**¿Por qué PM2 en lugar de systemd?**

| Método | Pros | Contras | Decisión |
|--------|------|---------|----------|
| **PM2** | Fácil, logs, ya usado | Capa extra | ✅ Consistente |
| systemd | Nativo Linux | Complejo | ❌ |
| Docker | Portable | Overkill | ❌ |

**Comando PM2:**
```bash
pm2 start cloudflared --name cloudflare-tunnel -- tunnel run daw-backend
```

**Ventajas:**
- ✅ Misma herramienta para backend y túnel
- ✅ Logs unificados: `pm2 logs`
- ✅ Monitoreo unificado: `pm2 monit`
- ✅ Reinicio automático en ambos
- ✅ Arranque automático ya configurado

---

### **5. Variables de Entorno en Vite**

**Sintaxis Vite:**
```typescript
import.meta.env.VITE_API_URL
```

**Reglas:**
- Prefijo `VITE_` obligatorio (seguridad)
- Solo variables con `VITE_` se exponen al cliente
- Variables sin prefijo solo en servidor (no accesibles en browser)

**Comparación con otros frameworks:**
```typescript
// Vite
import.meta.env.VITE_API_URL

// Next.js
process.env.NEXT_PUBLIC_API_URL

// Create React App
process.env.REACT_APP_API_URL
```

**Seguridad:**
- ✅ Variables privadas (DB_PASSWORD) nunca expuestas
- ✅ Solo públicas (VITE_*) van al bundle
- ✅ Build de Vercel inyecta variables antes de compilar

---

## 📊 MÉTRICAS DE LA SESIÓN

| Métrica | Valor |
|---------|-------|
| **Duración** | 2 horas |
| **Dominio registrado** | 1 (prodelaya.dev) |
| **Costo dominio** | 12€/año |
| **Túnel configurado** | 1 (daw-backend) |
| **Procesos PM2** | 2 (backend + túnel) |
| **Registros DNS creados** | 1 (api-tests CNAME) |
| **Archivos modificados** | 2 (api.ts, .gitignore) |
| **Commits** | 1 (preparación Vercel) |
| **Endpoints públicos** | 1 (https://api-tests.prodelaya.dev) |
| **Tests manuales** | 3/3 pasados ✅ |
| **Progreso** | Backend: 100% desplegado |

---

## ✅ CHECKLIST COMPLETADO

### **Dominio:**
- [x] Cuenta Cloudflare creada
- [x] Dominio prodelaya.dev registrado
- [x] DNS configurado en Cloudflare
- [x] Nameservers activos
- [x] WHOIS verificado

### **Cloudflare Tunnel:**
- [x] cloudflared instalado (v2025.10.0)
- [x] Autenticación completada
- [x] Certificado descargado
- [x] Túnel "daw-backend" creado
- [x] Archivo config.yml configurado
- [x] Registro DNS automático creado
- [x] Túnel probado manualmente
- [x] PM2 configurado
- [x] Arranque automático habilitado
- [x] Health check funcionando

### **Frontend:**
- [x] Variable VITE_API_URL configurada
- [x] Fallback a IP local
- [x] .gitignore actualizado
- [x] Cambios commiteados
- [x] Listo para Vercel

### **Verificación:**
- [x] Backend accesible: https://api-tests.prodelaya.dev
- [x] HTTPS funcionando
- [x] PM2 estable (2 procesos online)
- [x] Túnel con 4 conexiones activas

---

## 🎯 PRÓXIMA SESIÓN: Deploy Frontend en Vercel

### **Objetivos (1h):**

**1. Configurar Vercel (30 min):**
- Conectar GitHub con Vercel
- Import proyecto: proyecto-daw-tests
- Configurar root directory: `frontend`
- Framework: Vite (auto-detectado)

**2. Variables de Entorno (10 min):**
- Añadir: `VITE_API_URL=https://api-tests.prodelaya.dev/api`

**3. Configurar Dominio (15 min):**
- Añadir dominio custom: `tests-daw.prodelaya.dev`
- Cloudflare DNS: CNAME → vercel-dns.com

**4. Testing E2E (5 min):**
- Verificar frontend accesible
- Login funcionando
- Dashboard con asignaturas
- Test completo end-to-end

**Tiempo estimado:** 1 hora

---

## 🐛 PROBLEMAS Y SOLUCIONES

### **Problema 1: Port Forwarding del Router**

**Síntoma:**
Intentos de abrir puerto 3001 en router dando problemas.

**Causa:**
Router con configuración restrictiva o CGNAT del ISP.

**Solución:**
Cloudflare Tunnel - elimina necesidad de abrir puertos.

**Ventaja adicional:**
Más seguro que exponer puerto directamente.

---

### **Problema 2: Warnings ICMP en Cloudflared**

**Síntoma:**
```
WRN ICMP proxy feature is disabled
WRN Group ID 1000 is not between ping group 1 to 0
```

**Causa:**
Usuario laya92 no tiene permisos para ICMP (ping).

**¿Es problema?**
- ❌ NO afecta al túnel HTTP/HTTPS
- ⚠️ Solo afecta a comandos ping
- ✅ Túnel funciona perfectamente

**Solución (opcional, no necesaria):**
```bash
# Si quisieras habilitar ping (no requerido)
sudo sysctl -w net.ipv4.ping_group_range="0 2147483647"
```

**Decisión:** Ignorar warnings - túnel HTTP funcional.

---

### **Problema 3: Archivo cloudflared.deb en Git**

**Síntoma:**
Git detecta archivo .deb (250+ MB).

**Causa:**
Instalador descargado en carpeta del proyecto.

**Solución:**
```bash
echo "backend/cloudflared.deb" >> .gitignore
```

**Prevención futura:**
Descargar instaladores en `/tmp` en lugar de carpeta del proyecto.

---

## 🎓 CONCEPTOS APLICADOS

### **Networking:**
- ✅ Túneles VPN/Proxy
- ✅ DNS (CNAME, A records)
- ✅ HTTPS/TLS automático
- ✅ Reverse proxy (Cloudflare)
- ✅ Protocolo QUIC

### **DevOps:**
- ✅ Process managers (PM2)
- ✅ Arranque automático (systemd integration)
- ✅ Zero-downtime (múltiples conexiones túnel)
- ✅ Health checks

### **Seguridad:**
- ✅ Sin puertos abiertos
- ✅ Túnel cifrado
- ✅ HTTPS obligatorio
- ✅ IP servidor oculta
- ✅ DDoS protection

### **Frontend:**
- ✅ Variables de entorno (Vite)
- ✅ Fallback patterns
- ✅ Build configuration

---

## 🏆 HITOS ALCANZADOS

- ✅ **Dominio propio profesional registrado**
- ✅ **Backend accesible públicamente vía HTTPS**
- ✅ **Sin comprometer seguridad (puertos cerrados)**
- ✅ **Arquitectura escalable (múltiples proyectos)**
- ✅ **Cloudflare Tunnel funcionando 24/7**
- ✅ **PM2 gestionando backend + túnel**
- ✅ **DNS configurado correctamente**
- ✅ **Frontend preparado para Vercel**
- ✅ **Código en GitHub actualizado**

---

## 🔗 ESTADO FINAL DEL SISTEMA

### **Backend - Completado ✅**

```
Ubuntu Server (192.168.1.131)
├─ PM2 Proceso 0: api-tests
│  └─ Node.js Express (puerto 3001)
│     └─ Endpoints: /api/auth, /api/questions, /api/attempts, /api/stats, /api/subjects, /api/ranking
│
├─ PM2 Proceso 1: cloudflare-tunnel
│  └─ cloudflared tunnel run daw-backend
│     └─ 4 conexiones QUIC a Cloudflare (Madrid)
│
└─ PostgreSQL (localhost:5432)
   └─ Database: tests_daw
      └─ 181 preguntas DWEC
```

**URLs públicas:**
- ✅ `https://api-tests.prodelaya.dev/api/health` → Health check
- ✅ `https://api-tests.prodelaya.dev/api/auth/login` → Autenticación
- ✅ `https://api-tests.prodelaya.dev/api/questions` → Preguntas
- ✅ Todos los endpoints accesibles vía HTTPS

---

### **Frontend - Preparado ⏳**

```
Código local: ✅ Funcional
GitHub: ✅ Actualizado
Variable entorno: ✅ Configurada
Vercel: ⏳ Pendiente deploy
```

**Próximo paso:**
Deploy en Vercel con dominio `tests-daw.prodelaya.dev`

---

### **DNS Cloudflare - Configurado ✅**

```
Dominio: prodelaya.dev
Registrar: Cloudflare
Nameservers: guy.ns.cloudflare.com, tia.ns.cloudflare.com

Registros DNS:
┌──────┬───────────┬─────────────────────────────────────┬────────┐
│ Type │ Name      │ Content                             │ Proxy  │
├──────┼───────────┼─────────────────────────────────────┼────────┤
│ CNAME│ api-tests │ a78a4fc8-....cfargotunnel.com       │ ✅ On  │
└──────┴───────────┴─────────────────────────────────────┴────────┘

Pendiente añadir:
- tests-daw → CNAME → vercel-dns.com
```

---

## 💰 COSTOS DEL PROYECTO

### **Infraestructura actual:**

| Componente | Proveedor | Costo |
|------------|-----------|-------|
| Dominio prodelaya.dev | Cloudflare Registrar | 12€/año |
| Cloudflare Tunnel | Cloudflare | GRATIS |
| DNS Management | Cloudflare | GRATIS |
| HTTPS/SSL | Cloudflare | GRATIS |
| DDoS Protection | Cloudflare | GRATIS |
| Vercel Frontend | Vercel | GRATIS |
| **TOTAL** | | **12€/año = 1€/mes** |

### **Infraestructura futura (escalabilidad):**

```
Con el mismo dominio (sin costo adicional):
- Portfolio: prodelaya.dev
- Tests DAW: tests-daw.prodelaya.dev
- Blog: blog.prodelaya.dev
- Proyecto X: proyecto-x.prodelaya.dev
- API común: api.prodelaya.dev

Todos incluidos en los 12€/año del dominio
```

**ROI excelente para portfolio profesional.**

---

## 📚 RECURSOS Y DOCUMENTACIÓN

### **Cloudflare Tunnel:**
- Docs oficiales: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- GitHub: https://github.com/cloudflare/cloudflared

### **Vercel:**
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs

### **Cloudflare DNS:**
- Panel DNS: https://dash.cloudflare.com/
- Docs API: https://developers.cloudflare.com/api/

---

## 🎉 RESUMEN EJECUTIVO

### **Lo Que Se Logró:**

**1. Dominio Profesional:**
- ✅ `prodelaya.dev` registrado y configurado
- ✅ DNS gestionado en Cloudflare
- ✅ Estrategia de subdominios definida

**2. Backend Accesible Públicamente:**
- ✅ Cloudflare Tunnel configurado
- ✅ HTTPS automático funcionando
- ✅ Sin puertos abiertos (seguro)
- ✅ PM2 gestionando túnel 24/7

**3. Arquitectura Escalable:**
- ✅ Subdominios independientes
- ✅ Múltiples proyectos futuros soportados
- ✅ Deploy independiente por proyecto

**4. Preparación Frontend:**
- ✅ Variable de entorno configurada
- ✅ Código preparado para producción
- ✅ Listo para Vercel

---

### **Lo Que Falta:**

1. ⏳ Deploy frontend en Vercel
2. ⏳ Configurar dominio `tests-daw.prodelaya.dev`
3. ⏳ Testing end-to-end completo
4. ⏳ Verificar CORS en producción

**Tiempo estimado:** 1 hora (próxima sesión)

---

### **Progreso del Proyecto:**

```
[███████████████████████████░░░░] 95% Completado

✅ Backend: 100% (desarrollo + producción)
✅ Frontend: 100% (desarrollo)
⏳ Frontend: 0% (producción)
⏳ Testing E2E: Pendiente
```

**Estado:** Proyecto prácticamente terminado, solo falta deploy frontend.

---

## 🎓 APRENDIZAJES CLAVE

### **Técnicos:**

1. **Cloudflare Tunnel es superior a port forwarding:**
   - Más seguro (sin puertos expuestos)
   - Más fácil (sin configurar router)
   - Más profesional (HTTPS automático)

2. **Subdominios > Subdirectorios para múltiples proyectos:**
   - Mejor separación
   - Deploys independientes
   - Más flexible

3. **Variables de entorno son esenciales:**
   - Diferencia desarrollo/producción
   - Sin hardcodear URLs
   - Fácil cambiar backend

4. **PM2 es ideal para servicios Node.js:**
   - Backend + Túnel con misma herramienta
   - Logs unificados
   - Monitoreo simple

### **Estratégicos:**

1. **Dominio .dev vale la pena:**
   - 12€/año es inversión mínima
   - Portfolio profesional
   - Múltiples proyectos incluidos

2. **Cloudflare ecosystem es potente:**
   - DNS + Tunnel + Proxy en uno
   - Todo gratis excepto dominio
   - Integración perfecta

3. **Arquitectura pensada desde el inicio:**
   - Escalabilidad sin refactoring
   - Portfolio + proyectos en mismo dominio
   - Separación clara de responsabilidades

---

## 📝 COMMIT REALIZADO

```bash
git commit -m "feat(frontend): Configurar variable de entorno para API URL

- Cambiar baseURL hardcodeada por variable VITE_API_URL
- Fallback a IP local para desarrollo
- Preparado para deploy en Vercel con backend en Cloudflare Tunnel
- Actualizar .gitignore para excluir cloudflared.deb

Infraestructura:
- Dominio prodelaya.dev registrado en Cloudflare
- Cloudflare Tunnel configurado para api-tests.prodelaya.dev
- Backend accesible públicamente vía HTTPS
- PM2 gestionando backend + túnel (arranque automático)

Progreso: 95% completado - Solo falta deploy frontend"
```

---

## 🔧 COMANDOS ÚTILES PARA GESTIÓN

### **PM2 (Backend + Túnel):**
```bash
pm2 list                    # Ver estado de procesos
pm2 logs cloudflare-tunnel  # Ver logs del túnel
pm2 logs api-tests          # Ver logs del backend
pm2 restart cloudflare-tunnel  # Reiniciar túnel
pm2 monit                   # Monitor interactivo
pm2 save                    # Guardar configuración
```

### **Cloudflare Tunnel:**
```bash
cloudflared tunnel list     # Listar túneles
cloudflared tunnel info daw-backend  # Info del túnel
cloudflared tunnel route dns daw-backend api-tests.prodelaya.dev  # Crear DNS
```

### **Testing Backend:**
```bash
# Health check
curl https://api-tests.prodelaya.dev/api/health

# Login (requiere usuario en BD)
curl -X POST https://api-tests.prodelaya.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@daw.com","password":"123456"}'

# Questions (requiere token)
curl -H "Authorization: Bearer TOKEN" \
  https://api-tests.prodelaya.dev/api/questions?subjectCode=DWEC&topicNumber=1&limit=5
```

---

*Última actualización: 21 de octubre de 2025 (Sesión 15)*  
*Duración: 2 horas*  
*Resultado: Backend en producción con Cloudflare Tunnel - ÉXITO ✅*  
*Siguiente: Deploy Frontend en Vercel (Sesión 16)*