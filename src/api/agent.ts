import { AGENT } from "@/config"

/**
 * 请求失败的类型。
 *
 * 这些东西只该进日志、给开发看。给用户的是一句"笨笨"的话，
 * 而不是 `连不上天气助手（request:fail timeout），当前地址 http://192.168...:8787` ——
 * 那句话对用户没有任何用处，只会让他觉得"这 App 坏了"。
 */
export type AgentErrorKind = "offline" | "timeout" | "server" | "busy" | "stopped" | "auth"

export class AgentError extends Error {
  kind: AgentErrorKind
  /** 真实原因，写日志用，不展示 */
  detail: string
  constructor(kind: AgentErrorKind, detail: string) {
    super(detail)
    this.name = "AgentError"
    this.kind = kind
    this.detail = detail
  }
}

/**
 * 一份待确认的写操作草案。
 *
 * 注意它**不是**"已经设好了"：服务端只生成了草案，必须由用户点确认才真正落库。
 * 字段跟后端 src/alerts.ts 的 AlertProposal 一一对应。
 */
export interface AlertProposal {
  id: string
  sessionId: string
  city: string
  condition: string
  threshold: number | null
  leadHours: number
  /** 给人看的一句话，确认卡片直接显示，不要自己拼 */
  summary: string
  createdAt: number
  /** 过期时刻。过期后确认会被拒（404），界面要提示重新生成 */
  expiresAt: number
}

/** agent 循环里抛出的过程事件 */
export interface AgentEvent {
  // proposal 是新加的：旧服务端不会发，所以下面所有字段都用 optional，
  // 老客户端/新客户端连老服务端都不会因为多一种 type 而崩
  type: "step" | "tool_call" | "observation" | "final" | "proposal"
  name?: string
  args?: string
  content?: string
  index?: number
  proposal?: AlertProposal
}

export interface AgentReply {
  sessionId: string
  reply: string
  events: AgentEvent[]
  /** 本轮产生的写操作草案。没有就是没触发，不是错误 */
  proposals?: AlertProposal[]
}

/** 手机定位，随每次提问送给服务端，避免用户被反复问"你在哪个城市" */
export interface AgentLocation {
  lat: number
  lon: number
  /** App 端原生反解出的地名（不一定有） */
  city?: string
}

const SESSION_KEY = "agent_session_id"
const BASE_KEY = "agent_base"
const KEY_KEY = "agent_key"
const LOCATION_KEY = "agent_location"

/** 定位缓存 5 分钟：同一次对话里没必要每句都重新定位，那要等 1-3 秒 */
const LOCATION_TTL = 5 * 60 * 1000

/**
 * 服务地址：优先读本地存储，回退到 config.ts 的 AGENT.BASE。
 * 这样装好的 APK 换网络时能在 App 里直接改，不用重新打包。
 */
export function getAgentBase(): string {
  try {
    const saved = uni.getStorageSync(BASE_KEY) as string
    return saved || AGENT.BASE
  } catch {
    return AGENT.BASE
  }
}

export function setAgentBase(url: string) {
  const cleaned = url.trim().replace(/\/+$/, "")
  try {
    if (cleaned) uni.setStorageSync(BASE_KEY, cleaned)
    else uni.removeStorageSync(BASE_KEY)
  } catch {}
}

/**
 * 访问密钥：优先读本地存储（换钥时不用重新打包），回退到构建时注入的值。
 * 后端没开 AGENT_TOKEN 时这里是空串，请求头也就不会带，行为跟以前一致。
 */
export function getAgentKey(): string {
  try {
    const saved = uni.getStorageSync(KEY_KEY) as string
    return saved || AGENT.KEY
  } catch {
    return AGENT.KEY
  }
}

export function setAgentKey(key: string) {
  const cleaned = key.trim()
  try {
    if (cleaned) uni.setStorageSync(KEY_KEY, cleaned)
    else uni.removeStorageSync(KEY_KEY)
  } catch {}
}

/** 所有请求都要带这个头，否则服务端开着校验时一律 401 */
function authHeader(): Record<string, string> {
  const key = getAgentKey()
  return key ? { "X-Agent-Key": key } : {}
}

/**
 * 当前在飞的请求。
 *
 * 用一个 state 对象而不是模块级布尔量：用户"停止 → 立刻换个问题问"的时候，
 * 旧请求的 fail 回调会在新请求开始之后才回来，全局布尔量会把新的那次误判成
 * "刚被 abort"（用户看到"断线了"而其实一切正常）。
 */
let active: { task: any; aborted: boolean } | null = null

function send<T>(method: "POST" | "PUT", path: string, data: Record<string, unknown>): Promise<T> {
  const state = { task: null as any, aborted: false }
  active = state

  return new Promise((resolve, reject) => {
    /** 这一轮结束后才能判断：中途被 abort 的请求，fail 里 errMsg 长得和"断线"一模一样 */
    const finish = () => {
      if (active === state) active = null
    }

    state.task = uni.request({
      url: `${getAgentBase()}${path}`,
      method,
      data,
      timeout: AGENT.TIMEOUT,
      header: { "Content-Type": "application/json", ...authHeader() },
      success(res: { statusCode: number; data: any }) {
        finish()
        // 被 abort 的请求在某些平台会以 statusCode 0 走 success，别当成服务端错误
        if (state.aborted) {
          reject(new AgentError("stopped", "aborted"))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
        } else if (res.statusCode === 401) {
          reject(new AgentError("auth", "unauthorized"))
        } else if (res.statusCode === 429) {
          reject(new AgentError("busy", "rate limited"))
        } else {
          const detail = res.data?.error || `HTTP ${res.statusCode}`
          reject(new AgentError("server", String(detail)))
        }
      },
      fail(err: { errMsg?: string }) {
        finish()
        const raw = String(err?.errMsg || "request:fail")
        if (state.aborted) {
          reject(new AgentError("stopped", "aborted: " + raw))
          return
        }
        // uni.request 的超时和"压根连不上"都走 fail，只能从文案里认
        const kind: AgentErrorKind = /timeout|超时/i.test(raw) ? "timeout" : "offline"
        reject(new AgentError(kind, raw + " @" + getAgentBase()))
      },
    })
  })
}

/** 普通写请求。所有调用点都不用改 */
function post<T>(path: string, data: Record<string, unknown>): Promise<T> {
  return send<T>("POST", path, data)
}

export function getSessionId(): string {
  try {
    return (uni.getStorageSync(SESSION_KEY) as string) || ""
  } catch {
    return ""
  }
}

function saveSessionId(id: string) {
  if (!id) return
  try {
    uni.setStorageSync(SESSION_KEY, id)
  } catch {}
}

/** 清空服务端会话记忆（下次提问会开一个新会话） */
export function clearSession() {
  try {
    uni.removeStorageSync(SESSION_KEY)
  } catch {}
}

// ---------------------------------------------------------------------------
// 定位
// ---------------------------------------------------------------------------

let locCache: AgentLocation | null = null
let locCacheAt = 0

function readStoredLocation(): AgentLocation | null {
  try {
    const raw = uni.getStorageSync(LOCATION_KEY) as AgentLocation | ""
    if (raw && typeof raw === "object") {
      const lat = Number(raw.lat)
      const lon = Number(raw.lon)
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        return { lat, lon, city: typeof raw.city === "string" ? raw.city : undefined }
      }
    }
  } catch {}
  return null
}

/** 当前已知定位：内存缓存优先，其次上次启动时存下的 */
export function getCachedLocation(): AgentLocation | null {
  if (locCache && Date.now() - locCacheAt < LOCATION_TTL) return locCache
  const stored = readStoredLocation()
  if (stored) {
    locCache = stored
    locCacheAt = Date.now()
  }
  return stored
}

/**
 * 取一次定位。
 * geocode:true 让 App 端用系统能力直接反解地名，省一次网络反查；
 * 小程序端会忽略这个参数，此时只有坐标 —— 够用了，服务端查天气不需要城市名。
 */
export function detectLocation(force = false): Promise<AgentLocation | null> {
  return new Promise((resolve) => {
    if (!force) {
      const hit = getCachedLocation()
      if (hit) return resolve(hit)
    }

    let settled = false
    const done = (r: AgentLocation | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(r)
    }
    // 定位可能卡住（室内、权限弹窗没响应），不能让它拖死整轮对话
    const timer = setTimeout(() => done(null), 8000)

    uni.getLocation({
      type: "wgs84",
      geocode: true,
      success(res: any) {
        const lat = Number(res?.latitude)
        const lon = Number(res?.longitude)
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return done(null)

        const addr = res?.address
        // 原生反解里 city 是"深圳市"、district 才是"龙华区"，区更贴近用户
        const raw = addr?.district || addr?.city || addr?.locality || ""
        const city = typeof raw === "string" && raw.trim() ? raw.trim() : undefined

        const loc: AgentLocation = { lat, lon, city }
        locCache = loc
        locCacheAt = Date.now()
        try {
          uni.setStorageSync(LOCATION_KEY, loc)
        } catch {}
        done(loc)
      },
      fail() {
        done(null)
      },
    })
  })
}

/**
 * 问一句。sessionId 存在本地存储里，所以关掉小程序再打开还能接上之前的话题。
 * location 一并带上，服务端会把它写进系统提示，用户就不必再报城市。
 */
export async function askAgent(
  message: string,
  location?: AgentLocation | null,
): Promise<AgentReply> {
  const data = await post<AgentReply & { error?: string }>("/api/chat", {
    message,
    sessionId: getSessionId() || undefined,
    location: location ? { lat: location.lat, lon: location.lon, city: location.city } : undefined,
  })

  if (data?.error) throw new AgentError("server", String(data.error))

  if (data?.sessionId) saveSessionId(data.sessionId)

  return data
}

// ---------------------------------------------------------------------------
// 里程碑式流式（轮询拉取）
// ---------------------------------------------------------------------------

export interface StreamStep {
  name: string
  args: string
}

export interface StreamHooks {
  /** 累计到目前的全文。可能变短（模型有一次是自言自语被作废），客户端按"整段替换"处理 */
  onText?: (full: string) => void
  /** 目前已经发起过的工具调用，用来展示"思考过程" */
  onSteps?: (steps: StreamStep[]) => void
  /**
   * 出现了待确认的草案。
   *
   * 为什么单独一个回调、而不是塞进 onSteps：它需要**用户操作**，
   * 是这一轮里唯一"还没结束"的东西 —— 混进步骤列表会被当成过程信息划过去。
   */
  onProposals?: (list: AlertProposal[]) => void
}

interface TaskStart {
  taskId: string
  sessionId: string
}

interface TaskPoll {
  sessionId: string
  text: string
  steps: StreamStep[]
  done: boolean
  error: string | null
  reply: string
  proposals?: AlertProposal[]
}

/**
 * 为什么是轮询，不是 SSE / chunked。
 *
 * 最初做的是 uni.request 的 enableChunked + onChunkReceived，本机用 curl 测一切正常，
 * 装到安卓真机上却是"转圈几秒、整段蹦出来"——那台设备的实现把整个响应缓存到结束才交给上层。
 * 为了兜底又在 3.5 秒时 abort 重发，结果同一 session 上出现两个并发 ask，把历史写坏，
 * 之后每一问都 400（用户看到的就是"AI 突然没网了"）。
 *
 * 轮询把这些不确定性全绕开了：普通请求、每次取一份累计文本、平台之间行为一致，
 * 也不存在 UTF-8 跨块和 SSE 行跨块。代价是每 200ms 一个小请求，只在生成期间发生。
 */
const POLL_MS = 200
const POLL_TIMEOUT_MS = 90_000

let activeRun: { cancelled: boolean; taskId: string } | null = null

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function getJson<T>(path: string): Promise<T> {
  const state = { task: null as any, aborted: false }
  active = state

  return new Promise((resolve, reject) => {
    const finish = () => {
      if (active === state) active = null
    }
    state.task = uni.request({
      url: `${getAgentBase()}${path}`,
      method: "GET",
      timeout: 15000,
      header: authHeader(),
      success(res: { statusCode: number; data: any }) {
        finish()
        if (state.aborted) return reject(new AgentError("stopped", "aborted"))
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data as T)
        else if (res.statusCode === 401) reject(new AgentError("auth", "unauthorized"))
        else reject(new AgentError("server", `HTTP ${res.statusCode}`))
      },
      fail(err: { errMsg?: string }) {
        finish()
        if (state.aborted) return reject(new AgentError("stopped", "aborted"))
        reject(new AgentError("offline", String(err?.errMsg || "request:fail")))
      },
    })
  })
}

async function cancelTask(taskId: string) {
  try {
    await post("/api/chat/cancel", { taskId })
  } catch {}
}

export async function askAgentStream(
  message: string,
  location?: AgentLocation | null,
  hooks: StreamHooks = {},
): Promise<AgentReply> {
  const run = { cancelled: false, taskId: "" }
  activeRun = run

  const started = await post<TaskStart>("/api/chat/start", {
    message,
    sessionId: getSessionId() || undefined,
    location: location ? { lat: location.lat, lon: location.lon, city: location.city } : undefined,
  })

  run.taskId = started.taskId
  saveSessionId(started.sessionId)

  const deadline = Date.now() + POLL_TIMEOUT_MS
  let lastText = ""
  let lastSteps = ""
  let lastProposals = ""
  let fails = 0

  for (;;) {
    if (run.cancelled) throw new AgentError("stopped", "cancelled")

    let s: TaskPoll
    try {
      s = await getJson<TaskPoll>(`/api/chat/poll?taskId=${encodeURIComponent(started.taskId)}`)
      fails = 0
    } catch (err) {
      // 网络抖一下就整轮作废太亏了：已经生成的内容还在服务端，
      // 连续失败 4 次（约 1.6 秒）才认定真的断了。
      if (err instanceof AgentError && err.kind === "stopped") throw err
      if (++fails >= 4) throw err
      await sleep(POLL_MS * 2)
      continue
    }

    if (typeof s.text === "string" && s.text !== lastText) {
      lastText = s.text
      hooks.onText?.(s.text)
    }
    const steps = Array.isArray(s.steps) ? s.steps : []
    const sig = JSON.stringify(steps)
    if (sig !== lastSteps) {
      lastSteps = sig
      hooks.onSteps?.(steps)
    }

    // 草案可能在中途就出现（工具刚返回、模型还在组织措辞），所以每轮都检查一次，
    // 用序列化做去重 —— 否则每 200ms 都会重绘一次卡片
    const props = Array.isArray(s.proposals) ? s.proposals : []
    const pSig = JSON.stringify(props)
    if (pSig !== lastProposals) {
      lastProposals = pSig
      hooks.onProposals?.(props)
    }

    if (s.error) throw new AgentError("server", s.error)

    if (s.done) {
      if (activeRun === run) activeRun = null
      return {
        sessionId: s.sessionId || started.sessionId,
        reply: s.reply || lastText,
        events: [],
        proposals: Array.isArray(s.proposals) ? s.proposals : [],
      }
    }

    if (Date.now() > deadline) throw new AgentError("timeout", "poll timeout")
    await sleep(POLL_MS)
  }
}

/** 用户点了停止：通知服务端掐断模型生成，同时让轮询循环自己退出 */
export function abortAsk() {
  // 必须先把"当前在飞的那个请求"抓下来再发取消请求：
  // 取消请求自己也会占用 active，事后再 abort 就会把它一起掐掉，
  // 结果服务端根本没收到停止指令，token 白烧。
  const inflight = active

  const run = activeRun
  if (run) {
    run.cancelled = true
    if (run.taskId) void cancelTask(run.taskId)
    activeRun = null
  }

  if (inflight) {
    inflight.aborted = true
    try {
      inflight.task?.abort()
    } catch {}
  }
  active = null
}

// ---------------------------------------------------------------------------
// 写操作：确认一份草案
// ---------------------------------------------------------------------------

export interface ConfirmedAlert {
  id: string
  summary: string
  status: "active" | "cancelled"
  createdAt: number
}

/**
 * 确认一份草案 —— 整个 App 里唯一会改变服务端真实状态的调用。
 *
 * sessionId 用 **草案自己带的**，不用本地存储里的那个：
 * 草案归属于生成它的会话，用错 id 会被服务端 403 拒掉，
 * 而那时候用户看到的是"确认失败"，根本不知道为什么。
 *
 * idempotencyKey 由调用方生成，并且重试时必须复用同一个 —— 它代表
 * "用户这一次点击"，不是"这一次 HTTP 请求"。点一次、超时、重发，
 * 只要 key 没变，服务端只会创建一条。
 */
export function confirmAlert(proposal: AlertProposal, idempotencyKey: string): Promise<{
  alert: ConfirmedAlert
  replayed: boolean
}> {
  return post<{ alert: ConfirmedAlert; replayed: boolean }>("/api/alerts/confirm", {
    proposalId: proposal.id,
    sessionId: proposal.sessionId,
    idempotencyKey,
  })
}

// ---------------------------------------------------------------------------
// 提醒：列表 / 取消 / 免打扰偏好
// ---------------------------------------------------------------------------

/** 一条已生效的提醒。字段跟后端 AlertRecord 对齐，只取页面用得到的 */
export interface AlertRecord {
  id: string
  summary: string
  status: "active" | "cancelled"
  createdAt: number
  city: string
  condition: string
  threshold: number | null
  leadHours: number
}

/** 夜间可以突破免打扰的档位。界面上不显示这些词，只显示"什么事能叫醒我" */
export type NightLevel = "never" | "critical" | "high"

export interface AlertSettings {
  sessionId: string
  quietEnabled: boolean
  /** 0-23，可跨零点：22 → 8 */
  quietStart: number
  quietEnd: number
  nightLevel: NightLevel
  /** 24 小时内的打扰上限 */
  maxIntrusions: number
  updatedAt: number
}

/** 配额用量。界面上要显示"今晚还能打扰你几次"，否则用户以为推送坏了 */
export interface IntrusionUsage {
  used: number
  limit: number
  nextResetAt: number
}

/** 已生效的提醒。canWrite=false 时（只读身份）页面不该给取消按钮 */
export function getAlerts(sessionId?: string): Promise<{ alerts: AlertRecord[]; canWrite: boolean }> {
  const q = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ""
  return getJson<{ alerts: AlertRecord[]; canWrite: boolean }>(`/api/alerts${q}`)
}

/** 取消一条提醒。取消是幂等的：重复点不会报错 */
export function cancelAlert(alertId: string): Promise<{ alert: AlertRecord }> {
  return post<{ alert: AlertRecord }>("/api/alerts/cancel", { alertId })
}

export function getAlertSettings(
  sessionId: string,
): Promise<{ settings: AlertSettings; intrusion: IntrusionUsage }> {
  return getJson<{ settings: AlertSettings; intrusion: IntrusionUsage }>(
    `/api/settings?sessionId=${encodeURIComponent(sessionId)}`,
  )
}

/**
 * 改偏好。
 *
 * 用 PUT 而不是 POST：这是"把我这份设置替换成新值"，天然幂等 ——
 * 网络超时重发一次，结果和发一次完全相同。POST 语义上会让人以为"加一条"。
 */
export function saveAlertSettings(
  sessionId: string,
  patch: Partial<Pick<AlertSettings, "quietEnabled" | "quietStart" | "quietEnd" | "nightLevel" | "maxIntrusions">>,
): Promise<{ settings: AlertSettings; intrusion: IntrusionUsage }> {
  return send<{ settings: AlertSettings; intrusion: IntrusionUsage }>("PUT", "/api/settings", {
    sessionId,
    ...patch,
  })
}
