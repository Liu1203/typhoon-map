## 为什么需要 Mock？

前端开发经常需要等待后端接口就绪，严重影响开发效率。传统的 Mock 方案如 mock.js 通过在代码层拦截请求，虽然能用，但存在几个问题：

- 在 Network 面板看不到请求，调试困难
- 和真实请求行为不一致
- 需要修改业务代码

## MSW 是什么？

**Mock Service Worker** 利用浏览器 Service Worker API，在网络层拦截请求并返回模拟数据。特点是：

- ✅ 真实的 HTTP 请求，Network 可见
- ✅ 业务代码零侵入
- ✅ 同时支持 REST 和 GraphQL
- ✅ 可在浏览器和 Node.js 中使用

## 快速上手

安装依赖：

```bash
npm install msw --save-dev
npx msw init public/ --save
```

定义接口处理逻辑：

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json({
      code: 200,
      data: [{ id: 1, name: '张三' }],
      message: 'success'
    })
  })
]
```

在入口文件启动：

```typescript
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

const worker = setupWorker(...handlers)
await worker.start()
```

## 总结

MSW 是目前前端 Mock 的最佳实践之一，它让你在本地开发时拥有与对接真实后端几乎一致的体验。强烈建议在你的下一个项目中尝试。
