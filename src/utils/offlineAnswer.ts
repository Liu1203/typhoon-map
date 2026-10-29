import { DEFAULT_CITY } from "@/config"
import type { CurrentWeather, ForecastDay, HourlyItem } from "@/api/weather"
import { formatTemp, getUnitSettings, hourNum, uvLabel } from "@/utils/weather"
import { readCachedWeather, readCurrentCity } from "@/utils/weatherCache"

/**
 * 断网时的本地回答。
 *
 * 这套东西存在的理由：助手断线时只能说"我的信号飘走了"，而同一时刻首页卡片
 * 还挂着缓存好好地显示着温度 —— 用户看到的是"这 App 一半能用一半不能"。
 * 而天气问答里绝大部分结论根本不需要联网：今天的最高温、明天下午的降水概率、
 * 日出日落时间，全都在那份缓存里。把它们算出来，比一句道歉有用得多。
 *
 * 两个容易踩的坑（都按 weather.ts 的实际实现写的，别凭直觉改）：
 *   1. `forecast[0]` 是「明天」不是「今天」—— 构造时是从 todayIdx + 1 开始循环的；
 *      今天的数据在 CurrentWeather 顶层（temp / high / low / weather）。
 *   2. `hourly` 只包含「今天、当前小时及以后」，明天的逐小时在 `hourlyByDate[日期]` 里。
 */
export interface OfflineAnswer {
  text: string
  /** 气泡下面那行小字，用来说明这是离线答案、数据有多旧 */
  hint: string
}

type Scope = "now" | "today" | "tomorrow" | "dayAfter"

interface Slot {
  from: number
  to: number
  label: string
}

const SLOT_MORNING: Slot = { from: 6, to: 11, label: "上午" }
const SLOT_NOON: Slot = { from: 11, to: 13, label: "中午" }
const SLOT_AFTERNOON: Slot = { from: 13, to: 18, label: "下午" }
const SLOT_EVENING: Slot = { from: 18, to: 23, label: "晚上" }

const RE_RAIN = /雨|伞|降水|淋|湿/
const RE_TEMP = /穿|冷|热|温度|几度|多少度|外套|衣服|体感|温差|凉/
const RE_WIND = /风|刮/
const RE_UV = /紫外|防晒|晒|太阳大/
const RE_AIR = /空气|雾霾|霾|aqi|pm2\.?5|污染/i
const RE_SUN = /日出|日落|天黑|天亮/
const RE_STAR = /观星|星星|星空|月亮|月相|银河/
const RE_GENERAL = /天气|气温|怎么样|如何|怎样|情况/

/** 这些必须问服务端（要查实时列表和历史库），缓存里没有，别硬凑 */
const RE_NEED_SERVER = /台风|地震|历史|最强|哪一年|排行|预警/

function pickScope(q: string): Scope {
  if (/后天/.test(q)) return "dayAfter"
  if (/明天|明日|明早|明晚|明儿/.test(q)) return "tomorrow"
  if (/现在|当前|实时|这会儿|此刻|马上|出门/.test(q)) return "now"
  return "today"
}

function pickSlot(q: string): Slot | null {
  if (/早上|早晨|上午|明早|一早/.test(q)) return SLOT_MORNING
  if (/中午|正午/.test(q)) return SLOT_NOON
  if (/下午|午后/.test(q)) return SLOT_AFTERNOON
  if (/晚上|夜里|晚间|今晚|明晚|傍晚/.test(q)) return SLOT_EVENING
  return null
}

function scopeLabel(scope: Scope): string {
  if (scope === "tomorrow") return "明天"
  if (scope === "dayAfter") return "后天"
  if (scope === "now") return "现在"
  return "今天"
}

/** 明天 = forecast[0]，后天 = forecast[1]；今天没有对应项，返回 null 交给顶层字段 */
function dayFor(w: CurrentWeather, scope: Scope): ForecastDay | null {
  if (scope === "tomorrow") return w.forecast?.[0] || null
  if (scope === "dayAfter") return w.forecast?.[1] || null
  return null
}

function pickHours(w: CurrentWeather, scope: Scope, slot: Slot | null): HourlyItem[] {
  let pool: HourlyItem[]
  if (scope === "tomorrow" || scope === "dayAfter") {
    const d = dayFor(w, scope)
    if (!d) return []
    pool = w.hourlyByDate?.[d.date] || []
  } else {
    // 已经裁成"今天当前小时之后"了，不用再筛
    pool = w.hourly || []
  }
  if (scope === "now") return pool.slice(0, 6)
  if (!slot) return pool
  return pool.filter((h) => {
    const hr = hourNum(h.time)
    return hr >= slot.from && hr < slot.to
  })
}

function pct(v: string | undefined): number {
  const n = parseInt(String(v ?? ""), 10)
  return isNaN(n) ? 0 : n
}

function num(v: string | undefined): number {
  const n = parseFloat(String(v ?? ""))
  return isNaN(n) ? 0 : n
}

function has(v: string | undefined): boolean {
  return !!v && v !== "--"
}

/** 温度带单位符号，尊重设置里的 °C / °F */
function fmtT(val: string | undefined, toF: boolean): string {
  if (!has(val)) return "--"
  return formatTemp(String(val), toF) + "°"
}

function clothingTip(high: number): string {
  if (high >= 30) return "短袖最舒服，注意防暑"
  if (high >= 24) return "短袖或薄长袖都行"
  if (high >= 18) return "薄外套带一件"
  if (high >= 12) return "外套别省，早晚更凉"
  return "厚外套穿好，注意保暖"
}

function rainText(w: CurrentWeather, scope: Scope, slot: Slot | null): string | null {
  const hours = pickHours(w, scope, slot)
  if (!hours.length) return null

  const chances = hours.map((h) => pct(h.rainChance))
  const max = Math.max(...chances)
  const when = scopeLabel(scope) + (slot ? slot.label : "")

  if (max < 30) return `${when}降水概率最高 ${max}%，基本不用带伞。`

  const wet = hours.filter((h) => pct(h.rainChance) >= 40)
  const peak = hours[chances.indexOf(max)]
  const span =
    wet.length > 1
      ? `${hourNum(wet[0].time)}–${hourNum(wet[wet.length - 1].time)} 点`
      : `${hourNum(peak.time)} 点前后`
  return `${when} ${span}降水概率最高 ${max}%，要下，出门带把伞。`
}

function tempText(w: CurrentWeather, scope: Scope, toF: boolean): string | null {
  const d = dayFor(w, scope)
  const high = d ? d.high : w.high
  const low = d ? d.low : w.low
  if (!has(high) || !has(low)) return null

  const hi = num(high)
  const lo = num(low)
  const word = d ? d.weather : w.weather
  const pieces: string[] = []

  pieces.push(`${scopeLabel(scope)}${word ? word : ""} ${fmtT(low, toF)}~${fmtT(high, toF)}`)

  // 和今天比：只在问明天/后天时有意义，今天跟自己比是废话
  if (scope !== "today" && scope !== "now" && has(w.high)) {
    const diffC = hi - num(w.high)
    // 阈值按摄氏度判断（3°C 才值得提一句），但显示要跟着单位换算
    if (Math.abs(diffC) >= 3) {
      const shown = Math.abs(Math.round(toF ? diffC * 9 / 5 : diffC))
      pieces.push(`比今天${diffC > 0 ? "高" : "低"} ${shown}°`)
    }
  }

  if (scope === "now" && has(w.temp)) {
    pieces.push(`现在 ${fmtT(w.temp, toF)}`)
  }

  const tip = clothingTip(hi)
  const swingC = hi - lo
  if (swingC >= 10) {
    const swing = Math.round(toF ? swingC * 9 / 5 : swingC)
    pieces.push(`早晚温差 ${swing}°，${tip}，早晚再多加一件`)
  } else {
    pieces.push(tip)
  }

  return pieces.join("，") + "。"
}

function windText(w: CurrentWeather): string | null {
  if (!has(w.windLevel) && !has(w.windDir)) return null
  const dir = has(w.windDir) ? w.windDir : ""
  const level = has(w.windLevel) ? w.windLevel : ""
  if (!level) return dir ? `当前${dir}。` : null
  return `当前${dir}${dir ? " " : ""}${level}。`
}

function uvText(w: CurrentWeather, scope: Scope): string | null {
  const d = dayFor(w, scope)
  const raw = d && has(d.uvMax) ? String(d.uvMax) : w.uvIndex
  if (!has(raw)) return null

  const v = num(raw)
  const label = uvLabel(String(raw))
  let tip: string
  if (v >= 8) tip = "防护霜和帽子都带上，别硬晒"
  else if (v >= 6) tip = "出门涂点防晒比较稳"
  else if (v >= 3) tip = "中等，问题不大"
  else tip = "很弱，随便晒"

  return `${scopeLabel(scope)}紫外线 ${Math.round(v)}（${label}），${tip}。`
}

function airText(w: CurrentWeather): string | null {
  if (!has(w.aqi)) return null
  const label = has(w.aqiLabel) ? w.aqiLabel : ""
  const v = num(w.aqi)
  let tip: string
  if (v <= 50) tip = "可以开窗透气"
  else if (v <= 100) tip = "敏感人群少在路边久待"
  else if (v <= 150) tip = "出门戴个口罩稳妥些"
  else tip = "尽量少在户外待着"

  return `当前 AQI ${Math.round(v)}${label ? "（" + label + "）" : ""}，${tip}。`
}

function sunText(w: CurrentWeather, scope: Scope): string | null {
  const d = dayFor(w, scope)
  const isToday = scope === "today" || scope === "now"
  // 明天/后天的日出日落和今天差几分钟到几十分钟，缺数据时宁可不提，也别拿今天的冒充
  const pick = (fromDay?: string, fromNow?: string): string => {
    if (has(fromDay)) return String(fromDay)
    return isToday && has(fromNow) ? String(fromNow) : ""
  }
  const rise = pick(d?.sunrise, w.sunrise)
  const set = pick(d?.sunset, w.sunset)
  if (!rise && !set) return null

  const parts: string[] = []
  if (rise) parts.push(`日出 ${rise}`)
  if (set) parts.push(`日落 ${set}`)
  return `${scopeLabel(scope)}${parts.join("，")}。`
}

function starText(w: CurrentWeather, scope: Scope, slot: Slot | null): string | null {
  const d = dayFor(w, scope)
  // ForecastDay 里没有云量字段（接口的 daily 没返回），只能用当前的云量估
  const cloud = has(w.cloudCover) ? num(w.cloudCover) : -1
  const phase = typeof d?.moonPhase === "number" ? d.moonPhase : w.moonPhase

  const parts: string[] = []
  if (cloud >= 0) {
    if (cloud <= 30) parts.push(`云量 ${Math.round(cloud)}%，天基本是开的`)
    else if (cloud <= 70) parts.push(`云量 ${Math.round(cloud)}%，会有一阵阵挡`)
    else parts.push(`云量 ${Math.round(cloud)}%，云太厚，看不太清`)
  }
  if (typeof phase === "number" && !isNaN(phase)) {
    // 0 = 新月，0.5 = 满月；月光越亮，暗星越难看见
    if (phase < 0.08 || phase > 0.92) parts.push("月亮接近新月，暗星最容易看见")
    else if (phase > 0.42 && phase < 0.58) parts.push("月亮接近满月，亮得会压掉不少星")
  }
  if (!parts.length) return null
  const when = slot ? `${scopeLabel(scope)}${slot.label}` : scopeLabel(scope)
  return `${when}${parts.join("，")}。`
}

function generalText(w: CurrentWeather, scope: Scope, toF: boolean): string {
  const d = dayFor(w, scope)
  const word = d ? d.weather : w.weather
  const high = d ? d.high : w.high
  const low = d ? d.low : w.low

  const parts: string[] = []
  if (scope === "now" || scope === "today") {
    if (has(w.temp)) parts.push(`现在 ${fmtT(w.temp, toF)}`)
    if (word) parts.push(word)
  } else if (word) {
    parts.push(`${scopeLabel(scope)}${word}`)
  }
  if (has(high) && has(low)) parts.push(`${fmtT(low, toF)}~${fmtT(high, toF)}`)

  const hours = pickHours(w, scope, null)
  if (hours.length) {
    const chances = hours.map((h) => pct(h.rainChance))
    const maxRain = Math.max(...chances)
    if (maxRain >= 40) {
      // 必须带上时段：不然"现在多云"后面紧跟"记得带伞"，用户会觉得在胡说
      const peak = hours[chances.indexOf(maxRain)]
      parts.push(`${hourNum(peak.time)} 点前后降水概率 ${maxRain}%，记得带伞`)
    } else {
      parts.push("降水概率不高")
    }
  }

  return `${parts.join("，")}。`
}

/** "离线回答 · 8 分钟前的数据" */
function ageHint(ts: number): string {
  const mins = Math.max(0, Math.round((Date.now() - (Number(ts) || 0)) / 60000))
  if (mins < 1) return "离线回答 · 用的是刚才的数据"
  if (mins < 60) return `离线回答 · 用的是 ${mins} 分钟前的数据`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `离线回答 · 用的是 ${hours} 小时前的数据`
  return "离线回答 · 手里的数据有点旧了，联网再问我一次更准"
}

/**
 * "后天呢""明天怎么样"—— 既没有关注点、也没有动词，只有时间。
 * 这种追问在对话里很常见，按综合简报答比说"我断线了"合适。
 */
function isBareTimeFollowUp(q: string): boolean {
  if (q.length > 8) return false
  return /明天|后天|今天|今晚|明早|明晚|现在/.test(q)
}

/**
 * 用本地缓存回答一句天气问题。
 * 返回 null 表示这个问题离线答不了（要实时数据、或者根本不是天气问题），
 * 调用方照旧走"断线了"的拟人话术。
 */
export function answerOffline(question: string): OfflineAnswer | null {
  const q = String(question || "").trim()
  if (!q) return null
  if (RE_NEED_SERVER.test(q)) return null

  const city = readCurrentCity(DEFAULT_CITY)
  const cached = readCachedWeather(city) || readCachedWeather()
  if (!cached || !cached.data) return null

  const w = cached.data
  const toF = getUnitSettings().temp === "f"
  const scope = pickScope(q)
  const slot = pickSlot(q)

  const parts: string[] = []
  if (RE_RAIN.test(q)) {
    const t = rainText(w, scope, slot)
    if (t) parts.push(t)
  }
  if (RE_TEMP.test(q)) {
    const t = tempText(w, scope, toF)
    if (t) parts.push(t)
  }
  if (RE_WIND.test(q)) {
    const t = windText(w)
    if (t) parts.push(t)
  }
  if (RE_UV.test(q)) {
    const t = uvText(w, scope)
    if (t) parts.push(t)
  }
  if (RE_AIR.test(q)) {
    const t = airText(w)
    if (t) parts.push(t)
  }
  if (RE_SUN.test(q)) {
    const t = sunText(w, scope)
    if (t) parts.push(t)
  }
  if (RE_STAR.test(q)) {
    const t = starText(w, scope, slot)
    if (t) parts.push(t)
  }

  // 什么关键词都没命中，但看着像在问天气（或是"后天呢"这种追问）：给一份综合简报
  if (!parts.length && (RE_GENERAL.test(q) || isBareTimeFollowUp(q))) {
    parts.push(generalText(w, scope, toF))
  }

  if (!parts.length) return null

  // 一次答两块就够，再多就成了念播报稿
  return {
    text: parts.slice(0, 2).join(" "),
    hint: ageHint(cached.ts) + "（" + (cached.city || city) + "）",
  }
}
