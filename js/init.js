var APP_VERSION = "1.0.18";
var debugBox = document.getElementById("debugStatus");

function setDebug(text) {
  if (debugBox) debugBox.innerHTML = text;
}

function safeGet(id) {
  var element = document.getElementById(id);

  if (!element) {
    setDebug("程式狀態：錯誤 ❌ 找不到元件 #" + id);
    return null;
  }

  return element;
}

function safeFunction(functionName) {
  if (typeof window[functionName] !== "function") {
    setDebug("程式狀態：錯誤 ❌ 找不到函式 " + functionName + "，請檢查 JS 檔案是否有正確連結");
    return null;
  }

  return window[functionName];
}

function bindClick(id, functionName) {
  var element = safeGet(id);
  var fn = safeFunction(functionName);
  if (element && fn) element.onclick = fn;
}

function bindOptionalClick(id, callback) {
  var element = document.getElementById(id);
  if (element) element.onclick = callback;
}

function goPage(page) {
  showPage(page);
  updateBottomNav(page);
}

function updateBottomNav(page) {
  var navAdd = document.getElementById("navAdd");
  var navView = document.getElementById("navView");
  var navRoute = document.getElementById("navRoute");
  var navBackup = document.getElementById("navBackup");
  var navStats = document.getElementById("navStats");
  var navHelp = document.getElementById("navHelp");

  if (navAdd) navAdd.className = "nav-btn";
  if (navView) navView.className = "nav-btn";
  if (navRoute) navRoute.className = "nav-btn";
  if (navBackup) navBackup.className = "nav-btn";
  if (navStats) navStats.className = "nav-btn";
  if (navHelp) navHelp.className = "nav-btn";

  if (page === "add" && navAdd) navAdd.className = "nav-btn active";
  if ((page === "view" || page === "map") && navView) navView.className = "nav-btn active";
  if (page === "route" && navRoute) navRoute.className = "nav-btn active";
  if (page === "backup" && navBackup) navBackup.className = "nav-btn active";
  if (page === "stats" && navStats) navStats.className = "nav-btn active";
  if ((page === "help" || page === "helpDetail") && navHelp) navHelp.className = "nav-btn active";
}

function startApp() {
  setDebug("版本：" + APP_VERSION);

  if (!safeFunction("loadPoints")) return;
  if (!safeFunction("renderList")) return;

  loadPoints();

  var coordinateText = safeGet("coordinateText");
  if (coordinateText) {
    coordinateText.oninput = function() {
      cleanCoordinateText();
      parseCoordinate(false);
    };
  }

  var xInput = safeGet("x");
  if (xInput) {
    xInput.oninput = function() { cleanNumber(this); };
  }

  var yInput = safeGet("y");
  if (yInput) {
    yInput.oninput = function() { cleanNumber(this); };
  }

  var parseBtn = safeGet("parseBtn");
  if (parseBtn) {
    parseBtn.onclick = function() { resetForm(); };
  }

  bindClick("analyzeBtn", "analyzeAddress");
  bindClick("addBtn", "addPoint");
  bindClick("clearBtn", "clearAll");
  bindClick("reclassifyDistrictBtn", "reclassifyUncategorizedDistricts");
  bindClick("exportBtn", "exportRecords");
  bindClick("routeBtn", "openAutoRoute");
  bindClick("gpxBtn", "exportGpxRoute");

  bindOptionalClick("navAdd", function() { goPage("add"); });
  bindOptionalClick("navView", function() { goPage("view"); });
  bindOptionalClick("navRoute", function() { goPage("route"); });
  bindOptionalClick("navBackup", function() { goPage("backup"); });
  bindOptionalClick("navStats", function() { goPage("stats"); });
  bindOptionalClick("navHelp", function() { goPage("help"); });

  bindOptionalClick("openMapOverviewBtn", function() {
    if (typeof syncMapCountryFromView === "function") syncMapCountryFromView();
    goPage("map");
  });

  bindOptionalClick("backToViewFromMapBtn", function() {
    goPage("view");
  });

  bindOptionalClick("backToHelpHomeBtn", function() {
    goPage("help");
  });

  var viewSearchText = document.getElementById("viewSearchText");
  if (viewSearchText) {
    viewSearchText.oninput = function() {
      renderList();
    };
  }

  var favoriteOnlyFilter = document.getElementById("favoriteOnlyFilter");
  if (favoriteOnlyFilter) {
    favoriteOnlyFilter.onchange = function() {
      renderList();
    };
  }

  bindOptionalClick("clearViewFiltersBtn", function() {
    resetViewFilters();
  });

  bindOptionalClick("saveRoutePlanBtn", function() {
    saveCurrentRoutePlan();
  });

  bindOptionalClick("loadRoutePlanBtn", function() {
    loadSelectedRoutePlan();
  });

  bindOptionalClick("deleteRoutePlanBtn", function() {
    deleteSelectedRoutePlan();
  });

  bindOptionalClick("clearRouteSelectionBtn", function() {
    clearCurrentRouteSelection();
  });

  var importBtn = safeGet("importBtn");
  var importFile = safeGet("importFile");

  if (importBtn && importFile) {
    importBtn.onclick = function() { importFile.click(); };
    importFile.onchange = importRecords;
  }

  var mapCityFilter = document.getElementById("mapCityFilter");
  if (mapCityFilter) {
    mapCityFilter.onchange = function() { updateMapDistrictOptions(); };
  }

  var mapDistrictFilter = document.getElementById("mapDistrictFilter");
  if (mapDistrictFilter) {
    mapDistrictFilter.onchange = function() { renderMapOverview(); };
  }

  var routeCityFilter = document.getElementById("routeCityFilter");
  if (routeCityFilter) {
    routeCityFilter.onchange = function() {
      updateRouteDistrictOptions();
      clearRoutePlanStatus();
    };
  }

  var routeDistrictFilter = document.getElementById("routeDistrictFilter");
  if (routeDistrictFilter) {
    routeDistrictFilter.onchange = function() {
      resetGeneratedRoute();
      resetRouteManualOrder();
      renderRoutePointList();
      clearRoutePlanStatus();
    };
  }

  renderList();

  if (typeof initializeRouteSelectors === "function") initializeRouteSelectors();
  if (typeof renderRoutePointList === "function") renderRoutePointList();
  if (typeof initializeSavedRoutePlans === "function") initializeSavedRoutePlans();
  if (typeof initializeMapSelectors === "function") initializeMapSelectors();
  if (typeof renderHelpCards === "function") renderHelpCards();
  if (typeof checkForAppUpdate === "function") checkForAppUpdate();

  updateBottomNav("add");
  setDebug("版本：" + APP_VERSION);
}

startApp();
