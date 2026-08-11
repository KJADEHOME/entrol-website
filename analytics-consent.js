(function () {
  'use strict';

  var MEASUREMENT_ID = 'G-ZRKTYL4X0L';
  var STORAGE_KEY = 'entrol_analytics_consent_v1';
  var ALLOWED_HOSTS = ['entrol.com', 'www.entrol.com'];
  var isLoaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  function readChoice() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function saveChoice(choice) {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch (error) {
      // The choice still applies for the current page when storage is blocked.
    }
  }

  function setConsent(analyticsState) {
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    });
    window.gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: analyticsState
    });
  }

  function loadAnalytics() {
    if (isLoaded || ALLOWED_HOSTS.indexOf(window.location.hostname) === -1) return;
    isLoaded = true;
    setConsent('granted');

    var tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    document.head.appendChild(tag);

    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  }

  function removePanel() {
    var panel = document.getElementById('entrol-analytics-consent');
    if (panel) panel.remove();
  }

  function ensureStyles() {
    if (document.getElementById('entrol-analytics-consent-styles')) return;
    var style = document.createElement('style');
    style.id = 'entrol-analytics-consent-styles';
    style.textContent =
      '#entrol-analytics-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483647;max-width:680px;margin:auto;padding:18px 20px;background:#fff;color:#172033;border:1px solid #d8dee9;border-radius:14px;box-shadow:0 12px 36px rgba(15,23,42,.22);font:15px/1.5 Arial,sans-serif}' +
      '#entrol-analytics-consent p{margin:0 0 14px}' +
      '#entrol-analytics-consent a{color:#0b63ce;text-decoration:underline}' +
      '#entrol-analytics-consent-actions{display:flex;gap:10px;flex-wrap:wrap}' +
      '#entrol-analytics-consent button{border:1px solid #0b63ce;border-radius:8px;padding:10px 15px;font-weight:700;cursor:pointer}' +
      '#entrol-analytics-accept{background:#0b63ce;color:#fff}' +
      '#entrol-analytics-decline{background:#fff;color:#0b63ce}' +
      '#entrol-privacy-settings{position:fixed;left:12px;bottom:12px;z-index:2147483646;border:1px solid #cbd5e1;border-radius:999px;padding:7px 11px;background:#fff;color:#334155;box-shadow:0 4px 14px rgba(15,23,42,.14);font:12px Arial,sans-serif;cursor:pointer}' +
      '@media(max-width:520px){#entrol-analytics-consent{left:10px;right:10px;bottom:10px;padding:16px}#entrol-analytics-consent-actions button{flex:1}}';
    document.head.appendChild(style);
  }

  function ensureSettingsButton() {
    if (document.getElementById('entrol-privacy-settings')) return;
    var button = document.createElement('button');
    button.id = 'entrol-privacy-settings';
    button.type = 'button';
    button.textContent = 'Privacy choices';
    button.addEventListener('click', showPanel);
    document.body.appendChild(button);
  }

  function choose(choice) {
    saveChoice(choice);
    if (choice === 'granted') {
      loadAnalytics();
    } else {
      setConsent('denied');
    }
    removePanel();
    ensureSettingsButton();
  }

  function showPanel() {
    removePanel();
    ensureStyles();

    var panel = document.createElement('section');
    panel.id = 'entrol-analytics-consent';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Analytics privacy choices');
    panel.innerHTML =
      '<p><strong>Optional analytics</strong><br>We use cookie-free Plausible Analytics and, only with your permission, Google Analytics to understand website performance. Advertising storage and personalization remain disabled. <a href="/privacy-policy.html">Privacy Policy</a></p>' +
      '<div id="entrol-analytics-consent-actions">' +
      '<button id="entrol-analytics-accept" type="button">Accept analytics</button>' +
      '<button id="entrol-analytics-decline" type="button">Continue without analytics</button>' +
      '</div>';
    document.body.appendChild(panel);
    document.getElementById('entrol-analytics-accept').addEventListener('click', function () { choose('granted'); });
    document.getElementById('entrol-analytics-decline').addEventListener('click', function () { choose('denied'); });
  }

  function initialize() {
    ensureStyles();
    var choice = readChoice();
    if (choice === 'granted') {
      loadAnalytics();
      ensureSettingsButton();
    } else if (choice === 'denied') {
      setConsent('denied');
      ensureSettingsButton();
    } else {
      showPanel();
    }
  }

  window.EntrolAnalyticsConsent = {
    showSettings: showPanel,
    grant: function () { choose('granted'); },
    deny: function () { choose('denied'); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
