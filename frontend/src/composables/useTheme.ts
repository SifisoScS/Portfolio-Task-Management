import { ref } from 'vue'

type Theme = 'dark' | 'light'

// Module-level singleton — shared across all callers
const theme = ref<Theme>('dark')

function apply(t: Theme) {
  theme.value = t
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem('tf-theme', t)
}

export function useTheme() {
  function init() {
    const saved = localStorage.getItem('tf-theme') as Theme | null
    const system: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    apply(saved ?? system)
  }

  function toggle() {
    apply(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, toggle, init }
}
