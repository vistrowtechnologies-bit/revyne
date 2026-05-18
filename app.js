const STORAGE_KEY = "revyne:mvp";
const LEGACY_STORAGE_KEY = "reviewpilot:mvp";
const ANALYTICS_SESSION_KEY = "revyne:analytics-session";

const INDIAN_LANGUAGES = [
  "Assamese", "Bengali", "Bodo", "Dogri", "English", "Gujarati",
  "Hindi", "Hinglish", "Kannada", "Kashmiri", "Konkani", "Maithili",
  "Malayalam", "Manipuri", "Marathi", "Nepali", "Odia", "Punjabi",
  "Sanskrit", "Santali", "Sindhi", "Tamil", "Telugu", "Urdu"
];

const THEMES = [
  { id: "default", label: "Default", c1: "#8127cf", c2: "#a200ba" },
  { id: "dark",    label: "Dark",    c1: "#312e81", c2: "#4c1d95" },
  { id: "blue",    label: "Blue",    c1: "#2563eb", c2: "#0ea5e9" },
  { id: "red",     label: "Red",     c1: "#dc2626", c2: "#ea580c" },
  { id: "green",   label: "Green",   c1: "#16a34a", c2: "#0d9488" }
];
const supabaseConfig = window.REVYNE_SUPABASE || {};
const hasSupabaseConfig = Boolean(
  window.supabase &&
  supabaseConfig.url &&
  supabaseConfig.publishableKey &&
  !supabaseConfig.publishableKey.includes("PASTE_YOUR")
);
const supabaseClient = hasSupabaseConfig
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.publishableKey)
  : null;
const PLAN_LIMITS = {
  free: {
    reviewGenerations: 20,
    replyGenerations: 20
  },
  pro: {
    reviewGenerations: 1000,
    replyGenerations: 1000
  },
  pro_max: {
    reviewGenerations: 2500,
    replyGenerations: 2500
  },
  pro_yearly: {
    reviewGenerations: 2500,
    replyGenerations: 2500
  }
};

const PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PROFILE_IMAGE_MAX_BYTES = 500 * 1024;

const BUSINESS_CATEGORIES = [
  { value: "Real Estate", typeLabel: "Property type", typePlaceholder: "plots, flats, villas, commercial spaces" },
  { value: "Restaurant", typeLabel: "Cuisine or order type", typePlaceholder: "dine-in, takeaway, biryani, thali" },
  { value: "Salon & Beauty", typeLabel: "Treatment type", typePlaceholder: "haircut, facial, bridal makeup" },
  { value: "Healthcare Clinic", typeLabel: "Consultation or treatment type", typePlaceholder: "dental, physiotherapy, eye checkup" },
  { value: "Optician & Optical Store", typeLabel: "Eyewear or lens type", typePlaceholder: "spectacles, contact lenses, sunglasses, progressive lenses" },
  { value: "Education & Coaching", typeLabel: "Course type", typePlaceholder: "NEET, JEE, spoken English, coding" },
  { value: "Car & Bike Service", typeLabel: "Vehicle or repair type", typePlaceholder: "car wash, detailing, battery, tyres" },
  { value: "Electronics & Appliances", typeLabel: "Device or appliance type", typePlaceholder: "AC, refrigerator, mobile, laptop" },
  { value: "Home Services", typeLabel: "Work type", typePlaceholder: "plumbing, painting, pest control, cleaning" },
  { value: "Travel & Transport", typeLabel: "Trip or vehicle type", typePlaceholder: "airport pickup, outstation, tempo traveller" },
  { value: "Hotel & Stay", typeLabel: "Room or stay type", typePlaceholder: "family room, banquet, business stay" },
  { value: "Fitness & Gym", typeLabel: "Program type", typePlaceholder: "weight loss, personal training, yoga" },
  { value: "Retail Store", typeLabel: "Shopping category", typePlaceholder: "clothing, footwear, groceries, accessories" },
  { value: "Jewellery", typeLabel: "Jewellery type", typePlaceholder: "gold, diamond, bridal, repair" },
  { value: "Event & Wedding Services", typeLabel: "Event type", typePlaceholder: "wedding, birthday, corporate event" },
  { value: "Legal & Finance", typeLabel: "Service type", typePlaceholder: "tax filing, loan, insurance, legal consultation" },
  { value: "IT & Digital Services", typeLabel: "Project type", typePlaceholder: "website, SEO, app, ads" },
  { value: "Driver Service", typeLabel: "Trip type", typePlaceholder: "hourly driver, outstation, airport pickup" },
  { value: "Other", typeLabel: "Type or requirement", typePlaceholder: "standard, premium, custom requirement" }
];

const CATEGORY_KEYWORDS = {
  "Real Estate": "real estate, property, plots, flats, villas, commercial spaces, property consultation, site visit, investment guidance",
  Restaurant: "restaurant, food, dining, takeaway, delivery, taste, service, hygiene, ambience, family restaurant",
  "Salon & Beauty": "salon, beauty, haircut, facial, makeup, grooming, bridal makeup, skincare, hair treatment",
  "Healthcare Clinic": "clinic, doctor, healthcare, consultation, treatment, appointment, patient care, diagnosis, hygiene",
  "Optician & Optical Store": "optician, optical store, eyeglasses, spectacles, sunglasses, contact lenses, eye checkup, lens fitting, frames, eyewear, vision care",
  "Education & Coaching": "coaching, classes, education, course, training, faculty, learning, exam preparation, student support",
  "Car & Bike Service": "car service, bike service, vehicle repair, maintenance, washing, detailing, tyres, battery, mechanic",
  "Electronics & Appliances": "electronics, appliances, mobile, laptop, AC, refrigerator, repair, installation, service, warranty",
  "Home Services": "home services, plumbing, painting, cleaning, pest control, electrician, repair, maintenance",
  "Travel & Transport": "travel, transport, cab, driver, airport pickup, outstation, tempo traveller, safe ride",
  "Hotel & Stay": "hotel, stay, rooms, hospitality, cleanliness, staff, location, family stay, business stay",
  "Fitness & Gym": "gym, fitness, workout, personal training, weight loss, yoga, trainer, equipment, health",
  "Retail Store": "retail store, shopping, products, customer service, quality, price, collection, local store",
  Jewellery: "jewellery, gold, diamond, silver, bridal jewellery, designs, hallmark, repair, trust",
  "Event & Wedding Services": "event services, wedding, decoration, planning, photography, catering, birthday, corporate event",
  "Legal & Finance": "legal service, finance, tax filing, insurance, loan, consultation, documentation, compliance",
  "IT & Digital Services": "IT services, website, app, SEO, digital marketing, software, ads, branding, technical support",
  "Driver Service": "driver service, hourly driver, outstation driver, airport pickup, safe driving, punctual, professional driver",
  Other: "customer service, quality, professional, reliable, helpful, value for money, trusted, local business"
};

let slideDirection = null;
let bottomNavFromIndex = 0;
let bottomNavShouldAnimate = false;
let currentSession = null;
let isApplyingSession = false;
let lastStatsLoadTime = 0;       // epoch ms — throttle dashboard stat refreshes
let publicReviewRequestId = null; // set after QR session saves, used to mark draft_copied
let isGeneratingReply = false;
let isGeneratingReview = false;
let analyticsSessionId = getAnalyticsSessionId();
let lastTrackedPageKey = "";
const navOrder = ["dashboard", "business", "reply", "gmb", "profile"];
const profileSubViews = ["about", "orders", "support", "adminSupport", "terms", "privacy", "pricing"];

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
    lastLogin: "",
    plan: "free",
    planStatus: "free",
    subscriptionId: "",
    customerId: "",
    planCurrentStart: "",
    planCurrentEnd: "",
    isAdmin: false
  },
  business: {
    id: "",
    publicToken: "",
    name: "",
    category: "",
    city: "",
    googleUrl: "",
    logo: "",
    services: "",
    serviceTypes: "",
    keywords: "",
    language: "English",
    tone: "Professional",
    mobile: "",
    ownerPlan: "free",
    ownerPlanStatus: "free",
    ownerPlanCurrentEnd: ""
  },
  stats: {
    scans: 0,
    generated: 0,
    copied: 0
  },
  dashboardStats: {
    totalReviews: 0,
    avgRating: 0,
    recentReviews: [],
    loaded: false
  },
  guestRepliesUsed: 0,
  showGuestLimitModal: false,
  suggestions: [],
  smartReplies: [],
  theme: "default",
  proLanguages: [],
  supportTickets: [],
  adminTickets: [],
  paymentEvents: [],
  adminPaymentEvents: [],
  adminTicketFilter: "open",
  checkoutNotice: "",
  reviewDraft: {
    service: "",
    product: "",
    experience: ""
  },
  replyDraft: {
    customerName: "",
    reviewText: ""
  },
  gmb: {
    connected: false,
    connecting: false,
    locationId: null,
    locationName: null,
    accountName: null,
    profile: null,
    reviews: [],
    healthScore: null,
    healthDetails: null,
    optimizations: [],
    lastSync: null,
    syncing: false,
    replyingTo: null,    // review id currently being replied to
    replyDraft: "",
    locationOptions: [], // list of locations shown in picker modal
    showLocationPicker: false
  }
};

let state = loadState();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function emptyBusiness(overrides = {}) {
  return {
    ...clone(defaultState.business),
    ...overrides
  };
}

function isDemoBusiness(business = state.business, stats = state.stats) {
  return !business?.id && !business?.publicToken && stats?.scans === 184 && stats?.generated === 91;
}

function hasBusinessProfile() {
  const b = state.business || {};
  return Boolean(b.id && b.publicToken && b.name && b.googleUrl);
}

function loadState() {
  const freshState = clone(defaultState);
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!saved) return freshState;

  try {
    const parsed = JSON.parse(saved);
    const merged = {
      ...freshState,
      ...parsed,
      user: { ...freshState.user, ...(parsed.user || {}) },
      business: { ...freshState.business, ...(parsed.business || {}) },
      stats: { ...freshState.stats, ...(parsed.stats || {}) },
      dashboardStats: { ...freshState.dashboardStats, loaded: false },
      guestRepliesUsed: parsed.guestRepliesUsed || 0,
      showGuestLimitModal: false,
      supportTickets: Array.isArray(parsed.supportTickets) ? parsed.supportTickets : [],
      adminTickets: Array.isArray(parsed.adminTickets) ? parsed.adminTickets : [],
      paymentEvents: Array.isArray(parsed.paymentEvents) ? parsed.paymentEvents : [],
      adminPaymentEvents: Array.isArray(parsed.adminPaymentEvents) ? parsed.adminPaymentEvents : [],
      adminTicketFilter: parsed.adminTicketFilter || freshState.adminTicketFilter,
      reviewDraft: { ...freshState.reviewDraft, ...(parsed.reviewDraft || {}) },
      replyDraft: { ...freshState.replyDraft, ...(parsed.replyDraft || {}) },
      gmb: {
        ...freshState.gmb,
        ...(parsed.gmb || {}),
        connecting: false,
        syncing: false,
        locationOptions: [],
        showLocationPicker: false,
        replyingTo: null,
        replyDraft: ""
      }
    };
    if (isDemoBusiness(merged.business, merged.stats)) {
      merged.business = emptyBusiness({
        mobile: merged.user.mobile || ""
      });
      merged.stats = clone(defaultState.stats);
      merged.suggestions = [];
      merged.smartReplies = [];
    }
    return merged;
  } catch {
    return freshState;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let _saveDebounceTimer = null;
function debouncedSaveState() {
  clearTimeout(_saveDebounceTimer);
  _saveDebounceTimer = setTimeout(saveState, 400);
}

function getAnalyticsSessionId() {
  const existing = localStorage.getItem(ANALYTICS_SESSION_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(ANALYTICS_SESSION_KEY, id);
  return id;
}

function getAnalyticsViewName() {
  if (isPublicReviewRoute()) return "public_review";
  if (!state.isLoggedIn && state.view !== "terms" && state.view !== "privacy") return "auth";
  return state.view || "dashboard";
}

function compactMetadata(metadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 160) : value])
  );
}

function trackEvent(eventName, metadata = {}, pageView = false) {
  if (!supabaseClient) return;

  const event = {
    user_id: currentSession?.user?.id || null,
    business_id: state.business?.id || null,
    session_id: analyticsSessionId,
    event_name: eventName,
    page_view: pageView,
    path: `${location.pathname}${location.hash || ""}`,
    view_name: getAnalyticsViewName(),
    referrer: document.referrer || null,
    metadata: compactMetadata({
      plan: state.user?.plan || "free",
      is_logged_in: Boolean(state.isLoggedIn),
      ...metadata
    })
  };

  supabaseClient
    .from("analytics_events")
    .insert(event)
    .then(({ error }) => {
      if (error) console.warn("Analytics event not saved:", error.message);
    });
}

function trackPageView() {
  const viewName = getAnalyticsViewName();
  const pageKey = `${viewName}:${location.pathname}${location.hash || ""}`;
  if (pageKey === lastTrackedPageKey) return;
  lastTrackedPageKey = pageKey;
  trackEvent("page_view", { view: viewName }, true);
}

function trackClientError(type, message, source = "") {
  trackEvent("client_error", {
    type,
    message: String(message || "Unknown error").slice(0, 220),
    source: String(source || "").slice(0, 160)
  });
}

function setCheckoutNotice(message) {
  state.checkoutNotice = message;
  saveState();
  if (state.view === "pricing") render();
}

function setView(view) {
  if (view === "public") {
    location.hash = "review";
    return;
  }

  if (state.view === view) return;

  const oldIdx = navOrder.indexOf(getBottomNavView(state.view));
  const newIdx = navOrder.indexOf(getBottomNavView(view));
  if (oldIdx !== -1 && newIdx !== -1 && newIdx !== oldIdx) {
    slideDirection = newIdx > oldIdx ? "right" : "left";
    bottomNavFromIndex = oldIdx;
    bottomNavShouldAnimate = true;
  }

  state.view = view;
  saveState();
  render();
}

function syncBottomNavPosition() {
  const activeIndex = navOrder.indexOf(getBottomNavView());
  bottomNavFromIndex = activeIndex === -1 ? 0 : activeIndex;
}

function getBottomNavView(view = state.view) {
  return profileSubViews.includes(view) ? "profile" : view;
}

function updateBusinessField(field, value) {
  if (field === "category") {
    const previousKeywords = state.business.keywords || "";
    state.business[field] = value;
    state.reviewDraft.product = "";
    state.business.keywords = getKeywordsForCategory(value, previousKeywords);
  } else {
    state.business[field] = field === "services" ? trimToFiveList(value) : value;
  }
  if (field === "mobile") state.user.mobile = value;
  debouncedSaveState();
}

function handleProfileImageUpload(file) {
  if (!file) return;
  if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
    showToast("Please choose a JPG, PNG, or WebP image");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const originalDataUrl = typeof reader.result === "string" ? reader.result : "";
    if (!originalDataUrl) { showToast("Could not read image"); return; }

    // Always compress through canvas to keep logo small
    const img = new Image();
    img.onload = () => {
      const MAX_DIM = 400; // max width/height in px
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;

      // Scale down if larger than MAX_DIM
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w >= h) { h = Math.round((h / w) * MAX_DIM); w = MAX_DIM; }
        else { w = Math.round((w / h) * MAX_DIM); h = MAX_DIM; }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      // Try quality steps until under 500 KB
      let quality = 0.85;
      let dataUrl = canvas.toDataURL("image/jpeg", quality);
      while (dataUrl.length > PROFILE_IMAGE_MAX_BYTES * 1.37 && quality > 0.3) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }

      // Final size check (base64 is ~1.37× the byte size)
      const approxBytes = Math.round(dataUrl.length * 0.75);
      if (approxBytes > PROFILE_IMAGE_MAX_BYTES) {
        showToast("Image is too large to compress. Please use a smaller photo.");
        return;
      }

      state.business.logo = dataUrl;
      saveState();
      showToast("✓ Profile picture updated");
      render();
    };
    img.onerror = () => showToast("Could not process this image. Try a different file.");
    img.src = originalDataUrl;
  };
  reader.onerror = () => showToast("Could not read image");
  reader.readAsDataURL(file);
}

function updateUserField(field, value) {
  state.user[field] = value;
  if (field === "mobile") state.business.mobile = value;
  debouncedSaveState();
}

function preserveBusinessFromDom() {
  if (state.view !== "business") return;
  document.querySelectorAll("[data-field]").forEach(input => {
    const field = input.dataset.field;
    if (!field) return;
    const val = input.value ?? "";
    if (field === "category" && state.business.category !== val) {
      updateBusinessField(field, val);
    } else if (field !== "category") {
      state.business[field] = field === "services" ? trimToFiveList(val) : val;
      if (field === "mobile") state.user.mobile = val;
    }
  });
  saveState();
}

function preserveReplyDraftFromDom() {
  if (state.view !== "reply") return;
  const customerName = document.querySelector("#customerName")?.value;
  const reviewText = document.querySelector("#customerReview")?.value;
  if (typeof customerName === "string") state.replyDraft.customerName = customerName;
  if (typeof reviewText === "string") state.replyDraft.reviewText = reviewText;
  saveState();
}

function preserveReviewDraftFromDom() {
  const service = document.querySelector("#reviewService")?.value;
  const product = document.querySelector("#reviewProduct")?.value;
  const experience = document.querySelector("#reviewText")?.value;
  if (typeof service === "string") state.reviewDraft.service = service;
  if (typeof product === "string") state.reviewDraft.product = product;
  if (typeof experience === "string") state.reviewDraft.experience = experience;
  saveState();
}

function splitList(value, fallback = []) {
  const items = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : fallback;
}

function isProMaxPlan() {
  const plan = getEffectivePlan();
  return plan === "pro_max" || plan === "pro_yearly";
}

function isPaidPlanId(plan = state.user.plan) {
  return ["pro", "pro_max", "pro_yearly"].includes(plan);
}

function isPlanCurrentlyUsable() {
  const plan = state.user.plan || "free";
  if (!isPaidPlanId(plan)) return false;

  const status = state.user.planStatus || "free";
  if (["active", "authenticated"].includes(status)) return true;

  if (status === "cancel_requested") {
    const end = state.user.planCurrentEnd ? new Date(state.user.planCurrentEnd).getTime() : 0;
    return !end || end > Date.now();
  }

  return false;
}

function getEffectivePlan() {
  return isPlanCurrentlyUsable() ? state.user.plan : "free";
}

function isPublicBusinessProMax() {
  const b = state.business || {};
  const plan = b.ownerPlan || getEffectivePlan();
  const status = b.ownerPlanStatus || state.user.planStatus || "free";
  if (!(plan === "pro_max" || plan === "pro_yearly")) return false;
  if (["active", "authenticated"].includes(status)) return true;
  if (status === "cancel_requested") {
    const end = b.ownerPlanCurrentEnd ? new Date(b.ownerPlanCurrentEnd).getTime() : 0;
    return !end || end > Date.now();
  }
  return false;
}

function getCategoryMeta(category) {
  return BUSINESS_CATEGORIES.find((item) => item.value === category) || BUSINESS_CATEGORIES.at(-1);
}

function getKeywordsForCategory(category, currentKeywords = "") {
  const suggested = CATEGORY_KEYWORDS[category] || "";
  const current = String(currentKeywords || "").trim();
  const knownSuggestions = Object.values(CATEGORY_KEYWORDS);
  const isBlankOrAuto = !current || knownSuggestions.includes(current);
  return suggested && isBlankOrAuto ? suggested : currentKeywords;
}

function trimToFiveList(value) {
  return splitList(value).slice(0, 5).join(", ");
}

function getSupabaseUserProfile(user) {
  const metadata = user.user_metadata || {};
  return {
    name: metadata.full_name || metadata.name || "",
    email: user.email || "",
    mobile: "",
    provider: "google",
    lastLogin: new Date().toISOString()
  };
}

async function applySupabaseSession(session) {
  // Guard against concurrent calls (e.g. getSession + onAuthStateChange firing simultaneously)
  if (isApplyingSession) return;
  isApplyingSession = true;

  try {
    currentSession = session;

    if (!session?.user) {
      if (state.isLoggedIn && state.user?.provider === "guest") {
        return;
      }

      state.isLoggedIn = false;
      state.authMode = "signin";
      saveState();
      return;
    }

    state.user = {
      ...clone(defaultState.user),
      ...getSupabaseUserProfile(session.user),
      plan: state.user.plan || "free"
    };
    state.stats = clone(defaultState.stats);
    state.suggestions = [];
    state.smartReplies = [];
    state.supportTickets = [];
    state.adminTickets = [];
    state.paymentEvents = [];
    state.adminPaymentEvents = [];
    state.isLoggedIn = true;
    state.authMode = "signin";
    await loadSupabaseProfile();
    await loadSupabaseBusiness();
    // Overlay any unsaved DOM edits (e.g. user was typing in a field when a token
    // refresh fired onAuthStateChange) so they are not lost by the DB reload above.
    preserveBusinessFromDom();
    await saveSupabaseProfile();
    await loadDashboardStats();
    await loadPaymentEvents();
    await loadSupportTickets();
    if (state.user.isAdmin) {
      await loadAdminTickets();
      await loadAdminPaymentEvents();
    }
    saveState();
  } finally {
    isApplyingSession = false;
  }
}

async function loadSupabaseProfile() {
  if (!supabaseClient || !currentSession?.user) return;

  const { data } = await supabaseClient
    .from("profiles")
    .select("full_name,email,mobile,plan,plan_status,razorpay_subscription_id,razorpay_customer_id,plan_current_start,plan_current_end,is_admin")
    .eq("id", currentSession.user.id)
    .maybeSingle();

  if (!data) return;
  state.user.name = data.full_name || state.user.name;
  state.user.email = data.email || state.user.email;
  state.user.mobile = data.mobile || state.user.mobile;
  state.user.plan = data.plan || state.user.plan || "free";
  state.user.planStatus = data.plan_status || state.user.planStatus || "free";
  state.user.subscriptionId = data.razorpay_subscription_id || state.user.subscriptionId || "";
  state.user.customerId = data.razorpay_customer_id || state.user.customerId || "";
  state.user.planCurrentStart = data.plan_current_start || state.user.planCurrentStart || "";
  state.user.planCurrentEnd = data.plan_current_end || state.user.planCurrentEnd || "";
  state.user.isAdmin = Boolean(data.is_admin);
  if (state.checkoutNotice && state.user.plan && state.user.plan !== "free") {
    state.checkoutNotice = "";
  }
  if (data.mobile) state.business.mobile = data.mobile;
}

async function loadPaymentEvents() {
  if (!supabaseClient || !currentSession?.user) return;

  const { data, error } = await supabaseClient
    .from("payment_events")
    .select("id,event_name,provider,plan,razorpay_subscription_id,razorpay_payment_id,status,processing_status,processing_error,profile_updated,payload,created_at")
    .eq("user_id", currentSession.user.id)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    console.warn("Could not load payment events:", error);
    return;
  }

  state.paymentEvents = data || [];
  saveState();
}

async function loadAdminPaymentEvents() {
  if (!supabaseClient || !currentSession?.user || !state.user.isAdmin) return;

  const { data, error } = await supabaseClient
    .from("payment_events")
    .select("id,user_id,event_name,provider,plan,razorpay_subscription_id,razorpay_payment_id,status,processing_status,processing_error,profile_updated,payload,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.warn("Could not load admin payment events:", error);
    return;
  }

  state.adminPaymentEvents = data || [];
  saveState();
}

async function loadSupabaseBusiness() {
  if (!supabaseClient || !currentSession?.user) return;

  const { data, error } = await supabaseClient
    .from("businesses")
    .select("*")
    .eq("owner_id", currentSession.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Could not load business:", error);
    showToast(error.message || "Could not load saved business");
    return;
  }

  if (!data) {
    state.business = {
      ...state.business,
      mobile: state.business.mobile || state.user.mobile || ""
    };
    return;
  }
  state.business = {
    ...emptyBusiness(),
    id: data.id,
    publicToken: data.public_token || state.business.publicToken,
    name: data.name || "",
    category: data.category || "",
    city: data.city || "",
    googleUrl: data.google_review_url || "",
    logo: data.business_logo || state.business.logo || "",
    services: data.services || "",
    serviceTypes: data.service_types || "",
    keywords: data.keywords || "",
    language: data.language || "English",
    tone: data.tone || "Professional",
    mobile: data.mobile || state.business.mobile,
    ownerPlan: data.owner_plan || state.user.plan || "free",
    ownerPlanStatus: data.owner_plan_status || state.user.planStatus || "free",
    ownerPlanCurrentEnd: data.owner_plan_current_end || state.user.planCurrentEnd || ""
  };
}

async function loadDashboardStats() {
  if (!supabaseClient || !currentSession?.user || !state.business.id) {
    state.dashboardStats = { totalReviews: 0, avgRating: 0, recentReviews: [], loaded: true };
    return;
  }
  try {
    // Fetch all review sessions for this business — every scan+generate counts
    const { data, error } = await supabaseClient
      .from("review_requests")
      .select("id,rating,customer_experience,created_at")
      .eq("business_id", state.business.id)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.warn("[RevYne] loadDashboardStats error:", error.message);
      state.dashboardStats = { totalReviews: 0, avgRating: 0, recentReviews: [], loaded: true };
      return;
    }

    const total = (data || []).length;
    const avgRating = total > 0
      ? Math.round((data.reduce((sum, r) => sum + (r.rating || 0), 0) / total) * 10) / 10
      : 0;

    // Also fetch current-month AI reply usage
    let aiRepliesUsed = 0;
    try {
      const { data: usageData } = await supabaseClient
        .from("usage_limits")
        .select("reply_generations")
        .eq("user_id", currentSession.user.id)
        .eq("month_key", getMonthKey())
        .maybeSingle();
      aiRepliesUsed = usageData?.reply_generations || 0;
    } catch { /* non-critical */ }

    state.dashboardStats = {
      totalReviews: total,
      avgRating,
      recentReviews: (data || []).slice(0, 5),
      aiRepliesUsed,
      loaded: true
    };
  } catch {
    state.dashboardStats = { totalReviews: 0, avgRating: 0, recentReviews: [], aiRepliesUsed: 0, loaded: true };
  }
}

async function loadSupportTickets() {
  if (!supabaseClient || !currentSession?.user) return;

  const { data, error } = await supabaseClient
    .from("support_tickets")
    .select("id,subject,category,priority,status,message,admin_response,created_at,updated_at")
    .eq("user_id", currentSession.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.warn("Could not load support tickets:", error);
    return;
  }

  state.supportTickets = data || [];
  saveState();
}

async function loadAdminTickets() {
  if (!supabaseClient || !currentSession?.user || !state.user.isAdmin) return;

  const filter = state.adminTicketFilter || "open";
  let query = supabaseClient
    .from("support_tickets")
    .select("id,user_id,business_id,customer_name,customer_email,subject,category,priority,status,message,admin_response,assigned_to,created_at,updated_at,resolved_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("Could not load admin tickets:", error);
    showToast(error.message || "Could not load admin tickets");
    return;
  }

  state.adminTickets = data || [];
  saveState();
}

async function saveSupabaseProfile() {
  if (!supabaseClient || !currentSession?.user) return true;

  const { error } = await supabaseClient
    .from("profiles")
    .upsert({
      id: currentSession.user.id,
      full_name: state.user.name || null,
      email: state.user.email || currentSession.user.email,
      mobile: state.user.mobile || state.business.mobile || null,
      plan: state.user.plan || "free",
      updated_at: new Date().toISOString()
    });

  if (error) {
    showToast(error.message || "Could not save profile");
    return false;
  }

  return true;
}

async function saveSupabaseBusiness() {
  if (!supabaseClient || !currentSession?.user) return true;

  const payload = {
    owner_id: currentSession.user.id,
    name: state.business.name.trim(),
    category: state.business.category.trim(),
    city: state.business.city || null,
    google_review_url: state.business.googleUrl || null,
    services: state.business.services || null,
    service_types: state.business.serviceTypes || null,
    keywords: state.business.keywords || null,
    language: state.business.language || "English",
    tone: state.business.tone || "Professional",
    mobile: state.business.mobile || state.user.mobile || null,
    business_logo: state.business.logo || null,
    owner_plan: state.user.plan || "free",
    owner_plan_status: state.user.planStatus || "free",
    owner_plan_current_end: state.user.planCurrentEnd || null,
    public_reviews_enabled: true,
    updated_at: new Date().toISOString()
  };

  if (!state.business.id) {
    const { data: existing, error: lookupError } = await supabaseClient
      .from("businesses")
      .select("id,public_token")
      .eq("owner_id", currentSession.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      showToast(lookupError.message || "Could not check saved business");
      return false;
    }

    if (existing?.id) {
      state.business.id = existing.id;
      state.business.publicToken = existing.public_token || state.business.publicToken;
    }
  }

  const query = state.business.id
    ? supabaseClient.from("businesses").update(payload).eq("id", state.business.id).select("id,public_token").single()
    : supabaseClient.from("businesses").insert(payload).select("id,public_token").single();

  const { data, error } = await query;
  if (error) {
    showToast(error.message || "Could not save business");
    return false;
  }

  if (data?.id) state.business.id = data.id;
  if (data?.public_token) state.business.publicToken = data.public_token;
  saveState();
  trackEvent("business_profile_saved", {
    category: state.business.category,
    has_google_url: Boolean(state.business.googleUrl),
    has_logo: Boolean(state.business.logo)
  });
  return true;
}

function getTicketPriority(category) {
  if (category === "bug_report") return "high";
  if (category === "payment" || category === "login") return "high";
  if (category === "ai_generation" || category === "review_page") return "medium";
  return "normal";
}

async function createSupportTicket() {
  const category = document.querySelector("#support-category")?.value || "general";
  const subject = document.querySelector("#support-subject")?.value.trim() || "";
  const message = document.querySelector("#support-message")?.value.trim() || "";

  if (!subject || !message) {
    showToast("Please add a subject and describe the issue");
    return;
  }

  const localTicket = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    subject,
    category,
    priority: getTicketPriority(category),
    status: "open",
    message,
    admin_response: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const button = document.querySelector("[data-submit-ticket]");
  if (button) {
    button.disabled = true;
    button.textContent = "Creating ticket...";
  }

  try {
    if (supabaseClient && currentSession?.user) {
      const { data, error } = await supabaseClient
        .from("support_tickets")
        .insert({
          user_id: currentSession.user.id,
          business_id: state.business.id || null,
          subject,
          category,
          priority: localTicket.priority,
          status: "open",
          message,
          customer_name: state.user.name || null,
          customer_email: state.user.email || currentSession.user.email || null
        })
        .select("id,subject,category,priority,status,message,admin_response,created_at,updated_at")
        .single();

      if (error) throw error;
      const savedTicket = {
        ...data,
        customer_name: state.user.name || "",
        customer_email: state.user.email || currentSession.user.email || ""
      };
      state.supportTickets = [savedTicket, ...state.supportTickets.filter((ticket) => ticket.id !== data.id)];
      notifySupportEmail("new_ticket", savedTicket);
    } else {
      state.supportTickets = [localTicket, ...state.supportTickets].slice(0, 20);
    }

    saveState();
    trackEvent("support_ticket_created", {
      category,
      priority: localTicket.priority,
      has_business: Boolean(state.business.id)
    });
    showToast("Support ticket created");
    render();
  } catch (error) {
    console.error("Support ticket error:", error);
    showToast(error.message || "Could not create ticket");
    if (button) {
      button.disabled = false;
      button.textContent = "Submit Ticket";
    }
  }
}

async function updateAdminTicket(ticketId) {
  if (!supabaseClient || !currentSession?.user || !state.user.isAdmin) {
    showToast("Admin access required");
    return;
  }

  const card = document.querySelector(`[data-admin-ticket-card="${ticketId}"]`);
  const status = card?.querySelector("[data-admin-ticket-status]")?.value || "open";
  const priority = card?.querySelector("[data-admin-ticket-priority]")?.value || "normal";
  const assignedTo = card?.querySelector("[data-admin-ticket-assigned]")?.value.trim() || "";
  const response = card?.querySelector("[data-admin-ticket-response]")?.value.trim() || "";
  const existingTicket = state.adminTickets.find((ticket) => ticket.id === ticketId) || {};

  const payload = {
    status,
    priority,
    assigned_to: assignedTo || null,
    admin_response: response || null,
    updated_at: new Date().toISOString(),
    resolved_at: status === "resolved" || status === "closed" ? new Date().toISOString() : null
  };

  const button = card?.querySelector("[data-admin-save-ticket]");
  const oldText = button?.textContent || "Save";
  if (button) {
    button.disabled = true;
    button.textContent = "Saving...";
  }

  const { error } = await supabaseClient
    .from("support_tickets")
    .update(payload)
    .eq("id", ticketId);

  if (error) {
    showToast(error.message || "Could not update ticket");
    if (button) {
      button.disabled = false;
      button.textContent = oldText;
    }
    return;
  }

  if (response && response !== (existingTicket.admin_response || "")) {
    notifySupportEmail("admin_reply", {
      ...existingTicket,
      status,
      priority,
      assigned_to: assignedTo || null,
      admin_response: response || null
    });
  }

  showToast("Ticket updated");
  await loadAdminTickets();
  render();
}

async function notifySupportEmail(type, ticket) {
  if (!supabaseClient || !currentSession?.user) return;

  try {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return;

    const response = await fetch("/api/send-support-email", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ type, ticket })
    });

    const result = await response.json().catch(() => ({}));
    if (response.ok && result.sent) {
      trackEvent("support_email_sent", { type });
    } else if (result.reason || result.error) {
      console.info("Support email skipped:", result.reason || result.error);
    }
  } catch (error) {
    console.warn("Support email notification skipped:", error);
  }
}

async function signInWithGoogle() {
  trackEvent("google_login_clicked");
  if (!supabaseClient) {
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
    return;
  }

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${location.origin}${location.pathname}`
    }
  });

  if (error) showToast(error.message || "Google sign-in failed");
}

async function signOut() {
  const nextState = clone(defaultState);
  nextState.authMode = "signin";
  state = nextState;
  currentSession = null;
  saveState();
  render();

  if (supabaseClient) {
    supabaseClient.auth.signOut().catch((error) => {
      console.warn("Supabase sign-out failed after local logout:", error);
    });
  }
}

function getMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function getCurrentPlanLimits() {
  return PLAN_LIMITS[getEffectivePlan()] || PLAN_LIMITS.free;
}

async function getCurrentUsage() {
  if (!supabaseClient || !currentSession?.user) {
    return { review_generations: 0, reply_generations: 0 };
  }

  const monthKey = getMonthKey();
  const { data, error } = await supabaseClient
    .from("usage_limits")
    .select("review_generations,reply_generations")
    .eq("user_id", currentSession.user.id)
    .eq("month_key", monthKey)
    .maybeSingle();

  if (error) return { review_generations: 0, reply_generations: 0 };
  return data || { review_generations: 0, reply_generations: 0 };
}

async function canGenerate(type) {
  if (!supabaseClient || !currentSession?.user) return true;

  try {
    // Race against 4-second timeout so a slow network never silently blocks
    const usage = await Promise.race([
      getCurrentUsage(),
      new Promise(resolve => setTimeout(() => resolve({ review_generations: 0, reply_generations: 0 }), 4000))
    ]);
    const limits = getCurrentPlanLimits();
    const used = type === "review" ? usage.review_generations : usage.reply_generations;
    const limit = type === "review" ? limits.reviewGenerations : limits.replyGenerations;

    if (used >= limit) {
      showToast(`⚠ Monthly ${type} limit reached (${used}/${limit}). Upgrade for more.`, 4000);
      return false;
    }
  } catch {
    // If limit check fails, allow generation rather than blocking the user
  }

  return true;
}

async function incrementUsage(type) {
  if (!supabaseClient || !currentSession?.user) return;

  const monthKey = getMonthKey();
  const usage = await getCurrentUsage();
  const payload = {
    user_id: currentSession.user.id,
    month_key: monthKey,
    review_generations: usage.review_generations + (type === "review" ? 1 : 0),
    reply_generations: usage.reply_generations + (type === "reply" ? 1 : 0),
    updated_at: new Date().toISOString()
  };

  await supabaseClient
    .from("usage_limits")
    .upsert(payload, { onConflict: "user_id,month_key" });
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
  const suffix = state.business.publicToken ? `/${state.business.publicToken}` : "";
  return `${location.origin}${location.pathname}#review${suffix}`;
}

function getQrFileName() {
  const base = (state.business.name || "revyne-review")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
  return `${base || "revyne-review"}-qr.png`;
}

function getPublicReviewToken() {
  const match = location.hash.match(/^#review\/([0-9a-f-]{36})$/i);
  return match ? match[1] : "";
}

function isPublicReviewRoute() {
  return location.hash === "#review" || location.hash.startsWith("#review/");
}

async function loadPublicReviewBusiness() {
  const publicToken = getPublicReviewToken();
  if (!supabaseClient || !publicToken || state.business.publicToken === publicToken) return;

  const { data, error } = await supabaseClient
    .from("businesses")
    .select("id,public_token,name,category,city,google_review_url,business_logo,services,service_types,keywords,language,tone,mobile,owner_plan,owner_plan_status,owner_plan_current_end")
    .eq("public_token", publicToken)
    .eq("public_reviews_enabled", true)
    .maybeSingle();

  if (error || !data) {
    showToast(error?.message || "Business profile not found");
    return;
  }

  state.business = {
    ...state.business,
    id: data.id,
    publicToken: data.public_token || publicToken,
    name: data.name || state.business.name,
    category: data.category || state.business.category,
    city: data.city || "",
    googleUrl: data.google_review_url || "",
    logo: data.business_logo || "",
    services: data.services || "",
    serviceTypes: data.service_types || "",
    keywords: data.keywords || "",
    language: data.language || "English",
    tone: data.tone || "Professional",
    mobile: data.mobile || "",
    ownerPlan: data.owner_plan || "free",
    ownerPlanStatus: data.owner_plan_status || "free",
    ownerPlanCurrentEnd: data.owner_plan_current_end || ""
  };
  state.suggestions = [];
  saveState();
}

async function saveGeneratedReviewsToSupabase(experience) {
  if (!supabaseClient || !state.suggestions.length) return;

  if (!state.business.id) {
    await findSupabaseBusinessForPublicReview();
  }

  if (!state.business.id) {
    console.warn("[RevYne] save skipped: business id missing");
    return;
  }

  // Use the SECURITY DEFINER RPC function — bypasses RLS entirely,
  // works for any caller (anon, authenticated, or publishable-key client)
  try {
    const { data: requestId, error } = await supabaseClient.rpc("save_review_request", {
      p_business_id: state.business.id,
      p_rating: state.rating,
      p_experience: experience || null,
      p_language: state.business.language || "English",
      p_suggestions: state.suggestions.slice(0, 3)
    });

    if (error) {
      console.warn("[RevYne] save_review_request RPC error:", error.message);
    } else if (requestId) {
      publicReviewRequestId = requestId;
    }
  } catch (err) {
    console.warn("[RevYne] save_review_request failed:", err);
  }
}

async function callAIGenerator(action, payload) {
  if (!supabaseClient) return null;

  try {
    const { data, error } = await supabaseClient.functions.invoke("generate-ai", {
      body: { action, ...payload }
    });

    if (error) {
      console.warn("AI function unavailable, using local fallback:", error.message || error);
      return null;
    }

    return data;
  } catch (error) {
    console.warn("AI function unavailable, using local fallback:", error);
    return null;
  }
}

async function saveSmartRepliesToSupabase({ customerName, rating, reviewText }) {
  if (!supabaseClient || !state.business.id || !state.smartReplies.length) return;

  const rows = state.smartReplies.map((replyText) => ({
    business_id: state.business.id,
    customer_name: customerName || null,
    rating,
    review_text: reviewText || null,
    reply_text: replyText
  }));

  const { error } = await supabaseClient
    .from("smart_replies")
    .insert(rows);

  if (error) {
    showToast(error.message || "Could not save smart replies");
  }
}

async function findSupabaseBusinessForPublicReview() {
  if (!supabaseClient || !state.business.name.trim()) return;

  const { data } = await supabaseClient
    .from("businesses")
    .select("id,public_token")
    .eq("name", state.business.name.trim())
    .limit(1)
    .maybeSingle();

  if (data?.id) {
    state.business.id = data.id;
    state.business.publicToken = data.public_token || state.business.publicToken;
    saveState();
  }
}

async function completeGoogleProfile() {
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
  const profileSaved = await saveSupabaseProfile();
  if (!profileSaved) return;
  saveState();
  render();
}

function getLangSuggestions(lang, { name, city, cat, starText, base, tone }) {
  if (lang === "Hindi") return [
    `${name} ने ${city} में ${starText} सेवा प्रदान की। ${base} टीम पेशेवर और भरोसेमंद थी।`,
    `${name} के साथ अनुभव बहुत अच्छा रहा। ${cat} सेवा समय पर और विश्वसनीय थी।`,
    `मैं ${name} की सेवाओं से संतुष्ट हूं। इन्हें जरूर आजमाएं।`
  ];
  if (lang === "Hinglish") return [
    `${name} ka experience bahut ${starText} tha. ${base} Team professional aur helpful thi.`,
    `${name} ki service ${city} mein really good hai. ${cat} ke liye yahan zaroor aayein.`,
    `Overall ${name} ne bahut accha kaam kiya. Main inhe definitely recommend karunga.`
  ];
  if (lang === "Marathi") return [
    `${name} कडून ${starText} सेवा मिळाली. ${base} टीम व्यावसायिक आणि विश्वासार्ह होती.`,
    `${name} बरोबर अनुभव खूप चांगला होता. ${cat} सेवा वेळेवर होती.`,
    `${name} च्या सेवेने मी समाधानी आहे. सर्वांना शिफारस करतो.`
  ];
  if (lang === "Bengali") return [
    `${name}-এ ${starText} সেবা পেলাম। ${base} দলটি পেশাদার ও বিশ্বস্ত ছিল।`,
    `${name}-এর সাথে অভিজ্ঞতা অত্যন্ত ভালো। ${cat} সেবা সময়মতো ছিল।`,
    `${name}-এর সেবায় আমি সন্তুষ্ট। সবাইকে পরামর্শ দিচ্ছি।`
  ];
  if (lang === "Telugu") return [
    `${name} వద్ద ${starText} సేవ పొందాను. ${base} బృందం నిపుణులుగా ఉంది.`,
    `${name} తో అనుభవం చాలా బాగుంది. ${cat} సేవ నమ్మదగినది.`,
    `${name} సేవలతో సంతృప్తిగా ఉన్నాను. అందరికీ సిఫారసు చేస్తున్నాను.`
  ];
  if (lang === "Tamil") return [
    `${name}-இல் ${starText} சேவை கிடைத்தது. ${base} குழு தொழில்முறையாக இருந்தது.`,
    `${name} உடனான அனுபவம் மிகவும் நல்லது. ${cat} சேவை நேரத்தில் கிடைத்தது.`,
    `${name} சேவையில் திருப்தியாக இருக்கிறேன். அனைவருக்கும் பரிந்துரைக்கிறேன்.`
  ];
  if (lang === "Gujarati") return [
    `${name} પાસેથી ${starText} સેવા મળી. ${base} ટીમ વ્યાવસાયિક અને વિશ્વસનીય હતી.`,
    `${name} સાથેનો અનુભવ ખૂબ સારો હતો. ${cat} સેવા સમયસર હતી.`,
    `${name} ની સેવાથી હું સંતુષ્ટ છું. સૌને ભલામણ કરું છું.`
  ];
  if (lang === "Kannada") return [
    `${name} ನಲ್ಲಿ ${starText} ಸೇವೆ ಪಡೆದೆ. ${base} ತಂಡ ವೃತ್ತಿಪರ ಮತ್ತು ವಿಶ್ವಾಸಾರ್ಹ.`,
    `${name} ನೊಂದಿಗಿನ ಅನುಭವ ಉತ್ತಮ. ${cat} ಸೇವೆ ಸಮಯಕ್ಕೆ ದೊರೆಯಿತು.`,
    `${name} ಸೇವೆಯಿಂದ ತೃಪ್ತ. ಎಲ್ಲರಿಗೂ ಶಿಫಾರಸು ಮಾಡುತ್ತೇನೆ.`
  ];
  if (lang === "Malayalam") return [
    `${name}-ൽ ${starText} സേവനം ലഭിച്ചു. ${base} ടീം പ്രൊഫഷണൽ ആയിരുന്നു.`,
    `${name} ഉടനുള്ള അനുഭവം വളരെ നല്ലത്. ${cat} സേവനം സമയത്ത് കിട്ടി.`,
    `${name}-ന്റെ സേവനത്തിൽ സംതൃപ്തൻ. എല്ലാവർക്കും ശുപാർശ ചെയ്യുന്നു.`
  ];
  if (lang === "Punjabi") return [
    `${name} ਤੋਂ ${starText} ਸੇਵਾ ਮਿਲੀ. ${base} ਟੀਮ ਪੇਸ਼ੇਵਰ ਅਤੇ ਭਰੋਸੇਯੋਗ ਸੀ.`,
    `${name} ਦੇ ਨਾਲ ਤਜ਼ਰਬਾ ਬਹੁਤ ਵਧੀਆ ਰਿਹਾ. ${cat} ਸੇਵਾ ਸਮੇਂ ਸਿਰ ਸੀ.`,
    `${name} ਦੀ ਸੇਵਾ ਤੋਂ ਸੰਤੁਸ਼ਟ ਹਾਂ. ਸਾਰਿਆਂ ਨੂੰ ਸਿਫ਼ਾਰਿਸ਼ ਕਰਦਾਂ.`
  ];
  if (lang === "Odia") return [
    `${name} ଠାରୁ ${starText} ସେବା ପାଇଲି. ${base} ଦଳ ଦକ୍ଷ ଏବଂ ବିଶ୍ୱସ୍ତ.`,
    `${name} ସହ ଅଭିଜ୍ଞତା ଅତ୍ୟନ୍ତ ଭଲ. ${cat} ସେବା ସମୟ ମତେ ଥିଲା.`,
    `${name} ର ସେବାରେ ସନ୍ତୁଷ୍ଟ. ସମସ୍ତଙ୍କୁ ସୁପାରିଶ.`
  ];
  if (lang === "Urdu") return [
    `${name} سے ${starText} خدمت ملی۔ ${base} ٹیم پیشہ ور اور قابل اعتماد تھی۔`,
    `${name} کے ساتھ تجربہ بہت اچھا رہا۔ ${cat} سروس وقت پر تھی۔`,
    `${name} کی خدمات سے مطمئن ہوں۔ سب کو سفارش کرتا ہوں۔`
  ];
  if (lang === "Assamese") return [
    `${name}ত ${starText} সেৱা পাইছিলোঁ। ${base} দলটো দক্ষ আৰু বিশ্বাসযোগ্য।`,
    `${name}ৰ সৈতে অভিজ্ঞতা অতি ভাল। ${cat} সেৱা সময়মতে পাইছিলোঁ।`,
    `${name}ৰ সেৱাত সন্তুষ্ট। সকলোকে পৰামৰ্শ দিছোঁ।`
  ];
  // Tone-aware English (default for all other languages)
  if (tone === "Friendly") return [
    `Really happy with my experience at ${name}! ${base} Warm, helpful team that made everything easy.`,
    `${name} was great — friendly staff, reliable ${cat}, and smooth communication throughout.`,
    `Wonderful experience with ${name} in ${city}. Would definitely recommend to friends!`
  ];
  if (tone === "Enthusiastic") return [
    `Absolutely loved ${name}! ${base} Outstanding ${cat} — 100% recommend!`,
    `Wow, ${name} really delivered! ${starText.charAt(0).toUpperCase() + starText.slice(1)} service — team went above and beyond!`,
    `Best ${cat} experience ever! ${name} is top-notch. Don't hesitate — just book them!`
  ];
  return [
    `${name} provided ${starText} service in ${city}. ${base} The team was professional, responsive, and easy to coordinate with.`,
    `I am satisfied with my experience with ${name}. The ${cat} was reliable, punctual, and handled professionally.`,
    `Good experience overall. ${name} made the process simple and delivered dependable service. I would recommend them to others.`
  ];
}

async function createReviewSuggestions() {
  if (isGeneratingReview) return;

  if (!state.rating) {
    showToast("⚠ Please select a star rating first");
    // Briefly shake the stars to draw attention
    const starsEl = document.querySelector(".stars");
    if (starsEl) { starsEl.classList.add("shake"); setTimeout(() => starsEl.classList.remove("shake"), 600); }
    return;
  }

  // Check limit BEFORE showing loading state (avoids flicker on limit hit)
  const allowed = await canGenerate("review");
  if (!allowed) return;

  // Preserve draft text NOW, before render wipes the DOM
  preserveReviewDraftFromDom();

  isGeneratingReview = true;
  render(); // show loading button immediately

  const business = state.business;
  const selectedService = state.reviewDraft.service || business.category || "";
  const selectedProduct = state.reviewDraft.product || "";
  const experience = (state.reviewDraft.experience || "").trim();
  const proMaxReview = isPublicReviewRoute()
    ? isPublicBusinessProMax() && Boolean(selectedService || selectedProduct)
    : isProMaxPlan() && Boolean(selectedService || selectedProduct);
  const services = (business.services || "").split(",").map((item) => item.trim()).filter(Boolean);
  const serviceLine = selectedService || (services.length ? services.slice(0, 2).join(" and ") : (business.category || "service"));
  const base = experience || `I had a genuine experience with ${serviceLine}.`;
  const starText = state.rating >= 5 ? "excellent" : state.rating >= 4 ? "very good" : "helpful";
  const tone = business.tone || "Professional";
  const lang = business.language || "English";
  const name = business.name || "this business";
  const city = business.city || "";
  const cat = (business.category || "service").toLowerCase();

  // Call AI with a 10-second timeout — always fall back to local on failure/timeout
  let aiResult = null;
  try {
    aiResult = await Promise.race([
      callAIGenerator("review_suggestions", {
        rating: state.rating,
        experience,
        selectedService,
        selectedProduct,
        depth: proMaxReview ? "seo_deep" : "standard",
        business: { name, category: business.category, city, services: business.services, keywords: business.keywords, language: lang, tone }
      }),
      new Promise(resolve => setTimeout(() => resolve(null), 10000))
    ]);
  } catch { aiResult = null; }

  try {
    if (Array.isArray(aiResult?.suggestions) && aiResult.suggestions.length) {
      state.suggestions = aiResult.suggestions.slice(0, 3);
    } else if (proMaxReview) {
      const productLine = selectedProduct ? ` for ${selectedProduct}` : "";
      const locationLine = city ? ` in ${city}` : "";
      state.suggestions = [
        `${name} gave me a ${starText} experience with ${selectedService}${productLine}${locationLine}. ${base} The team explained things clearly, handled the work professionally, and made the whole process easy to trust. I would recommend them to anyone looking for reliable ${business.category}.`,
        `I chose ${name} for ${selectedService}${productLine}, and the experience felt smooth from start to finish. ${base} Their communication, service quality, and attention to detail stood out. It is a dependable option for customers searching for ${business.category}${locationLine}.`,
        `${name} was helpful and professional for my ${selectedService}${productLine} requirement. ${base} The service felt genuine, the team understood what I needed, and the overall experience was worth recommending. A good choice for ${business.category}${locationLine}.`
      ];
    } else {
      // Always guaranteed to return 3 suggestions
      state.suggestions = getLangSuggestions(lang, { name, city, cat, starText, base, tone });
    }

    state.stats.generated += 1;
    saveState();
    // Fire-and-forget background saves — don't let them block or crash the UI
    saveGeneratedReviewsToSupabase(experience).catch(() => {});
    incrementUsage("review").catch(() => {});
    trackEvent("review_generated", {
      rating: state.rating,
      pro_max_flow: proMaxReview,
      has_experience: Boolean(experience),
      suggestion_count: state.suggestions.length
    });
  } catch (err) {
    console.error("Review generation error:", err);
    // Even on error, use local fallback so user still gets suggestions
    if (!state.suggestions.length) {
      state.suggestions = getLangSuggestions(lang || "English", { name, city, cat, starText, base, tone });
    }
    saveState();
  } finally {
    isGeneratingReview = false;
    render();
  }
}

async function createSmartReplies() {
  if (isGeneratingReply) return;

  // Guest mode: hard cap at 5 free replies, then prompt sign-in
  if (state.user?.provider === "guest") {
    if ((state.guestRepliesUsed || 0) >= 5) {
      state.showGuestLimitModal = true;
      render();
      return;
    }
  }

  const customerNameInput = document.querySelector("#customerName");
  const customerReviewInput = document.querySelector("#customerReview");
  state.replyDraft.customerName = customerNameInput?.value.trim() || state.replyDraft.customerName.trim();
  state.replyDraft.reviewText = customerReviewInput?.value.trim() || state.replyDraft.reviewText.trim();

  const allowed = await canGenerate("reply");
  if (!allowed) return;

  const name = state.replyDraft.customerName || "there";
  const text = state.replyDraft.reviewText || "Thank you for the positive feedback.";
  const rating = state.replyRating;
  const business = state.business.name;

  isGeneratingReply = true;
  state.smartReplies = [];
  saveState();
  render();

  try {
    const aiResult = await callAIGenerator("smart_replies", {
      customerName: name === "there" ? "" : name,
      rating,
      reviewText: text,
      business: {
        name: business,
        category: state.business.category,
        city: state.business.city,
        language: state.business.language,
        tone: state.business.tone
      }
    });

    if (Array.isArray(aiResult?.replies) && aiResult.replies.length) {
      state.smartReplies = aiResult.replies.slice(0, 3);
    } else if (rating <= 2) {
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

    if (text.length > 80 && state.smartReplies.length < 3) {
      state.smartReplies.push(`Hi ${name}, thank you for taking the time to write such detailed feedback. We appreciate your trust in ${business} and are glad we could help.`);
    }

    isGeneratingReply = false;

    // Track guest usage
    if (state.user?.provider === "guest") {
      state.guestRepliesUsed = (state.guestRepliesUsed || 0) + 1;
      if (state.guestRepliesUsed >= 5) {
        showToast(`You've used all 5 free replies. Sign in to get 20 more!`, 4000);
      } else {
        const remaining = 5 - state.guestRepliesUsed;
        showToast(`${remaining} free repl${remaining === 1 ? "y" : "ies"} remaining. Sign in for more.`, 3000);
      }
    }

    saveState();
    render();

    await saveSmartRepliesToSupabase({
      customerName: name === "there" ? "" : name,
      rating,
      reviewText: text
    });
    await incrementUsage("reply");
    trackEvent("smart_reply_generated", {
      rating,
      has_customer_name: name !== "there",
      review_length_bucket: text.length > 240 ? "long" : text.length > 80 ? "medium" : "short",
      reply_count: state.smartReplies.length
    });
  } catch (error) {
    isGeneratingReply = false;
    console.warn("Could not generate smart replies:", error);
    showToast("Could not generate replies");
    render();
  }
}

async function markReviewDraftCopied() {
  if (!publicReviewRequestId || !supabaseClient) return;
  const id = publicReviewRequestId;
  publicReviewRequestId = null; // prevent double-marking
  try {
    await supabaseClient.functions.invoke("generate-ai", {
      body: { action: "mark_review_copied", request_id: id }
    });
  } catch (e) {
    console.warn("[RevYne] Could not mark review copied:", e);
    publicReviewRequestId = id; // restore on failure so retry is possible
  }
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

async function startPlanCheckout(plan) {
  if (!supabaseClient || !currentSession?.user) {
    showToast("Please login before upgrading");
    state.authMode = "signin";
    render();
    return;
  }

  const button = document.querySelector(`[data-plan-select="${plan}"]`);
  const originalText = button?.textContent || "Upgrade";
  if (button) {
    button.disabled = true;
    button.textContent = "Opening checkout...";
  }

  try {
    trackEvent("checkout_started", { plan });
    setCheckoutNotice("Creating Razorpay checkout...");

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("Please login again before upgrading");

    const response = await fetch("/api/create-razorpay-subscription", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        plan,
        returnUrl: `${location.origin}${location.pathname}`
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data?.detail?.error?.description
        || data?.detail?.description
        || data?.detail?.message
        || (typeof data?.detail === "string" ? data.detail : "")
        || data?.message;
      throw new Error(detail || data?.error || "Could not create checkout");
    }

    if (!data?.subscriptionId && !data?.shortUrl) throw new Error("Checkout was not created");

    console.info("Razorpay checkout created", {
      hasShortUrl: Boolean(data.shortUrl),
      hasSubscriptionId: Boolean(data.subscriptionId),
      plan: data.plan
    });
    setCheckoutNotice(data.shortUrl ? "Opening Razorpay payment link..." : "Opening Razorpay checkout...");

    if (data.shortUrl) {
      window.location.href = data.shortUrl;
      return;
    }

    await openRazorpayCheckout(data);
  } catch (error) {
    console.error("Checkout error:", error);
    const message = error.message || "Could not open checkout";
    setCheckoutNotice(message);
    showToast(message);
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

async function cancelCurrentSubscription() {
  if (!supabaseClient || !currentSession?.user) {
    showToast("Please login before managing your subscription");
    return;
  }

  if (!state.user.subscriptionId) {
    showToast("No active subscription found");
    return;
  }

  const confirmed = window.confirm("Cancel this subscription at the end of the current billing cycle?");
  if (!confirmed) return;

  const button = document.querySelector("[data-cancel-subscription]");
  const originalText = button?.textContent || "Cancel subscription";
  if (button) {
    button.disabled = true;
    button.textContent = "Cancelling...";
  }

  try {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("Please login again before managing your subscription");

    const response = await fetch("/api/cancel-razorpay-subscription", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.detail || "Could not cancel subscription");
    }

    state.user.planStatus = "cancel_requested";
    showToast("Subscription cancellation scheduled");
    await loadSupabaseProfile();
    await loadPaymentEvents();
    saveState();
    render();
  } catch (error) {
    showToast(error.message || "Could not cancel subscription");
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

async function openRazorpayCheckout(checkoutData) {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error("Could not load Razorpay Checkout");
  }

  const options = {
    key: checkoutData.keyId,
    subscription_id: checkoutData.subscriptionId,
    name: "RevYne",
    description: checkoutData.label || "RevYne subscription",
    prefill: {
      name: state.user.name || "",
      email: state.user.email || "",
      contact: state.user.mobile || state.business.mobile || ""
    },
    notes: {
      app: "revyne",
      plan: checkoutData.plan || ""
    },
    theme: {
      color: "#9b1bd6"
    },
    handler: async () => {
      showToast("Payment received. Updating plan...");
      setTimeout(async () => {
        await loadSupabaseProfile();
        saveState();
        render();
      }, 2500);
    },
    modal: {
      ondismiss: () => {
        showToast("Checkout closed");
        const button = document.querySelector(`[data-plan-select="${checkoutData.plan}"]`);
        if (button) {
          button.disabled = false;
          button.textContent = checkoutData.plan === "pro_max"
            ? "Upgrade to Pro Max"
            : checkoutData.plan === "pro_yearly"
              ? "Upgrade Yearly"
              : "Upgrade to Pro";
        }
      }
    }
  };

  try {
    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", (response) => {
      const description = response?.error?.description || "Payment failed. Please try again.";
      showToast(description);
      trackClientError("razorpay_payment_failed", description, "razorpay");
    });
    razorpay.open();
  } catch (error) {
    trackClientError("razorpay_checkout_error", error.message || error, "razorpay");
    throw new Error("Razorpay Checkout could not open in this browser. Please try Chrome.");
  }
}

function showToast(message, duration = 2800) {
  const toast = document.querySelector(".copy-toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("show");
  // Force reflow so re-triggering same message still animates
  void toast.offsetWidth;
  toast.classList.add("show");
  clearTimeout(toast._toastTimer);
  toast._toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
}

function renderQrCodes() {
  document.querySelectorAll("[data-qr-code]").forEach((canvas) => {
    const text = canvas.dataset.qrCode;
    if (!text) return;

    if (!window.QRCode?.toCanvas) {
      ensureQrLibrary()
        .then(() => drawQrWithLocalGenerator(canvas, text, 220, 2))
        .catch((error) => {
          console.warn("Could not render local QR code:", error);
          showToast("Could not create QR code");
        });
      return;
    }

    window.QRCode.toCanvas(canvas, text, {
      width: 220,
      margin: 2,
      color: {
        dark: "#111827",
        light: "#ffffff"
      }
    }, (error) => {
      if (error) {
        console.warn("Could not render QR code:", error);
        showToast("Could not create QR code");
      }
    });
  });
}

// Builds the branded Google+RevYne QR template on a canvas and returns a PNG data URL
function ensureQrLibrary(timeoutMs = 6000) {
  if (window.QRCode?.toCanvas || window.qrcode) return Promise.resolve();
  if (window.__revyneQrLibraryPromise) return window.__revyneQrLibraryPromise;

  window.__revyneQrLibraryPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector("script[data-revyne-qr-library]");
    const script = existingScript || document.createElement("script");
    let settled = false;

    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if ((window.QRCode?.toCanvas || window.qrcode) && !error) resolve();
      else reject(error || new Error("QR library not ready"));
    };

    const timer = setTimeout(() => finish(new Error("QR library timed out")), timeoutMs);

    if (existingScript) {
      script.addEventListener("load", () => finish(), { once: true });
      script.addEventListener("error", () => finish(new Error("QR library failed to load")), { once: true });
      return;
    }

    script.src = "./assets/vendor/qrcode-generator.js?v=20260512-2";
    script.async = true;
    script.dataset.revyneQrLibrary = "true";
    script.onload = () => finish();
    script.onerror = () => finish(new Error("QR library failed to load"));
    document.head.appendChild(script);
  }).catch((error) => {
    window.__revyneQrLibraryPromise = null;
    throw error;
  });

  return window.__revyneQrLibraryPromise;
}

function drawQrWithLocalGenerator(canvas, text, width = 600, marginModules = 2) {
  if (!window.qrcode) throw new Error("Local QR generator not ready");

  const qr = window.qrcode(0, "M");
  qr.addData(text);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const quietModules = marginModules;
  const cellSize = width / (moduleCount + quietModules * 2);
  const qrSize = cellSize * moduleCount;
  const offset = (width - qrSize) / 2;
  const ctx = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = width;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, width);
  ctx.fillStyle = "#111827";

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (qr.isDark(row, col)) {
        ctx.fillRect(
          Math.round(offset + col * cellSize),
          Math.round(offset + row * cellSize),
          Math.ceil(cellSize),
          Math.ceil(cellSize)
        );
      }
    }
  }
}

async function buildQrCanvas(text, width = 600) {
  await ensureQrLibrary();

  const qrCanvas = document.createElement("canvas");
  qrCanvas.width = width;
  qrCanvas.height = width;

  if (window.QRCode?.toCanvas) {
    await new Promise((resolve, reject) => {
      window.QRCode.toCanvas(qrCanvas, text, {
        width,
        margin: 2,
        color: {
          dark: "#111827",
          light: "#ffffff"
        }
      }, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  } else {
    drawQrWithLocalGenerator(qrCanvas, text, width, 2);
  }

  return qrCanvas;
}

function loadCanvasImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}

async function getQrTemplateDataUrl() {
  // Step 1: render QR onto an off-screen canvas
  const qrCanvas = await buildQrCanvas(getReviewUrl(), 600);

  // Step 2: draw branded template matching the RevYne QR poster design
  const W = 900, H = 1200;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const PI = Math.PI;

  // ── helpers ────────────────────────────────────────────────────────────────
  const rrPath = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.arc(x + w - r, y + r, r, -PI / 2, 0);
    ctx.lineTo(x + w, y + h - r);
    ctx.arc(x + w - r, y + h - r, r, 0, PI / 2);
    ctx.lineTo(x + r, y + h);
    ctx.arc(x + r, y + h - r, r, PI / 2, PI);
    ctx.lineTo(x, y + r);
    ctx.arc(x + r, y + r, r, PI, PI * 3 / 2);
    ctx.closePath();
  };
  const rrFill = (x, y, w, h, r, color) => { rrPath(x, y, w, h, r); ctx.fillStyle = color; ctx.fill(); };
  const rrStroke = (x, y, w, h, r, color, lw) => {
    rrPath(x, y, w, h, r); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke();
  };
  const txt = (str, x, y, font, color, align) => {
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align || "center"; ctx.fillText(str, x, y);
  };
  const seg = (col, x1, y1, x2, y2, lw) => {
    ctx.strokeStyle = col; ctx.lineWidth = lw || ctx.lineWidth;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  };
  const arcSeg = (col, cx, cy, r, s, e, lw) => {
    ctx.strokeStyle = col; if (lw) ctx.lineWidth = lw;
    ctx.beginPath(); ctx.arc(cx, cy, r, s, e); ctx.stroke();
  };

  // ── background: soft lavender gradient ────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#F6F2FF");
  bgGrad.addColorStop(0.5, "#FDF8FF");
  bgGrad.addColorStop(1, "#F8F0FF");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // subtle dot grid
  ctx.fillStyle = "rgba(99,102,241,0.07)";
  for (let ry = 20; ry < H; ry += 28) {
    for (let rx = 20; rx < W; rx += 28) {
      ctx.beginPath(); ctx.arc(rx, ry, 1.5, 0, PI * 2); ctx.fill();
    }
  }

  // decorative sparkle crosses (✦) at corners
  const sparkle = (sx, sy, size, color) => {
    ctx.fillStyle = color; ctx.font = `${size}px Arial`; ctx.textAlign = "center";
    ctx.fillText("✦", sx, sy);
  };
  sparkle(58, 180, 18, "rgba(99,102,241,0.25)");
  sparkle(72, 210, 11, "rgba(99,102,241,0.18)");
  sparkle(840, 180, 14, "rgba(99,102,241,0.2)");
  sparkle(860, 310, 18, "rgba(99,102,241,0.25)");
  sparkle(120, 330, 11, "rgba(99,102,241,0.15)");

  // ── Google + RevYne header ─────────────────────────────────────────────────
  const G_FONT = "bold 48px Arial";
  ctx.font = G_FONT;
  const gls = [["G","#4285F4"],["o","#EA4335"],["o","#FBBC05"],["g","#4285F4"],["l","#34A853"],["e","#EA4335"]];
  const gw = gls.reduce((s, [ch]) => s + ctx.measureText(ch).width, 0);
  const SEP = 2, SPAD = 24, IICON = 44, IPAD = 10, RTW = 150;
  let hx = (W - (gw + SPAD * 2 + SEP + IICON + IPAD + RTW)) / 2;
  const hy = 80;
  gls.forEach(([ch, col]) => { txt(ch, hx, hy, G_FONT, col, "left"); hx += ctx.measureText(ch).width; });
  hx += SPAD;
  ctx.fillStyle = "#d1d5db"; ctx.fillRect(hx, hy - 44, SEP, 54);
  hx += SEP + SPAD;
  // RevYne icon bubble
  // RevYne icon — gradient bg + chat bubble + sparkle (matches actual brand logo)
  rrPath(hx, hy - 42, IICON, IICON, 11);
  const rvGrad = ctx.createLinearGradient(hx, hy - 42, hx + IICON, hy + 2);
  rvGrad.addColorStop(0, "#9B2EFA"); rvGrad.addColorStop(1, "#4F46E5");
  ctx.fillStyle = rvGrad; ctx.fill();
  // chat bubble body + tail as one path
  const cbx = hx + 5, cby = hy - 39, cbw = 28, cbh = 20, cbr = 4;
  ctx.beginPath();
  ctx.moveTo(cbx + cbr, cby); ctx.lineTo(cbx + cbw - cbr, cby);
  ctx.arc(cbx + cbw - cbr, cby + cbr, cbr, -PI/2, 0);
  ctx.lineTo(cbx + cbw, cby + cbh - cbr);
  ctx.arc(cbx + cbw - cbr, cby + cbh - cbr, cbr, 0, PI/2);
  ctx.lineTo(cbx + 14, cby + cbh); ctx.lineTo(cbx + 8, cby + cbh + 7);
  ctx.lineTo(cbx + cbr, cby + cbh);
  ctx.arc(cbx + cbr, cby + cbh - cbr, cbr, PI/2, PI);
  ctx.lineTo(cbx, cby + cbr); ctx.arc(cbx + cbr, cby + cbr, cbr, PI, PI * 3/2);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fill();
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.2; ctx.stroke();
  // two text lines inside bubble
  rrFill(cbx + 4, cby + 5,  cbw - 8, 3, 1.5, "#fff");
  rrFill(cbx + 4, cby + 11, cbw - 8, 3, 1.5, "#fff");
  // three pill dots (typing indicator row)
  rrFill(cbx + 4,  cby + 16, 7, 2.5, 1.5, "#fff");
  rrFill(cbx + 13, cby + 16, 7, 2.5, 1.5, "#fff");
  rrFill(cbx + 20, cby + 16, 5, 2.5, 1.5, "#fff");
  // 4-pointed sparkle star (top-right, overlapping bubble corner)
  const spX = hx + IICON - 10, spY = hy - 42 + 9;
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = (PI/4)*k - PI/2, r = k % 2 === 0 ? 6 : 2.5;
    k === 0 ? ctx.moveTo(spX + r*Math.cos(a), spY + r*Math.sin(a))
            : ctx.lineTo(spX + r*Math.cos(a), spY + r*Math.sin(a));
  }
  ctx.closePath(); ctx.fillStyle = "#fff"; ctx.fill();
  // sparkle dashes
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.lineCap = "round";
  [[spX+6,spY,spX+9,spY-1],[spX+4,spY+5,spX+6,spY+8],[spX+1,spY-6,spX+1,spY-9]].forEach(([x1,y1,x2,y2]) => {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });
  ctx.lineCap = "butt";
  hx += IICON + IPAD;
  txt("RevYne", hx, hy, "bold 40px Arial", "#111827", "left");

  // ── AI Powered Review sub-header ───────────────────────────────────────────
  ctx.font = "500 16px Arial"; ctx.textAlign = "center";
  const airLabel = "AI Powered Review";
  const airW = ctx.measureText(airLabel).width;
  ctx.fillStyle = "#6366f1";
  ctx.fillText(airLabel, W / 2, 118);
  ctx.strokeStyle = "#6366f1"; ctx.lineWidth = 1.5;
  [[-airW / 2 - 32, -airW / 2 - 8], [airW / 2 + 8, airW / 2 + 32]].forEach(([x1, x2]) => {
    ctx.beginPath(); ctx.moveTo(W / 2 + x1, 112); ctx.lineTo(W / 2 + x2, 112); ctx.stroke();
  });

  // ── SMART REVIEW QR pill ───────────────────────────────────────────────────
  const pillW = 268, pillH = 40, pillX = (W - pillW) / 2, pillY = 140;
  rrFill(pillX, pillY, pillW, pillH, 20, "#4F46E5");
  ctx.fillStyle = "#fff"; ctx.font = "bold 15px Arial"; ctx.textAlign = "center";
  ctx.fillText("✦  SMART REVIEW QR", W / 2, pillY + 26);

  // ── Main headline ──────────────────────────────────────────────────────────
  const headGrad = ctx.createLinearGradient(W / 2 - 240, 0, W / 2 + 240, 0);
  headGrad.addColorStop(0, "#4338CA");
  headGrad.addColorStop(1, "#7C3AED");
  ctx.font = "bold 60px Arial"; ctx.textAlign = "center";
  ctx.fillStyle = headGrad;
  ctx.fillText("Share Your Experience", W / 2, 234);
  ctx.fillStyle = "#111827";
  ctx.fillText("in Seconds", W / 2, 298);

  // ── sub-text ───────────────────────────────────────────────────────────────
  txt("Scan the smart QR to post your genuine Google review", W / 2, 334, "16px Arial", "#6b7280");

  // ── Scan. Share. Support. tagline ──────────────────────────────────────────
  const ssY = 366;
  sparkle(W / 2 - 148, ssY + 3, 14, "#6366f1");
  sparkle(W / 2 + 140, ssY + 3, 14, "#6366f1");
  const ssParts = [["Scan.", "#06B6D4"], [" Share.", "#EA4335"], [" Support.", "#34A853"]];
  ctx.font = "bold 17px Arial";
  let ssTotalW = ssParts.reduce((s, [t]) => { ctx.font = "bold 17px Arial"; return s + ctx.measureText(t).width; }, 0);
  let ssx = W / 2 - ssTotalW / 2;
  ssParts.forEach(([t, col]) => {
    ctx.font = "bold 17px Arial"; ctx.textAlign = "left"; ctx.fillStyle = col;
    ctx.fillText(t, ssx, ssY); ssx += ctx.measureText(t).width;
  });

  // ── QR card container ──────────────────────────────────────────────────────
  const cardX = 80, cardY = 390, cardW = W - 160, cardH = 375;
  ctx.shadowColor = "rgba(79,70,229,0.13)"; ctx.shadowBlur = 28; ctx.shadowOffsetY = 10;
  rrFill(cardX, cardY, cardW, cardH, 26, "#ffffff");
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // ── "G  Leave a Google Review" header inside card ──────────────────────────
  const glrY = cardY + 42;
  // Google G circle
  const gciX = W / 2 - 115, gciY = glrY - 10, gcR = 14;
  ctx.beginPath(); ctx.arc(gciX, gciY, gcR, 0, PI * 2);
  ctx.fillStyle = "#fff"; ctx.fill();
  ctx.strokeStyle = "#4285F4"; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.font = "bold 15px Arial"; ctx.fillStyle = "#4285F4"; ctx.textAlign = "center";
  ctx.fillText("G", gciX, gciY + 5);
  // dashes and label
  ctx.strokeStyle = "#9ca3af"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cardX + 28, glrY - 10); ctx.lineTo(gciX - gcR - 10, glrY - 10); ctx.stroke();
  txt("Leave a Google Review", W / 2 + 12, glrY, "bold 21px Arial", "#111827");
  ctx.font = "bold 21px Arial";
  const lgrW = ctx.measureText("Leave a Google Review").width;
  ctx.strokeStyle = "#9ca3af"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W / 2 + 12 + lgrW / 2 + 12, glrY - 10); ctx.lineTo(cardX + cardW - 28, glrY - 10); ctx.stroke();

  // ── QR area: white square with Google-colored rounded border ───────────────
  const QW = 320, QH = 300, QX = (W - QW) / 2, QY = cardY + 62, QR_ = 24;
  rrFill(QX, QY, QW, QH, QR_, "#ffffff");

  // Google 4-color border (blue→red→yellow→green)
  const bx = QX, by = QY, bw = QW, bh = QH, br = QR_;
  ctx.lineCap = "butt"; ctx.lineWidth = 9;
  seg("#4285F4", bx + br, by, bx + bw - br, by);
  arcSeg("#4285F4", bx + bw - br, by + br, br, -PI / 2, -PI / 4);
  arcSeg("#EA4335", bx + bw - br, by + br, br, -PI / 4, 0);
  seg("#EA4335", bx + bw, by + br, bx + bw, by + bh - br);
  arcSeg("#EA4335", bx + bw - br, by + bh - br, br, 0, PI / 4);
  arcSeg("#FBBC05", bx + bw - br, by + bh - br, br, PI / 4, PI / 2);
  seg("#FBBC05", bx + bw - br, by + bh, bx + br, by + bh);
  arcSeg("#FBBC05", bx + br, by + bh - br, br, PI / 2, PI * 3 / 4);
  arcSeg("#34A853", bx + br, by + bh - br, br, PI * 3 / 4, PI);
  seg("#34A853", bx, by + bh - br, bx, by + br);
  arcSeg("#34A853", bx + br, by + br, br, PI, PI * 5 / 4);
  arcSeg("#4285F4", bx + br, by + br, br, PI * 5 / 4, PI * 3 / 2);

  // ── QR code drawn inside the white square ──────────────────────────────────
  const pad = 16;
  ctx.drawImage(qrCanvas, QX + pad, QY + pad, QW - pad * 2, QH - pad * 2);

  // ── Feature icons row ──────────────────────────────────────────────────────
  const FEATS = [
    { col: "#4285F4", label: "Easy to Scan",          desc: ["Just one quick",    "scan to begin"],          icon: "scan"   },
    { col: "#EA4335", label: "Your Voice Matters",    desc: ["Share your real",   "experience"],             icon: "shield" },
    { col: "#FBBC05", label: "Help Others Decide",    desc: ["Your review guides","future customers"],       icon: "star"   },
    { col: "#34A853", label: "Support Small Business",desc: ["Your feedback",     "helps us grow"],          icon: "people" },
  ];
  const FY = 865, FS = W / 4;
  FEATS.forEach((f, i) => {
    const fx = FS * i + FS / 2, R = 37;
    ctx.beginPath(); ctx.arc(fx, FY, R, 0, PI * 2); ctx.fillStyle = f.col; ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
    if (f.icon === "scan") {
      const s = 10, d = 8;
      [[fx-d-s,FY-d,fx-d,FY-d],[fx-d,FY-d,fx-d,FY-d-s],[fx+d+s,FY-d,fx+d,FY-d],[fx+d,FY-d,fx+d,FY-d-s],
       [fx-d-s,FY+d,fx-d,FY+d],[fx-d,FY+d,fx-d,FY+d+s],[fx+d+s,FY+d,fx+d,FY+d],[fx+d,FY+d,fx+d,FY+d+s]
      ].forEach(([x1,y1,x2,y2]) => { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); });
    } else if (f.icon === "shield") {
      ctx.beginPath();
      ctx.moveTo(fx, FY-R*0.58); ctx.lineTo(fx+R*0.52, FY-R*0.28); ctx.lineTo(fx+R*0.52, FY+R*0.12);
      ctx.quadraticCurveTo(fx+R*0.52, FY+R*0.6, fx, FY+R*0.75);
      ctx.quadraticCurveTo(fx-R*0.52, FY+R*0.6, fx-R*0.52, FY+R*0.12);
      ctx.lineTo(fx-R*0.52, FY-R*0.28); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx-R*0.22, FY+R*0.1); ctx.lineTo(fx, FY+R*0.32); ctx.lineTo(fx+R*0.28, FY-R*0.12); ctx.stroke();
    } else if (f.icon === "star") {
      ctx.beginPath(); ctx.fillStyle = "#fff";
      for (let j = 0; j < 5; j++) {
        const a1 = (PI*2/5)*j - PI/2, a2 = a1 + PI/5;
        j === 0 ? ctx.moveTo(fx+R*0.55*Math.cos(a1), FY+R*0.55*Math.sin(a1))
                : ctx.lineTo(fx+R*0.55*Math.cos(a1), FY+R*0.55*Math.sin(a1));
        ctx.lineTo(fx+R*0.22*Math.cos(a2), FY+R*0.22*Math.sin(a2));
      }
      ctx.closePath(); ctx.fill();
    } else if (f.icon === "people") {
      ctx.fillStyle = "#fff";
      [[-R*0.37, 0], [0, -R*0.05], [R*0.37, 0]].forEach(([ox, oy]) => {
        ctx.beginPath(); ctx.arc(fx+ox, FY-R*0.2+oy, R*0.16, 0, PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(fx+ox, FY+R*0.26+oy, R*0.2, PI, PI*2); ctx.fill();
      });
    }
    ctx.lineWidth = 1; ctx.lineCap = "butt";
    const words = f.label.split(" ");
    const lines = []; let cur = ""; ctx.font = "bold 13px Arial";
    words.forEach(w => {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > FS - 14) { if (cur) lines.push(cur); cur = w; } else cur = test;
    });
    if (cur) lines.push(cur);
    lines.forEach((ln, li) => txt(ln, fx, FY + 52 + li * 17, "bold 13px Arial", "#111827"));
    const descY = FY + 52 + lines.length * 17;
    f.desc.forEach((ln, li) => txt(ln, fx, descY + li * 15, "11px Arial", "#6b7280"));
  });

  // ── Bottom info bar: website + play store ──────────────────────────────────
  const barX = 62, barY = 988, barW = W - 124, barH = 70;
  ctx.shadowColor = "rgba(0,0,0,0.06)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
  rrFill(barX, barY, barW, barH, 18, "#F1F0FF");
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  rrStroke(barX, barY, barW, barH, 18, "#e0e7ff", 1);

  // globe icon — circle with equator + meridian oval
  const giX = barX + 40, giY = barY + barH / 2;
  ctx.beginPath(); ctx.arc(giX, giY, 15, 0, PI * 2); ctx.fillStyle = "#ede9fe"; ctx.fill();
  ctx.strokeStyle = "#5B21B6"; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(giX, giY, 11, 0, PI * 2); ctx.stroke();
  // equator
  ctx.beginPath(); ctx.moveTo(giX - 11, giY); ctx.lineTo(giX + 11, giY); ctx.stroke();
  // vertical centre line
  ctx.beginPath(); ctx.moveTo(giX, giY - 11); ctx.lineTo(giX, giY + 11); ctx.stroke();
  // meridian oval (ellipse gives depth to globe)
  ctx.beginPath(); ctx.ellipse(giX, giY, 6, 11, 0, 0, PI * 2); ctx.stroke();
  txt("Visit us at", barX + 64, barY + 28, "12px Arial", "#6b7280", "left");
  txt("www.revyneai.com", barX + 64, barY + 48, "bold 14px Arial", "#111827", "left");

  // center divider
  ctx.strokeStyle = "#d1d5db"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W / 2, barY + 14); ctx.lineTo(W / 2, barY + barH - 14); ctx.stroke();

  // play store icon — colorful Google Play triangle
  const psX = W / 2 + 22, psY = barY + barH / 2;
  const psCX = psX + 18;
  ctx.beginPath(); ctx.arc(psCX, psY, 15, 0, PI * 2); ctx.fillStyle = "#e8f5e9"; ctx.fill();
  // clip to play-triangle shape then fill 4 quadrants with Google colors
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(psCX - 8, psY - 11); ctx.lineTo(psCX + 10, psY); ctx.lineTo(psCX - 8, psY + 11);
  ctx.closePath(); ctx.clip();
  // top-left quadrant: teal
  ctx.fillStyle = "#00ACC1";
  ctx.beginPath(); ctx.moveTo(psCX-8,psY-11); ctx.lineTo(psCX+10,psY); ctx.lineTo(psCX-8,psY); ctx.closePath(); ctx.fill();
  // bottom-left quadrant: green
  ctx.fillStyle = "#43A047";
  ctx.beginPath(); ctx.moveTo(psCX-8,psY); ctx.lineTo(psCX+10,psY); ctx.lineTo(psCX-8,psY+11); ctx.closePath(); ctx.fill();
  // split top half diagonally: top-right area yellow
  ctx.fillStyle = "#FDD835";
  ctx.beginPath(); ctx.moveTo(psCX-1,psY-6); ctx.lineTo(psCX+10,psY); ctx.lineTo(psCX-1,psY); ctx.closePath(); ctx.fill();
  // split bottom half diagonally: bottom-right area red
  ctx.fillStyle = "#E53935";
  ctx.beginPath(); ctx.moveTo(psCX-1,psY); ctx.lineTo(psCX+10,psY); ctx.lineTo(psCX-1,psY+6); ctx.closePath(); ctx.fill();
  ctx.restore();
  txt("Install RevYne", psX + 42, barY + 28, "12px Arial", "#6b7280", "left");
  txt("from Play Store", psX + 42, barY + 48, "bold 14px Arial", "#111827", "left");

  // ── footer: Powered by RevYne ──────────────────────────────────────────────
  const footY = 1086;
  txt("Powered by", W / 2 - 68, footY, "16px Arial", "#374151");
  rrFill(W / 2 - 46, footY - 18, 30, 30, 7, "#7c3aed");
  ctx.fillStyle = "#fff"; ctx.font = "bold 13px Arial"; ctx.textAlign = "center";
  ctx.fillText("R", W / 2 - 31, footY - 1);
  txt("RevYne", W / 2 - 10, footY, "bold 20px Arial", "#7c3aed", "left");

  // ── contact line ───────────────────────────────────────────────────────────
  txt("Contact us for Order QR :", W / 2 - 46, 1136, "14px Arial", "#374151");
  ctx.strokeStyle = "#9ca3af"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W / 2 + 66, 1131); ctx.lineTo(W / 2 + 215, 1131); ctx.stroke();

  return c.toDataURL("image/png");
}

function downloadReviewQr() {
  const btn = document.querySelector("[data-download-qr]");
  if (btn) { btn.disabled = true; btn.textContent = "Preparing…"; }
  getQrTemplateDataUrl()
    .then((dataUrl) => {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = getQrFileName();
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("✓ QR downloaded");
    })
    .catch((error) => {
      console.warn("Could not download QR:", error);
      showToast("Could not prepare QR. Check your connection and try again.");
    })
    .finally(() => { if (btn) { btn.disabled = false; btn.textContent = "Download QR"; } });
}

function printReviewQr() {
  const btn = document.querySelector("[data-print-qr]");
  if (btn) { btn.disabled = true; btn.textContent = "Preparing..."; }
  const pw = window.open("", "_blank", "width=820,height=1060");
  if (pw) {
    pw.document.write(`<!doctype html><html><head><title>Preparing RevYne QR</title>
      <style>body{font-family:Arial,sans-serif;display:grid;min-height:100vh;place-items:center;color:#111827}</style>
      </head><body><p>Preparing your RevYne QR...</p></body></html>`);
    pw.document.close();
  }

  getQrTemplateDataUrl()
    .then((dataUrl) => {
      if (!pw) { showToast("Allow popups to print QR"); return; }
      pw.document.open();
      pw.document.write(`<!doctype html><html><head><title>RevYne QR</title>
        <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#fff}
        img{width:100%;max-width:900px;display:block;margin:0 auto}
        @media print{@page{margin:0}body{margin:0}}</style></head>
        <body><img src="${dataUrl}" alt="RevYne QR Template" onload="window.focus();window.print()"></body></html>`);
      pw.document.close();
    })
    .catch((error) => {
      console.warn("Could not print QR:", error);
      if (pw && !pw.closed) pw.close();
      showToast("Could not prepare QR. Check your connection and try again.");
    })
    .finally(() => { if (btn) { btn.disabled = false; btn.textContent = "Print QR"; } });
}

function navIcon(view) {
  const paths = {
    dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    business: "M12 3L2 9v12h7v-7h6v7h7V9L12 3zm0 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4z",
    reply: "M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0L3 17.25V21h3.75L20.71 7.04z",
    pricing: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z",
    profile: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 2 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
  };

  // GMB tab uses a custom multi-color Google "G" icon rendered inline
  if (view === "gmb") {
    const connected = state?.gmb?.connected;
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="${connected ? "#4285F4" : "currentColor"}" opacity="${connected ? "1" : "0.5"}"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="${connected ? "#34A853" : "currentColor"}" opacity="${connected ? "1" : "0.5"}"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="${connected ? "#FBBC05" : "currentColor"}" opacity="${connected ? "1" : "0.5"}"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="${connected ? "#EA4335" : "currentColor"}" opacity="${connected ? "1" : "0.5"}"/>
    </svg>`;
  }

  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="${paths[view] || ""}"/></svg>`;
}

function bottomNavItem(view, label) {
  const active = getBottomNavView() === view;
  return `
    <button class="bnav-item ${active ? "active" : ""}" type="button" data-view="${view}">
      ${navIcon(view)}
      <span class="bnav-label">${label}</span>
    </button>
  `;
}

function onboardingShell(content) {
  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="topbar-main">
          <div class="brand">
            <img class="brand-mark" src="./assets/favicon.png?v=20260514-1" alt="" />
            <span>RevYne</span>
          </div>
        </div>
      </header>
      <div class="layout">
        <main class="main">
          <div class="onboarding-header">
            <h2 class="onboarding-title">👋 Welcome to RevYne!</h2>
            <p class="onboarding-sub">Let's set up your business profile first. This takes 2 minutes and unlocks your Google review link, QR code, and AI tools.</p>
            <div class="onboarding-steps">
              <div class="onb-step active"><span class="onb-num">1</span> Business Details</div>
              <div class="onb-step-sep">→</div>
              <div class="onb-step"><span class="onb-num">2</span> Share QR</div>
              <div class="onb-step-sep">→</div>
              <div class="onb-step"><span class="onb-num">3</span> Get Reviews</div>
            </div>
          </div>
          ${content}
        </main>
      </div>
    </div>
  `;
}

function appShell(content) {
  const activeBottomIndex = Math.max(0, navOrder.indexOf(getBottomNavView()));
  const navAnimationClass = bottomNavShouldAnimate ? " animate" : "";

  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="topbar-main">
          <div class="brand">
            <img class="brand-mark" src="./assets/favicon.png?v=20260514-1" alt="" />
            <span>RevYne</span>
          </div>
        </div>
        <nav class="nav">
          ${navButton("Dashboard", "dashboard")}
          ${navButton("Smart Reply", "reply")}
          ${navButton("Google Business", "gmb")}
          ${navButton("Pricing", "pricing")}
          ${navButton("My Business", "business")}
          ${navButton("Profile", "profile")}
          <button class="logout" type="button">Logout</button>
        </nav>
      </header>
      <div class="layout">
        <main class="main">${content}</main>
      </div>
      <nav class="bottom-nav${navAnimationClass}" style="--from-index:${bottomNavFromIndex}; --active-index:${activeBottomIndex};">
        ${bottomNavItem("dashboard", "Home")}
        ${bottomNavItem("business", "Business")}
        ${bottomNavItem("reply", "AI Reply")}
        ${bottomNavItem("gmb", "Google")}
        ${bottomNavItem("profile", "Profile")}
      </nav>
    </div>
    <div class="copy-toast"></div>

    ${state.showGuestLimitModal ? `
    <div class="modal-overlay" id="guest-limit-modal">
      <div class="modal-card">
        <div class="modal-icon">🔒</div>
        <h2 class="modal-title">You've used your 5 free replies</h2>
        <p class="modal-body">Sign in with Google to get <strong>20 free AI replies</strong> every month — plus your personal review link and QR code.</p>
        <button class="button full" type="button" data-auth-google style="margin-bottom:10px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:8px;"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google — it's free
        </button>
        <button class="button ghost full" type="button" data-close-guest-modal>Maybe later</button>
      </div>
    </div>
    ` : ""}
  `;
}

function navButton(label, view) {
  return `<button class="${state.view === view ? "active" : ""}" type="button" data-view="${view}">${label}</button>`;
}
function dashboardGmbCard() {
  const gmb = state.gmb || {};
  if (!gmb.connected) {
    return `
      <div class="panel gmb-dash-card gmb-dash-connect">
        <div class="gmb-dash-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </div>
        <div class="gmb-dash-text">
          <strong>Connect Google Business</strong>
          <p>Track your GMB health score, reply to reviews, and optimize your profile with AI.</p>
        </div>
        <button class="button secondary small" type="button" data-view="gmb">Connect →</button>
      </div>`;
  }

  const score = gmb.healthScore;
  const scoreColor = score >= 80 ? "#34A853" : score >= 55 ? "#FBBC05" : "#EA4335";
  const scoreLabel = score >= 80 ? "Excellent" : score >= 55 ? "Good" : "Needs Work";
  const gmrCount = (gmb.reviews || []).length;

  return `
    <div class="panel gmb-dash-card gmb-dash-live" data-view="gmb" style="cursor:pointer;">
      <div class="gmb-dash-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span class="gmb-dash-loc">${escapeHtml(gmb.locationName || "Google Business")}</span>
        <span class="gmb-connected-dot"></span>
      </div>
      <div class="gmb-dash-metrics">
        <div class="gmb-score-ring" style="--score-color:${scoreColor}">
          <div class="gmb-score-num">${score !== null ? score : "–"}</div>
          <div class="gmb-score-lbl">${score !== null ? scoreLabel : "Tap to load"}</div>
        </div>
        <div class="gmb-dash-stats">
          <div class="gmb-stat"><span class="gmb-stat-val">${gmrCount > 0 ? gmrCount : "–"}</span><span class="gmb-stat-key">Reviews</span></div>
        </div>
      </div>
    </div>`;
}

function dashboardPage() {
  return dashboardPageClean();
}

function dashboardPageClean() {
  const reviewUrl = getReviewUrl();
  const hasBusiness = hasBusinessProfile();
  const hasPublicToken = Boolean(state.business.publicToken);
  const ds = state.dashboardStats || {};
  const totalReviews = ds.totalReviews || 0;
  const avgRating = ds.avgRating || 0;
  const recentReviews = ds.recentReviews || [];
  const statsLoaded = ds.loaded !== false;

  const starBar = (rating) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return `<span class="db-stars">${"★".repeat(full)}${"½".repeat(half)}${"☆".repeat(empty)}</span>`;
  };

  const recentReviewsHTML = recentReviews.length > 0
    ? recentReviews.map(r => {
        const date = new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        const stars = "★".repeat(r.rating || 0) + "☆".repeat(5 - (r.rating || 0));
        const preview = r.customer_experience ? escapeHtml(r.customer_experience).slice(0, 120) + (r.customer_experience.length > 120 ? "…" : "") : "No message left";
        return `
          <div class="panel dash-review-card">
            <div class="dash-review-top">
              <span class="dash-review-stars">${stars}</span>
              <span class="dash-review-date">${date}</span>
            </div>
            <p class="dash-review-text">${preview}</p>
            <button class="button ghost small" type="button" data-view="reply" style="margin-top:8px;">✦ Generate Reply</button>
          </div>`;
      }).join("")
    : `<div class="panel empty-state">
        <strong>No sessions yet</strong>
        <p>Once a customer scans your QR, generates a draft, and copies it — it'll appear here.</p>
       </div>`;

  return `
    <section class="dash-wrap">
      <div class="dash-welcome">
        <p class="dash-sub">Welcome back, <strong>${escapeHtml(state.user.name || state.business.name || "there")}</strong>. Current plan: <strong>${escapeHtml(getEffectivePlan().toUpperCase())}</strong></p>
      </div>

      <div class="dash-metrics">
        <div class="panel metric-wide">
          <div>
            <div class="metric-label">Average Rating</div>
            <div class="metric-big-row">
              <span class="metric-big">${statsLoaded ? (totalReviews > 0 ? avgRating.toFixed(1) : "—") : "…"}</span>
              ${totalReviews > 0 ? starBar(avgRating) : `<span class="metric-stars">${totalReviews === 0 && statsLoaded ? "No reviews yet" : ""}</span>`}
            </div>
          </div>
          <button class="metric-icon-circle" type="button" data-refresh-dashboard title="Refresh stats">↻</button>
        </div>
        <div class="panel metric-half">
          <div class="metric-label">Reviews Copied</div>
          <div class="metric-num">${statsLoaded ? totalReviews : "…"}</div>
          <div class="metric-trend positive">${totalReviews > 0 ? "Via your QR link" : "Scan QR to start"}</div>
        </div>
        <div class="panel metric-half">
          <div class="metric-label">AI Replies Used</div>
          <div class="metric-num">${statsLoaded ? (ds.aiRepliesUsed ?? 0) : "…"}</div>
          <div class="metric-trend brand">This month</div>
        </div>
      </div>

      ${dashboardGmbCard()}

      <div class="ai-spotlight">
        <div class="ai-spotlight-inner">
          <div class="ai-icon-box">&#10022;</div>
          <div>
            <div class="ai-spotlight-title">Smart Reply Ready</div>
            <p class="ai-spotlight-sub">Paste a real customer review and generate professional draft replies instantly.</p>
          </div>
        </div>
        <button class="button full" type="button" data-view="reply" style="margin-top:14px;">Generate Reply</button>
      </div>

      <div class="recent-reviews">
        <div class="recent-header">
          <span class="recent-title">Recent Reviews</span>
          ${totalReviews > 5 ? `<button class="view-all" type="button" data-view="reply">View All</button>` : ""}
        </div>
        ${recentReviewsHTML}
      </div>

      <div class="panel review-link-panel qr-panel">
        <div class="qr-panel-copy">
          <h3>Your Review QR</h3>
          <p class="hint">Put this on bills, WhatsApp messages, front desk posters, and delivery cards.</p>
          ${hasPublicToken ? "" : `<p class="qr-warning">Save your business profile once to create a permanent public review link.</p>`}
          <input class="input" readonly value="${escapeHtml(reviewUrl)}" style="margin:12px 0;" />
          <div class="option-row qr-actions">
            <button class="button" type="button" data-copy="${escapeHtml(reviewUrl)}">Copy Link</button>
            <button class="button secondary" type="button" data-download-qr>Download QR</button>
            <button class="button ghost" type="button" data-print-qr>Print QR</button>
            <button class="button ghost" type="button" data-view="public">Preview Page</button>
          </div>
        </div>
        <div class="qr-preview-card">
          <canvas class="qr-canvas" data-qr-code="${escapeHtml(reviewUrl)}" width="220" height="220"></canvas>
          <span>Scan to review</span>
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
  const proMax = isProMaxPlan();
  const effectivePlan = getEffectivePlan();
  const categoryMeta = getCategoryMeta(b.category);

  // Language section — rules by plan
  let langSection;
  if (effectivePlan === "free") {
    // Ensure language is one of the 2 free options
    if (b.language !== "English" && b.language !== "Hindi") {
      b.language = "English";
      saveState();
    }
    langSection = `
      <div class="field">
        <label>Language</label>
        <div class="option-row" style="flex-wrap:wrap; gap:8px; justify-content:flex-start;">
          ${chip("language", "English")}
          ${chip("language", "Hindi")}
        </div>
        <p class="hint" style="margin-top:6px;">Free plan: English &amp; Hindi only. <button class="link-btn" type="button" data-view="pricing">Upgrade to unlock more</button></p>
      </div>`;
  } else if (effectivePlan === "pro") {
    const langs = state.proLanguages?.length > 0 ? state.proLanguages : ["English", "Hindi"];
    langSection = `
      <div class="field">
        <label>Choose Language</label>
        <div class="option-row" style="flex-wrap:wrap; gap:8px; justify-content:flex-start;">
          ${langs.map(l => chip("language", l)).join("")}
        </div>
        <p class="hint" style="margin-top:6px;">${state.proLanguages?.length > 0 ? `✓ ${state.proLanguages.length} languages selected. ` : ""}Configure your 5 languages on the <button class="link-btn" type="button" data-view="pricing">Pricing page</button></p>
      </div>`;
  } else {
    // pro_max or pro_yearly — all 24 languages
    langSection = `
      <div class="field">
        <label>Choose Language</label>
        <div class="option-row" style="flex-wrap:wrap; gap:8px; justify-content:flex-start;">
          ${INDIAN_LANGUAGES.map(l => chip("language", l)).join("")}
        </div>
        <p class="hint" style="margin-top:6px;">✓ All 24 Indian languages included with your plan</p>
      </div>`;
  }
  return `
    <section class="panel form-panel">
      <div class="required-note" id="required-note" hidden>⚠ Please fill in all required fields (*) before saving.</div>
      <div class="field">
        <label for="profile-image">Profile Picture</label>
        <div class="profile-upload-row">
          <div class="profile-upload-preview">
            ${b.logo ? `<img src="${escapeHtml(b.logo)}" alt="Business profile" />` : `<span>${escapeHtml((b.name || state.user.name || "R").charAt(0).toUpperCase())}</span>`}
          </div>
          <div>
            <input id="profile-image" class="file-input" type="file" accept="image/png,image/jpeg,image/webp" data-profile-image />
            <label class="button secondary file-button" for="profile-image">Upload Picture</label>
            <p class="hint">Use a square logo or owner photo under 700 KB.</p>
          </div>
        </div>
      </div>
      ${inputField("Business Name *", "name", b.name)}
      <div class="field">
        <label for="field-category">Category *</label>
        <select id="field-category" class="select" data-field="category">
          ${selectOptions(BUSINESS_CATEGORIES.map((item) => item.value), b.category, "Select category")}
        </select>
      </div>
      ${inputField("City", "city", b.city)}
      <div class="field">
        <div class="label-with-info">
          <label for="field-googleUrl">Google Review URL *</label>
          <button class="info-button" type="button" data-toggle-review-url-help aria-label="How to get Google Review URL">i</button>
        </div>
        <input id="field-googleUrl" class="input" placeholder="Paste your Google review link" value="${escapeHtml(b.googleUrl)}" data-field="googleUrl" />
        <div class="review-url-help" data-review-url-help hidden>
          <strong>How to get this link</strong>
          <ol>
            <li>Open Google Maps and search your business name.</li>
            <li>Open your Business Profile and tap <b>Ask for reviews</b> or <b>Share review form</b>.</li>
            <li>Copy the review link and paste it here.</li>
          </ol>
          <p>If you do not see it, open Google Business Profile Manager, select your business, then choose <b>Ask for reviews</b>.</p>
        </div>
      </div>
      ${inputField("Keywords (comma separated)", "keywords", b.keywords)}

      <div class="pro-settings ${proMax ? "" : "locked"}">
        <div class="pro-settings-head">
          <div>
            <strong>Pro Max Review Personalization</strong>
            <p>These options appear on your customer review page for hyper-personalized review drafts.</p>
          </div>
          <span>${proMax ? "Enabled" : "Pro Max"}</span>
        </div>
        <div class="field">
          <label for="field-services">5 Main Services</label>
          <input id="field-services" class="input" placeholder="Example: buying consultation, selling plots, flats, apartments, commercial property" value="${escapeHtml(b.services)}" data-field="services" ${proMax ? "" : "disabled"} />
        </div>
        <div class="field">
          <label for="field-serviceTypes">${escapeHtml(categoryMeta.typeLabel)}</label>
          <input id="field-serviceTypes" class="input" placeholder="${escapeHtml(categoryMeta.typePlaceholder)}" value="${escapeHtml(b.serviceTypes || "")}" data-field="serviceTypes" ${proMax ? "" : "disabled"} />
        </div>
        <p class="pro-settings-note">${proMax ? "Tip: separate each option with commas. The app will show up to 5 services." : "Upgrade to Pro Max to edit these fields. Other plans can view them but cannot use them."}</p>
      </div>

      ${langSection}

      <div class="field">
        <label>Default Tone</label>
        <div class="option-row" style="justify-content:flex-start; gap:8px; flex-wrap:wrap;">
          ${chip("tone", "Professional")}
          ${chip("tone", "Friendly")}
          ${chip("tone", "Enthusiastic")}
        </div>
      </div>

      <div class="field">
        <label for="field-mobile">Mobile Number</label>
        <div style="display:flex; gap:10px; align-items:center;">
          <input id="field-mobile" type="tel" class="input" style="flex:1;" maxlength="10" pattern="[0-9]{10}" placeholder="10-digit mobile number" value="${escapeHtml(b.mobile)}" data-field="mobile" />
          <button class="button secondary" type="button" data-save-mobile style="white-space:nowrap; min-height:50px; padding:0 18px; flex-shrink:0;">Save</button>
        </div>
        <p class="hint" style="margin-top:4px;">Saved separately for quick updates.</p>
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

function selectOptions(items, selected, placeholder) {
  return [
    `<option value="">${escapeHtml(placeholder)}</option>`,
    ...items.map((item) => `<option value="${escapeHtml(item)}" ${item === selected ? "selected" : ""}>${escapeHtml(item)}</option>`)
  ].join("");
}

function replyPage() {
  const draft = state.replyDraft || {};
  const buttonText = isGeneratingReply ? "Generating replies..." : "Generate Smart Replies";
  return `
    <section class="panel reply-card">
      <div class="field">
        <input id="customerName" class="input" placeholder="Customer Name" value="${escapeHtml(draft.customerName || "")}" data-reply-draft="customerName" />
      </div>
      <label><strong>Rating</strong></label>
      <div class="stars">${stars("replyRating")}</div>
      <div class="field">
        <textarea id="customerReview" class="textarea" placeholder="Review Text" data-reply-draft="reviewText">${escapeHtml(draft.reviewText || "")}</textarea>
      </div>
      <button class="button full ${isGeneratingReply ? "is-loading" : ""}" type="button" data-generate-reply ${isGeneratingReply ? "disabled" : ""}>
        ${isGeneratingReply ? `<span class="button-spinner"></span>` : ""}
        <span>${buttonText}</span>
      </button>
      ${isGeneratingReply ? `<div class="reply-loading-note">Using AI to write concise replies. This usually takes a few seconds.</div>` : ""}
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

function legacyPricingPage() {
  const plans = [
    ["Free", "₹0 / month", "", false],
    ["Pro Monthly", "₹149 / month", "₹449 / month", false],
    ["Pro 6-Month Plan", "₹449 / 6 months", "₹1499 / 6 months", false],
    ["Pro Yearly", "₹999 / year", "₹2499 / year", true]
  ];
  return `<section class="pricing-grid">${plans.map(planCard).join("")}</section>`;
}

function legacyPlanCard([name, price, oldPrice, featured]) {
  const free = name === "Free";
  const features = [
    ["Unlimited QR Scans", true],
    [`AI Generated ${free ? "2" : "5"} Review Suggestions`, true],
    ["Editable Keywords", !free],
    ["Use Brand Name in Keyword", !free],
    ["Smart SEO Friendly Reply", !free],
    ["Multi-language Support", !free],
    ["Tone Customization", !free],
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

function pricingPage() {
  const plans = [
    { id: "free", name: "Free", price: "Rs 0 / month", oldPrice: "", featured: false },
    { id: "pro", name: "Pro Monthly", price: "Rs 149 / month", oldPrice: "Rs 449 / month", featured: false },
    { id: "pro_max", name: "Pro Max Monthly", price: "Rs 199 / month", oldPrice: "Rs 599 / month", featured: true },
    { id: "pro_yearly", name: "Pro Yearly", price: "Rs 999 / year", oldPrice: "Rs 2499 / year", featured: false }
  ];

  return `<section class="pricing-grid">${plans.map(planCard).join("")}</section>`;
}

function planCard({ id, name, price, oldPrice, featured }) {
  const free = id === "free";
  const proMax = id === "pro_max";
  const proOrAbove = !free;
  const features = [
    ["Unlimited QR Scans", true],
    [`AI Generated ${free ? "2" : "5"} Review Suggestions`, true],
    ["Editable Services and Keywords", proOrAbove],
    ["Smart SEO Friendly Reply", proOrAbove],
    ["Service/Product Review Selection", proMax],
    ["In-depth SEO Review Generator", proMax],
    ["Multi-language Support", proOrAbove],
    ["Tone Customization", proOrAbove],
    ["Included Future Updates", proOrAbove]
  ];

  return `
    <article class="price-card ${featured ? "featured" : ""}">
      ${proMax ? `<div class="plan-badge">New</div>` : ""}
      <h3>${name}</h3>
      <div class="price ${free ? "free" : ""}">
        ${oldPrice ? `<div class="old">${oldPrice}</div>` : ""}
        ${price}
      </div>
      ${features.map(([label, ok]) => `<div class="feature"><span class="${ok ? "yes" : "no"}">${ok ? "✓" : "×"}</span><span class="${ok ? "" : "disabled"}">${label}</span></div>`).join("")}
      ${free ? "" : `<button class="button full" type="button" data-plan-select="${id}">Upgrade</button>`}
    </article>
  `;
}

function pricingPageV2() {
  const plans = [
    {
      id: "free",
      name: "Free",
      label: "Start",
      description: "For testing review collection with a small customer flow.",
      price: "Rs 0",
      period: "/ month",
      oldPrice: "",
      featured: false,
      cta: "Current Plan"
    },
    {
      id: "pro",
      name: "Pro Monthly",
      label: "Popular",
      description: "For active local businesses that need more AI reviews and replies.",
      price: "Rs 149",
      period: "/ month",
      oldPrice: "Rs 449",
      featured: false,
      cta: "Upgrade to Pro"
    },
    {
      id: "pro_max",
      name: "Pro Max Monthly",
      label: "Best for SEO",
      description: "Unlock service selection and deeper, more personalized review drafts.",
      price: "Rs 199",
      period: "/ month",
      oldPrice: "Rs 599",
      featured: true,
      cta: "Upgrade to Pro Max"
    },
    {
      id: "pro_yearly",
      name: "Pro Yearly",
      label: "Best Value",
      description: "A lower yearly cost for businesses ready to use RevYne long term.",
      price: "Rs 999",
      period: "/ year",
      oldPrice: "Rs 2499",
      featured: false,
      cta: "Upgrade Yearly"
    }
  ];

  return `
    <section class="pricing-intro">
      <div>
        <h1 class="page-title">Choose the plan that fits your review workflow</h1>
        <p class="page-subtitle">Every plan keeps review wording honest. Pro Max adds service-level personalization for businesses that want more detailed SEO-friendly drafts.</p>
      </div>
    </section>
    <section class="plan-status-grid">
      ${getPlanStatusDetails().map(([label, value]) => `
        <div class="plan-status-card">
          <strong>${escapeHtml(label)}</strong>
          <span>${escapeHtml(value)}</span>
        </div>
      `).join("")}
    </section>
    ${subscriptionManagePanel()}
    ${state.checkoutNotice ? `<div class="checkout-notice panel">${escapeHtml(state.checkoutNotice)}</div>` : ""}
    <section class="pricing-grid">${plans.map(planCardV2).join("")}</section>
  `;
}

function formatPlanName(planId) {
  const names = {
    free: "Free",
    pro: "Pro Monthly",
    pro_max: "Pro Max Monthly",
    pro_yearly: "Pro Yearly"
  };
  return names[planId] || "Free";
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDateOnly(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatStatusLabel(value) {
  return String(value || "unknown").replaceAll("_", " ");
}

function getPlanStatusDetails() {
  const plan = getEffectivePlan();
  const status = state.user.planStatus || (plan === "free" ? "free" : "active");
  const renewal = state.user.planCurrentEnd;
  const isPaid = isPaidPlanId(plan);

  const details = [
    ["Current plan", formatPlanName(plan)],
    ["Status", isPaid ? formatStatusLabel(status) : "Active"]
  ];

  if (isPaid) {
    // Next renewal: use stored planCurrentEnd, or compute next calendar-month date
    let renewalLabel;
    if (renewal) {
      renewalLabel = formatDateOnly(renewal);
    } else if (plan === "pro_yearly") {
      renewalLabel = "Yearly – see Razorpay";
    } else {
      // Compute next calendar-month renewal (same day next month)
      const start = state.user.planStartDate ? new Date(state.user.planStartDate) : new Date();
      const next = new Date(start);
      next.setMonth(next.getMonth() + 1);
      renewalLabel = formatDateOnly(next.toISOString());
    }
    details.push(["Next renewal", renewalLabel]);

    if (state.user.subscriptionId) {
      details.push(["Subscription ID", state.user.subscriptionId]);
    }
  }

  return details;
}

function subscriptionManagePanel() {
  const effectivePlan = getEffectivePlan();
  if (!isPaidPlanId(state.user.plan) && effectivePlan === "free") return "";

  const status = state.user.planStatus || "unknown";
  const cancelRequested = status === "cancel_requested";
  const renewal = state.user.planCurrentEnd ? formatDateOnly(state.user.planCurrentEnd) : "the current billing cycle";

  return `
    <section class="panel subscription-manage-panel">
      <div>
        <strong>${cancelRequested ? "Cancellation scheduled" : "Manage subscription"}</strong>
        <p>${cancelRequested
          ? `Your paid access remains available until ${escapeHtml(renewal)}.`
          : "Cancel at the end of the billing cycle. Your paid features remain active until renewal."}</p>
      </div>
      ${cancelRequested
        ? `<button class="button ghost" type="button" disabled>Cancel Requested</button>`
        : `<button class="button danger" type="button" data-cancel-subscription>Cancel Subscription</button>`}
    </section>
  `;
}

function extractPaymentAmount(event) {
  const payment = event?.payload?.payload?.payment?.entity;
  const amount = payment?.amount;
  if (typeof amount === "number") return `Rs ${(amount / 100).toFixed(2)}`;
  if (event?.plan === "pro") return "Rs 149.00";
  if (event?.plan === "pro_max") return "Rs 199.00";
  if (event?.plan === "pro_yearly") return "Rs 999.00";
  return "-";
}

function getPaymentEventSummary(event) {
  const eventName = event.event_name || "";
  const status = event.status || event.payload?.payload?.subscription?.entity?.status || "received";

  if (event.processing_status?.includes("failed") || event.processing_status?.includes("unmatched")) {
    return {
      title: "Needs review",
      subtitle: "Payment was received, but RevYne could not fully update the account automatically.",
      tone: "warning"
    };
  }

  if (eventName === "payment.captured") {
    return {
      title: "Payment received",
      subtitle: "Razorpay confirmed this payment successfully.",
      tone: "success"
    };
  }

  if (eventName === "subscription.activated" || eventName === "subscription.authenticated") {
    return {
      title: "Subscription active",
      subtitle: "Your paid RevYne plan is active.",
      tone: "success"
    };
  }

  if (eventName === "subscription.charged") {
    return {
      title: "Subscription renewed",
      subtitle: "Your recurring plan payment was charged.",
      tone: "success"
    };
  }

  if (eventName === "subscription.cancel_requested") {
    return {
      title: "Cancellation scheduled",
      subtitle: "Your plan remains available until the current billing cycle ends.",
      tone: "warning"
    };
  }

  if (eventName === "subscription.cancelled" || eventName === "subscription.completed" || eventName === "subscription.expired") {
    return {
      title: "Subscription ended",
      subtitle: "Paid access has ended for this subscription.",
      tone: "neutral"
    };
  }

  return {
    title: formatStatusLabel(eventName || "Payment update"),
    subtitle: `Status: ${formatStatusLabel(status)}`,
    tone: "neutral"
  };
}

function paymentEventCard(event, adminMode = false) {
  const summary = getPaymentEventSummary(event);
  const status = formatStatusLabel(event.status || event.payload?.payload?.subscription?.entity?.status || "received");
  const amount = extractPaymentAmount(event);
  const paymentId = event.razorpay_payment_id || event.payload?.payload?.payment?.entity?.id || "";
  const subscriptionId = event.razorpay_subscription_id || event.payload?.payload?.subscription?.entity?.id || "";
  const planName = event.plan ? formatPlanName(event.plan) : "RevYne plan";
  const processingWarning = event.processing_status?.includes("failed") || event.processing_status?.includes("unmatched");

  return `
    <article class="payment-event-card payment-tone-${escapeHtml(summary.tone)}">
      <div>
        <strong>${escapeHtml(summary.title)}</strong>
        <small>${escapeHtml(planName)} &middot; ${escapeHtml(summary.subtitle)}</small>
        <span>${escapeHtml(formatDateTime(event.created_at))}</span>
      </div>
      <div>
        <span class="payment-status">${escapeHtml(status)}</span>
        <span>${escapeHtml(amount)}</span>
      </div>
      ${(adminMode || processingWarning) && event.processing_status ? `<p class="payment-processing ${processingWarning ? "has-warning" : ""}">Processing: ${escapeHtml(formatStatusLabel(event.processing_status))}${event.processing_error ? ` - ${escapeHtml(event.processing_error)}` : ""}</p>` : ""}
      ${(paymentId || subscriptionId) ? `<p class="payment-reference">
        ${paymentId ? `Payment ID: ${escapeHtml(paymentId)}` : ""}
        ${paymentId && subscriptionId ? " · " : ""}
        ${subscriptionId ? `Subscription ID: ${escapeHtml(subscriptionId)}` : ""}
      </p>` : ""}
    </article>
  `;
}

function adminPaymentReliabilityPanel() {
  if (!state.user.isAdmin) return "";
  const events = state.adminPaymentEvents || [];
  const issues = events.filter((event) => {
    const status = event.processing_status || "";
    return status.includes("failed") || status.includes("unmatched") || event.profile_updated === false;
  }).slice(0, 6);

  return `
    <section class="panel payment-events-panel">
      <div class="admin-payment-head">
        <div>
          <h2>Admin Payment Watch</h2>
          <p>Webhook events that may need manual review.</p>
        </div>
        <button class="button secondary" type="button" data-refresh-admin-payments>Refresh</button>
      </div>
      ${issues.length
        ? `<div class="payment-event-list">${issues.map((event) => paymentEventCard(event, true)).join("")}</div>`
        : `<div class="empty-state"><strong>No payment issues detected</strong><p>Recent webhooks are matching profiles and updating plans.</p></div>`}
    </section>
  `;
}

function planCardV2({ id, name, label, description, price, period, oldPrice, featured, cta }) {
  const free = id === "free";
  const proMax = id === "pro_max";
  const proOrAbove = !free;
  const isProMonthly = id === "pro";
  const currentPlan = getEffectivePlan() === id;
  const features = [
    ["Unlimited QR scans", true],
    [`${free ? "2" : "5"} AI review suggestions per customer`, true],
    ["Editable services and keywords", proOrAbove],
    ["Smart SEO-friendly replies", proOrAbove],
    ["Service and type selection on public review page", proMax],
    ["In-depth SEO review generator", proMax],
    ["Multi-language support — choose up to 5 Indian languages", proOrAbove],
    ["Tone customization", proOrAbove],
    ["Future updates included", proOrAbove]
  ];

  const langPicker = isProMonthly ? `
    <div class="lang-picker-box">
      <div class="lang-picker-header">
        <span>Choose up to 5 languages</span>
        <span class="lang-count-badge" id="lang-count-badge">${state.proLanguages?.length || 0}/5</span>
      </div>
      <div class="lang-picker-scroll">
        ${INDIAN_LANGUAGES.map(lang => {
          const checked = state.proLanguages?.includes(lang);
          const disabled = !checked && (state.proLanguages?.length || 0) >= 5;
          return `
            <label class="lang-check-item ${checked ? "checked" : ""} ${disabled ? "lang-disabled" : ""}">
              <input type="checkbox" data-lang-check="${lang}"
                ${checked ? "checked" : ""}
                ${disabled ? "disabled" : ""} />
              <span>${lang}</span>
            </label>
          `;
        }).join("")}
      </div>
      <button class="button full" type="button" data-save-langs style="min-height:40px; font-size:13px; border-radius:10px; margin-top:8px;">
        Save Languages
      </button>
    </div>
  ` : "";

  return `
    <article class="price-card ${featured ? "featured" : ""}">
      <div class="price-card-header">
        <span class="plan-badge">${label}</span>
        ${currentPlan ? `<span class="current-plan-pill">Active</span>` : ""}
      </div>
      <h3>${name}</h3>
      <p class="plan-description">${description}</p>
      <div class="price ${free ? "free" : ""}">
        ${oldPrice ? `<div class="old">${oldPrice}</div>` : ""}
        <span>${price}</span><small>${period}</small>
      </div>
      <div class="feature-list">
        ${features.map(([featureLabel, ok]) => `<div class="feature"><span class="${ok ? "yes" : "no"}">${ok ? "&#10003;" : "&times;"}</span><span class="${ok ? "" : "disabled"}">${featureLabel}</span></div>`).join("")}
      </div>
      ${langPicker}
      ${currentPlan
        ? `<button class="button ghost full" type="button" disabled>Current Plan</button>`
        : free
          ? `<button class="button ghost full" type="button" disabled>Free Included</button>`
          : `<button class="button full" type="button" data-plan-select="${id}" style="margin-top:${isProMonthly ? "8px" : "0"}">${cta}</button>`}
    </article>
  `;
}

function ordersPage() {
  const events = state.paymentEvents || [];
  const planDetails = getPlanStatusDetails();

  return `
    <section class="orders-page">
      <div class="orders-hero panel">
        <div>
          <p class="eyebrow">Billing</p>
          <h1 class="page-title">Order History</h1>
          <p class="page-subtitle">Your Razorpay subscription and payment events appear here after checkout.</p>
        </div>
        <button class="button secondary" type="button" data-refresh-payments>Refresh</button>
      </div>
      <section class="plan-status-grid">
        ${planDetails.map(([label, value]) => `
          <div class="plan-status-card">
            <strong>${escapeHtml(label)}</strong>
            <span>${escapeHtml(value)}</span>
          </div>
        `).join("")}
      </section>
      ${subscriptionManagePanel()}
      <section class="panel payment-events-panel">
        <h2>Invoices & Payments</h2>
        ${events.length
          ? `<div class="payment-event-list">${events.map((event) => paymentEventCard(event)).join("")}</div>`
          : `<div class="empty-state"><strong>No invoices yet</strong><p>Your subscription payments will appear here after Razorpay confirms them.</p></div>`}
      </section>
      ${adminPaymentReliabilityPanel()}
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

function legalShell(title, subtitle, body) {
  const backView = state.isLoggedIn ? "profile" : "dashboard";
  return `
    <section class="legal-page">
      <div class="legal-hero panel">
        <p class="section-kicker">RevYne Legal</p>
        <h1>${title}</h1>
        <p>${subtitle}</p>
        <div class="legal-switcher">
          <button class="button ${state.view === "terms" ? "" : "secondary"}" type="button" data-view="terms">Terms</button>
          <button class="button ${state.view === "privacy" ? "" : "secondary"}" type="button" data-view="privacy">Privacy Policy</button>
          <button class="button ghost" type="button" data-view="${backView}">${state.isLoggedIn ? "Back to Profile" : "Back to Login"}</button>
        </div>
      </div>
      <article class="panel legal-card">
        ${body}
        <div class="legal-note">
          <strong>Note:</strong> This policy text is a practical starting point for launch. Please review it with a legal professional before using RevYne for public paid customers.
        </div>
      </article>
    </section>
  `;
}

function termsPage() {
  return legalShell(
    "Terms & Conditions",
    "The rules for using RevYne to collect honest customer feedback and generate business replies.",
    `
      <p class="legal-date">Last updated: 2 May 2026</p>
      <h2>1. Acceptance of Terms</h2>
      <p>By creating an account, continuing as a guest, or using RevYne, you agree to these Terms & Conditions. If you do not agree, please do not use the service.</p>

      <h2>2. What RevYne Does</h2>
      <p>RevYne helps businesses collect genuine customer feedback, create review links and QR codes, generate wording suggestions from a customer's real experience, and draft professional replies to customer reviews.</p>

      <h2>3. Honest Review Use Only</h2>
      <p>You must not use RevYne to create fake reviews, impersonate customers, hide negative feedback, offer improper incentives for positive reviews, or manipulate public ratings. AI suggestions are only drafts and should be edited so they accurately reflect a real customer's experience.</p>

      <h2>4. Your Account</h2>
      <p>You are responsible for the information added to your account and business profile. Keep your login access secure and tell us if you believe your account has been used without permission.</p>

      <h2>5. Business and Customer Content</h2>
      <p>You remain responsible for business details, customer feedback, review text, replies, uploaded images, and any other content submitted through RevYne. Do not submit unlawful, misleading, abusive, or confidential content that you do not have permission to use.</p>

      <h2>6. AI Output</h2>
      <p>AI-generated review suggestions and replies may be incomplete or inaccurate. You are responsible for reviewing, editing, and approving any output before sharing, copying, or posting it publicly.</p>

      <h2>7. Payments and Plans</h2>
      <p>Paid plans may be billed through Razorpay or another payment provider. Plan limits, pricing, and features may change over time. Subscription changes, cancellations, and refunds will follow the terms shown at checkout and any policy we publish for paid customers.</p>

      <h2>8. Availability</h2>
      <p>We aim to keep RevYne reliable, but we do not guarantee uninterrupted service. Features may be updated, paused, or changed as we improve the product.</p>

      <h2>9. Limitation of Liability</h2>
      <p>RevYne is provided on an "as is" basis. To the maximum extent allowed by law, we are not liable for indirect losses, lost profits, lost data, review platform decisions, or business outcomes resulting from use of the app.</p>

      <h2>10. Contact</h2>
      <p>For questions about these Terms, contact us at <a href="mailto:revyneai@gmail.com">revyneai@gmail.com</a>.</p>
    `
  );
}

function privacyPage() {
  return legalShell(
    "Privacy Policy",
    "How RevYne collects, uses, stores, and protects information for business users and review flows.",
    `
      <p class="legal-date">Last updated: 2 May 2026</p>
      <h2>1. Information We Collect</h2>
      <p>We may collect your name, email address, mobile number, Google account profile details, business name, category, city, Google review URL, services, keywords, uploaded profile image, support tickets, plan details, usage activity, and review or reply drafts created in the app.</p>

      <h2>2. Customer Review Information</h2>
      <p>When customers use a public review page, RevYne may process star ratings, selected services, selected service types, written experiences, generated suggestions, and timestamps so the business can understand and improve its review workflow.</p>

      <h2>3. How We Use Information</h2>
      <p>We use information to create and manage accounts, save business profiles, generate review suggestions and replies, operate QR/public review links, manage support tickets, process payments, prevent misuse, improve the app, and communicate important service updates.</p>

      <h2>4. AI and Third-Party Services</h2>
      <p>RevYne may send relevant prompts or review text to AI providers to generate drafts. We also use service providers such as Supabase for authentication/database services, Vercel for hosting, Google for OAuth login, and Razorpay for payments where enabled.</p>

      <h2>5. Payments</h2>
      <p>Payment details are handled by the payment provider. RevYne stores subscription status, plan, payment event references, and related metadata needed to manage access to paid features.</p>

      <h2>6. Cookies and Local Storage</h2>
      <p>RevYne uses browser storage and service worker caching to keep the app signed in, remember app state, improve loading, and support PWA behavior. If analytics or marketing cookies are added later, this policy and any consent notice should be updated.</p>

      <h2>7. Data Sharing</h2>
      <p>We do not sell personal information. We share data only with service providers needed to run RevYne, comply with law, protect the service, process payments, or respond to support and security issues.</p>

      <h2>8. Data Retention</h2>
      <p>We keep account, business, support, payment, and generated content for as long as needed to provide the service, meet legal or accounting requirements, resolve disputes, and improve reliability.</p>

      <h2>9. Your Choices</h2>
      <p>You may update business and profile information inside the app. For access, correction, deletion, or account-related privacy requests, contact us using the email below.</p>

      <h2>10. Contact</h2>
      <p>For privacy questions or data requests, contact us at <a href="mailto:revyneai@gmail.com">revyneai@gmail.com</a>.</p>
    `
  );
}

function publicReviewPage() {
  const b = state.business;
  const draft = state.reviewDraft || {};
  const categoryMeta = getCategoryMeta(b.category);
  const services = splitList(b.services, [b.category || "General Service"]).slice(0, 5);
  const products = splitList(b.serviceTypes, splitList(b.keywords, ["Standard", "Premium", "Custom Requirement"]));
  const proMax = isPublicBusinessProMax();
  const customerSubtitle = proMax
    ? "Choose details and share your genuine experience"
    : "Share your genuine experience in your own words";
  return `
    <main class="public-body">
      <section class="panel public-card">
        ${state.isLoggedIn ? `<button class="button secondary public-back" type="button" data-back-app>Back to Dashboard</button>` : ""}
        ${b.logo ? `<img class="public-logo" src="${escapeHtml(b.logo)}" alt="${escapeHtml(b.name)}" />` : ""}
        <div class="brand-big">RevYne</div>
        <p class="hint">Turn experiences into clear, honest reviews</p>
        <div class="business-box">
          <h1>${escapeHtml(b.name)}</h1>
          <p class="hint">${customerSubtitle}</p>
        </div>
        <div class="stars">${stars("rating")}</div>
        ${proMax ? `
          <div class="review-customizer">
            <div class="field">
              <label for="reviewService">What service did you use?</label>
              <select id="reviewService" class="select" data-review-draft="service">
                ${selectOptions(services, draft.service, "Select service")}
              </select>
            </div>
            <div class="field">
              <label for="reviewProduct">Which ${escapeHtml(categoryMeta.typeLabel.toLowerCase())}?</label>
              <select id="reviewProduct" class="select" data-review-draft="product">
                ${selectOptions(products, draft.product, `Select ${categoryMeta.typeLabel.toLowerCase()}`)}
              </select>
            </div>
          </div>
        ` : ""}
        <textarea id="reviewText" class="textarea" placeholder="Tell us what actually happened..." data-review-draft="experience" ${isGeneratingReview ? "disabled" : ""}>${escapeHtml(draft.experience || "")}</textarea>
        <button class="button full ${isGeneratingReview ? "is-loading" : ""}" type="button" data-generate-review ${isGeneratingReview ? "disabled" : ""}>
          ${isGeneratingReview ? `<span class="button-spinner"></span>` : ""}
          <span>${isGeneratingReview ? "Generating your review…" : "Generate My Review"}</span>
        </button>
        ${isGeneratingReview ? `<p class="review-loading-note">AI is writing your review draft. This usually takes a few seconds.</p>` : ""}
        ${suggestionList(state.suggestions, true)}
        <p class="public-footnote">AI helps with wording only. Please edit and post only what matches your real experience.</p>
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
        <img class="auth-icon brand-logo-image" src="./assets/revyne-icon-192.png?v=20260512-2" alt="RevYne logo" />
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

      <p class="auth-terms">
        By continuing, you agree to our
        <button type="button" data-view="terms">Terms</button>
        and
        <button type="button" data-view="privacy">Privacy Policy</button>
      </p>
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
        <img class="auth-icon brand-logo-image" src="./assets/revyne-icon-192.png?v=20260512-2" alt="RevYne logo" />
        <div class="auth-brand-name">RevYne</div>
        <div class="auth-tagline">Complete your Google profile</div>
      </div>

      <div class="panel auth-card auth-profile-card">
        <h2>Set Up Your Profile</h2>
        <p class="auth-sub">${supabaseClient ? "This information will be saved to your RevYne account." : "This static MVP stores your login profile locally on this device."}</p>

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

function supportPage() {
  const tickets = state.supportTickets || [];

  const FAQ_SECTIONS = [
    {
      cat: "🚀 Getting Started",
      items: [
        { q: "How do I set up my business profile?", a: "Go to <strong>My Business</strong> tab. Enter your business name, category, and city. Paste your Google Review link (from Google Business Profile → Get more reviews → Share review form). Hit Save — your QR code and public review link are instantly generated." },
        { q: "How do I share the review link with customers?", a: "From the <strong>Dashboard</strong>, you can copy your review link, download the QR code as an image, or print it. Place the QR code at your counter, on your invoice, or packaging — customers scan and review in under 60 seconds." },
        { q: "Do customers need to install an app?", a: "No app needed. Customers scan your QR code or tap the link, fill a short form, receive an AI-drafted review, and copy-paste it onto Google in one tap." },
        { q: "What is the public review page?", a: "It's a branded page hosted at <strong>revyneai.com/review/your-token</strong>. It shows your business name, category, and a star-rating form. After rating, the customer gets 3 AI-written review options in their preferred language." },
      ]
    },
    {
      cat: "✍️ Review Generation",
      items: [
        { q: "How does the AI review suggestion work?", a: "Your customer gives a star rating and optionally their name and city. RevYne generates 3 natural, unique review drafts in the language and tone you've configured. The customer picks one, copies it, and posts it on Google." },
        { q: "Can I generate reviews in Indian languages?", a: "Yes! The <strong>Free plan</strong> supports English and Hindi. <strong>Pro plan</strong> lets you choose up to 5 languages from all 24 Indian languages — including Tamil, Telugu, Gujarati, Bengali, Kannada, Malayalam, Punjabi, Odia, and more. <strong>Pro Max</strong> unlocks all 24 languages." },
        { q: "Can I change the tone of the reviews?", a: "Yes. In <strong>My Business → Default Tone</strong>, choose Professional, Friendly, or Enthusiastic. This tone is applied to all AI-generated review drafts for your business." },
        { q: "Why doesn't the review post directly to Google?", a: "Google's policies do not allow any third-party app to post reviews on behalf of users — only the customer can publish. RevYne makes it as frictionless as possible by pre-writing the review so the customer just copies and pastes it." },
        { q: "The AI review doesn't sound natural. What should I do?", a: "Try switching the tone (Professional / Friendly / Enthusiastic) or changing the language. If a specific language output seems off, raise a ticket with an example — we actively improve language templates." },
      ]
    },
    {
      cat: "💬 Smart Reply",
      items: [
        { q: "What is Smart Reply?", a: "Smart Reply helps you write professional, personalised responses to reviews you've already received on Google. Paste the review text, select the star rating, and get a polished AI reply you can post directly on your Google Business Profile." },
        { q: "How many Smart Replies can I use per month?", a: "<strong>Free</strong>: 20 replies/month. <strong>Pro</strong>: 1,000 replies/month. <strong>Pro Max / Yearly</strong>: 2,500 replies/month. Your usage resets on the 1st of every month." },
        { q: "Can I edit the AI reply before posting?", a: "Yes — copy the reply, then paste and edit it directly in your Google Business Profile before hitting publish." },
      ]
    },
    {
      cat: "💳 Plans & Billing",
      items: [
        { q: "What plans are available?", a: "<strong>Free</strong>: core features, English &amp; Hindi, 20 AI generations/month. <strong>Pro (₹149/mo)</strong>: 1,000 generations, 5 custom languages, 1,000 smart replies. <strong>Pro Max (₹199/mo)</strong>: 2,500 generations, all 24 languages. <strong>Yearly (₹999/yr)</strong>: best value, all Pro Max features." },
        { q: "How do I upgrade my plan?", a: "Go to <strong>Pricing</strong> from the top menu. Choose a plan and tap Upgrade. We use Razorpay — UPI, cards, net banking, and wallets are all accepted." },
        { q: "Can I cancel my subscription anytime?", a: "Yes. Go to <strong>Pricing → Cancel Subscription</strong>. Your plan stays active until the end of the current billing cycle and won't renew after that." },
        { q: "I was charged but my plan didn't activate. What should I do?", a: "Wait 2 minutes and refresh the app — payment webhooks occasionally have a short delay. If your plan is still not activated after 5 minutes, raise a ticket below with your <strong>Razorpay Payment ID</strong> — we resolve payment issues within 2 hours." },
        { q: "Do you offer refunds?", a: "Refunds are available within 24 hours of purchase if you haven't used any AI generations. Raise a ticket with your payment ID and reason. After 24 hours or after usage, refunds are at our discretion." },
      ]
    },
    {
      cat: "👤 Account & Login",
      items: [
        { q: "How do I log in?", a: "RevYne supports <strong>Google login</strong> and <strong>mobile OTP</strong> login. Always use the same method — Google and OTP accounts are treated as separate accounts." },
        { q: "My business details disappeared after logging in.", a: "This was a known bug that has been fixed. If you still experience this, go to My Business and re-enter your details — they will save permanently. Contact support if it keeps happening." },
        { q: "Can I change my email or mobile number?", a: "Email is tied to your Google login. Mobile number can be updated in <strong>My Business</strong>. If you need to merge two accounts or change your login email, raise a ticket." },
        { q: "How do I delete my account?", a: "Raise a support ticket with the subject 'Delete my account'. We'll confirm your identity and permanently delete all your data within 7 days as per our privacy policy." },
        { q: "Is my data secure?", a: "Yes. RevYne uses Supabase (SOC 2 compliant infrastructure) with row-level security — each user can only access their own data. We never store passwords; only OAuth tokens and OTP-verified sessions are used." },
      ]
    },
  ];

  const faqHTML = FAQ_SECTIONS.map((section, si) => `
    <div class="faq-section">
      <div class="faq-cat-title">${section.cat}</div>
      ${section.items.map((item, ii) => `
        <div class="faq-item" id="faq-item-${si}-${ii}">
          <button class="faq-q" type="button" data-faq-toggle="${si}-${ii}">
            <span>${item.q}</span>
            <svg class="faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="faq-a" id="faq-a-${si}-${ii}"><p>${item.a}</p></div>
        </div>
      `).join("")}
    </div>
  `).join("");

  return `
    <section class="support-page">

      <!-- Hero -->
      <div class="help-hero panel">
        <div class="help-hero-icon">🛟</div>
        <div class="help-hero-body">
          <p class="section-kicker">Help &amp; Support</p>
          <h1 class="help-hero-title">How can we help you?</h1>
          <p class="help-hero-sub">Browse the guides and FAQs below. If you still can't find your answer, raise a support ticket at the bottom — we respond within 24 hours.</p>
        </div>
      </div>

      <!-- Feature quick guide -->
      <div class="help-features-grid">
        <div class="help-feat-card">
          <div class="help-feat-icon">⭐</div>
          <div class="help-feat-title">Collect Reviews</div>
          <div class="help-feat-desc">Generate a QR code or shareable link. Customers scan, rate, and get an AI-drafted review to post on Google in seconds.</div>
        </div>
        <div class="help-feat-card">
          <div class="help-feat-icon">💬</div>
          <div class="help-feat-title">Smart Reply</div>
          <div class="help-feat-desc">Paste any customer review and get a professional AI-written response. Works for 5-star praise and 1-star complaints alike.</div>
        </div>
        <div class="help-feat-card">
          <div class="help-feat-icon">🌐</div>
          <div class="help-feat-title">24 Indian Languages</div>
          <div class="help-feat-desc">Reviews in Hindi, Tamil, Marathi, Bengali, Telugu, Gujarati, Kannada, Malayalam, Punjabi and 15 more — in natural native script.</div>
        </div>
        <div class="help-feat-card">
          <div class="help-feat-icon">📱</div>
          <div class="help-feat-title">QR Code</div>
          <div class="help-feat-desc">Download and print your unique QR. Every scan opens your branded review page — no app install needed for your customers.</div>
        </div>
      </div>

      <!-- FAQs -->
      <div class="panel faq-panel">
        <h2 class="faq-panel-heading">Frequently Asked Questions</h2>
        <div class="faq-list">${faqHTML}</div>
      </div>

      <!-- Still need help — raise ticket (collapsed by default) -->
      <div class="panel help-ticket-panel">
        <div class="help-ticket-head">
          <div>
            <h2 class="help-ticket-heading">Still need help?</h2>
            <p class="help-ticket-sub">Can't find your answer above? Raise a ticket and we'll get back to you within 24 hours.</p>
          </div>
          <button class="button" type="button" data-toggle-ticket>Raise a Ticket ↓</button>
        </div>
        <div class="help-ticket-form" id="help-ticket-form">
          <div class="help-ticket-divider">
            <p class="support-email">Or email us directly: <a href="mailto:revyneai@gmail.com">revyneai@gmail.com</a></p>
            <div class="field">
              <label for="support-category">Issue type</label>
              <select id="support-category" class="select">
                <option value="general">General question</option>
                <option value="bug_report">Bug report</option>
                <option value="login">Login or account access</option>
                <option value="payment">Payment or subscription</option>
                <option value="ai_generation">AI review / reply generation</option>
                <option value="review_page">Public review page or QR code</option>
                <option value="business_profile">Business profile setup</option>
              </select>
            </div>
            <div class="field">
              <label for="support-subject">Subject</label>
              <input id="support-subject" class="input" placeholder="e.g. Google login is not opening" />
            </div>
            <div class="field">
              <label for="support-message">Describe the issue</label>
              <textarea id="support-message" class="textarea" placeholder="What happened, where did it happen, and what were you trying to do?"></textarea>
            </div>
            <div class="help-ticket-footer">
              <div class="support-sla">
                <strong>Priority logic</strong>
                <span>Bug reports, login issues, and payment problems are automatically marked high priority.</span>
              </div>
              <button class="button full" type="button" data-submit-ticket>Submit Ticket</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Your tickets -->
      <section class="support-list">
        <div class="recent-header">
          <div class="recent-title">Your Tickets</div>
          <button class="view-all" type="button" data-refresh-tickets>Refresh</button>
        </div>
        ${tickets.length ? tickets.map(ticketCard).join("") : `
          <div class="panel empty-state">
            <strong>No tickets yet</strong>
            <p>When you raise a ticket, it will appear here with live status updates.</p>
          </div>
        `}
      </section>

    </section>
  `;
}

function ticketCard(ticket) {
  const created = ticket.created_at ? new Date(ticket.created_at).toLocaleDateString("en-IN") : "";
  const status = ticket.status || "open";
  return `
    <article class="panel ticket-card">
      <div class="ticket-card-head">
        <div>
          <h3>${escapeHtml(ticket.subject || "Support ticket")}</h3>
          <p>${escapeHtml(ticket.category || "general")} &middot; ${created}</p>
        </div>
        <span class="ticket-status status-${escapeHtml(status)}">${escapeHtml(status.replaceAll("_", " "))}</span>
      </div>
      <p class="ticket-message">${escapeHtml(ticket.message || "")}</p>
      <div class="ticket-meta">
        <span>Priority: ${escapeHtml(ticket.priority || "normal")}</span>
        <span>ID: ${escapeHtml(String(ticket.id || "").slice(0, 8))}</span>
      </div>
      ${ticket.admin_response ? `<div class="ticket-response"><strong>Support reply</strong><p>${escapeHtml(ticket.admin_response)}</p></div>` : ""}
    </article>
  `;
}

function adminSupportPage() {
  if (!state.user.isAdmin) {
    return `
      <section class="panel form-panel">
        <h1 class="page-title">Admin Support</h1>
        <p class="page-subtitle">Admin access is required to view this page.</p>
      </section>
    `;
  }

  const tickets = state.adminTickets || [];
  const counts = {
    open: tickets.filter((ticket) => ticket.status === "open").length,
    inReview: tickets.filter((ticket) => ticket.status === "in_review").length,
    waiting: tickets.filter((ticket) => ticket.status === "waiting_customer").length,
    resolved: tickets.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed").length
  };

  return `
    <section class="admin-support-page">
      <div class="support-hero panel">
        <div>
          <p class="section-kicker">Internal Admin</p>
          <h1>Support Queue</h1>
          <p>Review customer issues, reply from one place, assign owners, and move tickets through the resolution flow.</p>
        </div>
        <div class="support-sla">
          <strong>${tickets.length} visible</strong>
          <span>Filter: ${escapeHtml(state.adminTicketFilter || "open")}</span>
        </div>
      </div>

      <div class="admin-ticket-stats">
        <div class="panel"><strong>${counts.open}</strong><span>Open</span></div>
        <div class="panel"><strong>${counts.inReview}</strong><span>In review</span></div>
        <div class="panel"><strong>${counts.waiting}</strong><span>Waiting</span></div>
        <div class="panel"><strong>${counts.resolved}</strong><span>Done</span></div>
      </div>

      <section class="panel admin-toolbar">
        <label for="admin-ticket-filter">Status filter</label>
        <select id="admin-ticket-filter" class="select" data-admin-filter>
          ${selectOptions(["open", "in_review", "waiting_customer", "resolved", "closed", "all"], state.adminTicketFilter || "open", "")}
        </select>
        <button class="button secondary" type="button" data-admin-refresh-tickets>Refresh Queue</button>
      </section>

      <section class="admin-ticket-list">
        ${tickets.length ? tickets.map(adminTicketCard).join("") : `
          <div class="panel empty-state">
            <strong>No tickets in this filter</strong>
            <p>Change the filter or refresh the queue.</p>
          </div>
        `}
      </section>
    </section>
  `;
}

function adminTicketCard(ticket) {
  const created = ticket.created_at ? new Date(ticket.created_at).toLocaleString("en-IN") : "";
  return `
    <article class="panel admin-ticket-card" data-admin-ticket-card="${escapeHtml(ticket.id)}">
      <div class="ticket-card-head">
        <div>
          <h3>${escapeHtml(ticket.subject || "Support ticket")}</h3>
          <p>${escapeHtml(ticket.customer_name || "Customer")} &middot; ${escapeHtml(ticket.customer_email || "No email")} &middot; ${created}</p>
        </div>
        <span class="ticket-status status-${escapeHtml(ticket.status || "open")}">${escapeHtml((ticket.status || "open").replaceAll("_", " "))}</span>
      </div>
      <p class="ticket-message">${escapeHtml(ticket.message || "")}</p>
      <div class="ticket-meta">
        <span>Category: ${escapeHtml(ticket.category || "general")}</span>
        <span>Ticket: ${escapeHtml(String(ticket.id || "").slice(0, 8))}</span>
      </div>
      <div class="admin-ticket-controls">
        <div class="field">
          <label>Status</label>
          <select class="select" data-admin-ticket-status>
            ${selectOptions(["open", "in_review", "waiting_customer", "resolved", "closed"], ticket.status || "open", "")}
          </select>
        </div>
        <div class="field">
          <label>Priority</label>
          <select class="select" data-admin-ticket-priority>
            ${selectOptions(["low", "normal", "medium", "high", "urgent"], ticket.priority || "normal", "")}
          </select>
        </div>
        <div class="field">
          <label>Assigned to</label>
          <input class="input" value="${escapeHtml(ticket.assigned_to || "")}" placeholder="Team member name" data-admin-ticket-assigned />
        </div>
      </div>
      <div class="field">
        <label>Reply to customer</label>
        <textarea class="textarea" data-admin-ticket-response placeholder="Write the support reply...">${escapeHtml(ticket.admin_response || "")}</textarea>
      </div>
      <button class="button full" type="button" data-admin-save-ticket="${escapeHtml(ticket.id)}">Save Reply & Status</button>
    </article>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// GMB Page
// ─────────────────────────────────────────────────────────────────────────────
function gmbPage() {
  const gmb = state.gmb || {};
  const clientId = (window.REVYNE_SUPABASE || {}).googleClientId || "";
  const isConfigured = Boolean(clientId);

  // ── Location picker modal ─────────────────────────────────────────────────
  if (gmb.showLocationPicker && gmb.locationOptions?.length) {
    return `
      <section class="gmb-page">
        <div class="gmb-header">
          <h2 class="gmb-title">Choose Your Business</h2>
          <p class="gmb-sub">Select the Google Business Profile you want to connect to RevYne.</p>
        </div>
        <div class="gmb-location-list">
          ${gmb.locationOptions.map(loc => `
            <button class="panel gmb-loc-item" type="button"
              data-gmb-select-location="${escapeHtml(loc.locationId)}"
              data-gmb-location-name="${escapeHtml(loc.locationName)}"
              data-gmb-account-name="${escapeHtml(loc.accountName || "")}">
              <div class="gmb-loc-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              </div>
              <div class="gmb-loc-info">
                <div class="gmb-loc-name">${escapeHtml(loc.locationName)}</div>
                ${loc.address ? `<div class="gmb-loc-addr">${escapeHtml(loc.address)}</div>` : ""}
              </div>
              <span class="gmb-loc-arrow">›</span>
            </button>
          `).join("")}
        </div>
        <button class="button ghost full" type="button" data-gmb-cancel-connect style="margin-top:12px;">Cancel</button>
      </section>`;
  }

  // ── Not connected ─────────────────────────────────────────────────────────
  if (!gmb.connected) {
    return `
      <section class="gmb-page">
        <div class="gmb-header">
          <div class="gmb-g-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <h2 class="gmb-title">Connect Google Business</h2>
          <p class="gmb-sub">Link your Google Business Profile to unlock powerful features — all in one place.</p>
        </div>

        <div class="gmb-features-list">
          ${[
            ["📊", "Health Score", "See a 0–100 score based on profile completeness, ratings, and response rate"],
            ["⭐", "Reviews Inbox", "Read all your Google reviews without opening another app"],
            ["✦", "AI Reply", "Generate and post professional replies to reviews directly from RevYne"],
            ["✨", "SEO Optimizer", "Get AI-generated descriptions that rank higher on Google Search"]
          ].map(([icon, title, desc]) => `
            <div class="gmb-feature-item">
              <div class="gmb-feature-icon">${icon}</div>
              <div><strong>${title}</strong><p>${desc}</p></div>
            </div>`).join("")}
        </div>

        ${!isConfigured
          ? `<div class="panel" style="background:#fef3c7;border:1px solid #f59e0b;padding:14px 16px;margin:0 0 16px;border-radius:12px;">
              <strong>⚠ Setup required</strong>
              <p style="margin:4px 0 0;font-size:0.85rem;">Add your Google OAuth Client ID to <code>supabase-config.js</code> to enable this feature.</p>
             </div>`
          : ""}

        <button class="button full gmb-connect-btn" type="button" data-gmb-connect
          ${!isConfigured || gmb.connecting ? "disabled" : ""}>
          ${gmb.connecting
            ? `<span class="gmb-spinner"></span> Connecting…`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:8px;">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Connect with Google`}
        </button>
        <p class="gmb-disclaimer">You'll be asked to sign into Google and grant access to your Business Profile. RevYne never posts or modifies anything without your confirmation.</p>
      </section>`;
  }

  // ── Connected — main GMB dashboard ───────────────────────────────────────
  const score = gmb.healthScore;
  const scoreColor = score === null ? "#9ca3af" : score >= 80 ? "#34A853" : score >= 55 ? "#FBBC05" : "#EA4335";
  const scoreLabel = score === null ? "Loading…" : score >= 80 ? "Excellent" : score >= 55 ? "Good" : "Needs Work";
  const scoreCircumference = 2 * Math.PI * 36;
  const scoreDash = score !== null ? (score / 100) * scoreCircumference : 0;
  const details = gmb.healthDetails || {};
  const tips = Object.values(details).filter(d => d.tip).slice(0, 3);
  const reviews = gmb.reviews || [];
  const profile = gmb.profile || {};
  const currentDesc = profile.profile?.description || profile.description || "";

  const starRatingMap = { FIVE: 5, FOUR: 4, THREE: 3, TWO: 2, ONE: 1 };

  return `
    <section class="gmb-page connected">
      <!-- Header -->
      <div class="gmb-connected-header">
        <div class="gmb-biz-name">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>${escapeHtml(gmb.locationName || "Google Business Profile")}</span>
          <span class="gmb-connected-badge">Connected</span>
        </div>
        <div class="gmb-header-actions">
          <button class="button ghost small" type="button" data-gmb-refresh title="Sync from Google">${gmb.syncing ? "Syncing…" : "↻ Sync"}</button>
          <button class="button ghost small danger-ghost" type="button" data-gmb-disconnect>Disconnect</button>
        </div>
      </div>

      <!-- Health Score -->
      <div class="panel gmb-health-card">
        <div class="gmb-health-left">
          <svg class="gmb-score-circle" width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" stroke="var(--surface-container)" stroke-width="8"/>
            <circle cx="44" cy="44" r="36" fill="none"
              stroke="${scoreColor}" stroke-width="8"
              stroke-linecap="round"
              stroke-dasharray="${scoreDash.toFixed(1)} ${scoreCircumference.toFixed(1)}"
              transform="rotate(-90 44 44)"
              style="transition:stroke-dasharray 0.6s ease"/>
          </svg>
          <div class="gmb-score-overlay">
            <div class="gmb-score-big" style="color:${scoreColor}">${score !== null ? score : "–"}</div>
            <div class="gmb-score-tag">${scoreLabel}</div>
          </div>
        </div>
        <div class="gmb-health-right">
          <div class="gmb-health-title">Profile Health Score</div>
          ${score === null
            ? `<button class="button secondary small" type="button" data-gmb-load-health>Calculate Score</button>`
            : `<div class="gmb-health-bars">
                ${Object.entries(details).slice(0, 4).map(([, d]) => `
                  <div class="gmb-bar-row">
                    <span class="gmb-bar-label">${escapeHtml(d.label)}</span>
                    <div class="gmb-bar-track"><div class="gmb-bar-fill" style="width:${d.max > 0 ? Math.round((d.earned/d.max)*100) : 0}%;background:${d.earned >= d.max ? "#34A853" : d.earned > 0 ? "#FBBC05" : "#EA4335"}"></div></div>
                  </div>`).join("")}
              </div>
              ${tips.length > 0 ? `<button class="button ghost small" type="button" data-gmb-show-tips>View ${tips.length} tip${tips.length > 1 ? "s" : ""} →</button>` : ""}`}
        </div>
      </div>

      <!-- Improvement tips (hidden by default) -->
      ${tips.length > 0 ? `
      <div class="gmb-tips-panel" id="gmb-tips-panel" hidden>
        <div class="gmb-tips-title">💡 Improvement Tips</div>
        ${tips.map(t => `<div class="gmb-tip-item">• ${escapeHtml(t.tip)}</div>`).join("")}
      </div>` : ""}

      <!-- AI Optimize Description -->
      <div class="panel gmb-optimize-card">
        <div class="gmb-opt-header">
          <span class="gmb-opt-icon">✨</span>
          <div>
            <strong>AI SEO Description</strong>
            <p>Generate a keyword-rich description and update your Google Business Profile.</p>
          </div>
        </div>
        ${currentDesc ? `<div class="gmb-current-desc"><span class="gmb-desc-lbl">Current:</span> ${escapeHtml(currentDesc.slice(0, 180))}${currentDesc.length > 180 ? "…" : ""}</div>` : ""}
        ${gmb.optimizations.length > 0
          ? `<div class="gmb-opt-results">
              ${gmb.optimizations.map((desc, i) => `
                <div class="gmb-opt-item">
                  <p class="gmb-opt-text">${escapeHtml(desc)}</p>
                  <div class="gmb-opt-actions">
                    <button class="button ghost small" type="button" data-copy="${escapeHtml(desc)}">Copy</button>
                    <button class="button secondary small" type="button" data-gmb-apply-desc="${i}">Apply to GMB</button>
                  </div>
                </div>`).join("")}
             </div>`
          : ""}
        <button class="button full" type="button" data-gmb-optimize style="margin-top:12px;">
          ${gmb.syncing ? "Generating…" : "✨ Generate SEO Description"}
        </button>
      </div>

      <!-- Reviews Inbox -->
      <div class="gmb-reviews-section">
        <div class="gmb-section-header">
          <span class="gmb-section-title">⭐ Google Reviews</span>
          <span class="gmb-review-count">${reviews.length > 0 ? reviews.length + " reviews" : ""}</span>
        </div>

        ${reviews.length === 0
          ? `<div class="panel empty-state">
              <strong>No reviews loaded yet</strong>
              <p>Tap Sync to pull your latest Google reviews.</p>
              <button class="button secondary" type="button" data-gmb-refresh style="margin-top:12px;">Sync Reviews</button>
             </div>`
          : reviews.map(r => {
              const stars = starRatingMap[r.starRating] || 0;
              const hasReply = Boolean(r.reviewReply || r.reply_comment);
              const replyText = r.reviewReply?.comment || r.reply_comment || "";
              const isReplying = gmb.replyingTo === r.name;
              const reviewDate = r.createTime ? new Date(r.createTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
              return `
                <div class="panel gmb-review-card" data-review-id="${escapeHtml(r.name || "")}">
                  <div class="gmb-review-top">
                    <div class="gmb-reviewer">
                      ${r.reviewer?.profilePhotoUrl || r.reviewer_photo
                        ? `<img class="gmb-avatar" src="${escapeHtml(r.reviewer?.profilePhotoUrl || r.reviewer_photo)}" alt="" />`
                        : `<div class="gmb-avatar-fallback">${escapeHtml((r.reviewer?.displayName || r.reviewer_name || "?").charAt(0).toUpperCase())}</div>`}
                      <div>
                        <div class="gmb-reviewer-name">${escapeHtml(r.reviewer?.displayName || r.reviewer_name || "Anonymous")}</div>
                        <div class="gmb-review-meta">${"★".repeat(stars)}${"☆".repeat(5 - stars)} ${reviewDate ? "· " + reviewDate : ""}</div>
                      </div>
                    </div>
                    ${hasReply ? `<span class="gmb-replied-badge">Replied</span>` : ""}
                  </div>
                  ${r.comment ? `<p class="gmb-review-body">${escapeHtml(r.comment)}</p>` : ""}

                  ${hasReply && !isReplying
                    ? `<div class="gmb-existing-reply">
                        <span class="gmb-reply-label">Your reply:</span>
                        <p>${escapeHtml(replyText)}</p>
                        <div class="gmb-reply-btns">
                          <button class="button ghost small" type="button"
                            data-gmb-reply="${escapeHtml(r.name || "")}"
                            data-gmb-reply-prefill="${escapeHtml(replyText)}">Edit</button>
                          <button class="button ghost small danger-ghost" type="button"
                            data-gmb-delete-reply="${escapeHtml(r.name || "")}">Delete</button>
                        </div>
                       </div>`
                    : ""}

                  ${isReplying
                    ? `<div class="gmb-reply-form">
                        <textarea class="textarea" id="gmb-reply-textarea" rows="3"
                          placeholder="Write your reply…">${escapeHtml(gmb.replyDraft)}</textarea>
                        <div class="gmb-reply-form-actions">
                          <button class="button ghost small" type="button" data-gmb-generate-reply="${escapeHtml(r.name || "")}"
                            data-gmb-review-text="${escapeHtml((r.comment || "").slice(0, 400))}"
                            data-gmb-star="${stars}">✦ AI Draft</button>
                          <div style="display:flex;gap:8px;">
                            <button class="button ghost small" type="button" data-gmb-cancel-reply>Cancel</button>
                            <button class="button small" type="button" data-gmb-submit-reply="${escapeHtml(r.name || "")}">Post Reply</button>
                          </div>
                        </div>
                       </div>`
                    : `<button class="button ghost small" type="button"
                        data-gmb-reply="${escapeHtml(r.name || "")}"
                        style="margin-top:8px;">
                        ${hasReply ? "Edit Reply" : "✦ Reply"}
                       </button>`}
                </div>`;
            }).join("")}
      </div>

      <!-- Disconnect warning -->
      <div class="gmb-disconnect-row">
        <button class="button ghost small danger-ghost" type="button" data-gmb-disconnect>Disconnect Google Business</button>
      </div>
    </section>`;
}

function profilePage() {
  const b = state.business;
  const u = state.user;
  const displayName = u.name || b.name || "Your Profile";
  const displayEmail = u.email || "Add your email";
  const displayMobile = u.mobile || b.mobile;
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "U";
  const avatar = b.logo
    ? `<div class="profile-avatar has-image"><img src="${escapeHtml(b.logo)}" alt="Profile" /></div>`
    : `<div class="profile-avatar">${escapeHtml(initial)}</div>`;
  const svgAbout = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`;
  const svgOrders = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="9" x2="8" y2="9"/><line x1="10" y1="17" x2="8" y2="17"/></svg>`;
  const svgHelp = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>`;
  const svgAdmin = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>`;
  const svgTerms = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  const svgPricing = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`;
  const svgLogout = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;

  const items = [
    { icon: svgAbout,   label: "About RevYne",   view: "about",   color: "var(--surface-container)", fg: "var(--blue)" },
    { icon: svgOrders,  label: "Order History",  view: "orders",  color: "var(--surface-container)", fg: "var(--blue)" },
    { icon: svgPricing, label: "Plans & Pricing", view: "pricing", color: "var(--surface-container)", fg: "var(--blue)" },
    { icon: svgHelp,    label: "Help & Support",  view: "support", color: "var(--surface-container)", fg: "var(--blue)" },
    ...(u.isAdmin ? [{ icon: svgAdmin, label: "Admin Support", view: "adminSupport", color: "var(--blue-soft)", fg: "var(--blue)" }] : []),
    { icon: svgTerms,   label: "Terms & Privacy", view: "terms",   color: "var(--surface-container)", fg: "var(--blue)" }
  ];

  const currentTheme = state.theme || "default";

  return `
    <section class="profile-page">
      <div class="profile-hero">
        ${avatar}
        <div class="profile-name">${escapeHtml(displayName)}</div>
        <div class="profile-email">${escapeHtml(displayEmail)}</div>
        ${displayMobile ? `<div class="profile-email">${escapeHtml(displayMobile)}</div>` : ""}
      </div>

      <div class="profile-theme-card">
        <div class="profile-theme-title">
          <span>🎨</span> Change Theme
        </div>
        <div class="theme-options">
          ${THEMES.map(t => `
            <label class="theme-option ${currentTheme === t.id ? "active" : ""}">
              <input type="radio" name="theme" value="${t.id}" ${currentTheme === t.id ? "checked" : ""} />
              <span class="theme-dot" style="background:linear-gradient(135deg,${t.c1},${t.c2})"></span>
              <span class="theme-option-label">${t.label}</span>
            </label>
          `).join("")}
        </div>
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
          <div class="pmi-icon" style="background:#ffe4e4; color:var(--danger)">${svgLogout}</div>
          <span>Logout</span>
          <span class="pmi-arrow">›</span>
        </button>
      </div>
    </section>
  `;
}

function currentPage() {
  if (isPublicReviewRoute()) return publicReviewPage();
  if (state.view === "terms") return state.isLoggedIn ? appShell(termsPage()) : termsPage();
  if (state.view === "privacy") return state.isLoggedIn ? appShell(privacyPage()) : privacyPage();
  if (!state.isLoggedIn) return authPage();

  // Real (non-guest) users who haven't set up their business yet get the onboarding shell
  if (state.user?.provider !== "guest" && !hasBusinessProfile()) {
    return onboardingShell(businessPage());
  }

  const pages = {
    dashboard: dashboardPageClean,
    business: businessPage,
    reply: replyPage,
    pricing: pricingPageV2,
    gmb: gmbPage,
    orders: ordersPage,
    about: aboutPage,
    support: supportPage,
    adminSupport: adminSupportPage,
    terms: termsPage,
    privacy: privacyPage,
    profile: profilePage
  };

  return appShell((pages[state.view] || dashboardPageClean)());
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      history.replaceState(null, "", location.pathname);
      setView(button.dataset.view);
    });
  });

  document.querySelectorAll("[data-field]").forEach((input) => {
    const handleFieldUpdate = () => {
      updateBusinessField(input.dataset.field, input.value);
      if (input.dataset.field === "category") {
        const keywordsInput = document.querySelector("[data-field='keywords']");
        if (keywordsInput) keywordsInput.value = state.business.keywords || "";
        const serviceTypeInput = document.querySelector("[data-field='serviceTypes']");
        const serviceTypeLabel = document.querySelector("label[for='field-serviceTypes']");
        const meta = getCategoryMeta(input.value);
        if (serviceTypeInput) serviceTypeInput.placeholder = meta.typePlaceholder;
        if (serviceTypeLabel) serviceTypeLabel.textContent = meta.typeLabel;
      }
    };
    input.addEventListener("input", handleFieldUpdate);
    input.addEventListener("change", handleFieldUpdate);
  });

  document.querySelectorAll("[data-user-field]").forEach((input) => {
    input.addEventListener("input", () => updateUserField(input.dataset.userField, input.value));
  });

  document.querySelector("[data-profile-image]")?.addEventListener("change", (event) => {
    handleProfileImageUpload(event.target.files?.[0]);
  });

  document.querySelector("[data-toggle-review-url-help]")?.addEventListener("click", () => {
    const help = document.querySelector("[data-review-url-help]");
    if (!help) return;
    help.hidden = !help.hidden;
  });

  document.querySelectorAll("[data-reply-draft]").forEach((input) => {
    input.addEventListener("input", () => {
      state.replyDraft[input.dataset.replyDraft] = input.value;
      saveState();
    });
  });

  document.querySelectorAll("[data-review-draft]").forEach((input) => {
    input.addEventListener("input", () => {
      state.reviewDraft[input.dataset.reviewDraft] = input.value;
      saveState();
    });
  });

  document.querySelectorAll("[data-chip-field]").forEach((button) => {
    button.addEventListener("click", () => {
      updateBusinessField(button.dataset.chipField, button.dataset.chipValue);
      render();
    });
  });

  document.querySelectorAll("[data-star]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.starField === "replyRating") preserveReplyDraftFromDom();
      if (button.dataset.starField === "rating") preserveReviewDraftFromDom();
      state[button.dataset.starField] = Number(button.dataset.star);
      syncBottomNavPosition();
      saveState();
      render();
    });
  });

  document.querySelector("[data-generate-review]")?.addEventListener("click", createReviewSuggestions);
  document.querySelector("[data-generate-reply]")?.addEventListener("click", createSmartReplies);

  document.querySelector("[data-save-mobile]")?.addEventListener("click", async (e) => {
    // Read directly from DOM input to avoid stale state
    const mobileInput = document.querySelector("[data-field='mobile']");
    const mobile = (mobileInput?.value || state.business.mobile || "").trim();
    if (!/^\d{10}$/.test(mobile)) {
      showToast("Please enter a valid 10-digit mobile number");
      return;
    }
    state.business.mobile = mobile;
    state.user.mobile = mobile;
    const btn = e.currentTarget;
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Saving…";
    try {
      const saved = await saveSupabaseProfile();
      if (!saved) return;
      saveState();
      showToast("✓ Mobile number saved");
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  });

  document.querySelector("[data-save-profile]")?.addEventListener("click", async (e) => {
    preserveBusinessFromDom();
    const b = state.business;
    const requiredNote = document.getElementById("required-note");
    const showRequired = (msg) => {
      if (requiredNote) { requiredNote.textContent = "⚠ " + msg; requiredNote.hidden = false; requiredNote.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
      showToast("⚠ " + msg);
    };
    if (!b.name?.trim() || !b.category?.trim()) {
      showRequired("Business Name and Category are required.");
      return;
    }
    if (!b.googleUrl?.trim()) {
      showRequired("Google Review URL is required.");
      return;
    }
    if (requiredNote) requiredNote.hidden = true;
    const btn = e.currentTarget;
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Saving…";
    try {
      const wasNewUser = !state.business.id;
      const profileSaved = await saveSupabaseProfile();
      if (!profileSaved) return;
      const businessSaved = await saveSupabaseBusiness();
      if (!businessSaved) return;
      if (wasNewUser) {
        // First-time setup complete — load stats then go to dashboard
        await loadDashboardStats();
        saveState();
        showToast("🎉 Business profile saved! Your review link is ready.");
        state.view = "dashboard";
        render();
      } else {
        showToast("✓ Profile saved successfully");
      }
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  });

  document.querySelector("[data-submit-ticket]")?.addEventListener("click", createSupportTicket);

  // FAQ accordion — JS-driven height for reliable cross-browser animation
  document.querySelectorAll("[data-faq-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.faqToggle;
      const item = document.getElementById(`faq-item-${key}`);
      const answer = document.getElementById(`faq-a-${key}`);
      if (!item || !answer) return;
      const isOpen = item.classList.contains("faq-open");

      // Close all open items first
      document.querySelectorAll(".faq-item.faq-open").forEach(el => {
        el.classList.remove("faq-open");
        const ans = el.querySelector(".faq-a");
        if (ans) ans.style.height = "0px";
      });

      // Open clicked item if it was closed
      if (!isOpen) {
        item.classList.add("faq-open");
        answer.style.height = answer.scrollHeight + "px";
      }
    });
  });

  // Toggle ticket form — JS-driven height
  document.querySelector("[data-toggle-ticket]")?.addEventListener("click", () => {
    const form = document.getElementById("help-ticket-form");
    const btn = document.querySelector("[data-toggle-ticket]");
    if (!form) return;
    const isOpen = form.classList.contains("ticket-open");
    if (isOpen) {
      form.classList.remove("ticket-open");
      form.style.height = "0px";
      if (btn) btn.textContent = "Raise a Ticket ↓";
    } else {
      form.classList.add("ticket-open");
      form.style.height = form.scrollHeight + "px";
      if (btn) btn.textContent = "Never mind ✕";
      setTimeout(() => form.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
    }
  });

  document.querySelector("[data-refresh-payments]")?.addEventListener("click", async () => {
    await loadSupabaseProfile();
    await loadPaymentEvents();
    showToast("Billing refreshed");
    render();
  });

  document.querySelector("[data-refresh-admin-payments]")?.addEventListener("click", async () => {
    await loadAdminPaymentEvents();
    showToast("Payment watch refreshed");
    render();
  });

  document.querySelector("[data-cancel-subscription]")?.addEventListener("click", cancelCurrentSubscription);

  document.querySelector("[data-refresh-tickets]")?.addEventListener("click", async () => {
    await loadSupportTickets();
    showToast("Tickets refreshed");
    render();
  });

  document.querySelector("[data-admin-filter]")?.addEventListener("change", async (event) => {
    state.adminTicketFilter = event.target.value;
    saveState();
    await loadAdminTickets();
    render();
  });

  document.querySelector("[data-admin-refresh-tickets]")?.addEventListener("click", async () => {
    await loadAdminTickets();
    showToast("Admin queue refreshed");
    render();
  });

  document.querySelectorAll("[data-admin-save-ticket]").forEach((button) => {
    button.addEventListener("click", () => updateAdminTicket(button.dataset.adminSaveTicket));
  });

  document.querySelector("[data-back-app]")?.addEventListener("click", () => {
    history.replaceState(null, "", location.pathname);
    state.view = "dashboard";
    saveState();
    render();
  });

  // Close guest limit modal
  document.querySelector("[data-close-guest-modal]")?.addEventListener("click", () => {
    state.showGuestLimitModal = false;
    saveState();
    render();
  });

  // Refresh dashboard stats
  document.querySelector("[data-refresh-dashboard]")?.addEventListener("click", async () => {
    await loadDashboardStats();
    saveState();
    render();
    showToast("Stats refreshed");
  });

  document.querySelector("[data-auth-google]")?.addEventListener("click", signInWithGoogle);

  document.querySelector("[data-auth-save-profile]")?.addEventListener("click", completeGoogleProfile);

  document.querySelector("[data-auth-back]")?.addEventListener("click", () => {
    state.authMode = "signin";
    saveState();
    render();
  });

  document.querySelector("[data-auth-demo]")?.addEventListener("click", () => {
    const guestState = clone(defaultState);
    guestState.isLoggedIn = true;
    guestState.view = "dashboard";
    guestState.authMode = "signin";
    guestState.user.provider = "guest";
    guestState.user.lastLogin = new Date().toISOString();
    state = guestState;
    saveState();
    trackEvent("guest_login_clicked");
    render();
  });

  document.querySelectorAll("[data-plan-select]").forEach((button) => {
    button.addEventListener("click", () => {
      startPlanCheckout(button.dataset.planSelect);
    });
  });

  // Theme switcher
  document.querySelectorAll('[name="theme"]').forEach(radio => {
    radio.addEventListener("change", () => {
      state.theme = radio.value;
      saveState();
      document.documentElement.setAttribute("data-theme", state.theme);
      document.querySelectorAll(".theme-option").forEach(opt => {
        const optInput = opt.querySelector("input");
        opt.classList.toggle("active", optInput && optInput.value === state.theme);
      });
      trackEvent("theme_changed", { theme: state.theme });
    });
  });

  // Language picker checkboxes
  document.querySelectorAll("[data-lang-check]").forEach(cb => {
    cb.addEventListener("change", () => {
      const lang = cb.dataset.langCheck;
      if (cb.checked) {
        if ((state.proLanguages?.length || 0) >= 5) {
          cb.checked = false;
          showToast("You can select up to 5 languages");
          return;
        }
        state.proLanguages = [...(state.proLanguages || []), lang];
      } else {
        state.proLanguages = (state.proLanguages || []).filter(l => l !== lang);
      }
      saveState();
      // Update badge and disabled states without full re-render
      const badge = document.getElementById("lang-count-badge");
      if (badge) badge.textContent = `${state.proLanguages.length}/5`;
      document.querySelectorAll("[data-lang-check]").forEach(other => {
        if (!other.checked) other.disabled = state.proLanguages.length >= 5;
        const item = other.closest(".lang-check-item");
        if (item) item.classList.toggle("lang-disabled", !other.checked && state.proLanguages.length >= 5);
      });
    });
  });

  document.querySelector("[data-save-langs]")?.addEventListener("click", () => {
    if (!state.proLanguages?.length) {
      showToast("Select at least one language first");
      return;
    }
    // If current language isn't in new list, default to first selected
    if (!state.proLanguages.includes(state.business.language)) {
      state.business.language = state.proLanguages[0];
    }
    saveState();
    showToast(`${state.proLanguages.length} language${state.proLanguages.length > 1 ? "s" : ""} saved`);
    trackEvent("pro_languages_saved", { count: state.proLanguages.length });
  });

  document.querySelectorAll(".logout, [data-logout]").forEach((button) => {
    button.addEventListener("click", signOut);
  });

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", () => {
      copyText(button.dataset.copy);
      // On public review page, track that the customer copied a draft
      if (isPublicReviewRoute() && state.suggestions.includes(button.dataset.copy)) {
        markReviewDraftCopied();
      }
    });
  });

  document.querySelector("[data-download-qr]")?.addEventListener("click", downloadReviewQr);
  document.querySelector("[data-print-qr]")?.addEventListener("click", printReviewQr);

  document.querySelectorAll("[data-open-google]").forEach((button) => {
    button.addEventListener("click", () => window.open(state.business.googleUrl, "_blank", "noopener"));
  });

  // ── GMB event bindings ────────────────────────────────────────────────────
  document.querySelector("[data-gmb-connect]")?.addEventListener("click", startGmbConnect);

  document.querySelector("[data-gmb-cancel-connect]")?.addEventListener("click", () => {
    state.gmb.showLocationPicker = false;
    state.gmb.locationOptions = [];
    state.gmb.connecting = false;
    saveState();
    render();
  });

  document.querySelectorAll("[data-gmb-select-location]").forEach(btn => {
    btn.addEventListener("click", () => {
      selectGmbLocation(
        btn.dataset.gmbSelectLocation,
        btn.dataset.gmbLocationName || "",
        btn.dataset.gmbAccountName || ""
      );
    });
  });

  document.querySelector("[data-gmb-refresh]")?.addEventListener("click", async () => {
    await syncGmbData();
    render();
  });

  document.querySelectorAll("[data-gmb-disconnect]").forEach(btn => {
    btn.addEventListener("click", disconnectGmb);
  });

  document.querySelector("[data-gmb-load-health]")?.addEventListener("click", async () => {
    await loadGmbHealthScore();
    render();
  });

  document.querySelector("[data-gmb-show-tips]")?.addEventListener("click", () => {
    const panel = document.getElementById("gmb-tips-panel");
    if (panel) panel.hidden = !panel.hidden;
  });

  document.querySelector("[data-gmb-optimize]")?.addEventListener("click", optimizeGmbDescription);

  document.querySelectorAll("[data-gmb-apply-desc]").forEach(btn => {
    btn.addEventListener("click", () => applyGmbDescription(Number(btn.dataset.gmbApplyDesc)));
  });

  document.querySelectorAll("[data-gmb-reply]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.gmb.replyingTo = btn.dataset.gmbReply;
      state.gmb.replyDraft = btn.dataset.gmbReplyPrefill || "";
      saveState();
      render();
    });
  });

  document.querySelector("[data-gmb-cancel-reply]")?.addEventListener("click", () => {
    state.gmb.replyingTo = null;
    state.gmb.replyDraft = "";
    saveState();
    render();
  });

  document.querySelectorAll("[data-gmb-generate-reply]").forEach(btn => {
    btn.addEventListener("click", () => generateGmbReply(
      btn.dataset.gmbGenerateReply,
      btn.dataset.gmbReviewText || "",
      Number(btn.dataset.gmbStar) || 3
    ));
  });

  document.querySelectorAll("[data-gmb-submit-reply]").forEach(btn => {
    btn.addEventListener("click", () => {
      const textarea = document.getElementById("gmb-reply-textarea");
      const comment = textarea?.value?.trim() || "";
      if (!comment) { showToast("Please write a reply first"); return; }
      submitGmbReply(btn.dataset.gmbSubmitReply, comment);
    });
  });

  document.querySelectorAll("[data-gmb-delete-reply]").forEach(btn => {
    btn.addEventListener("click", () => deleteGmbReply(btn.dataset.gmbDeleteReply));
  });

  // Keep reply textarea draft in sync
  document.getElementById("gmb-reply-textarea")?.addEventListener("input", (e) => {
    state.gmb.replyDraft = e.target.value;
  });
}

async function render() {
  if (isPublicReviewRoute()) {
    await loadPublicReviewBusiness();
  }

  const dir = slideDirection;
  slideDirection = null;

  let pageHTML;
  try {
    pageHTML = currentPage();
  } catch (err) {
    console.error("[RevYne] render error:", err);
    pageHTML = `<div class="main" style="padding:48px 24px;text-align:center;">
      <div style="font-size:2.5rem;margin-bottom:16px;">⚠️</div>
      <h2 style="margin:0 0 8px;">Something went wrong</h2>
      <p style="color:#6b7280;margin:0 0 24px;">An unexpected error occurred. Please refresh the page.</p>
      <button onclick="location.reload()" style="background:#8127cf;color:#fff;border:none;padding:12px 28px;border-radius:8px;font-size:1rem;cursor:pointer;font-weight:600;">Refresh Page</button>
    </div>`;
  }

  document.querySelector("#app").innerHTML = pageHTML;
  document.documentElement.setAttribute("data-theme", state.theme || "default");

  if (dir) {
    const main = document.querySelector(".main");
    if (main) main.classList.add(`slide-${dir}`);
  }
  bottomNavShouldAnimate = false;
  syncBottomNavPosition();

  bindEvents();
  renderQrCodes();
  trackPageView();

  // Auto-refresh dashboard stats in the background whenever the user is on the dashboard.
  // Throttled to once every 60 seconds so rapid navigation doesn't spam Supabase.
  if (
    state.view === "dashboard" &&
    state.isLoggedIn &&
    state.user?.provider !== "guest" &&
    state.business?.id &&
    currentSession?.user
  ) {
    const now = Date.now();
    if (now - lastStatsLoadTime > 60_000) {
      lastStatsLoadTime = now;
      loadDashboardStats().then(() => {
        saveState();
        // Re-render only the metrics section to avoid a full page flash
        const dashWrap = document.querySelector(".dash-wrap");
        if (dashWrap) {
          // Lightweight re-render: replace the dash-metrics block only
          const tmp = document.createElement("div");
          tmp.innerHTML = dashboardPageClean();
          const fresh = tmp.querySelector(".dash-metrics");
          const current = dashWrap.querySelector(".dash-metrics");
          if (fresh && current) current.replaceWith(fresh);
          // Also update recent reviews
          const freshRecent = tmp.querySelector(".recent-reviews");
          const currentRecent = dashWrap.querySelector(".recent-reviews");
          if (freshRecent && currentRecent) currentRecent.replaceWith(freshRecent);
          // Re-bind the refresh button
          document.querySelector("[data-refresh-dashboard]")?.addEventListener("click", async () => {
            lastStatsLoadTime = 0; // force reload
            await loadDashboardStats();
            saveState();
            render();
            showToast("Stats refreshed");
          });
        }
      }).catch(() => {});
    }
  }
}

window.addEventListener("hashchange", render);
window.addEventListener("error", (event) => {
  trackClientError("error", event.message, event.filename);
});
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason?.message || event.reason || "Unhandled promise rejection";
  trackClientError("unhandledrejection", reason);
});

// ─────────────────────────────────────────────────────────────────────────────
// Google Business Profile integration functions
// ─────────────────────────────────────────────────────────────────────────────

async function callGmbConnect(body) {
  const session = currentSession;
  if (!session?.access_token) return null;
  const supabaseUrl = (window.REVYNE_SUPABASE || {}).url || "";
  if (!supabaseUrl) return null;
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/gmb-connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "GMB connect request failed");
    }
    return await res.json();
  } catch (err) {
    console.error("[GMB connect]", err);
    throw err;
  }
}

async function callGmbApi(body) {
  const session = currentSession;
  if (!session?.access_token) return null;
  const supabaseUrl = (window.REVYNE_SUPABASE || {}).url || "";
  if (!supabaseUrl) return null;
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/gmb-api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "GMB API request failed");
    }
    return await res.json();
  } catch (err) {
    console.error("[GMB API]", err);
    throw err;
  }
}

// Generate PKCE code_verifier + code_challenge
async function generatePkce() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(codeVerifier));
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return { codeVerifier, codeChallenge };
}

// Step 1: redirect to Google OAuth
async function startGmbConnect() {
  const clientId = (window.REVYNE_SUPABASE || {}).googleClientId || "";
  if (!clientId) {
    showToast("Google integration not configured — add googleClientId to supabase-config.js");
    return;
  }
  state.gmb.connecting = true;
  saveState();
  render();

  try {
    const { codeVerifier, codeChallenge } = await generatePkce();
    sessionStorage.setItem("gmb_code_verifier", codeVerifier);

    const redirectUri = location.origin + "/";
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/business.manage",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state: "gmb",
      access_type: "offline",
      prompt: "consent"
    });

    location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  } catch (err) {
    state.gmb.connecting = false;
    saveState();
    showToast("Could not start Google sign-in. Please try again.");
    render();
  }
}

// Step 2: handle OAuth callback (called from initializeApp when code+state=gmb in URL)
async function handleGmbOAuthCallback(code) {
  const codeVerifier = sessionStorage.getItem("gmb_code_verifier") || "";
  sessionStorage.removeItem("gmb_code_verifier");

  if (!codeVerifier) {
    showToast("OAuth session expired. Please try connecting again.");
    state.gmb.connecting = false;
    saveState();
    return;
  }

  state.gmb.connecting = true;
  // Clean the URL so the code doesn't persist in browser history
  history.replaceState(null, "", location.pathname);
  saveState();
  render();

  try {
    const redirectUri = location.origin + "/";
    const result = await callGmbConnect({
      action: "exchange_token",
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri
    });

    if (!result?.locations?.length) {
      showToast("No Google Business locations found on that account.");
      state.gmb.connecting = false;
      saveState();
      render();
      return;
    }

    if (result.locations.length === 1) {
      // Only one location — auto-select it
      const loc = result.locations[0];
      await selectGmbLocation(loc.locationId, loc.locationName, loc.accountName || "");
    } else {
      // Multiple locations — show picker
      state.gmb.locationOptions = result.locations;
      state.gmb.showLocationPicker = true;
      state.gmb.connecting = false;
      state.view = "gmb";
      saveState();
      render();
    }
  } catch (err) {
    state.gmb.connecting = false;
    saveState();
    showToast("Could not connect to Google Business. " + (err.message || "Please try again."));
    render();
  }
}

// Step 3: save the chosen location
async function selectGmbLocation(locationId, locationName, accountName) {
  state.gmb.connecting = true;
  saveState();

  try {
    await callGmbConnect({ action: "select_location", location_id: locationId, location_name: locationName, account_name: accountName });

    state.gmb.connected = true;
    state.gmb.connecting = false;
    state.gmb.locationId = locationId;
    state.gmb.locationName = locationName;
    state.gmb.accountName = accountName;
    state.gmb.showLocationPicker = false;
    state.gmb.locationOptions = [];
    state.view = "gmb";
    saveState();
    showToast("✓ Google Business connected!");
    trackEvent("gmb_connected");
    render();

    // Kick off initial data sync in background
    syncGmbData().catch(() => {});
  } catch (err) {
    state.gmb.connecting = false;
    saveState();
    showToast("Could not save location. Please try again.");
    render();
  }
}

// Disconnect GMB
async function disconnectGmb() {
  if (!confirm("Disconnect Google Business Profile? Your cached reviews will be cleared.")) return;
  try {
    await callGmbConnect({ action: "disconnect" });
  } catch (err) {
    console.warn("GMB disconnect error (proceeding anyway):", err);
  }
  state.gmb = { ...clone(defaultState.gmb) };
  saveState();
  showToast("Google Business disconnected");
  trackEvent("gmb_disconnected");
  render();
}

// Load GMB connection status from the server
async function loadGmbStatus() {
  if (!currentSession?.access_token) return;
  try {
    const result = await callGmbConnect({ action: "get_status" });
    if (result?.connected) {
      state.gmb.connected = true;
      state.gmb.locationId = result.location_id;
      state.gmb.locationName = result.location_name;
      state.gmb.accountName = result.account_name;
    } else {
      state.gmb.connected = false;
      state.gmb.locationId = null;
    }
    saveState();
  } catch (err) {
    console.warn("[GMB status]", err);
  }
}

// Sync profile + reviews + health score from Google
async function syncGmbData() {
  if (!state.gmb.connected) return;
  state.gmb.syncing = true;
  saveState();

  try {
    // Fetch reviews
    const reviewsResult = await callGmbApi({ action: "list_reviews" });
    if (reviewsResult?.reviews) {
      state.gmb.reviews = reviewsResult.reviews;
      state.gmb.lastSync = new Date().toISOString();
    }

    // Fetch profile
    const profileResult = await callGmbApi({ action: "get_profile" });
    if (profileResult?.profile) {
      state.gmb.profile = profileResult.profile;
    }

    // Compute health score
    await loadGmbHealthScore();

    saveState();
    showToast("✓ Google Business synced");
  } catch (err) {
    showToast("Could not sync from Google. " + (err.message || ""));
  } finally {
    state.gmb.syncing = false;
    saveState();
  }
}

async function loadGmbHealthScore() {
  try {
    const result = await callGmbApi({ action: "health_score" });
    if (result?.score !== undefined) {
      state.gmb.healthScore = result.score;
      state.gmb.healthDetails = result.details;
      if (result.profile) state.gmb.profile = result.profile;
      if (result.reviewCount !== undefined && state.gmb.reviews.length === 0) {
        // health_score also returned reviews — sync them
      }
      saveState();
    }
  } catch (err) {
    console.warn("[GMB health score]", err);
  }
}

async function optimizeGmbDescription() {
  if (state.gmb.syncing) return;
  state.gmb.syncing = true;
  saveState();
  render();

  try {
    const profile = state.gmb.profile || {};
    const currentDesc = profile.profile?.description || profile.description || "";
    const result = await callGmbApi({
      action: "optimize_profile",
      current_description: currentDesc,
      business_name: state.business.name || profile.title || "",
      business_category: state.business.category || "",
      city: state.business.city || "",
      services: state.business.services || "",
      keywords: state.business.keywords || ""
    });

    if (result?.descriptions?.length) {
      state.gmb.optimizations = result.descriptions;
      saveState();
      showToast("✓ SEO descriptions generated");
    } else {
      showToast("Could not generate descriptions. Please try again.");
    }
  } catch (err) {
    showToast("AI optimization failed. " + (err.message || ""));
  } finally {
    state.gmb.syncing = false;
    saveState();
    render();
  }
}

async function applyGmbDescription(index) {
  const desc = state.gmb.optimizations[index];
  if (!desc) return;
  if (!confirm("Apply this description to your Google Business Profile?")) return;

  showToast("Updating Google Business Profile…");
  // Note: updating description requires the Business Information API PATCH endpoint.
  // For now, we copy the description and open GMB in a new tab.
  await navigator.clipboard.writeText(desc).catch(() => {});
  window.open("https://business.google.com/", "_blank", "noopener");
  showToast("Description copied! Paste it in the Google Business editor.");
}

async function generateGmbReply(reviewName, reviewText, stars) {
  const textarea = document.getElementById("gmb-reply-textarea");
  if (textarea) textarea.value = "Generating…";

  try {
    const result = await callEdgeFunction("generate-ai", {
      action: "smart_replies",
      rating: stars,
      reviewText,
      business: {
        name: state.business.name,
        category: state.business.category,
        city: state.business.city,
        language: state.business.language || "English",
        tone: state.business.tone || "Professional"
      }
    });

    const firstReply = result?.replies?.[0] || "";
    state.gmb.replyDraft = firstReply;
    if (textarea) textarea.value = firstReply;
    saveState();
  } catch (err) {
    if (textarea) textarea.value = state.gmb.replyDraft;
    showToast("Could not generate reply. Please write one manually.");
  }
}

async function submitGmbReply(reviewName, comment) {
  try {
    await callGmbApi({ action: "post_reply", review_name: reviewName, comment });

    // Update local cache
    state.gmb.reviews = state.gmb.reviews.map(r => {
      if (r.name === reviewName) return { ...r, reviewReply: { comment }, reply_comment: comment };
      return r;
    });
    state.gmb.replyingTo = null;
    state.gmb.replyDraft = "";
    saveState();
    showToast("✓ Reply posted to Google!");
    trackEvent("gmb_reply_posted");
    render();
  } catch (err) {
    showToast("Could not post reply: " + (err.message || "Please try again."));
  }
}

async function deleteGmbReply(reviewName) {
  if (!confirm("Delete this reply from Google?")) return;
  try {
    await callGmbApi({ action: "delete_reply", review_name: reviewName });
    state.gmb.reviews = state.gmb.reviews.map(r => {
      if (r.name === reviewName) return { ...r, reviewReply: null, reply_comment: null };
      return r;
    });
    saveState();
    showToast("Reply deleted");
    render();
  } catch (err) {
    showToast("Could not delete reply: " + (err.message || ""));
  }
}

// Generic edge function caller (reuses Supabase session)
async function callEdgeFunction(fnName, body) {
  const session = currentSession;
  if (!session?.access_token) throw new Error("Not authenticated");
  const supabaseUrl = (window.REVYNE_SUPABASE || {}).url || "";
  const res = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `${fnName} failed`);
  }
  return res.json();
}

async function initializeApp() {
  // ── Check for Google OAuth callback (state=gmb) ──────────────────────────
  const urlParams = new URLSearchParams(location.search);
  const oauthCode  = urlParams.get("code");
  const oauthState = urlParams.get("state");
  const isGmbCallback = oauthCode && oauthState === "gmb";

  if (!supabaseClient) {
    render();
    return;
  }

  render();

  try {
    const { data } = await supabaseClient.auth.getSession();
    await applySupabaseSession(data.session);

    // If this is a GMB OAuth callback, handle it after the Supabase session is restored
    if (isGmbCallback) {
      // Clean URL first so the code is never re-used
      history.replaceState(null, "", location.pathname);
      state.view = "gmb";
      saveState();
      await handleGmbOAuthCallback(oauthCode);
      return; // handleGmbOAuthCallback calls render() itself
    }

    // On normal app load: refresh GMB connection status quietly in the background
    if (state.isLoggedIn && state.user?.provider !== "guest") {
      loadGmbStatus().catch(() => {});
    }

    render();
  } catch (error) {
    console.warn("Could not restore Supabase session:", error);
    render();
  }

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    try {
      await applySupabaseSession(session);
    } catch (error) {
      console.warn("Could not apply Supabase session:", error);
    }
    render();
  });
}

initializeApp();
