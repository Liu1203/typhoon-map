<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{ weather: string }>()

interface P {
  key: number
  cls: string
  style: Record<string, string>
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

const scene = computed(() => {
  const w = props.weather
  if (!w) return "none"
  if (w.includes("雷")) return "thunder"
  if (w.includes("雪") || w.includes("冰雹") || w.includes("雹")) return "snow"
  if (w.includes("雨")) return "rain"
  if (w.includes("雾") || w.includes("霾")) return "fog"
  return "clear"
})

const particles = computed<P[]>(() => {
  const s = scene.value
  const out: P[] = []
  let key = 0
  const push = (cls: string, style: Record<string, string>) => out.push({ key: key++, cls, style })

  if (s === "rain" || s === "thunder") {
    for (let i = 0; i < 26; i++) {
      push("p rain", {
        left: rand(0, 100) + "%",
        height: rand(8, 16) + "px",
        opacity: String(rand(0.35, 0.8)),
        animationDuration: rand(0.6, 1.2) + "s",
        animationDelay: "-" + rand(0, 1.2) + "s",
      })
    }
  } else if (s === "snow") {
    for (let i = 0; i < 20; i++) {
      push("p snow", {
        left: rand(0, 100) + "%",
        width: rand(3, 6) + "px",
        height: rand(3, 6) + "px",
        opacity: String(rand(0.5, 0.9)),
        animationDuration: rand(4, 8) + "s",
        animationDelay: "-" + rand(0, 6) + "s",
      })
    }
  } else if (s === "fog") {
    for (let i = 0; i < 8; i++) {
      push("p fog", {
        left: rand(-20, 55) + "%",
        top: rand(5, 80) + "%",
        width: rand(45, 90) + "%",
        opacity: String(rand(0.05, 0.14)),
        animationDuration: rand(9, 16) + "s",
        animationDelay: "-" + rand(0, 8) + "s",
      })
    }
  } else if (s === "clear") {
    for (let i = 0; i < 14; i++) {
      push("p spark", {
        left: rand(0, 100) + "%",
        top: rand(0, 100) + "%",
        width: rand(2, 4) + "px",
        height: rand(2, 4) + "px",
        opacity: String(rand(0.15, 0.4)),
        animationDuration: rand(3, 7) + "s",
        animationDelay: "-" + rand(0, 5) + "s",
      })
    }
  }
  return out
})
</script>

<template>
  <view class="weather-particles" v-if="particles.length">
    <view v-for="p in particles" :key="p.key" :class="p.cls" :style="p.style" />
    <view class="thunder-flash" v-if="scene === 'thunder'" />
  </view>
</template>

<style scoped>
.weather-particles {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}
.p {
  position: absolute;
}
.p.rain {
  width: 1.5px;
  background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(174,214,241,0.9) 100%);
  border-radius: 1px;
  animation: rainFall linear infinite;
}
@keyframes rainFall {
  0% { transform: translateY(-15vh); }
  100% { transform: translateY(115vh); }
}
.p.snow {
  border-radius: 50%;
  background: rgba(255,255,255,0.95);
  box-shadow: 0 0 6px rgba(255,255,255,0.6);
  animation: snowFall ease-in infinite;
}
@keyframes snowFall {
  0% { transform: translate(0, -15vh); }
  50% { transform: translate(20px, 50vh); }
  100% { transform: translate(-12px, 115vh); }
}
.p.fog {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%);
  animation: fogDrift ease-in-out infinite alternate;
}
@keyframes fogDrift {
  0% { transform: translateX(0); }
  100% { transform: translateX(42px); }
}
.p.spark {
  border-radius: 50%;
  background: rgba(255,255,255,0.9);
  animation: sparkDrift ease-in-out infinite;
}
@keyframes sparkDrift {
  0% { transform: translateY(0); opacity: 0.2; }
  50% { transform: translateY(-22px); opacity: 0.5; }
  100% { transform: translateY(0); opacity: 0.2; }
}
.thunder-flash {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.4);
  animation: thunderFlash 7s ease-in-out infinite;
  opacity: 0;
}
@keyframes thunderFlash {
  0%, 88%, 100% { opacity: 0; }
  90% { opacity: 0.7; }
  92% { opacity: 0; }
  94% { opacity: 0.45; }
}
</style>
