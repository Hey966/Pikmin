var lastAnalyzedTaiwanRegion = "";
var lastAnalyzedTaiwanDistrict = "";
var lastAnalyzedTaiwanAreaText = "";

function parseCoordinate(showAlertWhenFail) {
  var text = document.getElementById("coordinateText").value;
  var numbers = getNumbers(text);

  if (numbers.length < 2) {
    if (showAlertWhenFail) {
      alert("請貼上座標，例如：22.7882410, 121.1830930");
    }
    return false;
  }

  var first = numbers[0];
  var second = numbers[1];
  var lat;
  var lon;
  var message;

  if (first >= 21 && first <= 26 && second >= 119 && second <= 123) {
    lat = first;
    lon = second;
    message = "已判斷為：緯度, 經度";
  } else if (first >= 119 && first <= 123 && second >= 21 && second <= 26) {
    lon = first;
    lat = second;
    message = "已判斷為：經度, 緯度";
  } else if (Math.abs(first) <= 90 && Math.abs(second) > 90 && Math.abs(second) <= 180) {
    lat = first;
    lon = second;
    message = "已判斷為：緯度, 經度";
  } else if (Math.abs(first) > 90 && Math.abs(first) <= 180 && Math.abs(second) <= 90) {
    lon = first;
    lat = second;
    message = "已判斷為：經度, 緯度";
  } else {
    lat = first;
    lon = second;
    message = "已使用常見格式：緯度, 經度";
  }

  document.getElementById("x").value = lon;
  document.getElementById("y").value = lat;

  showStatus(message + "；經度 " + lon + "，緯度 " + lat);
  return true;
}

function getNumbers(text) {
  var result = [];
  var current = "";

  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i);

    if ((ch >= "0" && ch <= "9") || ch === "." || ch === "-") {
      current += ch;
    } else {
      pushNumber();
    }
  }

  pushNumber();

  function pushNumber() {
    if (current !== "" && current !== "-" && current !== ".") {
      var num = Number(current);
      if (!isNaN(num)) {
        result.push(num);
      }
    }

    current = "";
  }

  return result;
}

function analyzeAddress() {
  parseCoordinate(false);

  var x = document.getElementById("x").value;
  var y = document.getElementById("y").value;

  if (x === "" || y === "") {
    alert("請先輸入或貼上座標");
    return;
  }

  var lon = Number(x);
  var lat = Number(y);

  if (isNaN(lon) || isNaN(lat)) {
    alert("座標只能輸入數字");
    return;
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    alert("座標範圍不正確，請確認經緯度。");
    return;
  }

  var analyzeBtn = document.getElementById("analyzeBtn");
  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = "分析中……";

  showStatus("正在分析地址，請稍等……");

  var url =
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2" +
    "&lat=" + encodeURIComponent(lat) +
    "&lon=" + encodeURIComponent(lon) +
    "&addressdetails=1" +
    "&accept-language=zh-TW";

  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = "🗺️ 分析地址與區域";

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);
          fillAddressData(data);
        } catch (error) {
          showStatus("分析失敗：地址資料解析錯誤。你仍然可以手動輸入區域。");
        }
      } else {
        showStatus("分析失敗：可能是網路問題或地圖服務暫時無法使用。你仍然可以手動輸入區域。");
      }
    }
  };

  xhr.onerror = function() {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = "🗺️ 分析地址與區域";
    showStatus("分析失敗：網路連線錯誤。你仍然可以手動輸入區域。");
  };

  xhr.send();
}

function fillAddressData(data) {
  var address = data.address || {};

  var allAddressText = collectTaiwanAddressText(address, data.display_name || "", data.name || "");
  var region = detectTaiwanRegionFromText(allAddressText);

  var city =
    region ||
    address.city ||
    address.county ||
    address.state ||
    address.region ||
    "";

  var district =
    detectTaiwanDistrictFromText(city, allAddressText) ||
    normalizeTaiwanName(
      address.city_district ||
      address.town ||
      address.suburb ||
      address.borough ||
      address.municipality ||
      address.quarter ||
      address.village ||
      address.hamlet ||
      ""
    );

  var road =
    address.road ||
    address.pedestrian ||
    address.footway ||
    address.path ||
    "";

  var houseNumber = address.house_number || "";

  city = normalizeTaiwanName(city);
  district = normalizeTaiwanName(district);
  road = normalizeTaiwanName(road);

  var areaText = joinNonEmpty([city, district], " ");

  if (areaText === "") {
    areaText = "無法判斷區域";
  }

  var placeText = joinNonEmpty([road, houseNumber], " ");

  if (placeText === "") {
    placeText = data.name || data.display_name || "未命名地點";
  }

  placeText = normalizeTaiwanName(placeText);

  document.getElementById("area").value = areaText;
  document.getElementById("name").value = placeText;

  autoSelectTaiwanRegion(
    normalizeTaiwanName(region + " " + city + " " + areaText + " " + (data.display_name || ""))
  );

  rememberAnalyzedTaiwanDistrict(region || city, district, areaText);

  if (district && district !== "") {
    showStatus("分析完成：" + normalizeTaiwanName(data.display_name || "沒有完整地址資料") + "；已辨識區域：" + district);
  } else {
    showStatus("分析完成：" + normalizeTaiwanName(data.display_name || "沒有完整地址資料") + "；未能確認行政區，可手動補充區域。");
  }
}

function collectTaiwanAddressText(address, displayName, placeName) {
  var parts = [];

  for (var key in address) {
    if (Object.prototype.hasOwnProperty.call(address, key)) {
      var value = address[key];

      if (typeof value === "string" && value.trim() !== "") {
        parts.push(value);
      }
    }
  }

  if (displayName) {
    parts.push(displayName);
  }

  if (placeName) {
    parts.push(placeName);
  }

  return normalizeTaiwanName(parts.join(" "));
}

function detectTaiwanRegionFromText(text) {
  var normalized = normalizeTaiwanName(text || "");
  var regions = [
    "基隆市", "台北市", "新北市", "桃園市", "新竹市", "新竹縣",
    "苗栗縣", "台中市", "彰化縣", "南投縣", "雲林縣", "嘉義市",
    "嘉義縣", "台南市", "高雄市", "屏東縣", "宜蘭縣", "花蓮縣",
    "台東縣", "澎湖縣", "金門縣", "連江縣"
  ];

  for (var i = 0; i < regions.length; i++) {
    if (normalized.indexOf(regions[i]) !== -1) {
      return regions[i];
    }
  }

  return "";
}

function detectTaiwanDistrictFromText(region, text) {
  var normalizedRegion = normalizeTaiwanName(region || "");
  var normalizedText = normalizeTaiwanName(text || "");
  var districts = TAIWAN_DISTRICTS[normalizedRegion] || [];

  for (var i = 0; i < districts.length; i++) {
    if (normalizedText.indexOf(districts[i]) !== -1) {
      return districts[i];
    }
  }

  return "";
}

function rememberAnalyzedTaiwanDistrict(region, district, areaText) {
  lastAnalyzedTaiwanRegion = normalizeTaiwanName(region || "");
  lastAnalyzedTaiwanDistrict = normalizeTaiwanName(district || "");
  lastAnalyzedTaiwanAreaText = normalizeTaiwanName(areaText || "");
}

function getRememberedAnalyzedDistrict(area, category) {
  var normalizedArea = normalizeTaiwanName(area || "");
  var normalizedCategory = normalizeTaiwanName(category || "");

  if (
    lastAnalyzedTaiwanDistrict &&
    lastAnalyzedTaiwanAreaText &&
    normalizedArea === lastAnalyzedTaiwanAreaText &&
    (!lastAnalyzedTaiwanRegion || normalizedCategory === lastAnalyzedTaiwanRegion)
  ) {
    return lastAnalyzedTaiwanDistrict;
  }

  return "";
}

function joinNonEmpty(arr, separator) {
  var result = [];

  for (var i = 0; i < arr.length; i++) {
    if (arr[i] !== "") {
      result.push(arr[i]);
    }
  }

  return result.join(separator);
}

function normalizeTaiwanName(text) {
  return String(text || "").replace(/臺/g, "台");
}

function autoSelectTaiwanRegion(text) {
  var normalized = normalizeTaiwanName(text);

  var regions = [
    "基隆市", "台北市", "新北市", "桃園市", "新竹市", "新竹縣",
    "苗栗縣", "台中市", "彰化縣", "南投縣", "雲林縣", "嘉義市",
    "嘉義縣", "台南市", "高雄市", "屏東縣", "宜蘭縣", "花蓮縣",
    "台東縣", "澎湖縣", "金門縣", "連江縣"
  ];

  var categorySelect = document.getElementById("category");

  if (!categorySelect) {
    return;
  }

  for (var i = 0; i < regions.length; i++) {
    if (normalized.indexOf(regions[i]) !== -1) {
      categorySelect.value = regions[i];
      return;
    }
  }

  categorySelect.value = "其他";
}

function reverseGeocodePointForDistrict(point) {
  return new Promise(function(resolve) {
    if (!point || point.x === undefined || point.y === undefined) {
      resolve({
        ok: false,
        reason: "invalid-point"
      });
      return;
    }

    var lon = Number(point.x);
    var lat = Number(point.y);

    if (
      isNaN(lon) ||
      isNaN(lat) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      resolve({
        ok: false,
        reason: "invalid-coordinate"
      });
      return;
    }

    var url =
      "https://nominatim.openstreetmap.org/reverse?format=jsonv2" +
      "&lat=" + encodeURIComponent(lat) +
      "&lon=" + encodeURIComponent(lon) +
      "&addressdetails=1" +
      "&accept-language=zh-TW";

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) {
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);
          resolve(buildDistrictResultFromReverseData(data));
        } catch (error) {
          resolve({
            ok: false,
            reason: "parse-error"
          });
        }
      } else {
        resolve({
          ok: false,
          reason: "http-error"
        });
      }
    };

    xhr.onerror = function() {
      resolve({
        ok: false,
        reason: "network-error"
      });
    };

    xhr.send();
  });
}

function buildDistrictResultFromReverseData(data) {
  var address = data && data.address ? data.address : {};
  var allAddressText = collectTaiwanAddressText(
    address,
    data && data.display_name ? data.display_name : "",
    data && data.name ? data.name : ""
  );

  var region = detectTaiwanRegionFromText(allAddressText);

  var city =
    region ||
    address.city ||
    address.county ||
    address.state ||
    address.region ||
    "";

  city = normalizeTaiwanName(city);

  if (!region) {
    region = detectTaiwanRegionFromText(city + " " + allAddressText);
  }

  var district =
    detectTaiwanDistrictFromText(region || city, allAddressText) ||
    normalizeTaiwanName(
      address.city_district ||
      address.town ||
      address.suburb ||
      address.borough ||
      address.municipality ||
      address.quarter ||
      address.village ||
      address.hamlet ||
      ""
    );

  if (!district && region) {
    district = detectTaiwanDistrictFromText(region, allAddressText);
  }

  if (!district) {
    return {
      ok: false,
      reason: "district-not-found",
      region: region || "",
      rawDisplayName: data && data.display_name ? data.display_name : ""
    };
  }

  return {
    ok: true,
    region: region || city || "",
    district: district,
    rawDisplayName: data && data.display_name ? data.display_name : ""
  };
}

function waitBeforeNextReverseGeocode(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}
