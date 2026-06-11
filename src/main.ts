import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'
import App from './App.vue'
import router from './router'

async function bootstrap() {
  // ① 先在开发环境启动 MSW，确保所有插件就绪
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
    })
  }

  // ② MSW 启动后，再创建和挂载 App
  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.use(naive)
  app.mount('#app')
}

bootstrap()