# Project Log - "The Core" CRM

Este documento registra el progreso diario y el estado actual del proyecto para facilitar la continuidad.

---

## 📅 Estado al 26 de Mayo, 2026

### 🏗️ Arquitectura Actual del Proyecto
El proyecto está dividido en **dos repositorios separados**:

| Repo | GitHub | Local | Estado |
|------|--------|-------|--------|
| **Frontend** (`/The Core`) | `Nelocode/the-core-crm` | `main` | ✅ Sincronizado |
| **Backend** (`/The Core/core-server`) | `Nelocode/the-core-server` | `main` | ✅ Actualizado (se hizo `git pull` hoy) |

> ⚠️ **Nota**: `core-server` estaba 3 commits atrás del remoto. Se sincronizó hoy con `git pull`.

### ✅ Features Completas (v1.5.x)
- **Frontend** (React 19 + Vite 5 + Tailwind v4):
  - Dashboard con "AI Briefing" de rompehielos.
  - Gestión completa de contactos (CRUD) con modelo relacional Irwin-style.
  - Búsqueda global `CMD+K` con filtros inteligentes (`company:`, `role:`, `score>`).
  - Registro de interacciones (meeting, call, email, linkedin, event, note).
  - Internacionalización EN/ES completa con persistencia en localStorage.
  - Mobile-first con bottom navigation bar.
  - `ContactAvatar` con fallback a iniciales.
  - Escaneo de tarjetas de negocios (OCR) vía card scan.
  - Transcripción de audio para captura de notas en campo.
- **Backend** (`core-server` — Express + Prisma + SQLite):
  - 8 modelos relacionales: Organization, Contact, Interaction, Tag, ContactTag, Meeting, MeetingAttendee, Note.
  - APIs REST: `/api/contacts`, `/api/interactions`, `/api/investigate`, `/api/scan-card`, `/api/transcribe`.
  - Integración con OpenAI (OCR con GPT-4o-vision, investigación con Tavily).
  - Soporte de transcripción bilingüe (ES/EN) con filtro anti-alucinaciones de Whisper.
  - Dockerizado para Easypanel.
- **Infraestructura**:
  - Backend en producción: `automatizaciones-the-core-engine.vz27dz.easypanel.host`
  - Frontend con `Dockerfile` + `nginx.conf` listo para desplegar.

### 🔧 Stack Técnico Actual
- **Frontend**: React 19 + Vite 5 + TypeScript + Tailwind v4 + Framer Motion + Lucide React + date-fns
- **Backend**: Node.js + Express + Prisma ORM + SQLite + OpenAI SDK + Tavily
- **Deploy**: Docker + Nginx + Easypanel
- **Node local**: v24.15.0 para el frontend, v20.12.2 para el backend.
- **Persistencia de Datos Local**: ✅ Completada. El backend conecta correctamente con SQLite local (`core-server/prisma/dev.db`) y el frontend se comunica con `http://localhost:3001`.

### 🚀 Próximos Pasos (Pendientes)
- [ ] **Google Workspace Integration**: OAuth2 → Google Calendar y People API para reuniones reales.
- [ ] **Vista de Calendario**: Conectar reuniones reales desde Google Calendar.
- [ ] **Vista de Historial**: Timeline global de todas las interacciones.
- [ ] **Despliegue del Frontend**: Subir la imagen Docker del frontend a Easypanel.
- [ ] **Mejora del Motor IA**: Usar icebreakers dinámicos del backend (actualmente son mocks) para todos los contactos.

### ⚠️ Notas Importantes
- **Para correr localmente**:
  - El backend corre en el puerto `3001` (`export PATH=/Users/i2carvajal/.node/bin:$PATH && npm run dev` en `core-server`).
  - El frontend corre en el puerto `5173` (`npm run dev` en el root).
- **Base de datos local**: Inicializada y con persistencia confirmada (CRUD de contactos funcionando localmente).
- **OPENAI_API_KEY** en `core-server/.env` está como placeholder — necesita clave real para investigate/OCR.

---
*Última actualización: 26 de Mayo, 2026. Persistencia de datos y errores de Prisma solucionados localmente.*
