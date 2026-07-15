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
  if (w.includes("雪") || w.includes("冰雹")) return "snow"
  if (w.includes("大") && w.includes("雨")) return "heavyrain"
  if (w.includes("中") && w.includes("雨")) return "rain"
  if (w.includes("小") && w.includes("雨")) return "lightrain"
  if (w.includes("雨") || w.includes("阵雨") || w.includes("毛毛")) return "rain"
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

    <!-- 小雨 -->
    <view v-else-if="type === 'lightrain'" class="icon rain light">
      <view class="cloud-wrap">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="drops" v-for="i in 3" :key="i" :style="{ '--d': i * 0.2 + 's', '--x': (i - 2) * 7 + 'px' }"></view>
    </view>

    <!-- 中雨 -->
    <view v-else-if="type === 'rain'" class="icon rain medium">
      <view class="cloud-wrap">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="drops" v-for="i in 5" :key="i" :style="{ '--d': i * 0.15 + 's', '--x': (i - 3) * 5.5 + 'px' }"></view>
    </view>

    <!-- 大雨 -->
    <view v-else-if="type === 'heavyrain'" class="icon rain heavy">
      <view class="cloud-wrap dark">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="drops" v-for="i in 7" :key="i" :style="{ '--d': i * 0.12 + 's', '--x': (i - 4) * 4.5 + 'px' }"></view>
    </view>

    <!-- 雷阵雨 -->
    <view v-else-if="type === 'thunder'" class="icon thunder">
      <view class="cloud-wrap dark">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="bolt-wrap">
        <view class="bolt-main"></view>
      </view>
      <view class="bolt-glow"></view>
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
  background: linear-gradient(180deg, #D8DEE8 0%, #B0BBC8 100%);
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
  background: linear-gradient(180deg, #ffffff 0%, #F0F4F8 100%);
  border-radius: 20px 20px 14px 14px;
  filter: drop-shadow(0 3px 6px rgba(0,0,0,0.06));
}

/* 三个圆顶 */
.cloud-bump {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(180deg, #ffffff 0%, #F0F4F8 100%);
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
  background: linear-gradient(180deg, #D0D8E0 0%, #A8B4C0 100%);
}

@keyframes driftFront {
  0%, 100% { transform: translateX(-50%) translateX(0); }
  50% { transform: translateX(-50%) translateX(3px); }
}
@keyframes driftBack {
  0%, 100% { transform: translateX(-50%) scale(0.92) translateX(0); }
  50% { transform: translateX(-50%) scale(0.92) translateX(-2px); }
}

/* ===== 晴 (参考 iOS Weather) ===== */
.sunny .sun-core {
  position: absolute;
  width: 22px;
  height: 22px;
  background: radial-gradient(circle at 35% 35%, #FFF3A0 0%, #FFD700 40%, #FFB800 100%);
  border-radius: 50%;
  box-shadow: 
    0 0 8px rgba(255,215,0,0.5),
    0 0 16px rgba(255,184,0,0.4),
    inset 0 -2px 4px rgba(255,184,0,0.2);
  animation: pulse 4s ease-in-out infinite;
}

.sunny .rays {
  position: absolute;
  width: 2px;
  height: 10px;
  background: linear-gradient(180deg, transparent 0%, #FFD700 50%, transparent 100%);
  top: -14px;
  left: 50%;
  transform-origin: bottom center;
  transform: translateX(-50%) rotate(var(--r));
  opacity: 0.7;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 8px rgba(255,215,0,0.5), 0 0 16px rgba(255,184,0,0.4), inset 0 -2px 4px rgba(255,184,0,0.2); }
  50% { transform: scale(1.08); box-shadow: 0 0 14px rgba(255,215,0,0.7), 0 0 28px rgba(255,184,0,0.5), inset 0 -2px 4px rgba(255,184,0,0.3); }
}

/* ===== 多云 ===== */
.partly-cloudy {
  animation: floatCloud 5s ease-in-out infinite;
}
.partly-cloudy .sun-small {
  position: absolute;
  width: 16px;
  height: 16px;
  background: radial-gradient(circle at 35% 35%, #FFF3A0, #FFD700, #FFB800);
  border-radius: 50%;
  top: 2px;
  right: 2px;
  box-shadow: 0 0 8px rgba(255,215,0,0.5);
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
  background: linear-gradient(180deg, transparent 0%, #5AA9E6 30%, #4A90D9 100%);
  bottom: -4px;
  left: 50%;
  transform: translateX(calc(var(--x) - 50%));
  border-radius: 1px 1px 3px 3px;
  animation: fall var(--d) linear infinite;
  opacity: 0.85;
}

.rain.light .drops { height: 10px; }
.rain.medium .drops { height: 12px; }
.rain.heavy .drops { height: 14px; background: linear-gradient(180deg, transparent 0%, #4A8CDA 30%, #3A7BC8 100%); width: 2.5px; }

@keyframes fall {
  0% { transform: translateX(calc(var(--x) - 50%)) translateY(-16px); opacity: 0; }
  8% { opacity: 0.85; }
  92% { opacity: 0.85; }
  100% { transform: translateX(calc(var(--x) - 50%)) translateY(26px); opacity: 0; }
}

/* ===== 雷阵雨 - 经典锯齿闪电 ===== */
.thunder .bolt-wrap {
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 30px;
}
.thunder .bolt-main {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #FFF176 0%, #FFD740 40%, #FFAB00 100%);
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
    drop-shadow(0 0 6px rgba(255,215,64,0.8))
    drop-shadow(0 0 14px rgba(255,171,0,0.5));
  animation: flash 4s ease-in-out infinite;
}
.thunder .bolt-glow {
  position: absolute;
  width: 44px;
  height: 44px;
  background: radial-gradient(circle, rgba(255,238,88,0.5) 0%, rgba(255,171,0,0.25) 50%, transparent 70%);
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
  background: linear-gradient(90deg, transparent 0%, rgba(180,195,205,0.65) 50%, transparent 100%);
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