export interface QuakeItem {
  id: string
  mag: number
  place: string
  time: number
  lat: number
  lon: number
  depth: number
}

export function magColor(mag: number): string {
  if (mag >= 7) return "#E53935"
  if (mag >= 5) return "#EF6C00"
  if (mag >= 3) return "#F9A825"
  return "#43A047"
}

export function magRadius(mag: number): number {
  return Math.max(6, Math.min(mag * 5, 32))
}

const PLACE_CN: Record<string, string> = {
  "China": "中国", "Japan": "日本", "Indonesia": "印度尼西亚",
  "Philippines": "菲律宾", "Taiwan": "台湾地区", "India": "印度",
  "Russia": "俄罗斯", "Mongolia": "蒙古", "Myanmar": "缅甸",
  "Vietnam": "越南", "Thailand": "泰国", "Pakistan": "巴基斯坦",
  "Afghanistan": "阿富汗", "Iran": "伊朗", "Turkey": "土耳其",
  "Papua New Guinea": "巴布亚新几内亚", "Fiji": "斐济",
  "Vanuatu": "瓦努阿图", "Solomon Islands": "所罗门群岛",
  "Tonga": "汤加", "New Zealand": "新西兰", "Australia": "澳大利亚",
  "Chile": "智利", "Peru": "秘鲁", "Mexico": "墨西哥",
  "United States": "美国", "Canada": "加拿大", "Alaska": "阿拉斯加",
  "Kyrgyzstan": "吉尔吉斯斯坦", "Kazakhstan": "哈萨克斯坦",
  "Tajikistan": "塔吉克斯坦", "Nepal": "尼泊尔", "Bhutan": "不丹",
  "South Korea": "韩国", "North Korea": "朝鲜",
}

function translatePlace(place: string): string {
  for (const [en, cn] of Object.entries(PLACE_CN)) {
    if (place.includes(en)) return place.replace(en, cn)
  }
  return place.replace(/^(\d+)\s*km\s*(.+?)\s+of\s+/, '距$2$1公里').replace(/of\s+the\s+/g, '')
}

export async function getEarthquakes(date?: string): Promise<QuakeItem[]> {
  try {
    const today = new Date()
    const d = date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    const start = d + "T00:00:00"
    const end = d + "T23:59:59"
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}&endtime=${end}&minmagnitude=2.5`
    const res = await new Promise<any>((resolve) => {
      uni.request({
        url,
        timeout: 10000,
        success(r) { resolve(r) },
        fail() { resolve(null) },
      })
    })
    if (!res?.data?.features) return []
    return res.data.features
      .map((f: any) => ({
        id: f.id,
        mag: f.properties?.mag ?? 0,
        place: translatePlace(f.properties?.place ?? "未知"),
        time: f.properties?.time ?? 0,
        lat: f.geometry?.coordinates?.[1] ?? 0,
        lon: f.geometry?.coordinates?.[0] ?? 0,
        depth: f.geometry?.coordinates?.[2] ?? 0,
      }))
      .sort((a: QuakeItem, b: QuakeItem) => b.mag - a.mag)
  } catch {
    return []
  }
}
