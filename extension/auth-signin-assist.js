(function () {
  "use strict";

  if (!/^\/auth\/signin\/?$/.test(String(location.pathname || ""))) return;

  var savedUsername = "";
  var handledForm = null;
  var attempts = 0;
  var maxAttempts = 48;
  var timer = null;
  var observer = null;

  function findUsernameInput() {
    return document.querySelector(
      'input[type="email"], input[autocomplete="username"], input[name="email"], input[name="username"], input[id*="email" i]'
    );
  }

  function findPasswordInput() {
    return document.querySelector('input[type="password"], input[autocomplete="current-password"]');
  }

  function setInputValue(input, value) {
    var descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    if (descriptor && typeof descriptor.set === "function") descriptor.set.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function applySigninAssist() {
    if (!/^\/auth\/signin\/?$/.test(String(location.pathname || ""))) return true;

    var password = findPasswordInput();
    if (!password) return false;

    var form = password.closest("form") || password.parentElement || document.body;
    if (form === handledForm) return true;

    var username = findUsernameInput();
    if (username && savedUsername && username.value !== savedUsername) {
      setInputValue(username, savedUsername);
    }

    // The user enters the password manually; do not read, fill, or persist it.
    try { password.focus({ preventScroll: false }); } catch (_) { password.focus(); }
    handledForm = form;
    return true;
  }

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== "local" || !changes.cloudInterpreterLoginUsername) return;
    savedUsername = String(changes.cloudInterpreterLoginUsername.newValue || "").trim();
    handledForm = null;
    applySigninAssist();
  });
  function stopWatching() {
    if (timer) clearInterval(timer);
    timer = null;
    if (observer) observer.disconnect();
    observer = null;
  }

  chrome.storage.local.get(["cloudInterpreterLoginUsername"]).then(function (stored) {
    savedUsername = String(stored && stored.cloudInterpreterLoginUsername || "").trim();

    if (applySigninAssist()) return;
    if (document.documentElement) {
      observer = new MutationObserver(function () {
        if (applySigninAssist()) stopWatching();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    timer = setInterval(function () {
      attempts += 1;
      if (applySigninAssist() || attempts >= maxAttempts) stopWatching();
    }, 250);
  }).catch(function () {
    // Even without a saved username, focus the password field when it appears.
    if (applySigninAssist()) return;
    timer = setInterval(function () {
      attempts += 1;
      if (applySigninAssist() || attempts >= maxAttempts) stopWatching();
    }, 250);
  });
})();
