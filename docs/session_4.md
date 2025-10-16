# 📊 Sesión 4: FASE 2 - Backend Autenticación (Controllers y Servidor)

## 🎯 Estado Previo del Proyecto

### ✅ Checkpoint al Inicio
- ✅ Utilidades JWT (`generateToken` y `verifyToken`)
- ✅ Schemas Zod para validación (register/login)
- ✅ Middleware validador genérico
- ✅ Estructura de carpetas backend completa
- ✅ PostgreSQL con 4 tablas migradas

**Progreso anterior:** 50% completado

---

## 🎯 Objetivos de la Sesión

Completar el sistema de autenticación implementando:
1. Controllers con lógica de negocio (register/login)
2. Rutas conectando endpoints con controllers
3. Servidor Express funcional
4. Testing exhaustivo del flujo completo

---

## 🏗️ Arquitectura Implementada

```
Cliente (Thunder/curl)
    ↓
POST /api/auth/register
POST /api/auth/login
    ↓
Express Router (auth.routes.ts)
    ↓
Middleware Chain:
  1. validate(schema) → Valida datos con Zod
  2. controller → Ejecuta lógica de negocio
    ↓
Controller (auth.controller.ts)
    ↓
Prisma ORM → PostgreSQL
```

---

## 📦 Componentes Desarrollados

### 1. Auth Controller
**Archivo:** `backend/src/controllers/auth.controller.ts`

#### Función `register`

**Flujo conceptual:**
```
1. Extraer datos validados (Zod ya los validó)
    ↓
2. Verificar email único (findUnique)
    ↓
3. Si existe → 409 Conflict
    ↓
4. Hashear password (bcrypt 10 rounds)
    ↓
5. Crear usuario en PostgreSQL
    ↓
6. Responder 201 Created (sin password)
```

**Decisiones técnicas:**
- **bcrypt rounds: 10** → Balance seguridad/performance (~60-100ms)
- **Status 409** → Conflict (más semántico que 400 Bad Request)
- **No auto-login** → Separación de responsabilidades

#### Función `login`

**Flujo conceptual:**
```
1. Extraer credenciales validadas
    ↓
2. Buscar usuario por email
    ↓
3. Si no existe → 401 Unauthorized
    ↓
4. Comparar password con bcrypt
    ↓
5. Si no coincide → 401 (mismo mensaje)
    ↓
6. Generar JWT (24h validez)
    ↓
7. Responder 200 + token + user
```

**Decisión de seguridad:**
```javascript
// ❌ INSEGURO: Revela información
if (!user) return res.status(404).json({ error: 'Email no encontrado' });
if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

// ✅ SEGURO: Mensaje genérico
if (!user || !isPasswordValid) {
  return res.status(401).json({ error: 'Credenciales inválidas' });
}
```

---

### 2. Auth Routes
**Archivo:** `backend/src/routes/auth.routes.ts`

**Patrón Middleware Chain:**
```
POST /register → validate(registerSchema) → register
POST /login → validate(loginSchema) → login
```

**Ventajas del patrón:**
- ✅ Separation of Concerns
- ✅ Validación reutilizable
- ✅ Testing aislado
- ✅ Mantenibilidad

---

### 3. Servidor Express
**Archivo:** `backend/src/index.ts`

**Componentes configurados:**

#### Middlewares globales (orden importa):
```
1. cors()         → Permitir peticiones cross-origin
2. helmet()       → Headers de seguridad HTTP
3. express.json() → Parsear body JSON
4. logger         → Registrar peticiones
```

#### Error handlers:
- **404:** Rutas no encontradas
- **500:** Errores no manejados (requiere 4 parámetros)

#### Cierre graceful:
```javascript
process.on('SIGINT', async () => {
  await prisma.$disconnect();  // Evita conexiones huérfanas
  process.exit(0);
});
```

---

## 🧪 Testing Realizado

### Test 1: Health Check ✅
```bash
curl http://localhost:3001/api/health
```
**Resultado:** `200 OK` - Servidor funcionando

### Test 2: Registro Exitoso ✅
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@daw.com","password":"123456","name":"Usuario Prueba"}'
```
**Resultado:** `201 Created` - Usuario creado sin password en respuesta

### Test 3: Email Duplicado ✅
```bash
# Mismo email que Test 2
curl -X POST http://localhost:3001/api/auth/register ...
```
**Resultado:** `409 Conflict` - "El email ya está registrado"

### Test 4: Login Exitoso ✅
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@daw.com","password":"123456"}'
```
**Resultado:** `200 OK` con JWT token válido

### Test 5: Login Fallido ✅
```bash
# Password incorrecta
curl -X POST http://localhost:3001/api/auth/login \
  -d '{"email":"test@daw.com","password":"incorrecta"}'
```
**Resultado:** `401 Unauthorized` - "Credenciales inválidas"

---

## 🔍 Verificación en Base de Datos

**Prisma Studio** (puerto 5555):
- ✅ Usuario creado con ID 1
- ✅ Email: "test@daw.com"
- ✅ Password: `$2b$10$...` (hash bcrypt)
- ✅ Name: "Usuario Prueba"
- ✅ CreatedAt: timestamp correcto

**Análisis del hash:**
```
$2b$10$pj5ICtudezfj9ZBV...
 │   │  └─ Salt + Hash
 │   └─ 10 rounds (2^10 = 1024 iteraciones)
 └─ Algoritmo bcrypt
```

---

## 🐛 Problemas y Soluciones

### Problema 1: Order de middlewares
**Error:** `req.body = undefined` en controllers

**Causa:** Routes registradas antes que `express.json()`

**Solución:**
```javascript
// ✅ CORRECTO
app.use(express.json());      // Primero parsear
app.use('/api/auth', routes); // Después rutas

// ❌ INCORRECTO
app.use('/api/auth', routes); // req.body undefined
app.use(express.json());
```

### Problema 2: Error handler no reconocido
**Síntoma:** Express no captura errores 500

**Causa:** Error handler sin 4 parámetros

**Solución:**
```javascript
// ✅ Express reconoce como error handler
app.use((err, req, res, next) => { ... });

// ❌ Express lo trata como middleware normal
app.use((req, res, next) => { ... });
```

---

## 💡 Decisiones Técnicas Clave

### 1. bcrypt Rounds Trade-off
| Rounds | Tiempo | Seguridad | Decisión |
|--------|--------|-----------|----------|
| 8 | ~30ms | Baja | ❌ Muy rápido |
| **10** | **~60-100ms** | **Estándar** | **✅ Elegido** |
| 12 | ~250ms | Alta | ❌ Perceptible |
| 14 | ~1000ms | Muy alta | ❌ Malo para UX |

### 2. JWT Payload Mínimo
```json
{
  "userId": 1,
  "iat": 1760442066,  // Automático
  "exp": 1760528466   // Automático (24h)
}
```

**NO incluimos:**
- ❌ Email (puede cambiar)
- ❌ Roles (no necesario en DAW)
- ❌ Datos sensibles

### 3. Status Codes Semánticos
- `201 Created` → Recurso creado (register)
- `200 OK` → Operación exitosa (login)
- `401 Unauthorized` → Credenciales incorrectas
- `409 Conflict` → Email ya existe

---

## 📊 Métricas de la Sesión

| Métrica | Valor |
|---------|-------|
| Duración | 2 horas |
| Archivos creados | 3 |
| Tests ejecutados | 5 (todos pasando) |
| Endpoints funcionales | 2 + health |
| Progreso | 50% → 60% |

---

## ✅ Checklist Completado

- [x] Controller auth con register y login
- [x] Hasheo bcrypt (10 rounds)
- [x] Generación JWT (24h)
- [x] Rutas conectadas
- [x] Servidor Express con middlewares
- [x] Error handlers (404, 500)
- [x] Cierre graceful
- [x] 5 tests pasando
- [x] Verificación en Prisma Studio
- [x] Commit + push a GitHub

---

## 🎯 Próxima Sesión

**Objetivo:** API de Questions (GET /questions)
- Middleware authMiddleware
- Schemas para query params
- Controller con filtros (tema/final/failed)
- Aleatorización Fisher-Yates
- Eliminación de correctAnswer

---

## 🎓 Conceptos Aplicados

- **Hashing vs Encryption:** bcrypt es one-way (no reversible)
- **Salt:** Previene rainbow tables (incluido en bcrypt)
- **JWT:** Stateless authentication
- **Middleware Chain:** Composición de funciones
- **Error-first:** Validar → Ejecutar → Responder
- **Graceful Shutdown:** Cerrar conexiones limpiamente

---

## 📝 Commit Realizado

```bash
feat(backend): Completar sistema de autenticación (FASE 2)

- Implementar auth.controller (register + login)
- Hasheo bcrypt 10 rounds
- Generación JWT 24h
- Servidor Express con middlewares de seguridad
- Error handlers y cierre graceful
- Tests: 5/5 pasando

Backend autenticación 100% funcional
```

---

*Última actualización: 14 de octubre de 2025*
*Progreso total: 60% completado*
*Siguiente: API Questions*