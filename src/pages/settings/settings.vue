<script setup lang="ts">
import { ref, computed, onMounted, nextTick, getCurrentInstance } from "vue"
import { UNITS_DEFAULT, MODULE_ORDER_DEFAULT, getUnitSettings, type UnitSettings, type ModuleConfig } from "@/utils/weather"
import { loadDarkMode, getDarkModeState, setDarkMode, type DarkModeState } from "@/utils/theme"
import { APP_VERSION } from "@/version"

const darkMode = ref(false)
const darkState = ref<DarkModeState>("auto")
const units = ref<UnitSettings>(JSON.parse(JSON.stringify(UNITS_DEFAULT)))
const favCities = ref<string[]>([])
const refreshOptions = [
  { label: "15 分钟", value: 15 },
  { label: "30 分钟", value: 30 },
  { label: "60 分钟", value: 60 },
  { label: "关闭", value: 0 },
]
const tempAlert = ref({ enabled: false, high: 35, low: 0 })
const digestEnabled = ref(true)
const moduleList: { key: keyof ModuleConfig; label: string }[] = [
  { key: "detail", label: "天气详情网格" },
  { key: "aqi", label: "空气质量" },
  { key: "forecast", label: "未来天气" },
  { key: "hourly", label: "逐时天气" },
  { key: "lifetips", label: "生活指数" },
  { key: "temptr", label: "温度趋势" },
  { key: "preciptr", label: "降水趋势" },
  { key: "typhoon", label: "台风入口" },
  { key: "quake", label: "地震入口" },
  { key: "radar", label: "雷达降水" },
  { key: "stargazing", label: "观星指数" },
]

const orderedModules = computed(() => {
  const order = units.value.moduleOrder && units.value.moduleOrder.length ? units.value.moduleOrder : MODULE_ORDER_DEFAULT
  const sorted: { key: keyof ModuleConfig; label: string }[] = []
  order.forEach(k => {
    const m = moduleList.find(x => x.key === k)
    if (m) sorted.push(m)
  })
  moduleList.forEach(m => { if (!sorted.some(x => x.key === m.key)) sorted.push(m) })
  return sorted
})

/* 拖拽排序：长按整行任意位置 380ms 进入拖动 */
const dragKey = ref<string | null>(null)
const dragDy = ref(0)
const startPageY = ref(0)
const startIndex = ref(0)
const currentIndex = ref(0)
const itemH = ref(48)
const pressed = ref(false)
let longPressTimer: ReturnType<typeof setTimeout> | null = null

function getY(e: any): number {
  const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
  if (!t) return 0
  return t.pageY != null ? t.pageY : (t.clientY || 0)
}

function measureItemH() {
  try {
    const q = uni.createSelectorQuery().in(getCurrentInstance())
    q.select(".module-item").boundingClientRect((r: any) => {
      if (r && r.height) itemH.value = Math.max(32, Math.min(80, r.height))
    }).exec()
  } catch {}
}

onMounted(async () => { await nextTick(); measureItemH() })

function onRowTouchStart(e: any, index: number) {
  pressed.value = true
  startPageY.value = getY(e)
  startIndex.value = index
  currentIndex.value = index
  if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
  longPressTimer = setTimeout(() => {
    longPressTimer = null
    if (pressed.value) {
      dragKey.value = orderedModules.value[index].key
      measureItemH()
    }
  }, 380)
}

function onRowTouchMove(e: any) {
  if (!dragKey.value) return
  const y = getY(e)
  const dy = y - startPageY.value
  const len = orderedModules.value.length
  const target = Math.max(0, Math.min(len - 1, Math.round((startIndex.value * itemH.value + dy) / itemH.value)))
  if (target !== currentIndex.value) {
    const order = units.value.moduleOrder.slice()
    const from = order.indexOf(orderedModules.value[currentIndex.value].key)
    const to = order.indexOf(orderedModules.value[target].key)
    if (from >= 0 && to >= 0 && from !== to) {
      order.splice(from, 1)
      order.splice(to, 0, units.value.moduleOrder[from])
      units.value.moduleOrder = order
      saveUnits()
    }
    currentIndex.value = target
  }
  const absPos = startIndex.value * itemH.value + dy
  const minAbs = -itemH.value * 0.5
  const maxAbs = (len - 1) * itemH.value + itemH.value * 0.5
  dragDy.value = Math.max(minAbs, Math.min(maxAbs, absPos)) - currentIndex.value * itemH.value
}

function onRowTouchEnd() {
  if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
  pressed.value = false
  dragKey.value = null
  dragDy.value = 0
}

onMounted(() => {
  darkMode.value = loadDarkMode()
  darkState.value = getDarkModeState()
  units.value = getUnitSettings()
  try {
    const raw = uni.getStorageSync("fav_cities") as string
    if (raw) favCities.value = JSON.parse(raw)
  } catch {}
  try {
    const raw = uni.getStorageSync("temp_alert_settings") as string
    if (raw) tempAlert.value = { enabled: false, high: 35, low: 0, ...JSON.parse(raw) }
  } catch {}
  try {
    const raw = uni.getStorageSync("digest_settings") as string
    if (raw) digestEnabled.value = JSON.parse(raw).enabled !== false
  } catch {}
})

function toggleDigest() {
  digestEnabled.value = !digestEnabled.value
  uni.setStorageSync("digest_settings", JSON.stringify({ enabled: digestEnabled.value }))
}

function setDark(state: DarkModeState) {
  darkState.value = state
  darkMode.value = setDarkMode(state)
}

function setTemp(val: string) {
  units.value.temp = val as "c" | "f"
  saveUnits()
}

function setWind(val: string) {
  units.value.wind = val as "kmh" | "ms"
  saveUnits()
}

function setPressure(val: string) {
  units.value.pressure = val as "hpa" | "inhg"
  saveUnits()
}

function setVisibility(val: string) {
  units.value.visibility = val as "km" | "mi"
  saveUnits()
}

function setRefresh(val: number) {
  units.value.refresh = val
  saveUnits()
}

function toggleModule(key: keyof ModuleConfig) {
  units.value.modules[key] = !units.value.modules[key]
  saveUnits()
}

function toggleTempAlert() {
  tempAlert.value.enabled = !tempAlert.value.enabled
  saveTempAlert()
}

function stepTempAlert(kind: "high" | "low", delta: number) {
  const v = tempAlert.value[kind] + delta
  if (kind === "high") tempAlert.value.high = Math.min(45, Math.max(25, v))
  else tempAlert.value.low = Math.min(20, Math.max(-20, v))
  saveTempAlert()
}

function saveTempAlert() {
  uni.setStorageSync("temp_alert_settings", JSON.stringify(tempAlert.value))
}

function saveUnits() {
  uni.setStorageSync("unit_settings", JSON.stringify(units.value))
}

function removeFav(city: string) {
  favCities.value = favCities.value.filter(c => c !== city)
  uni.setStorageSync("fav_cities", JSON.stringify(favCities.value))
}

function clearCache() {
  uni.showModal({
    title: "清除缓存",
    content: "将清除天气缓存、搜索记录，但保留城市收藏和设置。",
    success(r) {
      if (r.confirm) {
        try { uni.removeStorageSync("weather_cache") } catch {}
        try {
          const info = uni.getStorageInfoSync()
          ;(info.keys || []).forEach(k => {
            if (String(k).startsWith("search_cache_")) {
              try { uni.removeStorageSync(k) } catch {}
            }
          })
        } catch {}
        uni.showToast({ title: "缓存已清除", icon: "none" })
      }
    },
  })
}

function checkUpdate() {
  uni.showModal({
    title: "检查更新",
    content: "当前版本 " + APP_VERSION + "，已是最新版本。",
    showCancel: false,
    confirmText: "好的",
  })
}
</script>

<template>
  <view class="container" :class="{ 'dark-mode': darkMode }">
    <view class="section">
      <text class="section-title">显示</text>
      <view class="setting-row">
        <text class="setting-label">深色模式</text>
        <view class="segmented">
          <text class="seg-item" :class="{ active: darkState === 'auto' }" @tap="setDark('auto')">跟随系统</text>
          <text class="seg-item" :class="{ active: darkState === 'dark' }" @tap="setDark('dark')">深色</text>
          <text class="seg-item" :class="{ active: darkState === 'light' }" @tap="setDark('light')">浅色</text>
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
      <view class="setting-row">
        <text class="setting-label">气压单位</text>
        <view class="segmented">
          <text class="seg-item" :class="{ active: units.pressure === 'hpa' }" @tap="setPressure('hpa')">hPa</text>
          <text class="seg-item" :class="{ active: units.pressure === 'inhg' }" @tap="setPressure('inhg')">inHg</text>
        </view>
      </view>
      <view class="setting-row">
        <text class="setting-label">能见度单位</text>
        <view class="segmented">
          <text class="seg-item" :class="{ active: units.visibility === 'km' }" @tap="setVisibility('km')">km</text>
          <text class="seg-item" :class="{ active: units.visibility === 'mi' }" @tap="setVisibility('mi')">mi</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">首页模块（长按任意位置拖动排序）</text>
      <view
        v-for="(m, idx) in orderedModules"
        :key="m.key"
        class="setting-row module-item"
        :class="{ dragging: dragKey === m.key }"
        :style="dragKey === m.key ? { transform: 'translateY(' + dragDy + 'px)', zIndex: 9 } : {}"
        @touchstart="onRowTouchStart($event, idx)"
        @touchmove.stop="onRowTouchMove($event)"
        @touchend="onRowTouchEnd"
        @touchcancel="onRowTouchEnd"
      >
        <view class="drag-handle">
          <text class="drag-icon">≡</text>
        </view>
        <text class="setting-label module-label">{{ m.label }}</text>
        <view class="toggle" :class="{ on: units.modules[m.key] }" @tap="toggleModule(m.key)">
          <view class="toggle-knob" />
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">温度提醒</text>
      <view class="setting-row" @tap="toggleTempAlert">
        <text class="setting-label">启用温度提醒</text>
        <view class="toggle" :class="{ on: tempAlert.enabled }">
          <view class="toggle-knob" />
        </view>
      </view>
      <view class="setting-row">
        <text class="setting-label">高温阈值</text>
        <view class="stepper">
          <view class="step-btn" @tap="stepTempAlert('high', -1)">−</view>
          <text class="step-val">{{ tempAlert.high }}°C</text>
          <view class="step-btn" @tap="stepTempAlert('high', 1)">＋</view>
        </view>
      </view>
      <view class="setting-row">
        <text class="setting-label">低温阈值</text>
        <view class="stepper">
          <view class="step-btn" @tap="stepTempAlert('low', -1)">−</view>
          <text class="step-val">{{ tempAlert.low }}°C</text>
          <view class="step-btn" @tap="stepTempAlert('low', 1)">＋</view>
        </view>
      </view>
      <view class="section-note">气温达到阈值时推送提醒（阈值按摄氏度计算）</view>
    </view>

    <view class="section">
      <text class="section-title">每日天气简报</text>
      <view class="setting-row" @tap="toggleDigest">
        <text class="setting-label">每日打开应用时推送今日天气摘要</text>
        <view class="toggle" :class="{ on: digestEnabled }">
          <view class="toggle-knob" />
        </view>
      </view>
      <view class="section-note">包含最高/最低温、天气、降水概率、紫外线等信息</view>
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
        <text class="setting-value">{{ APP_VERSION }}</text>
      </view>
      <view class="setting-row">
        <text class="setting-label">数据来源</text>
        <text class="setting-value">Open-Meteo</text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">其他</text>
      <view class="setting-row" @tap="clearCache">
        <text class="setting-label">清除缓存</text>
        <text class="setting-value">›</text>
      </view>
      <view class="setting-row" @tap="checkUpdate">
        <text class="setting-label">检查更新</text>
        <text class="setting-value">›</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--color-bg);
  padding: var(--spacing-lg);
  padding-bottom: calc(var(--spacing-4xl) + var(--window-bottom, 0px));
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
.module-item {
  transition: transform 0.18s ease, background 0.15s;
  touch-action: none;
}
.module-item.dragging {
  background: var(--color-primary);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  transition: none;
}
.module-item.dragging .setting-label,
.module-item.dragging .module-label {
  color: #fff;
}
.drag-handle {
  width: 30px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -8px;
  flex-shrink: 0;
}
.drag-icon {
  font-size: 20px;
  color: var(--color-ash);
  font-weight: var(--font-weight-bold);
}
.module-item.dragging .drag-icon { color: #fff; }
.module-label {
  flex: 1;
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
.stepper {
  display: flex;
  align-items: center;
  gap: 12px;
}
.step-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--color-bg);
  border: 1px solid var(--color-paper-border);
  font-size: 16px;
  color: var(--color-ink);
  font-weight: var(--font-weight-medium);
}
.step-btn:active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.step-val {
  font-size: var(--font-size-md);
  color: var(--color-ink);
  font-weight: var(--font-weight-semibold);
  min-width: 52px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.section-note {
  font-size: 10px;
  color: var(--color-ash);
  padding: 4px var(--spacing-lg) 0;
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
