<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue"
import type { TyphoonPoint } from "@/api/typhoon"

const props = defineProps<{
  history: TyphoonPoint[]
  forecast: TyphoonPoint[]
  currentPos: TyphoonPoint | null
}>()

const emit = defineEmits<{
  markerTap: [point: TyphoonPoint, type: "history" | "forecast"]
}>()

const PAD = 60
const GRADES: Record<string, string> = {
  TD: "#5DADE2", TS: "#F4D03F", STS: "#E67E22",
  TY: "#E74C3C", STY: "#8E44AD", SuperTY: "#FF1493",
}
function gc(g: string) { return GRADES[g] || "#90A4AE" }

const bounds = computed(() => {
  const all = [...props.history, ...props.forecast]
  if (!all.length) return null
  let a = 90, b = -90, c = 180, d = -180
  for (const p of all) {
    if (p.lat < a) a = p.lat
    if (p.lat > b) b = p.lat
    if (p.lon < c) c = p.lon
    if (p.lon > d) d = p.lon
  }
  return { a, b, c, d, s: Math.max(b - a, d - c, 1) }
})

function xy(lat: number, lon: number, w: number, h: number): string {
  const B = bounds.value
  if (!B) return "0,0"
  return (PAD + ((lon - B.c) / B.s) * (w - 2 * PAD)).toFixed(1) + "," +
         (PAD + ((B.b - lat) / B.s) * (h - 2 * PAD)).toFixed(1)
}

const svgW = ref(0)
const svgH = ref(0)

function buildSvg(): string {
  const w = svgW.value || 360
  const h = svgH.value || 500
  const H = props.history, F = props.forecast, CP = props.currentPos
  let parts: string[] = []
  if (!H.length && !F.length) {
    return '<rect width="100%" height="100%" fill="#F0F5FA"/><text x="50%" y="50%" text-anchor="middle" fill="#8B9CAD" font-size="14">暂无可追踪台风</text>'
  }

  function segs(pts: TyphoonPoint[], dash: string) {
    if (pts.length < 2) return
    let s = 0
    for (let i = 1; i <= pts.length; i++) {
      if (i === pts.length || pts[i].grade !== pts[i - 1].grade) {
        const sub = pts.slice(s, i + 1)
        const d = sub.map((p, j) => (j === 0 ? "M" : "L") + xy(p.lat, p.lon, w, h)).join("")
        parts.push('<path d="' + d + '" stroke="' + gc(sub[0].grade) + '" fill="none" stroke-width="3"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + '/>')
        s = i
      }
    }
  }

  segs(H, "")
  if (H.length && F.length) {
    const d = "M" + xy(H[H.length - 1].lat, H[H.length - 1].lon, w, h) + "L" + xy(F[0].lat, F[0].lon, w, h)
    parts.push('<path d="' + d + '" stroke="' + gc(H[H.length - 1].grade) + '" fill="none" stroke-width="3" stroke-dasharray="8,8"/>')
  }
  segs(F, "8,8")

  function dot(lat: number, lon: number, r: number, fill: string, stroke?: string, sw?: number, extra?: string) {
    const c = xy(lat, lon, w, h)
    const p = '<circle cx="' + c.split(",")[0] + '" cy="' + c.split(",")[1] + '" r="' + r + '" fill="' + fill + '"' +
      (stroke ? ' stroke="' + stroke + '" stroke-width="' + (sw || 2) + '"' : "") +
      (extra ? " " + extra : "") + '/>'
    parts.push(p)
  }

  if (CP) {
    dot(CP.lat, CP.lon, 18, "none", gc(CP.grade), 2, 'opacity="0.4" class="pulse"')
    dot(CP.lat, CP.lon, 13, "#fff")
    dot(CP.lat, CP.lon, 10, gc(CP.grade))
  }

  function wayPts(pts: TyphoonPoint[], skipLast: boolean) {
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      if (CP && p === CP) continue
      if (skipLast && i === pts.length - 1) continue
      dot(p.lat, p.lon, 7, gc(p.grade), "#fff", 2)
    }
  }
  wayPts(H, !!CP)
  wayPts(F, false)

  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="background:#F0F5FA">' +
    parts.join("") +
    '<style>.pulse{animation:p 2s ease-out infinite}@keyframes p{0%{transform:scale(.8);opacity:.6}to{transform:scale(1.5);opacity:0}}circle{cursor:pointer}</style></svg>'
}

const svgContent = computed(() => buildSvg())

function measureSize() {
  const info = uni.getSystemInfoSync()
  svgW.value = info.windowWidth || 360
  svgH.value = (info.windowHeight || 600) - 200
  nextTick(() => {
    uni.createSelectorQuery().select('.svg-wrap').boundingClientRect((rect: any) => {
      if (rect && rect.width > 0 && rect.height > 0) {
        svgW.value = Math.floor(rect.width)
        svgH.value = Math.floor(rect.height)
      }
    }).exec()
  })
}

onMounted(() => {
  setTimeout(measureSize, 100)
  setTimeout(measureSize, 500)
})

const containerRef = ref<any>(null)

function onTap(e: any) {
  const touch = e.detail || e
  const rect = containerRef.value && containerRef.value.$el ? containerRef.value.$el.getBoundingClientRect() : null
  if (!rect) return
  const tx = (touch.x || touch.clientX || 0) - rect.left
  const ty = (touch.y || touch.clientY || 0) - rect.top
  const w = svgW.value || 360, h = svgH.value || 500

  const all = [...props.history.map((p, i) => ({ p, t: "history" as const }))]
  if (props.currentPos) all.push({ p: props.currentPos, t: "history" as const })
  all.push(...props.forecast.map((p, i) => ({ p, t: "forecast" as const })))

  for (const { p, t } of all) {
    const [x, y] = xy(p.lat, p.lon, w, h).split(",").map(Number)
    const dx = tx - x, dy = ty - y
    if (dx * dx + dy * dy < 400) {
      emit("markerTap", p, t)
      return
    }
  }
}
</script>

<template>
  <view ref="containerRef" class="svg-wrap" @tap="onTap">
    <view v-html="svgContent" class="svg-inner"></view>
  </view>
</template>

<style scoped>
.svg-wrap {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: var(--color-bg);
}
.svg-inner {
  width: 100%;
  height: 100%;
}
</style>
