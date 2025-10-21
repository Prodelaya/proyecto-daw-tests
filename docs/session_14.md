# 📊 Sesión 14: Deploy Backend en Producción con PM2

## 🎯 Estado Previo del Proyecto

### ✅ Checkpoint al Inicio
- ✅ Backend 100% funcional en desarrollo
- ✅ Frontend 100% funcional en desarrollo
- ✅ Sistema completo testeado localmente
- ✅ PostgreSQL con 181 preguntas DWEC
- ✅ Código en GitHub actualizado

**Progreso anterior:** 100% funcionalidad - 0% deploy

---

## 🎯 Objetivos de la Sesión

Desplegar el backend en producción en el servidor Linux:
1. Compilar TypeScript a JavaScript
2. Configurar variables de entorno
3. Instalar y configurar PM2
4. Resolver problemas de reinicios
5. Configurar arranque automático
6. Verificar accesibilidad en red

**Tiempo invertido:** 1 hora

---

## 📦 PASOS REALIZADOS

### **1. Verificación de Configuración Base**

**Archivos verificados:**

**package.json - Scripts:**
```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "seed": "tsx src/seed/seed.ts"
  }
}
```

**tsconfig.json - Compilación:**
```json
{
  "outDir": "./dist",
  "rootDir": "./src"
}
```

**Resultado:** ✅ Configuración correcta, lista para compilar.

---

### **2. Variables de Entorno**

**Archivo:** `backend/.env`

**Contenido verificado:**
```bash
DATABASE_URL="postgresql://laya92:***@localhost:5432/tests_daw"
JWT_SECRET="daw2025_proyecto_tests_secret_key_muy_segura"
PORT=3001
```

**Verificación .gitignore:**
```bash
node_modules
.env
/src/generated/prisma
```

**Resultado:** ✅ Variables configuradas, credenciales protegidas.

---

### **3. Compilación TypeScript → JavaScript**

**Comando ejecutado:**
```bash
cd /opt/proyecto-daw-tests/backend
npm run build
```

**Resultado:**
```bash
> backend@1.0.0 build
> tsc

# Sin errores ✅
```

**Verificación carpeta dist:**
```bash
ls -la dist/
# controllers/
# middlewares/
# routes/
# schemas/
# seed/
# utils/
# index.js ✅
```

**Resultado:** ✅ Código compilado correctamente en `/dist`.

---

### **4. Prueba del Build Local**

**Comando ejecutado:**
```bash
npm start
```

**Salida:**
```
🚀 Servidor Express iniciado correctamente
📡 Escuchando en: http://localhost:3001
🌐 Accesible desde red: http://192.168.1.131:3001
✅ Listo para recibir peticiones
```

**Test health check:**
```bash
curl http://localhost:3001/api/health
# {"status":"OK","message":"Servidor funcionando correctamente",...}
```

**Resultado:** ✅ Backend compilado funciona perfectamente.

---

### **5. Instalación de PM2**

**¿Qué es PM2?**
Process Manager para Node.js que mantiene aplicaciones corriendo 24/7.

**Características:**
- ✅ Reinicio automático en caso de crash
- ✅ Logs centralizados
- ✅ Monitoreo de recursos (CPU, memoria)
- ✅ Arranque automático al reiniciar servidor
- ✅ Escalado horizontal (clustering)

**Comando ejecutado:**
```bash
sudo npm install -g pm2
```

**Verificación:**
```bash
pm2 --version
# 6.0.13
```

**Resultado:** ✅ PM2 instalado globalmente.

---

### **6. Inicio del Backend con PM2**

**Comando ejecutado:**
```bash
pm2 start dist/index.js --name api-tests
```

**Salida inicial:**
```
┌────┬───────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name      │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼───────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ api-tests │ fork     │ 0    │ online    │ 0%       │ 28.5mb   │
└────┴───────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

**Resultado:** ✅ Backend iniciado con PM2.

---

### **7. Problema Detectado: Reinicios Constantes**

**Síntoma observado:**
```bash
pm2 list
# ↺ 4 ... ↺ 15 ... ↺ 17 (contador aumentando)
```

**Diagnóstico:**

**Logs revisados:**
```bash
pm2 logs api-tests --lines 50
# Múltiples mensajes de "🚀 Servidor iniciado"
# Sin errores en error.log ✅
```

**Puerto verificado:**
```bash
sudo lsof -i :3001
# Solo 1 proceso (correcto)
```

**Health check:**
```bash
curl http://localhost:3001/api/health
# {"status":"OK",...} ✅
```

**Conclusión:** El backend funciona pero se reinicia constantemente.

---

### **8. Causa Raíz Identificada**

**Código problemático en `src/index.ts`:**
```typescript
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await prisma.$disconnect();
  console.log('✅ Conexión a PostgreSQL cerrada');
  process.exit(0);  // ❌ Esto causa el reinicio
});
```

**¿Por qué causa problema?**

1. **PM2 envía señales SIGINT** periódicamente para verificar salud del proceso
2. **El handler captura la señal** y ejecuta `process.exit(0)`
3. **PM2 detecta que el proceso terminó** y lo reinicia automáticamente
4. **Ciclo infinito** de reinicios

**Handler útil en desarrollo:**
- ✅ Permite cerrar limpiamente con Ctrl+C
- ✅ Desconecta Prisma antes de salir

**Handler problemático en producción:**
- ❌ Interfiere con la gestión de PM2
- ❌ PM2 ya gestiona el ciclo de vida del proceso

---

### **9. Solución Implementada**

**Modificación en `backend/src/index.ts`:**

**ANTES:**
```typescript
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await prisma.$disconnect();
  console.log('✅ Conexión a PostgreSQL cerrada');
  process.exit(0);
});
```

**DESPUÉS:**
```typescript
// Solo manejar SIGINT en desarrollo (no con PM2)
if (process.env.NODE_ENV !== 'production' && !process.env.PM2_HOME) {
  process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando servidor...');
    await prisma.$disconnect();
    console.log('✅ Conexión a PostgreSQL cerrada');
    process.exit(0);
  });
}
```

**¿Cómo funciona la condición?**

- `process.env.NODE_ENV !== 'production'`: No es entorno de producción
- `!process.env.PM2_HOME`: PM2 no está corriendo (PM2 establece esta variable)
- **Ambas condiciones deben ser true** para que el handler se active

**Resultado:** Handler solo activo en desarrollo local (npm run dev).

---

### **10. Recompilación y Reinicio**

**Comandos ejecutados:**
```bash
# 1. Recompilar con el cambio
npm run build

# 2. Reiniciar proceso PM2
pm2 restart api-tests

# 3. Esperar 30 segundos y verificar
sleep 30 && pm2 list
```

**Resultado:**
```
┌────┬───────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name      │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼───────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ api-tests │ fork     │ 17   │ online    │ 0%       │ 67.0mb   │
└────┴───────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

**Verificación 60 segundos después:**
```bash
pm2 list
# ↺ 17 (sin cambios) ✅
```

**Resultado:** ✅ Proceso estable, sin reinicios.

---

### **11. Configuración de Arranque Automático**

**¿Qué hace este paso?**
Configura PM2 para iniciar automáticamente cuando el servidor Linux se reinicie.

**Comando ejecutado:**
```bash
pm2 startup
```

**Salida:**
```bash
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/home/laya92/.nvm/versions/node/v20.19.5/bin \
  /home/laya92/.nvm/versions/node/v20.19.5/lib/node_modules/pm2/bin/pm2 \
  startup systemd -u laya92 --hp /home/laya92
```

**Comando ejecutado con sudo:**
```bash
sudo env PATH=$PATH:/home/laya92/.nvm/versions/node/v20.19.5/bin \
  /home/laya92/.nvm/versions/node/v20.19.5/lib/node_modules/pm2/bin/pm2 \
  startup systemd -u laya92 --hp /home/laya92
```

**Resultado:**
```bash
[PM2] Writing init configuration in /etc/systemd/system/pm2-laya92.service
[PM2] Making script booting at startup...
[PM2] [-] Executing: systemctl enable pm2-laya92...
Created symlink /etc/systemd/system/multi-user.target.wants/pm2-laya92.service 
  → /etc/systemd/system/pm2-laya92.service.
[PM2] [v] Command successfully executed.
```

**Archivo systemd creado:**
`/etc/systemd/system/pm2-laya92.service`

**Contenido del servicio:**
```ini
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=laya92
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/home/laya92/.nvm/versions/node/v20.19.5/bin:...
Environment=PM2_HOME=/home/laya92/.pm2
PIDFile=/home/laya92/.pm2/pm2.pid
Restart=on-failure
ExecStart=/home/laya92/.nvm/versions/node/v20.19.5/lib/node_modules/pm2/bin/pm2 resurrect
ExecReload=/home/laya92/.nvm/versions/node/v20.19.5/lib/node_modules/pm2/bin/pm2 reload all
ExecStop=/home/laya92/.nvm/versions/node/v20.19.5/lib/node_modules/pm2/bin/pm2 kill

[Install]
WantedBy=multi-user.target
```

**Resultado:** ✅ PM2 configurado para arrancar con el sistema.

---

### **12. Guardar Lista de Procesos**

**¿Por qué este paso?**
`pm2 startup` configura que PM2 arranque, pero necesitamos decirle **qué procesos** debe iniciar.

**Comando ejecutado:**
```bash
pm2 save
```

**Resultado:**
```bash
[PM2] Saving current process list...
[PM2] Successfully saved in /home/laya92/.pm2/dump.pm2
```

**Archivo generado:** `/home/laya92/.pm2/dump.pm2`

**Contenido (JSON):**
```json
{
  "apps": [
    {
      "name": "api-tests",
      "script": "/opt/proyecto-daw-tests/backend/dist/index.js",
      "cwd": "/opt/proyecto-daw-tests/backend",
      ...
    }
  ]
}
```

**Resultado:** ✅ Configuración persistente guardada.

---

### **13. Verificación Final**

**Estado del proceso:**
```bash
pm2 list
┌────┬───────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name      │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼───────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ api-tests │ fork     │ 17   │ online    │ 0%       │ 66.7mb   │
└────┴───────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

**Health check local:**
```bash
curl http://localhost:3001/api/health
# {"status":"OK","message":"Servidor funcionando correctamente",...}
```

**Health check desde red:**
```bash
# Desde PC Windows
curl http://192.168.1.131:3001/api/health
# {"status":"OK",...}
```

**Resultado:** ✅✅✅ Backend accesible desde la red local.

---

## 💡 DECISIONES TÉCNICAS DOCUMENTADAS

### **1. PM2 vs Systemd Directo vs Docker**

| Opción | Pros | Contras | Decisión |
|--------|------|---------|----------|
| **PM2** | Fácil setup, logs, monitoreo | Capa extra | ✅ Elegido |
| Systemd directo | Nativo Linux, sin deps | Complejo, sin logs bonitos | ❌ |
| Docker | Portabilidad | Complejidad innecesaria DAW | ❌ |

**Justificación:** PM2 es estándar de la industria para Node.js en producción sin Docker.

---

### **2. Solución SIGINT: Condicional vs Eliminar**

| Opción | Pros | Contras | Decisión |
|--------|------|---------|----------|
| **Condicional** | Funciona en dev y prod | Código extra | ✅ Elegido |
| Eliminar handler | Código más simple | Prisma no se desconecta en dev | ❌ |
| PM2 signal config | Solución específica PM2 | Menos portabilidad | ❌ |

**Código implementado:**
```typescript
if (process.env.NODE_ENV !== 'production' && !process.env.PM2_HOME) {
  process.on('SIGINT', async () => { ... });
}
```

**Justificación:** Mejor de ambos mundos - cierre limpio en desarrollo, estabilidad en producción.

---

### **3. Fork Mode vs Cluster Mode**

**PM2 ofrece 2 modos:**

**Fork Mode (Elegido):**
- 1 instancia del proceso
- Simple, suficiente para DAW
- 67MB RAM

**Cluster Mode:**
- N instancias (según CPUs)
- Balanceo de carga automático
- N × 67MB RAM

**Comando cluster (no usado):**
```bash
pm2 start dist/index.js -i max  # max = núm CPUs
```

**Decisión:** Fork mode suficiente para tráfico de proyecto DAW.

---

### **4. Variables de Entorno: .env vs PM2 Ecosystem**

**Opción A: .env file (Elegido):**
```bash
# backend/.env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
```

**Opción B: PM2 Ecosystem file:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api-tests',
    script: 'dist/index.js',
    env: {
      DATABASE_URL: "postgresql://...",
      JWT_SECRET: "..."
    }
  }]
};
```

**Decisión:** .env más simple para DAW. Ecosystem útil para múltiples entornos (staging, prod).

---

## 🐛 PROBLEMAS Y SOLUCIONES

### **Problema 1: Reinicios Constantes**

**Síntoma:**
```bash
pm2 list
# ↺ aumenta constantemente (4, 15, 17...)
```

**Diagnóstico:**
- ✅ Backend funciona (health check OK)
- ✅ Solo 1 proceso en puerto 3001
- ✅ Sin errores en logs
- ❌ Proceso se reinicia cada ~10 segundos

**Causa raíz:**
Handler `process.on('SIGINT')` en el código captura señales de PM2 y ejecuta `process.exit(0)`.

**Solución:**
Condicionar handler para que solo funcione en desarrollo:
```typescript
if (process.env.NODE_ENV !== 'production' && !process.env.PM2_HOME) {
  process.on('SIGINT', async () => { ... });
}
```

**Resultado:** Proceso estable sin reinicios.

---

### **Problema 2: IP Hardcodeada Incorrecta**

**Síntoma:**
Logs mostraban `http://192.168.1.130:3001` pero IP real es `.131`

**Causa:**
IP hardcodeada en `src/index.ts`:
```typescript
console.log(`🌐 Accesible desde red: http://192.168.1.130:3001`);
```

**Solución:**
Usuario corrigió manualmente a `.131` en el código antes de compilar.

**Mejora futura:**
Usar variable de entorno o detectar IP automáticamente:
```typescript
import os from 'os';
const networkInterfaces = os.networkInterfaces();
const localIP = Object.values(networkInterfaces)
  .flat()
  .find(i => i?.family === 'IPv4' && !i.internal)?.address;
```

---

## 📊 MÉTRICAS DE LA SESIÓN

| Métrica | Valor |
|---------|-------|
| **Duración** | 1 hora |
| **Archivos modificados** | 1 (index.ts) |
| **Comandos ejecutados** | 15+ |
| **Problemas resueltos** | 2 |
| **Servicios configurados** | 2 (PM2, systemd) |
| **Tests manuales** | 4/4 pasados |
| **Estado final** | Backend en producción ✅ |

---

## ✅ CHECKLIST COMPLETADO

### **Compilación:**
- [x] TypeScript compilado a JavaScript
- [x] Carpeta `dist/` generada correctamente
- [x] Build probado localmente con `npm start`

### **PM2:**
- [x] PM2 instalado globalmente (v6.0.13)
- [x] Proceso `api-tests` iniciado
- [x] Problema de reinicios diagnosticado
- [x] Problema de reinicios solucionado
- [x] Proceso estable (↺ no aumenta)

### **Producción:**
- [x] Arranque automático configurado (systemd)
- [x] Lista de procesos guardada (pm2 save)
- [x] Health check local OK
- [x] Health check desde red OK

### **Código:**
- [x] SIGINT handler condicional
- [x] IP corregida en logs
- [x] Código compilado actualizado

---

## 🎯 PRÓXIMA SESIÓN: Deploy Frontend en Vercel

### **Objetivos:**

**Preparación (15 min):**
- Crear cuenta en Vercel (si no existe)
- Instalar Vercel CLI
- Conectar repositorio GitHub

**Configuración (15 min):**
- Variables de entorno en Vercel
  - `VITE_API_URL=http://192.168.1.131:3001/api`
- Configurar carpeta `frontend/` como root
- Configurar comando de build

**Deploy (10 min):**
- Deploy automático desde GitHub
- Verificar build exitoso
- Obtener URL de producción

**Testing (20 min):**
- Probar login desde Vercel
- Verificar conexión con backend
- Flujo completo end-to-end
- Verificar CORS

**Tiempo estimado:** 1 hora

---

## 🎓 CONCEPTOS APRENDIDOS

### **Process Managers:**
- ✅ PM2 para gestión de procesos Node.js
- ✅ Diferencia fork vs cluster mode
- ✅ Logs centralizados (`pm2 logs`)
- ✅ Monitoreo de recursos (`pm2 monit`)
- ✅ Arranque automático con systemd

### **Señales de Sistema:**
- ✅ SIGINT (Ctrl+C)
- ✅ SIGTERM (terminación limpia)
- ✅ SIGKILL (terminación forzada)
- ✅ Handlers de señales en Node.js

### **Systemd:**
- ✅ Unit files (`.service`)
- ✅ `systemctl enable/disable`
- ✅ `WantedBy=multi-user.target`
- ✅ Integración con PM2

### **Deploy Node.js:**
- ✅ Compilación TypeScript
- ✅ Separación dev vs producción
- ✅ Variables de entorno
- ✅ Persistencia de configuración

---

## 🏆 LOGROS DE LA SESIÓN

- ✅ **Backend en producción** funcionando 24/7
- ✅ **Proceso estable** sin reinicios
- ✅ **Arranque automático** configurado
- ✅ **Accesible desde red** local
- ✅ **Problema crítico resuelto** (SIGINT handler)
- ✅ **Configuración persistente** guardada
- ✅ **Health check** verificado local y remoto

---

## 📝 COMANDOS ÚTILES PM2

### **Gestión de procesos:**
```bash
pm2 start <script>           # Iniciar proceso
pm2 restart <name>           # Reiniciar proceso
pm2 stop <name>              # Detener proceso
pm2 delete <name>            # Eliminar proceso
pm2 list                     # Listar todos los procesos
```

### **Logs y monitoreo:**
```bash
pm2 logs <name>              # Ver logs en tiempo real
pm2 logs <name> --lines 100  # Ver últimas 100 líneas
pm2 logs <name> --err        # Solo errores
pm2 monit                    # Monitor interactivo
pm2 info <name>              # Info detallada del proceso
```

### **Configuración:**
```bash
pm2 startup                  # Configurar arranque automático
pm2 save                     # Guardar lista de procesos
pm2 resurrect                # Restaurar procesos guardados
pm2 unstartup                # Deshacer arranque automático
```

### **Actualización de código:**
```bash
# Flujo completo de actualización
npm run build                # Recompilar código
pm2 restart api-tests        # Reiniciar con código nuevo
pm2 save                     # Guardar configuración
```

---

## 🔗 ARQUITECTURA FINAL BACKEND

```
┌─────────────────────────────────────────┐
│         SERVIDOR LINUX (Ubuntu)         │
│         IP: 192.168.1.131               │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │         SYSTEMD SERVICE           │  │
│  │   /etc/systemd/system/            │  │
│  │   pm2-laya92.service              │  │
│  │                                   │  │
│  │   Arranca automáticamente         │  │
│  │   al reiniciar servidor           │  │
│  └──────────────┬────────────────────┘  │
│                 │                        │
│                 ▼                        │
│  ┌───────────────────────────────────┐  │
│  │            PM2 DAEMON             │  │
│  │      Process Manager 6.0.13       │  │
│  │                                   │  │
│  │   - Mantiene proceso corriendo    │  │
│  │   - Reinicia si crashea           │  │
│  │   - Gestiona logs                 │  │
│  │   - Monitorea recursos            │  │
│  └──────────────┬────────────────────┘  │
│                 │                        │
│                 ▼                        │
│  ┌───────────────────────────────────┐  │
│  │       PROCESO: api-tests          │  │
│  │   node dist/index.js              │  │
│  │                                   │  │
│  │   Estado: online                  │  │
│  │   Puerto: 3001                    │  │
│  │   Memoria: ~67MB                  │  │
│  │   Reinicios: 17 (estable)         │  │
│  └──────────────┬────────────────────┘  │
│                 │                        │
│                 ▼                        │
│  ┌───────────────────────────────────┐  │
│  │      EXPRESS API (Backend)        │  │
│  │                                   │  │
│  │   Rutas:                          │  │
│  │   /api/auth/*                     │  │
│  │   /api/questions/*                │  │
│  │   /api/attempts/*                 │  │
│  │   /api/stats/*                    │  │
│  │   /api/subjects/*                 │  │
│  │   /api/ranking                    │  │
│  └──────────────┬────────────────────┘  │
│                 │                        │
│                 ▼                        │
│  ┌───────────────────────────────────┐  │
│  │       POSTGRESQL 15               │  │
│  │   localhost:5432                  │  │
│  │                                   │  │
│  │   Database: tests_daw             │  │
│  │   Tables: 4 (User, Question,      │  │
│  │            Attempt, UserFailed)   │  │
│  │   Records: 181 preguntas          │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         ▲
         │ HTTP Requests
         │ http://192.168.1.131:3001/api
         │
┌────────┴─────────┐
│  CLIENTES        │
│  - PC Local      │
│  - Frontend      │
│  - Vercel        │
└──────────────────┘
```

---

## 🎉 ESTADO FINAL DEL PROYECTO

**Backend:**
- ✅ Desplegado en producción
- ✅ Corriendo 24/7 con PM2
- ✅ Arranque automático configurado
- ✅ Accesible desde red local
- ✅ Health check funcionando

**Frontend:**
- ⏳ Pendiente deploy en Vercel
- ⏳ Variables de entorno por configurar
- ⏳ Testing end-to-end pendiente

**Base de Datos:**
- ✅ PostgreSQL corriendo
- ✅ 181 preguntas cargadas
- ✅ Conexión con backend OK

**Progreso Total:** 95% completado
- Backend: 100% ✅
- Frontend: 0% deploy
- Testing E2E: Pendiente

---

*Última actualización: 21 de octubre de 2025 (Sesión 14)*  
*Duración: 1 hora*  
*Resultado: Backend en producción - ÉXITO ✅*  
*Siguiente: Deploy Frontend en Vercel*