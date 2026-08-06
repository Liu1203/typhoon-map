<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, getCurrentInstance } from "vue"
import type { HourlyItem } from "@/api/weather"

const props = defineProps<{ hourly: HourlyItem[] }>()

const canvasId = "hourlyTrendCanvas"
const width = ref(Math.floor((uni.getSystemInfoSync().windowWidth || 360) - 64))
const HEIGHT = 120
const PADX = 10, PADT = 8, PADB = 8
const chartH = HEIGHT - PADT - PADB

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

const step = computed(() => {
  const n = chartData.value?.arr.length || 0
  return n > 1 ? (width.value - PADX * 2) / (n - 1) : 0
})

function yOf(t: number): number {
  if (!chartData.value) return 0
  const { minT, range } = chartData.value
  return PADT + chartH - ((t - minT + 1) / (range + 2)) * chartH
}

const minLabel = computed(() => chartData.value ? chartData.value.minT.toFixed(0) : "--")
const maxLabel = computed(() => chartData.value ? chartData.value.maxT.toFixed(0) : "--")

const timeLabels = computed(() => {
  if (!chartData.value) return []
  const out: string[] = []
  chartData.value.arr.forEach((h, i) => { if (i % 4 === 0) out.push(h.time.replace(":00", "")) })
  return out
})

/* ===== 节点选择（点击 / 拖拽滑动）===== */
const selectedIndex = ref(-1)
const rectLeft = ref(0)
let touchStartX = 0
let touchMoved = false
let prevSelected = -1
let startIdx = -1

const selectedItem = computed(() => {
  if (selectedIndex.value < 0 || !chartData.value) return null
  return chartData.value.arr[selectedIndex.value] || null
})

const tipStyle = computed(() => {
  if (selectedIndex.value < 0 || !selectedItem.value) return {}
  const idx = selectedIndex.value
  const x = PADX + idx * step.value
  const tipW = 108
  const left = Math.max(2, Math.min(width.value - tipW - 2, x - tipW / 2))
  const t = parseFloat(selectedItem.value.temp)
  let top = yOf(isNaN(t) ? 0 : t) - 96
  if (top < 2) top = yOf(isNaN(t) ? 0 : t) + 14
  return { left: left + "px", top: top + "px" }
})

function getX(e: any): number {
  const t = (e && e.touches && e.touches[0]) || (e && e.changedTouches && e.changedTouches[0])
  if (t && typeof t.clientX === "number") return t.clientX - rectLeft.value
  if (e && e.detail && typeof e.detail.x === "number") return e.detail.x
  if (t && typeof t.pageX === "number") return t.pageX - rectLeft.value
  return 0
}

function indexFromX(x: number): number {
  const n = chartData.value?.arr.length || 0
  if (n <= 0 || step.value <= 0) return -1
  return Math.max(0, Math.min(n - 1, Math.round((x - PADX) / step.value)))
}

function onTouchStart(e: any) {
  const x = getX(e)
  touchStartX = x
  touchMoved = false
  prevSelected = selectedIndex.value
  startIdx = indexFromX(x)
  if (startIdx >= 0) selectedIndex.value = startIdx
}

function onTouchMove(e: any) {
  const x = getX(e)
  if (Math.abs(x - touchStartX) > 6) touchMoved = true
  const idx = indexFromX(x)
  if (idx >= 0) selectedIndex.value = idx
}

function onTouchEnd() {
  if (touchMoved) return
  if (startIdx === prevSelected) selectedIndex.value = -1
}

/* ===== 绘制 ===== */
function draw() {
  if (!chartData.value) return
  const { arr, minT, range } = chartData.value
  const W = width.value, H = HEIGHT
  const ctx = uni.createCanvasContext(canvasId)
  ctx.clearRect(0, 0, W, H)
  const s = step.value

  // 湿度柱（浅绿，从底部向上）
  arr.forEach((h, i) => {
    const hum = parseFloat(h.humidity || "")
    if (isNaN(hum) || hum <= 0) return
    const x = PADX + i * s
    const bh = (Math.min(hum, 100) / 100) * chartH * 0.6
    ctx.setFillStyle("rgba(109,175,152,0.28)")
    ctx.fillRect(x - 2, H - PADB - bh, 4, bh)
  })

  // 降雨概率（蓝色小点标记）
  arr.forEach((h, i) => {
    const rain = parseInt(h.rainChance) || 0
    if (rain <= 0) return
    const x = PADX + i * s
    ctx.setFillStyle("rgba(91,143,192,0.5)")
    ctx.beginPath()
    ctx.arc(x, H - PADB + 2, 2, 0, Math.PI * 2)
    ctx.fill()
  })

  const pts = arr.map((h, i) => {
    const t = parseFloat(h.temp)
    return { x: PADX + i * s, y: isNaN(t) ? null : yOf(t) }
  }).filter(p => p.y != null) as { x: number; y: number }[]

  const fpts = arr.map((h, i) => {
    const f = parseFloat(h.feelsLike || "")
    return { x: PADX + i * s, y: isNaN(f) ? null : yOf(f) }
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
    ctx.moveTo(pts[0].x, H - PADB)
    pts.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(pts[pts.length - 1].x, H - PADB)
    ctx.closePath()
    const g = ctx.createLinearGradient(0, PADT, 0, H - PADB)
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

  // 选中高亮：参考线 + 圆环
  const sel = selectedIndex.value
  if (sel >= 0 && sel < arr.length) {
    const x = PADX + sel * s
    ctx.setStrokeStyle("rgba(91,143,192,0.3)")
    ctx.setLineWidth(1)
    ctx.setLineDash([3, 4], 0)
    ctx.beginPath()
    ctx.moveTo(x, PADT)
    ctx.lineTo(x, H - PADB)
    ctx.stroke()
    ctx.setLineDash([], 0)
    const t = parseFloat(arr[sel].temp)
    if (!isNaN(t)) {
      const y = yOf(t)
      ctx.beginPath()
      ctx.arc(x, y, 7, 0, Math.PI * 2)
      ctx.setStrokeStyle("#5B8FC0")
      ctx.setLineWidth(2)
      ctx.stroke()
    }
  }

  ctx.draw()
}

watch(chartData, () => { selectedIndex.value = -1; nextTick(() => draw()) })
watch(width, () => nextTick(() => draw()))
watch(selectedIndex, () => nextTick(() => draw()))

onMounted(() => {
  setTimeout(() => {
    nextTick(() => draw())
    try {
      uni.createSelectorQuery().in(getCurrentInstance()).select(".chart-wrap").boundingClientRect((r: any) => {
        if (r && typeof r.left === "number") rectLeft.value = r.left
      }).exec()
    } catch {}
  }, 60)
})
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
    <view class="chart-wrap" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchEnd">
      <text class="axis-label top">{{ maxLabel }}°</text>
      <text class="axis-label bottom">{{ minLabel }}°</text>
      <canvas :canvas-id="canvasId" :id="canvasId" class="trend-canvas" :style="{ width: width + 'px', height: HEIGHT + 'px' }"></canvas>
      <view
        v-if="selectedItem"
        class="node-tip"
        :style="tipStyle"
        @touchstart.stop
        @touchmove.stop
        @touchend.stop
        @touchcancel.stop
      >
        <view class="tip-close" @tap.stop="selectedIndex = -1">✕</view>
        <view class="tip-time">{{ selectedItem.time }}</view>
        <view class="tip-row"><text class="tip-k">温度</text><text class="tip-v">{{ selectedItem.temp }}°</text></view>
        <view class="tip-row" v-if="selectedItem.feelsLike"><text class="tip-k">体感</text><text class="tip-v">{{ selectedItem.feelsLike }}°</text></view>
        <view class="tip-row" v-if="selectedItem.humidity"><text class="tip-k">湿度</text><text class="tip-v">{{ selectedItem.humidity }}%</text></view>
        <view class="tip-row" v-if="selectedItem.cloud"><text class="tip-k">云量</text><text class="tip-v">{{ selectedItem.cloud }}%</text></view>
        <view class="tip-row"><text class="tip-k">降水</text><text class="tip-v">{{ parseInt(selectedItem.rainChance) > 0 ? selectedItem.rainChance + '%' : '无' }}</text></view>
        <view class="tip-row"><text class="tip-k">风力</text><text class="tip-v">{{ selectedItem.windDir }} {{ selectedItem.windScale }}</text></view>
        <view class="tip-row" v-if="selectedItem.precip"><text class="tip-k">雨量</text><text class="tip-v">{{ selectedItem.precip }}mm</text></view>
      </view>
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
.node-tip {
  position: absolute;
  width: 108px;
  padding: 8px 10px;
  background: rgba(255,255,255,0.97);
  border-radius: 10px;
  box-shadow: 0 4px 18px rgba(0,0,0,0.15);
  z-index: 5;
}
.tip-close {
  position: absolute;
  top: 2px;
  right: 6px;
  font-size: 12px;
  color: var(--color-ash);
  padding: 2px;
}
.tip-time {
  font-size: 12px;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: 4px;
}
.tip-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  padding: 1.5px 0;
}
.tip-k {
  font-size: 10px;
  color: var(--color-ash);
}
.tip-v {
  font-size: 11px;
  color: var(--color-ink);
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
}
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
<style>
.dark-mode .node-tip {
  background: rgba(30,36,48,0.97) !important;
}
.dark-mode .tip-time { color: #6B9FD0 !important; }
.dark-mode .tip-k { color: #6A7A8A !important; }
.dark-mode .tip-v { color: #E0E6ED !important; }
.dark-mode .tip-close { color: #6A7A8A !important; }
</style>
