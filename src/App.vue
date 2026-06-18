<template>
  <n-config-provider :theme="theme">
    <n-dialog-provider>
      <router-view v-slot="{ Component, route }">
        <transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NConfigProvider, NDialogProvider, darkTheme } from 'naive-ui'
import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()
const theme = computed(() => isDark.value ? darkTheme : null)
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>