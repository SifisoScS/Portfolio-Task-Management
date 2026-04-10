import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import type { Goal } from '@/types/goal'

export const useGoalStore = defineStore('goals', () => {
  const goals = ref<Goal[]>([])

  function loadGoals(data: Goal[]) {
    goals.value = data
  }

  function getGoalById(id: number): Goal | undefined {
    return goals.value.find(g => g.id === id)
  }

  function getCompletionForGoal(goalId: number): number {
    const taskStore = useTaskStore()
    const linked = taskStore.allTasks.filter(t => t.goalId === goalId)
    if (linked.length === 0) return 0
    return linked.filter(t => t.isCompleted).length / linked.length
  }

  function getOverdueCountForGoal(goalId: number): number {
    const taskStore = useTaskStore()
    const now = new Date()
    return taskStore.allTasks.filter(
      t => t.goalId === goalId && !t.isCompleted && t.dueDate && new Date(t.dueDate) < now
    ).length
  }

  function getTaskCountForGoal(goalId: number): number {
    const taskStore = useTaskStore()
    return taskStore.allTasks.filter(t => t.goalId === goalId).length
  }

  return {
    goals,
    loadGoals,
    getGoalById,
    getCompletionForGoal,
    getOverdueCountForGoal,
    getTaskCountForGoal
  }
})
