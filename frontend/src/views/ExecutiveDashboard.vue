<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import { useGoalStore } from '@/stores/goals'
import { taskService } from '@/services/taskService'
import { goalService } from '@/services/goalService'

const taskStore = useTaskStore()
const goalStore = useGoalStore()
const loading = ref(false)
const error = ref<string | null>(null)

const COMPLIANCE_TAGS = ['vat', 'cipc', 'sars', 'popia', 'tax', 'compliance']

const heroStats = computed(() => {
  const allTasks = taskStore.allTasks
  const now = new Date()
  return {
    goals: goalStore.goals.length,
    tasks: allTasks.length,
    completePct: allTasks.length
      ? Math.round((allTasks.filter(t => t.isCompleted).length / allTasks.length) * 100)
      : 0,
    overdue: allTasks.filter(t => !t.isCompleted && t.dueDate && new Date(t.dueDate) < now).length
  }
})

const goalCards = computed(() =>
  goalStore.goals.map(goal => ({
    goal,
    completion: goalStore.getCompletionForGoal(goal.id),
    overdue: goalStore.getOverdueCountForGoal(goal.id),
    taskCount: goalStore.getTaskCountForGoal(goal.id)
  }))
)

const complianceTasks = computed(() => {
  return taskStore.allTasks.filter(t =>
    t.tags?.some(tag => COMPLIANCE_TAGS.includes(tag.toLowerCase()))
  )
})

const complianceByTag = computed(() => {
  const map: Record<string, number> = {}
  for (const task of complianceTasks.value) {
    for (const tag of task.tags ?? []) {
      if (COMPLIANCE_TAGS.includes(tag.toLowerCase())) {
        map[tag.toLowerCase()] = (map[tag.toLowerCase()] ?? 0) + 1
      }
    }
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1])
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const [tasks, goals] = await Promise.all([taskService.getAll(), goalService.getAll()])
    taskStore.loadTasks(tasks)
    goalStore.loadGoals(goals)
  } catch {
    error.value = 'Could not reach backend — working offline.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="exec-view">
    <div class="page-header">
      <div>
        <h1>Executive Dashboard</h1>
        <p class="subtitle">Goal progress and compliance overview</p>
      </div>
    </div>

    <div v-if="error" class="error-banner">
      <i class="pi pi-exclamation-triangle" /> {{ error }}
    </div>

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner" /> Loading…
    </div>

    <template v-else>
      <!-- Hero stats -->
      <div class="hero-stats">
        <div class="stat-card">
          <span class="stat-number">{{ heroStats.goals }}</span>
          <span class="stat-label">Active Goals</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{{ heroStats.tasks }}</span>
          <span class="stat-label">Total Tasks</span>
        </div>
        <div class="stat-card success">
          <span class="stat-number">{{ heroStats.completePct }}%</span>
          <span class="stat-label">Complete</span>
        </div>
        <div class="stat-card" :class="{ danger: heroStats.overdue > 0 }">
          <span class="stat-number">{{ heroStats.overdue }}</span>
          <span class="stat-label">Overdue</span>
        </div>
      </div>

      <!-- Goal cards -->
      <section class="section">
        <h2 class="section-title">Goals & OKRs</h2>
        <div v-if="goalCards.length" class="goal-grid">
          <div v-for="{ goal, completion, overdue, taskCount } in goalCards" :key="goal.id" class="goal-card">
            <div class="goal-card-header">
              <span class="goal-title">{{ goal.title }}</span>
              <span v-if="goal.targetDate" class="goal-date">
                {{ new Date(goal.targetDate).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' }) }}
              </span>
            </div>
            <p v-if="goal.description" class="goal-desc">{{ goal.description }}</p>
            <div class="goal-progress-row">
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: `${completion * 100}%` }" />
              </div>
              <span class="progress-pct">{{ Math.round(completion * 100) }}%</span>
            </div>
            <div class="goal-meta">
              <span class="meta-item">
                <i class="pi pi-check-circle" /> {{ taskCount }} tasks
              </span>
              <span v-if="overdue > 0" class="meta-item danger">
                <i class="pi pi-exclamation-triangle" /> {{ overdue }} overdue
              </span>
              <span v-if="goal.ownerId" class="meta-item muted">
                <i class="pi pi-user" /> {{ goal.ownerId }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="empty-section">
          <p>No goals yet. Create goals and link tasks to them to track OKR progress.</p>
        </div>
      </section>

      <!-- Compliance panel -->
      <section class="section">
        <h2 class="section-title">Compliance & Regulatory</h2>
        <div v-if="complianceTasks.length" class="compliance-panel">
          <div class="compliance-tags">
            <span
              v-for="[tag, count] in complianceByTag"
              :key="tag"
              class="compliance-tag"
            >
              {{ tag.toUpperCase() }} <span class="tag-count">{{ count }}</span>
            </span>
          </div>
          <div class="compliance-list">
            <div
              v-for="task in complianceTasks.slice(0, 10)"
              :key="task.id"
              class="compliance-item"
              :class="{ overdue: !task.isCompleted && task.dueDate && new Date(task.dueDate) < new Date() }"
            >
              <input type="checkbox" :checked="task.isCompleted" disabled class="task-check" />
              <span class="task-name" :class="{ done: task.isCompleted }">{{ task.name }}</span>
              <div class="task-tags">
                <span v-for="tag in (task.tags ?? []).filter(t => COMPLIANCE_TAGS.includes(t.toLowerCase()))" :key="tag" class="ctag">
                  {{ tag }}
                </span>
              </div>
              <span v-if="task.dueDate" class="task-due" :class="{ overdue: !task.isCompleted && new Date(task.dueDate) < new Date() }">
                {{ new Date(task.dueDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }) }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="empty-section">
          <p>No compliance tasks found. Tag tasks with <code>vat</code>, <code>cipc</code>, <code>sars</code>, or <code>popia</code> to track them here.</p>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.exec-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.5rem;
  margin-bottom: 0.2rem;
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

.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.75rem;
}

.stat-card {
  background: linear-gradient(135deg, var(--color-surface-2) 0%, var(--color-surface-3) 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
  cursor: default;
  animation: fadeSlideIn 0.2s var(--ease-out) both;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-strong);
}

.stat-card.success:hover { box-shadow: var(--shadow-md), var(--glow-success); }
.stat-card.danger:hover  { box-shadow: var(--shadow-md), var(--glow-danger); }

.stat-card.success .stat-number {
  background: var(--gradient-success);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.stat-card.danger .stat-number {
  background: var(--gradient-danger);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
  letter-spacing: -0.03em;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
}

.section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 0.75rem;
}

.goal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.85rem;
}

.goal-card {
  background: linear-gradient(160deg, var(--color-surface-2) 0%, var(--color-surface) 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.1rem 1.2rem;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  animation: fadeSlideIn 0.25s var(--ease-out) both;
}

.goal-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 2px 0 0 2px;
}

.goal-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md), var(--glow-primary);
  border-color: var(--color-border-strong);
}

.goal-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.goal-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text);
}

.goal-date {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.goal-desc {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  margin: 0 0 0.6rem;
  line-height: 1.4;
}

.goal-progress-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}

.progress-track {
  flex: 1;
  height: 6px;
  background: var(--color-surface-3);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 3px;
  transition: width 0.5s var(--ease-out);
  box-shadow: 0 0 6px rgba(99, 102, 241, 0.35);
}

.progress-pct {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  width: 36px;
  text-align: right;
  flex-shrink: 0;
}

.goal-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.meta-item.danger { color: var(--color-danger); }
.meta-item.muted { color: var(--color-text-muted); }

.empty-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.empty-section code {
  background: var(--color-surface-2);
  padding: 0.1em 0.4em;
  border-radius: 3px;
  font-size: 0.8em;
}

.compliance-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.compliance-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-2);
}

.compliance-tag {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--color-primary);
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 10px;
  padding: 0.2em 0.65em;
}

.tag-count {
  background: var(--color-primary);
  color: #fff;
  border-radius: 8px;
  padding: 0 0.35em;
  font-size: 0.85em;
}

.compliance-list {
  padding: 0.25rem 0;
}

.compliance-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 1rem;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.85rem;
}

.compliance-item:last-child { border-bottom: none; }

.compliance-item.overdue {
  border-left: 2px solid var(--color-danger);
}

.task-check {
  width: 14px;
  height: 14px;
  accent-color: var(--color-primary);
  flex-shrink: 0;
}

.task-name {
  flex: 1;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-name.done {
  text-decoration: line-through;
  color: var(--color-text-muted);
}

.task-tags {
  display: flex;
  gap: 0.2rem;
}

.ctag {
  font-size: 0.65rem;
  padding: 0.1em 0.45em;
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-primary);
  border-radius: 8px;
}

.task-due {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.task-due.overdue {
  color: var(--color-overdue);
  font-weight: 500;
}

@media (max-width: 600px) {
  .hero-stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
