<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue"
import type { HourlyItem } from "@/api/weather"

const props = defineProps<{ hourly: HourlyItem[] }>()

const canvasId = "hourlyTrendCanvas"
const width = ref(Math.floor((uni.getSystemInfoSync().windowWidth || 360) - 64))
const HEIGHT = 120

const chartData = computed(() => {
  const arr = props.hourly.slice(0, 24)
  const vals: number[] = []
  arr.forEach(h => {
    const t = parseFloat(h.temp)
    const f = parseFloat(h.feelsLike || "")
    if (!isNaN(t)) vals.push(t)
    if (!isNaN(f)) vals.push(f)
  })
  if (!vals.length) return null
  const minT = Math.min(...vals)
  const maxT = Math.max(...vals)
  const range = Math.max(maxT - minT, 2)
  return { arr, minT, maxT, range }
})

const minLabel = computed(() => chartData.value ? chartData.value.minT.toFixed(0) : "--")
const maxLabel = computed(() => chartData.value ? chartData.value.maxT.toFixed(0) : "--")

const timeLabels = computed(() => {
  if (!chartData.value) return []
  const out: string[] = []
  chartData.value.arr.forEach((h, i) => { if (i % 4 === 0) out.push(h.time.replace(":00", "")) })
  return out
})

function draw() {
  if (!chartData.value) return
  const { arr, minT, maxT, range } = chartData.value
  const W = width.value, H = HEIGHT
  const ctx = uni.createCanvasContext(canvasId)
  ctx.clearRect(0, 0, W, H)

  const padX = 10, padT = 8, padB = 8
  const chartH = H - padT - padB
  const n = arr.length
  const step = n > 1 ? (W - padX * 2) / (n - 1) : 0
  const yOf = (t: number) => padT + chartH - ((t - minT + 1) / (range + 2)) * chartH

  // 湿度柱（浅绿，从底部向上）
  arr.forEach((h, i) => {
    const hum = parseFloat(h.humidity || "")
    if (isNaN(hum) || hum <= 0) return
    const x = padX + i * step
    const bh = (Math.min(hum, 100) / 100) * chartH * 0.6
    ctx.setFillStyle("rgba(109,175,152,0.28)")
    ctx.fillRect(x - 2, H - padB - bh, 4, bh)
  })

  // 降雨概率（蓝色小点标记）
  arr.forEach((h, i) => {
    const rain = parseInt(h.rainChance) || 0
    if (rain <= 0) return
    const x = padX + i * step
    ctx.setFillStyle("rgba(91,143,192,0.5)")
    ctx.beginPath()
    ctx.arc(x, H - padB + 2, 2, 0, Math.PI * 2)
    ctx.fill()
  })

  const pts = arr.map((h, i) => {
    const t = parseFloat(h.temp)
    return { x: padX + i * step, y: isNaN(t) ? null : yOf(t) }
  }).filter(p => p.y != null) as { x: number; y: number }[]

  const fpts = arr.map((h, i) => {
    const f = parseFloat(h.feelsLike || "")
    return { x: padX + i * step, y: isNaN(f) ? null : yOf(f) }
  }).filter(p => p.y != null) as { x: number; y: number }[]

  // 体感温度（橙色虚线）
  if (fpts.length >= 2) {
    ctx.beginPath()
    fpts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.setStrokeStyle("#E09050")
    ctx.setLineWidth(1.5)
    ctx.setLineDash([4, 4], 0)
    ctx.stroke()
    ctx.setLineDash([], 0)
  }

  // 温度面积渐变
  if (pts.length >= 2) {
    ctx.beginPath()
    ctx.moveTo(pts[0].x, H - padB)
    pts.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(pts[pts.length - 1].x, H - padB)
    ctx.closePath()
    const g = ctx.createLinearGradient(0, padT, 0, H - padB)
    g.addColorStop(0, "rgba(91,143,192,0.35)")
    g.addColorStop(1, "rgba(91,143,192,0.02)")
    ctx.setFillStyle(g)
    ctx.fill()

    // 温度折线
    ctx.beginPath()
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.setStrokeStyle("#5B8FC0")
    ctx.setLineWidth(2)
    ctx.setLineJoin("round")
    ctx.stroke()

    // 节点
    pts.forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
      ctx.setFillStyle("#5B8FC0")
      ctx.fill()
    })
  }

  ctx.draw()
}

watch(chartData, () => nextTick(() => draw()))
watch(width, () => nextTick(() => draw()))
setTimeout(() => nextTick(() => draw()), 60)
</script>

<template>
  <view class="hourly-trend">
    <view class="trend-head">
      <text class="trend-title">未来 24 小时趋势</text>
      <view class="trend-legend">
        <text class="legend-dot" />
        <text class="legend-text">温度</text>
        <view class="legend-line" />
        <text class="legend-text">体感</text>
        <view class="legend-hum" />
        <text class="legend-text">湿度</text>
      </view>
    </view>
    <view class="chart-wrap">
      <text class="axis-label top">{{ maxLabel }}°</text>
      <text class="axis-label bottom">{{ minLabel }}°</text>
      <canvas :canvas-id="canvasId" :id="canvasId" class="trend-canvas" :style="{ width: width + 'px', height: HEIGHT + 'px' }"></canvas>
    </view>
    <view class="time-row">
      <text v-for="(t, i) in timeLabels" :key="i" class="time-label">{{ t }}</text>
    </view>
  </view>
</template>

<style scoped>
.hourly-trend {
  margin-bottom: var(--spacing-lg);
}
.trend-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}
.trend-title {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  font-weight: var(--font-weight-semibold);
}
.trend-legend {
  display: flex;
  align-items: center;
  gap: 4px;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5B8FC0;
}
.legend-line {
  width: 12px;
  height: 0;
  border-top: 1.5px dashed #E09050;
  margin-left: 6px;
}
.legend-hum {
  width: 4px;
  height: 10px;
  border-radius: 1px;
  background: rgba(109,175,152,0.45);
  margin-left: 6px;
}
.legend-text {
  font-size: 9px;
  color: var(--color-ash);
}
.chart-wrap {
  position: relative;
}
.trend-canvas {
  display: block;
}
.axis-label {
  position: absolute;
  right: 2px;
  font-size: 9px;
  color: var(--color-ash);
  z-index: 2;
}
.axis-label.top { top: 0; }
.axis-label.bottom { bottom: 4px; }
.time-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 6px 0;
}
.time-label {
  font-size: 9px;
  color: var(--color-ash);
}
</style>
