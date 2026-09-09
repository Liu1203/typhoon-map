import { CACHE, UI } from "@/config"
import { uvLabel } from "@/utils/weather"
import type { AlertItem, CurrentWeather } from "@/api/weather"

const RAIN_NOTIFIED_KEY = "rain_notified"
const DIGEST_NOTIFIED_KEY = "digest_sent"
const ALERT_NOTIFIED_KEY = "alert_notified"
const TEMP_ALERT_NOTIFIED_KEY = "temp_alert_notified"

function push(title: string, content: string) {
  if (typeof uni.createPushMessage === "function") {
    uni.createPushMessage({ title, content })
  }
}

export function sendDailyDigest(city: string, weather: CurrentWeather | null) {
  try {
    const raw = uni.getStorageSync(CACHE.DIGEST_KEY) as string
    if (raw && JSON.parse(raw).enabled === false) return
    if (!weather) return
    const today = new Date().toDateString()
    const key = city + "_" + today
    if (uni.getStorageSync(DIGEST_NOTIFIED_KEY) === key) return
    const hrs = weather.hourly?.slice(0, 8) || []
    const maxRain = hrs.length ? Math.max(...hrs.map(h => parseInt(h.rainChance) || 0)) : 0
    let content = weather.weather + "，" + weather.high + "° / " + weather.low + "°"
    if (maxRain >= UI.RAIN_ALERT_PCT) content += "。未来几小时降水概率 " + maxRain + "%，记得带伞"
    content += "。紫外线 " + uvLabel(weather.uvIndex)
    if (weather.aqi !== "--") content += "，空气" + weather.aqiLabel
    uni.setStorageSync(DIGEST_NOTIFIED_KEY, key)
    push("今日天气 · " + city, content)
  } catch {}
}

export function checkTempAlert(city: string, weather: CurrentWeather | null) {
  try {
    const raw = uni.getStorageSync(CACHE.TEMP_ALERT_KEY) as string
    if (!raw) return
    const s = JSON.parse(raw)
    if (!s.enabled || !weather) return
    const t = parseFloat(weather.temp)
    if (isNaN(t)) return
    let level = ""
    if (s.high != null && t >= s.high) level = "高温"
    else if (s.low != null && t <= s.low) level = "低温"
    if (!level) return
    const key = city + "_" + new Date().toDateString() + "_" + level
    const stored = uni.getStorageSync(TEMP_ALERT_NOTIFIED_KEY) as string
    if (stored === key) return
    uni.setStorageSync(TEMP_ALERT_NOTIFIED_KEY, key)
    push(level + "提醒 · " + city, "当前气温 " + weather.temp + "°C，" + (level === "高温" ? "注意防暑降温" : "注意保暖"))
  } catch {}
}

export function notifyRainIfNeeded(city: string, rainAlarm: { count: number; maxPct: number } | null) {
  if (!rainAlarm) return
  try {
    const key = city + "_" + new Date().toDateString() + "_" + rainAlarm.maxPct
    const stored = uni.getStorageSync(RAIN_NOTIFIED_KEY) as string
    if (stored === key) return
    uni.setStorageSync(RAIN_NOTIFIED_KEY, key)
    push("🌧 降雨提醒 · " + city, "未来" + rainAlarm.count + "小时可能降雨（" + rainAlarm.maxPct + "%），出门记得带伞")
  } catch {}
}

export function checkAlertsAndNotify(alerts: AlertItem[]) {
  if (!alerts.length) return
  try {
    const raw = uni.getStorageSync(ALERT_NOTIFIED_KEY) as string
    const notified: string[] = raw ? JSON.parse(raw) : []
    for (const a of alerts) {
      const key = a.event + a.start + a.end
      if (notified.includes(key)) continue
      notified.push(key)
      push("天气预警: " + a.event, a.severity ? "[" + a.severity + "] " + (a.description || "").slice(0, 60) : (a.description || "").slice(0, 60))
    }
    const recent = notified.slice(-50)
    uni.setStorageSync(ALERT_NOTIFIED_KEY, JSON.stringify(recent))
  } catch {}
}
