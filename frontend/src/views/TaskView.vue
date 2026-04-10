<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import { taskService } from '@/services/taskService'
import TaskItem from '@/components/task/TaskItem.vue'
import TaskForm from '@/components/task/TaskForm.vue'
import type { Task } from '@/types/task'

const store = useTaskStore()
const showAddForm = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const filterStatus = ref<'all' | 'active' | 'done'>('all')

const rootTasks = computed(() =>
  store.rootIds
    .map(id => store.getTaskById(id))
    .filter((t): t is Task => t != null)
    .filter(t => {
      if (filterStatus.value === 'active') return !t.isCompleted
      if (filterStatus.value === 'done') return t.isCompleted
      return true
    })
    .filter(t =>
      !searchQuery.value ||
      t.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (t.description ?? '').toLowerCase().includes(searchQuery.value.toLowerCase())
    )
)

const stats = computed(() => {
  const all = store.allTasks
  const total = all.length
  const done = all.filter(t => t.isCompleted).length
  const overdue = all.filter(t =>
    !t.isCompleted && t.dueDate && new Date(t.dueDate) < new Date()
  ).length
  return { total, done, overdue, pct: total ? Math.round((done / total) * 100) : 0 }
})

async function loadTasks() {
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

async function handleAdd(data: Omit<Task, 'id'>) {
  await store.addTask(data)
  taskService.create(data).catch(() => {})
}

onMounted(loadTasks)
</script>

<template>
  <div class="task-view">
    <!-- Page header -->
    <div class="page-header">
      <div class="page-title">
        <h1>Tasks</h1>
        <div class="stats">
          <span class="stat">
            <span class="stat-value">{{ stats.total }}</span> total
          </span>
          <span class="stat">
            <span class="stat-value success">{{ stats.done }}</span> done
          </span>
          <span v-if="stats.overdue > 0" class="stat">
            <span class="stat-value danger">{{ stats.overdue }}</span> overdue
          </span>
        </div>
      </div>
      <button class="btn-add" @click="showAddForm = true">
        <i class="pi pi-plus" /> New task
      </button>
    </div>

    <!-- Progress bar -->
    <div class="global-progress" :title="`${stats.pct}% of all tasks complete`">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${stats.pct}%` }" />
      </div>
      <span>{{ stats.pct }}%</span>
    </div>

    <!-- Filter bar -->
    <div class="filter-bar">
      <input
        v-model="searchQuery"
        class="search-input"
        placeholder="Search tasks…"
        type="search"
      />
      <div class="filter-tabs">
        <button
          v-for="f in (['all', 'active', 'done'] as const)"
          :key="f"
          class="filter-tab"
          :class="{ active: filterStatus === f }"
          @click="filterStatus = f"
        >
          {{ f }}
        </button>
      </div>
    </div>

    <!-- Error banner -->
    <div v-if="error" class="error-banner">
      <i class="pi pi-exclamation-triangle" /> {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner" /> Loading tasks…
    </div>

    <!-- Task list -->
    <div v-else-if="rootTasks.length" class="task-list">
      <TaskItem
        v-for="task in rootTasks"
        :key="task.id"
        :task="task"
        :depth="0"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <div class="empty-glow" />
      <div class="empty-icon">◈</div>
      <h2 class="empty-title" v-if="searchQuery || filterStatus !== 'all'">No matching tasks</h2>
      <h2 class="empty-title" v-else>Your workspace is ready</h2>
      <p class="empty-sub" v-if="searchQuery || filterStatus !== 'all'">Try adjusting your search or filter.</p>
      <p class="empty-sub" v-else>Create your first task and start turning goals into outcomes.</p>
      <button class="btn-add empty-cta" @click="showAddForm = true">
        <i class="pi pi-plus" /> New task
      </button>
    </div>
  </div>

  <TaskForm
    :visible="showAddForm"
    @update:visible="showAddForm = $event"
    @submit="handleAdd"
  />
</template>

<style scoped>
.task-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.page-title h1 {
  font-size: 1.9rem;
  margin-bottom: 0.25rem;
  letter-spacing: -0.04em;
  background: var(--gradient-heading);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stats {
  display: flex;
  gap: 1rem;
}

.stat {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.stat-value {
  font-weight: 600;
  color: var(--color-text);
}

.stat-value.success {
  color: var(--color-success);
}

.stat-value.danger {
  color: var(--color-danger);
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--gradient-primary);
  color: #fff;
  font-weight: 600;
  padding: 0.5em 1.1em;
  border-radius: 20px;
  box-shadow: var(--shadow-sm), var(--glow-primary);
  font-size: 0.82rem;
  letter-spacing: -0.01em;
}

.btn-add:hover {
  box-shadow: var(--shadow-md), var(--glow-primary);
}

.global-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.progress-track {
  flex: 1;
  height: 7px;
  background: var(--color-surface-3);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 4px;
  transition: width 0.5s var(--ease-out);
  box-shadow: 0 0 6px rgba(99, 102, 241, 0.4);
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.search-input {
  flex: 1;
  padding: 0.45em 0.75em;
}

.filter-tabs {
  display: flex;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 3px;
  gap: 2px;
}

.filter-tab {
  background: none;
  color: var(--color-text-muted);
  padding: 0.3em 0.9em;
  font-size: 0.78rem;
  font-weight: 500;
  text-transform: capitalize;
  border-radius: 20px;
  transition: var(--transition);
}

.filter-tab:hover {
  color: var(--color-text);
  transform: none;
}

.filter-tab.active {
  background: var(--gradient-primary);
  color: #fff;
  box-shadow: var(--shadow-xs), 0 0 8px rgba(99, 102, 241, 0.3);
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
  margin-bottom: 0.75rem;
}

.loading-state {
  padding: 3rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.task-list {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border-top: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
}

.task-list::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-primary);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.empty-state {
  text-align: center;
  padding: 5rem 2rem 4rem;
  color: var(--color-text-muted);
  position: relative;
  overflow: hidden;
}

.empty-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -60%);
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%);
  pointer-events: none;
  border-radius: 50%;
}

.empty-icon {
  font-size: 3.5rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.5));
  margin-bottom: 1rem;
  position: relative;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
}

.empty-title {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-text);
  margin: 0 0 0.5rem;
  position: relative;
}

.empty-sub {
  font-size: 0.88rem;
  color: var(--color-text-muted);
  margin: 0 0 1.75rem;
  max-width: 320px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
}

.empty-cta {
  font-size: 0.88rem;
  padding: 0.6em 1.5em;
  position: relative;
}
</style>
