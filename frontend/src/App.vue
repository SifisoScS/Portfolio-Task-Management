<script setup lang="ts">
import { onMounted } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import { useReflection } from '@/composables/useReflection'
import { useTheme } from '@/composables/useTheme'
import ReflectionModal from '@/components/reflection/ReflectionModal.vue'

const taskStore = useTaskStore()
const reflection = useReflection()
const { theme, toggle, init } = useTheme()

onMounted(init)
</script>

<template>
  <div class="app dark-mode">
    <header class="app-header">
      <div class="app-header-brand">
        <span class="brand-icon">◈</span>
        <span class="brand-name">TaskFlow</span>
        <span class="brand-tagline">Outcome-driven work</span>
      </div>
      <nav class="app-nav">
        <RouterLink to="/" class="nav-link">Tasks</RouterLink>
        <RouterLink to="/executive" class="nav-link">Executive</RouterLink>
        <RouterLink to="/manager" class="nav-link">Manager</RouterLink>
      </nav>

      <div class="app-header-actions">
        <button
          class="btn-reflect"
          :class="{ 'has-issues': reflection.hasCriticalIssues.value }"
          @click="reflection.openModal()"
          title="AI Reflection — analyse and optimise your task tree"
        >
          <i class="pi pi-sparkles" />
          Reflect
          <span v-if="reflection.adaptationCount.value > 0" class="badge">
            {{ reflection.adaptationCount.value }}
          </span>
        </button>
        <button class="btn-undo" @click="taskStore.undo()" title="Undo">
          <i class="pi pi-undo" />
        </button>
        <button class="btn-redo" @click="taskStore.redo()" title="Redo">
          <i class="pi pi-refresh" />
        </button>
        <button class="btn-theme" @click="toggle" :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
          <i :class="theme === 'dark' ? 'pi pi-sun' : 'pi pi-moon'" />
        </button>
      </div>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <ReflectionModal />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: 58px;
  background: var(--color-header-bg);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-md), 0 0 0 0 transparent;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
}

.app-nav {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

.nav-link {
  padding: 0.38em 0.9em;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: var(--transition);
  letter-spacing: -0.01em;
}

.nav-link:hover {
  color: var(--color-text);
  background: var(--color-surface-3);
  transform: none;
}

.nav-link.router-link-active {
  color: #fff;
  background: var(--gradient-primary);
  box-shadow: var(--glow-primary);
}

.app-header-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-icon {
  font-size: 1.5rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.5));
}

.brand-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.03em;
}

.brand-tagline {
  font-size: 0.72rem;
  color: var(--color-text-dim);
  margin-left: 0.25rem;
  letter-spacing: 0.01em;
}

.app-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-reflect {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45em 1.1em;
  background: var(--gradient-primary);
  color: #fff;
  font-weight: 600;
  border-radius: 20px;
  font-size: 0.82rem;
  box-shadow: var(--shadow-sm), var(--glow-primary);
  letter-spacing: -0.01em;
}

.btn-reflect:hover {
  box-shadow: var(--shadow-md), var(--glow-primary);
}

.btn-reflect.has-issues {
  background: var(--gradient-warning);
  color: #000;
  box-shadow: var(--shadow-sm), var(--glow-warning);
}

.badge {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  font-size: 0.7rem;
  padding: 0.1em 0.5em;
  font-weight: 700;
}

.btn-undo,
.btn-redo,
.btn-theme {
  padding: 0.4em 0.65em;
  background: var(--color-surface-2);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-xs);
}

.btn-undo:hover,
.btn-redo:hover,
.btn-theme:hover {
  color: var(--color-text);
  border-color: var(--color-border-strong);
  background: var(--color-surface-3);
  box-shadow: var(--shadow-sm);
}

.btn-theme .pi-sun  { color: #f59e0b; }
.btn-theme .pi-moon { color: #818cf8; }

.app-main {
  flex: 1;
  overflow-y: auto;
}
</style>
