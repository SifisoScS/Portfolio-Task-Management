<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Task } from '@/types/task'

const props = defineProps<{
  visible: boolean
  parentId?: number | null
  editTask?: Task | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [task: Omit<Task, 'id'>]
}>()

const name = ref('')
const description = ref('')
const dueDate = ref('')
const tagsInput = ref('')

watch(() => props.visible, (v) => {
  if (v) {
    name.value = props.editTask?.name ?? ''
    description.value = props.editTask?.description ?? ''
    dueDate.value = props.editTask?.dueDate ? props.editTask.dueDate.slice(0, 10) : ''
    tagsInput.value = props.editTask?.tags?.join(', ') ?? ''
  }
})

function close() {
  emit('update:visible', false)
}

function submit() {
  if (!name.value.trim()) return
  const tags = tagsInput.value
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)

  emit('submit', {
    name: name.value.trim(),
    description: description.value.trim(),
    isCompleted: props.editTask?.isCompleted ?? false,
    parentId: props.editTask?.parentId ?? props.parentId ?? null,
    dueDate: dueDate.value ? new Date(dueDate.value).toISOString() : null,
    tags,
    orderIndex: props.editTask?.orderIndex ?? 0
  })
  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editTask ? 'Edit Task' : parentId ? 'Add Subtask' : 'Add Task' }}</h2>
          <button class="btn-close" @click="close">✕</button>
        </div>
        <form class="modal-body" @submit.prevent="submit">
          <label>
            Name *
            <input v-model="name" placeholder="Task name" autofocus required />
          </label>
          <label>
            Description
            <textarea v-model="description" placeholder="Optional description" rows="3" />
          </label>
          <div class="form-row">
            <label>
              Due date
              <input v-model="dueDate" type="date" />
            </label>
            <label>
              Tags
              <input v-model="tagsInput" placeholder="compliance, vat, sars (comma-separated)" />
            </label>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="close">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="!name.trim()">
              {{ editTask ? 'Save changes' : 'Add task' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px) saturate(160%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeSlideIn 0.15s var(--ease-out);
}

.modal {
  background: linear-gradient(160deg, var(--color-surface-2) 0%, var(--color-surface) 100%);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 520px;
  overflow: hidden;
  box-shadow: var(--shadow-xl), var(--glow-primary);
  animation: modalIn 0.2s var(--ease-out);
}

@keyframes modalIn {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.06) 0%, transparent 60%);
}

.modal-header h2 {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.btn-close {
  background: none;
  color: var(--color-text-muted);
  padding: 0.2em 0.4em;
  font-size: 1rem;
}

.btn-close:hover {
  color: var(--color-text);
}

.modal-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

label input,
label textarea,
label select {
  width: 100%;
}

textarea {
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
  margin-top: 0.25rem;
}

.btn-cancel {
  background: var(--color-surface-2);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.btn-cancel:hover {
  color: var(--color-text);
}

.btn-primary {
  background: var(--gradient-primary);
  color: #fff;
  font-weight: 600;
  padding: 0.45em 1.2em;
  border-radius: 20px;
  box-shadow: var(--shadow-sm), var(--glow-primary);
  letter-spacing: -0.01em;
}

.btn-primary:hover:not(:disabled) {
  box-shadow: var(--shadow-md), var(--glow-primary);
}
</style>
