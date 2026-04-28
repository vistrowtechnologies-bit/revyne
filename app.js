const STORAGE_KEY = "revyne:mvp";
const LEGACY_STORAGE_KEY = "reviewpilot:mvp";

let slideDirection = null;
let bottomNavFromIndex = 0;
const navOrder = ["dashboard", "business", "reply", "pricing", "profile"];

const defaultState = {
  view: "dashboard",
  isLoggedIn: false,
  authMode: "signin",
  rating: 0,
  replyRating: 3,
  user: {
    name: "",
    email: "",
    mobile: "",
    provider: "",
    lastLogin: ""
  },
  business: {
    name: "Driver On Hire - Professional Driver Service in Pune",
    category: "Driver Service",
    city: "Pune",
    googleUrl: "https://www.google.com/search?q=google+business+review",
    services: "airport pickup, hourly driver, outstation trip, professional chauffeur",
    keywords: "professional driver, driver on hire, Pune driver service",
    language: "English",
    tone: "Professional",
    mobile: ""
  },
  stats: {
    scans: 184,
    generated: 91,
    copied: 63
  },
  suggestions: [],
  smartReplies: []
};

let state = loadState();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  const freshState = clone(defaultState);
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!saved) return freshState;

  try {
    const parsed = JSON.parse(saved);
    return {
      ...freshState,
      ...parsed,
      user: { ...freshState.user, ...(parsed.user || {}) },
      business: { ...freshState.business, ...(parsed.business || {}) },
      stats: { ...freshState.stats, ...(parsed.stats || {}) }
    };
  } catch {
    return freshState;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setView(view) {
  if (view === "public") {
    location.hash = "review";
    return;
  }

  const oldIdx = navOrder.indexOf(state.view);
  const newIdx = navOrder.indexOf(view);
  if (oldIdx !== -1 && newIdx !== -1 && newIdx !== oldIdx) {
    slideDirection = newIdx > oldIdx ? "right" : "left";
    bottomNavFromIndex = oldIdx;
  }

  state.view = view;
  saveState();
  render();
}

function updateBusinessField(field, value) {
  state.business[field] = value;
  if (field === "mobile") state.user.mobile = value;
  saveState();
}

function updateUserField(field, value) {
  state.user[field] = value;
  if (field === "mobile") state.business.mobile = value;
  saveState();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getReviewUrl() {
  return `${location.origin}${location.pathname}#review`;
}

function completeGoogleProfile() {
  const name = state.user.name.trim();
  const email = state.user.email.trim();
  const mobile = state.user.mobile.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const mobileValid = /^\d{10}$/.test(mobile);

  if (!name || !email || !mobile) {
    showToast("Please complete name, email, and mobile");
    return;
  }

  if (!emailValid) {
    showToast("Please enter a valid email");
    return;
  }

  if (!mobileValid) {
    showToast("Please enter a valid 10-digit mobile number");
    return;
  }

  state.user.name = name;
  state.user.email = email;
  state.user.mobile = mobile;
  state.user.provider = "google";
  state.user.lastLogin = new Date().toISOString();
  state.business.mobile = mobile;
  state.isLoggedIn = true;
  state.authMode = "signin";
  state.view = "dashboard";
  saveState();
  render();
}

function createReviewSuggestions() {
  if (!state.rating) {
    showToast("Please select a star rating first");
    return;
  }

  const business = state.business;
  const experience = document.querySelector("#reviewText")?.value.trim();
  const services = business.services.split(",").map((item) => item.trim()).filter(Boolean);
  const serviceLine = services.length ? services.slice(0, 2).join(" and ") : business.category;
  const base = experience || `I had a genuine experience with ${serviceLine}.`;
  const starText = state.rating >= 5 ? "excellent" : state.rating >= 4 ? "very good" : "helpful";
  const tone = business.tone || "Professional";
  const lang = business.language || "English";
  const name = business.name;
  const city = business.city;
  const cat = business.category.toLowerCase();

  if (lang === "Hindi") {
    state.suggestions = [
      `${name} ने ${city} में ${starText} सेवा प्रदान की। ${base} टीम पेशेवर और भरोसेमंद थी।`,
      `${name} के साथ अनुभव बहुत अच्छा रहा। ${cat} सेवा समय पर और विश्वसनीय थी।`,
      `मैं ${name} की सेवाओं से संतुष्ट हूं। इन्हें जरूर आजमाएं।`
    ];
  } else if (lang === "Hinglish") {
    state.suggestions = [
      `${name} ka experience bahut ${starText} tha. ${base} Team professional aur helpful thi.`,
      `${name} ki service ${city} mein really good hai. ${cat} ke liye yahan zaroor aayein.`,
      `Overall ${name} ne bahut accha kaam kiya. Main inhe definitely recommend karunga.`
    ];
  } else if (tone === "Friendly") {
    state.suggestions = [
      `Really happy with my experience at ${name}! ${base} The team was warm, helpful, and made everything easy.`,
      `${name} was great - friendly staff, reliable ${cat}, and smooth communication throughout.`,
      `Had a wonderful time dealing with ${name} in ${city}. Would definitely come back and recommend to friends!`
    ];
  } else if (tone === "Enthusiastic") {
    state.suggestions = [
      `Absolutely loved my experience with ${name}! ${base} Outstanding ${cat} - 100% recommend!`,
      `Wow, ${name} really delivered! ${starText.charAt(0).toUpperCase() + starText.slice(1)} service in ${city} - the team went above and beyond!`,
      `Best ${cat} experience I've had! ${name} is top-notch. Don't hesitate - just book them!`
    ];
  } else {
    state.suggestions = [
      `${name} provided ${starText} service in ${city}. ${base} The team was professional, responsive, and easy to coordinate with.`,
      `I am satisfied with my experience with ${name}. The ${cat} was reliable, punctual, and handled professionally.`,
      `Good experience overall. ${name} made the process simple, communicated clearly, and delivered dependable service. I would recommend them to others.`
    ];
  }

  state.stats.generated += 1;
  saveState();
  render();
}

function createSmartReplies() {
  const name = document.querySelector("#customerName")?.value.trim() || "there";
  const text = document.querySelector("#customerReview")?.value.trim() || "Thank you for the positive feedback.";
  const rating = state.replyRating;
  const business = state.business.name;

  if (rating <= 2) {
    state.smartReplies = [
      `Hi ${name}, thank you for sharing your feedback. We are sorry your experience did not meet expectations. Please contact us directly so we can understand what happened and make this right.`,
      `Thank you, ${name}. We take this seriously and appreciate you bringing it to our attention. Our team will review your feedback and work on improving the experience.`
    ];
  } else {
    state.smartReplies = [
      `Hi ${name}, thank you for your kind words and for choosing ${business}. We are glad you had a positive experience and truly appreciate your support.`,
      `Thank you, ${name}. We are happy to hear this feedback. It means a lot to our team, and we look forward to serving you again.`
    ];
  }

  if (text.length > 80) {
    state.smartReplies.push(`Hi ${name}, thank you for taking the time to write such detailed feedback. We appreciate your trust in ${business} and are glad we could help.`);
  }

  saveState();
  render();
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    const temp = document.createElement("textarea");
    temp.value = text;
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
  }

  state.stats.copied += 1;
  saveState();
  showToast("Copied");
}

function showToast(message) {
  const toast = document.querySelector(".copy-toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1400);
}

function navIcon(view) {
  const paths = {
    dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    business: "M12 3L2 9v12h7v-7h6v7h7V9L12 3zm0 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4z",
    reply: "M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0L3 17.25V21h3.75L20.71 7.04z",
    pricing: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z",
    profile: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 2 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
  };

  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="${paths[view] || ""}"/></svg>`;
}

function bottomNavItem(view, label) {
  const active = state.view === view;
  return `
    <button class="bnav-item ${active ? "active" : ""}" type="button" data-view="${view}">
      ${navIcon(view)}
      <span class="bnav-label">${label}</span>
    </button>
  `;
}

function appShell(content) {
  const activeBottomIndex = Math.max(0, navOrder.indexOf(state.view));

  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="topbar-main">
          <div class="brand">RevYne</div>
        </div>
        <nav class="nav">
          ${navButton("Dashboard", "dashboard")}
          ${navButton("Smart Reply", "reply")}
          ${navButton("Pricing", "pricing")}
          ${navButton("Order History", "orders")}
          ${navButton("Edit Business", "business")}
          ${navButton("Profile", "profile")}
          <button class="logout" type="button">Logout</button>
        </nav>
      </header>
      <div class="layout">
        <aside class="side-hero">
          <div>
            <h1>Smart Review AI</h1>
            <p>AI-powered review suggestions for modern businesses.</p>
          </div>
        </aside>
        <main class="main">${content}</main>
      </div>
      <nav class="bottom-nav" style="--from-index:${bottomNavFromIndex}; --active-index:${activeBottomIndex};">
        ${bottomNavItem("dashboard", "Home")}
        ${bottomNavItem("business", "Business")}
        ${bottomNavItem("reply", "AI Reply")}
        ${bottomNavItem("pricing", "Pricing")}
        ${bottomNavItem("profile", "Profile")}
      </nav>
    </div>
    <div class="copy-toast"></div>
  `;
}

function navButton(label, view) {
  return `<button class="${state.view === view ? "active" : ""}" type="button" data-view="${view}">${label}</button>`;
}

function dashboardPage() {
  const reviews = [
    { initials: "RK", name: "Rahul K.", time: "2 hours ago", platform: "Google", stars: 5, text: "Outstanding driver service! Very professional, punctual and courteous throughout the trip. Will definitely book again." },
    { initials: "PS", name: "Priya S.", time: "5 hours ago", platform: "Google", stars: 4, text: "Good experience overall. The driver was polite and the car was clean. Minor delay at pickup but otherwise smooth." },
    { initials: "AM", name: "Amit M.", time: "Yesterday", platform: "Google", stars: 5, text: "Excellent chauffeur service for our outstation trip. Driver knew the route well and was very responsible." }
  ];

  return `
    <section class="dash-wrap">
      <div class="dash-welcome">
        <h2 class="dash-title">Dashboard</h2>
        <p class="dash-sub">Welcome back. Your reputation is growing.</p>
      </div>

      <div class="dash-metrics">
        <div class="panel metric-wide">
          <div>
            <div class="metric-label">Average Rating</div>
            <div class="metric-big-row">
              <span class="metric-big">4.8</span>
              <span class="metric-stars">${"★".repeat(5)}</span>
            </div>
          </div>
          <div class="metric-icon-circle">↑</div>
        </div>
        <div class="panel metric-half">
          <div class="metric-label">Total Reviews</div>
          <div class="metric-num">${state.stats.scans + 1064}</div>
          <div class="metric-trend positive">+12 this week</div>
        </div>
        <div class="panel metric-half">
          <div class="metric-label">AI Replies</div>
          <div class="metric-num">${state.stats.generated + 801}</div>
          <div class="metric-trend brand">72% Auto-pilot</div>
        </div>
      </div>

      <div class="ai-spotlight">
        <div class="ai-spotlight-inner">
          <div class="ai-icon-box">✦</div>
          <div>
            <div class="ai-spotlight-title">Smart Reply Ready</div>
            <p class="ai-spotlight-sub">You have ${reviews.length} pending reviews. Generate professional draft replies instantly.</p>
          </div>
        </div>
        <button class="button full" type="button" data-view="reply" style="margin-top:14px;">Generate All Drafts</button>
      </div>

      <div class="recent-reviews">
        <div class="recent-header">
          <span class="recent-title">Recent Reviews</span>
          <button class="view-all" type="button">View All</button>
        </div>
        ${reviews.map((review) => reviewCard(review)).join("")}
      </div>

      <div class="panel review-link-panel">
        <h3>Your Review Link</h3>
        <p class="hint">Share on WhatsApp, SMS, invoices &amp; QR posters.</p>
        <input class="input" readonly value="${escapeHtml(getReviewUrl())}" style="margin:12px 0;" />
        <div class="option-row">
          <button class="button" type="button" data-copy="${escapeHtml(getReviewUrl())}">Copy Link</button>
          <button class="button ghost" type="button" data-view="public">Preview Page</button>
        </div>
      </div>
    </section>
  `;
}

function reviewCard({ initials, name, time, platform, stars, text }) {
  const filled = "★".repeat(stars);
  const empty = "★".repeat(5 - stars);

  return `
    <div class="panel review-card">
      <div class="review-card-top">
        <div class="review-card-meta">
          <div class="reviewer-avatar">${initials}</div>
          <div>
            <div class="reviewer-name">${name}</div>
            <div class="reviewer-meta">${time} · ${platform}</div>
          </div>
        </div>
        <div class="review-stars">
          <span class="stars-filled">${filled}</span><span class="stars-empty">${empty}</span>
        </div>
      </div>
      <p class="review-text">${text}</p>
      <div class="review-actions">
        <button class="button ghost review-reply-btn" type="button" data-view="reply">✦ Generate Reply</button>
        <button class="review-more-btn" type="button">...</button>
      </div>
    </div>
  `;
}

function businessPage() {
  const b = state.business;
  return `
    <section class="panel form-panel">
      <h1 class="page-title">Complete Your Profile</h1>
      <div class="field">
        <label for="field-mobile">Mobile Number</label>
        <input id="field-mobile" type="tel" class="input" maxlength="10" pattern="[0-9]{10}" placeholder="Enter 10-digit Mobile Number" value="${escapeHtml(b.mobile)}" data-field="mobile" />
      </div>
      <button class="button full" type="button" data-save-mobile>Save Mobile Number</button>

      <h2>Edit Business Profile</h2>
      <div class="required-note">* indicates required field</div>
      ${inputField("Business Name *", "name", b.name)}
      ${inputField("Category *", "category", b.category)}
      ${inputField("City", "city", b.city)}
      ${inputField("Google Review URL *", "googleUrl", b.googleUrl)}
      ${inputField("Services (comma separated)", "services", b.services)}
      ${inputField("Keywords (comma separated)", "keywords", b.keywords)}

      <div class="field">
        <label>Choose Language</label>
        <div class="option-row">
          ${chip("language", "English")}
          ${chip("language", "Hindi")}
          ${chip("language", "Hinglish")}
        </div>
      </div>

      <div class="field">
        <label>Default Tone</label>
        <div class="option-row">
          ${chip("tone", "Professional")}
          ${chip("tone", "Friendly")}
          ${chip("tone", "Enthusiastic")}
        </div>
      </div>

      <button class="button full" type="button" data-save-profile>Update Profile</button>
    </section>
  `;
}

function inputField(label, field, value) {
  return `
    <div class="field">
      <label for="field-${field}">${label}</label>
      <input id="field-${field}" class="input" placeholder="${label}" value="${escapeHtml(value)}" data-field="${field}" />
    </div>
  `;
}

function chip(field, value) {
  const active = state.business[field] === value ? "active" : "";
  return `<button class="chip ${active}" type="button" data-chip-field="${field}" data-chip-value="${value}">${value}</button>`;
}

function replyPage() {
  return `
    <h1 class="page-title">Smart Reply Generator</h1>
    <p class="page-subtitle">Create warm, professional Google Business replies in seconds</p>
    <section class="panel reply-card">
      <div class="field">
        <input id="customerName" class="input" placeholder="Customer Name" />
      </div>
      <label><strong>Rating</strong></label>
      <div class="stars">${stars("replyRating")}</div>
      <div class="field">
        <textarea id="customerReview" class="textarea" placeholder="Review Text"></textarea>
      </div>
      <button class="button full" type="button" data-generate-reply>Generate Smart Replies</button>
      ${suggestionList(state.smartReplies)}
    </section>
  `;
}

function stars(field) {
  const current = state[field];
  return Array.from({ length: 5 }, (_, index) => {
    const value = index + 1;
    return `<button class="star ${value <= current ? "active" : ""}" type="button" data-star-field="${field}" data-star="${value}">★</button>`;
  }).join("");
}

function pricingPage() {
  const plans = [
    ["Free", "₹0 / month", "", false],
    ["Pro Monthly", "₹149 / month", "₹449 / month", false],
    ["Pro 6-Month Plan", "₹449 / 6 months", "₹1499 / 6 months", false],
    ["Pro Yearly", "₹999 / year", "₹2499 / year", true]
  ];
  return `<section class="pricing-grid">${plans.map(planCard).join("")}</section>`;
}

function planCard([name, price, oldPrice, featured]) {
  const free = name === "Free";
  const features = [
    ["Unlimited QR Scans", true],
    [`AI Generated ${free ? "2" : "5"} Review Suggestions`, true],
    ["Editable Keywords", !free],
    ["Use Brand Name in Keyword", !free],
    ["Smart SEO Friendly Reply", !free],
    ["Multi-language Support", !free],
    ["Tone Customization", !free],
    ["Free Website", !free],
    ["Included Future Updates", !free]
  ];

  return `
    <article class="price-card ${featured ? "featured" : ""}">
      <h3>${name}</h3>
      <div class="price ${free ? "free" : ""}">
        ${oldPrice ? `<div class="old">${oldPrice}</div>` : ""}
        ${price}
      </div>
      ${features.map(([label, ok]) => `<div class="feature"><span class="${ok ? "yes" : "no"}">${ok ? "✓" : "×"}</span><span class="${ok ? "" : "disabled"}">${label}</span></div>`).join("")}
      ${free ? "" : `<button class="button full" type="button">Upgrade</button>`}
    </article>
  `;
}

function ordersPage() {
  return `
    <section class="panel form-panel">
      <h1 class="page-title">Order History</h1>
      <p class="page-subtitle">Payment records will appear here after Razorpay or Stripe is connected.</p>
      <div class="suggestion">
        <p><strong>Current plan:</strong> Free</p>
        <p><strong>Status:</strong> MVP demo mode</p>
      </div>
    </section>
  `;
}

function aboutPage() {
  return `
    <section class="about">
      <div class="about-hero">
        <h1>About RevYne</h1>
        <p>Helping businesses collect honest feedback and respond professionally.</p>
      </div>
      <div class="about-content">
        <h2>Who We Are</h2>
        <p>RevYne helps real customers turn real service experiences into clear, useful review wording.</p>
        <h2>Our Mission</h2>
        <p>Make review collection simpler without manipulating ratings, gating negative feedback, or creating fake reviews.</p>
        <h2>What Makes It Different?</h2>
        <p><strong>AI review suggestions:</strong> Drafts based on a customer's own experience.</p>
        <p><strong>Smart replies:</strong> Professional business responses for positive and negative reviews.</p>
        <p><strong>Multi-language support:</strong> English, Hindi, and Hinglish flows for local businesses.</p>
      </div>
    </section>
  `;
}

function publicReviewPage() {
  const b = state.business;
  return `
    <main class="public-body">
      <section class="panel public-card">
        <button class="button secondary" type="button" data-back-app style="min-height: 42px; margin-bottom: 12px;">Back to Dashboard</button>
        <div class="brand-big">RevYne</div>
        <p class="hint">Turn experiences into clear, honest reviews</p>
        <div class="business-box">
          <h1>${escapeHtml(b.name)}</h1>
          <p class="hint">Select stars for professional ideas</p>
        </div>
        <div class="stars">${stars("rating")}</div>
        <textarea id="reviewText" class="textarea" placeholder="Describe your genuine experience to see suggestions..."></textarea>
        <button class="button full" type="button" data-generate-review>Ready to Review</button>
        ${suggestionList(state.suggestions, true)}
        <p class="hint" style="margin-top: 28px;">Only post reviews based on your genuine experience.</p>
      </section>
      <div class="copy-toast"></div>
    </main>
  `;
}

function suggestionList(items, reviewMode = false) {
  if (!items.length) return "";

  return `
    <div class="suggestions">
      ${items.map((item) => `
        <div class="suggestion">
          <p>${escapeHtml(item)}</p>
          <div class="option-row">
            <button class="button secondary" type="button" data-copy="${escapeHtml(item)}">Copy</button>
            ${reviewMode ? `<button class="button ghost" type="button" data-open-google>Open Google Review</button>` : ""}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function authPage() {
  if (state.authMode === "google-profile") return googleProfileSetupPage();

  return `
    <div class="auth-body">
      <div class="auth-logo-area">
        <div class="auth-icon">
          <svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 4C12.06 4 4 11.16 4 20c0 4.42 2.04 8.42 5.34 11.28L8 40l9.1-3.02A19.7 19.7 0 0 0 22 37.6c9.94 0 18-7.16 18-16S31.94 4 22 4zm0 2c8.84 0 16 6.27 16 14S30.84 35.6 22 35.6c-2.1 0-4.12-.38-5.96-1.06l-.54-.2-6.5 2.16.86-5.58-.38-.42C6.8 28.04 6 24.1 6 20c0-8.73 7.16-14 16-14zm-5 9a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2H17zm0 5a1 1 0 0 0 0 2h7a1 1 0 0 0 0-2h-7z"/>
          </svg>
        </div>
        <div class="auth-brand-name">RevYne</div>
        <div class="auth-tagline">Smart AI Review Assistant for Businesses</div>
      </div>

      <div class="panel auth-card">
        <h2>Welcome Back</h2>
        <p class="auth-sub">Sign in to manage your reviews and replies</p>

        <button class="button-google" type="button" data-auth-google>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continue with Google
        </button>

        <div class="auth-divider">or</div>

        <button class="button full" type="button" data-auth-demo style="min-height:48px; font-size:14px;">
          Continue as Guest (Demo)
        </button>
      </div>

      <p class="auth-terms">By continuing, you agree to our Terms &amp; Privacy Policy</p>
    </div>
    <div class="copy-toast"></div>
  `;
}

function googleProfileSetupPage() {
  const u = state.user;
  const b = state.business;

  return `
    <div class="auth-body">
      <div class="auth-logo-area">
        <div class="auth-icon">
          <svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 4C12.06 4 4 11.16 4 20c0 4.42 2.04 8.42 5.34 11.28L8 40l9.1-3.02A19.7 19.7 0 0 0 22 37.6c9.94 0 18-7.16 18-16S31.94 4 22 4zm0 2c8.84 0 16 6.27 16 14S30.84 35.6 22 35.6c-2.1 0-4.12-.38-5.96-1.06l-.54-.2-6.5 2.16.86-5.58-.38-.42C6.8 28.04 6 24.1 6 20c0-8.73 7.16-14 16-14zm-5 9a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2H17zm0 5a1 1 0 0 0 0 2h7a1 1 0 0 0 0-2h-7z"/>
          </svg>
        </div>
        <div class="auth-brand-name">RevYne</div>
        <div class="auth-tagline">Complete your Google profile</div>
      </div>

      <div class="panel auth-card auth-profile-card">
        <h2>Set Up Your Profile</h2>
        <p class="auth-sub">This static MVP stores your login profile locally on this device.</p>

        <div class="field">
          <label for="google-name">Full Name *</label>
          <input id="google-name" class="input" placeholder="Your name" value="${escapeHtml(u.name)}" data-user-field="name" />
        </div>
        <div class="field">
          <label for="google-email">Email *</label>
          <input id="google-email" type="email" class="input" placeholder="you@example.com" value="${escapeHtml(u.email)}" data-user-field="email" />
        </div>
        <div class="field">
          <label for="google-mobile">Mobile Number *</label>
          <input id="google-mobile" type="tel" class="input" maxlength="10" pattern="[0-9]{10}" placeholder="10-digit mobile number" value="${escapeHtml(u.mobile || b.mobile)}" data-user-field="mobile" />
        </div>
        <div class="field">
          <label for="google-business">Business Name</label>
          <input id="google-business" class="input" placeholder="Business name" value="${escapeHtml(b.name)}" data-field="name" />
        </div>
        <div class="field">
          <label for="google-city">City</label>
          <input id="google-city" class="input" placeholder="City" value="${escapeHtml(b.city)}" data-field="city" />
        </div>

        <button class="button full" type="button" data-auth-save-profile>Continue to Dashboard</button>
        <button class="button secondary full" type="button" data-auth-back>Back</button>
      </div>
      <div class="copy-toast"></div>
    </div>
  `;
}

function profilePage() {
  const b = state.business;
  const u = state.user;
  const displayName = u.name || b.name || "Your Business";
  const displayEmail = u.email || "demo@revyne.app";
  const displayMobile = u.mobile || b.mobile;
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "U";
  const items = [
    { icon: "i", label: "About RevYne", view: "about", color: "#e5eeff", fg: "var(--blue)" },
    { icon: "↻", label: "Order History", view: "orders", color: "#e5eeff", fg: "var(--blue)" },
    { icon: "✉", label: "Contact Us", view: null, color: "#e5eeff", fg: "var(--blue)" },
    { icon: "≡", label: "Terms & Privacy", view: null, color: "#e5eeff", fg: "var(--blue)" }
  ];

  return `
    <section class="profile-page">
      <div class="profile-hero">
        <div class="profile-avatar">${escapeHtml(initial)}</div>
        <div class="profile-name">${escapeHtml(displayName)}</div>
        <div class="profile-email">${escapeHtml(displayEmail)}</div>
        ${displayMobile ? `<div class="profile-email">${escapeHtml(displayMobile)}</div>` : ""}
      </div>
      <div class="profile-menu-list">
        ${items.map(({ icon, label, view, color, fg }) => `
          <button class="profile-menu-item" type="button" ${view ? `data-view="${view}"` : ""}>
            <div class="pmi-icon" style="background:${color}; color:${fg}">${icon}</div>
            <span>${label}</span>
            <span class="pmi-arrow">›</span>
          </button>
        `).join("")}
        <button class="profile-menu-item pmi-logout" type="button" data-logout>
          <div class="pmi-icon" style="background:#ffe4e4; color:var(--danger)">→</div>
          <span>Logout</span>
          <span class="pmi-arrow">›</span>
        </button>
      </div>
    </section>
  `;
}

function currentPage() {
  if (location.hash === "#review") return publicReviewPage();
  if (!state.isLoggedIn) return authPage();

  const pages = {
    dashboard: dashboardPage,
    business: businessPage,
    reply: replyPage,
    pricing: pricingPage,
    orders: ordersPage,
    about: aboutPage,
    profile: profilePage
  };

  return appShell((pages[state.view] || dashboardPage)());
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      history.replaceState(null, "", location.pathname);
      setView(button.dataset.view);
    });
  });

  document.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("input", () => updateBusinessField(input.dataset.field, input.value));
  });

  document.querySelectorAll("[data-user-field]").forEach((input) => {
    input.addEventListener("input", () => updateUserField(input.dataset.userField, input.value));
  });

  document.querySelectorAll("[data-chip-field]").forEach((button) => {
    button.addEventListener("click", () => {
      updateBusinessField(button.dataset.chipField, button.dataset.chipValue);
      render();
    });
  });

  document.querySelectorAll("[data-star]").forEach((button) => {
    button.addEventListener("click", () => {
      state[button.dataset.starField] = Number(button.dataset.star);
      saveState();
      render();
    });
  });

  document.querySelector("[data-generate-review]")?.addEventListener("click", createReviewSuggestions);
  document.querySelector("[data-generate-reply]")?.addEventListener("click", createSmartReplies);

  document.querySelector("[data-save-mobile]")?.addEventListener("click", () => {
    const mobile = state.business.mobile.trim();
    if (!/^\d{10}$/.test(mobile)) {
      showToast("Please enter a valid 10-digit mobile number");
      return;
    }
    state.user.mobile = mobile;
    saveState();
    showToast("Mobile number saved");
  });

  document.querySelector("[data-save-profile]")?.addEventListener("click", () => {
    const b = state.business;
    if (!b.name.trim() || !b.category.trim() || !b.googleUrl.trim()) {
      showToast("Please fill in all required fields (Name, Category, Google URL)");
      return;
    }
    showToast("Profile updated");
  });

  document.querySelector("[data-back-app]")?.addEventListener("click", () => {
    history.replaceState(null, "", location.pathname);
    state.view = "dashboard";
    saveState();
    render();
  });

  document.querySelector("[data-auth-google]")?.addEventListener("click", () => {
    if (state.user.provider === "google" && state.user.email) {
      state.isLoggedIn = true;
      state.view = "dashboard";
      state.user.lastLogin = new Date().toISOString();
      saveState();
      render();
      return;
    }

    state.authMode = "google-profile";
    saveState();
    render();
  });

  document.querySelector("[data-auth-save-profile]")?.addEventListener("click", completeGoogleProfile);

  document.querySelector("[data-auth-back]")?.addEventListener("click", () => {
    state.authMode = "signin";
    saveState();
    render();
  });

  document.querySelector("[data-auth-demo]")?.addEventListener("click", () => {
    state.isLoggedIn = true;
    state.view = "dashboard";
    state.authMode = "signin";
    saveState();
    render();
  });

  document.querySelectorAll(".logout, [data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      state.isLoggedIn = false;
      state.authMode = "signin";
      state.view = "dashboard";
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", () => copyText(button.dataset.copy));
  });

  document.querySelectorAll("[data-open-google]").forEach((button) => {
    button.addEventListener("click", () => window.open(state.business.googleUrl, "_blank", "noopener"));
  });
}

function render() {
  const dir = slideDirection;
  slideDirection = null;
  document.querySelector("#app").innerHTML = currentPage();

  if (dir) {
    const main = document.querySelector(".main");
    if (main) main.classList.add(`slide-${dir}`);
  }

  bindEvents();
}

window.addEventListener("hashchange", render);
render();
