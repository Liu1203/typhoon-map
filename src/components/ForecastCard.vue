<script setup lang="ts">
import WeatherIcon from "./WeatherIcon.vue"
import HourlyScroll from "./HourlyScroll.vue"
import type { ForecastDay, HourlyItem } from "@/api/weather"

defineProps<{
  forecast: ForecastDay[]
  forecastHourlys: Record<number, HourlyItem[]>
  expandedIndex: number
}>()

const emit = defineEmits<{
  toggle: [idx: number]
}>()
</script>

<template>
  <view class="card forecast anim-fade-in-up" style="animation-delay: 0.2s" v-if="forecast.length > 0">
    <view class="section-header">
      <view class="section-decor" />
      <text class="section-title">未来天气</text>
    </view>
    <view class="forecast-list">
      <view v-for="(f, i) in forecast" :key="f.day">
        <view class="forecast-item" :class="{ expanded: expandedIndex === i }" @tap="emit('toggle', i)">
          <text class="forecast-day">{{ f.day }}</text>
          <view class="forecast-icon-wrap">
            <WeatherIcon :weather="f.weather" :size="26" />
          </view>
          <text class="forecast-weather">{{ f.weather }}</text>
          <view class="forecast-temps">
            <text class="forecast-high">{{ f.high }}°</text>
            <text class="forecast-low">{{ f.low }}°</text>
          </view>
          <text class="forecast-expand">{{ expandedIndex === i ? '▲' : '▼' }}</text>
        </view>
        <view v-if="expandedIndex === i" class="forecast-hourly-wrap">
          <view v-if="!forecastHourlys[i]" class="forecast-hourly-loading">
            <text>加载中...</text>
          </view>
          <HourlyScroll v-else-if="forecastHourlys[i].length > 0" :hourly="forecastHourlys[i]" :sunrise="'06:00'" :sunset="'18:00'" />
          <text v-else class="forecast-hourly-empty">暂无逐时数据</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.card {
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-lg);
  box-shadow: 0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03);
  margin-bottom: var(--spacing-md);
  border: 1px solid rgba(255,255,255,0.6);
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
.forecast-list {
  display: flex;
  flex-direction: column;
}
.forecast-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-paper-border);
  transition: background var(--transition-fast);
}
.forecast-item.expanded {
  background: var(--color-paper);
  margin: 0 calc(-1 * var(--spacing-lg));
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
}
.forecast-item:last-child { border-bottom: none; }
.forecast-day {
  width: 44px;
  font-size: var(--font-size-sm);
  color: var(--color-ink-soft);
  font-weight: var(--font-weight-medium);
}
.forecast-icon-wrap {
  width: 48px;
  display: flex;
  justify-content: center;
}
.forecast-weather {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--color-ink-soft);
}
.forecast-temps {
  display: flex;
  gap: var(--spacing-sm);
  min-width: 70px;
  justify-content: flex-end;
}
.forecast-high {
  font-size: var(--font-size-md);
  color: var(--color-ink);
  font-weight: var(--font-weight-semibold);
}
.forecast-low {
  font-size: var(--font-size-md);
  color: var(--color-ink-light);
}
.forecast-expand {
  font-size: var(--font-size-xs);
  color: var(--color-ash);
  width: 20px;
  text-align: center;
}
.forecast-hourly-wrap {
  padding: var(--spacing-sm) 0 var(--spacing-md);
  border-bottom: 1px solid var(--color-paper-border);
}
.forecast-hourly-loading, .forecast-hourly-empty {
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
  text-align: center;
  padding: var(--spacing-md) 0;
}
</style>
