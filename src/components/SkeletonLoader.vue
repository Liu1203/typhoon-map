<script setup lang="ts">
</script>

<template>
  <view class="skeleton-container">
    <view class="skeleton-header">
      <view class="s-block w-24 h-6 br-md" />
      <view class="s-circle w-8 h-8" />
    </view>
    <view class="skeleton-hero">
      <view class="s-block w-40 h-24 br-xl" />
      <view class="s-block w-16 h-6 br-md" />
      <view class="flex-row gap-md">
        <view class="s-block w-12 h-5 br-md" />
        <view class="s-block w-12 h-5 br-md" />
      </view>
    </view>
    <view class="skeleton-grid">
      <view v-for="i in 6" :key="i" class="skeleton-grid-item">
        <view class="s-block w-full h-16 br-lg" />
      </view>
    </view>
    <view class="card skeleton-card">
      <view class="s-block w-16 h-5 br-md" style="margin-bottom: 16px" />
      <view class="skeleton-list">
        <view v-for="i in 3" :key="i" class="s-forecast-row">
          <view class="s-block w-10 h-4 br-sm" />
          <view class="s-circle w-7 h-7" />
          <view class="s-block w-14 h-4 br-sm flex-1" />
          <view class="flex-row gap-sm">
            <view class="s-block w-8 h-4 br-sm" />
            <view class="s-block w-8 h-4 br-sm" />
          </view>
        </view>
      </view>
    </view>
    <view class="card skeleton-card">
      <view class="s-block w-16 h-5 br-md" style="margin-bottom: 16px" />
      <view class="flex-row gap-sm">
        <view v-for="i in 5" :key="i" class="skeleton-hourly-item">
          <view class="s-block w-8 h-4 br-sm" />
          <view class="s-circle w-6 h-6" />
          <view class="s-block w-8 h-5 br-sm" />
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.skeleton-container {
  padding: var(--spacing-lg);
  padding-bottom: calc(32px + var(--safe-area-bottom));
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-3xl);
}

.skeleton-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-2xl);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.skeleton-grid-item {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.card {
  background: rgba(255,255,255,0.92);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-md);
}

.skeleton-list {
  display: flex;
  flex-direction: column;
}

.s-forecast-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-paper-border);
}

.s-forecast-row:last-child { border-bottom: none; }

.skeleton-hourly-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  min-width: 68px;
  padding: var(--spacing-sm) 6px;
  border-radius: var(--radius-md);
  background: rgba(240,234,216,0.5);
}

.s-block {
  background: linear-gradient(90deg, var(--color-paper-dark) 25%, var(--color-paper-border) 50%, var(--color-paper-dark) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

.s-circle {
  background: linear-gradient(90deg, var(--color-paper-dark) 25%, var(--color-paper-border) 50%, var(--color-paper-dark) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  border-radius: 50%;
}

.flex-1 { flex: 1; }
.flex-row { display: flex; flex-direction: row; }
.gap-sm { gap: var(--spacing-sm); }
.gap-md { gap: var(--spacing-md); }

.w-6 { width: 24px; }
.w-7 { width: 28px; }
.w-8 { width: 32px; }
.w-10 { width: 40px; }
.w-12 { width: 48px; }
.w-14 { width: 56px; }
.w-16 { width: 64px; }
.w-24 { width: 96px; }
.w-40 { width: 160px; }
.w-full { width: 100%; }

.h-4 { height: 16px; }
.h-5 { height: 20px; }
.h-6 { height: 24px; }
.h-7 { height: 28px; }
.h-8 { height: 32px; }
.h-16 { height: 64px; }
.h-24 { height: 96px; }

.br-sm { border-radius: var(--radius-sm); }
.br-md { border-radius: var(--radius-md); }
.br-lg { border-radius: var(--radius-lg); }
.br-xl { border-radius: var(--radius-xl); }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
