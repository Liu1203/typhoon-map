<template>
  <div
    class="user-avatar"
    :class="{ round: round }"
    :style="wrapperStyle"
    @click="$emit('click', $event)"
  >
    <img
      v-if="src"
      :src="src"
      :style="imgStyle"
      @load="loaded = true"
      @error="loaded = false"
    />
    <span v-if="!src || !loaded" class="fallback" :style="textStyle">
      {{ name?.charAt(0) || '?' }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  src?: string
  name?: string
  size?: number
  round?: boolean
  color?: string
}>(), {
  size: 40,
  round: false,
  color: '#6366f1',
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const loaded = ref(!!props.src)

const wrapperStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  backgroundColor: props.color,
}))

const imgStyle = computed(() => ({
  width: '100%',
  height: '100%',
}))

const textStyle = computed(() => ({
  fontSize: `${Math.max(12, props.size * 0.36)}px`,
}))
</script>

<style scoped>
.user-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  vertical-align: middle;
  line-height: 0;
}
.user-avatar.round {
  border-radius: 50%;
}
.user-avatar img {
  display: block;
  object-fit: cover;
}
.fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 500;
  line-height: 1;
  user-select: none;
}
</style>
