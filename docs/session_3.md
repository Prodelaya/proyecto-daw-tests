# 📊 Sesión 3: FASE 2 - Backend Autenticación (Bloque 1)

## 🎯 Estado Actual del Proyecto

### ✅ Checkpoint Previo (Sesiones 1-2)
- ✅ Estructura completa de carpetas
- ✅ Frontend setup (Vite + React + TypeScript + Tailwind)
- ✅ Backend setup (Express + Prisma + TypeScript)
- ✅ PostgreSQL configurado con 4 tablas
- ✅ Script seed funcional (30 preguntas DWEC UT1)
- ✅ Repositorio GitHub sincronizado

**Progreso anterior:** 40% completado

---

## 🆕 Trabajo Realizado en Esta Sesión (1.5h)

### **FASE 2 - Bloque 1: Utilidades Base de Autenticación** ✨

---

#### 11. **Instalación de Dependencias JWT** (PASO 10)
**Qué hicimos:**
- Instalado `jsonwebtoken` como dependencia de producción
- Instalado `@types/jsonwebtoken` como dependencia de desarrollo

**Para qué:**
- `jsonwebtoken`: Librería para crear y verificar tokens JWT
- `@types/jsonwebtoken`: Definiciones de TypeScript para autocompletado

**Por qué ahora:**
- Estrategia de instalación incremental (Just-in-Time)
- Solo instalamos lo que necesitamos en cada fase
- Facilita entender el propósito de cada dependencia en contexto

**Comandos ejecutados:**
```bash
cd /opt/proyecto-daw-tests/backend
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

**Resultado:** 
- ✅ Dependencias añadidas a `package.json`
- ✅ Sin errores de módulo no encontrado en TypeScript

---

#### 12. **Utilidad JWT** (PASO 11) ✨
**Qué hicimos:**
- Creado `backend/src/utils/jwt.util.ts`
- Implementado función `generateToken(userId)` 
- Implementado función `verifyToken(token)`

**Para qué:**
- **generateToken:** Crear tokens JWT cuando un usuario hace login (válidos 24h)
- **verifyToken:** Validar tokens en peticiones protegidas y extraer userId

**Cómo funciona:**

**GenerateToken:**
1. Recibe el ID del usuario
2. Crea payload: `{ userId: 5 }`
3. Firma con SECRET_KEY usando algoritmo HS256
4. Establece expiración de 24h
5. Devuelve token string: `"eyJhbGci..."`

**VerifyToken:**
1. Recibe token del header Authorization
2. Verifica firma con SECRET_KEY
3. Verifica que no haya expirado
4. Si válido → devuelve `{ userId: 5 }`
5. Si inválido → devuelve `null`

**Decisiones técnicas:**
- ✅ Solo access token (sin refresh) → simplicidad para DAW
- ✅ Expiración 24h → balance UX vs seguridad
- ✅ Payload mínimo (solo userId) → no datos sensibles
- ✅ Manejo de errores con `null` → fácil de usar en middlewares
- ✅ SECRET_KEY en `.env` → seguridad básica

**Código clave:**
```typescript
export const generateToken = (userId: number): string => {
  const payload = { userId };
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
};

export const verifyToken = (token: string): { userId: number } | null => {
  try {
    return jwt.verify(token, SECRET_KEY) as { userId: number };
  } catch {
    return null;
  }
};
```

**Resultado:**
- ✅ Archivo creado sin errores TypeScript
- ✅ Funciones exportadas y listas para usar

---

#### 13. **Schemas de Validación Zod** (PASO 12) ✨
**Qué hicimos:**
- Creado `backend/src/schemas/auth.schemas.ts`
- Definido `registerSchema` (email, password, name)
- Definido `loginSchema` (email, password)
- Exportado tipos TypeScript inferidos

**Para qué:**
- Validar datos que llegan del frontend antes de procesarlos
- Evitar SQL injection, XSS y datos malformados
- Proporcionar errores descriptivos al usuario

**Reglas implementadas:**

**RegisterSchema:**
- `email`: string, formato email válido, requerido
- `password`: string, mínimo 6 caracteres, requerido
- `name`: string, mínimo 2 caracteres, requerido

**LoginSchema:**
- `email`: string, formato email válido, requerido
- `password`: string, requerido (sin mínimo, ya está en BD)

**Ventajas de Zod:**
- ✅ Validación declarativa (menos código que if/else manuales)
- ✅ Errores descriptivos automáticos
- ✅ Inferencia automática de tipos TypeScript
- ✅ Reutilizable en múltiples endpoints

**Código clave:**
```typescript
export const registerSchema = z.object({
  email: z.string().email('Formato de email inválido').min(1),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres')
});

export type RegisterInput = z.infer<typeof registerSchema>;
```

**Resultado:**
- ✅ Schemas definidos y exportados
- ✅ Tipos TypeScript automáticos
- ✅ Sin errores de compilación

---

#### 14. **Middleware Validador** (PASO 13) ✨
**Qué hicimos:**
- Creado `backend/src/middlewares/validator.middleware.ts`
- Implementado función `validate(schema)` como Higher-Order Function
- Formateo de errores Zod para respuestas legibles

**Para qué:**
- Reutilizar validación en todas las rutas sin código repetido
- Interceptar peticiones antes del controller
- Responder 400 automáticamente si datos inválidos

**Cómo funciona:**
1. Se llama `validate(registerSchema)` en la ruta
2. Devuelve un middleware de Express
3. El middleware valida `req.body` con `schema.safeParse()`
4. Si válido → llama `next()` (continuar a controller)
5. Si inválido → responde `400` con detalles de errores

**Patrón Higher-Order Function:**
```typescript
validate(schema) → devuelve → middleware(req, res, next)
```

**Ventajas:**
- ✅ DRY (Don't Repeat Yourself) → una sola implementación
- ✅ Separation of Concerns → validación separada de lógica
- ✅ Errores consistentes → mismo formato en toda la API
- ✅ Fácil testing → middleware aislado

**Código clave:**
```typescript
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    next();
  };
};
```

**Resultado:**
- ✅ Middleware funcional y tipado
- ✅ Listo para usar en rutas
- ✅ Respuestas de error estructuradas

---

#### 15. **Estructura de Carpetas Completada** (PASO 14)
**Qué hicimos:**
- Creado carpetas `controllers/` y `routes/` (vacías por ahora)

**Para qué:**
- Mantener estructura limpia antes del commit
- Preparar para el Bloque 2 (controllers + routes)

**Comandos:**
```bash
mkdir -p backend/src/controllers
mkdir -p backend/src/routes
```

---

#### 16. **Git Commit + Push** (PASO 15) ✨
**Qué hicimos:**
- Commit con mensaje descriptivo siguiendo convención
- Push a GitHub con historial limpio

**Archivos commiteados:**
```
✅ backend/src/utils/jwt.util.ts (nuevo)
✅ backend/src/schemas/auth.schemas.ts (nuevo)
✅ backend/src/middlewares/validator.middleware.ts (nuevo)
✅ backend/package.json (modificado - nuevas deps)
✅ docs/prompt.txt (modificado)
```

**Mensaje de commit:**
```
feat(backend): Implementar utilidades base de autenticación

- Añadir jwt.util.ts con generateToken y verifyToken
- Crear schemas Zod para validación (register/login)
- Implementar middleware validator genérico con Zod
- Instalar jsonwebtoken y @types/jsonwebtoken

Bloque 1/4 de FASE 2 completado (Sistema Autenticación)
```

**Resultado:**
- ✅ Commit exitoso en repositorio local
- ✅ Push exitoso a GitHub
- ✅ Historial limpio con commit atómico

---

## 📁 Estructura de Archivos Actualizada

```
/opt/proyecto-daw-tests/
│
├── backend/
│   ├── src/
│   │   ├── utils/
│   │   │   └── jwt.util.ts ✨ NUEVO
│   │   ├── schemas/
│   │   │   └── auth.schemas.ts ✨ NUEVO
│   │   ├── middlewares/
│   │   │   └── validator.middleware.ts ✨ NUEVO
│   │   ├── controllers/ ✨ NUEVO (vacío)
│   │   ├── routes/ ✨ NUEVO (vacío)
│   │   ├── seed/
│   │   │   ├── seed.ts
│   │   │   └── DWEC/dwec_ut1.json
│   │   └── index.ts (pendiente)
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json ✨ ACTUALIZADO (jsonwebtoken)
│   ├── tsconfig.json
│   └── .env
│
├── frontend/ (sin cambios)
├── docs/ (sin cambios)
├── .git/
├── .gitignore
└── README.md
```

---

## 🛠️ Dependencias Añadidas

### Backend (nuevas en esta sesión)
- ✅ `jsonwebtoken` v9.0.x (producción)
- ✅ `@types/jsonwebtoken` v9.0.x (desarrollo)

### Backend (ya instaladas antes)
- ✅ express
- ✅ prisma / @prisma/client
- ✅ bcrypt
- ✅ zod
- ✅ cors
- ✅ helmet
- ✅ typescript / tsx / @types/node

---

## 📊 Progreso General del Proyecto

```
[█████████████████████░░░░░░░░░░░░░░░] 50% Completado

Fases:
✅ Fase 0: Preparación entorno (100%)
✅ Fase 1: Setup inicial (100%)
🔄 Fase 2: Backend Auth (25% - Bloque 1/4 completado)
⏳ Fase 3: Backend API (0%)
⏳ Fase 4: Frontend (0%)
⏳ Fase 5: Deploy (0%)
⏳ Fase 6: Testing (0%)
```

**Tiempo invertido total:** ~6 horas  
**Tiempo invertido hoy:** ~1.5 horas  
**Tiempo estimado restante:** 18-20 horas  

---

## ✅ Checkpoint Actual - FASE 2

### **Bloque 1: Utilidades Base** ✅ COMPLETADO
- [x] Instalar jsonwebtoken
- [x] Crear jwt.util.ts
- [x] Crear auth.schemas.ts
- [x] Crear validator.middleware.ts
- [x] Estructura de carpetas completa
- [x] Commit + push a GitHub

### **Bloque 2: Controllers + Routes** 🔜 PRÓXIMO
- [ ] Crear auth.controller.ts (register + login)
- [ ] Crear auth.routes.ts
- [ ] Configurar servidor Express (index.ts)
- [ ] Configurar .env (JWT_SECRET)
- [ ] Probar con Thunder Client
- [ ] Commit + push

### **Bloque 3: Testing Endpoints** ⏳ PENDIENTE
- [ ] Test registro exitoso
- [ ] Test login exitoso
- [ ] Test validaciones (email inválido, password corto, etc.)
- [ ] Test login con credenciales incorrectas

### **Bloque 4: Documentación** ⏳ PENDIENTE
- [ ] Actualizar README con endpoints
- [ ] Documentar variables de entorno
- [ ] Screenshots Thunder Client

---

## 🎯 Próximo Paso: Bloque 2 - Controllers + Routes (1h)

### **¿Qué vamos a hacer?**
Crear la lógica de negocio (controllers) y conectarla con URLs (routes) para que los endpoints funcionen.

### **Archivos a crear:**
1. **`backend/src/controllers/auth.controller.ts`**
   - Función `register`: Valida email único, hashea password, crea usuario en BD
   - Función `login`: Verifica email existe, compara password hasheado, genera JWT

2. **`backend/src/routes/auth.routes.ts`**
   - POST `/register` → validate(registerSchema) → register controller
   - POST `/login` → validate(loginSchema) → login controller

3. **`backend/src/index.ts`**
   - Inicializar Express
   - Aplicar middlewares globales (cors, helmet, json)
   - Registrar rutas `/api/auth`
   - Iniciar servidor en puerto 3001

4. **`backend/.env`** (añadir variable)
   - `JWT_SECRET=clave-aleatoria-segura`

### **Flujo completo que lograremos:**
```
POST /api/auth/register
  ↓
validate(registerSchema) middleware
  ↓
register controller
  ↓
  1. Verificar email no existe
  2. Hashear password con bcrypt
  3. Crear usuario en PostgreSQL
  4. Responder 201 Created
```

```
POST /api/auth/login
  ↓
validate(loginSchema) middleware
  ↓
login controller
  ↓
  1. Buscar usuario por email
  2. Comparar password con bcrypt.compare()
  3. Generar token JWT con generateToken()
  4. Responder 200 con { token, user }
```

### **Tiempo estimado:** 1 hora

---

## 💡 Lecciones Aprendidas en Esta Sesión

### **1. Instalación incremental de dependencias**
- **Pro:** Contexto claro de para qué sirve cada librería
- **Contra:** Requiere instalar en cada fase
- **Decisión:** Preferimos didáctica sobre comodidad inicial

### **2. Payload JWT simple vs estándar**
- **Estándar:** `{ sub, iat, exp }` (oficial)
- **Nuestro:** `{ userId }` (+ iat/exp automáticos)
- **Trade-off:** Simplicidad > purismo en proyecto educativo

### **3. Zod vs validación manual**
- Zod reduce ~70% de código de validación
- Proporciona tipos TypeScript gratis
- Errores más descriptivos para el frontend

### **4. Higher-Order Functions en middlewares**
- Patrón común en Express para middlewares configurables
- `validate(schema)` devuelve función → reutilizable
- Facilita testing y separation of concerns

### **5. Commits atómicos estratégicos**
- Bloque 1 completo = 1 commit (funcionalidad coherente)
- Mensaje descriptivo con contexto
- Push frecuente = backup en nube

---

## 🔗 Enlaces Útiles

- **Repositorio GitHub:** https://github.com/Prodelaya/proyecto-daw-tests
- **JWT Docs:** https://jwt.io/introduction
- **Zod Docs:** https://zod.dev
- **Express Middleware Guide:** https://expressjs.com/en/guide/using-middleware.html

---

## 🎉 Hitos Alcanzados

- ✅ Utilidades JWT funcionales (generar + verificar)
- ✅ Sistema de validación robusto con Zod
- ✅ Middleware reutilizable para todas las rutas
- ✅ Estructura backend profesional (MVC)
- ✅ Commit limpio y descriptivo en GitHub
- ✅ 50% del proyecto total completado

**¡Bloque 1 de FASE 2 completado! 🚀**

---

*Última actualización: 10 de octubre de 2025 (Sesión 3)*  
*Próxima sesión: Bloque 2 - Controllers y Routes (1h)*  
*Siguiente commit: feat(backend): Implementar controllers y rutas de autenticación*