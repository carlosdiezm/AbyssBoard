/*
 * Best-effort in-memory rate limit. Resets on cold start and is per-instance
 * (Vercel can run multiple warm instances concurrently), so this only guards
 * against accidental hammering (e.g. a buggy retry loop), not determined abuse.
 * Kept in its own module so it can be swapped for a real distributed limiter
 * (e.g. Upstash Redis) later without touching api/chat.js.
 */
"use strict";

var WINDOW_MS = 60 * 1000;
var MAX_REQUESTS_PER_WINDOW = 10;

var hits = new Map();

function isRateLimited(key) {
  var now = Date.now();
  var entry = hits.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(key, { windowStart: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}

function clientKey(req) {
  var forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

module.exports = { isRateLimited: isRateLimited, clientKey: clientKey };
