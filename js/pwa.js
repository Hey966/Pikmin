var deferredInstallPrompt = null;

function ensureInstallStylesheet() {
  if (document.getElementById("installAppStylesheet")) {
    return;
  }

  var link = document.createElement("link");
  link.id = "installAppStylesheet";
  link.rel = "stylesheet";
  link.href = "./css/install.css";
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker.register("./service-worker.js").catch(function() {
      // 靜默略過，避免影響網站主要功能。
    });
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
});
