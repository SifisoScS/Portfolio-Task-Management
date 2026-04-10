import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import type { Task } from '@/types/task'

interface Transaction {
  type: 'add' | 'update' | 'delete'
  taskId: number
  timestamp: number
}

interface StoreState {
  byId: Record<number, Task>
  rootIds: number[]
  childrenMap: Record<number, number[]>
}

export const useTaskStore = defineStore('tasks', () => {
  // Reactive state
  const byId = shallowRef<Record<number, Task>>({})
  const rootIds = ref<number[]>([])
  const childrenMap = shallowRef<Record<number, number[]>>({})
  const transactionQueue = ref<Transaction[]>([])

  // Non-reactive internals
  let _nextId = 1
  const _undoStack: StoreState[] = []
  const _redoStack: StoreState[] = []
  const _namedSnapshots = new Map<string, StoreState>()

  // Computed
  const allTasks = computed<Task[]>(() => Object.values(byId.value))

  // ── Private helpers ──────────────────────────────────────────────────────────

  function _cloneState(): StoreState {
    const clonedChildren: Record<number, number[]> = {}
    for (const [k, arr] of Object.entries(childrenMap.value)) {
      clonedChildren[Number(k)] = [...arr]
    }
    return {
      byId: { ...byId.value },
      rootIds: [...rootIds.value],
      childrenMap: clonedChildren
    }
  }

  function _restoreState(state: StoreState): void {
    byId.value = state.byId
    rootIds.value = state.rootIds
    childrenMap.value = state.childrenMap
  }

  function _saveUndoState(): void {
    _undoStack.push(_cloneState())
    if (_undoStack.length > 50) _undoStack.splice(0, _undoStack.length - 50)
  }

  function _addToQueue(type: Transaction['type'], taskId: number): void {
    transactionQueue.value.push({ type, taskId, timestamp: Date.now() })
    if (transactionQueue.value.length > 50) {
      transactionQueue.value = transactionQueue.value.slice(-50)
    }
  }

  function _wouldCreateCycle(taskId: number, newParentId: number): boolean {
    const visited = new Set<number>()
    let current: number | null | undefined = newParentId
    while (current != null) {
      if (visited.has(current)) break
      if (current === taskId) return true
      visited.add(current)
      current = byId.value[current]?.parentId
    }
    return false
  }

  // ── Public actions ───────────────────────────────────────────────────────────

  /** Bulk-load tasks from the backend without polluting the undo stack. */
  function loadTasks(tasks: Task[]): void {
    const newById: Record<number, Task> = {}
    const newRootIds: number[] = []
    const newChildrenMap: Record<number, number[]> = {}
    let maxId = 0

    for (const task of tasks) {
      newById[task.id] = task
      if (task.id >= maxId) maxId = task.id
      if (task.parentId != null) {
        if (!newChildrenMap[task.parentId]) newChildrenMap[task.parentId] = []
        newChildrenMap[task.parentId].push(task.id)
      } else {
        newRootIds.push(task.id)
      }
    }

    byId.value = newById
    rootIds.value = newRootIds
    childrenMap.value = newChildrenMap
    _nextId = maxId + 1
    _undoStack.length = 0
    _redoStack.length = 0
  }

  function addTask(partial: Partial<Task>): Promise<Task> {
    const assignedId = partial.id ?? _nextId++
    if (partial.id != null && partial.id >= _nextId) _nextId = partial.id + 1
    const task: Task = {
      id: assignedId,
      name: partial.name ?? '',
      description: partial.description ?? '',
      isCompleted: partial.isCompleted ?? false,
      parentId: partial.parentId ?? null,
      dueDate: partial.dueDate ?? null,
      tags: partial.tags ? [...partial.tags] : [],
      orderIndex: partial.orderIndex ?? 0
    }

    _saveUndoState()
    _redoStack.length = 0

    byId.value = { ...byId.value, [task.id]: task }

    if (task.parentId != null) {
      const siblings = childrenMap.value[task.parentId] ?? []
      childrenMap.value = { ...childrenMap.value, [task.parentId]: [...siblings, task.id] }
    } else {
      rootIds.value = [...rootIds.value, task.id]
    }

    _addToQueue('add', task.id)
    return Promise.resolve(task)
  }

  async function updateTask(id: number, changes: Partial<Task>): Promise<void> {
    const existing = byId.value[id]
    if (!existing) throw new Error(`Task ${id} not found`)

    if ('parentId' in changes) {
      if (changes.parentId === id) {
        throw new Error('Task cannot be its own parent')
      }
      if (changes.parentId != null && changes.parentId !== existing.parentId) {
        if (_wouldCreateCycle(id, changes.parentId)) {
          throw new Error('This change would create a cycle in the task tree')
        }
      }
    }

    _saveUndoState()
    _redoStack.length = 0

    const newParentId = 'parentId' in changes ? changes.parentId : existing.parentId

    if ('parentId' in changes && changes.parentId !== existing.parentId) {
      // Remove from old location
      if (existing.parentId != null) {
        childrenMap.value = {
          ...childrenMap.value,
          [existing.parentId]: (childrenMap.value[existing.parentId] ?? []).filter(cid => cid !== id)
        }
      } else {
        rootIds.value = rootIds.value.filter(rid => rid !== id)
      }

      // Add to new location
      if (newParentId != null) {
        const siblings = childrenMap.value[newParentId] ?? []
        childrenMap.value = { ...childrenMap.value, [newParentId]: [...siblings, id] }
      } else {
        rootIds.value = [...rootIds.value, id]
      }
    }

    byId.value = { ...byId.value, [id]: { ...existing, ...changes } }
    _addToQueue('update', id)
  }

  async function deleteTask(id: number): Promise<void> {
    const task = byId.value[id]
    if (!task) return

    _saveUndoState()
    _redoStack.length = 0

    const toDelete = getSubtree(id).map(t => t.id)
    const newById = { ...byId.value }
    const newChildrenMap = { ...childrenMap.value }

    for (const tid of toDelete) {
      delete newById[tid]
      delete newChildrenMap[tid]
    }

    if (task.parentId != null) {
      newChildrenMap[task.parentId] = (newChildrenMap[task.parentId] ?? []).filter(cid => cid !== id)
    } else {
      rootIds.value = rootIds.value.filter(rid => rid !== id)
    }

    byId.value = newById
    childrenMap.value = newChildrenMap
    _addToQueue('delete', id)
  }

  // ── Queries ──────────────────────────────────────────────────────────────────

  function getTaskById(id: number): Task | undefined {
    return byId.value[id]
  }

  function getChildren(parentId: number): Task[] {
    return (childrenMap.value[parentId] ?? [])
      .map(id => byId.value[id])
      .filter((t): t is Task => t != null)
  }

  function getSubtree(rootId: number): Task[] {
    const result: Task[] = []
    const queue: number[] = [rootId]
    while (queue.length > 0) {
      const id = queue.shift()!
      const task = byId.value[id]
      if (task) {
        result.push(task)
        queue.push(...(childrenMap.value[id] ?? []))
      }
    }
    return result
  }

  function getDepth(taskId: number): number {
    let depth = 0
    let current: Task | undefined = byId.value[taskId]
    while (current?.parentId != null) {
      depth++
      current = byId.value[current.parentId]
    }
    return depth
  }

  function getCompletionPercentage(taskId: number): number {
    const children = getChildren(taskId)
    if (children.length === 0) {
      return byId.value[taskId]?.isCompleted ? 1 : 0
    }
    const sum = children.reduce((acc, child) => acc + getCompletionPercentage(child.id), 0)
    return sum / children.length
  }

  function hasValidTreeStructure(): boolean {
    const visited = new Set<number>()
    const inStack = new Set<number>()

    function dfs(id: number): boolean {
      if (inStack.has(id)) return false
      if (visited.has(id)) return true
      visited.add(id)
      inStack.add(id)
      for (const childId of childrenMap.value[id] ?? []) {
        if (!dfs(childId)) return false
      }
      inStack.delete(id)
      return true
    }

    for (const rootId of rootIds.value) {
      if (!dfs(rootId)) return false
    }
    return true
  }

  // ── Snapshots & History ──────────────────────────────────────────────────────

  function createSnapshot(id: string): void {
    _namedSnapshots.set(id, _cloneState())
  }

  function restoreSnapshot(id: string): void {
    const snapshot = _namedSnapshots.get(id)
    if (snapshot) {
      _restoreState(snapshot)
      _namedSnapshots.delete(id)
    }
  }

  function undo(): void {
    if (_undoStack.length === 0) return
    _redoStack.push(_cloneState())
    _restoreState(_undoStack.pop()!)
  }

  function redo(): void {
    if (_redoStack.length === 0) return
    _undoStack.push(_cloneState())
    _restoreState(_redoStack.pop()!)
  }

  return {
    // State (reactive refs — auto-unwrapped by Pinia)
    byId,
    rootIds,
    transactionQueue,
    loadTasks,
    // Computed
    allTasks,
    // Actions
    addTask,
    updateTask,
    deleteTask,
    // Queries
    getTaskById,
    getChildren,
    getSubtree,
    getDepth,
    getCompletionPercentage,
    hasValidTreeStructure,
    // Snapshots & history
    createSnapshot,
    restoreSnapshot,
    undo,
    redo
  }
})
