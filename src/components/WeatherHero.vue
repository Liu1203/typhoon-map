<script setup lang="ts">
import { computed } from "vue"
import WeatherIcon from "./WeatherIcon.vue"

const props = defineProps<{
  temp: string
  feelsLike: string
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
  const pad = (n: number) => String(n).padStart(2, "0")
  const today = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate())
  const rise = new Date(`${today}T${props.sunrise}:00`).getTime()
  const set = new Date(`${today}T${props.sunset}:00`).getTime()
  const current = now.getTime()
  if (current < rise) return 0
  if (current > set) return 100
  return ((current - rise) / (set - rise)) * 100
})

const arcAngle = computed(() => (daylightPct.value / 100) * 180 - 90)
const nowTime = computed(() => {
  const d = new Date()
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0")
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
    <text class="feels-like" v-if="feelsLike && feelsLike !== '--'">体感 {{ feelsLike }}°</text>
    <view class="temp-range-row">
      <text class="temp-high">↑ {{ high }}°</text>
      <view class="temp-divider" />
      <text class="temp-low">↓ {{ low }}°</text>
    </view>
    <view class="daylight-row" v-if="sunrise && sunrise !== '--'">
      <text class="daylight-label">{{ sunrise }}</text>
      <view class="sun-arc">
        <view class="arc-guide"></view>
        <view class="sun-orbit" :style="{ transform: 'rotate(' + arcAngle + 'deg) translateY(-40px)' }">
          <view class="sun-dot"></view>
        </view>
        <view class="arc-now">{{ nowTime }}</view>
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
.feels-like {
  font-size: var(--font-size-sm);
  color: rgba(255,255,255,0.65);
  font-weight: var(--font-weight-medium);
  text-align: center;
  margin-bottom: var(--spacing-sm);
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
.sun-arc {
  position: relative;
  flex: 1;
  height: 46px;
}
.arc-guide {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 80px;
  height: 40px;
  margin-left: -40px;
  border: 2px solid rgba(255,255,255,0.22);
  border-bottom: none;
  border-radius: 40px 40px 0 0;
}
.sun-orbit {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 0;
  height: 0;
  transform-origin: 0 0;
  transition: transform 1s ease;
}
.sun-dot {
  position: absolute;
  left: 0;
  top: 0;
  width: 14px;
  height: 14px;
  margin-left: -7px;
  margin-top: -7px;
  border-radius: 50%;
  background: #FFD54F;
  box-shadow: 0 0 14px rgba(255,213,79,0.9), 0 1px 4px rgba(0,0,0,0.3);
}
.arc-now {
  position: absolute;
  bottom: -14px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: rgba(255,255,255,0.75);
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
}
</style>
