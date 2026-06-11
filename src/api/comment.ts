import { get, post, del } from '@/utils/request'
import type { Comment, CreateCommentParams } from '@/types/api'

export function getComments(articleId: number): Promise<Comment[]> {
  return get<Comment[]>(`/api/articles/${articleId}/comments`)
}

export function createComment(params: CreateCommentParams): Promise<Comment> {
  return post<Comment>(`/api/articles/${params.articleId}/comments`, params)
}

export function deleteComment(commentId: number): Promise<void> {
  return del<void>(`/api/comments/${commentId}`)
}
