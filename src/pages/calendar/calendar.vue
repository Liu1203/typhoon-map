<script setup lang="ts">
import { ref, computed } from "vue"
import { onShow } from "@dcloudio/uni-app"
import { getCityCoords, getCalendarWeather, type CalendarDay } from "@/api/weather"
import { loadDarkMode } from "@/utils/theme"
import { CACHE, DEFAULT_CITY } from "@/config"
import { solarToLunar } from "@/utils/lunar"
import WeatherIcon from "@/components/WeatherIcon.vue"
import Icon from "@/components/Icon.vue"

const darkMode = ref(false)
const city = ref(DEFAULT_CITY)
const days = ref<CalendarDay[]>([])
const loading = ref(true)
const error = ref(false)
const selected = ref<string>("")
const viewMonth = ref({ y: new Date().getFullYear(), m: new Date().getMonth() })

const WEEK = ["日", "一", "二", "三", "四", "五", "六"]

onShow(async () => {
  darkMode.value = loadDarkMode()
  city.value = (uni.getStorageSync(CACHE.CITY_KEY) as string) || DEFAULT_CITY
  error.value = false
  loading.value = true
  const now = new Date()
  viewMonth.value = { y: now.getFullYear(), m: now.getMonth() }
  const coords = getCityCoords(city.value)
  if (!coords) { error.value = true; loading.value = false; return }
  const res = await getCalendarWeather(coords.lat, coords.lon)
  days.value = res
  if (!res.length) error.value = true
  else selected.value = res[0].date
  loading.value = false
})

const pad = (n: number) => String(n).padStart(2, "0")

const dayMap = computed(() => {
  const m: Record<string, CalendarDay> = {}
  days.value.forEach(d => { m[d.date] = d })
  return m
})

const todayStr = computed(() => {
  const d = new Date()
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
})

interface Cell { date: string; day: number; data?: CalendarDay }
const cells = computed<Cell[]>(() => {
  const vm = viewMonth.value
  const first = new Date(vm.y, vm.m, 1)
  const startWeekday = first.getDay()
  const daysInMonth = new Date(vm.y, vm.m + 1, 0).getDate()
  const out: Cell[] = []
  for (let i = 0; i < startWeekday; i++) out.push({ date: "", day: 0 })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = vm.y + "-" + pad(vm.m + 1) + "-" + pad(d)
    out.push({ date, day: d, data: dayMap.value[date] })
  }
  return out
})

const monthLabel = computed(() => viewMonth.value.y + "年" + (viewMonth.value.m + 1) + "月")

const hasNext = computed(() => {
  const vm = viewMonth.value
  const ny = vm.m === 11 ? vm.y + 1 : vm.y
  const nm = (vm.m + 1) % 12
  return days.value.some(d => {
    const dd = new Date(d.date + "T12:00:00")
    return dd.getFullYear() === ny && dd.getMonth() === nm
  })
})

function nextMonth() {
  if (!hasNext.value) return
  const vm = viewMonth.value
  viewMonth.value = vm.m === 11 ? { y: vm.y + 1, m: 0 } : { y: vm.y, m: vm.m + 1 }
}

function dayData(date: string): CalendarDay | undefined {
  return date ? dayMap.value[date] : undefined
}
function isToday(date: string): boolean { return date === todayStr.value }
function isPast(date: string): boolean { return date < todayStr.value }
function isSelected(date: string): boolean { return date === selected.value }

function lunarShort(date: string): string {
  if (!date) return ""
  const l = solarToLunar(new Date(date + "T12:00:00"))
  return l.term || l.lunarDayText
}

function selectDay(date: string) {
  if (!date || isPast(date) || !dayMap.value[date]) return
  selected.value = date
}

const selectedDay = computed(() => selected.value ? dayMap.value[selected.value] : undefined)
const selectedLunar = computed(() => selected.value ? solarToLunar(new Date(selected.value + "T12:00:00")) : null)

function fmtDate(date: string): string {
  const d = new Date(date + "T12:00:00")
  return (d.getMonth() + 1) + "月" + d.getDate() + "日 周" + WEEK[d.getDay()]
}

function moonPhaseText(p?: number): string {
  if (p == null) return "--"
  if (p < 0.03 || p > 0.97) return "新月"
  if (p < 0.22) return "娥眉月"
  if (p < 0.28) return "上弦月"
  if (p < 0.47) return "盈凸月"
  if (p < 0.53) return "满月"
  if (p < 0.72) return "亏凸月"
  if (p < 0.78) return "下弦月"
  return "残月"
}

function goBack() { uni.navigateBack() }
</script>

<template>
  <view class="container" :class="{ 'dark-mode': darkMode }">
    <view class="top-bar">
      <text class="top-back" @tap="goBack">‹ 返回</text>
      <text class="top-title">天气日历 · {{ city }}</text>
      <text class="top-spacer"></text>
    </view>

    <view v-if="loading" class="loading-hint">加载中...</view>

    <view v-else-if="error" class="empty-state">
      <view class="empty-icon"><Icon name="calendar" :size="46" color="#C9D3DE" /></view>
      <text class="empty-text">网络异常，请稍后重试</text>
    </view>

    <template v-else>
      <view class="card cal-card accent-calendar">
        <view class="cal-nav">
          <view class="nav-btn disabled"><Icon name="chevron-left" :size="18" color="#B0BDCC" /></view>
          <text class="cal-month">{{ monthLabel }}</text>
          <view :class="['nav-btn', !hasNext && 'disabled']" @tap="nextMonth">
            <Icon name="chevron-right" :size="18" :color="hasNext ? '#6673B8' : '#B0BDCC'" />
          </view>
        </view>

        <view class="week-row">
          <text v-for="w in WEEK" :key="w" class="week-cell">{{ w }}</text>
        </view>

        <view class="grid">
          <view v-for="(c, i) in cells" :key="i" class="cell-wrap">
            <view v-if="!c.date" class="cell blank" />
            <view
              v-else
              :class="['cell', { past: isPast(c.date), today: isToday(c.date), selected: isSelected(c.date), nodata: !c.data }]"
              @tap="selectDay(c.date)"
            >
              <text class="cell-day">{{ c.day }}</text>
              <text class="cell-lunar">{{ lunarShort(c.date) }}</text>
              <template v-if="c.data">
                <WeatherIcon :weather="c.data.weather" :size="22" :animate="false" />
                <text class="cell-temp">{{ c.data.high }}°<text class="cell-low">/{{ c.data.low }}°</text></text>
              </template>
            </view>
          </view>
        </view>
      </view>

      <view class="card detail-card accent-calendar" v-if="selectedDay">
        <view class="detail-head">
          <text class="detail-date">{{ fmtDate(selectedDay.date) }}</text>
          <text class="detail-lunar">{{ selectedLunar?.lunarMonthText }}{{ selectedLunar?.lunarDayText }}<text v-if="selectedLunar?.term"> · {{ selectedLunar.term }}</text></text>
        </view>
        <view class="detail-weather">
          <WeatherIcon :weather="selectedDay.weather" :size="48" :animate="false" />
          <view class="detail-weather-text">
            <text class="detail-desc">{{ selectedDay.weather }}</text>
            <text class="detail-range">↑ {{ selectedDay.high }}°　↓ {{ selectedDay.low }}°</text>
          </view>
        </view>
        <view class="detail-grid">
          <view class="detail-item"><text class="di-label">降水概率</text><text class="di-value">{{ selectedDay.precipProb }}%</text></view>
          <view class="detail-item"><text class="di-label">降水量</text><text class="di-value">{{ selectedDay.precip || '无' }}</text></view>
          <view class="detail-item"><text class="di-label">紫外线</text><text class="di-value">{{ selectedDay.uvMax }}</text></view>
          <view class="detail-item"><text class="di-label">日出</text><text class="di-value">{{ selectedDay.sunrise }}</text></view>
          <view class="detail-item"><text class="di-label">日落</text><text class="di-value">{{ selectedDay.sunset }}</text></view>
          <view class="detail-item"><text class="di-label">月相</text><text class="di-value">{{ moonPhaseText(selectedDay.moonPhase) }}</text></view>
        </view>
      </view>
    </template>
  </view>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--color-bg);
  padding: var(--spacing-lg);
  padding-bottom: calc(var(--spacing-4xl) + var(--window-bottom, 0px));
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}
.top-back { font-size: var(--font-size-md); color: var(--color-primary); font-weight: var(--font-weight-medium); width: 70px; }
.top-title { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-ink); }
.top-spacer { width: 70px; }
.loading-hint { text-align: center; padding: 60px 0; color: var(--color-ash); font-size: var(--font-size-sm); }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-sm); padding: 80px 0; }
.empty-icon { display: flex; align-items: center; justify-content: center; }
.empty-text { font-size: var(--font-size-sm); color: var(--color-ash); }

.card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-shadow);
  margin-bottom: var(--spacing-md);
}
.cal-card { padding: var(--spacing-lg); }

.cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-md); }
.cal-month { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--color-ink); }
.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-soft, rgba(102,115,184,0.12));
}
.nav-btn.disabled { background: transparent; }

.week-row { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 4px; }
.week-cell { text-align: center; font-size: var(--font-size-xs); color: var(--color-ash); }

.grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
.cell-wrap { min-height: 68px; }
.cell {
  width: 100%;
  height: 100%;
  min-height: 68px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 1px;
  padding: 3px 2px;
}
.cell.blank { visibility: hidden; }
.cell.past, .cell.nodata { background: rgba(44,62,80,0.03); }
.cell.today { border-color: var(--accent, #6673B8); }
.cell.selected { background: var(--accent-soft, rgba(102,115,184,0.12)); border-color: var(--accent, #6673B8); }
.cell-day { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-ink); }
.cell.past .cell-day, .cell.nodata .cell-day { color: var(--color-ash); font-weight: var(--font-weight-normal); }
.cell.today .cell-day { color: var(--accent, #6673B8); }
.cell-lunar { font-size: 9px; color: var(--color-ash); line-height: 1.1; }
.cell-temp { font-size: 10px; color: var(--color-ink); font-weight: var(--font-weight-medium); }
.cell-low { color: var(--color-ash); }
.cell.past .cell-temp, .cell.nodata .cell-temp { color: var(--color-ash); }

.detail-card { padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md); }
.detail-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: var(--spacing-md); }
.detail-date { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); color: var(--color-ink); }
.detail-lunar { font-size: var(--font-size-xs); color: var(--color-ash); }
.detail-weather { display: flex; align-items: center; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
.detail-weather-text { display: flex; flex-direction: column; gap: 4px; }
.detail-desc { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--color-ink); }
.detail-range { font-size: var(--font-size-sm); color: var(--color-ink-soft); }

.detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-sm); }
.detail-item { background: rgba(255,255,255,0.5); border-radius: var(--radius-md); padding: 8px 4px; text-align: center; }
.detail-item .di-label { display: block; font-size: 10px; color: var(--color-ash); margin-bottom: 2px; }
.detail-item .di-value { display: block; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-ink); }
</style>
<style>
.dark-mode .cell.past, .dark-mode .cell.nodata { background: rgba(255,255,255,0.04); }
.dark-mode .detail-item { background: rgba(255,255,255,0.06); }
</style>
