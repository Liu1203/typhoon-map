export function gradientColors(w: string): [string, string, string] {
  if (w.includes("雷")) return ["#3A4458", "#566076", "#788098"]
  if (w.includes("大") && w.includes("阵")) return ["#4A6070", "#6C8292", "#90A4B4"]
  if (w.includes("暴") && w.includes("雨")) return ["#4A6070", "#6C8292", "#90A4B4"]
  if (w.includes("雪") || w.includes("冰雹") || w.includes("雹")) return ["#C8D8E8", "#DDE8F2", "#EDF3FA"]
  if (w.includes("雾") || w.includes("霾")) return ["#B8C4D0", "#D0DAE4", "#E4EBF2"]
  if (w.includes("大") && w.includes("雨")) return ["#587080", "#7890A0", "#98AEBE"]
  if (w.includes("阵雨")) return ["#688088", "#889EA8", "#A8BCC6"]
  if (w.includes("中") && w.includes("雨")) return ["#6E8890", "#8EA4AE", "#AEC0C8"]
  if (w.includes("小") && w.includes("雨")) return ["#789098", "#98ACB4", "#B6C8CE"]
  if (w.includes("毛毛")) return ["#7C969E", "#9EB0B8", "#BCCAD0"]
  if (w.includes("雨")) return ["#789098", "#98AEB6", "#B8CAD0"]
  if (w.includes("阴")) return ["#98ACB6", "#B8C8D2", "#D4E0E8"]
  if (w.includes("多云")) return ["#78A8C0", "#A0C4D8", "#CCE0EC"]
  if (w.includes("晴")) return ["#6DB4E0", "#98CAE8", "#C4E0F2"]
  return ["#7AB8D8", "#A8D4E8", "#D8ECF8"]
}

export function gradientFor(w: string): string {
  const c = gradientColors(w)
  return `linear-gradient(175deg, ${c[0]} 0%, ${c[1]} 40%, ${c[2]} 100%)`
}

export function accentFor(w: string): string {
  if (w.includes("雷")) return "#D4A550"
  if (w.includes("大") && w.includes("阵")) return "#688898"
  if (w.includes("暴") && w.includes("雨")) return "#608090"
  if (w.includes("雪") || w.includes("冰雹") || w.includes("雹")) return "#8B9DAF"
  if (w.includes("雾") || w.includes("霾")) return "#8EA0B0"
  if (w.includes("大") && w.includes("雨")) return "#5A8A90"
  if (w.includes("阵雨")) return "#6DAF98"
  if (w.includes("毛毛")) return "#8DCFB8"
  if (w.includes("雨")) return "#6DAF98"
  if (w.includes("阴")) return "#8898A8"
  if (w.includes("多云")) return "#D4A550"
  if (w.includes("晴")) return "#E09050"
  return "#E09050"
}

export function lightFor(w: string): boolean {
  return w.includes("雪") || w.includes("雾") || w.includes("霾") || w.includes("阴") || w.includes("毛毛")
}

export function hourLabel(t: string): string {
  const h = parseInt(t) || 0
  return h + "时"
}

export function hourNum(t: string): number {
  const parts = t.split(":")
  return parseInt(parts[0]) || 0
}

export function uvLabel(index: string): string {
  const v = parseFloat(index)
  if (isNaN(v)) return index
  if (v <= 2) return "低"
  if (v <= 5) return "中等"
  if (v <= 7) return "高"
  if (v <= 10) return "很高"
  return "极端"
}

export function sunHour(sun: string): number {
  const parts = sun.split(":")
  const h = parseInt(parts[0]) || 6
  const m = parts[1] || "00"
  if (m.includes("PM") && h < 12) return h + 12
  if (m.includes("AM") && h === 12) return 0
  return h
}

export interface ModuleConfig {
  detail: boolean
  aqi: boolean
  forecast: boolean
  hourly: boolean
  lifetips: boolean
  temptr: boolean
  preciptr: boolean
}

export const MODULE_ORDER_DEFAULT = ["detail", "aqi", "forecast", "hourly", "lifetips", "temptr", "preciptr"]

export const UNITS_DEFAULT = {
  temp: "c" as const,
  wind: "kmh" as const,
  refresh: 30,
  pressure: "hpa" as const,
  visibility: "km" as const,
  modules: {
    detail: true,
    aqi: true,
    forecast: true,
    hourly: true,
    lifetips: true,
    temptr: true,
    preciptr: true,
  },
  moduleOrder: [...MODULE_ORDER_DEFAULT],
}

export type UnitSettings = {
  temp: "c" | "f"
  wind: "kmh" | "ms"
  refresh: number
  pressure: "hpa" | "inhg"
  visibility: "km" | "mi"
  modules: ModuleConfig
  moduleOrder: string[]
}

function normalizeModuleOrder(order: any): string[] {
  if (!Array.isArray(order)) return [...MODULE_ORDER_DEFAULT]
  const known = MODULE_ORDER_DEFAULT
  const result: string[] = []
  order.forEach((k: any) => { if (known.includes(k) && !result.includes(k)) result.push(k) })
  known.forEach(k => { if (!result.includes(k)) result.push(k) })
  return result
}

export function getUnitSettings(): UnitSettings {
  try {
    const raw = uni.getStorageSync("unit_settings") as string
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...UNITS_DEFAULT,
        ...parsed,
        modules: { ...UNITS_DEFAULT.modules, ...(parsed.modules || {}) },
        moduleOrder: normalizeModuleOrder(parsed.moduleOrder),
      }
    }
  } catch {}
  return { ...UNITS_DEFAULT, modules: { ...UNITS_DEFAULT.modules }, moduleOrder: [...MODULE_ORDER_DEFAULT] }
}

export function formatTemp(val: string, toF: boolean): string {
  if (!val || val === "--") return val
  const n = parseFloat(val)
  if (isNaN(n)) return val
  return toF ? String(Math.round(n * 9 / 5 + 32)) : val
}

export function formatWind(val: string, unit: string): string {
  if (!val || val === "--") return val
  const n = parseFloat(val)
  if (isNaN(n)) return val
  if (unit === "ms") return (n / 3.6).toFixed(1)
  return String(Math.round(n))
}

export function formatPressure(val: string, unit: string): string {
  if (!val || val === "--") return val
  const m = String(val).match(/[\d.]+/)
  if (!m) return val
  const n = parseFloat(m[0])
  if (isNaN(n)) return val
  if (unit === "inhg") return (n * 0.02953).toFixed(2) + " inHg"
  return Math.round(n) + " hPa"
}

export function formatVisibility(val: string, unit: string): string {
  if (!val || val === "--") return val
  const m = String(val).match(/[\d.]+/)
  if (!m) return val
  const n = parseFloat(m[0])
  if (isNaN(n)) return val
  if (unit === "mi") return (n * 0.621371).toFixed(1) + " mi"
  return n.toFixed(1) + " km"
}

const LUNAR_CYCLE = 29.53058867
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0)

export function moonPhase(date?: Date): { phase: string; icon: string } {
  const d = date || new Date()
  const days = (d.getTime() - KNOWN_NEW_MOON) / 86400000
  const pct = ((days % LUNAR_CYCLE) / LUNAR_CYCLE)
  if (pct < 0.025 || pct >= 0.975) return { phase: "新月", icon: "🌑" }
  if (pct < 0.25) return { phase: "蛾眉月", icon: "🌒" }
  if (pct < 0.275) return { phase: "上弦月", icon: "🌓" }
  if (pct < 0.475) return { phase: "盈凸月", icon: "🌔" }
  if (pct < 0.525) return { phase: "满月", icon: "🌕" }
  if (pct < 0.725) return { phase: "亏凸月", icon: "🌖" }
  if (pct < 0.775) return { phase: "下弦月", icon: "🌗" }
  return { phase: "残月", icon: "🌘" }
}


