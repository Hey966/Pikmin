function getRecordFormCountry() {
  var countrySelect = document.getElementById("country");
  return normalizeCountryValue(countrySelect ? countrySelect.value : "台灣");
}

function setRecordFormCountry(country) {
  var countrySelect = document.getElementById("country");
  if (countrySelect) countrySelect.value = normalizeCountryValue(country || "台灣");
}

function addPoint() {
  parseCoordinate(false);

  var x = document.getElementById("x").value;
  var y = document.getElementById("y").value;
  var country = getRecordFormCountry();
  var area = document.getElementById("area").value;
  var name = document.getElementById("name").value;
  var category = document.getElementById("category").value;
  var note = document.getElementById("note").value;

  if (x === "" || y === "") {
    alert("請先輸入座標");
    return;
  }

  if (isNaN(Number(x)) || isNaN(Number(y))) {
    alert("座標只能輸入數字");
    return;
  }

  if (area === "") {
    alert("請輸入區域，或先按「分析地址與區域」。");
    return;
  }

  var key = makeKey(y, x);

  for (var i = 0; i < points.length; i++) {
    if (String(editingId) !== String(points[i].id) && makeKey(points[i].y, points[i].x) === key) {
      alert(
        "這個座標已經存在，不能重複新增。\n\n" +
        "已存在資料：" + points[i].name + "\n" +
        "國家：" + getPointCountry(points[i]) + "\n" +
        "地區：" + points[i].category + "\n" +
        "區域：" + points[i].area
      );
      return;
    }
  }

  if (editingId !== null) {
    updatePoint(x, y, country, area, name, category, note);
  } else {
    createPoint(x, y, country, area, name, category, note);
  }
}

function createPoint(x, y, country, area, name, category, note) {
  var point = {
    id: new Date().getTime(),
    x: x,
    y: y,
    area: area,
    name: name || "未命名巨大花朵",
    category: category,
    country: normalizeCountryValue(country),
    district: resolveDistrictForSave(area, category),
    favorite: false,
    note: note,
    createdAt: new Date().toLocaleString()
  };

  points.unshift(point);
  savePoints();
  renderList();
  refreshRouteListIfReady();
  resetForm();

  alert("新增成功！");
}

function updatePoint(x, y, country, area, name, category, note) {
  for (var i = 0; i < points.length; i++) {
    if (String(points[i].id) === String(editingId)) {
      points[i].x = x;
      points[i].y = y;
      points[i].area = area;
      points[i].name = name || "未命名巨大花朵";
      points[i].category = category;
      points[i].country = normalizeCountryValue(country);
      points[i].district = resolveDistrictForSave(area, category);
      points[i].note = note;
      points[i].updatedAt = new Date().toLocaleString();
      break;
    }
  }

  savePoints();
  renderList();
  refreshRouteListIfReady();
  resetForm();

  alert("更新成功！");
}

function editPoint(id) {
  var point = null;

  for (var i = 0; i < points.length; i++) {
    if (String(points[i].id) === String(id)) {
      point = points[i];
      break;
    }
  }

  if (!point) {
    alert("找不到這筆資料");
    return;
  }

  editingId = point.id;

  document.getElementById("coordinateText").value = point.y + ", " + point.x;
  document.getElementById("x").value = point.x;
  document.getElementById("y").value = point.y;
  setRecordFormCountry(getPointCountry(point));
  document.getElementById("area").value = point.area;
  document.getElementById("name").value = point.name;
  document.getElementById("category").value = point.category || "未分類";
  document.getElementById("note").value = point.note || "";

  document.getElementById("addBtn").innerHTML = "✅ 更新紀錄";

  showStatus("目前正在編輯：「" + point.name + "」");
  showPage("add");
}

function resetForm() {
  editingId = null;

  document.getElementById("coordinateText").value = "";
  document.getElementById("x").value = "";
  document.getElementById("y").value = "";
  setRecordFormCountry("台灣");
  document.getElementById("area").value = "";
  document.getElementById("name").value = "";
  document.getElementById("category").value = "未分類";
  document.getElementById("note").value = "";
  document.getElementById("addBtn").innerHTML = "🌼 新增到紀錄";

  showStatus("已重新輸入，表單已清空。");
}

function buildPointItemHTML(p) {
  var html = "";
  var favorite = isPointFavorite(p);

  html += '<div class="item">';
  html += '<div class="item-title">';
  html += '<span>🌼 ' + escapeHTML(p.name) + (favorite ? ' <em class="favorite-inline">★</em>' : '') + '</span>';
  html += '<span class="tag">' + escapeHTML(p.category) + '</span>';
  html += '</div>';

  html += '<div><span class="area">' + escapeHTML(p.area) + '</span></div>';
  html += '<div class="meta">國家：' + escapeHTML(getPointCountry(p)) + '</div>';
  html += '<div class="meta"><b>座標：</b>' + escapeHTML(p.y) + ', ' + escapeHTML(p.x) + '</div>';
  html += '<div class="meta">緯度 Latitude：' + escapeHTML(p.y) + ' ｜ 經度 Longitude：' + escapeHTML(p.x) + '</div>';
  html += '<div class="meta">備註：' + escapeHTML(p.note || "無") + '</div>';
  html += '<div class="meta">建立時間：' + escapeHTML(p.createdAt) + '</div>';

  if (p.updatedAt) {
    html += '<div class="meta">更新時間：' + escapeHTML(p.updatedAt) + '</div>';
  }

  html += '<button class="small-btn favorite-btn' + (favorite ? ' active' : '') + '" type="button" onclick="toggleFavorite(' + p.id + ')">' + (favorite ? '★ 已收藏' : '☆ 收藏') + '</button>';
  html += '<button class="small-btn blue" type="button" onclick="editPoint(' + p.id + ')">編輯</button>';
  html += '<button class="small-btn secondary" type="button" onclick="copyCoordinate(' + p.id + ')">複製座標</button>';
  html += '<button class="small-btn map-open-btn" type="button" onclick="openPointInGoogleMaps(' + p.id + ')">開啟 Google Maps</button>';
  html += '<button class="small-btn danger" type="button" onclick="deletePoint(' + p.id + ')">刪除</button>';
  html += '</div>';

  return html;
}

function isPointFavorite(point) {
  return !!(point && point.favorite);
}

function toggleFavorite(id) {
  var changed = false;

  for (var i = 0; i < points.length; i++) {
    if (String(points[i].id) === String(id)) {
      points[i].favorite = !isPointFavorite(points[i]);
      changed = true;
      break;
    }
  }

  if (!changed) {
    return;
  }

  savePoints();
  renderList();

  if (typeof renderStatsPage === "function") {
    renderStatsPage();
  }
}

function deletePoint(id) {
  if (!confirm("確定要刪除嗎？")) {
    return;
  }

  var newPoints = [];

  for (var i = 0; i < points.length; i++) {
    if (String(points[i].id) !== String(id)) {
      newPoints.push(points[i]);
    }
  }

  points = newPoints;
  savePoints();
  renderList();
  refreshRouteListIfReady();

  if (String(editingId) === String(id)) {
    resetForm();
  }
}

async function reclassifyUncategorizedDistricts() {
  if (points.length === 0) {
    alert("目前沒有座標資料可以整理。");
    return;
  }

  var candidates = [];

  for (var i = 0; i < points.length; i++) {
    var point = points[i];
    var currentDistrict = point.district || "未分類區域";

    if (currentDistrict === "未分類區域") {
      candidates.push(point);
    }
  }

  if (candidates.length === 0) {
    alert("目前沒有需要重新分析的未分類區域。");
    return;
  }

  if (!confirm(
    "將用座標重新分析 " + candidates.length + " 筆未分類資料。\n\n" +
    "這會逐筆查詢地址，可能需要一些時間。"
  )) {
    return;
  }

  var button = document.getElementById("reclassifyDistrictBtn");
  var originalButtonText = button ? button.innerHTML : "";
  var updated = 0;
  var updatedRegion = 0;
  var stillUnclassified = 0;
  var failed = 0;

  if (button) {
    button.disabled = true;
    button.innerHTML = "🛰️ 準備重新分析……";
  }

  try {
    for (var j = 0; j < candidates.length; j++) {
      var targetPoint = candidates[j];

      if (button) {
        button.innerHTML = "🛰️ 分析中 " + (j + 1) + " / " + candidates.length;
      }

      if (typeof reverseGeocodePointForDistrict !== "function") {
        failed = candidates.length;
        break;
      }

      var result = await reverseGeocodePointForDistrict(targetPoint);

      if (result && result.ok && result.district) {
        targetPoint.district = result.district;
        targetPoint.updatedAt = new Date().toLocaleString();
        updated++;

        var currentCategory = targetPoint.category || "";

        if (
          result.region &&
          (
            currentCategory === "" ||
            currentCategory === "未分類" ||
            currentCategory === "其他"
          )
        ) {
          targetPoint.category = result.region;
          updatedRegion++;
        }
      } else {
        if (result && (
          result.reason === "network-error" ||
          result.reason === "http-error" ||
          result.reason === "parse-error"
        )) {
          failed++;
        } else {
          stillUnclassified++;
        }
      }

      if (j < candidates.length - 1 && typeof waitBeforeNextReverseGeocode === "function") {
        await waitBeforeNextReverseGeocode(1100);
      }
    }

    if (updated > 0 || updatedRegion > 0) {
      savePoints();
      renderList();

      if (typeof refreshRouteListIfReady === "function") {
        refreshRouteListIfReady();
      }

      if (typeof renderStatsPage === "function") {
        renderStatsPage();
      }
    }

    alert(
      "重新分析完成！\n\n" +
      "檢查未分類資料：" + candidates.length + " 筆\n" +
      "成功補回正確區域：" + updated + " 筆\n" +
      "同步補回縣市分類：" + updatedRegion + " 筆\n" +
      "仍無法判斷：" + stillUnclassified + " 筆\n" +
      "查詢失敗：" + failed + " 筆"
    );
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = originalButtonText || "🛰️ 重新分析未分類區域";
    }
  }
}

function clearAll() {
  if (!confirm("確定要清空全部座標資料與路線方案嗎？")) {
    return;
  }

  points = [];
  selectedViewRegion = null;
  selectedViewDistrict = null;
  savePoints();

  if (typeof ROUTE_PLAN_STORAGE_KEY !== "undefined") {
    localStorage.removeItem(ROUTE_PLAN_STORAGE_KEY);
  }

  if (typeof savedRoutePlans !== "undefined") {
    savedRoutePlans = [];
  }

  if (typeof renderSavedRoutePlanOptions === "function") {
    renderSavedRoutePlanOptions();
  }

  if (typeof clearRoutePlanStatus === "function") {
    clearRoutePlanStatus();
  }

  if (typeof resetGeneratedRoute === "function") {
    resetGeneratedRoute();
  }

  if (typeof resetRouteManualOrder === "function") {
    resetRouteManualOrder();
  }

  renderList();
  refreshRouteListIfReady();
  resetForm();

  if (typeof renderStatsPage === "function") {
    renderStatsPage();
  }

  alert("已清空全部座標資料與路線方案。");
}

function copyCoordinate(id) {
  var text = "";

  for (var i = 0; i < points.length; i++) {
    if (String(points[i].id) === String(id)) {
      text = points[i].y + ", " + points[i].x;
      break;
    }
  }

  if (text === "") {
    return;
  }

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  }

  alert("座標：" + text);
}

function openPointInGoogleMaps(id) {
  var point = null;

  for (var i = 0; i < points.length; i++) {
    if (String(points[i].id) === String(id)) {
      point = points[i];
      break;
    }
  }

  if (!point) {
    alert("找不到這筆座標。");
    return;
  }

  var url = "https://www.google.com/maps?q=" + encodeURIComponent(point.y + "," + point.x);
  var opened = window.open(url, "_blank");

  if (!opened) {
    window.location.href = url;
  }
}

function refreshRouteListIfReady() {
  if (typeof savePoints === "function") {
    savePoints();
  }

  if (typeof renderList === "function") {
    renderList();
  }

  if (typeof resetGeneratedRoute === "function") {
    resetGeneratedRoute();
  }

  if (typeof resetRouteManualOrder === "function") {
    resetRouteManualOrder();
  }

  if (typeof renderRoutePointList === "function") {
    renderRoutePointList();
    setTimeout(renderRoutePointList, 50);
    setTimeout(renderRoutePointList, 200);
  }

  if (typeof renderStatsPage === "function") {
    renderStatsPage();
  }
}
