/**
 * 极简 Markdown 解析器。
 *
 * 为什么自己写：模型天天输出 `**粗体**`、`- 列表`，直接塞进 `<text>` 就是一堆星号。
 * 但 uni-app App 端不能用 v-html，`<rich-text>` 的样式支持又只认内联 style、
 * 还不支持点击和主题变量，做出来的东西没法跟现有气泡配色对齐。
 * 干脆只解析我们真正会用到的那几种，转成结构化的块，用 view/text 自己画。
 *
 * 只认这些语法（够覆盖模型 95% 的输出，且不会误伤）：
 *   # ## ###   标题      - * •   无序列表
 *   1. 2.      有序列表   >       引用
 *   ---        分割线     **粗**  *斜*  `代码`
 *
 * 刻意不做：表格、图片、链接、嵌套列表、HTML。
 * 每多一种语法就多一块解析代码和一堆样式，而模型在手机宽度上画表格本来就不好看。
 */

export type MdInline = {
  /** text 普通 / b 粗 / i 斜 / code 行内代码 */
  t: "text" | "b" | "i" | "code"
  v: string
}

export type MdBlock =
  | { t: "p"; in: MdInline[] }
  | { t: "h"; lv: number; in: MdInline[] }
  | { t: "li"; ol: boolean; n: number; in: MdInline[] }
  | { t: "quote"; in: MdInline[] }
  | { t: "hr" }

/**
 * 行内标记。
 *
 * 正则里 `[^*\n]+` 这种"禁止跨行、禁止吞掉星号"的写法很重要：
 * 模型偶尔会输出 `**` 但没闭合，贪婪匹配会把后半段整篇吃成粗体。
 */
function parseInline(src: string): MdInline[] {
  const out: MdInline[] = []
  const re = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) out.push({ t: "text", v: src.slice(last, m.index) })
    const raw = m[0]
    if (raw.startsWith("**") || raw.startsWith("__")) {
      out.push({ t: "b", v: raw.slice(2, -2) })
    } else if (raw.startsWith("`")) {
      out.push({ t: "code", v: raw.slice(1, -1) })
    } else {
      out.push({ t: "i", v: raw.slice(1, -1) })
    }
    last = m.index + raw.length
  }
  if (last < src.length) out.push({ t: "text", v: src.slice(last) })
  return out.length ? out : [{ t: "text", v: src }]
}

export function parseMarkdown(src: string): MdBlock[] {
  const lines = String(src || "").replace(/\r\n/g, "\n").split("\n")
  const blocks: MdBlock[] = []
  let buf: string[] = []

  // 一段连续的非空行合成一个段落，段内的换行原样保留（靠 CSS pre-wrap 显示）
  const flush = () => {
    if (!buf.length) return
    blocks.push({ t: "p", in: parseInline(buf.join("\n")) })
    buf = []
  }

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "")
    const s = line.trim()

    if (!s) {
      flush()
      continue
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(s)) {
      flush()
      blocks.push({ t: "hr" })
      continue
    }
    const h = s.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      flush()
      blocks.push({ t: "h", lv: h[1].length, in: parseInline(h[2]) })
      continue
    }
    const q = s.match(/^>\s?(.*)$/)
    if (q) {
      flush()
      blocks.push({ t: "quote", in: parseInline(q[1]) })
      continue
    }
    const ul = s.match(/^[-*•]\s+(.*)$/)
    if (ul) {
      flush()
      blocks.push({ t: "li", ol: false, n: 0, in: parseInline(ul[1]) })
      continue
    }
    const ol = s.match(/^(\d{1,2})[.)]\s+(.*)$/)
    if (ol) {
      flush()
      blocks.push({ t: "li", ol: true, n: Number(ol[1]), in: parseInline(ol[2]) })
      continue
    }
    buf.push(line)
  }
  flush()
  return blocks
}
