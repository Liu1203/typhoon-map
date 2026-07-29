<script setup lang="ts">
import { ref, onMounted } from "vue"
import { CACHE } from "@/config"
import { UNITS_DEFAULT, type UnitSettings } from "@/utils/weather"
import manifest from "@/manifest.json"

const darkMode = ref(false)
const units = ref<UnitSettings>({ ...UNITS_DEFAULT })
const favCities = ref<string[]>([])
const refreshOptions = [
  { label: "15 分钟", value: 15 },
  { label: "30 分钟", value: 30 },
  { label: "60 分钟", value: 60 },
  { label: "关闭", value: 0 },
]

onMounted(() => {
  const stored = uni.getStorageSync(CACHE.DARK_MODE_KEY) as string
  if (stored === "1") darkMode.value = true
  else if (stored === "0") darkMode.value = false
  else {
    const sys = uni.getSystemInfoSync()
    darkMode.value = sys.theme === "dark"
  }
  try {
    const raw = uni.getStorageSync("unit_settings") as string
    if (raw) units.value = { ...UNITS_DEFAULT, ...JSON.parse(raw) }
  } catch {}
  try {
    const raw = uni.getStorageSync("fav_cities") as string
    if (raw) favCities.value = JSON.parse(raw)
  } catch {}
})

function toggleDark() {
  darkMode.value = !darkMode.value
  uni.setStorageSync(CACHE.DARK_MODE_KEY, darkMode.value ? "1" : "0")
}

function setTemp(val: string) {
  units.value.temp = val as "c" | "f"
  saveUnits()
}

function setWind(val: string) {
  units.value.wind = val as "kmh" | "ms"
  saveUnits()
}

function setRefresh(val: number) {
  units.value.refresh = val
  saveUnits()
}

function saveUnits() {
  uni.setStorageSync("unit_settings", JSON.stringify(units.value))
}

function removeFav(city: string) {
  favCities.value = favCities.value.filter(c => c !== city)
  uni.setStorageSync("fav_cities", JSON.stringify(favCities.value))
}
</script>

<template>
  <view class="container">
    <view class="section">
      <text class="section-title">显示</text>
      <view class="setting-row" @tap="toggleDark">
        <text class="setting-label">深色模式</text>
        <view class="toggle" :class="{ on: darkMode }">
          <view class="toggle-knob" />
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">单位</text>
      <view class="setting-row">
        <text class="setting-label">温度单位</text>
        <view class="segmented">
          <text class="seg-item" :class="{ active: units.temp === 'c' }" @tap="setTemp('c')">°C</text>
          <text class="seg-item" :class="{ active: units.temp === 'f' }" @tap="setTemp('f')">°F</text>
        </view>
      </view>
      <view class="setting-row">
        <text class="setting-label">风速单位</text>
        <view class="segmented">
          <text class="seg-item" :class="{ active: units.wind === 'kmh' }" @tap="setWind('kmh')">km/h</text>
          <text class="seg-item" :class="{ active: units.wind === 'ms' }" @tap="setWind('ms')">m/s</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">自动刷新</text>
      <view class="setting-row" v-for="opt in refreshOptions" :key="opt.value" @tap="setRefresh(opt.value)">
        <text class="setting-label">{{ opt.label }}</text>
        <view class="radio" :class="{ checked: units.refresh === opt.value }">
          <view class="radio-dot" v-if="units.refresh === opt.value" />
        </view>
      </view>
    </view>

    <view class="section" v-if="favCities.length > 0">
      <text class="section-title">收藏城市 ({{ favCities.length }})</text>
      <view class="fav-list">
        <view v-for="city in favCities" :key="city" class="fav-row">
          <text class="fav-name">{{ city }}</text>
          <text class="fav-remove" @tap="removeFav(city)">删除</text>
        </view>
      </view>
    </view>

    <view class="section about">
      <text class="section-title">关于</text>
      <view class="setting-row">
        <text class="setting-label">应用版本</text>
        <text class="setting-value">{{ manifest.versionName || "1.1.0" }}</text>
      </view>
      <view class="setting-row">
        <text class="setting-label">数据来源</text>
        <text class="setting-value">Open-Meteo</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--color-bg);
  padding: var(--spacing-lg);
  padding-bottom: var(--spacing-4xl);
}
.section {
  background: var(--color-paper);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) 0;
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--color-paper-border);
}
.section-title {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  font-weight: var(--font-weight-semibold);
  padding: 0 var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  min-height: 44px;
}
.setting-label {
  font-size: var(--font-size-md);
  color: var(--color-ink);
  font-weight: var(--font-weight-medium);
}
.setting-value {
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
}
.toggle {
  width: 48px;
  height: 28px;
  border-radius: 14px;
  background: var(--color-paper-border);
  position: relative;
  transition: background var(--transition-fast);
}
.toggle.on {
  background: var(--color-primary);
}
.toggle-knob {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform var(--transition-fast);
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.toggle.on .toggle-knob {
  transform: translateX(20px);
}
.segmented {
  display: flex;
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.seg-item {
  padding: 4px 14px;
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
}
.seg-item.active {
  background: var(--color-primary);
  color: #fff;
}
.radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--color-paper-border);
  display: flex;
  align-items: center;
  justify-content: center;
}
.radio.checked {
  border-color: var(--color-primary);
}
.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary);
}
.about {
  opacity: 0.7;
}
.fav-list {
  padding: 0 var(--spacing-lg);
}
.fav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-paper-border);
}
.fav-row:last-child { border-bottom: none; }
.fav-name {
  font-size: var(--font-size-md);
  color: var(--color-ink);
}
.fav-remove {
  font-size: var(--font-size-sm);
  color: var(--color-danger);
  padding: 4px 8px;
}
</style>
