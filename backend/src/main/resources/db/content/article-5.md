## 为什么选择 Grid？

Flexbox 解决了单维布局的问题，但当我们需要同时控制行和列时，CSS Grid 才是真正的利器。

## 基础概念

Grid 布局由**容器**和**项目**组成：

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  gap: 16px;
}
```

### 核心属性速查

| 属性 | 作用 | 示例 |
|------|------|------|
| `grid-template-columns` | 定义列 | `repeat(3, 1fr)` |
| `grid-template-rows` | 定义行 | `auto 200px` |
| `gap` | 间距 | `16px` |
| `grid-area` | 项目跨区域 | `1 / 2 / 3 / 4` |

## 实战案例：博客首页布局

```css
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
```

## 与 Flexbox 的选择

- **一维布局**（单行或单列）→ Flexbox
- **二维布局**（同时控制行列）→ Grid
- 两者可以混合使用，取长补短

CSS Grid 的学习曲线略陡，但熟练掌握后，复杂的布局需求将迎刃而解。
