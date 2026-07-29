<script setup lang="ts">
import { computed } from "vue"
import WeatherIcon from "./WeatherIcon.vue"

const props = defineProps<{
  temp: string
  weather: string
  high: string
  low: string
  accentColor: string
  sunrise: string
  sunset: string
}>()

const daylightPct = computed(() => {
  if (!props.sunrise || !props.sunset || props.sunrise === "--" || props.sunset === "--") return 0
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const rise = new Date(`${today}T${props.sunrise}:00`).getTime()
  const set = new Date(`${today}T${props.sunset}:00`).getTime()
  const current = now.getTime()
  if (current < rise) return 0
  if (current > set) return 100
  return ((current - rise) / (set - rise)) * 100
})
</script>

<template>
  <view class="weather-hero anim-fade-in-scale" :style="{ '--accent': accentColor }">
    <view class="temp-display">
      <text class="temp-value">{{ temp }}</text>
      <text class="temp-unit">°</text>
    </view>
    <view class="weather-badge">
      <WeatherIcon :weather="weather" :size="44" />
      <text class="weather-desc">{{ weather }}</text>
    </view>
    <view class="temp-range-row">
      <text class="temp-high">↑ {{ high }}°</text>
      <view class="temp-divider" />
      <text class="temp-low">↓ {{ low }}°</text>
    </view>
    <view class="daylight-row" v-if="sunrise && sunrise !== '--'">
      <text class="daylight-label">{{ sunrise }}</text>
      <view class="daylight-track">
        <view class="daylight-bar">
          <view class="daylight-fill" :style="{ width: daylightPct + '%' }" />
          <view class="daylight-dot" :style="{ left: daylightPct + '%' }" />
        </view>
      </view>
      <text class="daylight-label">{{ sunset }}</text>
    </view>
  </view>
</template>

<style scoped>
.weather-hero {
  text-align: center;
  padding: var(--spacing-lg) 0 var(--spacing-lg);
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
  margin-bottom: var(--spacing-lg);
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
.daylight-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0 var(--spacing-xl);
}
.daylight-label {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  font-weight: var(--font-weight-medium);
  flex-shrink: 0;
  min-width: 36px;
  text-align: center;
}
.daylight-track {
  flex: 1;
  height: 20px;
  display: flex;
  align-items: center;
}
.daylight-bar {
  width: 100%;
  height: 6px;
  background: rgba(255,255,255,0.18);
  border-radius: 3px;
  position: relative;
  overflow: visible;
}
.daylight-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FF8C00, #FF6347);
  border-radius: 3px;
  transition: width 1s ease;
}
.daylight-dot {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  transition: left 1s ease;
}
</style>
