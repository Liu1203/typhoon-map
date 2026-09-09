import { gradientColors, uvLabel } from "@/utils/weather"
import type { CurrentWeather } from "@/api/weather"

function roundRectCtx(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export function drawShareCard(city: string, w: CurrentWeather): Promise<string> {
  return new Promise((resolve, reject) => {
    const W = 500, H = 700, P = 30
    const colors = gradientColors(w.weather)
    const textColor = w.weather.includes("雪") ? "#2c3e50" : "#ffffff"
    const muted = (a: number) => w.weather.includes("雪") ? `rgba(44,62,80,${a})` : `rgba(255,255,255,${a})`

    const ctx = uni.createCanvasContext("shareCanvas")

    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, colors[0])
    grad.addColorStop(0.5, colors[1])
    grad.addColorStop(1, colors[2])
    ctx.setFillStyle(grad)
    ctx.fillRect(0, 0, W, H)

    ctx.setGlobalAlpha(0.06)
    ctx.setFillStyle("#ffffff")
    ctx.beginPath()
    ctx.arc(W - 20, -20, 160, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(W - 140, -80, 100, 0, Math.PI * 2)
    ctx.fill()
    ctx.setGlobalAlpha(1)

    ctx.setGlobalAlpha(0.04)
    ctx.beginPath()
    ctx.arc(250, H, 300, Math.PI, 0)
    ctx.fill()
    ctx.setGlobalAlpha(1)

    ctx.setFontSize(30)
    ctx.setFillStyle(textColor)
    ctx.setTextAlign("center")
    ctx.setTextBaseline("top")
    ctx.fillText(city, W / 2, P + 8)

    const now = new Date()
    const dateStr = now.getFullYear() + "年" + (now.getMonth() + 1) + "月" + now.getDate() + "日"
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
    ctx.setFontSize(13)
    ctx.setGlobalAlpha(0.6)
    ctx.setFillStyle(textColor)
    ctx.fillText(dateStr + " " + weekdays[now.getDay()], W / 2, P + 48)
    ctx.setGlobalAlpha(1)

    ctx.setFontSize(96)
    ctx.setFillStyle(textColor)
    ctx.fillText(w.temp + "°", W / 2, P + 90)

    ctx.setFontSize(20)
    ctx.setGlobalAlpha(0.85)
    ctx.setFillStyle(textColor)
    ctx.fillText(w.weather, W / 2, P + 200)
    ctx.setFontSize(14)
    ctx.setGlobalAlpha(0.6)
    ctx.fillText("体感 " + w.feelsLike + "°", W / 2, P + 232)
    ctx.setGlobalAlpha(1)

    ctx.setFontSize(18)
    ctx.setFillStyle(textColor)
    ctx.fillText("↑ " + w.high + "°    ↓ " + w.low + "°", W / 2, P + 270)

    const details: { label: string; value: string }[] = [
      { label: "湿度", value: w.humidity + "%" },
      { label: w.windDir || "风向", value: w.windLevel || "--" },
      { label: "紫外线", value: uvLabel(w.uvIndex) },
      { label: "气压", value: w.pressure },
      { label: "能见度", value: w.visibility },
      { label: "日出", value: w.sunrise },
    ]

    const cols = 3
    const cardW = (W - P * 2 - 12) / 3
    const cardH = 58
    const gridStartY = P + 315

    details.forEach((d, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = P + col * (cardW + 6)
      const y = gridStartY + row * (cardH + 6)

      ctx.setFillStyle(muted(0.13))
      roundRectCtx(ctx, x, y, cardW, cardH, 8)
      ctx.fill()

      ctx.setFontSize(11)
      ctx.setTextAlign("center")
      ctx.setTextBaseline("top")
      ctx.setGlobalAlpha(0.6)
      ctx.setFillStyle(textColor)
      ctx.fillText(d.label, x + cardW / 2, y + 8)
      ctx.setFontSize(15)
      ctx.setGlobalAlpha(1)
      ctx.fillText(d.value, x + cardW / 2, y + 28)
    })

    const sunsetY = gridStartY + 2 * (cardH + 6) + 16
    ctx.setGlobalAlpha(0.12)
    ctx.setStrokeStyle(textColor)
    ctx.setLineWidth(1)
    ctx.beginPath()
    ctx.moveTo(P, sunsetY)
    ctx.lineTo(W - P, sunsetY)
    ctx.stroke()
    ctx.setGlobalAlpha(1)

    ctx.setFontSize(13)
    ctx.setGlobalAlpha(0.6)
    ctx.setFillStyle(textColor)
    ctx.setTextAlign("center")
    ctx.fillText("日落 " + w.sunset, W / 2, sunsetY + 12)
    ctx.setGlobalAlpha(1)

    ctx.setFontSize(13)
    ctx.setGlobalAlpha(0.4)
    ctx.setFillStyle(textColor)
    ctx.fillText("清清天气 · 知冷暖 观风雨", W / 2, H - 36)
    ctx.setGlobalAlpha(1)

    ctx.draw(false, () => {
      uni.canvasToTempFilePath({
        canvasId: "shareCanvas",
        success: (res: any) => resolve(res.tempFilePath),
        fail: (err: any) => reject(err),
      })
    })
  })
}

export function shareWeatherCard(city: string, w: CurrentWeather) {
  drawShareCard(city, w)
    .then((tempPath) => {
      uni.saveImageToPhotosAlbum({
        filePath: tempPath,
        success() {
          uni.showToast({ title: "天气卡片已保存到相册", icon: "none" })
        },
        fail(err: any) {
          if (String(err.errMsg || "").includes("deny") || String(err.errMsg || "").includes("permission")) {
            uni.showModal({
              title: "需要相册权限",
              content: "请在系统设置中允许本应用访问相册",
              confirmText: "去设置",
              success(res: any) {
                if (res.confirm) uni.openSetting({})
              },
            })
          } else {
            uni.showToast({ title: "保存失败: " + (err.errMsg || ""), icon: "none" })
          }
        },
      })
    })
    .catch(() => uni.showToast({ title: "生成卡片失败", icon: "none" }))
}
