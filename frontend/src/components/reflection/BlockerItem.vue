<script setup lang="ts">
import type { BlockerAnalysis } from '@/types/reflection'
import Tag from 'primevue/tag'

interface Props {
  blocker: BlockerAnalysis
}

const props = defineProps<Props>()

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'high':
      return 'pi-exclamation-circle'
    case 'medium':
      return 'pi-exclamation-triangle'
    case 'low':
      return 'pi-info-circle'
    default:
      return 'pi-question'
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'high':
      return 'danger'
    case 'medium':
      return 'warn'
    case 'low':
      return 'info'
    default:
      return 'secondary'
  }
}
</script>

<template>
  <div class="blocker-item p-3 surface-card border-round">
    <div class="flex justify-content-between align-items-start mb-2">
      <h4 class="text-lg font-semibold flex-1">{{ blocker.taskName }}</h4>
      <Tag
        :value="blocker.severity.toUpperCase()"
        :severity="getSeverityColor(blocker.severity)"
        :icon="`pi ${getSeverityIcon(blocker.severity)}`"
      />
    </div>

    <div class="issue-section mb-3">
      <div class="flex align-items-start gap-2">
        <i class="pi pi-times-circle text-red-500 mt-1"></i>
        <div>
          <p class="text-color font-medium mb-1">Issue:</p>
          <p class="text-color-secondary">{{ blocker.issue }}</p>
        </div>
      </div>
    </div>

    <div class="action-section">
      <div class="flex align-items-start gap-2">
        <i class="pi pi-arrow-right text-green-500 mt-1"></i>
        <div>
          <p class="text-color font-medium mb-1">Suggested Action:</p>
          <p class="text-color-secondary">{{ blocker.suggestedAction }}</p>
        </div>
      </div>
    </div>

    <div class="task-id-badge mt-2">
      <span class="text-xs text-color-secondary">Task ID: #{{ blocker.taskId }}</span>
    </div>
  </div>
</template>

<style scoped>
.blocker-item {
  border-left: 4px solid var(--red-500);
  background: var(--surface-ground);
}

.blocker-item[data-severity='medium'] {
  border-left-color: var(--orange-500);
}

.blocker-item[data-severity='low'] {
  border-left-color: var(--blue-500);
}

.issue-section,
.action-section {
  padding-left: 0.5rem;
}

.task-id-badge {
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
}
</style>
