<script setup lang="ts">
/**
 * 提醒页：这里放两件事 —— 已经设了哪些提醒、什么时候别吵我。
 *
 * 为什么单独一页而不是塞进设置页：
 *   设置页是"配置"，提醒是"我在等的某件事"。后者要能随时打开看一眼，
 *   而且取消一条提醒是**高频动作**，埋在三级设置里等于没有。
 *
 * 为什么免打扰也在这里：
 *   它是"为什么我没收到通知"的答案。用户看不见提醒时，第一反应是找原因，
 *   原因必须和结果在同一屏 —— 分成两页就会被绕晕。
 */
import { computed, onMounted, ref } from "vue"
import {
  AgentError,
  cancelAlert,
  getAlertSettings,
  getAlerts,
  getSessionId,
  saveAlertSettings,
  type AlertRecord,
  type AlertSettings,
  type IntrusionUsage,
  type NightLevel,
} from "@/api/agent"

const sessionId = ref("")
const alerts = ref<AlertRecord[]>([])
const canWrite = ref(true)
const settings = ref<AlertSettings | null>(null)
const usage = ref<IntrusionUsage | null>(null)

const loading = ref(true)
const saving = ref(false)
const error = ref("")

const hourLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`)

const NIGHT_OPTIONS: { value: NightLevel; label: string; note?: string }[] = [
  { value: "critical", label: "极端天气才叫醒我", note: "暴雨、十二级风、严重污染（默认）" },
  { value: "high", label: "大雨、高温预警这一级也叫" },
  { value: "never", label: "一次都别叫，都等到早上" },
]

const quietText = computed(() => {
  const s = settings.value
  if (!s) return ""
  if (!s.quietEnabled) return "已关闭 —— 任何时候都可以推送"
  const a = hourLabels[s.quietStart] ?? ""
  const b = hourLabels[s.quietEnd] ?? ""
  return s.quietStart < s.quietEnd ? `${a} – ${b}` : `${a} – 次日 ${b}`
})

const quotaText = computed(() => {
  const u = usage.value
  if (!u) return ""
  if (u.limit === 0) return "不会在夜间打扰你"
  const left = Math.max(u.limit - u.used, 0)
  if (left > 0) return `今晚还能打扰你 ${left} 次（上限 ${u.limit} 次 / 24 小时）`
  const t = new Date(u.nextResetAt)
  return `今晚的 ${u.limit} 次已经用完，${String(t.getHours()).padStart(2, "0")}:${String(
    t.getMinutes(),
  ).padStart(2, "0")} 之后恢复`
})

function stamp(ts: number) {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function reasonOf(err: unknown) {
  if (err instanceof AgentError) {
    if (err.kind === "offline" || err.kind === "timeout") return "连不上服务，检查一下网络或服务地址"
    if (err.kind === "auth") return "密钥不对，去设置里检查服务地址和钥匙"
    return err.detail
  }
  return String(err)
}

async function load() {
  sessionId.value = getSessionId()
  loading.value = true
  error.value = ""
  try {
    const [a, s] = await Promise.all([
      // ★ 不带 sessionId：查全部。
      //   带 sessionId 的话，"清空对话记录"之后服务端还在响的提醒就从列表里消失了 ——
      //   用户以为没了，其实明天早上照样被提醒。那种"看不见却还在发生"最伤信任。
      //   前提是这台服务只服务一个人（当前部署就是：一把共享密钥）。
      //   真要多用户，这里必须改成按用户过滤，并且后端加用户维度。
      getAlerts(),
      // 没有会话就不查设置：设置是跟着会话存的，没会话就没有"我的设置"
      sessionId.value ? getAlertSettings(sessionId.value) : Promise.resolve(null),
    ])
    alerts.value = a.alerts
    canWrite.value = a.canWrite
    if (s) {
      settings.value = s.settings
      usage.value = s.intrusion
    }
  } catch (err) {
    error.value = reasonOf(err)
  } finally {
    loading.value = false
  }
}

/**
 * 改一个字段就存一次，没有"保存"按钮。
 *
 * 这类偏好没有草稿态：用户拨了开关就认为它生效了。
 * 给个保存按钮反而制造"我到底存没存上"的不确定。
 * 失败则重新拉一遍服务端状态 —— 本地永远只是服务端的投影。
 */
async function patch(p: Partial<Pick<AlertSettings, "quietEnabled" | "quietStart" | "quietEnd" | "nightLevel">>) {
  if (!sessionId.value || saving.value || !settings.value) return
  saving.value = true
  error.value = ""
  try {
    const r = await saveAlertSettings(sessionId.value, p)
    settings.value = r.settings
    usage.value = r.intrusion
  } catch (err) {
    error.value = reasonOf(err)
    await load()
  } finally {
    saving.value = false
  }
}

function onQuietToggle(e: any) {
  void patch({ quietEnabled: !!e?.detail?.value })
}

function onHourChange(which: "quietStart" | "quietEnd", e: any) {
  const idx = Number(e?.detail?.value)
  if (!Number.isFinite(idx)) return
  void patch({ [which]: idx } as never)
}

function setLevel(v: NightLevel) {
  void patch({ nightLevel: v })
}

async function cancel(a: AlertRecord) {
  const ok = await new Promise<boolean>((resolve) => {
    uni.showModal({
      title: "取消这条提醒？",
      content: a.summary,
      confirmText: "取消提醒",
      cancelText: "留着",
      success: (r: any) => resolve(!!r.confirm),
      fail: () => resolve(false),
    })
  })
  if (!ok) return

  try {
    const r = await cancelAlert(a.id)
    // 本地直接改状态，不整页重拉：重拉会让列表跳动一下，用户以为自己点错了
    const i = alerts.value.findIndex((x) => x.id === a.id)
    if (i >= 0) alerts.value[i] = r.alert
  } catch (err) {
    uni.showToast({ title: reasonOf(err).slice(0, 20), icon: "none" })
  }
}

onMounted(load)
</script>

<template>
  <view class="page">
    <view v-if="error" class="err-bar" @tap="load">
      <text class="err-text">{{ error }}</text>
      <text class="err-retry">重试</text>
    </view>

    <!-- ① 已经生效的提醒 -->
    <view class="card">
      <view class="card-head">
        <text class="card-title">我的提醒</text>
        <text class="card-count">{{ alerts.length }} 条</text>
      </view>

      <view v-if="loading" class="empty">
        <text class="empty-text">读取中…</text>
      </view>

      <view v-else-if="!alerts.length" class="empty">
        <text class="empty-text">还没有提醒</text>
        <text class="empty-sub">去跟天气助手说一句「明天下雨提醒我」</text>
      </view>

      <view v-for="a in alerts" :key="a.id" class="item" :class="{ off: a.status === 'cancelled' }">
        <view class="item-main">
          <text class="item-title">{{ a.summary }}</text>
          <text class="item-meta">
            {{ a.status === "active" ? "生效中" : "已取消" }} · {{ stamp(a.createdAt) }}
          </text>
        </view>
        <view
          v-if="a.status === 'active' && canWrite"
          class="item-btn"
          @tap="cancel(a)"
        >
          <text class="item-btn-text">取消</text>
        </view>
      </view>
    </view>

    <!-- ② 免打扰：这是"为什么我没收到通知"的答案，所以和结果放同一屏 -->
    <view class="card" v-if="settings">
      <view class="card-head">
        <text class="card-title">免打扰</text>
        <switch :checked="settings.quietEnabled" color="#5B8FC0" :disabled="saving" @change="onQuietToggle" />
      </view>

      <view class="row" :class="{ dim: !settings.quietEnabled }">
        <text class="row-label">时段</text>
        <view class="row-right">
          <picker
            mode="selector"
            :range="hourLabels"
            :value="settings.quietStart"
            :disabled="saving || !settings.quietEnabled"
            @change="onHourChange('quietStart', $event)"
          >
            <view class="pick">{{ hourLabels[settings.quietStart] }}</view>
          </picker>
          <text class="row-dash">到</text>
          <picker
            mode="selector"
            :range="hourLabels"
            :value="settings.quietEnd"
            :disabled="saving || !settings.quietEnabled"
            @change="onHourChange('quietEnd', $event)"
          >
            <view class="pick">{{ hourLabels[settings.quietEnd] }}</view>
          </picker>
        </view>
      </view>
      <text class="row-hint">当前生效：{{ quietText }}</text>

      <view class="divider" />

      <text class="row-label block">半夜值得叫醒我的情况</text>
      <view
        v-for="o in NIGHT_OPTIONS"
        :key="o.value"
        class="opt"
        :class="{ on: settings.nightLevel === o.value }"
        @tap="setLevel(o.value)"
      >
        <view class="opt-dot" :class="{ on: settings.nightLevel === o.value }" />
        <view class="opt-body">
          <text class="opt-label">{{ o.label }}</text>
          <text v-if="o.note" class="opt-note">{{ o.note }}</text>
        </view>
      </view>

      <text class="row-hint">{{ quotaText }}</text>
    </view>

    <view class="tip" v-if="!sessionId && !loading">
      <text class="tip-text">先跟天气助手聊一句，提醒才会绑定到这个会话。</text>
    </view>

    <view class="foot">
      <text class="foot-text">提醒只在后台检查，App 关掉也有效</text>
    </view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 12px 14px 24px;
  background: var(--color-bg);
  font-family: var(--font-family-base);
}

.err-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin-bottom: 10px;
  border-radius: 10px;
  background: #fef6f5;
  border: 1px solid var(--color-danger);
}
.err-text {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--color-danger);
  line-height: 1.5;
}
.err-retry {
  margin-left: 10px;
  font-size: var(--font-size-sm);
  color: var(--color-primary);
}

.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-paper-border);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-ink);
}
.card-count {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
}

.empty {
  padding: 18px 0 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-text {
  font-size: var(--font-size-sm);
  color: var(--color-ink-light);
}
.empty-sub {
  margin-top: 6px;
  font-size: var(--font-size-xs);
  color: var(--color-ash);
}

.item {
  display: flex;
  align-items: center;
  padding: 11px 0;
  border-bottom: 1px solid var(--color-cloud);
}
.item:last-child {
  border-bottom: none;
  padding-bottom: 2px;
}
.item.off {
  opacity: 0.5;
}
.item-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.item-title {
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  line-height: 1.5;
}
.item-meta {
  margin-top: 3px;
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
}
.item-btn {
  margin-left: 10px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-paper-border);
}
.item-btn-text {
  font-size: var(--font-size-xs);
  color: var(--color-ink-soft);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}
.row.dim {
  opacity: 0.4;
}
.row-label {
  font-size: var(--font-size-sm);
  color: var(--color-ink-soft);
}
.row-label.block {
  display: block;
  margin-top: 2px;
}
.row-right {
  display: flex;
  align-items: center;
}
.pick {
  padding: 5px 12px;
  border-radius: 8px;
  background: var(--color-paper-dark);
  font-size: var(--font-size-sm);
  color: var(--color-ink);
}
.row-dash {
  margin: 0 8px;
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
}
.row-hint {
  display: block;
  margin-top: 8px;
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  line-height: 1.5;
}
.divider {
  height: 1px;
  background: var(--color-cloud);
  margin: 14px 0 10px;
}

.opt {
  display: flex;
  align-items: flex-start;
  padding: 9px 10px;
  margin-top: 8px;
  border-radius: 10px;
  border: 1px solid var(--color-paper-border);
}
.opt.on {
  border-color: var(--color-primary);
  background: #f4f8fc;
}
.opt-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid var(--color-ash);
  margin-right: 9px;
  margin-top: 2px;
  flex: none;
}
.opt-dot.on {
  border-color: var(--color-primary);
  background: var(--color-primary);
  box-shadow: inset 0 0 0 3px #fff;
}
.opt-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.opt-label {
  font-size: var(--font-size-sm);
  color: var(--color-ink);
  line-height: 1.5;
}
.opt-note {
  margin-top: 2px;
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  line-height: 1.5;
}

.tip {
  padding: 0 4px 10px;
}
.tip-text {
  font-size: var(--font-size-xs);
  color: var(--color-ink-light);
  line-height: 1.6;
}
.foot {
  padding: 8px 4px 0;
}
.foot-text {
  font-size: var(--font-size-xs);
  color: var(--color-ash);
}
</style>
