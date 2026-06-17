## 什么是泛型？

泛型（Generics）允许我们在定义函数、接口或类时不预先指定具体类型，而是在使用时再指定。它是 TypeScript 类型系统中最强大、也最容易让新手困惑的特性之一。

## 基础语法

```typescript
function identity<T>(arg: T): T {
  return arg
}

// 使用时指定类型
const result = identity<string>('hello')
// 或者让 TS 自动推断
const result2 = identity(42) // T 推断为 number
```

## 泛型约束

有时我们希望限制泛型必须满足某些条件，使用 `extends` 关键字：

```typescript
interface HasLength {
  length: number
}

function logLength<T extends HasLength>(arg: T): number {
  return arg.length
}

logLength('hello')   // ✅ 字符串有 length
logLength([1, 2, 3]) // ✅ 数组有 length
// logLength(123)    // ❌ number 没有 length
```

## 实际应用场景

### 封装 API 请求

```typescript
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
```

## 小结

泛型让代码既保持灵活性，又不丢失类型安全。初学时可能觉得语法别扭，但一旦掌握，你会爱上它带来的开发体验提升。
