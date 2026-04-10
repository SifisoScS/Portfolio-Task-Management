# TaskFlow — Outcome-Driven Task Management

An enterprise-grade task management platform built with South African context in mind: low-data usage, POPIA compliance, and SME workflows.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | ASP.NET Core Web API (.NET 8) — Clean Architecture |
| Frontend | Vue 3 + TypeScript + Vite + Pinia + Vue Router |
| Database | EF Core InMemoryDatabase (dev) · PostgreSQL / SQL Server (prod) |
| Testing | xUnit + Moq + FluentAssertions (backend) · Vitest + vue/test-utils (frontend) |
| AI | Claude API (`claude-sonnet-4-6`) — reflection & task optimisation |

---

## Features

- **Hierarchical tasks** — unlimited nesting with parent/child relationships and cycle detection
- **OKR layer** — Goals → Objectives → Key Results linked to tasks
- **AI Reflection** — analyses your task tree and suggests optimisations (auto-triggers after 5 completions in 5 min)
- **Executive Dashboard** — goal completion rates, overdue counts, compliance panel
- **Manager Dashboard** — project progress board, blocked tasks, 7-day deadline timeline
- **Dark / Light theme** — system preference detection, persisted to localStorage
- **Undo / Redo** — full history with snapshot rollback
- **Optimistic updates** — UI updates instantly, rolls back on API failure
- **Search & filter** — real-time search across name and description
- **Performance** — `shallowRef` store handles 10 000+ tasks efficiently (26× faster than deep-reactive)

---

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/SifisoScS/Portfolio-Task-Management.git
cd Portfolio-Task-Management

# Install root tooling
npm install

# Start backend + frontend together
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5235 |
| Swagger UI | http://localhost:5235/swagger |

> Vite increments the port if 5173 is in use — check the terminal output for the actual URL.

---

## Running Tests

```bash
# Backend — unit + integration (38 tests)
dotnet test TaskManagementSolution.sln

# Frontend — watch mode
cd frontend && npm run test

# Frontend — single run (CI)
cd frontend && npm run test:run
```

---

## Project Structure

```
Portfolio-Task-Management/
├── Backend/
│   ├── Domain/                    # Pure entities, no framework dependencies
│   ├── Application/               # IRepository<T>, ITaskService, IGoalService
│   ├── Infrastructure/            # EF Core, AppDbContext, repositories
│   ├── TaskManagementApi/         # Controllers, Program.cs, DI wiring
│   └── TaskManagement.Tests/      # xUnit unit + integration tests
├── frontend/
│   └── src/
│       ├── components/            # TaskItem, TaskForm, ReflectionModal
│       ├── composables/           # useReflection, useTheme
│       ├── services/              # taskService, goalService (Axios)
│       ├── stores/                # tasks (Pinia), goals (Pinia)
│       ├── types/                 # Task, Goal, Objective interfaces
│       └── views/                 # TaskView, ExecutiveDashboard, ManagerDashboard
├── package.json                   # Root — concurrently dev script
└── TaskManagementSolution.sln
```

---

## Architecture

### Backend — Clean Architecture

```
Domain  ←  Application  ←  Infrastructure  ←  API
```

- **Domain** — pure entities (`TaskEntity`, `GoalEntity`, `ObjectiveEntity`), no external dependencies
- **Application** — generic `IRepository<T>`, `ITaskService`, `IGoalService` interfaces
- **Infrastructure** — EF Core implementations, `AppDbContext` with value converters for `List<string>`
- **API** — thin controllers delegating entirely to services, CORS + DI wired in `Program.cs`

### Frontend — Store Design

The Pinia tasks store uses `shallowRef` for `byId` and `childrenMap` to avoid Vue proxy overhead on large trees. All lookups are O(1) via normalised maps. Undo/redo snapshots use shallow cloning for performance.

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/api/task` | List all tasks |
| POST | `/api/task` | Create task |
| PUT | `/api/task/{id}` | Update task |
| DELETE | `/api/task/{id}` | Delete task |
| GET | `/api/goal` | List all goals |
| POST | `/api/goal` | Create goal |
| GET | `/api/goal/{id}/objectives` | List objectives for a goal |
| POST | `/api/goal/{id}/objectives` | Add objective to a goal |

Full interactive docs available at `/swagger`.

---

## Roadmap

- [ ] JWT authentication — per-user task isolation
- [ ] PostgreSQL — persistent storage for production
- [ ] `/api/ai/reflect` — live Claude API integration
- [ ] Drag-and-drop task reordering
- [ ] Load-shedding awareness — Eskom Se Push API integration
- [ ] POPIA audit trail — tamper-evident edit log
- [ ] WhatsApp task intake — Twilio API for SA SME workflows
- [ ] Due date browser notifications
- [ ] Keyboard shortcuts (`N` new · `E` edit · `/` search)

---

## SA Context

This platform is designed with South African business realities in mind:

- **Low-data usage** — minimal API payloads, optimistic UI reduces round-trips
- **POPIA compliance** — audit trail design, careful personal data handling
- **Load-shedding awareness** — AI reflection includes Eskom stage context
- **SME workflows** — VAT dates, CIPC compliance, ZAR currency (planned)
- **WhatsApp-first** — task intake via WhatsApp planned for future phase

---

## License

MIT
