<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { getEarthquakes, magColor, magRadius, type QuakeItem } from "@/api/earthquake"

const quakes = ref<QuakeItem[]>([])
const loading = ref(true)
const failed = ref(false)
const selected = ref<QuakeItem | null>(null)
const center = ref({ lat: 30, lng: 105 })
const scale = ref(3)
const showList = ref(true)

const today = new Date()
const queryDate = ref(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`)

onMounted(async () => {
  await load()
})

async function load() {
  loading.value = true
  failed.value = false
  const data = await getEarthquakes(queryDate.value)
  quakes.value = data
  if (data.length > 0) {
    selected.value = data[0]
    fitMap(data)
  }
  failed.value = data.length === 0
  loading.value = false
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

const markers = computed(() => {
  return quakes.value.slice(0, 150).map((q, i) => {
    const r = magRadius(q.mag)
    return {
      id: i + 1,
      latitude: q.lat,
      longitude: q.lon,
      iconPath: "/static/dot-TD.png",
      width: r * 2,
      height: r * 2,
      anchor: { x: 0.5, y: 0.5 },
      label: {
        content: q.mag.toFixed(1),
        fontSize: Math.max(8, r * 0.6),
        color: '#fff',
        bgColor: magColor(q.mag),
        borderRadius: 99,
        padding: 4,
      },
    }
  })
})

function onMarkerTap(e: any) {
  const idx = e.detail.markerId - 1
  if (idx >= 0 && idx < quakes.value.length) {
    selectQuake(quakes.value[idx])
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<template>
  <view class="page">
    <view class="bar">
      <view class="bar-row">
        <picker mode="date" :value="queryDate" @change="onDateChange">
          <view class="date-picker">
            <text>{{ queryDate }}</text>
            <text class="date-arrow">&#9660;</text>
          </view>
        </picker>
        <text v-if="!loading" class="bar-count">{{ quakes.length }} 次 M2.5+</text>
        <view class="bar-toggle" @tap="showList = !showList">
          <text>{{ showList ? '隐藏 ▲' : '列表 ▼' }}</text>
        </view>
      </view>
      <view v-if="showList" class="quake-list">
        <view
          v-for="q in quakes" :key="q.id"
          :class="['quake-item', q.id === selected?.id && 'active']"
          @tap="selectQuake(q)"
        >
          <view class="quake-tag" :style="{ background: magColor(q.mag) }">
            <text class="quake-tag-text">{{ q.mag.toFixed(1) }}</text>
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
        @markertap="onMarkerTap"
        enable-zoom
        enable-scroll
        enable-rotate
        style="width:100%;height:100%"
      />

      <view v-if="loading" class="map-message">
        <text>加载中...</text>
      </view>
      <view v-else-if="failed" class="map-message">
        <text>该日期暂无 M2.5+ 地震数据</text>
      </view>
    </view>

    <view v-if="selected" class="info-card">
      <view class="info-row">
        <text class="info-mag" :style="{ color: magColor(selected.mag) }">M{{ selected.mag.toFixed(1) }}</text>
        <text class="info-time">{{ formatTime(selected.time) }}</text>
      </view>
      <view class="info-place">{{ selected.place }}</view>
      <view class="info-row">
        <text>深度 {{ selected.depth.toFixed(0) }} km</text>
        <text>{{ selected.lat.toFixed(2) }}&deg;N {{ selected.lon.toFixed(2) }}&deg;E</text>
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
  max-height: 45vh;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.bar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  gap: var(--spacing-sm);
}

.bar-count {
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
  white-space: nowrap;
}

.date-picker {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.date-arrow {
  font-size: 10px;
}

.bar-toggle {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  white-space: nowrap;
}

.quake-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--spacing-lg) var(--spacing-sm);
}

.quake-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-paper-border);
  transition: background var(--transition-fast);
}

.quake-item.active {
  background: rgba(192,57,43,0.05);
  margin: 0 calc(-1 * var(--spacing-lg));
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-sm);
}

.quake-tag {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.quake-tag-text {
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.quake-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quake-place {
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  font-weight: var(--font-weight-medium);
}

.quake-meta {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
}

.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #f0f2f5;
}

.map-message {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  color: var(--color-ink-light);
  font-size: var(--font-size-sm);
}

.info-card {
  background: var(--color-paper);
  padding: var(--spacing-md) var(--spacing-xl);
  border-top: 1px solid var(--color-paper-border);
  flex-shrink: 0;
}

.info-mag {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.info-time {
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
}

.info-place {
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  margin-bottom: var(--spacing-xs);
  font-weight: var(--font-weight-medium);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-ink-soft);
  margin-bottom: 2px;
}
</style>
