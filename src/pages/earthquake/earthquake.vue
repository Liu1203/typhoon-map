<script setup lang="ts">
import { ref, onMounted } from "vue"

const mapSrc = ref("/hybrid/html/leaflet-quake.html")

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
