<script setup lang="ts">
import { computed } from "vue"
import WeatherIcon from "./WeatherIcon.vue"
import { windArrow, hourLabel, hourNum, sunHour } from "@/utils/weather"
import type { HourlyItem } from "@/api/weather"

const props = withDefaults(defineProps<{
  hourly: HourlyItem[]
  sunrise?: string
  sunset?: string
}>(), {
  sunrise: "06:00",
  sunset: "18:00",
})

const nowHour = new Date().getHours()
</script>

<template>
  <view class="hourly-scroll-wrap">
    <scroll-view scroll-x class="hourly-scroll" :show-scrollbar="false">
      <view class="hourly-list">
        <view v-for="(h, i) in hourly" :key="i" class="hourly-item" :class="{ 'is-sun': sunrise && sunHour(sunrise) === hourNum(h.time), 'is-dusk': sunset && sunHour(sunset) === hourNum(h.time), 'is-now': hourNum(h.time) === nowHour }">
          <text class="hourly-time">{{ hourNum(h.time) === nowHour ? '现在' : hourLabel(h.time) }}</text>
          <WeatherIcon :weather="h.weather" :size="26" />
          <text class="hourly-temp">{{ h.temp }}°</text>
          <text class="hourly-desc">{{ h.weather }}</text>
          <text class="hourly-wind">{{ windArrow(h.windDir) }} {{ h.windScale }}</text>
          <view :class="['rain-tag', parseInt(h.rainChance) > 30 ? 'rain-heavy' : parseInt(h.rainChance) > 0 ? 'rain-light' : 'rain-none']">
            <text>{{ parseInt(h.rainChance) > 0 ? h.rainChance + '%' : '无雨' }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
    <view class="scroll-fade-right" />
  </view>
</template>

<style scoped>
.hourly-scroll-wrap {
  position: relative;
}
.scroll-fade-right {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 40px;
  background: linear-gradient(90deg, transparent, rgba(251,247,240,0.95));
  pointer-events: none;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}
.hourly-scroll { white-space: nowrap; }
.hourly-list {
  display: flex;
  gap: var(--spacing-sm);
  padding-right: 36px;
}
.hourly-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 68px;
  padding: var(--spacing-sm) 6px;
  border-radius: var(--radius-md);
  background: var(--color-paper);
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}
.hourly-item.is-sun {
  background: rgba(212,168,83,0.12);
  border-color: rgba(212,168,83,0.25);
}
.hourly-item.is-dusk {
  background: rgba(139,109,175,0.08);
  border-color: rgba(139,109,175,0.2);
}
.hourly-item.is-now {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.hourly-item.is-now .hourly-time,
.hourly-item.is-now .hourly-temp,
.hourly-item.is-now .hourly-desc,
.hourly-item.is-now .hourly-wind,
.hourly-item.is-now .rain-tag {
  color: #fff;
}
.hourly-time {
  position: relative;
  z-index: 1;
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  font-weight: var(--font-weight-semibold);
}
.hourly-temp {
  position: relative;
  z-index: 1;
  font-size: var(--font-size-md);
  color: var(--color-ink);
  font-weight: var(--font-weight-semibold);
}
.hourly-desc {
  position: relative;
  z-index: 1;
  font-size: 10px;
  color: var(--color-ink-soft);
  text-align: center;
  white-space: normal;
  max-width: 56px;
}
.hourly-wind {
  position: relative;
  z-index: 1;
  font-size: 10px;
  color: var(--color-ash);
}
.rain-tag {
  position: relative;
  z-index: 1;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
}
.rain-heavy { background: rgba(91,140,122,0.12); color: var(--color-jade); }
.rain-light { background: rgba(91,140,122,0.06); color: var(--color-jade-light); }
.rain-none { color: var(--color-ash); }
</style>
