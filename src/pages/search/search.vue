<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { matchCity, groupCitiesByPinyin, searchCities, setDynamicCity, type GeoCity } from "@/api/weather"
import { loadDarkMode } from "@/utils/theme"

const darkMode = ref(false)
const query = ref("")
const favCities = ref<string[]>([])
const geoResults = ref<GeoCity[]>([])
const geoLoading = ref(false)

const FAV_KEY = "fav_cities"

onMounted(() => {
  darkMode.value = loadDarkMode()
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

const cityGroups = computed(() => groupCitiesByPinyin())
const alphabet = computed(() => Object.keys(cityGroups.value))

let geoDebounce: ReturnType<typeof setTimeout> | null = null

watch(query, (val) => {
  if (geoDebounce) clearTimeout(geoDebounce)
  if (!val || val.length < 1) { geoResults.value = []; return }
  geoDebounce = setTimeout(async () => {
    geoLoading.value = true
    geoResults.value = await searchCities(val)
    geoLoading.value = false
  }, 400)
})

function onInput(e: any) {
  query.value = e.detail?.value || e.target?.value || ""
}

function clearQuery() {
  query.value = ""
  geoResults.value = []
}

function selectCity(name: string) {
  const geo = geoResults.value.find(g => g.name === name)
  if (geo) setDynamicCity(geo.name, geo.lat, geo.lon)
  uni.setStorageSync("selected_city", name)
  uni.navigateBack()
}

function selectGeoCity(city: GeoCity) {
  setDynamicCity(city.name, city.lat, city.lon)
  uni.setStorageSync("selected_city", city.name)
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

function scrollToLetter(letter: string) {
  const el = uni.createSelectorQuery().select("#section-" + letter)
  if (el) {
    uni.pageScrollTo({ selector: "#section-" + letter, duration: 200 })
  }
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

    <view class="city-grid" v-if="query && filteredCities.length > 0">
      <view v-for="city in filteredCities" :key="city" class="city-tag" :class="{ isFav: isFav(city) }" @tap="selectCity(city)">
        <text>{{ city }}</text>
        <text class="fav-star" :class="{ filled: isFav(city) }" @tap.stop="toggleFav(city)">{{ isFav(city) ? '★' : '☆' }}</text>
      </view>
    </view>

    <view class="geo-section" v-if="query && geoResults.length > 0">
      <text class="geo-title" v-if="filteredCities.length > 0">更多搜索结果</text>
      <view v-for="city in geoResults" :key="city.name + city.lat" class="geo-item" @tap="selectGeoCity(city)">
        <view class="geo-name-row">
          <text class="geo-name">{{ city.name }}</text>
          <text class="geo-region" v-if="city.admin1 || city.country">{{ city.admin1 ? city.admin1 + ', ' : '' }}{{ city.country }}</text>
        </view>
        <text class="geo-arrow">›</text>
      </view>
    </view>

    <view class="geo-loading" v-if="query && geoLoading && geoResults.length === 0 && filteredCities.length === 0">
      <text class="empty-text">搜索中...</text>
    </view>

    <scroll-view class="city-sections" scroll-y :scroll-into-view="''" v-else-if="!query && alphabet.length > 0">
      <view v-for="letter in alphabet" :key="letter" :id="'section-' + letter" class="city-section">
        <text class="section-letter">{{ letter }}</text>
        <view class="section-cities">
          <view v-for="city in cityGroups[letter]" :key="city" class="section-city" @tap="selectCity(city)">
            <text>{{ city }}</text>
            <text class="fav-star" :class="{ filled: isFav(city) }" @tap.stop="toggleFav(city)">{{ isFav(city) ? '★' : '☆' }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="query && filteredCities.length === 0 && geoResults.length === 0 && !geoLoading" class="empty-state">
      <text class="empty-text">未找到 "{{ query }}" 相关城市</text>
    </view>

    <view v-if="!query && alphabet.length > 0" class="alphabet-sidebar">
      <view v-for="letter in alphabet" :key="letter" class="alpha-item" @tap="scrollToLetter(letter)">{{ letter }}</view>
    </view>
  </view>
</template>

<style scoped>
.container {
  padding: var(--spacing-lg);
  min-height: 100vh;
  background: var(--color-bg);
  position: relative;
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
.city-sections {
  height: calc(100vh - 150px);
  padding-bottom: var(--spacing-4xl);
}
.city-section {
  margin-bottom: var(--spacing-md);
}
.section-letter {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}
.section-cities {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
.section-city {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-paper);
  border-radius: var(--radius-full);
  border: 1px solid var(--color-paper-border);
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  font-weight: var(--font-weight-medium);
}
.section-city:active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.section-city:active .fav-star {
  color: #fff;
}
.alphabet-sidebar {
  position: fixed;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  z-index: 10;
  pointer-events: none;
}
.alpha-item {
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  width: 20px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  border-radius: 4px;
}
.alpha-item:active {
  background: var(--color-primary);
  color: #fff;
}
.geo-section {
  margin-top: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}
.geo-title {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  letter-spacing: 0.5px;
}
.geo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-md);
  background: var(--color-paper);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-paper-border);
  margin-bottom: var(--spacing-xs);
}
.geo-item:active {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.geo-item:active .geo-name,
.geo-item:active .geo-region,
.geo-item:active .geo-arrow {
  color: #fff;
}
.geo-name-row {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.geo-name {
  font-size: var(--font-size-md);
  color: var(--color-ink);
  font-weight: var(--font-weight-medium);
}
.geo-region {
  font-size: 10px;
  color: var(--color-ink-light);
}
.geo-arrow {
  font-size: 18px;
  color: var(--color-ash);
  font-weight: var(--font-weight-light);
}
.geo-loading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-2xl) 0;
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
