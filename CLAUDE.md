# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Task Management Platform: An outcome-driven task management system with enterprise-grade robustness and consumer-grade simplicity, designed with South African context in mind (low-data usage, POPIA compliance, SME workflows).

**Tech Stack:**
- Backend: ASP.NET Core Web API (.NET 8) with Clean Architecture
- Frontend: Vue 3 + TypeScript + Vite + Pinia + Vue Router
- Database: Entity Framework Core with InMemoryDatabase (development), PostgreSQL/SQL Server (production)

## Commands

### Backend

```bash
dotnet restore TaskManagementSolution.sln
dotnet build TaskManagementSolution.sln
dotnet run --project Backend/TaskManagementApi/TaskManagementApi.csproj

# Run all tests
dotnet test TaskManagementSolution.sln

# Run a single test class
dotnet test --filter "FullyQualifiedName~TaskServiceTests"

# Add EF Core migration (run from Backend/Infrastructure/)
dotnet ef migrations add <MigrationName> --startup-project ../TaskManagementApi/TaskManagementApi.csproj
```

### Frontend (run from `frontend/` directory)

```bash
npm install
npm run dev          # http://localhost:5173
npm run build
npm run test         # watch mode
npm run test:run     # single run (CI)
npm run test:coverage
```

### Local URLs

- Backend API: `http://localhost:5235` (http) / `https://localhost:7217` (https)
- Swagger UI: `http://localhost:5235/swagger`
- Frontend Dev: `http://localhost:5173`
- Frontend reads `VITE_API_BASE_URL` env var (defaults to `http://localhost:5235/api`)

## Architecture

### Backend: Clean Architecture

Dependency flow: Domain ← Application ← Infrastructure ← API

**Domain** (`Backend/Domain/`)
- Pure business entities, no framework dependencies
- `TaskEntity` fields: `Id`, `Name`, `Description`, `IsCompleted`

**Application** (`Backend/Application/`)
- `IRepository<T>` (in `Application.Repositories`) — generic async CRUD interface
- `ITaskService` / `TaskService` — orchestrates CRUD via `IRepository<TaskEntity>`
- `TaskService` performs field-level updates on the fetched entity before calling `UpdateAsync`

**Infrastructure** (`Backend/Infrastructure/`)
- `AppDbContext` (namespace `Infrastructure.Persistence`) with `DbSet<TaskEntity> Tasks`
- `TaskRepository : IRepository<TaskEntity>` — EF Core implementation

**API** (`Backend/TaskManagementApi/`)
- `TaskController` at `api/task` — thin layer, delegates entirely to `ITaskService`
- `Program.cs` wires DI: `AppDbContext` → `IRepository<TaskEntity>` → `ITaskService`

**Key note:** `IRepository<T>` lives in `Backend/Application/IRepository.cs` (namespace `Application.Repositories`), not in Infrastructure.

### Backend Tests (`Backend/TaskManagement.Tests/`)

Uses xUnit + Moq + FluentAssertions.

- `Services/TaskServiceTests.cs` — unit tests with mocked `IRepository<TaskEntity>`
- `Repositories/TaskRepositoryTests.cs` — integration tests using a fresh `InMemoryDatabase` per test (unique `Guid` DB name via `IDisposable`)

### Frontend

**Path alias:** `@/` maps to `frontend/src/`

**State management:** Pinia store at `@/stores/tasks` (referenced by composables; implements normalized `byId` map + `rootIds` array for O(1) lookup, tree structure with cycle detection, undo/redo, optimistic updates with snapshot rollback)

**Task model** (from `@/types/task`): extends backend fields with `parentId`, `dueDate`, `tags`, `orderIndex`

**Reflection feature** (`src/composables/useReflection.ts`):
- Builds context including SA-specific fields: SAST timezone, load-shedding stage estimate
- Calls `POST /api/ai/reflect` via `reflectionService` (falls back to mock on failure)
- Auto-triggers after ≥5 task completions within 5 minutes
- Components in `src/components/reflection/`

**Frontend Tests** (`src/tests/`): Vitest + `@vue/test-utils` + jsdom, setup in `src/tests/setup.ts`

### Adding New Entities

1. Entity in `Backend/Domain/Entities/`
2. `DbSet<T>` in `AppDbContext`
3. Service interface + implementation in `Backend/Application/`
4. Repository (if needed) in `Backend/Infrastructure/Repositories/`
5. Controller in `Backend/TaskManagementApi/Controllers/`
6. Register in `Program.cs`

## Dependency Rules

- Domain: no references to other layers
- Application: may reference Domain only
- Infrastructure and API: may reference Domain and Application

Violations will break compilation since projects only `<ProjectReference>` their allowed dependencies.

## Context-Specific Priorities

- **POPIA compliance**: handle personal data carefully, design audit trails
- **Low-data usage**: minimize API payload sizes
- **SA SME workflows**: VAT dates, CIPC compliance, ZAR currency, WhatsApp-first intake (future)
- **Load-shedding awareness**: frontend reflection feature includes Eskom Se Push API integration stub

## Notes

- `TaskManagementSolution.sln` is the canonical solution file; `TaskManagementApi.sln` is legacy
- InMemoryDatabase has no persistence between runs
- `Backend/Application/Class1.cs`, `Backend/Domain/Class1.cs`, `Backend/Infrastructure/Class1.cs` are scaffolding remnants and can be removed
