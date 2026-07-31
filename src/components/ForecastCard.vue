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
          <view class="daily-summary" v-if="f.sunrise || f.precip">
            <view class="daily-chip" v-if="f.sunrise">
              <text class="chip-label">日出</text>
              <text class="chip-value">{{ f.sunrise }}</text>
            </view>
            <view class="daily-chip" v-if="f.sunset">
              <text class="chip-label">日落</text>
              <text class="chip-value">{{ f.sunset }}</text>
            </view>
            <view class="daily-chip" v-if="f.uvMax">
              <text class="chip-label">紫外线</text>
              <text class="chip-value">{{ f.uvMax }}</text>
            </view>
            <view class="daily-chip" v-if="f.precip">
              <text class="chip-label">降水</text>
              <text class="chip-value">{{ f.precip }}</text>
            </view>
          </view>
          <view v-if="!forecastHourlys[i]" class="forecast-hourly-loading">
            <text>加载中...</text>
          </view>
          <HourlyScroll v-else-if="forecastHourlys[i].length > 0" :hourly="forecastHourlys[i]" :sunrise="f.sunrise || '06:00'" :sunset="f.sunset || '18:00'" />
          <text v-else class="forecast-hourly-empty">暂无逐时数据</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.card {
  background: rgba(255,255,255,0.92);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-lg);
  box-shadow: 0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03);
  margin-bottom: var(--spacing-md);
  border: 1px solid rgba(255,255,255,0.6);
  transform: translateZ(0);
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
.daily-summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}
.daily-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--color-cloud);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs) var(--spacing-md);
  min-width: 56px;
}
.chip-label {
  font-size: 10px;
  color: var(--color-ink-light);
  font-weight: var(--font-weight-medium);
}
.chip-value {
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  font-weight: var(--font-weight-semibold);
}
.forecast-hourly-loading, .forecast-hourly-empty {
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
  text-align: center;
  padding: var(--spacing-md) 0;
}
</style>
