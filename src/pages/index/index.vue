<script setup lang="ts">
import { ref } from "vue"
import { onShow, onPullDownRefresh } from "@dcloudio/uni-app"
import { getWeather, getCityId, getCityCoords, getHourlyForecast, type CurrentWeather } from "@/api/weather"
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

async function detectCity(): Promise<string | null> {
  return new Promise((resolve) => {
    uni.getLocation({
      type: "wgs84",
      timeout: 5000,
      success(res: any) { resolve(nearestCity(res.latitude, res.longitude)) },
      fail() { resolve(null) },
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
  const lightBg = res.weather.includes("雪") || res.weather.includes("雾") || res.weather.includes("霾")
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
  const city = await detectCity()
  if (city) {
    currentCity.value = city
    uni.setStorageSync("selected_city", city)
    await load()
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
  if (w.includes("雷")) return "linear-gradient(180deg, #3D3F45 0%, #6B6F77 100%)"
  if (w.includes("雪") || w.includes("冰雹")) return "linear-gradient(180deg, #DCE5EC 0%, #F0F4F8 100%)"
  if (w.includes("雾") || w.includes("霾")) return "linear-gradient(180deg, #B8BEC3 0%, #D5D9DD 100%)"
  if (w.includes("大") && w.includes("雨")) return "linear-gradient(180deg, #4A6A7A 0%, #7A9AA8 100%)"
  if (w.includes("雨") || w.includes("阵雨")) return "linear-gradient(180deg, #5A7D8F 0%, #8FA8B8 100%)"
  if (w.includes("阴")) return "linear-gradient(180deg, #8E9EAB 0%, #BFC9D0 100%)"
  if (w.includes("多云")) return "linear-gradient(180deg, #6B8DBF 0%, #B0C4DE 100%)"
  if (w.includes("晴")) return "linear-gradient(180deg, #4A90D9 0%, #87CEEB 100%)"
  return "linear-gradient(180deg, #4A90D9 0%, #87CEEB 100%)"
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
  <view class="container" :style="{ background: weather ? weatherBg(weather.weather) : '#4A90D9', paddingTop: (statusBarHeight + 16) + 'px' }">
    <SkeletonLoader v-if="loading && !weather" />

    <template v-else-if="weather">
      <view class="card current-weather">
        <view class="city-row" @tap="goSearch">
          <text class="city-name">{{ currentCity }}</text>
          <text class="city-arrow">▼</text>
          <view class="locate-btn" @tap.stop="locateMe">
            <text class="locate-icon">📍</text>
          </view>
        </view>
        <view class="weather-main">
          <WeatherIcon :weather="weather.weather" :size="56" />
          <text class="temp">{{ weather.temp }}°</text>
        </view>
        <text class="weather-text">{{ weather.weather }}</text>
        <view class="temp-range">
          <text class="temp-high">{{ weather.high }}°</text>
          <text class="temp-sep">/</text>
          <text class="temp-low">{{ weather.low }}°</text>
        </view>
        <view class="detail-row">
          <text>{{ weather.windDir }}</text>
          <text>{{ weather.windLevel }}</text>
        </view>
        <view class="extra-row">
          <text>体感 {{ weather.feelsLike }}°</text>
          <text>紫外线 {{ weather.uvIndex }}</text>
        </view>
        <view class="extra-row">
          <text>🌅 {{ weather.sunrise }}</text>
          <text>🌇 {{ weather.sunset }}</text>
        </view>
        <view class="extra-row">
          <text>湿度 {{ weather.humidity }}%</text>
        </view>
        <view class="update-row">
          <text class="update-time" v-if="updateTime">{{ refreshing ? '刷新中...' : '更新于 ' + updateTime }}</text>
        </view>
      </view>

      <view class="card forecast" v-if="weather.forecast.length > 0">
        <view class="section-title">未来两天</view>
        <view class="forecast-list">
          <view v-for="(f, i) in weather.forecast" :key="f.day">
            <view class="forecast-item" :class="{ expanded: expandedIndex === i }" @tap="toggleForecast(i)">
              <text class="forecast-day">{{ f.day }}</text>
              <WeatherIcon :weather="f.weather" :size="28" />
              <text class="forecast-weather">{{ f.weather }}</text>
              <view class="forecast-temps">
                <text class="forecast-high">{{ f.high }}°</text>
                <text class="forecast-low">{{ f.low }}°</text>
              </view>
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

      <view class="card hourly-card" v-if="weather.hourly && weather.hourly.length > 0">
        <view class="section-title">逐时天气</view>
        <scroll-view scroll-x class="hourly-scroll">
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
      </view>

      <view class="typhoon-entry" @tap="uni.navigateTo({ url: '/pages/typhoon/typhoon' })">
        <text class="typhoon-entry-text">🌀 台风路径</text>
        <text class="typhoon-entry-arrow">›</text>
      </view>

      <view class="typhoon-entry" @tap="uni.navigateTo({ url: '/pages/earthquake/earthquake' })">
        <text class="typhoon-entry-text">🌍 地震信息</text>
        <text class="typhoon-entry-arrow">›</text>
      </view>
    </template>

    <view v-else class="error-view">
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
  padding-left: 16px;
  padding-right: 16px;
  padding-bottom: 32px;
  min-height: 100vh;
  padding-bottom: calc(32px + env(safe-area-inset-bottom));
}

.error-view {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
  gap: 16px;
}

.error-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
}

.retry-btn {
  background: #fff;
  border-radius: 10px;
  padding: 10px 28px;
  color: #4a90d9;
  font-size: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card {
  background: #fff;
  border-radius: 20px;
  padding: 28px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 12px;
}

.current-weather {
  text-align: center;
}

.city-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 16px;
  padding: 4px 0;
}

.city-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.city-arrow {
  font-size: 12px;
  color: #999;
}

.locate-btn {
  margin-left: 8px;
  padding: 4px 6px;
}

.locate-icon {
  font-size: 16px;
}

.weather-main {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 4px;
}

.temp {
  font-size: 72px;
  font-weight: 200;
  color: #333;
  line-height: 1;
}

.weather-text {
  font-size: 18px;
  color: #666;
  display: block;
  margin-bottom: 16px;
}

.temp-range {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.temp-high {
  font-size: 18px;
  color: #e74c3c;
  font-weight: 500;
}

.temp-sep {
  font-size: 18px;
  color: #ddd;
}

.temp-low {
  font-size: 18px;
  color: #3498db;
  font-weight: 500;
}

.detail-row, .extra-row {
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: 14px;
  color: #999;
  margin-bottom: 6px;
}

.update-row {
  display: flex;
  justify-content: center;
}

.update-time {
  font-size: 12px;
  color: #bbb;
  margin-top: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  display: block;
}

.forecast-list {
  display: flex;
  flex-direction: column;
}

.forecast-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.forecast-item.expanded {
  background: #f8fafc;
  margin: 0 -24px;
  padding: 10px 24px;
  border-radius: 12px;
}

.forecast-item:last-child {
  border-bottom: none;
}

.forecast-hourly-wrap {
  padding: 8px 0 12px;
  border-bottom: 1px solid #f5f5f5;
}

.forecast-hourly-loading, .forecast-hourly-empty {
  font-size: 13px;
  color: #bbb;
  text-align: center;
  padding: 12px 0;
}

.forecast-day {
  width: 40px;
  font-size: 14px;
  color: #666;
}

.forecast-weather {
  flex: 1;
  font-size: 14px;
  color: #666;
}

.forecast-temps {
  display: flex;
  gap: 8px;
}

.forecast-high {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.forecast-low {
  font-size: 15px;
  color: #999;
}

.hourly-card {
  padding: 18px 18px 14px;
}

.hourly-scroll {
  white-space: nowrap;
}

.hourly-list {
  display: flex;
  gap: 10px;
}

.hourly-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 72px;
  padding: 10px 8px;
  border-radius: 12px;
  background: rgba(255,255,255,0.5);
}

.hourly-item.is-sun {
  background: rgba(255,180,50,0.15);
  border: 1px solid rgba(255,160,30,0.25);
}

.hourly-item.is-dusk {
  background: rgba(180,100,180,0.12);
  border: 1px solid rgba(160,80,160,0.2);
}

.hourly-time {
  font-size: 12px;
  color: #888;
  font-weight: 600;
}

.hourly-temp {
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.hourly-desc {
  font-size: 11px;
  color: #666;
  text-align: center;
  white-space: normal;
  max-width: 60px;
}

.hourly-wind {
  font-size: 11px;
  color: #aaa;
}

.rain-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.rain-heavy {
  background: rgba(74,144,217,0.15);
  color: #4A90D9;
}

.rain-light {
  background: rgba(74,144,217,0.08);
  color: #6AADE0;
}

.rain-none {
  background: transparent;
  color: #bbb;
}

.hourly-arrow {
  font-size: 10px;
  color: #bbb;
}

.typhoon-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 24px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-top: 16px;
}

.typhoon-entry-text {
  font-size: 15px;
  color: #4A90D9;
  font-weight: 500;
}

.typhoon-entry-arrow {
  font-size: 20px;
  color: #4A90D9;
  line-height: 1;
}
</style>
