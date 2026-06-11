import { http, HttpResponse } from 'msw'
import type { Comment, CreateCommentParams } from '@/types/api'

function getStorageKey(articleId: number) {
  return `mock_comments:${articleId}`
}

function getComments(articleId: number): Comment[] {
  const key = getStorageKey(articleId)
  const raw = localStorage.getItem(key)
  if (raw) {
    return JSON.parse(raw) as Comment[]
  }
  return []
}

function saveComments(articleId: number, comments: Comment[]) {
  const key = getStorageKey(articleId)
  localStorage.setItem(key, JSON.stringify(comments))
}

function nextId(comments: Comment[]): number {
  if (comments.length === 0) return 1
  return Math.max(...comments.map(c => c.id)) + 1
}

function findRootParentId(comments: Comment[], parentId: number): number {
  const parent = comments.find(c => c.id === parentId)
  if (!parent || parent.parentId === null) return parentId
  return findRootParentId(comments, parent.parentId)
}

const seedComments: Comment[] = [
  {
    id: 1,
    articleId: 1,
    author: '小明',
    content: '写得很详细，**Vite** 确实是目前最好的选择。想问一下你用的是 `pnpm` 还是 `npm`？',
    parentId: null,
    createdAt: '2026-04-15T10:30:00Z',
  },
  {
    id: 2,
    articleId: 1,
    author: '博主',
    authorAvatar: 'https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg',
    content: '用的 `pnpm`，速度快很多，建议试试~',
    parentId: 1,
    createdAt: '2026-04-15T11:00:00Z',
  },
  {
    id: 3,
    articleId: 2,
    author: '小红',
    content: '泛型的 `extends` 约束那段写得特别好，终于理解了！',
    parentId: null,
    createdAt: '2026-04-11T08:15:00Z',
  },
  {
    id: 4,
    articleId: 9,
    author: '阿强',
    content: '`opencode.json` 里的 `permissions` 配置是只对当前项目生效吗？',
    parentId: null,
    createdAt: '2026-06-11T15:20:00Z',
  },
  {
    id: 5,
    articleId: 9,
    author: '博主',
    authorAvatar: 'https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg',
    content: '是的，`opencode.json` 是项目级配置，只对当前项目生效。全局配置放在 `~/.config/opencode/opencode.json`。',
    parentId: 4,
    createdAt: '2026-06-11T16:00:00Z',
  },
  {
    id: 6,
    articleId: 9,
    author: '阿强',
    content: '明白了，那项目配置和全局配置可以同时使用吗？',
    parentId: 4,
    createdAt: '2026-06-11T16:30:00Z',
  },
]

function initSeed() {
  const seeded = localStorage.getItem('mock_comments_seeded')
  if (seeded) return
  const grouped: Record<number, Comment[]> = {}
  for (const c of seedComments) {
    if (!grouped[c.articleId]) grouped[c.articleId] = []
    grouped[c.articleId]!.push(c)
  }
  for (const [articleId, comments] of Object.entries(grouped)) {
    saveComments(Number(articleId), comments)
  }
  localStorage.setItem('mock_comments_seeded', '1')
}

initSeed()

export const commentHandlers = [
  http.get('/api/articles/:articleId/comments', ({ params }) => {
    const articleId = Number(params.articleId)
    const comments = getComments(articleId)
    return HttpResponse.json({
      code: 200,
      data: comments,
      message: 'ok',
    })
  }),

  http.post('/api/articles/:articleId/comments', async ({ request, params }) => {
    const articleId = Number(params.articleId)
    const body = (await request.json()) as CreateCommentParams
    const comments = getComments(articleId)
    const id = nextId(comments)

    let parentId: number | null = body.parentId ?? null
    if (parentId !== null) {
      parentId = findRootParentId(comments, parentId)
    }

    const newComment: Comment = {
      id,
      articleId,
      author: body.author,
      authorAvatar: body.authorAvatar ?? undefined,
      content: body.content,
      parentId,
      createdAt: new Date().toISOString(),
    }
    comments.push(newComment)
    saveComments(articleId, comments)

    return HttpResponse.json({
      code: 200,
      data: newComment,
      message: '评论成功',
    })
  }),

  http.delete('/api/comments/:commentId', ({ params }) => {
    const commentId = Number(params.commentId)
    for (let i = 1; i <= 20; i++) {
      const comments = getComments(i)
      if (comments.length === 0) continue
      const idx = comments.findIndex(c => c.id === commentId)
      if (idx !== -1) {
        const comment = comments[idx]!
        const articleId = comment.articleId
        const filtered = comments.filter(
          c => c.id !== commentId && c.parentId !== commentId
        )
        saveComments(articleId, filtered)
        return HttpResponse.json({
          code: 200,
          data: null,
          message: '删除成功',
        })
      }
    }
    return HttpResponse.json({
      code: 404,
      data: null,
      message: '评论不存在',
    })
  }),
]
