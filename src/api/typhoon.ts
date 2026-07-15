export interface TyphoonItem {
  id: string
  nameCn: string
  nameEn: string
  tcNum: string
}

export interface TyphoonPoint {
  time: string
  lon: number
  lat: number
  pressure: number
  windSpeed: number
  grade: string
  gradeText: string
}

export interface TyphoonDetail {
  id: string
  nameCn: string
  nameEn: string
  tcNum: string
  history: TyphoonPoint[]
  forecast: TyphoonPoint[]
}

const GRADE_MAP: Record<string, string> = {
  "TD": "热带低压", "TS": "热带风暴", "STS": "强热带风暴",
  "TY": "台风", "STY": "强台风", "SuperTY": "超强台风",
}

function parseGrade(g: string): string {
  return GRADE_MAP[g] || g || "未知"
}

function parseJsonp(text: string): any {
  const m = text.match(/\{[\s\S]*\}/)
  return m ? JSON.parse(m[0]) : null
}

function req(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    uni.request({
      url,
      timeout: 5000,
      success(res) { resolve((res as any).data as string) },
      fail() { resolve(null) },
    })
  })
}

export async function getActiveTyphoons(): Promise<TyphoonItem[]> {
  const text = await req(`http://typhoon.nmc.cn/weatherservice/typhoon/jsons/list_default?t=${Date.now()}`)
  if (!text) return []
  const data = parseJsonp(text)
  if (!data?.typhoonList) return []
  return data.typhoonList
    .map((v: any) => ({
      id: v[0],
      nameCn: v[2],
      nameEn: v[1],
      tcNum: v[4],
    }))
}

export async function getHistoricalTyphoons(year: number): Promise<TyphoonItem[]> {
  const text = await req(`http://typhoon.nmc.cn/weatherservice/typhoon/jsons/list_${year}?t=${Date.now()}`)
  if (!text) return []
  const data = parseJsonp(text)
  if (!data?.typhoonList) return []
  return data.typhoonList
    .map((v: any) => ({
      id: v[0],
      nameCn: v[2],
      nameEn: v[1],
      tcNum: v[4],
    }))
}

export function getYearList(): number[] {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear - 1; y >= 2015; y--) {
    years.push(y)
  }
  return years
}

export async function getTyphoonDetail(id: string): Promise<TyphoonDetail | null> {
  const text = await req(`http://typhoon.nmc.cn/weatherservice/typhoon/jsons/view_${id}?t=${Date.now()}`)
  if (!text) return null
  const data = parseJsonp(text)
  if (!data?.typhoon) return null
  const raw = data.typhoon
  const points: any[] = raw[8] || []
  const last = points[points.length - 1]
  const forecast: any[] = last?.[11]?.BABJ || []

  const history: TyphoonPoint[] = points.map((v: any) => ({
    time: v[1] != null ? String(v[1]) : "",
    lon: Number(v[4]) || 0,
    lat: Number(v[5]) || 0,
    pressure: v[6] || 0,
    windSpeed: v[7] || 0,
    grade: v[3] || "TD",
    gradeText: parseGrade(v[3]),
  }))
  // Forecast: v[0] is hour offset from the last history point
  const lastHistTime = history.length > 0 ? history[history.length - 1].time : ""
  const baseTime = lastHistTime.length === 12
    ? new Date(Date.UTC(
        +lastHistTime.slice(0, 4), +lastHistTime.slice(4, 6) - 1, +lastHistTime.slice(6, 8),
        +lastHistTime.slice(8, 10), +lastHistTime.slice(10, 12)
      ))
    : new Date()
  const forecastPts: TyphoonPoint[] = forecast.map((v: any) => {
    const offsetH = Number(v[0]) || 0
    const ft = new Date(baseTime.getTime() + offsetH * 3600000)
    const pad = (n: number) => String(n).padStart(2, "0")
    const timeStr = `${ft.getUTCFullYear()}${pad(ft.getUTCMonth() + 1)}${pad(ft.getUTCDate())}${pad(ft.getUTCHours())}${pad(ft.getUTCMinutes())}`
    return {
      time: timeStr,
      lon: Number(v[2]) || 0,
      lat: Number(v[3]) || 0,
      pressure: v[4] || 0,
      windSpeed: v[5] || 0,
      grade: v[7] || "TD",
      gradeText: parseGrade(v[7]),
    }
  })
  return {
    id,
    nameCn: raw[2] || "",
    nameEn: raw[1] || "",
    tcNum: raw[4] || "",
    history,
    forecast: forecastPts,
  }
}
