import type { ArticleDetail } from '@/api/article'

export const articles: ArticleDetail[] = [
  {
    id: 1,
    title: '用 Vite + Vue 3 从零搭建一个前端项目',
    category: 'Vue',
    categoryColor: '#42b883',
    tags: ['Vite', 'Vue3', 'TypeScript'],
    date: '2026-04-15',
    content: `## 前言

最近在帮团队搭建新的前端项目，选择了 **Vite + Vue 3 + TypeScript** 这套技术栈。本文记录从零开始到完成基础配置的全过程，希望对同样在摸索的同学有帮助。

## 为什么选 Vite？

传统的 Webpack 项目启动慢、热更新卡顿，一直是前端开发的痛点。Vite 利用浏览器原生 ES Module 支持，实现了：

- **极速冷启动**：无需打包，直接启动开发服务器
- **毫秒级 HMR**：修改代码后几乎瞬间生效
- **开箱即用**：对 TypeScript、CSS 预处理器等都有内置支持

## 初始化项目

\`\`\`bash
npm create vue@latest my-project
\`\`\`

交互式选择需要的功能：

\`\`\`
✔ TypeScript? … Yes
✔ JSX Support? … No
✔ Vue Router? … Yes
✔ Pinia? … Yes
✔ Vitest? … No
✔ ESLint? … Yes
\`\`\`

## 配置路径别名

在 \`vite.config.ts\` 中配置 \`@\` 别名：

\`\`\`ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
\`\`\`

同时在 \`tsconfig.json\` 中也要配置对应路径，这样 TypeScript 才能正确识别。

## 总结

Vite 的零配置体验确实很好，新项目强烈建议直接上。下篇文章我会继续分享如何集成 UI 组件库和配置 Mock 服务。`
  },
  {
    id: 2,
    title: 'TypeScript 泛型完全指南（适合入门）',
    category: 'TypeScript',
    categoryColor: '#3178c6',
    tags: ['TypeScript', '泛型', '前端基础'],
    date: '2026-04-10',
    content: `## 什么是泛型？

泛型（Generics）允许我们在定义函数、接口或类时不预先指定具体类型，而是在使用时再指定。它是 TypeScript 类型系统中最强大、也最容易让新手困惑的特性之一。

## 基础语法

\`\`\`typescript
function identity<T>(arg: T): T {
  return arg
}

// 使用时指定类型
const result = identity<string>('hello')
// 或者让 TS 自动推断
const result2 = identity(42) // T 推断为 number
\`\`\`

## 泛型约束

有时我们希望限制泛型必须满足某些条件，使用 \`extends\` 关键字：

\`\`\`typescript
interface HasLength {
  length: number
}

function logLength<T extends HasLength>(arg: T): number {
  return arg.length
}

logLength('hello')   // ✅ 字符串有 length
logLength([1, 2, 3]) // ✅ 数组有 length
// logLength(123)    // ❌ number 没有 length
\`\`\`

## 实际应用场景

### 封装 API 请求

\`\`\`typescript
interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  const res = await axios.get(url)
  return res.data
}

// 使用时自动推导类型
const userRes = await fetchData<User>('/api/user/1')
// userRes.data 的类型就是 User
\`\`\`

## 小结

泛型让代码既保持灵活性，又不丢失类型安全。初学时可能觉得语法别扭，但一旦掌握，你会爱上它带来的开发体验提升。`
  },
  {
    id: 3,
    title: '使用 MSW 实现前端的完美 Mock 方案',
    category: '工具',
    categoryColor: '#e67e22',
    tags: ['MSW', 'Mock', '开发工具'],
    date: '2026-04-05',
    content: `## 为什么需要 Mock？

前端开发经常需要等待后端接口就绪，严重影响开发效率。传统的 Mock 方案如 mock.js 通过在代码层拦截请求，虽然能用，但存在几个问题：

- 在 Network 面板看不到请求，调试困难
- 和真实请求行为不一致
- 需要修改业务代码

## MSW 是什么？

**Mock Service Worker** 利用浏览器 Service Worker API，在网络层拦截请求并返回模拟数据。特点是：

- ✅ 真实的 HTTP 请求，Network 可见
- ✅ 业务代码零侵入
- ✅ 同时支持 REST 和 GraphQL
- ✅ 可在浏览器和 Node.js 中使用

## 快速上手

安装依赖：

\`\`\`bash
npm install msw --save-dev
npx msw init public/ --save
\`\`\`

定义接口处理逻辑：

\`\`\`typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json({
      code: 200,
      data: [{ id: 1, name: '张三' }],
      message: 'success'
    })
  })
]
\`\`\`

在入口文件启动：

\`\`\`typescript
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

const worker = setupWorker(...handlers)
await worker.start()
\`\`\`

## 总结

MSW 是目前前端 Mock 的最佳实践之一，它让你在本地开发时拥有与对接真实后端几乎一致的体验。强烈建议在你的下一个项目中尝试。`
  },
  {
    id: 4,
    title: 'AI 对前端开发的影响与展望',
    category: '前沿',
    categoryColor: '#9b59b6',
    tags: ['AI', '前端开发', '趋势'],
    date: '2026-04-01',
    content: `## AI 正在重塑前端开发

2025 年以来，AI 辅助编程工具已经从前沿概念变成了日常开发的一部分。作为前端开发者，我们需要思考 AI 将如何改变我们的工作方式。

## 当前的应用场景

### 代码生成与补全

GitHub Copilot、Cursor 等工具可以根据注释或上下文自动生成代码，在写组件、处理表单、请求 API 等重复性工作中特别高效。

### 设计稿转代码

一些工具已经能够将设计稿截图直接转换为可用的 HTML/CSS 代码，虽然还不够完美，但已经能显著减少切图时间。

### 智能调试

AI 可以帮助分析错误日志，定位问题根源，甚至给出修复建议。

## 前端的未来

> "AI 不会取代前端工程师，但会用 AI 的前端工程师会取代不会用的。"

我认为未来前端开发者需要具备这些能力：

- **架构设计能力**：AI 擅长实现细节，但整体架构需要人来把控
- **AI 工具运用**：善于利用 AI 提高效率，而非完全依赖
- **跨领域知识**：前端边界不断扩展，Node.js、数据库、DevOps 等都需要了解

## 小结

保持好奇心，拥抱变化，AI 是我们的工具而非对手。`
  },
  {
    id: 5,
    title: 'CSS Grid 布局实战指南',
    category: 'CSS',
    categoryColor: '#3498db',
    tags: ['CSS', 'Grid', '布局'],
    date: '2026-03-25',
    content: `## 为什么选择 Grid？

Flexbox 解决了单维布局的问题，但当我们需要同时控制行和列时，CSS Grid 才是真正的利器。

## 基础概念

Grid 布局由**容器**和**项目**组成：

\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  gap: 16px;
}
\`\`\`

### 核心属性速查

| 属性 | 作用 | 示例 |
|------|------|------|
| \`grid-template-columns\` | 定义列 | \`repeat(3, 1fr)\` |
| \`grid-template-rows\` | 定义行 | \`auto 200px\` |
| \`gap\` | 间距 | \`16px\` |
| \`grid-area\` | 项目跨区域 | \`1 / 2 / 3 / 4\` |

## 实战案例：博客首页布局

\`\`\`css
.blog-layout {
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  min-height: 100vh;
}
\`\`\`

## 与 Flexbox 的选择

- **一维布局**（单行或单列）→ Flexbox
- **二维布局**（同时控制行列）→ Grid
- 两者可以混合使用，取长补短

CSS Grid 的学习曲线略陡，但熟练掌握后，复杂的布局需求将迎刃而解。`
  },
  {
    id: 6,
    title: '前端工程化最佳实践',
    category: '工程化',
    categoryColor: '#e74c3c',
    tags: ['工程化', '最佳实践', '开发规范'],
    date: '2026-03-20',
    content: `## 为什么需要前端工程化？

一个人写代码很自由，一群人写代码就需要规范。前端工程化解决的就是**团队协作效率**和**代码质量**的问题。

## 工程化体系四大支柱

### 1. 代码规范

- **ESLint**：代码质量检查，统一编码风格
- **Prettier**：代码格式化，减少团队争论
- **Husky + lint-staged**：在提交前自动检查

### 2. 构建工具

Vite 已成为主流选择，配合 TypeScript、CSS 预处理器，构建高效且可维护的前端项目。

### 3. 自动化测试

\`\`\`
单元测试（Vitest）→ 组件测试 → E2E测试（Playwright）
\`\`\`

测试覆盖率不追求 100%，但核心业务逻辑一定要有保障。

### 4. CI/CD

\`\`\`yaml
# GitHub Actions 示例
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci && npm run build
      - run: npm run deploy
\`\`\`

## 小结

工程化不是一蹴而就的，应该根据团队规模和项目阶段逐步引入。小项目过度工程化反而会降低效率。`
  },
  {
    id: 7,
    title: '前端性能优化的那些事儿',
    category: '性能',
    categoryColor: '#1abc9c',
    tags: ['性能', '优化', '用户体验'],
    date: '2026-03-15',
    content: `## 性能即体验

研究表明，页面加载时间每增加 1 秒，转化率可能下降 7%。前端性能优化不仅是技术问题，更直接影响业务。

## 优化策略

### 加载阶段

- **代码分割**：路由级别懒加载，按需加载资源
- **图片优化**：使用 WebP 格式，响应式图片，懒加载
- **资源压缩**：开启 Gzip/Brotli，压缩 JS/CSS

### 渲染阶段

\`\`\`javascript
// 避免强制同步布局
const width = element.offsetWidth // 读
element.style.width = width + 'px' // 写
// 更好：使用 requestAnimationFrame 批量处理
\`\`\`

### 运行时优化

- 使用 Vue 的 \`v-memo\` 或 React 的 \`memo\` 避免不必要的渲染
- 大列表使用虚拟滚动
- 合理使用 \`debounce\` 和 \`throttle\`

## 性能指标

重点关注三大核心指标：

| 指标 | 含义 | 目标 |
|------|------|------|
| LCP | 最大内容绘制 | < 2.5s |
| FID | 首次输入延迟 | < 100ms |
| CLS | 累计布局偏移 | < 0.1 |

## 小结

优化无止境，但要分清主次。先用 Lighthouse 找出瓶颈，再针对性优化，避免过早优化。`
  },
  {
    id: 8,
    title: '前端安全指南：防止 XSS 和 CSRF 攻击',
    category: '安全',
    categoryColor: '#34495e',
    tags: ['安全', 'XSS', 'CSRF'],
    date: '2026-03-10',
    content: `## 前端安全不容忽视

前端安全往往被开发者忽视，但一旦出问题，后果可能非常严重。本文介绍两种最常见的 Web 攻击及防御方案。

## XSS（跨站脚本攻击）

攻击者向页面注入恶意脚本，窃取用户信息或执行非授权操作。

### 常见攻击方式

\`\`\`html
<!-- 反射型 XSS -->
http://example.com/search?q=<script>alert('xss')</script>
\`\`\`

### 防御措施

- **输出编码**：对用户输入进行 HTML 实体转义
- **CSP（内容安全策略）**：限制脚本来源
- **HttpOnly Cookie**：防止 JS 读取敏感 Cookie
- 使用 Vue/React 时，它们默认会对 \`{{ }}\` 插值进行转义

## CSRF（跨站请求伪造）

攻击者诱导用户在已登录的状态下，向目标网站发送恶意请求。

### 防御方案

- **SameSite Cookie**：设置 \`SameSite=Strict\`
- **CSRF Token**：每次请求携带随机 Token
- **验证 Referer**：检查请求来源

## 小结

安全是开发的基本功，不应该是事后补丁。养成安全意识，从每一次编码开始。`
  },
  {
    id: 9,
    title: 'OpenCode 配置完全指南：打造你的专属 AI 编程助手',
    category: '工具',
    categoryColor: '#e67e22',
    tags: ['OpenCode', 'AI', 'CLI', '配置'],
    date: '2026-06-11',
    content: `## 什么是 OpenCode？

OpenCode 是一个交互式 CLI 工具，专为软件工程任务设计。它可以理解你的项目结构、阅读代码、执行命令、编辑文件，是日常开发中的得力 AI 助手。

> "OpenCode 不是替代你编码的工具，而是让你专注于更重要事情的伙伴。"

## 项目级配置：opencode.json

在项目根目录创建 \`opencode.json\` 即可自定义 OpenCode 的行为。完整配置结构如下：

\`\`\`json
{
  "name": "my-project",
  "version": "1.0.0",
  "agents": {
    "explorer": {
      "description": "代码探索助手",
      "tools": ["read", "glob", "grep"]
    }
  },
  "skills": [
    {
      "name": "customize-opencode",
      "location": "<built-in>"
    }
  ],
  "plugins": [],
  "mcp_servers": [],
  "permissions": {
    "allow": ["read", "write"],
    "deny": ["delete"]
  }
}
\`\`\`

也支持使用 \`opencode.jsonc\` 格式，可以添加注释，方便团队协作时标注配置用途。

## 全局配置：~/.config/opencode/

除了项目级配置，OpenCode 还支持用户级别的全局配置，存放在 \`~/.config/opencode/\` 目录下：

\`\`\`
~/.config/opencode/
├── opencode.json      # 全局默认配置
├── agents/            # 自定义 Agent 定义
├── skills/            # 全局 Skills
├── plugins/           # 插件目录
└── mcp_servers/       # MCP 服务配置
\`\`\`

全局配置会被项目级配置覆盖，这样可以为不同项目定制不同的行为。

## Agent 与 Subagent

Agent 是 OpenCode 中最核心的概念。每个 Agent 有不同的职责和可用工具。

### 内置 Agent 类型

| Agent | 用途 | 典型场景 |
|-------|------|----------|
| \`explore\` | 代码库探索 | 搜索文件、查找定义、分析依赖 |
| \`general\` | 通用任务执行 | 多步骤操作、代码修改、命令执行 |

### 自定义 Subagent

你可以定义自己的 Subagent 来处理特定类型的任务：

\`\`\`json
{
  "agents": {
    "code-reviewer": {
      "description": "代码审查助手",
      "tools": ["read", "glob", "grep", "bash"],
      "prompt": "你是一个代码审查专家，请仔细检查代码质量、安全性和最佳实践。"
    }
  }
}
\`\`\`

## Skills 系统

Skills 是 OpenCode 的扩展机制，用于注入专门的指令和工作流。

### 内置 Skill

- **customize-opencode**：用于配置 OpenCode 自身的 skill，当编辑或创建 opencode 配置文件时自动加载。

### 创建自定义 Skill

在 \`.opencode/skills/\` 目录下创建 JSON 文件：

\`\`\`json
{
  "name": "deploy-workflow",
  "description": "自动化部署流程",
  "tools": ["bash", "read", "write"],
  "instructions": "执行以下部署步骤：1. 运行测试 2. 构建项目 3. 部署到服务器"
}
\`\`\`

## MCP 服务集成

**Model Context Protocol (MCP)** 让 OpenCode 可以与外部服务交互。

\`\`\`json
{
  "mcp_servers": [
    {
      "name": "github",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "$GITHUB_TOKEN"
      }
    }
  ]
}
\`\`\`

通过 MCP，OpenCode 可以连接 GitHub、数据库、文件系统等外部资源，大幅扩展能力边界。

## 权限控制

OpenCode 提供细粒度的权限管理：

\`\`\`json
{
  "permissions": {
    "allow": [
      "read",           // 允许读取文件
      "write",          // 允许写入文件
      "bash:*",         // 允许所有 shell 命令
      "glob",           // 允许文件搜索
      "grep"            // 允许内容搜索
    ],
    "deny": [
      "bash:rm",        // 禁止删除命令
      "bash:git push"   // 禁止推送
    ]
  }
}
\`\`\`

## 实用技巧

### 1. 为不同分支定制配置

\`\`\`bash
# 在 feature 分支使用更宽松的权限
git checkout -b feature/new-api
echo '{"permissions":{"allow":["*"]}}' > opencode.json
\`\`\`

### 2. 团队共享配置模板

将 \`opencode.json\` 提交到 Git，团队成员 clone 后即可获得一致的开发体验。

### 3. 环境变量集成

\`\`\`json
{
  "env": {
    "PROJECT_NAME": "my-app",
    "DEFAULT_BRANCH": "main"
  }
}
\`\`\`

## 小结

OpenCode 的配置系统灵活而强大，合理配置能显著提升 AI 辅助编程的效率和安全性。建议从最小配置开始，根据实际需要逐步扩展。记住：配置越精准，AI 助手就越贴合你的工作流。`
  }
]