import { API, TIMEOUT } from "@/config"

const COMPASS16 = ["北", "北东北", "东北", "东东北", "东", "东东南", "东南", "南东南", "南", "南西南", "西南", "西西南", "西", "西西北", "西北", "北西北"]

function dirText(deg: number): string {
  return COMPASS16[Math.round(deg / 22.5) % 16]
}

export interface MarineCurrent {
  waveHeight: number
  waveDir: string
  wavePeriod: number
  seaTemp: number
}

export interface MarineHour {
  time: string
  waveHeight: number
}

export interface MarineData {
  current: MarineCurrent | null
  hourly: MarineHour[]
}

export async function getMarine(lat: number, lon: number): Promise<MarineData | null> {
  try {
    const url = `${API.MARINE}?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period,sea_surface_temperature&hourly=wave_height&timezone=auto&forecast_days=2`
    const res = await new Promise<any>((resolve) => {
      uni.request({
        url,
        timeout: TIMEOUT.OPEN_METEO,
        success(r) { resolve(r) },
        fail() { resolve(null) },
      })
    })
    const data = res?.data
    if (!data) return null
    const c = data.current
    let current: MarineCurrent | null = null
    if (c && c.wave_height != null) {
      current = {
        waveHeight: Math.round(c.wave_height * 10) / 10,
        waveDir: dirText(c.wave_direction ?? 0),
        wavePeriod: Math.round(c.wave_period ?? 0),
        seaTemp: Math.round(c.sea_surface_temperature ?? 0),
      }
    }
    const hourly: MarineHour[] = []
    const h = data.hourly
    if (h?.time && h?.wave_height) {
      const nowMs = c?.time ? new Date(String(c.time)).getTime() : Date.now()
      for (let i = 0; i < h.time.length && hourly.length < 24; i++) {
        const t = String(h.time[i])
        const d = new Date(t)
        if (isNaN(d.getTime()) || d.getTime() < nowMs - 30 * 60000) continue
        hourly.push({ time: t.slice(11, 16), waveHeight: Math.round((Number(h.wave_height[i]) || 0) * 10) / 10 })
      }
    }
    if (!current && !hourly.length) return null
    return { current, hourly }
  } catch {
    return null
  }
}
