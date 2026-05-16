var ROUTE_PLAN_STORAGE_KEY = "pikmin_saved_route_plans_v1";
var savedRoutePlans = [];

function loadSavedRoutePlans() {
  try {
    var saved = localStorage.getItem(ROUTE_PLAN_STORAGE_KEY);
    savedRoutePlans = saved ? JSON.parse(saved) : [];
  } catch (error) {
    savedRoutePlans = [];
  }
}

function saveSavedRoutePlans() {
  localStorage.setItem(ROUTE_PLAN_STORAGE_KEY, JSON.stringify(savedRoutePlans));
}

function showRoutePlanStatus(message, type) {
  var box = document.getElementById("routePlanStatus");
  if (!box) return;

  var className = "route-plan-status";
  if (type === "error") className += " error";
  else if (type === "success") className += " success";

  box.className = className;
  box.style.display = "block";
  box.innerHTML = escapeHTML(message);
}

function clearRoutePlanStatus() {
  var box = document.getElementById("routePlanStatus");
  if (!box) return;

  box.style.display = "none";
  box.innerHTML = "";
  box.className = "route-plan-status";
}

function renderSavedRoutePlanOptions(selectedId) {
  var select = document.getElementById("savedRoutePlanSelect");
  if (!select) return;

  var html = '<option value="">尚未選擇方案</option>';

  for (var i = 0; i < savedRoutePlans.length; i++) {
    var plan = savedRoutePlans[i];
    var count = getPlanPointCount(plan);

    html += '<option value="' + escapeHTML(plan.id) + '">';
    html += escapeHTML(plan.name) + '｜' + escapeHTML(count) + ' 點';
    html += '</option>';
  }

  select.innerHTML = html;

  if (selectedId) select.value = selectedId;
}

function getPlanPointCount(plan) {
  if (plan.pointKeys && isArray(plan.pointKeys)) return plan.pointKeys.length;
  if (plan.pointIds && isArray(plan.pointIds)) return plan.pointIds.length;
  return 0;
}

function getSelectedRoutePlan() {
  var select = document.getElementById("savedRoutePlanSelect");

  if (!select || !select.value) return null;

  for (var i = 0; i < savedRoutePlans.length; i++) {
    if (String(savedRoutePlans[i].id) === String(select.value)) {
      return savedRoutePlans[i];
    }
  }

  return null;
}

function saveCurrentRoutePlan() {
  clearRoutePlanStatus();

  var nameInput = document.getElementById("routePlanName");
  var planName = nameInput ? nameInput.value.trim() : "";
  var selectedPoints = getSelectedPointsForRoute();

  if (!planName) {
    showRoutePlanStatus("請先輸入方案名稱。", "error");
    return;
  }

  if (selectedPoints.length < 2) {
    showRoutePlanStatus("至少要勾選 2 個座標，才能儲存成路線方案。", "error");
    return;
  }

  var pointIds = [];
  var pointKeys = [];

  for (var i = 0; i < selectedPoints.length; i++) {
    pointIds.push(String(selectedPoints[i].id));
    pointKeys.push(makeKey(selectedPoints[i].y, selectedPoints[i].x));
  }

  var newPlan = {
    id: "route-plan-" + new Date().getTime(),
    name: planName,
    country: getRouteCountryValue(),
    city: getRouteCityValue(),
    district: getRouteDistrictValue(),
    pointIds: pointIds,
    pointKeys: pointKeys,
    createdAt: new Date().toLocaleString()
  };

  savedRoutePlans.unshift(newPlan);
  saveSavedRoutePlans();
  renderSavedRoutePlanOptions(newPlan.id);

  if (nameInput) nameInput.value = "";

  if (typeof renderStatsPage === "function") renderStatsPage();

  showRoutePlanStatus("已儲存方案：「" + planName + "」。", "success");
}

function resolveRoutePlanPointIds(plan) {
  var resolvedIds = [];
  var idMap = {};

  if (plan.pointIds && isArray(plan.pointIds)) {
    for (var i = 0; i < plan.pointIds.length; i++) {
      var id = String(plan.pointIds[i]);

      if (findPointById(id) && !idMap[id]) {
        idMap[id] = true;
        resolvedIds.push(id);
      }
    }
  }

  if (plan.pointKeys && isArray(plan.pointKeys)) {
    for (var j = 0; j < plan.pointKeys.length; j++) {
      var point = findPointByKey(plan.pointKeys[j]);

      if (point) {
        var pointId = String(point.id);

        if (!idMap[pointId]) {
          idMap[pointId] = true;
          resolvedIds.push(pointId);
        }
      }
    }
  }

  return resolvedIds;
}

function findPointById(id) {
  for (var i = 0; i < points.length; i++) {
    if (String(points[i].id) === String(id)) return points[i];
  }

  return null;
}

function findPointByKey(key) {
  for (var i = 0; i < points.length; i++) {
    if (makeKey(points[i].y, points[i].x) === key) return points[i];
  }

  return null;
}

function loadSelectedRoutePlan() {
  clearRoutePlanStatus();

  var plan = getSelectedRoutePlan();

  if (!plan) {
    showRoutePlanStatus("請先選擇要載入的方案。", "error");
    return;
  }

  var countrySelect = document.getElementById("routeCountryFilter");
  var citySelect = document.getElementById("routeCityFilter");
  var districtSelect = document.getElementById("routeDistrictFilter");

  if (countrySelect) countrySelect.value = plan.country || "台灣";

  if (typeof updateRouteCityOptions === "function") updateRouteCityOptions();

  if (citySelect) citySelect.value = plan.city || "全部縣市";

  if (typeof updateRouteDistrictOptions === "function") updateRouteDistrictOptions();

  if (districtSelect) districtSelect.value = plan.district || "全部區域";

  setTimeout(function() {
    applyRoutePlanPointSelection(plan);
  }, 80);
}

function applyRoutePlanPointSelection(plan) {
  var resolvedIds = resolveRoutePlanPointIds(plan);

  if (typeof setRouteManualOrder === "function") {
    setRouteManualOrder(resolvedIds);
  }

  if (typeof renderRoutePointList === "function") {
    renderRoutePointList();
  }

  var boxes = document.querySelectorAll(".route-point-checkbox");
  var selectedCount = 0;
  var idMap = {};

  for (var i = 0; i < resolvedIds.length; i++) {
    idMap[String(resolvedIds[i])] = true;
  }

  for (var j = 0; j < boxes.length; j++) {
    var box = boxes[j];
    var pointId = String(box.getAttribute("data-id"));
    var checked = !!idMap[pointId];

    box.checked = checked;

    if (checked) selectedCount++;
  }

  if (typeof resetGeneratedRoute === "function") resetGeneratedRoute();

  if (selectedCount === 0) {
    showRoutePlanStatus("方案已載入，但目前找不到原本的座標，可能已被刪除或不在此篩選範圍。", "error");
    return;
  }

  showRoutePlanStatus("已載入方案：「" + plan.name + "」，目前勾選 " + selectedCount + " 個座標，順序也已恢復。", "success");
}

function deleteSelectedRoutePlan() {
  clearRoutePlanStatus();

  var plan = getSelectedRoutePlan();

  if (!plan) {
    showRoutePlanStatus("請先選擇要刪除的方案。", "error");
    return;
  }

  if (!confirm("確定要刪除路線方案「" + plan.name + "」嗎？")) return;

  var nextPlans = [];

  for (var i = 0; i < savedRoutePlans.length; i++) {
    if (String(savedRoutePlans[i].id) !== String(plan.id)) {
      nextPlans.push(savedRoutePlans[i]);
    }
  }

  savedRoutePlans = nextPlans;
  saveSavedRoutePlans();
  renderSavedRoutePlanOptions();

  if (typeof renderStatsPage === "function") renderStatsPage();

  showRoutePlanStatus("已刪除方案：「" + plan.name + "」。", "success");
}

function clearCurrentRouteSelection() {
  clearRoutePlanStatus();

  if (typeof selectAllRoutePoints === "function") {
    selectAllRoutePoints(false);
  }

  showRoutePlanStatus("已清空目前勾選。", "success");
}

function getRoutePlansForBackup() {
  loadSavedRoutePlans();

  var result = [];

  for (var i = 0; i < savedRoutePlans.length; i++) {
    var plan = savedRoutePlans[i];
    var pointKeys = getPlanPointKeys(plan);

    result.push({
      id: plan.id,
      name: plan.name || "未命名路線方案",
      country: plan.country || "台灣",
      city: plan.city || "全部縣市",
      district: plan.district || "全部區域",
      pointKeys: pointKeys,
      createdAt: plan.createdAt || ""
    });
  }

  return result;
}

function getPlanPointKeys(plan) {
  var result = [];
  var keyMap = {};

  if (plan.pointKeys && isArray(plan.pointKeys)) {
    for (var i = 0; i < plan.pointKeys.length; i++) {
      var key = String(plan.pointKeys[i]);

      if (key && !keyMap[key]) {
        keyMap[key] = true;
        result.push(key);
      }
    }
  }

  if (result.length === 0 && plan.pointIds && isArray(plan.pointIds)) {
    for (var j = 0; j < plan.pointIds.length; j++) {
      var point = findPointById(plan.pointIds[j]);

      if (point) {
        var pointKey = makeKey(point.y, point.x);

        if (!keyMap[pointKey]) {
          keyMap[pointKey] = true;
          result.push(pointKey);
        }
      }
    }
  }

  return result;
}

function mergeImportedRoutePlans(importedPlans) {
  loadSavedRoutePlans();

  var added = 0;
  var skipped = 0;
  var signatureMap = {};

  for (var s = 0; s < savedRoutePlans.length; s++) {
    signatureMap[makeRoutePlanSignature(savedRoutePlans[s])] = true;
  }

  for (var i = 0; i < importedPlans.length; i++) {
    var imported = importedPlans[i];

    if (!imported || !imported.name) {
      skipped++;
      continue;
    }

    var pointKeys = normalizeImportedRoutePlanKeys(imported);

    if (pointKeys.length < 2) {
      skipped++;
      continue;
    }

    var pointIds = [];
    var pointIdMap = {};

    for (var j = 0; j < pointKeys.length; j++) {
      var point = findPointByKey(pointKeys[j]);

      if (point) {
        var pointId = String(point.id);

        if (!pointIdMap[pointId]) {
          pointIdMap[pointId] = true;
          pointIds.push(pointId);
        }
      }
    }

    if (pointIds.length < 2) {
      skipped++;
      continue;
    }

    var newPlan = {
      id: "route-plan-import-" + new Date().getTime() + "-" + i,
      name: imported.name || "未命名路線方案",
      country: imported.country || "台灣",
      city: imported.city || "全部縣市",
      district: imported.district || "全部區域",
      pointIds: pointIds,
      pointKeys: pointKeys,
      createdAt: imported.createdAt || new Date().toLocaleString()
    };

    var signature = makeRoutePlanSignature(newPlan);

    if (signatureMap[signature]) {
      skipped++;
      continue;
    }

    signatureMap[signature] = true;
    savedRoutePlans.unshift(newPlan);
    added++;
  }

  saveSavedRoutePlans();
  renderSavedRoutePlanOptions();

  if (typeof renderStatsPage === "function") renderStatsPage();

  return {
    added: added,
    skipped: skipped
  };
}

function normalizeImportedRoutePlanKeys(plan) {
  var result = [];
  var keyMap = {};

  if (plan.pointKeys && isArray(plan.pointKeys)) {
    for (var i = 0; i < plan.pointKeys.length; i++) {
      var key = String(plan.pointKeys[i]);

      if (key && !keyMap[key]) {
        keyMap[key] = true;
        result.push(key);
      }
    }
  }

  return result;
}

function makeRoutePlanSignature(plan) {
  var keys = getPlanPointKeys(plan);
  return String(plan.name || "") + "::" + keys.join("|");
}

function initializeSavedRoutePlans() {
  loadSavedRoutePlans();
  renderSavedRoutePlanOptions();
}
