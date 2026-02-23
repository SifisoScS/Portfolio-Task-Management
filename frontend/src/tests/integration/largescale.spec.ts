import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '@/stores/tasks'
import { useReflection } from '@/composables/useReflection'
import type { Task } from '@/types/task'

/**
 * Integration Tests: Large-Scale Tree Operations + AI Loop
 * Tests the system's ability to handle 10k+ nodes with agentic reflection loops
 */
describe('Large-Scale Integration Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('10k Node Tree Stress Test', () => {
    it('should handle 10,000 task tree efficiently', async () => {
      const store = useTaskStore()
      const startTime = performance.now()

      console.log('Creating 10,000 tasks...')

      // Create 10,000 tasks (mix of root and nested)
      const taskIds: number[] = []

      // Create 100 root tasks
      for (let i = 0; i < 100; i++) {
        const root = await store.addTask({
          name: `Project ${i}`,
          description: `Root project ${i}`,
          isCompleted: false
        })
        taskIds.push(root.id)

        // Each root has ~10 direct children
        for (let j = 0; j < 10; j++) {
          const child = await store.addTask({
            name: `Task ${i}-${j}`,
            description: `Subtask ${j} of Project ${i}`,
            isCompleted: Math.random() > 0.5,
            parentId: root.id
          })
          taskIds.push(child.id)

          // Each child has ~9 grandchildren (10 * 10 * 9 = 9,000 + 100 + 1,000 = 10,100)
          for (let k = 0; k < 9; k++) {
            const grandchild = await store.addTask({
              name: `Subtask ${i}-${j}-${k}`,
              description: `Leaf task`,
              isCompleted: Math.random() > 0.7,
              parentId: child.id
            })
            taskIds.push(grandchild.id)
          }
        }
      }

      const createTime = performance.now() - startTime
      console.log(`Created ${taskIds.length} tasks in ${createTime}ms`)

      expect(taskIds.length).toBeGreaterThan(9000)
      expect(createTime).toBeLessThan(30000) // Should complete in < 30 seconds

      // Test 1: O(1) Lookup Performance
      const lookupStart = performance.now()
      for (let i = 0; i < 1000; i++) {
        const randomId = taskIds[Math.floor(Math.random() * taskIds.length)]
        const task = store.getTaskById(randomId)
        expect(task).toBeDefined()
      }
      const lookupTime = performance.now() - lookupStart
      console.log(`1000 random lookups in ${lookupTime}ms (${lookupTime / 1000}ms per lookup)`)
      expect(lookupTime).toBeLessThan(100) // 1000 lookups in < 100ms = O(1)

      // Test 2: Tree Traversal Performance
      const traversalStart = performance.now()
      const firstRootId = taskIds[0]
      const subtree = store.getSubtree(firstRootId)
      const traversalTime = performance.now() - traversalStart
      console.log(`Subtree traversal (${subtree.length} nodes) in ${traversalTime}ms`)
      expect(subtree.length).toBeGreaterThan(90) // ~100 nodes per root
      expect(traversalTime).toBeLessThan(1000) // < 1 second

      // Test 3: Completion Percentage Calculation
      const percentStart = performance.now()
      const completion = store.getCompletionPercentage(firstRootId)
      const percentTime = performance.now() - percentStart
      console.log(`Completion % calculated in ${percentTime}ms: ${(completion * 100).toFixed(1)}%`)
      expect(completion).toBeGreaterThanOrEqual(0)
      expect(completion).toBeLessThanOrEqual(1)
      expect(percentTime).toBeLessThan(500)

      // Test 4: Tree Structure Validation (Acyclicity)
      const validationStart = performance.now()
      const isValid = store.hasValidTreeStructure()
      const validationTime = performance.now() - validationStart
      console.log(`Tree validation (DFS) in ${validationTime}ms`)
      expect(isValid).toBe(true)
      expect(validationTime).toBeLessThan(2000) // < 2 seconds for 10k nodes

      // Test 5: Bulk Update Performance
      const updateStart = performance.now()
      const sampleTasks = taskIds.slice(0, 100)
      for (const id of sampleTasks) {
        const task = store.getTaskById(id)
        if (task) {
          await store.updateTask(id, { ...task, description: 'Updated' })
        }
      }
      const updateTime = performance.now() - updateStart
      console.log(`100 updates in ${updateTime}ms (${updateTime / 100}ms per update)`)
      expect(updateTime).toBeLessThan(5000) // < 5 seconds for 100 updates
    }, 60000) // 60 second timeout

    it('should maintain performance with deep nesting (depth 50)', async () => {
      const store = useTaskStore()

      console.log('Creating deeply nested tree (depth 50)...')

      let parent = await store.addTask({
        name: 'Root',
        description: 'Level 0',
        isCompleted: false
      })

      // Create chain of 50 levels
      for (let i = 1; i < 50; i++) {
        const child = await store.addTask({
          name: `Task Level ${i}`,
          description: `Depth ${i}`,
          isCompleted: false,
          parentId: parent.id
        })
        parent = child
      }

      const leafId = parent.id

      // Test depth calculation
      const depthStart = performance.now()
      const depth = store.getDepth(leafId)
      const depthTime = performance.now() - depthStart
      console.log(`Depth calculation (${depth}) in ${depthTime}ms`)
      expect(depth).toBe(49)
      expect(depthTime).toBeLessThan(50) // O(d) where d = depth

      // Test subtree retrieval
      const subtreeStart = performance.now()
      const subtree = store.getSubtree(1) // Root ID
      const subtreeTime = performance.now() - subtreeStart
      console.log(`Subtree retrieval (${subtree.length} nodes) in ${subtreeTime}ms`)
      expect(subtree.length).toBe(50)
      expect(subtreeTime).toBeLessThan(100)
    })
  })

  describe('AI Reflection Loop (5 Iterations)', () => {
    it('should run 5 consecutive reflection + adaptation cycles', async () => {
      const store = useTaskStore()
      const reflection = useReflection()

      console.log('Setting up test tree for AI loop...')

      // Create realistic SME task tree (~500 tasks)
      const projects = ['VAT Return Q1', 'CIPC Annual Return', 'Payroll Processing', 'Client Invoicing', 'Tax Planning']

      for (const projectName of projects) {
        const project = await store.addTask({
          name: projectName,
          description: `SME compliance task: ${projectName}`,
          isCompleted: false,
          tags: ['compliance', 'sme']
        })

        // Each project has 10-20 subtasks
        const subtaskCount = 10 + Math.floor(Math.random() * 10)
        for (let i = 0; i < subtaskCount; i++) {
          await store.addTask({
            name: `${projectName} - Step ${i + 1}`,
            description: `Subtask ${i + 1}`,
            isCompleted: Math.random() > 0.6,
            parentId: project.id,
            dueDate: i < 3 ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() : undefined // First 3 overdue
          })
        }
      }

      console.log(`Created ${store.allTasks.length} tasks`)

      // Run 5 AI reflection + adaptation cycles
      const iterationMetrics = []

      for (let iteration = 0; iteration < 5; iteration++) {
        console.log(`\n--- Iteration ${iteration + 1} ---`)

        const iterationStart = performance.now()

        // 1. Run reflection (using mock)
        await reflection.runReflection('full', undefined, true)

        const result = reflection.reflectionResult.value
        expect(result).toBeDefined()

        console.log(`Reflection generated:`)
        console.log(`- ${result!.critique.blockers.length} blockers`)
        console.log(`- ${result!.critique.inefficiencies.length} inefficiencies`)
        console.log(`- ${result!.critique.opportunities.length} opportunities`)
        console.log(`- ${result!.adaptations.length} adaptations`)

        // 2. Apply adaptations
        if (result!.adaptations.length > 0) {
          await reflection.applyAdaptations(result!.adaptations)
          console.log(`Applied ${result!.adaptations.length} adaptations`)
        }

        // 3. Apply progress propagations
        reflection.applyProgressPropagations()

        // 4. Simulate some task completions (agent work)
        const incompleteTasks = store.allTasks.filter(t => !t.isCompleted).slice(0, 3)
        for (const task of incompleteTasks) {
          await store.updateTask(task.id, { ...task, isCompleted: true })
          reflection.logActivity('completed', task.id, task.name)
        }

        const iterationTime = performance.now() - iterationStart

        iterationMetrics.push({
          iteration: iteration + 1,
          timeMs: iterationTime,
          blockers: result!.critique.blockers.length,
          adaptations: result!.adaptations.length,
          tasksCompleted: incompleteTasks.length,
          totalTasks: store.allTasks.length,
          completionRate: store.allTasks.filter(t => t.isCompleted).length / store.allTasks.length
        })

        console.log(`Iteration ${iteration + 1} completed in ${iterationTime}ms`)
        console.log(`Completion rate: ${(iterationMetrics[iteration].completionRate * 100).toFixed(1)}%`)
      }

      // Verify convergence
      const firstIteration = iterationMetrics[0]
      const lastIteration = iterationMetrics[4]

      console.log('\n--- AI Loop Summary ---')
      console.log('Iteration metrics:', JSON.stringify(iterationMetrics, null, 2))

      // Completion rate should improve
      expect(lastIteration.completionRate).toBeGreaterThanOrEqual(firstIteration.completionRate)

      // Blockers should decrease (or stay low)
      expect(lastIteration.blockers).toBeLessThanOrEqual(firstIteration.blockers + 2) // Allow slight variance

      // All iterations should complete reasonably fast
      iterationMetrics.forEach(metric => {
        expect(metric.timeMs).toBeLessThan(5000) // < 5 seconds per iteration
      })

      // Total time for 5 iterations should be < 25 seconds
      const totalTime = iterationMetrics.reduce((sum, m) => sum + m.timeMs, 0)
      console.log(`Total time for 5 iterations: ${totalTime}ms`)
      expect(totalTime).toBeLessThan(25000)
    }, 60000) // 60 second timeout
  })

  describe('Stress Test: Rapid CRUD Operations', () => {
    it('should handle 1000 rapid updates without corruption', async () => {
      const store = useTaskStore()

      // Create 100 tasks
      const taskIds = []
      for (let i = 0; i < 100; i++) {
        const task = await store.addTask({
          name: `Task ${i}`,
          description: `Description ${i}`,
          isCompleted: false
        })
        taskIds.push(task.id)
      }

      // Perform 1000 random updates
      for (let i = 0; i < 1000; i++) {
        const randomId = taskIds[Math.floor(Math.random() * taskIds.length)]
        const task = store.getTaskById(randomId)

        if (task) {
          await store.updateTask(randomId, {
            ...task,
            description: `Updated ${i}`,
            isCompleted: Math.random() > 0.5
          })
        }
      }

      // Verify data integrity
      expect(store.allTasks.length).toBe(100)
      expect(store.hasValidTreeStructure()).toBe(true)

      // All tasks should still be retrievable
      taskIds.forEach(id => {
        expect(store.getTaskById(id)).toBeDefined()
      })
    })

    it('should handle concurrent undo/redo operations', async () => {
      const store = useTaskStore()

      const task = await store.addTask({
        name: 'Test Task',
        description: 'Original',
        isCompleted: false
      })

      // Perform 50 updates
      for (let i = 0; i < 50; i++) {
        await store.updateTask(task.id, {
          ...store.getTaskById(task.id)!,
          description: `Update ${i}`
        })
      }

      // Undo 25 times
      for (let i = 0; i < 25; i++) {
        store.undo()
      }

      // Redo 15 times
      for (let i = 0; i < 15; i++) {
        store.redo()
      }

      // Should still be in valid state
      const currentTask = store.getTaskById(task.id)
      expect(currentTask).toBeDefined()
      expect(store.hasValidTreeStructure()).toBe(true)
    })
  })

  describe('Memory & Performance Benchmarks', () => {
    it('should track memory usage with 5000 tasks', async () => {
      const store = useTaskStore()

      if (performance.memory) {
        const initialMemory = performance.memory.usedJSHeapSize

        // Create 5000 tasks
        for (let i = 0; i < 5000; i++) {
          await store.addTask({
            name: `Task ${i}`,
            description: `Description for task ${i}`,
            isCompleted: Math.random() > 0.5
          })
        }

        const finalMemory = performance.memory.usedJSHeapSize
        const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024 // MB

        console.log(`Memory increase for 5000 tasks: ${memoryIncrease.toFixed(2)} MB`)
        console.log(`Average per task: ${(memoryIncrease / 5000 * 1000).toFixed(2)} KB`)

        // Should be reasonable (<100MB for 5000 tasks = ~20KB per task)
        expect(memoryIncrease).toBeLessThan(100)
      }
    })
  })
})
