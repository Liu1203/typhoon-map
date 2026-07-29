# Build Guide

## APK Build

1. `npm run build:app` — builds to `dist/build/app/`
2. Copy to Android assets:
   ```
   robocopy "dist\build\app" "android-build-v2\simpleDemo\src\main\assets\apps\__UNI__E35C807\www" /E /PURGE
   ```
   ⚠️ Must use `__UNI__E35C807` (NOT `weather-app`) — that's the app ID the APK reads from.
3. `cd android-build-v2 && ./gradlew.bat clean assembleRelease`
4. `Copy-Item android-build-v2\simpleDemo\build\outputs\apk\release\simpleDemo-release.apk weather-app.apk -Force`

## Version Sync

Update in **3 places**:
- `package.json` — `"version"`
- `src/manifest.json` — `"versionName"`
- `android-build-v2\simpleDemo\build.gradle` — `versionName` + `versionCode`

## Dev

- `npm run dev:app` — dev build with HMR
- `npm run build:app` — production build
