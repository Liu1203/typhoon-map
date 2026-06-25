<template>
  <nav v-if="headings.length > 0" class="article-toc">
    <div class="toc-title">目录</div>
    <ul class="toc-list">
      <li
        v-for="heading in headings"
        :key="heading.id"
        class="toc-item"
        :class="[`toc-level-${heading.level}`, { active: activeId === heading.id }]"
      >
        <a :href="`#${heading.id}`" @click.prevent="scrollTo(heading.id)">
          {{ heading.text }}
        </a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { sanitizeHtml } from '@/utils/sanitize'

const props = defineProps<{
  content: string
}>()

interface Heading {
  id: string
  text: string
  level: number
}

const headings = ref<Heading[]>([])
const activeId = ref('')

function parseHeadings() {
  const div = document.createElement('div')
  div.innerHTML = sanitizeHtml(props.content)
  const result: Heading[] = []
  div.querySelectorAll('h1, h2, h3').forEach(el => {
    const id = el.getAttribute('id') || el.textContent?.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '') || ''
    result.push({
      id,
      text: el.textContent?.trim() || '',
      level: parseInt(el.tagName.charAt(1)),
    })
  })
  headings.value = result
}

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

let observer: IntersectionObserver | null = null

function setupObserver() {
  observer?.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      const intersecting = entries.filter(e => e.isIntersecting)
      if (intersecting.length > 0) {
        activeId.value = intersecting[0]!.target.id
      }
    },
    { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
  )
  headings.value.forEach(h => {
    const el = document.getElementById(h.id)
    if (el) observer!.observe(el)
  })
}

onMounted(() => {
  parseHeadings()
  setTimeout(setupObserver, 500)
})

watch(() => props.content, () => {
  parseHeadings()
  setTimeout(setupObserver, 500)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped lang="scss">
$primary: #6366f1;

.article-toc {
  position: sticky;
  top: 84px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  padding: 16px 0;

  &::-webkit-scrollbar {
    width: 0;
  }
}

.toc-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border-left: 2px solid var(--color-border);
}

.toc-item {
  a {
    display: block;
    padding: 4px 0 4px 16px;
    font-size: 13px;
    color: var(--color-text-muted);
    text-decoration: none;
    border-left: 2px solid transparent;
    margin-left: -2px;
    transition: all 0.2s;
    line-height: 1.5;

    &:hover {
      color: var(--color-text-secondary);
    }
  }

  &.active a {
    color: $primary;
    border-left-color: $primary;
    font-weight: 500;
  }

  &.toc-level-3 a {
    padding-left: 32px;
    font-size: 12px;
  }
}
</style>
