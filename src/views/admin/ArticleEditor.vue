<template>
  <div class="editor-page">
    <AppHeader />

    <main class="editor-main">
      <div class="editor-container">
        <div class="page-header">
          <div class="header-left">
            <router-link to="/admin" class="back-link">← 返回管理</router-link>
            <h1 class="page-title">{{ isEdit ? '✏️ 编辑文章' : '📝 新建文章' }}</h1>
          </div>
          <div class="header-actions">
            <n-button @click="router.push('/admin')">取消</n-button>
            <n-button :loading="savingDraft" @click="handleSave('draft')">
              {{ savingDraft ? '保存中...' : '保存草稿' }}
            </n-button>
            <n-button type="primary" :loading="publishing" @click="handleSave('published')">
              {{ publishing ? '发布中...' : '发布文章' }}
            </n-button>
          </div>
        </div>

        <div class="editor-body">
          <div class="form-section">
            <div class="field">
              <label class="field-label">标题</label>
              <n-input
                v-model:value="form.title"
                placeholder="输入文章标题..."
                size="large"
                :maxlength="100"
                show-count
              />
            </div>

            <div class="field-row">
              <div class="field">
                <label class="field-label">分类</label>
                <n-input
                  v-model:value="form.category"
                  placeholder="Vue、TypeScript、CSS..."
                />
              </div>
              <div class="field">
                <label class="field-label">分类颜色</label>
                <div class="color-picker-wrapper">
                  <n-color-picker
                    v-model:value="form.categoryColor"
                    :modes="['hex']"
                    size="small"
                    show-alpha
                  />
                </div>
              </div>
              <div class="field">
                <label class="field-label">日期</label>
                <n-date-picker
                  v-model:formatted-value="form.date"
                  type="date"
                  size="small"
                  style="width: 100%"
                  :is-date-disabled="() => false"
                  value-format="yyyy-MM-dd"
                />
              </div>
              <div class="field">
                <label class="field-label">状态</label>
                <n-tag :type="form.status === 'published' ? 'success' : 'warning'" :bordered="false">
                  {{ form.status === 'published' ? '已发布' : '草稿' }}
                </n-tag>
              </div>
            </div>

            <div class="field">
              <label class="field-label">标签</label>
              <div class="tags-input">
                <n-dynamic-tags v-model:value="tagsList" />
              </div>
              <span class="field-hint">点击回车添加标签</span>
            </div>
          </div>

          <div class="editor-section">
            <div class="editor-toolbar">
              <span class="toolbar-label">Markdown 编辑器</span>
              <span class="toolbar-hint">支持实时预览</span>
            </div>
            <div class="editor-area">
              <div class="editor-pane">
                <textarea
                  v-model="form.content"
                  placeholder="在这里写文章内容...&#10;&#10;支持 Markdown 语法：&#10;# 标题&#10;**加粗** *斜体*&#10;- 列表&#10;> 引用&#10;```代码块```"
                  class="markdown-textarea"
                  ref="textareaRef"
                  @input="handleTab"
                  @scroll="syncScroll"
                ></textarea>
              </div>
              <div class="preview-pane" ref="previewRef">
                <div v-if="form.content" class="preview-content article-body" v-html="rendered"></div>
                <div v-else class="preview-placeholder">
                  <p>📝 开始输入内容...</p>
                  <p>右侧将实时显示 Markdown 渲染效果</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="editor-footer">
      <p>© {{ new Date().getFullYear() }} My Blog Admin</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NInput, NButton, NColorPicker, NDatePicker, NDynamicTags, NTag } from 'naive-ui'
import MarkdownIt from 'markdown-it'
import AppHeader from '@/components/AppHeader.vue'
import { message } from '@/utils/message'
import { getAdminArticle, createArticle, updateArticle } from '@/api/admin'
import { sanitizeHtml } from '@/utils/sanitize'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const textareaRef = ref<HTMLTextAreaElement>()
const previewRef = ref<HTMLDivElement>()
const savingDraft = ref(false)
const publishing = ref(false)

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

const rendered = computed(() => sanitizeHtml(md.render(form.value.content || '')))

const tagsList = ref<string[]>([])
const form = ref({
  title: '',
  content: '',
  category: '',
  categoryColor: '#6366f1',
  date: new Date().toISOString().split('T')[0],
  status: 'draft' as 'draft' | 'published',
})

onMounted(async () => {
  if (isEdit.value) {
    try {
      const article = await getAdminArticle(Number(route.params.id))
      form.value.title = article.title
      form.value.content = article.content
      form.value.category = article.category
      form.value.categoryColor = article.categoryColor || '#6366f1'
      form.value.date = article.date
      form.value.status = article.status || 'published'
      tagsList.value = [...article.tags]
    } catch {
      message.error('加载文章失败')
      router.push('/admin')
    }
  }
})

function handleTab(e: Event) {
  const ta = e.target as HTMLTextAreaElement
  if (ta.value.endsWith('\t')) {
    e.preventDefault()
    const start = ta.selectionStart
    const end = ta.selectionEnd
    form.value.content = form.value.content.substring(0, start) + '  ' + form.value.content.substring(end)
  }
}

function syncScroll() {
  // placeholder for future sync scroll implementation
}

async function handleSave(status: 'draft' | 'published') {
  if (status === 'published' && !form.value.title.trim()) {
    message.warning('请输入文章标题')
    return
  }
  if (status === 'published' && !form.value.content.trim()) {
    message.warning('请输入文章内容')
    return
  }

  if (status === 'draft') {
    savingDraft.value = true
  } else {
    publishing.value = true
  }
  try {
    const params = {
      ...form.value,
      status,
      tags: tagsList.value,
    }
    if (isEdit.value) {
      await updateArticle(Number(route.params.id), params)
      message.success(status === 'published' ? '文章发布成功' : '草稿保存成功')
    } else {
      await createArticle(params)
      message.success(status === 'published' ? '文章发布成功' : '草稿保存成功')
    }
    router.push('/admin')
  } catch (e: any) {
    message.error(e?.message || '保存失败')
  } finally {
    savingDraft.value = false
    publishing.value = false
  }
}
</script>

<style scoped lang="scss">
$primary: #6366f1;

.editor-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-page);
}

.editor-main {
  flex: 1;
  padding: 32px 24px;
}

.editor-container {
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.back-link {
  font-size: 13px;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: $primary;
  }
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.editor-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: var(--color-bg-card);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--color-border);
}

.field {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.field-hint {
  display: block;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 6px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 140px 180px 100px;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.color-picker-wrapper {
  :deep(.n-color-picker) {
    width: 100%;
  }
}

.tags-input {
  :deep(.n-dynamic-tags) {
    --n-tag-border-radius: 16px;
  }
}

.editor-section {
  background: var(--color-bg-card);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-page);
}

.toolbar-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.toolbar-hint {
  font-size: 12px;
  color: var(--color-text-muted);
}

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 500px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    min-height: 300px;
  }
}

.editor-pane {
  border-right: 1px solid var(--color-border);
}

.markdown-textarea {
  width: 100%;
  height: 100%;
  min-height: 500px;
  padding: 20px;
  border: none;
  outline: none;
  resize: none;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 14px;
  line-height: 1.7;
  background: var(--color-bg-card);
  color: var(--color-text-primary);

  &::placeholder {
    color: var(--color-text-muted);
  }
}

.preview-pane {
  overflow-y: auto;
  max-height: 600px;
  padding: 20px;
  background: var(--color-bg-card);
}

.preview-content {
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-text-primary);
  word-break: break-word;

  :deep(h1) {
    font-size: 24px;
    font-weight: 700;
    margin: 24px 0 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--color-border);
  }

  :deep(h2) {
    font-size: 20px;
    font-weight: 600;
    margin: 20px 0 12px;
  }

  :deep(h3) {
    font-size: 17px;
    font-weight: 600;
    margin: 16px 0 10px;
  }

  :deep(p) {
    margin: 0 0 12px;
  }

  :deep(ul), :deep(ol) {
    padding-left: 24px;
    margin: 0 0 12px;
  }

  :deep(li) {
    margin-bottom: 4px;
  }

  :deep(blockquote) {
    margin: 0 0 12px;
    padding: 12px 20px;
    border-left: 4px solid $primary;
    background: rgba($primary, 0.05);
    border-radius: 0 8px 8px 0;
    color: var(--color-text-secondary);
  }

  :deep(code) {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
    background: var(--color-bg-page);
    color: $primary;
    font-family: 'JetBrains Mono', monospace;
  }

  :deep(pre) {
    margin: 0 0 16px;
    padding: 16px 20px;
    border-radius: 8px;
    overflow-x: auto;
    background: var(--color-bg-page);
    border: 1px solid var(--color-border);

    code {
      padding: 0;
      background: none;
      color: var(--color-text-primary);
    }
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 16px;
  }

  :deep(th), :deep(td) {
    padding: 10px 14px;
    border: 1px solid var(--color-border);
    text-align: left;
  }

  :deep(th) {
    font-weight: 600;
    background: var(--color-bg-page);
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 8px;
  }

  :deep(a) {
    color: $primary;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  color: var(--color-text-muted);
  text-align: center;

  p {
    margin: 4px 0;
    font-size: 14px;

    &:first-child {
      font-size: 32px;
      margin-bottom: 8px;
    }
  }
}

.editor-footer {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: var(--color-text-muted);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-card);
}
</style>
