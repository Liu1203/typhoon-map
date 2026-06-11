// 用户数据类型
export interface User {
  id: number
  name: string
  email: string
  avatar: string
}
// 统一响应格式
export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

// 新增：登录请求体
export interface LoginParams {
  username: string
  password: string
}

// 登录返回数据
export interface LoginResult {
  token: string
  userInfo: {
    id: number
    name: string
    avatar: string
  }
}

// 评论
export interface Comment {
  id: number
  articleId: number
  author: string
  authorAvatar?: string
  content: string
  parentId: number | null
  createdAt: string
}

// 创建评论参数
export interface CreateCommentParams {
  articleId: number
  author: string
  authorAvatar?: string
  content: string
  parentId?: number | null
}