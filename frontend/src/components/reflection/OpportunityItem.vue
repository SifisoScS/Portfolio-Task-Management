<script setup lang="ts">
import type { OpportunityAnalysis } from '@/types/reflection'
import Tag from 'primevue/tag'

interface Props {
  opportunity: OpportunityAnalysis
}

const props = defineProps<Props>()

function getOpportunityIcon(type: string): string {
  switch (type) {
    case 'quick-win':
      return 'pi-bolt'
    case 'high-impact':
      return 'pi-chart-line'
    case 'automation':
      return 'pi-cog'
    case 'delegation':
      return 'pi-users'
    default:
      return 'pi-lightbulb'
  }
}

function getOpportunityColor(type: string): string {
  switch (type) {
    case 'quick-win':
      return 'success'
    case 'high-impact':
      return 'warn'
    case 'automation':
      return 'info'
    case 'delegation':
      return 'secondary'
    default:
      return 'primary'
  }
}
</script>

<template>
  <div class="opportunity-item p-3 surface-card border-round">
    <div class="flex justify-content-between align-items-start mb-2">
      <Tag
        :value="opportunity.type"
        :severity="getOpportunityColor(opportunity.type)"
        :icon="`pi ${getOpportunityIcon(opportunity.type)}`"
      />
      <span class="benefit-badge">{{ opportunity.estimatedBenefit }}</span>
    </div>

    <p class="text-color mb-3">{{ opportunity.description }}</p>

    <div class="tasks-affected">
      <span class="text-sm text-color-secondary">
        📋 Affects {{ opportunity.tasks.length }} task(s): #{{ opportunity.tasks.join(', #') }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.opportunity-item {
  border-left: 4px solid var(--green-500);
  background: var(--surface-ground);
  transition: all 0.2s ease;
}

.opportunity-item:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.benefit-badge {
  padding: 0.25rem 0.75rem;
  background: var(--green-100);
  color: var(--green-800);
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.tasks-affected {
  padding: 0.5rem;
  background: var(--surface-50);
  border-radius: var(--border-radius);
}
</style>
