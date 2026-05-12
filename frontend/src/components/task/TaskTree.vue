<script setup lang="ts">
import TaskItem from './TaskItem.vue'
import type { Task } from '@/types/task'

defineProps<{
  tasks: Task[]
  loading?: boolean
}>()

defineEmits<{
  'add-task': []
}>()
</script>

<template>
  <div v-if="loading" class="tree-loading">
    <span class="spinner" />
    Loading tasks…
  </div>

  <div v-else-if="tasks.length" class="task-tree" role="tree">
    <TaskItem
      v-for="task in tasks"
      :key="task.id"
      :task="task"
      :depth="0"
    />
  </div>

  <div v-else class="tree-empty">
    <slot name="empty" />
  </div>
</template>

<style scoped>
.tree-loading {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 3rem;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.task-tree {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  position: relative;
}

/* Gradient top accent */
.task-tree::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-primary);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.tree-empty {
  /* host slot content; no wrapper styling needed */
}
</style>
