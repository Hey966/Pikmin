var generatedRoute = null;
var OSRM_PROFILE = "driving";
var routeManualOrder = [];

function getRouteCountryValue() {
  return "台灣";
}

function getRouteCityValue() {
  var select = document.getElementById("routeCityFilter");
  return select ? select.value : "全部縣市";
}

function getRouteDistrictValue() {
  var select = document.getElementById("routeDistrictFilter");
  return select ? select.value : "全部區域";
}

function resetGeneratedRoute() {
  generatedRoute = null;

  var box = document.getElementById("routeResult");

  if (box) {
    box.style.display = "none";
    box.innerHTML = "";
  }
}

function resetRouteManualOrder() {
  routeManualOrder = [];
}

function setRouteManualOrder(ids) {
  routeManualOrder = [];

  if (!ids || !isArray(ids)) {
    return;
  }

  for (var i = 0; i < ids.length; i++) {
    routeManualOrder.push(String(ids[i]));
  }
}

function initializeRouteSelectors() {
  updateRouteCityOptions();
}

function updateRouteCityOptions() {
  var country = getRouteCountryValue();
  var citySelect = document.getElementById("routeCityFilter");

  if (!citySelect) return;

  var cities = getRouteCitiesByCountry(country);
  var html = '<option value="全部縣市">全部縣市</option>';

  for (var i = 0; i < cities.length; i++) {
    html += '<option value="' + escapeHTML(cities[i]) + '">' + escapeHTML(cities[i]) + '</option>';
  }

  citySelect.innerHTML = html;
  citySelect.value = "全部縣市";

  resetRouteManualOrder();
  updateRouteDistrictOptions();
  resetGeneratedRoute();
  renderRoutePointList();
}

function updateRouteDistrictOptions() {
  var country = getRouteCountryValue();
  var city = getRouteCityValue();
  var districtSelect = document.getElementById("routeDistrictFilter");

  if (!districtSelect) return;

  var districts = getRouteDistricts(country, city);
  var html = '<option value="全部區域">全部區域</option>';

  for (var i = 0; i < districts.length; i++) {
    html += '<option value="' + escapeHTML(districts[i]) + '">' + escapeHTML(districts[i]) + '</option>';
  }

  districtSelect.innerHTML = html;
  districtSelect.value = "全部區域";

  resetRouteManualOrder();
  resetGeneratedRoute();
  renderRoutePointList();
}

function getRouteCitiesByCountry(country) {
  return TAIWAN_REGIONS;
}

function getRouteDistricts(country, city) {
  if (city === "全部縣市") return [];
  return getDistrictsForTaiwanCity(city);
}

function getVisiblePointsForRoute() {
  var city = getRouteCityValue();
  var district = getRouteDistrictValue();
  var visiblePoints = [];

  for (var i = 0; i < points.length; i++) {
    var p = points[i];

    if (getPointCountry(p) !== "台灣") continue;
    if (city !== "全部縣市" && p.category !== city) continue;
    if (district !== "全部區域" && getPointDistrict(p) !== district) continue;

    if (
      p.x !== undefined &&
      p.y !== undefined &&
      !isNaN(Number(p.x)) &&
      !isNaN(Number(p.y))
    ) {
      visiblePoints.push(p);
    }
  }

  return visiblePoints;
}

function getOrderedVisibleRoutePoints() {
  var routePoints = getVisiblePointsForRoute();
  var autoSorted = sortPointsByNearest(routePoints);

  if (!routeManualOrder || routeManualOrder.length === 0) {
    return autoSorted;
  }

  var pointMap = {};
  var ordered = [];

  for (var i = 0; i < autoSorted.length; i++) {
    pointMap[String(autoSorted[i].id)] = autoSorted[i];
  }

  for (var j = 0; j < routeManualOrder.length; j++) {
    var orderedId = String(routeManualOrder[j]);

    if (pointMap[orderedId]) {
      ordered.push(pointMap[orderedId]);
      delete pointMap[orderedId];
    }
  }

  for (var k = 0; k < autoSorted.length; k++) {
    var remainingId = String(autoSorted[k].id);

    if (pointMap[remainingId]) {
      ordered.push(autoSorted[k]);
      delete pointMap[remainingId];
    }
  }

  return ordered;
}

function getSelectedPointsForRoute() {
  var orderedPoints = getOrderedVisibleRoutePoints();
  var checkedMap = {};
  var checkedBoxes = document.querySelectorAll(".route-point-checkbox:checked");
  var selectedPoints = [];

  for (var i = 0; i < checkedBoxes.length; i++) {
    checkedMap[String(checkedBoxes[i].getAttribute("data-id"))] = true;
  }

  for (var j = 0; j < orderedPoints.length; j++) {
    if (checkedMap[String(orderedPoints[j].id)]) {
      selectedPoints.push(orderedPoints[j]);
    }
  }

  return selectedPoints;
}

function captureRouteCheckboxState() {
  var state = {};
  var boxes = document.querySelectorAll(".route-point-checkbox");

  for (var i = 0; i < boxes.length; i++) {
    state[String(boxes[i].getAttribute("data-id"))] = !!boxes[i].checked;
  }

  return state;
}

function applyRouteCheckboxState(state) {
  if (!state) return;

  var boxes = document.querySelectorAll(".route-point-checkbox");

  for (var i = 0; i < boxes.length; i++) {
    var id = String(boxes[i].getAttribute("data-id"));

    if (Object.prototype.hasOwnProperty.call(state, id)) {
      boxes[i].checked = !!state[id];
    }
  }
}

function selectAllRoutePoints(checked) {
  var boxes = document.querySelectorAll(".route-point-checkbox");

  for (var i = 0; i < boxes.length; i++) {
    boxes[i].checked = checked;
  }

  resetGeneratedRoute();
}

function moveRoutePointById(id, direction) {
  var checkboxState = captureRouteCheckboxState();
  var orderedPoints = getOrderedVisibleRoutePoints();
  var ids = [];

  for (var i = 0; i < orderedPoints.length; i++) {
    ids.push(String(orderedPoints[i].id));
  }

  var currentIndex = ids.indexOf(String(id));

  if (currentIndex === -1) return;

  var nextIndex = currentIndex + direction;

  if (nextIndex < 0 || nextIndex >= ids.length) return;

  var temp = ids[currentIndex];
  ids[currentIndex] = ids[nextIndex];
  ids[nextIndex] = temp;

  routeManualOrder = ids;
  resetGeneratedRoute();
  renderRoutePointList();
  applyRouteCheckboxState(checkboxState);
}

function restoreNearestRouteOrder() {
  var checkboxState = captureRouteCheckboxState();
  resetRouteManualOrder();
  resetGeneratedRoute();
  renderRoutePointList();
  applyRouteCheckboxState(checkboxState);
}

function renderRoutePointList() {
  var list = document.getElementById("routePointList");

  if (!list) return;

  var routePoints = getOrderedVisibleRoutePoints();

  if (routePoints.length === 0) {
    list.innerHTML =
      '<div class="empty">' +
      '目前篩選條件下沒有可用於路線規劃的座標 🌱' +
      '</div>';
    return;
  }

  var html = "";

  html += '<div class="route-summary route-order-summary">';
  html += '目前符合條件：' + routePoints.length + ' 個座標<br>';
  html += '路線會依下方「由上到下」的順序產生，可用 ↑ ↓ 調整。';
  html += '</div>';

  html += '<div class="route-order-toolbar">';
  html += '<button class="small-btn blue" type="button" onclick="selectAllRoutePoints(true)">全選</button>';
  html += '<button class="small-btn secondary" type="button" onclick="selectAllRoutePoints(false)">全部取消</button>';
  html += '<button class="small-btn secondary" type="button" onclick="restoreNearestRouteOrder()">恢復自動排序</button>';
  html += '</div>';

  html += '<ol class="route-list route-order-list">';

  for (var i = 0; i < routePoints.length; i++) {
    var p = routePoints[i];
    var safeId = escapeHTML(String(p.id));

    html += '<li class="route-order-item">';
    html += '<div class="route-order-row">';

    html += '<label class="route-order-label">';
    html += '<input ';
    html += 'type="checkbox" ';
    html += 'class="route-point-checkbox" ';
    html += 'data-id="' + safeId + '" ';
    html += 'checked ';
    html += 'onchange="resetGeneratedRoute()" ';
    html += 'style="width:auto; margin-top:4px;">';

    html += '<span class="route-order-copy">';
    html += '<b>' + escapeHTML(p.name || "未命名巨大花朵") + '</b>';
    html += '<span>' + escapeHTML(p.category || "未分類") + '</span>';
    html += '<small>' + escapeHTML(getPointDistrict(p)) + '｜' + escapeHTML(p.y) + ', ' + escapeHTML(p.x) + '</small>';
    html += '</span>';
    html += '</label>';

    html += '<div class="route-order-controls">';
    html += '<button class="route-order-btn" type="button" onclick="moveRoutePointById(\'' + safeId + '\', -1)" aria-label="上移">↑</button>';
    html += '<button class="route-order-btn" type="button" onclick="moveRoutePointById(\'' + safeId + '\', 1)" aria-label="下移">↓</button>';
    html += '</div>';

    html += '</div>';
    html += '</li>';
  }

  html += '</ol>';

  list.innerHTML = html;
}

function openAutoRoute() {
  var routePoints = getSelectedPointsForRoute();

  if (routePoints.length < 2) {
    alert("至少需要勾選 2 個座標才能產生道路路線。");
    return;
  }

  if (routePoints.length > 20) {
    if (!confirm(
      "目前勾選了 " + routePoints.length + " 個座標。\n\n" +
      "座標太多時路線服務可能會失敗。\n" +
      "建議勾選 20 個以內。\n\n" +
      "仍然要繼續嗎？"
    )) {
      return;
    }
  }

  requestRoadRoute(routePoints);
}

function requestRoadRoute(orderedPoints) {
  generatedRoute = null;
  renderRouteLoading();

  var coordinateText = "";

  for (var i = 0; i < orderedPoints.length; i++) {
    if (i > 0) coordinateText += ";";
    coordinateText += Number(orderedPoints[i].x) + "," + Number(orderedPoints[i].y);
  }

  var url =
    "https://router.project-osrm.org/route/v1/" +
    OSRM_PROFILE +
    "/" +
    coordinateText +
    "?overview=full&geometries=geojson&steps=false";

  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);

          if (!data.routes || data.routes.length === 0) {
            showRouteError("路線服務沒有回傳可用路線。");
            return;
          }

          var route = data.routes[0];

          if (!route.geometry || !route.geometry.coordinates) {
            showRouteError("路線資料沒有完整道路座標。");
            return;
          }

          generatedRoute = {
            points: orderedPoints,
            coordinates: route.geometry.coordinates,
            distance: route.distance || 0,
            duration: route.duration || 0,
            createdAt: new Date().toLocaleString()
          };

          renderGeneratedRoute();
        } catch (error) {
          showRouteError("路線資料解析失敗。");
        }
      } else {
        showRouteError("路線服務查詢失敗，可能是網路問題或座標無法連成道路路線。");
      }
    }
  };

  xhr.onerror = function() {
    showRouteError("網路錯誤，無法產生道路路線。");
  };

  xhr.send();
}

function renderRouteLoading() {
  var box = document.getElementById("routeResult");

  if (!box) return;

  box.style.display = "block";
  box.innerHTML =
    '<div class="route-title">🧭 正在產生道路路線……</div>' +
    '<div class="route-summary">請稍等，系統正在用你勾選的座標計算沿道路的路線。</div>';
}

function showRouteError(message) {
  var box = document.getElementById("routeResult");

  generatedRoute = null;

  if (!box) {
    alert(message);
    return;
  }

  box.style.display = "block";
  box.innerHTML =
    '<div class="route-title">❌ 路線產生失敗</div>' +
    '<div class="route-summary">' + escapeHTML(message) + '</div>';

  alert(message);
}

function renderGeneratedRoute() {
  var box = document.getElementById("routeResult");

  if (!box || !generatedRoute) return;

  var distanceKm = generatedRoute.distance / 1000;
  var durationMin = generatedRoute.duration / 60;

  var html = "";

  html += '<div class="route-title">✅ 已產生道路路線</div>';
  html += '<div class="route-summary">';
  html += '已勾選路線點數：' + generatedRoute.points.length + ' 個座標<br>';
  html += '道路路徑座標數：' + generatedRoute.coordinates.length + ' 個<br>';
  html += '總距離：約 ' + distanceKm.toFixed(2) + ' 公里<br>';
  html += '預估時間：約 ' + Math.round(durationMin) + ' 分鐘<br>';
  html += '產生時間：' + escapeHTML(generatedRoute.createdAt);
  html += '</div>';

  html += buildRouteSvg(generatedRoute.coordinates);

  html += '<ol class="route-list">';

  for (var i = 0; i < generatedRoute.points.length; i++) {
    html += '<li>' +
      escapeHTML(generatedRoute.points[i].name || "未命名巨大花朵") +
      '｜' +
      escapeHTML(generatedRoute.points[i].y) +
      ', ' +
      escapeHTML(generatedRoute.points[i].x) +
      '</li>';
  }

  html += '</ol>';

  html += '<button class="small-btn blue" type="button" onclick="openGeneratedRouteInGoogleMaps()">用 Google 地圖開啟</button>';

  html += '<div class="route-note">';
  html += 'GPX 會使用這次產生的道路密集座標點，不是單純把幾個座標直線連起來。';
  html += '</div>';

  box.style.display = "block";
  box.innerHTML = html;
}

function buildRouteSvg(coordinates) {
  if (!coordinates || coordinates.length === 0) return "";

  var minLon = Number(coordinates[0][0]);
  var maxLon = Number(coordinates[0][0]);
  var minLat = Number(coordinates[0][1]);
  var maxLat = Number(coordinates[0][1]);

  for (var i = 1; i < coordinates.length; i++) {
    var lon = Number(coordinates[i][0]);
    var lat = Number(coordinates[i][1]);

    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  var width = 1000;
  var height = 500;
  var padding = 35;
  var lonRange = maxLon - minLon;
  var latRange = maxLat - minLat;

  if (lonRange === 0) lonRange = 0.0001;
  if (latRange === 0) latRange = 0.0001;

  var pointsText = "";

  for (var j = 0; j < coordinates.length; j++) {
    var x = padding + ((Number(coordinates[j][0]) - minLon) / lonRange) * (width - padding * 2);
    var y = height - padding - ((Number(coordinates[j][1]) - minLat) / latRange) * (height - padding * 2);
    pointsText += x.toFixed(1) + "," + y.toFixed(1) + " ";
  }

  var startX = padding + ((Number(coordinates[0][0]) - minLon) / lonRange) * (width - padding * 2);
  var startY = height - padding - ((Number(coordinates[0][1]) - minLat) / latRange) * (height - padding * 2);

  var last = coordinates[coordinates.length - 1];
  var endX = padding + ((Number(last[0]) - minLon) / lonRange) * (width - padding * 2);
  var endY = height - padding - ((Number(last[1]) - minLat) / latRange) * (height - padding * 2);

  var svg = "";
  svg += '<svg class="route-svg" viewBox="0 0 ' + width + ' ' + height + '" aria-label="路線預覽">';
  svg += '<polyline points="' + pointsText + '" fill="none" stroke="#2563eb" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"></polyline>';
  svg += '<circle cx="' + startX.toFixed(1) + '" cy="' + startY.toFixed(1) + '" r="18" fill="#22c55e"></circle>';
  svg += '<circle cx="' + endX.toFixed(1) + '" cy="' + endY.toFixed(1) + '" r="18" fill="#ef4444"></circle>';
  svg += '<text x="' + (startX + 24).toFixed(1) + '" y="' + (startY + 8).toFixed(1) + '" font-size="32" fill="#166534">起點</text>';
  svg += '<text x="' + (endX + 24).toFixed(1) + '" y="' + (endY + 8).toFixed(1) + '" font-size="32" fill="#991b1b">終點</text>';
  svg += '</svg>';

  return svg;
}

function openGeneratedRouteInGoogleMaps() {
  if (!generatedRoute || !generatedRoute.points || generatedRoute.points.length < 2) {
    alert("請先產生道路路線。");
    return;
  }

  var googleMapsUrl = buildGoogleMapsRouteUrl(generatedRoute.points);
  var opened = window.open(googleMapsUrl, "_blank");

  if (!opened) {
    window.location.href = googleMapsUrl;
  }
}

function exportGpxRoute() {
  if (!generatedRoute || !generatedRoute.coordinates || generatedRoute.coordinates.length < 2) {
    alert("請先按「產生道路路線」。GPX 會使用產生後的道路路徑。");
    return;
  }

  var gpxText = buildGpxTextFromGeneratedRoute(generatedRoute);
  var fileName = "pikmin-flower-road-route-" + getTodayText() + ".gpx";

  downloadTextFile(fileName, gpxText, "application/gpx+xml");

  alert("已匯出 GPX 路線檔：" + fileName);
}

function buildGpxTextFromGeneratedRoute(routeData) {
  var nowText = new Date().toISOString();

  var gpx = "";
  gpx += '<?xml version="1.0" encoding="UTF-8"?>\n';
  gpx += '<gpx version="1.1" creator="Pikmin Big Flower Coordinate Recorder" xmlns="http://www.topografix.com/GPX/1/1">\n';

  gpx += '  <metadata>\n';
  gpx += '    <name>皮克敏巨大花朵道路路線</name>\n';
  gpx += '    <desc>此 GPX 已將道路路線轉成密集座標點，避免匯入其他程式時變成直線。</desc>\n';
  gpx += '    <time>' + nowText + '</time>\n';
  gpx += '  </metadata>\n';

  for (var i = 0; i < routeData.points.length; i++) {
    var p = routeData.points[i];

    gpx += '  <wpt lat="' + Number(p.y) + '" lon="' + Number(p.x) + '">\n';
    gpx += '    <name>' + escapeXML((i + 1) + ". " + (p.name || "未命名巨大花朵")) + '</name>\n';
    gpx += '    <desc>' + escapeXML(joinRouteDesc(p)) + '</desc>\n';
    gpx += '  </wpt>\n';
  }

  gpx += '  <rte>\n';
  gpx += '    <name>沿道路密集路線點</name>\n';

  for (var r = 0; r < routeData.coordinates.length; r++) {
    var rc = routeData.coordinates[r];
    var rLon = Number(rc[0]);
    var rLat = Number(rc[1]);

    gpx += '    <rtept lat="' + rLat + '" lon="' + rLon + '">\n';
    gpx += '      <name>道路點 ' + (r + 1) + '</name>\n';
    gpx += '    </rtept>\n';
  }

  gpx += '  </rte>\n';

  gpx += '  <trk>\n';
  gpx += '    <name>沿道路產生的 GPX 軌跡</name>\n';
  gpx += '    <trkseg>\n';

  for (var t = 0; t < routeData.coordinates.length; t++) {
    var tc = routeData.coordinates[t];
    var tLon = Number(tc[0]);
    var tLat = Number(tc[1]);

    gpx += '      <trkpt lat="' + tLat + '" lon="' + tLon + '"></trkpt>\n';
  }

  gpx += '    </trkseg>\n';
  gpx += '  </trk>\n';

  gpx += '</gpx>\n';

  return gpx;
}

function joinRouteDesc(point) {
  var parts = [];

  if (point.area) parts.push("區域：" + point.area);
  if (point.category) parts.push("地區：" + point.category);
  if (point.note) parts.push("備註：" + point.note);

  parts.push("座標：" + point.y + ", " + point.x);

  return parts.join("；");
}

function sortPointsByNearest(inputPoints) {
  var remaining = [];
  var sorted = [];

  for (var i = 0; i < inputPoints.length; i++) {
    remaining.push(inputPoints[i]);
  }

  if (remaining.length === 0) return sorted;

  sorted.push(remaining.shift());

  while (remaining.length > 0) {
    var lastPoint = sorted[sorted.length - 1];
    var nearestIndex = 0;

    var nearestDistance = getDistance(
      Number(lastPoint.y),
      Number(lastPoint.x),
      Number(remaining[0].y),
      Number(remaining[0].x)
    );

    for (var j = 1; j < remaining.length; j++) {
      var distance = getDistance(
        Number(lastPoint.y),
        Number(lastPoint.x),
        Number(remaining[j].y),
        Number(remaining[j].x)
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = j;
      }
    }

    sorted.push(remaining[nearestIndex]);
    remaining.splice(nearestIndex, 1);
  }

  return sorted;
}

function buildGoogleMapsRouteUrl(routePoints) {
  var origin = routePoints[0].y + "," + routePoints[0].x;
  var destination = routePoints[routePoints.length - 1].y + "," + routePoints[routePoints.length - 1].x;
  var waypoints = [];

  for (var i = 1; i < routePoints.length - 1; i++) {
    waypoints.push(routePoints[i].y + "," + routePoints[i].x);
  }

  var url =
    "https://www.google.com/maps/dir/?api=1" +
    "&origin=" + encodeURIComponent(origin) +
    "&destination=" + encodeURIComponent(destination) +
    "&travelmode=walking";

  if (waypoints.length > 0) {
    url += "&waypoints=" + encodeURIComponent(waypoints.join("|"));
  }

  return url;
}

function getDistance(lat1, lon1, lat2, lon2) {
  var earthRadius = 6371;
  var dLat = toRadians(lat2 - lat1);
  var dLon = toRadians(lon2 - lon1);

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}
