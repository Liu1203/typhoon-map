/// <reference types="@dcloudio/uni-app" />

declare module "*.vue" {
  import type { DefineComponent } from "vue"
  const component: DefineComponent<object, object, unknown>
  export default component
}

/**
 * 构建时注入的环境变量。
 *
 * 只放"打包就该定死"的值，运行时会变的东西一律走 storage（比如助手的服务地址，
 * 用户能在设置页自己改，不用重新打包）。
 */
interface ImportMetaEnv {
  /** 天气助手的服务地址，正式包指向自己的域名；不配则用 config.ts 里的局域网兜底 */
  readonly VITE_AGENT_BASE?: string
  /** 访问密钥，随 X-Agent-Key 头发送；不配则后端若开了校验会一律 401 */
  readonly VITE_AGENT_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
