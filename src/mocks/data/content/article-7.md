## 性能即体验

研究表明，页面加载时间每增加 1 秒，转化率可能下降 7%。前端性能优化不仅是技术问题，更直接影响业务。

## 优化策略

### 加载阶段

- **代码分割**：路由级别懒加载，按需加载资源
- **图片优化**：使用 WebP 格式，响应式图片，懒加载
- **资源压缩**：开启 Gzip/Brotli，压缩 JS/CSS

### 渲染阶段

```javascript
// 避免强制同步布局
const width = element.offsetWidth // 读
element.style.width = width + 'px' // 写
// 更好：使用 requestAnimationFrame 批量处理
```

### 运行时优化

- 使用 Vue 的 `v-memo` 或 React 的 `memo` 避免不必要的渲染
- 大列表使用虚拟滚动
- 合理使用 `debounce` 和 `throttle`

## 性能指标

重点关注三大核心指标：

| 指标 | 含义 | 目标 |
|------|------|------|
| LCP | 最大内容绘制 | < 2.5s |
| FID | 首次输入延迟 | < 100ms |
| CLS | 累计布局偏移 | < 0.1 |

## 小结

优化无止境，但要分清主次。先用 Lighthouse 找出瓶颈，再针对性优化，避免过早优化。
