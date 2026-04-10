import { createRouter, createWebHistory } from 'vue-router'
import TaskView from '@/views/TaskView.vue'
import ExecutiveDashboard from '@/views/ExecutiveDashboard.vue'
import ManagerDashboard from '@/views/ManagerDashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: TaskView },
    { path: '/executive', component: ExecutiveDashboard },
    { path: '/manager', component: ManagerDashboard },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

export default router
