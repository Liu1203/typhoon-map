<script setup lang="ts">
import { computed } from "vue"
import type { ForecastDay } from "@/api/weather"

const props = defineProps<{
  forecast: ForecastDay[]
}>()

const data = computed(() => {
  if (!props.forecast.length) return { items: [], min: 0, max: 0, range: 1 }
  let min = Infinity, max = -Infinity
  const items = props.forecast.map(f => {
    const lo = parseFloat(f.low) || 0
    const hi = parseFloat(f.high) || 0
    if (lo < min) min = lo
    if (hi > max) max = hi
    return { day: f.day, low: lo, high: hi }
  })
  const pad = Math.max((max - min) * 0.15 || 3, 3)
  const rMin = Math.floor(min - pad)
  const rMax = Math.ceil(max + pad)
  return { items, min: rMin, max: rMax, range: rMax - rMin || 1 }
})
</script>

<template>
  <view class="trend-card" v-if="data.items.length > 0">
    <view class="section-header">
      <view class="section-decor" />
      <text class="section-title">温度趋势</text>
    </view>
    <view class="trend-chart">
      <view v-for="(d, i) in data.items" :key="i" class="trend-col">
        <text class="trend-high">{{ d.high }}°</text>
        <view class="trend-bar-wrap">
          <view class="trend-bar" :style="{
            top: ((data.max - d.high) / data.range) * 100 + '%',
            height: ((d.high - d.low) / data.range) * 100 + '%',
          }" />
        </view>
        <text class="trend-low">{{ d.low }}°</text>
        <text class="trend-day">{{ d.day }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.trend-card {
  background: var(--color-paper);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--color-paper-border);
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
.trend-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  gap: var(--spacing-sm);
  height: 140px;
  padding-top: var(--spacing-xl);
}
.trend-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  position: relative;
}
.trend-high {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-ink);
  margin-bottom: 2px;
}
.trend-bar-wrap {
  flex: 1;
  width: 100%;
  position: relative;
  display: flex;
  justify-content: center;
}
.trend-bar {
  width: 8px;
  border-radius: 4px;
  background: linear-gradient(180deg, var(--color-gold), var(--color-primary));
  position: absolute;
  min-height: 4px;
  transition: all 0.3s ease;
}
.trend-low {
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  color: var(--color-ink-light);
  margin-top: 2px;
}
.trend-day {
  font-size: 10px;
  color: var(--color-ash);
  margin-top: var(--spacing-xs);
  font-weight: var(--font-weight-medium);
}

</style>
<style>
.dark-mode .trend-card {
  background: rgba(30,36,48,0.85) !important;
  border-color: rgba(255,255,255,0.08) !important;
}
.dark-mode .trend-high { color: #E0E6ED; }
.dark-mode .trend-low { color: #8896A6; }
.dark-mode .trend-day { color: #4A5464; }
</style>
