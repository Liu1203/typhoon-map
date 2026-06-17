<template>
  <div class="comment-section">
    <div class="comment-header">
      <h3 class="comment-title">💬 评论</h3>
      <span class="comment-count" v-if="!loading">{{ comments.length }} 条评论</span>
    </div>

    <!-- 加载状态 -->
    <n-spin v-if="loading" size="small" class="comment-loading" />

    <template v-else>
      <!-- 未登录提示 -->
      <div v-if="!isLoggedIn" class="comment-login-hint">
        💬 请 <n-button text type="primary" @click="goLogin">登录</n-button> 后发表评论
      </div>

      <!-- 顶部的评论输入框 -->
      <div v-else class="comment-form" :class="{ 'is-reply': !!replyTarget }">
        <div class="form-row">
          <n-input
            ref="contentInputRef"
            v-model:value="contentInput"
            type="textarea"
            :placeholder="replyTarget ? `回复 @${replyTarget.author}...` : '写下你的评论...（支持 Markdown）'"
            :rows="3"
            :autosize="{ minRows: 3, maxRows: 8 }"
            :maxlength="1000"
            show-count
            @keydown.enter.ctrl="submitComment"
          />
        </div>
        <div class="form-actions">
          <n-button
            v-if="replyTarget"
            text
            type="default"
            size="small"
            @click="cancelReply"
          >
            取消回复
          </n-button>
          <n-button
            type="primary"
            size="small"
            :loading="submitting"
            :disabled="!canSubmit"
            @click="submitComment"
          >
            {{ replyTarget ? '回复' : '发表评论' }}
          </n-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="comments.length === 0" class="comment-empty">
        暂无评论，快来抢沙发吧～
      </div>

      <!-- 评论列表 -->
      <div v-else class="comment-list">
        <CommentItem
          v-for="comment in topLevelComments"
          :key="comment.id"
          :comment="comment"
          :replies="repliesMap[comment.id] || []"
          :reply-target-id="replyTarget?.id ?? null"
          :submitting="submitting"
          :is-logged-in="isLoggedIn"
          :logged-in-name="loggedInName"
          @reply="startReply"
          @delete="handleDelete"
          @submit-reply="handleReplySubmit"
          @cancel-reply="cancelReply"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NInput, NButton, NSpin } from 'naive-ui'
import { useRouter } from 'vue-router'
import type { Comment } from '@/types/api'
import { getComments, createComment, deleteComment } from '@/api/comment'
import { useUserStore } from '@/stores/user'
import { message } from '@/utils/message'
import CommentItem from './CommentItem.vue'

const props = defineProps<{
  articleId: number
}>()

const router = useRouter()
const userStore = useUserStore()
const comments = ref<Comment[]>([])
const loading = ref(true)
const submitting = ref(false)

const contentInput = ref('')

interface ReplyTarget {
  id: number
  author: string
}
const replyTarget = ref<ReplyTarget | null>(null)

const isLoggedIn = computed(() => !!userStore.userInfo)

const topLevelComments = computed(() =>
  comments.value.filter(c => c.parentId === null)
)

const repliesMap = computed(() => {
  const map: Record<number, Comment[]> = {}
  for (const c of comments.value) {
    if (c.parentId !== null) {
      if (!map[c.parentId]) map[c.parentId] = []
      map[c.parentId]!.push(c)
    }
  }
  return map
})

const loggedInName = computed(() => userStore.userInfo?.name ?? '')

const currentAuthor = computed(() => loggedInName.value)

const canSubmit = computed(() => {
  if (!contentInput.value.trim()) return false
  return true
})

function goLogin() {
  router.push('/login?redirect=' + encodeURIComponent(router.currentRoute.value.fullPath))
}

function startReply(id: number, author: string) {
  replyTarget.value = { id, author }
}

function cancelReply() {
  replyTarget.value = null
}

function clearForm() {
  contentInput.value = ''
  replyTarget.value = null
}

async function submitComment() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    await createComment({
      articleId: props.articleId,
      author: currentAuthor.value,
      content: contentInput.value.trim(),
      parentId: replyTarget.value?.id ?? null,
      authorAvatar: userStore.userInfo?.avatar || undefined,
    })
    message.success(replyTarget.value ? '回复成功' : '评论成功')
    clearForm()
    await fetchComments()
  } catch {
    message.error('评论失败，请重试')
  } finally {
    submitting.value = false
  }
}

async function handleReplySubmit(parentId: number, content: string, author: string) {
  submitting.value = true
  try {
    await createComment({
      articleId: props.articleId,
      author,
      content,
      parentId,
      authorAvatar: userStore.userInfo?.avatar || undefined,
    })
    message.success('回复成功')
    replyTarget.value = null
    await fetchComments()
  } catch {
    message.error('回复失败，请重试')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(commentId: number) {
  try {
    await deleteComment(commentId)
    message.success('已删除评论')
    await fetchComments()
  } catch {
    message.error('删除失败，请重试')
  }
}

async function fetchComments() {
  try {
    comments.value = await getComments(props.articleId)
  } catch {
    comments.value = []
  }
}

onMounted(async () => {
  await fetchComments()
  loading.value = false
})
</script>

<style scoped lang="scss">
$primary: #6366f1;
$bg-card: #ffffff;
$text-primary: #1a1a2e;
$text-secondary: #555;
$text-muted: #999;
$border-color: #e8e8ed;

.comment-section {
  max-width: 760px;
  margin: 0 auto;
  padding: 0 56px 48px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;

  .comment-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: $text-primary;
  }

  .comment-count {
    font-size: 13px;
    color: $text-muted;
  }
}

.comment-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.comment-form {
  background: #f8f9fb;
  border: 1px solid $border-color;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  transition: border-color 0.2s;

  &.is-reply {
    border-color: $primary;
    background: rgba($primary, 0.03);
  }

  .form-row {
    margin-bottom: 10px;

    .name-input {
      max-width: 200px;
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
  }
}

.comment-login-hint {
  text-align: center;
  padding: 32px 0;
  color: $text-muted;
  font-size: 14px;
  background: #f8f9fb;
  border: 1px dashed $border-color;
  border-radius: 12px;
  margin-bottom: 24px;
}

.comment-empty {
  text-align: center;
  padding: 40px 0;
  color: $text-muted;
  font-size: 14px;
}

.comment-list {
  //
}

@media (max-width: 768px) {
  .comment-section {
    padding: 0 20px 32px;
  }
}
</style>
