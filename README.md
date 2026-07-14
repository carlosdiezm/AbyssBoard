<div align="center">

# 🌊 AbyssBoard

**Find the surfboard shape & length built for you — glowing up from the depths.**

Tell it your height, weight, wave conditions, style and level. It hands back a
board archetype, dimensions and volume — plus a visual size check of you
standing next to your board, and a chat with an AI shop manager if you'd
rather talk it through than move sliders.

### 🔗 [Try it live → abyssboard.vercel.app](https://abyssboard.vercel.app)

[![Live vibe](https://img.shields.io/badge/vanilla-HTML%2FCSS%2FJS-3fd2ff?style=for-the-badge)](#-how-it-was-made)
[![Languages](https://img.shields.io/badge/i18n-EN%20%C2%B7%20ES%20%C2%B7%20PT%20%C2%B7%20JA-7fb6ff?style=for-the-badge)](#-multilingual)
[![Chat](https://img.shields.io/badge/chat-AI%20shop%20manager-5ee8d9?style=for-the-badge)](#-or-just-ask-the-shop-manager)

![AbyssBoard screenshot](docs/screenshot.png)

</div>

---

## ✨ What it does

Answer a few questions and AbyssBoard works out:

- 🎯 **Target volume** (litres of foam) — the single number that matters most
  when picking a board, tuned to your skill level, paddle fitness, board
  material and the waves you actually ride.
- 🏄 **A recommended board shape** — picked from 8 real archetypes (soft-top,
  funboard, fish, groveler, shortboard, step-up, gun, longboard), plus a solid
  alternative in case the top pick isn't quite your vibe.
- 📐 **Real dimensions** — length, width and thickness, solved to hit your
  target volume with realistic, shaper-accurate proportions.
- 🧍 **A size-check silhouette** — your body next to the board's actual
  outline, drawn to the same real-world scale, so you can *see* the fit
  instead of just reading numbers off a chart.

## 🎨 Board outlines that actually look like boards

Every archetype's outline is traced from hand-drawn reference shapes — real
rail lines, real nose/tail treatments — not a generic parametric blob.
Swallow tails actually notch, pintails actually pinch to a point, and each
shape glows with a soft neon outline that matches the app's bioluminescent,
"glowing up from the depths" theme.

## 💬 Or just ask the shop manager

Not a slider person? Open the chat widget and talk to an AI playing an expert
surf-shop-manager persona instead. It asks about your height, weight, waves
and style one question at a time, like texting a real person — and it never
makes up board numbers on its own. Once it has what it needs, it hands your
answers to the exact same sizing engine the sliders use, so the chat and the
sliders always agree. One tap pushes its pick straight into the sliders and
silhouette.

## 🛒 Where to buy

Every recommendation comes with region-aware shopping links: surf shops near
you, a web search, and Amazon for your local marketplace — guessed instantly
from your timezone (no permission prompt) and overridable from a dropdown.
These are always live search links, never a hardcoded list of shops that can
go stale.

## 🌐 Multilingual

Fully localised in **English, Español, Português and 日本語** — every label,
board description and chat reply included. Auto-detects your browser
language on first visit and switches instantly, no reload.

## 📏 How the numbers work

- **Volume** starts from `weight × skill multiplier` (the Guild-factor
  formula), then nudged for paddle fitness, board material buoyancy, wave
  size and riding style.
- **Shape** is chosen by scoring every archetype on wave-size/style fit plus
  how close its *typical* proportions land to your target volume — so a
  low-volume intermediate in small, fun surf gets steered toward a fish
  rather than an oversized funboard, even if both nominally fit the tags.
- **Length/width/thickness** are solved backwards from the target volume
  using each archetype's realistic ratios, with a little length flex before
  width has to do all the work, then clamped to sane ranges.

All estimates only — every shaper's outline differs. Use this as a starting
point and fine-tune with your local surf shop or shaper.

---

## 🧩 How it was made

AbyssBoard's core — sliders, silhouette, recommendation engine, i18n — is
**vanilla HTML/CSS/JS with zero framework and zero build step**. No React, no
bundler; the recommendation math, board-outline renderer and language
dictionary are each a small, dependency-free script.

The chat assistant is the one part with a backend: a single serverless
function calls a free Hugging Face-hosted model to hold the conversation, but
the model is deliberately kept on a short leash — it only gathers rider
details and never invents a board number itself. Once it has enough
information it hands those inputs to the *exact same* sizing engine the
sliders run on the client, so a chat answer and a slider answer for the same
inputs are always identical. The whole thing is deployed on Vercel.

---

<div align="center">

Made by [carlosdiezm](https://github.com/carlosdiezm)

</div>
