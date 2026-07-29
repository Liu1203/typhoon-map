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

<style scoped>
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.bar {
  background: var(--color-paper);
  border-bottom: 1px solid var(--color-paper-border);
  max-height: 50vh;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.bar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  gap: var(--spacing-sm);
}

.bar-sub {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--spacing-lg) var(--spacing-sm);
}

.region-tabs {
  display: flex;
  gap: 0;
  border-radius: var(--radius-sm);
  background: var(--color-paper-dark);
  padding: 2px;
}

.region-tab {
  padding: 6px 14px;
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.region-tab.active {
  background: var(--color-primary);
  color: #fff;
  font-weight: var(--font-weight-semibold);
  box-shadow: 0 2px 6px rgba(91,143,192,0.3);
}

.date-picker {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  padding: 6px 12px;
  background: var(--color-paper-dark);
  border-radius: var(--radius-sm);
}

.date-arrow { font-size: 10px; }

.bar-count {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
}

.bar-count-num {
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
}

.bar-count-src {
  color: var(--color-ash);
  font-size: 10px;
}

.bar-loading {
  opacity: 0.6;
}

.bar-toggle {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
}

.quake-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--spacing-lg) var(--spacing-sm);
}

.quake-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-paper-border);
  transition: background var(--transition-fast);
}

.quake-item.active {
  background: rgba(91,143,192,0.06);
  margin: 0 calc(-1 * var(--spacing-lg));
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-sm);
}

.quake-rank {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quake-rank-text {
  color: #fff;
  font-size: 10px;
  font-weight: var(--font-weight-bold);
}

.quake-mag-tag {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: var(--font-weight-bold);
}

.quake-mag-num {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}

.quake-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.quake-place {
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quake-meta {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
}

.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--color-bg);
}

.map-message {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  color: var(--color-ink-soft);
  font-size: var(--font-size-sm);
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(2px);
}

.map-msg-icon {
  font-size: 40px;
}

.map-msg-hint {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  margin-top: var(--spacing-xs);
}

.fetching-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-paper-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.info-card {
  background: var(--color-paper);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-paper-border);
  flex-shrink: 0;
}

.info-top {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.info-mag-wrap {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-mag-num {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: #fff;
  line-height: 1;
}

.info-mag-label {
  font-size: 10px;
  color: rgba(255,255,255,0.8);
}

.info-top-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-time-full {
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  font-weight: var(--font-weight-semibold);
}

.info-coords {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
}

.info-place {
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-sm);
}

.info-bottom {
  display: flex;
  gap: var(--spacing-2xl);
}

.info-stat {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.info-stat-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-ink);
}

.info-stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-ash);
}
</style>
