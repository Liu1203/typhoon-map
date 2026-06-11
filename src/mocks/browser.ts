import { setupWorker } from 'msw/browser'
import { userHandlers } from './handlers/user'
import { authHandlers } from './handlers/auth'
import { articleHandlers } from './handlers/article'
import { commentHandlers } from './handlers/comment'

export const worker = setupWorker(...userHandlers, ...authHandlers, ...articleHandlers, ...commentHandlers)