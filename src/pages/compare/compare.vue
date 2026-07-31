<script setup lang="ts">
import { ref, computed } from "vue"
import { onShow } from "@dcloudio/uni-app"
import { getWeather, getCachedWeather, getCityCoords, type CurrentWeather } from "@/api/weather"
import { getUnitSettings, formatTemp } from "@/utils/weather"
import { loadDarkMode } from "@/utils/theme"
import WeatherIcon from "@/components/WeatherIcon.vue"

const darkMode = ref(false)
const currentCity = ref("北京")
const favCities = ref<string[]>([])
const selected = ref<string[]>([])
const results = ref<Record<string, { data?: CurrentWeather; error?: string; status: "loading" | "ok" | "error" | "no-coords" }>>({})
const loading = ref(false)
const MAX_CITIES = 4

interface CityResult {
  name: string
  data?: CurrentWeather
  error?: string
  status: "loading" | "ok" | "error" | "no-coords"
}

const ordered = computed<CityResult[]>(() =>
  selected.value.map(name => ({ name, status: "loading", ...(results.value[name] || {}) }))
)

const allCandidates = computed<string[]>(() => {
  const seen: string[] = []
  ;[currentCity.value, ...favCities.value].forEach(c => { if (!seen.includes(c)) seen.push(c) })
  return seen
})

const isF = computed(() => getUnitSettings().temp === "f")

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))])
}

onShow(() => {
  darkMode.value = loadDarkMode()
  currentCity.value = (uni.getStorageSync("selected_city") as string) || "北京"
  try {
    const raw = uni.getStorageSync("fav_cities") as string
    favCities.value = raw ? JSON.parse(raw) : []
  } catch { favCities.value = [] }
  const candidates = [currentCity.value, ...favCities.value.filter(c => c !== currentCity.value)].filter(c => getCityCoords(c))
  selected.value = candidates.slice(0, MAX_CITIES)
  if (!selected.value.length && getCityCoords(currentCity.value)) selected.value = [currentCity.value]
  loadWeather()
})

async function loadWeather() {
  if (!selected.value.length) return
  loading.value = true
  const init: Record<string, { data?: CurrentWeather; error?: string; status: "loading" | "ok" | "error" | "no-coords" }> = {}
  selected.value.forEach(name => {
    const cached = getCachedWeather(name)
    const existing = results.value[name]
    if (cached) init[name] = { data: cached, status: "ok" }
    else if (existing && existing.data) init[name] = existing
    else init[name] = { status: "loading" }
  })
  results.value = init

  await Promise.all(selected.value.map(async (city) => {
    const coords = getCityCoords(city)
    if (!coords) { results.value[city] = { status: "no-coords", error: "无坐标" }; return }
    try {
      const res = await withTimeout(getWeather(coords.lat, coords.lon), 8000)
      results.value[city] = res ? { data: res, status: "ok" } : { status: "error", error: "获取失败" }
    } catch {
      results.value[city] = { status: "error", error: "获取超时" }
    }
  }))
  loading.value = false
}

function toggleCity(name: string) {
  if (selected.value.includes(name)) {
    if (selected.value.length === 1) return
    selected.value = selected.value.filter(c => c !== name)
  } else {
    if (selected.value.length >= MAX_CITIES) {
      uni.showToast({ title: "最多对比 " + MAX_CITIES + " 个城市", icon: "none" })
      return
    }
    selected.value = [...selected.value, name]
  }
  loadWeather()
}

const fTemp = (v: string) => formatTemp(v, isF.value) + "°"

function maxRain(w: CurrentWeather): string {
  const hrs = w.hourly?.slice(0, 6) || []
  if (!hrs.length) return "—"
  const mx = Math.max(...hrs.map(h => parseInt(h.rainChance) || 0))
  return mx > 0 ? mx + "%" : "无"
}

const rows = computed(() => [
  { label: "天气", val: (w: CurrentWeather) => w.weather },
  { label: "温度", val: (w: CurrentWeather) => fTemp(w.temp) },
  { label: "体感", val: (w: CurrentWeather) => fTemp(w.feelsLike) },
  { label: "最高", val: (w: CurrentWeather) => fTemp(w.high) },
  { label: "最低", val: (w: CurrentWeather) => fTemp(w.low) },
  { label: "湿度", val: (w: CurrentWeather) => w.humidity + "%" },
  { label: "风力", val: (w: CurrentWeather) => w.windLevel },
  { label: "降水", val: (w: CurrentWeather) => maxRain(w) },
  { label: "日出", val: (w: CurrentWeather) => w.sunrise },
  { label: "日落", val: (w: CurrentWeather) => w.sunset },
])

function cellText(c: CityResult): string {
  if (c.status === "loading") return "…"
  if (c.status === "error" || c.status === "no-coords") return c.error || "—"
  return ""
}

function goBack() { uni.navigateBack() }
</script>

<template>
  <view class="container" :class="{ 'dark-mode': darkMode }">
    <view class="top-bar">
      <text class="top-back" @tap="goBack">‹ 返回</text>
      <text class="top-title">城市对比</text>
      <text class="top-spacer"></text>
    </view>

    <scroll-view class="chip-scroll" scroll-x :show-scrollbar="false">
      <view class="chip-row">
        <view v-for="c in allCandidates" :key="c" class="chip" :class="{ active: selected.includes(c) }" @tap="toggleCity(c)">
          <text class="chip-text">{{ c }}</text>
          <text class="chip-check">{{ selected.includes(c) ? '✓' : '' }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="refresh-hint" v-if="loading">正在刷新数据...</view>

    <scroll-view class="table-scroll" scroll-x :show-scrollbar="false" v-if="ordered.length">
      <view class="compare-table">
        <view class="table-row head">
          <view class="cell label-cell"><text class="row-label">指标</text></view>
          <view v-for="c in ordered" :key="c.name" class="cell city-cell">
            <text class="city-name">{{ c.name }}</text>
            <WeatherIcon v-if="c.data" :weather="c.data.weather" :size="30" />
            <text v-else class="city-status">{{ c.status === 'loading' ? '加载中' : (c.error || '—') }}</text>
          </view>
        </view>
        <view v-for="row in rows" :key="row.label" class="table-row">
          <view class="cell label-cell"><text class="row-label">{{ row.label }}</text></view>
          <view v-for="c in ordered" :key="c.name" class="cell value-cell">
            <text v-if="c.data">{{ row.val(c.data) }}</text>
            <text v-else class="err">{{ cellText(c) }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="empty" v-else>
      <text class="empty-text">暂无城市可选</text>
    </view>
  </view>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--color-bg);
  padding: var(--spacing-lg);
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}
.top-back {
  font-size: var(--font-size-md);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  width: 70px;
}
.top-title {
  font-size: var(--font-size-lg);
  color: var(--color-ink);
  font-weight: var(--font-weight-bold);
}
.top-spacer { width: 70px; }
.chip-scroll { margin-bottom: var(--spacing-lg); white-space: nowrap; }
.chip-row { display: flex; gap: var(--spacing-sm); padding-bottom: 4px; }
.chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background: var(--color-paper);
  border: 1px solid var(--color-paper-border);
  flex-shrink: 0;
  transition: all var(--transition-fast);
}
.chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.chip.active .chip-text { color: #fff; }
.chip-text {
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  font-weight: var(--font-weight-medium);
}
.chip-check {
  font-size: 12px;
  color: #fff;
}
.refresh-hint {
  text-align: center;
  padding: 6px 0 10px;
  font-size: 11px;
  color: var(--color-ash);
}
.table-scroll { white-space: nowrap; }
.compare-table {
  background: var(--color-paper);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-paper-border);
  overflow: hidden;
}
.table-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-paper-border);
}
.table-row:last-child { border-bottom: none; }
.table-row.head { border-bottom: 1px solid var(--color-paper-border); background: var(--color-bg); }
.cell {
  flex-shrink: 0;
  min-width: 88px;
  padding: 10px 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  justify-content: center;
}
.label-cell {
  min-width: 56px;
  background: var(--color-bg);
  position: sticky;
  left: 0;
  z-index: 2;
}
.city-cell { min-width: 96px; }
.row-label {
  font-size: 11px;
  color: var(--color-ink-light);
  font-weight: var(--font-weight-semibold);
}
.city-name {
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  font-weight: var(--font-weight-bold);
}
.city-status {
  font-size: 10px;
  color: var(--color-ash);
}
.value-cell { min-height: 40px; }
.value-cell text {
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  font-weight: var(--font-weight-medium);
}
.value-cell .err {
  font-size: 11px;
  color: var(--color-ash);
  font-weight: normal;
}
.empty {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}
.empty-text {
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
}
</style>
