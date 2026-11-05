// Customer review page: rate → (optional) AI draft from the customer's own
// input → copy & post on Google themselves, or send private feedback.
// Both options are shown to every customer, whatever their rating (Google
// does not allow review gating).
(() => {
  const cfg = window.REVYNE;
  const app = document.getElementById("app");

  const LANGUAGE_LABELS = {
    en: "English", hi: "हिन्दी", hinglish: "Hinglish", mr: "मराठी", gu: "ગુજરાતી", ta: "தமிழ்",
    te: "తెలుగు", kn: "ಕನ್ನಡ", ml: "മലയാളം", bn: "বাংলা", pa: "ਪੰਜਾਬੀ", or: "ଓଡ଼ିଆ", ur: "اردو",
  };
  const RATING_LABELS = ["", "Poor", "Not great", "Okay", "Good", "Excellent"];
  const ASPECTS = ["Service", "Staff", "Quality", "Value for money", "Cleanliness", "Ambience"];

  const state = {
    slug: slugFromUrl(),
    page: null,
    rating: 0,
    highlights: [],
    words: "",
    language: "en",
    draft: "",
    sessionId: null,
    draftsLeft: 3,
    busy: false,
    error: "",
  };

  function slugFromUrl() {
    const m = location.pathname.match(/^\/r\/([a-z0-9]{6,32})\/?$/);
    return m ? m[1] : new URLSearchParams(location.search).get("s");
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  async function rpcPage(slug) {
    const res = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/get_review_page`, {
      method: "POST",
      headers: { apikey: cfg.publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({ p_slug: slug }),
    });
    if (!res.ok) throw new Error("load failed");
    const rows = await res.json();
    return rows[0] || null;
  }

  async function call(action, payload) {
    const res = await fetch(`${cfg.supabaseUrl}/functions/v1/review-page`, {
      method: "POST",
      headers: { apikey: cfg.publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({ action, slug: state.slug, sessionId: state.sessionId, ...payload }),
    });
    const body = await res.json().catch(() => ({}));
    if (body.sessionId) state.sessionId = body.sessionId;
    return { ok: res.ok, status: res.status, body };
  }

  function reviewInput() {
    return { rating: state.rating, highlights: state.highlights, words: state.words, language: state.language };
  }

  // ── screens ────────────────────────────────────────────────────────────────

  function renderMessage(title, text) {
    app.innerHTML = `<div class="center"><h1>${esc(title)}</h1><p class="muted">${esc(text)}</p></div>`;
  }

  function renderRate() {
    const p = state.page;
    const chips = [...(p.products || []), ...ASPECTS];
    const languages = (p.review_languages || ["en"]).filter((c) => LANGUAGE_LABELS[c]);
    app.innerHTML = `
      <div class="brand"><img src="/logo.png" alt=""> RevYne</div>
      <h1>How was your visit to ${esc(p.name)}?</h1>
      <p class="muted">${esc([p.category, p.city].filter(Boolean).join(" · "))}</p>
      <div class="card">
        <div class="stars" role="radiogroup" aria-label="Your rating">
          ${[1, 2, 3, 4, 5].map((n) => `<button class="star ${n <= state.rating ? "on" : ""}" data-star="${n}" role="radio" aria-checked="${n === state.rating}" aria-label="${n} star${n > 1 ? "s" : ""}">★</button>`).join("")}
        </div>
        <div class="rating-label">${esc(RATING_LABELS[state.rating])}</div>
      </div>
      ${state.rating ? `
        <h2>What stood out? <span class="muted">(optional)</span></h2>
        <div class="chips">
          ${chips.map((c) => `<button class="chip" data-chip="${esc(c)}" aria-pressed="${state.highlights.includes(c)}">${esc(c)}</button>`).join("")}
        </div>
        <label for="words">In your own words <span class="muted">(optional)</span></label>
        <textarea id="words" maxlength="500" placeholder="A few words about your experience">${esc(state.words)}</textarea>
        ${languages.length > 1 ? `
          <label for="lang">Review language</label>
          <select id="lang">${languages.map((c) => `<option value="${c}" ${c === state.language ? "selected" : ""}>${LANGUAGE_LABELS[c]}</option>`).join("")}</select>` : ""}
        <button class="btn btn-primary" id="ai" ${state.busy ? "disabled" : ""}>${state.busy ? "Writing…" : "✨ Help me write it"}</button>
        <button class="btn btn-outline" id="self">I'll write it myself</button>
        ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
        <button class="btn btn-link" id="private">Send private feedback to the business instead</button>
      ` : ""}`;

    app.querySelectorAll("[data-star]").forEach((b) => b.addEventListener("click", () => {
      state.rating = Number(b.dataset.star);
      renderRate();
    }));
    app.querySelectorAll("[data-chip]").forEach((b) => b.addEventListener("click", () => {
      const c = b.dataset.chip;
      state.highlights = state.highlights.includes(c) ? state.highlights.filter((x) => x !== c) : [...state.highlights, c];
      b.setAttribute("aria-pressed", String(state.highlights.includes(c)));
    }));
    const words = app.querySelector("#words");
    if (words) words.addEventListener("input", () => { state.words = words.value; });
    const lang = app.querySelector("#lang");
    if (lang) lang.addEventListener("change", () => { state.language = lang.value; });
    const ai = app.querySelector("#ai");
    if (ai) ai.addEventListener("click", generate);
    const self = app.querySelector("#self");
    if (self) self.addEventListener("click", () => { state.draft = state.words; state.error = ""; renderCompose(); });
    const priv = app.querySelector("#private");
    if (priv) priv.addEventListener("click", renderFeedback);
  }

  async function generate() {
    state.busy = true;
    state.error = "";
    state.draft ? renderCompose() : renderRate(); // show "Writing…"
    try {
      const { ok, body } = await call("draft", reviewInput());
      if (ok && body.draft) {
        state.draft = body.draft;
        state.draftsLeft -= 1;
        state.busy = false;
        return renderCompose();
      }
      state.error = body.message || body.error || "Couldn't write a suggestion. You can write it yourself.";
      if (body.error === "limit") state.draftsLeft = 0;
    } catch {
      state.error = "No connection. You can write your review yourself.";
    }
    state.busy = false;
    state.draft ? renderCompose() : renderRate();
  }

  function renderCompose() {
    const google = state.page.google_review_url;
    app.innerHTML = `
      <h1>Your review</h1>
      <p class="muted">Edit anything you like — it should sound like you.</p>
      <label for="text">Review</label>
      <textarea id="text" maxlength="2000" rows="6" placeholder="Write about your experience">${esc(state.draft)}</textarea>
      ${state.sessionId && state.draftsLeft > 0 ? `<button class="btn btn-link" id="again" ${state.busy ? "disabled" : ""}>${state.busy ? "Writing…" : "↻ Try a different version"}</button>` : ""}
      ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
      ${google ? `
        <button class="btn btn-primary" id="post">Copy & post on Google</button>
        <div class="hint">We'll copy your review. On Google, tap the stars and paste it in the review box.</div>` : `
        <div class="hint">${esc(state.page.name)} isn't connected to Google yet. You can send your feedback to them privately.</div>`}
      <button class="btn btn-link" id="private">Send private feedback to the business instead</button>
      <button class="btn btn-link" id="back">← Back</button>`;

    const text = app.querySelector("#text");
    text.addEventListener("input", () => { state.draft = text.value; });
    const again = app.querySelector("#again");
    if (again) again.addEventListener("click", generate);
    const post = app.querySelector("#post");
    if (post) post.addEventListener("click", postOnGoogle);
    app.querySelector("#private").addEventListener("click", renderFeedback);
    app.querySelector("#back").addEventListener("click", () => { state.error = ""; renderRate(); });
  }

  async function postOnGoogle() {
    const text = state.draft.trim();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard can be blocked; the customer can still copy manually.
    }
    // Open Google first (popup blockers need a direct user action), then record.
    window.open(state.page.google_review_url, "_blank", "noopener");
    call("event", { type: "copied", text, ...reviewInput() }).then(() => call("event", { type: "opened_google" }));
    renderMessage("Thank you!", "Your review is copied. Paste it on Google and tap Post. It means a lot to the business.");
  }

  function renderFeedback() {
    app.innerHTML = `
      <h1>Message ${esc(state.page.name)} privately</h1>
      <p class="muted">Only the business owner sees this. It is not posted anywhere.</p>
      <label for="msg">Your message</label>
      <textarea id="msg" maxlength="1000" placeholder="What should they know?">${esc(state.words)}</textarea>
      <label for="cname">Your name <span class="muted">(optional)</span></label>
      <input id="cname" maxlength="80" autocomplete="name">
      <label for="contact">Phone or email, if you'd like a reply <span class="muted">(optional)</span></label>
      <input id="contact" maxlength="120" autocomplete="tel">
      <button class="btn btn-primary" id="send">Send privately</button>
      <p class="error" id="ferr" hidden></p>
      <button class="btn btn-link" id="back">← Back</button>`;

    app.querySelector("#back").addEventListener("click", () => (state.draft ? renderCompose() : renderRate()));
    app.querySelector("#send").addEventListener("click", async (e) => {
      const message = app.querySelector("#msg").value.trim();
      const err = app.querySelector("#ferr");
      if (!message) { err.textContent = "Please write a message."; err.hidden = false; return; }
      e.target.disabled = true;
      try {
        const { ok, body } = await call("feedback", {
          rating: state.rating || null,
          message,
          contactName: app.querySelector("#cname").value,
          contact: app.querySelector("#contact").value,
        });
        if (ok) return renderMessage("Sent — thank you", "The business owner will see your message.");
        err.textContent = body.error || "Couldn't send. Please try again.";
      } catch {
        err.textContent = "No connection. Please try again.";
      }
      err.hidden = false;
      e.target.disabled = false;
    });
  }

  // ── start ──────────────────────────────────────────────────────────────────

  (async () => {
    if (!state.slug) return renderMessage("Link not found", "Please scan the QR code again.");
    try {
      state.page = await rpcPage(state.slug);
    } catch {
      return renderMessage("No connection", "Check your internet and reload the page.");
    }
    if (!state.page) return renderMessage("Link not found", "This review link isn't valid. Please scan the QR code again.");
    state.language = (state.page.review_languages || ["en"])[0];
    document.title = `Review ${state.page.name}`;
    renderRate();
  })();
})();
