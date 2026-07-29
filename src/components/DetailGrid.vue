<script setup lang="ts">
import { uvLabel } from "@/utils/weather"
import type { CurrentWeather } from "@/api/weather"

defineProps<{
  weather: CurrentWeather
}>()
</script>

<template>
  <view class="detail-grid anim-fade-in-up" style="animation-delay: 0.1s">
    <view class="detail-item">
      <text class="detail-label">体感</text>
      <text class="detail-value">{{ weather.feelsLike }}°</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">湿度</text>
      <text class="detail-value">{{ weather.humidity }}%</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">{{ weather.windDir }}</text>
      <text class="detail-value">{{ weather.windLevel }}</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">紫外线</text>
      <text class="detail-value">{{ weather.uvIndex }} {{ uvLabel(weather.uvIndex) }}</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">日出</text>
      <text class="detail-value">{{ weather.sunrise }}</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">日落</text>
      <text class="detail-value">{{ weather.sunset }}</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">气压</text>
      <text class="detail-value">{{ weather.pressure }}</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">能见度</text>
      <text class="detail-value">{{ weather.visibility }}</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">露点</text>
      <text class="detail-value">{{ weather.dewPoint }}</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">云量</text>
      <text class="detail-value">{{ weather.cloudCover }}</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">阵风</text>
      <text class="detail-value">{{ weather.windGust }}</text>
    </view>
    <view class="detail-item" v-if="weather.aqi !== '--'">
      <text class="detail-label">空气质量</text>
      <text class="detail-value">{{ weather.aqi }} {{ weather.aqiLabel }}</text>
    </view>
  </view>
</template>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}
.detail-item {
  background: rgba(255,255,255,0.2);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-sm);
  text-align: center;
  border: 1px solid rgba(255,255,255,0.1);
}
.detail-label {
  display: block;
  font-size: var(--font-size-xs);
  color: rgba(255,255,255,0.65);
  margin-bottom: 2px;
}
.detail-value {
  display: block;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: #fff;
}
</style>
