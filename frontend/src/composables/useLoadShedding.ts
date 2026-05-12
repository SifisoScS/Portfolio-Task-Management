import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface LoadSheddingStatus {
  stage: number
  area: string
  lastUpdated: string
  source: 'api' | 'estimate'
}

// Singleton module-level state — shared across all component instances
const _status = ref<LoadSheddingStatus>(estimateStage())
const _pollTimer = ref<ReturnType<typeof setInterval> | null>(null)
let _refCount = 0

const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 min

function estimateStage(): LoadSheddingStatus {
  const now = new Date()
  const hour = now.getHours()
  const month = now.getMonth() + 1 // 1–12
  const dow = now.getDay()         // 0 = Sun
  const isWeekend = dow === 0 || dow === 6
  const isWinter = month >= 5 && month <= 8

  let stage = 0
  if (hour >= 6 && hour < 9)        stage = isWinter ? 2 : 1
  else if (hour >= 9 && hour < 17)  stage = isWinter && !isWeekend ? 1 : 0
  else if (hour >= 17 && hour < 21) stage = isWinter ? (isWeekend ? 2 : 3) : 2
  else if (hour >= 21 && hour < 23) stage = 1

  return {
    stage,
    area: 'Johannesburg (estimated)',
    lastUpdated: new Date().toISOString(),
    source: 'estimate'
  }
}

async function fetchStatus(): Promise<void> {
  // When a real token is available, proxy through the backend to keep it server-side:
  // GET /api/loadshedding/status (which calls developer.sepush.co.za with the token)
  const token = (import.meta.env.VITE_ESKOMSEPUSH_TOKEN as string | undefined)?.trim()
  if (!token) {
    _status.value = estimateStage()
    return
  }
  try {
    const res = await fetch('/api/loadshedding/status')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    _status.value = {
      stage: parseInt(data.stage ?? '0', 10),
      area: data.area ?? 'Johannesburg',
      lastUpdated: new Date().toISOString(),
      source: 'api'
    }
  } catch {
    _status.value = estimateStage()
  }
}

/** Current load-shedding status — usable outside component context. */
export function getLoadSheddingStage(): number {
  return _status.value.stage
}

export function useLoadShedding() {
  onMounted(() => {
    _refCount++
    if (_refCount === 1) {
      fetchStatus()
      _pollTimer.value = setInterval(fetchStatus, POLL_INTERVAL_MS)
    }
  })

  onUnmounted(() => {
    _refCount--
    if (_refCount === 0 && _pollTimer.value) {
      clearInterval(_pollTimer.value)
      _pollTimer.value = null
    }
  })

  const stageLabel = computed(() => {
    const s = _status.value.stage
    return s === 0 ? 'No load shedding' : `Stage ${s}`
  })

  const stageColor = computed((): 'green' | 'yellow' | 'orange' | 'red' => {
    const s = _status.value.stage
    if (s === 0) return 'green'
    if (s <= 2)  return 'yellow'
    if (s <= 4)  return 'orange'
    return 'red'
  })

  const isHighStage = computed(() => _status.value.stage >= 4)

  return {
    status: _status,
    stageLabel,
    stageColor,
    isHighStage,
    refresh: fetchStatus
  }
}
