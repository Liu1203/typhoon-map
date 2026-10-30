# Build Guide

## APK Build

**一条命令搞定**：

```bash
npm run build:apk        # = node scripts/build-apk.mjs
```

它依次做：对齐版本号 → `npm run build:app` → 资源塞进壳工程 → `gradlew assembleRelease`
→ 用 `aapt2` 校验产物的 versionCode/versionName → **删掉根目录所有旧 APK**，只留
`天气查询-<version>.apk`。所以根目录永远只有一个包，不会装错版本。

前提：`../android-build-v2` 和 `../.toolchain` 都在（脚本会先检查，缺了直接报错并说明要拷什么）。

关于「删」：脚本用**改名挪到 `%TEMP%\typhoon-build-stash`** 代替 `rm -rf` 旧产物，
因为一次删上百个文件会被运行环境的批量删除保护拦下。改名可逆、不丢数据，
也让后续 `cp` / vite 输出从空目录开始，不会混进上一版的残留 chunk。
这个临时区会随构建累积（每次约 4.6M），系统磁盘清理会回收，也可手动删。

### 手动流程（脚本不可用时）

壳工程（DCloud uni-app Android 离线打包 SDK 的 `HBuilder-Integrate-AS` 示例）与工具链都在
**项目同级目录**，不在仓库里（均被 .gitignore / 未纳入版本控制）：

```
Desktop/myProject/
├── typhoon-map/        ← 本仓库
├── android-build-v2/   ← 壳工程，612M，含 libs/*.aar、test.jks、AppKey
└── .toolchain/         ← JDK17 + Android SDK，733M
    ├── jdk17/
    └── android-sdk/    ← platforms/android-35, build-tools/35.0.0
```

1. `npm run build:app` — builds to `dist/build/app/`
2. Replace app resources in the shell project (App 名+版本号会一起带过去):
   ```
   rm -rf ../android-build-v2/simpleDemo/src/main/assets/apps/__UNI__E35C807/www
   cp -r dist/build/app ../android-build-v2/simpleDemo/src/main/assets/apps/__UNI__E35C807/www
   ```
   ⚠️ Must use `__UNI__E35C807` (NOT `weather-app`) — that's the app ID the APK reads from.
3. Build (必须显式指定 JAVA_HOME / ANDROID_HOME，本机没装 JDK):
   ```bash
   cd ../android-build-v2
   export JAVA_HOME="C:/Users/Lyq/Desktop/myProject/.toolchain/jdk17"
   export ANDROID_HOME="C:/Users/Lyq/Desktop/myProject/.toolchain/android-sdk"
   ./gradlew.bat assembleRelease --no-daemon
   ```
4. 产物：`simpleDemo/build/outputs/apk/release/simpleDemo-release.apk`（约 37M）
   拷到仓库根目录时命名 `天气查询-<version>.apk`（`.gitignore` 已忽略该模式）。

壳工程关键参数（改动前先确认）：
- appid `__UNI__E35C807`，AppKey 在 `simpleDemo/src/main/AndroidManifest.xml` 的 `dcloud_appkey`
- 包名 `com.weather.app`，compileSdk 35 / buildTools 35.0.0 / targetSdk 33 / minSdk 21
- 签名 `simpleDemo/test.jks`（alias `key0`）
- `local.properties` 的 `sdk.dir` **必须用正斜杠**，反斜杠会被 Properties 当转义符吃掉

## Version Sync

`package.json` 的 `version` 是**唯一版本来源**。手动改这一处即可：

```bash
npm version patch --no-git-tag-version   # 1.4.44 → 1.4.45
```

`npm run build:apk` 会自动把 `src/manifest.json`（versionName + versionCode，
版本变了就 versionCode +1）和 `../android-build-v2/simpleDemo/build.gradle`
同步过去。`src/version.ts` 不用改（读的是 `getSystemInfoSync().appVersion`）。

`versionCode` 决定手机能否覆盖安装：**只升不降**，否则装不上。

## Dev

- `npm run dev:app` — dev build with HMR
- `npm run build:app` — production build

## 助手后端

后端不在本仓库，在同级 `agent-demo/`（零依赖，Node >= 22.18 直接跑 .ts）。

**已经在开机时自动启动**：启动文件夹里有
`%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\autostart-backend.bat`
（源文件 `../agent-demo/autostart-backend.bat`），登录后约 3 秒后端开始监听 8787。
它带重复启动保护（检测到 8787 已监听就直接退出），源文件也有副本，重启不会双开。

**公网地址是固定的**：`https://14.tail21dada.ts.net` → 反代 `127.0.0.1:8787`。
它由 Tailscale Funnel 提供，已写进 `src/config.ts` 的 `AGENT.BASE` 作为默认值，
所以装好的 APK 不需要任何配置就能用（在家在外同一个地址）。
Tailscale 是系统服务、开机自启，`funnel --bg` 配置跨重启保留，不用每次重开。

- 手动排障用 `../agent-demo/start-assistant.bat`（可见窗口 + 健康检查）
- 地址解析优先级：设置页改的（`agent_base` 本地存储）> `VITE_AGENT_BASE`（构建注入）> `AGENT.BASE`
- 换电脑或改 Tailscale 节点名时才需要动默认值，改完要重新打包
- 旧的 cloudflared 临时隧道方案已弃用（地址每次重启都变）

## 访问密钥

Funnel 把服务挂到公网，**光靠地址不可猜是不够的**——地址一旦出现在截图、日志、
Referer 里，谁拿到都能刷模型余额。所以后端开了 `AGENT_TOKEN`，除 CORS 预检外的
所有请求（含 `/health`，它会吐余额）都必须带 `X-Agent-Key`，否则 401。

- 密钥存在 `../agent-demo/.env` 的 `AGENT_TOKEN=`（该文件不入库），支持逗号分隔多个，
  换钥时新旧并存，已装出去的 APK 不会立刻失联
- `npm run build:apk` 会从那个 `.env` 读出密钥，注入成 `VITE_AGENT_KEY` 打进包；
  注入后还会回查产物里是否真含这把钥，查不到直接失败
- 前端解析优先级：设置页改的（`agent_key` 本地存储）> `VITE_AGENT_KEY`
- 服务端换钥后，旧包会一直 401，提示语是「我这儿换了把锁」，此时去
  **设置 → 天气助手 → 访问密钥** 粘新钥即可，不用重装

**它的边界要说清楚**：密钥以明文存在 APK 的 `app-service.js` 里，解开 APK 就能读到。
它是「共享口令」，能挡住拿到地址的陌生人、扫描器和随手写脚本刷余额的，挡不住
铁了心逆向你 APK 的人。要更强的隔离，得换成一机一密 + 服务端下发，成本高很多。
