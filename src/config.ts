export const API = {
  OPEN_METEO: "https://api.open-meteo.com/v1/forecast",
  AQI: "https://air-quality-api.open-meteo.com/v1/air-quality",
  MARINE: "https://marine-api.open-meteo.com/v1/marine",
  GEOCODING: "https://geocoding-api.open-meteo.com/v1/search",
  // 反向地理编码（无 Key，按坐标取城市名）；失败时回退到本地城市表
  REVERSE_GEO: "https://api.bigdatacloud.net/data/reverse-geocode-client",
  NMC_TYPHOON: "https://typhoon.nmc.cn/weatherservice/typhoon/jsons/",
  USGS: "https://earthquake.usgs.gov/fdsnws/event/1/query",
  GFZ: "https://geofon.gfz-potsdam.de/fdsnws/event/1/query",
  EMSC: "https://www.seismicportal.eu/fdsnws/event/1/query",
} as const

export const TIMEOUT = {
  OPEN_METEO: 10000,
  OPEN_METEO_HOURLY: 6000,
  TYPHOON: 5000,
  USGS: 6000,
  GFZ: 5000,
  EMSC: 5000,
  LOCATION: 15000,
  REVERSE_GEO: 5000,
} as const

export const RETRY = {
  WEATHER_ATTEMPTS: 3,
  WEATHER_DELAY: 1500,
} as const

export const CACHE = {
  WEATHER_KEY: "weather_cache",
  CITY_KEY: "selected_city",
  /** 记住当前城市是定位来的（gps）还是手动选的（manual），定位来源的城市名每次启动可以自动修正 */
  CITY_SRC_KEY: "selected_city_src",
  FAV_KEY: "fav_cities",
  ALERTS_KEY: "current_alerts",
  RECENT_KEY: "recent_searches",
  UNIT_KEY: "unit_settings",
  TEMP_ALERT_KEY: "temp_alert_settings",
  DIGEST_KEY: "digest_settings",
  DARK_MODE_KEY: "dark_mode",
  AUTO_REFRESH_MS: 30 * 60 * 1000,
  TTL_MS: 2 * 60 * 60 * 1000,
} as const

export const DEFAULT_CITY = "北京"

/**
 * 天气助手（agent）服务地址。
 *
 * ⚠️ 必须是你自己的后端，不能在前端直连大模型 —— key 会被反编译拿走。
 *
 * 各端调试填法不同：
 *   H5 / 浏览器      http://localhost:8787
 *   微信/支付宝小程序  微信开发者工具勾选「不校验合法域名」后用局域网 IP，如 http://192.168.1.10:8787
 *   App 真机         同上，必须是局域网 IP，localhost 指向手机自己
 *   正式发布          必须 HTTPS + 已备案域名，且在小程序后台配置「服务器域名」白名单
 */
/**
 * 构建时注入的正式地址。
 *
 * 打包正式版时在 `.env.production` 里写一行 `VITE_AGENT_BASE=https://你的域名`，
 * 打出来的包就直接指向它，不用再回来改源码。没配则留空，走下面的局域网兜底。
 */
const AGENT_BASE_INJECTED: string = import.meta.env.VITE_AGENT_BASE || ""

/**
 * 构建时注入的访问密钥。
 *
 * 后端开了 AGENT_TOKEN 之后，所有请求都必须带 `X-Agent-Key`，否则 401。
 * 密钥不打进源码仓库，由 `npm run build:apk` 从后端 `.env` 读出来注入。
 *
 * 说清楚它的边界：这是"共享口令"，不是一个真正的身份认证。
 * 密钥以明文形式存在 APK 的 app-service.js 里，把 APK 解开就能看到，
 * 所以它能挡住"拿到地址的陌生人、扫描器、随手写脚本刷余额"，
 * 挡不住铁了心逆向你 APK 的人。要更强的隔离，得换成一机一密 + 服务端下发。
 */
const AGENT_KEY_INJECTED: string = import.meta.env.VITE_AGENT_KEY || ""

export const AGENT = {
  // 优先级：用户在设置页改的地址（存本地存储）> VITE_AGENT_BASE > 下面这个兜底
  //
  // 兜底用 Tailscale Funnel 的固定地址，不再写局域网 IP：
  // 局域网 IP 会随 DHCP 变（已经变过两次），而且只在家里能用。
  // 这个地址在家在外都一样，只要电脑开着、Tailscale 在跑就行。
  BASE: AGENT_BASE_INJECTED || "https://14.tail21dada.ts.net",
  // 同上，设置页里也能覆盖（存本地存储），方便换钥时不用重新打包
  KEY: AGENT_KEY_INJECTED,
  TIMEOUT: 60000,
} as const

export const WEATHER = {
  FORECAST_DAYS_SHOWN: 7,
  HOURLY_DIVISOR: 1.852,
} as const

export const UI = {
  UV_WARN: 7,
  RAIN_ALERT_PCT: 30,
  RAIN_CHANCE_SHOW: 0,
  WIND_DIR_DEG: { "北风": 0, "东北风": 45, "东风": 90, "东南风": 135, "南风": 180, "西南风": 225, "西风": 270, "西北风": 315 },
}

export const QUAKE = {
  MIN_MAG_GLOBAL: 2.5,
  MIN_MAG_CHINA: 1.5,
  CHINA_BBOX: "&minlatitude=15&maxlatitude=55&minlongitude=65&maxlongitude=150",
  BARRIER_COUNT: 2,
  DUP_LAT_TOLERANCE: 0.25,
  DUP_LON_TOLERANCE: 0.25,
  DUP_TIME_TOLERANCE: 60000,
} as const
