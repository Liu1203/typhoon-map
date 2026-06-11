## 前言

最近在帮团队搭建新的前端项目，选择了 **Vite + Vue 3 + TypeScript** 这套技术栈。本文记录从零开始到完成基础配置的全过程，希望对同样在摸索的同学有帮助。

## 为什么选 Vite？

传统的 Webpack 项目启动慢、热更新卡顿，一直是前端开发的痛点。Vite 利用浏览器原生 ES Module 支持，实现了：

- **极速冷启动**：无需打包，直接启动开发服务器
- **毫秒级 HMR**：修改代码后几乎瞬间生效
- **开箱即用**：对 TypeScript、CSS 预处理器等都有内置支持

## 初始化项目

```bash
npm create vue@latest my-project
```

交互式选择需要的功能：

```
✔ TypeScript? … Yes
✔ JSX Support? … No
✔ Vue Router? … Yes
✔ Pinia? … Yes
✔ Vitest? … No
✔ ESLint? … Yes
```

## 配置路径别名

在 `vite.config.ts` 中配置 `@` 别名：

```ts
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
```

同时在 `tsconfig.json` 中也要配置对应路径，这样 TypeScript 才能正确识别。

## 总结

Vite 的零配置体验确实很好，新项目强烈建议直接上。下篇文章我会继续分享如何集成 UI 组件库和配置 Mock 服务。
