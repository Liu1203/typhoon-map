<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { getEarthquakes, getDateStr, magColor, magBgColor, magRadius, type QuakeItem } from "@/api/earthquake"

const quakes = ref<QuakeItem[]>([])
const loading = ref(true)
const failed = ref(false)
const selected = ref<QuakeItem | null>(null)
const center = ref({ lat: 30, lng: 105 })
const scale = ref(3)
const showList = ref(true)
const region = ref<"global" | "china">("global")
const queryDate = ref(getDateStr())

onMounted(async () => {
  await load()
})

async function load() {
  loading.value = true
  failed.value = false
  quakes.value = []
  const data = await getEarthquakes(queryDate.value, region.value, (updated) => {
    quakes.value = updated
    if (updated.length > 0) {
      if (!selected.value) { selected.value = updated[0]; fitMap(updated) }
      failed.value = false
    }
    loading.value = false
  })
  quakes.value = data
  if (data.length > 0) {
    selected.value = data[0]
    fitMap(data)
  }
  failed.value = data.length === 0
  loading.value = false
}

async function switchRegion(mode: "global" | "china") {
  if (mode === region.value) return
  region.value = mode
  await load()
}

async function onDateChange(e: any) {
  queryDate.value = e.detail.value
  await load()
}

function fitMap(list: QuakeItem[]) {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
  for (const q of list) {
    if (q.lat < minLat) minLat = q.lat
    if (q.lat > maxLat) maxLat = q.lat
    if (q.lon < minLng) minLng = q.lon
    if (q.lon > maxLng) maxLng = q.lon
  }
  center.value = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }
  const span = Math.max(maxLat - minLat, maxLng - minLng)
  if (span < 5) scale.value = 8
  else if (span < 15) scale.value = 6
  else if (span < 40) scale.value = 4
  else if (span < 80) scale.value = 3
  else scale.value = 2
}

function selectQuake(q: QuakeItem) {
  selected.value = q
  center.value = { lat: q.lat, lng: q.lon }
  scale.value = 6
}

function dotIcon(mag: number): string {
  if (mag >= 6) return "/static/dot-SuperTY.png"
  if (mag >= 5) return "/static/dot-STY.png"
  if (mag >= 4) return "/static/dot-TY.png"
  if (mag >= 3) return "/static/dot-STS.png"
  if (mag >= 2) return "/static/dot-TS.png"
  return "/static/dot-TD.png"
}

const markers = computed(() => {
  const list: any[] = []
  quakes.value.slice(0, 100).forEach((q, i) => {
    list.push({
      id: i + 1,
      latitude: q.lat,
      longitude: q.lon,
      iconPath: dotIcon(q.mag),
      width: 1,
      height: 1,
      zIndex: Math.round(q.mag * 10),
      anchor: { x: 0.5, y: 0.5 },
    })
  })
  if (selected.value) {
    list.push({
      id: 9999,
      latitude: selected.value.lat,
      longitude: selected.value.lon,
      iconPath: "/static/点位.png",
      width: 48,
      height: 48,
      zIndex: 1000,
      anchor: { x: 0.5, y: 1.25 },
    })
  }
  return list
})

function onMapTap(e: any) {
  const lat = e.detail.latitude
  const lng = e.detail.longitude
  if (lat === undefined || lng === undefined) return
  let best: QuakeItem | null = null
  let bestDist = Infinity
  for (const q of quakes.value) {
    const dlat = q.lat - lat
    const dlng = q.lon - lng
    const dist = dlat * dlat + dlng * dlng
    if (dist < bestDist) { bestDist = dist; best = q }
  }
  if (best && Math.sqrt(bestDist) < 1.5) {
    selectQuake(best)
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatFull(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<template>
  <view class="page">
    <view class="bar">
      <view class="bar-row">
        <view class="region-tabs">
          <view :class="['region-tab', region === 'global' && 'active']" @tap="switchRegion('global')">
            <text>全球</text>
          </view>
          <view :class="['region-tab', region === 'china' && 'active']" @tap="switchRegion('china')">
            <text>中国及周边</text>
          </view>
        </view>
        <picker mode="date" :value="queryDate" @change="onDateChange">
          <view class="date-picker">
            <text>{{ queryDate }}</text>
            <text class="date-arrow">&#9662;</text>
          </view>
        </picker>
      </view>
      <view class="bar-sub">
        <text v-if="!loading" class="bar-count">
          <text class="bar-count-num">{{ quakes.length }}</text> 次地震
          <text class="bar-count-src">· USGS + GFZ + EMSC</text>
        </text>
        <text v-else class="bar-count bar-loading">加载中...</text>
        <view class="bar-toggle" @tap="showList = !showList">
          <text>{{ showList ? '收起 ▲' : '列表 ▼' }}</text>
        </view>
      </view>
      <view v-show="showList" class="quake-list">
        <view
          v-for="(q, i) in quakes" :key="q.id || i"
          :class="['quake-item', q.id === selected?.id && 'active']"
          @tap="selectQuake(q)"
        >
          <view class="quake-rank" :style="{ background: magColor(q.mag) }">
            <text class="quake-rank-text">{{ i + 1 }}</text>
          </view>
          <view class="quake-mag-tag" :style="{ background: magBgColor(q.mag), color: magColor(q.mag) }">
            <text class="quake-mag-num">{{ q.mag.toFixed(1) }}</text>
          </view>
          <view class="quake-info">
            <text class="quake-place">{{ q.place }}</text>
            <text class="quake-meta">{{ formatTime(q.time) }} · 深度 {{ q.depth.toFixed(0) }}km</text>
          </view>
        </view>
      </view>
    </view>

    <view class="map-container">
      <map
        id="quakeMap"
        :latitude="center.lat"
        :longitude="center.lng"
        :scale="scale"
        :markers="markers"
        @tap="onMapTap"
        enable-zoom
        enable-scroll
        enable-rotate
        style="width:100%;height:100%"
      />

      <view v-if="loading" class="map-message">
        <view class="fetching-spinner" />
        <text>加载中...</text>
      </view>
      <view v-else-if="failed" class="map-message">
        <text class="map-msg-icon">📡</text>
        <text>该日期暂无地震数据</text>
        <text class="map-msg-hint">可切换至「中国及周边」或更换日期</text>
      </view>
    </view>

    <view v-if="selected" class="info-card" @tap="showList ? null : showList = true">
      <view class="info-top">
        <view class="info-mag-wrap" :style="{ background: magColor(selected.mag) }">
          <text class="info-mag-num">{{ selected.mag.toFixed(1) }}</text>
          <text class="info-mag-label">级</text>
        </view>
        <view class="info-top-right">
          <text class="info-time-full">{{ formatFull(selected.time) }}</text>
          <view class="info-coords">
            <text>{{ selected.lat.toFixed(2) }}°N {{ selected.lon.toFixed(2) }}°E</text>
          </view>
        </view>
      </view>
      <text class="info-place">{{ selected.place }}</text>
      <view class="info-bottom">
        <view class="info-stat">
          <text class="info-stat-value">{{ selected.depth.toFixed(0) }}</text>
          <text class="info-stat-label">深度 (km)</text>
        </view>
        <view class="info-stat">
          <text class="info-stat-value">{{ magColor(selected.mag) === '#E53935' ? '破坏性' : magColor(selected.mag) === '#EF6C00' ? '强烈' : magColor(selected.mag) === '#F9A825' ? '有感' : '轻微' }}</text>
          <text class="info-stat-label">震感</text>
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
  background: var(--color-paper);
  border-bottom: 1px solid var(--color-paper-border);
  max-height: 50vh;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.bar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  gap: var(--spacing-sm);
}

.bar-sub {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--spacing-lg) var(--spacing-sm);
}

.region-tabs {
  display: flex;
  gap: 0;
  border-radius: var(--radius-sm);
  background: var(--color-paper-dark);
  padding: 2px;
}

.region-tab {
  padding: 6px 14px;
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.region-tab.active {
  background: var(--color-primary);
  color: #fff;
  font-weight: var(--font-weight-semibold);
  box-shadow: 0 2px 6px rgba(91,143,192,0.3);
}

.date-picker {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  padding: 6px 12px;
  background: var(--color-paper-dark);
  border-radius: var(--radius-sm);
}

.date-arrow { font-size: 10px; }

.bar-count {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
}

.bar-count-num {
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
}

.bar-count-src {
  color: var(--color-ash);
  font-size: 10px;
}

.bar-loading {
  opacity: 0.6;
}

.bar-toggle {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
}

.quake-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--spacing-lg) var(--spacing-sm);
}

.quake-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-paper-border);
  transition: background var(--transition-fast);
}

.quake-item.active {
  background: rgba(91,143,192,0.06);
  margin: 0 calc(-1 * var(--spacing-lg));
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-sm);
}

.quake-rank {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quake-rank-text {
  color: #fff;
  font-size: 10px;
  font-weight: var(--font-weight-bold);
}

.quake-mag-tag {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: var(--font-weight-bold);
}

.quake-mag-num {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}

.quake-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.quake-place {
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quake-meta {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
}

.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--color-bg);
}

.map-message {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  color: var(--color-ink-soft);
  font-size: var(--font-size-sm);
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(2px);
}

.map-msg-icon {
  font-size: 40px;
}

.map-msg-hint {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  margin-top: var(--spacing-xs);
}

.fetching-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-paper-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.info-card {
  background: var(--color-paper);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-paper-border);
  flex-shrink: 0;
}

.info-top {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.info-mag-wrap {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-mag-num {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: #fff;
  line-height: 1;
}

.info-mag-label {
  font-size: 10px;
  color: rgba(255,255,255,0.8);
}

.info-top-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-time-full {
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  font-weight: var(--font-weight-semibold);
}

.info-coords {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
}

.info-place {
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-sm);
}

.info-bottom {
  display: flex;
  gap: var(--spacing-2xl);
}

.info-stat {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.info-stat-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-ink);
}

.info-stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-ash);
}
</style>
