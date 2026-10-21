/**
 * 中国环境空气质量指数（AQI）计算，依据 HJ 633-2012《环境空气质量指数（AQI）技术规定》
 * 逐时值按各污染物浓度限值插值取最大分指数；日均值中 O₃ 使用 8 小时滑动均值。
 */

export interface AqiLevel {
  max: number
  label: string
  color: string
  advice: string
}

export const CN_AQI_LEVELS: AqiLevel[] = [
  { max: 50, label: "优", color: "#5BAA6A", advice: "空气清新，适合户外活动" },
  { max: 100, label: "良", color: "#8FC77B", advice: "空气可接受，极少数敏感人群需注意" },
  { max: 150, label: "轻度污染", color: "#E8B84A", advice: "敏感人群应减少长时间户外活动" },
  { max: 200, label: "中度污染", color: "#F09050", advice: "建议减少户外活动，必要时佩戴口罩" },
  { max: 300, label: "重度污染", color: "#E5606E", advice: "避免户外活动，关好门窗" },
  { max: Infinity, label: "严重污染", color: "#A565B8", advice: "避免外出，建议开启空气净化器" },
]

/** 进度条与柱状图的上限刻度（重度污染上限） */
export const AQI_BAR_MAX = 300

const IAQI_BREAKPOINTS = [0, 50, 100, 150, 200, 300, 400, 500]

/** 浓度限值（µg/m³；CO 为 mg/m³） */
export const AQI_TABLES = {
  pm25: { name: "PM2.5", conc: [0, 35, 75, 115, 150, 250, 350, 500] },
  pm10: { name: "PM10", conc: [0, 50, 150, 250, 350, 420, 500, 600] },
  so2: { name: "SO₂", conc: [0, 50, 150, 475, 800, 1600, 2100, 2620] },
  no2: { name: "NO₂", conc: [0, 40, 80, 180, 280, 565, 750, 940] },
  co: { name: "CO", conc: [0, 2, 4, 14, 24, 36, 48, 60] },
  // 臭氧 1 小时限值（逐时值使用）
  o3_1h: { name: "O₃", conc: [0, 160, 200, 300, 400, 800, 1000, 1200] },
  // 臭氧 8 小时滑动均值限值（日均值使用，国标最高到 300）
  o3_8h: { name: "O₃", conc: [0, 100, 160, 215, 265, 800] },
} as const

export interface Pollutants {
  pm25?: number | null
  pm10?: number | null
  no2?: number | null
  o3?: number | null
  so2?: number | null
  co?: number | null
}

/**
 * instant：瞬时浓度，臭氧用 1 小时限值（逐时走势图、拿不到历史数据时兜底）
 * average：均值浓度（PM/NO₂/SO₂/CO 用 24 小时滑动均值，O₃ 用 8 小时滑动均值），
 *          与官方实时 AQI 口径一致，臭氧用 8 小时限值
 */
export type AqiMode = "instant" | "average"

export interface AqiResult {
  aqi: number
  label: string
  color: string
  advice: string
  /** 首要污染物，AQI ≤ 50 时为 undefined */
  primary?: string
  iaqi: Record<string, number>
}

export function aqiLevel(v: number): AqiLevel {
  for (const level of CN_AQI_LEVELS) {
    if (v <= level.max) return level
  }
  return CN_AQI_LEVELS[CN_AQI_LEVELS.length - 1]!
}

function iaqiFor(conc: number, limits: readonly number[]): number {
  const last = limits.length - 1
  const maxIaqi = IAQI_BREAKPOINTS[last]!
  if (!isFinite(conc) || conc <= 0) return 0
  if (conc >= limits[last]!) return maxIaqi
  for (let i = 1; i <= last; i++) {
    const cHi = limits[i]!
    if (conc <= cHi) {
      const cLo = limits[i - 1]!
      const iLo = IAQI_BREAKPOINTS[i - 1]!
      const iHi = IAQI_BREAKPOINTS[i]!
      if (cHi === cLo) return iHi
      // 国标要求结果进位取整
      return Math.ceil(((iHi - iLo) / (cHi - cLo)) * (conc - cLo) + iLo)
    }
  }
  return maxIaqi
}

/**
 * 由污染物浓度计算国标 AQI。
 * mode = "instant" 用臭氧 1 小时限值（瞬时浓度），
 * mode = "average" 用臭氧 8 小时滑动均值限值（均值浓度）。
 * 无任何有效浓度时返回 null，避免用其他标准的数值冒充国标。
 */
export function calcAqi(p: Pollutants, mode: AqiMode = "instant"): AqiResult | null {
  const o3Table = mode === "average" ? AQI_TABLES.o3_8h : AQI_TABLES.o3_1h
  const table: [keyof Pollutants, { name: string; conc: readonly number[] }][] = [
    ["pm25", AQI_TABLES.pm25],
    ["pm10", AQI_TABLES.pm10],
    ["no2", AQI_TABLES.no2],
    ["so2", AQI_TABLES.so2],
    ["co", AQI_TABLES.co],
    ["o3", o3Table],
  ]

  const iaqi: Record<string, number> = {}
  let aqi = 0
  let primary: string | undefined

  for (const [key, meta] of table) {
    const raw = p[key]
    if (raw == null || !isFinite(Number(raw))) continue
    const value = iaqiFor(Number(raw), meta.conc)
    iaqi[meta.name] = value
    if (value > aqi) {
      aqi = value
      primary = meta.name
    }
  }

  if (!Object.keys(iaqi).length) return null

  const level = aqiLevel(aqi)
  return {
    aqi,
    label: level.label,
    color: level.color,
    advice: level.advice,
    primary: aqi > 50 ? primary : undefined,
    iaqi,
  }
}
