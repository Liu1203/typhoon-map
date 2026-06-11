import { get, post } from '@/utils/request'
import type { User } from '@/types/api'

// 获取用户列表，返回值自动推导为 User[]
export function getUsers() {
  return get<User[]>('/api/users')
}

// 获取单个用户
export function getUserById(id: number) {
  return get<User>(`/api/user/${id}`)
}

// 新增用户
export function createUser(data: { name: string; email: string }) {
  return post<User>('/api/user', data)
}