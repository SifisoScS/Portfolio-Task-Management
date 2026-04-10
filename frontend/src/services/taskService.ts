import axios from 'axios'
import type { Task } from '@/types/task'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5235/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

export const taskService = {
  async getAll(): Promise<Task[]> {
    const { data } = await http.get<Task[]>('/task')
    return data
  },

  async getById(id: number): Promise<Task> {
    const { data } = await http.get<Task>(`/task/${id}`)
    return data
  },

  async create(task: Omit<Task, 'id'>): Promise<Task> {
    const { data } = await http.post<Task>('/task', task)
    return data
  },

  async update(id: number, task: Partial<Task>): Promise<Task> {
    const { data } = await http.put<Task>(`/task/${id}`, task)
    return data
  },

  async remove(id: number): Promise<void> {
    await http.delete(`/task/${id}`)
  }
}
