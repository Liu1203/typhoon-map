<script setup lang="ts">
import { computed } from "vue"
import type { CurrentWeather } from "@/api/weather"
import { stargazingScore, moonPhaseInfo, moonIllumination } from "@/utils/astronomy"
import { moonPhase as localMoonPhase } from "@/utils/weather"

const props = defineProps<{ weather: CurrentWeather }>()

function nightData() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const td = new Date(now.getTime() + 86400000)
  const tomorrow = `${td.getFullYear()}-${pad(td.getMonth() + 1)}-${pad(td.getDate())}`
  const clouds: number[] = []
  const humidity: number[] = []
  const pick = (dateStr: string, hours: number[]) => {
    const arr = props.weather.hourlyByDate?.[dateStr] || []
    for (const h of arr) {
      const hh = parseInt(h.time)
      if (hours.includes(hh)) {
        const c = parseFloat(h.cloud || "")
        const hu = parseFloat(h.humidity || "")
        if (!isNaN(c)) clouds.push(c)
        if (!isNaN(hu)) humidity.push(hu)
      }
    }
  }
  pick(today, [20, 21, 22, 23])
  pick(tomorrow, [0, 1, 2])
  return { clouds, humidity }
}

const moonPhase = computed(() => {
  if (props.weather.moonPhase != null) return props.weather.moonPhase
  return localMoonPhase().phase === "满月" ? 0.5 : 0
})

const moonInfo = computed(() => moonPhaseInfo(moonPhase.value))
const illum = computed(() => moonIllumination(moonPhase.value))

const score = computed(() => {
  const n = nightData()
  const wind = parseFloat(props.weather.windScale) || 0
  return stargazingScore({
    clouds: n.clouds.length ? n.clouds : [60],
    humidity: n.humidity.length ? n.humidity : [70],
    windKmh: wind,
    visibilityKm: parseFloat(props.weather.visibility) || undefined,
    moonPhase: moonPhase.value,
  })
})
</script>

<template>
  <view class="card stargazing-card anim-fade-in-up" style="animation-delay: 0.22s">
    <view class="section-header">
      <view class="section-decor" />
      <text class="section-title">🌙 今晚观星指数</text>
      <text class="card-arrow">›</text>
    </view>
    <view class="star-main">
      <view class="star-score">
        <text class="score-num" :style="{ color: score.score >= 60 ? '#6B9FD0' : score.score >= 40 ? '#D4A550' : '#E5606E' }">{{ score.score }}</text>
        <text class="score-unit">分</text>
        <text class="score-level">{{ score.level }}</text>
      </view>
      <view class="star-moon">
        <text class="moon-big">{{ moonInfo.icon }}</text>
        <text class="moon-name">{{ moonInfo.name }} {{ illum }}%</text>
        <text class="moon-times">月出 {{ weather.moonrise || '--' }} · 月落 {{ weather.moonset || '--' }}</text>
      </view>
    </view>
    <text class="star-advice">{{ score.advice }}</text>
  </view>
</template>

<style scoped>
.stargazing-card {
  background: rgba(255,255,255,0.92);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  border: 1px solid rgba(255,255,255,0.6);
}
.card-arrow {
  margin-left: auto;
  font-size: 20px;
  color: var(--color-ash);
  font-weight: var(--font-weight-light);
}
.star-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}
.star-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}
.score-num {
  font-size: 52px;
  font-weight: var(--font-weight-bold);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.score-unit {
  font-size: 11px;
  color: var(--color-ash);
  margin-top: 2px;
}
.score-level {
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin-top: 4px;
  padding: 2px 10px;
  background: rgba(91,143,192,0.1);
  border-radius: 999px;
}
.star-moon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
}
.moon-big {
  font-size: 40px;
  line-height: 1.1;
}
.moon-name {
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  font-weight: var(--font-weight-semibold);
}
.moon-times {
  font-size: 10px;
  color: var(--color-ash);
}
.star-advice {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-paper-border);
  line-height: 1.5;
}
</style>
