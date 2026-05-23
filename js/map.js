var overviewMap = null;
var overviewMarkerLayer = null;

function getMapFallbackView() {
  var country = getMapCountryValue();

  if (country === "日本") return { center: [36.2, 138.2], zoom: 5 };
  if (country === "韓國") return { center: [36.4, 127.8], zoom: 7 };
  if (country === "香港") return { center: [22.32, 114.17], zoom: 11 };

  return { center: [23.7, 121], zoom: 7 };
}

function getMapCountryValue() {
  var select = document.getElementById("mapCountryFilter");
  return normalizeCountryValue(select ? select.value : "台灣");
}

function getMapCityValue() {
  var select = document.getElementById("mapCityFilter");
  return select ? select.value : "全部縣市";
}

function getMapDistrictValue() {
  var select = document.getElementById("mapDistrictFilter");
  return select ? select.value : "全部區域";
}

function initializeMapSelectors() {
  updateMapCityOptions();
}

function syncMapCountryFromView() {
  var viewCountry = getSelectedViewCountry();
  var mapCountrySelect = document.getElementById("mapCountryFilter");

  if (mapCountrySelect) {
    mapCountrySelect.value = viewCountry;
  }

  updateMapCityOptions();
}

function updateMapCityOptions() {
  var country = getMapCountryValue();
  var citySelect = document.getElementById("mapCityFilter");

  if (!citySelect) {
    return;
  }

  var cities = getMapCitiesByCountry(country);
  var label = country === "台灣" ? "全部縣市" : "全部地區";
  var html = '<option value="全部縣市">' + label + '</option>';

  for (var i = 0; i < cities.length; i++) {
    html += '<option value="' + escapeHTML(cities[i]) + '">' + escapeHTML(shortRegionName(cities[i])) + '</option>';
  }

  citySelect.innerHTML = html;
  citySelect.value = "全部縣市";

  updateMapDistrictOptions();
}

function updateMapDistrictOptions() {
  var country = getMapCountryValue();
  var city = getMapCityValue();
  var districtSelect = document.getElementById("mapDistrictFilter");

  if (!districtSelect) {
    return;
  }

  var districts = getMapDistricts(country, city);
  var html = '<option value="全部區域">全部區域</option>';

  for (var i = 0; i < districts.length; i++) {
    html += '<option value="' + escapeHTML(districts[i]) + '">' + escapeHTML(districts[i]) + '</option>';
  }

  districtSelect.innerHTML = html;
  districtSelect.value = "全部區域";

  renderMapOverview();
}

function getMapCitiesByCountry(country) {
  return getRegionsForCountry(country);
}

function getMapDistricts(country, city) {
  if (city === "全部縣市") {
    return [];
  }

  if (country === "台灣") {
    return getDistrictsForTaiwanCity(city);
  }

  return [];
}

function getVisiblePointsForMap() {
  var country = getMapCountryValue();
  var city = getMapCityValue();
  var district = getMapDistrictValue();
  var visiblePoints = [];

  for (var i = 0; i < points.length; i++) {
    var p = points[i];

    if (getPointCountry(p) !== country) {
      continue;
    }

    if (city !== "全部縣市" && p.category !== city) {
      continue;
    }

    if (country === "台灣" && district !== "全部區域" && getPointDistrict(p) !== district) {
      continue;
    }

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

function ensureOverviewMap() {
  var mapBox = document.getElementById("overviewMap");

  if (!mapBox || typeof L === "undefined") {
    return null;
  }

  if (!overviewMap) {
    overviewMap = L.map("overviewMap", {
      zoomControl: true,
      scrollWheelZoom: true
    });

    var initialView = getMapFallbackView();
    overviewMap.setView(initialView.center, initialView.zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(overviewMap);

    overviewMarkerLayer = L.layerGroup().addTo(overviewMap);
  }

  return overviewMap;
}

function renderMapOverview() {
  var summary = document.getElementById("mapSummary");
  var empty = document.getElementById("mapEmpty");
  var country = getMapCountryValue();
  var visiblePoints = getVisiblePointsForMap();
  var map = ensureOverviewMap();

  if (summary) {
    summary.innerHTML =
      "目前顯示「" + escapeHTML(country) + "」<b>" + visiblePoints.length + "</b> 個座標。點擊地圖標記可查看詳細資料。";
  }

  if (!map || !overviewMarkerLayer) {
    if (empty) {
      empty.style.display = "block";
      empty.innerHTML = "地圖元件尚未載入，請重新整理頁面後再試。";
    }
    return;
  }

  overviewMarkerLayer.clearLayers();

  if (visiblePoints.length === 0) {
    if (empty) {
      empty.style.display = "block";
      empty.innerHTML = "目前篩選條件下沒有可顯示的座標 🌱";
    }

    var emptyView = getMapFallbackView();
    map.setView(emptyView.center, emptyView.zoom);

    setTimeout(function() {
      map.invalidateSize();
    }, 160);

    return;
  }

  if (empty) {
    empty.style.display = "none";
    empty.innerHTML = "";
  }

  var bounds = [];

  for (var i = 0; i < visiblePoints.length; i++) {
    var p = visiblePoints[i];
    var lat = Number(p.y);
    var lon = Number(p.x);
    var googleUrl = "https://www.google.com/maps?q=" + encodeURIComponent(lat + "," + lon);

    var popup = "";
    popup += '<div class="map-popup">';
    popup += '<div class="map-popup-title">🌼 ' + escapeHTML(p.name || "未命名巨大花朵") + '</div>';
    popup += '<div class="map-popup-row">國家：' + escapeHTML(getPointCountry(p)) + '</div>';
    popup += '<div class="map-popup-row">地區：' + escapeHTML(p.category || "未分類") + '</div>';
    popup += '<div class="map-popup-row">區域：' + escapeHTML(getPointDistrict(p)) + '</div>';
    popup += '<div class="map-popup-row">座標：' + escapeHTML(lat) + ', ' + escapeHTML(lon) + '</div>';

    if (p.note) {
      popup += '<div class="map-popup-note">備註：' + escapeHTML(p.note) + '</div>';
    }

    popup += '<a class="map-popup-link" href="' + googleUrl + '" target="_blank" rel="noopener noreferrer">用 Google Maps 開啟</a>';
    popup += '</div>';

    L.marker([lat, lon]).bindPopup(popup).addTo(overviewMarkerLayer);
    bounds.push([lat, lon]);
  }

  if (bounds.length === 1) {
    map.setView(bounds[0], 16);
  } else {
    map.fitBounds(bounds, {
      padding: [28, 28]
    });
  }

  setTimeout(function() {
    map.invalidateSize();
  }, 160);
}
