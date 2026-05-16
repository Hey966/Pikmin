var HELP_PAGES = [
  {
    id: "add",
    icon: "➕",
    title: "新增",
    summary: "查看新增頁面的所有功能與操作說明。",
    detailTitle: "新增頁面說明",
    sections: [
      ["直接貼上座標", "可貼上一般座標或 Google Maps 網址，系統會盡量自動解析。"],
      ["經度 / 緯度欄位", "解析後會自動填入，也可以手動修正。"],
      ["重新輸入", "清空目前新增頁的輸入內容，方便重新開始。"],
      ["分析地址與區域", "根據座標嘗試辨識所在位置，協助填入區域與分類。"],
      ["地區分類", "選擇台灣縣市，讓查看頁、地圖與路線頁能正常分類。"],
      ["區域 / 地點名稱", "區域可填較細的位置，例如區、城市或街區；地點名稱可自行命名。"],
      ["備註", "可補充地標、花朵顏色、路線或其他觀察內容。"],
      ["新增到紀錄", "將這筆座標正式存入網站資料中。"]
    ],
    tip: "先確認座標順序與位置無誤，再新增到紀錄。"
  },
  {
    id: "view",
    icon: "🌼",
    title: "查看",
    summary: "查看座標分類、卡片瀏覽與快捷操作。",
    detailTitle: "查看頁面說明",
    sections: [
      ["搜尋座標", "可用地點名稱、區域、備註、縣市或座標快速尋找資料。"],
      ["只看收藏", "勾選後會只顯示已標記星號的座標。"],
      ["縣市 / 區域卡片", "沒有搜尋或收藏篩選時，可逐層查看有資料的地區。"],
      ["單筆座標清單", "最底層會看到該地區所有記錄的座標。"],
      ["編輯與刪除", "每筆資料都可直接編輯或刪除。"],
      ["收藏星號", "每筆座標可按「☆ 收藏」標記，之後可用只看收藏快速找回。"],
      ["複製座標", "按下「複製座標」可快速取得該筆緯度與經度。"],
      ["開啟 Google Maps", "按下「開啟 Google Maps」可直接跳到地圖查看該座標位置。"],
      ["地圖總覽入口", "可從查看頁跳到地圖頁，用地圖方式瀏覽點位。"]
    ],
    tip: "想快速拿座標或開地圖時，直接使用每筆卡片上的快捷按鈕。"
  },
  {
    id: "map",
    icon: "🗺️",
    title: "地圖總覽",
    summary: "查看地圖頁的篩選、標記與跳轉功能。",
    detailTitle: "地圖總覽頁面說明",
    sections: [
      ["進入方式", "從查看頁的地圖總覽卡片進入。"],
      ["縣市 / 區域篩選", "可以縮小地圖上要顯示的座標範圍。"],
      ["地圖標記", "每一個標記代表一筆座標資料。"],
      ["點擊標記", "會顯示名稱、分類、座標與備註。"],
      ["開啟 Google Maps", "可直接跳到外部地圖查看實際位置。"],
      ["返回查看", "使用上方返回按鈕可回到查看頁。"]
    ],
    tip: "點位很多時，善用篩選能讓地圖更清楚。"
  },
  {
    id: "route",
    icon: "🧭",
    title: "路線",
    summary: "查看路線規劃、手動排序、方案儲存與 GPX 匯出。",
    detailTitle: "路線頁面說明",
    sections: [
      ["縣市 / 區域篩選", "先找出要拿來規劃路線的座標。"],
      ["勾選座標", "選擇要加入此次路線的點位。"],
      ["手動調整順序", "每筆路線點右側有 ↑ ↓ 按鈕，可自行決定起點、經過順序與終點。"],
      ["恢復自動排序", "按下「恢復自動排序」可回到系統依距離自動排列的順序。"],
      ["路線方案儲存", "可把常用路線存起來，下次直接載入，載入後也會恢復順序。"],
      ["產生道路路線", "依目前勾選與排序結果建立道路路徑。"],
      ["匯出 GPX", "把產生後的道路路線下載成 GPX 檔案。"]
    ],
    tip: "至少選 2 個點才能產生路線；想指定起終點時，先調整排序再產生。"
  },
  {
    id: "backup",
    icon: "📦",
    title: "備份",
    summary: "查看匯入、匯出與清空資料的用法。",
    detailTitle: "備份頁面說明",
    sections: [
      ["匯出記錄檔", "下載完整備份，包含座標與已儲存的路線方案。"],
      ["匯入記錄檔", "把先前匯出的 JSON 備份合併回網站。"],
      ["重新分析未分類區域", "會拿未分類資料的座標重新查地址，能辨識的會永久補回正確區域。"],
      ["重複資料處理", "相同座標與重複方案不會重複匯入。"],
      ["清空全部資料", "刪除目前裝置中的座標資料，建議先備份。"],
      ["創作者連結", "點擊 Jack 可前往 Instagram。"]
    ],
    tip: "更新網站或換裝置前，先匯出備份最安全。"
  },
  {
    id: "stats",
    icon: "📊",
    title: "統計",
    summary: "查看總座標數、地區數、路線方案與最近新增。",
    detailTitle: "統計頁面說明",
    sections: [
      ["總座標數", "顯示目前網站裡已儲存的所有座標筆數。"],
      ["有資料縣市", "統計目前有座標紀錄的縣市數量。"],
      ["有資料區域", "統計目前已有紀錄的行政區或區域數量。"],
      ["收藏座標", "顯示目前已標記星號的座標數量。"],
      ["路線方案", "顯示目前已儲存的路線方案數量。"],
      ["最近新增", "列出最近建立的幾筆座標，方便快速查看近期紀錄。"]
    ],
    tip: "統計頁適合用來快速確認目前資料累積狀況。"
  },
  {
    id: "pwa",
    icon: "📱",
    title: "加入主畫面",
    summary: "把網站安裝成手機桌面捷徑，開啟方式更像 App。",
    detailTitle: "加入主畫面說明",
    sections: [
      ["PWA 用途", "網站已加入安裝資訊，可讓支援的瀏覽器把它加入手機桌面。"],
      ["iPhone Safari", "使用分享按鈕後選擇「加入主畫面」，即可建立桌面圖示。"],
      ["Android Chrome", "開啟瀏覽器選單後，選擇「安裝應用程式」或「加到主畫面」。"],
      ["開啟體驗", "之後可直接從桌面圖示進入網站，看起來會更接近獨立 App。"]
    ],
    tip: "瀏覽器實際顯示的文字可能略有不同，但通常會是「加入主畫面」或「安裝」。"
  }
];

function renderHelpCards() {
  var grid = document.getElementById("helpCardGrid");
  if (!grid) return;

  var html = "";

  for (var i = 0; i < HELP_PAGES.length; i++) {
    var page = HELP_PAGES[i];

    html += '<button class="help-topic-card" type="button" onclick="openHelpDetail(\'' + page.id + '\')">';
    html += '<span class="help-topic-icon">' + page.icon + '</span>';
    html += '<span class="help-topic-copy">';
    html += '<b>' + escapeHTML(page.title) + '</b>';
    html += '<small>' + escapeHTML(page.summary) + '</small>';
    html += '</span>';
    html += '<span class="help-topic-arrow">›</span>';
    html += '</button>';
  }

  grid.innerHTML = html;
}

function openHelpDetail(pageId) {
  renderHelpDetail(pageId);

  if (typeof goPage === "function") {
    goPage("helpDetail");
  } else {
    showPage("helpDetail");
  }
}

function renderHelpDetail(pageId) {
  var container = document.getElementById("helpDetailContent");
  if (!container) return;

  var page = null;

  for (var i = 0; i < HELP_PAGES.length; i++) {
    if (HELP_PAGES[i].id === pageId) {
      page = HELP_PAGES[i];
      break;
    }
  }

  if (!page) return;

  var html = "";
  html += '<div class="help-detail-hero">';
  html += '<span class="help-detail-icon">' + page.icon + '</span>';
  html += '<div>';
  html += '<h2>' + escapeHTML(page.detailTitle) + '</h2>';
  html += '<p>' + escapeHTML(page.summary) + '</p>';
  html += '</div>';
  html += '</div>';

  html += '<div class="help-detail-list">';

  for (var j = 0; j < page.sections.length; j++) {
    var section = page.sections[j];
    html += '<section class="help-explain-card">';
    html += '<h3>' + escapeHTML(section[0]) + '</h3>';
    html += '<p>' + escapeHTML(section[1]) + '</p>';
    html += '</section>';
  }

  html += '</div>';
  html += '<div class="help-tip">' + escapeHTML(page.tip) + '</div>';

  container.innerHTML = html;
}
