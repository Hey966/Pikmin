var selectedViewRegion = null;
var selectedViewDistrict = null;
var currentViewRegions = [];
var currentViewDistricts = [];

var TAIWAN_REGIONS = [
  "基隆市", "台北市", "新北市", "桃園市", "新竹市", "新竹縣",
  "苗栗縣", "台中市", "彰化縣", "南投縣", "雲林縣", "嘉義市",
  "嘉義縣", "台南市", "高雄市", "屏東縣", "宜蘭縣", "花蓮縣",
  "台東縣", "澎湖縣", "金門縣", "連江縣"
];

var TAIWAN_DISTRICTS = {};

function getSelectedViewCountry() {
  if (typeof getViewCountryValue === "function") {
    return getViewCountryValue();
  }

  var select = document.getElementById("viewCountryFilter");
  return normalizeCountryValue(select ? select.value : "台灣");
}

function normalizeCountryValue(country) {
  var text = normalizeTaiwanText(country || "").trim();

  if (text === "" || text === "台灣" || text === "臺灣") return "台灣";
  if (text === "Vietnam" || text === "Viet Nam" || text === "越南社會主義共和國") return "越南";
  if (text === "Japan") return "日本";
  if (text === "Korea" || text === "South Korea" || text === "韓國") return "韓國";
  if (text === "Hong Kong") return "香港";

  return text;
}

function isCoordinateInBox(lat, lon, minLat, maxLat, minLon, maxLon) {
  return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
}

function guessCountryFromCoordinates(y, x) {
  var lat = Number(y);
  var lon = Number(x);

  if (isNaN(lat) || isNaN(lon)) return "台灣";

  if (isCoordinateInBox(lat, lon, 8.0, 23.8, 102.0, 110.8)) return "越南";
  if (isCoordinateInBox(lat, lon, 21.8, 25.5, 119.0, 122.5)) return "台灣";
  if (isCoordinateInBox(lat, lon, 22.1, 22.6, 113.8, 114.5)) return "香港";
  if (isCoordinateInBox(lat, lon, 33.0, 46.5, 129.0, 146.5)) return "日本";
  if (isCoordinateInBox(lat, lon, 33.0, 39.8, 124.0, 132.0)) return "韓國";

  return "其他";
}

function shouldPreferCoordinateCountry(point, coordinateCountry, savedCountry) {
  if (!point || !coordinateCountry || coordinateCountry === "其他") return false;

  if (!savedCountry || savedCountry === "其他") return true;

  if (coordinateCountry !== savedCountry && coordinateCountry !== "台灣") return true;

  return false;
}

function getPointCountry(point) {
  var savedCountry = point && point.country ? normalizeCountryValue(point.country) : "";
  var coordinateCountry = "";

  if (point && point.x !== undefined && point.y !== undefined) {
    coordinateCountry = guessCountryFromCoordinates(point.y, point.x);
  }

  if (shouldPreferCoordinateCountry(point, coordinateCountry, savedCountry)) {
    return coordinateCountry;
  }

  if (savedCountry) {
    return savedCountry;
  }

  if (coordinateCountry) {
    return coordinateCountry;
  }

  return "台灣";
}

function getPointDistrict(point) {
  if (point && point.district && point.district !== "未分類區域") {
    return point.district;
  }

  return guessDistrictByCountry(point ? point.area : "", point ? point.category : "", getPointCountry(point));
}

function guessCountryFromCategory(category) {
  return "台灣";
}

function guessDistrictByCountry(area, category, country) {
  if (normalizeCountryValue(country) !== "台灣") {
    return "未分類區域";
  }

  return guessDistrictFromArea(area, category);
}

function guessDistrictFromArea(area, category) {
  var text = normalizeTaiwanText(area || "");
  var city = normalizeTaiwanText(category || "");
  var districts = TAIWAN_DISTRICTS[city] || [];

  for (var i = 0; i < districts.length; i++) {
    if (text.indexOf(districts[i]) !== -1) return districts[i];
  }

  if (typeof getRememberedAnalyzedDistrict === "function") {
    var rememberedDistrict = getRememberedAnalyzedDistrict(area, category);
    if (rememberedDistrict) return rememberedDistrict;
  }

  text = text.replace(city, "").trim();
  var match = text.match(/([\u4e00-\u9fa5]{1,8}(區|鄉|鎮|市))/);

  if (match && match[1]) return match[1];

  return "未分類區域";
}

function resolveDistrictForSave(area, category) {
  var countrySelect = document.getElementById("country");
  var country = countrySelect ? countrySelect.value : "台灣";
  return guessDistrictByCountry(area, category, country);
}

function normalizeTaiwanText(text) {
  return String(text || "").replace(/臺/g, "台");
}

function shortRegionName(region) {
  return String(region || "");
}

function getRegionsForCountry(country) {
  country = normalizeCountryValue(country);

  if (country === "台灣") return TAIWAN_REGIONS;

  var regionMap = {};
  var regions = [];

  for (var i = 0; i < points.length; i++) {
    var p = points[i];
    if (getPointCountry(p) !== country) continue;

    var region = p.category || "未分類";
    if (!regionMap[region]) {
      regionMap[region] = true;
      regions.push(region);
    }
  }

  regions.sort();
  return regions;
}

function getDistrictsForTaiwanCity(city) {
  var districts = [];
  var source = TAIWAN_DISTRICTS[city] || [];

  for (var i = 0; i < source.length; i++) districts.push(source[i]);

  if (hasUnclassifiedDistrictPoints(city)) districts.push("未分類區域");
  return districts;
}

function hasUnclassifiedDistrictPoints(city) {
  for (var i = 0; i < points.length; i++) {
    var p = points[i];
    if (getPointCountry(p) === "台灣" && p.category === city && getPointDistrict(p) === "未分類區域") return true;
  }
  return false;
}

function countActiveDistrictsInCity(city) {
  var districtMap = {};
  var count = 0;

  for (var i = 0; i < points.length; i++) {
    var p = points[i];
    if (getPointCountry(p) !== "台灣") continue;
    if (p.category !== city) continue;

    var district = getPointDistrict(p);
    if (!districtMap[district]) {
      districtMap[district] = true;
      count++;
    }
  }

  return count;
}

function countTotalDistrictsInCity(city) {
  return getDistrictsForTaiwanCity(city).length;
}

function countPointsInRegion(country, region) {
  var count = 0;

  for (var i = 0; i < points.length; i++) {
    var p = points[i];
    if (getPointCountry(p) === normalizeCountryValue(country) && p.category === region) count++;
  }

  return count;
}

function countPointsInDistrict(city, district) {
  var count = 0;

  for (var i = 0; i < points.length; i++) {
    var p = points[i];
    if (getPointCountry(p) === "台灣" && p.category === city && getPointDistrict(p) === district) count++;
  }

  return count;
}
