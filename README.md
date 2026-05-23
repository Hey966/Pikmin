# 皮克敏巨大花朵座標紀錄

一個用來記錄《Pikmin Bloom》巨大花朵座標的小工具。  
可以新增座標、分類管理、查看地圖、規劃路線、匯出 GPX，並支援 PWA 安裝成手機桌面 App。

## 目前版本

目前主線版本：`v1.0.23`

本版本重點：

- 移除貼座標輸入框下方的提示文字
- 在貼座標輸入框下方新增一排三個快捷按鈕
  - 重新輸入
  - 分析地址與區域
  - 快速新增
- 快速新增功能與「新增到紀錄」相同
- 修正分析地址後，國家下拉選單不會自動切換到越南、日本、韓國、香港等非台灣國家的問題
- PWA 快取更新至 `v23`

## 主要功能

### 新增座標

- 可貼上一般經緯度座標
- 可貼上 Google Maps 網址並嘗試解析座標
- 可分析地址與區域
- 可依座標自動判斷國家
- 支援快速新增
- 可填寫區域、地點名稱與備註

### 國家與地區分類

目前支援：

- 台灣
- 日本
- 韓國
- 香港
- 越南
- 其他

系統會依座標輔助判斷國家。舊資料即使曾被存成台灣，只要座標落在越南等支援範圍內，查看與統計時也會自動歸回正確國家。

### 查看座標

- 依國家篩選
- 搜尋座標、地點名稱、區域與備註
- 收藏座標
- 複製座標
- 開啟 Google Maps
- 從查看頁進入地圖總覽

### 地圖總覽

- 依國家、縣市 / 地區、區域篩選
- 在地圖中顯示座標點
- 點擊標記查看詳細資料
- 可跳轉到 Google Maps

### 路線規劃

- 依國家與地區選擇路線點
- 勾選要加入路線的座標
- 可手動調整順序
- 可產生道路路線
- 可產生點對點直線快速路徑
- 可匯出 GPX 路線檔
- 可儲存與載入常用路線方案

### 備份與還原

- 匯出完整記錄檔
- 匯入 JSON 備份
- 匯入時會避免重複資料
- 可重新分析未分類區域
- 可清空本機資料

建議在更新網站、換手機或清除瀏覽器資料前，先匯出備份。

### 統計頁

- 總座標數
- 有資料國家數
- 有資料地區數
- 台灣有資料行政區數
- 各國座標統計
- 收藏座標數
- 路線方案數
- 最近新增座標

## PWA / 加入主畫面

此網站支援 PWA。  
可透過手機瀏覽器加入主畫面，之後可像 App 一樣從桌面圖示開啟。

### iPhone Safari

1. 用 Safari 開啟網站
2. 點選分享按鈕
3. 選擇「加入主畫面」

### Android Chrome

1. 用 Chrome 開啟網站
2. 開啟瀏覽器選單
3. 選擇「安裝應用程式」或「加到主畫面」

## 資料儲存方式

資料主要儲存在使用者裝置的瀏覽器本機儲存空間。  
若更換裝置、清除瀏覽器資料或使用不同瀏覽器，資料可能不會自動同步。

請定期使用「備份」頁面匯出記錄檔。

## 版本分支

專案會保留各版本分支，例如：

- `release/v1.0.21`
- `release/v1.0.22`
- `release/v1.0.23`

每個 release 分支會對應當時版本的檔案狀態，方便之後回溯與比較。

## 專案結構

```text
index.html
css/
  style.css
  add-actions.css
  map.css
  route-plans.css
  help.css
  stats.css
  install.css
js/
  globals.js
  geo.js
  records-state.js
  records-core.js
  records-view.js
  backup.js
  route.js
  route-plans.js
  map.js
  stats.js
  help.js
  pwa.js
  init.js
data/
  taiwan-districts-a.js
  taiwan-districts-b.js
service-worker.js
manifest.webmanifest
version.json
```

## 開發備註

每次功能異動時，應同步檢查：

- `index.html`
- 相關 CSS / JS
- `js/help.js`
- `version.json`
- `service-worker.js`
- `js/pwa.js`

如果功能會影響使用方式，幫助頁也要同步更新。

## 作者

Jack
