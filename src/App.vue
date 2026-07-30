<template><view></view></template>

<script setup lang="ts">
import { onError } from "@dcloudio/uni-app"

onError((err) => {
  console.error("[App Error]", err)
  uni.showToast({ title: "出现异常，请稍后重试", icon: "none", duration: 3000 })
})
</script>

<style>
@import "@/styles/variables.css";
@import "@/styles/animations.css";

page {
  background-color: var(--color-bg);
  font-family: var(--font-family-base);
  color: var(--color-ink);
  height: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background-color: var(--color-bg);
}

view, text, scroll-view {
  box-sizing: border-box;
}
</style>
