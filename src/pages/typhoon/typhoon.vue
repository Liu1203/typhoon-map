<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { getActiveTyphoons, getHistoricalTyphoons, getYearList, getTyphoonDetail, type TyphoonItem, type TyphoonDetail, type TyphoonPoint } from "@/api/typhoon"

type TabMode = "active" | "history"

const typhoons = ref<TyphoonItem[]>([])
const selected = ref<TyphoonItem | null>(null)
const detail = ref<TyphoonDetail | null>(null)
const loading = ref(true)
const fetching = ref(false)

const tabMode = ref<TabMode>("active")
const yearList = ref<number[]>([])
const selectedYear = ref<number>(new Date().getFullYear() - 1)
const historyLoading = ref(false)

const center = ref({ lat: 20, lng: 130 })
const scale = ref(4)
const nodeInterval = ref<number>(6)
const currentScale = ref<number>(4)

const selectedPoint = ref<{ point: TyphoonPoint; type: "history" | "forecast" } | null>(null)

function timeDiffHours(a: any, b: any): number {
  if (typeof a === "string" && a.length === 12 && typeof b === "string" && b.length === 12) {
    const aDate = new Date(Date.UTC(+a.slice(0, 4), +a.slice(4, 6) - 1, +a.slice(6, 8), +a.slice(8, 10), +a.slice(10, 12)))
    const bDate = new Date(Date.UTC(+b.slice(0, 4), +b.slice(4, 6) - 1, +b.slice(6, 8), +b.slice(8, 10), +b.slice(10, 12)))
    return (aDate.getTime() - bDate.getTime()) / 3600000
  }
  const an = Number(a)
  const bn = Number(b)
  if (!isFinite(an) || !isFinite(bn)) return 0
  return an - bn
}

function sampleNodes(points: TyphoonPoint[], intervalHours: number): number[] {
  if (points.length === 0) return []
  if (points.length === 1) return [0]
  const result: number[] = [0, points.length - 1]
  let lastTime = points[0].time
  let lastGrade = points[0].grade
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i]
    if (p.grade !== lastGrade) {
      result.push(i)
      lastGrade = p.grade
      lastTime = p.time
      continue
    }
    if (timeDiffHours(p.time, lastTime) >= intervalHours) {
      result.push(i)
      lastTime = p.time
    }
  }
  return Array.from(new Set(result)).sort((a, b) => a - b)
}

function autoIntervalByScale(s: number): number {
  if (s >= 14) return 1
  if (s >= 10) return 3
  if (s >= 7) return 6
  return 12
}

function formatTime(t: any): string {
  if (t === null || t === undefined || t === "") return ""
  const s = String(t).trim()
  if (!s) return ""
  if (s.length >= 10) return `${s.slice(0, 4)}/${s.slice(4, 6)}/${s.slice(6, 8)} ${s.slice(8, 10)}:00`
  if (s.length === 8) return `${s.slice(0, 4)}/${s.slice(4, 6)}/${s.slice(6, 8)}`
  return s
}

function onMapMarkerTap(e: any) {
  const id = e.detail.markerId
  let pt: TyphoonPoint | undefined
  if (id === 1) {
    pt = currentPos.value ?? undefined
    if (pt) selectedPoint.value = { point: pt, type: "history" }
  } else if (id >= 100 && id < 200) {
    pt = detail.value?.history[id - 100]
    if (pt) selectedPoint.value = { point: pt, type: "history" }
  } else if (id >= 200) {
    pt = detail.value?.forecast[id - 200]
    if (pt) selectedPoint.value = { point: pt, type: "forecast" }
  }
}

function onMapScaleChanged(e: any) {
  currentScale.value = e.detail.scale
  nodeInterval.value = autoIntervalByScale(e.detail.scale)
}

onMounted(async () => {
  yearList.value = getYearList()
  selectedYear.value = yearList.value[0] || new Date().getFullYear() - 1
  await loadActive()
})

async function loadActive() {
  loading.value = true
  typhoons.value = await getActiveTyphoons()
  if (typhoons.value.length > 0) {
    await select(typhoons.value[0])
  }
  loading.value = false
}

async function loadHistory(year: number) {
  historyLoading.value = true
  typhoons.value = []
  selected.value = null
  detail.value = null
  try {
    const list = await getHistoricalTyphoons(year)
    typhoons.value = list
    if (list.length > 0) {
      await select(list[0])
    }
  } catch {
    typhoons.value = []
  }
  historyLoading.value = false
}

async function switchTab(mode: TabMode) {
  if (mode === tabMode.value) return
  tabMode.value = mode
  selected.value = null
  detail.value = null
  listExpanded.value = true
  if (mode === "active") {
    await loadActive()
  } else {
    await loadHistory(selectedYear.value)
  }
}

async function onYearChange(year: number) {
  selectedYear.value = year
  await loadHistory(year)
}

async function select(t: TyphoonItem) {
  selected.value = t
  detail.value = null
  fetching.value = true
  detail.value = await getTyphoonDetail(t.id)
  fetching.value = false
  listExpanded.value = false
  if (detail.value) {
    fitMap()
  }
}

function fitMap() {
  const d = detail.value
  const pos = currentPos.value
  if (!d || !pos) return
  center.value = { lat: pos.lat, lng: pos.lon }
  const all = [...d.history, ...d.forecast]
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
  for (const p of all) {
    if (p.lat < minLat) minLat = p.lat
    if (p.lat > maxLat) maxLat = p.lat
    if (p.lon < minLng) minLng = p.lon
    if (p.lon > maxLng) maxLng = p.lon
  }
  const maxSpan = Math.max(maxLat - minLat, maxLng - minLng)
  let s = 3
  if (maxSpan < 5) s = 8
  else if (maxSpan < 10) s = 7
  else if (maxSpan < 20) s = 6
  else if (maxSpan < 40) s = 5
  else if (maxSpan < 80) s = 4
  scale.value = s
  currentScale.value = s
  nodeInterval.value = autoIntervalByScale(s)
}

const GRADE_COLORS: Record<string, string> = {
  "TD": "#66BB6A", "TS": "#FFCA28", "STS": "#FF9800",
  "TY": "#EF5350", "STY": "#AB47BC", "SuperTY": "#EC407A",
}

function gradeColor(g: string): string {
  return GRADE_COLORS[g] || "#90A4AE"
}

const currentPos = computed(() => {
  if (!detail.value || detail.value.history.length === 0) return null
  return detail.value.history[detail.value.history.length - 1]
})

const mapMarkers = computed(() => {
  if (!detail.value || !currentPos.value) return []
  const pos = currentPos.value
  const result: any[] = []

  result.push({
    id: 1,
    latitude: pos.lat,
    longitude: pos.lon,
    iconPath: `/static/typhoon-${pos.grade}.png`,
    width: 40,
    height: 40,
    anchor: { x: 0.5, y: 0.5 },
    callout: { content: `${pos.gradeText}  ${pos.windSpeed}m/s`, display: 'BYCLICK' },
  })

  const histIdx = sampleNodes(detail.value.history, nodeInterval.value)
  for (const i of histIdx) {
    if (i === detail.value.history.length - 1) continue
    const p = detail.value.history[i]
    result.push({
      id: 100 + i,
      latitude: p.lat,
      longitude: p.lon,
      iconPath: `/static/dot-${p.grade}.png`,
      width: 24,
      height: 24,
      anchor: { x: 0.5, y: 0.5 },
      callout: { content: `${formatTime(p.time)} ${p.gradeText}  ${p.windSpeed}m/s`, display: 'BYCLICK' },
    })
  }

  const fcIdx = sampleNodes(detail.value.forecast, nodeInterval.value)
  for (const i of fcIdx) {
    const p = detail.value.forecast[i]
    result.push({
      id: 200 + i,
      latitude: p.lat,
      longitude: p.lon,
      iconPath: `/static/dot-${p.grade}.png`,
      width: 24,
      height: 24,
      anchor: { x: 0.5, y: 0.5 },
      callout: { content: `${formatTime(p.time)} ${p.gradeText}  ${p.windSpeed}m/s`, display: 'BYCLICK' },
    })
  }

  return result
})

const polylines = computed(() => {
  if (!detail.value) return []
  const lines: any[] = []
  const hist = detail.value.history
  const fc = detail.value.forecast

  function addSegs(pts: TyphoonPoint[], dotted: boolean) {
    if (pts.length < 2) return
    let start = 0
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].grade !== pts[i - 1].grade || i === pts.length - 1) {
        const segPts = pts.slice(start, i + 1).map(p => ({ latitude: p.lat, longitude: p.lon }))
        lines.push({
          points: segPts,
          color: gradeColor(pts[start].grade),
          width: 7,
          ...(dotted ? { dottedLine: true } : {}),
        })
        start = i
      }
    }
  }

  addSegs(hist, false)

  if (hist.length > 0 && fc.length > 0) {
    const last = hist[hist.length - 1]
    lines.push({
      points: [
        { latitude: last.lat, longitude: last.lon },
        { latitude: fc[0].lat, longitude: fc[0].lon },
      ],
      color: gradeColor(last.grade),
      width: 7,
      dottedLine: true,
    })
  }

  addSegs(fc, true)

  return lines
})

const info = computed(() => {
  if (!detail.value || !currentPos.value) return null
  const pos = currentPos.value
  return {
    nameCn: detail.value.nameCn,
    tcNum: detail.value.tcNum,
    gradeText: pos.gradeText,
    windSpeed: pos.windSpeed,
    pressure: pos.pressure,
    lat: pos.lat.toFixed(1),
    lon: pos.lon.toFixed(1),
  }
})

const typhoonListVisible = computed(() => typhoons.value.length > 0)
const showEmptyOverlay = computed(() => !loading.value && !historyLoading.value && typhoons.value.length === 0)
const listExpanded = ref(true)
</script>

<template>
  <view class="page">
    <view class="bar">
      <view class="tab-row">
        <view :class="['tab', tabMode === 'active' && 'tab-active']" @tap="switchTab('active')">
          <text>活跃台风</text>
        </view>
        <view :class="['tab', tabMode === 'history' && 'tab-active']" @tap="switchTab('history')">
          <text>历史台风</text>
        </view>
      </view>

      <view v-if="tabMode === 'history'" class="year-row">
        <picker mode="selector" :range="yearList" @change="(e: any) => onYearChange(yearList[e.detail.value])">
          <view class="year-picker">
            <text>{{ selectedYear }} 年</text>
            <text class="year-arrow">&#9660;</text>
          </view>
        </picker>
      </view>

      <view v-if="selected && !listExpanded" class="selected-bar" @tap="listExpanded = true">
        <view class="selected-bar-left">
          <text class="selected-bar-name">{{ selected.nameCn }}（{{ selected.tcNum }}）</text>
          <text class="selected-bar-info" v-if="info">{{ info.gradeText }} &middot; {{ info.windSpeed }}m/s &middot; {{ info.pressure }}hPa</text>
        </view>
        <text class="selected-bar-expand">展开列表 &#9662;</text>
      </view>

      <view v-if="typhoonListVisible && listExpanded" class="tag-row">
        <view
          v-for="t in typhoons" :key="t.id"
          :class="['tag', t.id === selected?.id && 'active']"
          @tap="select(t)"
        >
          <text class="tag-name">{{ t.nameCn }}</text>
          <text class="tag-num">{{ t.tcNum }}</text>
        </view>
      </view>

      <view v-else-if="loading || historyLoading" class="loading-hint">
        <text>{{ tabMode === 'active' ? '正在获取活跃台风...' : '正在获取 ' + selectedYear + ' 年台风...' }}</text>
      </view>
    </view>

    <view class="map-container">
      <map
        id="myMap"
        :latitude="center.lat"
        :longitude="center.lng"
        :scale="scale"
        :markers="mapMarkers"
        :polyline="polylines"
        @markertap="onMapMarkerTap"
        @callouttap="onMapMarkerTap"
        @scalechanged="onMapScaleChanged"
        enable-zoom
        enable-scroll
        enable-rotate
        style="width:100%;height:100%"
      />

      <view v-if="showEmptyOverlay" class="map-message">
        <view class="map-message-card">
          <text class="map-message-icon">🌀</text>
          <text class="map-message-text" v-if="tabMode === 'active'">暂无可追踪台风</text>
          <text class="map-message-text" v-else>{{ selectedYear }} 年暂无台风记录</text>
          <view v-if="tabMode === 'active'" class="map-message-btn" @tap.stop="switchTab('history')">
            <text>查看历史台风</text>
          </view>
          <view v-else class="map-message-btn" @tap.stop="switchTab('active')">
            <text>返回活跃台风</text>
          </view>
        </view>
      </view>

      <view v-if="fetching" class="map-loading-overlay">
        <view class="loading-spinner" />
        <text>加载中...</text>
      </view>
    </view>

    <view v-if="selectedPoint" class="info-card" @tap="selectedPoint = null">
      <view class="info-row">
        <text class="info-name">{{ formatTime(selectedPoint.point.time) }}</text>
        <view :class="['info-grade-tag', 'grade-' + selectedPoint.point.grade]">{{ selectedPoint.point.gradeText }}</view>
      </view>
      <view class="info-row">
        <view class="info-stat">
          <text class="info-stat-label">风速</text>
          <text class="info-stat-value">{{ selectedPoint.point.windSpeed }} m/s</text>
        </view>
        <view class="info-stat">
          <text class="info-stat-label">气压</text>
          <text class="info-stat-value">{{ selectedPoint.point.pressure }} hPa</text>
        </view>
      </view>
      <view class="info-row">
        <text class="info-coord">{{ selectedPoint.point.lat.toFixed(1) }}&deg;N {{ selectedPoint.point.lon.toFixed(1) }}&deg;E</text>
        <view :class="['info-type-badge', selectedPoint.type === 'forecast' ? 'type-forecast' : 'type-history']">
          <text>{{ selectedPoint.type === 'history' ? '实况' : '预报' }}</text>
        </view>
      </view>
    </view>

  </view>
</template>

<style scoped>
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.bar {
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-paper);
  border-bottom: 1px solid var(--color-paper-border);
  flex-shrink: 0;
}

.tab-row {
  display: flex;
  gap: 0;
  border-radius: var(--radius-md);
  background: var(--color-paper-dark);
  padding: 3px;
  margin-bottom: var(--spacing-sm);
}

.tab {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.tab-active {
  background: var(--color-paper);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  box-shadow: var(--shadow-xs);
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.selected-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
}

.selected-bar-left {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.selected-bar-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.selected-bar-info {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
}

.selected-bar-expand {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
}

.year-row {
  margin-bottom: var(--spacing-sm);
}

.year-picker {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-lg);
  background: var(--color-paper-dark);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-ink);
}

.year-arrow {
  font-size: 10px;
  color: var(--color-ash);
}

.loading-hint {
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
  padding: var(--spacing-xs) 0;
}

.tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-xl);
  border-radius: var(--radius-lg);
  background: var(--color-paper-dark);
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}

.tag.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(192,57,43,0.25);
}

.tag-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.tag-num {
  font-size: var(--font-size-xs);
  opacity: 0.7;
  margin-top: 1px;
}

.tag.active .tag-num {
  opacity: 0.85;
}

.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #1a1a2e;
}

.map-message {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.map-message-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-3xl) var(--spacing-4xl);
  background: rgba(255,255,255,0.95);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
}

.map-message-icon {
  font-size: 40px;
}

.map-message-text {
  font-size: var(--font-size-md);
  color: var(--color-ink-soft);
  pointer-events: none;
}

.map-message-btn {
  padding: var(--spacing-sm) var(--spacing-2xl);
  background: var(--color-primary);
  border-radius: var(--radius-full);
  color: #fff;
  font-size: var(--font-size-sm);
  pointer-events: auto;
  box-shadow: var(--shadow-sm);
}

.map-loading-overlay {
  position: absolute;
  z-index: 3;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(4px);
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-paper-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.info-card {
  background: var(--color-paper);
  padding: var(--spacing-md) var(--spacing-xl);
  border-top: 1px solid var(--color-paper-border);
  flex-shrink: 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-ink-soft);
}

.info-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-ink);
}

.info-stat {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.info-stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-ash);
}

.info-stat-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-ink);
}

.info-coord {
  font-size: var(--font-size-sm);
  color: var(--color-ink-soft);
}

.info-type-badge {
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.type-history { background: var(--color-jade); color: #fff; }
.type-forecast { background: var(--color-gold); color: #fff; }

.info-grade-tag {
  padding: 2px 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  color: #fff;
  font-weight: var(--font-weight-medium);
}

.grade-TD { background: #66BB6A; }
.grade-TS { background: #FFCA28; color: #333; }
.grade-STS { background: #FF9800; }
.grade-TY { background: #EF5350; }
.grade-STY { background: #AB47BC; }
.grade-SuperTY { background: #EC407A; }
</style>
