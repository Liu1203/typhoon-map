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
