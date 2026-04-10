import { ref, computed } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import { reflectionService } from '@/services/reflectionService'
import type {
  ReflectionInput,
  ReflectionResponse,
  ReflectionContext,
  ActivityLog,
  AdaptationSuggestion
} from '@/types/reflection'

export function useReflection() {
  const taskStore = useTaskStore()

  const modalVisible = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const reflectionResult = ref<ReflectionResponse | null>(null)

  // Track activity for context
  const activityLog = ref<ActivityLog[]>([])

  /**
   * Log an activity event
   */
  function logActivity(
    action: ActivityLog['action'],
    taskId: number,
    taskName: string,
    details?: string
  ) {
    activityLog.value.push({
      timestamp: new Date().toISOString(),
      action,
      taskId,
      taskName,
      details
    })

    // Keep last 50 activities
    if (activityLog.value.length > 50) {
      activityLog.value = activityLog.value.slice(-50)
    }
  }

  /**
   * Build reflection context
   */
  function buildContext(): ReflectionContext {
    const now = new Date()
    const currentTime = now.toLocaleString('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    // Estimate load-shedding stage (mock - would integrate with Eskom Se Push API)
    const hour = now.getHours()
    let loadSheddingStage = 0
    if (hour >= 6 && hour <= 8) loadSheddingStage = 2 // Morning peak
    if (hour >= 17 && hour <= 20) loadSheddingStage = 3 // Evening peak

    return {
      currentTime,
      timezone: 'Africa/Johannesburg (SAST, UTC+2)',
      loadSheddingStage,
      userLocation: 'Johannesburg, South Africa',
      recentActivity: activityLog.value.slice(-10)
    }
  }

  /**
   * Build tree snapshot for reflection
   */
  function buildSnapshot(scope: 'full' | 'subtree' | 'recent-changes', scopeId?: number) {
    const allTasks = taskStore.allTasks

    let relevantTasks = allTasks
    if (scope === 'subtree' && scopeId) {
      const subtree = taskStore.getSubtree(scopeId)
      relevantTasks = subtree
    } else if (scope === 'recent-changes') {
      // Last 20 tasks that changed
      const recentTaskIds = new Set(activityLog.value.slice(-20).map(a => a.taskId))
      relevantTasks = allTasks.filter(t => recentTaskIds.has(t.id))
    }

    const completedTasks = relevantTasks.filter(t => t.isCompleted).length
    const now = new Date()
    const overdueTasks = relevantTasks.filter(
      t => !t.isCompleted && t.dueDate && new Date(t.dueDate) < now
    ).length

    // Simple blocked task detection (has parent that's incomplete)
    const blockedTasks = relevantTasks.filter(t => {
      if (!t.parentId) return false
      const parent = taskStore.getTaskById(t.parentId)
      return parent && !parent.isCompleted
    }).length

    return {
      totalTasks: relevantTasks.length,
      completedTasks,
      overdueTasks,
      blockedTasks,
      tasks: relevantTasks.map(t => ({
        id: t.id,
        name: t.name,
        isCompleted: t.isCompleted,
        dueDate: t.dueDate,
        parentId: t.parentId,
        tags: t.tags
      }))
    }
  }

  /**
   * Trigger reflection analysis
   */
  async function runReflection(
    scope: 'full' | 'subtree' | 'recent-changes' = 'full',
    scopeId?: number,
    useMock = false
  ) {
    loading.value = true
    error.value = null

    try {
      const context = buildContext()
      const treeSnapshot = buildSnapshot(scope, scopeId)

      const input: ReflectionInput = {
        scope,
        scopeId: scopeId || null,
        context,
        treeSnapshot
      }

      const result = await reflectionService.reflect(input, useMock)
      reflectionResult.value = result

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Reflection failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Apply adaptations from reflection
   */
  async function applyAdaptations(adaptations: AdaptationSuggestion[]) {
    const updates = adaptations.map(adaptation => ({
      taskId: adaptation.taskId,
      changes: {
        ...(adaptation.newOrderIndex !== undefined && { orderIndex: adaptation.newOrderIndex }),
        ...(adaptation.newParentId !== undefined && { parentId: adaptation.newParentId }),
        ...(adaptation.newDueDate && { dueDate: adaptation.newDueDate })
      },
      rationale: adaptation.rationale
    }))

    // Apply with optimistic update
    const snapshotId = `reflection-${Date.now()}`
    taskStore.createSnapshot(snapshotId)

    try {
      for (const update of updates) {
        const task = taskStore.getTaskById(update.taskId)
        if (task) {
          await taskStore.updateTask(update.taskId, {
            ...task,
            ...update.changes
          })

          logActivity('updated', update.taskId, task.name, update.rationale)
        }
      }
    } catch (err) {
      taskStore.restoreSnapshot(snapshotId)
      throw err
    }
  }

  /**
   * Apply progress propagations
   */
  function applyProgressPropagations() {
    // Progress propagation is automatic in store's completion toggle
    // This method can trigger recalculation if needed
    const result = reflectionResult.value
    if (!result) return

    result.progressPropagations.forEach(propagation => {
      const task = taskStore.getTaskById(propagation.taskId)
      if (task) {
        // Store already handles progress calculation
        // Could add custom progress field here if needed
        console.log(
          `Task ${task.name}: Progress ${propagation.oldProgress * 100}% → ${propagation.newProgress * 100}%`
        )
      }
    })
  }

  /**
   * Open reflection modal
   */
  function openModal() {
    modalVisible.value = true
  }

  /**
   * Close reflection modal
   */
  function closeModal() {
    modalVisible.value = false
  }

  /**
   * Auto-reflect on task completion
   */
  const hasCriticalIssues = computed(() => {
    if (!reflectionResult.value) return false
    const { critique } = reflectionResult.value
    return (
      critique.blockers.some(b => b.severity === 'high') ||
      critique.complianceIssues?.some(c => c.severity === 'critical')
    )
  })

  const adaptationCount = computed(() => reflectionResult.value?.adaptations.length || 0)

  const quickWins = computed(() => {
    if (!reflectionResult.value) return []
    return reflectionResult.value.critique.opportunities.filter(o => o.type === 'quick-win')
  })

  const reflectionApi = {
    // State
    modalVisible,
    loading,
    error,
    reflectionResult,
    activityLog,

    // Computed
    hasCriticalIssues,
    adaptationCount,
    quickWins,

    // Actions
    runReflection,
    applyAdaptations,
    applyProgressPropagations,
    openModal,
    closeModal,
    logActivity,
    buildContext,
    buildSnapshot,
    autoReflectOnCompletion: (taskId: number, taskName: string) => {
      logActivity('completed', taskId, taskName)

      // Auto-trigger reflection if >5 recent completions
      const recentCompletions = activityLog.value.filter(
        a => a.action === 'completed' && Date.now() - new Date(a.timestamp).getTime() < 300000 // 5 min
      )

      if (recentCompletions.length >= 5) {
        console.log('Auto-triggering reflection after 5 completions in 5 minutes')
        reflectionApi.runReflection('recent-changes', undefined, true) // Use mock for auto-reflection
      }
    }
  }

  return reflectionApi
}
