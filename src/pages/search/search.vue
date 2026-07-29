<script setup lang="ts">
import { ref, computed } from "vue"
import { cityList } from "@/api/weather"

const query = ref("")

const filteredCities = computed(() => {
  const q = query.value.trim()
  if (!q) return cityList
  return cityList.filter(c => c.includes(q))
})

function selectCity(name: string) {
  uni.setStorageSync("selected_city", name)
  uni.navigateBack()
}
</script>

<template>
  <view class="container">
    <view class="search-box">
      <text class="search-icon">🔍</text>
      <input class="search-input" v-model="query" placeholder="输入城市名称" confirm-type="search" />
      <text v-if="query" class="search-clear" @tap="query = ''">✕</text>
    </view>
    <view class="city-grid" v-if="filteredCities.length > 0">
      <view v-for="city in filteredCities" :key="city" class="city-tag" @tap="selectCity(city)">
        <text>{{ city }}</text>
      </view>
    </view>
    <view v-else class="empty">
      <text class="empty-text">未找到 "{{ query }}" 相关城市</text>
    </view>
  </view>
</template>

<style scoped>
.container {
  padding: var(--spacing-lg);
  min-height: 100vh;
  background: var(--color-bg);
}
.search-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-paper);
  border-radius: var(--radius-full);
  border: 1px solid var(--color-paper-border);
  margin-bottom: var(--spacing-lg);
}
.search-icon {
  font-size: 14px;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  font-size: var(--font-size-md);
  color: var(--color-ink);
  height: 32px;
  line-height: 32px;
}
.search-clear {
  font-size: 14px;
  color: var(--color-ash);
  padding: 4px;
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
.empty {
  display: flex;
  justify-content: center;
  padding: var(--spacing-3xl) 0;
}
.empty-text {
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
}
</style>
