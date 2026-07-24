<script setup lang="ts">
import { ref, onMounted } from "vue"

/** 全屏 Leaflet 页面（含顶部 Tab / 底部信息），避免 App 原生子 webview 遮挡 Vue 层 */
const mapSrc = ref("/hybrid/html/leaflet.html")

onMounted(() => {
  // #ifdef H5
  mapSrc.value = "/static/leaflet.html"
  // #endif
  // #ifdef APP-PLUS
  mapSrc.value = "/hybrid/html/leaflet.html"
  // #endif
})
</script>

<template>
  <view class="page">
    <web-view class="wv" :src="mapSrc" />
  </view>
</template>

<style scoped>
.page {
  width: 100%;
  height: 100vh;
  background: #F0F5FA;
}
.wv {
  width: 100%;
  height: 100%;
}
</style>
