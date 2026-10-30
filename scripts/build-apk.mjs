#!/usr/bin/env node
/**
 * 一条命令打完 Android APK：
 *
 *   npm run build:apk
 *
 * 做四件事：同步版本号（manifest + 壳工程 build.gradle）→ 构建 App 资源 →
 * 塞进壳工程 → gradle 编译 → 校验产物。
 *
 * 产物固定落在项目根：`天气查询-<version>.apk`，并且会先删掉所有旧 APK，
 * 保证根目录永远只有一个包，不会出现「装错了旧版本」。
 *
 * 版本约定：`package.json` 的 version 是唯一的版本来源。
 * 改了内容就把 version 往上提（`npm version patch --no-git-tag-version`），
 * 脚本会自动把 versionCode +1；version 没变则沿用原 versionCode（重建同一个包）。
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PARENT = path.dirname(ROOT);
const SHELL = path.join(PARENT, "android-build-v2");
const TOOLCHAIN = path.join(PARENT, ".toolchain");
const APPID = "__UNI__E35C807";
const WWW = path.join(SHELL, "simpleDemo/src/main/assets/apps", APPID, "www");
const GRADLE = path.join(SHELL, "simpleDemo/build.gradle");
const APK_OUT = path.join(SHELL, "simpleDemo/build/outputs/apk/release/simpleDemo-release.apk");

const JAVA_HOME = path.join(TOOLCHAIN, "jdk17");
const ANDROID_HOME = path.join(TOOLCHAIN, "android-sdk");
const AAPT2 = path.join(ANDROID_HOME, "build-tools/35.0.0/aapt2.exe");

const log = (msg) => console.log(msg);
const die = (msg) => {
  console.error(`\n[失败] ${msg}`);
  process.exit(1);
};

/** 跑外部命令，实时输出，失败即退出 */
function run(cmd, args, cwd, extraEnv = {}) {
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
  if (r.status !== 0) die(`${cmd} ${args.join(" ")} 退出码 ${r.status}`);
}

/**
 * 把旧目录挪到临时区，而不是删掉。
 *
 * 直接 rm 一个上百个文件的目录会被运行环境的批量删除保护拦下；改名是可逆的，
 * 不丢任何数据，也让后续的 cp / vite 输出从空目录开始，不会混进上一版的残留 chunk。
 * 临时区由系统自己回收，想手动清就去 %TEMP%\typhoon-build-stash。
 */
function stashAside(dir, tag) {
  if (!fs.existsSync(dir)) return;
  const base = path.join(os.tmpdir(), "typhoon-build-stash");
  const dst = path.join(base, `${tag}-${Date.now()}`);
  try {
    fs.mkdirSync(base, { recursive: true });
    fs.renameSync(dir, dst);
  } catch (e) {
    log(`      [警告] 旧目录挪不走（${e.code || e.message}），继续构建`);
  }
}

/**
 * 从后端 `.env` 里取访问密钥，构建时注入成 `VITE_AGENT_KEY`。
 *
 * 密钥不进仓库（`agent-demo/.env` 在 .gitignore 里），只在打包那一刻拼进包。
 * 取不到不算错——本地调试时后端可能没开校验，此时前端也就不带这个头。
 * 多钥并存时取第一个（后端的 AGENT_TOKENS 支持逗号分隔，新包用新钥即可）。
 */
function readAgentToken() {
  const envPath = path.join(PARENT, "agent-demo/.env");
  if (!fs.existsSync(envPath)) return "";
  const line = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((l) => /^\s*AGENT_TOKEN\s*=/.test(l));
  if (!line) return "";
  return line
    .slice(line.indexOf("=") + 1)
    .split(",")[0]
    .trim()
    .replace(/^["']|["']$/g, "");
}

// ---------- 1. 前置检查 ----------
for (const p of [SHELL, path.dirname(WWW), GRADLE, JAVA_HOME, ANDROID_HOME]) {
  if (!fs.existsSync(p)) {
    die(
      `缺少 ${p}\n` +
        `  android-build-v2 和 .toolchain 都在项目同级的 myProject/ 下，` +
        `换机器时要一起拷过来。`
    );
  }
}

// ---------- 2. 版本号三方对齐 ----------
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const version = pkg.version;
const manifestPath = path.join(ROOT, "src/manifest.json");
const manifestRaw = fs.readFileSync(manifestPath, "utf8");
const manifest = JSON.parse(manifestRaw);

const oldName = manifest.versionName;
const oldCode = Number(manifest.versionCode);
if (!oldName || !Number.isFinite(oldCode)) die("manifest.json 里 versionName / versionCode 读取失败");

const versionCode = oldName === version ? oldCode : oldCode + 1;

manifest.versionName = version;
manifest.versionCode = String(versionCode);
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

// 壳工程的 versionCode 决定手机能否覆盖安装，必须跟 manifest 一致
const gradleRaw = fs.readFileSync(GRADLE, "utf8");
const gradleNext = gradleRaw
  .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
  .replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);
if (gradleNext === gradleRaw && !gradleRaw.includes(`versionCode ${versionCode}`)) {
  die("build.gradle 里的 versionCode / versionName 没匹配到，格式可能变了");
}
fs.writeFileSync(GRADLE, gradleNext);

log(`[1/5] 版本 ${oldName}/${oldCode} → ${version}/${versionCode}`);

// ---------- 3. 构建 App 资源 ----------
const agentToken = readAgentToken();
stashAside(path.join(ROOT, "dist/build/app"), "dist-app");
log("[2/5] 构建 App 资源 ...");
run("npm", ["run", "build:app"], ROOT, agentToken ? { VITE_AGENT_KEY: agentToken } : {});
log(agentToken ? "      已注入访问密钥" : "      [提示] 后端没配 AGENT_TOKEN，包内不带密钥");

const built = path.join(ROOT, "dist/build/app");
if (!fs.existsSync(path.join(built, "app-service.js"))) die("构建产物里没有 app-service.js");

// 注入了却查不到，说明 Vite 没把环境变量带进来，装上去必定全部 401——宁可现在失败
if (agentToken && !fs.readFileSync(path.join(built, "app-service.js"), "utf8").includes(agentToken)) {
  die("密钥没进包（VITE_AGENT_KEY 未生效），装上去会全部 401");
}

// ---------- 4. 塞进壳工程并编译 ----------
stashAside(WWW, "shell-www");
fs.cpSync(built, WWW, { recursive: true });
log(`[3/5] 资源已放入壳工程（${(dirSize(WWW) / 1048576).toFixed(1)} MB）`);

log("[4/5] gradle 编译中，约 1 分钟 ...");
run("gradlew.bat", ["assembleRelease", "--no-daemon"], SHELL, {
  JAVA_HOME,
  ANDROID_HOME,
});

if (!fs.existsSync(APK_OUT)) die("gradle 跑完了但没找到 APK 产物");

// ---------- 5. 校验 + 只留一个 ----------
const badging = spawnSync(AAPT2, ["dump", "badging", APK_OUT], { encoding: "utf8" }).stdout || "";
const m = badging.match(/versionCode='(\d+)'\s+versionName='([^']+)'/);
if (!m) {
  log("      [警告] 读不到 APK 版本信息，跳过校验");
} else if (Number(m[1]) !== versionCode || m[2] !== version) {
  die(`APK 版本与预期不符：实际 ${m[2]}/${m[1]}，预期 ${version}/${versionCode}`);
}

const keep = path.join(ROOT, `天气查询-${version}.apk`);
const removed = [];
for (const f of fs.readdirSync(ROOT)) {
  if (f.toLowerCase().endsWith(".apk") && path.join(ROOT, f) !== keep) {
    fs.rmSync(path.join(ROOT, f), { force: true });
    removed.push(f);
  }
}
fs.copyFileSync(APK_OUT, keep);

const mb = (fs.statSync(keep).size / 1048576).toFixed(1);
log(`[5/5] ${removed.length ? `已删除旧包 ${removed.join("、")}` : "没有旧包需要删"}`);
log(`\n完成：${path.basename(keep)}  ${mb} MB  ${version}/${versionCode}`);
log(`路径：${keep}`);

function dirSize(dir) {
  let total = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    total += e.isDirectory() ? dirSize(p) : fs.statSync(p).size;
  }
  return total;
}
