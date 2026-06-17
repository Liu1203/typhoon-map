<template>
  <div ref="pickerRef" class="emoji-picker" @click.stop>
    <div class="emoji-grid">
      <button
        v-for="emoji in emojis"
        :key="emoji"
        class="emoji-item"
        @click="emit('select', emoji)"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  select: [emoji: string]
  close: []
}>()

const pickerRef = ref<HTMLElement | null>(null)

function onDocumentClick(e: MouseEvent) {
  if (pickerRef.value && !pickerRef.value.contains(e.target as Node)) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick, true)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick, true)
})

const emojis = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗',
  '😚','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶',
  '😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥴',
  '😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','😮','😯','😲','😳','🥺','😢',
  '😭','😤','😡','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖',
  '👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✌️','🤟','🤘','👌',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖',
  '🔥','⭐','✨','💥','💫','💦','💤','🎉','🎊','🎈','🎁','💯','✅','❌','❓','❗'
]

function handleClickOutside() {
  emit('close')
}
</script>

<style scoped>
.emoji-picker {
  background: #fff;
  border: 1px solid #e8e8ed;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 8px;
  width: 320px;
  max-height: 260px;
  overflow-y: auto;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
}

.emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.15s;
  padding: 0;
}

.emoji-item:hover {
  background: #f0f0f5;
}

.emoji-picker::-webkit-scrollbar {
  width: 4px;
}

.emoji-picker::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}
</style>
