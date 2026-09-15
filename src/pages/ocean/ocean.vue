<script setup lang="ts">
import { ref, computed } from "vue"
import { onShow } from "@dcloudio/uni-app"
import { getCityCoords } from "@/api/weather"
import { getMarine, type MarineData } from "@/api/marine"
import { loadDarkMode } from "@/utils/theme"
import { CACHE, DEFAULT_CITY } from "@/config"
import Icon from "@/components/Icon.vue"

const darkMode = ref(false)
const city = ref(DEFAULT_CITY)
const data = ref<MarineData | null>(null)
const loading = ref(true)
const error = ref(false)

onShow(async () => {
  darkMode.value = loadDarkMode()
  city.value = (uni.getStorageSync(CACHE.CITY_KEY) as string) || DEFAULT_CITY
  error.value = false
  loading.value = true
  const coords = getCityCoords(city.value)
  if (!coords) { error.value = true; loading.value = false; return }
  const res = await getMarine(coords.lat, coords.lon)
  data.value = res
  if (!res) error.value = true
  loading.value = false
})

function goBack() { uni.navigateBack() }

const maxWave = computed(() => Math.max(0.5, ...(data.value?.hourly.map(h => h.waveHeight) || [0])))

function barH(v: number): string {
  return Math.max(4, Math.round((v / maxWave.value) * 80)) + "px"
}

function waveLevel(v: number): string {
  if (v < 0.5) return "平静"
  if (v < 1.25) return "轻浪"
  if (v < 2.5) return "中浪"
  if (v < 4) return "大浪"
  if (v < 6) return "巨浪"
  return "狂浪"
}
</script>

<template>
  <view class="container" :class="{ 'dark-mode': darkMode }">
    <view class="top-bar">
      <text class="top-back" @tap="goBack">‹ 返回</text>
      <text class="top-title">海洋预报 · {{ city }}</text>
      <text class="top-spacer"></text>
    </view>

    <view v-if="loading" class="loading-hint">加载中...</view>

    <view v-else-if="error || !data || !data.current" class="empty-state">
      <view class="empty-icon"><Icon name="waves" :size="46" color="#C9D3DE" /></view>
      <text class="empty-text">{{ error ? '网络异常，请稍后重试' : '该地区暂无海洋数据' }}</text>
    </view>

    <template v-else>
      <view class="card wave-main">
        <text class="wave-label">当前浪高</text>
        <view class="wave-value-row">
          <text class="wave-value">{{ data.current.waveHeight }}</text>
          <text class="wave-unit">m</text>
        </view>
        <text class="wave-level">{{ waveLevel(data.current.waveHeight) }}</text>
      </view>

      <view class="stat-grid">
        <view class="stat-item">
          <text class="stat-label">浪向</text>
          <text class="stat-value">{{ data.current.waveDir }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">浪周期</text>
          <text class="stat-value">{{ data.current.wavePeriod }} s</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">海表温度</text>
          <text class="stat-value">{{ data.current.seaTemp }}°</text>
        </view>
      </view>

      <view class="card chart-card" v-if="data.hourly.length">
        <view class="section-header">
          <view class="section-decor" />
          <text class="section-title">未来 24 小时浪高</text>
        </view>
        <view class="wave-chart">
          <view v-for="(h, i) in data.hourly" :key="i" class="wave-col">
            <view class="wave-bar" :style="{ height: barH(h.waveHeight) }" />
            <text class="wave-time">{{ i % 3 === 0 ? h.time : '' }}</text>
          </view>
        </view>
      </view>
    </template>

    <view class="foot-hint">数据来源：Open-Meteo 海洋预报</view>
  </view>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--color-bg);
  padding: var(--spacing-lg);
  padding-bottom: calc(var(--spacing-4xl) + var(--window-bottom, 0px));
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}
.top-back { font-size: var(--font-size-md); color: var(--color-primary); font-weight: var(--font-weight-medium); width: 70px; }
.top-title { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-ink); }
.top-spacer { width: 70px; }
.loading-hint { text-align: center; padding: 60px 0; color: var(--color-ash); font-size: var(--font-size-sm); }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-sm); padding: 80px 0; }
.empty-icon { display: flex; align-items: center; justify-content: center; }
.empty-text { font-size: var(--font-size-sm); color: var(--color-ash); }

.card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-lg);
  box-shadow: var(--card-shadow);
  margin-bottom: var(--spacing-md);
}

.wave-main { text-align: center; }
.wave-label { font-size: var(--font-size-xs); color: var(--color-ink-light); }
.wave-value-row { display: flex; align-items: baseline; justify-content: center; gap: 4px; margin: 6px 0; }
.wave-value { font-size: 56px; font-weight: var(--font-weight-bold); color: var(--m-ocean); line-height: 1; }
.wave-unit { font-size: var(--font-size-lg); color: var(--color-ink-light); }
.wave-level { display: inline-block; font-size: var(--font-size-xs); color: var(--m-ocean); background: var(--m-ocean-soft); padding: 2px 12px; border-radius: 999px; }

.stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-sm); margin-bottom: var(--spacing-md); }
.stat-item { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius-lg); padding: var(--spacing-md) var(--spacing-sm); text-align: center; box-shadow: var(--shadow-sm); }
.stat-label { display: block; font-size: var(--font-size-xs); color: var(--color-ash); margin-bottom: 4px; }
.stat-value { display: block; font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--color-ink); }

.section-header { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-lg); }
.section-decor { width: 3px; height: 16px; border-radius: 2px; background: var(--m-ocean); }
.section-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--color-ink); }

.wave-chart { display: flex; align-items: flex-end; justify-content: space-between; gap: 2px; height: 96px; }
.wave-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 2px; }
.wave-bar { width: 100%; max-width: 12px; border-radius: 3px 3px 0 0; background: linear-gradient(180deg, #4FB6C9, #2E9BAE); transition: height 0.3s ease; }
.wave-time { font-size: 9px; color: var(--color-ash); height: 11px; line-height: 11px; white-space: nowrap; }

.foot-hint { text-align: center; font-size: 10px; color: var(--color-ash); margin-top: var(--spacing-lg); }
</style>
