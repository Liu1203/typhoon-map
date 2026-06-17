## 为什么需要前端工程化？

一个人写代码很自由，一群人写代码就需要规范。前端工程化解决的就是**团队协作效率**和**代码质量**的问题。

## 工程化体系四大支柱

### 1. 代码规范

- **ESLint**：代码质量检查，统一编码风格
- **Prettier**：代码格式化，减少团队争论
- **Husky + lint-staged**：在提交前自动检查

### 2. 构建工具

Vite 已成为主流选择，配合 TypeScript、CSS 预处理器，构建高效且可维护的前端项目。

### 3. 自动化测试

```
单元测试（Vitest）→ 组件测试 → E2E测试（Playwright）
```

测试覆盖率不追求 100%，但核心业务逻辑一定要有保障。

### 4. CI/CD

```yaml
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
```

## 小结

工程化不是一蹴而就的，应该根据团队规模和项目阶段逐步引入。小项目过度工程化反而会降低效率。
