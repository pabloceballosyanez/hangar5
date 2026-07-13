# Hangar 5 — Plan de Desarrollo y Producción

> **Para Hermes:** Implementar este plan paso a paso con el skill `plan`.

**Objetivo:** Establecer una estructura de desarrollo/producción robusta para Hangar 5, con pipeline claro, backups, monitoreo y mínimo costo.

**Arquitectura propuesta:** Desarrollo local en Mac Mini → push a staging (branch `develop`) → merge a `main` → deploy automático a producción (Render). Todo usando la infraestructura existente sin costos adicionales.

---

## Estado actual

| Componente | Detalle |
|---|---|
| **Hosting** | Render free tier (512 MB RAM, 1 GB disco persistente) |
| **CDN** | Cloudflare (gratuito) |
| **DB** | SQLite vía Prisma + better-sqlite3 (`/data/hangar5.db`) |
| **Deploy** | `git push` a `main` → auto-deploy en Render |
| **Cold starts** | Mitigado con cron job cada 10 min |
| **Repo** | `github.com/pabloceballosyanez/hangar5` |
| **Dev local** | Mac Mini M4 24/7, repo clonado en `~/hangar5` |
| **Stack** | Next.js 16, React 19, Tailwind 4, TypeScript, MercadoPago |

### Lo que YA está bien
- Seguridad hardening completo (JWT, rate limiting, headers, PIN hashing)
- Middleware protegiendo rutas admin
- QR ordering con payment-first flow
- Admin panel extenso (restaurant, inventario, staff, reportes)
- Waiter + KDS funcionando

### Lo que FALTA
- **Backups automáticos** de la DB → riesgo de pérdida total de datos
- **Ambiente staging** → cada push a `main` va directo a producción sin testing
- **Tests automatizados** → cero cobertura
- **Monitoreo de salud** → más allá del ping anti cold-start
- **Separación clara dev/prod** → branch `main` = única verdad

---

## Análisis de Riesgos

### 🔴 Riesgos Críticos

| Riesgo | Probabilidad | Impacto | Descripción |
|---|---|---|---|
| **Pérdida total de datos** | Baja | Catastrófico | Render pierde el disco persistente (raro pero posible). Sin backups, se pierde TODO: órdenes, clientes, inventario, menú, recetas. |
| **Deploy roto en prod** | Media | Alto | Sin staging, un bug en `main` rompe la web en vivo. Cold starts de Render hacen que el rollback sea lento (2-3 min). |
| **DB corrupta por migración** | Baja | Alto | Prisma `db push --accept-data-loss` en el start script es peligroso. Si el schema cambia mal, puede corromper datos. |

### 🟡 Riesgos Moderados

| Riesgo | Descripción |
|---|---|
| **Render downtime** | Free tier no tiene SLA. Si Render se cae, el sitio no está disponible. |
| **Cold start en hora pico** | Si un cliente llega justo durante un cold start, espera 5-10 segundos. |
| **Sin rollback fácil** | No hay snapshots de DB. Si algo sale mal, volver atrás es manual. |
| **MercadoPago en test mode** | Si `MP_ACCESS_TOKEN` no está configurado, los pagos no son reales. ¿Está en producción real o test? |

### 🟢 Riesgos Bajos

| Riesgo | Descripción |
|---|---|
| **Límite de 1 GB disco** | Con SQLite + imágenes, podría llenarse en meses/años. |
| **Cloudflare cache** | Podría servir páginas viejas después de un deploy. |

---

## Análisis de Costos

### Opción A: Seguir en Render Free (recomendado)

| Concepto | Costo mensual |
|---|---|
| Render free tier | $0 |
| Cloudflare CDN | $0 |
| GitHub | $0 |
| Mac Mini (electricidad) | ~$5-10 |
| **Total** | **~$5-10/mes** |

**Limitaciones:** cold starts, 512 MB RAM, sin SLA, 1 GB disco.

### Opción B: Render Starter ($7/mes)

| Concepto | Costo mensual |
|---|---|
| Render Starter | $7 |
| Sin cold starts | Incluido |
| **Total** | **~$12-17/mes** |

**Beneficio:** Cero cold starts, más RAM (1 GB), builds más rápidos. El upgrade es inmediato y mantiene todo igual.

### Opción C: Migrar a VPS (DigitalOcean/Hetzner)

| Concepto | Costo mensual |
|---|---|
| VPS 2 GB RAM | $6-12 |
| Admin time | Alto (configurar nginx, SSL, deploy, backups) |
| **Total** | **~$12-20/mes + tiempo** |

**No recomendado:** Demasiada administración manual para el beneficio.

### Recomendación

**Quedarse en Render free** con la Mac Mini como staging local. Si los cold starts se vuelven un problema real (quejas de clientes), hacer upgrade a Render Starter ($7/mes). El salto es trivial.

---

## Plan de Ejecución — 4 Fases

### Fase 1: Backups automáticos (🛡️ crítico — hacer YA)

Esto es lo más urgente. Sin backups, estás a un error de perder todo.

#### 1.1 Script de backup de DB

```bash
# Crear scripts/backup-db.sh en el repo
```

- Descargar `/data/hangar5.db` desde Render vía `render ssh` o endpoint
- Guardar con timestamp en `~/hangar5-backups/`
- Rotación: mantener últimos 30 días, 1 por semana los domingos
- Subir copia cifrada a iCloud/Google Drive (opcional)

#### 1.2 Cron job de backup

- Hermes cron job diario (ej. 3 AM) que ejecute el script
- Notificación a Telegram si falla

#### 1.3 Endpoint de backup manual

- `GET /api/admin/backup` (protegido con JWT admin)
- Descarga la DB completa como archivo binario
- Útil para backup manual antes de cambios grandes

### Fase 2: Ambiente de desarrollo local

La Mac Mini ya está 24/7 — usémosla.

#### 2.1 Configurar `.env.local`

Crear archivo separado para desarrollo local con su propia DB:

```bash
# ~/hangar5/.env.local
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_URL="http://localhost:3000"
MP_ACCESS_TOKEN="TEST-..." # sandbox de MercadoPago
```

#### 2.2 Seed data de desarrollo

Crear `scripts/seed-dev.ts` con datos de prueba (menú, mesas, staff, clientes fake).

#### 2.3 Script de arranque local

```bash
# scripts/dev.sh
npm run dev
# Corre en localhost:3000 con DB separada
```

#### 2.4 Branch `develop`

```bash
git checkout -b develop
git push origin develop
```

- `main` → producción (Render)
- `develop` → desarrollo (local)
- Feature branches → `feature/nombre` → merge a `develop` → testear local → merge a `main`

### Fase 3: Monitoreo y salud

#### 3.1 Health check mejorado

Ampliar el cron job existente (solo ping) para que verifique:
- Respuesta HTTP 200
- Tiempo de respuesta < 5s
- DB accesible (endpoint `/api/setup` que chequea prisma)

#### 3.2 Alerta de error

Crear endpoint público `/api/health` que devuelva:
```json
{
  "status": "ok",
  "db": "connected",
  "uptime": 12345,
  "lastDeploy": "2026-07-11T..."
}
```

#### 3.3 Log de errores en DB

Tabla `ErrorLog` en Prisma schema:
```prisma
model ErrorLog {
  id        String   @id @default(uuid())
  message   String
  stack     String?
  route     String?
  createdAt DateTime @default(now())
}
```

Capturar errores 500 y guardarlos para debugging remoto.

### Fase 4: Testing (mejora continua)

#### 4.1 Tests de API críticos

- `POST /api/admin/login` — auth correcto e incorrecto
- `POST /api/restaurant/orders` — creación de orden
- `GET /api/menu` — menú público
- Webhook de MercadoPago

#### 4.2 Tests de seguridad

- Sin cookie → 401 en rutas admin
- Rate limiting → 429 después de 5 intentos
- Headers de seguridad presentes

#### 4.3 Framework

Vitest (ya compatible con Next.js 16, más rápido que Jest).

---

## Flujo de trabajo diario

```
           feature/xyz
               │
               ▼
    ┌── develop (local test) ──┐
    │                          │
    ▼                          ▼
  tests pass               git push
    │                          │
    ▼                          ▼
  merge a main            Render auto-deploy
                              │
                              ▼
                         hangar5.onrender.com
```

**Reglas:**
1. Nunca pushear directo a `main` sin testear en local primero
2. Antes de merge a `main`: backup manual de DB (`/api/admin/backup`)
3. Si algo falla en prod: revertir el commit, push a `main`, esperar deploy
4. Feature branches se mergean a `develop`, NO a `main`

---

## Archivos a crear/modificar

| Archivo | Acción | Fase |
|---|---|---|
| `scripts/backup-db.sh` | Crear | 1 |
| `scripts/seed-dev.ts` | Crear | 2 |
| `scripts/dev.sh` | Crear | 2 |
| `.env.local` | Crear | 2 |
| `prisma/schema.prisma` | Modificar (agregar ErrorLog) | 3 |
| `src/app/api/health/route.ts` | Crear | 3 |
| `src/app/api/admin/backup/route.ts` | Modificar (ya existe?) | 1 |
| `src/lib/error-logger.ts` | Crear | 3 |
| `src/middleware.ts` | Verificar | 3 |
| `vitest.config.ts` | Crear | 4 |
| `tests/` | Crear directorio | 4 |

---

## Preguntas abiertas para Pablo

1. **¿MercadoPago está en producción real o en sandbox?** Si el token es de test, los pagos no son reales. Si es producción, hay que asegurarlo bien.

2. **¿Cuánto tráfico real tiene la web?** ¿Clientes reales pidiendo del QR? Esto define si cold starts son un problema real.

3. **¿Hay backups actualmente?** Aunque sea manual. Si no, la Fase 1 es prioridad absoluta.

4. **¿Querés upgrade a Render Starter ($7/mes)?** Elimina cold starts. Si el tráfico lo justifica, es una decisión de 2 clicks.

5. **¿Qué features planeás desarrollar próximamente?** Para priorizar qué partes del plan van primero.

---

## Resumen

| Fase | Qué | Prioridad | Tiempo estimado |
|---|---|---|---|
| 1 | Backups automáticos | 🔴 Crítico | 1-2 horas |
| 2 | Ambiente dev local + branches | 🟡 Importante | 2-3 horas |
| 3 | Monitoreo y salud | 🟡 Importante | 1-2 horas |
| 4 | Testing automatizado | 🟢 Mejora | 3-4 horas |

**Costo total del plan: $0 adicionales.**

**Inversión de tiempo total: ~10 horas de desarrollo.**
