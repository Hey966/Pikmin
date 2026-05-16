var points = [];
var STORAGE_KEY = "pikmin_big_flower_points_full_safe";
var editingId = null;

function showStatus(text) {
  var status = document.getElementById("status");

  if (!status) {
    return;
  }

  status.style.display = "block";
  status.innerHTML = escapeHTML(text);
}

function showPage(page) {
  var addPage = document.getElementById("addPage");
  var viewPage = document.getElementById("viewPage");
  var mapPage = document.getElementById("mapPage");
  var routePage = document.getElementById("routePage");
  var backupPage = document.getElementById("backupPage");
  var statsPage = document.getElementById("statsPage");
  var helpPage = document.getElementById("helpPage");
  var helpDetailPage = document.getElementById("helpDetailPage");

  if (addPage) addPage.className = "page";
  if (viewPage) viewPage.className = "page";
  if (mapPage) mapPage.className = "page";
  if (routePage) routePage.className = "page";
  if (backupPage) backupPage.className = "page";
  if (statsPage) statsPage.className = "page";
  if (helpPage) helpPage.className = "page";
  if (helpDetailPage) helpDetailPage.className = "page";

  if (page === "add" && addPage) {
    addPage.className = "page active";
  }

  if (page === "view" && viewPage) {
    viewPage.className = "page active";

    if (typeof loadPoints === "function") loadPoints();

    if (typeof renderList === "function") {
      renderList();
      setTimeout(renderList, 80);
    }
  }

  if (page === "map" && mapPage) {
    mapPage.className = "page active";

    if (typeof loadPoints === "function") loadPoints();

    if (typeof renderMapOverview === "function") {
      renderMapOverview();
      setTimeout(renderMapOverview, 180);
    }
  }

  if (page === "route" && routePage) {
    routePage.className = "page active";

    if (typeof loadPoints === "function") loadPoints();
    if (typeof resetGeneratedRoute === "function") resetGeneratedRoute();

    if (typeof renderRoutePointList === "function") {
      renderRoutePointList();
      setTimeout(renderRoutePointList, 80);
      setTimeout(renderRoutePointList, 220);
    }

    if (typeof renderSavedRoutePlanOptions === "function") {
      renderSavedRoutePlanOptions();
    }
  }

  if (page === "backup" && backupPage) {
    backupPage.className = "page active";
  }

  if (page === "stats" && statsPage) {
    statsPage.className = "page active";

    if (typeof loadPoints === "function") loadPoints();

    if (typeof renderStatsPage === "function") {
      renderStatsPage();
    }
  }

  if (page === "help" && helpPage) {
    helpPage.className = "page active";

    if (typeof renderHelpCards === "function") {
      renderHelpCards();
    }
  }

  if (page === "helpDetail" && helpDetailPage) {
    helpDetailPage.className = "page active";
  }

  window.scrollTo(0, 0);
}

function cleanNumber(input) {
  var text = input.value;
  var result = "";
  var allowed = "0123456789.-";

  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i);
    if (allowed.indexOf(ch) !== -1) result += ch;
  }

  input.value = result;
}

function cleanCoordinateText() {
  var input = document.getElementById("coordinateText");
  if (!input) return;

  var text = input.value;
  var result = "";
  var allowed = "0123456789.,- /@?=&abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:";

  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i);
    if (allowed.indexOf(ch) !== -1) result += ch;
  }

  input.value = result;
}

function makeKey(lat, lon) {
  return Number(lat).toFixed(7) + "," + Number(lon).toFixed(7);
}

function savePoints() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
}

function loadPoints() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    points = saved ? JSON.parse(saved) : [];
  } catch (error) {
    points = [];
  }
}

function downloadTextFile(fileName, text, mimeType) {
  try {
    var blob = new Blob([text], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    var dataUrl = "data:" + mimeType + ";charset=utf-8," + encodeURIComponent(text);
    var fallbackLink = document.createElement("a");

    fallbackLink.href = dataUrl;
    fallbackLink.download = fileName;
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    document.body.removeChild(fallbackLink);
  }
}

function getTodayText() {
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth() + 1;
  var day = now.getDate();

  if (month < 10) month = "0" + month;
  if (day < 10) day = "0" + day;

  return year + "-" + month + "-" + day;
}

function isArray(value) {
  return Object.prototype.toString.call(value) === "[object Array]";
}

function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeXML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
