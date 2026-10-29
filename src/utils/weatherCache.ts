import { CACHE } from "@/config"
import type { CurrentWeather } from "@/api/weather"

export interface CachedWeather {
  data: CurrentWeather
  city: string
  ts: number
}

/**
 * 从 storage 里读天气缓存。
 *
 * 和首页的 getCache 不是一回事：那个会顺手删掉过期项，因为首页有网络兜底；
 * 这里专给断网场景用 —— 过期的数据也比"什么都没有"强，新鲜度由调用方自己提示。
 * 也正因为只读不写，放这里不会影响首页那套缓存淘汰逻辑。
 */
export function readCachedWeather(city?: string): CachedWeather | null {
  try {
    const raw = uni.getStorageSync(CACHE.WEATHER_KEY) as string
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== "object") return null

    // 旧格式：{ data, city, ts }，一个 key 只存一座城（1.4 早期的写法）
    if (obj.data && typeof obj.city === "string" && !obj[obj.city]) {
      return { data: obj.data as CurrentWeather, city: obj.city, ts: Number(obj.ts) || 0 }
    }

    const map = obj as Record<string, CachedWeather>
    if (city && map[city] && map[city].data) return map[city]

    // 没指定城市：取最新的一份，也就是用户最近看过的那个城市
    let best: CachedWeather | null = null
    for (const key of Object.keys(map)) {
      const e = map[key]
      if (!e || typeof e !== "object" || !e.data) continue
      if (!best || (Number(e.ts) || 0) > (Number(best.ts) || 0)) best = e
    }
    return best
  } catch {
    return null
  }
}

/** 用户最后选的城市名 */
export function readCurrentCity(fallback: string): string {
  try {
    const c = uni.getStorageSync(CACHE.CITY_KEY) as string
    return c || fallback
  } catch {
    return fallback
  }
}
