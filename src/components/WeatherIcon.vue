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
    </view>

    <!-- 多云 -->
    <view v-else-if="type === 'partlycloudy'" class="icon partly-cloudy">
      <view class="sun-small"></view>
      <view class="cloud">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
    </view>

    <!-- 阴 -->
    <view v-else-if="type === 'overcast'" class="icon overcast">
      <view class="cloud">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
    </view>

    <!-- 毛毛雨 -->
    <view v-else-if="type === 'drizzle'" class="icon rain drizzle">
      <view class="cloud">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="drops" v-for="i in 2" :key="i" :style="{ '--d': i * 0.6 + 's', '--x': (i - 1.5) * 7 + 'px' }"></view>
    </view>

    <!-- 小雨 -->
    <view v-else-if="type === 'lightrain'" class="icon rain light">
      <view class="cloud">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="drops" v-for="i in 2" :key="i" :style="{ '--d': i * 0.4 + 's', '--x': (i - 1.5) * 7 + 'px' }"></view>
    </view>

    <!-- 中雨 / 雨 -->
    <view v-else-if="type === 'rain'" class="icon rain medium">
      <view class="cloud">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="drops" v-for="i in 3" :key="i" :style="{ '--d': i * 0.3 + 's', '--x': (i - 2) * 6 + 'px' }"></view>
    </view>

    <!-- 阵雨 -->
    <view v-else-if="type === 'shower'" class="icon rain shower">
      <view class="cloud">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="drops" v-for="i in 3" :key="i" :style="{ '--d': i * 0.5 + 's', '--x': (i - 2) * 7 + 'px' }"></view>
    </view>

    <!-- 大雨 -->
    <view v-else-if="type === 'heavyrain'" class="icon rain heavy">
      <view class="cloud dark">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="drops" v-for="i in 3" :key="i" :style="{ '--d': i * 0.25 + 's', '--x': (i - 2) * 6 + 'px' }"></view>
    </view>

    <!-- 大阵雨 / 暴风雨 -->
    <view v-else-if="type === 'storm'" class="icon rain storm">
      <view class="cloud dark">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="drops" v-for="i in 3" :key="i" :style="{ '--d': i * 0.2 + 's', '--x': (i - 2) * 6 + 'px' }"></view>
    </view>

    <!-- 雷阵雨 -->
    <view v-else-if="type === 'thunder'" class="icon thunder rain">
      <view class="cloud dark">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="bolt"></view>
      <view class="drops" v-for="i in 3" :key="i" :style="{ '--d': i * 0.3 + 's', '--x': (i - 2) * 6 + 'px' }"></view>
    </view>

    <!-- 雪 -->
    <view v-else-if="type === 'snow'" class="icon snow">
      <view class="cloud">
        <view class="cloud-body"></view>
        <view class="cloud-bump bl"></view>
        <view class="cloud-bump bc"></view>
        <view class="cloud-bump br"></view>
      </view>
      <view class="flakes" v-for="i in 3" :key="i" :style="{ '--d': i * 0.5 + 's', '--x': (i - 2) * 8 + 'px', '--s': 0.7 + (i % 3) * 0.25 }"></view>
    </view>

    <!-- 雾/霾 -->
    <view v-else-if="type === 'fog'" class="icon fog">
      <view class="mist" v-for="i in 2" :key="i" :style="{ '--d': i * 1.2 + 's', '--y': (i - 1.5) * 10 + 'px' }"></view>
    </view>

    <!-- 默认晴 -->
    <view v-else class="icon sunny">
      <view class="sun-core"></view>
    </view>
  </view>
</template>

<style scoped>
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

/* 云朵 */
.cloud {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 46px;
  height: 28px;
}
.cloud.dark .cloud-body,
.cloud.dark .cloud-bump {
  background: linear-gradient(180deg, #C0C8D4 0%, #98A3B0 100%);
}

.cloud-body {
  position: absolute;
  width: 100%;
  height: 55%;
  bottom: 0;
  left: 0;
  background: linear-gradient(180deg, #ffffff 0%, #E8EEF5 100%);
  border-radius: 20px 20px 14px 14px;
}

.cloud-bump {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(180deg, #ffffff 0%, #E8EEF5 100%);
}

.cloud-bump.bl {
  width: 20px;
  height: 20px;
  bottom: 10px;
  left: 4px;
}

.cloud-bump.bc {
  width: 28px;
  height: 28px;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
}

.cloud-bump.br {
  width: 22px;
  height: 22px;
  bottom: 8px;
  right: 2px;
}

/* 晴 */
.sunny .sun-core {
  position: absolute;
  width: 22px;
  height: 22px;
  background: radial-gradient(circle at 35% 35%, #FFF0C0 0%, #F0C060 40%, #D4A040 100%);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 多云 */
.partly-cloudy .sun-small {
  position: absolute;
  width: 16px;
  height: 16px;
  background: radial-gradient(circle at 35% 35%, #FFF0C0, #F0C060, #D4A040);
  border-radius: 50%;
  top: 2px;
  right: 2px;
}

/* 雨滴 */
.rain .drops {
  position: absolute;
  width: 2px;
  height: 10px;
  background: linear-gradient(180deg, transparent 0%, #8DCFB8 30%, #6DAF98 100%);
  bottom: 0;
  left: 50%;
  transform: translateX(calc(var(--x) - 50%));
  border-radius: 1px 1px 3px 3px;
  animation: fall var(--d) linear infinite;
  opacity: 0.85;
  pointer-events: none;
}

.rain.light .drops { height: 9px; }
.rain.medium .drops { height: 11px; }
.rain.shower .drops { height: 13px; width: 2.5px; animation: shuffle var(--d) ease-in-out infinite; }
.rain.heavy .drops { height: 13px; width: 2.5px; background: linear-gradient(180deg, transparent 0%, #6DAF98 30%, #4A9078 100%); }
.rain.storm .drops { height: 14px; width: 3px; background: linear-gradient(180deg, transparent 0%, #58A088 30%, #3D7860 100%); }
.thunder .drops { height: 15px; width: 3.5px; background: linear-gradient(180deg, transparent 0%, #C0E8FF 30%, #80C8F0 100%); border-radius: 1px 1px 4px 4px; animation: thunder-fall var(--d) ease-in infinite; opacity: 0.95; }

@keyframes fall {
  0% { transform: translateX(calc(var(--x) - 50%)) translateY(-14px); opacity: 0; }
  8% { opacity: 0.85; }
  92% { opacity: 0.85; }
  100% { transform: translateX(calc(var(--x) - 50%)) translateY(26px); opacity: 0; }
}

@keyframes shuffle {
  0%, 100% { transform: translateX(calc(var(--x) - 50%)) translateY(-12px); opacity: 0; }
  15% { opacity: 0.9; }
  40% { opacity: 0.9; transform: translateX(calc(var(--x) - 50% + 2px)) translateY(8px); }
  55% { opacity: 0.6; transform: translateX(calc(var(--x) - 50% - 2px)) translateY(14px); }
  85% { opacity: 0.3; }
  100% { transform: translateX(calc(var(--x) - 50%)) translateY(24px); opacity: 0; }
}

@keyframes thunder-fall {
  0% { transform: translateX(calc(var(--x) - 50%)) translateY(-18px); opacity: 0; }
  12% { opacity: 1; }
  40% { transform: translateX(calc(var(--x) - 50% + 1px)) translateY(6px); }
  80% { opacity: 0.9; }
  100% { transform: translateX(calc(var(--x) - 50% - 1px)) translateY(34px); opacity: 0; }
}

.rain.shower .drops { animation: shuffle var(--d) ease-in-out infinite; }

/* 闪电 */
.thunder .bolt {
  position: absolute;
  width: 14px;
  height: 32px;
  background: linear-gradient(180deg, #FFFFFF 0%, #FFE066 40%, #E8A820 100%);
  clip-path: polygon(50% 0%, 35% 40%, 52% 42%, 28% 100%, 58% 48%, 42% 48%);
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  animation: flash 1.5s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
  filter: drop-shadow(0 0 4px rgba(255, 224, 100, 0.7));
}

@keyframes flash {
  0%, 45%, 100% { opacity: 0.4; filter: drop-shadow(0 0 2px rgba(255, 224, 100, 0.3)); }
  8% { opacity: 1; filter: drop-shadow(0 0 12px #FFE066) brightness(1.4); }
  12% { opacity: 0.5; filter: drop-shadow(0 0 4px rgba(255, 224, 100, 0.5)); }
  18% { opacity: 1; filter: drop-shadow(0 0 16px #FFF0C0) brightness(1.6); }
  25% { opacity: 0.6; }
}

/* 雪 */
.snow .flakes {
  position: absolute;
  width: 5px;
  height: 5px;
  background: #fff;
  border-radius: 50%;
  top: -4px;
  left: 50%;
  transform: translateX(calc(var(--x) - 50%)) scale(var(--s));
  opacity: 0.95;
  animation: snowFall var(--d) ease-in infinite;
  pointer-events: none;
}

@keyframes snowFall {
  0% { transform: translateX(calc(var(--x) - 50%)) translateY(-6px) rotate(0deg) scale(var(--s)); opacity: 0; }
  12% { opacity: 0.95; }
  88% { opacity: 0.95; }
  100% { transform: translateX(calc(var(--x) - 50%) + 4px) translateY(28px) rotate(180deg) scale(var(--s)); opacity: 0; }
}

/* 雾 */
.fog .mist {
  position: absolute;
  width: 38px;
  height: 3px;
  background: linear-gradient(90deg, transparent 0%, rgba(160,168,180,0.55) 50%, transparent 100%);
  border-radius: 1.5px;
  left: 50%;
  transform: translateX(-50%) translateY(var(--y));
  animation: mistFlow var(--d) ease-in-out infinite;
  pointer-events: none;
}

@keyframes mistFlow {
  0%, 100% { opacity: 0.25; transform: translateX(-50%) translateY(var(--y)) scaleX(0.92); }
  50% { opacity: 0.6; transform: translateX(-50%) translateY(var(--y)) scaleX(1.08); }
}
</style>
