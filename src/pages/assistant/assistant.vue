<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from "vue"
import {
  AgentError,
  abortAsk,
  askAgentStream,
  clearSession,
  detectLocation,
  getAgentBase,
  getCachedLocation,
  setAgentBase,
  type AgentErrorKind,
  type AgentEvent,
  type AgentLocation,
} from "@/api/agent"
import { CACHE } from "@/config"
import Icon from "@/components/Icon.vue"
import Robot from "@/components/Robot.vue"
import { parseMarkdown, type MdBlock } from "@/utils/markdown"
import { answerOffline } from "@/utils/offlineAnswer"

interface MsgAction {
  /** typhoon：查台风路径；page：跳 App 内某个页面；retry：把上一个问题重发一次 */
  type: "typhoon" | "page" | "retry"
  /** 4 位台风编号，如 2411 */
  id?: string
  /** 中文名，仅用于链接文案；模型可以不给 */
  name?: string
  /** retry 用：要重发的那句提问。存下来才不会点旧气泡却重发了最新的问题 */
  text?: string
  /** page 用：页面名，必须命中白名单 */
  page?: string
  /** page 用：已过滤的 query 参数 */
  params?: Record<string, string>
  /** 按钮文字，模型给的；为空就用页面默认文案 */
  label?: string
}

interface Msg {
  role: "user" | "assistant"
  text: string
  steps: string[]
  error?: boolean
  /** 软失败：后端没答上来，用正常气泡 + 拟人话术，不露任何技术细节 */
  soft?: boolean
  /** 连续失败两次以上才出现的一行小字（给"后台没开"这种情况留个台阶） */
  hint?: string
  /** 回答底部那个可点链接，后端约定标记解析出来的 */
  action?: MsgAction | null
  /** 打字结束后才填：把 text 解析成的渲染块。为空就按纯文本显示 */
  blocks?: MdBlock[] | null
}

const messages = ref<Msg[]>([])
const input = ref("")
const loading = ref(false)
const intoView = ref("")
const serverBase = ref("")

const location = ref<AgentLocation | null>(null)
const locating = ref(false)
const locFailed = ref(false)

/**
 * 对话记录落盘。
 * 页面一退出 messages 就被回收，所以必须自己存 —— 服务端的上下文还在（sessionId 存着），
 * 但屏幕上不显示出来，用户就会以为"全丢了"。
 */
const HISTORY_KEY = "agent_chat_history"
const HISTORY_LIMIT = 60 // 只留最近 60 条，别让 storage 无限膨胀

/**
 * 助手在回答末尾用一行业务标记表示"这里可以跳转"：
 *   [[open:typhoon?ty=2411|查看「摩羯」路径图]]
 *   [[open:radar|看雷达回波]]
 *
 * 为什么用标记而不是让后端直接发事件：现在的请求是一次性 POST，
 * 事件只能在整轮跑完才一起回来，跟正文对不上；而标记天然长在正文里，
 * 位置、数量、要不要给，都交给模型判断，前端只负责把它变成可点的一条链接。
 *
 * 白名单是必须的：模型会编页面名（open:settings、open:index?tab=2 之类），
 * 没有白名单就只能靠"跳不过去时静默失败"兜底 —— 用户看到一个点了没反应的按钮，
 * 比没有按钮更糟。所以这里宁可少给，也不给一个跳不过去的。
 */
const PAGE_ROUTES: Record<string, { route: string; keys?: string[]; label: string }> = {
  typhoon: { route: "/pages/typhoon/typhoon", keys: ["ty"], label: "查看台风路径" },
  city: { route: "/pages/index/index", keys: ["name"], label: "看这个城市的天气" },
  radar: { route: "/pages/radar/radar", label: "看雷达回波" },
  satellite: { route: "/pages/satellite/satellite", label: "看卫星云图" },
  earthquake: { route: "/pages/earthquake/earthquake", label: "看地震信息" },
  alerts: { route: "/pages/alerts/alerts", label: "看天气预警" },
  astronomy: { route: "/pages/astronomy/astronomy", label: "看观星天文" },
  ocean: { route: "/pages/ocean/ocean", label: "看海洋预报" },
  calendar: { route: "/pages/calendar/calendar", label: "看天气日历" },
}

/** 旧协议：1.4.39 之前一直是 open_typhoon，模型和旧回答里都还可能出现 */
const ACTION_LEGACY_RE = /\[\[\s*open_typhoon\s*[:：]\s*([0-9]{3,8})\s*(?:\|\s*([^\]\n|]{1,20}?))?\s*\]\]/gi
const ACTION_RE = /\[\[\s*open\s*[:：]\s*([^\]\n]{1,120})\]\]/gi

/** query 串解析：`ty=2411&name=杭州`，逗号也认（模型有时写成 name=杭州,ty=2411） */
function parseQuery(q: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const seg of q.split(/[&,]/)) {
    const i = seg.indexOf("=")
    if (i <= 0) continue
    const k = seg.slice(0, i).trim().toLowerCase()
    const v = seg.slice(i + 1).trim()
    if (k && v) out[k] = v
  }
  return out
}

/** 把 `page?query|label` 变成可执行的 action；任何一步不像话就返回 null */
function parseOpen(payload: string): MsgAction | null {
  const bar = payload.indexOf("|")
  const head = (bar >= 0 ? payload.slice(0, bar) : payload).trim()
  const label = (bar >= 0 ? payload.slice(bar + 1) : "").trim().slice(0, 16)

  const qm = head.indexOf("?")
  const page = (qm >= 0 ? head.slice(0, qm) : head).trim().toLowerCase()
  const def = PAGE_ROUTES[page]
  if (!def) return null // 模型编的页面名，直接不给按钮

  let params = parseQuery(qm >= 0 ? head.slice(qm + 1) : "")
  // 只留这个页面认识的参数，别把乱七八糟的东西带进页面
  if (def.keys) {
    params = Object.fromEntries(Object.entries(params).filter(([k]) => def.keys!.includes(k)))
  } else {
    params = {}
  }

  if (page === "typhoon") {
    const ty = (params.ty || "").replace(/\D/g, "").slice(0, 8)
    if (ty.length < 3) return null
    return { type: "typhoon", id: ty, name: label, label }
  }

  if (page === "city") {
    const name = (params.name || "").replace(/[^\u4e00-\u9fa5A-Za-z]/g, "").slice(0, 12)
    if (name.length < 2) return null
    return { type: "page", page, params: { name }, label }
  }

  return { type: "page", page, params, label }
}

/**
 * 流式过程中"边收边显示"用：把标记实时拿走。
 *
 * 打字机模式下标记是拿到完整答复后一次性抠掉的，流式模式没有那个时机 ——
 * 不处理的话，用户会亲眼看着 `[[open:radar|看雷达回波]]` 一个字一个字地打出来。
 * 所以两条都要做：已闭合的整段删掉，末尾还没闭合的 `[[...` 先藏起来。
 */
function stripLive(s: string): string {
  return s
    .replace(ACTION_LEGACY_RE, "")
    .replace(ACTION_RE, "")
    .replace(/\[{1,2}[^\]\n]*$/, "")
    .replace(/\s+$/, "") // 标记被拿走后会留下一堆空行，气泡高度会一跳一跳
}

function extractAction(full: string): { text: string; action: MsgAction | null } {
  const hits: MsgAction[] = []

  // 旧协议先跑：open_typhoon 也符合下面的通用正则，先换成统一形式，避免被重复匹配
  const unified = full.replace(ACTION_LEGACY_RE, (_m, id: string, name?: string) => {
    return `[[open:typhoon?ty=${String(id)}|${(name || "").trim()}]]`
  })

  const text = unified
    .replace(ACTION_RE, (_m, payload: string) => {
      const action = parseOpen(payload)
      if (action) hits.push(action)
      return ""
    })
    .replace(/[ \t]+$/gm, "") // 标记被抠掉后留下的行尾空白
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return { text, action: hits[0] || null }
}

function actionLabel(a: MsgAction): string {
  if (a.type === "retry") return "再问一次"
  // 模型给的文案通常最贴合上下文（"看杭州今天的雨"），只在它没给时才用兜底文案
  if (a.label) return a.label
  if (a.type === "typhoon") {
    const who = a.name ? `「${a.name}」` : ` ${a.id} 号`
    return `查看${who}路径图`
  }
  return (a.page && PAGE_ROUTES[a.page]?.label) || "去看看"
}

/** 长按气泡复制原文。复制 Markdown 原文而不是渲染后的文字，贴到别处还能保留结构 */
function copyMsg(m: Msg) {
  if (!m.text) return
  uni.setClipboardData({
    data: m.text,
    success: () => uni.showToast({ title: "已复制", icon: "none" }),
  })
}

function openAction(a: MsgAction) {
  if (a.type === "retry") {
    retryWith(a.text)
    return
  }
  if (a.type === "typhoon" && a.id) {
    uni.navigateTo({ url: "/pages/typhoon/typhoon?ty=" + encodeURIComponent(a.id) })
    return
  }
  if (a.type !== "page" || !a.page) return

  const def = PAGE_ROUTES[a.page]
  if (!def) return

  if (a.page === "city") {
    const name = a.params?.name || ""
    if (!name) return
    // 换城市走的是"回首页"而不是再 push 一个首页：reLaunch 之后返回键不会堆出三层首页，
    // 聊天记录在 storage 里，用户点悬浮球回来接着聊。
    try {
      uni.setStorageSync(CACHE.CITY_KEY, name)
      uni.setStorageSync(CACHE.CITY_SRC_KEY, "manual")
    } catch {}
    uni.reLaunch({ url: def.route })
    return
  }

  const qs = a.params && Object.keys(a.params).length
    ? "?" + Object.entries(a.params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&")
    : ""
  uni.navigateTo({ url: def.route + qs })
}

/**
 * 后端没答上来时说的话。
 *
 * 原则：不做技术解释、不甩 URL、不说"错误码"。机器人可以笨、可以困，
 * 但不能让用户觉得"这软件出故障了" —— 前者是角色，后者是事故。
 * 每种原因准备几句，随机挑，避免每次同一句显得像坏掉了。
 */
const OOPS: Record<AgentErrorKind, string[]> = {
  offline: [
    "唔……我伸手去够，什么都没摸到。好像是我这边断线了。",
    "我的信号飘走了，暂时想不动事情。",
    "我敲了敲门，屋里没人应。等一下再喊我一声好吗？",
  ],
  timeout: [
    "我想得有点久，想着想着睡着了……再问一次我就醒着答。",
    "这个问题把我卡住了，我脑子转得有点慢。",
  ],
  server: [
    "我打了个喷嚏，把刚想好的答案弄丢了。",
    "我脑袋里咔哒了一下，没接上。",
    "我有点笨，刚才那一步没走通。",
  ],
  busy: [
    "你问得有点快，我还没跟上。缓一下再问我一次。",
    "我这边有点忙，脑子排着队呢。",
  ],
  // 停止不是故障，只是"我决定不说了"，所以语气要平静，别像在道歉
  stopped: ["好，我不说了。", "行，停在这儿。", "嗯，不查了。"],
}

function pickOops(kind: AgentErrorKind): string {
  const pool = OOPS[kind] || OOPS.server
  return pool[Math.floor(Math.random() * pool.length)]
}

/** 连续失败计数：同一句话反复失败，才值得提示"是不是后台没开" */
let failStreak = 0

/** 从 storage 恢复 action：页面名要重新过一遍白名单，旧数据里的脏东西一律丢掉 */
function normalizeAction(raw: any): MsgAction | null {
  if (!raw || typeof raw !== "object") return null
  const label = typeof raw.label === "string" ? raw.label : ""

  if (raw.type === "retry") {
    return { type: "retry", text: typeof raw.text === "string" ? raw.text : "" }
  }
  if (raw.type === "typhoon" && raw.id) {
    return { type: "typhoon", id: String(raw.id), name: String(raw.name || ""), label }
  }
  if (raw.type === "page" && typeof raw.page === "string" && PAGE_ROUTES[raw.page]) {
    const params: Record<string, string> = {}
    if (raw.params && typeof raw.params === "object") {
      for (const [k, v] of Object.entries(raw.params)) {
        if (typeof v === "string") params[k] = v
      }
    }
    return { type: "page", page: raw.page, params, label }
  }
  return null
}

function loadHistory(): Msg[] {
  try {
    const raw = uni.getStorageSync(HISTORY_KEY)
    if (!Array.isArray(raw)) return []
    return raw
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
      .map((m: any) => {
        // 打字中途被杀掉时，存下来的文本末尾会带光标块，恢复时洗掉（兼容新旧两种字符）
        const text = String(m.text).replace(/[▌▏]+$/, "")
        return {
          role: m.role as Msg["role"],
          text,
          steps: Array.isArray(m.steps) ? m.steps.filter((s: any) => typeof s === "string") : [],
          error: !!m.error,
          soft: !!m.soft,
          hint: typeof m.hint === "string" ? m.hint : "",
          // 恢复时现解析：旧记录没存 blocks，重启后也能正常显示粗体和列表
          blocks: text.trim() ? parseMarkdown(text) : null,
          action: normalizeAction(m.action),
        }
      })
      // 提问存了但答复没等到（中途退出/被杀）时，别留一个空气泡
      .filter((m) => m.role === "user" || m.text.trim() !== "")
  } catch {
    return []
  }
}

function saveHistory() {
  try {
    // 转成普通对象再存：reactive 代理直接交给原生序列化不一定所有平台都吃得下
    const plain = messages.value.slice(-HISTORY_LIMIT).map((m) => ({
      role: m.role,
      text: m.text,
      steps: [...m.steps],
      error: !!m.error,
      soft: !!m.soft,
      hint: m.hint || "",
      action: m.action || null,
    }))
    uni.setStorageSync(HISTORY_KEY, plain)
  } catch {}
}

function clearHistory() {
  try {
    uni.removeStorageSync(HISTORY_KEY)
  } catch {}
}

onMounted(() => {
  serverBase.value = getAgentBase()
  messages.value = loadHistory()
  if (messages.value.length) scrollToBottom()
  // 先用上次的坐标垫上，界面立刻就有反馈；再异步刷新一次
  location.value = getCachedLocation()
  refreshLocation()
})

/** 重新定位。force=false 时命中 5 分钟缓存就直接返回，不打断用户 */
async function refreshLocation(force = false) {
  if (locating.value) return
  locating.value = true
  try {
    const loc = await detectLocation(force)
    location.value = loc
    locFailed.value = !loc
  } finally {
    locating.value = false
  }
}

const locLabel = computed(() => {
  if (locating.value) return "定位中…"
  if (location.value) return location.value.city || "当前位置"
  return locFailed.value ? "未取得定位 · 点此重试" : "等待定位"
})

/** 换了电脑或换了 Tailscale 节点名时才需要改，地址本身是固定的 */
function editServer() {
  uni.showModal({
    title: "助手服务地址",
    editable: true,
    placeholderText: "https://14.tail21dada.ts.net",
    content: serverBase.value,
    success(r: { confirm: boolean; content?: string }) {
      if (!r.confirm) return
      setAgentBase(r.content || "")
      serverBase.value = getAgentBase()
      uni.showToast({ title: "已保存", icon: "none" })
    },
  })
}

const canSend = computed(() => !!input.value.trim() && !loading.value)

const SUGGESTIONS = ["哪一年的台风最强", "明天下午三点会下雨吗", "今晚适合观星吗", "北京空气质量怎么样"]

/** 把工具调用翻译成人话，展示在气泡上方 */
const TOOL_LABEL: Record<string, string> = {
  get_weather: "查实时天气",
  get_forecast: "查天气预报",
  get_hourly: "查逐小时",
  get_sun_moon: "查日出日落",
  get_air_quality: "查空气质量",
  get_typhoon_history: "查台风历史",
  calculate: "计算",
}

/** 需要地点才能查的工具；没传城市时说明用的是手机定位 */
const GEO_TOOLS = new Set(["get_weather", "get_forecast", "get_hourly", "get_sun_moon", "get_air_quality"])

function describeEvent(e: AgentEvent): string {
  if (e.type !== "tool_call") return ""
  let args: Record<string, any> = {}
  try {
    args = JSON.parse(e.args || "{}")
  } catch {}
  const label = TOOL_LABEL[e.name || ""] || e.name || "调用工具"
  // 台风查询要抓几十个接口、耗时几秒，把年份范围显示出来，用户才知道它在忙什么
  if (e.name === "get_typhoon_history") {
    const range = args.to_year ? `${args.from_year}-${args.to_year}` : `${args.from_year}`
    return `${label} · ${range} 年`
  }
  if (args.city) return `${label} · ${args.city}`
  if (e.name && GEO_TOOLS.has(e.name)) return `${label} · ${location.value?.city || "当前位置"}`
  return label
}

/**
 * 滚到底部。
 *
 * uni-app 的 scroll-into-view 只在【值发生变化】时才滚，所以必须"清空 → 再赋值"。
 * 但打字时每几十毫秒就要滚一次，多个调用会互相穿插：
 * A 刚把 intoView 设成 ""，B 又设成 ""，等两边先后设回 anchor 时值没变，
 * 这一次滚动就被吞掉了 —— 表现就是"停在中间不动"。
 * 所以加一道串行闸门：同一时刻只跑一轮，期间来的请求只记个 flag，结束后补一轮。
 */
let scrolling = false
let scrollAgain = false
/** 打字过程中必须关掉滚动动画，否则每 26ms 重启一次 200ms 的动画，反而更卡 */
const smoothScroll = ref(true)

async function scrollToBottom(animated = true) {
  smoothScroll.value = animated
  if (scrolling) {
    scrollAgain = true
    return
  }
  scrolling = true
  try {
    do {
      scrollAgain = false
      intoView.value = ""
      await nextTick()
      intoView.value = "bottom-anchor"
      await nextTick()
    } while (scrollAgain)
  } finally {
    scrolling = false
  }
}

/**
 * 打字机效果：逐字把答复显示出来。
 *
 * 注意这是"拿到完整答复后再逐字播放"，不是真正的模型 token 流式 ——
 * 真流式要服务端 SSE + 客户端分块接收（uni.request 的 enableChunked），
 * 在 App 端还有 UTF-8 跨块截断的风险，没有真机验证前不冒这个险。
 * 视觉上是同一个效果，差别只是第一个字出现的时间。
 *
 * 按"每 26ms 推进一批字"来播放：短答复一批 1~2 个字，看得出在敲；
 * 长答复按比例加大批量，否则几百字要敲半分钟。
 */
const TYPING_TICK_MS = 26
const TYPING_MIN_MS = 520 // 太短的答复也要有"打字"过程，否则一闪而过
const TYPING_MAX_MS = 3600 // 长答复封顶

/**
 * 一轮问答的控制位。
 * skip：用户又问了新问题，上一条别再慢慢敲了，立刻说完。
 * cancel：用户按了停止，这一轮的结果直接丢掉。
 */
interface RunCtl {
  skip: boolean
  cancel: boolean
}

/** 当前这一轮的序号。只有最新一轮才有权改 loading / 打字状态 */
let ctl: RunCtl | null = null

async function reveal(target: Msg, full: string, mine?: RunCtl) {
  const total = full.length
  if (total <= 2) {
    target.text = full
    return
  }

  // 基准 30ms/字：短答复能看清一个个冒出来；超过封顶时长就自动加大每批的字数
  const duration = Math.min(TYPING_MAX_MS, Math.max(TYPING_MIN_MS, total * 30))
  const perTick = Math.max(1, Math.ceil((total * TYPING_TICK_MS) / duration))

  let shown = 0
  while (shown < total) {
    if (mine?.skip) {
      // 跳字：不播了，直接给全文。比"上一条还在敲、下一条已经在转圈"正常得多
      target.text = full
      scrollToBottom(false)
      return
    }
    shown = Math.min(total, shown + perTick)
    // 末尾带一个光标块，一眼就能看出"还在写"，而不是文字突然变多
    // 用 ▏（1/8 宽的块）而不是 ▌（1/2 宽），细一点更像个光标而不是色块
    target.text = shown < total ? full.slice(0, shown) + "▏" : full
    // 每吐一批字就贴一次底，让新字始终出现在屏幕最下方
    scrollToBottom(false)
    await new Promise((r) => setTimeout(r, TYPING_TICK_MS))
  }
  target.text = full
}

async function send(preset?: string) {
  const content = (preset ?? input.value).trim()
  if (!content || loading.value) return

  input.value = ""
  messages.value.push({ role: "user", text: content, steps: [] })
  await run(content)
}

/**
 * 重发一次提问：把这条提问之后的气泡（那条失败的）删掉再问。
 * 不新增「你」的消息 —— 用户点的是"再问一次"，不是又说了一遍。
 */
function retryWith(question?: string) {
  if (loading.value) return
  const q = (question || "").trim()
  if (!q) return
  let idx = -1
  for (let i = messages.value.length - 1; i >= 0; i--) {
    if (messages.value[i].role === "user" && messages.value[i].text === q) {
      idx = i
      break
    }
  }
  if (idx >= 0) messages.value.splice(idx + 1)
  run(q)
}

/**
 * 停止生成。
 *
 * 为什么值得单独做一个按钮：模型回答一次要几秒到十几秒，
 * 用户常在"发现它答偏了"的瞬间就想掐掉，但界面上没有任何出口 ——
 * 结果是他退出去、等十几秒、回来看一个没用的答案，钱也照扣。
 */
function onStop() {
  if (!loading.value) return
  if (ctl) ctl.cancel = true
  abortAsk() // 断 HTTP → 服务端顺着 AbortSignal 掐掉模型生成
  // 立刻解锁输入，不等 abort 的 fail 回调回来（真机上那一下可能有几百毫秒）
  loading.value = false
}

async function run(content: string) {
  // 上一条还在打字：让它立刻说完，别两条同时在敲
  if (ctl) ctl.skip = true
  const mine: RunCtl = { skip: false, cancel: false }
  ctl = mine
  /** 只有最新一轮才有权改全局状态，否则"停止 → 立刻再问"会把新一轮的 loading 关掉 */
  const current = () => ctl === mine

  // 必须是 reactive：逐字改 text 时要能触发重绘，
  // 普通对象只有当 loading 变化时才会顺带刷新一次，做不了打字机
  const target = reactive<Msg>({ role: "assistant", text: "", steps: [] })
  messages.value.push(target)
  saveHistory() // 先把提问存下：台风查询要十几秒，中途切走也别丢
  if (current()) loading.value = true
  await scrollToBottom()

  try {
    // 首次提问时定位可能还没回来，等它一下（有缓存会立刻返回，不会明显拖慢）
    if (!location.value) location.value = await detectLocation()

    // raw 是带标记的全文，target.text 是"显示用"的（实时抠掉标记）
    let raw = ""
    let streamed = false

    const res = await askAgentStream(content, location.value, {
      // 服务端给的是"累计全文"，不是增量：直接整段替换，
      // 这样即使中途有一轮旁白被作废（文本变短），也不会留下脏字
      onText(full) {
        if (!full) {
          raw = ""
          target.text = ""
          return
        }
        streamed = true
        raw = full
        target.text = stripLive(full)
        scrollToBottom(false)
      },
      onSteps(steps) {
        const labels = steps
          .map((s) => describeEvent({ type: "tool_call", name: s.name, args: s.args }))
          .filter(Boolean)
        // 整段替换而不是 push：同一个请求可能被重放，push 会越叠越长
        if (labels.length !== target.steps.length) {
          target.steps.splice(0, target.steps.length, ...labels)
        }
      },
    })

    // 回退路径（分块不可用的平台）才有事件，流式路径的成分已经在 onToolCall 里加过了
    for (const e of res.events || []) {
      const step = describeEvent(e)
      if (step) target.steps.push(step)
    }

    // 先解锁输入再去播放动画，用户不用干等打字播完
    if (current()) loading.value = false

    // 标记必须在打字之前抠掉，否则会一个字一个字地"打"出一串方括号
    const { text, action } = extractAction(res.reply || raw || "")
    const body = text || "（服务没有返回内容）"

    if (mine.cancel) {
      // 抢在结果回来之后才按的停止：不播字了，直接给全文，省掉最后几秒等待
      target.text = body
      target.hint = "已停止"
    } else if (streamed) {
      // 已经边收边显示了，最后只需要把标记那次删减后的结果对齐一下
      target.text = body
    } else {
      await reveal(target, body, mine)
    }

    // 打完字再把链接递出来：先出正文、再出按钮，顺序跟人说话一致
    target.action = action
    // 富文本也在这时候挂上：打字期间保持纯文本，避免 `**` 一闪一闪
    target.blocks = parseMarkdown(target.text)
    failStreak = 0
  } catch (err) {
    // 真实原因只进控制台。界面上给一句拟人化的话 + 一个「再问一次」，
    // 用户看到的是"机器人卡住了"，不是"连不上 http://192.168.x.x:8787"
    console.warn("[agent] 请求失败：", err)
    const kind: AgentErrorKind = err instanceof AgentError ? err.kind : "server"
    // 先解锁输入，让用户不用等这句话打完就能重新问
    if (current()) loading.value = false

    // 断网 / 超时：本地缓存算得出来的，就别只说"我断线了"。
    // 这一刻首页的天气卡片还挂着缓存好好显示着，助手却答不上来，用户会觉得一半功能是坏的。
    const offline = kind === "offline" || kind === "timeout" ? answerOffline(content) : null

    if (offline) {
      // 离线答案也是正经答案，不标成软失败（气泡样式和正常回答一致）
      target.soft = false
      await reveal(target, offline.text, mine)
      target.hint = offline.hint
      target.blocks = parseMarkdown(target.text)
      target.action = { type: "retry", text: content }
      // 答上来了就不算连败，别让下一句正常回答还顶着"后台没开"的提示
      failStreak = 0
    } else {
      target.soft = true
      // 软失败也走打字机：突然"啪"地蹦出一整句，会比慢慢说更像报错
      await reveal(target, pickOops(kind), mine)
      if (kind === "stopped") {
        // 停止不是失败，别计入连败，也别提示"检查后台"
        target.hint = "已停止"
      } else {
        failStreak++
        if (failStreak >= 2) target.hint = "一直不通的话，可能是我的后台没开，检查一下再叫我。"
      }
      target.action = { type: "retry", text: content }
    }
  } finally {
    if (current()) {
      loading.value = false
      ctl = null
    }
    saveHistory()
    await scrollToBottom()
  }
}

function onClear() {
  if (!messages.value.length) return
  uni.showModal({
    title: "清空对话",
    content: "会同时清掉助手的上下文记忆，确定吗？",
    success(r: { confirm: boolean }) {
      if (!r.confirm) return
      messages.value = []
      clearHistory()
      clearSession()
      uni.showToast({ title: "已清空", icon: "none" })
    },
  })
}
</script>

<template>
  <view class="page">
    <scroll-view
      class="list"
      scroll-y
      :scroll-into-view="intoView"
      :scroll-with-animation="smoothScroll"
    >
      <view class="inner">
        <view v-if="!messages.length" class="intro">
          <view class="intro-icon">
            <Icon name="robot" :size="28" color="#5B8FC0" />
          </view>
          <text class="intro-title">天气助手</text>
          <text class="intro-sub">会自己查实时数据再回答，不是凭记忆瞎猜</text>
          <view class="chips">
            <view v-for="s in SUGGESTIONS" :key="s" class="chip" @tap="send(s)">
              <text class="chip-text">{{ s }}</text>
            </view>
          </view>
          <view class="server-row" @tap="editServer">
            <text class="server-text">服务：{{ serverBase }}</text>
            <text class="server-edit">修改</text>
          </view>

          <view class="loc-row" :class="{ warn: locFailed }" @tap="refreshLocation(true)">
            <view class="loc-dot" />
            <text class="loc-text">定位：{{ locLabel }}</text>
          </view>
        </view>

        <view v-for="(m, i) in messages" :key="i" class="row" :class="m.role">
          <!-- 助手头像：同一个机器人组件，缩到 30px。列表里一串机器人一起眨眼会很吵，所以关掉动效 -->
          <view v-if="m.role === 'assistant'" class="avatar">
            <Robot :size="30" :animate="false" :mood="m.soft ? 'dizzy' : 'idle'" />
          </view>
          <view class="bubble" :class="[m.role, m.error ? 'error' : '', m.soft ? 'soft' : '']" @longpress="copyMsg(m)">
            <view v-if="m.steps.length" class="steps">
              <view v-for="(s, j) in m.steps" :key="j" class="step-line">
                <view class="step-dot" />
                <text class="step-text">{{ s }}</text>
              </view>
            </view>
            <!-- 打字期间是纯文本（Markdown 边打边解析会闪），播完 blocks 才有值 -->
            <template v-if="m.blocks && m.blocks.length">
              <view v-for="(b, bi) in m.blocks" :key="bi" class="md" :class="'md-' + b.t">
                <view v-if="b.t === 'hr'" class="md-hr" />
                <template v-else-if="b.t === 'li'">
                  <text class="md-bullet">{{ b.ol ? b.n + "." : "·" }}</text>
                  <text class="md-body">
                    <text v-for="(r, ri) in b.in" :key="ri" :class="'md-' + r.t">{{ r.v }}</text>
                  </text>
                </template>
                <text
                  v-else
                  class="md-body"
                  :class="b.t === 'h' ? 'md-h' + b.lv : b.t === 'quote' ? 'md-quote-text' : ''"
                >
                  <text v-for="(r, ri) in b.in" :key="ri" :class="'md-' + r.t">{{ r.v }}</text>
                </text>
              </view>
            </template>
            <text v-else-if="m.text" class="text">{{ m.text }}</text>
            <text v-if="m.hint" class="hint">{{ m.hint }}</text>
            <view v-if="!m.text && !m.blocks && loading && i === messages.length - 1" class="typing">
              <view class="tdot" />
              <view class="tdot" />
              <view class="tdot" />
            </view>
            <!-- 回答底部的跳转链接：文案由模型给的名字拼，点了才跳，不打断阅读 -->
            <view v-if="m.action" class="action-link" @tap="openAction(m.action)">
              <text class="action-text">{{ actionLabel(m.action) }}</text>
              <Icon name="chevron-right" :size="13" color="#2563EB" />
            </view>
          </view>
          <view v-if="m.role === 'user'" class="avatar">
            <Icon name="user" :size="15" color="#ffffff" />
          </view>
        </view>

        <view id="bottom-anchor" class="anchor" />
      </view>
    </scroll-view>

    <view class="bar">
      <view v-if="messages.length" class="clear-btn" @tap="onClear">
        <Icon name="broom" :size="17" color="#8B9CAD" />
      </view>
      <input
        v-model="input"
        class="input"
        type="text"
        placeholder="问点天气相关的问题…"
        placeholder-class="ph"
        confirm-type="send"
        @confirm="send()"
      />
      <!-- 请求在飞的时候，发送键变成停止键：同一个位置，不用去找第二个按钮 -->
      <view v-if="loading" class="stop-btn" @tap="onStop">
        <view class="stop-sq" />
      </view>
      <view v-else class="send-btn" :class="{ disabled: !canSend }" @tap="send()">
        <text class="send-text">发送</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
  background: var(--color-bg);
  font-family: var(--font-family-base);
}

.list {
  flex: 1;
  height: 0;
}
.inner {
  padding: 16px 16px 8px;
}
.anchor {
  height: 8px;
}

/* ---------- 空态 ---------- */
.intro {
  padding: 40px 12px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.intro-icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid var(--color-paper-border);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(91, 143, 192, 0.12);
}
.intro-title {
  margin-top: 16px;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-ink);
}
.intro-sub {
  margin-top: 6px;
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
  text-align: center;
  line-height: 1.5;
}
.chips {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
.chip {
  padding: 9px 14px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid var(--color-paper-border);
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.04);
}
.chip-text {
  font-size: var(--font-size-sm);
  color: var(--color-primary-dark);
}
.server-row {
  margin-top: 26px;
  padding: 7px 12px;
  border-radius: 10px;
  background: rgba(139, 156, 173, 0.12);
  display: flex;
  align-items: center;
  gap: 8px;
}
.server-text {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
}
.server-edit {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
}

/* 定位状态：点一下重新定位 */
.loc-row {
  margin-top: 8px;
  padding: 6px 12px;
  border-radius: 10px;
  background: rgba(139, 156, 173, 0.12);
  display: flex;
  align-items: center;
  gap: 7px;
}
.loc-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-jade);
  flex-shrink: 0;
}
.loc-row.warn .loc-dot {
  background: var(--color-danger);
}
.loc-text {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
}

/* ---------- 消息 ---------- */
.row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}
.row.user {
  justify-content: flex-end;
}
.row.assistant {
  justify-content: flex-start;
}

/* 头像：助手是那个小机器人，用户是渐变圆 + 人形图标 */
.avatar {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}
.row.assistant .avatar {
  margin-right: 7px;
}
.row.user .avatar {
  margin-left: 7px;
  border-radius: 15px;
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary));
  box-shadow: 0 2px 8px rgba(91, 143, 192, 0.3);
}

.bubble {
  max-width: 74%;
  padding: 11px 14px;
  border-radius: 18px;
  box-sizing: border-box;
}
.bubble.user {
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary));
  border-bottom-right-radius: 6px;
}
.bubble.assistant {
  background: #fff;
  border: 1px solid var(--color-paper-border);
  border-bottom-left-radius: 6px;
  box-shadow: 0 2px 10px rgba(44, 62, 80, 0.05);
}
.bubble.error {
  background: #fff5f6;
  border-color: #f3d3d6;
}

.text {
  font-size: var(--font-size-md);
  line-height: 1.62;
  white-space: pre-wrap;
  word-break: break-word;
}
.bubble.user .text {
  color: #fff;
}
.bubble.assistant .text {
  color: var(--color-ink);
}
.bubble.error .text {
  color: var(--color-danger);
}

/* 软失败：虚线框 = "这次不算数"，但颜色和正常气泡一致，不吓人 */
.bubble.soft {
  border-style: dashed;
  border-color: #dbe4ef;
  box-shadow: none;
}
.bubble.soft .text {
  color: #5e7185;
}
.dark-mode .bubble.soft {
  border-color: rgba(255, 255, 255, 0.16);
}
.dark-mode .bubble.soft .text {
  color: #9fb0c2;
}

/* 连续失败才出现的一行小字 */
.hint {
  display: block;
  margin-top: 6px;
  font-size: var(--font-size-xs, 11px);
  line-height: 1.5;
  color: #93a3b4;
}
.dark-mode .hint {
  color: #7d8b9a;
}

/* 回答底部的跳转链：浅蓝药丸，跟正文拉开一档层级 */
.action-link {
  display: inline-flex;
  align-items: center;
  margin-top: 10px;
  padding: 7px 10px 7px 12px;
  border-radius: 999px;
  background: #eaf2fe;
  border: 1px solid #d3e4fd;
}
.action-link:active {
  background: #dbe9fd;
}
.action-text {
  font-size: var(--font-size-sm);
  color: #2563eb;
  line-height: 1.2;
}
.dark-mode .action-link {
  background: rgba(37, 99, 235, 0.16);
  border-color: rgba(37, 99, 235, 0.28);
}
.dark-mode .action-text {
  color: #8fb8ff;
}

/* ---------- 渲染后的富文本块 ---------- */
.md {
  margin: 0 0 6px;
}
.md:last-child {
  margin-bottom: 0;
}
.md-body {
  display: block;
  font-size: var(--font-size-md);
  line-height: 1.62;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-ink);
}
.md-b {
  font-weight: bold;
}
.md-i {
  font-style: italic;
}
.md-code {
  font-family: Menlo, Consolas, monospace;
  font-size: 12px;
  background: rgba(91, 143, 192, 0.12);
  border-radius: 4px;
  padding: 0 3px;
}
.md-h1,
.md-h2,
.md-h3,
.md-h4 {
  font-weight: bold;
  line-height: 1.4;
}
.md-h1 {
  font-size: 18px;
  margin: 10px 0 4px;
}
.md-h2 {
  font-size: 16px;
  margin: 9px 0 4px;
}
.md-h3 {
  font-size: 15px;
  margin: 8px 0 3px;
}
.md-h4 {
  font-size: 14px;
  margin: 7px 0 3px;
}
.md-h1:first-child,
.md-h2:first-child,
.md-h3:first-child,
.md-h4:first-child {
  margin-top: 0;
}
.md-li {
  display: flex;
  align-items: flex-start;
  margin-bottom: 3px;
}
.md-bullet {
  flex-shrink: 0;
  width: 15px;
  font-size: var(--font-size-md);
  line-height: 1.62;
  color: #7f94a8;
}
.md-li .md-body {
  flex: 1;
}
.md-quote {
  border-left: 3px solid #cfe0ee;
  padding: 2px 0 2px 8px;
  margin: 6px 0;
}
.md-quote-text {
  color: #64798d;
}
.md-hr {
  height: 1px;
  background: #e6eef6;
  margin: 10px 0;
}
.dark-mode .md-code {
  background: rgba(120, 170, 220, 0.18);
}
.dark-mode .md-hr {
  background: rgba(255, 255, 255, 0.12);
}
.dark-mode .md-quote {
  border-left-color: rgba(255, 255, 255, 0.18);
}
.dark-mode .md-quote-text {
  color: #9fb0c2;
}

/* 工具调用轨迹 */
.steps {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--color-cloud);
}
.step-line {
  display: flex;
  align-items: center;
  margin-top: 3px;
}
.step-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-jade);
  margin-right: 6px;
  flex-shrink: 0;
}
.step-text {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  line-height: 1.4;
}

/* 输入中动画 */
.typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
}
.tdot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary-light);
  animation: blink 1.2s infinite ease-in-out;
}
.tdot:nth-child(2) {
  animation-delay: 0.18s;
}
.tdot:nth-child(3) {
  animation-delay: 0.36s;
}
@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.25;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

/* ---------- 输入栏 ---------- */
.bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  padding-bottom: calc(10px + constant(safe-area-inset-bottom));
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.92);
  border-top: 1px solid var(--color-paper-border);
}
.clear-btn {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-cloud);
  flex-shrink: 0;
}
.input {
  flex: 1;
  height: 38px;
  padding: 0 14px;
  border-radius: 19px;
  background: var(--color-cloud);
  font-size: var(--font-size-md);
  color: var(--color-ink);
}
.ph {
  color: var(--color-ash);
  font-size: var(--font-size-sm);
}
.send-btn {
  height: 38px;
  padding: 0 18px;
  border-radius: 19px;
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.send-btn.disabled {
  opacity: 0.42;
}
.send-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: #fff;
}

/* 停止：跟发送键同尺寸、同位置。刻意不用红色 —— 停止不是危险操作，
   红色会让人以为出了事故；一个实心方块已经足够表意 */
.stop-btn {
  width: 38px;
  height: 38px;
  border-radius: 19px;
  background: var(--color-cloud);
  border: 1px solid var(--color-paper-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stop-btn:active {
  background: #e6edf5;
}
.stop-sq {
  width: 11px;
  height: 11px;
  border-radius: 2px;
  background: var(--color-ink-light);
}
.dark-mode .stop-btn {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.14);
}
.dark-mode .stop-sq {
  background: #b8c6d4;
}
</style>
