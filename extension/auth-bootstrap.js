(function () {
  "use strict";

  var ORIGIN = "https://app.cloudinterpreter.com";
  var SIGNIN_URL = ORIGIN + "/auth/signin";
  var STATE_KEY = "signalCloudLoginBootstrap";
  var activeRun = null;

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  async function inspectSigninTab(tabId) {
    try {
      var rows = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: function () {
          var path = String(location.pathname || "");
          var password = !!document.querySelector('input[type="password"]');
          var username = !!document.querySelector(
            'input[type="email"], input[autocomplete="username"], input[name="email"], input[name="username"]'
          );
          return {
            path: path,
            ready: document.readyState === "complete",
            hasPassword: password,
            hasUsername: username,
            bodyLength: String(document.body && document.body.innerText || "").trim().length
          };
        }
      });
      return rows && rows[0] ? rows[0].result : null;
    } catch (_) {
      return null;
    }
  }

  async function waitForSessionRedirect(tabId) {
    var deadline = Date.now() + 10000;
    var firstVisibleSigninAt = 0;

    while (Date.now() < deadline) {
      var tab;
      try {
        tab = await chrome.tabs.get(tabId);
      } catch (_) {
        return false;
      }

      var page = await inspectSigninTab(tabId);
      if (page) {
        var path = String(page.path || "").toLowerCase();
        var onSigninRoute = /^\/auth\/(signin|sign-in|login)\/?$/.test(path);

        // A successful redirect away from /auth means the existing session is usable.
        if (!onSigninRoute && !/^\/auth\//.test(path) && page.ready && !page.hasPassword && page.bodyLength > 25) {
          return true;
        }

        // Allow the app time to restore a valid session before classifying the page as logged out.
        if (onSigninRoute && page.hasPassword && page.hasUsername) {
          if (!firstVisibleSigninAt) firstVisibleSigninAt = Date.now();
          if (Date.now() - firstVisibleSigninAt >= 2200) return false;
        } else {
          firstVisibleSigninAt = 0;
        }
      }

      if (tab.status === "complete" && /^chrome-error:\/\//i.test(String(tab.url || ""))) return false;
      await delay(300);
    }

    return false;
  }

  async function storeState(state, reason, extra) {
    var entry = Object.assign({
      state: state,
      reason: reason,
      checkedAt: new Date().toISOString(),
      signInUrl: SIGNIN_URL
    }, extra || {});
    var update = {};
    update[STATE_KEY] = entry;
    await chrome.storage.local.set(update);
  }

  async function focusWindow(tab) {
    if (!tab || tab.id == null) return;
    await chrome.tabs.update(tab.id, { active: true });
    if (tab.windowId != null) {
      try { await chrome.windows.update(tab.windowId, { focused: true }); } catch (_) {}
    }
  }

  async function hasAuthenticatedPlatformTab() {
    var tabs = await chrome.tabs.query({ url: [ORIGIN + "/*"] });
    return (tabs || []).some(function (tab) {
      var path = "";
      try { path = new URL(String(tab.url || "")).pathname; } catch (_) {}
      return /^\\/(profile|call|logs|appointments|scheduled)(\\/|$)/.test(path);
    });
  }
  async function runBootstrap(reason) {
    var probeTab = null;
    await storeState("checking", reason);

    try {
      if (await hasAuthenticatedPlatformTab()) {
        await storeState("authenticated", reason, { source: "existing-platform-tab" });
        return;
      }
      // Use a background tab on the sign-in route; never navigate or replace the user's open tabs.
      probeTab = await chrome.tabs.create({ url: SIGNIN_URL, active: false });
      var alreadySignedIn = await waitForSessionRedirect(probeTab.id);

      if (alreadySignedIn) {
        try { await chrome.tabs.remove(probeTab.id); } catch (_) {}
        probeTab = null;
        await storeState("authenticated", reason);
        return;
      }

      // Reuse the newly created probe tab as the requested login tab.
      try {
        var current = await chrome.tabs.get(probeTab.id);
        var currentUrl = String(current.url || "");
        var currentPath = "";
        try { currentPath = new URL(currentUrl).pathname; } catch (_) {}
        if (currentPath !== "/auth/signin") {
          probeTab = await chrome.tabs.update(probeTab.id, { url: SIGNIN_URL, active: true });
        } else {
          probeTab = await chrome.tabs.update(probeTab.id, { active: true });
        }
      } catch (_) {
        probeTab = await chrome.tabs.create({ url: SIGNIN_URL, active: true });
      }

      await focusWindow(probeTab);
      await storeState("signin-opened", reason);
    } catch (error) {
      // If the session probe itself fails, prefer making the requested sign-in page available.
      try {
        if (probeTab && probeTab.id != null) {
          probeTab = await chrome.tabs.update(probeTab.id, { url: SIGNIN_URL, active: true });
        } else {
          probeTab = await chrome.tabs.create({ url: SIGNIN_URL, active: true });
        }
        await focusWindow(probeTab);
        await storeState("signin-opened-fallback", reason, { error: String(error || "unknown") });
      } catch (fallbackError) {
        await storeState("error", reason, {
          error: String(fallbackError || error || "unknown")
        });
      }
    }
  }

  function scheduleBootstrap(reason) {
    if (activeRun) return activeRun;
    activeRun = runBootstrap(reason).catch(async function (error) {
      await storeState("error", reason, { error: String(error || "unknown") }).catch(function () {});
    }).finally(function () {
      activeRun = null;
    });
    return activeRun;
  }

  chrome.runtime.onInstalled.addListener(function (details) {
    var reason = details && details.reason || "installed";
    if (reason === "install" || reason === "update") {
      scheduleBootstrap("onInstalled:" + reason);
    }
  });

  chrome.runtime.onStartup.addListener(function () {
    scheduleBootstrap("onStartup");
  });
})();
