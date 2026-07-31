<script setup lang="ts">
import { ref, onMounted } from "vue"
import { onShow } from "@dcloudio/uni-app"
import { loadDarkMode } from "@/utils/theme"

const darkMode = ref(false)
const favCities = ref<string[]>([])
const editMode = ref(false)

const FAV_KEY = "fav_cities"

onMounted(() => { darkMode.value = loadDarkMode() })
onShow(() => { loadCities() })

function loadCities() {
  try {
    const raw = uni.getStorageSync(FAV_KEY) as string
    favCities.value = raw ? JSON.parse(raw) as string[] : []
  } catch { favCities.value = [] }
}

function saveCities() {
  uni.setStorageSync(FAV_KEY, JSON.stringify(favCities.value))
}

function moveUp(idx: number) {
  if (idx <= 0) return
  const tmp = favCities.value[idx]
  favCities.value[idx] = favCities.value[idx - 1]
  favCities.value[idx - 1] = tmp
  saveCities()
}

function moveDown(idx: number) {
  if (idx >= favCities.value.length - 1) return
  const tmp = favCities.value[idx]
  favCities.value[idx] = favCities.value[idx + 1]
  favCities.value[idx + 1] = tmp
  saveCities()
}

function removeCity(idx: number) {
  uni.showModal({
    title: "确认",
    content: "从收藏中移除「" + favCities.value[idx] + "」？",
    success(r) { if (r.confirm) { favCities.value.splice(idx, 1); saveCities() } },
  })
}

function selectCity(name: string) {
  if (editMode.value) return
  uni.setStorageSync("selected_city", name)
  uni.navigateBack()
}

function goBack() { uni.navigateBack() }
</script>

<template>
  <view class="container" :class="{ 'dark-mode': darkMode }">
    <view class="top-bar">
      <text class="top-back" @tap="goBack">‹ 返回</text>
      <text class="top-title">管理收藏城市</text>
      <text class="top-action" @tap="editMode = !editMode">{{ editMode ? '完成' : '编辑' }}</text>
    </view>

    <view class="empty-state" v-if="favCities.length === 0">
      <text class="empty-icon">🏙</text>
      <text class="empty-text">暂无收藏城市</text>
      <text class="empty-sub">在城市搜索页面点击 ☆ 即可收藏</text>
    </view>

    <view class="city-list" v-else>
      <view v-for="(city, idx) in favCities" :key="city + idx" class="city-item" @tap="selectCity(city)">
        <view class="city-rank">
          <text class="rank-num">{{ idx + 1 }}</text>
        </view>
        <text class="city-name">{{ city }}</text>
        <view class="city-actions" v-if="editMode">
          <view class="action-btn up" @tap.stop="moveUp(idx)" :class="{ disabled: idx === 0 }">▲</view>
          <view class="action-btn down" @tap.stop="moveDown(idx)" :class="{ disabled: idx === favCities.length - 1 }">▼</view>
          <view class="action-btn delete" @tap.stop="removeCity(idx)">✕</view>
        </view>
        <text class="city-arrow" v-else>›</text>
      </view>
    </view>

    <view class="hint" v-if="favCities.length > 0 && !editMode">
      <text>点击城市切换，点击右上角「编辑」调整顺序</text>
    </view>
    <view class="hint" v-if="editMode">
      <text>点击 ▲▼ 调整顺序，点击 ✕ 删除城市</text>
    </view>
  </view>
</template>

<style scoped>
.container {
  padding: var(--spacing-lg);
  min-height: 100vh;
  background: var(--color-bg);
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-paper-border);
}
.top-back {
  font-size: var(--font-size-md);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}
.top-title {
  font-size: var(--font-size-md);
  color: var(--color-ink);
  font-weight: var(--font-weight-bold);
}
.top-action {
  font-size: var(--font-size-md);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
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
.city-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.city-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-md);
  background: var(--color-paper);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-paper-border);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.city-item:active { background: var(--color-primary); }
.city-item:active .city-name { color: #fff; }
.city-item:active .city-arrow { color: #fff; }
.city-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rank-num { font-size: 12px; font-weight: var(--font-weight-bold); color: #fff; }
.city-name { flex: 1; font-size: var(--font-size-md); color: var(--color-ink); font-weight: var(--font-weight-medium); }
.city-actions { display: flex; gap: 6px; flex-shrink: 0; }
.action-btn {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px;
  font-size: 12px;
  font-weight: var(--font-weight-bold);
  background: var(--color-paper);
  border: 1px solid var(--color-paper-border);
  color: var(--color-ink);
}
.action-btn:active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.action-btn.disabled { opacity: 0.3; pointer-events: none; }
.action-btn.delete { color: #E5606E; border-color: rgba(229,96,110,0.2); background: rgba(229,96,110,0.06); }
.action-btn.delete:active { background: #E5606E; color: #fff; }
.city-arrow { font-size: 18px; color: var(--color-ash); font-weight: var(--font-weight-light); }
.hint {
  text-align: center;
  padding: var(--spacing-xl) 0;
  font-size: var(--font-size-xs);
  color: var(--color-ash);
}
</style>