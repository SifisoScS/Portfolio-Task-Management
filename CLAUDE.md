# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Task Management Platform: An outcome-driven task management system with enterprise-grade robustness and consumer-grade simplicity, designed with South African context in mind (low-data usage, POPIA compliance, SME workflows).

**Tech Stack:**
- Backend: ASP.NET Core Web API (.NET) with Clean Architecture
- Frontend: Vue 3 + TypeScript + Vite
- Database: Entity Framework Core with InMemoryDatabase (development), PostgreSQL/SQL Server (production)

## Architecture

### Clean Architecture Layers

The backend follows strict Clean Architecture with dependency flow: Domain ← Application ← Infrastructure ← API

**Domain** (`Backend/Domain/`)
- Pure business entities with no external dependencies
- Contains: `TaskEntity.cs` and future domain models
- No framework dependencies allowed

**Application** (`Backend/Application/`)
- Business logic and service interfaces
- Depends only on Domain layer
- Contains: `ITaskService.cs`, `TaskService.cs`
- Services coordinate workflows and use cases

**Infrastructure** (`Backend/Infrastructure/`)
- EF Core implementations, repositories, external integrations
- Contains: `AppDbContext.cs`, `IRepository.cs`, `Repositories/TaskRepository.cs`
- Implements interfaces defined in Application/Domain

**API** (`Backend/TaskManagementApi/`)
- Web API controllers and DI configuration
- Contains: `Program.cs`, `Controllers/TaskController.cs`
- Composes all layers via dependency injection

### Frontend Structure

**Vue 3 + Composition API**
- `frontend/src/main.ts` - App entry point
- `frontend/src/App.vue` - Root component
- `frontend/src/components/` - Reusable Vue components
- State management: Pinia (when added)
- Routing: Vue Router (when added)
- HTTP client: Axios

## Common Commands

### Backend

**Build and run from solution root:**
```bash
dotnet restore TaskManagementSolution.sln
dotnet build TaskManagementSolution.sln
dotnet run --project Backend/TaskManagementApi/TaskManagementApi.csproj
```

**Run from API project directory:**
```bash
cd Backend/TaskManagementApi
dotnet run
```

**Run tests (when test projects exist):**
```bash
dotnet test TaskManagementSolution.sln
```

**Add EF Core migration:**
```bash
cd Backend/Infrastructure
dotnet ef migrations add <MigrationName> --startup-project ../TaskManagementApi/TaskManagementApi.csproj
dotnet ef database update --startup-project ../TaskManagementApi/TaskManagementApi.csproj
```

### Frontend

**All commands from `frontend/` directory:**
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (default: http://localhost:5173)
npm run build        # Build for production (TypeScript + Vite)
npm run preview      # Preview production build
```

### Local Environment

- Backend API: `https://localhost:5001` (or check appsettings.json)
- Frontend Dev: `http://localhost:5173`
- Swagger UI: `https://localhost:5001/swagger` (development only)

## Development Guidelines

### Layer Boundaries

When modifying or adding features:
1. Start with Domain entities (pure business logic)
2. Add Application services/interfaces (use cases)
3. Implement in Infrastructure (persistence, external services)
4. Wire up in API via controllers and DI

**Never violate dependency rules:**
- Domain MUST NOT reference Application, Infrastructure, or API
- Application MUST NOT reference Infrastructure or API
- Infrastructure and API can reference Domain and Application

### Adding New Entities

1. Create entity in `Backend/Domain/Entities/`
2. Add DbSet to `AppDbContext.cs`
3. Create service interface in `Backend/Application/`
4. Implement service in `Backend/Application/Services/`
5. Create repository if needed in `Backend/Infrastructure/Repositories/`
6. Create controller in `Backend/TaskManagementApi/Controllers/`
7. Register services in `Program.cs`

### Service Registration Pattern

All services are registered in `Backend/TaskManagementApi/Program.cs`:
```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseInMemoryDatabase("TaskDb"));
builder.Services.AddScoped<ITaskService, TaskService>();
```

### Database Strategy

- **Development/Testing**: InMemoryDatabase (current setup)
- **Production**: PostgreSQL or SQL Server (future)
- Connection strings in `appsettings.json` / `appsettings.Development.json`

## Context-Specific Priorities

### South African Context

- **Low-data usage**: Minimize API payload sizes, implement efficient caching
- **POPIA compliance**: Handle personal data with care, implement audit trails
- **SME workflows**: VAT dates, CIPC compliance reminders, ZAR currency support
- **WhatsApp integration**: Design with WhatsApp-first intake in mind

### MVP Focus

Current scope is minimal viable product:
- Basic task CRUD (title, description, completion status)
- Fast list view
- REST API with Swagger documentation
- InMemory database for rapid iteration

Future phases: Kanban views, reminders (Hangfire), real-time updates (SignalR), offline sync (PWA), WhatsApp intake.

## Testing Strategy

- Unit tests: Domain and Application layers (pure logic)
- Integration tests: API controllers with InMemory database
- E2E tests: Frontend (when implemented)

**Run tests from solution root:**
```bash
dotnet test
```

## Notes

- The solution file `TaskManagementSolution.sln` manages all Backend projects
- `TaskManagementApi.sln` is legacy and may be removed
- Currently using InMemoryDatabase - no real persistence between runs
- Swagger is enabled in development for API exploration
