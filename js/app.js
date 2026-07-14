(function () {
  "use strict";

  var BD = window.BoardData;
  var R = window.Recommend;
  var I18N = window.I18N;
  var Region = window.Region;

  function localizedOptions(ids, i18nPrefix) {
    return ids.map(function (id) {
      return {
        value: id,
        label: I18N.t(i18nPrefix + "." + id + ".label"),
        blurb: I18N.t(i18nPrefix + "." + id + ".blurb")
      };
    });
  }

  var state = {
    unit: "metric",
    heightCm: 175,
    weightKg: 75,
    waveSize: "medium",
    style: "fun",
    level: "intermediate",
    material: "either",
    fitness: "average"
  };

  var el = {};

  function q(id) {
    return document.getElementById(id);
  }

  function buildPillGroup(container, groupKey, options) {
    container.innerHTML = "";
    container.setAttribute("role", "radiogroup");
    options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill";
      btn.dataset.value = opt.value;
      btn.setAttribute("role", "radio");
      var active = state[groupKey] === opt.value;
      btn.setAttribute("aria-checked", String(active));
      if (active) btn.classList.add("is-active");
      btn.innerHTML =
        '<span class="pill-title">' + opt.label + "</span>" +
        (opt.blurb ? '<span class="pill-sub">' + opt.blurb + "</span>" : "");
      btn.addEventListener("click", function () {
        state[groupKey] = opt.value;
        Array.prototype.forEach.call(container.querySelectorAll(".pill"), function (b) {
          b.classList.remove("is-active");
          b.setAttribute("aria-checked", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-checked", "true");
        update();
      });
      container.appendChild(btn);
    });
  }

  function clampVal(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function syncHeightDisplay() {
    if (state.unit === "metric") {
      el.heightSlider.min = 120;
      el.heightSlider.max = 220;
      el.heightSlider.value = Math.round(state.heightCm);
      el.heightNumber.value = Math.round(state.heightCm);
      el.heightUnitLabel.textContent = "cm";
      el.heightReadout.textContent = R.formatFeetInches(R.cmToIn(state.heightCm));
    } else {
      var totalIn = R.cmToIn(state.heightCm);
      el.heightSlider.min = 47;
      el.heightSlider.max = 87;
      el.heightSlider.value = Math.round(totalIn);
      el.heightNumber.value = Math.round(totalIn);
      el.heightUnitLabel.textContent = "in";
      el.heightReadout.textContent = Math.round(state.heightCm) + " cm";
    }
  }

  function syncWeightDisplay() {
    if (state.unit === "metric") {
      el.weightSlider.min = 30;
      el.weightSlider.max = 150;
      el.weightSlider.value = Math.round(state.weightKg);
      el.weightNumber.value = Math.round(state.weightKg);
      el.weightUnitLabel.textContent = "kg";
      el.weightReadout.textContent = Math.round(R.kgToLb(state.weightKg)) + " lb";
    } else {
      var lb = R.kgToLb(state.weightKg);
      el.weightSlider.min = 66;
      el.weightSlider.max = 330;
      el.weightSlider.value = Math.round(lb);
      el.weightNumber.value = Math.round(lb);
      el.weightUnitLabel.textContent = "lb";
      el.weightReadout.textContent = Math.round(state.weightKg) + " kg";
    }
  }

  function onHeightChange(v) {
    var num = Number(v);
    if (!isFinite(num)) return;
    if (state.unit === "metric") {
      state.heightCm = clampVal(num, 100, 230);
    } else {
      state.heightCm = clampVal(R.inToCm(num), 100, 230);
    }
    syncHeightDisplay();
    update();
  }

  function onWeightChange(v) {
    var num = Number(v);
    if (!isFinite(num)) return;
    if (state.unit === "metric") {
      state.weightKg = clampVal(num, 25, 180);
    } else {
      state.weightKg = clampVal(R.lbToKg(num), 25, 180);
    }
    syncWeightDisplay();
    update();
  }

  function statBlock(label, value, sub) {
    return (
      '<div class="stat">' +
      '<span class="stat-label">' + label + "</span>" +
      '<span class="stat-value">' + value + "</span>" +
      '<span class="stat-sub">' + sub + "</span>" +
      "</div>"
    );
  }

  function renderBoardCard(container, board, badgeKey) {
    var tailLabel = I18N.t("tail." + board.tail);
    var tailSuffix = I18N.t("stat.tailSuffix", { tail: tailLabel });
    container.innerHTML =
      '<div class="board-card-head">' +
      '<span class="board-badge">' + I18N.t(badgeKey) + "</span>" +
      "<h3>" + board.name + "</h3>" +
      '<p class="board-tagline">' + board.tagline + "</p>" +
      "</div>" +
      '<div class="board-stats">' +
      statBlock(I18N.t("stat.length"), board.lengthFtIn, board.lengthCm + " cm") +
      statBlock(I18N.t("stat.width"), board.widthInStr + '"', board.widthCm + " cm") +
      statBlock(I18N.t("stat.thickness"), board.thicknessInStr + '"', board.thicknessCm + " cm") +
      statBlock(I18N.t("stat.volume"), board.volumeL + " L", tailSuffix) +
      "</div>" +
      '<p class="board-desc">' + board.description + "</p>";
  }

  // Generic search links only (Google Maps / Google Search / Amazon) - never
  // named local shops, since we can't verify those exist or are still active.
  function buildBuyLinksHtml(board) {
    var country = Region.getCountry();
    var query = I18N.t("buy.query", { board: board.name });
    var mapsQuery = I18N.t("buy.mapsQuery");
    var mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(mapsQuery);
    var searchUrl = "https://www.google.com/search?q=" + encodeURIComponent(query);
    var amazonUrl = "https://www.amazon." + Region.amazonTld(country) + "/s?k=" + encodeURIComponent(query);
    return (
      '<div class="buy-links">' +
      '<h4 class="buy-heading">' + I18N.t("buy.heading") + "</h4>" +
      '<div class="buy-buttons">' +
      '<a class="buy-btn" href="' + mapsUrl + '" target="_blank" rel="noopener noreferrer">' + I18N.t("buy.maps") + "</a>" +
      '<a class="buy-btn" href="' + searchUrl + '" target="_blank" rel="noopener noreferrer">' + I18N.t("buy.search") + "</a>" +
      '<a class="buy-btn" href="' + amazonUrl + '" target="_blank" rel="noopener noreferrer">' + I18N.t("buy.amazon") + "</a>" +
      "</div>" +
      '<p class="buy-disclaimer">' + I18N.t("buy.disclaimer") + "</p>" +
      "</div>"
    );
  }

  function populateRegionSelect() {
    el.regionSelect.innerHTML = Region.COUNTRIES.map(function (c) {
      return '<option value="' + c.code + '">' + c.name + "</option>";
    }).join("");
    el.regionSelect.value = Region.getCountry();
  }

  function bindRegionSelect() {
    el.regionSelect.addEventListener("change", function () {
      Region.setCountry(el.regionSelect.value);
      update();
    });
  }

  function update() {
    var inputs = {
      heightCm: state.heightCm,
      weightKg: state.weightKg,
      waveSize: state.waveSize,
      style: state.style,
      level: state.level,
      material: state.material,
      fitness: state.fitness
    };

    var result = R.recommend(inputs);

    el.volumeValue.textContent = result.targetVolumeL + " L";

    renderBoardCard(el.primaryCard, result.primary, "badge.recommended");
    if (result.materialNote) {
      el.primaryCard.insertAdjacentHTML("beforeend", '<p class="board-note">' + result.materialNote + "</p>");
    }
    el.primaryCard.insertAdjacentHTML("beforeend", buildBuyLinksHtml(result.primary));

    renderBoardCard(el.altCard, result.alternative, "badge.alternative");
    el.altCard.insertAdjacentHTML("beforeend", buildBuyLinksHtml(result.alternative));

    window.Silhouette.renderComparison(el.silhouetteContainer, {
      heightCm: state.heightCm,
      weightKg: state.weightKg,
      board: {
        lengthIn: result.primary.lengthIn,
        widthIn: result.primary.widthIn,
        outlineKey: result.primary.outlineKey
      }
    });

    el.silhouettePersonLabel.textContent = R.formatFeetInches(R.cmToIn(state.heightCm)) + " / " + Math.round(state.heightCm) + " cm";
    el.silhouetteBoardLabel.textContent = result.primary.lengthFtIn + " × " + result.primary.widthInStr + '"';
  }

  function bindUnitToggle() {
    var btns = document.querySelectorAll(".unit-btn");
    Array.prototype.forEach.call(btns, function (btn) {
      btn.addEventListener("click", function () {
        var unit = btn.dataset.unit;
        if (unit === state.unit) return;
        state.unit = unit;
        Array.prototype.forEach.call(btns, function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        syncHeightDisplay();
        syncWeightDisplay();
      });
    });
  }

  function buildAllPillGroups() {
    buildPillGroup(q("group-waveSize"), "waveSize", localizedOptions(BD.WAVE_SIZES, "waveSize"));
    buildPillGroup(q("group-style"), "style", localizedOptions(BD.STYLES, "style"));
    buildPillGroup(q("group-level"), "level", localizedOptions(BD.LEVELS, "level"));
    buildPillGroup(q("group-material"), "material", localizedOptions(["pu", "epoxy", "either"], "material"));
    buildPillGroup(q("group-fitness"), "fitness", localizedOptions(["low", "average", "high"], "fitness"));
  }

  function applyStaticI18n() {
    document.documentElement.lang = I18N.getLocale();
    document.title = I18N.t("meta.title");
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", I18N.t("meta.description"));

    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (node) {
      node.textContent = I18N.t(node.getAttribute("data-i18n"));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-aria]"), function (node) {
      node.setAttribute("aria-label", I18N.t(node.getAttribute("data-i18n-aria")));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-placeholder]"), function (node) {
      node.setAttribute("placeholder", I18N.t(node.getAttribute("data-i18n-placeholder")));
    });
  }

  function bindLangToggle() {
    var btns = document.querySelectorAll(".lang-btn");
    Array.prototype.forEach.call(btns, function (btn) {
      btn.classList.toggle("is-active", btn.dataset.lang === I18N.getLocale());
      btn.addEventListener("click", function () {
        var lang = btn.dataset.lang;
        if (lang === I18N.getLocale()) return;
        I18N.setLocale(lang);
        Array.prototype.forEach.call(btns, function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        applyStaticI18n();
        buildAllPillGroups();
        update();
      });
    });
  }

  function syncPillActiveStates() {
    [
      ["group-waveSize", "waveSize"],
      ["group-style", "style"],
      ["group-level", "level"],
      ["group-material", "material"],
      ["group-fitness", "fitness"]
    ].forEach(function (pair) {
      var container = q(pair[0]);
      var key = pair[1];
      if (!container) return;
      Array.prototype.forEach.call(container.querySelectorAll(".pill"), function (btn) {
        var active = btn.dataset.value === state[key];
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-checked", String(active));
      });
    });
  }

  function applyRecommendationInputs(inputs) {
    if (!inputs) return;
    if (typeof inputs.heightCm === "number") state.heightCm = clampVal(inputs.heightCm, 100, 230);
    if (typeof inputs.weightKg === "number") state.weightKg = clampVal(inputs.weightKg, 25, 180);
    ["waveSize", "style", "level", "material", "fitness"].forEach(function (key) {
      if (inputs[key] != null) state[key] = inputs[key];
    });
    syncHeightDisplay();
    syncWeightDisplay();
    syncPillActiveStates();
    update();
  }

  window.App = { applyRecommendationInputs: applyRecommendationInputs };

  function init() {
    el.heightSlider = q("height-slider");
    el.heightNumber = q("height-input");
    el.heightReadout = q("height-readout");
    el.heightUnitLabel = q("height-unit-label");
    el.weightSlider = q("weight-slider");
    el.weightNumber = q("weight-input");
    el.weightReadout = q("weight-readout");
    el.weightUnitLabel = q("weight-unit-label");
    el.volumeValue = q("volume-value");
    el.primaryCard = q("primary-card");
    el.altCard = q("alt-card");
    el.silhouetteContainer = q("silhouette-container");
    el.silhouettePersonLabel = q("silhouette-person-label");
    el.silhouetteBoardLabel = q("silhouette-board-label");
    el.regionSelect = q("region-select");

    Region.init(I18N.getLocale());
    populateRegionSelect();
    bindRegionSelect();

    applyStaticI18n();
    bindLangToggle();
    buildAllPillGroups();

    el.heightSlider.addEventListener("input", function () {
      onHeightChange(el.heightSlider.value);
    });
    el.heightNumber.addEventListener("input", function () {
      onHeightChange(el.heightNumber.value);
    });
    el.weightSlider.addEventListener("input", function () {
      onWeightChange(el.weightSlider.value);
    });
    el.weightNumber.addEventListener("input", function () {
      onWeightChange(el.weightNumber.value);
    });

    bindUnitToggle();
    syncHeightDisplay();
    syncWeightDisplay();
    update();

    var canvas = q("bio-bg");
    if (canvas && window.BioBackground) {
      window.BioBackground.init(canvas);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
