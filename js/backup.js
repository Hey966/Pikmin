function exportRecords() {
  if (points.length === 0) {
    alert("目前沒有資料可以匯出。");
    return;
  }

  var routePlans = [];

  if (typeof getRoutePlansForBackup === "function") {
    routePlans = getRoutePlansForBackup();
  }

  var backup = {
    appName: "皮克敏巨大花朵座標紀錄",
    version: 2,
    exportedAt: new Date().toLocaleString(),
    points: points,
    routePlans: routePlans
  };

  var jsonText = JSON.stringify(backup, null, 2);
  var fileName = "pikmin-flower-backup-" + getTodayText() + ".json";

  downloadTextFile(fileName, jsonText, "application/json");

  alert(
    "已匯出記錄檔：" + fileName + "\n\n" +
    "座標資料：" + points.length + " 筆\n" +
    "路線方案：" + routePlans.length + " 組"
  );
}

function importRecords(event) {
  var file = event.target.files[0];

  if (!file) {
    return;
  }

  var reader = new FileReader();

  reader.onload = function(e) {
    try {
      var text = e.target.result;
      var data = JSON.parse(text);
      var importedPoints = [];
      var importedRoutePlans = [];

      if (data.points && isArray(data.points)) {
        importedPoints = data.points;
      } else if (isArray(data)) {
        importedPoints = data;
      }

      if (data.routePlans && isArray(data.routePlans)) {
        importedRoutePlans = data.routePlans;
      }

      if (importedPoints.length === 0 && importedRoutePlans.length === 0) {
        alert("這個檔案裡沒有可匯入的座標或路線方案資料。");
        return;
      }

      if (!confirm(
        "確定要匯入這個記錄檔嗎？\n\n" +
        "會與目前資料合併，相同座標與相同路線方案不會重複匯入。"
      )) {
        return;
      }

      var pointResult = mergeImportedPoints(importedPoints);
      var routePlanResult = {
        added: 0,
        skipped: 0
      };

      savePoints();

      if (typeof mergeImportedRoutePlans === "function") {
        routePlanResult = mergeImportedRoutePlans(importedRoutePlans);
      }

      renderList();

      if (typeof refreshRouteListIfReady === "function") {
        refreshRouteListIfReady();
      }

      if (typeof renderSavedRoutePlanOptions === "function") {
        renderSavedRoutePlanOptions();
      }

      alert(
        "匯入完成！\n\n" +
        "座標新增：" + pointResult.added + " 筆\n" +
        "座標略過重複：" + pointResult.skipped + " 筆\n" +
        "路線方案新增：" + routePlanResult.added + " 組\n" +
        "路線方案略過：" + routePlanResult.skipped + " 組"
      );

      showPage("view");
    } catch (error) {
      alert("匯入失敗：檔案內容不是有效的 JSON。");
    }

    document.getElementById("importFile").value = "";
  };

  reader.readAsText(file, "UTF-8");
}

function mergeImportedPoints(importedPoints) {
  var added = 0;
  var skipped = 0;

  for (var i = 0; i < importedPoints.length; i++) {
    var imported = importedPoints[i];

    if (!isValidImportedPoint(imported)) {
      skipped++;
      continue;
    }

    var importedKey = makeKey(imported.y, imported.x);
    var exists = false;

    for (var j = 0; j < points.length; j++) {
      if (makeKey(points[j].y, points[j].x) === importedKey) {
        exists = true;
        break;
      }
    }

    if (exists) {
      skipped++;
      continue;
    }

    var importedCountry = normalizeCountryValue(
      imported.country || guessCountryFromCategory(imported.category || "未分類")
    );

    var importedCategory = imported.category || "未分類";
    var importedArea = imported.area || "未填寫區域";

    var newPoint = {
      id: new Date().getTime() + i,
      x: String(imported.x),
      y: String(imported.y),
      area: importedArea,
      name: imported.name || "未命名巨大花朵",
      category: importedCategory,
      country: importedCountry,
      district: imported.district || guessDistrictByCountry(importedArea, importedCategory, importedCountry),
      favorite: !!imported.favorite,
      note: imported.note || "",
      createdAt: imported.createdAt || new Date().toLocaleString()
    };

    if (imported.updatedAt) {
      newPoint.updatedAt = imported.updatedAt;
    }

    points.unshift(newPoint);
    added++;
  }

  return {
    added: added,
    skipped: skipped
  };
}

function isValidImportedPoint(point) {
  if (!point) {
    return false;
  }

  if (point.x === undefined || point.y === undefined) {
    return false;
  }

  if (isNaN(Number(point.x)) || isNaN(Number(point.y))) {
    return false;
  }

  return true;
}
