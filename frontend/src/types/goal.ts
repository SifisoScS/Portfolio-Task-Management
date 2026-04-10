export interface Goal {
  id: number
  title: string
  description: string
  targetDate?: string | null
  ownerId?: string | null
}

export interface Objective {
  id: number
  goalId: number
  title: string
  keyResults?: string[]
}
