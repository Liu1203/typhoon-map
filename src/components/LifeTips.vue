<script setup lang="ts">
import { computed } from "vue"
import type { CurrentWeather } from "@/api/weather"

const props = defineProps<{
  weather: CurrentWeather
}>()

interface Tip {
  icon: string
  label: string
  level: string
  tip: string
}

const tips = computed((): Tip[] => {
  const w = props.weather
  const feels = parseFloat(w.feelsLike)
  const uv = parseFloat(w.uvIndex)
  const aqiVal = parseInt(w.aqi)
  const rainChances = (w.hourly || []).map(h => parseInt(h.rainChance))
  const maxRainPct = Math.max(...rainChances, 0)
  const isRainy = w.weather.includes("雨") || w.weather.includes("雷") || maxRainPct > 30
  const windSpeed = parseFloat(w.windScale)

  const r: Tip[] = []

  if (maxRainPct >= 50) {
    r.push({ icon: "☔", label: "雨伞", level: "高", tip: "未来" + Math.min(rainChances.length, 6) + "小时可能降雨，记得带伞" })
  } else if (maxRainPct >= 20) {
    r.push({ icon: "🌂", label: "雨伞", level: "中", tip: "可能有雨，建议备伞" })
  } else {
    r.push({ icon: "🌤", label: "雨伞", level: "低", tip: "无需带伞" })
  }

  if (uv >= 7) {
    r.push({ icon: "🧴", label: "防晒", level: "高", tip: "紫外线强烈，注意防护" })
  } else if (uv >= 5) {
    r.push({ icon: "🕶", label: "防晒", level: "中", tip: "紫外线中等，适当防护" })
  } else {
    r.push({ icon: "🌿", label: "防晒", level: "低", tip: "无需防护" })
  }

  if (feels <= -10) {
    r.push({ icon: "🧣", label: "穿衣", level: "极寒", tip: "羽绒服+围巾手套" })
  } else if (feels <= 0) {
    r.push({ icon: "🧥", label: "穿衣", level: "寒冷", tip: "棉服/羽绒服" })
  } else if (feels <= 10) {
    r.push({ icon: "🧥", label: "穿衣", level: "较冷", tip: "外套/夹克" })
  } else if (feels <= 20) {
    r.push({ icon: "👕", label: "穿衣", level: "舒适", tip: "长袖单衣" })
  } else if (feels <= 30) {
    r.push({ icon: "👕", label: "穿衣", level: "温暖", tip: "短袖/薄衫" })
  } else {
    r.push({ icon: "🩳", label: "穿衣", level: "炎热", tip: "短袖短裤" })
  }

  if (isRainy) {
    r.push({ icon: "🏠", label: "运动", level: "不宜", tip: "建议室内运动" })
  } else if (windSpeed >= 6) {
    r.push({ icon: "🏋️", label: "运动", level: "谨慎", tip: "风力较大，建议室内" })
  } else if (feels >= 35) {
    r.push({ icon: "🏊", label: "运动", level: "谨慎", tip: "注意防暑降温" })
  } else if (feels >= 15 && feels <= 28) {
    r.push({ icon: "🏃", label: "运动", level: "适宜", tip: "适合户外运动" })
  } else {
    r.push({ icon: "🧘", label: "运动", level: "一般", tip: "适度运动，注意保暖" })
  }

  if (maxRainPct >= 50) {
    r.push({ icon: "👚", label: "晾晒", level: "不宜", tip: "有降雨，不宜户外晾晒" })
  } else if (maxRainPct >= 20) {
    r.push({ icon: "👚", label: "晾晒", level: "一般", tip: "可能有雨，建议室内晾晒" })
  } else {
    r.push({ icon: "👚", label: "晾晒", level: "适宜", tip: "适合户外晾晒" })
  }

  if (aqiVal > 80) {
    r.push({ icon: "😷", label: "空气", level: "污染", tip: "建议佩戴口罩" })
  } else if (aqiVal > 60) {
    r.push({ icon: "🌫", label: "空气", level: "一般", tip: "敏感人群注意减少外出" })
  } else if (aqiVal > 20) {
    r.push({ icon: "🌿", label: "空气", level: "良好", tip: "空气状况较好" })
  } else {
    r.push({ icon: "🌿", label: "空气", level: "优", tip: "空气清新" })
  }

  return r
})
</script>

<template>
  <view class="card life-card anim-fade-in-up" style="animation-delay: 0.2s">
    <view class="section-header">
      <view class="section-decor" />
      <text class="section-title">🌂 生活指数</text>
    </view>
    <view class="life-grid">
      <view class="life-item" v-for="t in tips" :key="t.label">
        <text class="life-icon">{{ t.icon }}</text>
        <text class="life-label">{{ t.label }}</text>
        <text class="life-level">{{ t.level }}</text>
        <text class="life-tip">{{ t.tip }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.life-card {
  margin-bottom: var(--spacing-md);
}

.life-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.life-item {
  background: rgba(255,255,255,0.6);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-xs);
  text-align: center;
  border: 1px solid rgba(255,255,255,0.8);
  min-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 2px;
}

.life-icon {
  font-size: 22px;
  line-height: 1.2;
  margin-bottom: 2px;
}

.life-label {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  font-weight: var(--font-weight-medium);
}

.life-level {
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  background: rgba(254, 192, 7, 0.15);
  padding: 0 8px;
  border-radius: 10px;
  line-height: 1.6;
}

.life-tip {
  font-size: 10px;
  color: var(--color-ink-light);
  margin-top: 2px;
  line-height: 1.3;
}

</style>
<style>
.dark-mode .life-item {
  background: rgba(255,255,255,0.08) !important;
  border-color: rgba(255,255,255,0.06) !important;
}
</style>