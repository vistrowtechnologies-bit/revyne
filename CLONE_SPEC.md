# Dhanda clone spec for RevYne

Written 26 Nov 2026 from the phone audit of Dhanda AI Marketing v2.99.1 (`com.dhanda.app`) on a
Realme RMX3660 (1080 x 2400 px, 480 dpi, so 1 dp = 3 px). Companion files:
`COMPETITOR_STUDY.md` (behaviour and wording, screen by screen), `DHANDA_AUDIT_CHECKLIST.md` (what was
and was not covered), images in `/Volumes/Samsung SSD/BRANDS/Revyen-tools/dhanda-spec/` (owner's
number and email blacked out).

"Clone" here means: copy the layout, density, component patterns and workflow that make Dhanda easy for
Indian shop owners. It does not mean copying its brand, assets, wording or the practices listed in
section 1. RevYne keeps its own name, logo and colours where they differ.

How sure each value is:
- **[M] Measured**: read from the phone's accessibility tree (exact dp).
- **[S] Sampled**: pixel colour read from a screenshot (exact colour, small anti-aliasing error).
- **[E] Estimated**: measured by eye from screenshots (within about 2 to 4 dp).
- **[O] Observed**: behaviour seen on screen, no numbers.
- **[?] Unknown**: not captured; do not guess, decide it ourselves.

---

## 1. Do not clone (policy, trust and legal)

| Dhanda does this | RevYne does this instead |
|---|---|
| Auto-approves posters 2 hours before posting unless rejected; "Stop Creative Auto Approval" is off by default | Nothing is published without the owner's explicit confirm, every time |
| "Auto Reply to Reviews" is on by default | AI reply is a draft; owner approves each one |
| Review-request message shows five stars | Neutral request; never ask for 5 stars; Google button for every rating |
| Phone + OTP sign-up with bundled promo-call consent; sales WhatsApp within seconds and a call within minutes | Google sign-in, connect-only; no outbound sales contact |
| Business picked from name + city, no ownership proof | Connect-only onboarding proves the owner manages the profile |
| Posters that imitate a Google search result or an AI chat answer | Not built until checked against Google's misleading-content policy |
| Meme video templates using a TV character ("Lesson From Jethalal"), stale "FREE till 15th Sept" tags | Own or licensed templates only; no expired offers |
| Generic sample reply ("liked our collection") shown even for 1-2 star reviews | Sample generated from the business type and the rating group |
| Refund: 7 days, minus 25% + 3% + 18%; monthly plan never refundable | Plain in-app cancel; terms decided by the owner, shown up front |
| Keeps contact details in its DND list after account deletion | Deletion removes data, including storage files (roadmap 0.2) |

---

## 2. Design tokens

### 2.1 Colours [S] (values match Tailwind's palette, which suggests Tailwind on the web-view pages; that part is an inference)
| Token | Hex | Where seen |
|---|---|---|
| `navy-900` header | `#0A1337` | every header, selected filter chip, mic button |
| `navy-950` tab bar | `#08102D` to `#09102F` | bottom navigation background |
| `tab-active` pill | gradient `#3E2766` to `#4C2947` | selected bottom tab |
| `page-bg` | `#F9F9F9` (native screens), `#F1F5F9` (Settings) | page background |
| `card` | `#FFFFFF` | cards, list groups |
| `border` | `#E6E8EC` | unselected chips, card outlines |
| `text-muted` | `#707885` section labels, `#58687E` table text, `#7C8194` chip text | secondary text |
| `brand-gradient` | `#B35FDF` (purple) to `#E96784` (pink) to `#E2621D` (orange), left to right | primary buttons, Growth Action pill, "Try viral video" border, Manage button, plan card outline |
| `promo-gradient` | `#DD9A46` to `#F93737` | "Unlock Your Growth" banner |
| `link` | `#2563EB` | "Open in Google", "Click here to know", Add links |
| `ai` | border `#AF5FE5`, fill `#FBF4FF` | "Rewrite with AI" button |
| `warning` | text `#F59E0B`, fill `#FEF7EB`; date text `#D97706` | Pending chip, "Pending for 03 Dec" |
| `danger` | `#EF4444`, fill `#F8E7E7` | auto-post countdown pill, pending counts, Logout/Delete rows |
| `danger-outline` | `#F26874` | Facebook/Instagram "Connect" outline button |
| `success` | `#16A34A` to `#1BB152` | Growth sheet "Complete now", Approve Post outline |
| `sheet-purple` | `#C785EB` | Growth sheet Request Review |
| `sheet-pink` | `#EE5F76` | Growth sheet Upload Media |
| `sheet-orange` | `#E3631F` | Growth sheet Approve Post |
| `header-subtitle` | `#C4D0DD` | small line under header title |

RevYne decision: keep RevYne's own brand palette and themes (5 themes already exist) but adopt the
structure: one navy chrome colour, one brand gradient for primary actions, semantic warning/danger/success.

### 2.2 Typography
- Native (React Native) screens use the phone's system font (Roboto on this phone) [O]; the APK bundles no
  text font, only icon fonts (Material, Ionicons, Feather, FontAwesome and others) and Roboto numerals.
- Web-view screens (Preference, Refund, My Plan table) use a different web font [O]; it was not identified [?].
- Sizes [M] on Manage Google Profile (estimated from text box height, so treat as close, not exact):
  header title 17 sp; header subtitle 10 sp; section heading 18 sp; list row label 15 sp; list row value
  12 sp; link text 15 sp. Other screens [E]: page section titles about 20 sp semi-bold ("Marketing
  Tracker", "Google's Performance"); card title 16 sp bold; caption 12 to 13 sp.
- RevYne already bundles Plus Jakarta Sans; keep it and map to the same scale: 10 / 12 / 15 / 17 / 18 / 20.

### 2.3 Spacing, size, radius [M] unless marked
- Screen side margin 16 dp; content width 328 dp on a 360 dp screen.
- Header 72 dp tall below the status bar (tall form); a compact form appears after scrolling on Home [O].
- List row 62 dp tall; icon column 44 dp; text starts at 61 dp from the left.
- Cards: radius about 16 dp [E]; outline 1 dp `border` colour [E]; no heavy shadow [O].
- Chips: height about 36 dp, radius about 12 dp [E]. Pills (countdown, fill counter): fully rounded [O].
- Primary button: full width, about 48 dp tall, fully rounded or about 24 dp radius [E].
- Bottom tab bar: about 64 dp plus system inset [E]; 5 tabs, icon over label.
- Floating Growth Action pill: about 52 dp tall, full width minus margins and the mic button [E];
  mic button about 56 dp circle, navy [E].

### 2.4 Measurements of the image-only screens [E, calibrated]
Taken on 27 Nov 2026 by on-device text recognition (Apple Vision, run on the Mac) of the saved screenshots,
converted to dp (px / 3). Calibration against Manage Google Profile, where the phone reported real sizes:
17 sp header read as 19, 12 sp as 13, 15 sp as 14. So the figures below are within about 2 sp; descender
letters (g, p, y) push a reading up.

| Element | Screen | Reading |
|---|---|---|
| Page section title ("Marketing Tracker", "Google's Performance") | Home | 19 to 23 dp box: about 18 to 20 sp, semi-bold |
| Card / sheet title ("Review 07 Pending Posts", "Reply Length") | AI Post, Reply settings | 14 to 17: about 15 sp |
| Body and caption text in cards | AI Post, Post detail, Reply settings | 14 to 16: about 14 sp |
| Table cells and chip labels | Home tracker, AI Post chips | 11 to 14: about 12 to 13 sp |
| Small labels, KPI captions, section labels in caps ("ACCOUNT", "REPLY SETTINGS") | Report, Reply settings | 10 to 12: about 11 sp |
| Bottom tab labels | all tabs | 10: about 10 sp |
| Primary pill button text ("Generate AI Post (0/5)", "Approve Post") | AI Post, Post detail | 14: about 14 sp |
| Growth Action pill: title / subtitle | Home | 12 / 10: about 12 sp / 10 sp |

Positions and rhythm (dp, from the top of the screen including the 37 dp status bar):
- Side margin: 11 to 16 dp on native screens (text starts at x = 15 to 16).
- AI Post: filter chip rows at y 194 and 239 (row pitch 45 dp; three chips per row, about 100 dp each);
  post cards repeat every 143 dp (thumbnail 104 dp wide, caption starts at x 136).
- Home tracker table: header row y 294, rows at 329 / 364 / 400 (row height 35 to 36 dp); columns at x 25
  (task), 164 (target), 209 (achieved), 276 (pending), 310 (view).
- Report KPI grid: 2 columns at x 61 and 222 (pitch 161 dp), rows every 73 to 75 dp.
- Video templates grid: 2 columns at x 15 and 186 (pitch 171 dp), card rows every 320 dp.
- Floating Growth Action pill text at y 672 to 689; bottom tab labels at y 775 (screen is 800 dp tall).
- Reply settings: sections start at y 131 (ACCOUNT), 247 (category), 354 (sample), 547 (settings); about 100
  to 190 dp apart.

---

## 3. Components (build these once, reuse everywhere)

1. **App header** [O]: navy; back arrow or hamburger; avatar ring (brand-gradient ring) + business name
   + small subtitle; right slot for Help pill, bell, Settings pill, Save, Download or a help "?" icon.
2. **Bottom tab bar** [O]: navy; selected tab gets a rounded gradient pill behind icon and label.
3. **Floating action pill + mic** [O]: sits above the tab bar on every main tab; its label changes per tab
   (Growth Action, Request Review, Generate AI Post (0/5), Optimise keywords, Upload Media). The mic is a
   voice assistant (not opened).
4. **Growth Action sheet** [O]: tapping the pill dims the page, turns the pill into "Tap an action to
   complete" with an X, and stacks four task cards above it; each card has a coloured left edge, round
   icon, title, progress bar, "x done / y this week" and a coloured action button.
5. **Primary button** [O]: brand-gradient fill, white label, optional trailing icon.
6. **Outline buttons** [O]: green outline "Approve Post"; red text-only "Reject Post"; pink outline "Connect".
7. **Segmented filter chips** [O]: one row, selected = navy fill with white text and icon, others white with
   border; a second row of status chips (Pending = amber, Approved, Rejected).
8. **Date filter popover** [O]: small funnel icon + label ("This Week", "30 Days"); opens a card titled
   "Date Filters" with radio options; Back or tap outside closes it.
9. **Accordion section with fill counter** [O]: icon tile, title, one-line description, pill "2/16 filled" or
   "15/15 on" (green when complete), chevron. Used for every Preference group.
10. **Field card types** [O]:
    - text field with a pencil (opens edit);
    - single-choice select that is **locked until the pencil is tapped**, then shows X (cancel) and a check
      (save) inside the card;
    - multi-select "Select options" that opens inline as a checkbox list and closes when tapped again;
    - toggle row;
    - upload tile ("+" box and Upload button, "Any image, up to 5 MB");
    - radio list opened inline ("Choose a posting time").
11. **Bottom sheet picker with search** [O]: country picker, language picker; title, X, search box, list with
    flags or native names. Back does not close the country picker; tapping the dim area does.
12. **KPI card** [O]: icon tile, label, big number, change arrow with percentage (green up, red down);
    horizontal scroller of cards with a scroll indicator bar.
13. **Charts** [O]: line chart (views, 30 days), bar chart (target vs achieved, W1 to W5), 6-month line with an
    insight banner ("saw a 2% increase in Profile Views"), each with a funnel filter.
14. **Tracker table** [O]: Tasks / Target / Achieved / Pending (red) / View (gradient arrow button), plus a
    runner-to-finish-flag progress strip and "5 more to achieve the target".
15. **Post card** [O]: poster thumbnail left, caption (3 lines, ellipsis) right, "Pending for 03 Dec" in amber.
16. **Countdown pill** [O]: "Auto post in 16:54:07" red on pink. (RevYne: show "Scheduled for" instead; no
    auto-post.)
17. **Empty state** [O]: soft circle icon, bold title, grey one-line hint (e.g. "Nothing Posted Yet").
18. **Floating how-to video bubble** [O]: small vertical video (Hindi) with mute and close, floating over the
    page on onboarding and some pages.
19. **Offer ticker + promo banner** [O]: scrolling "Special Offer" strip. RevYne: do not copy the pressure
    pattern; at most a single, dismissible plan card.
20. **Help troubleshooting list** [O]: search "Type the error shown on screen", grouped issue cards with a
    title in quotes, grey explanation and a chevron (Facebook and Instagram guides).

---

## 4. Navigation map [O]

- **Bottom tabs:** Home, Review Replies, AI Post, Google Post, Google Media.
- **Side menu** (hamburger): header with avatar, business name, switch icon; cards: Report, My Plan,
  Settings, Preference, Manage Google Profile, Social Connect Guide; red Logout button.
- **Settings:** profile card; My Plan (Manage); Social accounts (Google connected, Facebook, Instagram);
  Tools (Preference, Configure QR Standee, Google Review QR, Keyword Planner Beta); Account (Change
  Profile, Logout, Delete Account); Privacy (Analytics and Personalisation toggle); Legal (Privacy Policy,
  Terms of Service, Refund Request); footer "Dhanda AI #68b6".

RevYne mapping (keep RevYne's tabs; place Dhanda's patterns inside them):
| RevYne tab | Takes from Dhanda |
|---|---|
| Home | KPI cards, tracker table, weekly Growth Action pill and sheet, next-post card with Approve/Reject, calendar |
| Reviews | trend chart + rating card carousel, All/Pending/Replied, star filter, per-rating reply settings |
| Get Reviews | request form with country picker, request log, QR list with scan counts, standee pairing, assisted review |
| Google | Manage-profile layout (cover, logo, basics rows, hours, photos with "What to upload", posts list), Google Post and Media tabs |
| Account | Settings structure, Preference accordions with fill counters, plan and billing, refund/terms, delete |

---

## 5. Screens (top to bottom)

Each line lists what the screen shows; full wording is in `COMPETITOR_STUDY.md`.

- **Home:** header (avatar ring, name, Help pill, bell) -> promo banner -> offer ticker -> Marketing Tracker
  card (date filter; table; runner strip; 3-page carousel dots) -> Google's Performance (filter 30/60/120
  days; KPI cards Views, Leads, Calls; line chart) -> Next post card (poster, caption, See More, Reject /
  Accept, auto-approve note) -> Social Calendar (pending-approval bar; month grid with day colours;
  legend Generated, Approved, Posted, No Post) -> how-to video card -> Keywords table (Search, Keyword;
  "Access Keyword Planner") -> "Stay active on Social Media" (Facebook, Instagram Connect) -> Growth
  Action pill + mic -> tab bar.
- **Review Replies:** header with Settings pill -> 2-page card carousel (Reviews Trend line by week; Google
  Ratings 5.0 card) -> star filter icon -> All / Pending / Replied tabs -> review cards (avatar, name, stars,
  age, text with Read more, owner reply with delete and edit) -> Request Review pill.
- **Reply Settings:** account card with "0 replies in 24 hours"; category toggle 3-5 Stars / 1-2 Stars;
  sample reply (pink left border); Reply Length slider (Ultra Short, Short, Medium, Long); Reply Language
  chips + Search Language sheet; Save in header.
- **AI Post:** viral-video banner (0/5) -> Scheduled / Posted / Not Posted -> Pending / Approved / Rejected
  -> "Review 07 Pending Posts" + auto-post countdown -> post cards -> Generate AI Post (0/5).
- **Post detail:** "Scheduled for" chip; caption with keyword highlighted and pencil; poster with expand;
  Approve Post / Reject Post.
- **Video templates:** 2-column grid of video cards (thumbnail, play icon, name, one line, offer tag,
  price); full-screen preview with watermark and "Generate Viral Video".
- **Google Post:** tip card "Google works best with keywords"; empty state; Optimise keywords (opens
  Keyword Planner).
- **Google Media:** "Where it will upload? Click here to know" (sheet: Google profile photos, "+25% more
  calls"); Scheduled / Uploaded / Not Posted; Upload Media -> explainer -> sheet (What to Upload?, Open
  Gallery, Open Camera); "What to upload" 8-card carousel.
- **Report:** header Download; summary KPI scroller (Profile Views, Leads, Calls, Direction Requests, Media
  Uploaded, Engagement, Review Replies, Google Posts, Website Visits); tabs Growth Action Report /
  Performance Report; bar charts target vs achieved; growth charts with empty states ("pulled from your
  Google Business profile once a day"; "Marketing Score is calculated every Monday").
- **Manage Google Profile:** cover card with logo (edit), name with verified tick, Open in Google, category
  and city, description, Rewrite with AI -> Business basics rows -> Regular hours (Edit; open-now pill) ->
  Photos and videos (Cover/Additional tabs, Add photo, Add video) -> Posts on Google (Add post) -> Contact
  and address (website, address, Communication Phone).
- **Complete your profile:** हिंदी switch in header; cover card; progress bar "2 of 6 steps, Next: Phone on
  Poster" (6 segments); Poster details; Top Selling Items (1 of 3); Connected accounts; "Important, please
  read" card (6 to 8 months to see results).
- **Preference:** website upsell card; Top Selling Items; Poster Details with live poster preview (tap any
  part to edit); accordions Business Details, Hashtags & Automation, Publishing & Approval, Poster Styles
  (15 types with Preview and toggle), Others (business-story prompts).
- **Settings, My Plan, Billing Details, Refund, Delete Account, Change Profile, Keyword Planner, Google
  Review QR, QR Standee, Social Connect Guide, Notifications:** see `COMPETITOR_STUDY.md` and images
  15 to 29.

---

## 6. Flows [O]

1. **Onboarding:** intro slides -> phone/OTP -> name -> top item (chips) -> city -> pick business -> Google
   consent -> 4 pitch screens -> Home. RevYne keeps Google sign-in and connect-only, but copies the
   one-question-per-screen pattern, the 1/4 progress, suggested chips and the "Why do we need this?" note.
2. **Weekly loop:** Growth Action pill -> four tasks with weekly targets (profile, 15 review requests, 5
   media, 5 post approvals) -> each button jumps to its screen. RevYne: same loop, targets the owner can
   change, and RevYne's weekly post suggestion as the post task.
3. **Post approval:** calendar or list -> post detail -> edit caption -> Approve or Reject. RevYne: Approve
   opens the existing confirm dialog; nothing goes out by default.
4. **Review request:** Request Review -> log (empty: "Request from one customer") -> form (phone with
   country, optional name, optional birthday) -> "Send using Personal Whatsapp". RevYne already has single
   WhatsApp requests; add the log and the country picker. Decide separately whether to ask for birthdays
   (privacy).
5. **Photo upload:** explainer -> What to upload guide -> gallery or camera -> scheduled upload. RevYne:
   photo guide with Google's do and don't rules and size checks (built, roadmap 2.4b).
6. **Assisted review (QR):** scan -> 2 to 3 tap questions -> AI-drafted review -> customer copies and posts.
   RevYne's review page already does this; keep the Google button for every rating.

---

## 7. Motion: RevYne's own (owner's decision, 27 Nov 2026)

The owner decided not to copy Dhanda's animations: RevYne designs its own motion. The notes below are
background only.


Not captured: this phone blocks adb screen recording. Known from the app's code bundle: React Navigation
(stack, bottom tabs, drawer) and React Native Reanimated, plus Lottie for at least one animation. Only
end states were seen, not the movement: the drawer sits on the left over a dimmed page; the Growth Action
cards stack above the pill over a dimmed page; accordions open in place and push content down; filter
popovers sit anchored under their label. How tabs, drawer, sheets and buttons actually animate (direction,
timing, easing, press feedback) stays [?] until the owner's screen recording is analysed.

---

## 8. Desktop browser layout for RevYne

Phone apps have no desktop layout to copy, so this is RevYne's own design using the same components.
The desktop web work in the other session (`DESKTOP_CHECKLIST.md`) owns the build; this section is the
target it should match.

- **Owner's decisions (27 Nov 2026, made in the Browser session's chat and reported by that session:
  "Keep current, start D2"):** keep RevYne's white menu (no navy chrome); the active menu item is a light
  tint plus a left bar (no gradient pill); no collapsed icon sidebar. These override the Dhanda-style
  suggestions that were here. Differences from this spec are listed in `DESKTOP_CHECKLIST.md`, section
  "CLONE_SPEC.md section 8 vs what is built".
- **Breakpoints:** under 900 px = phone layout above (tab bar + floating pill); 900 px and up = full
  sidebar; 1100 px and up = two-pane pages.
- **Sidebar replaces both the bottom tabs and the hamburger menu:** groups Home; Reviews (Replies, Requests,
  QR and standees); Google (Profile, Posts, Photos, Keywords); Reports; Account (Preferences, Plan,
  Settings). Selected item: light tint plus left bar.
- **Floating pill becomes a top-right primary button** in the page header (e.g. "Request review"); the
  Growth Action sheet becomes a right-rail card "This week" with the four tasks always visible.
- **Grids:** KPI cards in a 4-up row; charts side by side (2 columns); post lists as a 3-column grid of
  poster cards; review list with a reply panel opening on the right instead of a new page.
- **Pickers and sheets:** bottom sheets become centred dialogs (max 560 px) or anchored popovers;
  filters stay as popovers.
- **Forms:** Preference accordions become a two-column settings page with a sticky section list on the
  left; field cards keep the edit / cancel / save pattern.
- **Content width:** max 1200 px main column; 16 px gutter on phone, 24 to 32 px on desktop.

---

## 9. Build order (approved by the owner on 27 Nov 2026)

1. Tokens + components 1 to 12 (shared by web and Android).
2. Home: KPI cards, tracker table, Growth Action pill and sheet, next-post card (approve-first).
3. Reviews: carousel, filters, per-rating reply settings with realistic samples.
4. Get Reviews: request log, country picker, QR list with scan counts.
5. Google: Manage-profile layout, photo guide (done in code), posts with poster studio (done in code).
6. Account: Preference accordions with fill counters, plan, billing, refund and delete pages.
7. Desktop layout per section 8.
8. Motion, after the screen recording.

---

## 10. Gaps in this spec

- Motion timings and press feedback [?] (needs recording).
- Web font name on web-view pages [?].
- Sizes for screens other than Manage Google Profile and Complete your profile are calibrated estimates
  (section 2.4), within about 2 sp.
- Not opened: Help (may call), mic (permission prompt), Hindi switch, what a customer receives, AI Post
  "Lifetime" filter, Model Ethnicity options.
