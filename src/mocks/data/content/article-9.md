## 什么是 OpenCode？

OpenCode 是一个交互式 CLI 工具，专为软件工程任务设计。它可以理解你的项目结构、阅读代码、执行命令、编辑文件，是日常开发中的得力 AI 助手。

> "OpenCode 不是替代你编码的工具，而是让你专注于更重要事情的伙伴。"

## 项目级配置：opencode.json

在项目根目录创建 `opencode.json` 即可自定义 OpenCode 的行为。完整配置结构如下：

```json
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
```

也支持使用 `opencode.jsonc` 格式，可以添加注释，方便团队协作时标注配置用途。

## 全局配置：~/.config/opencode/

除了项目级配置，OpenCode 还支持用户级别的全局配置，存放在 `~/.config/opencode/` 目录下：

```
~/.config/opencode/
├── opencode.json      # 全局默认配置
├── agents/            # 自定义 Agent 定义
├── skills/            # 全局 Skills
├── plugins/           # 插件目录
└── mcp_servers/       # MCP 服务配置
```

全局配置会被项目级配置覆盖，这样可以为不同项目定制不同的行为。

## Agent 与 Subagent

Agent 是 OpenCode 中最核心的概念。每个 Agent 有不同的职责和可用工具。

### 内置 Agent 类型

| Agent | 用途 | 典型场景 |
|-------|------|----------|
| `explore` | 代码库探索 | 搜索文件、查找定义、分析依赖 |
| `general` | 通用任务执行 | 多步骤操作、代码修改、命令执行 |

### 自定义 Subagent

你可以定义自己的 Subagent 来处理特定类型的任务：

```json
{
  "agents": {
    "code-reviewer": {
      "description": "代码审查助手",
      "tools": ["read", "glob", "grep", "bash"],
      "prompt": "你是一个代码审查专家，请仔细检查代码质量、安全性和最佳实践。"
    }
  }
}
```

## Skills 系统

Skills 是 OpenCode 的扩展机制，用于注入专门的指令和工作流。

### 内置 Skill

- **customize-opencode**：用于配置 OpenCode 自身的 skill，当编辑或创建 opencode 配置文件时自动加载。

### 创建自定义 Skill

在 `.opencode/skills/` 目录下创建 JSON 文件：

```json
{
  "name": "deploy-workflow",
  "description": "自动化部署流程",
  "tools": ["bash", "read", "write"],
  "instructions": "执行以下部署步骤：1. 运行测试 2. 构建项目 3. 部署到服务器"
}
```

## MCP 服务集成

**Model Context Protocol (MCP)** 让 OpenCode 可以与外部服务交互。

```json
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
```

通过 MCP，OpenCode 可以连接 GitHub、数据库、文件系统等外部资源，大幅扩展能力边界。

## 权限控制

OpenCode 提供细粒度的权限管理：

```json
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
```

## 实用技巧

### 1. 为不同分支定制配置

```bash
# 在 feature 分支使用更宽松的权限
git checkout -b feature/new-api
echo '{"permissions":{"allow":["*"]}}' > opencode.json
```

### 2. 团队共享配置模板

将 `opencode.json` 提交到 Git，团队成员 clone 后即可获得一致的开发体验。

### 3. 环境变量集成

```json
{
  "env": {
    "PROJECT_NAME": "my-app",
    "DEFAULT_BRANCH": "main"
  }
}
```

## 小结

OpenCode 的配置系统灵活而强大，合理配置能显著提升 AI 辅助编程的效率和安全性。建议从最小配置开始，根据实际需要逐步扩展。记住：配置越精准，AI 助手就越贴合你的工作流。
