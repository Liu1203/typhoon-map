<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from "vue"

/**
 * 天气助手机器人。
 *
 * 两套本体，靠 MODE 切换：
 * - "mech"：纯 view + CSS 拼的机甲机器人，自己会动（浮空 / 摆臂 / 眨眼 / 面罩扫描 / 胸灯脉冲）
 * - "image"：微软 Fluent Emoji 的 3D 渲染图（MIT），静态，动效只剩呼吸
 *
 * 为什么 mech 用 view 拼而不是内联 SVG / SVG 图：
 *   `<image>` 加载的 SVG 走 secure static mode，内部 CSS 动画和 SMIL 一律不执行；
 *   而 uni-app App 端没有可直接操作的 DOM，所以只能用 view 当零件、CSS 当关节。
 *
 * ★ 尺寸只认 size：内部全部按 100×100 的基准坐标写死，
 *   外层统一 scale(size/100)，改大小不用动任何一个子元素。
 */
const props = withDefaults(
  defineProps<{
    /** 边长像素（基准 100×100） */
    size?: number
    /** 关掉全部动效（聊天列表里一屏好几个，全在动会很吵） */
    animate?: boolean
    /** 当前天气文本（如「多云」「雷阵雨」），传了就在右上角挂一枚对应的 3D 徽标 */
    weather?: string
    /** 表情：dizzy 时眼睛变成两条斜杠、脑袋歪一点（后端连不上时用） */
    mood?: "idle" | "dizzy"
  }>(),
  { size: 60, animate: true, weather: "", mood: "idle" },
)

/** 想退回 3D 渲染图那版，把这里改成 "image" 即可 */
const MODE: "mech" | "image" = "mech"

const ROBOT_SRC = "/static/robot.png"
const BASE = 100

/**
 * 天气文本 → 徽标素材。素材同样来自微软 Fluent Emoji 的 3D 版（MIT）。
 * ★ 顺序不能乱：「雷阵雨」含「雨」、「雾凇」含「雾」，先匹配更具体的词。
 */
function pickBadge(w: string): string {
  const s = (w || "").trim()
  if (!s) return ""
  if (/台风|飓风|旋风|热带风暴|龙卷/.test(s)) return "/static/wx/cyclone.png"
  if (/雷|闪电/.test(s)) return "/static/wx/storm.png"
  if (/雪|雹|霰|冻雨|冰粒/.test(s)) return "/static/wx/snow.png"
  if (/雨/.test(s)) return "/static/wx/rain.png"
  if (/雾|霾|沙|尘/.test(s)) return "/static/wx/fog.png"
  if (/阴|overcast/i.test(s)) return "/static/wx/cloud.png"
  if (/云/.test(s)) return "/static/wx/sun-cloud.png"
  if (/晴|clear|sunny/i.test(s)) return "/static/wx/sun.png"
  return ""
}

const mode = MODE

const boxStyle = computed(() => ({
  width: props.size + "px",
  height: props.size + "px",
}))

/** 内层固定 100×100，用 scale 缩放 */
const innerStyle = computed(() => ({
  transform: "scale(" + props.size / BASE + ")",
}))

/** 光晕比本体宽一档，垫在正下方中心 */
const haloStyle = computed(() => {
  const d = Math.round(props.size * 1.34)
  return {
    width: d + "px",
    height: d + "px",
    marginLeft: -d / 2 + "px",
    marginTop: -d / 2 + "px",
  }
})

const badgeSrc = computed(() => pickBadge(props.weather))

/** 徽标贴右肩外侧，探出本体边界，像别在身上的小贴纸 */
const badgeStyle = computed(() => {
  const d = Math.round(props.size * 0.44)
  return {
    width: d + "px",
    height: d + "px",
    right: -Math.round(props.size * 0.12) + "px",
    top: -Math.round(props.size * 0.06) + "px",
  }
})

/**
 * 被戳一下的反应：闭眼 → 睁大 → 转头 → 抬胳膊 → 底座闪一下。
 * 挂 touchstart 而不是 tap：外层 FAB 的 tap 会立刻跳页，
 * 等 tap 再放动画，页面已经切走了，根本看不见。
 */
const POKE_MS = 460
const poking = ref(false)
let pokeTimer: ReturnType<typeof setTimeout> | null = null

function poke() {
  if (!props.animate) return
  // 先摘后挂：连续戳同一处时，类名不变浏览器不会重启动画
  poking.value = false
  nextTick(() => {
    poking.value = true
  })
  if (pokeTimer) clearTimeout(pokeTimer)
  pokeTimer = setTimeout(() => {
    poking.value = false
  }, POKE_MS)
  try {
    uni.vibrateShort({})
  } catch (e) {
    /* 模拟器 / 无马达设备静默跳过 */
  }
}

onUnmounted(() => {
  if (pokeTimer) clearTimeout(pokeTimer)
})
</script>

<template>
  <view class="robot-box" :style="boxStyle" @touchstart="poke">
    <!-- 聊天列表里一屏多个头像，光晕会变一圈蓝底板，所以只在需要动的那处给 -->
    <view v-if="animate" class="robot-halo" :style="haloStyle" />

    <!-- 机甲本体 -->
    <view v-if="mode === 'mech'" class="robot" :style="innerStyle">
      <!-- 缩放放在 .robot 内联样式上，浮动必须下放到 .mech，
           否则 mech-float 的 transform 会把内联的 scale 整个覆盖掉，机器人会突然变回 100px -->
      <view class="mech" :class="{ still: !animate, poking, dizzy: mood === 'dizzy' }">
        <!-- 悬浮底座 -->
        <view class="pad" />
        <view class="spark s1" />
        <view class="spark s2" />

        <!-- 两段式手臂：整条外张 + 前臂再叠一层摆动 -->
        <view class="arm l">
          <view class="upper" />
          <view class="fore"><view class="hand" /></view>
        </view>
        <view class="arm r">
          <view class="upper" />
          <view class="fore"><view class="hand" /></view>
        </view>

        <view class="neck" />

        <view class="body">
          <view class="plate">
            <view class="chest-base" />
            <view class="chest" />
          </view>
          <view class="grill g1" />
          <view class="grill g2" />
          <view class="grill g3" />
        </view>

        <view class="shoulder l" />
        <view class="shoulder r" />

        <!-- 天线（画在头之前，根部被头盖住） -->
        <view class="stem" />
        <view class="tip" />
        <view class="fin l" />
        <view class="fin r" />

        <view class="head">
          <view class="seam" />
          <view class="visor">
            <view class="eye l">
              <view class="xbar a" />
              <view class="xbar b" />
            </view>
            <view class="eye r">
              <view class="xbar a" />
              <view class="xbar b" />
            </view>
            <view class="scan" />
            <view class="gloss" />
          </view>
        </view>
      </view>
    </view>

    <!-- 3D 渲染图本体（备用） -->
    <image v-else class="robot-img" :class="{ still: !animate }" :src="ROBOT_SRC" mode="aspectFit" />

    <image
      v-if="badgeSrc"
      class="robot-badge"
      :class="{ still: !animate }"
      :style="badgeStyle"
      :src="badgeSrc"
      mode="aspectFit"
    />
  </view>
</template>

<style scoped>
.robot-box {
  position: relative;
  flex-shrink: 0;
}

/* 一层很淡的冷光，让它"浮"起来；边缘完全透明，不会像底板 */
.robot-halo {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(96, 178, 240, 0.28) 0%,
    rgba(96, 178, 240, 0.11) 46%,
    rgba(96, 178, 240, 0) 72%
  );
  animation: halo-pulse 3.4s ease-in-out infinite;
}

.robot {
  position: absolute;
  left: 0;
  top: 0;
  width: 100px;
  height: 100px;
  transform-origin: 0 0;
}

/* 浮动在这层：它和 .robot 内联的 scale 分开，两者不打架 */
.mech {
  position: relative;
  width: 100px;
  height: 100px;
  animation: mech-float 3.4s ease-in-out infinite;
}

/* ---------- 悬浮底座 ---------- */
.pad {
  position: absolute;
  left: 50%;
  top: 86px;
  width: 64px;
  height: 16px;
  margin-left: -32px;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(84, 190, 245, 0.55) 0%, rgba(84, 190, 245, 0.2) 45%, rgba(84, 190, 245, 0) 72%);
  animation: pad-breathe 3s ease-in-out infinite;
}

/* 飘起来的两个小光点 */
.spark {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(110, 200, 245, 0.9);
  box-shadow: 0 0 5px rgba(90, 190, 245, 0.8);
}
.spark.s1 {
  left: 15px;
  top: 58px;
  animation: spark-rise 4.2s ease-in-out infinite;
}
.spark.s2 {
  left: 82px;
  top: 68px;
  animation: spark-rise 4.2s ease-in-out infinite;
  animation-delay: -2.1s;
}

/* ---------- 躯干 ---------- */
.body {
  position: absolute;
  left: 33px;
  top: 55px;
  width: 34px;
  height: 30px;
  box-sizing: border-box;
  border-radius: 13px 13px 9px 9px;
  background: linear-gradient(160deg, #ffffff 0%, #e2eff9 58%, #c6dbee 100%);
  border: 1.2px solid rgba(136, 178, 214, 0.9);
  box-shadow: 0 4px 8px rgba(74, 120, 158, 0.22), inset 0 1.5px 0 rgba(255, 255, 255, 0.95);
}
.plate {
  position: absolute;
  left: 3px;
  top: 2px;
  width: 28px;
  height: 13px;
  box-sizing: border-box;
  border-radius: 6px;
  background: linear-gradient(165deg, #f8fcff 0%, #dcebf8 100%);
  border: 1px solid rgba(150, 190, 222, 0.75);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}
/* 胸灯：深色底托 + 发光核心，2.4s 脉冲 */
.chest-base {
  position: absolute;
  left: 9px;
  top: 1.5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(170deg, #1d4c72, #0d2b45);
}
.chest {
  position: absolute;
  left: 10px;
  top: 2.5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, #dcf8ff 0%, #6fd6ff 40%, #2a9ed6 100%);
  box-shadow: 0 0 5px rgba(70, 190, 245, 0.95);
  animation: chest-pulse 2.4s ease-in-out infinite;
}
/* 腹部散热格栅：两端淡中间深，像开槽 */
.grill {
  position: absolute;
  left: 9px;
  width: 16px;
  height: 1.6px;
  border-radius: 1px;
  background: linear-gradient(90deg, rgba(110, 155, 195, 0.12), rgba(95, 145, 190, 0.8), rgba(110, 155, 195, 0.12));
}
.grill.g1 {
  top: 18.5px;
}
.grill.g2 {
  top: 22px;
}
.grill.g3 {
  top: 25.5px;
}

/* ---------- 颈 / 肩 ---------- */
.neck {
  position: absolute;
  left: 44px;
  top: 50px;
  width: 12px;
  height: 7px;
  border-radius: 3px;
  background: linear-gradient(180deg, #c2d6e8, #8fb0cc);
}
.shoulder {
  position: absolute;
  top: 58px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  box-sizing: border-box;
  background: radial-gradient(circle at 34% 30%, #ffffff 0%, #b5cee2 60%, #8fb0cc 100%);
  border: 1px solid rgba(120, 160, 196, 0.8);
}
.shoulder.l {
  left: 27.5px;
}
.shoulder.r {
  left: 63.5px;
}

/* ---------- 手臂：上臂整条外张，前臂再摆 ---------- */
.arm {
  position: absolute;
  top: 61px;
  width: 8px;
  height: 13px;
  transform-origin: 50% 10%;
}
.arm.l {
  left: 26.4px;
  animation: swing-l 3.6s ease-in-out infinite;
}
.arm.r {
  left: 65.6px;
  animation: swing-r 3.6s ease-in-out infinite;
}
.upper {
  position: absolute;
  left: 0;
  top: 0;
  width: 8px;
  height: 13px;
  box-sizing: border-box;
  border-radius: 4px;
  background: linear-gradient(170deg, #f4faff 0%, #bcd6ea 55%, #94b5d2 100%);
  border: 1px solid rgba(116, 158, 196, 0.95);
  box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.8), 0 1px 2px rgba(70, 115, 150, 0.25);
}
.fore {
  position: absolute;
  left: 0.5px;
  top: 9px;
  width: 7px;
  height: 8px;
  box-sizing: border-box;
  border-radius: 3.5px;
  transform-origin: 50% 8%;
  background: linear-gradient(170deg, #e8f3fd 0%, #a9c6de 100%);
  border: 1px solid rgba(116, 158, 196, 0.9);
  animation: fore-swing 2.4s ease-in-out infinite;
}
/* 右臂错开半个周期，两条臂不会同频像僵尸 */
.arm.r .fore {
  animation-delay: -1.2s;
}
.hand {
  position: absolute;
  left: 1px;
  top: 5px;
  width: 5.5px;
  height: 6px;
  box-sizing: border-box;
  border-radius: 2px;
  background: linear-gradient(170deg, #e9f4fd 0%, #b9d2e8 100%);
  border: 1px solid rgba(116, 158, 196, 0.9);
}

/* ---------- 头 ---------- */
.head {
  position: absolute;
  left: 30px;
  top: 20px;
  width: 40px;
  height: 32px;
  box-sizing: border-box;
  border-radius: 14px;
  background: linear-gradient(165deg, #ffffff 0%, #eef7fe 50%, #cfe3f4 100%);
  border: 1.2px solid rgba(136, 178, 214, 0.95);
  box-shadow: 0 5px 10px rgba(74, 120, 158, 0.24), inset 0 2px 0 rgba(255, 255, 255, 0.95);
  transform-origin: 50% 92%;
  animation: head-tilt 5s ease-in-out infinite;
}
.seam {
  position: absolute;
  left: 9px;
  top: 3px;
  width: 22px;
  height: 1px;
  background: rgba(178, 205, 228, 0.75);
}
.visor {
  position: absolute;
  left: 7px;
  top: 8px;
  width: 26px;
  height: 18px;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(170deg, #1d5278 0%, #0d2b45 65%, #081d30 100%);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(30, 80, 120, 0.5);
}
/* 面罩玻璃反光：一道斜向高光，比整片半透明更像玻璃 */
.gloss {
  position: absolute;
  left: 0;
  top: 0;
  width: 26px;
  height: 18px;
  background: linear-gradient(118deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 26%, rgba(255, 255, 255, 0) 40%);
}
.eye {
  position: absolute;
  top: 5.5px;
  width: 5px;
  height: 7px;
  border-radius: 2.5px;
  background: radial-gradient(circle at 32% 24%, #ffffff 0%, #86e6ff 42%, #2a9ed6 100%);
  box-shadow: 0 0 5px rgba(90, 210, 255, 0.95), 0 0 11px rgba(70, 190, 245, 0.6);
  animation: eye-blink 4.8s ease-in-out infinite;
}
.eye.l {
  left: 4.5px;
}
.eye.r {
  left: 16.5px;
}
/* 晕眩表情：眼睛换成两条交叉斜杠，脑袋再歪一下 */
.xbar {
  display: none;
  position: absolute;
  left: 50%;
  top: 50%;
  width: 7px;
  height: 1.2px;
  margin-left: -3.5px;
  margin-top: -0.6px;
  border-radius: 1px;
  background: #86e6ff;
  box-shadow: 0 0 4px rgba(90, 210, 255, 0.9);
}
.xbar.a {
  transform: rotate(45deg);
}
.xbar.b {
  transform: rotate(-45deg);
}
.eye.dizzy {
  background: transparent;
  box-shadow: none;
  animation: none;
}
.eye.dizzy .xbar {
  display: block;
}
/* 只在不动效的时候生效：动画会盖掉静态 transform */
.dizzy .head {
  transform: rotate(5deg);
}

/* 扫描线只在眼睛下方那条窄区里流动，不穿过眼睛 */
.scan {
  position: absolute;
  left: 0;
  width: 26px;
  height: 1.4px;
  background: linear-gradient(90deg, rgba(140, 235, 255, 0) 0%, rgba(140, 235, 255, 0.85) 50%, rgba(140, 235, 255, 0) 100%);
  animation: scan-move 3s linear infinite;
}

/* ---------- 天线 / 侧鳍 ---------- */
.stem {
  position: absolute;
  left: 49px;
  top: 12px;
  width: 1.8px;
  height: 10px;
  background: linear-gradient(180deg, #d3e6f6, #8fb0cc);
}
.tip {
  position: absolute;
  left: 46.9px;
  top: 7.1px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 28%, #fffbe6 0%, #ffd25e 42%, #f0a020 100%);
  box-shadow: 0 0 7px rgba(247, 183, 62, 0.95);
  animation: tip-glow 2.8s ease-in-out infinite;
}
.fin {
  position: absolute;
  top: 28px;
  width: 3px;
  height: 12px;
  box-sizing: border-box;
  border-radius: 1.5px;
  background: linear-gradient(180deg, #ddeaf7, #a8c6df);
  border: 1px solid rgba(150, 185, 215, 0.6);
}
.fin.l {
  left: 26.4px;
}
.fin.r {
  left: 70.6px;
}

/* ---------- 3D 图本体（备用） ---------- */
.robot-img {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  transform-origin: 50% 92%;
  animation: robot-breathe 4.2s ease-in-out infinite;
}

/* ---------- 天气徽标 ---------- */
.robot-badge {
  position: absolute;
  display: block;
  z-index: 2;
  animation: badge-hop 5.2s ease-in-out infinite;
}

/* ---------- 被戳一下的临时反应 ---------- */
/* 特异性都高于这些元素身上的常驻动画（.poking .arm.l > .arm.l），
   所以只在 460ms 内接管，时间一到自动回到常驻动画 */
.poking .head {
  animation: head-attn 0.46s ease-out;
}
.poking .eye {
  animation: eye-attn 0.46s ease-out;
}
.poking .arm.l {
  animation: arm-attn-l 0.46s ease-out;
}
.poking .arm.r {
  animation: arm-attn-r 0.46s ease-out;
}
.poking .pad {
  animation: pad-attn 0.46s ease-out;
}

/* ---------- 关掉动效 ---------- */
/* 子元素上的动画选择器特异性更高（如 .arm.l），不用 !important 压不住；
   用 * 而不是 view：App 端最终渲染的标签名不一定是 view，类选择器才稳 */
.still,
.still * {
  animation: none !important;
}

/* ---------- 关键帧 ---------- */
@keyframes halo-pulse {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(0.93);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}
@keyframes mech-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}
@keyframes pad-breathe {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.94);
  }
  50% {
    opacity: 1;
    transform: scale(1.06);
  }
}
@keyframes head-tilt {
  0%,
  100% {
    transform: rotate(-1.4deg);
  }
  50% {
    transform: rotate(1.4deg);
  }
}
@keyframes swing-l {
  0%,
  100% {
    transform: rotate(-12deg);
  }
  50% {
    transform: rotate(-2deg);
  }
}
@keyframes swing-r {
  0%,
  100% {
    transform: rotate(12deg);
  }
  50% {
    transform: rotate(2deg);
  }
}
@keyframes fore-swing {
  0%,
  100% {
    transform: rotate(-7deg);
  }
  50% {
    transform: rotate(9deg);
  }
}
@keyframes eye-blink {
  0%,
  90%,
  100% {
    transform: scaleY(1);
  }
  94% {
    transform: scaleY(0.1);
  }
}
@keyframes scan-move {
  0% {
    top: 12px;
    opacity: 0;
  }
  20% {
    opacity: 0.9;
  }
  80% {
    opacity: 0.9;
  }
  100% {
    top: 16.6px;
    opacity: 0;
  }
}
@keyframes chest-pulse {
  0%,
  100% {
    box-shadow: 0 0 4px rgba(70, 190, 245, 0.6);
  }
  50% {
    box-shadow: 0 0 9px rgba(70, 190, 245, 1);
  }
}
@keyframes tip-glow {
  0%,
  100% {
    box-shadow: 0 0 5px rgba(247, 183, 62, 0.7);
  }
  50% {
    box-shadow: 0 0 11px rgba(247, 183, 62, 1);
  }
}
@keyframes spark-rise {
  0% {
    transform: translateY(6px);
    opacity: 0;
  }
  30% {
    opacity: 0.9;
  }
  70% {
    opacity: 0.9;
  }
  100% {
    transform: translateY(-10px);
    opacity: 0;
  }
}
@keyframes robot-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
}
/* 62% 之前待着，然后跳一下落地，剩下时间静止 */
@keyframes badge-hop {
  0%,
  62%,
  100% {
    transform: translateY(0);
  }
  74% {
    transform: translateY(-3px);
  }
  86% {
    transform: translateY(0);
  }
}

/* ---------- 戳一下的关键帧 ---------- */
/* 起点用常驻动画的当前值（头 -1.4deg、臂 ∓12deg、底座 scale .94），结束回到同一值，接得上 */
@keyframes head-attn {
  0% {
    transform: rotate(-1.4deg);
  }
  22% {
    transform: rotate(-8deg);
  }
  55% {
    transform: rotate(3.5deg);
  }
  100% {
    transform: rotate(-1.4deg);
  }
}
/* 先快速闭一下，再瞪大 —— 顺序反了就变成"被吓到"而不是"被戳" */
@keyframes eye-attn {
  0% {
    transform: scaleY(1);
  }
  12% {
    transform: scaleY(0.12);
  }
  36% {
    transform: scaleY(1.34) scaleX(1.08);
  }
  100% {
    transform: scaleY(1);
  }
}
@keyframes arm-attn-l {
  0%,
  100% {
    transform: rotate(-12deg);
  }
  38% {
    transform: rotate(-26deg);
  }
}
@keyframes arm-attn-r {
  0%,
  100% {
    transform: rotate(12deg);
  }
  38% {
    transform: rotate(26deg);
  }
}
@keyframes pad-attn {
  0% {
    opacity: 0.55;
    transform: scale(0.94);
  }
  32% {
    opacity: 1;
    transform: scale(1.18);
  }
  100% {
    opacity: 0.55;
    transform: scale(0.94);
  }
}
</style>
