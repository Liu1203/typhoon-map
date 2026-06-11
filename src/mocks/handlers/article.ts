import { http, HttpResponse } from 'msw'
import type { ApiResponse } from '@/types/api'
import type { ArticleDetail } from '@/api/article'
import { articles } from '../data/articles'

export const articleHandlers = [
  http.get('/api/articles/:id', ({ params }) => {
    const article = articles.find(a => a.id === Number(params.id))
    if (!article) {
      return HttpResponse.json({
        code: 404,
        data: null,
        message: '文章不存在'
      } as ApiResponse)
    }
    return HttpResponse.json({
      code: 200,
      data: article,
      message: 'success'
    } as ApiResponse<ArticleDetail>)
  }),
]