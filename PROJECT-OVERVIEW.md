# Task Management Platform - Project Overview

**Last Updated:** 2026-02-23
**Status:** Infrastructure Complete, Frontend UI Not Implemented

---

## Project Vision

An outcome-driven task management platform built with enterprise-grade robustness and consumer-grade simplicity, designed with South African context in mind (POPIA compliance, low-data usage, SME workflows, WhatsApp integration).

---

## Technology Stack

### Backend
- **Framework:** ASP.NET Core 8.0 Web API
- **Architecture:** Clean Architecture (Domain → Application → Infrastructure → API)
- **Database:** Entity Framework Core with InMemory provider (dev), PostgreSQL/SQL Server (prod)
- **Language:** C# with nullable reference types enabled
- **API Documentation:** Swagger/OpenAPI

### Frontend
- **Framework:** Vue 3 (Composition API)
- **Build Tool:** Vite 7.3.0
- **Language:** TypeScript 5.9.3
- **State Management:** Pinia 2.3.1 (installed but not implemented)
- **HTTP Client:** Axios 1.13.2 (installed but not used yet)
- **Router:** Vue Router 4.6.4 (installed but not configured)

---

## Current Project Structure

```
Portfolio-Task-Management/
├── Backend/
│   ├── Domain/                          # Pure business entities
│   │   ├── Domain.csproj               # Target: net8.0
│   │   ├── TaskEntity.cs               # ✅ Implemented (Id, Name, Description, IsCompleted)
│   │   └── Class1.cs                   # 🗑️ Placeholder, can be deleted
│   │
│   ├── Application/                     # Business logic and interfaces
│   │   ├── Application.csproj          # Depends on: Domain
│   │   ├── IRepository.cs              # ✅ Generic repository interface
│   │   ├── ITaskService.cs             # ✅ Task service interface (async methods)
│   │   ├── TaskService.cs              # ✅ Implemented with repository pattern
│   │   └── Class1.cs                   # 🗑️ Placeholder, can be deleted
│   │
│   ├── Infrastructure/                  # Data access and external integrations
│   │   ├── Infrastructure.csproj       # Depends on: Domain, Application
│   │   ├── AppDbContext.cs             # ✅ EF Core DbContext (Tasks DbSet)
│   │   ├── Repositories/
│   │   │   └── TaskRepository.cs       # ✅ Implements IRepository<TaskEntity>
│   │   └── Class1.cs                   # 🗑️ Placeholder, can be deleted
│   │
│   └── TaskManagementApi/               # Web API entry point
│       ├── TaskManagementApi.csproj    # Depends on: Application, Infrastructure
│       ├── Program.cs                  # ✅ DI configuration, middleware setup
│       ├── Controllers/
│       │   └── TaskController.cs       # ✅ REST endpoints (GET, POST, PUT, DELETE)
│       ├── appsettings.json            # API configuration
│       └── Properties/
│           └── launchSettings.json     # Launch profiles
│
├── frontend/                            # Vue 3 + TypeScript
│   ├── package.json                    # ✅ Dependencies installed
│   ├── vite.config.ts                  # Vite configuration
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── src/
│   │   ├── main.ts                     # ✅ Vue app entry point
│   │   ├── App.vue                     # ❌ Default Vite template (not customized)
│   │   ├── components/
│   │   │   └── HelloWorld.vue          # ❌ Default component (to be replaced)
│   │   ├── assets/                     # Static assets
│   │   └── style.css                   # Global styles
│   └── public/                          # Public assets
│
├── TaskManagementSolution.sln           # Main solution file (all Backend projects)
├── TaskManagementApi.sln                # Legacy solution file (can be removed)
├── README.md                            # Project documentation
├── CLAUDE.md                            # ✅ AI assistant guidance file
└── .gitignore                           # Git ignore rules

```

---

## Implementation Status

### ✅ COMPLETED

#### Backend (100% MVP Ready)
- [x] Clean Architecture structure (Domain, Application, Infrastructure, API)
- [x] TaskEntity domain model (Id, Name, Description, IsCompleted)
- [x] Generic repository pattern (IRepository in Application layer)
- [x] TaskRepository implementation (EF Core)
- [x] TaskService with full CRUD operations (async/await)
- [x] REST API endpoints:
  - `GET /api/task` - Get all tasks
  - `POST /api/task` - Create task
  - `PUT /api/task/{id}` - Update task
  - `DELETE /api/task/{id}` - Delete task
- [x] Dependency injection configuration
- [x] Swagger/OpenAPI documentation
- [x] InMemory database for development
- [x] All projects target .NET 8.0
- [x] Nullable reference types enabled
- [x] Clean architecture dependency flow enforced

#### Infrastructure
- [x] Solution files configured
- [x] NuGet packages installed (EF Core 8.0, Swagger 6.5.0)
- [x] Frontend dependencies installed (Vue 3, Vite, Pinia, Axios, Vue Router)

### ❌ NOT IMPLEMENTED

#### Frontend (0% - Still Default Vite Template)
- [ ] Task list view component
- [ ] Task creation form
- [ ] Task editing functionality
- [ ] Task deletion with confirmation
- [ ] Task completion toggle
- [ ] Pinia store setup
- [ ] API integration (Axios services)
- [ ] Vue Router configuration
- [ ] TypeScript interfaces for Task model
- [ ] Error handling and notifications
- [ ] Filtering and sorting
- [ ] Keyboard shortcuts
- [ ] UI styling (TailwindCSS or Vuetify not added)
- [ ] Responsive design
- [ ] Accessibility features

#### Backend Future Features (Post-MVP)
- [ ] Due date field on TaskEntity
- [ ] Background jobs (Hangfire/Quartz) for reminders
- [ ] SignalR for real-time updates
- [ ] Authentication/Authorization (ASP.NET Identity)
- [ ] PostgreSQL/SQL Server configuration
- [ ] Unit tests
- [ ] Integration tests

---

## Architecture Details

### Clean Architecture Layers

**Dependency Flow:** Domain ← Application ← Infrastructure ← API

1. **Domain** (`Backend/Domain/`)
   - Pure business entities
   - No external dependencies
   - Contains: `TaskEntity`

2. **Application** (`Backend/Application/`)
   - Business logic and use cases
   - Depends only on Domain
   - Contains: `ITaskService`, `TaskService`, `IRepository`
   - Uses repository abstraction (dependency inversion)

3. **Infrastructure** (`Backend/Infrastructure/`)
   - EF Core implementations
   - Depends on: Domain, Application
   - Contains: `AppDbContext`, `TaskRepository`
   - Implements interfaces from Application layer

4. **API** (`Backend/TaskManagementApi/`)
   - Web API controllers
   - Depends on: Application, Infrastructure
   - Contains: `TaskController`, DI configuration
   - Composes all layers

### Current API Endpoints

Base URL: `http://localhost:5235/api/task`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/task` | Get all tasks | - | `TaskEntity[]` |
| POST | `/api/task` | Create task | `TaskEntity` | `TaskEntity` (201 Created) |
| PUT | `/api/task/{id}` | Update task | `TaskEntity` | `TaskEntity` (200 OK) or 404 |
| DELETE | `/api/task/{id}` | Delete task | - | 204 No Content |

**TaskEntity Model:**
```json
{
  "id": 0,
  "name": "string",
  "description": "string",
  "isCompleted": false
}
```

---

## How to Run Locally

### Prerequisites
- .NET SDK 8.0.418 (installed)
- Node.js LTS with npm (installed)

### Backend
```bash
cd Backend/TaskManagementApi
dotnet run
# API available at: http://localhost:5235
# Swagger UI: http://localhost:5235/swagger
```

### Frontend
```bash
cd frontend
npm run dev
# Dev server at: http://localhost:5173
```

---

## Next Steps - Frontend Implementation Tasks

### Phase 1: Foundation (Tasks #11, #4, #3)
1. **TypeScript Interfaces** - Create Task model and API types
2. **API Integration** - Set up Axios services for backend communication
3. **Pinia Store** - Configure state management for tasks

### Phase 2: Core UI (Tasks #1, #2, #5)
4. **Task List View** - Display tasks with loading/empty states
5. **Task Input Form** - Quick-add form with keyboard shortcuts
6. **Completion Toggle** - Mark tasks as done/undone

### Phase 3: Full CRUD (Tasks #7, #6, #12)
7. **Task Editing** - Inline or modal editing
8. **Task Deletion** - Delete with confirmation dialog
9. **Error Handling** - Toast notifications, retry logic

### Phase 4: Polish (Tasks #10, #8, #9)
10. **UI Styling** - Apply TailwindCSS or Vuetify
11. **Filtering/Sorting** - Filter by status, sort by date/name
12. **Keyboard Shortcuts** - Power user features (n, /, arrows, etc.)

---

## Key Design Decisions Made

1. **Clean Architecture** - Strict layer separation for maintainability
2. **Repository Pattern** - Abstract data access in Application layer
3. **Async/Await** - All service and controller methods are async
4. **InMemory Database** - Fast iteration during MVP development
5. **TypeScript** - Type safety on frontend
6. **Composition API** - Modern Vue 3 approach

---

## Known Issues / Tech Debt

1. `Class1.cs` placeholder files in Domain, Application, Infrastructure (can be deleted)
2. `TaskManagementApi.sln` is redundant (use `TaskManagementSolution.sln`)
3. No validation attributes on `TaskEntity` (e.g., `[Required]` for Name)
4. No API versioning implemented
5. CORS not explicitly configured (may need for production)
6. No logging/telemetry infrastructure yet
7. Frontend is still the default Vite template

---

## MVP Scope (from README)

- [x] Task capture (title, description) - **Backend ready**
- [ ] Fast list view with filters - **Frontend pending**
- [ ] Keyboard shortcuts - **Frontend pending**
- [ ] Due date field - **Not implemented**
- [ ] Reminder background jobs - **Post-MVP**
- [ ] Basic offline cache - **Post-MVP**

---

## South African Context Features (Future)

- POPIA compliance (data protection)
- Low-data mode (minimal API payloads)
- WhatsApp intake integration
- ZAR pricing tiers
- VAT and CIPC reminder workflows
- SME-focused accountability features

---

## Questions for Implementation

1. **UI Framework:** TailwindCSS (utility-first) or Vuetify (component library)?
2. **Task Editing:** Inline editing or modal dialog?
3. **Filtering:** Tabs, dropdown, or sidebar?
4. **Due Dates:** Add to TaskEntity now or in Phase 2?
5. **Routing:** Single page app or multi-route (tasks, settings, etc.)?

---

## File Cleanup Recommendations

Before starting frontend work:
- Delete `Backend/Domain/Class1.cs`
- Delete `Backend/Application/Class1.cs`
- Delete `Backend/Infrastructure/Class1.cs`
- Delete `frontend/src/components/HelloWorld.vue` (or repurpose)
- Consider removing `TaskManagementApi.sln`

---

## Current Task List (12 Tasks Created)

1. ⏳ Design and implement task list view component
2. ⏳ Create task input/capture form
3. ⏳ Implement Pinia store for task state management
4. ⏳ Connect frontend to backend API
5. ⏳ Add task completion toggle functionality
6. ⏳ Implement task deletion with confirmation
7. ⏳ Add task editing/update functionality
8. ⏳ Add basic filtering and sorting
9. ⏳ Implement keyboard shortcuts
10. ⏳ Style UI with TailwindCSS or component library
11. ⏳ Add TypeScript interfaces and types
12. ⏳ Implement error handling and user feedback

---

**Ready for frontend implementation. Backend is production-ready for MVP scope.**
