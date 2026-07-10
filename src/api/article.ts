import { get, post, del } from '@/utils/request'

export interface ArticleDetail {
  id: number
  title: string
  content: string
  category: string
  categoryColor: string
  tags: string[]
  date: string
  status?: 'draft' | 'published'
  viewCount?: number
  likeCount?: number
  likedByMe?: boolean
}

export function getArticles(): Promise<ArticleDetail[]> {
  return get<ArticleDetail[]>('/api/articles')
}

export function getArticleById(id: number): Promise<ArticleDetail> {
  return get<ArticleDetail>(`/api/articles/${id}`)
}

export function getHotArticles(limit = 10): Promise<ArticleDetail[]> {
  return get<ArticleDetail[]>('/api/articles/hot', { limit })
}

export function getRelatedArticles(id: number): Promise<ArticleDetail[]> {
  return get<ArticleDetail[]>(`/api/articles/${id}/related`)
}

export function likeArticle(id: number): Promise<void> {
  return post<void>(`/api/articles/${id}/like`)
}

export function unlikeArticle(id: number): Promise<void> {
  return del<void>(`/api/articles/${id}/like`)
}

export function incrementViewCount(id: number): Promise<void> {
  return post<void>(`/api/articles/${id}/view`)
}

export interface SearchResult {
  articles: ArticleDetail[]
  total: number
  page: number
  size: number
  keyword: string
}

export function searchArticles(keyword: string, page = 1, size = 10): Promise<SearchResult> {
  return get<SearchResult>('/api/articles/search', { keyword, page, size })
}
