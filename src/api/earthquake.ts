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
  if (mag >= 7) return "#E5606E"
  if (mag >= 5) return "#F09050"
  if (mag >= 3) return "#E8B84A"
  return "#5BAA6A"
}

export function magBgColor(mag: number): string {
  if (mag >= 7) return "#FFE8EA"
  if (mag >= 5) return "#FFF0E4"
  if (mag >= 3) return "#FFFBE0"
  return "#EBF5EB"
}

export function magRadius(mag: number): number {
  return Math.max(8, Math.round(mag * mag * 3 + 8))
}

const PLACE_CN: Record<string, string> = {
  "China": "中国", "Japan": "日本", "Indonesia": "印度尼西亚",
  "Philippines": "菲律宾", "Taiwan": "台湾地区", "India": "印度",
  "Russia": "俄罗斯", "Mongolia": "蒙古", "Myanmar": "缅甸",
  "Vietnam": "越南", "Thailand": "泰国", "Pakistan": "巴基斯坦",
  "Afghanistan": "阿富汗", "Iran": "伊朗", "Turkey": "土耳其",
  "Nepal": "尼泊尔", "Bhutan": "不丹", "Bangladesh": "孟加拉国",
  "South Korea": "韩国", "North Korea": "朝鲜",
  "Kyrgyzstan": "吉尔吉斯斯坦", "Kazakhstan": "哈萨克斯坦",
  "Tajikistan": "塔吉克斯坦", "Uzbekistan": "乌兹别克斯坦",
  "Papua New Guinea": "巴布亚新几内亚", "Fiji": "斐济",
  "Vanuatu": "瓦努阿图", "Solomon Islands": "所罗门群岛",
  "Tonga": "汤加", "New Zealand": "新西兰", "Australia": "澳大利亚",
  "Chile": "智利", "Peru": "秘鲁", "Mexico": "墨西哥",
  "United States": "美国", "Canada": "加拿大",
  "Alaska": "阿拉斯加", "Hawaii": "夏威夷",
}

function translatePlace(place: string): string {
  for (const [en, cn] of Object.entries(PLACE_CN)) {
    if (place.includes(en)) return place.replace(en, cn)
  }
  return place.replace(/^(\d+)\s*km\s+(.+?)\s+of\s+(.+)/, '距$3$1公里')
}

async function fetchQuakes(url: string, timeout: number): Promise<QuakeItem[]> {
  const res = await new Promise<any>((resolve) => {
    uni.request({
      url,
      timeout,
      success(r) { resolve(r) },
      fail() { resolve(null) },
    })
  })
  if (!res?.data?.features) return []
  return res.data.features.map((f: any) => {
    const p = f.properties || {}
    const g = f.geometry || {}
    const lat = g.coordinates?.[1] ?? p.lat ?? 0
    const lon = g.coordinates?.[0] ?? p.lon ?? 0
    const depth = g.coordinates?.[2] ?? p.depth ?? 0
    const place = p.place || p.flynn_region || "未知"
    return {
      id: String(f.id || p.unid || ""),
      mag: p.mag ?? 0,
      place: translatePlace(place),
      time: typeof p.time === "string" ? new Date(p.time).getTime() : (p.time ?? 0),
      lat,
      lon,
      depth: Math.abs(depth),
    }
  })
}

function dedup(list: QuakeItem[]): QuakeItem[] {
  const result: QuakeItem[] = []
  for (const q of list) {
    const dup = result.find(r =>
      Math.abs(r.lat - q.lat) < 0.25 &&
      Math.abs(r.lon - q.lon) < 0.25 &&
      Math.abs(r.time - q.time) < 60000
    )
    if (!dup) {
      result.push(q)
    } else if (q.mag > dup.mag) {
      Object.assign(dup, q)
    }
  }
  return result
}

const cache = new Map<string, QuakeItem[]>()

export async function getEarthquakes(
  date?: string,
  region?: "global" | "china",
  onUpdate?: (items: QuakeItem[]) => void
): Promise<QuakeItem[]> {
  const today = new Date()
  const d = date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  const start = d + "T00:00:00"
  const end = d + "T23:59:59"
  const cacheKey = `${d}|${region || "global"}`

  const cached = cache.get(cacheKey)
  if (cached) {
    if (onUpdate) onUpdate(cached)
    return cached
  }

  const isChina = region === "china"
  const bbox = isChina ? "&minlatitude=15&maxlatitude=55&minlongitude=65&maxlongitude=150" : ""
  const minmag = isChina ? "&minmagnitude=1.5" : "&minmagnitude=2.5"

  const p1 = fetchQuakes(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}&endtime=${end}${bbox}${minmag}`, 6000)
  const p2 = fetchQuakes(`https://geofon.gfz-potsdam.de/fdsnws/event/1/query?format=geojson&starttime=${start}&endtime=${end}${bbox}${minmag}&orderby=time`, 5000)
  const p3 = fetchQuakes(`https://www.seismicportal.eu/fdsnws/event/1/query?format=json&starttime=${start}&endtime=${end}${bbox}${minmag}`, 5000)

  let all: QuakeItem[] = []

  const merge = (items: QuakeItem[]) => {
    all = dedup([...all, ...items]).sort((a, b) => b.mag - a.mag)
    if (onUpdate) onUpdate(all)
    return all
  }

  // 竞速：任意两家先返回就开始渲染
  const race = [p1, p2, p3]
  let resolved = 0
  const barrier = 2

  const raceResult = new Promise<QuakeItem[]>((resolve) => {
    race.forEach(p => {
      p.then(items => {
        resolved++
        const merged = merge(items)
        if (resolved >= barrier) resolve(merged)
      }).catch(() => {
        resolved++
        if (resolved >= barrier) resolve(all)
      })
    })
  })

  const result = await raceResult

  // 后台补齐剩余
  Promise.all(race.map(p => p.catch(() => []))).then(batches => {
    const final = merge(batches.flat())
    cache.set(cacheKey, final)
    if (onUpdate) onUpdate(final)
  })

  // 先存阶段性缓存
  setTimeout(() => { if (!cache.has(cacheKey)) cache.set(cacheKey, result) }, 200)

  return result
}

export function getDateStr(offset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
