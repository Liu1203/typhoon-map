export function gradientFor(w: string): string {
  if (w.includes("雷")) return "linear-gradient(175deg, #3A4458 0%, #566076 40%, #788098 100%)"
  if (w.includes("大") && w.includes("阵")) return "linear-gradient(175deg, #4A6070 0%, #6C8292 40%, #90A4B4 100%)"
  if (w.includes("暴") && w.includes("雨")) return "linear-gradient(175deg, #4A6070 0%, #6C8292 40%, #90A4B4 100%)"
  if (w.includes("雪") || w.includes("冰雹") || w.includes("雹")) return "linear-gradient(175deg, #C8D8E8 0%, #DDE8F2 40%, #EDF3FA 100%)"
  if (w.includes("雾") || w.includes("霾")) return "linear-gradient(175deg, #B8C4D0 0%, #D0DAE4 50%, #E4EBF2 100%)"
  if (w.includes("大") && w.includes("雨")) return "linear-gradient(175deg, #587080 0%, #7890A0 40%, #98AEBE 100%)"
  if (w.includes("阵雨")) return "linear-gradient(175deg, #688088 0%, #889EA8 50%, #A8BCC6 100%)"
  if (w.includes("中") && w.includes("雨")) return "linear-gradient(175deg, #6E8890 0%, #8EA4AE 50%, #AEC0C8 100%)"
  if (w.includes("小") && w.includes("雨")) return "linear-gradient(175deg, #789098 0%, #98ACB4 50%, #B6C8CE 100%)"
  if (w.includes("毛毛")) return "linear-gradient(175deg, #7C969E 0%, #9EB0B8 50%, #BCCAD0 100%)"
  if (w.includes("雨")) return "linear-gradient(175deg, #789098 0%, #98AEB6 50%, #B8CAD0 100%)"
  if (w.includes("阴")) return "linear-gradient(175deg, #98ACB6 0%, #B8C8D2 50%, #D4E0E8 100%)"
  if (w.includes("多云")) return "linear-gradient(175deg, #78A8C0 0%, #A0C4D8 40%, #CCE0EC 100%)"
  if (w.includes("晴")) return "linear-gradient(175deg, #6DB4E0 0%, #98CAE8 35%, #C4E0F2 100%)"
  return "linear-gradient(175deg, #7AB8D8 0%, #A8D4E8 35%, #D8ECF8 100%)"
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

export function windArrow(dir: string): string {
  const m: Record<string, string> = { "北风": "↓", "东北风": "↙", "东风": "←", "东南风": "↖", "南风": "↑", "西南风": "↗", "西风": "→", "西北风": "↘" }
  return m[dir] || dir
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

export const UNITS_DEFAULT = { temp: "c" as const, wind: "kmh" as const, refresh: 30 }
export type UnitSettings = typeof UNITS_DEFAULT

export function getUnitSettings(): UnitSettings {
  try {
    const raw = uni.getStorageSync("unit_settings") as string
    if (raw) return { ...UNITS_DEFAULT, ...JSON.parse(raw) }
  } catch {}
  return { ...UNITS_DEFAULT }
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

export function moonriseMoonset(lat: number, lon: number, date?: Date): Promise<{ rise: string; set: string } | null> {
  const d = date || new Date()
  const ds = d.toISOString().slice(0, 10)
  return new Promise((resolve) => {
    uni.request({
      url: `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=moonrise,moonset&timezone=auto&start_date=${ds}&end_date=${ds}`,
      timeout: 5000,
      success(r: any) {
        const daily = r?.data?.daily
        if (daily?.moonrise?.[0] && daily?.moonset?.[0]) {
          resolve({
            rise: daily.moonrise[0].slice(11, 16),
            set: daily.moonset[0].slice(11, 16),
          })
        } else {
          resolve(null)
        }
      },
      fail() { resolve(null) },
    })
  })
}
