export interface NightWeather {
  clouds: number[]
  humidity: number[]
  windKmh: number
  visibilityKm?: number
  moonPhase: number
}

export interface ScoreResult {
  score: number
  level: string
  advice: string
}

const PHASE_NAMES: { max: number; name: string; icon: string }[] = [
  { max: 0.03, name: "新月", icon: "🌑" },
  { max: 0.22, name: "蛾眉月", icon: "🌒" },
  { max: 0.28, name: "上弦月", icon: "🌓" },
  { max: 0.47, name: "盈凸月", icon: "🌔" },
  { max: 0.53, name: "满月", icon: "🌕" },
  { max: 0.72, name: "亏凸月", icon: "🌖" },
  { max: 0.78, name: "下弦月", icon: "🌗" },
  { max: 0.97, name: "残月", icon: "🌘" },
]

export function moonIllumination(moonPhase: number): number {
  const p = Math.max(0, Math.min(1, isFinite(moonPhase) ? moonPhase : 0))
  return Math.round((1 - Math.cos(2 * Math.PI * p)) / 2 * 100)
}

export function moonPhaseInfo(moonPhase: number): { icon: string; name: string } {
  const p = Math.max(0, Math.min(1, isFinite(moonPhase) ? moonPhase : 0))
  for (const it of PHASE_NAMES) {
    if (p < it.max) return { icon: it.icon, name: it.name }
  }
  return { icon: "🌑", name: "新月" }
}

function avg(arr: number[]): number {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function stargazingScore(n: NightWeather): ScoreResult {
  const cloudAvg = avg(n.clouds)
  const humAvg = avg(n.humidity)
  const illum = moonIllumination(n.moonPhase)
  const vis = n.visibilityKm != null ? Math.min(n.visibilityKm, 50) : 10

  let cloudScore = (1 - cloudAvg / 100) * 40
  let moonScore = (1 - illum / 100) * 30
  let humScore = (1 - humAvg / 100) * 20
  let windScore = n.windKmh < 12 ? 10 : n.windKmh < 25 ? 6 : 2
  let visScore = vis >= 15 ? 10 : vis >= 8 ? 6 : 2

  let score = Math.round(cloudScore + moonScore + humScore + windScore + visScore)
  if (score > 100) score = 100

  let level = ""
  if (score >= 80) level = "极佳"
  else if (score >= 60) level = "良好"
  else if (score >= 40) level = "一般"
  else if (score >= 20) level = "较差"
  else level = "不宜"

  let advice = ""
  if (cloudAvg >= 70) advice = "云量偏多，建议关注云层间隙或改日"
  else if (illum >= 80) advice = "月光较强，适合看月面细节，观星建议避开亮月方向"
  else if (cloudAvg >= 40) advice = "部分时段有云，耐心等待云层散开"
  else if (humAvg >= 75) advice = "湿度较高可能有薄雾，影响通透度"
  else if (windScore <= 6) advice = "风力偏大，注意设备稳定性"
  else advice = "今晚天气通透，适合观星"

  return { score, level, advice }
}

export function milkyWayScore(n: NightWeather, lightPollution: number): ScoreResult {
  const cloudAvg = avg(n.clouds)
  const illum = moonIllumination(n.moonPhase)
  const lp = Math.max(1, Math.min(10, lightPollution))
  const cf = 1 - cloudAvg / 100
  const mf = 1 - illum / 100
  const lf = 1 - lp / 10
  const score = Math.round(((cf * 0.45 + mf * 0.3 + lf * 0.25)) * 100)

  let level = ""
  if (score >= 70) level = "可见"
  else if (score >= 45) level = "隐约可见"
  else if (score >= 25) level = "难以观测"
  else level = "不可见"

  let advice = ""
  if (score >= 70) advice = "银河清晰可辨，选择光污染少的郊外最佳"
  else if (score >= 45) advice = "银河淡薄，需要到暗空环境"
  else if (score >= 25) advice = "月光或云量影响大，难以观测"
  else advice = "建议换个日期或地点观测"

  return { score, level, advice }
}

export function lightPollutionByCity(name: string): number {
  if (!name) return 7
  if (/北京|上海|广州|深圳|成都|重庆|天津|杭州|武汉|西安|南京|郑州|长沙|东莞|佛山|苏州|青岛/.test(name)) return 9
  if (/省会|直辖/.test(name)) return 8
  const len = name.length
  if (len <= 2) return 6
  return 5
}

const COMPASS = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"]

export function compassDir(az: number): string {
  const i = Math.round((az + 360) % 360 / 45) % 8
  return COMPASS[i]
}

function toRad(d: number): number { return d * Math.PI / 180 }
function toDeg(r: number): number { return r * 180 / Math.PI }

export function moonPosition(date: Date, lat: number, lon: number): { azimuth: number; altitude: number; dir: string } {
  const d = date.getTime() / 86400000 - 10957.5
  const Lp = 218.316 + 13.176396 * d
  const M = 134.963 + 13.064993 * d
  const F = 93.272 + 13.22935 * d
  const L = toRad(Lp + 6.289 * Math.sin(toRad(M)))
  const B = toRad(5.128 * Math.sin(toRad(F)))
  const e = toRad(23.4393 - 0.0000004 * d)
  const sinDec = Math.sin(B) * Math.cos(e) + Math.cos(B) * Math.sin(e) * Math.sin(L)
  const dec = Math.asin(sinDec)
  const ra = Math.atan2(Math.sin(L) * Math.cos(e) - Math.tan(B) * Math.sin(e), Math.cos(L))
  const theta = toRad((280.16 + 360.9856235 * d) % 360 + lon)
  const H = theta - ra
  const alt = Math.asin(Math.sin(toRad(lat)) * Math.sin(dec) + Math.cos(toRad(lat)) * Math.cos(dec) * Math.cos(H))
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(toRad(lat)) - Math.tan(dec) * Math.cos(toRad(lat))) + Math.PI
  const azDeg = (toDeg(az) + 360) % 360
  return { azimuth: Math.round(azDeg), altitude: Math.round(toDeg(alt)), dir: compassDir(azDeg) }
}
