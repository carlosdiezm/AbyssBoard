/*
 * POST /api/chat — conversational surf-shop-manager assistant.
 * The LLM only gathers info and chats; real board numbers always come from
 * recommend.js (the same engine the slider UI uses), never from the model.
 */
"use strict";

var InferenceClient = require("@huggingface/inference").InferenceClient;
var R = require("../js/recommend.js");
var BD = require("../js/boardData.js");
var I18N = require("../js/i18n.js");
var RateLimit = require("./_rateLimit.js");

// Ungated (no license click-through) and confirmed to have a live Inference
// Provider (featherless-ai) as of this writing. HF's free-tier model/provider
// availability shifts over time - if this 502s again, check
// https://huggingface.co/api/models/{model}?expand[]=inferenceProviderMapping
// for a model with at least one "status":"live" entry, and swap via HF_MODEL.
var MODEL = process.env.HF_MODEL || "microsoft/Phi-3-mini-4k-instruct";
var MAX_MESSAGES = 40;
var MAX_MESSAGE_CHARS = 4000;
var MAX_BODY_BYTES = 32 * 1024;

var MATERIALS = ["pu", "epoxy", "either"];
var FITNESS_LEVELS = ["low", "average", "high"];

var LOCALE_NAMES = {
  en: "English",
  es: "Spanish (Español)",
  pt: "Portuguese (Português)",
  ja: "Japanese (日本語)"
};

function buildSystemPrompt(locale) {
  var languageName = LOCALE_NAMES[locale] || LOCALE_NAMES.en;
  var example = JSON.stringify({
    heightCm: 175,
    weightKg: 75,
    waveSize: "small",
    style: "fun",
    level: "intermediate",
    material: "either",
    fitness: "average"
  });

  return [
    "You are the expert shop manager at AbyssBoard, an experienced, friendly local",
    "surf shop owner who has fitted hundreds of riders to boards. Warm, a little",
    "playful, never condescending to beginners, never showing off jargon to seem smart.",
    "",
    "CONVERSATION STYLE — this is a chat widget, it must feel like texting, not a form:",
    "- Ask about exactly ONE missing field per message. Never bundle two questions into",
    "  one reply, never dump a checklist.",
    "- One or two short sentences per message, occasionally three. Never a long paragraph.",
    "- Before you write anything, re-read the whole conversation above. Never ask about a",
    "  field the visitor already told you, even a few messages ago — track it in your head.",
    "- Acknowledge what they just said in a few words before asking the next thing, like a",
    "  real person texting back, not a bot restating a form.",
    "",
    "Respond in " + languageName + ", regardless of what language the visitor writes in,",
    "unless they explicitly ask you to switch languages.",
    "",
    "You need these rider details, gathered ONLY from what the visitor actually types in",
    "this conversation:",
    "- heightCm: rider height in centimetres (accept imperial and convert it yourself),",
    "  valid range 100-230",
    "- weightKg: rider weight in kilograms (accept imperial and convert), valid range 25-180",
    "- waveSize: one of " + BD.WAVE_SIZES.join(", "),
    "- style: one of " + BD.STYLES.join(", "),
    "- level: one of " + BD.LEVELS.join(", "),
    "- material (optional, default \"either\"): one of " + MATERIALS.join(", "),
    "- fitness (optional, default \"average\"): one of " + FITNESS_LEVELS.join(", "),
    "",
    "NEVER GUESS OR ASSUME A VALUE. heightCm, weightKg, waveSize, style and level must",
    "each come from an explicit statement by the visitor in this conversation — not a",
    "default, not a typical rider, not a number that 'sounds about right'. If any of those",
    "five is still missing, your entire reply must be a single question asking for it (plus",
    "a short acknowledgement of their last message) — do not include the fenced block below",
    "yet. material and fitness are the only two allowed to fall back to their defaults",
    "(\"either\" / \"average\") if the visitor never mentions them.",
    "",
    "CRITICAL RULE: you must never state a specific board name, length, width,",
    "thickness or volume number from your own knowledge — those numbers come from the",
    "shop's real sizing engine, not from you. Only once heightCm, weightKg, waveSize,",
    "style and level have ALL been explicitly stated by the visitor, end your reply with a",
    "fenced block in exactly this format (using the real values they gave you):",
    "",
    "```recommend",
    example,
    "```",
    "",
    "If the visitor asks a general surf/board question that doesn't need specific",
    "dimensions (e.g. the difference between PU and epoxy construction), you may answer",
    "conversationally without emitting the block. Politely steer off-topic requests back",
    "to surfboard sizing."
  ].join("\n");
}

var RECOMMEND_BLOCK_RE = /```recommend\s*([\s\S]*?)```/i;

function extractRecommendBlock(raw) {
  var text = raw || "";
  var match = RECOMMEND_BLOCK_RE.exec(text);
  if (!match) {
    return { visibleText: text.trim(), extracted: null };
  }
  var visibleText = (text.slice(0, match.index) + text.slice(match.index + match[0].length)).trim();
  var extracted = null;
  try {
    extracted = JSON.parse(match[1].trim());
  } catch (e) {
    extracted = null; // fail open — treat as if the model hadn't emitted a block
  }
  return { visibleText: visibleText, extracted: extracted };
}

function inRange(value, min, max) {
  return typeof value === "number" && isFinite(value) && value >= min && value <= max;
}

function validateExtractedInputs(extracted) {
  if (!extracted || typeof extracted !== "object") {
    return { inputs: null, error: "not an object" };
  }
  if (!inRange(extracted.heightCm, 100, 230)) return { inputs: null, error: "heightCm out of range" };
  if (!inRange(extracted.weightKg, 25, 180)) return { inputs: null, error: "weightKg out of range" };
  if (BD.WAVE_SIZES.indexOf(extracted.waveSize) === -1) return { inputs: null, error: "invalid waveSize" };
  if (BD.STYLES.indexOf(extracted.style) === -1) return { inputs: null, error: "invalid style" };
  if (BD.LEVELS.indexOf(extracted.level) === -1) return { inputs: null, error: "invalid level" };

  var material = MATERIALS.indexOf(extracted.material) !== -1 ? extracted.material : "either";
  var fitness = FITNESS_LEVELS.indexOf(extracted.fitness) !== -1 ? extracted.fitness : "average";

  return {
    inputs: {
      heightCm: extracted.heightCm,
      weightKg: extracted.weightKg,
      waveSize: extracted.waveSize,
      style: extracted.style,
      level: extracted.level,
      material: material,
      fitness: fitness
    },
    error: null
  };
}

function validateRequestBody(body) {
  if (!body || !Array.isArray(body.messages)) return "messages must be an array";
  if (body.messages.length === 0) return "messages must not be empty";
  if (body.messages.length > MAX_MESSAGES) return "too many messages";
  for (var i = 0; i < body.messages.length; i++) {
    var m = body.messages[i];
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") {
      return "invalid message at index " + i;
    }
    if (m.content.length > MAX_MESSAGE_CHARS) return "message too long at index " + i;
  }
  return null;
}

module.exports = async function handler(req, res) {
  // TEMP DEBUG WRAPPER — remove once the 502 root cause is found. Surfaces the
  // real error in the response body instead of Vercel's opaque failure page.
  try {
    return await handleChat(req, res);
  } catch (e) {
    res.status(502).json({ error: "unhandled: " + (e && e.message), stack: e && e.stack });
  }
};

async function handleChat(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  var rawBody = req.body;
  if (typeof rawBody === "string") {
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      res.status(400).json({ error: "request body too large" });
      return;
    }
    try {
      rawBody = JSON.parse(rawBody);
    } catch (e) {
      res.status(400).json({ error: "invalid JSON body" });
      return;
    }
  }

  var validationError = validateRequestBody(rawBody);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  var clientKey = RateLimit.clientKey(req);
  if (RateLimit.isRateLimited(clientKey)) {
    res.status(429).json({ error: "too many requests, please slow down" });
    return;
  }

  var locale = I18N.LOCALES.indexOf(rawBody.locale) !== -1 ? rawBody.locale : "en";

  var hf = new InferenceClient(process.env.HF_TOKEN);
  var completion;
  try {
    completion = await hf.chatCompletion({
      model: MODEL,
      // No provider pinned - "auto" (the SDK default) routes to whichever
      // Inference Provider actually serves this model right now, under the
      // account's free monthly credits. HF no longer hosts general chat
      // models on its own "hf-inference" backend, so pinning to it 404s.
      messages: [{ role: "system", content: buildSystemPrompt(locale) }].concat(rawBody.messages),
      max_tokens: 400,
      temperature: 0.6
    });
  } catch (e) {
    // TEMP DEBUG: real error message included below the line — remove "debug" once diagnosed.
    res.status(502).json({ error: "the shop manager is unavailable right now, please try again", debug: e && e.message });
    return;
  }

  var choice = completion && completion.choices && completion.choices[0];
  var raw = choice && choice.message && choice.message.content;
  if (typeof raw !== "string") {
    res.status(502).json({ error: "the shop manager is unavailable right now, please try again", debug: "no content in completion: " + JSON.stringify(completion).slice(0, 500) });
    return;
  }

  var extraction = extractRecommendBlock(raw);
  var recommendation = null;

  if (extraction.extracted) {
    var validated = validateExtractedInputs(extraction.extracted);
    if (!validated.error) {
      // I18N.setLocale + R.recommend must stay synchronous back-to-back: I18N's
      // currentLocale is shared module-level state, and an await in between could
      // let a concurrent request's locale leak into this one.
      I18N.setLocale(locale);
      recommendation = R.recommend(validated.inputs);
      recommendation.inputsUsed = validated.inputs;
    }
  }

  res.status(200).json({
    reply: extraction.visibleText || "...",
    recommendation: recommendation
  });
}

// Exposed for local unit testing only (see scratchpad test scripts) — Vercel
// just calls module.exports as a function and ignores extra properties on it.
module.exports._internal = {
  buildSystemPrompt: buildSystemPrompt,
  extractRecommendBlock: extractRecommendBlock,
  validateExtractedInputs: validateExtractedInputs,
  validateRequestBody: validateRequestBody
};
