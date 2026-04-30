const STORAGE_KEY = "revyne:mvp";
const LEGACY_STORAGE_KEY = "reviewpilot:mvp";
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

const BUSINESS_CATEGORIES = [
  { value: "Real Estate", typeLabel: "Property type", typePlaceholder: "plots, flats, villas, commercial spaces" },
  { value: "Restaurant", typeLabel: "Cuisine or order type", typePlaceholder: "dine-in, takeaway, biryani, thali" },
  { value: "Salon & Beauty", typeLabel: "Treatment type", typePlaceholder: "haircut, facial, bridal makeup" },
  { value: "Healthcare Clinic", typeLabel: "Consultation or treatment type", typePlaceholder: "dental, physiotherapy, eye checkup" },
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

let slideDirection = null;
let bottomNavFromIndex = 0;
let currentSession = null;
let isGeneratingReply = false;
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
    lastLogin: "",
    plan: "free",
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
    mobile: ""
  },
  stats: {
    scans: 0,
    generated: 0,
    copied: 0
  },
  suggestions: [],
  smartReplies: [],
  supportTickets: [],
  adminTickets: [],
  adminTicketFilter: "open",
  reviewDraft: {
    service: "",
    product: "",
    experience: ""
  },
  replyDraft: {
    customerName: "",
    reviewText: ""
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
      supportTickets: Array.isArray(parsed.supportTickets) ? parsed.supportTickets : [],
      adminTickets: Array.isArray(parsed.adminTickets) ? parsed.adminTickets : [],
      adminTicketFilter: parsed.adminTicketFilter || freshState.adminTicketFilter,
      reviewDraft: { ...freshState.reviewDraft, ...(parsed.reviewDraft || {}) },
      replyDraft: { ...freshState.replyDraft, ...(parsed.replyDraft || {}) }
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

function syncBottomNavPosition() {
  const activeIndex = navOrder.indexOf(state.view);
  bottomNavFromIndex = activeIndex === -1 ? 0 : activeIndex;
}

function updateBusinessField(field, value) {
  state.business[field] = field === "services" ? trimToFiveList(value) : value;
  if (field === "category") state.reviewDraft.product = "";
  if (field === "mobile") state.user.mobile = value;
  saveState();
}

function handleProfileImageUpload(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Please choose an image file");
    return;
  }

  if (file.size > 700 * 1024) {
    showToast("Please upload an image under 700 KB");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    state.business.logo = reader.result;
    saveState();
    showToast("Profile picture updated");
    render();
  };
  reader.onerror = () => showToast("Could not read image");
  reader.readAsDataURL(file);
}

function updateUserField(field, value) {
  state.user[field] = value;
  if (field === "mobile") state.business.mobile = value;
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
  return state.user.plan === "pro_max" || state.user.plan === "pro_yearly";
}

function getCategoryMeta(category) {
  return BUSINESS_CATEGORIES.find((item) => item.value === category) || BUSINESS_CATEGORIES.at(-1);
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
  currentSession = session;

  if (!session?.user) {
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
  state.business = emptyBusiness();
  state.stats = clone(defaultState.stats);
  state.suggestions = [];
  state.smartReplies = [];
  state.supportTickets = [];
  state.adminTickets = [];
  state.isLoggedIn = true;
  state.authMode = "signin";
  await loadSupabaseProfile();
  await saveSupabaseProfile();
  await loadSupabaseBusiness();
  await loadSupportTickets();
  if (state.user.isAdmin) await loadAdminTickets();
  saveState();
}

async function loadSupabaseProfile() {
  if (!supabaseClient || !currentSession?.user) return;

  const { data } = await supabaseClient
    .from("profiles")
    .select("full_name,email,mobile,plan,plan_status,is_admin")
    .eq("id", currentSession.user.id)
    .maybeSingle();

  if (!data) return;
  state.user.name = data.full_name || state.user.name;
  state.user.email = data.email || state.user.email;
  state.user.mobile = data.mobile || state.user.mobile;
  state.user.plan = data.plan || state.user.plan || "free";
  state.user.isAdmin = Boolean(data.is_admin);
  if (data.mobile) state.business.mobile = data.mobile;
}

async function loadSupabaseBusiness() {
  if (!supabaseClient || !currentSession?.user) return;

  const { data } = await supabaseClient
    .from("businesses")
    .select("*")
    .eq("owner_id", currentSession.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    state.business = emptyBusiness({
      mobile: state.user.mobile || ""
    });
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
    services: data.services || "",
    serviceTypes: data.service_types || "",
    keywords: data.keywords || "",
    language: data.language || "English",
    tone: data.tone || "Professional",
    mobile: data.mobile || state.business.mobile
  };
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
    keywords: state.business.keywords || null,
    language: state.business.language || "English",
    tone: state.business.tone || "Professional",
    mobile: state.business.mobile || state.user.mobile || null,
    updated_at: new Date().toISOString()
  };

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
  return true;
}

function getTicketPriority(category) {
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
      state.supportTickets = [data, ...state.supportTickets.filter((ticket) => ticket.id !== data.id)];
    } else {
      state.supportTickets = [localTicket, ...state.supportTickets].slice(0, 20);
    }

    saveState();
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

  showToast("Ticket updated");
  await loadAdminTickets();
  render();
}

async function signInWithGoogle() {
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
  return PLAN_LIMITS[state.user.plan || "free"] || PLAN_LIMITS.free;
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

  const usage = await getCurrentUsage();
  const limits = getCurrentPlanLimits();
  const used = type === "review" ? usage.review_generations : usage.reply_generations;
  const limit = type === "review" ? limits.reviewGenerations : limits.replyGenerations;

  if (used >= limit) {
    showToast(`Monthly ${type} generation limit reached`);
    return false;
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
    .select("id,public_token,name,category,city,google_review_url,services,keywords,language,tone,mobile")
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
    services: data.services || "",
    serviceTypes: state.business.serviceTypes || "",
    keywords: data.keywords || "",
    language: data.language || "English",
    tone: data.tone || "Professional",
    mobile: data.mobile || ""
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
    showToast("Please save your business profile before collecting reviews");
    return;
  }

  const { data: request, error: requestError } = await supabaseClient
    .from("review_requests")
    .insert({
      business_id: state.business.id,
      rating: state.rating,
      customer_experience: experience || null,
      customer_language: state.business.language || "English",
      source: "public_page"
    })
    .select("id")
    .single();

  if (requestError) {
    showToast(requestError.message || "Could not save review request");
    return;
  }

  const rows = state.suggestions.map((suggestion) => ({
    review_request_id: request.id,
    business_id: state.business.id,
    suggestion
  }));

  const { error: suggestionsError } = await supabaseClient
    .from("generated_reviews")
    .insert(rows);

  if (suggestionsError) {
    showToast(suggestionsError.message || "Could not save suggestions");
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

async function createReviewSuggestions() {
  if (!state.rating) {
    showToast("Please select a star rating first");
    return;
  }

  const allowed = await canGenerate("review");
  if (!allowed) return;

  const business = state.business;
  preserveReviewDraftFromDom();
  const selectedService = state.reviewDraft.service || business.category;
  const selectedProduct = state.reviewDraft.product || "";
  const experience = state.reviewDraft.experience.trim();
  const proMaxReview = isProMaxPlan() && Boolean(selectedService || selectedProduct);
  const services = business.services.split(",").map((item) => item.trim()).filter(Boolean);
  const serviceLine = selectedService || (services.length ? services.slice(0, 2).join(" and ") : business.category);
  const base = experience || `I had a genuine experience with ${serviceLine}.`;
  const starText = state.rating >= 5 ? "excellent" : state.rating >= 4 ? "very good" : "helpful";
  const tone = business.tone || "Professional";
  const lang = business.language || "English";
  const name = business.name;
  const city = business.city;
  const cat = business.category.toLowerCase();
  const aiResult = await callAIGenerator("review_suggestions", {
    rating: state.rating,
    experience,
    selectedService,
    selectedProduct,
    depth: proMaxReview ? "seo_deep" : "standard",
    business: {
      name,
      category: business.category,
      city,
      services: business.services,
      keywords: business.keywords,
      language: lang,
      tone
    }
  });

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
  } else if (lang === "Hindi") {

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
  await saveGeneratedReviewsToSupabase(experience);
  await incrementUsage("review");
  saveState();
  render();
}

async function createSmartReplies() {
  if (isGeneratingReply) return;

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
    saveState();
    render();

    await saveSmartRepliesToSupabase({
      customerName: name === "there" ? "" : name,
      rating,
      reviewText: text
    });
    await incrementUsage("reply");
  } catch (error) {
    isGeneratingReply = false;
    console.warn("Could not generate smart replies:", error);
    showToast("Could not generate replies");
    render();
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
    const { data, error } = await supabaseClient.functions.invoke("create-razorpay-subscription", {
      body: {
        plan,
        returnUrl: `${location.origin}${location.pathname}`
      }
    });

    if (error) throw error;
    if (!data?.shortUrl) throw new Error("Checkout link was not created");

    window.location.href = data.shortUrl;
  } catch (error) {
    console.error("Checkout error:", error);
    showToast(error.message || "Could not open checkout");
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

function showToast(message) {
  const toast = document.querySelector(".copy-toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1400);
}

function renderQrCodes() {
  document.querySelectorAll("[data-qr-code]").forEach((canvas) => {
    const text = canvas.dataset.qrCode;
    if (!text) return;

    if (!window.QRCode?.toCanvas) {
      const attempts = Number(canvas.dataset.qrAttempts || "0");
      if (attempts < 8) {
        canvas.dataset.qrAttempts = String(attempts + 1);
        setTimeout(renderQrCodes, 300);
        return;
      }

      const fallback = document.createElement("img");
      fallback.className = "qr-canvas";
      fallback.alt = "Review QR code";
      fallback.dataset.qrImage = "fallback";
      fallback.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(text)}`;
      canvas.replaceWith(fallback);
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

function downloadReviewQr() {
  const canvas = document.querySelector("[data-qr-code]");
  const fallbackImage = document.querySelector("[data-qr-image='fallback']");
  if (fallbackImage) {
    const link = document.createElement("a");
    link.href = fallbackImage.src;
    link.download = getQrFileName();
    link.target = "_blank";
    link.rel = "noopener";
    link.click();
    return;
  }

  if (!canvas) {
    showToast("QR code not ready");
    return;
  }

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = getQrFileName();
  link.click();
}

function printReviewQr() {
  const canvas = document.querySelector("[data-qr-code]");
  const fallbackImage = document.querySelector("[data-qr-image='fallback']");
  if (!canvas && !fallbackImage) {
    showToast("QR code not ready");
    return;
  }

  const imageUrl = fallbackImage ? fallbackImage.src : canvas.toDataURL("image/png");
  const reviewUrl = escapeHtml(getReviewUrl());
  const businessName = escapeHtml(state.business.name || "RevYne");
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
  if (!printWindow) {
    showToast("Allow popups to print QR");
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${businessName} Review QR</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            font-family: Arial, sans-serif;
            color: #111827;
          }
          .card {
            width: min(420px, 90vw);
            text-align: center;
            border: 1px solid #d8dde8;
            border-radius: 18px;
            padding: 34px 28px;
          }
          h1 { margin: 0 0 8px; font-size: 26px; }
          p { margin: 0 0 22px; color: #4b5563; }
          img { width: 260px; height: 260px; }
          .url { margin-top: 20px; font-size: 12px; word-break: break-all; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Review ${businessName}</h1>
          <p>Scan to share your genuine experience.</p>
          <img src="${imageUrl}" alt="Review QR code" />
          <div class="url">${reviewUrl}</div>
        </div>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
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
  return dashboardPageClean();
}

function dashboardPageClean() {
  const reviewUrl = getReviewUrl();
  const hasBusiness = hasBusinessProfile();
  const hasPublicToken = Boolean(state.business.publicToken);

  return `
    <section class="dash-wrap">
      <div class="dash-welcome">
        <h2 class="dash-title">Dashboard</h2>
        <p class="dash-sub">${hasBusiness ? "Welcome back. Your reputation workspace is ready." : "Welcome. Add your business profile to start collecting real customer reviews."} Current plan: ${escapeHtml((state.user.plan || "free").toUpperCase())}</p>
      </div>

      ${hasBusiness ? "" : `
        <div class="panel onboarding-panel">
          <div>
            <p class="eyebrow">First step</p>
            <h3>Add your business details</h3>
            <p>Once you save your business profile, RevYne will create your public review link and QR code for customers.</p>
          </div>
          <button class="button" type="button" data-view="business">Add Business Profile</button>
        </div>
      `}

      <div class="dash-metrics">
        <div class="panel metric-wide">
          <div>
            <div class="metric-label">Average Rating</div>
            <div class="metric-big-row">
              <span class="metric-big">${hasBusiness ? "0.0" : "--"}</span>
              <span class="metric-stars">${hasBusiness ? "No reviews yet" : "Not started"}</span>
            </div>
          </div>
          <div class="metric-icon-circle">+</div>
        </div>
        <div class="panel metric-half">
          <div class="metric-label">Total Reviews</div>
          <div class="metric-num">${state.stats.scans}</div>
          <div class="metric-trend positive">${hasBusiness ? "Ready to collect" : "Create profile first"}</div>
        </div>
        <div class="panel metric-half">
          <div class="metric-label">AI Replies</div>
          <div class="metric-num">${state.stats.generated}</div>
          <div class="metric-trend brand">${hasBusiness ? "Available" : "Waiting for reviews"}</div>
        </div>
      </div>

      <div class="ai-spotlight">
        <div class="ai-spotlight-inner">
          <div class="ai-icon-box">&#10022;</div>
          <div>
            <div class="ai-spotlight-title">${hasBusiness ? "Smart Reply Ready" : "Set Up Before Replies"}</div>
            <p class="ai-spotlight-sub">${hasBusiness ? "Paste a real customer review and generate professional draft replies instantly." : "Add your business profile first, then use AI replies for real customer reviews."}</p>
          </div>
        </div>
        <button class="button full" type="button" data-view="${hasBusiness ? "reply" : "business"}" style="margin-top:14px;">${hasBusiness ? "Generate Reply" : "Add Business Profile"}</button>
      </div>

      <div class="recent-reviews">
        <div class="recent-header">
          <span class="recent-title">Recent Reviews</span>
          <button class="view-all" type="button">View All</button>
        </div>
        <div class="panel empty-state">
          <strong>No reviews yet</strong>
          <p>Your real customer reviews will appear here after customers start using your review link.</p>
        </div>
      </div>

      ${hasBusiness ? `
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
      ` : ""}
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
  const categoryMeta = getCategoryMeta(b.category);
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
      <div class="field">
        <label for="profile-image">Profile Picture</label>
        <div class="profile-upload-row">
          <div class="profile-upload-preview">
            ${b.logo ? `<img src="${escapeHtml(b.logo)}" alt="Business profile" />` : `<span>${escapeHtml((b.name || state.user.name || "R").charAt(0).toUpperCase())}</span>`}
          </div>
          <div>
            <input id="profile-image" class="file-input" type="file" accept="image/*" data-profile-image />
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
      ${inputField("Google Review URL *", "googleUrl", b.googleUrl)}
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

      <div class="field">
        <label>Choose Language</label>
        <div class="option-row">
          ${chip("language", "English")}
          ${chip("language", "Hindi")}
          ${chip("language", "Hinglish")}
          ${chip("language", "Marathi")}
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
    <h1 class="page-title">Smart Reply Generator</h1>
    <p class="page-subtitle">Create warm, professional Google Business replies in seconds</p>
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
        <p class="eyebrow">Pricing</p>
        <h1 class="page-title">Choose the plan that fits your review workflow</h1>
        <p class="page-subtitle">Every plan keeps review wording honest. Pro Max adds service-level personalization for businesses that want more detailed SEO-friendly drafts.</p>
      </div>
      <div class="pricing-note">
        <strong>Current plan</strong>
        <span>${formatPlanName(state.user.plan || "free")}</span>
      </div>
    </section>
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

function planCardV2({ id, name, label, description, price, period, oldPrice, featured, cta }) {
  const free = id === "free";
  const proMax = id === "pro_max";
  const proOrAbove = !free;
  const currentPlan = (state.user.plan || "free") === id;
  const features = [
    ["Unlimited QR scans", true],
    [`${free ? "2" : "5"} AI review suggestions per customer`, true],
    ["Editable services and keywords", proOrAbove],
    ["Smart SEO-friendly replies", proOrAbove],
    ["Service and type selection on public review page", proMax],
    ["In-depth SEO review generator", proMax],
    ["Multi-language support including Marathi", proOrAbove],
    ["Tone customization", proOrAbove],
    ["Future updates included", proOrAbove]
  ];

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
      ${currentPlan
        ? `<button class="button ghost full" type="button" disabled>Current Plan</button>`
        : free
          ? `<button class="button ghost full" type="button" disabled>Free Included</button>`
          : `<button class="button full" type="button" data-plan-select="${id}">${cta}</button>`}
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
  const draft = state.reviewDraft || {};
  const categoryMeta = getCategoryMeta(b.category);
  const services = splitList(b.services, [b.category || "General Service"]).slice(0, 5);
  const products = splitList(b.serviceTypes, splitList(b.keywords, ["Standard", "Premium", "Custom Requirement"]));
  const proMax = isProMaxPlan();
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
        <textarea id="reviewText" class="textarea" placeholder="Tell us what actually happened..." data-review-draft="experience">${escapeHtml(draft.experience || "")}</textarea>
        <button class="button full" type="button" data-generate-review>Generate My Review</button>
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
  return `
    <section class="support-page">
      <div class="support-hero panel">
        <div>
          <p class="section-kicker">Support Center</p>
          <h1>Raise a ticket</h1>
          <p>Tell us what is blocked. We will track it like a proper support desk: open, in review, waiting for you, then resolved.</p>
        </div>
        <div class="support-sla">
          <strong>Priority logic</strong>
          <span>Login and payment issues are marked high priority automatically.</span>
        </div>
      </div>

      <section class="panel support-form">
        <div class="field">
          <label for="support-category">Issue type</label>
          <select id="support-category" class="select">
            <option value="general">General question</option>
            <option value="login">Login or account access</option>
            <option value="payment">Payment or subscription</option>
            <option value="ai_generation">AI review/reply generation</option>
            <option value="review_page">Public review page or QR code</option>
            <option value="business_profile">Business profile setup</option>
          </select>
        </div>
        <div class="field">
          <label for="support-subject">Subject</label>
          <input id="support-subject" class="input" placeholder="Example: Google login is not opening" />
        </div>
        <div class="field">
          <label for="support-message">Describe the issue</label>
          <textarea id="support-message" class="textarea" placeholder="What happened, where did it happen, and what were you trying to do?"></textarea>
        </div>
        <button class="button full" type="button" data-submit-ticket>Submit Ticket</button>
      </section>

      <section class="panel support-process">
        <h2>How we resolve tickets</h2>
        <div class="support-steps">
          <div><strong>1. Capture</strong><span>Customer creates a ticket from their account.</span></div>
          <div><strong>2. Triage</strong><span>We assign category, priority, owner, and status.</span></div>
          <div><strong>3. Investigate</strong><span>We check account, payment, app logs, and database records.</span></div>
          <div><strong>4. Resolve</strong><span>We reply with the fix and close only after confirmation.</span></div>
        </div>
      </section>

      <section class="support-list">
        <div class="recent-header">
          <div class="recent-title">Your Tickets</div>
          <button class="view-all" type="button" data-refresh-tickets>Refresh</button>
        </div>
        ${tickets.length ? tickets.map(ticketCard).join("") : `
          <div class="panel empty-state">
            <strong>No tickets yet</strong>
            <p>When you raise a ticket, it will appear here with status updates.</p>
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
  const items = [
    { icon: "i", label: "About RevYne", view: "about", color: "#e5eeff", fg: "var(--blue)" },
    { icon: "↻", label: "Order History", view: "orders", color: "#e5eeff", fg: "var(--blue)" },
    { icon: "@", label: "Contact Us", view: "support", color: "#e5eeff", fg: "var(--blue)" },
    ...(u.isAdmin ? [{ icon: "#", label: "Admin Support", view: "adminSupport", color: "#f0dbff", fg: "var(--blue)" }] : []),
    { icon: "≡", label: "Terms & Privacy", view: null, color: "#e5eeff", fg: "var(--blue)" }
  ];

  return `
    <section class="profile-page">
      <div class="profile-hero">
        ${avatar}
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
  if (isPublicReviewRoute()) return publicReviewPage();
  if (!state.isLoggedIn) return authPage();

  const pages = {
    dashboard: dashboardPageClean,
    business: businessPage,
    reply: replyPage,
    pricing: pricingPageV2,
    orders: ordersPage,
    about: aboutPage,
    support: supportPage,
    adminSupport: adminSupportPage,
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
    input.addEventListener("input", () => updateBusinessField(input.dataset.field, input.value));
  });

  document.querySelectorAll("[data-user-field]").forEach((input) => {
    input.addEventListener("input", () => updateUserField(input.dataset.userField, input.value));
  });

  document.querySelector("[data-profile-image]")?.addEventListener("change", (event) => {
    handleProfileImageUpload(event.target.files?.[0]);
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

  document.querySelector("[data-save-mobile]")?.addEventListener("click", async () => {
    const mobile = state.business.mobile.trim();
    if (!/^\d{10}$/.test(mobile)) {
      showToast("Please enter a valid 10-digit mobile number");
      return;
    }
    state.user.mobile = mobile;
    const saved = await saveSupabaseProfile();
    if (!saved) return;
    saveState();
    showToast("Mobile number saved");
  });

  document.querySelector("[data-save-profile]")?.addEventListener("click", async () => {
    const b = state.business;
    if (!b.name.trim() || !b.category.trim() || !b.googleUrl.trim()) {
      showToast("Please fill in all required fields (Name, Category, Google URL)");
      return;
    }
    const profileSaved = await saveSupabaseProfile();
    if (!profileSaved) return;
    const businessSaved = await saveSupabaseBusiness();
    if (!businessSaved) return;
    showToast("Profile updated");
  });

  document.querySelector("[data-submit-ticket]")?.addEventListener("click", createSupportTicket);

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
    state = guestState;
    saveState();
    render();
  });

  document.querySelectorAll("[data-plan-select]").forEach((button) => {
    button.addEventListener("click", () => {
      startPlanCheckout(button.dataset.planSelect);
    });
  });

  document.querySelectorAll(".logout, [data-logout]").forEach((button) => {
    button.addEventListener("click", signOut);
  });

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", () => copyText(button.dataset.copy));
  });

  document.querySelector("[data-download-qr]")?.addEventListener("click", downloadReviewQr);
  document.querySelector("[data-print-qr]")?.addEventListener("click", printReviewQr);

  document.querySelectorAll("[data-open-google]").forEach((button) => {
    button.addEventListener("click", () => window.open(state.business.googleUrl, "_blank", "noopener"));
  });
}

async function render() {
  if (isPublicReviewRoute()) {
    await loadPublicReviewBusiness();
  }

  const dir = slideDirection;
  slideDirection = null;
  document.querySelector("#app").innerHTML = currentPage();

  if (dir) {
    const main = document.querySelector(".main");
    if (main) main.classList.add(`slide-${dir}`);
  }

  bindEvents();
  renderQrCodes();
}

window.addEventListener("hashchange", render);

async function initializeApp() {
  if (!supabaseClient) {
    render();
    return;
  }

  render();

  try {
    const { data } = await supabaseClient.auth.getSession();
    await applySupabaseSession(data.session);
    render();
  } catch (error) {
    console.warn("Could not restore Supabase session:", error);
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
