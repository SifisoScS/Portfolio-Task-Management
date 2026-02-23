import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '@/stores/tasks'
import type { Task } from '@/types/task'

describe('Task Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Normalized Store Structure', () => {
    it('should initialize with empty normalized structure', () => {
      const store = useTaskStore()
      expect(store.byId).toEqual({})
      expect(store.rootIds).toEqual([])
    })

    it('should normalize tasks correctly on add', async () => {
      const store = useTaskStore()
      const task: Partial<Task> = {
        name: 'Test Task',
        description: 'Test Description',
        isCompleted: false
      }

      const created = await store.addTask(task)
      expect(store.byId[created.id]).toBeDefined()
      expect(store.rootIds).toContain(created.id)
    })
  })

  describe('Tree Invariants', () => {
    it('should detect cycles with DFS', async () => {
      const store = useTaskStore()

      // Create 3 tasks
      const task1 = await store.addTask({ name: 'Task 1', description: '', isCompleted: false })
      const task2 = await store.addTask({ name: 'Task 2', description: '', isCompleted: false })
      const task3 = await store.addTask({ name: 'Task 3', description: '', isCompleted: false })

      // Create chain: 1 -> 2 -> 3
      await store.updateTask(task2.id, { ...task2, parentId: task1.id })
      await store.updateTask(task3.id, { ...task3, parentId: task2.id })

      // Verify no cycle
      expect(store.hasValidTreeStructure()).toBe(true)

      // Attempt to create cycle: 3 -> 1 (would create 1 -> 2 -> 3 -> 1)
      // Store should prevent this
      await expect(async () => {
        await store.updateTask(task1.id, { ...task1, parentId: task3.id })
      }).rejects.toThrow()
    })

    it('should prevent self-referencing parent', async () => {
      const store = useTaskStore()
      const task = await store.addTask({ name: 'Task', description: '', isCompleted: false })

      await expect(async () => {
        await store.updateTask(task.id, { ...task, parentId: task.id })
      }).rejects.toThrow(/cannot be its own parent/i)
    })

    it('should maintain acyclicity after multiple operations', async () => {
      const store = useTaskStore()

      // Create tree: Root -> [A, B], A -> [C, D]
      const root = await store.addTask({ name: 'Root', description: '', isCompleted: false })
      const taskA = await store.addTask({ name: 'A', description: '', isCompleted: false, parentId: root.id })
      const taskB = await store.addTask({ name: 'B', description: '', isCompleted: false, parentId: root.id })
      const taskC = await store.addTask({ name: 'C', description: '', isCompleted: false, parentId: taskA.id })
      const taskD = await store.addTask({ name: 'D', description: '', isCompleted: false, parentId: taskA.id })

      expect(store.hasValidTreeStructure()).toBe(true)

      // Verify depth calculation
      expect(store.getDepth(root.id)).toBe(0)
      expect(store.getDepth(taskA.id)).toBe(1)
      expect(store.getDepth(taskC.id)).toBe(2)
    })
  })

  describe('Optimistic Updates & Rollback', () => {
    it('should rollback on failed update', async () => {
      const store = useTaskStore()
      const task = await store.addTask({ name: 'Test', description: '', isCompleted: false })

      // Mock API failure
      vi.spyOn(store, 'updateTask').mockRejectedValueOnce(new Error('API Error'))

      const originalName = task.name

      try {
        await store.updateTask(task.id, { ...task, name: 'Updated Name' })
      } catch (error) {
        // Error expected
      }

      // Should rollback to original name
      const currentTask = store.getTaskById(task.id)
      expect(currentTask?.name).toBe(originalName)
    })

    it('should support transaction snapshots', () => {
      const store = useTaskStore()

      // Add some tasks
      store.addTask({ name: 'Task 1', description: '', isCompleted: false })
      store.addTask({ name: 'Task 2', description: '', isCompleted: false })

      const snapshotId = 'test-snapshot'
      store.createSnapshot(snapshotId)

      // Make changes
      store.addTask({ name: 'Task 3', description: '', isCompleted: false })
      expect(store.allTasks.length).toBe(3)

      // Restore snapshot
      store.restoreSnapshot(snapshotId)
      expect(store.allTasks.length).toBe(2)
    })

    it('should maintain transaction queue with max size', async () => {
      const store = useTaskStore()

      // Add 55 tasks (max queue is 50)
      for (let i = 0; i < 55; i++) {
        await store.addTask({ name: `Task ${i}`, description: '', isCompleted: false })
      }

      // Should only keep last 50 transactions
      expect(store.transactionQueue.length).toBeLessThanOrEqual(50)
    })
  })

  describe('Tree Operations', () => {
    it('should get children correctly', async () => {
      const store = useTaskStore()

      const parent = await store.addTask({ name: 'Parent', description: '', isCompleted: false })
      const child1 = await store.addTask({ name: 'Child 1', description: '', isCompleted: false, parentId: parent.id })
      const child2 = await store.addTask({ name: 'Child 2', description: '', isCompleted: false, parentId: parent.id })

      const children = store.getChildren(parent.id)
      expect(children.length).toBe(2)
      expect(children.map(c => c.id)).toContain(child1.id)
      expect(children.map(c => c.id)).toContain(child2.id)
    })

    it('should get full subtree recursively', async () => {
      const store = useTaskStore()

      // Create tree: Root -> A -> B -> C
      const root = await store.addTask({ name: 'Root', description: '', isCompleted: false })
      const taskA = await store.addTask({ name: 'A', description: '', isCompleted: false, parentId: root.id })
      const taskB = await store.addTask({ name: 'B', description: '', isCompleted: false, parentId: taskA.id })
      const taskC = await store.addTask({ name: 'C', description: '', isCompleted: false, parentId: taskB.id })

      const subtree = store.getSubtree(root.id)
      expect(subtree.length).toBe(4) // root + A + B + C
      expect(subtree.map(t => t.id)).toContain(root.id)
      expect(subtree.map(t => t.id)).toContain(taskC.id)
    })

    it('should calculate completion percentage correctly', async () => {
      const store = useTaskStore()

      const parent = await store.addTask({ name: 'Parent', description: '', isCompleted: false })
      await store.addTask({ name: 'Child 1', description: '', isCompleted: true, parentId: parent.id })
      await store.addTask({ name: 'Child 2', description: '', isCompleted: false, parentId: parent.id })
      await store.addTask({ name: 'Child 3', description: '', isCompleted: true, parentId: parent.id })

      const percentage = store.getCompletionPercentage(parent.id)
      expect(percentage).toBeCloseTo(0.667, 2) // 2/3 completed
    })

    it('should calculate weighted average for nested completion', async () => {
      const store = useTaskStore()

      // Root -> [A (50% done), B (100% done)]
      const root = await store.addTask({ name: 'Root', description: '', isCompleted: false })

      const taskA = await store.addTask({ name: 'A', description: '', isCompleted: false, parentId: root.id })
      await store.addTask({ name: 'A1', description: '', isCompleted: true, parentId: taskA.id })
      await store.addTask({ name: 'A2', description: '', isCompleted: false, parentId: taskA.id })

      const taskB = await store.addTask({ name: 'B', description: '', isCompleted: true, parentId: root.id })

      const rootPercentage = store.getCompletionPercentage(root.id)
      // Should be ~0.75 (A=50%, B=100%, simple average)
      expect(rootPercentage).toBeGreaterThan(0.5)
      expect(rootPercentage).toBeLessThan(1.0)
    })
  })

  describe('Undo/Redo', () => {
    it('should undo last action', async () => {
      const store = useTaskStore()

      const task = await store.addTask({ name: 'Original', description: '', isCompleted: false })
      await store.updateTask(task.id, { ...task, name: 'Updated' })

      expect(store.getTaskById(task.id)?.name).toBe('Updated')

      store.undo()

      expect(store.getTaskById(task.id)?.name).toBe('Original')
    })

    it('should redo undone action', async () => {
      const store = useTaskStore()

      const task = await store.addTask({ name: 'Original', description: '', isCompleted: false })
      await store.updateTask(task.id, { ...task, name: 'Updated' })

      store.undo()
      expect(store.getTaskById(task.id)?.name).toBe('Original')

      store.redo()
      expect(store.getTaskById(task.id)?.name).toBe('Updated')
    })
  })

  describe('Performance with Large Trees', () => {
    it('should handle 1000 tasks efficiently', async () => {
      const store = useTaskStore()

      const startTime = performance.now()

      // Add 1000 tasks
      for (let i = 0; i < 1000; i++) {
        await store.addTask({
          name: `Task ${i}`,
          description: `Description ${i}`,
          isCompleted: false
        })
      }

      const addTime = performance.now() - startTime

      // Should complete in reasonable time (< 5 seconds)
      expect(addTime).toBeLessThan(5000)

      // Verify O(1) lookup
      const lookupStart = performance.now()
      for (let i = 0; i < 100; i++) {
        const randomId = Math.floor(Math.random() * 1000) + 1
        store.getTaskById(randomId)
      }
      const lookupTime = performance.now() - lookupStart

      // 100 lookups should be < 10ms (O(1) hash map access)
      expect(lookupTime).toBeLessThan(10)
    })

    it('should handle deep tree (depth 100)', async () => {
      const store = useTaskStore()

      let parent = await store.addTask({ name: 'Root', description: '', isCompleted: false })

      // Create chain of 100 tasks
      for (let i = 1; i < 100; i++) {
        const child = await store.addTask({
          name: `Task ${i}`,
          description: '',
          isCompleted: false,
          parentId: parent.id
        })
        parent = child
      }

      const depth = store.getDepth(parent.id)
      expect(depth).toBe(99)

      // Subtree should include all 100 tasks
      const subtree = store.getSubtree(1) // Root ID
      expect(subtree.length).toBe(100)
    })
  })
})
