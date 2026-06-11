import { http, HttpResponse } from 'msw'
import type { LoginParams, ApiResponse } from '@/types/api'

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginParams

    // 模拟固定的用户名密码
    if (body.username === 'admin' && body.password === '123456') {
      const res: ApiResponse<{ token: string; userInfo: { id: number; name: string; avatar: string } }> = {
        code: 200,
        data: {
          token: 'mock_token_abc123',
          userInfo: {
            id: 1,
            name: '清清',
            avatar: 'https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg',
          },
        },
        message: '登录成功',
      }
      return HttpResponse.json(res)
    }

    // 模拟失败
    return HttpResponse.json({
      code: 400,
      data: null,
      message: '用户名或密码错误',
    })
  }),
]