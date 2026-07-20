const CITIES: Record<string, string> = {
  "北京": "Beijing", "上海": "Shanghai", "广州": "Guangzhou",
  "深圳": "Shenzhen", "杭州": "Hangzhou", "成都": "Chengdu",
  "武汉": "Wuhan", "西安": "Xi'an", "南京": "Nanjing",
  "重庆": "Chongqing", "天津": "Tianjin", "长沙": "Changsha",
  "苏州": "Suzhou", "昆明": "Kunming", "厦门": "Xiamen",
  "青岛": "Qingdao", "大连": "Dalian", "郑州": "Zhengzhou",
  "哈尔滨": "Harbin", "贵阳": "Guiyang",
  "沈阳": "Shenyang", "济南": "Jinan", "合肥": "Hefei",
  "福州": "Fuzhou", "南昌": "Nanchang", "太原": "Taiyuan",
  "石家庄": "Shijiazhuang", "南宁": "Nanning", "长春": "Changchun",
  "兰州": "Lanzhou", "呼和浩特": "Hohhot", "银川": "Yinchuan",
  "西宁": "Xining", "乌鲁木齐": "Urumqi", "拉萨": "Lhasa",
  "海口": "Haikou", "珠海": "Zhuhai", "东莞": "Dongguan",
  "佛山": "Foshan", "宁波": "Ningbo", "无锡": "Wuxi",
  "温州": "Wenzhou", "泉州": "Quanzhou", "烟台": "Yantai",
  "桂林": "Guilin", "三亚": "Sanya", "丽江": "Lijiang",
  "秦皇岛": "Qinhuangdao", "威海": "Weihai", "北海": "Beihai",
}

export const cityList = Object.keys(CITIES)
export function getCityId(name: string) {
  return CITIES[name]
}

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

export function getCityCoords(name: string): { lat: number; lon: number } | null {
  return CITY_COORDS[name] || null
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
}

export interface HourlyItem {
  time: string
  temp: string
  weather: string
  rainChance: string
  windDir: string
  windScale: string
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
  forecast: ForecastDay[]
  hourly: HourlyItem[]
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

async function fetchOpenMeteo(lat: number, lon: number): Promise<any> {
  const params = [
    `latitude=${lat}`,
    `longitude=${lon}`,
    "current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index",
    "daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,weather_code,uv_index_max",
    "hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m,wind_direction_10m",
    "timezone=auto",
    "forecast_days=4",
  ]
  const url = `https://api.open-meteo.com/v1/forecast?${params.join("&")}`

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const res = await new Promise<any>((resolve) => {
        uni.request({
          url,
          timeout: 10000,
          success(r) { resolve(r) },
          fail() { resolve(null) },
        })
      })
      if (res?.data?.current) return res.data
    } catch { /* retry */ }
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 1500))
    }
  }
  return null
}

function parseWeatherData(data: any): CurrentWeather {
  const cur = data.current
  const daily = data.daily
  const hourly = data.hourly

  const wcode: number = cur.weather_code ?? 0
  const weatherDesc = OM_WX[wcode] || translateWeather(String(wcode))

  const now = new Date()
  const todayDate = daily?.time?.[0] || now.toISOString().slice(0, 10)
  const currentHour = now.getHours()

  const forecast: ForecastDay[] = []
  if (daily?.time) {
    for (let i = 1; i < Math.min(daily.time.length, 4); i++) {
      const fc = daily.weather_code?.[i] ?? 0
      forecast.push({
        day: dayName(daily.time[i]),
        date: daily.time[i],
        weather: OM_WX[fc] || translateWeather(String(fc)),
        high: String(daily.temperature_2m_max?.[i] ?? "--"),
        low: String(daily.temperature_2m_min?.[i] ?? "--"),
      })
    }
  }

  const hourlyItems: HourlyItem[] = []
  if (hourly?.time) {
    for (let i = 0; i < hourly.time.length; i++) {
      const iso = hourly.time[i] as string
      const dateStr = iso.slice(0, 10)
      const hh = parseHourTime(iso)
      if (dateStr !== todayDate || hh < currentHour) continue

      const hcode = hourly.weather_code?.[i] ?? 0
      hourlyItems.push({
        time: hh + ":00",
        temp: String(hourly.temperature_2m?.[i] ?? "--"),
        weather: OM_WX[hcode] || translateWeather(String(hcode)),
        rainChance: String(hourly.precipitation_probability?.[i] ?? 0),
        windDir: degToDir(hourly.wind_direction_10m?.[i] ?? 0),
        windScale: String(Math.round((hourly.wind_speed_10m?.[i] ?? 0) / 1.852)),
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
    forecast,
    hourly: hourlyItems,
  }
}

export async function getWeather(lat: number, lon: number): Promise<CurrentWeather | null> {
  const data = await fetchOpenMeteo(lat, lon)
  if (!data) return null
  return parseWeatherData(data)
}

export async function getWeatherByCoords(lat: number, lon: number): Promise<CoordsWeather | null> {
  const data = await fetchOpenMeteo(lat, lon)
  if (!data) return null
  return {
    weather: parseWeatherData(data),
    placeName: nearestCity(lat, lon),
  }
}

export async function getHourlyForecast(lat: number, lon: number, date?: string): Promise<HourlyItem[]> {
  try {
    const startDate = date || new Date().toISOString().slice(0, 10)
    const endDate = date || startDate
    const res = await new Promise<any>((resolve) => {
      uni.request({
        url: `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode,precipitation_probability,windspeed_10m,winddirection_10m&timezone=auto&start_date=${startDate}&end_date=${endDate}`,
        timeout: 6000,
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
      result.push({
        time: hh + ":00",
        temp: String(h.temperature_2m?.[i] ?? "--"),
        weather: OM_WX[wcode] || translateWeather(String(wcode)),
        rainChance: String(h.precipitation_probability?.[i] ?? 0),
        windDir: degToDir(h.winddirection_10m?.[i] ?? 0),
        windScale: String(Math.round((h.windspeed_10m?.[i] ?? 0) / 1.852)),
      })
    }
    return result
  } catch {
    return []
  }
}
