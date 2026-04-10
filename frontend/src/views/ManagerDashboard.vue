<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import { taskService } from '@/services/taskService'
import type { Task } from '@/types/task'

const store = useTaskStore()
const loading = ref(false)
const error = ref<string | null>(null)

const now = new Date()
const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

const projects = computed(() =>
  store.rootIds
    .map(id => store.getTaskById(id))
    .filter((t): t is Task => t != null)
    .map(t => ({
      task: t,
      completion: store.getCompletionPercentage(t.id),
      childCount: store.getChildren(t.id).length
    }))
    .sort((a, b) => a.completion - b.completion) // blocked/low-progress first
)

const blockedTasks = computed(() =>
  store.allTasks.filter(t => {
    if (!t.parentId || t.isCompleted) return false
    const parent = store.getTaskById(t.parentId)
    return parent && !parent.isCompleted
  }).slice(0, 20)
)

const upcomingTasks = computed(() => {
  const tasks = store.allTasks.filter(t =>
    !t.isCompleted &&
    t.dueDate &&
    new Date(t.dueDate) >= now &&
    new Date(t.dueDate) <= weekFromNow
  )
  return tasks.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
})

const stats = computed(() => ({
  projects: projects.value.length,
  blocked: blockedTasks.value.length,
  dueThisWeek: upcomingTasks.value.length
}))

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const diff = Math.floor((d.getTime() - now.setHours(0,0,0,0)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Group upcoming by day label
const upcomingByDay = computed(() => {
  const groups: { label: string; tasks: Task[] }[] = []
  for (const task of upcomingTasks.value) {
    const label = dayLabel(task.dueDate!)
    const existing = groups.find(g => g.label === label)
    if (existing) existing.tasks.push(task)
    else groups.push({ label, tasks: [task] })
  }
  return groups
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const tasks = await taskService.getAll()
    store.loadTasks(tasks)
  } catch {
    error.value = 'Could not reach backend — working offline.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mgr-view">
    <div class="page-header">
      <div>
        <h1>Manager Dashboard</h1>
        <p class="subtitle">Project status, blockers, and upcoming deadlines</p>
      </div>
    </div>

    <div v-if="error" class="error-banner">
      <i class="pi pi-exclamation-triangle" /> {{ error }}
    </div>

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner" /> Loading…
    </div>

    <template v-else>
      <!-- Stats bar -->
      <div class="stats-bar">
        <div class="stat-chip">
          <span class="chip-value">{{ stats.projects }}</span>
          <span class="chip-label">Projects</span>
        </div>
        <div class="stat-chip" :class="{ warn: stats.blocked > 0 }">
          <span class="chip-value">{{ stats.blocked }}</span>
          <span class="chip-label">Blocked</span>
        </div>
        <div class="stat-chip">
          <span class="chip-value">{{ stats.dueThisWeek }}</span>
          <span class="chip-label">Due This Week</span>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Projects board -->
        <section class="panel">
          <h2 class="panel-title">Projects</h2>
          <div v-if="projects.length" class="project-list">
            <div v-for="{ task, completion, childCount } in projects" :key="task.id" class="project-row">
              <div class="project-info">
                <span class="project-name" :class="{ done: task.isCompleted }">{{ task.name }}</span>
                <span class="project-meta">{{ childCount }} subtasks</span>
              </div>
              <div class="project-progress">
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    :class="{
                      'fill-success': completion === 1,
                      'fill-warn': completion > 0 && completion < 0.5
                    }"
                    :style="{ width: `${completion * 100}%` }"
                  />
                </div>
                <span class="progress-pct">{{ Math.round(completion * 100) }}%</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-panel">No projects yet.</div>
        </section>

        <!-- Blocked tasks -->
        <section class="panel">
          <h2 class="panel-title">
            Blocked Tasks
            <span v-if="blockedTasks.length" class="panel-badge danger">{{ blockedTasks.length }}</span>
          </h2>
          <div v-if="blockedTasks.length" class="blocked-list">
            <div v-for="task in blockedTasks" :key="task.id" class="blocked-row">
              <i class="pi pi-lock blocked-icon" />
              <div class="blocked-info">
                <span class="blocked-name">{{ task.name }}</span>
                <span class="blocked-by">
                  waiting on: {{ store.getTaskById(task.parentId!)?.name ?? '—' }}
                </span>
              </div>
              <span v-if="task.dueDate" class="blocked-due" :class="{ overdue: new Date(task.dueDate) < new Date() }">
                {{ new Date(task.dueDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }) }}
              </span>
            </div>
          </div>
          <div v-else class="empty-panel success">
            <i class="pi pi-check-circle" /> No blocked tasks
          </div>
        </section>
      </div>

      <!-- Upcoming deadlines -->
      <section class="panel full-width">
        <h2 class="panel-title">Upcoming Deadlines — Next 7 Days</h2>
        <div v-if="upcomingByDay.length" class="timeline">
          <div v-for="group in upcomingByDay" :key="group.label" class="timeline-day" :class="{ 'is-today': group.label === 'Today' }">
            <div class="day-label">{{ group.label }}</div>
            <div class="day-tasks">
              <div v-for="task in group.tasks" :key="task.id" class="deadline-item">
                <span class="deadline-name">{{ task.name }}</span>
                <div v-if="task.tags?.length" class="deadline-tags">
                  <span v-for="tag in task.tags.slice(0, 2)" :key="tag" class="dtag">{{ tag }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-panel">No tasks due in the next 7 days.</div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.mgr-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem;
}

.page-header {
  margin-bottom: 1.25rem;
}

.page-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin-bottom: 0.25rem;
}

.subtitle {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  color: var(--color-overdue);
  padding: 0.6em 0.9em;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.loading-state {
  padding: 3rem;
  text-align: center;
  color: var(--color-text-muted);
}

/* Stats bar */
.stats-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.stat-chip {
  background: linear-gradient(135deg, var(--color-surface-2), var(--color-surface-3));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0.85rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
  cursor: default;
}

.stat-chip:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-strong);
}

.stat-chip.warn {
  border-color: rgba(245, 158, 11, 0.3);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), var(--color-surface-3));
}

.stat-chip.warn:hover {
  box-shadow: var(--shadow-md), 0 0 16px rgba(245, 158, 11, 0.15);
}

.chip-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-chip.warn .chip-value {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.chip-label {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Layout */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.panel.full-width { margin-top: 0; }

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.05) 0%, var(--color-surface-2) 100%);
}

.panel-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1em 0.5em;
  border-radius: 8px;
  background: var(--color-danger);
  color: #fff;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
}

.empty-panel {
  padding: 2rem;
  text-align: center;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.empty-panel.success { color: var(--color-success); }

/* Projects */
.project-list { padding: 0.25rem 0; }

.project-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--color-border);
  transition: var(--transition);
  position: relative;
}

.project-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--gradient-primary);
  opacity: 0;
  transition: var(--transition);
}

.project-row:hover::before {
  opacity: 1;
}

.project-row:hover {
  background: var(--color-surface-3);
}

.project-row:last-child { border-bottom: none; }

.project-info {
  flex: 1;
  min-width: 0;
}

.project-name {
  display: block;
  font-size: 0.85rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.project-name.done {
  text-decoration: line-through;
  color: var(--color-text-muted);
}

.project-meta {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  margin-top: 0.1rem;
}

.project-progress {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.progress-track {
  width: 80px;
  height: 5px;
  background: var(--color-surface-3);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 3px;
  transition: width 0.4s var(--ease-out);
  box-shadow: 0 0 4px rgba(99, 102, 241, 0.3);
}

.progress-fill.fill-success {
  background: var(--gradient-success);
  box-shadow: 0 0 4px rgba(34, 197, 94, 0.3);
}

.progress-fill.fill-warn {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  box-shadow: 0 0 4px rgba(245, 158, 11, 0.3);
}

.progress-pct {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  width: 30px;
  text-align: right;
}

/* Blocked tasks */
.blocked-list { padding: 0.25rem 0; }

.blocked-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 1rem;
  border-bottom: 1px solid var(--color-border);
  transition: var(--transition);
  position: relative;
}

.blocked-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #f59e0b, #ef4444);
  border-radius: 0 2px 2px 0;
}

.blocked-row:hover {
  background: rgba(245, 158, 11, 0.04);
}

.blocked-row:last-child { border-bottom: none; }

.blocked-icon {
  color: var(--color-warning);
  font-size: 0.75rem;
  flex-shrink: 0;
  filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.4));
}

.blocked-info {
  flex: 1;
  min-width: 0;
}

.blocked-name {
  display: block;
  font-size: 0.83rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.blocked-by {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  margin-top: 0.1rem;
}

.blocked-due {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.blocked-due.overdue {
  color: var(--color-overdue);
  font-weight: 500;
}

/* Timeline */
.timeline {
  display: flex;
  gap: 0;
  overflow-x: auto;
  padding: 0.75rem 1rem 1rem;
  scrollbar-width: thin;
}

.timeline-day {
  min-width: 150px;
  flex-shrink: 0;
  border-radius: var(--radius);
  padding: 0.5rem 0.65rem;
  transition: var(--transition);
}

.timeline-day + .timeline-day {
  border-left: 1px solid var(--color-border);
  margin-left: 0.5rem;
  padding-left: 0.75rem;
}

.timeline-day.is-today {
  border: 1px solid rgba(99, 102, 241, 0.4);
  background: rgba(99, 102, 241, 0.04);
  box-shadow: var(--glow-primary), inset 0 0 20px rgba(99, 102, 241, 0.03);
  border-radius: var(--radius);
}

.timeline-day.is-today + .timeline-day {
  border-left: none;
}

.day-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.day-tasks {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.deadline-item {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.4rem 0.55rem;
  box-shadow: var(--shadow-xs);
  transition: var(--transition);
  animation: fadeSlideIn 0.2s var(--ease-out) both;
}

.deadline-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
  border-color: var(--color-border-strong);
  background: var(--color-surface-3);
}

.deadline-name {
  display: block;
  font-size: 0.78rem;
  color: var(--color-text);
  line-height: 1.3;
  font-weight: 500;
}

.deadline-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  margin-top: 0.25rem;
}

.dtag {
  font-size: 0.6rem;
  padding: 0.1em 0.45em;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 6px;
  color: var(--color-primary-light);
}

@media (max-width: 640px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .stats-bar { flex-wrap: wrap; }
  .stat-chip { flex: 1 1 calc(50% - 0.375rem); }
}
</style>
