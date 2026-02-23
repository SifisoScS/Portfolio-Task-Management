<script setup lang="ts">
import { ref, computed } from 'vue'
import { useReflection } from '@/composables/useReflection'
import ReflectionResult from './ReflectionResult.vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const reflection = useReflection()

const scopeOptions = [
  { label: 'Full Tree', value: 'full' },
  { label: 'Recent Changes', value: 'recent-changes' }
]

const selectedScope = ref<'full' | 'recent-changes'>('full')
const useMock = ref(true) // Default to mock until real API is available

const isSmallScreen = computed(() => window.innerWidth < 960)

async function handleGenerate() {
  await reflection.runReflection(selectedScope.value, undefined, false)
}

async function handleUseMock() {
  await reflection.runReflection(selectedScope.value, undefined, true)
}

async function handleApplyAdaptations() {
  if (!reflection.reflectionResult.value) return

  try {
    await reflection.applyAdaptations(reflection.reflectionResult.value.adaptations)
    reflection.applyProgressPropagations()

    // Show success and close after 2s
    setTimeout(() => {
      reflection.closeModal()
    }, 2000)
  } catch (err) {
    console.error('Failed to apply adaptations:', err)
  }
}

function copyReasoning() {
  if (reflection.reflectionResult.value) {
    navigator.clipboard.writeText(reflection.reflectionResult.value.reasoning)
  }
}
</script>

<template>
  <Dialog
    v-model:visible="reflection.modalVisible.value"
    :header="`🧠 Agentic Reflection${reflection.hasCriticalIssues.value ? ' - ⚠️ Critical Issues' : ''}`"
    :style="{ width: isSmallScreen ? '100vw' : '950px' }"
    :breakpoints="{ '960px': '90vw', '640px': '100vw' }"
    :maximizable="true"
    modal
    class="reflection-modal"
  >
    <!-- Configuration Section -->
    <div v-if="!reflection.reflectionResult.value" class="config-section">
      <div class="flex flex-col gap-4">
        <div class="field">
          <label for="scope" class="font-semibold mb-2 block">Reflection Scope:</label>
          <Dropdown
            id="scope"
            v-model="selectedScope"
            :options="scopeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select scope"
            class="w-full"
          />
        </div>

        <Message severity="info">
          <strong>Agentic Reflection</strong> analyzes recent task execution, identifies blockers and
          inefficiencies, propagates progress mathematically, and suggests adaptations based on
          South African SME context (load-shedding, compliance deadlines).
        </Message>

        <div class="flex gap-3 justify-end">
          <Button
            label="Generate with AI"
            icon="pi pi-sparkles"
            :loading="reflection.loading.value"
            :disabled="reflection.loading.value"
            @click="handleGenerate"
            severity="primary"
          />
          <Button
            label="Use Mock (Offline)"
            icon="pi pi-bolt"
            :loading="reflection.loading.value"
            :disabled="reflection.loading.value"
            @click="handleUseMock"
            severity="secondary"
            outlined
          />
        </div>
      </div>

      <div v-if="reflection.loading.value" class="loading-state">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
        <p class="text-muted-color mt-3">Analyzing task tree and generating insights...</p>
      </div>
    </div>

    <!-- Result Section -->
    <div v-else class="result-section">
      <Message v-if="reflection.hasCriticalIssues.value" severity="warn" class="mb-4">
        ⚠️ Critical blockers or compliance issues detected. Review adaptations carefully.
      </Message>

      <ReflectionResult :result="reflection.reflectionResult.value" />

      <div class="action-buttons">
        <Button
          label="Copy Reasoning"
          icon="pi pi-copy"
          severity="secondary"
          outlined
          @click="copyReasoning"
        />
        <Button
          label="Regenerate"
          icon="pi pi-refresh"
          severity="secondary"
          @click="handleUseMock"
          :loading="reflection.loading.value"
        />
        <Button
          v-if="reflection.adaptationCount.value > 0"
          :label="`Apply ${reflection.adaptationCount.value} Adaptations`"
          icon="pi pi-check"
          severity="success"
          @click="handleApplyAdaptations"
          :disabled="reflection.loading.value"
        />
        <Button label="Close" icon="pi pi-times" severity="secondary" @click="reflection.closeModal" />
      </div>
    </div>

    <Message v-if="reflection.error.value" severity="error" class="mt-3">
      {{ reflection.error.value }}
    </Message>
  </Dialog>
</template>

<style scoped>
.reflection-modal .config-section {
  padding: 1rem 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
}

.result-section {
  max-height: 70vh;
  overflow-y: auto;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
  flex-wrap: wrap;
}

.field {
  margin-bottom: 1rem;
}

@media (max-width: 640px) {
  .action-buttons {
    flex-direction: column;
  }

  .action-buttons button {
    width: 100%;
  }
}
</style>
