<script setup lang="ts">
import { computed } from "vue"
import Icon from "./Icon.vue"
import type { MinutelyPoint } from "@/api/weather"

const props = defineProps<{ minutely: MinutelyPoint[] }>()

const maxPrecip = computed(() => Math.max(0.1, ...props.minutely.map(p => p.precip)))
const hasRain = computed(() => props.minutely.some(p => p.precip > 0))

const summary = computed(() => {
  const arr = props.minutely
  if (!arr.length) return "暂无分钟级数据"
  if (!hasRain.value) return "未来 2 小时无降雨"
  if (arr[0].precip > 0) {
    const stopIdx = arr.findIndex(p => p.precip <= 0)
    if (stopIdx < 0) return "降雨将持续 2 小时以上"
    return "当前有雨，约 " + stopIdx * 15 + " 分钟后转停"
  }
  const startIdx = arr.findIndex(p => p.precip > 0)
  return "约 " + startIdx * 15 + " 分钟后开始下雨"
})

function barH(p: MinutelyPoint): string {
  const h = Math.round((p.precip / maxPrecip.value) * 40)
  return Math.max(p.precip > 0 ? 4 : 2, h) + "px"
}
</script>

<template>
  <view class="card nowcast-card anim-fade-in-up" style="animation-delay: 0.24s" v-if="minutely.length > 0">
    <view class="section-header">
      <view class="section-decor" />
      <text class="section-title">未来 2 小时降雨</text>
    </view>
    <view class="nowcast-summary">
      <view class="nowcast-icon"><Icon :name="hasRain ? 'cloud-rain' : 'sun'" :size="18" :color="hasRain ? '#5B8FC0' : '#D4A550'" /></view>
      <text class="nowcast-text">{{ summary }}</text>
    </view>
    <view class="nowcast-chart">
      <view v-for="(p, i) in minutely" :key="i" class="nowcast-col">
        <view class="nowcast-bar" :class="{ active: p.precip > 0 }" :style="{ height: barH(p) }" />
        <text class="nowcast-time">{{ i % 2 === 0 ? p.time : '' }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.nowcast-summary {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}
.nowcast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
.nowcast-text {
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  font-weight: var(--font-weight-medium);
}
.nowcast-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 4px;
  height: 56px;
}
.nowcast-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  gap: 2px;
}
.nowcast-bar {
  width: 100%;
  max-width: 14px;
  border-radius: 3px 3px 0 0;
  background: rgba(91,143,192,0.25);
  transition: height 0.3s ease;
}
.nowcast-bar.active {
  background: linear-gradient(180deg, #6BA3D4, #5B8FC0);
}
.nowcast-time {
  font-size: 9px;
  color: var(--color-ash);
  height: 11px;
  line-height: 11px;
  white-space: nowrap;
}
</style>
