<script setup lang="ts">
import { computed } from "vue"
import Icon from "./Icon.vue"
import type { CurrentWeather } from "@/api/weather"
import { heatIndexC, windChillC } from "@/utils/weather"
import { UI } from "@/config"

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
  const temp = parseFloat(w.temp)
  const heatIdx = heatIndexC(temp, parseFloat(w.humidity))
  const chill = windChillC(temp, windSpeed)
  const eff = temp > 10 && heatIdx > feels ? heatIdx : (temp <= 10 && chill < feels ? chill : feels)

  const r: Tip[] = []

  if (maxRainPct >= 50) {
    r.push({ icon: "umbrella", label: "雨伞", level: "高", tip: "未来" + Math.min(rainChances.length, 6) + "小时可能降雨，记得带伞" })
  } else if (maxRainPct >= 20) {
    r.push({ icon: "umbrella", label: "雨伞", level: "中", tip: "可能有雨，建议备伞" })
  } else {
    r.push({ icon: "umbrella", label: "雨伞", level: "低", tip: "无需带伞" })
  }

  if (uv >= UI.UV_WARN) {
    r.push({ icon: "shield", label: "防晒", level: "高", tip: "紫外线强烈，注意防护" })
  } else if (uv >= 5) {
    r.push({ icon: "shield", label: "防晒", level: "中", tip: "紫外线中等，适当防护" })
  } else {
    r.push({ icon: "shield", label: "防晒", level: "低", tip: "无需防护" })
  }

  if (eff <= -10) {
    r.push({ icon: "shirt", label: "穿衣", level: "极寒", tip: "羽绒服+围巾手套" })
  } else if (eff <= 0) {
    r.push({ icon: "shirt", label: "穿衣", level: "寒冷", tip: "棉服/羽绒服" })
  } else if (eff <= 10) {
    r.push({ icon: "shirt", label: "穿衣", level: "较冷", tip: "外套/夹克" })
  } else if (eff <= 20) {
    r.push({ icon: "shirt", label: "穿衣", level: "舒适", tip: "长袖单衣" })
  } else if (eff <= 30) {
    r.push({ icon: "shirt", label: "穿衣", level: "温暖", tip: "短袖/薄衫" })
  } else {
    r.push({ icon: "shirt", label: "穿衣", level: "炎热", tip: "短袖短裤" })
  }

  if (isRainy) {
    r.push({ icon: "activity", label: "运动", level: "不宜", tip: "建议室内运动" })
  } else if (windSpeed >= 6) {
    r.push({ icon: "activity", label: "运动", level: "谨慎", tip: "风力较大，建议室内" })
  } else if (heatIdx >= 35) {
    r.push({ icon: "activity", label: "运动", level: "谨慎", tip: "体感炎热，谨防中暑" })
  } else if (feels >= 15 && feels <= 28) {
    r.push({ icon: "activity", label: "运动", level: "适宜", tip: "适合户外运动" })
  } else {
    r.push({ icon: "activity", label: "运动", level: "一般", tip: "适度运动，注意保暖" })
  }

  if (maxRainPct >= 50) {
    r.push({ icon: "sun", label: "晾晒", level: "不宜", tip: "有降雨，不宜户外晾晒" })
  } else if (maxRainPct >= 20) {
    r.push({ icon: "sun", label: "晾晒", level: "一般", tip: "可能有雨，建议室内晾晒" })
  } else {
    r.push({ icon: "sun", label: "晾晒", level: "适宜", tip: "适合户外晾晒" })
  }

  if (aqiVal > 80) {
    r.push({ icon: "leaf", label: "空气", level: "污染", tip: "建议佩戴口罩" })
  } else if (aqiVal > 60) {
    r.push({ icon: "leaf", label: "空气", level: "一般", tip: "敏感人群注意减少外出" })
  } else if (aqiVal > 20) {
    r.push({ icon: "leaf", label: "空气", level: "良好", tip: "空气状况较好" })
  } else {
    r.push({ icon: "leaf", label: "空气", level: "优", tip: "空气清新" })
  }

  if (isRainy || maxRainPct >= 40) {
    r.push({ icon: "car", label: "洗车", level: "不宜", tip: "近期有雨，洗车易脏" })
  } else if (maxRainPct >= 20) {
    r.push({ icon: "car", label: "洗车", level: "一般", tip: "可能有雨，谨慎洗车" })
  } else {
    r.push({ icon: "car", label: "洗车", level: "适宜", tip: "天气较好，适合洗车" })
  }

  if (w.weather.includes("雷")) {
    r.push({ icon: "fish", label: "钓鱼", level: "不宜", tip: "雷雨天气，禁止垂钓" })
  } else if (windSpeed >= 8) {
    r.push({ icon: "fish", label: "钓鱼", level: "不宜", tip: "风力过大，不宜垂钓" })
  } else if (isRainy || windSpeed >= 5) {
    r.push({ icon: "fish", label: "钓鱼", level: "一般", tip: "天气一般，收获可能有限" })
  } else {
    r.push({ icon: "fish", label: "钓鱼", level: "适宜", tip: "风平浪静，适合垂钓" })
  }

  const dayRange = Math.abs(parseFloat(w.high) - parseFloat(w.low))
  if (eff <= 5 || dayRange >= 12) {
    r.push({ icon: "thermometer", label: "感冒", level: "易发", tip: "气温低或温差大，注意保暖" })
  } else if (eff <= 15 || dayRange >= 8) {
    r.push({ icon: "thermometer", label: "感冒", level: "较易发", tip: "适时增减衣物" })
  } else {
    r.push({ icon: "thermometer", label: "感冒", level: "少发", tip: "气温适宜，感冒风险低" })
  }

  return r
})
</script>

<template>
  <view class="card life-card anim-fade-in-up" style="animation-delay: 0.2s">
    <view class="section-header">
      <view class="section-decor" />
      <text class="section-title">生活指数</text>
    </view>
    <view class="life-grid">
      <view class="life-item" v-for="t in tips" :key="t.label">
        <view class="life-icon"><Icon :name="t.icon" :size="24" color="#C99A3E" /></view>
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent-soft, rgba(201,154,62,0.14));
  margin-bottom: 4px;
}

.life-label {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  font-weight: var(--font-weight-medium);
}

.life-level {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--accent, var(--color-primary));
  background: var(--accent-soft, rgba(201,154,62,0.14));
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