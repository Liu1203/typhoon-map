import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import type { User, ApiResponse } from '@/types/api'

// 模拟用户列表
const userList: User[] = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  name: faker.person.fullName(),
  email: faker.internet.email(),
  avatar: faker.image.avatar(),
}))

export const userHandlers = [
  // GET /api/users
  http.get('/api/users', () => {
    const res: ApiResponse<User[]> = {
      code: 200,
      data: userList,
      message: 'success',
    }
    return HttpResponse.json(res)
  }),
  
  // GET /api/user/:id
  http.get('/api/user/:id', ({ params }) => {
    const user = userList.find(u => u.id === Number(params.id))
    return HttpResponse.json({
      code: 200,
      data: user ?? null,
      message: user ? 'success' : '用户不存在',
    })
  }),
  
  // POST /api/user
  http.post('/api/user', async ({ request }) => {
    const body = await request.json() as { name: string; email: string }
    const newUser: User = {
      id: userList.length + 1,
      name: body.name,
      email: body.email,
      avatar: faker.image.avatar(),
    }
    userList.push(newUser)
    return HttpResponse.json({ code: 200, data: newUser, message: '创建成功' })
  })
]