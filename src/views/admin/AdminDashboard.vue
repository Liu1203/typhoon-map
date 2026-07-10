<template>
  <div class="admin-page">
    <AppHeader />

    <main class="admin-main">
      <div class="admin-container">
        <div class="page-header">
          <div class="header-left">
            <router-link to="/home" class="back-link">← 返回首页</router-link>
            <div class="title-row">
              <h1 class="page-title">📋 文章管理</h1>
              <router-link to="/admin/users" class="sub-link">👥 用户管理</router-link>
            </div>
          </div>
          <n-button type="primary" @click="router.push('/admin/editor')">
            + 新建文章
          </n-button>
        </div>

        <div v-if="errorMsg" class="error-banner">
          <p>{{ errorMsg }}</p>
          <n-button type="primary" size="small" @click="router.push('/home')">返回首页</n-button>
        </div>

        <div class="stats-row">
          <div class="stat-card">
              <span class="stat-value">{{ totalCount }}</span>
            <span class="stat-label">文章总数</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ categoryCount }}</span>
            <span class="stat-label">当前页分类数</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ tagCount }}</span>
            <span class="stat-label">当前页标签数</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ publishedCount }}</span>
            <span class="stat-label">当前页已发布</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ draftCount }}</span>
            <span class="stat-label">当前页草稿</span>
          </div>
        </div>

        <div class="table-card">
          <n-data-table
            :columns="columns"
            :data="articles"
            :bordered="false"
            :single-line="false"
            :remote="true"
            :pagination="pagination"
            :loading="loading"
            :row-key="(row: ArticleDetail) => row.id"
            striped
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
          <div v-if="articles.length === 0 && !loading" class="empty-state">
            <n-empty description="暂无文章" />
          </div>
        </div>
      </div>
    </main>

    <footer class="admin-footer">
      <p>© {{ new Date().getFullYear() }} My Blog Admin</p>
    </footer>

    <n-modal
      v-model:show="showDeleteModal"
      preset="dialog"
      type="error"
      title="确认删除"
      :content="`确定要删除「${deleteTarget?.title}」吗？此操作不可撤销。`"
      positive-text="删除"
      negative-text="取消"
      :loading="deleting"
      @positive-click="doDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NDataTable, NEmpty, NModal, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import AppHeader from '@/components/AppHeader.vue'
import { message } from '@/utils/message'
import type { ArticleDetail } from '@/api/article'
import { getAdminArticles, deleteArticle } from '@/api/admin'

const router = useRouter()
const articles = ref<ArticleDetail[]>([])
const loading = ref(true)
const errorMsg = ref('')
const showDeleteModal = ref(false)
const deleteTarget = ref<ArticleDetail | null>(null)
const deleting = ref(false)

const pagination = reactive({
  pageSize: 10,
  pageCount: 0,
  pageSizes: [10, 20, 50],
  showSizePicker: true,
})

const totalCount = ref(0)

const categoryCount = computed(() => {
  const cats = new Set(articles.value.map(a => a.category))
  return cats.size
})

const tagCount = computed(() => {
  const tags = new Set(articles.value.flatMap(a => a.tags))
  return tags.size
})

const publishedCount = computed(() => articles.value.filter(a => a.status !== 'draft').length)
const draftCount = computed(() => articles.value.filter(a => a.status === 'draft').length)

const columns: DataTableColumns<ArticleDetail> = [
  { title: 'ID', key: 'id', width: 60 },
  {
    title: '标题',
    key: 'title',
    ellipsis: { tooltip: true },
  },
  {
    title: '分类',
    key: 'category',
    width: 120,
    render(row) {
      return h(NTag, {
        size: 'small',
        round: true,
        bordered: false,
        color: { color: row.categoryColor + '20', textColor: row.categoryColor },
      }, { default: () => row.category })
    }
  },
  {
    title: '标签',
    key: 'tags',
    width: 200,
    render(row) {
      return row.tags.slice(0, 3).map(tag =>
        h(NTag, {
          key: tag,
          size: 'tiny',
          bordered: false,
          type: 'info',
          style: 'margin-right: 4px',
        }, { default: () => tag })
      )
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      const isDraft = row.status === 'draft'
      return h(NTag, {
        size: 'small',
        bordered: false,
        type: isDraft ? 'warning' : 'success',
      }, { default: () => isDraft ? '草稿' : '已发布' })
    }
  },
  { title: '日期', key: 'date', width: 120 },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    fixed: 'right',
    render(row) {
      return h('div', { style: 'display: flex; gap: 8px' }, [
        h(NButton, {
          size: 'small',
          secondary: true,
          type: 'primary',
          onClick: () => router.push(`/admin/editor/${row.id}`),
        }, { default: () => '编辑' }),
        h(NButton, {
          size: 'small',
          secondary: true,
          type: 'error',
          onClick: () => { deleteTarget.value = row; showDeleteModal.value = true },
        }, { default: () => '删除' }),
      ])
    }
  },
]

onMounted(async () => {
  await fetchArticles()
})

async function fetchArticles(page = 1, pageSize?: number) {
  loading.value = true
  try {
    const ps = pageSize ?? pagination.pageSize
    const result = await getAdminArticles(page, ps)
    articles.value = result.items
    totalCount.value = result.total
    pagination.pageCount = Math.ceil(result.total / ps)
    pagination.pageSize = ps
  } catch (e: any) {
    console.error(e)
    errorMsg.value = e?.message || '加载失败，请检查网络或登录状态'
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  fetchArticles(page)
}

function handlePageSizeChange(pageSize: number) {
  fetchArticles(1, pageSize)
}

async function doDelete() {
  if (!deleteTarget.value) return false
  deleting.value = true
  try {
    await deleteArticle(deleteTarget.value.id)
    message.success('删除成功')
    showDeleteModal.value = false
    deleteTarget.value = null
    await fetchArticles()
    return true
  } catch {
    message.error('删除失败')
    return false
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped lang="scss">
$primary: #6366f1;

.admin-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-page);
}

.admin-main {
  flex: 1;
  padding: 32px 24px;
}

.admin-container {
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

.title-row {
  display: flex;
  align-items: center;
  gap: 24px;
}

.sub-link {
  font-size: 14px;
  color: $primary;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
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

.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--color-bg-card);
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: $primary;
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-muted);
}

.table-card {
  background: var(--color-bg-card);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  padding-bottom: 24px;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 64px 0;
  color: var(--color-text-muted);
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.error-banner p {
  color: #ef4444;
  font-size: 14px;
  margin: 0;
}

.error-state p {
  color: #ef4444;
  font-size: 16px;
  margin-bottom: 16px;
}

.admin-footer {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: var(--color-text-muted);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-card);
}

@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
