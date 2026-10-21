import { API, TIMEOUT, RETRY, WEATHER } from "@/config"
import { calcAqi, type Pollutants } from "@/utils/aqi"

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "北京": { lat: 39.9, lon: 116.4 }, "上海": { lat: 31.2, lon: 121.5 },
  "广州": { lat: 23.1, lon: 113.3 }, "深圳": { lat: 22.5, lon: 114.1 },
  "杭州": { lat: 30.3, lon: 120.2 }, "成都": { lat: 30.6, lon: 104.1 },
  "武汉": { lat: 30.6, lon: 114.3 }, "西安": { lat: 34.3, lon: 108.9 },
  "南京": { lat: 32.1, lon: 118.8 }, "重庆": { lat: 29.6, lon: 106.5 },
  "天津": { lat: 39.1, lon: 117.2 }, "长沙": { lat: 28.2, lon: 112.9 },
  "苏州": { lat: 31.3, lon: 120.6 }, "昆明": { lat: 25.0, lon: 102.7 },
  "厦门": { lat: 24.5, lon: 118.1 }, "青岛": { lat: 36.1, lon: 120.4 },
  "大连": { lat: 38.9, lon: 121.6 }, "郑州": { lat: 34.7, lon: 113.7 },
  "哈尔滨": { lat: 45.8, lon: 126.5 }, "贵阳": { lat: 26.6, lon: 106.7 },
  "沈阳": { lat: 41.8, lon: 123.4 }, "济南": { lat: 36.7, lon: 117.0 },
  "合肥": { lat: 31.8, lon: 117.3 }, "福州": { lat: 26.1, lon: 119.3 },
  "南昌": { lat: 28.7, lon: 115.9 }, "太原": { lat: 37.9, lon: 112.5 },
  "石家庄": { lat: 38.0, lon: 114.5 }, "南宁": { lat: 22.8, lon: 108.4 },
  "长春": { lat: 43.9, lon: 125.3 }, "兰州": { lat: 36.1, lon: 103.8 },
  "呼和浩特": { lat: 40.8, lon: 111.7 }, "银川": { lat: 38.5, lon: 106.1 },
  "西宁": { lat: 36.6, lon: 101.8 }, "乌鲁木齐": { lat: 43.8, lon: 87.6 },
  "拉萨": { lat: 29.7, lon: 91.1 }, "海口": { lat: 20.0, lon: 110.3 },
  "珠海": { lat: 22.3, lon: 113.6 }, "东莞": { lat: 23.0, lon: 113.8 },
  "佛山": { lat: 23.0, lon: 113.1 }, "宁波": { lat: 29.9, lon: 121.6 },
  "无锡": { lat: 31.6, lon: 120.3 }, "温州": { lat: 28.0, lon: 120.7 },
  "泉州": { lat: 24.9, lon: 118.6 }, "烟台": { lat: 37.5, lon: 121.4 },
  "桂林": { lat: 25.3, lon: 110.3 }, "三亚": { lat: 18.3, lon: 109.5 },
  "丽江": { lat: 26.9, lon: 100.2 }, "秦皇岛": { lat: 39.9, lon: 119.6 },
  "威海": { lat: 37.5, lon: 122.1 }, "北海": { lat: 21.5, lon: 109.1 },
}

const CITY_PINYIN: Record<string, string> = {
  "北京": "BJ", "上海": "SH", "广州": "GZ", "深圳": "SZ",
  "杭州": "HZ", "成都": "CD", "武汉": "WH", "西安": "XA",
  "南京": "NJ", "重庆": "CQ", "天津": "TJ", "长沙": "CS",
  "苏州": "SUZ", "昆明": "KM", "厦门": "XM", "青岛": "QD",
  "大连": "DL", "郑州": "ZZ", "哈尔滨": "HEB", "贵阳": "GY",
  "沈阳": "SY", "济南": "JN", "合肥": "HF", "福州": "FZ",
  "南昌": "NC", "太原": "TY", "石家庄": "SJZ", "南宁": "NN",
  "长春": "CC", "兰州": "LZ", "呼和浩特": "HHHT", "银川": "YC",
  "西宁": "XN", "乌鲁木齐": "WLMQ", "拉萨": "LS", "海口": "HK",
  "珠海": "ZH", "东莞": "DG", "佛山": "FS", "宁波": "NB",
  "无锡": "WX", "温州": "WZ", "泉州": "QZ", "烟台": "YT",
  "桂林": "GL", "三亚": "SYA", "丽江": "LJ", "秦皇岛": "QHD",
  "威海": "WHI", "北海": "BH",
}

export const cityList = Object.keys(CITY_COORDS)

export function matchCity(q: string): string[] {
  const up = q.toUpperCase()
  return cityList.filter(c => c.includes(q) || CITY_PINYIN[c]?.includes(up))
}

export function groupCitiesByPinyin(): Record<string, string[]> {
  const groups: Record<string, string[]> = {}
  for (const [name, py] of Object.entries(CITY_PINYIN)) {
    const letter = py[0]
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(name)
  }
  const sorted: Record<string, string[]> = {}
  Object.keys(groups).sort().forEach(k => { sorted[k] = groups[k] })
  return sorted
}

const DYNAMIC_COORDS_KEY = "dynamic_city_coords"
const DYNAMIC_COORDS: Record<string, { lat: number; lon: number }> = {}

try {
  const raw = uni.getStorageSync(DYNAMIC_COORDS_KEY) as string
  if (raw) Object.assign(DYNAMIC_COORDS, JSON.parse(raw))
} catch {}

export function setDynamicCity(name: string, lat: number, lon: number) {
  DYNAMIC_COORDS[name] = { lat, lon }
  try {
    const keys = Object.keys(DYNAMIC_COORDS)
    if (keys.length > 30) {
      delete DYNAMIC_COORDS[keys[0]]
    }
    uni.setStorageSync(DYNAMIC_COORDS_KEY, JSON.stringify(DYNAMIC_COORDS))
  } catch {}
}

export function getCityCoords(name: string): { lat: number; lon: number } | null {
  return CITY_COORDS[name] || DYNAMIC_COORDS[name] || null
}

export function getCachedWeather(city: string): CurrentWeather | null {
  try {
    const raw = uni.getStorageSync("weather_cache") as string
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (obj && obj.data && obj.city && typeof obj.city === "string" && !obj[obj.city]) {
      return obj.city === city ? (obj.data as CurrentWeather) : null
    }
    const entry = obj && obj[city]
    if (entry && entry.data && typeof entry.ts === "number") return entry.data as CurrentWeather
  } catch {}
  return null
}

export interface GeoCity {
  name: string
  lat: number
  lon: number
  country: string
  admin1?: string
}

export async function searchCities(query: string): Promise<GeoCity[] | null> {
  if (!query || query.length < 1) return []
  try {
    const res = await new Promise<any>((resolve) => {
      uni.request({
        url: `${API.GEOCODING}?name=${encodeURIComponent(query)}&count=15&language=zh&format=json`,
        timeout: 5000,
        success(r) { resolve(r) },
        fail() { resolve(null) },
      })
    })
    if (!res?.data?.results) return []
    return res.data.results
      .filter((r: any) => r.name && r.latitude != null && r.longitude != null)
      .map((r: any) => ({
        name: r.name,
        lat: r.latitude,
        lon: r.longitude,
        country: r.country || "",
        admin1: r.admin1 || "",
      }))
  } catch (e) {
    console.error("Geocoding error:", e)
    return null
  }
}

export function nearestCity(lat: number, lon: number): string {
  let min = Infinity, best = "北京"
  for (const [name, coords] of Object.entries(CITY_COORDS)) {
    const d = Math.sqrt((lat - coords.lat) ** 2 + (lon - coords.lon) ** 2)
    if (d < min) { min = d; best = name }
  }
  return best
}

/**
 * 只有区/县/镇这类下级行政区才拿来当主名称，
 * 避免把小区、商圈名（如"花园城"）当成地市显示。
 */
const SUB_DIVISION_RE = /(区|县|市|旗|镇|乡|街道)$/

/**
 * 反向地理编码：用坐标换真实城市名。
 * 原来的做法是取 50 个内置城市里最近的一个，昆山会被显示成苏州、虎门显示成广州。
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await new Promise<any>((resolve) => {
      uni.request({
        url: `${API.REVERSE_GEO}?latitude=${lat}&longitude=${lon}&localityLanguage=zh-Hans`,
        timeout: TIMEOUT.REVERSE_GEO,
        success(r) { resolve(r) },
        fail() { resolve(null) },
      })
    })
    const d = res?.data
    if (!d) return null
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "")
    const city = str(d.city)
    const locality = str(d.locality)
    // 区/县级优先：接口的 city 是"深圳市"，区在 locality 里，
    // 原来的顺序 [city, locality] 会把区吃掉，永远只显示到市级。
    if (locality && locality !== city && SUB_DIVISION_RE.test(locality)) return locality
    if (city) return city
    if (locality) return locality
    return str(d.principalSubdivision) || null
  } catch {
    return null
  }
}

/** 定位到的地名：优先反查真实城市名，失败再退回最近的已知城市 */
export async function resolvePlaceName(lat: number, lon: number): Promise<string> {
  return (await reverseGeocode(lat, lon)) || nearestCity(lat, lon)
}

export interface ForecastDay {
  day: string
  date: string
  weather: string
  high: string
  low: string
  sunrise?: string
  sunset?: string
  uvMax?: string
  precip?: string
  moonrise?: string
  moonset?: string
  moonPhase?: number
}

export interface HourlyItem {
  time: string
  temp: string
  weather: string
  rainChance: string
  windDir: string
  windScale: string
  precip?: string
  feelsLike?: string
  humidity?: string
  cloud?: string
}

export interface AlertItem {
  event: string
  severity: string
  start: string
  end: string
  description: string
}

export interface MinutelyPoint {
  time: string
  precip: number
}

export interface CurrentWeather {
  temp: string
  feelsLike: string
  humidity: string
  windDir: string
  windScale: string
  windLevel: string
  weather: string
  high: string
  low: string
  yesterdayHigh?: string
  yesterdayLow?: string
  sunrise: string
  sunset: string
  uvIndex: string
  pressure: string
  visibility: string
  dewPoint: string
  cloudCover: string
  windGust: string
  aqi: string
  aqiLabel: string
  aqiDetail?: AQIDetail
  moonrise?: string
  moonset?: string
  moonPhase?: number
  forecast: ForecastDay[]
  hourly: HourlyItem[]
  hourlyByDate?: Record<string, HourlyItem[]>
  minutely?: MinutelyPoint[]
  alerts: AlertItem[]
}

export interface CoordsWeather {
  weather: CurrentWeather
  placeName: string
}

function translateWeather(desc: string): string {
  const d = desc.toLowerCase()
  if (d.includes("thunder") || d.includes("tstorm")) return "雷阵雨"
  if (d.includes("hail")) return "冰雹"
  if (d.includes("blizzard")) return "暴雪"
  if (d.includes("snow") || d.includes("sleet")) {
    if (d.includes("heavy")) return "大雪"
    if (d.includes("moderate")) return "中雪"
    if (d.includes("light") || d.includes("patch")) return "小雪"
    return "雪"
  }
  if (d.includes("drizzle")) return "毛毛雨"
  if (d.includes("rain") || d.includes("shower")) {
    if (d.includes("heavy") || d.includes("torrent")) return "大雨"
    if (d.includes("moderate")) return "中雨"
    if (d.includes("light") || d.includes("patch")) return "小雨"
    return "阵雨"
  }
  if (d.includes("fog") || d.includes("mist")) return "雾"
  if (d.includes("haze")) return "霾"
  if (d.includes("overcast")) return "阴"
  if (d.includes("cloudy") || d.includes("cloud")) return "多云"
  if (d.includes("sunny") || d.includes("clear")) return "晴"
  return desc
}

function windLevel(kmh: string): string {
  const s = parseFloat(kmh)
  if (isNaN(s)) return kmh
  if (s < 1) return "0级 无风"
  if (s < 6) return "1级 软风"
  if (s < 12) return "2级 轻风"
  if (s < 20) return "3级 微风"
  if (s < 29) return "4级 和风"
  if (s < 39) return "5级 清风"
  if (s < 50) return "6级 强风"
  if (s < 62) return "7级 疾风"
  if (s < 75) return "8级 大风"
  if (s < 89) return "9级 烈风"
  if (s < 103) return "10级 狂风"
  if (s < 117) return "11级 暴风"
  return "12级 飓风"
}

const OM_WX: Record<number, string> = {
  0: "晴", 1: "晴", 2: "多云", 3: "阴",
  45: "雾", 48: "雾凇", 51: "毛毛雨", 53: "小雨", 55: "中雨",
  61: "小雨", 63: "中雨", 65: "大雨", 71: "小雪", 73: "中雪",
  75: "大雪", 77: "雪", 80: "阵雨", 81: "阵雨", 82: "大阵雨",
  85: "小阵雪", 86: "大阵雪", 95: "雷阵雨", 96: "雷阵雨+冰雹", 99: "雷阵雨+冰雹",
}

const RAIN_CODES = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99])

function weatherByPrecip(wcode: number, precip: number): string | null {
  if (RAIN_CODES.has(wcode)) return null
  if (precip <= 0) return null
  if (precip >= 10) return "大雨"
  if (precip >= 4) return "中雨"
  return "小雨"
}

function dayName(dateStr: string): string {
  const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
  const d = new Date(dateStr)
  const today = new Date()
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return "今天"
  if (diff === 1) return "明天"
  if (diff === 2) return "后天"
  return days[d.getDay()]
}

function degToDir(deg: number): string {
  const dirs = ["北风", "东北风", "东风", "东南风", "南风", "西南风", "西风", "西北风"]
  const i = Math.round(deg / 45) % 8
  return dirs[i]
}

function extractTime(iso: string): string {
  const parts = iso.split("T")
  if (parts.length >= 2) return parts[1].substring(0, 5)
  return "--"
}

function parseHourTime(iso: string): number {
  const match = iso.match(/T(\d{2}):/)
  return match ? parseInt(match[1]) : 0
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

/** 本地时区的 "YYYY-MM-DDTHH:00"，用于和接口返回的当地时间对齐（不能用 toISOString，那是 UTC） */
function localStamp(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:00`
}

function localDateStr(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export interface AQIDetail {
  /** 国标 AQI（HJ 633-2012） */
  aqi: number
  label: string
  color?: string
  advice?: string
  /** 首要污染物，AQI ≤ 50 时无 */
  primary?: string
  pm25?: string
  pm10?: string
  no2?: string
  o3?: string
  so2?: string
  co?: string
  hourly?: { time: string; aqi: number }[]
  pollen?: { level: string; top?: string; grains?: number }
  forecast?: { date: string; aqi: number; label: string }[]
}

function pollenLevel(grains: number): string {
  if (grains >= 500) return "很高"
  if (grains >= 100) return "较高"
  if (grains >= 25) return "中等"
  return "较低"
}

function numOrNull(v: any): number | null {
  if (v == null) return null
  const n = Number(v)
  return isFinite(n) ? n : null
}

/**
 * Open-Meteo 的 CO 单位是 μg/m³，国标限值表（HJ 633）用 mg/m³。
 * 不做换算的话 300 多的 CO 会被当成 300 mg/m³ → IAQI 直接顶到 500。
 */
function coToMg(v: number | null): number | null {
  return v == null ? null : v / 1000
}

function pickCurrent(cur: any): Pollutants {
  return {
    pm25: numOrNull(cur?.pm2_5),
    pm10: numOrNull(cur?.pm10),
    no2: numOrNull(cur?.nitrogen_dioxide),
    o3: numOrNull(cur?.ozone),
    so2: numOrNull(cur?.sulphur_dioxide),
    co: coToMg(numOrNull(cur?.carbon_monoxide)),
  }
}

function meanOf(arr: any, idxs: number[]): number | null {
  if (!Array.isArray(arr) || !idxs.length) return null
  let sum = 0, count = 0
  for (const i of idxs) {
    const v = numOrNull(arr[i])
    if (v == null) continue
    sum += v
    count++
  }
  return count ? sum / count : null
}

function max8hMean(arr: any, idxs: number[]): number | null {
  if (!Array.isArray(arr) || !idxs.length) return null
  const values = idxs.map(i => numOrNull(arr[i]))
  if (values.some(v => v == null)) {
    const valid = values.filter((v): v is number => v != null)
    return valid.length ? Math.max(...valid) : null
  }
  const nums = values as number[]
  if (nums.length < 8) return Math.max(...nums)
  let best = 0
  for (let i = 0; i + 8 <= nums.length; i++) {
    const avg = nums.slice(i, i + 8).reduce((a, b) => a + b, 0) / 8
    if (avg > best) best = avg
  }
  return best
}

/**
 * 取某个整点小时按国标「实时报」口径的污染物浓度：
 * PM2.5 / PM10 用窗口滑动均值，其余用该小时的 1 小时浓度；hourly 缺数时退回 current。
 */
function realtimeAt(h: any, cur: any, i: number, pmWindow: number[]): Pollutants {
  const at = (key: string): number | null => {
    const v = numOrNull(h?.[key]?.[i])
    return v != null ? v : numOrNull(cur?.[key])
  }
  return {
    pm25: meanOf(h?.pm2_5, pmWindow) ?? at("pm2_5"),
    pm10: meanOf(h?.pm10, pmWindow) ?? at("pm10"),
    so2: at("sulphur_dioxide"),
    no2: at("nitrogen_dioxide"),
    co: coToMg(at("carbon_monoxide")),
    o3: at("ozone"),
  }
}

async function fetchAQI(lat: number, lon: number): Promise<AQIDetail | null> {
  try {
    const params = [
      `latitude=${lat}`,
      `longitude=${lon}`,
      "current=pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide,alder_pollen,birch_pollen,grass_pollen,olive_pollen,ragweed_pollen",
      "hourly=pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide",
      "timezone=auto",
      "past_days=1",
      "forecast_days=4",
    ]
    const res = await new Promise<any>((resolve) => {
      uni.request({
        url: `${API.AQI}?${params.join("&")}`,
        timeout: TIMEOUT.OPEN_METEO_HOURLY,
        success(r) { resolve(r as any) },
        fail() { resolve(null) },
      })
    })

    const cur = res?.data?.current
    if (!cur) return null

    const h = res?.data?.hourly
    const times: string[] = Array.isArray(h?.time) ? h.time : []

    // 从当前小时开始的未来 24 小时（原来的实现从 00:00 取，下午打开全是过去的时段）
    const nowKey = localStamp()
    let start = times.indexOf(nowKey)
    if (start < 0) start = times.findIndex(t => String(t) >= nowKey)
    if (start < 0) start = 0

    // 国标「实时报」口径：PM2.5 / PM10 用 24 小时滑动均值，SO₂ / NO₂ / CO / O₃ 用 1 小时浓度。
    // 之前把 NO₂/SO₂/CO 也一起平均、O₃ 还取"24 小时内 8 小时滑动均值的峰值"，
    // 等于把昨天下午的臭氧高峰当成现在报出去（实测报 128，国控站同时刻只有 64）。
    const windowIdxs: number[] = []
    for (let i = Math.max(0, start - 23); i <= start; i++) windowIdxs.push(i)
    const now = calcAqi(realtimeAt(h, cur, start, windowIdxs), "instant")
      || calcAqi(pickCurrent(cur), "instant")
    if (!now) return null

    const hourly: { time: string; aqi: number }[] = []
    for (let i = start; i < times.length && hourly.length < 24; i++) {
      // 走势图也按同一口径算，否则柱子（40 多）和顶部大数字（60 多）对不上
      const win: number[] = []
      for (let k = Math.max(0, i - 23); k <= i; k++) win.push(k)
      const point = calcAqi(realtimeAt(h, null, i, win), "instant")
      if (!point) continue
      hourly.push({ time: String(times[i]).slice(11, 16), aqi: point.aqi })
    }

    // 今日起 3 天的日均 AQI：PM/NO₂/SO₂/CO 取日均浓度，O₃ 取 8 小时滑动均值
    const byDate = new Map<string, number[]>()
    times.forEach((t, i) => {
      const day = String(t).slice(0, 10)
      const list = byDate.get(day)
      if (list) list.push(i)
      else byDate.set(day, [i])
    })
    const today = localDateStr()
    const forecast: NonNullable<AQIDetail["forecast"]> = []
    for (const [day, idxs] of byDate) {
      if (forecast.length >= 3) break
      if (day < today) continue
      const daily = calcAqi({
        pm25: meanOf(h?.pm2_5, idxs),
        pm10: meanOf(h?.pm10, idxs),
        no2: meanOf(h?.nitrogen_dioxide, idxs),
        so2: meanOf(h?.sulphur_dioxide, idxs),
        co: coToMg(meanOf(h?.carbon_monoxide, idxs)),
        o3: max8hMean(h?.ozone, idxs),
      }, "average")
      if (daily) forecast.push({ date: day.slice(5), aqi: daily.aqi, label: daily.label })
    }

    const pollenCands: { name: string; v?: number }[] = [
      { name: "桤木", v: cur.alder_pollen },
      { name: "桦木", v: cur.birch_pollen },
      { name: "禾本科", v: cur.grass_pollen },
      { name: "橄榄", v: cur.olive_pollen },
      { name: "豚草", v: cur.ragweed_pollen },
    ].filter(x => x.v != null)
    let pollen: AQIDetail["pollen"]
    if (pollenCands.length) {
      const max = pollenCands.reduce((a, b) => (b.v! > a.v! ? b : a))
      pollen = { level: pollenLevel(max.v!), top: max.name, grains: Math.round(max.v!) }
    }

    const fmt = (v: any) => (v == null || !isFinite(Number(v)) ? undefined : Number(v).toFixed(1))
    return {
      aqi: now.aqi,
      label: now.label,
      color: now.color,
      advice: now.advice,
      primary: now.primary,
      pm25: fmt(cur.pm2_5),
      pm10: fmt(cur.pm10),
      no2: fmt(cur.nitrogen_dioxide),
      o3: fmt(cur.ozone),
      so2: fmt(cur.sulphur_dioxide),
      co: fmt(coToMg(numOrNull(cur.carbon_monoxide))),
      hourly: hourly.length ? hourly : undefined,
      pollen,
      forecast: forecast.length ? forecast : undefined,
    }
  } catch (e) {
    console.error("AQI fetch error:", e)
    return null
  }
}

async function fetchOpenMeteo(lat: number, lon: number): Promise<any> {
  const params = [
    `latitude=${lat}`,
    `longitude=${lon}`,
    "current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index,precipitation,surface_pressure,visibility,dew_point_2m,cloud_cover,wind_gusts_10m",
    "daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,weather_code,uv_index_max,precipitation_sum,moonrise,moonset,moon_phase",
    "hourly=temperature_2m,apparent_temperature,relative_humidity_2m,cloud_cover,weather_code,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m",
    "minutely_15=precipitation",
    "timezone=auto",
    "past_days=1",
    "forecast_days=7",
    "alerts=true",
  ]
  const url = `${API.OPEN_METEO}?${params.join("&")}`

  for (let attempt = 0; attempt < RETRY.WEATHER_ATTEMPTS; attempt++) {
    try {
      const res = await new Promise<any>((resolve) => {
        uni.request({
          url,
          timeout: TIMEOUT.OPEN_METEO,
          success(r) { resolve(r) },
          fail() { resolve(null) },
        })
      })
      if (res?.data?.current) return res.data
    } catch (e) {
      console.error("Weather fetch error:", e)
    }
    if (attempt < RETRY.WEATHER_ATTEMPTS - 1) {
      await new Promise(r => setTimeout(r, RETRY.WEATHER_DELAY))
    }
  }
  return null
}

function parseWeatherData(data: any, aqiResult?: AQIDetail | null): CurrentWeather {
  const cur = data.current
  const daily = data.daily
  const hourly = data.hourly

  const wcode: number = cur.weather_code ?? 0
  const precip = cur.precipitation ?? 0
  const weatherDesc = weatherByPrecip(wcode, precip) || OM_WX[wcode] || translateWeather(String(wcode))

  const now = new Date()
  const pad2 = (n: number) => String(n).padStart(2, "0")
  const curDate = cur?.time ? String(cur.time).slice(0, 10) : ""
  const localToday = curDate || now.getFullYear() + "-" + pad2(now.getMonth() + 1) + "-" + pad2(now.getDate())
  const foundIdx = daily?.time ? daily.time.indexOf(localToday) : -1
  const todayIdx = foundIdx >= 0 ? foundIdx : Math.min(1, (daily?.time?.length ?? 1) - 1)
  const todayDate = daily?.time?.[todayIdx] || localToday
  const currentHour = cur?.time ? parseInt(String(cur.time).slice(11, 13)) : now.getHours()

  const forecast: ForecastDay[] = []
  if (daily?.time) {
    const end = Math.min(daily.time.length, todayIdx + WEATHER.FORECAST_DAYS_SHOWN)
    for (let i = todayIdx + 1; i < end; i++) {
      const fc = daily.weather_code?.[i] ?? 0
      const dp = daily.precipitation_sum?.[i] ?? 0
      forecast.push({
        day: dayName(daily.time[i]),
        date: daily.time[i],
        weather: weatherByPrecip(fc, dp) || OM_WX[fc] || translateWeather(String(fc)),
        high: String(daily.temperature_2m_max?.[i] ?? "--"),
        low: String(daily.temperature_2m_min?.[i] ?? "--"),
        sunrise: daily.sunrise?.[i] ? extractTime(daily.sunrise[i]) : undefined,
        sunset: daily.sunset?.[i] ? extractTime(daily.sunset[i]) : undefined,
        uvMax: daily.uv_index_max?.[i] != null ? String(daily.uv_index_max[i]) : undefined,
        precip: dp > 0 ? String(dp) + "mm" : undefined,
        moonrise: daily.moonrise?.[i] ? extractTime(daily.moonrise[i]) : undefined,
        moonset: daily.moonset?.[i] ? extractTime(daily.moonset[i]) : undefined,
        moonPhase: daily.moon_phase?.[i] != null ? Number(daily.moon_phase[i]) : undefined,
      })
    }
  }

  const hourlyItems: HourlyItem[] = []
  const hourlyByDate: Record<string, HourlyItem[]> = {}
  if (hourly?.time) {
    for (let i = 0; i < hourly.time.length; i++) {
      const iso = hourly.time[i] as string
      const dateStr = iso.slice(0, 10)
      const hh = parseHourTime(iso)

      const hcode = hourly.weather_code?.[i] ?? 0
      const hp = hourly.precipitation?.[i] ?? 0
      const item: HourlyItem = {
        time: hh + ":00",
        temp: String(hourly.temperature_2m?.[i] ?? "--"),
        weather: weatherByPrecip(hcode, hp) || OM_WX[hcode] || translateWeather(String(hcode)),
        rainChance: String(hourly.precipitation_probability?.[i] ?? 0),
        windDir: degToDir(hourly.wind_direction_10m?.[i] ?? 0),
        windScale: String(Math.round(hourly.wind_speed_10m?.[i] ?? 0)),
        precip: hp > 0 ? (hp < 0.1 ? "0.1" : hp.toFixed(1)) : undefined,
        feelsLike: hourly.apparent_temperature?.[i] != null ? String(hourly.apparent_temperature[i]) : undefined,
        humidity: hourly.relative_humidity_2m?.[i] != null ? String(hourly.relative_humidity_2m[i]) : undefined,
        cloud: hourly.cloud_cover?.[i] != null ? String(hourly.cloud_cover[i]) : undefined,
      }

      if (!hourlyByDate[dateStr]) hourlyByDate[dateStr] = []
      hourlyByDate[dateStr].push(item)

      if (dateStr === todayDate && hh >= currentHour) {
        hourlyItems.push(item)
      }
    }
  }

  const alerts: AlertItem[] = []
  if (data.alerts?.length) {
    for (const a of data.alerts) {
      alerts.push({
        event: a.event || "",
        severity: a.severity || "",
        start: a.start || "",
        end: a.end || "",
        description: a.description || "",
      })
    }
  }

  const minutely: MinutelyPoint[] = []
  const m15 = data.minutely_15
  if (m15?.time && m15?.precipitation) {
    const nowMs = cur?.time ? new Date(String(cur.time)).getTime() : now.getTime()
    for (let i = 0; i < m15.time.length && minutely.length < 8; i++) {
      const t = String(m15.time[i])
      const d = new Date(t)
      if (isNaN(d.getTime()) || d.getTime() < nowMs - 15 * 60000) continue
      minutely.push({ time: t.slice(11, 16), precip: Number(m15.precipitation[i]) || 0 })
    }
  }

  return {
    temp: String(cur.temperature_2m ?? "--"),
    feelsLike: String(cur.apparent_temperature ?? "--"),
    humidity: String(cur.relative_humidity_2m ?? "--"),
    windDir: degToDir(cur.wind_direction_10m ?? 0),
    windScale: String(cur.wind_speed_10m ?? "--"),
    windLevel: windLevel(String(cur.wind_speed_10m)),
    weather: weatherDesc,
    high: String(daily?.temperature_2m_max?.[todayIdx] ?? "--"),
    low: String(daily?.temperature_2m_min?.[todayIdx] ?? "--"),
    sunrise: daily?.sunrise?.[todayIdx] ? extractTime(daily.sunrise[todayIdx]) : "--",
    sunset: daily?.sunset?.[todayIdx] ? extractTime(daily.sunset[todayIdx]) : "--",
    uvIndex: String(cur.uv_index ?? "--"),
    pressure: cur.surface_pressure != null ? Math.round(cur.surface_pressure) + " hPa" : "--",
    visibility: cur.visibility != null ? (cur.visibility / 1000).toFixed(1) + " km" : "--",
    dewPoint: cur.dew_point_2m != null ? cur.dew_point_2m + "°" : "--",
    cloudCover: cur.cloud_cover != null ? cur.cloud_cover + "%" : "--",
    windGust: cur.wind_gusts_10m != null ? Math.round(cur.wind_gusts_10m) + " km/h" : "--",
    aqi: aqiResult ? String(aqiResult.aqi) : "--",
    aqiLabel: aqiResult ? aqiResult.label : "",
    aqiDetail: aqiResult || undefined,
    moonrise: daily?.moonrise?.[todayIdx] ? extractTime(daily.moonrise[todayIdx]) : "--",
    moonset: daily?.moonset?.[todayIdx] ? extractTime(daily.moonset[todayIdx]) : "--",
    moonPhase: daily?.moon_phase?.[todayIdx] != null ? Number(daily.moon_phase[todayIdx]) : undefined,
    yesterdayHigh: todayIdx > 0 && daily?.temperature_2m_max?.[todayIdx - 1] != null ? String(daily.temperature_2m_max[todayIdx - 1]) : undefined,
    yesterdayLow: todayIdx > 0 && daily?.temperature_2m_min?.[todayIdx - 1] != null ? String(daily.temperature_2m_min[todayIdx - 1]) : undefined,
    forecast,
    hourly: hourlyItems,
    hourlyByDate,
    minutely: minutely.length ? minutely : undefined,
    alerts,
  }
}

export async function getWeather(lat: number, lon: number): Promise<CurrentWeather | null> {
  const [data, aqi] = await Promise.all([fetchOpenMeteo(lat, lon), fetchAQI(lat, lon)])
  if (!data) return null
  return parseWeatherData(data, aqi)
}

export async function getWeatherByCoords(lat: number, lon: number, placeName?: string): Promise<CoordsWeather | null> {
  const [data, aqi] = await Promise.all([fetchOpenMeteo(lat, lon), fetchAQI(lat, lon)])
  if (!data) return null
  return {
    weather: parseWeatherData(data, aqi),
    placeName: placeName || nearestCity(lat, lon),
  }
}

export async function getHourlyForecast(lat: number, lon: number, date?: string): Promise<HourlyItem[]> {
  try {
    const startDate = date || localDateStr()
    const endDate = date || startDate
    const res = await new Promise<any>((resolve) => {
      uni.request({
        url: `${API.OPEN_METEO}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,cloud_cover,weathercode,precipitation_probability,precipitation,windspeed_10m,winddirection_10m&timezone=auto&start_date=${startDate}&end_date=${endDate}`,
        timeout: TIMEOUT.OPEN_METEO_HOURLY,
        success(r) { resolve(r) },
        fail() { resolve(null) },
      })
    })
    if (!res?.data?.hourly) return []
    const h = res.data.hourly
    const result: HourlyItem[] = []
    const now = new Date()
    const isToday = startDate === localDateStr(now)
    const currentHour = now.getHours()
    for (let i = 0; i < h.time.length; i++) {
      const t = h.time[i] as string
      const hh = parseInt(t.slice(11, 13))
      if (isToday && hh < currentHour) continue
      const wcode = h.weathercode?.[i] ?? 0
      const hp = h.precipitation?.[i] ?? 0
      result.push({
        time: hh + ":00",
        temp: String(h.temperature_2m?.[i] ?? "--"),
        weather: weatherByPrecip(wcode, hp) || OM_WX[wcode] || translateWeather(String(wcode)),
        rainChance: String(h.precipitation_probability?.[i] ?? 0),
        windDir: degToDir(h.winddirection_10m?.[i] ?? 0),
        windScale: String(Math.round(h.windspeed_10m?.[i] ?? 0)),
        precip: hp > 0 ? (hp < 0.1 ? "0.1" : hp.toFixed(1)) : undefined,
        feelsLike: h.apparent_temperature?.[i] != null ? String(h.apparent_temperature[i]) : undefined,
        humidity: h.relative_humidity_2m?.[i] != null ? String(h.relative_humidity_2m[i]) : undefined,
        cloud: h.cloud_cover?.[i] != null ? String(h.cloud_cover[i]) : undefined,
      })
    }
    return result
  } catch (e) {
    console.error("Hourly forecast error:", e)
    return []
  }
}

export interface CalendarDay {
  date: string
  weather: string
  weatherCode: number
  high: string
  low: string
  precip: string
  precipProb: string
  sunrise: string
  sunset: string
  uvMax: string
  moonPhase?: number
}

export async function getCalendarWeather(lat: number, lon: number): Promise<CalendarDay[]> {
  try {
    const params = [
      `latitude=${lat}`,
      `longitude=${lon}`,
      "daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,moon_phase",
      "timezone=auto",
      "forecast_days=16",
    ]
    const url = `${API.OPEN_METEO}?${params.join("&")}`
    const res = await new Promise<any>((resolve) => {
      uni.request({
        url,
        timeout: TIMEOUT.OPEN_METEO,
        success(r) { resolve(r) },
        fail() { resolve(null) },
      })
    })
    const d = res?.data?.daily
    if (!d?.time) return []
    const out: CalendarDay[] = []
    for (let i = 0; i < d.time.length; i++) {
      const code = d.weather_code?.[i] ?? 0
      const dp = d.precipitation_sum?.[i] ?? 0
      out.push({
        date: String(d.time[i]),
        weather: weatherByPrecip(code, dp) || OM_WX[code] || translateWeather(String(code)),
        weatherCode: code,
        high: String(d.temperature_2m_max?.[i] ?? "--"),
        low: String(d.temperature_2m_min?.[i] ?? "--"),
        precip: dp > 0 ? dp.toFixed(1) + "mm" : "",
        precipProb: d.precipitation_probability_max?.[i] != null ? String(d.precipitation_probability_max[i]) : "0",
        sunrise: d.sunrise?.[i] ? extractTime(d.sunrise[i]) : "--",
        sunset: d.sunset?.[i] ? extractTime(d.sunset[i]) : "--",
        uvMax: d.uv_index_max?.[i] != null ? String(d.uv_index_max[i]) : "--",
        moonPhase: d.moon_phase?.[i] != null ? Number(d.moon_phase[i]) : undefined,
      })
    }
    return out
  } catch (e) {
    console.error("Calendar weather error:", e)
    return []
  }
}
