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

  var regionMap = {};
  var districtMap = {};
  var taiwanPoints = [];
  var favoriteCount = 0;

  for (var i = 0; i < points.length; i++) {
    var p = points[i];

    if (getPointCountry(p) !== "台灣") {
      continue;
    }

    taiwanPoints.push(p);

    if (isPointFavorite(p)) {
      favoriteCount++;
    }

    var region = p.category || "未分類";
    var district = region + "::" + (getPointDistrict(p) || "未分類區域");

    regionMap[region] = true;
    districtMap[district] = true;
  }

  var regions = countObjectKeys(regionMap);
  var districts = countObjectKeys(districtMap);
  var routePlanCount = typeof savedRoutePlans !== "undefined" ? savedRoutePlans.length : 0;

  var cards = [
    { icon: "🌼", title: "總座標數", value: taiwanPoints.length },
    { icon: "🏙️", title: "有資料縣市", value: regions },
    { icon: "📍", title: "有資料區域", value: districts },
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

  summaryGrid.innerHTML = html;

  renderLatestPoints(latestBox, taiwanPoints);
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
    html += '<div class="stats-latest-meta">' + escapeHTML(p.area || "未填寫區域") + '</div>';
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
