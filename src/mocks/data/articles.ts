import type { ArticleDetail } from '@/api/article'

import content1 from './content/article-1.md?raw'
import content2 from './content/article-2.md?raw'
import content3 from './content/article-3.md?raw'
import content4 from './content/article-4.md?raw'
import content5 from './content/article-5.md?raw'
import content6 from './content/article-6.md?raw'
import content7 from './content/article-7.md?raw'
import content8 from './content/article-8.md?raw'
import content9 from './content/article-9.md?raw'

export const articles: ArticleDetail[] = [
  {
    id: 1,
    title: '用 Vite + Vue 3 从零搭建一个前端项目',
    category: 'Vue',
    categoryColor: '#42b883',
    tags: ['Vite', 'Vue3', 'TypeScript'],
    date: '2026-04-15',
    content: content1,
  },
  {
    id: 2,
    title: 'TypeScript 泛型完全指南（适合入门）',
    category: 'TypeScript',
    categoryColor: '#3178c6',
    tags: ['TypeScript', '泛型', '前端基础'],
    date: '2026-04-10',
    content: content2,
  },
  {
    id: 3,
    title: '使用 MSW 实现前端的完美 Mock 方案',
    category: '工具',
    categoryColor: '#e67e22',
    tags: ['MSW', 'Mock', '开发工具'],
    date: '2026-04-05',
    content: content3,
  },
  {
    id: 4,
    title: 'AI 对前端开发的影响与展望',
    category: '前沿',
    categoryColor: '#9b59b6',
    tags: ['AI', '前端开发', '趋势'],
    date: '2026-04-01',
    content: content4,
  },
  {
    id: 5,
    title: 'CSS Grid 布局实战指南',
    category: 'CSS',
    categoryColor: '#3498db',
    tags: ['CSS', 'Grid', '布局'],
    date: '2026-03-25',
    content: content5,
  },
  {
    id: 6,
    title: '前端工程化最佳实践',
    category: '工程化',
    categoryColor: '#e74c3c',
    tags: ['工程化', '最佳实践', '开发规范'],
    date: '2026-03-20',
    content: content6,
  },
  {
    id: 7,
    title: '前端性能优化的那些事儿',
    category: '性能',
    categoryColor: '#1abc9c',
    tags: ['性能', '优化', '用户体验'],
    date: '2026-03-15',
    content: content7,
  },
  {
    id: 8,
    title: '前端安全指南：防止 XSS 和 CSRF 攻击',
    category: '安全',
    categoryColor: '#34495e',
    tags: ['安全', 'XSS', 'CSRF'],
    date: '2026-03-10',
    content: content8,
  },
  {
    id: 9,
    title: 'OpenCode 配置完全指南：打造你的专属 AI 编程助手',
    category: '工具',
    categoryColor: '#e67e22',
    tags: ['OpenCode', 'AI', 'CLI', '配置'],
    date: '2026-06-11',
    content: content9,
  },
]
