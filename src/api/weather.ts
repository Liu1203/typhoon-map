import { API, TIMEOUT, RETRY, WEATHER } from "@/config"

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

export async function searchCities(query: string): Promise<GeoCity[]> {
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
    return []
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

export interface AQIDetail {
  aqi: number
  label: string
  pm25?: string
  pm10?: string
  no2?: string
  o3?: string
  so2?: string
  hourly?: { time: string; aqi: number }[]
  pollen?: { level: string; top?: string; grains?: number }
  forecast?: { date: string; aqi: number; label: string }[]
}

function aqiLabel(v: number): string {
  return v <= 20 ? "优" : v <= 40 ? "良" : v <= 60 ? "轻度" : v <= 80 ? "中度" : v <= 100 ? "重度" : "严重"
}

function pollenLevel(grains: number): string {
  if (grains >= 500) return "很高"
  if (grains >= 100) return "较高"
  if (grains >= 25) return "中等"
  return "较低"
}

async function fetchAQI(lat: number, lon: number): Promise<AQIDetail | null> {
  try {
    const res = await new Promise<{ data?: { current?: { european_aqi?: number; pm2_5?: number; pm10?: number; nitrogen_dioxide?: number; ozone?: number; sulphur_dioxide?: number; alder_pollen?: number; birch_pollen?: number; grass_pollen?: number; olive_pollen?: number; ragweed_pollen?: number }; hourly?: { time?: string[]; european_aqi?: number[] }; daily?: { time?: string[]; european_aqi?: number[] } } } | null>((resolve) => {
      uni.request({
        url: `${API.AQI}?latitude=${lat}&longitude=${lon}&current=european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,alder_pollen,birch_pollen,grass_pollen,olive_pollen,ragweed_pollen&hourly=european_aqi&daily=european_aqi&timezone=auto&forecast_days=3`,
        timeout: TIMEOUT.OPEN_METEO_HOURLY,
        success(r) { resolve(r as any) },
        fail() { resolve(null) },
      })
    })
    const cur = res?.data?.current
    if (!cur || cur.european_aqi == null) return null
    const aqi = Math.round(cur.european_aqi)
    const label = aqiLabel(aqi)
    const hourly: { time: string; aqi: number }[] = []
    const ht = res?.data?.hourly?.time
    const ha = res?.data?.hourly?.european_aqi
    if (Array.isArray(ht) && Array.isArray(ha)) {
      for (let i = 0; i < ht.length && hourly.length < 24; i++) {
        const v = ha[i]
        if (v == null) continue
        hourly.push({ time: String(ht[i]).slice(11, 16), aqi: Math.round(v) })
      }
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
    const forecast: AQIDetail["forecast"] = []
    const dt = res?.data?.daily?.time
    const da = res?.data?.daily?.european_aqi
    if (Array.isArray(dt) && Array.isArray(da)) {
      for (let i = 0; i < dt.length && i < 3; i++) {
        const v = Math.round(da[i] || 0)
        forecast.push({ date: String(dt[i]).slice(5), aqi: v, label: aqiLabel(v) })
      }
    }
    return {
      aqi, label,
      pm25: cur.pm2_5 != null ? cur.pm2_5.toFixed(1) : undefined,
      pm10: cur.pm10 != null ? cur.pm10.toFixed(1) : undefined,
      no2: cur.nitrogen_dioxide != null ? cur.nitrogen_dioxide.toFixed(1) : undefined,
      o3: cur.ozone != null ? cur.ozone.toFixed(1) : undefined,
      so2: cur.sulphur_dioxide != null ? cur.sulphur_dioxide.toFixed(1) : undefined,
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
    "timezone=auto",
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

function parseWeatherData(data: any, aqiResult?: { aqi: number; label: string } | null): CurrentWeather {
  const cur = data.current
  const daily = data.daily
  const hourly = data.hourly

  const wcode: number = cur.weather_code ?? 0
  const precip = cur.precipitation ?? 0
  const weatherDesc = weatherByPrecip(wcode, precip) || OM_WX[wcode] || translateWeather(String(wcode))

  const now = new Date()
  const todayDate = daily?.time?.[0] || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const currentHour = now.getHours()

  const forecast: ForecastDay[] = []
  if (daily?.time) {
    for (let i = 1; i < Math.min(daily.time.length, WEATHER.FORECAST_DAYS_SHOWN); i++) {
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

  return {
    temp: String(cur.temperature_2m ?? "--"),
    feelsLike: String(cur.apparent_temperature ?? "--"),
    humidity: String(cur.relative_humidity_2m ?? "--"),
    windDir: degToDir(cur.wind_direction_10m ?? 0),
    windScale: String(cur.wind_speed_10m ?? "--"),
    windLevel: windLevel(String(cur.wind_speed_10m)),
    weather: weatherDesc,
    high: String(daily?.temperature_2m_max?.[0] ?? "--"),
    low: String(daily?.temperature_2m_min?.[0] ?? "--"),
    sunrise: daily?.sunrise?.[0] ? extractTime(daily.sunrise[0]) : "--",
    sunset: daily?.sunset?.[0] ? extractTime(daily.sunset[0]) : "--",
    uvIndex: String(cur.uv_index ?? "--"),
    pressure: cur.surface_pressure != null ? Math.round(cur.surface_pressure) + " hPa" : "--",
    visibility: cur.visibility != null ? (cur.visibility / 1000).toFixed(1) + " km" : "--",
    dewPoint: cur.dew_point_2m != null ? cur.dew_point_2m + "°" : "--",
    cloudCover: cur.cloud_cover != null ? cur.cloud_cover + "%" : "--",
    windGust: cur.wind_gusts_10m != null ? Math.round(cur.wind_gusts_10m) + " km/h" : "--",
    aqi: aqiResult ? String(aqiResult.aqi) : "--",
    aqiLabel: aqiResult ? aqiResult.label : "",
    aqiDetail: aqiResult || undefined,
    moonrise: daily?.moonrise?.[0] ? extractTime(daily.moonrise[0]) : "--",
    moonset: daily?.moonset?.[0] ? extractTime(daily.moonset[0]) : "--",
    moonPhase: daily?.moon_phase?.[0] != null ? Number(daily.moon_phase[0]) : undefined,
    forecast,
    hourly: hourlyItems,
    hourlyByDate,
    alerts,
  }
}

export async function getWeather(lat: number, lon: number): Promise<CurrentWeather | null> {
  const [data, aqi] = await Promise.all([fetchOpenMeteo(lat, lon), fetchAQI(lat, lon)])
  if (!data) return null
  return parseWeatherData(data, aqi)
}

export async function getWeatherByCoords(lat: number, lon: number): Promise<CoordsWeather | null> {
  const [data, aqi] = await Promise.all([fetchOpenMeteo(lat, lon), fetchAQI(lat, lon)])
  if (!data) return null
  return {
    weather: parseWeatherData(data, aqi),
    placeName: nearestCity(lat, lon),
  }
}

export async function getHourlyForecast(lat: number, lon: number, date?: string): Promise<HourlyItem[]> {
  try {
    const startDate = date || new Date().toISOString().slice(0, 10)
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
    const isToday = startDate === now.toISOString().slice(0, 10)
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
