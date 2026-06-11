import { post } from '@/utils/request'
import type { LoginParams, LoginResult } from '@/types/api'

// 这里直接调用 post 泛型函数，返回值会自动推导为 LoginResult
export function login(data: LoginParams) {
  return post<LoginResult>('/api/auth/login', data)
}