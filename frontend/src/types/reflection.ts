/**
 * Agentic Reflection Types
 * South African SME context-aware task completion reflection system
 */

export interface ReflectionContext {
  currentTime: string
  timezone: string
  loadSheddingStage: number
  userLocation: string
  recentActivity: ActivityLog[]
}

export interface ActivityLog {
  timestamp: string
  action: 'completed' | 'created' | 'updated' | 'deleted' | 'reordered'
  taskId: number
  taskName: string
  details?: string
}

export interface ReflectionInput {
  taskId?: number // If reflecting on specific task completion
  scope: 'full' | 'subtree' | 'recent-changes'
  scopeId?: number | null
  context: ReflectionContext
  treeSnapshot: {
    totalTasks: number
    completedTasks: number
    overdueTasks: number
    blockedTasks: number
    tasks: Array<{
      id: number
      name: string
      isCompleted: boolean
      dueDate?: string | null
      parentId?: number | null
      dependencies?: number[]
      tags?: string[]
    }>
  }
}

export interface Critique {
  summary: string
  blockers: BlockerAnalysis[]
  inefficiencies: InefficiencyAnalysis[]
  opportunities: OpportunityAnalysis[]
  complianceIssues?: ComplianceIssue[]
}

export interface BlockerAnalysis {
  taskId: number
  taskName: string
  issue: string
  severity: 'high' | 'medium' | 'low'
  suggestedAction: string
}

export interface InefficiencyAnalysis {
  category: 'dependency' | 'ordering' | 'estimation' | 'resource'
  description: string
  affectedTasks: number[]
  potentialTimeSavings?: string
}

export interface OpportunityAnalysis {
  type: 'quick-win' | 'high-impact' | 'automation' | 'delegation'
  description: string
  tasks: number[]
  estimatedBenefit: string
}

export interface ComplianceIssue {
  regulation: 'POPIA' | 'VAT' | 'CIPC' | 'SARS'
  severity: 'critical' | 'warning'
  description: string
  deadline?: string
  remediation: string
}

export interface ProgressPropagation {
  taskId: number
  taskName: string
  oldProgress: number
  newProgress: number
  calculationMethod: 'weighted-average' | 'simple-average' | 'manual'
  affectedAncestors: number[]
}

export interface AdaptationSuggestion {
  taskId: number
  taskName: string
  adaptationType: 'reorder' | 'reschedule' | 'reassign' | 'split' | 'merge'
  newOrderIndex?: number
  newParentId?: number | null
  newDueDate?: string
  rationale: string
  urgencyScore: number
  confidenceScore: number
}

export interface ReflectionResponse {
  critique: Critique
  progressPropagations: ProgressPropagation[]
  adaptations: AdaptationSuggestion[]
  reasoning: string // Markdown chain-of-thought
  metadata: {
    processingTimeMs: number
    modelUsed?: string
    tokenCount?: number
    timestamp: string
  }
}

export interface ReflectionHistoryEntry {
  id: string
  timestamp: string
  trigger: 'task-completion' | 'manual' | 'scheduled'
  input: ReflectionInput
  response: ReflectionResponse
  appliedAdaptations: number[]
}
