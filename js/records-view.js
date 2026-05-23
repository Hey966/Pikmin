function getViewCountryValue() {
  var select = document.getElementById("viewCountryFilter");
  return normalizeCountryValue(select ? select.value : "台灣");
}

function renderList() {
  var list = document.getElementById("list");

  if (!list) {
    return;
  }

  if (hasActiveViewFilters()) {
    renderFilteredPointSearchList();
    return;
  }

  var country = getSelectedViewCountry();

  if (country === "台灣") {
    if (selectedViewRegion && selectedViewDistrict) {
      renderTaiwanDistrictPointList();
    } else if (selectedViewRegion) {
      renderTaiwanDistrictGrid();
    } else {
      renderRegionGrid();
    }
  } else {
    if (selectedViewRegion) {
      renderRegionPointList();
    } else {
      renderRegionGrid();
    }
  }
}

function getViewSearchText() {
  var input = document.getElementById("viewSearchText");
  return input ? String(input.value || "").trim().toLowerCase() : "";
}

function isFavoriteOnlyView() {
  var checkbox = document.getElementById("favoriteOnlyFilter");
  return !!(checkbox && checkbox.checked);
}

function hasActiveViewFilters() {
  return getViewSearchText() !== "" || isFavoriteOnlyView();
}

function resetViewFilters() {
  var input = document.getElementById("viewSearchText");
  var checkbox = document.getElementById("favoriteOnlyFilter");

  if (input) input.value = "";
  if (checkbox) checkbox.checked = false;

  renderList();
}

function pointMatchesViewSearch(point, keyword) {
  if (!keyword) {
    return true;
  }

  var searchable = [
    getPointCountry(point) || "",
    point.name || "",
    point.area || "",
    point.category || "",
    getPointDistrict(point) || "",
    point.note || "",
    point.y || "",
    point.x || ""
  ].join(" ").toLowerCase();

  return searchable.indexOf(keyword) !== -1;
}

function renderFilteredPointSearchList() {
  var list = document.getElementById("list");
  var title = document.getElementById("viewRegionTitle");
  var keyword = getViewSearchText();
  var favoriteOnly = isFavoriteOnlyView();
  var country = getSelectedViewCountry();
  var matched = [];

  for (var i = 0; i < points.length; i++) {
    var p = points[i];

    if (getPointCountry(p) !== country) {
      continue;
    }

    if (favoriteOnly && !isPointFavorite(p)) {
      continue;
    }

    if (!pointMatchesViewSearch(p, keyword)) {
      continue;
    }

    matched.push(p);
  }

  if (title) {
    var titleText = favoriteOnly ? "⭐ " + country + " 收藏座標" : "🔎 " + country + " 搜尋結果";
    var subText = "符合條件：<b>" + matched.length + "</b> 筆座標";

    if (keyword) {
      subText += "｜關鍵字：「" + escapeHTML(keyword) + "」";
    }

    title.innerHTML =
      '<div class="view-title-box search-title-box">' +
      '<div class="dex-title-main">' + titleText + '</div>' +
      '<div class="dex-title-sub">' + subText + '</div>' +
      '</div>';
  }

  if (matched.length === 0) {
    list.innerHTML = '<div class="empty">找不到符合條件的座標 🌱</div>';
    return;
  }

  var html = "";

  for (var j = 0; j < matched.length; j++) {
    html += buildPointItemHTML(matched[j]);
  }

  list.innerHTML = html;
}

function resetViewRegion() {
  selectedViewRegion = null;
  selectedViewDistrict = null;
  renderList();
}

function openViewRegionByIndex(index) {
  if (!currentViewRegions[index]) {
    return;
  }

  selectedViewRegion = currentViewRegions[index];
  selectedViewDistrict = null;
  renderList();
  window.scrollTo(0, 0);
}

function openViewDistrictByIndex(index) {
  if (!currentViewDistricts[index]) {
    return;
  }

  selectedViewDistrict = currentViewDistricts[index];
  renderList();
  window.scrollTo(0, 0);
}

function backToRegionGrid() {
  selectedViewRegion = null;
  selectedViewDistrict = null;
  renderList();
  window.scrollTo(0, 0);
}

function backToDistrictGrid() {
  selectedViewDistrict = null;
  renderList();
  window.scrollTo(0, 0);
}

function renderRegionGrid() {
  var list = document.getElementById("list");
  var title = document.getElementById("viewRegionTitle");
  var country = getSelectedViewCountry();
  var regions = getRegionsForCountry(country);

  currentViewRegions = regions;

  if (title) {
    title.innerHTML =
      '<div class="view-title-box dex-title-box">' +
      '<div class="dex-title-main">📖 ' + escapeHTML(country) + ' 地區圖鑑</div>' +
      '<div class="dex-title-sub">選擇縣市或地區，查看已記錄的巨大花朵座標。</div>' +
      '</div>';
  }

  if (regions.length === 0) {
    list.innerHTML = '<div class="empty">這個國家目前沒有任何地區資料 🌱</div>';
    return;
  }

  var html = "";
  html += '<div class="region-grid dex-grid">';

  for (var i = 0; i < regions.length; i++) {
    var region = regions[i];

    if (country === "台灣") {
      var activeDistrictCount = countActiveDistrictsInCity(region);
      var totalDistrictCount = countTotalDistrictsInCity(region);

      html += buildDexCard({
        index: i,
        name: shortRegionName(region),
        fullName: region,
        count: activeDistrictCount,
        countText: activeDistrictCount + " 個地區有紀錄",
        progress: getCityDistrictProgress(activeDistrictCount, totalDistrictCount),
        type: "region",
        onclick: "openViewRegionByIndex(" + i + ")"
      });
    } else {
      var pointCount = countPointsInRegion(country, region);

      html += buildDexCard({
        index: i,
        name: shortRegionName(region),
        fullName: region,
        count: pointCount,
        countText: pointCount + " 筆座標",
        progress: getCoordinateProgress(pointCount),
        type: "region",
        onclick: "openViewRegionByIndex(" + i + ")"
      });
    }
  }

  html += '</div>';

  list.innerHTML = html;
}

function renderTaiwanDistrictGrid() {
  var list = document.getElementById("list");
  var title = document.getElementById("viewRegionTitle");
  var city = selectedViewRegion;
  var districts = getDistrictsForTaiwanCity(city);

  currentViewDistricts = districts;

  if (title) {
    title.innerHTML =
      '<div class="view-title-box dex-title-box">' +
      '<div class="dex-title-main">📖 台灣 / ' + escapeHTML(shortRegionName(city)) + ' 圖鑑</div>' +
      '<div class="dex-title-sub">選擇區域查看座標。</div>' +
      '<button class="small-btn secondary" type="button" onclick="backToRegionGrid()">← 返回縣市列表</button>' +
      '</div>';
  }

  if (districts.length === 0) {
    list.innerHTML = '<div class="empty">這個縣市目前沒有區域資料 🌱</div>';
    return;
  }

  var html = "";
  html += '<div class="region-grid dex-grid">';

  for (var i = 0; i < districts.length; i++) {
    var district = districts[i];
    var coordinateCount = countPointsInDistrict(city, district);

    html += buildDexCard({
      index: i,
      name: district,
      fullName: district,
      count: coordinateCount,
      countText: coordinateCount + " 筆座標",
      progress: getCoordinateProgress(coordinateCount),
      type: "district",
      onclick: "openViewDistrictByIndex(" + i + ")"
    });
  }

  html += '</div>';

  list.innerHTML = html;
}

function renderTaiwanDistrictPointList() {
  var list = document.getElementById("list");
  var title = document.getElementById("viewRegionTitle");
  var city = selectedViewRegion;
  var district = selectedViewDistrict;
  var html = "";
  var count = 0;

  if (title) {
    title.innerHTML =
      '<div class="view-title-box">' +
      '<b>台灣 / ' + escapeHTML(shortRegionName(city)) + ' / ' + escapeHTML(district) + '</b><br>' +
      '<button class="small-btn secondary" type="button" onclick="backToDistrictGrid()">← 返回區域列表</button>' +
      '</div>';
  }

  for (var i = 0; i < points.length; i++) {
    var p = points[i];

    if (getPointCountry(p) !== "台灣") {
      continue;
    }

    if (p.category !== city) {
      continue;
    }

    if (getPointDistrict(p) !== district) {
      continue;
    }

    count++;
    html += buildPointItemHTML(p);
  }

  if (count === 0) {
    html = '<div class="empty">這個區域目前沒有座標 🌱</div>';
  }

  list.innerHTML = html;
}

function renderRegionPointList() {
  var list = document.getElementById("list");
  var title = document.getElementById("viewRegionTitle");
  var country = getSelectedViewCountry();
  var region = selectedViewRegion;
  var html = "";
  var count = 0;

  if (title) {
    title.innerHTML =
      '<div class="view-title-box">' +
      '<b>' + escapeHTML(country) + ' / ' + escapeHTML(shortRegionName(region)) + '</b><br>' +
      '<button class="small-btn secondary" type="button" onclick="backToRegionGrid()">← 返回地區列表</button>' +
      '</div>';
  }

  for (var i = 0; i < points.length; i++) {
    var p = points[i];

    if (getPointCountry(p) !== country) {
      continue;
    }

    if (p.category !== region) {
      continue;
    }

    count++;
    html += buildPointItemHTML(p);
  }

  if (count === 0) {
    html = '<div class="empty">這個地區目前沒有座標 🌱</div>';
  }

  list.innerHTML = html;
}

function buildDexCard(options) {
  var count = options.count || 0;
  var emptyClass = count === 0 ? " empty-region dex-empty" : " dex-active";
  var icon = getDexIcon(options.fullName, options.type);
  var progress = options.progress || 0;

  var html = "";

  html += '<button class="region-card dex-card' + emptyClass + '" type="button" onclick="' + options.onclick + '">';

  html += '<div class="dex-card-top">';
  html += '<div class="dex-icon">' + icon + '</div>';
  html += '<div class="dex-number">#' + formatDexNumber(options.index + 1) + '</div>';
  html += '</div>';

  html += '<div class="region-name dex-name">' + escapeHTML(options.name) + '</div>';

  html += '<div class="dex-count-only">';
  html += escapeHTML(options.countText);
  html += '</div>';

  html += '<div class="dex-progress">';
  html += '<div class="dex-progress-bar" style="width:' + progress + '%;"></div>';
  html += '</div>';

  if (count === 0) {
    html += '<div class="dex-hint">尚未發現</div>';
  } else {
    html += '<div class="dex-hint">點擊查看</div>';
  }

  html += '</button>';

  return html;
}

function formatDexNumber(num) {
  if (num < 10) {
    return "00" + num;
  }

  if (num < 100) {
    return "0" + num;
  }

  return String(num);
}

/* 縣市卡片進度：有資料的區域 / 全部區域 */
function getCityDistrictProgress(activeCount, totalCount) {
  if (!totalCount || totalCount <= 0) {
    return 0;
  }

  return Math.round((activeCount / totalCount) * 100);
}

/* 區域卡片進度：沿用原本座標數最多 15 筆滿格 */
function getCoordinateProgress(count) {
  if (count <= 0) {
    return 0;
  }

  if (count >= 15) {
    return 100;
  }

  return Math.round((count / 15) * 100);
}

function getDexIcon(name, type) {
  var text = String(name || "");

  if (text.indexOf("台北") !== -1) return "🌆";
  if (text.indexOf("新北") !== -1) return "🌉";
  if (text.indexOf("桃園") !== -1) return "✈️";
  if (text.indexOf("新竹") !== -1) return "🌬️";
  if (text.indexOf("苗栗") !== -1) return "🌾";
  if (text.indexOf("台中") !== -1) return "🌇";
  if (text.indexOf("彰化") !== -1) return "🚲";
  if (text.indexOf("南投") !== -1) return "⛰️";
  if (text.indexOf("雲林") !== -1) return "🌽";
  if (text.indexOf("嘉義") !== -1) return "🌲";
  if (text.indexOf("台南") !== -1) return "🏯";
  if (text.indexOf("高雄") !== -1) return "🌊";
  if (text.indexOf("屏東") !== -1) return "🌴";
  if (text.indexOf("宜蘭") !== -1) return "🌧️";
  if (text.indexOf("花蓮") !== -1) return "🏞️";
  if (text.indexOf("台東") !== -1) return "🌅";
  if (text.indexOf("澎湖") !== -1) return "🏝️";
  if (text.indexOf("金門") !== -1) return "🛡️";
  if (text.indexOf("連江") !== -1) return "🚢";

  if (text.indexOf("區") !== -1) return "📍";
  if (text.indexOf("鄉") !== -1) return "🌿";
  if (text.indexOf("鎮") !== -1) return "🏘️";
  if (text.indexOf("市") !== -1) return "🏙️";

  if (type === "district") {
    return "📌";
  }

  return "🌼";
}
