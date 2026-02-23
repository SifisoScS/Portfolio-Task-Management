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
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800))
      return mockReflection(input)
    }

    try {
      const prompt = buildReflectionPrompt(input)

      // TODO: Replace with actual LLM endpoint
      // Example: POST /api/ai/reflect with { prompt, input }
      const response = await axios.post<ReflectionResponse>(
        `${API_BASE_URL}/ai/reflect`,
        {
          prompt,
          input
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data
    } catch (error) {
      console.warn('AI reflection endpoint unavailable, falling back to mock:', error)
      // Fallback to mock if API fails
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
