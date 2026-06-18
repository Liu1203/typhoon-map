-- 初始化管理员用户（密码: 123456, bcrypt 加密）
-- MERGE INTO 避免重复插入，不影响已有用户
MERGE INTO "user" (name, email, avatar, password, username, role) KEY(username)
VALUES ('清清', 'admin@example.com', '', '$2a$10$qfyl6VYgl0rGov0Fp5oaGeDXwSasjmW/Ybr8EoYVXY//ZQL7lH0mC', 'admin', 'admin');

-- 初始化文章数据（MERGE INTO 避免重复插入）
MERGE INTO article (id, title, content, category, category_color, tags, date, view_count, like_count) KEY(id) VALUES
(1, '用 Vite + Vue 3 从零搭建一个前端项目', '# 用 Vite + Vue 3 从零搭建一个前端项目

本文介绍如何从零开始搭建一个基于 Vite + Vue 3 的前端项目，包含路由、状态管理、UI 框架等最佳实践。', 'Vue', '#42b883', '["Vite","Vue3","TypeScript"]', '2026-04-15', 0, 0),
(2, 'TypeScript 泛型完全指南（适合入门）', '# TypeScript 泛型完全指南

泛型是 TypeScript 中最强大的特性之一，本文从基础到进阶全面讲解泛型的用法。', 'TypeScript', '#3178c6', '["TypeScript","泛型","前端基础"]', '2026-04-10', 0, 0),
(3, '使用 MSW 实现前端的完美 Mock 方案', '# 使用 MSW 实现前端 Mock

MSW (Mock Service Worker) 是一个优秀的 API Mock 工具，本文介绍如何在项目中使用 MSW。', '工具', '#e67e22', '["MSW","Mock","开发工具"]', '2026-04-05', 0, 0),
(4, 'AI 对前端开发的影响与展望', '# AI 与前端开发

AI 正在深刻改变前端开发的方方面面，从代码补全到自动化测试，AI 辅助编程已成为趋势。

2026 年，AI 编程助手已经成为开发者日常工具链中不可或缺的一部分。无论是 Cursor、GitHub Copilot 还是 OpenCode，都在大幅提升开发效率。', '前沿', '#9b59b6', '["AI","前端开发","趋势"]', '2026-04-01', 0, 0),
(5, 'CSS Grid 布局实战指南', '# CSS Grid 布局

CSS Grid 是现代的二维布局系统，本文通过实战案例带你掌握 Grid 布局的方方面面。', 'CSS', '#3498db', '["CSS","Grid","布局"]', '2026-03-25', 0, 0),
(6, '前端工程化最佳实践', '# 前端工程化

工程化是现代前端开发的基石，从代码规范到自动化构建，每一个环节都值得重视。', '工程化', '#e74c3c', '["工程化","最佳实践","开发规范"]', '2026-03-20', 0, 0),
(7, '前端性能优化的那些事儿', '# 前端性能优化

性能优化是用户体验的重要保障，本文总结了前端性能优化的常见手段和最佳实践。', '性能', '#1abc9c', '["性能","优化","用户体验"]', '2026-03-15', 0, 0),
(8, '前端安全指南：防止 XSS 和 CSRF 攻击', '# 前端安全指南

安全问题不容忽视，XSS 和 CSRF 是最常见的前端安全威胁，本文介绍如何有效防御。', '安全', '#34495e', '["安全","XSS","CSRF"]', '2026-03-10', 0, 0),
(9, 'OpenCode 配置完全指南：打造你的专属 AI 编程助手', '# OpenCode 配置指南

OpenCode 是一个强大的 AI 编程助手，通过合理配置可以大幅提升开发效率。', '工具', '#e67e22', '["OpenCode","AI","CLI","配置"]', '2026-06-11', 0, 0),
(10, 'React 18 新特性全面解析', '# React 18 新特性全面解析

React 18 是 React 的一次重大升级，带来了并发模式（Concurrent Mode）、自动批处理（Automatic Batching）、Suspense 改进等一系列重要更新。本文将逐一解析这些新特性，帮助你快速上手 React 18。

## 并发模式（Concurrent Mode）

并发模式是 React 18 最核心的更新。它允许 React 同时准备多个版本的 UI，根据设备性能和网络状况灵活调度渲染任务。

```jsx
import { useTransition } from "react";

function TabContainer() {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState("home");

  function selectTab(nextTab) {
    startTransition(() => {
      setTab(nextTab);
    });
  }

  return (
    <div>
      {isPending && <Spinner />}
      <TabButton onClick={() => selectTab("home")}>首页</TabButton>
      <TabButton onClick={() => selectTab("about")}>关于</TabButton>
    </div>
  );
}
```

`useTransition` 将状态更新标记为"过渡"，React 可以中断低优先级的渲染，优先响应用户交互。

## 自动批处理（Automatic Batching）

在 React 18 之前，只有 React 事件处理函数内的多个状态更新会被批处理。在 setTimeout、Promise 回调、原生事件中，每次 `setState` 都会触发一次重新渲染。

React 18 将批处理扩展到了所有场景：

```jsx
function handleClick() {
  // React 17: 触发 3 次渲染
  // React 18: 只触发 1 次渲染
  setTimeout(() => {
    setCount(c => c + 1);
    setFlag(f => !f);
    setText("hello");
  }, 0);
}
```

这显著减少了不必要的重新渲染，提升了应用性能。

## Suspense 改进

React 18 的 Suspense 支持服务端渲染（SSR）中的流式传输，以及嵌套的 Suspense 边界：

```jsx
<Suspense fallback={<Skeleton />}>
  <Comments />
  <Suspense fallback={<SidebarSkeleton />}>
    <Sidebar />
  </Suspense>
</Suspense>
```

外层 Suspense 处理 `Comments` 的加载，内层 Suspense 处理 `Sidebar` 的加载，两者互不影响。

## 新的 Hooks

- **useId**：生成唯一 ID，解决服务端渲染 hydration 不匹配问题
- **useTransition**：标记低优先级更新
- **useDeferredValue**：延迟更新非紧急值
- **useSyncExternalStore**：安全订阅外部数据源

## 升级指南

```bash
npm install react@18 react-dom@18
```

然后将 `ReactDOM.render` 替换为 `createRoot`：

```jsx
import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("root"));
root.render(<App />);
```

React 18 的并发特性需要使用 `createRoot` 才能启用，旧的 `ReactDOM.render` 会以兼容模式运行。', 'React', '#61dafb', '["React","React18","前端"]', '2026-03-01', 0, 0),
(11, 'Node.js Streams 深入理解', '# Node.js Streams 深入理解

Streams 是 Node.js 中处理大数据量的核心抽象。无论是读写文件、网络通信还是处理压缩数据，Streams 都能让你以流式方式处理数据，避免一次性加载全部内容到内存。

## 四种流类型

Node.js 内置了四种基本流类型：

- **Readable**：可读流，数据的来源（如 `fs.createReadStream`）
- **Writable**：可写流，数据的目的地（如 `fs.createWriteStream`）
- **Duplex**：双工流，可读可写（如 `net.Socket`）
- **Transform**：转换流，在读写过程中可修改数据（如 `zlib.createGzip`）

```js
const { Readable, Transform, Writable } = require("stream");

// 自定义可读流
const readStream = new Readable({
  read(size) {
    this.push("Hello ");
    this.push("World!");
    this.push(null); // 标记结束
  }
});

// 自定义转换流（转大写）
const upperCase = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  }
});

// 自定义可写流
const writeStream = new Writable({
  write(chunk, encoding, callback) {
    process.stdout.write(chunk);
    callback();
  }
});

readStream.pipe(upperCase).pipe(writeStream);
// 输出: HELLO WORLD!
```

## pipe 方法

`pipe` 是 Stream 的核心方法，它将可读流连接到可写流，自动处理数据流和背压：

```js
const fs = require("fs");
const zlib = require("zlib");

// 文件读取 -> 压缩 -> 写入
fs.createReadStream("input.txt")
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream("input.txt.gz"));
```

## 背压（Back Pressure）

当可写流处理速度跟不上可读流时，就会产生背压。`pipe` 方法会自动处理，但如果你想手动控制：

```js
const readable = getReadableStream();
const writable = getWritableStream();

readable.on("data", (chunk) => {
  const ok = writable.write(chunk);
  if (!ok) {
    readable.pause();
    writable.once("drain", () => {
      readable.resume();
    });
  }
});
```

## 异步迭代

Node.js 10+ 支持 `for await...of` 语法遍历流：

```js
const fs = require("fs");
const readline = require("readline");

const fileStream = fs.createReadStream("large-file.txt");
const rl = readline.createInterface({ input: fileStream });

for await (const line of rl) {
  console.log(line);
}
```

这种方式比 `pipe` 更直观，适合需要逐行处理的场景。

## 实用技巧

- 使用 `stream.pipeline` 替代 `pipe`，它能正确处理错误和清理
- `PassThrough` 流可以作为中间节点，在不修改数据的情况下透传
- 使用 `highWaterMark` 选项调整缓冲区大小，优化吞吐量

Streams 是 Node.js 的灵魂，掌握它能让你写出更高效、更优雅的代码。', 'Node.js', '#68a063', '["Node.js","Stream","后端"]', '2026-02-28', 0, 0),
(12, 'Tailwind CSS 实用技巧 20 条', '# Tailwind CSS 实用技巧 20 条

Tailwind CSS 的 utility-first 理念改变了前端样式开发方式。本文分享 20 个实用技巧，帮你更高效地使用 Tailwind。

## 响应式设计

1. **移动优先**：默认样式应用于移动端，用 `sm:`、`md:`、`lg:` 覆盖

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- 小屏1列，中屏2列，大屏3列 -->
</div>
```

2. **自定义断点**：在 `tailwind.config.js` 中扩展

```js
module.exports = {
  theme: {
    screens: {
      xs: "475px",
      ...defaultTheme.screens,
    },
  },
};
```

## 布局技巧

3. **Sticky Footer**：用 `min-h-screen` + `flex-col`

```html
<body class="flex flex-col min-h-screen">
  <header>固定头部</header>
  <main class="flex-1">内容区域</main>
  <footer>固定底部</footer>
</body>
```

4. **居中神器**：`grid place-items-center` 一行实现水平垂直居中

```html
<div class="grid place-items-center h-screen">
  <div>居中内容</div>
</div>
```

5. **文字截断**：`truncate` 同时设置 `overflow: hidden` 和 `text-overflow: ellipsis`

## 样式技巧

6. **hover 和 focus**：直接用 `hover:` 和 `focus:` 变体

```html
<button class="bg-blue-500 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300">
  按钮
</button>
```

7. **暗黑模式**：添加 `dark:` 前缀

```html
<div class="bg-white dark:bg-gray-900 text-black dark:text-white">
  自动适配暗黑模式
</div>
```

8. **分组悬停**：`group` + `group-hover:` 实现父元素悬停控制子元素

```html
<div class="group p-4 hover:bg-blue-50">
  <h3 class="group-hover:text-blue-600">标题</h3>
  <p class="group-hover:text-blue-400">描述</p>
</div>
```

## 动画与过渡

9. **过渡动画**：`transition-all` 或指定属性

```html
<div class="transition-all duration-300 ease-in-out hover:scale-105">
  悬停放大
</div>
```

10. **动画**：使用 `animate-` 前缀或自定义动画

```html
<div class="animate-bounce">弹跳动画</div>
```

## 组件化

11. **@apply 提取组件**：在 CSS 中复用 utility

```css
@layer components {
  .btn-primary {
    @apply bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors;
  }
}
```

12. **clsx 条件样式**：配合 clsx 库动态切换

```js
import clsx from "clsx";

<div class={clsx("p-4", isActive && "bg-blue-100", isDisabled && "opacity-50")} />;
```

## 性能优化

13. **JIT 模式**：Tailwind 3 默认启用 JIT，按需生成 CSS

14. **purge 配置**：生产环境自动移除未使用的样式

15. **safelist**：确保动态类名不被清除

## 实用工具类

16. **aspect-ratio**：保持元素宽高比
17. **scroll-snap**：实现丝滑滚动吸附
18. **backdrop-blur**：毛玻璃效果
19. **ring**：优雅的 focus 环
20. **line-clamp**：多行文本截断

掌握这些技巧，Tailwind CSS 将成为你最得力的样式工具。', 'CSS', '#38bdf8', '["Tailwind","CSS","样式"]', '2026-02-25', 0, 0),
(13, 'Docker 入门到实战：前端开发者版', '# Docker 入门到实战：前端开发者版

Docker 让环境一致性和部署变得简单。作为前端开发者，了解容器化技术能让你在团队协作和部署环节更加高效。

## 为什么前端需要 Docker

- **环境一致性**：开发、测试、生产环境完全一致
- **一键部署**：`docker build` + `docker run` 即可运行
- **微服务集成**：前后端分离项目中，前端可以独立容器化

## Dockerfile 编写

一个典型的前端项目 Dockerfile：

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**多阶段构建**的好处：构建产物小，最终镜像只包含 Nginx 和静态文件。

## Docker Compose

前后端项目用 Compose 编排：

```yaml
version: "3.8"
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - DB_URL=jdbc:h2:mem:blog
```

启动：`docker-compose up -d`

## 常用命令

```bash
# 构建镜像
docker build -t my-app .

# 运行容器
docker run -d -p 3000:80 my-app

# 查看日志
docker logs -f <container-id>

# 进入容器
docker exec -it <container-id> sh

# 清理未使用的资源
docker system prune -a
```

## 前端开发环境

使用 Docker 运行开发服务器：

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

配合 `docker-compose.yml` 的 volume 挂载，实现热重载：

```yaml
services:
  dev:
    build: .
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
```

## Nginx 配置

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Docker 不是前端的必修课，但掌握它能让你在全栈协作中游刃有余。', 'DevOps', '#2496ed', '["Docker","DevOps","部署"]', '2026-02-20', 0, 0),
(14, 'Pinia vs Vuex：状态管理终极对比', '# Pinia vs Vuex：状态管理终极对比

Vue 3 推荐使用 Pinia 替代 Vuex。两者在 API 设计、TypeScript 支持、性能上有何区别？本文从实际项目角度对比分析。

## API 设计对比

**Vuex** 需要通过 `commit` 和 `dispatch` 操作状态：

```js
// Vuex
const store = useStore();
store.commit("increment");
store.dispatch("fetchUser", id);
```

**Pinia** 直接调用方法：

```js
// Pinia
const counterStore = useCounterStore();
counterStore.increment();
await counterStore.fetchUser(id);
```

Pinia 的 API 更直观，没有 mutation 和 action 的区分。

## TypeScript 支持

Pinia 天然支持 TypeScript，store 的类型自动推导：

```ts
// Pinia - 类型自动推导
export const useUserStore = defineStore("user", () => {
  const name = ref<string>("");
  const age = ref<number>(0);
  const fullName = computed(() => `${name.value} (${age.value})`);

  async function fetchUser(id: number) {
    const data = await api.getUser(id);
    name.value = data.name;
    age.value = data.age;
  }

  return { name, age, fullName, fetchUser };
});
```

Vuex 需要额外的类型定义，使用 `Commit` 和 `Dispatch` 的类型声明比较繁琐。

## 模块化

Vuex 的模块系统需要嵌套注册：

```js
// Vuex 模块
const store = createStore({
  modules: {
    user: userModule,
    cart: cartModule,
  },
});
```

Pinia 天然支持模块化，每个 store 独立定义和使用：

```js
// Pinia - 每个 store 独立
const useUserStore = defineStore("user", () => { ... });
const useCartStore = defineStore("cart", () => { ... });

// 使用时按需引入
const userStore = useUserStore();
const cartStore = useCartStore();
```

## DevTools 支持

两者都支持 Vue DevTools，但 Pinia 的调试体验更好：
- 直接在 DevTools 中查看 store 状态
- 支持时间旅行调试
- store 之间的依赖关系可视化

## 性能对比

Pinia 更轻量：
- **包体积**：Pinia 约 1KB，Vuex 约 6KB
- **性能**：Pinia 没有 mutation 的同步限制，异步操作更灵活
- **SSR**：两者都支持，但 Pinia 的 SSR 实现更简洁

## 迁移建议

```bash
npm install pinia
```

```js
// main.js
import { createPinia } from "pinia";
app.use(createPinia());
```

Vuex 到 Pinia 的迁移可以渐进式进行，两者可以共存。

**结论**：新项目直接用 Pinia，老项目可以逐步迁移。Pinia 是 Vue 3 官方推荐的状态管理方案。', 'Vue', '#42b883', '["Pinia","Vuex","状态管理"]', '2026-02-15', 0, 0),
(15, 'Vitest 单元测试完全指南', '# Vitest 单元测试完全指南

Vitest 是基于 Vite 的极速测试框架，兼容 Jest API，是 Vue/React 项目的首选测试工具。本文从配置到高级用法全面介绍 Vitest。

## 快速开始

```bash
npm install -D vitest
```

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

## 基本用法

```ts
import { describe, it, expect, vi } from "vitest";
import { calculateTotal } from "./math";

describe("calculateTotal", () => {
  it("应该正确计算总价", () => {
    expect(calculateTotal(10, 5)).toBe(50);
  });

  it("数量为零时返回零", () => {
    expect(calculateTotal(10, 0)).toBe(0);
  });

  it("负数应抛出错误", () => {
    expect(() => calculateTotal(-1, 5)).toThrow("数量不能为负数");
  });
});
```

## Mock 与 Spy

```ts
import { vi, expect, it } from "vitest";
import { fetchUser } from "./api";
import * as api from "./api";

// Mock 整个模块
vi.mock("./api", () => ({
  fetchUser: vi.fn(),
}));

// Spy 某个方法
const spy = vi.spyOn(api, "fetchUser").mockResolvedValue({
  id: 1,
  name: "测试用户",
});

it("应返回用户数据", async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe("测试用户");
  expect(spy).toHaveBeenCalledWith(1);
});
```

## Vue 组件测试

```ts
import { mount } from "@vue/test-utils";
import Counter from "./Counter.vue";

describe("Counter", () => {
  it("点击按钮增加计数", async () => {
    const wrapper = mount(Counter);
    expect(wrapper.text()).toContain("0");

    await wrapper.find("button").trigger("click");
    expect(wrapper.text()).toContain("1");
  });
});
```

## 快照测试

```ts
it("组件渲染正确", () => {
  const wrapper = mount(MyComponent);
  expect(wrapper.html()).toMatchSnapshot();
});
```

运行 `vitest --update` 更新快照。

## 覆盖率

```bash
npx vitest run --coverage
```

配置覆盖率选项：

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules/", "test/"],
    },
  },
});
```

## 与 Jest 的区别

- **速度**：Vitest 基于 Vite，启动和热更新更快
- **配置**：复用 Vite 配置，无需重复设置
- **ESM 支持**：原生支持 ES Module
- **兼容性**：API 与 Jest 兼容，迁移成本低

Vitest 正在快速取代 Jest 成为 Vue 生态的首选测试框架。', '测试', '#729b1b', '["Vitest","测试","单元测试"]', '2026-02-10', 0, 0),
(16, 'WebSocket 实时通信从零实现', '# WebSocket 实时通信从零实现

从 HTTP 轮询到 WebSocket，本文带你从零实现一个实时聊天室，理解 WebSocket 的核心原理和最佳实践。

## HTTP 轮询的局限

传统的 HTTP 请求是单向的：客户端发起，服务端响应。要实现实时通信，只能用轮询：

- **短轮询**：定时发送请求，浪费带宽
- **长轮询**：服务端挂起连接直到有数据，但每次都要重新建立连接

WebSocket 解决了这些问题，提供了全双工通信通道。

## WebSocket 协议

WebSocket 基于 HTTP 协议升级：

```
GET /chat HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
```

服务端返回 `101 Switching Protocols` 后，连接从 HTTP 切换为 WebSocket 协议。

## 服务端实现（Node.js）

```js
const { WebSocketServer } = require("ws");
const http = require("http");

const server = http.createServer();
const wss = new WebSocketServer({ server });

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`新用户连接，当前在线: ${clients.size}`);

  ws.on("message", (data) => {
    const message = JSON.parse(data);
    // 广播给所有客户端
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          user: message.user,
          content: message.content,
          time: new Date().toISOString(),
        }));
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`用户断开，当前在线: ${clients.size}`);
  });
});

server.listen(8080, () => {
  console.log("WebSocket 服务器运行在 ws://localhost:8080");
});
```

## 客户端实现

```js
const ws = new WebSocket("ws://localhost:8080");

ws.onopen = () => {
  console.log("连接成功");
  ws.send(JSON.stringify({
    user: "用户A",
    content: "大家好！",
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`${data.user}: ${data.content}`);
};

ws.onclose = () => {
  console.log("连接断开");
};
```

## 心跳机制

防止连接意外断开：

```js
// 客户端
let heartbeatTimer;

ws.onopen = () => {
  heartbeatTimer = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send("ping");
    }
  }, 30000);
};

ws.onclose = () => {
  clearInterval(heartbeatTimer);
};
```

## 断线重连

```js
function connect() {
  const ws = new WebSocket("ws://localhost:8080");

  ws.onclose = () => {
    console.log("3 秒后重连...");
    setTimeout(connect, 3000);
  };

  ws.onerror = (err) => {
    console.error("连接错误:", err);
    ws.close();
  };
}

connect();
```

WebSocket 是实时应用的基础，掌握它能让你构建聊天、协作编辑、实时监控等应用。', '后端', '#f59e0b', '["WebSocket","实时通信","后端"]', '2026-02-05', 0, 0),
(17, '前端监控与错误追踪方案', '# 前端监控与错误追踪方案

线上问题难以复现，一套完善的前端监控系统能帮你快速定位和解决问题。本文介绍如何搭建前端监控体系。

## 监控体系架构

前端监控主要包括三个方面：

- **错误监控**：JS 运行时错误、资源加载失败、接口异常
- **性能监控**：页面加载时间、交互响应时间、资源大小
- **行为监控**：用户点击、页面访问、自定义事件

## 错误捕获

### 全局错误处理

```js
// 捕获未处理的 JS 错误
window.addEventListener("error", (event) => {
  reportError({
    type: "runtime",
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  });
});

// 捕获 Promise 未处理的 rejection
window.addEventListener("unhandledrejection", (event) => {
  reportError({
    type: "unhandledrejection",
    reason: event.reason?.message || String(event.reason),
    stack: event.reason?.stack,
  });
});
```

### 资源加载失败

```js
document.addEventListener("error", (event) => {
  if (event.target?.tagName) {
    reportError({
      type: "resource",
      target: event.target.tagName,
      src: event.target.src || event.target.href,
    });
  }
}, true);
```

## 性能指标采集

使用 Performance API 采集核心指标：

```js
function getPerformanceMetrics() {
  const paint = performance.getEntriesByType("paint");
  const navigation = performance.getEntriesByType("navigation")[0];

  return {
    // FCP: First Contentful Paint
    fcp: paint.find(e => e.name === "first-contentful-paint")?.startTime,
    // TTFB: Time to First Byte
    ttfb: navigation.responseStart - navigation.requestStart,
    // DOM Ready
    domReady: navigation.domContentLoadedEventEnd - navigation.startTime,
    // 页面完全加载
    load: navigation.loadEventEnd - navigation.startTime,
  };
}
```

## 自定义上报

```js
function reportError(data) {
  // 使用 sendBeacon 确保页面关闭前上报
  const blob = new Blob([JSON.stringify(data)], {
    type: "application/json",
  });
  navigator.sendBeacon("/api/error-report", blob);
}
```

`sendBeacon` 比 `fetch` 更可靠，即使页面关闭也能发送数据。

## Source Map 解析

生产环境使用压缩后的代码，错误堆栈难以阅读。配置 Source Map 解析：

```js
// 服务端解析 Source Map
const sourceMap = require("source-map");
const fs = require("fs");

async function parseStack(stack, mapFile) {
  const rawSourceMap = JSON.parse(fs.readFileSync(mapFile, "utf-8"));
  const consumer = await new sourceMap.SourceMapConsumer(rawSourceMap);

  // 解析每一行
  return stack.split("\n").map(line => {
    const match = line.match(/at (.+):(\d+):(\d+)/);
    if (!match) return line;

    const pos = consumer.originalPositionFor({
      line: parseInt(match[2]),
      column: parseInt(match[3]),
    });

    return `at ${pos.source}:${pos.line}:${pos.column}`;
  }).join("\n");
}
```

## 常用监控方案

- **Sentry**：开源的错误追踪平台，支持多种语言和框架
- **阿里云 ARMS**：前端监控服务，与阿里云生态深度集成
- **自建方案**：基于 ELK（Elasticsearch + Logstash + Kibana）搭建

完善的监控体系是保障线上质量的关键，不要等到出了问题才想起监控。', '性能', '#1abc9c', '["监控","错误追踪","性能"]', '2026-01-30', 0, 0),
(18, 'GraphQL vs REST API 如何选择', '# GraphQL vs REST API 如何选择

前后端数据交互的两大方案各有优劣，本文从实际项目角度对比分析，帮你做出正确的选择。

## REST API 回顾

REST 基于 HTTP 动词，资源通过 URL 表示：

```
GET    /api/users/1        获取用户
POST   /api/users          创建用户
PUT    /api/users/1        更新用户
DELETE /api/users/1        删除用户
```

**优点**：简单直观，缓存友好，生态成熟。

**问题**：Over-fetching（获取多余字段）和 Under-fetching（需要多次请求）。

## GraphQL 核心概念

GraphQL 用一个端点和声明式查询：

```graphql
query {
  user(id: 1) {
    name
    email
    posts {
      title
      comments {
        content
      }
    }
  }
}
```

一次请求获取所有需要的数据，精确指定字段。

## 对比分析

### 数据获取

**REST**：需要多个端点获取关联数据

```
GET /api/users/1
GET /api/users/1/posts
GET /api/users/1/posts/1/comments
```

**GraphQL**：一个请求获取所有数据

```graphql
query {
  user(id: 1) {
    name
    posts {
      title
      comments { content }
    }
  }
}
```

### 类型系统

GraphQL 内置强类型 Schema：

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
}
```

REST 需要额外的文档（如 Swagger）来描述接口。

### 缓存

**REST**：天然支持 HTTP 缓存（ETag、Cache-Control）。

**GraphQL**：通常使用 POST 请求，HTTP 缓存失效，需要客户端或应用层缓存（如 Apollo Client）。

## 适用场景

**选择 REST**：
- 简单的 CRUD 应用
- 需要 HTTP 缓存
- 团队对 REST 更熟悉
- 公开 API

**选择 GraphQL**：
- 复杂的关联数据查询
- 多端适配（Web、移动端、小程序）
- 前端需要灵活查询
- 微服务聚合层

## Apollo Client 示例

```js
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";

const client = new ApolloClient({
  uri: "/graphql",
  cache: new InMemoryCache(),
});

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      name
      email
    }
  }
`;

const { data } = await client.query({
  query: GET_USER,
  variables: { id: 1 },
});
```

没有银弹，选择适合项目需求的方案才是最好的。', 'API', '#e535ab', '["GraphQL","REST","API"]', '2026-01-25', 0, 0),
(19, 'Git 工作流最佳实践：Git Flow vs Trunk-Based', '# Git 工作流最佳实践

选择合适的 Git 工作流对团队协作效率至关重要。本文对比 Git Flow 和 Trunk-Based Development，帮你找到最适合的方案。

## Git Flow

Git Flow 是最经典的分支模型，有明确的分支角色：

```
main        ────●──────────●──────────●──────────
                │          ↑          ↑
release      ───┼──●───────┘          │
                │  │                  │
develop    ─────┼──●──●──●──●──●─────┼──●──●──
                   │     │     │     │     │
feature        ────●     ●     ●     ●     ●
```

- **main**：生产环境代码
- **develop**：开发集成分支
- **feature/**：功能分支
- **release/**：发布准备分支
- **hotfix/**：紧急修复分支

**优点**：分支职责清晰，适合版本发布周期较长的项目。

**缺点**：分支多、合并频繁，发布周期长。

## Trunk-Based Development

Trunk-Based 开发强调短生命期的特性分支，频繁合入主干：

```
main    ────●──●──●──●──●──●──●──●──
              │  ↑  │  ↑  │  ↑  │
feature   ────●──┘  ●──┘  ●──┘  ●──┘
  1天       2天    1天    3天
```

核心原则：
- 特性分支存活时间不超过 **2 天**
- 通过 **Feature Flag** 控制功能上线
- 持续集成，每天多次合入

**优点**：减少合并冲突，快速集成，持续交付。

**缺点**：需要完善的测试和 Feature Flag 管理。

## 如何选择

| 维度 | Git Flow | Trunk-Based |
|------|----------|-------------|
| 发布周期 | 周/月 | 天/小时 |
| 团队规模 | 大团队 | 小到中团队 |
| 分支寿命 | 长（天-周） | 短（小时-天） |
| 合并频率 | 低 | 高 |
| 适合场景 | 版本发布、维护项目 | 快速迭代、SaaS 产品 |

## 实际建议

1. **大多数团队**推荐 Trunk-Based，配合 Feature Flag
2. **有固定发布节奏**的项目可以用 Git Flow 的简化版
3. **无论如何**，保持分支短命、频繁集成是核心原则

```bash
# Trunk-Based 的分支操作
git checkout main
git pull
git checkout -b feature/login  # 创建特性分支
# 开发...
git checkout main
git merge feature/login         # 快速合入
git branch -d feature/login     # 删除分支
```

好的工作流是团队协作的润滑剂，选择适合你们团队的方案。', '工程化', '#e74c3c', '["Git","工作流","团队协作"]', '2026-01-20', 0, 0),
(20, 'Electron 桌面应用开发入门', '# Electron 桌面应用开发入门

用 Web 技术构建跨平台桌面应用，Electron 让前端开发者也能做桌面端。本文从零开始介绍 Electron 的核心概念和开发流程。

## Electron 架构

Electron 基于 Chromium 和 Node.js，应用由两部分组成：

- **主进程（Main Process）**：Node.js 环境，负责窗口管理、系统交互
- **渲染进程（Renderer Process）**：Chromium 环境，负责 UI 渲染

```
┌─────────────────────────────┐
│        主进程 (Main)          │
│  ┌───────────┐ ┌───────────┐ │
│  │ 窗口 1    │ │ 窗口 2    │ │
│  │(渲染进程) │ │(渲染进程) │ │
│  └───────────┘ └───────────┘ │
└─────────────────────────────┘
```

## 快速开始

```bash
npm init -y
npm install electron --save-dev
```

```json
{
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}
```

```js
// main.js
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);
```

## IPC 通信

主进程和渲染进程通过 IPC（进程间通信）交互：

```js
// main.js
const { ipcMain } = require("electron");

ipcMain.handle("get-system-info", async () => {
  return {
    platform: process.platform,
    version: process.version,
    memory: process.memoryUsage(),
  };
});
```

```js
// renderer.js
const info = await window.electronAPI.getSystemInfo();
console.log(info);
```

## 预加载脚本

推荐使用 `contextBridge` 安全地暴露 API：

```js
// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getSystemInfo: () => ipcRenderer.invoke("get-system-info"),
  openFile: () => ipcRenderer.invoke("dialog:openFile"),
});
```

## 打包发布

使用 electron-builder 打包：

```bash
npm install electron-builder --save-dev
```

```json
{
  "build": {
    "appId": "com.example.myapp",
    "win": { "target": "nsis" },
    "mac": { "target": "dmg" },
    "linux": { "target": "AppImage" }
  }
}
```

```bash
npx electron-builder --win --mac --linux
```

## 注意事项

- **安全**：生产环境禁用 `nodeIntegration`，使用 `contextIsolation`
- **包体积**：基础包约 80MB，考虑使用 electron-forge 优化
- **更新**：使用 electron-updater 实现自动更新

Electron 是 Web 技术进入桌面端的桥梁，适合构建工具类、效率类桌面应用。', '工具', '#47848f', '["Electron","桌面应用","跨平台"]', '2026-01-15', 0, 0),
(21, '微前端架构实践：qiankun 方案详解', '# 微前端架构实践：qiankun 方案详解

大型前端项目拆分为多个独立子应用，qiankun 是基于 single-spa 的微前端实现方案。本文详解 qiankun 的原理和实践。

## 什么是微前端

微前端将前端巨石应用拆分为多个小型、独立的子应用：

- **独立开发**：不同团队维护不同子应用
- **独立部署**：每个子应用独立构建和发布
- **技术无关**：子应用可以使用不同的框架
- **增量升级**：逐步迁移老技术栈

## qiankun 核心概念

```
┌──────────────────────────────────┐
│           主应用（基座）            │
│  ┌─────────┐ ┌─────────┐         │
│  │ 子应用 A │ │ 子应用 B │  ...   │
│  │ (React) │ │ (Vue)   │         │
│  └─────────┘ └─────────┘         │
└──────────────────────────────────┘
```

## 主应用配置

```bash
npm install qiankun
```

```js
// main-app.js
import { registerMicroApps, start } from "qiankun";

registerMicroApps([
  {
    name: "react-app",
    entry: "//localhost:3001",
    container: "#subapp-container",
    activeRule: "/react",
  },
  {
    name: "vue-app",
    entry: "//localhost:3002",
    container: "#subapp-container",
    activeRule: "/vue",
  },
]);

start();
```

```html
<div id="subapp-container"></div>
```

## 子应用改造

子应用需要导出生命周期钩子：

```js
// React 子应用
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

let root = null;

function render(props) {
  const { container } = props;
  const dom = container
    ? container.querySelector("#root")
    : document.getElementById("root");

  root = ReactDOM.createRoot(dom);
  root.render(<App />);
}

export async function bootstrap() {
  console.log("子应用已激活");
}

export async function mount(props) {
  render(props);
}

export async function unmount() {
  root?.unmount();
}
```

## 跨应用通信

使用 globalState 进行主子应用通信：

```js
// 主应用
import { initGlobalState } from "qiankun";

const actions = initGlobalState({
  user: null,
  theme: "light",
});

actions.onGlobalStateChange((state) => {
  console.log("状态变化:", state);
});

// 子应用
export function mount(props) {
  const { onGlobalStateChange, setGlobalState } = props;

  onGlobalStateChange((state) => {
    console.log("收到状态:", state);
  });

  // 修改全局状态
  setGlobalState({ user: "张三" });
}
```

## CSS 隔离方案

qiankun 提供两种 CSS 隔离：

- **strictStyleIsolation**：Shadow DOM 隔离（推荐）
- **experimentalStyleIsolation**：CSS 作用域隔离

```js
registerMicroApps(apps, {
  sandbox: {
    strictStyleIsolation: true,
  },
});
```

## 注意事项

- **预加载**：空闲时预加载子应用，提升切换速度
- **全局状态**：避免过度使用，保持子应用独立性
- **路由管理**：主应用控制路由，子应用使用相对路径

微前端不是银弹，只在真正需要独立部署和技术异构时才考虑。', '架构', '#8b5cf6', '["微前端","qiankun","架构"]', '2026-01-10', 0, 0);

-- 初始化评论数据（MERGE INTO 避免重复插入）
MERGE INTO comment (id, article_id, author, author_avatar, content, parent_id, created_at) KEY(id) VALUES
(1, 1, '小明', NULL, '写得很详细，Vite 确实是目前最好的选择。想问一下你用的是 pnpm 还是 npm？', NULL, '2026-04-15 10:30:00'),
(2, 1, '博主', 'https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg', '用的 pnpm，速度快很多，建议试试~', 1, '2026-04-15 11:00:00'),
(3, 2, '小红', NULL, '泛型的 extends 约束那段写得特别好，终于理解了！', NULL, '2026-04-11 08:15:00'),
(4, 9, '阿强', NULL, 'opencode.json 里的 permissions 配置是只对当前项目生效吗？', NULL, '2026-06-11 15:20:00'),
(5, 9, '博主', 'https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg', '是的，opencode.json 是项目级配置，只对当前项目生效。全局配置放在 ~/.config/opencode/opencode.json。', 4, '2026-06-11 16:00:00'),
(6, 9, '阿强', NULL, '明白了，那项目配置和全局配置可以同时使用吗？', 4, '2026-06-11 16:30:00');

-- 初始化随想数据（MERGE INTO 避免重复插入）
MERGE INTO thought (id, content, tags, created_at) KEY(id) VALUES
(1, '今天试了一下 Vue 3 的 Suspense，在异步组件加载场景下体验很好，配合 `<Suspense>` + `<template #fallback>` 可以优雅处理 loading 状态。', '["Vue","前端"]', '2026-06-12 14:30:00'),
(2, '最近在重读《深入理解 TypeScript》，对条件类型和 infer 关键字有了更深的理解。类型编程的本质其实就是类型层面的函数式编程。', '["TypeScript","读书"]', '2026-06-11 09:15:00'),
(3, 'CSS Container Queries 终于普及了！以后再也不用 Media Queries 在不同组件上下文里猜尺寸了，容器查询才是组件化时代的正确方案。', '["CSS","前端"]', '2026-06-10 16:45:00'),
(4, '看到一个观点：程序员最好的学习方式是写出来——写博客、写开源、写小工具。教是最好的学，深以为然。', '["思考","成长"]', '2026-06-09 20:00:00'),
(5, '推荐一个 Vite 插件：vite-plugin-inspect，可以查看每个模块的编译中间态，对调试构建流程非常有帮助。', '["Vite","工具"]', '2026-06-08 11:20:00'),
(6, '刚把项目从 Vue 3.4 升级到 3.5，defineProps 的响应式解构终于正式可用了！代码简洁很多，不用再写一堆 computed 来解构 props。', '["Vue","前端"]', '2026-06-07 10:00:00'),
(7, '读了一篇关于 Web 性能指标的文章，才发现 INP (Interaction to Next Paint) 已经成为 Core Web Vitals 之一了。对交互响应的要求越来越高。', '["性能","Web"]', '2026-06-06 15:30:00'),
(8, '用了几天 Cursor IDE，AI 辅助编程确实能提高效率。但感觉关键还是人要清楚自己要写什么，AI 更擅长补全和重构。', '["AI","工具"]', '2026-06-05 08:45:00'),
(9, 'Vue 3 的 Teleport 真是个好东西 —— 用在对话框和弹出层场景，不用再担心 z-index 和父容器 overflow:hidden 的问题了。', '["Vue","前端"]', '2026-06-04 17:10:00'),
(10, '开始尝试在项目中使用 Vuetify 的 Virtual Scroller 来处理大数据列表。1 万条数据的滚动比之前用分页流畅太多。', '["性能","Vue"]', '2026-06-03 13:25:00'),
(11, '写了一些小的 Node.js 脚本来自动化日常任务（批量重命名、图片压缩、文件同步）。CLI 工具虽然小众，但确实能省很多时间。', '["Node.js","工具"]', '2026-06-02 09:00:00'),
(12, '一个值得养成的习惯：每次修完 bug 都写一条测试。虽然当时看起来多花了时间，但长期来看大大减少了回归 bug。', '["测试","工程化"]', '2026-06-01 19:30:00'),
(13, '今天尝试用 Chrome DevTools 的 Performance 面板排查了一次页面卡顿。通过火焰图发现是一个 useEffect 里触发了不必要的重渲染。', '["性能","调试"]', '2026-05-30 15:00:00'),
(14, '关于前端状态管理的一个感悟：不是所有的状态都需要放进全局 store。组件内 useState / ref 足够时，别为了"优雅"而过度设计。', '["前端","架构"]', '2026-05-28 11:45:00'),
(15, '最近在研究 WebAssembly，用 Rust 写了一个处理字符串的模块在浏览器里跑，性能比纯 JS 提升了 3-5 倍。可惜目前调试体验还是不太行。', '["WebAssembly","Rust","性能"]', '2026-05-25 20:15:00');
