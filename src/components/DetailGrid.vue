<script setup lang="ts">
import { computed } from "vue"
import { uvLabel, moonPhase, heatIndexC, windChillC } from "@/utils/weather"
import { formatLunar } from "@/utils/lunar"
import type { CurrentWeather } from "@/api/weather"

const props = defineProps<{
  weather: CurrentWeather
}>()

const moon = computed(() => moonPhase())
const lunar = computed(() => formatLunar())

const heatVal = computed(() => {
  const t = parseFloat(props.weather.temp)
  const h = parseFloat(props.weather.humidity)
  if (isNaN(t) || isNaN(h)) return "--"
  return heatIndexC(t, h) + "°"
})

const windChillVal = computed(() => {
  const t = parseFloat(props.weather.temp)
  const w = parseFloat(props.weather.windScale)
  if (isNaN(t) || isNaN(w)) return "--"
  return windChillC(t, w) + "°"
})
</script>

<template>
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
    <view class="detail-item" :class="{ 'uv-warning': parseInt(weather.uvIndex) >= 7 }">
      <text class="detail-label">紫外线</text>
      <text class="detail-value">{{ weather.uvIndex }} {{ uvLabel(weather.uvIndex) }}</text>
      <text class="uv-badge" v-if="parseInt(weather.uvIndex) >= 7">⚠ 注意防护</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">日出</text>
      <text class="detail-value">{{ weather.sunrise }}</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">日落</text>
      <text class="detail-value">{{ weather.sunset }}</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">气压</text>
      <text class="detail-value">{{ weather.pressure }}</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">能见度</text>
      <text class="detail-value">{{ weather.visibility }}</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">露点</text>
      <text class="detail-value">{{ weather.dewPoint }}</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">云量</text>
      <text class="detail-value">{{ weather.cloudCover }}</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">阵风</text>
      <text class="detail-value">{{ weather.windGust }}</text>
    </view>
    <view class="detail-item" v-if="weather.aqi !== '--'">
      <text class="detail-label">空气质量</text>
      <text class="detail-value">{{ weather.aqi }} {{ weather.aqiLabel }}</text>
    </view>
    <view class="detail-item" v-if="heatVal !== '--'">
      <text class="detail-label">热指数</text>
      <text class="detail-value">{{ heatVal }}</text>
    </view>
    <view class="detail-item" v-if="windChillVal !== '--'">
      <text class="detail-label">风寒</text>
      <text class="detail-value">{{ windChillVal }}</text>
    </view>
  </view>
  <view class="moon-row">
    <text class="moon-icon">{{ moon.icon }}</text>
    <view class="moon-info">
      <text class="moon-text">{{ moon.phase }}</text>
      <text class="lunar-text">{{ lunar }}</text>
    </view>
  </view>
</template>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}
.detail-item {
  background: rgba(255,255,255,0.2);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-sm);
  text-align: center;
  border: 1px solid rgba(255,255,255,0.1);
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
.uv-warning {
  background: rgba(240, 100, 50, 0.25) !important;
  border-color: rgba(240, 100, 50, 0.4) !important;
}
.uv-badge {
  display: block;
  font-size: 9px;
  color: rgba(255, 200, 50, 1);
  font-weight: var(--font-weight-bold);
  margin-top: 2px;
}
.moon-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  margin: var(--spacing-sm) 0;
  padding: var(--spacing-xs) var(--spacing-md);
  background: rgba(255,255,255,0.12);
  border-radius: var(--radius-full);
  border: 1px solid rgba(255,255,255,0.08);
}
.moon-icon {
  font-size: 18px;
}
.moon-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.moon-text {
  font-size: var(--font-size-sm);
  color: rgba(255,255,255,0.85);
  font-weight: var(--font-weight-medium);
}
.lunar-text {
  font-size: 10px;
  color: rgba(255,255,255,0.55);
}
</style>
