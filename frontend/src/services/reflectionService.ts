import axios from 'axios'
import type { ReflectionInput, ReflectionResponse } from '@/types/reflection'
import { buildReflectionPrompt, mockReflection } from '@/utils/reflectionPrompts'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5235/api'

class ReflectionService {
  /**
   * Call AI reflection endpoint (or mock fallback)
   */
  async reflect(input: ReflectionInput, useMock = false): Promise<ReflectionResponse> {
    if (useMock) {
      await new Promise(resolve => setTimeout(resolve, 800))
      return mockReflection(input)
    }

    try {
      const prompt = buildReflectionPrompt(input)
      const response = await axios.post<ReflectionResponse>(
        `${API_BASE_URL}/ai/reflect`,
        { prompt, input },
        { timeout: 60000 }
      )
      return response.data
    } catch (error) {
      console.warn('AI reflection endpoint unavailable, falling back to mock:', error)
      return mockReflection(input)
    }
  }

  /**
   * Get reflection history (future: persist to backend)
   */
  async getHistory(limit = 10): Promise<any[]> {
    // TODO: Implement persistence
    return []
  }
}

export const reflectionService = new ReflectionService()
