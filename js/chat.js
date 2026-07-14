(function () {
  "use strict";

  var I18N = window.I18N;

  var TURN_LIMIT = 20;

  var conversation = [];
  var userTurnCount = 0;
  var sending = false;

  var el = {};

  function q(id) {
    return document.getElementById(id);
  }

  function scrollToBottom() {
    el.messages.scrollTop = el.messages.scrollHeight;
  }

  function appendBubble(role, text) {
    var bubble = document.createElement("div");
    bubble.className = "chat-msg chat-msg--" + role;
    bubble.textContent = text;
    el.messages.appendChild(bubble);
    scrollToBottom();
    return bubble;
  }

  function appendThinkingBubble() {
    var bubble = document.createElement("div");
    bubble.className = "chat-msg chat-msg--thinking";
    bubble.textContent = I18N.t("chat.thinking");
    el.messages.appendChild(bubble);
    scrollToBottom();
    return bubble;
  }

  function statEl(label, value, sub) {
    var wrap = document.createElement("div");
    wrap.className = "stat";
    var l = document.createElement("span");
    l.className = "stat-label";
    l.textContent = label;
    var v = document.createElement("span");
    v.className = "stat-value";
    v.textContent = value;
    var s = document.createElement("span");
    s.className = "stat-sub";
    s.textContent = sub;
    wrap.appendChild(l);
    wrap.appendChild(v);
    wrap.appendChild(s);
    return wrap;
  }

  function renderRecommendation(recommendation) {
    var board = recommendation.primary;
    var wrap = document.createElement("div");
    wrap.className = "chat-recommendation";

    var heading = document.createElement("h4");
    heading.textContent = board.name;
    wrap.appendChild(heading);

    var tagline = document.createElement("p");
    tagline.className = "board-tagline";
    tagline.textContent = board.tagline;
    wrap.appendChild(tagline);

    var stats = document.createElement("div");
    stats.className = "board-stats";
    stats.appendChild(statEl(I18N.t("stat.length"), board.lengthFtIn, board.lengthCm + " cm"));
    stats.appendChild(statEl(I18N.t("stat.width"), board.widthInStr + '"', board.widthCm + " cm"));
    stats.appendChild(statEl(I18N.t("stat.thickness"), board.thicknessInStr + '"', board.thicknessCm + " cm"));
    stats.appendChild(statEl(I18N.t("stat.volume"), board.volumeL + " L", recommendation.targetVolumeL + " L " + I18N.t("volume.label").toLowerCase()));
    wrap.appendChild(stats);

    var applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "chat-apply-btn";
    applyBtn.textContent = I18N.t("chat.applyRecommendation");
    applyBtn.addEventListener("click", function () {
      if (window.App && window.App.applyRecommendationInputs) {
        window.App.applyRecommendationInputs(recommendation.inputsUsed);
      }
      applyBtn.textContent = I18N.t("chat.applied");
      applyBtn.disabled = true;
    });
    wrap.appendChild(applyBtn);

    return wrap;
  }

  function appendAssistantBubble(text, recommendation) {
    var bubble = document.createElement("div");
    bubble.className = "chat-msg chat-msg--assistant";
    var textNode = document.createElement("div");
    textNode.textContent = text;
    bubble.appendChild(textNode);
    if (recommendation) {
      bubble.appendChild(renderRecommendation(recommendation));
    }
    el.messages.appendChild(bubble);
    scrollToBottom();
  }

  function setSending(isSending) {
    sending = isSending;
    el.input.disabled = isSending;
    el.sendBtn.disabled = isSending || userTurnCount >= TURN_LIMIT;
  }

  async function sendMessage(text) {
    if (sending || !text) return;
    if (userTurnCount >= TURN_LIMIT) {
      appendBubble("error", I18N.t("chat.turnLimit"));
      return;
    }

    appendBubble("user", text);
    conversation.push({ role: "user", content: text });
    userTurnCount++;

    setSending(true);
    var thinkingBubble = appendThinkingBubble();

    try {
      var response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation, locale: I18N.getLocale() })
      });

      thinkingBubble.remove();

      if (response.status === 429) {
        appendBubble("error", I18N.t("chat.rateLimited"));
      } else if (!response.ok) {
        appendBubble("error", I18N.t("chat.error"));
      } else {
        var data = await response.json();
        conversation.push({ role: "assistant", content: data.reply });
        appendAssistantBubble(data.reply, data.recommendation);
      }
    } catch (e) {
      thinkingBubble.remove();
      appendBubble("error", I18N.t("chat.error"));
    }

    setSending(false);
    if (userTurnCount >= TURN_LIMIT) {
      appendBubble("error", I18N.t("chat.turnLimit"));
    }
  }

  function openPanel() {
    el.panel.classList.add("is-open");
    el.panel.setAttribute("aria-hidden", "false");
    el.fab.setAttribute("aria-expanded", "true");
    el.input.focus();
  }

  function closePanel() {
    el.panel.classList.remove("is-open");
    el.panel.setAttribute("aria-hidden", "true");
    el.fab.setAttribute("aria-expanded", "false");
  }

  function bindEvents() {
    el.fab.addEventListener("click", function () {
      if (el.panel.classList.contains("is-open")) {
        closePanel();
      } else {
        openPanel();
      }
    });
    el.close.addEventListener("click", closePanel);
    el.form.addEventListener("submit", function (evt) {
      evt.preventDefault();
      var text = el.input.value.trim();
      el.input.value = "";
      sendMessage(text);
    });
  }

  function init() {
    el.fab = q("chat-fab");
    el.panel = q("chat-panel");
    el.close = q("chat-close");
    el.messages = q("chat-messages");
    el.form = q("chat-form");
    el.input = q("chat-input");
    el.sendBtn = q("chat-send");

    bindEvents();
  }

  window.Chat = { init: init };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
