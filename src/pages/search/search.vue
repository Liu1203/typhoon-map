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
        <text class="city-name">{{ city }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.container {
  padding: 16px;
}

.city-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.city-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.city-item:last-child {
  border-bottom: none;
}

.city-name {
  font-size: 16px;
  color: #333;
}
</style>
