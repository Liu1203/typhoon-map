<script setup lang="ts">
import { computed } from "vue"
import type { CurrentWeather } from "@/api/weather"

const props = defineProps<{ weather: CurrentWeather }>()

const info = computed(() => {
  const a = props.weather.aqiDetail
  if (!a) return null
  const v = a.aqi
  const conf = v <= 20
    ? { color: "#5BAA6A", bg: "rgba(91,170,106,0.15)", advice: "空气清新，适合户外活动" }
    : v <= 40
    ? { color: "#8FC77B", bg: "rgba(143,199,123,0.15)", advice: "空气可接受，极少数敏感人群需注意" }
    : v <= 60
    ? { color: "#E8B84A", bg: "rgba(232,184,74,0.15)", advice: "敏感人群应减少长时间户外活动" }
    : v <= 80
    ? { color: "#F09050", bg: "rgba(240,144,80,0.15)", advice: "建议减少户外活动，必要时佩戴口罩" }
    : v <= 100
    ? { color: "#E5606E", bg: "rgba(229,96,110,0.15)", advice: "避免户外活动，关好门窗" }
    : { color: "#A565B8", bg: "rgba(165,101,184,0.15)", advice: "避免外出，建议开启空气净化器" }
  return {
    v, label: a.label, ...conf,
    pollutants: [
      { name: "PM2.5", val: a.pm25 },
      { name: "PM10", val: a.pm10 },
      { name: "NO₂", val: a.no2 },
      { name: "O₃", val: a.o3 },
      { name: "SO₂", val: a.so2 },
    ].filter(p => p.val != null),
    hourly: (a.hourly || []).slice(-24),
    pollen: a.pollen
      ? { level: a.pollen.level, top: a.pollen.top, real: true }
      : a.aqi >= 80
        ? { level: "较高", real: false }
        : a.aqi >= 60
          ? { level: "中等", real: false }
          : { level: "较低", real: false },
    forecast: a.forecast || [],
  }
})

const pollenAdvice = computed(() => {
  const p = info.value?.pollen
  if (!p) return ""
  if (p.real) {
    if (p.level === "很高") return "花粉浓度高，过敏人群避免外出"
    if (p.level === "较高") return "花粉较多，建议佩戴口罩"
    if (p.level === "中等") return "花粉中等，敏感人群注意防护"
    return "花粉较少，可放心外出"
  }
  if (p.level === "较高") return "空气污染较重，敏感人群减少外出"
  if (p.level === "中等") return "空气一般，敏感人群注意防护"
  return "空气良好，当前无花粉浓度数据"
})

const dayName = computed(() => ["今天", "明天", "后天"])

const barPct = computed(() => {
  if (!info.value) return 0
  return Math.min(100, (info.value.v / 100) * 100)
})

function aqiColor(v: number): string {
  if (v <= 20) return "#5BAA6A"
  if (v <= 40) return "#8FC77B"
  if (v <= 60) return "#E8B84A"
  if (v <= 80) return "#F09050"
  if (v <= 100) return "#E5606E"
  return "#A565B8"
}

function barHeight(v: number): number {
  return Math.max(3, Math.min(64, (v / 120) * 64))
}

const trendTimes = computed(() => {
  if (!info.value?.hourly?.length) return []
  const step = Math.max(4, Math.ceil(info.value.hourly.length / 6))
  return info.value.hourly.filter((_, i) => i % step === 0).map(p => p.time)
})
</script>

<template>
  <view v-if="info" class="aqi-card card anim-fade-in-up" style="animation-delay: 0.2s">
    <view class="aqi-head">
      <view class="section-header" style="margin-bottom: 0">
        <view class="section-decor" />
        <text class="section-title">空气质量</text>
      </view>
      <view class="aqi-badge" :style="{ background: info.color, color: '#fff' }">{{ info.label }}</view>
    </view>

    <view class="aqi-main">
      <text class="aqi-num" :style="{ color: info.color }">{{ info.v }}</text>
      <text class="aqi-unit">AQI</text>
      <view class="aqi-bar-wrap">
        <view class="aqi-bar" :style="{ width: barPct + '%', background: info.color }" />
      </view>
      <text class="aqi-advice">{{ info.advice }}</text>
    </view>

    <view class="aqi-pois" v-if="info.pollutants.length">
      <view v-for="p in info.pollutants" :key="p.name" class="aqi-po">
        <text class="po-name">{{ p.name }}</text>
        <text class="po-val">{{ p.val }}</text>
      </view>
    </view>

    <view class="pollen-row" v-if="info.pollen">
      <text class="pollen-icon">🌸</text>
      <view class="pollen-info">
        <text class="pollen-title">{{ info.pollen.real ? '花粉过敏：' + info.pollen.level : '过敏提示：' + info.pollen.level }}<text v-if="info.pollen.real && info.pollen.top" class="pollen-top">（{{ info.pollen.top }} 为主）</text></text>
        <text class="pollen-advice">{{ pollenAdvice }}</text>
      </view>
    </view>

    <view class="aqi-forecast" v-if="info.forecast.length">
      <view class="fc-item" v-for="(f, i) in info.forecast" :key="i">
        <text class="fc-day">{{ dayName[i] || f.date }}</text>
        <text class="fc-num" :style="{ color: aqiColor(f.aqi) }">{{ f.aqi }}</text>
        <text class="fc-label" :style="{ color: aqiColor(f.aqi) }">{{ f.label }}</text>
      </view>
    </view>

    <view class="aqi-trend" v-if="info.hourly.length">
      <view class="trend-label-row">
        <text class="trend-label">今日 24h 空气质量</text>
      </view>
      <view class="aqi-bars">
        <view v-for="(p, i) in info.hourly" :key="i" class="aqi-bar-col" :style="{ height: barHeight(p.aqi) + 'px' }">
          <view class="aqi-bar" :style="{ background: aqiColor(p.aqi) }" />
        </view>
      </view>
      <view class="aqi-times">
        <text v-for="(t, i) in trendTimes" :key="i" class="aqi-time">{{ t }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.aqi-card {
  background: rgba(255,255,255,0.92);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  border: 1px solid rgba(255,255,255,0.6);
}
.aqi-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}
.aqi-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 3px 12px;
  border-radius: var(--radius-full);
}
.aqi-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: var(--spacing-md);
}
.aqi-num {
  font-size: 44px;
  font-weight: var(--font-weight-bold);
  line-height: 1;
}
.aqi-unit {
  font-size: 10px;
  color: var(--color-ash);
  letter-spacing: 0.2em;
}
.aqi-bar-wrap {
  width: 100%;
  height: 6px;
  background: var(--color-bg);
  border-radius: 3px;
  overflow: hidden;
}
.aqi-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}
.aqi-advice {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
}
.aqi-pois {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  justify-content: center;
}
.aqi-po {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  min-width: 56px;
}
.po-name {
  font-size: 10px;
  color: var(--color-ash);
}
.po-val {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-ink);
}
.pollen-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: var(--spacing-md);
  padding: 10px 12px;
  background: rgba(232,184,74,0.1);
  border-radius: var(--radius-md);
}
.pollen-icon { font-size: 18px; }
.pollen-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.pollen-title {
  font-size: var(--font-size-xs);
  color: var(--color-ink);
  font-weight: var(--font-weight-semibold);
}
.pollen-top { color: var(--color-ash); font-weight: normal; }
.pollen-advice {
  font-size: 10px;
  color: var(--color-ink-light);
}
.aqi-forecast {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}
.fc-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
}
.fc-day {
  font-size: 10px;
  color: var(--color-ash);
}
.fc-num {
  font-size: 20px;
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
}
.fc-label {
  font-size: 10px;
  font-weight: var(--font-weight-medium);
}
.aqi-trend {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-paper-border);
}
.trend-label-row {
  margin-bottom: var(--spacing-sm);
}
.trend-label {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  font-weight: var(--font-weight-semibold);
}
.aqi-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 66px;
  overflow: hidden;
}
.aqi-bar-col {
  flex: 1;
  display: flex;
  align-items: flex-end;
  min-width: 0;
}
.aqi-bar {
  width: 100%;
  border-radius: 2px 2px 0 0;
  min-height: 3px;
}
.aqi-times {
  display: flex;
  justify-content: space-between;
  padding: 2px 2px 0;
  overflow: hidden;
}
.aqi-time {
  font-size: 8px;
  color: var(--color-ash);
}
</style>
