<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue"
import { onShow, onHide, onPullDownRefresh } from "@dcloudio/uni-app"
import { getWeather, getCityCoords, getHourlyForecast, getWeatherByCoords, nearestCity, type CurrentWeather } from "@/api/weather"
import { fetchActiveTyphoons, typhoonDistanceKm, pointDistanceKm, type TyphoonBrief } from "@/api/typhoon"
import { TIMEOUT, CACHE, DEFAULT_CITY } from "@/config"
import { gradientFor, accentFor, lightFor, getUnitSettings, formatTemp, formatWind, formatPressure, formatVisibility, uvLabel } from "@/utils/weather"
import { loadDarkMode, toggleDarkMode } from "@/utils/theme"
import { shareWeatherCard } from "@/utils/share"
import { sendDailyDigest, checkTempAlert, notifyRainIfNeeded, checkAlertsAndNotify } from "@/utils/notifications"
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
import StargazingCard from "@/components/StargazingCard.vue"
import NowcastCard from "@/components/NowcastCard.vue"
import Icon from "@/components/Icon.vue"

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

const currentCity = ref(DEFAULT_CITY)
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

function fmtClock(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return pad(d.getHours()) + ":" + pad(d.getMinutes())
}

function applyWeatherData(res: CurrentWeather) {
  weather.value = res
  showBrandOff()
  uni.setNavigationBarColor({ fontColor: lightFor(res.weather) ? '#000000' : '#ffffff', backgroundColor: '#000000' })
  updateTime.value = fmtClock(new Date())
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
    notifyRainIfNeeded(currentCity.value, rainAlarm.value)
    checkTempAlert(currentCity.value, weather.value)
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
    currentCity.value = DEFAULT_CITY
    uni.setStorageSync(CACHE.CITY_KEY, DEFAULT_CITY)
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
    updateTime.value = fmtClock(new Date(cache.ts))
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
  sendDailyDigest(currentCity.value, weather.value)
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
  try { uni.setStorageSync(CACHE.ALERTS_KEY, JSON.stringify(weather.value.alerts)) } catch {}
  uni.navigateTo({ url: "/pages/alerts/alerts" })
}

function shareWeather() {
  if (!weather.value || !displayWeather.value) return
  shareWeatherCard(currentCity.value, displayWeather.value)
}

const showCityPicker = ref(false)
const showMoreMenu = ref(false)
const favCities = ref<string[]>([])

function loadFavCities() {
  try {
    const raw = uni.getStorageSync(CACHE.FAV_KEY) as string
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
  uni.setStorageSync(CACHE.CITY_KEY, name)
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

function goOcean() {
  uni.navigateTo({
    url: "/pages/ocean/ocean",
    fail: () => uni.showToast({ title: "页面打开失败", icon: "none" }),
  })
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

function readRefreshInterval(): number {
  try {
    const raw = uni.getStorageSync(CACHE.UNIT_KEY) as string
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
  if (w.yesterdayHigh != null) w.yesterdayHigh = formatTemp(w.yesterdayHigh, s.temp === "f")
  if (w.yesterdayLow != null) w.yesterdayLow = formatTemp(w.yesterdayLow, s.temp === "f")
  if (s.wind !== "kmh") {
    w.windScale = formatWind(w.windScale, s.wind)
    w.windGust = formatWind(w.windGust, s.wind)
  }
  w.pressure = formatPressure(w.pressure, s.pressure)
  w.visibility = formatVisibility(w.visibility, s.visibility)
  return w
})

const homeModules = ref<{ modules: Record<string, boolean>; order: string[] }>({
  modules: { detail: true, aqi: true, forecast: true, hourly: true, nowcast: true, lifetips: true, temptr: true, preciptr: true, typhoon: true, quake: true, radar: true, stargazing: true, ocean: true },
  order: ["detail", "aqi", "forecast", "hourly", "nowcast", "lifetips", "temptr", "preciptr", "typhoon", "quake", "radar", "stargazing", "ocean"],
})

function loadHomeModules() {
  const s = getUnitSettings()
  homeModules.value = {
    modules: s.modules as unknown as Record<string, boolean>,
    order: s.moduleOrder && s.moduleOrder.length ? s.moduleOrder : ["detail", "aqi", "forecast", "hourly", "nowcast", "lifetips", "temptr", "preciptr", "typhoon", "quake", "radar", "stargazing", "ocean"],
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

const tempDropAlarm = computed(() => {
  const f = weather.value?.forecast
  if (!f || !f.length) return null
  const todayHigh = parseFloat(weather.value!.high)
  const tomorrowHigh = parseFloat(f[0].high)
  if (isNaN(todayHigh) || isNaN(tomorrowHigh)) return null
  const drop = Math.round(todayHigh - tomorrowHigh)
  if (drop < 5) return null
  return { drop }
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
              <view class="locate-icon"><Icon name="navigation" :size="12" color="#ffffff" /></view>
              <text class="locate-text">{{ locating ? '定位中' : '定位' }}</text>
            </view>
            <view class="locate-btn more-btn" @tap.stop="openMoreMenu">
              <view class="locate-icon"><Icon name="more" :size="18" color="#ffffff" :stroke="2.5" /></view>
            </view>
          </view>
        </view>
        <text class="update-time" v-if="updateTime">{{ refreshing ? '刷新中...' : '更新于 ' + updateTime }}</text>
      </view>

      <view v-if="weather.alerts && weather.alerts.length > 0" class="alert-banner anim-fade-in-down" style="animation-delay: 0.05s" @tap="showAllAlerts">
        <view class="alert-icon"><Icon name="alert" :size="16" color="#ffffff" /></view>
        <text class="alert-text">{{ weather.alerts[0].event }}{{ weather.alerts.length > 1 ? ' 等' + weather.alerts.length + '条' : '' }}</text>
        <text class="alert-count" v-if="weather.alerts.length > 1">{{ weather.alerts.length }}</text>
        <text class="alert-arrow">›</text>
      </view>
      <view v-if="rainAlarm" class="rain-alarm-banner anim-fade-in-down" style="animation-delay: 0.08s">
        <view class="rain-alarm-icon"><Icon name="umbrella" :size="16" color="#ffffff" /></view>
        <text class="rain-alarm-text">未来{{ rainAlarm.count }}小时可能降雨（{{ rainAlarm.maxPct }}%），出门记得带伞</text>
      </view>
      <view v-if="tempDropAlarm" class="temp-drop-banner anim-fade-in-down" style="animation-delay: 0.09s">
        <view class="temp-drop-icon"><Icon name="shirt" :size="16" color="#ffffff" /></view>
        <text class="temp-drop-text">明天较今天降温 {{ tempDropAlarm.drop }}°，注意添衣保暖</text>
      </view>
      <view v-if="typhoonAlert" class="typhoon-alert-banner anim-fade-in-down" style="animation-delay: 0.1s" @tap="goTyphoon">
        <view class="typhoon-alert-icon"><Icon name="typhoon" :size="16" color="#ffffff" /></view>
        <text class="typhoon-alert-text">台风「{{ typhoonAlert.name }}」距 {{ currentCity }} 约 {{ typhoonAlert.distance }}km{{ typhoonAlert.minPath < typhoonAlert.distance ? '，路径最近约 ' + typhoonAlert.minPath + 'km' + (typhoonAlert.minPathHours > 0 ? '（约 ' + typhoonAlert.minPathHours + ' 小时后）' : '') : '' }}，点击查看路径</text>
        <text class="typhoon-alert-arrow">›</text>
      </view>
      <view v-if="isOffline" class="offline-banner">
        <text class="offline-text">网络已断开，显示的是缓存数据</text>
      </view>

      <WeatherHero :temp="displayWeather!.temp" :feelsLike="displayWeather!.feelsLike" :weather="displayWeather!.weather" :high="displayWeather!.high" :low="displayWeather!.low" :accentColor="accentColor" :sunrise="displayWeather!.sunrise" :sunset="displayWeather!.sunset" :yesterdayHigh="displayWeather!.yesterdayHigh" :yesterdayLow="displayWeather!.yesterdayLow" />

      <template v-for="key in homeModules.order" :key="key">
        <DetailGrid v-if="key === 'detail' && homeModules.modules.detail" :weather="displayWeather!" />

        <AqiCard v-if="key === 'aqi' && homeModules.modules.aqi && displayWeather!.aqi !== '--'" class="accent-air" :weather="displayWeather!" />

        <ForecastCard v-if="key === 'forecast' && homeModules.modules.forecast" class="accent-forecast" :forecast="displayForecast" :forecastHourlys="forecastHourlys" :expandedIndex="expandedIndex" @toggle="toggleForecast" />

        <view class="card hourly-card anim-fade-in-up accent-hourly" style="animation-delay: 0.25s" v-if="key === 'hourly' && homeModules.modules.hourly && displayHourly.length > 0">
          <view class="section-header">
            <view class="section-decor" />
            <text class="section-title">逐时天气</text>
          </view>
          <HourlyTrend :hourly="displayHourly" />
          <HourlyScroll :hourly="displayHourly" :sunrise="displayWeather!.sunrise" :sunset="displayWeather!.sunset" />
        </view>

        <NowcastCard v-if="key === 'nowcast' && homeModules.modules.nowcast && displayWeather!.minutely && displayWeather!.minutely.length" class="accent-nowcast" :minutely="displayWeather!.minutely!" />

        <LifeTips v-if="key === 'lifetips' && homeModules.modules.lifetips" class="lazy-render accent-life" :weather="weather!" />

        <TempTrend v-if="key === 'temptr' && homeModules.modules.temptr" class="lazy-render accent-temp" :forecast="displayForecast" />

        <PrecipTrend v-if="key === 'preciptr' && homeModules.modules.preciptr" class="lazy-render accent-precip" :forecast="displayForecast" />

        <view v-if="key === 'typhoon' && homeModules.modules.typhoon" class="entry-module accent-typhoon">
          <view class="entry-card typhoon-entry" @tap="goTyphoon">
            <view class="entry-icon-wrap">
              <Icon name="typhoon" :size="22" color="#C9503F" />
            </view>
            <view class="entry-text-wrap">
              <text class="entry-title">台风路径</text>
              <text class="entry-subtitle">查看实时台风动态</text>
            </view>
            <text class="entry-arrow">›</text>
          </view>
        </view>

        <view v-if="key === 'quake' && homeModules.modules.quake" class="entry-module accent-quake">
          <view class="entry-card quake-entry" @tap="goQuake">
            <view class="entry-icon-wrap">
              <Icon name="activity" :size="22" color="#D9843C" />
            </view>
            <view class="entry-text-wrap">
              <text class="entry-title">地震信息</text>
              <text class="entry-subtitle">全球地震数据查询</text>
            </view>
            <text class="entry-arrow">›</text>
          </view>
        </view>

        <view v-if="key === 'radar' && homeModules.modules.radar" class="entry-module accent-radar">
          <view class="entry-card radar-entry" @tap="goRadar">
            <view class="entry-icon-wrap">
              <Icon name="cloud-rain" :size="22" color="#4FA98C" />
            </view>
            <view class="entry-text-wrap">
              <text class="entry-title">雷达降水</text>
              <text class="entry-subtitle">实时降雨雷达图</text>
            </view>
            <text class="entry-arrow">›</text>
          </view>
        </view>

        <view v-if="key === 'stargazing' && homeModules.modules.stargazing" class="accent-star" @tap="goAstronomy">
          <StargazingCard :weather="displayWeather!" />
        </view>

        <view v-if="key === 'ocean' && homeModules.modules.ocean" class="entry-module accent-ocean">
          <view class="entry-card ocean-entry" @tap="goOcean">
            <view class="entry-icon-wrap">
              <Icon name="waves" :size="22" color="#2E9BAE" />
            </view>
            <view class="entry-text-wrap">
              <text class="entry-title">海洋预报</text>
              <text class="entry-subtitle">浪高 · 海温 · 浪向</text>
            </view>
            <text class="entry-arrow">›</text>
          </view>
        </view>
      </template>
    </template>

    <view v-else class="error-view">
      <view class="error-icon"><Icon :name="errorType === 'network' ? 'alert' : 'cloud'" :size="48" color="rgba(255,255,255,0.45)" /></view>
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
          <view class="picker-search-icon"><Icon name="search" :size="18" color="#5B8FC0" /></view>
          <text>搜索更多城市</text>
        </view>
        <view class="picker-footer manage-footer" @tap="goCities">
          <view class="picker-search-icon"><Icon name="list" :size="18" color="#5B8FC0" /></view>
          <text>管理收藏城市</text>
        </view>
        <view class="picker-footer manage-footer" @tap="goCompare">
          <view class="picker-search-icon"><Icon name="scale" :size="18" color="#5B8FC0" /></view>
          <text>城市对比</text>
        </view>
      </view>
    </view>
    <canvas canvas-id="shareCanvas" class="share-canvas"></canvas>
    <view class="more-overlay" v-if="showMoreMenu" @tap="showMoreMenu = false">
      <view class="more-menu" :style="{ top: (statusBarHeight + 64) + 'px' }" @tap.stop>
        <view class="more-item" @tap.stop="onMoreAction(0)">
          <view class="more-icon"><Icon :name="darkMode ? 'sun' : 'moon'" :size="18" color="#5B8FC0" /></view>
          <text class="more-text">{{ darkMode ? '浅色模式' : '深色模式' }}</text>
          <text class="more-check" v-if="darkMode">●</text>
        </view>
        <view class="more-divider" />
        <view class="more-item" @tap.stop="onMoreAction(1)">
          <view class="more-icon"><Icon name="share" :size="18" color="#5B8FC0" /></view>
          <text class="more-text">分享天气卡片</text>
        </view>
        <view class="more-divider" />
        <view class="more-item" @tap.stop="onMoreAction(2)">
          <view class="more-icon"><Icon name="clipboard" :size="18" color="#5B8FC0" /></view>
          <text class="more-text">复制天气摘要</text>
        </view>
        <view class="more-divider" />
        <view class="more-item" @tap.stop="onMoreAction(3)">
          <view class="more-icon"><Icon name="settings" :size="18" color="#5B8FC0" /></view>
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

.container::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -2;
  background-image:
    radial-gradient(circle at 14% 6%, rgba(255,255,255,0.38) 0%, transparent 38%),
    radial-gradient(circle at 88% 20%, rgba(255,255,255,0.16) 0%, transparent 42%),
    radial-gradient(circle at 72% 98%, rgba(255,255,255,0.1) 0%, transparent 46%);
}

.lazy-render {
  content-visibility: auto;
  contain-intrinsic-size: auto 260px;
}

.container.scene-sunny::before {
  background-image: radial-gradient(ellipse at 30% 15%, rgba(255,220,100,0.1) 0%, transparent 50%);
  animation: sunny-glow 5s ease-in-out infinite;
}
.container.scene-rain::before {
  background-image:
    repeating-linear-gradient(108deg, transparent 0 5px, rgba(255,255,255,0.05) 5px 6px, transparent 6px 15px),
    linear-gradient(180deg, rgba(180,210,240,0.06) 0%, rgba(180,210,240,0.12) 50%, transparent 100%);
  animation: rain-fade 4s ease-in-out infinite;
}
.container.scene-snow::before {
  background-image:
    radial-gradient(2px 2px at 18% 28%, rgba(255,255,255,0.55) 50%, transparent 51%),
    radial-gradient(2px 2px at 42% 62%, rgba(255,255,255,0.45) 50%, transparent 51%),
    radial-gradient(2px 2px at 68% 22%, rgba(255,255,255,0.5) 50%, transparent 51%),
    radial-gradient(2px 2px at 84% 70%, rgba(255,255,255,0.4) 50%, transparent 51%),
    radial-gradient(2px 2px at 30% 84%, rgba(255,255,255,0.45) 50%, transparent 51%),
    radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 60%);
  background-repeat: no-repeat;
  animation: snow-fall 8s ease-in-out infinite;
}
.container.scene-thunder::before {
  background-image: radial-gradient(ellipse at 50% 30%, rgba(180,160,200,0.08) 0%, transparent 50%);
  animation: thunder-flash 8s ease-in-out infinite;
}
.container.scene-fog::before {
  background-image: linear-gradient(90deg, rgba(200,210,220,0.06) 0%, rgba(200,210,220,0.12) 50%, rgba(200,210,220,0.06) 100%);
  animation: fog-drift 8s ease-in-out infinite;
}
.container.scene-cloudy::before,
.container.scene-overcast::before {
  background-image: radial-gradient(ellipse at 60% 20%, rgba(255,255,255,0.06) 0%, transparent 50%);
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

.light-bg .card { background: rgba(255,255,255,0.88); }
.light-bg .detail-item { background: rgba(255,255,255,0.75); }
.light-bg .entry-card { background: var(--glass-bg-strong); }

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
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  transition: transform var(--transition-fast), background var(--transition-fast);
}

.locate-btn.is-locating {
  background: var(--glass-bg-strong);
  border-color: var(--glass-border);
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

.alert-banner,
.rain-alarm-banner,
.temp-drop-banner,
.typhoon-alert-banner {
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
}

.rain-alarm-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin: 0 var(--spacing-md) var(--spacing-sm);
  padding: 8px 14px;
  border-radius: var(--radius-md);
  background: rgba(91, 143, 192, 0.24);
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

.temp-drop-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin: 0 var(--spacing-md) var(--spacing-sm);
  padding: 8px 14px;
  border-radius: var(--radius-md);
  background: rgba(240, 144, 80, 0.2);
  border: 1px solid rgba(240, 144, 80, 0.35);
}
.temp-drop-icon {
  font-size: 14px;
  flex-shrink: 0;
}
.temp-drop-text {
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
  background: var(--card-bg);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-lg);
  box-shadow: var(--card-shadow);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--card-border);
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
  background: var(--accent, var(--color-primary));
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
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-shadow);
  border: 1px solid var(--glass-border);
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

.typhoon-entry .entry-icon-wrap { background: var(--m-typhoon-soft); }
.quake-entry .entry-icon-wrap { background: var(--m-quake-soft); }
.radar-entry .entry-icon-wrap { background: var(--m-radar-soft); }
.ocean-entry .entry-icon-wrap { background: var(--m-ocean-soft); }

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
  display: flex;
  align-items: center;
  justify-content: center;
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
.dark-mode .entry-card { background: var(--glass-bg); }

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
  background: var(--glass-bg-strong);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
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
.picker-search-icon { display: flex; align-items: center; justify-content: center; }

.dark-mode .city-picker-card { background: var(--glass-bg-strong); }
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
  background: var(--glass-bg-strong);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border-radius: 14px;
  box-shadow: 0 10px 32px rgba(0,0,0,0.18);
  border: 1px solid var(--glass-border);
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
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
.dark-mode .more-menu { background: var(--glass-bg-strong); border-color: var(--glass-border); box-shadow: 0 10px 32px rgba(0,0,0,0.4); }
.dark-mode .more-text { color: #C8D0DC; }
.dark-mode .more-item:active { background: rgba(255,255,255,0.06); }
.dark-mode .more-divider { background: rgba(255,255,255,0.08); }
.dark-mode .more-check { color: #6B9FD0; }
</style>
<style>
::-webkit-scrollbar { display: none; width: 0; height: 0; }
</style>
