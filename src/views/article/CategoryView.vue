<template>
  <div class="category-page">
    <AppHeader />
    <main class="page-main">
      <h1>分类</h1>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
</script>

<style scoped lang="scss">
.category-page {
  min-height: 100vh;
  background: #f8f9fb;
}

.page-main {
  max-width: 760px;
  margin: 0 auto;
  padding: 48px 24px;
}

h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
}
</style>
