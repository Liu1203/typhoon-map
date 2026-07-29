<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue"
import { onShow, onHide, onPullDownRefresh } from "@dcloudio/uni-app"
import { getWeather, getCityCoords, getHourlyForecast, getWeatherByCoords, nearestCity, type CurrentWeather } from "@/api/weather"
import { TIMEOUT, CACHE } from "@/config"
import { gradientFor, accentFor, lightFor } from "@/utils/weather"
import WeatherHero from "@/components/WeatherHero.vue"
import DetailGrid from "@/components/DetailGrid.vue"
import ForecastCard from "@/components/ForecastCard.vue"
import HourlyScroll from "@/components/HourlyScroll.vue"
import SkeletonLoader from "@/components/SkeletonLoader.vue"

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
  const stored = uni.getStorageSync(CACHE.DARK_MODE_KEY) as string
  if (!stored) {
    darkMode.value = true
    uni.setStorageSync(CACHE.DARK_MODE_KEY, "1")
  } else if (stored === "1") {
    darkMode.value = false
    uni.setStorageSync(CACHE.DARK_MODE_KEY, "0")
  } else {
    uni.removeStorageSync(CACHE.DARK_MODE_KEY)
    const sys = uni.getSystemInfoSync()
    darkMode.value = sys.theme === "dark"
  }
}

function initDarkMode() {
  const stored = uni.getStorageSync(CACHE.DARK_MODE_KEY) as string
  if (stored === "1") darkMode.value = true
  else if (stored === "0") darkMode.value = false
  else {
    const sys = uni.getSystemInfoSync()
    darkMode.value = sys.theme === "dark"
  }
}

function getCache(): CacheEntry | null {
  try {
    const raw = uni.getStorageSync(CACHE.WEATHER_KEY) as string
    if (raw) {
      const obj = JSON.parse(raw)
      if (obj && obj.data && obj.city) return obj as CacheEntry
    }
  } catch { }
  return null
}

function setCache(data: CurrentWeather, city: string) {
  uni.setStorageSync(CACHE.WEATHER_KEY, JSON.stringify({ data, city, ts: Date.now() }))
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
  const start = Date.now()
  const res = await getWeather(coords.lat, coords.lon)
  if (res) {
    errorType.value = null
    forecastHourlys.value = {}
    expandedIndex.value = -1
    applyWeatherData(res)
    setCache(res, city)
  } else if (!weather.value) {
    errorType.value = isOffline.value ? "network" : (Date.now() - start >= TIMEOUT.OPEN_METEO * 3 ? "timeout" : "server")
  } else if (isOffline.value) {
    errorType.value = "network"
  }
}

let firstLoad = true
let refreshTimer: ReturnType<typeof setInterval> | null = null

function startAutoRefresh() {
  stopAutoRefresh()
  refreshTimer = setInterval(() => {
    fetchAndUpdate(currentCity.value)
  }, CACHE.AUTO_REFRESH_MS)
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

  const cache = getCache()
  const cacheHit = cache && cache.city === currentCity.value

  if (cacheHit) {
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
    applyWeatherData(result.weather)
    setCache(result.weather, result.placeName)
  } else {
    errorType.value = isOffline.value ? "network" : "server"
    uni.showToast({ title: "获取天气失败", icon: "none", duration: 2000 })
  }
  loading.value = false
  locating.value = false
}

async function toggleForecast(idx: number) {
  if (expandedIndex.value === idx) {
    expandedIndex.value = -1
    return
  }
  expandedIndex.value = idx
  if (!forecastHourlys.value[idx] && weather.value) {
    const coords = getCityCoords(currentCity.value)
    const date = weather.value.forecast[idx]?.date
    if (coords && date) {
      forecastHourlys.value[idx] = await getHourlyForecast(coords.lat, coords.lon, date)
    }
  }
}

function goSearch() {
  uni.navigateTo({ url: "/pages/search/search" })
}

const weatherGradient = computed(() => weather.value ? gradientFor(weather.value.weather) : "linear-gradient(175deg, #7AB8D8 0%, #A8D4E8 35%, #D8ECF8 100%)")
const accentColor = computed(() => weather.value ? accentFor(weather.value.weather) : "#E09050")
const lightBg = computed(() => weather.value && lightFor(weather.value.weather))
</script>

<template>
  <view class="container" :class="{ 'light-bg': lightBg, 'dark-mode': darkMode }" :style="{ background: weatherGradient, paddingTop: (statusBarHeight + 12) + 'px' }">
    <view v-if="showBrand && loading" class="brand-screen">
      <text class="brand-name">清清天气</text>
      <text class="brand-slogan">知冷暖 · 观风雨</text>
    </view>
    <SkeletonLoader v-if="!showBrand && loading && !weather" />

    <template v-else-if="weather">
      <view class="header-section anim-fade-in-down">
        <view class="city-row" @tap="goSearch">
          <view class="city-left">
            <text class="city-name">{{ currentCity }}</text>
            <text class="city-arrow">&#9662;</text>
          </view>
          <view class="header-actions">
            <view class="locate-btn" @tap.stop="toggleDark">
              <text class="locate-icon">{{ darkMode ? '☀️' : '🌙' }}</text>
            </view>
            <view :class="['locate-btn', locating && 'is-locating']" @tap.stop="locateMe">
              <text class="locate-icon">{{ locating ? '◎' : '◎' }}</text>
              <text class="locate-text">{{ locating ? '定位中' : '定位' }}</text>
            </view>
          </view>
        </view>
        <text class="update-time" v-if="updateTime">{{ refreshing ? '刷新中...' : '更新于 ' + updateTime }}</text>
      </view>

      <view v-if="weather.alerts && weather.alerts.length > 0" class="alert-banner anim-fade-in-down" style="animation-delay: 0.05s">
        <text class="alert-icon">⚠</text>
        <text class="alert-text">{{ weather.alerts[0].event }}</text>
      </view>
      <view v-if="isOffline" class="offline-banner">
        <text class="offline-text">📡 网络已断开，显示的是缓存数据</text>
      </view>

      <WeatherHero :temp="weather.temp" :weather="weather.weather" :high="weather.high" :low="weather.low" :accentColor="accentColor" />

      <DetailGrid :weather="weather" />

      <ForecastCard :forecast="weather.forecast" :forecastHourlys="forecastHourlys" :expandedIndex="expandedIndex" @toggle="toggleForecast" />

      <view class="card hourly-card anim-fade-in-up" style="animation-delay: 0.25s" v-if="weather.hourly && weather.hourly.length > 0">
        <view class="section-header">
          <view class="section-decor" />
          <text class="section-title">逐时天气</text>
        </view>
        <HourlyScroll :hourly="weather.hourly" :sunrise="weather.sunrise" :sunset="weather.sunset" />
      </view>

      <view class="entry-cards anim-fade-in-up" style="animation-delay: 0.3s">
        <view class="entry-card typhoon-entry" @tap="uni.navigateTo({ url: '/pages/typhoon/typhoon' })">
          <view class="entry-icon-wrap">
            <image src="/static/typhoon-entry.svg" class="entry-icon-svg" mode="aspectFit" />
          </view>
          <view class="entry-text-wrap">
            <text class="entry-title">台风路径</text>
            <text class="entry-subtitle">查看实时台风动态</text>
          </view>
          <text class="entry-arrow">›</text>
        </view>
        <view class="entry-card quake-entry" @tap="uni.navigateTo({ url: '/pages/earthquake/earthquake' })">
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
    </template>

    <view v-else class="error-view">
      <text class="error-icon">{{ errorType === "network" ? "📡" : "☁" }}</text>
      <text class="error-text">{{ errorType === "network" ? "网络已断开，请检查连接" : errorType === "timeout" ? "请求超时，服务器未响应" : "无法获取天气数据" }}</text>
      <view class="retry-btn" @tap="fetchAndUpdate(currentCity.value)">
        <text>重新加载</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.container {
  box-sizing: border-box;
  padding-left: var(--spacing-lg);
  padding-right: var(--spacing-lg);
  padding-bottom: calc(32px + var(--safe-area-bottom));
  min-height: 100vh;
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
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.3);
  transition: all var(--transition-fast);
}

.locate-btn.is-locating {
  background: rgba(255,255,255,0.35);
  border-color: rgba(255,255,255,0.5);
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
  font-size: 16px;
  flex-shrink: 0;
}
.alert-text {
  font-size: var(--font-size-xs);
  color: rgba(255,255,255,0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card {
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-lg);
  box-shadow: 0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03);
  margin-bottom: var(--spacing-md);
  border: 1px solid rgba(255,255,255,0.6);
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

.entry-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg) var(--spacing-xl);
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-xl);
  box-shadow: 0 2px 16px rgba(0,0,0,0.06);
  border: 1px solid rgba(255,255,255,0.6);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
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
</style>
<style>
::-webkit-scrollbar { display: none; width: 0; height: 0; }
</style>
