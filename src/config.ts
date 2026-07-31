export const API = {
  OPEN_METEO: "https://api.open-meteo.com/v1/forecast",
  AQI: "https://air-quality-api.open-meteo.com/v1/air-quality",
  GEOCODING: "https://geocoding-api.open-meteo.com/v1/search",
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
} as const

export const RETRY = {
  WEATHER_ATTEMPTS: 3,
  WEATHER_DELAY: 1500,
} as const

export const CACHE = {
  WEATHER_KEY: "weather_cache",
  CITY_KEY: "selected_city",
  DARK_MODE_KEY: "dark_mode",
  AUTO_REFRESH_MS: 30 * 60 * 1000,
  TTL_MS: 2 * 60 * 60 * 1000,
} as const

export const WEATHER = {
  FORECAST_DAYS_SHOWN: 7,
  HOURLY_DIVISOR: 1.852,
} as const

export const QUAKE = {
  MIN_MAG_GLOBAL: 2.5,
  MIN_MAG_CHINA: 1.5,
  CHINA_BBOX: "&minlatitude=15&maxlatitude=55&minlongitude=65&maxlongitude=150",
  BARRIER_COUNT: 2,
  DUP_LAT_TOLERANCE: 0.25,
  DUP_LON_TOLERANCE: 0.25,
  DUP_TIME_TOLERANCE: 60000,
} as const
