<script setup lang="ts">
import { computed } from "vue"

const props = withDefaults(defineProps<{
  weather: string
  size?: number
}>(), {
  size: 56,
})

const type = computed(() => {
  const w = props.weather
  if (w.includes("雷")) return "thunder"
  if (w.includes("雪") || w.includes("冰雹") || w.includes("雹")) return "snow"
  if (w.includes("大") && w.includes("阵")) return "storm"
  if (w.includes("暴") && w.includes("雨")) return "storm"
  if (w.includes("大") && w.includes("雨")) return "heavyrain"
  if (w.includes("中") && w.includes("雨")) return "rain"
  if (w.includes("小") && w.includes("雨")) return "lightrain"
  if (w.includes("毛毛")) return "drizzle"
  if (w.includes("阵雨")) return "shower"
  if (w.includes("雨")) return "rain"
  if (w.includes("雾") || w.includes("霾")) return "fog"
  if (w.includes("阴")) return "overcast"
  if (w.includes("多云")) return "partlycloudy"
  if (w.includes("晴")) return "sunny"
  return "sunny"
})

const scale = computed(() => props.size / 56)
</script>

<template>
  <view class="weather-icon" :style="{ transform: 'scale(' + scale + ')' }">
    <!-- 晴 -->
    <view v-if="type === 'sunny'" class="icon sunny">
      <view class="sun-core"></view>
      <view class="rays" v-for="i in 12" :key="i" :style="{ '--r': i * 30 + 'deg' }"></view>
    </view>

    <!-- 多云 -->
    <view v-else-if="type === 'partlycloudy'" class="icon partly-cloudy">
      <view class="sun-small"></view>
      <view class="cloud-wrap front">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
    </view>

    <!-- 阴 -->
    <view v-else-if="type === 'overcast'" class="icon overcast">
      <view class="cloud-wrap back">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="cloud-wrap front">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
    </view>

    <!-- 毛毛雨 -->
    <view v-else-if="type === 'drizzle'" class="icon rain drizzle">
      <view class="cloud-wrap">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="curtain c1"></view>
      <view class="drops" v-for="i in 4" :key="i" :style="{ '--d': i * 0.35 + 's', '--x': (i - 2.5) * 6 + 'px' }"></view>
    </view>

    <!-- 小雨 -->
    <view v-else-if="type === 'lightrain'" class="icon rain light">
      <view class="cloud-wrap">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="curtain c1"></view>
      <view class="drops" v-for="i in 4" :key="i" :style="{ '--d': i * 0.22 + 's', '--x': (i - 2.5) * 6 + 'px' }"></view>
    </view>

    <!-- 中雨 -->
    <view v-else-if="type === 'rain'" class="icon rain medium">
      <view class="cloud-wrap">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="curtain c1"></view>
      <view class="curtain c2"></view>
      <view class="drops" v-for="i in 5" :key="i" :style="{ '--d': i * 0.18 + 's', '--x': (i - 3) * 5 + 'px' }"></view>
    </view>

    <!-- 阵雨 -->
    <view v-else-if="type === 'shower'" class="icon rain shower">
      <view class="cloud-wrap">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="curtain c1"></view>
      <view class="drops" v-for="i in 5" :key="i" :style="{ '--d': i * 0.3 + 's', '--x': (i - 3) * 6 + 'px' }"></view>
      <view class="splash" v-for="i in 2" :key="'s'+i" :style="{ '--x': (i - 1.5) * 10 + 'px', '--d': i * 1.2 + 's' }"></view>
    </view>

    <!-- 大雨 -->
    <view v-else-if="type === 'heavyrain'" class="icon rain heavy">
      <view class="cloud-wrap dark">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="curtain c1"></view>
      <view class="curtain c2"></view>
      <view class="curtain c3"></view>
      <view class="drops" v-for="i in 7" :key="i" :style="{ '--d': i * 0.13 + 's', '--x': (i - 4) * 4.5 + 'px' }"></view>
      <view class="splash" v-for="i in 3" :key="'s'+i" :style="{ '--x': (i - 2) * 9 + 'px', '--d': i * 0.9 + 's' }"></view>
    </view>

    <!-- 大阵雨 / 暴风雨 -->
    <view v-else-if="type === 'storm'" class="icon rain storm">
      <view class="cloud-wrap dark">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="curtain c1"></view>
      <view class="curtain c2"></view>
      <view class="curtain c3"></view>
      <view class="curtain c4"></view>
      <view class="drops" v-for="i in 8" :key="i" :style="{ '--d': i * 0.1 + 's', '--x': (i - 4.5) * 4 + 'px' }"></view>
      <view class="splash" v-for="i in 4" :key="'s'+i" :style="{ '--x': (i - 2.5) * 8 + 'px', '--d': i * 0.7 + 's' }"></view>
    </view>

    <!-- 雷阵雨 -->
    <view v-else-if="type === 'thunder'" class="icon thunder">
      <view class="cloud-wrap dark">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="curtain c1"></view>
      <view class="curtain c2"></view>
      <view class="bolt-wrap">
        <view class="bolt-main"></view>
      </view>
      <view class="bolt-glow"></view>
      <view class="drops" v-for="i in 5" :key="i" :style="{ '--d': i * 0.18 + 's', '--x': (i - 3) * 5 + 'px' }"></view>
      <view class="splash" v-for="i in 2" :key="'s'+i" :style="{ '--x': (i - 1.5) * 10 + 'px', '--d': i * 1.2 + 's' }"></view>
    </view>

    <!-- 雪 -->
    <view v-else-if="type === 'snow'" class="icon snow">
      <view class="cloud-wrap">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="flakes" v-for="i in 8" :key="i" :style="{ '--d': i * 0.25 + 's', '--x': (i % 4 - 1.5) * 9 + 'px', '--s': 0.7 + (i % 3) * 0.25 }"></view>
    </view>

    <!-- 雾/霾 -->
    <view v-else-if="type === 'fog'" class="icon fog">
      <view class="mist" v-for="i in 6" :key="i" :style="{ '--d': i * 0.4 + 's', '--y': (i - 3.5) * 7 + 'px' }"></view>
    </view>

    <!-- 默认晴 -->
    <view v-else class="icon sunny">
      <view class="sun-core"></view>
      <view class="rays" v-for="i in 12" :key="i" :style="{ '--r': i * 30 + 'deg' }"></view>
    </view>
  </view>
</template>

<style scoped>
/* 容器 */
.weather-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center;
}

.icon {
  position: relative;
  width: 56px;
  height: 56px;
}

/* ===== 经典云朵形状 (参考 Material Design / Apple Weather) ===== */
.cloud-wrap {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 46px;
  height: 28px;
}
.cloud-wrap.dark .cloud-body,
.cloud-wrap.dark .cloud-bump {
  background: linear-gradient(180deg, #C0C8D4 0%, #98A3B0 100%);
}
.cloud-wrap.back {
  opacity: 0.55;
  transform: translateX(-50%) scale(0.92);
  filter: blur(0.5px);
  animation: driftBack 12s linear infinite;
}
.cloud-wrap.front {
  animation: driftFront 10s linear infinite;
}

/* 平底云身 */
.cloud-body {
  position: absolute;
  width: 100%;
  height: 55%;
  bottom: 0;
  left: 0;
  background: linear-gradient(180deg, #ffffff 0%, #E8EEF5 100%);
  border-radius: 20px 20px 14px 14px;
  filter: drop-shadow(0 3px 6px rgba(0,0,0,0.04));
}

/* 三个圆顶 */
.cloud-bump {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(180deg, #ffffff 0%, #E8EEF5 100%);
}

/* 左顶：小 */
.cloud-bump.bl {
  width: 20px;
  height: 20px;
  bottom: 10px;
  left: 4px;
}

/* 中顶：大，最高 */
.cloud-bump.bc {
  width: 28px;
  height: 28px;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
}

/* 右顶：中 */
.cloud-bump.br {
  width: 22px;
  height: 22px;
  bottom: 8px;
  right: 2px;
}

/* 阴天后层云更深 */
.overcast .cloud-wrap.back .cloud-body,
.overcast .cloud-wrap.back .cloud-bump {
  background: linear-gradient(180deg, #B8C4D0 0%, #90A0AE 100%);
}

@keyframes driftFront {
  0%, 100% { transform: translateX(-50%) translateX(0); }
  50% { transform: translateX(-50%) translateX(3px); }
}
@keyframes driftBack {
  0%, 100% { transform: translateX(-50%) scale(0.92) translateX(0); }
  50% { transform: translateX(-50%) scale(0.92) translateX(-2px); }
}

/* ===== 晴 (暖金太阳) ===== */
.sunny .sun-core {
  position: absolute;
  width: 22px;
  height: 22px;
  background: radial-gradient(circle at 35% 35%, #FFF0C0 0%, #F0C060 40%, #D4A040 100%);
  border-radius: 50%;
  box-shadow:
    0 0 8px rgba(212,168,64,0.45),
    0 0 18px rgba(208,140,50,0.35),
    inset 0 -2px 4px rgba(200,140,60,0.2);
  animation: pulse 4s ease-in-out infinite;
}

.sunny .rays {
  position: absolute;
  width: 2px;
  height: 10px;
  background: linear-gradient(180deg, transparent 0%, #E0B860 50%, transparent 100%);
  top: -14px;
  left: 50%;
  transform-origin: bottom center;
  transform: translateX(-50%) rotate(var(--r));
  opacity: 0.65;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 8px rgba(212,168,64,0.45), 0 0 18px rgba(208,140,50,0.35), inset 0 -2px 4px rgba(200,140,60,0.2); }
  50% { transform: scale(1.08); box-shadow: 0 0 14px rgba(212,168,64,0.65), 0 0 28px rgba(208,140,50,0.45), inset 0 -2px 4px rgba(200,140,60,0.3); }
}

/* ===== 多云 ===== */
.partly-cloudy {
  animation: floatCloud 5s ease-in-out infinite;
}
.partly-cloudy .sun-small {
  position: absolute;
  width: 16px;
  height: 16px;
  background: radial-gradient(circle at 35% 35%, #FFF0C0, #F0C060, #D4A040);
  border-radius: 50%;
  top: 2px;
  right: 2px;
  box-shadow: 0 0 8px rgba(212,168,64,0.45);
  animation: pulse 4s ease-in-out infinite;
}
.partly-cloudy .cloud-wrap { animation: cloudBob 5s ease-in-out infinite; }

@keyframes floatCloud {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes cloudBob {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-2px); }
}

/* ===== 雨通用 ===== */
.rain .drops {
  position: absolute;
  width: 2px;
  height: 12px;
  background: linear-gradient(180deg, transparent 0%, #8DCFB8 30%, #6DAF98 100%);
  bottom: 0;
  left: 50%;
  transform: translateX(calc(var(--x) - 50%));
  border-radius: 1px 1px 3px 3px;
  animation: fall var(--d) linear infinite;
  opacity: 0.85;
  pointer-events: none;
}

.rain.drizzle .drops { height: 7px; width: 1.5px; background: linear-gradient(180deg, transparent 0%, #A8D4C8 40%, #8ABAA8 100%); opacity: 0.7; }
.rain.light .drops { height: 10px; width: 2px; }
.rain.medium .drops { height: 12px; width: 2px; }
.rain.shower .drops { height: 16px; width: 2.5px; background: linear-gradient(180deg, transparent 0%, #78C4A8 30%, #58A088 100%); animation: shuffle var(--d) ease-in-out infinite; }
.rain.heavy .drops { height: 14px; width: 2.5px; background: linear-gradient(180deg, transparent 0%, #6DAF98 30%, #4A9078 100%); }
.rain.storm .drops { height: 15px; width: 3px; background: linear-gradient(180deg, transparent 0%, #58A088 30%, #3D7860 100%); }
.thunder .drops { height: 12px; width: 2px; }

/* 雨幕 - 斜向半透明雨线 */
.curtain {
  position: absolute;
  bottom: 0;
  left: 5px;
  right: 5px;
  height: 16px;
  background: repeating-linear-gradient(
    -20deg,
    transparent,
    transparent 4px,
    rgba(109,175,152,0.18) 4px,
    rgba(109,175,152,0.18) 5px
  );
  mask-image: linear-gradient(0deg, transparent 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0) 100%);
  -webkit-mask-image: linear-gradient(0deg, transparent 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0) 100%);
  animation: curtainScroll 1.2s linear infinite;
  opacity: 0;
  pointer-events: none;
}
.curtain.c1 { opacity: 1; left: 6px; right: 6px; }
.curtain.c2 { opacity: 1; left: 10px; right: 10px; animation-delay: 0.4s; }
.curtain.c3 { opacity: 1; left: 14px; right: 14px; animation-delay: 0.8s; }
.curtain.c4 { opacity: 1; left: 18px; right: 18px; animation-delay: 0.2s; }

.rain.storm .curtain,
.thunder .curtain { background: repeating-linear-gradient(-20deg, transparent, transparent 3px, rgba(88,160,136,0.22) 3px, rgba(88,160,136,0.22) 4px); }

@keyframes curtainScroll {
  0% { transform: translateY(-4px); }
  100% { transform: translateY(6px); }
}

/* 溅射效果 */
.splash {
  position: absolute;
  width: 3px;
  height: 3px;
  background: rgba(109,175,152,0.5);
  border-radius: 50%;
  bottom: -2px;
  left: 50%;
  transform: translateX(calc(var(--x) - 50%)) scale(0);
  animation: splat var(--d) ease-out infinite;
  pointer-events: none;
}

.rain.storm .splash { width: 4px; height: 4px; background: rgba(88,160,136,0.6); }
.thunder .splash { background: rgba(109,175,152,0.45); }

@keyframes splat {
  0% { transform: translateX(calc(var(--x) - 50%)) translateY(-2px) scale(0); opacity: 0; }
  40% { transform: translateX(calc(var(--x) - 50%)) translateY(0) scale(1.5); opacity: 0.7; }
  100% { transform: translateX(calc(var(--x) - 50%)) translateY(2px) scale(0.5); opacity: 0; }
}

@keyframes shuffle {
  0%, 100% { transform: translateX(calc(var(--x) - 50%)) translateY(-14px); opacity: 0; }
  15% { opacity: 0.9; }
  40% { opacity: 0.9; transform: translateX(calc(var(--x) - 50% + 2px)) translateY(10px); }
  55% { opacity: 0.6; transform: translateX(calc(var(--x) - 50% - 2px)) translateY(18px); }
  85% { opacity: 0.3; }
  100% { transform: translateX(calc(var(--x) - 50%)) translateY(28px); opacity: 0; }
}

.rain.shower .drops { animation: shuffle var(--d) ease-in-out infinite; }

@keyframes fall {
  0% { transform: translateX(calc(var(--x) - 50%)) translateY(-16px); opacity: 0; }
  8% { opacity: 0.85; }
  92% { opacity: 0.85; }
  100% { transform: translateX(calc(var(--x) - 50%)) translateY(28px); opacity: 0; }
}

/* ===== 雷阵雨 - 经典锯齿闪电 ===== */
.thunder .bolt-wrap {
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 30px;
  pointer-events: none;
}
.thunder .bolt-main {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #FFF0C0 0%, #F0C860 40%, #D4A040 100%);
  /* 经典锯齿闪电：上宽下尖，三段转折 */
  clip-path: polygon(
    55% 0%,       /* 顶尖偏右 */
    38% 36%,      /* 第一段右折 */
    52% 36%,      /* 内收 */
    42% 60%,      /* 第二段左折 */
    58% 60%,      /* 内收 */
    32% 100%,     /* 底尖偏左 */
    42% 65%,      /* 左分叉回 */
    54% 65%,      /* 左分叉内 */
    44% 40%,      /* 右分叉回 */
    58% 40%,      /* 右分叉外 */
    44% 0%        /* 回顶 */
  );
  filter:
    drop-shadow(0 0 6px rgba(240,200,96,0.7))
    drop-shadow(0 0 14px rgba(212,160,64,0.4));
  animation: flash 4s ease-in-out infinite;
}
.thunder .bolt-glow {
  position: absolute;
  width: 44px;
  height: 44px;
  background: radial-gradient(circle, rgba(240,200,96,0.45) 0%, rgba(212,160,64,0.2) 50%, transparent 70%);
  border-radius: 50%;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  animation: flashGlow 4s ease-in-out infinite;
}

/* 慢速闪电动画：亮 1s → 暗 2.5s → 亮 0.5s → 暗 */
@keyframes flash {
  0%, 45%, 100% { opacity: 0; }
  15%, 40% { opacity: 1; }
}
@keyframes flashGlow {
  0%, 45%, 100% { opacity: 0; transform: translateX(-50%) scale(0.8); }
  15%, 40% { opacity: 1; transform: translateX(-50%) scale(1.1); }
}

/* ===== 雪 ===== */
.snow .flakes {
  position: absolute;
  width: 5px;
  height: 5px;
  background: #fff;
  border-radius: 50%;
  top: -6px;
  left: 50%;
  transform: translateX(calc(var(--x) - 50%)) scale(var(--s));
  opacity: 0.95;
  filter: drop-shadow(0 0 1px rgba(255,255,255,0.9));
  animation: snowFall var(--d) ease-in infinite;
}

@keyframes snowFall {
  0% { transform: translateX(calc(var(--x) - 50%)) translateY(-8px) rotate(0deg) scale(var(--s)); opacity: 0; }
  12% { opacity: 0.95; }
  88% { opacity: 0.95; }
  100% { transform: translateX(calc(var(--x) - 50%) + 6px) translateY(32px) rotate(220deg) scale(var(--s)); opacity: 0; }
}

/* ===== 雾/霾 ===== */
.fog .mist {
  position: absolute;
  width: 42px;
  height: 3px;
  background: linear-gradient(90deg, transparent 0%, rgba(160,168,180,0.55) 50%, transparent 100%);
  border-radius: 1.5px;
  left: 50%;
  transform: translateX(-50%) translateY(var(--y));
  animation: mistFlow var(--d) ease-in-out infinite;
}

@keyframes mistFlow {
  0%, 100% { opacity: 0.25; transform: translateX(-50%) translateY(var(--y)) scaleX(0.92); }
  50% { opacity: 0.6; transform: translateX(-50%) translateY(var(--y)) scaleX(1.08); }
}
</style>