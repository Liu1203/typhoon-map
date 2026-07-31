<script setup lang="ts">
import { computed } from "vue"
import type { ForecastDay } from "@/api/weather"

const props = defineProps<{
  forecast: ForecastDay[]
}>()

const data = computed(() => {
  return props.forecast.map(f => ({
    day: f.day,
    pct: f.precip ? Math.min(parseFloat(f.precip) * 10, 100) : 0,
    label: f.precip || "0mm",
  }))
})

function barHeight(pct: number): string {
  return Math.max(pct, 4) + "%"
}
</script>

<template>
  <view class="precip-card" v-if="data.length > 0">
    <view class="section-header">
      <view class="section-decor" />
      <text class="section-title">降水趋势</text>
    </view>
    <view class="precip-chart">
      <view v-for="(d, i) in data" :key="i" class="precip-col">
        <text class="precip-pct" v-if="d.pct > 0">{{ d.pct }}%</text>
        <text class="precip-pct" v-else>--</text>
        <view class="precip-bar-wrap">
          <view class="precip-bar" :style="{ height: barHeight(d.pct) }" :class="{ dry: d.pct === 0 }" />
        </view>
        <text class="precip-label">{{ d.label }}</text>
        <text class="precip-day">{{ d.day }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.precip-card {
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
.precip-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  gap: var(--spacing-sm);
  height: 120px;
  padding-top: var(--spacing-lg);
}
.precip-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}
.precip-pct {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin-bottom: 4px;
}
.precip-bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}
.precip-bar {
  width: 8px;
  border-radius: 4px 4px 0 0;
  background: linear-gradient(180deg, #5B8FC0, #8BB8E0);
  min-height: 4px;
  transition: height .3s ease;
}
.precip-bar.dry {
  background: var(--color-ash);
  opacity: .35;
  height: 4px !important;
}
.precip-label {
  font-size: 10px;
  color: var(--color-ash);
  margin-top: 4px;
  font-weight: var(--font-weight-medium);
}
.precip-day {
  font-size: 10px;
  color: var(--color-ash);
  margin-top: 2px;
  font-weight: var(--font-weight-medium);
}
</style>
<style>
.dark-mode .precip-card {
  background: rgba(30,36,48,0.85) !important;
  border-color: rgba(255,255,255,0.08) !important;
}
.dark-mode .precip-bar { opacity: .8; }
.dark-mode .precip-bar.dry { opacity: .25; }
</style>