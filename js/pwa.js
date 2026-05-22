var deferredInstallPrompt = null;
var appUpdateRegistration = null;

function ensureInstallStylesheet() {
  if (document.getElementById("installAppStylesheet")) {
    return;
  }

  var link = document.createElement("link");
  link.id = "installAppStylesheet";
  link.rel = "stylesheet";
  link.href = "./css/install.css?v=1.0.18";
  document.head.appendChild(link);
}

function ensureInstallAppBanner() {
  var banner = document.getElementById("installAppBanner");

  if (banner) {
    return banner;
  }

  banner = document.createElement("aside");
  banner.id = "installAppBanner";
  banner.className = "install-app-banner";
  banner.hidden = true;
  banner.innerHTML =
    '<button id="closeInstallAppBanner" class="install-app-close" type="button" aria-label="關閉安裝提示">×</button>' +
    '<div class="install-app-main">' +
    '<span class="install-app-icon">📱</span>' +
    '<div class="install-app-copy">' +
    '<b>安裝成 App</b>' +
    '<small>點一下即可叫出手機安裝介面。</small>' +
    '</div>' +
    '</div>' +
    '<button id="installAppBtn" class="install-app-action" type="button">安裝</button>';

  document.body.appendChild(banner);
  bindInstallBannerButtons();
  return banner;
}

function showInstallAppBanner() {
  ensureInstallStylesheet();
  var banner = ensureInstallAppBanner();

  if (banner) {
    banner.hidden = false;
  }
}

function hideInstallAppBanner() {
  var banner = document.getElementById("installAppBanner");

  if (banner) {
    banner.hidden = true;
  }
}

function bindInstallBannerButtons() {
  var installBtn = document.getElementById("installAppBtn");
  var closeBtn = document.getElementById("closeInstallAppBanner");

  if (closeBtn) {
    closeBtn.onclick = function() {
      hideInstallAppBanner();
    };
  }

  if (installBtn) {
    installBtn.onclick = function() {
      if (!deferredInstallPrompt) {
        hideInstallAppBanner();
        return;
      }

      deferredInstallPrompt.prompt();

      deferredInstallPrompt.userChoice.then(function() {
        deferredInstallPrompt = null;
        hideInstallAppBanner();
      });
    };
  }
}

function openDirectRoute() {
  if (typeof getSelectedPointsForRoute !== "function") {
    alert("路線功能尚未載入完成，請重新整理後再試。");
    return;
  }

  var routePoints = getSelectedPointsForRoute();

  if (routePoints.length < 2) {
    alert("至少需要勾選 2 個座標才能產生直線快速路徑。");
    return;
  }

  var coordinates = [];
  var directDistanceMeters = 0;

  for (var i = 0; i < routePoints.length; i++) {
    coordinates.push([
      Number(routePoints[i].x),
      Number(routePoints[i].y)
    ]);

    if (i > 0 && typeof getDistance === "function") {
      directDistanceMeters += getDistance(
        Number(routePoints[i - 1].y),
        Number(routePoints[i - 1].x),
        Number(routePoints[i].y),
        Number(routePoints[i].x)
      ) * 1000;
    }
  }

  generatedRoute = {
    mode: "direct",
    points: routePoints,
    coordinates: coordinates,
    distance: directDistanceMeters,
    duration: 0,
    createdAt: new Date().toLocaleString()
  };

  renderGeneratedDirectRoute();
}

function renderGeneratedDirectRoute() {
  var box = document.getElementById("routeResult");

  if (!box || !generatedRoute || generatedRoute.mode !== "direct") return;

  var distanceKm = generatedRoute.distance / 1000;
  var html = "";

  html += '<div class="route-title">✅ 已產生直線快速路徑</div>';
  html += '<div class="route-summary">';
  html += '已勾選路線點數：' + generatedRoute.points.length + ' 個座標<br>';
  html += '點對點直線節點數：' + generatedRoute.coordinates.length + ' 個<br>';
  html += '直線總距離：約 ' + distanceKm.toFixed(2) + ' 公里<br>';
  html += '產生時間：' + escapeHTML(generatedRoute.createdAt);
  html += '</div>';

  if (typeof buildRouteSvg === "function") {
    html += buildRouteSvg(generatedRoute.coordinates);
  }

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
  html += '<button class="small-btn blue" type="button" onclick="openGeneratedRouteInGoogleMaps()">用 Google 地圖依順序開啟</button>';
  html += '<div class="route-note">此模式會依勾選順序直接用點對點直線連接，速度快，但不代表實際可行走道路。需要更貼近現實步行時，請改用「產生道路路線」。</div>';

  box.style.display = "block";
  box.innerHTML = html;
}

function buildGpxTextFromDirectRoute(routeData) {
  var nowText = new Date().toISOString();
  var gpx = "";

  gpx += '<?xml version="1.0" encoding="UTF-8"?>\n';
  gpx += '<gpx version="1.1" creator="Pikmin Big Flower Coordinate Recorder" xmlns="http://www.topografix.com/GPX/1/1">\n';
  gpx += '  <metadata>\n';
  gpx += '    <name>皮克敏巨大花朵直線快速路徑</name>\n';
  gpx += '    <desc>此 GPX 依勾選順序直接以點對點直線連接，不做道路校正。</desc>\n';
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
  gpx += '    <name>點對點直線快速路徑</name>\n';

  for (var r = 0; r < routeData.coordinates.length; r++) {
    var rc = routeData.coordinates[r];
    gpx += '    <rtept lat="' + Number(rc[1]) + '" lon="' + Number(rc[0]) + '">\n';
    gpx += '      <name>直線點 ' + (r + 1) + '</name>\n';
    gpx += '    </rtept>\n';
  }

  gpx += '  </rte>\n';
  gpx += '  <trk>\n';
  gpx += '    <name>點對點直線 GPX 軌跡</name>\n';
  gpx += '    <trkseg>\n';

  for (var t = 0; t < routeData.coordinates.length; t++) {
    var tc = routeData.coordinates[t];
    gpx += '      <trkpt lat="' + Number(tc[1]) + '" lon="' + Number(tc[0]) + '"></trkpt>\n';
  }

  gpx += '    </trkseg>\n';
  gpx += '  </trk>\n';
  gpx += '</gpx>\n';

  return gpx;
}

function exportGpxRoute() {
  if (!generatedRoute || !generatedRoute.coordinates || generatedRoute.coordinates.length < 2) {
    alert("請先產生道路路線或直線快速路徑，再匯出 GPX。");
    return;
  }

  var isDirectRoute = generatedRoute.mode === "direct";
  var gpxText = isDirectRoute
    ? buildGpxTextFromDirectRoute(generatedRoute)
    : buildGpxTextFromGeneratedRoute(generatedRoute);
  var fileName = isDirectRoute
    ? "pikmin-flower-direct-route-" + getTodayText() + ".gpx"
    : "pikmin-flower-road-route-" + getTodayText() + ".gpx";

  downloadTextFile(fileName, gpxText, "application/gpx+xml");
  alert("已匯出 GPX 路線檔：" + fileName);
}

function ensureDirectRouteButton() {
  var routeGrid = document.getElementById("routeActionGrid");
  var routeBtn = document.getElementById("routeBtn");
  var gpxBtn = document.getElementById("gpxBtn");

  if (!routeBtn || document.getElementById("directRouteBtn")) {
    return;
  }

  var button = document.createElement("button");
  button.id = "directRouteBtn";
  button.className = "route-action-card dark-card";
  button.type = "button";
  button.innerHTML = "<span>⚡</span><b>點對點</b><small>直線快速</small>";
  button.onclick = openDirectRoute;

  if (routeGrid && gpxBtn) {
    routeGrid.insertBefore(button, gpxBtn);
  } else if (routeBtn.parentNode) {
    routeBtn.parentNode.insertBefore(button, routeBtn.nextSibling);
  }
}

function ensureRegionRoutePickerButton() {
  var routeGrid = document.getElementById("routeActionGrid");
  var routeBtn = document.getElementById("routeBtn");

  if (!routeBtn || document.getElementById("regionRoutePickerBtn")) {
    return;
  }

  var button = document.createElement("button");
  button.id = "regionRoutePickerBtn";
  button.className = "route-action-card purple-card";
  button.type = "button";
  button.innerHTML = "<span>🗺️</span><b>依區域</b><small>快速產生</small>";
  button.onclick = openRegionRoutePicker;

  if (routeGrid) {
    routeGrid.insertBefore(button, routeBtn);
  } else if (routeBtn.parentNode) {
    routeBtn.parentNode.insertBefore(button, routeBtn);
  }
}

function ensureRegionRoutePickerStyles() {
  if (document.getElementById("regionRoutePickerStyles")) return;

  var style = document.createElement("style");
  style.id = "regionRoutePickerStyles";
  style.innerHTML =
    ".region-route-overlay{position:fixed;inset:0;z-index:1500;background:rgba(15,23,42,.5);display:flex;align-items:flex-end;justify-content:center;padding:14px;}" +
    ".region-route-sheet{width:min(720px,100%);max-height:86vh;overflow:auto;background:#f8fff8;border-radius:26px;padding:18px;box-shadow:0 24px 70px rgba(15,23,42,.28);font-family:Arial,'Microsoft JhengHei',sans-serif;}" +
    ".region-route-head{display:flex;gap:10px;align-items:flex-start;justify-content:space-between;margin-bottom:12px;}" +
    ".region-route-head h3{margin:0;color:#1f2937;font-size:22px;}" +
    ".region-route-head p{margin:5px 0 0;color:#64748b;line-height:1.45;font-size:14px;}" +
    ".region-route-close{width:auto;margin:0;padding:7px 12px;border-radius:999px;background:#e5e7eb;color:#111827;box-shadow:none;}" +
    ".region-route-toolbar{display:flex;gap:8px;margin:8px 0 12px;flex-wrap:wrap;}" +
    ".region-route-back{width:auto;margin:0;padding:8px 12px;border-radius:999px;background:#dbeafe;color:#1d4ed8;box-shadow:none;}" +
    ".region-route-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:10px;}" +
    ".region-route-tile{min-height:62px;margin:0;padding:12px 8px;border:1px solid rgba(148,163,184,.38);border-radius:18px;background:white;color:#1f2937;font-weight:800;font-size:15px;line-height:1.25;box-shadow:0 10px 24px rgba(15,23,42,.08);}" +
    ".region-route-tile small{display:block;margin-top:4px;color:#64748b;font-weight:700;font-size:12px;}" +
    ".region-route-tile:active{transform:scale(.98);}";
  document.head.appendChild(style);
}

function openRegionRoutePicker() {
  ensureRegionRoutePickerStyles();

  var oldOverlay = document.getElementById("regionRoutePickerOverlay");
  if (oldOverlay) oldOverlay.remove();

  var overlay = document.createElement("div");
  overlay.id = "regionRoutePickerOverlay";
  overlay.className = "region-route-overlay";
  overlay.onclick = function(event) {
    if (event.target === overlay) closeRegionRoutePicker();
  };

  overlay.innerHTML =
    '<section class="region-route-sheet" role="dialog" aria-modal="true" aria-label="依區域快速產生路線">' +
    '<div class="region-route-head">' +
    '<div><h3 id="regionRouteTitle">選擇縣市</h3><p id="regionRouteHint">先選縣市，再選區域；選完會自動套用篩選、全選該區域座標並產生道路路線。</p></div>' +
    '<button class="region-route-close" type="button" onclick="closeRegionRoutePicker()">關閉</button>' +
    '</div>' +
    '<div id="regionRouteToolbar" class="region-route-toolbar"></div>' +
    '<div id="regionRouteGrid" class="region-route-grid"></div>' +
    '</section>';

  document.body.appendChild(overlay);
  renderRegionRouteCityStep();
}

function closeRegionRoutePicker() {
  var overlay = document.getElementById("regionRoutePickerOverlay");
  if (overlay) overlay.remove();
}

function renderRegionRouteCityStep() {
  var title = document.getElementById("regionRouteTitle");
  var hint = document.getElementById("regionRouteHint");
  var toolbar = document.getElementById("regionRouteToolbar");
  var grid = document.getElementById("regionRouteGrid");

  if (!grid) return;

  if (title) title.innerHTML = "選擇縣市";
  if (hint) hint.innerHTML = "先選縣市，再選該縣市底下的區域。";
  if (toolbar) toolbar.innerHTML = "";

  var cities = typeof getRouteCitiesByCountry === "function"
    ? getRouteCitiesByCountry("台灣")
    : (typeof TAIWAN_REGIONS !== "undefined" ? TAIWAN_REGIONS : []);

  var html = "";

  for (var i = 0; i < cities.length; i++) {
    html += '<button class="region-route-tile" type="button" onclick="renderRegionRouteDistrictStep(\'' + escapeHTML(String(cities[i])) + '\')">' +
      escapeHTML(cities[i]) +
      '</button>';
  }

  grid.innerHTML = html;
}

function renderRegionRouteDistrictStep(city) {
  var title = document.getElementById("regionRouteTitle");
  var hint = document.getElementById("regionRouteHint");
  var toolbar = document.getElementById("regionRouteToolbar");
  var grid = document.getElementById("regionRouteGrid");

  if (!grid) return;

  if (title) title.innerHTML = escapeHTML(city);
  if (hint) hint.innerHTML = "選擇區域後，系統會直接使用該區域座標產生道路路線。";
  if (toolbar) {
    toolbar.innerHTML = '<button class="region-route-back" type="button" onclick="renderRegionRouteCityStep()">← 返回縣市</button>';
  }

  var districts = typeof getRouteDistricts === "function" ? getRouteDistricts("台灣", city) : [];
  var html = "";

  html += '<button class="region-route-tile" type="button" onclick="applyRegionRouteSelection(\'' + escapeHTML(String(city)) + '\', \'全部區域\')">全部區域<small>使用全市座標</small></button>';

  for (var i = 0; i < districts.length; i++) {
    html += '<button class="region-route-tile" type="button" onclick="applyRegionRouteSelection(\'' + escapeHTML(String(city)) + '\', \'' + escapeHTML(String(districts[i])) + '\')">' +
      escapeHTML(districts[i]) +
      '</button>';
  }

  grid.innerHTML = html;
}

function applyRegionRouteSelection(city, district) {
  var citySelect = document.getElementById("routeCityFilter");
  var districtSelect = document.getElementById("routeDistrictFilter");

  if (!citySelect || !districtSelect) {
    alert("找不到路線篩選選單，請重新整理後再試。");
    return;
  }

  citySelect.value = city;

  if (typeof updateRouteDistrictOptions === "function") {
    updateRouteDistrictOptions();
  }

  districtSelect = document.getElementById("routeDistrictFilter");
  if (districtSelect) {
    districtSelect.value = district;
  }

  if (typeof resetRouteManualOrder === "function") resetRouteManualOrder();
  if (typeof resetGeneratedRoute === "function") resetGeneratedRoute();
  if (typeof renderRoutePointList === "function") renderRoutePointList();
  if (typeof selectAllRoutePoints === "function") selectAllRoutePoints(true);

  closeRegionRoutePicker();

  if (typeof goPage === "function") goPage("route");

  var selectedPoints = typeof getSelectedPointsForRoute === "function" ? getSelectedPointsForRoute() : [];

  if (selectedPoints.length < 2) {
    alert("「" + city + " " + district + "」目前少於 2 個可用座標，無法產生路線。");
    return;
  }

  if (typeof openAutoRoute === "function") {
    openAutoRoute();
  }
}

function ensureUpdateBannerStyles() {
  if (document.getElementById("appUpdateBannerStyles")) return;

  var style = document.createElement("style");
  style.id = "appUpdateBannerStyles";
  style.innerHTML =
    ".app-update-banner{position:fixed;left:12px;right:12px;bottom:92px;z-index:1200;padding:14px;border-radius:20px;background:linear-gradient(135deg,#1d4ed8,#2563eb);color:white;box-shadow:0 18px 45px rgba(37,99,235,.32);display:flex;gap:12px;align-items:center;justify-content:space-between;font-family:Arial,'Microsoft JhengHei',sans-serif;}" +
    ".app-update-banner b{display:block;font-size:15px;}" +
    ".app-update-banner small{display:block;margin-top:3px;opacity:.9;line-height:1.35;}" +
    ".app-update-banner button{width:auto;margin:0;padding:9px 13px;border-radius:999px;background:white;color:#1d4ed8;box-shadow:none;}";
  document.head.appendChild(style);
}

function showAppUpdateBanner(newVersion, message) {
  ensureUpdateBannerStyles();

  var oldBanner = document.getElementById("appUpdateBanner");
  if (oldBanner) oldBanner.remove();

  var banner = document.createElement("aside");
  banner.id = "appUpdateBanner";
  banner.className = "app-update-banner";
  banner.innerHTML =
    '<div>' +
    '<b>發現新版本 ' + escapeHTML(newVersion || "") + '</b>' +
    '<small>' + escapeHTML(message || "點一下更新到最新版本。") + '</small>' +
    '</div>' +
    '<button id="reloadAppUpdateBtn" type="button">立即更新</button>';

  document.body.appendChild(banner);

  var reloadBtn = document.getElementById("reloadAppUpdateBtn");
  if (reloadBtn) {
    reloadBtn.onclick = reloadAppForUpdate;
  }
}

function reloadAppForUpdate() {
  if (appUpdateRegistration && appUpdateRegistration.waiting) {
    appUpdateRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
  }

  if ("caches" in window) {
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) { return caches.delete(key); }));
    }).then(function() {
      window.location.reload();
    });
    return;
  }

  window.location.reload();
}

function checkForAppUpdate() {
  var currentVersion = typeof APP_VERSION !== "undefined" ? APP_VERSION : "";

  fetch("./version.json?v=" + new Date().getTime(), { cache: "no-store" })
    .then(function(response) {
      if (!response || !response.ok) return null;
      return response.json();
    })
    .then(function(data) {
      if (!data || !data.version || !currentVersion) return;

      if (String(data.version) !== String(currentVersion)) {
        showAppUpdateBanner(data.version, data.message);
      }
    })
    .catch(function() {
      // 靜默略過版本檢查錯誤。
    });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistration().then(function(registration) {
      if (!registration) return;
      appUpdateRegistration = registration;
      registration.update();

      if (registration.waiting) {
        showAppUpdateBanner(currentVersion, "新版已準備完成，點一下重新載入。");
      }
    });
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker.register("./service-worker.js?v=1.0.18").then(function(registration) {
      appUpdateRegistration = registration;

      registration.addEventListener("updatefound", function() {
        var installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener("statechange", function() {
          if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
            showAppUpdateBanner(typeof APP_VERSION !== "undefined" ? APP_VERSION : "", "新版已下載完成，點一下重新載入。");
          }
        });
      });
    }).catch(function() {
      // 靜默略過，避免影響網站主要功能。
    });
  });

  navigator.serviceWorker.addEventListener("controllerchange", function() {
    window.location.reload();
  });
}

window.addEventListener("beforeinstallprompt", function(event) {
  event.preventDefault();
  deferredInstallPrompt = event;
  showInstallAppBanner();
});

window.addEventListener("appinstalled", function() {
  deferredInstallPrompt = null;
  hideInstallAppBanner();
});

document.addEventListener("DOMContentLoaded", function() {
  ensureInstallStylesheet();
  ensureInstallAppBanner();
  ensureDirectRouteButton();
  ensureRegionRoutePickerButton();
});

window.addEventListener("load", function() {
  ensureDirectRouteButton();
  ensureRegionRoutePickerButton();
  checkForAppUpdate();
});
