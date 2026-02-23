<script setup lang="ts">
import { computed } from 'vue'
import type { ReflectionResponse } from '@/types/reflection'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import ScrollPanel from 'primevue/scrollpanel'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import AdaptationItem from './AdaptationItem.vue'
import BlockerItem from './BlockerItem.vue'
import OpportunityItem from './OpportunityItem.vue'

interface Props {
  result: ReflectionResponse
}

const props = defineProps<Props>()

const renderedReasoning = computed(() => {
  const html = marked.parse(props.result.reasoning) as string
  return DOMPurify.sanitize(html)
})

const critiqueSummary = computed(() => props.result.critique.summary)

const blockerCount = computed(() => props.result.critique.blockers.length)
const inefficiencyCount = computed(() => props.result.critique.inefficiencies.length)
const opportunityCount = computed(() => props.result.critique.opportunities.length)
const complianceCount = computed(() => props.result.critique.complianceIssues?.length || 0)
const adaptationCount = computed(() => props.result.adaptations.length)
const propagationCount = computed(() => props.result.progressPropagations.length)

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'high':
    case 'critical':
      return 'danger'
    case 'medium':
    case 'warning':
      return 'warn'
    case 'low':
      return 'info'
    default:
      return 'secondary'
  }
}
</script>

<template>
  <div class="reflection-result">
    <!-- Summary Section -->
    <div class="summary-section mb-4">
      <h3 class="text-xl font-semibold mb-2">📊 Analysis Summary</h3>
      <p class="text-color-secondary mb-3">{{ critiqueSummary }}</p>

      <div class="stats-grid">
        <div class="stat-card">
          <Tag :value="blockerCount" severity="danger" rounded />
          <span class="stat-label">Blockers</span>
        </div>
        <div class="stat-card">
          <Tag :value="inefficiencyCount" severity="warn" rounded />
          <span class="stat-label">Inefficiencies</span>
        </div>
        <div class="stat-card">
          <Tag :value="opportunityCount" severity="success" rounded />
          <span class="stat-label">Opportunities</span>
        </div>
        <div class="stat-card">
          <Tag :value="complianceCount" severity="info" rounded />
          <span class="stat-label">Compliance</span>
        </div>
        <div class="stat-card">
          <Tag :value="adaptationCount" severity="primary" rounded />
          <span class="stat-label">Adaptations</span>
        </div>
        <div class="stat-card">
          <Tag :value="propagationCount" severity="secondary" rounded />
          <span class="stat-label">Progress Updates</span>
        </div>
      </div>
    </div>

    <Divider />

    <!-- Detailed Results -->
    <Accordion :multiple="true" :activeIndex="[0, 1]" class="mb-4">
      <!-- Blockers -->
      <AccordionTab v-if="blockerCount > 0">
        <template #header>
          <span class="flex align-items-center gap-2">
            <i class="pi pi-exclamation-triangle text-red-500"></i>
            <span class="font-semibold">Blockers ({{ blockerCount }})</span>
          </span>
        </template>
        <ScrollPanel style="max-height: 300px">
          <div class="flex flex-col gap-3">
            <BlockerItem
              v-for="blocker in result.critique.blockers"
              :key="blocker.taskId"
              :blocker="blocker"
            />
          </div>
        </ScrollPanel>
      </AccordionTab>

      <!-- Inefficiencies -->
      <AccordionTab v-if="inefficiencyCount > 0">
        <template #header>
          <span class="flex align-items-center gap-2">
            <i class="pi pi-chart-line text-orange-500"></i>
            <span class="font-semibold">Inefficiencies ({{ inefficiencyCount }})</span>
          </span>
        </template>
        <ScrollPanel style="max-height: 300px">
          <div class="flex flex-col gap-3">
            <div
              v-for="(inefficiency, idx) in result.critique.inefficiencies"
              :key="idx"
              class="inefficiency-card p-3 surface-card border-round"
            >
              <div class="flex justify-content-between align-items-start mb-2">
                <Tag :value="inefficiency.category" severity="warn" />
                <span v-if="inefficiency.potentialTimeSavings" class="text-sm text-green-500">
                  💰 {{ inefficiency.potentialTimeSavings }}
                </span>
              </div>
              <p class="text-color mb-2">{{ inefficiency.description }}</p>
              <div class="text-sm text-color-secondary">
                Affects {{ inefficiency.affectedTasks.length }} task(s)
              </div>
            </div>
          </div>
        </ScrollPanel>
      </AccordionTab>

      <!-- Opportunities -->
      <AccordionTab v-if="opportunityCount > 0">
        <template #header>
          <span class="flex align-items-center gap-2">
            <i class="pi pi-lightbulb text-green-500"></i>
            <span class="font-semibold">Opportunities ({{ opportunityCount }})</span>
          </span>
        </template>
        <ScrollPanel style="max-height: 300px">
          <div class="flex flex-col gap-3">
            <OpportunityItem
              v-for="(opportunity, idx) in result.critique.opportunities"
              :key="idx"
              :opportunity="opportunity"
            />
          </div>
        </ScrollPanel>
      </AccordionTab>

      <!-- Compliance Issues -->
      <AccordionTab v-if="complianceCount > 0">
        <template #header>
          <span class="flex align-items-center gap-2">
            <i class="pi pi-shield text-blue-500"></i>
            <span class="font-semibold">Compliance Issues ({{ complianceCount }})</span>
          </span>
        </template>
        <ScrollPanel style="max-height: 300px">
          <div class="flex flex-col gap-3">
            <div
              v-for="(issue, idx) in result.critique.complianceIssues"
              :key="idx"
              class="compliance-card p-3 surface-card border-round"
            >
              <div class="flex justify-content-between align-items-start mb-2">
                <Tag :value="issue.regulation" :severity="getSeverityColor(issue.severity)" />
                <Tag v-if="issue.deadline" :value="`Due: ${issue.deadline}`" severity="warn" />
              </div>
              <p class="text-color mb-2 font-semibold">{{ issue.description }}</p>
              <p class="text-sm text-color-secondary">✅ {{ issue.remediation }}</p>
            </div>
          </div>
        </ScrollPanel>
      </AccordionTab>

      <!-- Adaptations -->
      <AccordionTab v-if="adaptationCount > 0">
        <template #header>
          <span class="flex align-items-center gap-2">
            <i class="pi pi-sync text-blue-500"></i>
            <span class="font-semibold">Suggested Adaptations ({{ adaptationCount }})</span>
          </span>
        </template>
        <ScrollPanel style="max-height: 400px">
          <div class="flex flex-col gap-3">
            <AdaptationItem
              v-for="(adaptation, idx) in result.adaptations"
              :key="adaptation.taskId"
              :adaptation="adaptation"
              :rank="idx + 1"
            />
          </div>
        </ScrollPanel>
      </AccordionTab>

      <!-- Chain-of-Thought Reasoning -->
      <AccordionTab>
        <template #header>
          <span class="flex align-items-center gap-2">
            <i class="pi pi-book text-purple-500"></i>
            <span class="font-semibold">Chain-of-Thought Reasoning</span>
          </span>
        </template>
        <ScrollPanel style="max-height: 400px">
          <div class="reasoning-content markdown-body" v-html="renderedReasoning"></div>
        </ScrollPanel>
      </AccordionTab>

      <!-- Progress Propagations -->
      <AccordionTab v-if="propagationCount > 0">
        <template #header>
          <span class="flex align-items-center gap-2">
            <i class="pi pi-percentage text-cyan-500"></i>
            <span class="font-semibold">Progress Propagations ({{ propagationCount }})</span>
          </span>
        </template>
        <ScrollPanel style="max-height: 300px">
          <div class="flex flex-col gap-3">
            <div
              v-for="propagation in result.progressPropagations"
              :key="propagation.taskId"
              class="propagation-card p-3 surface-card border-round"
            >
              <div class="flex justify-content-between align-items-center mb-2">
                <span class="font-semibold">{{ propagation.taskName }}</span>
                <Tag :value="propagation.calculationMethod" severity="info" />
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar-bg">
                  <div
                    class="progress-bar-fill"
                    :style="{ width: `${propagation.newProgress * 100}%` }"
                  ></div>
                </div>
                <span class="text-sm">
                  {{ Math.round(propagation.oldProgress * 100) }}% →
                  {{ Math.round(propagation.newProgress * 100) }}%
                </span>
              </div>
            </div>
          </div>
        </ScrollPanel>
      </AccordionTab>
    </Accordion>

    <!-- Metadata Footer -->
    <div class="metadata-footer">
      <span class="text-sm text-color-secondary">
        ⏱️ Processed in {{ result.metadata.processingTimeMs }}ms
      </span>
      <span v-if="result.metadata.modelUsed" class="text-sm text-color-secondary">
        🤖 {{ result.metadata.modelUsed }}
      </span>
      <span v-if="result.metadata.tokenCount" class="text-sm text-color-secondary">
        🪙 {{ result.metadata.tokenCount }} tokens
      </span>
    </div>
  </div>
</template>

<style scoped>
.reflection-result {
  font-family: var(--font-family);
}

.summary-section {
  background: var(--surface-card);
  padding: 1.5rem;
  border-radius: var(--border-radius);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.inefficiency-card,
.compliance-card,
.propagation-card {
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar-bg {
  flex: 1;
  height: 8px;
  background: var(--surface-border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--green-500));
  transition: width 0.3s ease;
}

.reasoning-content {
  padding: 1rem;
  line-height: 1.6;
}

.reasoning-content :deep(h1),
.reasoning-content :deep(h2),
.reasoning-content :deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--text-color);
}

.reasoning-content :deep(code) {
  background: var(--surface-ground);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.reasoning-content :deep(pre) {
  background: var(--surface-ground);
  padding: 1rem;
  border-radius: var(--border-radius);
  overflow-x: auto;
}

.metadata-footer {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  margin-top: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .metadata-footer {
    flex-direction: column;
    align-items: center;
  }
}
</style>
