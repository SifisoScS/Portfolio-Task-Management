<script setup lang="ts">
import type { AdaptationSuggestion } from '@/types/reflection'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'

interface Props {
  adaptation: AdaptationSuggestion
  rank: number
}

const props = defineProps<Props>()

function getAdaptationIcon(type: string): string {
  switch (type) {
    case 'reorder':
      return 'pi-sort-alt'
    case 'reschedule':
      return 'pi-calendar'
    case 'reassign':
      return 'pi-user'
    case 'split':
      return 'pi-sitemap'
    case 'merge':
      return 'pi-link'
    default:
      return 'pi-cog'
  }
}

function getAdaptationColor(type: string): string {
  switch (type) {
    case 'reorder':
      return 'primary'
    case 'reschedule':
      return 'warn'
    case 'reassign':
      return 'info'
    case 'split':
      return 'success'
    case 'merge':
      return 'secondary'
    default:
      return 'secondary'
  }
}
</script>

<template>
  <div class="adaptation-item p-3 surface-card border-round">
    <div class="flex justify-content-between align-items-start mb-2">
      <div class="flex align-items-center gap-2">
        <span class="rank-badge">{{ rank }}</span>
        <Tag
          :value="adaptation.adaptationType"
          :severity="getAdaptationColor(adaptation.adaptationType)"
          :icon="`pi ${getAdaptationIcon(adaptation.adaptationType)}`"
        />
      </div>
      <div class="flex gap-2">
        <Tag
          :value="`Urgency: ${Math.round(adaptation.urgencyScore * 100)}%`"
          severity="danger"
          rounded
        />
        <Tag
          :value="`Confidence: ${Math.round(adaptation.confidenceScore * 100)}%`"
          severity="info"
          rounded
        />
      </div>
    </div>

    <h4 class="text-lg font-semibold mb-1">{{ adaptation.taskName }}</h4>

    <p class="text-color-secondary mb-3">{{ adaptation.rationale }}</p>

    <div class="adaptation-details text-sm text-color-secondary">
      <div v-if="adaptation.newOrderIndex !== undefined">
        📍 New position: {{ adaptation.newOrderIndex + 1 }}
      </div>
      <div v-if="adaptation.newParentId !== undefined">
        👨‍👧 New parent: {{ adaptation.newParentId ? `#${adaptation.newParentId}` : 'Root' }}
      </div>
      <div v-if="adaptation.newDueDate">
        📅 Reschedule to: {{ new Date(adaptation.newDueDate).toLocaleString() }}
      </div>
    </div>

    <div class="urgency-bar mt-3">
      <ProgressBar
        :value="adaptation.urgencyScore * 100"
        :showValue="false"
        :class="{
          'urgency-high': adaptation.urgencyScore >= 0.7,
          'urgency-medium': adaptation.urgencyScore >= 0.4 && adaptation.urgencyScore < 0.7,
          'urgency-low': adaptation.urgencyScore < 0.4
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.adaptation-item {
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;
}

.adaptation-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 0.875rem;
}

.adaptation-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
}

.urgency-bar {
  height: 6px;
}

.urgency-bar :deep(.p-progressbar) {
  height: 6px;
  background: var(--surface-border);
}

.urgency-high :deep(.p-progressbar-value) {
  background: linear-gradient(90deg, var(--red-500), var(--orange-500));
}

.urgency-medium :deep(.p-progressbar-value) {
  background: linear-gradient(90deg, var(--yellow-500), var(--orange-400));
}

.urgency-low :deep(.p-progressbar-value) {
  background: linear-gradient(90deg, var(--green-500), var(--teal-500));
}
</style>
