var deferredInstallPrompt = null;
var appUpdateRegistration = null;

function ensureInstallStylesheet() {
  if (document.getElementById("installAppStylesheet")) {
    return;
  }

  var link = document.createElement("link");
  link.id = "installAppStylesheet";
  link.rel = "stylesheet";
  link.href = "./css/install.css?v=1.0.16";
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
  var routeBtn = document.getElementById("routeBtn");

  if (!routeBtn || document.getElementById("directRouteBtn")) {
    return;
  }

  var button = document.createElement("button");
  button.id = "directRouteBtn";
  button.className = "secondary";
  button.type = "button";
  button.innerHTML = "⚡ 點對點直線快速路徑";
  button.onclick = openDirectRoute;

  if (routeBtn.parentNode) {
    routeBtn.parentNode.insertBefore(button, routeBtn.nextSibling);
  }
}

function ensureUpdateBannerStyles() {
  if (document.getElementById("appUpdateBannerStyles")) return;

  var style = document.createElement("style");
  style.id = "appUpdateBannerStyles";
  style.innerHTML =
    ".app-update-banner{" +
    "position:fixed;left:12px;right:12px;bottom:92px;z-index:1200;" +
    "padding:14px;border-radius:20px;background:linear-gradient(135deg,#1d4ed8,#2563eb);" +
    "color:white;box-shadow:0 18px 45px rgba(37,99,235,.32);" +
    "display:flex;gap:12px;align-items:center;justify-content:space-between;" +
    "font-family:Arial,'Microsoft JhengHei',sans-serif;}" +
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
    navigator.serviceWorker.register("./service-worker.js?v=1.0.16").then(function(registration) {
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
});

window.addEventListener("load", function() {
  ensureDirectRouteButton();
  checkForAppUpdate();
});
