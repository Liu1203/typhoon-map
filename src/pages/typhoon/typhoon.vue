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

function displayName(t: TyphoonItem): string {
  return t.nameCn || t.nameEn || t.tcNum || "未知"
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
  "TD": "#5DADE2", "TS": "#F4D03F", "STS": "#E67E22",
  "TY": "#E74C3C", "STY": "#8E44AD", "SuperTY": "#FF1493",
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function gradeColor(g: string): string {
  return GRADE_COLORS[g] || "#90A4AE"
}

const currentPos = computed(() => {
  if (!detail.value || detail.value.history.length === 0) return null
  return detail.value.history[detail.value.history.length - 1]
})

const pulseCircles = computed(() => {
  if (!currentPos.value || !detail.value) return []
  const p = currentPos.value
  const color = gradeColor(p.grade)
  return [
    { latitude: p.lat, longitude: p.lon, radius: 30, color: hexToRgba(color, 0.35), fillColor: hexToRgba(color, 0.08), strokeWidth: 2 },
    { latitude: p.lat, longitude: p.lon, radius: 18, color: hexToRgba(color, 0.5), fillColor: hexToRgba(color, 0.15), strokeWidth: 3 },
  ]
})

const mapMarkers = computed(() => {
  if (!detail.value || !currentPos.value) return []
  const pos = currentPos.value
  const result: any[] = []

  result.push({
    id: 1,
    latitude: pos.lat,
    longitude: pos.lon,
    iconPath: `/static/typhoon-marker-${pos.grade}.png`,
    width: 56,
    height: 56,
    anchor: { x: 0.5, y: 0.5 },
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
      width: 32,
      height: 32,
      anchor: { x: 0.5, y: 0.5 },
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
      width: 32,
      height: 32,
      anchor: { x: 0.5, y: 0.5 },
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
      const gradeChange = pts[i].grade !== pts[i - 1].grade
      const dateLineCross = Math.abs(pts[i].lon - pts[i - 1].lon) > 180
      if (gradeChange || dateLineCross || i === pts.length - 1) {
        if (i > start) {
          const segPts = pts.slice(start, i + 1).filter(p => p.lat !== 0 || p.lon !== 0).map(p => ({ latitude: p.lat, longitude: p.lon }))
          if (segPts.length >= 2) {
            const color = gradeColor(pts[start].grade)
            lines.push({ points: segPts, color: hexToRgba(color, 0.25), width: 14, ...(dotted ? { dottedLine: true } : {}) })
            lines.push({ points: segPts, color: color, width: 6, ...(dotted ? { dottedLine: true } : {}) })
          }
        }
        start = i
      }
    }
  }

  addSegs(hist, false)

  if (hist.length > 0 && fc.length > 0) {
    const last = hist[hist.length - 1]
    const first = fc[0]
    const connColor = gradeColor(last.grade)
    // 过滤无效坐标，跳过跨日界线的长连线
    if (!(first.lat === 0 && first.lon === 0) && Math.abs(last.lon - first.lon) <= 180) {
      lines.push({
        points: [{ latitude: last.lat, longitude: last.lon }, { latitude: first.lat, longitude: first.lon }],
        color: hexToRgba(connColor, 0.25),
        width: 14,
        dottedLine: true,
      })
      lines.push({
        points: [{ latitude: last.lat, longitude: last.lon }, { latitude: first.lat, longitude: first.lon }],
        color: connColor,
        width: 6,
        dottedLine: true,
      })
    }
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
    <view class="top-bar">
      <view class="tab-row">
        <view :class="['tab', tabMode === 'active' && 'tab-active']" @tap="switchTab('active')">
          <text>活跃台风</text>
        </view>
        <view :class="['tab', tabMode === 'history' && 'tab-active']" @tap="switchTab('history')">
          <text>历史台风</text>
        </view>
      </view>
      <view v-if="tabMode === 'history'" class="year-picker-wrap">
        <picker mode="selector" :range="yearList" @change="(e: any) => onYearChange(yearList[e.detail.value])">
          <view class="year-picker">
            <text>{{ selectedYear }}</text>
            <text class="year-arrow">&#9662;</text>
          </view>
        </picker>
      </view>
    </view>

    <view v-if="typhoonListVisible && listExpanded" class="chip-bar">
      <scroll-view scroll-x class="chip-scroll" :show-scrollbar="false">
        <view class="chip-row">
          <view
            v-for="t in typhoons" :key="t.id"
            :class="['chip', t.id === selected?.id && 'active']"
            @tap="select(t)"
          >
            <text class="chip-name">{{ displayName(t) }}</text>
            <text class="chip-num">{{ t.tcNum }}</text>
          </view>
        </view>
      </scroll-view>
      <view class="chip-fade-right" />
    </view>

    <view v-if="selected && !listExpanded && info" class="collapsed-bar" @tap="listExpanded = true">
      <view class="collapsed-dot" :style="{ background: gradeColor(currentPos?.grade || 'TD') }" />
      <text class="collapsed-name">{{ displayName(selected) }}</text>
      <view :class="['mini-grade', 'g-' + (currentPos?.grade || 'TD')]">
        <text>{{ info.gradeText }}</text>
      </view>
      <text class="collapsed-wind">{{ info.windSpeed }}m/s</text>
      <text class="collapsed-expand">&#9662;</text>
    </view>

    <view v-if="loading || historyLoading" class="loading-hint">
      <text>{{ tabMode === 'active' ? '正在获取活跃台风...' : '正在获取 ' + selectedYear + ' 年台风...' }}</text>
    </view>

    <view class="map-container">
      <map
        id="myMap"
        :latitude="center.lat"
        :longitude="center.lng"
        :scale="scale"
        :markers="mapMarkers"
        :polyline="polylines"
        :circles="pulseCircles"
        @markertap="onMapMarkerTap"
        @scalechanged="onMapScaleChanged"
        enable-zoom
        enable-scroll
        enable-rotate
        style="width:100%;height:100%"
      />

      <view v-if="showEmptyOverlay" class="map-empty">
        <view class="map-empty-card">
          <text class="map-empty-icon">🌀</text>
          <text class="map-empty-text" v-if="tabMode === 'active'">暂无可追踪台风</text>
          <text class="map-empty-text" v-else>{{ selectedYear }} 年暂无台风记录</text>
          <view v-if="tabMode === 'active'" class="map-empty-btn" @tap.stop="switchTab('history')">
            <text>查看历史台风</text>
          </view>
          <view v-else class="map-empty-btn" @tap.stop="switchTab('active')">
            <text>返回活跃台风</text>
          </view>
        </view>
      </view>

      <view v-if="fetching" class="map-fetching">
        <view class="fetching-spinner" />
        <text>加载路径...</text>
      </view>

      <view v-if="detail" class="map-legend">
        <view class="legend-item" v-for="(lbl, grade) in {'TD':'热带低压','TS':'热带风暴','STS':'强热带风暴','TY':'台风','STY':'强台风','SuperTY':'超强台风'}" :key="grade">
          <view class="legend-dot" :style="{ background: GRADE_COLORS[grade] || '#999' }" />
          <text class="legend-text">{{ lbl }}</text>
        </view>
      </view>
    </view>

    <view v-if="selectedPoint" class="point-card" @tap="selectedPoint = null">
      <view class="point-card-header">
        <view class="point-left">
          <view class="point-dot" :style="{ background: gradeColor(selectedPoint.point.grade) }" />
          <text class="point-time">{{ formatTime(selectedPoint.point.time) }}</text>
        </view>
        <view :class="['grade-badge', 'g-' + selectedPoint.point.grade]">{{ selectedPoint.point.gradeText }}</view>
      </view>
      <view class="point-card-stats">
        <view class="point-stat">
          <text class="point-stat-label">最大风速</text>
          <text class="point-stat-value">{{ selectedPoint.point.windSpeed }} m/s</text>
        </view>
        <view class="point-stat">
          <text class="point-stat-label">中心气压</text>
          <text class="point-stat-value">{{ selectedPoint.point.pressure }} hPa</text>
        </view>
        <view class="point-stat">
          <text class="point-stat-label">位置</text>
          <text class="point-stat-value">{{ selectedPoint.point.lat.toFixed(1) }}°N {{ selectedPoint.point.lon.toFixed(1) }}°E</text>
        </view>
      </view>
      <view :class="['point-type-tag', 'pt-' + selectedPoint.type]">
        <text>{{ selectedPoint.type === 'history' ? '实况路径' : '预报路径' }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-paper);
  flex-shrink: 0;
}

.tab-row {
  display: flex;
  flex: 1;
  gap: 0;
  border-radius: var(--radius-sm);
  background: var(--color-paper-dark);
  padding: 2px;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 7px 0;
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

.year-picker-wrap { flex-shrink: 0; }
.year-picker {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  background: var(--color-paper-dark);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  font-weight: var(--font-weight-medium);
}
.year-arrow { font-size: 9px; color: var(--color-ash); }

.chip-bar {
  position: relative;
  padding: var(--spacing-sm) 0;
  background: var(--color-paper);
  border-bottom: 1px solid var(--color-paper-border);
  flex-shrink: 0;
}

.chip-scroll {
  white-space: nowrap;
  padding: 0 var(--spacing-lg);
}
.chip-row {
  display: inline-flex;
  gap: var(--spacing-sm);
  padding-right: 36px;
}

.chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  background: var(--color-paper-dark);
  min-width: 72px;
  border: 1.5px solid transparent;
  transition: all var(--transition-fast);
}
.chip.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(192,57,43,0.3);
  transform: translateY(-2px);
}
.chip-name { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); white-space: nowrap; }
.chip-num { font-size: 10px; opacity: 0.5; }
.chip.active .chip-name, .chip.active .chip-num { opacity: 1; }

.chip-fade-right {
  position: absolute;
  right: 0; top: 0; bottom: 0;
  width: 40px;
  background: linear-gradient(90deg, transparent, var(--color-paper));
  pointer-events: none;
}

.collapsed-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-paper);
  border-bottom: 1px solid var(--color-paper-border);
  flex-shrink: 0;
}
.collapsed-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.collapsed-name { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); color: var(--color-primary); flex: 1; }
.mini-grade { padding: 2px 8px; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: #fff; }
.collapsed-wind { font-size: var(--font-size-xs); color: var(--color-ink-light); }
.collapsed-expand { font-size: 12px; color: var(--color-ash); }

.loading-hint {
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-paper);
  flex-shrink: 0;
}

.map-container { flex: 1; position: relative; overflow: hidden; }

.map-empty {
  position: absolute; z-index: 4; inset: 0;
  display: flex; align-items: center; justify-content: center;
}
.map-empty-card {
  display: flex; flex-direction: column; align-items: center; gap: var(--spacing-md);
  padding: var(--spacing-3xl) var(--spacing-4xl);
  background: rgba(255,255,255,0.92);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}
.map-empty-icon { font-size: 48px; }
.map-empty-text { font-size: var(--font-size-md); color: var(--color-ink-soft); }
.map-empty-btn {
  padding: var(--spacing-sm) var(--spacing-2xl);
  background: var(--color-primary);
  border-radius: var(--radius-full);
  color: #fff;
  font-size: var(--font-size-sm);
}

.map-fetching {
  position: absolute; z-index: 3; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--spacing-md);
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(2px);
  color: #fff;
  font-size: var(--font-size-sm);
}
.fetching-spinner {
  width: 32px; height: 32px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.map-legend {
  position: absolute; z-index: 5;
  left: var(--spacing-md); bottom: var(--spacing-xl);
  display: flex; flex-wrap: wrap; gap: 4px; max-width: 70%;
}
.legend-item {
  display: flex; align-items: center; gap: 3px;
  background: rgba(26,26,46,0.8); padding: 3px 8px; border-radius: var(--radius-sm);
}
.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.legend-text { font-size: 9px; color: #ddd; white-space: nowrap; }

.point-card {
  background: var(--color-paper);
  padding: var(--spacing-md) var(--spacing-xl);
  flex-shrink: 0;
}
.point-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm); }
.point-left { display: flex; align-items: center; gap: var(--spacing-sm); }
.point-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.point-time { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--color-ink); }
.point-card-stats { display: flex; gap: var(--spacing-2xl); margin-bottom: var(--spacing-sm); }
.point-stat { display: flex; flex-direction: column; gap: 1px; }
.point-stat-label { font-size: var(--font-size-xs); color: var(--color-ash); }
.point-stat-value { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-ink); }
.point-type-tag { align-self: flex-start; padding: 2px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: var(--font-weight-medium); }
.pt-history { background: var(--color-jade); color: #fff; }
.pt-forecast { background: var(--color-gold); color: #fff; }

.grade-badge { padding: 3px 12px; border-radius: var(--radius-full); font-size: var(--font-size-xs); color: #fff; font-weight: var(--font-weight-semibold); }
.g-TD { background: #5DADE2; }
.g-TS { background: #F4D03F; color: #333; }
.g-STS { background: #E67E22; }
.g-TY { background: #E74C3C; }
.g-STY { background: #8E44AD; }
.g-SuperTY { background: #FF1493; }
</style>
