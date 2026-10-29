/**
 * 版本号。
 *
 * 之前这里是手写常量，改 manifest 时忘了改它 —— 设置页就一直显示 1.4.24，
 * 而实际装的是 1.4.39。版本号只该有一个来源，所以真机上直接读安装包里的 versionName；
 * H5 / 小程序拿不到时，才退回下面这个兜底值（跟 manifest.json 保持一致）。
 */
const FALLBACK_VERSION = "1.4.42"
const FALLBACK_CODE = 182

function nativeVersion(): string {
  try {
    // App 端 getSystemInfoSync().appVersion 就是 manifest 的 versionName，改包自动跟着变
    const v = (uni.getSystemInfoSync() as { appVersion?: string }).appVersion
    if (typeof v === "string" && /^\d+(\.\d+)+$/.test(v)) return v
  } catch {}
  return FALLBACK_VERSION
}

export const APP_VERSION = nativeVersion()
export const VERSION_CODE = FALLBACK_CODE
