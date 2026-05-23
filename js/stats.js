function renderStatsPage() {
  var summaryGrid = document.getElementById("statsSummaryGrid");
  var latestBox = document.getElementById("statsLatestPoints");

  if (!summaryGrid || !latestBox) {
    return;
  }

  if (typeof loadPoints === "function") {
    loadPoints();
  }

  if (typeof loadSavedRoutePlans === "function") {
    loadSavedRoutePlans();
  }

  var countryMap = {};
  var regionMap = {};
  var districtMap = {};
  var favoriteCount = 0;

  for (var i = 0; i < points.length; i++) {
    var p = points[i];
    var country = getPointCountry(p) || "其他";
    var region = p.category || "未分類";
    var district = country + "::" + region + "::" + (getPointDistrict(p) || "未分類區域");

    countryMap[country] = true;
    regionMap[country + "::" + region] = true;

    if (country === "台灣") {
      districtMap[district] = true;
    }

    if (isPointFavorite(p)) {
      favoriteCount++;
    }
  }

  var countries = countObjectKeys(countryMap);
  var regions = countObjectKeys(regionMap);
  var taiwanDistricts = countObjectKeys(districtMap);
  var routePlanCount = typeof savedRoutePlans !== "undefined" ? savedRoutePlans.length : 0;

  var cards = [
    { icon: "🌼", title: "總座標數", value: points.length },
    { icon: "🌍", title: "有資料國家", value: countries },
    { icon: "🏙️", title: "有資料地區", value: regions },
    { icon: "📍", title: "台灣有資料區域", value: taiwanDistricts },
    { icon: "⭐", title: "收藏座標", value: favoriteCount },
    { icon: "💾", title: "路線方案", value: routePlanCount }
  ];

  var html = "";

  for (var j = 0; j < cards.length; j++) {
    html += '<article class="stats-card">';
    html += '<span class="stats-card-icon">' + cards[j].icon + '</span>';
    html += '<b>' + escapeHTML(cards[j].value) + '</b>';
    html += '<small>' + escapeHTML(cards[j].title) + '</small>';
    html += '</article>';
  }

  html += buildCountryStatsSection();

  summaryGrid.innerHTML = html;

  renderLatestPoints(latestBox, points);
}

function buildCountryStatsSection() {
  var countryCounts = {};
  var countryRegions = {};
  var countryOrder = [];

  for (var i = 0; i < points.length; i++) {
    var p = points[i];
    var country = getPointCountry(p) || "其他";
    var region = p.category || "未分類";

    if (!countryCounts[country]) {
      countryCounts[country] = 0;
      countryRegions[country] = {};
      countryOrder.push(country);
    }

    countryCounts[country]++;
    countryRegions[country][region] = true;
  }

  if (countryOrder.length === 0) {
    return "";
  }

  countryOrder.sort();

  var html = '<section class="stats-country-breakdown">';
  html += '<h3>🌍 各國座標統計</h3>';
  html += '<div class="stats-country-list">';

  for (var j = 0; j < countryOrder.length; j++) {
    var countryName = countryOrder[j];
    html += '<article class="stats-country-item">';
    html += '<b>' + escapeHTML(countryName) + '</b>';
    html += '<span>' + countryCounts[countryName] + ' 筆座標</span>';
    html += '<small>' + countObjectKeys(countryRegions[countryName]) + ' 個地區</small>';
    html += '</article>';
  }

  html += '</div>';
  html += '</section>';

  return html;
}

function renderLatestPoints(container, sourcePoints) {
  if (!container) {
    return;
  }

  var usablePoints = sourcePoints || [];

  if (usablePoints.length === 0) {
    container.innerHTML = '<div class="empty">目前還沒有新增任何座標 🌱</div>';
    return;
  }

  var latest = usablePoints.slice(0, 5);
  var html = '<div class="stats-latest-list">';

  for (var i = 0; i < latest.length; i++) {
    var p = latest[i];

    html += '<article class="stats-latest-item">';
    html += '<div class="stats-latest-title">🌼 ' + escapeHTML(p.name || "未命名巨大花朵") + '</div>';
    html += '<div class="stats-latest-meta">' + escapeHTML(getPointCountry(p)) + '｜' + escapeHTML(p.area || "未填寫區域") + '</div>';
    html += '<div class="stats-latest-meta">' + escapeHTML(p.y) + ', ' + escapeHTML(p.x) + '</div>';
    html += '</article>';
  }

  html += '</div>';
  container.innerHTML = html;
}

function countObjectKeys(obj) {
  var count = 0;

  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      count++;
    }
  }

  return count;
}
