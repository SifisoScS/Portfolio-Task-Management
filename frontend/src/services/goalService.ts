import axios from 'axios'
import type { Goal, Objective } from '@/types/goal'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5235/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

export const goalService = {
  async getAll(): Promise<Goal[]> {
    const { data } = await http.get<Goal[]>('/goal')
    return data
  },

  async getById(id: number): Promise<Goal> {
    const { data } = await http.get<Goal>(`/goal/${id}`)
    return data
  },

  async create(goal: Omit<Goal, 'id'>): Promise<Goal> {
    const { data } = await http.post<Goal>('/goal', goal)
    return data
  },

  async update(id: number, goal: Partial<Goal>): Promise<void> {
    await http.put(`/goal/${id}`, goal)
  },

  async remove(id: number): Promise<void> {
    await http.delete(`/goal/${id}`)
  },

  async getObjectives(goalId: number): Promise<Objective[]> {
    const { data } = await http.get<Objective[]>(`/goal/${goalId}/objectives`)
    return data
  },

  async addObjective(goalId: number, objective: Omit<Objective, 'id' | 'goalId'>): Promise<Objective> {
    const { data } = await http.post<Objective>(`/goal/${goalId}/objectives`, objective)
    return data
  },

  async removeObjective(id: number): Promise<void> {
    await http.delete(`/goal/objectives/${id}`)
  }
}
