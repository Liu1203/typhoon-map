<script setup lang="ts">
import { cityList } from "@/api/weather"

function selectCity(name: string) {
  uni.setStorageSync("selected_city", name)
  uni.navigateBack()
}
</script>

<template>
  <view class="container">
    <text class="title">选择城市</text>
    <view class="city-grid">
      <view v-for="city in cityList" :key="city" class="city-tag" @tap="selectCity(city)">
        <text>{{ city }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.container {
  padding: var(--spacing-lg);
  min-height: 100vh;
  background: var(--color-bg);
}

.title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-ink);
  display: block;
  margin-bottom: var(--spacing-lg);
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
</style>
