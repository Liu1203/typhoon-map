import { CACHE } from "@/config"

export function loadDarkMode(): boolean {
  const stored = uni.getStorageSync(CACHE.DARK_MODE_KEY) as string
  if (stored === "1") return true
  if (stored === "0") return false
  const sys = uni.getSystemInfoSync()
  return sys.theme === "dark"
}

export function toggleDarkMode(): boolean {
  const stored = uni.getStorageSync(CACHE.DARK_MODE_KEY) as string
  if (!stored) {
    uni.setStorageSync(CACHE.DARK_MODE_KEY, "1")
    return true
  }
  if (stored === "1") {
    uni.setStorageSync(CACHE.DARK_MODE_KEY, "0")
    return false
  }
  uni.removeStorageSync(CACHE.DARK_MODE_KEY)
  return uni.getSystemInfoSync().theme === "dark"
}
