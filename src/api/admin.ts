import { get, post, put, del } from '@/utils/request'
import type { ArticleDetail } from './article'

export interface CreateArticleParams {
  title: string
  content: string
  category: string
  categoryColor?: string
  tags?: string[]
  date?: string
  status?: 'draft' | 'published'
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export function getAdminArticles(page = 1, pageSize = 10) {
  return get<PageResult<ArticleDetail>>('/api/admin/articles', { page, pageSize })
}

export function getAdminArticle(id: number) {
  return get<ArticleDetail>(`/api/admin/articles/${id}`)
}

export function createArticle(params: CreateArticleParams) {
  return post<ArticleDetail>('/api/admin/articles', params)
}

export function updateArticle(id: number, params: CreateArticleParams) {
  return put<ArticleDetail>(`/api/admin/articles/${id}`, params)
}

export function deleteArticle(id: number) {
  return del<null>(`/api/admin/articles/${id}`)
}
