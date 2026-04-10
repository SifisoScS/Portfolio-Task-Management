export interface Task {
  id: number
  name: string
  description: string
  isCompleted: boolean
  parentId?: number | null
  dueDate?: string | null
  tags?: string[]
  orderIndex?: number
  goalId?: number | null
}
