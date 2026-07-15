<script setup lang="ts">
</script>

<template>
  <view class="skeleton-container">
    <view class="card skeleton-current">
      <view class="skeleton-city"><view class="s-block w-24 h-5 br-4"/></view>
      <view class="skeleton-main">
        <view class="s-circle w-14 h-14"/>
        <view class="s-block w-32 h-16 br-8"/>
      </view>
      <view class="s-block w-20 h-5 br-4 mx-auto"/>
      <view class="skeleton-row"><view class="s-block w-12 h-4 br-3"/><view class="s-block w-12 h-4 br-3"/></view>
      <view class="skeleton-row"><view class="s-block w-16 h-4 br-3"/><view class="s-block w-16 h-4 br-3"/></view>
      <view class="skeleton-row"><view class="s-block w-20 h-4 br-3"/></view>
    </view>
    <view class="card skeleton-forecast">
      <view class="s-block w-20 h-5 br-4"/>
      <view class="skeleton-list">
        <view v-for="i in 3" :key="i" class="s-forecast-row">
          <view class="s-block w-10 h-4 br-3"/>
          <view class="s-circle w-7 h-7"/>
          <view class="s-block w-14 h-4 br-3 flex-1"/>
          <view class="flex-row gap-2"><view class="s-block w-8 h-4 br-3"/><view class="s-block w-8 h-4 br-3"/></view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.skeleton-container {
  padding: 16px;
  padding-bottom: 32px;
}

.card {
  background: #fff;
  border-radius: 20px;
  padding: 28px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 12px;
}

.skeleton-current {
  text-align: center;
}

.skeleton-city {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.skeleton-main {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-row {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 10px;
}

.skeleton-forecast .s-block {
  margin-bottom: 16px;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
}

.s-forecast-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.s-forecast-row:last-child {
  border-bottom: none;
}

.s-block {
  background: linear-gradient(90deg, #e8edf2 25%, #d5dce3 50%, #e8edf2 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  border-radius: 4px;
}

.s-circle {
  background: linear-gradient(90deg, #e8edf2 25%, #d5dce3 50%, #e8edf2 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  border-radius: 50%;
}

.mx-auto { margin-left: auto; margin-right: auto; }
.flex-1 { flex: 1; }
.flex-row { display: flex; flex-direction: row; }
.gap-2 { gap: 8px; }

.w-7 { width: 28px; }
.w-8 { width: 32px; }
.w-10 { width: 40px; }
.w-12 { width: 48px; }
.w-14 { width: 56px; }
.w-16 { width: 64px; }
.w-20 { width: 80px; }
.w-24 { width: 96px; }
.w-32 { width: 128px; }

.h-4 { height: 16px; }
.h-5 { height: 20px; }
.h-7 { height: 28px; }
.h-14 { height: 56px; }
.h-16 { height: 64px; }

.br-3 { border-radius: 12px; }
.br-4 { border-radius: 16px; }
.br-8 { border-radius: 32px; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
