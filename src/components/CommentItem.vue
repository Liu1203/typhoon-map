<template>
  <div class="comment-item">
    <div class="comment-main">
      <div class="comment-avatar">
        <UserAvatar
          :src="comment.authorAvatar"
          :name="comment.author"
          :size="32"
          round
        />
      </div>
      <div class="comment-body">
        <div class="comment-meta">
          <span class="comment-author">{{ comment.author }}</span>
          <span class="comment-time">{{ timeAgo }}</span>
        </div>
        <div class="comment-content" v-html="renderedContent" />
        <div class="comment-actions">
          <n-button v-if="isLoggedIn" text size="tiny" type="primary" @click="$emit('reply', comment.id, comment.author)">
            回复
          </n-button>
          <n-button
            v-if="isOwner"
            text
            size="tiny"
            type="error"
            @click="$emit('delete', comment.id)"
          >
            删除
          </n-button>
        </div>
      </div>
    </div>

    <div v-if="replies.length > 0" class="comment-replies">
      <CommentItem
        v-for="reply in replies"
        :key="reply.id"
        :comment="reply"
        :replies="[]"
        :reply-target-id="replyTargetId"
        :submitting="submitting"
        :is-logged-in="isLoggedIn"
        :logged-in-name="loggedInName"
        @reply="(id, author) => $emit('reply', id, author)"
        @delete="(id) => $emit('delete', id)"
        @submit-reply="(pid, content, author) => $emit('submitReply', pid, content, author)"
        @cancel-reply="$emit('cancelReply')"
      />
    </div>

    <div v-if="replyTargetId === comment.id" class="reply-form-inline">
      <div class="form-row">
        <n-input
          v-model:value="inlineContent"
          type="textarea"
          placeholder="写下你的回复..."
          :rows="2"
          :autosize="{ minRows: 2, maxRows: 6 }"
          :maxlength="1000"
          show-count
          @keydown.enter.ctrl="submitInlineReply"
        />
      </div>
      <div class="form-actions">
        <div class="form-actions-left">
          <n-button text size="tiny" class="emoji-btn" @click="showInlineEmoji = !showInlineEmoji">
            😊
          </n-button>
          <div v-if="showInlineEmoji" class="emoji-picker-wrapper">
            <EmojiPicker @select="onInlineEmojiSelect" @close="showInlineEmoji = false" />
          </div>
        </div>
        <div class="form-actions-right">
          <n-button text size="tiny" type="default" @click="$emit('cancelReply')">
            取消
          </n-button>
          <n-button
            size="tiny"
            type="primary"
            :loading="submitting"
            :disabled="!inlineCanSubmit"
            @click="submitInlineReply"
          >
            回复
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { NButton, NInput } from 'naive-ui'
import type { Comment } from '@/types/api'
import MarkdownIt from 'markdown-it'
import UserAvatar from '@/components/UserAvatar.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'

const props = defineProps<{
  comment: Comment
  replies: Comment[]
  replyTargetId: number | null
  submitting: boolean
  isLoggedIn: boolean
  loggedInName: string
}>()

const emit = defineEmits<{
  reply: [id: number, author: string]
  delete: [commentId: number]
  submitReply: [parentId: number, content: string, author: string]
  cancelReply: []
}>()

const inlineContent = ref('')
const showInlineEmoji = ref(false)

function onInlineEmojiSelect(emoji: string) {
  const el = document.activeElement as HTMLTextAreaElement | null
  if (el && el.tagName === 'TEXTAREA') {
    const start = el.selectionStart
    const end = el.selectionEnd
    inlineContent.value = inlineContent.value.slice(0, start) + emoji + inlineContent.value.slice(end)
    const pos = start + emoji.length
    nextTick(() => {
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  } else {
    inlineContent.value += emoji
  }
  showInlineEmoji.value = false
}

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
})

const renderedContent = computed(() => md.render(props.comment.content))

const isOwner = computed(() => {
  if (!props.isLoggedIn) return false
  return props.loggedInName === props.comment.author
})

const timeAgo = computed(() => {
  const now = Date.now()
  const created = new Date(props.comment.createdAt).getTime()
  const diff = Math.floor((now - created) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`
  return new Date(props.comment.createdAt).toLocaleDateString('zh-CN')
})

const inlineCanSubmit = computed(() => {
  return !!inlineContent.value.trim()
})

function submitInlineReply() {
  if (!inlineCanSubmit.value) return
  const content = inlineContent.value.trim()
  emit('submitReply', props.comment.id, content, props.loggedInName)
  inlineContent.value = ''
}
</script>

<style scoped lang="scss">
$primary: #6366f1;
$text-primary: var(--color-text-primary);
$text-secondary: var(--color-text-secondary);
$text-muted: var(--color-text-muted);
$border-color: var(--color-border);

.comment-item {
  margin-bottom: 16px;
}

.comment-main {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  flex-shrink: 0;
  margin-top: 2px;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;

  .comment-author {
    font-size: 13px;
    font-weight: 600;
    color: $text-primary;
  }

  .comment-time {
    font-size: 12px;
    color: $text-muted;
  }
}

.comment-content {
  font-size: 14px;
  line-height: 1.7;
  color: $text-secondary;

  :deep(p) {
    margin: 0 0 6px;
    &:last-child { margin-bottom: 0; }
  }

  :deep(code) {
    background: rgba($primary, 0.08);
    color: #d63384;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 0.9em;
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  }

  :deep(strong) {
    color: $text-primary;
    font-weight: 600;
  }

  :deep(a) {
    color: $primary;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }

  :deep(pre) {
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 12px 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 8px 0;
    font-size: 13px;
    line-height: 1.6;
  }
}

.comment-actions {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.comment-replies {
  margin-top: 12px;
  margin-left: 44px;
  padding-left: 16px;
  border-left: 2px solid $border-color;
}

.reply-form-inline {
  margin-top: 12px;
  margin-left: 44px;
  padding: 12px;
  background: var(--color-bg-page);
  border: 1px solid $border-color;
  border-radius: 8px;

  .form-row {
    margin-bottom: 8px;
  }

  .name-input {
    max-width: 160px;
  }

  .form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;

    &-left {
      position: relative;
      display: flex;
      align-items: center;
    }

    &-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .emoji-btn {
    font-size: 16px;
    line-height: 1;
    padding: 2px;
  }

  .emoji-picker-wrapper {
    position: absolute;
    left: 0;
    bottom: 100%;
    z-index: 100;
    margin-bottom: 4px;
  }
}
</style>
