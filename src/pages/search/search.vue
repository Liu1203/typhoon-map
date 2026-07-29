<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { matchCity } from "@/api/weather"
import { CACHE } from "@/config"

const darkMode = ref(false)
const query = ref("")
const favCities = ref<string[]>([])

const FAV_KEY = "fav_cities"

onMounted(() => {
  const stored = uni.getStorageSync(CACHE.DARK_MODE_KEY) as string
  if (stored === "1") darkMode.value = true
  else if (stored === "0") darkMode.value = false
  else {
    const sys = uni.getSystemInfoSync()
    darkMode.value = sys.theme === "dark"
  }
  try {
    const raw = uni.getStorageSync(FAV_KEY) as string
    if (raw) favCities.value = JSON.parse(raw)
  } catch {}
})

const filteredCities = computed(() => {
  const q = query.value
  if (!q) return matchCity("")
  return matchCity(q)
})

function onInput(e: any) {
  query.value = e.detail?.value || e.target?.value || ""
}

function clearQuery() {
  query.value = ""
}

function selectCity(name: string) {
  uni.setStorageSync("selected_city", name)
  uni.navigateBack()
}

function toggleFav(name: string) {
  const idx = favCities.value.indexOf(name)
  if (idx >= 0) favCities.value.splice(idx, 1)
  else favCities.value.push(name)
  uni.setStorageSync(FAV_KEY, JSON.stringify(favCities.value))
}

function isFav(name: string): boolean {
  return favCities.value.includes(name)
}
</script>

<template>
  <view class="container" :class="{ 'dark-mode': darkMode }">
    <view class="search-row">
      <text class="search-icon">🔍</text>
      <input class="search-input" type="text" :value="query" @input="onInput" placeholder="城市名或拼音首字母" confirm-type="search" />
      <text v-if="query" class="search-clear" @tap="clearQuery">✕</text>
    </view>

    <view class="fav-section" v-if="favCities.length > 0 && !query">
      <text class="fav-title">收藏城市</text>
      <view class="fav-list">
        <view v-for="city in favCities" :key="city" class="fav-tag" @tap="selectCity(city)">
          <text>{{ city }}</text>
          <text class="fav-star filled" @tap.stop="toggleFav(city)">★</text>
        </view>
      </view>
    </view>

    <view class="city-grid" v-if="filteredCities.length > 0">
      <view v-for="city in filteredCities" :key="city" class="city-tag" :class="{ isFav: isFav(city) }" @tap="selectCity(city)">
        <text>{{ city }}</text>
        <text class="fav-star" :class="{ filled: isFav(city) }" @tap.stop="toggleFav(city)">{{ isFav(city) ? '★' : '☆' }}</text>
      </view>
    </view>
    <view v-else class="empty-state">
      <text v-if="query" class="empty-text">未找到 "{{ query }}" 相关城市</text>
      <text v-else class="empty-text">输入城市名称搜索</text>
    </view>
  </view>
</template>

<style scoped>
.container {
  padding: var(--spacing-lg);
  min-height: 100vh;
  background: var(--color-bg);
}
.search-row {
  display: flex;
  align-items: center;
  padding: 6px 14px;
  background: var(--color-paper);
  border-radius: var(--radius-full);
  border: 1px solid var(--color-paper-border);
  margin-bottom: var(--spacing-lg);
}
.search-icon {
  font-size: 15px;
  margin-right: 6px;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  font-size: var(--font-size-md);
  color: var(--color-ink);
  height: 34px;
  line-height: 34px;
  background: transparent;
  border: none;
  padding: 0;
  min-width: 0;
}
.search-clear {
  font-size: 16px;
  color: var(--color-ash);
  padding: 4px 2px;
  flex-shrink: 0;
}
.fav-section {
  margin-bottom: var(--spacing-lg);
}
.fav-title {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  letter-spacing: 0.5px;
}
.fav-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
.fav-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: #fff;
  font-weight: var(--font-weight-medium);
}
.fav-tag .fav-star {
  color: #FFD700;
  font-size: 14px;
}
.city-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
.city-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-paper);
  border-radius: var(--radius-full);
  border: 1px solid var(--color-paper-border);
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
}
.city-tag:active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.fav-star {
  font-size: 13px;
  color: var(--color-ash);
  padding: 2px;
  line-height: 1;
}
.fav-star.filled {
  color: #FFD700;
}
.city-tag.isFav {
  border-color: var(--color-gold);
}
.empty-state {
  display: flex;
  justify-content: center;
  padding: var(--spacing-3xl) 0;
}
.empty-text {
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
}
</style>
