<script setup lang="ts">
import WeatherIcon from "./WeatherIcon.vue"

defineProps<{
  temp: string
  weather: string
  high: string
  low: string
  accentColor: string
}>()
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
  </view>
</template>

<style scoped>
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
</style>
