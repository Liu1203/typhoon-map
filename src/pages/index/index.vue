<script setup lang="ts">
import { ref } from "vue"
import { onShow, onPullDownRefresh } from "@dcloudio/uni-app"
import { getWeather, getCityId, getCityCoords, getHourlyForecast, getWeatherByCoords, type CurrentWeather } from "@/api/weather"
import WeatherIcon from "@/components/WeatherIcon.vue"
import SkeletonLoader from "@/components/SkeletonLoader.vue"

const CITY_COORDS: Record<string, [number, number]> = {
  "北京": [39.9, 116.4], "上海": [31.2, 121.5], "广州": [23.1, 113.3],
  "深圳": [22.5, 114.1], "杭州": [30.3, 120.2], "成都": [30.6, 104.1],
  "武汉": [30.6, 114.3], "西安": [34.3, 108.9], "南京": [32.1, 118.8],
  "重庆": [29.6, 106.5], "天津": [39.1, 117.2], "长沙": [28.2, 112.9],
  "苏州": [31.3, 120.6], "昆明": [25.0, 102.7], "厦门": [24.5, 118.1],
  "青岛": [36.1, 120.4], "大连": [38.9, 121.6], "郑州": [34.7, 113.7],
  "哈尔滨": [45.8, 126.5], "贵阳": [26.6, 106.7],
  "沈阳": [41.8, 123.4], "济南": [36.7, 117.0], "合肥": [31.8, 117.3],
  "福州": [26.1, 119.3], "南昌": [28.7, 115.9], "太原": [37.9, 112.5],
  "石家庄": [38.0, 114.5], "南宁": [22.8, 108.4], "长春": [43.9, 125.3],
  "兰州": [36.1, 103.8], "呼和浩特": [40.8, 111.7], "银川": [38.5, 106.1],
  "西宁": [36.6, 101.8], "乌鲁木齐": [43.8, 87.6], "拉萨": [29.7, 91.1],
  "海口": [20.0, 110.3], "珠海": [22.3, 113.6], "东莞": [23.0, 113.8],
  "佛山": [23.0, 113.1], "宁波": [29.9, 121.6], "无锡": [31.6, 120.3],
  "温州": [28.0, 120.7], "泉州": [24.9, 118.6], "烟台": [37.5, 121.4],
  "桂林": [25.3, 110.3], "三亚": [18.3, 109.5], "丽江": [26.9, 100.2],
  "秦皇岛": [39.9, 119.6], "威海": [37.5, 122.1], "北海": [21.5, 109.1],
}

function nearestCity(lat: number, lon: number): string {
  let min = Infinity, best = "北京"
  for (const [name, [clat, clon]] of Object.entries(CITY_COORDS)) {
    const d = Math.sqrt((lat - clat) ** 2 + (lon - clon) ** 2)
    if (d < min) { min = d; best = name }
  }
  return best
}

const locateError = ref("")

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
    }, 15000)

    uni.getLocation({
      type: "wgs84",
      success(res: any) {
        done(nearestCity(res.latitude, res.longitude))
      },
      fail(err: any) {
        const msg = (err?.errMsg || err?.message || JSON.stringify(err) || "未知")
        console.log("定位失败:", msg)
        locateError.value = msg
        if (msg.includes("not authorized") || msg.includes("deny") || msg.includes("permission")) {
          uni.showModal({
            title: "需要定位权限",
            content: "请在系统设置中允许本应用访问位置信息",
            confirmText: "去设置",
            success(modalRes: any) {
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
    const timer = setTimeout(() => { done(null) }, 15000)
    uni.getLocation({
      type: "wgs84",
      success(res: any) { done({ lat: res.latitude, lon: res.longitude }) },
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
const failed = ref(false)
const refreshing = ref(false)
const locating = ref(false)
const expandedIndex = ref(-1)
const forecastHourlys = ref<Record<number, import("@/api/weather").HourlyItem[]>>({})
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20

function getCache(): CacheEntry | null {
  try {
    const raw = uni.getStorageSync("weather_cache") as string
    if (raw) {
      const obj = JSON.parse(raw)
      if (obj && obj.data && obj.city) return obj as CacheEntry
    }
  } catch { }
  return null
}

function setCache(data: CurrentWeather, city: string) {
  uni.setStorageSync("weather_cache", JSON.stringify({ data, city, ts: Date.now() }))
}

function applyWeatherData(res: CurrentWeather) {
  weather.value = res
  const lightBg = isLightBg(res.weather)
  uni.setNavigationBarColor({ frontColor: lightBg ? '#000000' : '#ffffff', backgroundColor: '#000000' })
  updateTime.value = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
}

async function fetchAndUpdate(cid: string, city: string) {
  const res = await getWeather(cid)
  if (res) {
    forecastHourlys.value = {}
    expandedIndex.value = -1
    const coords = getCityCoords(city)
    if (coords) {
      const hourly = await getHourlyForecast(coords.lat, coords.lon)
      if (hourly.length > 0) res.hourly = hourly
    }
    applyWeatherData(res)
    setCache(res, city)
  } else if (!weather.value) {
    failed.value = true
  }
}

let firstLoad = true

onShow(async () => {
  failed.value = false

  const saved = uni.getStorageSync("selected_city") as string
  if (saved) {
    currentCity.value = saved
  } else {
    const detected = await detectCity()
    if (detected) {
      currentCity.value = detected
      uni.setStorageSync("selected_city", detected)
    }
  }

  const cid = getCityId(currentCity.value)
  if (!cid) {
    loading.value = false
    failed.value = true
    return
  }

  const cache = getCache()
  const cacheHit = cache && cache.city === currentCity.value
  const isFresh = cacheHit && (Date.now() - cache.ts) < 30 * 60 * 1000

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

  await fetchAndUpdate(cid, currentCity.value)
  loading.value = false
})

onPullDownRefresh(async () => {
  refreshing.value = true
  const cid = getCityId(currentCity.value)
  if (cid) {
    await fetchAndUpdate(cid, currentCity.value)
  }
  refreshing.value = false
  uni.stopPullDownRefresh()
})

async function locateMe() {
  if (locating.value) return
  locating.value = true
  try {
    const coords = await detectCoords()
    if (!coords) {
      uni.showToast({ title: "定位失败: " + locateError.value, icon: "none", duration: 3000 })
      locating.value = false
      return
    }
    loading.value = true
    failed.value = false
    forecastHourlys.value = {}
    expandedIndex.value = -1
    const result = await getWeatherByCoords(coords.lat, coords.lon)
    if (result) {
      currentCity.value = result.placeName
      uni.setStorageSync("selected_city", result.placeName)
      const hourly = await getHourlyForecast(coords.lat, coords.lon)
      if (hourly.length > 0) result.weather.hourly = hourly
      applyWeatherData(result.weather)
      setCache(result.weather, result.placeName)
    } else {
      uni.showToast({ title: "获取天气失败", icon: "none", duration: 2000 })
    }
    loading.value = false
  } catch (e: any) {
    loading.value = false
    uni.showToast({ title: "定位失败", icon: "none", duration: 2000 })
  }
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

function weatherBg(w: string): string {
  if (w.includes("雷")) return "linear-gradient(175deg, #2C2C2C 0%, #4A4440 30%, #6B6058 100%)"
  if (w.includes("雪") || w.includes("冰雹")) return "linear-gradient(175deg, #D8D3C8 0%, #E8E3D8 40%, #F5F0E8 100%)"
  if (w.includes("雾") || w.includes("霾")) return "linear-gradient(175deg, #B8B0A0 0%, #D0C8B8 50%, #E8E0D0 100%)"
  if (w.includes("大") && w.includes("雨")) return "linear-gradient(175deg, #3A4248 0%, #586068 40%, #7A8288 100%)"
  if (w.includes("雨") || w.includes("阵雨")) return "linear-gradient(175deg, #4A5658 0%, #708080 50%, #98A8A8 100%)"
  if (w.includes("阴")) return "linear-gradient(175deg, #8A8680 0%, #B0A898 50%, #D0C8B8 100%)"
  if (w.includes("多云")) return "linear-gradient(175deg, #7A8A98 0%, #A0B0B8 40%, #C8D4D8 100%)"
  if (w.includes("晴")) return "linear-gradient(175deg, #5A8A98 0%, #80B0B8 35%, #B8D4D8 100%)"
  return "linear-gradient(175deg, #5A8A98 0%, #80B0B8 35%, #B8D4D8 100%)"
}

function weatherAccent(w: string): string {
  if (w.includes("雷")) return "#D4A853"
  if (w.includes("雪") || w.includes("冰雹")) return "#8B9DAF"
  if (w.includes("雾") || w.includes("霾")) return "#A09888"
  if (w.includes("雨")) return "#5B8C7A"
  if (w.includes("阴")) return "#8C8278"
  if (w.includes("多云")) return "#D4A853"
  if (w.includes("晴")) return "#C0784A"
  return "#C0784A"
}

function isLightBg(w: string): boolean {
  return w.includes("雪") || w.includes("雾") || w.includes("霾")
}

function hourNum(t: string): number {
  const parts = t.split(":")
  return parseInt(parts[0]) || 0
}

function sunHour(sun: string): number {
  const parts = sun.split(":")
  const h = parseInt(parts[0]) || 6
  const m = parts[1] || "00"
  if (m.includes("PM") && h < 12) return h + 12
  if (m.includes("AM") && h === 12) return 0
  return h
}

function windArrow(dir: string): string {
  const m: Record<string, string> = { "北风": "↓", "东北风": "↙", "东风": "←", "东南风": "↖", "南风": "↑", "西南风": "↗", "西风": "→", "西北风": "↘" }
  return m[dir] || dir
}

function hourLabel(t: string): string {
  const h = parseInt(t) || 0
  return h + "时"
}
</script>

<template>
  <view class="container" :class="{ 'light-bg': weather && isLightBg(weather.weather) }" :style="{ background: weather ? weatherBg(weather.weather) : 'linear-gradient(175deg, #5A8A98 0%, #80B0B8 35%, #B8D4D8 100%)', paddingTop: (statusBarHeight + 12) + 'px' }">
    <SkeletonLoader v-if="loading && !weather" />

    <template v-else-if="weather">
      <view class="header-section anim-fade-in-down">
        <view class="city-row" @tap="goSearch">
          <view class="city-left">
            <text class="city-name">{{ currentCity }}</text>
            <text class="city-arrow">&#9662;</text>
          </view>
          <view :class="['locate-btn', locating && 'is-locating']" @tap.stop="locateMe">
            <text class="locate-icon">{{ locating ? '◎' : '◎' }}</text>
            <text class="locate-text">{{ locating ? '定位中' : '定位' }}</text>
          </view>
        </view>
        <text class="update-time" v-if="updateTime">{{ refreshing ? '刷新中...' : '更新于 ' + updateTime }}</text>
      </view>

      <view class="weather-hero anim-fade-in-scale" :style="{ '--accent': weatherAccent(weather.weather) }">
        <view class="temp-display">
          <text class="temp-value">{{ weather.temp }}</text>
          <text class="temp-unit">°</text>
        </view>
        <view class="weather-badge">
          <WeatherIcon :weather="weather.weather" :size="44" />
          <text class="weather-desc">{{ weather.weather }}</text>
        </view>
        <view class="temp-range-row">
          <text class="temp-high">↑ {{ weather.high }}°</text>
          <view class="temp-divider" />
          <text class="temp-low">↓ {{ weather.low }}°</text>
        </view>
      </view>

      <view class="detail-grid anim-fade-in-up" style="animation-delay: 0.1s">
        <view class="detail-item">
          <text class="detail-label">体感</text>
          <text class="detail-value">{{ weather.feelsLike }}°</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">湿度</text>
          <text class="detail-value">{{ weather.humidity }}%</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">{{ weather.windDir }}</text>
          <text class="detail-value">{{ weather.windLevel }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">紫外线</text>
          <text class="detail-value">{{ weather.uvIndex }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">日出</text>
          <text class="detail-value">{{ weather.sunrise }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">日落</text>
          <text class="detail-value">{{ weather.sunset }}</text>
        </view>
      </view>

      <view class="card forecast anim-fade-in-up" style="animation-delay: 0.2s" v-if="weather.forecast.length > 0">
        <view class="section-header">
          <view class="section-decor" />
          <text class="section-title">未来天气</text>
        </view>
        <view class="forecast-list">
          <view v-for="(f, i) in weather.forecast" :key="f.day">
            <view class="forecast-item" :class="{ expanded: expandedIndex === i }" @tap="toggleForecast(i)">
              <text class="forecast-day">{{ f.day }}</text>
              <view class="forecast-icon-wrap">
                <WeatherIcon :weather="f.weather" :size="26" />
              </view>
              <text class="forecast-weather">{{ f.weather }}</text>
              <view class="forecast-temps">
                <text class="forecast-high">{{ f.high }}°</text>
                <text class="forecast-low">{{ f.low }}°</text>
              </view>
              <text class="forecast-expand">{{ expandedIndex === i ? '▲' : '▼' }}</text>
            </view>
            <view v-if="expandedIndex === i" class="forecast-hourly-wrap">
              <view v-if="!forecastHourlys[i]" class="forecast-hourly-loading">
                <text>加载中...</text>
              </view>
              <scroll-view v-else-if="forecastHourlys[i].length > 0" scroll-x class="hourly-scroll">
                <view class="hourly-list">
                  <view v-for="(h, j) in forecastHourlys[i]" :key="j" class="hourly-item">
                    <text class="hourly-time">{{ hourLabel(h.time) }}</text>
                    <WeatherIcon :weather="h.weather" :size="22" />
                    <text class="hourly-temp">{{ h.temp }}°</text>
                    <text class="hourly-desc">{{ h.weather }}</text>
                    <view :class="['rain-tag', parseInt(h.rainChance) > 30 ? 'rain-heavy' : parseInt(h.rainChance) > 0 ? 'rain-light' : 'rain-none']">
                      <text>{{ parseInt(h.rainChance) > 0 ? h.rainChance + '%' : '无雨' }}</text>
                    </view>
                  </view>
                </view>
              </scroll-view>
              <text v-else class="forecast-hourly-empty">暂无逐时数据</text>
            </view>
          </view>
        </view>
      </view>

      <view class="card hourly-card anim-fade-in-up" style="animation-delay: 0.25s" v-if="weather.hourly && weather.hourly.length > 0">
        <view class="section-header">
          <view class="section-decor" />
          <text class="section-title">逐时天气</text>
        </view>
        <view class="hourly-scroll-wrap">
          <scroll-view scroll-x class="hourly-scroll" :show-scrollbar="false">
            <view class="hourly-list">
              <view v-for="(h, i) in weather.hourly" :key="i" class="hourly-item" :class="{ 'is-sun': sunHour(weather.sunrise) === hourNum(h.time), 'is-dusk': sunHour(weather.sunset) === hourNum(h.time) }">
                <text class="hourly-time">{{ hourLabel(h.time) }}</text>
                <WeatherIcon :weather="h.weather" :size="26" />
                <text class="hourly-temp">{{ h.temp }}°</text>
                <text class="hourly-desc">{{ h.weather }}</text>
                <text class="hourly-wind">{{ windArrow(h.windDir) }} {{ h.windScale }}</text>
                <view :class="['rain-tag', parseInt(h.rainChance) > 30 ? 'rain-heavy' : parseInt(h.rainChance) > 0 ? 'rain-light' : 'rain-none']">
                  <text>{{ parseInt(h.rainChance) > 0 ? h.rainChance + '%' : '无雨' }}</text>
                </view>
              </view>
            </view>
          </scroll-view>
          <view class="scroll-fade-right" />
        </view>
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
      <text class="error-icon">☁</text>
      <text class="error-text">无法获取天气数据</text>
      <view class="retry-btn" @tap="onShow()">
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
  transition: background 0.8s ease;
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

.weather-hero {
  text-align: center;
  padding: var(--spacing-lg) 0 var(--spacing-2xl);
}

.temp-display {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin-bottom: var(--spacing-sm);
}

.temp-value {
  font-size: 100px;
  font-weight: var(--font-weight-light);
  color: #fff;
  line-height: 1;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 12px rgba(0,0,0,0.1);
  font-family: var(--font-family-number);
}

.temp-unit {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-light);
  color: rgba(255,255,255,0.7);
  margin-top: 12px;
  margin-left: -2px;
}

.weather-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.weather-desc {
  font-size: var(--font-size-xl);
  color: rgba(255,255,255,0.85);
  font-weight: var(--font-weight-medium);
}

.temp-range-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
}

.temp-high {
  font-size: var(--font-size-md);
  color: rgba(255,255,255,0.75);
  font-weight: var(--font-weight-medium);
}

.temp-divider {
  width: 1px;
  height: 14px;
  background: rgba(255,255,255,0.3);
}

.temp-low {
  font-size: var(--font-size-md);
  color: rgba(255,255,255,0.65);
  font-weight: var(--font-weight-medium);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.detail-item {
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(8px);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-sm);
  text-align: center;
  border: 1px solid rgba(255,255,255,0.1);
  transition: background var(--transition-fast);
}

.detail-label {
  display: block;
  font-size: var(--font-size-xs);
  color: rgba(255,255,255,0.65);
  margin-bottom: 2px;
}

.detail-value {
  display: block;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: #fff;
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

.forecast-list {
  display: flex;
  flex-direction: column;
}

.forecast-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-paper-border);
  transition: background var(--transition-fast);
}

.forecast-item.expanded {
  background: var(--color-paper);
  margin: 0 calc(-1 * var(--spacing-lg));
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
}

.forecast-item:last-child { border-bottom: none; }

.forecast-day {
  width: 44px;
  font-size: var(--font-size-sm);
  color: var(--color-ink-soft);
  font-weight: var(--font-weight-medium);
}

.forecast-icon-wrap {
  width: 32px;
  display: flex;
  justify-content: center;
}

.forecast-weather {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--color-ink-soft);
}

.forecast-temps {
  display: flex;
  gap: var(--spacing-sm);
  min-width: 70px;
  justify-content: flex-end;
}

.forecast-high {
  font-size: var(--font-size-md);
  color: var(--color-ink);
  font-weight: var(--font-weight-semibold);
}

.forecast-low {
  font-size: var(--font-size-md);
  color: var(--color-ink-light);
}

.forecast-expand {
  font-size: var(--font-size-xs);
  color: var(--color-ash);
  width: 20px;
  text-align: center;
}

.forecast-hourly-wrap {
  padding: var(--spacing-sm) 0 var(--spacing-md);
  border-bottom: 1px solid var(--color-paper-border);
}

.forecast-hourly-loading, .forecast-hourly-empty {
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
  text-align: center;
  padding: var(--spacing-md) 0;
}

.hourly-card { padding: var(--spacing-lg) var(--spacing-md); }

.hourly-scroll-wrap {
  position: relative;
}

.scroll-fade-right {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 40px;
  background: linear-gradient(90deg, transparent, rgba(251,247,240,0.95));
  pointer-events: none;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.hourly-scroll { white-space: nowrap; }

.hourly-list {
  display: flex;
  gap: var(--spacing-sm);
  padding-right: 36px;
}

.hourly-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 68px;
  padding: var(--spacing-sm) 6px;
  border-radius: var(--radius-md);
  background: var(--color-paper);
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}

.hourly-item.is-sun {
  background: rgba(212,168,83,0.12);
  border-color: rgba(212,168,83,0.25);
}

.hourly-item.is-dusk {
  background: rgba(139,109,175,0.08);
  border-color: rgba(139,109,175,0.2);
}

.hourly-time {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  font-weight: var(--font-weight-semibold);
}

.hourly-temp {
  font-size: var(--font-size-md);
  color: var(--color-ink);
  font-weight: var(--font-weight-semibold);
}

.hourly-desc {
  font-size: 10px;
  color: var(--color-ink-soft);
  text-align: center;
  white-space: normal;
  max-width: 56px;
}

.hourly-wind {
  font-size: 10px;
  color: var(--color-ash);
}

.rain-tag {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
}

.rain-heavy { background: rgba(91,140,122,0.12); color: var(--color-jade); }
.rain-light { background: rgba(91,140,122,0.06); color: var(--color-jade-light); }
.rain-none { color: var(--color-ash); }

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

.typhoon-entry .entry-icon-wrap { background: rgba(192,57,43,0.1); }
.quake-entry .entry-icon-wrap { background: rgba(91,140,122,0.1); }

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
</style>
