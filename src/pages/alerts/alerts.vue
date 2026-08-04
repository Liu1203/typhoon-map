<script setup lang="ts">
import { ref, onMounted } from "vue"
import { onShow } from "@dcloudio/uni-app"
import { loadDarkMode } from "@/utils/theme"
import type { AlertItem } from "@/api/weather"

const darkMode = ref(false)
const alerts = ref<AlertItem[]>([])
const city = ref("")

const SEVERITY_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  minor: { label: "一般", color: "#E8B84A", bg: "rgba(232,184,74,0.14)" },
  moderate: { label: "较重", color: "#F09050", bg: "rgba(240,144,80,0.14)" },
  severe: { label: "严重", color: "#E5606E", bg: "rgba(229,96,110,0.14)" },
  extreme: { label: "特别严重", color: "#A565B8", bg: "rgba(165,101,184,0.14)" },
}

function sevStyle(s: string) {
  return SEVERITY_STYLE[(s || "").toLowerCase()] || { label: s || "未知", color: "#8B9CAD", bg: "rgba(139,156,173,0.14)" }
}

function fmtTime(ts: string): string {
  if (!ts) return "—"
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  const pad = (n: number) => String(n).padStart(2, "0")
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes())
}

onMounted(() => { darkMode.value = loadDarkMode() })

onShow(() => {
  try {
    const raw = uni.getStorageSync("current_alerts") as string
    alerts.value = raw ? JSON.parse(raw) : []
  } catch { alerts.value = [] }
  city.value = (uni.getStorageSync("selected_city") as string) || ""
})

function goBack() { uni.navigateBack() }
</script>

<template>
  <view class="container" :class="{ 'dark-mode': darkMode }">
    <view class="top-bar">
      <text class="top-back" @tap="goBack">‹ 返回</text>
      <text class="top-title">天气预警</text>
      <text class="top-spacer"></text>
    </view>

    <view class="city-hint" v-if="city">当前城市：{{ city }}</view>

    <view class="empty-state" v-if="alerts.length === 0">
      <text class="empty-icon">☀️</text>
      <text class="empty-text">当前暂无天气预警</text>
      <text class="empty-sub">一切安好，注意天气变化</text>
    </view>

    <view class="alert-list" v-else>
      <view v-for="(a, i) in alerts" :key="i" class="alert-card">
        <view class="alert-head">
          <view class="alert-left">
            <text class="alert-event">{{ a.event || "天气预警" }}</text>
            <text class="alert-time">{{ fmtTime(a.start) }} 至 {{ fmtTime(a.end) }}</text>
          </view>
          <view class="sev-badge" :style="{ color: sevStyle(a.severity).color, background: sevStyle(a.severity).bg }">
            {{ sevStyle(a.severity).label }}
          </view>
        </view>
        <text class="alert-desc" v-if="a.description">{{ a.description }}</text>
      </view>
    </view>

    <view class="foot-hint">数据来源：Open-Meteo 天气预警</view>
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
.top-back {
  font-size: var(--font-size-md);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  width: 70px;
}
.top-title {
  font-size: var(--font-size-lg);
  color: var(--color-ink);
  font-weight: var(--font-weight-bold);
}
.top-spacer { width: 70px; }
.city-hint {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  margin-bottom: var(--spacing-md);
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0;
  gap: 12px;
}
.empty-icon { font-size: 48px; }
.empty-text { font-size: var(--font-size-md); color: var(--color-ink-light); font-weight: var(--font-weight-medium); }
.empty-sub { font-size: var(--font-size-xs); color: var(--color-ash); }
.alert-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
.alert-card {
  background: var(--color-paper);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-paper-border);
  border-left: 4px solid var(--color-danger);
}
.alert-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-sm);
}
.alert-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.alert-event {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-ink);
}
.alert-time {
  font-size: var(--font-size-xs);
  color: var(--color-ash);
}
.sev-badge {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}
.alert-desc {
  display: block;
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-paper-border);
  font-size: var(--font-size-sm);
  line-height: 1.7;
  color: var(--color-ink-soft);
  white-space: pre-wrap;
}
.foot-hint {
  text-align: center;
  margin-top: var(--spacing-xl);
  font-size: 10px;
  color: var(--color-ash);
}
</style>
