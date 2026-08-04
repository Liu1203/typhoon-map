<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue"
import { onShow, onHide, onPullDownRefresh } from "@dcloudio/uni-app"
import { getWeather, getCityCoords, getHourlyForecast, getWeatherByCoords, nearestCity, type CurrentWeather } from "@/api/weather"
import { fetchActiveTyphoons, typhoonDistanceKm, pointDistanceKm, type TyphoonBrief } from "@/api/typhoon"
import { TIMEOUT, CACHE } from "@/config"
import { gradientFor, gradientColors, accentFor, lightFor, getUnitSettings, formatTemp, formatWind, formatPressure, formatVisibility, uvLabel } from "@/utils/weather"
import { loadDarkMode, toggleDarkMode } from "@/utils/theme"
import WeatherHero from "@/components/WeatherHero.vue"
import DetailGrid from "@/components/DetailGrid.vue"
import ForecastCard from "@/components/ForecastCard.vue"
import HourlyScroll from "@/components/HourlyScroll.vue"
import SkeletonLoader from "@/components/SkeletonLoader.vue"
import TempTrend from "@/components/TempTrend.vue"
import LifeTips from "@/components/LifeTips.vue"
import PrecipTrend from "@/components/PrecipTrend.vue"
import HourlyTrend from "@/components/HourlyTrend.vue"
import AqiCard from "@/components/AqiCard.vue"
import WeatherParticles from "@/components/WeatherParticles.vue"
import StargazingCard from "@/components/StargazingCard.vue"

const locateError = ref("")
const isOffline = ref(false)

uni.getNetworkType({
  success(r) { isOffline.value = r.networkType === "none" },
})
uni.onNetworkStatusChange((r) => {
  isOffline.value = r.isConnected === false
})

const showBrand = ref(true)

function showBrandOff() {
  if (showBrand.value) {
    showBrand.value = false
  }
}

async function detectCity(): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false
    const done = (result: string | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }
    const timer = setTimeout(() => {
      locateError.value = "超时"
      done(null)
    }, TIMEOUT.LOCATION)

    uni.getLocation({
      type: "wgs84",
      success(res: { latitude: number; longitude: number }) {
        done(nearestCity(res.latitude, res.longitude))
      },
      fail(err: { errMsg?: string; message?: string }) {
        const msg = (err?.errMsg || err?.message || "未知")
        locateError.value = msg
        if (msg.includes("not authorized") || msg.includes("deny") || msg.includes("permission")) {
          uni.showModal({
            title: "需要定位权限",
            content: "请在系统设置中允许本应用访问位置信息",
            confirmText: "去设置",
            success(modalRes: { confirm: boolean }) {
              if (modalRes.confirm) uni.openSetting({})
            }
          })
        }
        done(null)
      },
    })
  })
}

async function detectCoords(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    let settled = false
    const done = (r: { lat: number; lon: number } | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(r)
    }
    const timer = setTimeout(() => { done(null) }, TIMEOUT.LOCATION)
    uni.getLocation({
      type: "wgs84",
      success(res: { latitude: number; longitude: number }) { done({ lat: res.latitude, lon: res.longitude }) },
      fail() { done(null) },
    })
  })
}

interface CacheEntry {
  data: CurrentWeather
  city: string
  ts: number
}

const currentCity = ref("北京")
const weatherCity = ref("")
const weather = ref<CurrentWeather | null>(null)
const loading = ref(true)
const updateTime = ref("")
const errorType = ref<"network" | "timeout" | "server" | null>(null)
const refreshing = ref(false)
const locating = ref(false)
const expandedIndex = ref(-1)
const forecastHourlys = ref<Record<number, import("@/api/weather").HourlyItem[]>>({})
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20
const darkMode = ref(false)

function toggleDark() {
  darkMode.value = toggleDarkMode()
}

function initDarkMode() {
  darkMode.value = loadDarkMode()
}

function isLegacyCache(obj: any): boolean {
  return obj && typeof obj === "object" && obj.data && typeof obj.data === "object" && typeof obj.city === "string" && !obj[obj.city]
}

function getCache(city?: string): CacheEntry | null {
  try {
    const raw = uni.getStorageSync(CACHE.WEATHER_KEY) as string
    if (raw) {
      const obj = JSON.parse(raw)
      if (isLegacyCache(obj)) {
        if (Date.now() - obj.ts < CACHE.TTL_MS) return obj as CacheEntry
        try { uni.removeStorageSync(CACHE.WEATHER_KEY) } catch {}
        return null
      }
      if (city && obj[city]) {
        const entry = obj[city] as CacheEntry
        if (Date.now() - entry.ts < CACHE.TTL_MS) return entry
        delete obj[city]
        try { uni.setStorageSync(CACHE.WEATHER_KEY, JSON.stringify(obj)) } catch {}
      }
    }
  } catch { }
  return null
}

function getCachedCities(): string[] {
  try {
    const raw = uni.getStorageSync(CACHE.WEATHER_KEY) as string
    if (raw) {
      const obj = JSON.parse(raw)
      if (isLegacyCache(obj)) return [obj.city]
      return Object.keys(obj).filter(k => obj[k] && obj[k].data && typeof obj[k].ts === "number")
    }
  } catch { }
  return []
}

function setCache(data: CurrentWeather, city: string) {
  try {
    const raw = uni.getStorageSync(CACHE.WEATHER_KEY) as string
    let map: Record<string, CacheEntry> = {}
    try {
      const obj = raw ? JSON.parse(raw) : {}
      if (isLegacyCache(obj)) {
        map[obj.city] = { data: obj.data, city: obj.city, ts: obj.ts }
      } else {
        map = obj
      }
    } catch { map = {} }
    map[city] = { data, city, ts: Date.now() }
    // 限制缓存城市数量
    const keys = Object.keys(map)
    if (keys.length > 12) {
      const sorted = keys.sort((a, b) => (map[a].ts || 0) - (map[b].ts || 0))
      delete map[sorted[0]]
    }
    uni.setStorageSync(CACHE.WEATHER_KEY, JSON.stringify(map))
  } catch { }
}

function applyWeatherData(res: CurrentWeather) {
  weather.value = res
  showBrandOff()
  uni.setNavigationBarColor({ fontColor: lightFor(res.weather) ? '#000000' : '#ffffff', backgroundColor: '#000000' })
  updateTime.value = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
}

async function fetchAndUpdate(city: string) {
  const coords = getCityCoords(city)
  if (!coords) {
    if (!weather.value) errorType.value = "server"
    return
  }
  const mySeq = ++fetchSeq
  const start = Date.now()
  const res = await getWeather(coords.lat, coords.lon)
  if (mySeq !== fetchSeq) return
  if (res) {
    errorType.value = null
    forecastHourlys.value = {}
    expandedIndex.value = -1
    weatherCity.value = city
    applyWeatherData(res)
    setCache(res, city)
    if (res.alerts?.length) checkAlertsAndNotify(res.alerts)
    notifyRainIfNeeded()
    checkTempAlert()
  } else {
    const cached = getCache(city)
    if (cached && cached.city === city) {
      forecastHourlys.value = {}
      expandedIndex.value = -1
      weatherCity.value = city
      applyWeatherData(cached.data)
      errorType.value = null
      if (isOffline.value) uni.showToast({ title: "离线显示缓存数据", icon: "none", duration: 2000 })
    } else if (!weather.value || weatherCity.value !== city) {
      errorType.value = isOffline.value ? "network" : (Date.now() - start >= TIMEOUT.OPEN_METEO * 3 ? "timeout" : "server")
    } else if (isOffline.value) {
      errorType.value = "network"
    }
  }
}

let firstLoad = true
let fetchSeq = 0
let refreshTimer: ReturnType<typeof setInterval> | null = null

function startAutoRefresh() {
  stopAutoRefresh()
  const interval = readRefreshInterval()
  if (interval <= 0) return
  refreshTimer = setInterval(() => {
    fetchAndUpdate(currentCity.value)
  }, interval)
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

onShow(async () => {
  errorType.value = null
  initDarkMode()
  loadHomeModules()

  const saved = uni.getStorageSync(CACHE.CITY_KEY) as string
  if (saved) {
    currentCity.value = saved
  } else {
    currentCity.value = "北京"
    uni.setStorageSync(CACHE.CITY_KEY, "北京")
    detectCity().then((detected) => {
      if (detected && detected !== currentCity.value) {
        currentCity.value = detected
        uni.setStorageSync(CACHE.CITY_KEY, detected)
        fetchAndUpdate(currentCity.value)
      }
    })
  }

  const cache = getCache(currentCity.value)
  const cacheHit = cache && cache.city === currentCity.value

  if (cacheHit) {
    weatherCity.value = currentCity.value
    applyWeatherData(cache.data)
    updateTime.value = new Date(cache.ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  }

  if (firstLoad || !cacheHit) {
    loading.value = true
    firstLoad = false
  } else {
    loading.value = false
  }

  await fetchAndUpdate(currentCity.value)
  loading.value = false
  startAutoRefresh()
  if (!isOffline.value) checkTyphoon()
  sendDailyDigest()
})

onHide(() => {
  stopAutoRefresh()
})

onPullDownRefresh(async () => {
  refreshing.value = true
  await fetchAndUpdate(currentCity.value)
  refreshing.value = false
  uni.stopPullDownRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

async function locateMe() {
  if (locating.value) return
  locating.value = true
  fetchSeq++
  const coords = await detectCoords()
  if (!coords) {
    uni.showToast({ title: "定位失败: " + locateError.value, icon: "none", duration: 3000 })
    locating.value = false
    return
  }
  loading.value = true
  errorType.value = null
  forecastHourlys.value = {}
  expandedIndex.value = -1
  const result = await getWeatherByCoords(coords.lat, coords.lon)
  if (result) {
    currentCity.value = result.placeName
    uni.setStorageSync(CACHE.CITY_KEY, result.placeName)
    weatherCity.value = result.placeName
    applyWeatherData(result.weather)
    setCache(result.weather, result.placeName)
  } else {
    errorType.value = isOffline.value ? "network" : "server"
    uni.showToast({ title: "获取天气失败", icon: "none", duration: 2000 })
  }
  loading.value = false
  locating.value = false
  if (!isOffline.value) checkTyphoon()
}

async function toggleForecast(idx: number) {
  if (expandedIndex.value === idx) {
    expandedIndex.value = -1
    return
  }
  expandedIndex.value = idx
  if (!forecastHourlys.value[idx] && weather.value) {
    const date = weather.value.forecast[idx]?.date
    if (date && weather.value.hourlyByDate?.[date]) {
      forecastHourlys.value[idx] = weather.value.hourlyByDate[date]
    } else if (date) {
      const coords = getCityCoords(currentCity.value)
      if (coords) {
        forecastHourlys.value[idx] = await getHourlyForecast(coords.lat, coords.lon, date)
      }
    }
  }
}

function showAllAlerts() {
  if (!weather.value?.alerts?.length) return
  try { uni.setStorageSync("current_alerts", JSON.stringify(weather.value.alerts)) } catch {}
  uni.navigateTo({ url: "/pages/alerts/alerts" })
}

function roundRectCtx(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawShareCard(): Promise<string> {
  return new Promise((resolve, reject) => {
    const w = displayWeather.value!
    const city = currentCity.value
    const W = 500, H = 700, P = 30
    const colors = gradientColors(w.weather)
    const textColor = w.weather.includes('雪') ? '#2c3e50' : '#ffffff'
    const muted = (a: number) => w.weather.includes('雪') ? `rgba(44,62,80,${a})` : `rgba(255,255,255,${a})`

    const ctx = uni.createCanvasContext('shareCanvas')

    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, colors[0])
    grad.addColorStop(0.5, colors[1])
    grad.addColorStop(1, colors[2])
    ctx.setFillStyle(grad)
    ctx.fillRect(0, 0, W, H)

    ctx.setGlobalAlpha(0.06)
    ctx.setFillStyle('#ffffff')
    ctx.beginPath()
    ctx.arc(W - 20, -20, 160, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(W - 140, -80, 100, 0, Math.PI * 2)
    ctx.fill()
    ctx.setGlobalAlpha(1)

    ctx.setGlobalAlpha(0.04)
    ctx.beginPath()
    ctx.arc(250, H, 300, Math.PI, 0)
    ctx.fill()
    ctx.setGlobalAlpha(1)

    ctx.setFontSize(30)
    ctx.setFillStyle(textColor)
    ctx.setTextAlign('center')
    ctx.setTextBaseline('top')
    ctx.fillText(city, W / 2, P + 8)

    const now = new Date()
    const dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日'
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    ctx.setFontSize(13)
    ctx.setGlobalAlpha(0.6)
    ctx.setFillStyle(textColor)
    ctx.fillText(dateStr + ' ' + weekdays[now.getDay()], W / 2, P + 48)
    ctx.setGlobalAlpha(1)

    ctx.setFontSize(96)
    ctx.setFillStyle(textColor)
    ctx.fillText(w.temp + '°', W / 2, P + 90)

    ctx.setFontSize(20)
    ctx.setGlobalAlpha(0.85)
    ctx.setFillStyle(textColor)
    ctx.fillText(w.weather, W / 2, P + 200)
    ctx.setFontSize(14)
    ctx.setGlobalAlpha(0.6)
    ctx.fillText('体感 ' + w.feelsLike + '°', W / 2, P + 232)
    ctx.setGlobalAlpha(1)

    ctx.setFontSize(18)
    ctx.setFillStyle(textColor)
    ctx.fillText('↑ ' + w.high + '°    ↓ ' + w.low + '°', W / 2, P + 270)

    const details: { label: string; value: string }[] = [
      { label: '湿度', value: w.humidity + '%' },
      { label: w.windDir || '风向', value: w.windLevel || '--' },
      { label: '紫外线', value: uvLabel(w.uvIndex) },
      { label: '气压', value: w.pressure },
      { label: '能见度', value: w.visibility },
      { label: '日出', value: w.sunrise },
    ]

    const cols = 3
    const cardW = (W - P * 2 - 12) / 3
    const cardH = 58
    const gridStartY = P + 315

    details.forEach((d, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = P + col * (cardW + 6)
      const y = gridStartY + row * (cardH + 6)

      ctx.setFillStyle(muted(0.13))
      roundRectCtx(ctx, x, y, cardW, cardH, 8)
      ctx.fill()

      ctx.setFontSize(11)
      ctx.setTextAlign('center')
      ctx.setTextBaseline('top')
      ctx.setGlobalAlpha(0.6)
      ctx.setFillStyle(textColor)
      ctx.fillText(d.label, x + cardW / 2, y + 8)
      ctx.setFontSize(15)
      ctx.setGlobalAlpha(1)
      ctx.fillText(d.value, x + cardW / 2, y + 28)
    })

    const sunsetY = gridStartY + 2 * (cardH + 6) + 16
    ctx.setGlobalAlpha(0.12)
    ctx.setStrokeStyle(textColor)
    ctx.setLineWidth(1)
    ctx.beginPath()
    ctx.moveTo(P, sunsetY)
    ctx.lineTo(W - P, sunsetY)
    ctx.stroke()
    ctx.setGlobalAlpha(1)

    ctx.setFontSize(13)
    ctx.setGlobalAlpha(0.6)
    ctx.setFillStyle(textColor)
    ctx.setTextAlign('center')
    ctx.fillText('日落 ' + w.sunset, W / 2, sunsetY + 12)
    ctx.setGlobalAlpha(1)

    ctx.setFontSize(13)
    ctx.setGlobalAlpha(0.4)
    ctx.setFillStyle(textColor)
    ctx.fillText('清清天气 · 知冷暖 观风雨', W / 2, H - 36)
    ctx.setGlobalAlpha(1)

    ctx.draw(false, () => {
      uni.canvasToTempFilePath({
        canvasId: 'shareCanvas',
        success: (res: any) => resolve(res.tempFilePath),
        fail: (err: any) => reject(err),
      })
    })
  })
}

async function shareWeather() {
  if (!weather.value || !displayWeather.value) return
  try {
    const tempPath = await drawShareCard()
    uni.saveImageToPhotosAlbum({
      filePath: tempPath,
      success() {
        uni.showToast({ title: '天气卡片已保存到相册', icon: 'none' })
      },
      fail(err: any) {
        if (String(err.errMsg || '').includes('deny') || String(err.errMsg || '').includes('permission')) {
          uni.showModal({
            title: '需要相册权限',
            content: '请在系统设置中允许本应用访问相册',
            confirmText: '去设置',
            success(res: any) {
              if (res.confirm) uni.openSetting({})
            },
          })
        } else {
          uni.showToast({ title: '保存失败: ' + (err.errMsg || ''), icon: 'none' })
        }
      },
    })
  } catch (e: any) {
    uni.showToast({ title: '生成卡片失败', icon: 'none' })
  }
}

const showCityPicker = ref(false)
const showMoreMenu = ref(false)
const favCities = ref<string[]>([])

function loadFavCities() {
  try {
    const raw = uni.getStorageSync("fav_cities") as string
    favCities.value = raw ? JSON.parse(raw) as string[] : []
  } catch { favCities.value = [] }
}

function toggleCityPicker() {
  if (!showCityPicker.value) loadFavCities()
  showCityPicker.value = !showCityPicker.value
}

function switchCity(name: string) {
  showCityPicker.value = false
  if (name === currentCity.value) return
  currentCity.value = name
  uni.setStorageSync("selected_city", name)
  forecastHourlys.value = {}
  expandedIndex.value = -1
  fetchAndUpdate(name)
  if (!isOffline.value) checkTyphoon()
}

function goSearch() {
  showCityPicker.value = false
  uni.navigateTo({ url: "/pages/search/search" })
}

function goCities() {
  showCityPicker.value = false
  uni.navigateTo({ url: "/pages/cities/cities" })
}

function goCompare() {
  showCityPicker.value = false
  uni.navigateTo({ url: "/pages/compare/compare" })
}

function goTyphoon() {
  uni.navigateTo({ url: "/pages/typhoon/typhoon" })
}

function goQuake() {
  uni.navigateTo({ url: "/pages/earthquake/earthquake" })
}

function goRadar() {
  uni.navigateTo({ url: "/pages/radar/radar" })
}

function goAstronomy() {
  uni.navigateTo({
    url: "/pages/astronomy/astronomy",
    fail: () => uni.showToast({ title: "页面打开失败", icon: "none" }),
  })
}

function goSettings() {
  uni.navigateTo({ url: "/pages/settings/settings" })
}

function openMoreMenu() {
  showMoreMenu.value = true
}

function onMoreAction(idx: number) {
  showMoreMenu.value = false
  if (idx === 0) toggleDark()
  else if (idx === 1) shareWeather()
  else if (idx === 2) copyTextSummary()
  else if (idx === 3) goSettings()
}

function copyTextSummary() {
  if (!weather.value || !displayWeather.value) return
  const w = displayWeather.value
  const hrs = weather.value.hourly?.slice(0, 8) || []
  const maxRain = hrs.length ? Math.max(...hrs.map(h => parseInt(h.rainChance) || 0)) : 0
  const lines = [
    "【今日天气 · " + currentCity.value + "】" + w.weather + " " + w.high + "° / " + w.low + "°",
    "体感 " + w.feelsLike + "° · 湿度 " + w.humidity + "% · " + w.windLevel,
    "降水 " + (maxRain > 0 ? maxRain + "%" : "暂无") + " · 紫外线 " + uvLabel(w.uvIndex) + (w.aqi !== "--" ? " · 空气 " + w.aqiLabel + "(" + w.aqi + ")" : ""),
    "—— 清清天气",
  ]
  uni.setClipboardData({
    data: lines.join("\n"),
    success() { uni.showToast({ title: "天气摘要已复制", icon: "none" }) },
    fail() { uni.showToast({ title: "复制失败", icon: "none" }) },
  })
}

const RAIN_NOTIFIED_KEY = "rain_notified"

const DIGEST_NOTIFIED_KEY = "digest_sent"

function sendDailyDigest() {
  try {
    const raw = uni.getStorageSync("digest_settings") as string
    if (raw && JSON.parse(raw).enabled === false) return
    if (!weather.value) return
    const today = new Date().toDateString()
    const key = currentCity.value + "_" + today
    if (uni.getStorageSync(DIGEST_NOTIFIED_KEY) === key) return
    const w = weather.value
    const hrs = w.hourly?.slice(0, 8) || []
    const maxRain = hrs.length ? Math.max(...hrs.map(h => parseInt(h.rainChance) || 0)) : 0
    let content = w.weather + "，" + w.high + "° / " + w.low + "°"
    if (maxRain >= 30) content += "。未来几小时降水概率 " + maxRain + "%，记得带伞"
    content += "。紫外线 " + uvLabel(w.uvIndex)
    if (w.aqi !== "--") content += "，空气" + w.aqiLabel
    uni.setStorageSync(DIGEST_NOTIFIED_KEY, key)
    if (typeof uni.createPushMessage === "function") {
      uni.createPushMessage({
        title: "今日天气 · " + currentCity.value,
        content,
      })
    }
  } catch {}
}

function checkTempAlert() {
  try {
    const raw = uni.getStorageSync("temp_alert_settings") as string
    if (!raw) return
    const s = JSON.parse(raw)
    if (!s.enabled || !weather.value) return
    const t = parseFloat(weather.value.temp)
    if (isNaN(t)) return
    let level = ""
    if (s.high != null && t >= s.high) level = "高温"
    else if (s.low != null && t <= s.low) level = "低温"
    if (!level) return
    const key = currentCity.value + "_" + new Date().toDateString() + "_" + level
    const stored = uni.getStorageSync("temp_alert_notified") as string
    if (stored === key) return
    uni.setStorageSync("temp_alert_notified", key)
    if (typeof uni.createPushMessage === "function") {
      uni.createPushMessage({
        title: level + "提醒 · " + currentCity.value,
        content: "当前气温 " + weather.value.temp + "°C，" + (level === "高温" ? "注意防暑降温" : "注意保暖"),
      })
    }
  } catch {}
}

function notifyRainIfNeeded() {
  if (!rainAlarm.value) return
  try {
    const key = currentCity.value + "_" + new Date().toDateString() + "_" + rainAlarm.value.maxPct
    const stored = uni.getStorageSync(RAIN_NOTIFIED_KEY) as string
    if (stored === key) return
    uni.setStorageSync(RAIN_NOTIFIED_KEY, key)
    if (typeof uni.createPushMessage === "function") {
      uni.createPushMessage({
        title: "🌧 降雨提醒 · " + currentCity.value,
        content: "未来" + rainAlarm.value.count + "小时可能降雨（" + rainAlarm.value.maxPct + "%），出门记得带伞",
      })
    }
  } catch {}
}

const ALERT_NOTIFIED_KEY = "alert_notified"

function checkAlertsAndNotify(alerts: import("@/api/weather").AlertItem[]) {
  if (!alerts.length) return
  try {
    const raw = uni.getStorageSync(ALERT_NOTIFIED_KEY) as string
    const notified: string[] = raw ? JSON.parse(raw) : []
    for (const a of alerts) {
      const key = a.event + a.start + a.end
      if (notified.includes(key)) continue
      notified.push(key)
      if (typeof uni.createPushMessage === "function") {
        uni.createPushMessage({
          title: "天气预警: " + a.event,
          content: a.severity ? "[" + a.severity + "] " + (a.description || "").slice(0, 60) : (a.description || "").slice(0, 60),
        })
      }
    }
    const recent = notified.slice(-50)
    uni.setStorageSync(ALERT_NOTIFIED_KEY, JSON.stringify(recent))
  } catch {}
}

function readRefreshInterval(): number {
  try {
    const raw = uni.getStorageSync("unit_settings") as string
    if (raw) {
      const s = JSON.parse(raw)
      if (typeof s.refresh === "number") return s.refresh * 60 * 1000
    }
  } catch {}
  return CACHE.AUTO_REFRESH_MS
}

const displayWeather = computed(() => {
  if (!weather.value) return null
  const s = getUnitSettings()
  const w = { ...weather.value }
  w.temp = formatTemp(w.temp, s.temp === "f")
  w.feelsLike = formatTemp(w.feelsLike, s.temp === "f")
  w.high = formatTemp(w.high, s.temp === "f")
  w.low = formatTemp(w.low, s.temp === "f")
  if (s.wind !== "kmh") {
    w.windScale = formatWind(w.windScale, s.wind)
    w.windGust = formatWind(w.windGust, s.wind)
  }
  w.pressure = formatPressure(w.pressure, s.pressure)
  w.visibility = formatVisibility(w.visibility, s.visibility)
  return w
})

const homeModules = ref<{ modules: Record<string, boolean>; order: string[] }>({
  modules: { detail: true, aqi: true, forecast: true, hourly: true, lifetips: true, temptr: true, preciptr: true, typhoon: true, quake: true, radar: true, stargazing: true },
  order: ["detail", "aqi", "forecast", "hourly", "lifetips", "temptr", "preciptr", "typhoon", "quake", "radar", "stargazing"],
})

function loadHomeModules() {
  const s = getUnitSettings()
  homeModules.value = {
    modules: s.modules as unknown as Record<string, boolean>,
    order: s.moduleOrder && s.moduleOrder.length ? s.moduleOrder : ["detail", "aqi", "forecast", "hourly", "lifetips", "temptr", "preciptr", "typhoon", "quake", "radar", "stargazing"],
  }
}

const displayHourly = computed(() => {
  if (!weather.value?.hourly) return []
  const s = getUnitSettings()
  return weather.value.hourly.map(h => ({
    ...h,
    temp: formatTemp(h.temp, s.temp === "f"),
    feelsLike: h.feelsLike != null ? formatTemp(h.feelsLike, s.temp === "f") : h.feelsLike,
    windScale: s.wind !== "kmh" ? formatWind(h.windScale, s.wind) : h.windScale,
  }))
})

const displayForecast = computed(() => {
  if (!weather.value?.forecast) return []
  const s = getUnitSettings()
  return weather.value.forecast.map(f => ({
    ...f,
    high: formatTemp(f.high, s.temp === "f"),
    low: formatTemp(f.low, s.temp === "f"),
  }))
})



const rainAlarm = computed(() => {
  if (!weather.value?.hourly?.length) return null
  const now = new Date().getHours()
  const next6 = weather.value.hourly.filter(h => {
    const hh = parseInt(h.time)
    return hh >= now && hh < now + 6
  })
  const risky = next6.filter(h => parseInt(h.rainChance) > 50)
  if (!risky.length) return null
  const maxPct = Math.max(...risky.map(h => parseInt(h.rainChance)))
  return { count: risky.length, maxPct }
})

const typhoonAlert = ref<{ name: string; distance: number; minPath: number; minPathHours: number; windSpeed: number; grade: string } | null>(null)
let typhoonCheckInFlight = false

async function checkTyphoon() {
  if (typhoonCheckInFlight) return
  typhoonCheckInFlight = true
  try {
    const coords = getCityCoords(currentCity.value)
    if (!coords) { typhoonAlert.value = null; return }
    const typhoons = await fetchActiveTyphoons()
    if (!typhoons.length) { typhoonAlert.value = null; return }
    let nearest: TyphoonBrief | null = null
    let nearestDist = Infinity
    for (const t of typhoons) {
      const d = typhoonDistanceKm(t, coords.lat, coords.lon)
      if (d < nearestDist) { nearestDist = d; nearest = t }
    }
    if (nearest && nearestDist <= 2500) {
      let minPath = nearestDist
      let minPathHours = 0
      if (nearest.path?.length) {
        for (const p of nearest.path) {
          const pd = pointDistanceKm(coords.lat, coords.lon, p.lat, p.lon)
          if (pd < minPath) {
            minPath = pd
            minPathHours = p.hours || 0
          }
        }
      }
      typhoonAlert.value = {
        name: nearest.nameCn || nearest.nameEn || "台风",
        distance: Math.round(nearestDist),
        minPath: Math.round(minPath),
        minPathHours,
        windSpeed: nearest.windSpeed,
        grade: nearest.grade,
      }
    } else {
      typhoonAlert.value = null
    }
  } catch {
    typhoonAlert.value = null
  } finally {
    typhoonCheckInFlight = false
  }
}

const weatherGradient = computed(() => weather.value ? gradientFor(weather.value.weather) : "linear-gradient(175deg, #7AB8D8 0%, #A8D4E8 35%, #D8ECF8 100%)")
const accentColor = computed(() => weather.value ? accentFor(weather.value.weather) : "#E09050")
const lightBg = computed(() => weather.value && lightFor(weather.value.weather))
const weatherScene = computed(() => {
  if (!weather.value) return ""
  const w = weather.value.weather
  if (w.includes("雷")) return "scene-thunder"
  if (w.includes("雪") || w.includes("冰雹") || w.includes("雹")) return "scene-snow"
  if (w.includes("雨")) return "scene-rain"
  if (w.includes("雾") || w.includes("霾")) return "scene-fog"
  if (w.includes("晴")) return "scene-sunny"
  if (w.includes("多云")) return "scene-cloudy"
  if (w.includes("阴")) return "scene-overcast"
  return ""
})
</script>

<template>
    <view class="container" :class="[{ 'light-bg': lightBg, 'dark-mode': darkMode }, weatherScene]" :style="{ background: weatherGradient, paddingTop: (statusBarHeight + 12) + 'px' }">
    <WeatherParticles :weather="displayWeather?.weather || ''" />
    <view v-if="showBrand && loading" class="brand-screen">
      <text class="brand-name">清清天气</text>
      <text class="brand-slogan">知冷暖 · 观风雨</text>
    </view>
    <SkeletonLoader v-if="!showBrand && loading && !weather" />

    <template v-else-if="weather">
      <view class="header-section anim-fade-in-down">
        <view class="city-row" @tap="toggleCityPicker">
          <view class="city-left">
            <text class="city-name">{{ currentCity }}</text>
            <text class="city-arrow">&#9662;</text>
          </view>
          <view class="header-actions">
            <view :class="['locate-btn', locating && 'is-locating']" @tap.stop="locateMe">
              <text class="locate-icon">{{ locating ? '◎' : '◎' }}</text>
              <text class="locate-text">{{ locating ? '定位中' : '定位' }}</text>
            </view>
            <view class="locate-btn more-btn" @tap.stop="openMoreMenu">
              <text class="locate-icon">⋯</text>
            </view>
          </view>
        </view>
        <text class="update-time" v-if="updateTime">{{ refreshing ? '刷新中...' : '更新于 ' + updateTime }}</text>
      </view>

      <view v-if="weather.alerts && weather.alerts.length > 0" class="alert-banner anim-fade-in-down" style="animation-delay: 0.05s" @tap="showAllAlerts">
        <text class="alert-icon">⚠</text>
        <text class="alert-text">{{ weather.alerts[0].event }}{{ weather.alerts.length > 1 ? ' 等' + weather.alerts.length + '条' : '' }}</text>
        <text class="alert-count" v-if="weather.alerts.length > 1">{{ weather.alerts.length }}</text>
        <text class="alert-arrow">›</text>
      </view>
      <view v-if="rainAlarm" class="rain-alarm-banner anim-fade-in-down" style="animation-delay: 0.08s">
        <text class="rain-alarm-icon">☔</text>
        <text class="rain-alarm-text">未来{{ rainAlarm.count }}小时可能降雨（{{ rainAlarm.maxPct }}%），出门记得带伞</text>
      </view>
      <view v-if="typhoonAlert" class="typhoon-alert-banner anim-fade-in-down" style="animation-delay: 0.1s" @tap="goTyphoon">
        <text class="typhoon-alert-icon">🌀</text>
        <text class="typhoon-alert-text">台风「{{ typhoonAlert.name }}」距 {{ currentCity }} 约 {{ typhoonAlert.distance }}km{{ typhoonAlert.minPath < typhoonAlert.distance ? '，路径最近约 ' + typhoonAlert.minPath + 'km' + (typhoonAlert.minPathHours > 0 ? '（约 ' + typhoonAlert.minPathHours + ' 小时后）' : '') : '' }}，点击查看路径</text>
        <text class="typhoon-alert-arrow">›</text>
      </view>
      <view v-if="isOffline" class="offline-banner">
        <text class="offline-text">📡 网络已断开，显示的是缓存数据</text>
      </view>

      <WeatherHero :temp="displayWeather!.temp" :feelsLike="displayWeather!.feelsLike" :weather="displayWeather!.weather" :high="displayWeather!.high" :low="displayWeather!.low" :accentColor="accentColor" :sunrise="displayWeather!.sunrise" :sunset="displayWeather!.sunset" />

      <template v-for="key in homeModules.order" :key="key">
        <DetailGrid v-if="key === 'detail' && homeModules.modules.detail" :weather="displayWeather!" />

        <AqiCard v-if="key === 'aqi' && homeModules.modules.aqi && displayWeather!.aqi !== '--'" :weather="displayWeather!" />

        <ForecastCard v-if="key === 'forecast' && homeModules.modules.forecast" :forecast="displayForecast" :forecastHourlys="forecastHourlys" :expandedIndex="expandedIndex" @toggle="toggleForecast" />

        <view class="card hourly-card anim-fade-in-up" style="animation-delay: 0.25s" v-if="key === 'hourly' && homeModules.modules.hourly && displayHourly.length > 0">
          <view class="section-header">
            <view class="section-decor" />
            <text class="section-title">逐时天气</text>
          </view>
          <HourlyTrend :hourly="displayHourly" />
          <HourlyScroll :hourly="displayHourly" :sunrise="displayWeather!.sunrise" :sunset="displayWeather!.sunset" />
        </view>

        <LifeTips v-if="key === 'lifetips' && homeModules.modules.lifetips" class="lazy-render" :weather="displayWeather!" />

        <TempTrend v-if="key === 'temptr' && homeModules.modules.temptr" class="lazy-render" :forecast="displayForecast" />

        <PrecipTrend v-if="key === 'preciptr' && homeModules.modules.preciptr" class="lazy-render" :forecast="displayForecast" />

        <view v-if="key === 'typhoon' && homeModules.modules.typhoon" class="entry-module">
          <view class="entry-card typhoon-entry" @tap="goTyphoon">
            <view class="entry-icon-wrap">
              <image src="/static/typhoon-entry.svg" class="entry-icon-svg" mode="aspectFit" />
            </view>
            <view class="entry-text-wrap">
              <text class="entry-title">台风路径</text>
              <text class="entry-subtitle">查看实时台风动态</text>
            </view>
            <text class="entry-arrow">›</text>
          </view>
        </view>

        <view v-if="key === 'quake' && homeModules.modules.quake" class="entry-module">
          <view class="entry-card quake-entry" @tap="goQuake">
            <view class="entry-icon-wrap">
              <text class="entry-icon">🌍</text>
            </view>
            <view class="entry-text-wrap">
              <text class="entry-title">地震信息</text>
              <text class="entry-subtitle">全球地震数据查询</text>
            </view>
            <text class="entry-arrow">›</text>
          </view>
        </view>

        <view v-if="key === 'radar' && homeModules.modules.radar" class="entry-module">
          <view class="entry-card radar-entry" @tap="goRadar">
            <view class="entry-icon-wrap">
              <text class="entry-icon">🌧</text>
            </view>
            <view class="entry-text-wrap">
              <text class="entry-title">雷达降水</text>
              <text class="entry-subtitle">实时降雨雷达图</text>
            </view>
            <text class="entry-arrow">›</text>
          </view>
        </view>

        <view v-if="key === 'stargazing' && homeModules.modules.stargazing" @tap="goAstronomy">
          <StargazingCard :weather="displayWeather!" />
        </view>
      </template>
    </template>

    <view v-else class="error-view">
      <text class="error-icon">{{ errorType === "network" ? "📡" : "☁" }}</text>
      <text class="error-text">{{ errorType === "network" ? "网络已断开，请检查连接" : errorType === "timeout" ? "请求超时，服务器未响应" : "无法获取天气数据" }}</text>
      <view class="retry-btn" @tap="fetchAndUpdate(currentCity)">
        <text>重新加载</text>
      </view>
    </view>
    <view class="city-picker-overlay" v-if="showCityPicker" @tap="showCityPicker = false">
      <view class="city-picker-card" @tap.stop>
        <view class="picker-header">
          <text class="picker-title">切换城市</text>
          <text class="picker-close" @tap="showCityPicker = false">✕</text>
        </view>
        <scroll-view class="picker-list" scroll-y>
          <view class="picker-item current" @tap="switchCity(currentCity)">
            <text class="picker-city">{{ currentCity }}</text>
            <text class="picker-tag">当前</text>
          </view>
          <view class="picker-divider" v-if="favCities.length > 0" />
          <view class="picker-item" v-for="c in favCities" :key="c" @tap="switchCity(c)" :class="{ active: c === currentCity }">
            <text class="picker-city">{{ c }}</text>
            <text class="picker-check" v-if="c === currentCity">✓</text>
          </view>
        </scroll-view>
        <view class="picker-footer" @tap="goSearch">
          <text class="picker-search-icon">🔍</text>
          <text>搜索更多城市</text>
        </view>
        <view class="picker-footer manage-footer" @tap="goCities">
          <text class="picker-search-icon">📋</text>
          <text>管理收藏城市</text>
        </view>
        <view class="picker-footer manage-footer" @tap="goCompare">
          <text class="picker-search-icon">⚖</text>
          <text>城市对比</text>
        </view>
      </view>
    </view>
    <canvas canvas-id="shareCanvas" class="share-canvas"></canvas>
    <view class="more-overlay" v-if="showMoreMenu" @tap="showMoreMenu = false">
      <view class="more-menu" :style="{ top: (statusBarHeight + 64) + 'px' }" @tap.stop>
        <view class="more-item" @tap.stop="onMoreAction(0)">
          <text class="more-icon">{{ darkMode ? '☀️' : '🌙' }}</text>
          <text class="more-text">{{ darkMode ? '浅色模式' : '深色模式' }}</text>
          <text class="more-check" v-if="darkMode">●</text>
        </view>
        <view class="more-divider" />
        <view class="more-item" @tap.stop="onMoreAction(1)">
          <text class="more-icon">📤</text>
          <text class="more-text">分享天气卡片</text>
        </view>
        <view class="more-divider" />
        <view class="more-item" @tap.stop="onMoreAction(2)">
          <text class="more-icon">📋</text>
          <text class="more-text">复制天气摘要</text>
        </view>
        <view class="more-divider" />
        <view class="more-item" @tap.stop="onMoreAction(3)">
          <text class="more-icon">⚙</text>
          <text class="more-text">设置</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.container {
  box-sizing: border-box;
  padding-left: var(--spacing-lg);
  padding-right: var(--spacing-lg);
  padding-bottom: calc(32px + var(--window-bottom, 0px));
  min-height: 100vh;
  position: relative;
  z-index: 0;
  overflow-x: hidden;
}

.container::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  will-change: opacity;
}

.lazy-render {
  content-visibility: auto;
  contain-intrinsic-size: auto 260px;
}

.container.scene-sunny::before {
  background: radial-gradient(ellipse at 30% 15%, rgba(255,220,100,0.1) 0%, transparent 50%);
  animation: sunny-glow 5s ease-in-out infinite;
}
.container.scene-rain::before {
  background: linear-gradient(180deg, rgba(180,210,240,0.06) 0%, rgba(180,210,240,0.12) 50%, transparent 100%);
  animation: rain-fade 4s ease-in-out infinite;
}
.container.scene-snow::before {
  background: radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 60%);
  animation: snow-fall 8s ease-in-out infinite;
}
.container.scene-thunder::before {
  background: radial-gradient(ellipse at 50% 30%, rgba(180,160,200,0.08) 0%, transparent 50%);
  animation: thunder-flash 8s ease-in-out infinite;
}
.container.scene-fog::before {
  background: linear-gradient(90deg, rgba(200,210,220,0.06) 0%, rgba(200,210,220,0.12) 50%, rgba(200,210,220,0.06) 100%);
  animation: fog-drift 8s ease-in-out infinite;
}
.container.scene-cloudy::before,
.container.scene-overcast::before {
  background: radial-gradient(ellipse at 60% 20%, rgba(255,255,255,0.06) 0%, transparent 50%);
  animation: cloudy-drift 6s ease-in-out infinite;
}

@keyframes sunny-glow {
  0%, 100% { opacity: .6; }
  50% { opacity: 1; }
}
@keyframes rain-fade {
  0%, 100% { opacity: .4; }
  50% { opacity: .8; }
}
@keyframes snow-fall {
  0%, 100% { opacity: .3; }
  50% { opacity: .7; }
}
@keyframes thunder-flash {
  0%, 90%, 100% { opacity: .2; }
  92% { opacity: .8; }
  94% { opacity: .1; }
  96% { opacity: .6; }
}
@keyframes fog-drift {
  0%, 100% { opacity: .3; }
  50% { opacity: .6; }
}
@keyframes cloudy-drift {
  0%, 100% { opacity: .3; }
  50% { opacity: .6; }
}

.light-bg .city-name,
.light-bg .temp-value,
.light-bg .temp-unit,
.light-bg .weather-desc,
.light-bg .detail-value,
.light-bg .detail-label,
.light-bg .section-title,
.light-bg .forecast-day,
.light-bg .forecast-weather,
.light-bg .forecast-high,
.light-bg .forecast-low,
.light-bg .hourly-time,
.light-bg .hourly-temp,
.light-bg .hourly-desc,
.light-bg .update-time,
.light-bg .entry-title { color: var(--color-ink); }

.light-bg .card { background: rgba(255,255,255,0.85); }
.light-bg .detail-item { background: rgba(255,255,255,0.7); }
.light-bg .entry-card { background: rgba(255,255,255,0.85); }

.header-section {
  padding: var(--spacing-sm) 0 var(--spacing-xl);
}

.city-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.city-left {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
}

.city-name {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 4px rgba(0,0,0,0.15);
}

.city-arrow {
  font-size: var(--font-size-xs);
  color: rgba(255,255,255,0.7);
  opacity: 0;
  transition: opacity var(--transition-fast);
  will-change: opacity;
}

.city-row:active .city-arrow {
  opacity: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.locate-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 7px 14px;
  border-radius: var(--radius-full);
  background: rgba(255,255,255,0.22);
  border: 1px solid rgba(255,255,255,0.3);
  transition: transform var(--transition-fast), background var(--transition-fast);
}

.locate-btn.is-locating {
  background: rgba(255,255,255,0.35);
  border-color: rgba(255,255,255,0.5);
}

.more-btn {
  padding: 7px 12px;
}
.more-btn .locate-icon {
  font-size: 18px;
  line-height: 1;
  font-weight: var(--font-weight-bold);
}

.locate-btn:active {
  background: rgba(255,255,255,0.4);
  transform: scale(0.95);
}

.locate-icon {
  font-size: 12px;
  line-height: 1;
}

.locate-btn.is-locating .locate-icon {
  animation: spin 1s linear infinite;
}

.locate-text {
  font-size: var(--font-size-xs);
  color: #fff;
  font-weight: var(--font-weight-medium);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.update-time {
  font-size: var(--font-size-xs);
  color: rgba(255,255,255,0.6);
  margin-top: 2px;
}

.offline-banner {
  text-align: center;
  padding: 4px var(--spacing-md);
  margin: 0 var(--spacing-md) var(--spacing-sm);
  border-radius: var(--radius-md);
  background: rgba(255, 100, 50, 0.2);
  border: 1px solid rgba(255, 100, 50, 0.35);
}
.offline-text {
  font-size: var(--font-size-xs);
  color: rgba(255,255,255,0.9);
}

.rain-alarm-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin: 0 var(--spacing-md) var(--spacing-sm);
  padding: 8px 14px;
  border-radius: var(--radius-md);
  background: rgba(91, 143, 192, 0.2);
  border: 1px solid rgba(91, 143, 192, 0.35);
}
.rain-alarm-icon {
  font-size: 14px;
  flex-shrink: 0;
}
.rain-alarm-text {
  font-size: var(--font-size-xs);
  color: rgba(255,255,255,0.95);
}

.typhoon-alert-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin: 0 var(--spacing-md) var(--spacing-sm);
  padding: 8px 14px;
  border-radius: var(--radius-md);
  background: rgba(216, 91, 79, 0.22);
  border: 1px solid rgba(216, 91, 79, 0.4);
}
.typhoon-alert-icon {
  font-size: 14px;
  flex-shrink: 0;
}
.typhoon-alert-text {
  font-size: var(--font-size-xs);
  color: rgba(255,255,255,0.95);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.typhoon-alert-arrow {
  font-size: 16px;
  color: rgba(255,255,255,0.6);
  flex-shrink: 0;
}

.alert-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin: 0 var(--spacing-md) var(--spacing-sm);
  padding: 8px 14px;
  border-radius: var(--radius-md);
  background: rgba(255, 200, 50, 0.2);
  border: 1px solid rgba(255, 200, 50, 0.4);
}
.alert-icon {
  font-size: 14px;
  flex-shrink: 0;
}
.alert-count {
  font-size: 10px;
  background: rgba(255,255,255,0.25);
  border-radius: 10px;
  padding: 1px 6px;
  color: #fff;
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}
.alert-text {
  font-size: var(--font-size-xs);
  color: rgba(255,255,255,0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.alert-arrow {
  font-size: 16px;
  color: rgba(255,255,255,0.6);
  flex-shrink: 0;
}

.card {
  background: rgba(255,255,255,0.92);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-lg);
  box-shadow: 0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03);
  margin-bottom: var(--spacing-md);
  border: 1px solid rgba(255,255,255,0.6);
  transform: translateZ(0);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.section-decor {
  width: 3px;
  height: 18px;
  background: var(--color-primary);
  border-radius: 2px;
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-ink);
}

.entry-cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}
.entry-module {
  margin-bottom: var(--spacing-md);
}

.entry-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg) var(--spacing-xl);
  background: rgba(255,255,255,0.92);
  border-radius: var(--radius-xl);
  box-shadow: 0 2px 16px rgba(0,0,0,0.06);
  border: 1px solid rgba(255,255,255,0.6);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  transform: translateZ(0);
}

.entry-card:active {
  transform: scale(0.985);
  box-shadow: 0 1px 8px rgba(0,0,0,0.04);
}

.entry-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.typhoon-entry .entry-icon-wrap { background: rgba(91,143,192,0.1); }
.quake-entry .entry-icon-wrap { background: rgba(109,175,152,0.1); }
.radar-entry .entry-icon-wrap { background: rgba(109,175,152,0.1); }

.entry-icon { font-size: 22px; }

.entry-icon-svg {
  width: 28px;
  height: 28px;
}

.entry-text-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.entry-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-ink);
}

.entry-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
}

.entry-arrow {
  font-size: 22px;
  color: var(--color-ash);
  font-weight: var(--font-weight-light);
}

.error-view {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 500px;
  gap: var(--spacing-md);
}

.error-icon {
  font-size: 48px;
  opacity: 0.4;
}

.error-text {
  color: rgba(255,255,255,0.75);
  font-size: var(--font-size-md);
}

.retry-btn {
  background: rgba(255,255,255,0.9);
  border-radius: var(--radius-full);
  padding: 10px 32px;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast);
}

.retry-btn:active { transform: scale(0.96); }

.brand-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  gap: var(--spacing-md);
}

.brand-name {
  font-size: 36px;
  font-weight: var(--font-weight-bold);
  color: #fff;
  letter-spacing: 0.12em;
  text-shadow: 0 2px 12px rgba(0,0,0,0.12);
}

.brand-slogan {
  font-size: var(--font-size-md);
  color: rgba(255,255,255,0.75);
  letter-spacing: 0.2em;
}

.dark-mode .detail-item { background: rgba(30,36,48,0.6); border-color: rgba(255,255,255,0.06); }
.dark-mode .card { background: rgba(30,36,48,0.85); border-color: rgba(255,255,255,0.08); box-shadow: 0 2px 16px rgba(0,0,0,0.2); }
.dark-mode .entry-card { background: rgba(30,36,48,0.85); }

.city-picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
.city-picker-card {
  width: 320px;
  max-height: 70vh;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 8px;
}
.picker-title {
  font-size: 17px;
  font-weight: 600;
  color: #2c3e50;
}
.picker-close {
  font-size: 18px;
  color: #999;
  padding: 4px;
}
.picker-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  transition: background .1s;
}
.picker-item:active { background: #f0f4f8; }
.picker-item.current { background: #f7fafc; }
.picker-item.active .picker-city { color: #5B8FC0; }
.picker-city {
  font-size: 16px;
  color: #2c3e50;
  font-weight: 500;
}
.picker-tag {
  font-size: 10px;
  color: #5B8FC0;
  background: rgba(91,143,192,0.1);
  padding: 2px 8px;
  border-radius: 10px;
}
.picker-check {
  font-size: 16px;
  color: #5B8FC0;
  font-weight: 700;
}
.picker-divider {
  height: 1px;
  background: #eef2f6;
  margin: 4px 16px;
}
.picker-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 20px;
  border-top: 1px solid #eef2f6;
  color: #5B8FC0;
  font-size: 14px;
  font-weight: 500;
}
.picker-footer:active { background: #f7fafc; }
.picker-search-icon { font-size: 14px; }

.dark-mode .city-picker-card { background: #1e2430; }
.dark-mode .picker-title { color: #E0E6ED; }
.dark-mode .picker-item { color: #C8D0DC; }
.dark-mode .picker-item:active { background: rgba(255,255,255,0.05); }
.dark-mode .picker-item.current { background: rgba(255,255,255,0.05); }
.dark-mode .picker-city { color: #C8D0DC; }
.dark-mode .picker-divider { background: rgba(255,255,255,0.08); }
.dark-mode .picker-footer { border-color: rgba(255,255,255,0.08); color: #6B9FD0; }
.dark-mode .picker-close { color: #6A7A8A; }

.share-canvas {
  width: 500px;
  height: 700px;
  position: fixed;
  left: -9999px;
  top: 0;
  z-index: -1;
  opacity: 0;
  pointer-events: none;
}
.more-overlay {
  position: fixed;
  inset: 0;
  z-index: 950;
}
.more-menu {
  position: fixed;
  right: var(--spacing-lg);
  width: 176px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 10px 32px rgba(0,0,0,0.18);
  border: 1px solid rgba(0,0,0,0.06);
  overflow: hidden;
  z-index: 951;
  animation: menu-pop 0.16s ease-out;
}
.more-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
  transition: background 0.12s;
}
.more-item:active { background: #f0f4f8; }
.more-icon {
  font-size: 15px;
  line-height: 1;
}
.more-text {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
}
.more-check {
  margin-left: auto;
  color: #5B8FC0;
  font-size: 10px;
}
.more-divider {
  height: 1px;
  background: #eef2f6;
}
@keyframes menu-pop {
  from { opacity: 0; transform: translateY(-6px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.dark-mode .more-menu { background: #1e2430; border-color: rgba(255,255,255,0.08); box-shadow: 0 10px 32px rgba(0,0,0,0.4); }
.dark-mode .more-text { color: #C8D0DC; }
.dark-mode .more-item:active { background: rgba(255,255,255,0.06); }
.dark-mode .more-divider { background: rgba(255,255,255,0.08); }
.dark-mode .more-check { color: #6B9FD0; }
</style>
<style>
::-webkit-scrollbar { display: none; width: 0; height: 0; }
</style>
