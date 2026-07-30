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
    <view class="detail-item" :class="{ 'uv-warning': parseInt(weather.uvIndex) >= 7 }">
      <text class="detail-label">紫外线</text>
      <text class="detail-value">{{ weather.uvIndex }} {{ uvLabel(weather.uvIndex) }}</text>
      <text class="uv-badge" v-if="parseInt(weather.uvIndex) >= 7">⚠ 注意防护</text>
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
  <view class="aqi-detail" v-if="weather.aqiDetail && (weather.aqiDetail.pm25 || weather.aqiDetail.pm10)">
    <view class="aqi-chip" v-if="weather.aqiDetail.pm25"><text class="aqi-label">PM2.5</text><text class="aqi-val">{{ weather.aqiDetail.pm25 }}</text></view>
    <view class="aqi-chip" v-if="weather.aqiDetail.pm10"><text class="aqi-label">PM10</text><text class="aqi-val">{{ weather.aqiDetail.pm10 }}</text></view>
    <view class="aqi-chip" v-if="weather.aqiDetail.no2"><text class="aqi-label">NO₂</text><text class="aqi-val">{{ weather.aqiDetail.no2 }}</text></view>
    <view class="aqi-chip" v-if="weather.aqiDetail.o3"><text class="aqi-label">O₃</text><text class="aqi-val">{{ weather.aqiDetail.o3 }}</text></view>
    <view class="aqi-chip" v-if="weather.aqiDetail.so2"><text class="aqi-label">SO₂</text><text class="aqi-val">{{ weather.aqiDetail.so2 }}</text></view>
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
.aqi-detail {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
  justify-content: center;
}
.aqi-chip {
  background: rgba(255,255,255,0.15);
  border-radius: var(--radius-sm);
  padding: 2px 10px;
  display: flex;
  gap: 4px;
  align-items: center;
  border: 1px solid rgba(255,255,255,0.08);
}
.aqi-label {
  font-size: 10px;
  color: rgba(255,255,255,0.65);
}
.aqi-val {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: #fff;
}
.uv-warning {
  background: rgba(240, 100, 50, 0.25) !important;
  border-color: rgba(240, 100, 50, 0.4) !important;
}
.uv-badge {
  display: block;
  font-size: 9px;
  color: rgba(255, 200, 50, 1);
  font-weight: var(--font-weight-bold);
  margin-top: 2px;
}
</style>
