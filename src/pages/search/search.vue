<script setup lang="ts">
import { cityList } from "@/api/weather"

function selectCity(name: string) {
  uni.setStorageSync("selected_city", name)
  uni.navigateBack()
}
</script>

<template>
  <view class="container">
    <view class="city-list">
      <view v-for="city in cityList" :key="city" class="city-item" @tap="selectCity(city)">
        <text class="city-pin">{{ city }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.container {
  padding: var(--spacing-md);
  min-height: 100vh;
  background: var(--color-bg);
}

.city-list {
  background: var(--color-paper);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-paper-border);
}

.city-item {
  padding: var(--spacing-md) var(--spacing-xl);
  border-bottom: 1px solid var(--color-paper-border);
  transition: background var(--transition-fast);
}

.city-item:last-child {
  border-bottom: none;
}

.city-item:active {
  background: var(--color-paper-dark);
}

.city-pin {
  font-size: var(--font-size-md);
  color: var(--color-ink);
  font-weight: var(--font-weight-medium);
}
</style>
