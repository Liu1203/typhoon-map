# 部署 leaflet.html 到 GitHub Pages

## 1. 创建 GitHub 仓库并上传

```bash
# 在 GitHub 上新建一个公开仓库 typhoon-map
# 然后在本地操作：
git clone https://github.com/Liu1203/typhoon-map.git
cd typhoon-map
# 将 leaflet.html 复制到仓库根目录
copy F:\douple\weather-app\src\static\leaflet.html .
git add leaflet.html
git commit -m "add typhoon map"
git push origin main
```

## 2. 启用 GitHub Pages

1. 打开 https://github.com/Liu1203/typhoon-map
2. Settings → Pages
3. Source: 选 "Deploy from a branch"
4. Branch: 选 `main`, 目录选 `/ (root)`
5. Save

等待 2-3 分钟后访问：
https://liu1203.github.io/typhoon-map/leaflet.html

应该能看到 OpenStreetMap 全球地图。

## 3. 微信公众平台配置业务域名

1. 登录 https://mp.weixin.qq.com
2. 开发 → 开发管理 → 业务域名
3. 点击"修改" → 添加 `liu1203.github.io`
4. 下载校验文件（MP_verify_xxxxx.txt）
5. 将校验文件放到 GitHub 仓库根目录并推送
6. 回到微信后台点击"保存"

## 4. 重新导入小程序

在微信开发者工具中重新导入 `dist/build/mp-weixin`，页面应显示 OSM 全球地图。
