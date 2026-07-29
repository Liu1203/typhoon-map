<script setup lang="ts">
import { ref, computed } from "vue"
import { cityList } from "@/api/weather"

const query = ref("")

const filteredCities = computed(() => {
  const q = query.value
  if (!q) return cityList
  return cityList.filter(c => c.includes(q))
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
</script>

<template>
  <view class="container">
    <view class="search-row">
      <text class="search-icon">🔍</text>
      <input class="search-input" type="text" :value="query" @input="onInput" placeholder="输入城市名称" confirm-type="search" />
      <text v-if="query" class="search-clear" @tap="clearQuery">✕</text>
    </view>
    <view class="city-grid" v-if="filteredCities.length > 0">
      <view v-for="city in filteredCities" :key="city" class="city-tag" @tap="selectCity(city)">
        <text>{{ city }}</text>
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
.city-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
.city-tag {
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
