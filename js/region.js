/*
 * Best-effort shopping region detection, used only to localize generic
 * "where to buy" search links (Google Maps / Google Search / Amazon) - never
 * to claim knowledge of specific local shops. No permission prompt, no
 * network call: guesses a country from the browser's IANA timezone, falls
 * back to the current UI language, and lets the user override it manually.
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "abyssboard-region";

  // Only the timezones needed to place someone in a country - doesn't need to
  // be exhaustive, since locale gives a reasonable fallback for anything else.
  var TZ_COUNTRY = {
    "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US",
    "America/Los_Angeles": "US", "America/Phoenix": "US", "America/Anchorage": "US",
    "Pacific/Honolulu": "US",
    "America/Toronto": "CA", "America/Vancouver": "CA", "America/Edmonton": "CA",
    "America/Winnipeg": "CA", "America/Halifax": "CA", "America/St_Johns": "CA",
    "America/Mexico_City": "MX", "America/Tijuana": "MX", "America/Cancun": "MX",
    "America/Monterrey": "MX",
    "America/Bogota": "CO", "America/Lima": "PE", "America/Santiago": "CL",
    "America/Argentina/Buenos_Aires": "AR", "America/Montevideo": "UY",
    "America/Caracas": "VE", "America/Guayaquil": "EC", "America/La_Paz": "BO",
    "America/Asuncion": "PY",
    "America/Sao_Paulo": "BR", "America/Bahia": "BR", "America/Manaus": "BR",
    "America/Fortaleza": "BR", "America/Recife": "BR", "America/Belem": "BR",
    "America/Costa_Rica": "CR", "America/Panama": "PA", "America/Guatemala": "GT",
    "America/El_Salvador": "SV", "America/Tegucigalpa": "HN", "America/Managua": "NI",
    "America/Santo_Domingo": "DO", "America/Puerto_Rico": "PR",
    "Europe/Madrid": "ES", "Atlantic/Canary": "ES",
    "Europe/Lisbon": "PT", "Atlantic/Azores": "PT", "Atlantic/Madeira": "PT",
    "Europe/London": "GB", "Europe/Dublin": "IE",
    "Europe/Paris": "FR", "Europe/Berlin": "DE", "Europe/Rome": "IT",
    "Europe/Amsterdam": "NL", "Europe/Brussels": "BE", "Europe/Zurich": "CH",
    "Europe/Vienna": "AT", "Europe/Stockholm": "SE", "Europe/Oslo": "NO",
    "Europe/Copenhagen": "DK", "Europe/Helsinki": "FI", "Europe/Warsaw": "PL",
    "Europe/Athens": "GR",
    "Africa/Casablanca": "MA", "Africa/Johannesburg": "ZA",
    "Asia/Tokyo": "JP", "Asia/Seoul": "KR",
    "Asia/Shanghai": "CN", "Asia/Hong_Kong": "HK", "Asia/Taipei": "TW",
    "Asia/Singapore": "SG", "Asia/Jakarta": "ID", "Asia/Bangkok": "TH",
    "Asia/Manila": "PH", "Asia/Kuala_Lumpur": "MY", "Asia/Ho_Chi_Minh": "VN",
    "Asia/Kolkata": "IN", "Asia/Dubai": "AE", "Asia/Colombo": "LK",
    "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Brisbane": "AU",
    "Australia/Perth": "AU", "Australia/Adelaide": "AU",
    "Pacific/Auckland": "NZ", "Pacific/Fiji": "FJ"
  };

  // code, English display name, and (only where genuinely confident it
  // exists) an Amazon marketplace TLD. Everything else falls back to
  // amazon.com rather than guessing at a domain that might not exist.
  var COUNTRIES = [
    { code: "US", name: "United States", amazonTld: "com" },
    { code: "CA", name: "Canada", amazonTld: "ca" },
    { code: "MX", name: "Mexico", amazonTld: "com.mx" },
    { code: "BR", name: "Brazil", amazonTld: "com.br" },
    { code: "AR", name: "Argentina" },
    { code: "CL", name: "Chile" },
    { code: "CO", name: "Colombia" },
    { code: "PE", name: "Peru" },
    { code: "UY", name: "Uruguay" },
    { code: "EC", name: "Ecuador" },
    { code: "VE", name: "Venezuela" },
    { code: "CR", name: "Costa Rica" },
    { code: "PA", name: "Panama" },
    { code: "GT", name: "Guatemala" },
    { code: "DO", name: "Dominican Republic" },
    { code: "PR", name: "Puerto Rico" },
    { code: "ES", name: "Spain", amazonTld: "es" },
    { code: "PT", name: "Portugal" },
    { code: "FR", name: "France", amazonTld: "fr" },
    { code: "GB", name: "United Kingdom", amazonTld: "co.uk" },
    { code: "IE", name: "Ireland" },
    { code: "DE", name: "Germany", amazonTld: "de" },
    { code: "IT", name: "Italy", amazonTld: "it" },
    { code: "NL", name: "Netherlands", amazonTld: "nl" },
    { code: "BE", name: "Belgium" },
    { code: "CH", name: "Switzerland" },
    { code: "AT", name: "Austria" },
    { code: "SE", name: "Sweden" },
    { code: "NO", name: "Norway" },
    { code: "DK", name: "Denmark" },
    { code: "FI", name: "Finland" },
    { code: "PL", name: "Poland" },
    { code: "GR", name: "Greece" },
    { code: "MA", name: "Morocco" },
    { code: "ZA", name: "South Africa" },
    { code: "JP", name: "Japan", amazonTld: "co.jp" },
    { code: "KR", name: "South Korea" },
    { code: "CN", name: "China" },
    { code: "HK", name: "Hong Kong" },
    { code: "TW", name: "Taiwan" },
    { code: "SG", name: "Singapore", amazonTld: "sg" },
    { code: "ID", name: "Indonesia" },
    { code: "TH", name: "Thailand" },
    { code: "PH", name: "Philippines" },
    { code: "MY", name: "Malaysia" },
    { code: "VN", name: "Vietnam" },
    { code: "IN", name: "India", amazonTld: "in" },
    { code: "AE", name: "United Arab Emirates", amazonTld: "ae" },
    { code: "LK", name: "Sri Lanka" },
    { code: "AU", name: "Australia", amazonTld: "com.au" },
    { code: "NZ", name: "New Zealand" },
    { code: "FJ", name: "Fiji" }
  ];

  var BY_CODE = {};
  COUNTRIES.forEach(function (c) {
    BY_CODE[c.code] = c;
  });

  // Rough fallback if the timezone lookup doesn't match anything - keyed to
  // the same locales AbyssBoard's UI already supports.
  var LOCALE_DEFAULT_COUNTRY = { en: "US", es: "ES", pt: "BR", ja: "JP" };

  function countryFromTimezone() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return TZ_COUNTRY[tz] || null;
    } catch (e) {
      return null;
    }
  }

  function detectCountry(locale) {
    try {
      var saved = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
      if (saved && BY_CODE[saved]) return saved;
    } catch (e) {
      // ignore
    }
    var byTz = countryFromTimezone();
    if (byTz && BY_CODE[byTz]) return byTz;
    return LOCALE_DEFAULT_COUNTRY[locale] || "US";
  }

  var currentCountry = null;

  function getCountry() {
    return currentCountry;
  }

  function setCountry(code) {
    if (!BY_CODE[code]) return;
    currentCountry = code;
    try {
      global.localStorage && global.localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      // ignore write failures
    }
  }

  function amazonTld(code) {
    var c = BY_CODE[code];
    return (c && c.amazonTld) || "com";
  }

  function countryName(code) {
    var c = BY_CODE[code];
    return c ? c.name : code;
  }

  function init(locale) {
    currentCountry = detectCountry(locale);
    return currentCountry;
  }

  global.Region = {
    COUNTRIES: COUNTRIES,
    init: init,
    getCountry: getCountry,
    setCountry: setCountry,
    amazonTld: amazonTld,
    countryName: countryName
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.Region;
  }
})(typeof window !== "undefined" ? window : globalThis);
