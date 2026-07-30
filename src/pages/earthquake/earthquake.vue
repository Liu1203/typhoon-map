<script setup lang="ts">
import { ref, onMounted } from "vue"

const mapSrc = ref("/hybrid/html/leaflet-quake.html")
const loaded = ref(false)

onMounted(() => {
  // #ifdef H5
  mapSrc.value = "/static/leaflet-quake.html"
  // #endif
  // #ifdef APP-PLUS
  mapSrc.value = "/hybrid/html/leaflet-quake.html"
  // #endif
})
</script>

<template>
  <view class="page">
    <view class="loading-overlay" v-if="!loaded">
      <view class="spinner" />
      <text class="loading-text">加载地震数据...</text>
    </view>
    <web-view class="wv" :src="mapSrc" @load="loaded = true" />
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
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
