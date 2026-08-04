<script setup lang="ts">
import { ref, computed } from "vue"
import { onShow } from "@dcloudio/uni-app"
import { getCachedWeather, getWeather, getCityCoords, type CurrentWeather } from "@/api/weather"
import { loadDarkMode } from "@/utils/theme"
import { moonPhase as localMoonPhase } from "@/utils/weather"
import { stargazingScore, milkyWayScore, moonPhaseInfo, moonIllumination, moonPosition, lightPollutionByCity } from "@/utils/astronomy"

const darkMode = ref(false)
const city = ref("北京")
const weather = ref<CurrentWeather | null>(null)
const loading = ref(true)

onShow(async () => {
  darkMode.value = loadDarkMode()
  city.value = (uni.getStorageSync("selected_city") as string) || "北京"
  const cached = getCachedWeather(city.value)
  if (cached) {
    weather.value = cached
    loading.value = false
  } else {
    const coords = getCityCoords(city.value)
    if (coords) {
      const res = await getWeather(coords.lat, coords.lon)
      weather.value = res
    }
    loading.value = false
  }
})

function nightData() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const td = new Date(now.getTime() + 86400000)
  const tomorrow = `${td.getFullYear()}-${pad(td.getMonth() + 1)}-${pad(td.getDate())}`
  const clouds: number[] = []
  const humidity: number[] = []
  const hours: { t: string; c: number; h: number }[] = []
  const push = (dateStr: string, hh: number) => {
    const arr = weather.value?.hourlyByDate?.[dateStr] || []
    const it = arr.find(h => parseInt(h.time) === hh)
    if (it) {
      const c = parseFloat(it.cloud || "")
      const hu = parseFloat(it.humidity || "")
      if (!isNaN(c)) clouds.push(c)
      if (!isNaN(hu)) humidity.push(hu)
      hours.push({ t: String(hh).padStart(2, "0") + ":00", c: isNaN(c) ? -1 : c, h: isNaN(hu) ? -1 : hu })
    }
  }
  ;[20, 21, 22, 23].forEach(h => push(today, h))
  ;[0, 1, 2].forEach(h => push(tomorrow, h))
  return { clouds, humidity, hours }
}

const moonPhase = computed(() => {
  if (!weather.value) return 0
  if (weather.value.moonPhase != null) return weather.value.moonPhase
  return localMoonPhase().phase === "满月" ? 0.5 : 0
})
const moonInfo = computed(() => moonPhaseInfo(moonPhase.value))
const illum = computed(() => moonIllumination(moonPhase.value))

const score = computed(() => {
  if (!weather.value) return { score: 0, level: "--", advice: "" }
  const n = nightData()
  return stargazingScore({
    clouds: n.clouds.length ? n.clouds : [60],
    humidity: n.humidity.length ? n.humidity : [70],
    windKmh: parseFloat(weather.value.windScale) || 0,
    visibilityKm: parseFloat(weather.value.visibility) || undefined,
    moonPhase: moonPhase.value,
  })
})

const milkyWay = computed(() => {
  if (!weather.value) return { score: 0, level: "--", advice: "" }
  const n = nightData()
  return milkyWayScore(
    { clouds: n.clouds.length ? n.clouds : [60], humidity: [], windKmh: 0, moonPhase: moonPhase.value },
    lightPollutionByCity(city.value)
  )
})

const moonPos = computed(() => {
  const coords = getCityCoords(city.value)
  if (!coords) return { azimuth: 0, altitude: 0, dir: "—" }
  return moonPosition(new Date(), coords.lat, coords.lon)
})

const nightHours = computed(() => nightData().hours)

const scoreColor = computed(() => {
  if (score.value.score >= 60) return "#6B9FD0"
  if (score.value.score >= 40) return "#D4A550"
  return "#E5606E"
})

function goBack() { uni.navigateBack() }
</script>

<template>
  <view class="container" :class="{ 'dark-mode': darkMode }">
    <view class="top-bar">
      <text class="top-back" @tap="goBack">‹ 返回</text>
      <text class="top-title">观星天文 · {{ city }}</text>
      <text class="top-spacer"></text>
    </view>

    <view v-if="loading" class="loading-hint">加载中...</view>

    <view v-else-if="!weather" class="empty-state">
      <text class="empty-text">暂无数据，请先打开首页刷新</text>
    </view>

    <template v-else>
      <view class="card main-card">
        <view class="card-title">今晚观星指数</view>
        <view class="score-row">
          <text class="score-num" :style="{ color: scoreColor }">{{ score.score }}</text>
          <text class="score-div">/ 100</text>
          <view class="score-level" :style="{ background: scoreColor }">{{ score.level }}</view>
        </view>
        <text class="score-advice">{{ score.advice }}</text>
      </view>

      <view class="card moon-card">
        <view class="card-title">月亮</view>
        <view class="moon-main">
          <text class="moon-big">{{ moonInfo.icon }}</text>
          <view class="moon-info">
            <text class="moon-phase">{{ moonInfo.name }}</text>
            <text class="moon-sub">照亮 {{ illum }}%</text>
          </view>
          <view class="moon-times">
            <text class="moon-time">🌅 月出 {{ weather.moonrise || '--' }}</text>
            <text class="moon-time">🌇 月落 {{ weather.moonset || '--' }}</text>
          </view>
        </view>
        <view class="moon-pos">
          <text class="pos-item">当前方位：{{ moonPos.dir }}（{{ moonPos.azimuth }}°）</text>
          <text class="pos-item">高度角：{{ moonPos.altitude }}°</text>
          <text class="pos-note">方位为近似计算</text>
        </view>
      </view>

      <view class="card milky-card">
        <view class="card-title">银河可见度</view>
        <view class="milky-row">
          <text class="milky-score">{{ milkyWay.score }}</text>
          <view class="milky-level">{{ milkyWay.level }}</view>
        </view>
        <text class="score-advice">{{ milkyWay.advice }}</text>
      </view>

      <view class="card night-card" v-if="nightHours.length">
        <view class="card-title">今夜云量 / 湿度</view>
        <view class="night-chart">
          <view v-for="(h, i) in nightHours" :key="i" class="night-col">
            <view class="night-bar-wrap">
              <view class="hum-bar" :style="{ height: (h.h >= 0 ? h.h / 2 : 0) + 'px', background: '#6DAF98' }"></view>
              <view class="cloud-bar" :style="{ height: (h.c >= 0 ? h.c / 2 : 0) + 'px', background: '#5B8FC0' }"></view>
            </view>
            <text class="night-time">{{ h.t }}</text>
            <text class="night-val">{{ h.c >= 0 ? h.c + '%' : '--' }}</text>
          </view>
        </view>
        <view class="night-legend">
          <text class="legend-item"><text class="dot blue"></text>云量</text>
          <text class="legend-item"><text class="dot green"></text>湿度</text>
        </view>
      </view>
    </template>
  </view>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--color-bg);
  padding: var(--spacing-lg);
  padding-bottom: calc(var(--spacing-lg) + var(--window-bottom, 0px));
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
.loading-hint { text-align: center; padding: 60px 0; font-size: var(--font-size-sm); color: var(--color-ink-light); }
.empty-state { text-align: center; padding: 80px 0; font-size: var(--font-size-sm); color: var(--color-ink-light); }
.card {
  background: var(--color-paper);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--color-paper-border);
}
.card-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-ink);
  margin-bottom: var(--spacing-md);
}
.score-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: var(--spacing-sm);
}
.score-num {
  font-size: 64px;
  font-weight: var(--font-weight-bold);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.score-div { font-size: 16px; color: var(--color-ash); }
.score-level {
  margin-left: auto;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #fff;
  padding: 4px 14px;
  border-radius: 999px;
}
.score-advice {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  line-height: 1.6;
}
.moon-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}
.moon-big { font-size: 56px; line-height: 1; }
.moon-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.moon-phase { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); color: var(--color-ink); }
.moon-sub { font-size: var(--font-size-xs); color: var(--color-ash); }
.moon-times { display: flex; flex-direction: column; gap: 4px; }
.moon-time { font-size: var(--font-size-xs); color: var(--color-ink-soft); }
.moon-pos {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-paper-border);
}
.pos-item { font-size: var(--font-size-xs); color: var(--color-ink); font-weight: var(--font-weight-medium); }
.pos-note { font-size: 10px; color: var(--color-ash); margin-left: auto; }
.milky-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}
.milky-score {
  font-size: 40px;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  line-height: 1;
}
.milky-level {
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  padding: 3px 12px;
  background: rgba(91,143,192,0.1);
  border-radius: 999px;
}
.night-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 60px;
}
.night-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 0;
}
.night-bar-wrap {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
}
.cloud-bar, .hum-bar {
  width: 7px;
  border-radius: 2px 2px 0 0;
  min-height: 2px;
}
.night-time { font-size: 8px; color: var(--color-ash); }
.night-val { font-size: 8px; color: var(--color-ash); }
.night-legend {
  display: flex;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-sm);
  font-size: 10px;
  color: var(--color-ash);
}
.legend-item { display: flex; align-items: center; gap: 4px; }
.dot { width: 8px; height: 8px; border-radius: 2px; }
.dot.blue { background: #5B8FC0; }
.dot.green { background: #6DAF98; }
</style>
