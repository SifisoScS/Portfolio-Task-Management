<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import { useReflection } from '@/composables/useReflection'
import TaskForm from '@/components/task/TaskForm.vue'
import type { Task } from '@/types/task'

const props = defineProps<{
  task: Task
  depth?: number
}>()

const store = useTaskStore()
const reflection = useReflection()

const expanded = ref(true)
const showEditForm = ref(false)
const showAddSubtask = ref(false)

const depth = computed(() => props.depth ?? 0)
const children = computed(() => store.getChildren(props.task.id))
const hasChildren = computed(() => children.value.length > 0)
const completion = computed(() => store.getCompletionPercentage(props.task.id))

const isOverdue = computed(() => {
  if (!props.task.dueDate || props.task.isCompleted) return false
  return new Date(props.task.dueDate) < new Date()
})

const formattedDue = computed(() => {
  if (!props.task.dueDate) return ''
  return new Date(props.task.dueDate).toLocaleDateString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
})

async function toggleComplete() {
  await store.updateTask(props.task.id, { isCompleted: !props.task.isCompleted })
  if (!props.task.isCompleted) {
    reflection.autoReflectOnCompletion(props.task.id, props.task.name)
  }
}

async function handleEdit(changes: Omit<Task, 'id'>) {
  await store.updateTask(props.task.id, changes)
}

async function handleAddSubtask(data: Omit<Task, 'id'>) {
  await store.addTask({ ...data, parentId: props.task.id })
  expanded.value = true
}

async function remove() {
  if (confirm(`Delete "${props.task.name}"${hasChildren.value ? ' and all its subtasks' : ''}?`)) {
    await store.deleteTask(props.task.id)
  }
}
</script>

<template>
  <div class="task-row-wrapper">
    <div
      class="task-row"
      :class="{
        'is-completed': task.isCompleted,
        'is-overdue': isOverdue,
        'is-root': depth === 0
      }"
      :style="{ '--depth': depth }"
    >
      <!-- Indent + expand toggle -->
      <div class="task-indent" :style="{ width: `${depth * 20}px` }" />
      <button
        class="btn-expand"
        :class="{ invisible: !hasChildren }"
        @click="expanded = !expanded"
        :title="expanded ? 'Collapse' : 'Expand'"
      >
        {{ expanded ? '▾' : '▸' }}
      </button>

      <!-- Checkbox -->
      <input
        type="checkbox"
        class="task-check"
        :checked="task.isCompleted"
        @change="toggleComplete"
      />

      <!-- Name -->
      <span class="task-name" :title="task.description || task.name">{{ task.name }}</span>

      <!-- Progress bar (if has children) -->
      <div v-if="hasChildren" class="task-progress" :title="`${Math.round(completion * 100)}% complete`">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${completion * 100}%` }" />
        </div>
        <span class="progress-label">{{ Math.round(completion * 100) }}%</span>
      </div>

      <!-- Due date -->
      <span v-if="task.dueDate" class="task-due" :class="{ overdue: isOverdue }">
        {{ formattedDue }}
      </span>

      <!-- Tags -->
      <div v-if="task.tags && task.tags.length" class="task-tags">
        <span v-for="tag in task.tags.slice(0, 2)" :key="tag" class="tag">{{ tag }}</span>
        <span v-if="task.tags.length > 2" class="tag tag-more">+{{ task.tags.length - 2 }}</span>
      </div>

      <!-- Actions -->
      <div class="task-actions">
        <button class="action-btn" title="Add subtask" @click="showAddSubtask = true">
          <i class="pi pi-plus" />
        </button>
        <button class="action-btn" title="Edit" @click="showEditForm = true">
          <i class="pi pi-pencil" />
        </button>
        <button class="action-btn danger" title="Delete" @click="remove">
          <i class="pi pi-trash" />
        </button>
      </div>
    </div>

    <!-- Children (recursive) -->
    <template v-if="expanded && hasChildren">
      <TaskItem
        v-for="child in children"
        :key="child.id"
        :task="child"
        :depth="depth + 1"
      />
    </template>
  </div>

  <!-- Edit form -->
  <TaskForm
    :visible="showEditForm"
    :edit-task="task"
    @update:visible="showEditForm = $event"
    @submit="handleEdit"
  />

  <!-- Add subtask form -->
  <TaskForm
    :visible="showAddSubtask"
    :parent-id="task.id"
    @update:visible="showAddSubtask = $event"
    @submit="handleAddSubtask"
  />
</template>

<style scoped>
.task-row-wrapper {
  display: contents;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--color-border);
  min-height: 46px;
  transition: var(--transition);
  position: relative;
}

.task-row:hover {
  background: var(--color-surface-3);
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.task-row.is-root {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.035) 0%, transparent 50%);
}

.task-row.is-root:hover {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.07) 0%, var(--color-surface-3) 50%);
}

.task-row.is-completed .task-name {
  text-decoration: line-through;
  color: var(--color-text-dim);
}

.task-row.is-overdue {
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.05) 0%, transparent 50%);
  box-shadow: inset 2px 0 0 var(--color-danger);
}

.task-row.is-overdue:hover {
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.09) 0%, var(--color-surface-3) 50%);
}

.task-indent {
  flex-shrink: 0;
}

.btn-expand {
  background: none;
  color: var(--color-text-muted);
  padding: 0.1em 0.3em;
  font-size: 0.75rem;
  width: 20px;
  flex-shrink: 0;
  line-height: 1;
}

.btn-expand:hover {
  color: var(--color-text);
}

.btn-expand.invisible {
  visibility: hidden;
}

.task-check {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.task-name {
  flex: 1;
  font-size: 0.9rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.progress-bar {
  width: 60px;
  height: 4px;
  background: var(--color-surface-2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-success);
  border-radius: 2px;
  transition: width 0.4s var(--ease-out);
  box-shadow: 0 0 4px rgba(34, 197, 94, 0.3);
}

.progress-label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  width: 30px;
  text-align: right;
}

.task-due {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
  white-space: nowrap;
}

.task-due.overdue {
  color: var(--color-overdue);
  font-weight: 500;
}

.task-tags {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.tag {
  font-size: 0.65rem;
  padding: 0.15em 0.5em;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.tag-more {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.task-actions {
  display: flex;
  gap: 0.15rem;
  opacity: 0;
  transition: var(--transition);
}

.task-row:hover .task-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  color: var(--color-text-muted);
  padding: 0.28em 0.38em;
  font-size: 0.75rem;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.action-btn:hover {
  background: rgba(99, 102, 241, 0.12);
  color: var(--color-primary);
  box-shadow: 0 0 6px rgba(99, 102, 241, 0.2);
  transform: scale(1.1) translateY(0);
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.12);
  color: var(--color-danger-hover);
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.2);
}
</style>
