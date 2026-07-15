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

function forecastWeather(hours: any[]): string {
  if (!hours || hours.length === 0) return ""
  const noon = hours[Math.min(Math.floor(hours.length / 2), hours.length - 1)]
  const desc = noon?.weatherDesc?.[0]?.value ?? ""
  return translateWeather(desc)
}

const WIND_DIR: Record<string, string> = {
  "N": "北风", "NNE": "东北风", "NE": "东北风", "ENE": "东北风",
  "E": "东风", "ESE": "东南风", "SE": "东南风", "SSE": "东南风",
  "S": "南风", "SSW": "西南风", "SW": "西南风", "WSW": "西南风",
  "W": "西风", "WNW": "西北风", "NW": "西北风", "NNW": "西北风",
}

function req(url: string): Promise<any> {
  return new Promise((resolve) => {
    uni.request({
      url,
      timeout: 5000,
      success(res) { resolve(res) },
      fail() { resolve(null) },
    })
  })
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

export async function getWeather(cityEn: string): Promise<CurrentWeather | null> {
  const res = await req(`https://wttr.in/${encodeURIComponent(cityEn)}?format=j1`)
  const data = (res as any)?.data
  if (!data?.current_condition?.[0]) return null
  const cur = data.current_condition[0]
  const avg = data.weather?.[0]
  const astro = avg?.astronomy?.[0]
  const desc = cur.weatherDesc?.[0]?.value ?? ""
  const forecast: ForecastDay[] = (data.weather || []).slice(1, 4).map((w: any) => ({
    day: dayName(w.date),
    date: w.date,
    weather: forecastWeather(w.hourly),
    high: w.maxtempC ?? "--",
    low: w.mintempC ?? "--",
  }))
  const hourly: HourlyItem[] = ((avg?.hourly) || []).map((h: any) => ({
    time: String(parseInt(h.time || "0") / 100).padStart(2, "0") + ":00",
    temp: h.tempC ?? "--",
    weather: translateWeather(h.weatherDesc?.[0]?.value ?? ""),
    rainChance: h.chanceofrain ?? "0",
    windDir: WIND_DIR[h.winddir16Point] || h.winddir16Point || "",
    windScale: h.windspeedKmph ?? "0",
  }))
  return {
    temp: cur.temp_C,
    feelsLike: cur.FeelsLikeC ?? "--",
    humidity: cur.humidity,
    windDir: WIND_DIR[cur.winddir16Point] || cur.winddir16Point,
    windScale: cur.windspeedKmph,
    windLevel: windLevel(cur.windspeedKmph),
    weather: translateWeather(desc),
    high: avg?.maxtempC ?? "--",
    low: avg?.mintempC ?? "--",
    sunrise: astro?.sunrise ?? "--",
    sunset: astro?.sunset ?? "--",
    uvIndex: cur.uvIndex ?? "--",
    forecast,
    hourly,
  }
}

const OM_WX: Record<number, string> = {
  0: "晴", 1: "晴", 2: "多云", 3: "阴",
  45: "雾", 48: "雾凇", 51: "毛毛雨", 53: "小雨", 55: "中雨",
  61: "小雨", 63: "中雨", 65: "大雨", 71: "小雪", 73: "中雪",
  75: "大雪", 77: "雪", 80: "阵雨", 81: "阵雨", 82: "大阵雨",
  85: "小阵雪", 86: "大阵雪", 95: "雷阵雨", 96: "雷阵雨+冰雹", 99: "雷阵雨+冰雹",
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

function degToDir(deg: number): string {
  const dirs = ["北风", "东北风", "东风", "东南风", "南风", "西南风", "西风", "西北风"]
  const i = Math.round(deg / 45) % 8
  return dirs[i]
}
