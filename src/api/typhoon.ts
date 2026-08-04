import { API, TIMEOUT } from "@/config"

export interface TyphoonBrief {
  id: string
  nameCn: string
  nameEn: string
  tcNum: string
  lat: number
  lon: number
  windSpeed: number
  grade: string
  path?: { lat: number; lon: number; hours: number }[]
}

function parseJsonp(text: string): any | null {
  const m = String(text).match(/\{[\s\S]*\}/)
  return m ? JSON.parse(m[0]) : null
}

function req(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    uni.request({
      url,
      timeout: TIMEOUT.TYPHOON,
      success(r) { resolve(r.statusCode >= 200 && r.statusCode < 300 ? String(r.data) : null) },
      fail() { resolve(null) },
    })
  })
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371, r = Math.PI / 180
  const dLat = (lat2 - lat1) * r
  const dLon = (lon2 - lon1) * r
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function fetchActiveTyphoons(): Promise<TyphoonBrief[]> {
  try {
    const text = await req(API.NMC_TYPHOON + "list_default?t=" + Date.now())
    const data = text ? parseJsonp(text) : null
    const list = (data?.typhoonList || []).filter((v: any[]) => v[7] === "start")
    const result: TyphoonBrief[] = []
    const MAX = 5
    for (const v of list.slice(0, MAX)) {
      const id = v[0]
      const detailText = await req(API.NMC_TYPHOON + "view_" + id + "?t=" + Date.now())
      const detail = detailText ? parseJsonp(detailText) : null
      const typhoon = detail?.typhoon
      const points = typhoon?.[8] || []
      const last = points[points.length - 1]
      const lon = Number(last?.[4]), lat = Number(last?.[5])
      const timeStr = last?.[1] ? String(last[1]) : ""
      const stale = timeStr.length === 12 && Date.now() - Date.UTC(+timeStr.slice(0,4), +timeStr.slice(4,6) - 1, +timeStr.slice(6,8), +timeStr.slice(8,10), +timeStr.slice(10,12)) > 48 * 3600000
      if (last && isFinite(lon) && isFinite(lat) && !(lon === 0 && lat === 0) && !stale) {
        const path: { lat: number; lon: number; hours: number }[] = []
        path.push({ lat, lon, hours: 0 })
        const babj = last?.[11]?.BABJ
        if (Array.isArray(babj)) {
          for (const f of babj) {
            const flon = Number(f?.[2]), flat = Number(f?.[3])
            if (isFinite(flon) && isFinite(flat) && !(flon === 0 && flat === 0)) {
              path.push({ lat: flat, lon: flon, hours: Number(f?.[0]) || 0 })
            }
          }
        }
        result.push({
          id,
          nameCn: v[2] || "",
          nameEn: v[1] || "",
          tcNum: v[4] || "",
          lat,
          lon,
          windSpeed: last[7] || 0,
          grade: last[3] || "TD",
          path: path.length ? path : undefined,
        })
      }
    }
    return result
  } catch (e) {
    console.error("typhoon fetch error:", e)
    return []
  }
}

export function typhoonDistanceKm(t: TyphoonBrief, lat: number, lon: number): number {
  return haversineKm(t.lat, t.lon, lat, lon)
}

export function pointDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversineKm(lat1, lon1, lat2, lon2)
}
