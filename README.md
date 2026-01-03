# Task Management Platform

An outcome-driven task management platform built with **enterprise-grade robustness** and **consumer-grade simplicity**, grounded in South African realities such as low-data usage, POPIA compliance, and SME workflows.

---

## Vision

Help people capture, prioritize, and complete what matters — fast, reliably, and without friction.

### Guiding principles

- **Outcome-driven**  
  Focus on completion, not complexity.

- **Inclusive by design**  
  Reliable in low-bandwidth environments and compliant with POPIA.

- **Composable architecture**  
  Clear layers, replaceable parts, minimal coupling.

- **Automatable workflows**  
  Scriptable, testable, CI-ready by default.

- **Local context**  
  WhatsApp-first thinking, ZAR pricing, SME and township realities.

---

## Architecture

### Backend — C# / .NET

- **ASP.NET Core Web API**  
  REST endpoints, future-ready for GraphQL.

- **Entity Framework Core**  
  PostgreSQL or SQL Server; InMemory provider for development and tests.

- **Background processing**  
  Hangfire or Quartz for reminders and recurring jobs.

- **Authentication & Authorization**  
  ASP.NET Identity or IdentityServer.

- **Real-time updates**  
  SignalR for collaboration and live state changes.

---

### Frontend — Vue.js

- **Vue 3 + Vite**  
  Composition API with fast developer feedback.

- **Styling**  
  TailwindCSS or Vuetify for accessible, responsive UI.

- **State management**  
  Pinia for predictable, typed stores.

- **Offline-first**  
  PWA caching and IndexedDB sync for unreliable connectivity.

---

## Core Features

1. **Universal task capture**
   - Quick add via keyboard, voice, or WhatsApp intake.
   - Smart parsing:  
     `Call Sipho tomorrow at 10` → task + reminder.

2. **Adaptive views**
   - List, Kanban, calendar, timeline.
   - AI-assisted prioritization based on user patterns.

3. **Collaboration**
   - Shared projects with role-based permissions.
   - Real-time updates via SignalR.

4. **Workflow automation**
   - Rules engine (e.g. tag `invoice` → remind in 7 days).
   - Integrations: email, Slack, Teams, WhatsApp.

5. **Offline & low-data mode**
   - PWA with selective sync and conflict resolution.

6. **Local context**
   - POPIA compliance.
   - ZAR-based tiers.
   - VAT and CIPC reminder workflows.

---

## Differentiators

- **AI-assisted focus**  
  Gentle nudges like “who to follow up with today.”

- **Universal inbox**  
  WhatsApp, email, and voice notes flow into one dashboard.

- **SME accountability**  
  Auditable changes, transparent workflows, compliance-friendly design.

---

## Example Tech Flow

```bash
WhatsApp
→ Intake Service
→ Task created (EF Core)
→ Vue UI updates (Kanban/List)
→ Reminder scheduled (Hangfire)
→ PWA syncs when back online

```bash
## Project Structure

```

Portfolio-Task-Management/
Backend/
Domain/
Application/
Infrastructure/
TaskManagementApi/
Frontend/
(Vue 3 + Vite + TypeScript)
TaskManagementSolution.sln
README.md

````bash
## Scripts

- **Backend reset & scaffold**  
  Creates clean Domain / Application / Infrastructure / API projects.

- **Backend file generation**  
  Task entity, DbContext, repository, service, controller, DI wiring.

- **Frontend setup**  
  Vue + TypeScript scaffold with router, Pinia, Axios.

**Recommended run order**

1. Backend reset  
2. Backend files setup  
3. Frontend scaffold  
4. Build and test

---

## Getting Started

### Prerequisites

- .NET SDK (LTS or version pinned via `global.json`)
- Node.js (LTS) and npm
- PostgreSQL or SQL Server (optional for MVP)

---

### Setup

#### Backend

```bash
dotnet restore
dotnet build
dotnet run
````

Run from `Backend/TaskManagementApi`.

### Frontend

```bash
npm install
npm run dev
```

Run from `Frontend/`.

---

### Local Environment

- API: `https://localhost:5001`
- Frontend: `http://localhost:5173`

---

## MVP Scope

- Task capture (title, description, due date)
- Fast list view with filters and keyboard shortcuts
- Reminder background jobs
- Basic offline cache with resync

Ship this first. Then iterate.

---

## Roadmap

### Growth Phase

- Kanban and calendar views
- Role-based collaboration
- WhatsApp intake via webhooks
- Completion analytics

### Scale Phase

- AI prioritization
- Rules engine templates
- Multi-tenant billing (ZAR)
- Full offline sync with conflict resolution

---

## Quality & Operations

 **Testing**
  Unit (Domain/Application), integration (API), e2e (frontend)

 **Observability**
  Structured logging, metrics, tracing

 **Security**
  POPIA-aligned data handling, role/claim checks, secrets management

 **CI/CD**
  Build and test on every commit
  Environments: dev → staging → production

 **Documentation**
  Scripts are reproducible; this README is the source of truth

---

## Contributing

 Keep layers clean:

- Domain has no external dependencies
  
- Application depends only on Domain
- Infrastructure provides implementations
- API composes everything

- Prefer scripts over manual setup.

- Write small, testable units.

- Document assumptions in code comments.

---

## License

TBD.
A permissive license is recommended, with explicit data-protection commitments for SMEs.
