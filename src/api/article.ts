import { get } from '@/utils/request'

export interface ArticleDetail {
  id: number
  title: string
  content: string
  category: string
  categoryColor: string
  tags: string[]
  date: string
}

export function getArticleById(id: number): Promise<ArticleDetail> {
  return get<ArticleDetail>(`/api/articles/${id}`)
}