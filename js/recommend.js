/*
 * Surfboard recommendation engine.
 * Volume: Guild-factor formula (weight_kg * skill multiplier), adjusted for
 * fitness, material buoyancy, wave size and riding style.
 * Dimensions: solved from Volume(L) = Length(in) * Width(in) * Thickness(in) * shapeFactor / 1000,
 * using each archetype's typical length-from-height offset and thickness/width ratio.
 */
(function (global) {
  "use strict";

  var BD = global.BoardData || (typeof require !== "undefined" ? require("./boardData.js") : null);
  var I18N = global.I18N || (typeof require !== "undefined" ? require("./i18n.js") : null);

  // Looks up a translated string, falling back to the English data baked into
  // boardData.js if i18n hasn't loaded or the key is somehow missing.
  function tr(key, fallback) {
    if (!I18N) return fallback;
    var value = I18N.t(key);
    return value === key ? fallback : value;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function cmToIn(cm) {
    return cm / 2.54;
  }
  function inToCm(inches) {
    return inches * 2.54;
  }
  function kgToLb(kg) {
    return kg * 2.20462;
  }
  function lbToKg(lb) {
    return lb / 2.20462;
  }

  function formatFeetInches(totalInches) {
    var rounded = Math.round(totalInches);
    var feet = Math.floor(rounded / 12);
    var inches = rounded % 12;
    return feet + "'" + inches + '"';
  }

  function roundToEighth(inches) {
    return Math.round(inches * 8) / 8;
  }

  function formatEighthInches(inches) {
    var rounded = roundToEighth(inches);
    var whole = Math.floor(rounded);
    var frac = rounded - whole;
    var eighths = Math.round(frac * 8);
    if (eighths === 0) return whole.toString();
    if (eighths === 8) return (whole + 1).toString();
    var fracStrings = { 1: "1/8", 2: "1/4", 3: "3/8", 4: "1/2", 5: "5/8", 6: "3/4", 7: "7/8" };
    return (whole > 0 ? whole + " " : "") + fracStrings[eighths];
  }

  function computeTargetVolumeL(inputs) {
    var mult = BD.LEVEL_VOLUME_MULTIPLIER[inputs.level];
    var volume = inputs.weightKg * mult;

    // Fitness / paddle conditioning
    if (inputs.fitness === "low") volume *= 1.08;
    else if (inputs.fitness === "high") volume *= 0.94;

    // Material buoyancy (epoxy/EPS floats more for the same dims)
    if (inputs.material === "epoxy") volume -= 3;

    // Wave size & style
    volume *= BD.WAVE_VOLUME_FACTOR[inputs.waveSize];
    volume *= BD.STYLE_VOLUME_FACTOR[inputs.style];

    return clamp(volume, 12, 140);
  }

  // 1 cubic inch = 0.0163871 litres. A surfboard's foam only fills a fraction
  // of its L*W*T bounding box, hence the per-archetype shapeFactor (~0.46-0.60).
  var IN3_TO_LITRES = 0.0163871;

  function nominalLengthIn(archetype, inputs) {
    var heightIn = cmToIn(inputs.heightCm);
    var len = heightIn + archetype.lengthDeltaIn + BD.LEVEL_LENGTH_DELTA_IN[inputs.level] + BD.WAVE_LENGTH_NUDGE_IN[inputs.waveSize];
    return clamp(len, archetype.lengthRangeIn[0], archetype.lengthRangeIn[1]);
  }

  function nominalVolumeL(archetype, inputs) {
    var len = nominalLengthIn(archetype, inputs);
    var midWidth = (archetype.widthRangeIn[0] + archetype.widthRangeIn[1]) / 2;
    var midThickness = midWidth * archetype.thicknessRatio;
    return len * midWidth * midThickness * IN3_TO_LITRES * archetype.shapeFactor;
  }

  // Rewards archetypes whose typical proportions naturally land near the
  // rider's target volume, so e.g. a low-volume intermediate in fun/small
  // conditions is steered toward a fish rather than an oversized funboard
  // even when both match the wave-size/style tags equally.
  function scoreArchetype(archetype, inputs, targetVolumeL) {
    var score = 0;
    if (archetype.idealWaveSizes.indexOf(inputs.waveSize) !== -1) score += 2;
    if (archetype.idealStyles.indexOf(inputs.style) !== -1) score += 2;
    var nominal = nominalVolumeL(archetype, inputs);
    var volumeFit = -Math.abs(Math.log(targetVolumeL / nominal));
    score += volumeFit * 2;
    return score;
  }

  function pickArchetypes(inputs, targetVolumeL) {
    var candidates = BD.ARCHETYPES.filter(function (a) {
      return a.idealLevels.indexOf(inputs.level) !== -1;
    });
    if (candidates.length === 0) candidates = BD.ARCHETYPES.slice();

    var scored = candidates
      .map(function (a) {
        return { archetype: a, score: scoreArchetype(a, inputs, targetVolumeL) };
      })
      .sort(function (x, y) {
        if (y.score !== x.score) return y.score - x.score;
        return x.archetype.priority - y.archetype.priority;
      });

    var primary = scored[0].archetype;
    var alternative = null;
    for (var i = 1; i < scored.length; i++) {
      if (scored[i].archetype.id !== primary.id) {
        alternative = scored[i].archetype;
        break;
      }
    }
    if (!alternative) {
      var fallback = BD.ARCHETYPES.filter(function (a) {
        return a.id !== primary.id;
      })
        .map(function (a) {
          return { archetype: a, score: scoreArchetype(a, inputs, targetVolumeL) };
        })
        .sort(function (x, y) {
          return y.score - x.score;
        });
      alternative = fallback[0] ? fallback[0].archetype : primary;
    }
    return { primary: primary, alternative: alternative };
  }

  function computeDimensions(archetype, inputs, volumeL) {
    var baseLengthIn = nominalLengthIn(archetype, inputs);

    // Gentle length flex: if the rider's target volume is well above/below
    // what this archetype's nominal proportions would naturally give at the
    // height-based length, stretch/shrink length a little (within its
    // realistic range) before solving width, so width doesn't have to do
    // all the work and dimensions stay closer to the target volume.
    var nominal = nominalVolumeL(archetype, inputs);
    var volumeRatio = clamp(volumeL / nominal, 0.55, 1.8);
    var lengthIn = clamp(baseLengthIn * Math.pow(volumeRatio, 0.35), archetype.lengthRangeIn[0], archetype.lengthRangeIn[1]);

    var r = archetype.thicknessRatio;
    // Volume(L) = L * W * T * IN3_TO_LITRES * factor, T = W * r
    //  => W = sqrt(Volume / (L * IN3_TO_LITRES * factor * r))
    var widthIn = Math.sqrt(volumeL / (lengthIn * IN3_TO_LITRES * archetype.shapeFactor * r));
    widthIn = clamp(widthIn, archetype.widthRangeIn[0], archetype.widthRangeIn[1]);

    var thicknessIn = widthIn * r;
    thicknessIn = clamp(thicknessIn, archetype.thicknessRangeIn[0], archetype.thicknessRangeIn[1]);

    // Recompute the volume actually implied by the (possibly clamped) dimensions,
    // so displayed numbers are always internally consistent with each other.
    var impliedVolumeL = lengthIn * widthIn * thicknessIn * IN3_TO_LITRES * archetype.shapeFactor;

    return {
      lengthIn: lengthIn,
      widthIn: roundToEighth(widthIn),
      thicknessIn: roundToEighth(thicknessIn),
      volumeL: Math.round(impliedVolumeL * 10) / 10
    };
  }

  function buildBoardResult(archetype, inputs, targetVolumeL) {
    var dims = computeDimensions(archetype, inputs, targetVolumeL);
    return {
      id: archetype.id,
      name: tr("archetype." + archetype.id + ".name", archetype.name),
      tagline: tr("archetype." + archetype.id + ".tagline", archetype.tagline),
      description: tr("archetype." + archetype.id + ".description", archetype.description),
      tail: archetype.tail,
      nose: archetype.nose,
      outlineProfile: archetype.outlineProfile,
      outlineKey: archetype.outlineKey,
      lengthIn: dims.lengthIn,
      lengthFtIn: formatFeetInches(dims.lengthIn),
      lengthCm: Math.round(inToCm(dims.lengthIn)),
      widthIn: dims.widthIn,
      widthInStr: formatEighthInches(dims.widthIn),
      widthCm: Math.round(inToCm(dims.widthIn) * 10) / 10,
      thicknessIn: dims.thicknessIn,
      thicknessInStr: formatEighthInches(dims.thicknessIn),
      thicknessCm: Math.round(inToCm(dims.thicknessIn) * 10) / 10,
      volumeL: dims.volumeL
    };
  }

  function recommend(rawInputs) {
    var inputs = {
      heightCm: rawInputs.heightCm,
      weightKg: rawInputs.weightKg,
      waveSize: rawInputs.waveSize,
      style: rawInputs.style,
      level: rawInputs.level,
      material: rawInputs.material,
      fitness: rawInputs.fitness || "average"
    };

    var targetVolumeL = computeTargetVolumeL(inputs);
    var picks = pickArchetypes(inputs, targetVolumeL);

    var primaryResult = buildBoardResult(picks.primary, inputs, targetVolumeL);
    var alternativeResult = buildBoardResult(picks.alternative, inputs, targetVolumeL);

    var materialNote = null;
    if (inputs.level === "beginner" && inputs.material === "pu") {
      materialNote = tr(
        "materialNote.beginnerPu",
        "As a beginner, an epoxy/soft-top construction will float better, paddle easier and ding far less than traditional PU — worth considering even though PU is a fine, more affordable choice too."
      );
    } else if (inputs.material === "epoxy") {
      materialNote = tr(
        "materialNote.epoxy",
        "Epoxy/EPS construction floats a little higher, so we've trimmed the target volume slightly versus an equivalent PU board."
      );
    }

    return {
      targetVolumeL: Math.round(targetVolumeL * 10) / 10,
      primary: primaryResult,
      alternative: alternativeResult,
      materialNote: materialNote
    };
  }

  var Recommend = {
    recommend: recommend,
    computeTargetVolumeL: computeTargetVolumeL,
    formatFeetInches: formatFeetInches,
    formatEighthInches: formatEighthInches,
    roundToEighth: roundToEighth,
    cmToIn: cmToIn,
    inToCm: inToCm,
    kgToLb: kgToLb,
    lbToKg: lbToKg
  };

  global.Recommend = Recommend;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Recommend;
  }
})(typeof window !== "undefined" ? window : globalThis);
