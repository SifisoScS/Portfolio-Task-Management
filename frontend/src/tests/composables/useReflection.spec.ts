import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReflection } from '@/composables/useReflection'
import { useTaskStore } from '@/stores/tasks'
import { reflectionService } from '@/services/reflectionService'
import type { ReflectionResponse } from '@/types/reflection'

vi.mock('@/services/reflectionService', () => ({
  reflectionService: {
    reflect: vi.fn(),
    getHistory: vi.fn()
  }
}))

describe('useReflection Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Activity Logging', () => {
    it('should log activity events', () => {
      const reflection = useReflection()

      reflection.logActivity('completed', 1, 'Test Task', 'Details')

      expect(reflection.activityLog.value.length).toBe(1)
      expect(reflection.activityLog.value[0]).toMatchObject({
        action: 'completed',
        taskId: 1,
        taskName: 'Test Task',
        details: 'Details'
      })
    })

    it('should maintain max 50 activities', () => {
      const reflection = useReflection()

      // Log 60 activities
      for (let i = 0; i < 60; i++) {
        reflection.logActivity('created', i, `Task ${i}`)
      }

      expect(reflection.activityLog.value.length).toBe(50)
      // Should keep most recent (50-59)
      expect(reflection.activityLog.value[49].taskId).toBe(59)
    })
  })

  describe('Context Building', () => {
    it('should build reflection context with Johannesburg timezone', () => {
      const reflection = useReflection()
      const context = (reflection as any).buildContext()

      expect(context.timezone).toContain('Africa/Johannesburg')
      expect(context.userLocation).toContain('Johannesburg')
      expect(context.loadSheddingStage).toBeGreaterThanOrEqual(0)
      expect(context.loadSheddingStage).toBeLessThanOrEqual(8)
    })

    it('should estimate load-shedding stage based on time', () => {
      const reflection = useReflection()
      const context = (reflection as any).buildContext()

      // Should return a valid stage
      expect(typeof context.loadSheddingStage).toBe('number')
    })
  })

  describe('Snapshot Building', () => {
    it('should build full tree snapshot', async () => {
      const taskStore = useTaskStore()
      const reflection = useReflection()

      // Add tasks
      await taskStore.addTask({ name: 'Task 1', description: '', isCompleted: true })
      await taskStore.addTask({ name: 'Task 2', description: '', isCompleted: false })

      const snapshot = (reflection as any).buildSnapshot('full')

      expect(snapshot.totalTasks).toBe(2)
      expect(snapshot.completedTasks).toBe(1)
      expect(snapshot.tasks.length).toBe(2)
    })

    it('should build subtree snapshot', async () => {
      const taskStore = useTaskStore()
      const reflection = useReflection()

      const parent = await taskStore.addTask({ name: 'Parent', description: '', isCompleted: false })
      await taskStore.addTask({ name: 'Child', description: '', isCompleted: false, parentId: parent.id })
      await taskStore.addTask({ name: 'Other', description: '', isCompleted: false })

      const snapshot = (reflection as any).buildSnapshot('subtree', parent.id)

      expect(snapshot.totalTasks).toBe(2) // Parent + Child only
    })

    it('should detect overdue tasks in snapshot', async () => {
      const taskStore = useTaskStore()
      const reflection = useReflection()

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      await taskStore.addTask({
        name: 'Overdue Task',
        description: '',
        isCompleted: false,
        dueDate: yesterday.toISOString()
      })

      const snapshot = (reflection as any).buildSnapshot('full')

      expect(snapshot.overdueTasks).toBe(1)
    })
  })

  describe('Reflection Execution', () => {
    it('should run reflection with mock', async () => {
      const reflection = useReflection()

      const mockResponse: ReflectionResponse = {
        critique: {
          summary: 'Test critique',
          blockers: [],
          inefficiencies: [],
          opportunities: []
        },
        progressPropagations: [],
        adaptations: [],
        reasoning: 'Test reasoning',
        metadata: {
          processingTimeMs: 100,
          timestamp: new Date().toISOString()
        }
      }

      vi.mocked(reflectionService.reflect).mockResolvedValue(mockResponse)

      await reflection.runReflection('full', undefined, true)

      expect(reflection.reflectionResult.value).toEqual(mockResponse)
      expect(reflection.loading.value).toBe(false)
    })

    it('should handle reflection errors', async () => {
      const reflection = useReflection()

      vi.mocked(reflectionService.reflect).mockRejectedValue(new Error('API Error'))

      await expect(async () => {
        await reflection.runReflection('full', undefined, false)
      }).rejects.toThrow('API Error')

      expect(reflection.error.value).toContain('API Error')
    })
  })

  describe('Adaptation Application', () => {
    it('should apply reorder adaptations', async () => {
      const taskStore = useTaskStore()
      const reflection = useReflection()

      const task1 = await taskStore.addTask({ name: 'Task 1', description: '', isCompleted: false })
      const task2 = await taskStore.addTask({ name: 'Task 2', description: '', isCompleted: false })

      const adaptations = [
        {
          taskId: task1.id,
          taskName: 'Task 1',
          adaptationType: 'reorder' as const,
          newOrderIndex: 1,
          rationale: 'Test reorder',
          urgencyScore: 0.8,
          confidenceScore: 0.9
        }
      ]

      await reflection.applyAdaptations(adaptations)

      const updatedTask = taskStore.getTaskById(task1.id)
      expect(updatedTask?.orderIndex).toBe(1)
    })

    it('should rollback on adaptation failure', async () => {
      const taskStore = useTaskStore()
      const reflection = useReflection()

      const task = await taskStore.addTask({ name: 'Task', description: '', isCompleted: false })
      const originalOrderIndex = task.orderIndex

      // Mock update failure
      vi.spyOn(taskStore, 'updateTask').mockRejectedValue(new Error('Update failed'))

      const adaptations = [
        {
          taskId: task.id,
          taskName: 'Task',
          adaptationType: 'reorder' as const,
          newOrderIndex: 10,
          rationale: 'Test',
          urgencyScore: 0.8,
          confidenceScore: 0.9
        }
      ]

      await expect(async () => {
        await reflection.applyAdaptations(adaptations)
      }).rejects.toThrow()

      // Should rollback
      const currentTask = taskStore.getTaskById(task.id)
      expect(currentTask?.orderIndex).toBe(originalOrderIndex)
    })
  })

  describe('Auto-Reflection', () => {
    it('should auto-trigger reflection after 5 completions', async () => {
      const reflection = useReflection()
      const runReflectionSpy = vi.spyOn(reflection, 'runReflection')

      // Mock 5 rapid completions
      for (let i = 0; i < 5; i++) {
        reflection.autoReflectOnCompletion(i, `Task ${i}`)
      }

      // Should trigger auto-reflection
      expect(runReflectionSpy).toHaveBeenCalledWith('recent-changes', undefined, true)
    })

    it('should not auto-trigger if completions are spread out', async () => {
      const reflection = useReflection()
      const runReflectionSpy = vi.spyOn(reflection, 'runReflection')

      // Add old completion (> 5 minutes ago)
      const oldTimestamp = new Date(Date.now() - 6 * 60 * 1000).toISOString()
      reflection.activityLog.value.push({
        timestamp: oldTimestamp,
        action: 'completed',
        taskId: 1,
        taskName: 'Old Task'
      })

      // Add 4 recent completions (total 5, but only 4 recent)
      for (let i = 0; i < 4; i++) {
        reflection.autoReflectOnCompletion(i + 2, `Task ${i + 2}`)
      }

      // Should NOT trigger (only 4 recent completions)
      expect(runReflectionSpy).not.toHaveBeenCalled()
    })
  })

  describe('Computed Properties', () => {
    it('should detect critical issues', () => {
      const reflection = useReflection()

      reflection.reflectionResult.value = {
        critique: {
          summary: 'Test',
          blockers: [
            {
              taskId: 1,
              taskName: 'Task 1',
              issue: 'Critical issue',
              severity: 'high',
              suggestedAction: 'Fix it'
            }
          ],
          inefficiencies: [],
          opportunities: []
        },
        progressPropagations: [],
        adaptations: [],
        reasoning: '',
        metadata: { processingTimeMs: 0, timestamp: new Date().toISOString() }
      }

      expect(reflection.hasCriticalIssues.value).toBe(true)
    })

    it('should count adaptations', () => {
      const reflection = useReflection()

      reflection.reflectionResult.value = {
        critique: { summary: '', blockers: [], inefficiencies: [], opportunities: [] },
        progressPropagations: [],
        adaptations: [
          {
            taskId: 1,
            taskName: 'Task 1',
            adaptationType: 'reorder',
            rationale: 'Test',
            urgencyScore: 0.8,
            confidenceScore: 0.9
          },
          {
            taskId: 2,
            taskName: 'Task 2',
            adaptationType: 'reschedule',
            rationale: 'Test',
            urgencyScore: 0.7,
            confidenceScore: 0.85
          }
        ],
        reasoning: '',
        metadata: { processingTimeMs: 0, timestamp: new Date().toISOString() }
      }

      expect(reflection.adaptationCount.value).toBe(2)
    })

    it('should extract quick wins', () => {
      const reflection = useReflection()

      reflection.reflectionResult.value = {
        critique: {
          summary: '',
          blockers: [],
          inefficiencies: [],
          opportunities: [
            {
              type: 'quick-win',
              description: 'Easy task',
              tasks: [1, 2],
              estimatedBenefit: '10 min'
            },
            {
              type: 'high-impact',
              description: 'Hard task',
              tasks: [3],
              estimatedBenefit: '2 hours'
            }
          ]
        },
        progressPropagations: [],
        adaptations: [],
        reasoning: '',
        metadata: { processingTimeMs: 0, timestamp: new Date().toISOString() }
      }

      expect(reflection.quickWins.value.length).toBe(1)
      expect(reflection.quickWins.value[0].type).toBe('quick-win')
    })
  })
})
