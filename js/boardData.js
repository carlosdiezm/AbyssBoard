/*
 * Board archetype database.
 * Dimensions are derived at runtime from target volume; this file only holds
 * the shape parameters (ratios, ranges, tail/nose shapes) used by recommend.js.
 * Grounded in industry sizing conventions (see plan/README sources).
 */
(function (global) {
  "use strict";

  var LEVELS = ["beginner", "intermediate", "advanced", "expert"];
  var STYLES = ["fun", "technical", "aggressive", "classic"];
  var WAVE_SIZES = ["small", "medium", "large", "xlarge"];

  var WAVE_SIZE_INFO = {
    small: { label: "Small & mushy", range: "Knee – waist high (1–3 ft)" },
    medium: { label: "Medium & punchy", range: "Chest – head high (3–5 ft)" },
    large: { label: "Large & powerful", range: "Head – overhead (5–7 ft)" },
    xlarge: { label: "Big wave", range: "Well overhead (7 ft+)" }
  };

  var STYLE_INFO = {
    fun: { label: "Fun & cruisy", blurb: "glide, trim, easy speed" },
    technical: { label: "Technical / carving", blurb: "rail-to-rail, drawn-out lines" },
    aggressive: { label: "Aggressive / performance", blurb: "vertical, high-speed, air" },
    classic: { label: "Classic / noserider", blurb: "trim, footwork, cross-stepping" }
  };

  var LEVEL_INFO = {
    beginner: { label: "Beginner", blurb: "still learning to catch waves & pop up" },
    intermediate: { label: "Intermediate", blurb: "linking turns, comfortable paddling out" },
    advanced: { label: "Advanced", blurb: "confident in varied conditions, generating speed" },
    expert: { label: "Expert / competitive", blurb: "high performance, seeks specific tools" }
  };

  // Guild-factor style volume multipliers (Volume L = weight_kg * multiplier)
  var LEVEL_VOLUME_MULTIPLIER = {
    beginner: 0.66,
    intermediate: 0.46,
    advanced: 0.31,
    expert: 0.23
  };

  var LEVEL_LENGTH_DELTA_IN = { beginner: 6, intermediate: 0, advanced: -3, expert: -5 };
  var WAVE_LENGTH_NUDGE_IN = { small: -2, medium: 0, large: 2, xlarge: 5 };
  var WAVE_VOLUME_FACTOR = { small: 1.10, medium: 1.0, large: 0.92, xlarge: 0.86 };
  var STYLE_VOLUME_FACTOR = { aggressive: 0.92, technical: 0.97, fun: 1.08, classic: 1.15 };

  var ARCHETYPES = [
    {
      id: "softtop",
      name: "Beginner Soft-Top",
      tagline: "Stable, forgiving, built to catch you your first hundred waves",
      description: "A wide, thick, soft-decked board designed purely for stability, paddle power and safety while you learn to catch waves and pop up.",
      idealLevels: ["beginner"],
      idealStyles: [],
      idealWaveSizes: ["small", "medium"],
      lengthDeltaIn: 26,
      lengthRangeIn: [78, 108],
      shapeFactor: 0.60,
      thicknessRatio: 0.145,
      widthRangeIn: [19.5, 23.5],
      thicknessRangeIn: [2.4, 3.2],
      tail: "round",
      nose: "round",
      outlineProfile: "full",
      outlineKey: "funboard",
      priority: 0
    },
    {
      id: "funboard",
      name: "Funboard / Mini-Mal",
      tagline: "The all-rounder bridge between longboard glide and shortboard feel",
      description: "Extra length and volume for effortless paddling and wave-catching, with enough outline curve to still turn and have fun once you're up.",
      idealLevels: ["beginner", "intermediate"],
      idealStyles: ["fun", "technical"],
      idealWaveSizes: ["small", "medium"],
      lengthDeltaIn: 15,
      lengthRangeIn: [72, 102],
      shapeFactor: 0.58,
      thicknessRatio: 0.140,
      widthRangeIn: [19.5, 23.5],
      thicknessRangeIn: [2.3, 3.1],
      tail: "round",
      nose: "round",
      outlineProfile: "full",
      outlineKey: "funboard",
      priority: 1
    },
    {
      id: "fish",
      name: "Fish",
      tagline: "Wide, flat, fast — built to generate speed in weak surf",
      description: "A short, wide swallow-tail outline with a flatter rocker that plane early and carry speed through the flat, mushy sections of small waves.",
      idealLevels: ["intermediate", "advanced"],
      idealStyles: ["fun", "technical"],
      idealWaveSizes: ["small", "medium"],
      lengthDeltaIn: -5,
      lengthRangeIn: [58, 76],
      shapeFactor: 0.58,
      thicknessRatio: 0.145,
      widthRangeIn: [18.5, 21.5],
      thicknessRangeIn: [2.2, 2.8],
      tail: "swallow",
      nose: "round",
      outlineProfile: "full",
      outlineKey: "fish",
      priority: 2
    },
    {
      id: "groveler",
      name: "Performance Groveler",
      tagline: "A high-volume shortboard for making the most of small days",
      description: "A stubbier, thicker, higher-volume shortboard that still lets you surf aggressively and vertically even when the swell is small and soft.",
      idealLevels: ["advanced", "expert"],
      idealStyles: ["aggressive", "technical"],
      idealWaveSizes: ["small", "medium"],
      lengthDeltaIn: -2,
      lengthRangeIn: [62, 80],
      shapeFactor: 0.56,
      thicknessRatio: 0.140,
      widthRangeIn: [18, 20.5],
      thicknessRangeIn: [2.1, 2.7],
      tail: "squash",
      nose: "round",
      outlineProfile: "performance",
      outlineKey: "groveler",
      priority: 3
    },
    {
      id: "shortboard",
      name: "Performance Shortboard",
      tagline: "The high-performance standard for driving turns and vertical surfing",
      description: "A narrow, curvy, low-volume outline that rewards speed and commitment — built for tight arcs, rail-to-rail surfing and quick direction changes.",
      idealLevels: ["intermediate", "advanced", "expert"],
      idealStyles: ["aggressive", "technical"],
      idealWaveSizes: ["medium", "large"],
      lengthDeltaIn: -1,
      lengthRangeIn: [60, 78],
      shapeFactor: 0.52,
      thicknessRatio: 0.128,
      widthRangeIn: [17, 19.5],
      thicknessRangeIn: [1.9, 2.6],
      tail: "squash",
      nose: "pointed",
      outlineProfile: "performance",
      outlineKey: "shortboard",
      priority: 4
    },
    {
      id: "stepup",
      name: "Step-Up",
      tagline: "Extra length and control for when the swell jumps in size",
      description: "Between a shortboard and a gun: enough extra length and foam to paddle into faster, more powerful waves while keeping a performance-oriented outline.",
      idealLevels: ["advanced", "expert"],
      idealStyles: ["aggressive", "technical"],
      idealWaveSizes: ["large", "xlarge"],
      lengthDeltaIn: 8,
      lengthRangeIn: [72, 96],
      shapeFactor: 0.50,
      thicknessRatio: 0.125,
      widthRangeIn: [18, 20],
      thicknessRangeIn: [2.1, 2.7],
      tail: "round",
      nose: "pointed",
      outlineProfile: "gun",
      outlineKey: "stepup",
      priority: 5
    },
    {
      id: "gun",
      name: "Big Wave Gun",
      tagline: "Long, narrow and pointed for paddling into serious size",
      description: "A long, pulled-in, pintail board built to paddle fast enough to catch large, fast-moving faces and hold a line at speed down the line.",
      idealLevels: ["expert"],
      idealStyles: ["aggressive", "technical"],
      idealWaveSizes: ["xlarge", "large"],
      lengthDeltaIn: 14,
      lengthRangeIn: [76, 102],
      shapeFactor: 0.46,
      thicknessRatio: 0.120,
      widthRangeIn: [17, 19.5],
      thicknessRangeIn: [2.1, 2.8],
      tail: "pin",
      nose: "pointed",
      outlineProfile: "gun",
      outlineKey: "gun",
      priority: 6
    },
    {
      id: "longboard",
      name: "Longboard",
      tagline: "Effortless glide, trim and classic nose-riding style",
      description: "Long and full-volume with a gently curved outline, built for paddle power, early wave entry, smooth trim lines and walking the board.",
      idealLevels: ["beginner", "intermediate", "advanced", "expert"],
      idealStyles: ["classic", "fun"],
      idealWaveSizes: ["small", "medium"],
      lengthDeltaIn: 44,
      lengthRangeIn: [92, 120],
      shapeFactor: 0.55,
      thicknessRatio: 0.130,
      widthRangeIn: [21, 24],
      thicknessRangeIn: [2.5, 3.2],
      tail: "round",
      nose: "round",
      outlineProfile: "full",
      outlineKey: "longboard",
      priority: 1.5
    }
  ];

  global.BoardData = {
    LEVELS: LEVELS,
    STYLES: STYLES,
    WAVE_SIZES: WAVE_SIZES,
    WAVE_SIZE_INFO: WAVE_SIZE_INFO,
    STYLE_INFO: STYLE_INFO,
    LEVEL_INFO: LEVEL_INFO,
    LEVEL_VOLUME_MULTIPLIER: LEVEL_VOLUME_MULTIPLIER,
    LEVEL_LENGTH_DELTA_IN: LEVEL_LENGTH_DELTA_IN,
    WAVE_LENGTH_NUDGE_IN: WAVE_LENGTH_NUDGE_IN,
    WAVE_VOLUME_FACTOR: WAVE_VOLUME_FACTOR,
    STYLE_VOLUME_FACTOR: STYLE_VOLUME_FACTOR,
    ARCHETYPES: ARCHETYPES
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.BoardData;
  }
})(typeof window !== "undefined" ? window : globalThis);
