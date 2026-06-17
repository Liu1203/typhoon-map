-- 初始化管理员用户（密码: 123456, bcrypt 加密）
INSERT INTO "user" (name, email, avatar, password, username)
VALUES ('清清', 'admin@example.com', '', '123456', 'admin');

-- 初始化文章数据
INSERT INTO article (id, title, content, category, category_color, tags, date) VALUES
(1, '用 Vite + Vue 3 从零搭建一个前端项目', '# 用 Vite + Vue 3 从零搭建一个前端项目

本文介绍如何从零开始搭建一个基于 Vite + Vue 3 的前端项目，包含路由、状态管理、UI 框架等最佳实践。', 'Vue', '#42b883', '["Vite","Vue3","TypeScript"]', '2026-04-15'),
(2, 'TypeScript 泛型完全指南（适合入门）', '# TypeScript 泛型完全指南

泛型是 TypeScript 中最强大的特性之一，本文从基础到进阶全面讲解泛型的用法。', 'TypeScript', '#3178c6', '["TypeScript","泛型","前端基础"]', '2026-04-10'),
(3, '使用 MSW 实现前端的完美 Mock 方案', '# 使用 MSW 实现前端 Mock

MSW (Mock Service Worker) 是一个优秀的 API Mock 工具，本文介绍如何在项目中使用 MSW。', '工具', '#e67e22', '["MSW","Mock","开发工具"]', '2026-04-05'),
(4, 'AI 对前端开发的影响与展望', '# AI 与前端开发

AI 正在深刻改变前端开发的方方面面，从代码补全到自动化测试，AI 辅助编程已成为趋势。

2026 年，AI 编程助手已经成为开发者日常工具链中不可或缺的一部分。无论是 Cursor、GitHub Copilot 还是 OpenCode，都在大幅提升开发效率。', '前沿', '#9b59b6', '["AI","前端开发","趋势"]', '2026-04-01'),
(5, 'CSS Grid 布局实战指南', '# CSS Grid 布局

CSS Grid 是现代的二维布局系统，本文通过实战案例带你掌握 Grid 布局的方方面面。', 'CSS', '#3498db', '["CSS","Grid","布局"]', '2026-03-25'),
(6, '前端工程化最佳实践', '# 前端工程化

工程化是现代前端开发的基石，从代码规范到自动化构建，每一个环节都值得重视。', '工程化', '#e74c3c', '["工程化","最佳实践","开发规范"]', '2026-03-20'),
(7, '前端性能优化的那些事儿', '# 前端性能优化

性能优化是用户体验的重要保障，本文总结了前端性能优化的常见手段和最佳实践。', '性能', '#1abc9c', '["性能","优化","用户体验"]', '2026-03-15'),
(8, '前端安全指南：防止 XSS 和 CSRF 攻击', '# 前端安全指南

安全问题不容忽视，XSS 和 CSRF 是最常见的前端安全威胁，本文介绍如何有效防御。', '安全', '#34495e', '["安全","XSS","CSRF"]', '2026-03-10'),
(9, 'OpenCode 配置完全指南：打造你的专属 AI 编程助手', '# OpenCode 配置指南

OpenCode 是一个强大的 AI 编程助手，通过合理配置可以大幅提升开发效率。', '工具', '#e67e22', '["OpenCode","AI","CLI","配置"]', '2026-06-11');

-- 初始化评论数据
INSERT INTO comment (id, article_id, author, author_avatar, content, parent_id, created_at) VALUES
(1, 1, '小明', NULL, '写得很详细，Vite 确实是目前最好的选择。想问一下你用的是 pnpm 还是 npm？', NULL, '2026-04-15 10:30:00'),
(2, 1, '博主', 'https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg', '用的 pnpm，速度快很多，建议试试~', 1, '2026-04-15 11:00:00'),
(3, 2, '小红', NULL, '泛型的 extends 约束那段写得特别好，终于理解了！', NULL, '2026-04-11 08:15:00'),
(4, 9, '阿强', NULL, 'opencode.json 里的 permissions 配置是只对当前项目生效吗？', NULL, '2026-06-11 15:20:00'),
(5, 9, '博主', 'https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg', '是的，opencode.json 是项目级配置，只对当前项目生效。全局配置放在 ~/.config/opencode/opencode.json。', 4, '2026-06-11 16:00:00'),
(6, 9, '阿强', NULL, '明白了，那项目配置和全局配置可以同时使用吗？', 4, '2026-06-11 16:30:00');

-- 重置自增 ID，避免与硬编码 ID 冲突
ALTER TABLE "user" ALTER COLUMN id RESTART WITH 100;
ALTER TABLE article ALTER COLUMN id RESTART WITH 100;
ALTER TABLE comment ALTER COLUMN id RESTART WITH 100;
ALTER TABLE thought ALTER COLUMN id RESTART WITH 100;

-- 初始化随想数据
INSERT INTO thought (id, content, tags, created_at) VALUES
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
