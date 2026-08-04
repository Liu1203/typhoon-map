<script setup lang="ts">
import { ref, onMounted } from "vue"
import { getCityCoords } from "@/api/weather"
import { loadDarkMode } from "@/utils/theme"

const mapSrc = ref("/hybrid/html/leaflet-radar.html")
const loaded = ref(false)
const failed = ref(false)

onMounted(() => {
  // #ifdef H5
  mapSrc.value = "/static/leaflet-radar.html"
  // #endif
  // #ifdef APP-PLUS
  mapSrc.value = "/hybrid/html/leaflet-radar.html"
  // #endif
  const params: string[] = []
  const city = (uni.getStorageSync("selected_city") as string) || "北京"
  const coords = getCityCoords(city)
  if (coords) {
    params.push("lat=" + coords.lat.toFixed(4), "lon=" + coords.lon.toFixed(4), "name=" + encodeURIComponent(city))
  }
  params.push("dark=" + (loadDarkMode() ? "1" : "0"))
  mapSrc.value += "?" + params.join("&")
})

function onWebViewError() {
  failed.value = true
  loaded.value = true
}

function retry() {
  failed.value = false
  loaded.value = false
  const s = mapSrc.value
  mapSrc.value = ""
  setTimeout(() => { mapSrc.value = s }, 50)
}
</script>

<template>
  <view class="page">
    <view class="loading-overlay" v-if="!loaded && !failed">
      <view class="spinner" />
      <text class="loading-text">加载雷达地图...</text>
    </view>
    <view class="error-overlay" v-if="failed">
      <text class="error-icon">🌧</text>
      <text class="error-text">加载失败</text>
      <view class="retry-btn" @tap="retry">
        <text>重新加载</text>
      </view>
    </view>
    <web-view class="wv" :src="mapSrc" @load="loaded = true" @error="onWebViewError" />
  </view>
</template>

<style scoped>
.page {
  width: 100%;
  height: 100vh;
  background: #F0F5FA;
  position: relative;
}
.wv {
  width: 100%;
  height: 100%;
}
.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #F0F5FA;
  color: #5A6E80;
  font-size: 13px;
}
.spinner {
  width: 34px;
  height: 34px;
  border: 3px solid rgba(91,143,192,.2);
  border-top-color: #5B8FC0;
  border-radius: 50%;
  animation: spin .75s linear infinite;
}
.loading-text {
  font-size: 14px;
  color: #8B9CAD;
}
.error-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #F0F5FA;
}
.error-icon {
  font-size: 48px;
  opacity: 0.5;
}
.error-text {
  font-size: 16px;
  color: #8B9CAD;
}
.retry-btn {
  background: #5B8FC0;
  border-radius: 20px;
  padding: 10px 32px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  transition: opacity .15s;
}
.retry-btn:active { opacity: .75; }
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
