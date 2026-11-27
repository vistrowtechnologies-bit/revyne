# Competitor study: Dhanda (EZO) and RevmeAI

Study notes from 26 Nov 2026. Kept so later sessions don't have to redo the
research. Sources: Play Store and App Store listings, plus hands-on passes
through both Android apps on a real phone (Realme RMX3660) over adb. Screenshots
are in `/Volumes/Samsung SSD/BRANDS/Revyen-tools/shots/` (outside the repo;
notification and account-list screenshots were deleted on purpose).
Anything marked "not seen" was not seen. Dhanda's inside (dashboard and later)
was not reached yet; see the end.

## Dhanda (EZO Technologies; Play id com.dhanda.app)
- 1M+ installs, 4.6 stars, about 80K ratings. Tagline "Get More Customers from Google".
- Advertised: free Google Score audit, SEO keyword analysis, competitor analysis,
  personalised replies to Google reviews, weekly images and updates for the profile.
- Price: about 999 rupees for a 3-month plan (user reports). Official price list not seen.
- Recent 1-star Play reviews (Oct to Nov 2026): the 999 plan has "no features",
  then sales calls push bigger plans; unreachable after payment; Facebook and
  Instagram setup promised but not done; support ticket form errors; a simple
  logo change refused unless the buyer takes a one-year plan.
- Three positive App Store reviews share nearly identical wording (likely solicited).

### Flow seen on the phone
1. **Intro carousel, 3 slides:** (a) "Post daily on Social Media & get more View,
   Leads" with finished image posts (Hinglish captions, e.g. a restaurant and a
   salon creative) and Google, Facebook, Instagram and WhatsApp icons; (b) "Reply
   to Customer Reviews with SEO Keywords" with an **Auto Reply with AI** button;
   (c) "Ask Customers for Reviews on WhatsApp" with a message showing five
   stars and a Write Review button. So Dhanda does have WhatsApp review requests.
2. **Sign-in: phone number + OTP only**, no Google sign-in at this stage. The
   screen says the user agrees to promotional calls and WhatsApp messages.
3. **A WhatsApp sales message arrived within seconds of the OTP** (a sales
   person's profile, asking to "confirm your audit availability"). This is the
   source of the sales-call complaints. The user confirmed this independently.
4. **Onboarding in 4 steps:** (1) business name; (2) top selling item, with
   AI-suggested chips for the business type (e.g. SEO Audits, Social Media
   Management) and an Add More Items button; (3) city; (4) "Which one is your
   business?" showing the matching Google listing (name, address, rating and
   review count).
5. **No ownership proof:** the match came from a name and city alone. No Google
   sign-in or verification was needed to pick a business. (Google account picker
   appeared only after confirming the business; not completed.)
6. **A floating "how to" video player (Shorts style, Hindi) is on every page**,
   with mute and close buttons, explaining that screen. The owner confirmed it
   is on every page.
7. **Google sign-in is two consent screens.** The first ("Sign in to Ezo") asks only for
   name, profile picture and email. A second screen then says "Ezo wants access
   to your Google Account" and offers one unticked checkbox: "See, edit, create
   and delete your Google business listings" (the Business Profile permission,
   the same one RevYne needs). Seen on screen, not assumed. What happens if the
   box is left unticked was not tested, so it is not known whether Dhanda still
   works without it. Dhanda's app asks for this permission, but its earlier
   business match (step 4) was made before any Google permission was granted.
8. **Four pitch screens after sign-in (each with the Hindi video and a "Try AI Marketing @ Rs 999 Only" chip):**
   (1) "Your Customers Are Searching": "314500+ customers", a keyword table (efile 41,000, pancard 41,000,
   digital marketing 15,000 ...) and "197,000 total monthly searches", though the top keywords are unrelated to the
   business; (2) "Your Google Business Score": a gauge showing 9% "Poor" and a Without / With growth chart;
   (3) "Reply with Search Keywords": a sample AI reply badged "Auto-Sent" with "2 high-volume keywords injected
   automatically" (the phrase "Digital marketing" stuffed in twice); (4) "AI Agent Replies Every Review":
   "handled 24x7 automatically", sample reply badged "Auto-Replied", button **"Go Viral @ Rs 999/-"** (the payment
   step, not tapped). The sample review shown is not the profile's real review.
9. **Skip** (top right) on these screens opens the free dashboard. Header: business name, Help, bell. A
   "Marketing Score" gauge shows 48% "Poor" (the pitch screen showed 9% for the same business a minute earlier).
   Bottom tabs: Home, Review Replies, AI Post, Google Post, Google Media. Android asked for notification permission.
- Language of UI: English.

### Dhanda contact timeline after signup (26 Nov 2026, observed on the owner's phone)
1. Phone number entered at sign-in, with the bundled consent line for promotional calls and WhatsApp messages.
2. Within seconds of the OTP: a WhatsApp message from a Dhanda sales profile asking to confirm an audit slot.
3. About three minutes after entering the business name: an incoming phone call from "Dhanda AI Marketing"
   (a Truecaller "First time caller, Verified Business" overlay with a landline number). Not answered.
RevYne rule: no outbound sales calls or WhatsApp to new users; support only when the user asks.

### Dhanda app, tab by tab (seen on the phone, Free state, 26 Nov 2026)
Floating on every tab: a round **mic** button (voice assistant) and a main action
pill. A **Hindi how-to video** floats on the onboarding pages.
- **Home:** header (business name, Help, bell); orange banner "Unlock Your Growth! Activate AI-powered
  marketing" with **Start @ Rs 999/-** and a strike-through 1,999 to 999/month ticker; **Marketing Tracker**
  (This Week filter): AI Post Approved, AI Post Published, Media Uploaded, each target 5, achieved 0, with a
  runner-to-flag progress bar; **Google's Performance** (30 days): Views 62, Leads 4, Calls 0, line chart;
  **Growth Action** pill "0 of 25 done"; **Next post scheduled** (27 Nov, 11:00 AM) with a finished AI
  image post and caption plus **Reject / Accept** buttons and the line "If it is not rejected it will be
  considered approved 2hr before post"; **Social Calendar** ("12 posters pending for approval", month view).
- **Review Replies:** Reviews Trend (This Month, W1 to W4), filter, All / Pending / Replied tabs, real review
  cards, **Request Review** button (WhatsApp request).
- **AI Post:** "Try Generating Viral Video (0/5)"; Scheduled / Posted / Not Posted and Pending / Approved /
  Rejected chips; "Review 07 Pending Posts" with an "Auto post in hh:mm:ss" countdown; each card a designed
  image (poster with QR and contact details, an AI-assistant mockup, a Google search mockup) plus a repetitive
  caption ("... in Pune offers expert digital marketing services ...") and "Pending for <date>";
  **Generate AI Post (0/5)**.
- **Google Post:** tip "Using your keywords we post daily on your Google Profile"; empty state "No text posts
  yet - text-only posts the Content Agent publishes"; **Optimise keywords** button.
- **Google Media:** Scheduled / Uploaded / Not Posted (Uploaded shows "0 Media uploaded - No Google Media"; the
  explainer sheet reappears when the sub-tab changes); "0 Media scheduled"; **Upload Media** opens an explainer
  ("This Media Will be Uploaded on Your Google Profile", "Fresh photos get up to 25% more calls", Skip / Don't
  Show This Again), then a sheet with **What to Upload?**, **Open Gallery**, **Open Camera**, then the phone's
  photo picker. No in-app gallery or stock library seen.
- **"What to upload?" guide (8 cards, "You can upload both photos & videos"), each with example photos and
  one line:** Exterior Photos (find and recognise your business), Interior Photos (show your clean, comfortable
  space), Product Photos (help customers see your best items), Staff in Action (show real service in
  progress), Food and Drink Photos (your most selling dishes and drinks), Common Area Photo (waiting, seating
  or lobby areas), Rooms Photos (check variety of rooms before they book), Team Photos (the real people behind
  your business). **No "what not to upload" card was seen**; the guide is positive-only.
- **Dead ends on the free plan:** "Generate AI Post (0/5)" and "Generate Viral Video (0/5)" are quotas, and
  the 999 buttons are on every pitch screen. Paid features were not opened.

### How Dhanda makes its posts (owner's observation plus what was seen)
- **Premade templates, filled per customer.** The owner's reading: the images are premade templates where only
  the business name, review QR and other generic details change. Consistent with the screens: the poster for
  the test business had unfilled generic labels ("Service type", "Target audience", "Flexible timing"), a map QR
  and a contact line, and three captions followed one pattern ("... in Pune offers/delivers expert digital
  marketing services ..."). The text is keyword-first (the keyword is highlighted in the caption).
- **Post detail:** caption (editable with a pencil, "Show more"), the finished image (expandable), **Approve
  Post** (green) and **Reject Post** (red text). Un-rejected posts auto-approve 2 hours before posting.
- **Viral Video screen** ("Tap to preview", all marked 0 rupees): effect templates, e.g. Promo Video
  ("Promotional video"), Baseball Hit ("Your product smashed out of the park"), Snow Rock Fall ("An avalanche
  crashes down to reveal your offer"), Glass Break ("Shatter the screen to show off your product"). Each carries
  "Freebie Offer - FREE Till 15th Sept / 15th Nov!", dates that were already past on 26 Nov (stale copy).
- **For RevYne:** templates with brand fields are cheap to build and are what owners buy. Do it better: real
  business name, logo, own photos (Google prefers photos taken at the place), festival-aware, owner approves
  first, no stale offers, no keyword stuffing.

### Dhanda settings screens (seen on the phone, 26 Nov 2026)
- **Settings:** profile card; **My Plan** ("Upgrade to Pro", Manage); **Social accounts**: Google (connected, shows
  the signed-in Google email), Facebook and Instagram with Connect buttons (not connected); **Tools**: Preference,
  Configure QR Standee, Google Review QR, Keyword Planner (Beta); **Account**: Change Profile (switch to a
  different business), Logout, **Delete Account** ("Permanently delete your account and data"); **Privacy**:
  "Analytics & Personalisation" toggle, ON by default ("Firebase Analytics & Meta advertising data");
  **Legal**: Privacy Policy, Terms of Service, a third item (name not seen). Android also asked for notification
  permission earlier.
- **Configure QR Standee:** opens a camera scanner ("Align QR code within the frame", zoom 1.0x) with Flash,
  **Enter code** and **Upload image**. Enter code asks to "Type the short code printed on the standee, or paste its
  full link" (example `5ka9z2`) and a Check QR button. So a physical standee carries a short code that the owner
  pairs to a business in the app. Seen: the pairing screen. Not seen: whether Dhanda sells the standee, its price,
  or whether it holds an NFC chip.
- **Google Review QR:** tabs **My QRs** and **Suggestions**. My QRs: Generate QR, "Update review location"
  (paste a Google Maps link, then "Find my business"), "YOUR QRS 0 / 50", then after generating one a card with
  a short code, "0 SCANS", created time, "Last scan: Never scanned" and a Download button. The QR count and scan
  count are visible per QR. Suggestions = **Assisted Review**: when on, a scan leads to 2 to 3 quick tap
  questions, then an AI-drafted review the customer copies and posts to Google (this is what RevYne's review
  page already does); off by default, so scans go straight to Google. Settings: review tone (Casual,
  Professional, Enthusiastic), "Regenerate questions with AI", "Reviews generated, last 30 days", "Questions
  customers see 0 / 3" with Add question. Generating a QR in the test created a real QR on the owner's account.
- **Keyword Planner (Beta):** "Added keywords" list (number, phrase, city, a number such as 100, 500, 1000, 1500
  with a remove X); Keyword Search form (Country India, Locality/City, Keyword, Search); results show a LOW
  badge, "Searches: 14800" and ADD or ADDED buttons; header "Search credits used 2 / 20". The monthly-search
  numbers come from a source the app does not name. The test searched "digital marketing" in Pune; the
  numbers were not independently checked, so treat them as unverified.
- **Preference:** a "Create your own website" premium upsell (Upgrade, locked); **Top Selling Items** ("Products or
  services our AI creates posters for") with Add Image / edit / delete and Add Item; **Poster Details** (1/5
  filled): a live poster preview where tapping an area edits it (Brand Name, Logo, Item Name, Item Description,
  Item Image, Phone, Address), plus Brand Name (required), Brand Logo (Add Logo), Phone on Poster, Address on
  Poster, Additional Info on Post. This confirms the poster templates are filled from these saved fields.

### Dhanda Preference, rest of the screen (seen 26 Nov 2026; text read from the screen)
- Groups with fill counters: Top Selling Items (1 item), Poster Details (1/5), **Business Details** (2/16: store,
  founder, target audience), **Hashtags & Automation** (1/5: hashtags, review replies, reports, campaign pause),
  **Publishing & Approval** (10/11), **Poster Styles** (15/15 on), **Others** (0/20: business story and photos).
- **Publishing & Approval:** "Stop Creative Auto Approval" toggle (off by default, so posters auto-approve unless
  the owner switches it on); **Posting Time**: "Your posts go out in a 2-hour slot (IST)", Publish Time Slot
  dropdown defaulting to "As scheduled - Our usual posting time"; **Publish Festive Posts On**: Facebook, Instagram,
  Google toggles (all on); **Religious Festive Posts**: Hindu, Muslim, Christian, Sikh, Jain, Buddhist toggles
  (all on).
- **Poster Styles, 15 types, each with Preview and an on/off toggle** (all on by default): Product card, Photo
  collage, Social media ad, Did you know?, Newspaper cutting, Magazine cover, Magazine pages, Search result (your
  business as the answer to a customer's search), AI chat answer (your business as the answer in an AI chat),
  Magnifying glass (product as a featured news story), 3 easy steps, From the founder's desk, Educational (a
  common customer question, answered simply), Testimonial (posts made from your customers' Google reviews),
  plus a fixed "QR code on posters: a small QR code with directions on every poster". The previews are polished
  sample posters for a sample restaurant with a QR code and contact line on each.
- Take-aways: the owner can switch poster styles off, set a posting slot and choose religions for festive
  posts. Defaults auto-approve and auto-publish, the opposite of RevYne's approve-first rule. "Search result" and
  "AI chat answer" posters imitate Google results and AI answers; whether that fits Google's policy against fake
  or misleading content was not checked, so do not copy them without reading the policy first.
- Testimonial posters turn Google reviews into posts. RevYne rule: reviews are read live and not stored beyond
  need, so any such feature needs an explicit, per-review owner opt-in and a policy check first.

- **Others (0/20 filled): business-story prompts that feed the AI posts.** Seen on screen: "How you are different
  than competition", "Why customer should visit you", "Low standards of industry", "Your solutions for low
  standards", "Malpractices in industry"; the remaining prompts (20 in total) were not read. These explain how a
  generic template becomes specific copy: the owner supplies story fields once and the AI reuses them. Note
  "Malpractices in industry" invites content that criticises others; RevYne should keep owner-written
  differentiators and avoid auto-generating claims about competitors or the industry.
- **Business Details (2/16) and Hashtags & Automation (1/5)** were not opened, so their fields are unknown.

### Dhanda plan, approvals, checklist and review request (seen 26 Nov 2026; nothing paid, approved or sent)
- **My Plan:** "Your Pro Plan is: Not Activated", the red "Unlock Your Growth! Start @ Rs 999/-" banner with a
  scrolling offer ticker (struck-through 1,999 to 999/month; a fragment reads "... month after trial", so a trial
  and monthly billing are implied but the full terms were not read), a Billing Details button, "No Active Mandates"
  (an autopay mandate model) and a Payments history ("No payments yet"). The earlier 999 for 3 months figure from
  reviews and the "999/month" ticker differ; the actual plan terms were not confirmed.
- **Post approval detail:** the Home "Next post" card and the "12 posters pending for approval" list open a post
  with the finished image, an editable caption, **Approve Post** and **Reject Post**. A sample pending poster was a
  large AI-generated image of a man with a tablet over a city skyline, headline text, a "What we do" list, phone
  number and address. Posts are AI-made imagery, not photos of the business (relevant to Google's guidance that
  photos should show the real place; Dhanda uses them as posts and on social media).
- **Growth Action (weekly checklist, 0 of 25 done):** Complete your Profile (2 of 6, "Complete now"), Request Review
  (15 this week, "Request"), Upload Media (5 this week, "Upload"), Approve Post (5 this week, "Approve"). A
  gamified weekly to-do that ties the whole app together.
- **Request Review (customer WhatsApp request):** a form with Phone Number (required, +91, 10 digits), Name
  (optional), Date of Birth (optional, DD/MM; apparently for greetings, not confirmed) and one button, **Send using
  Personal Whatsapp**. It sends from the owner's own WhatsApp. Nothing was entered or sent.
- **Voice assistant:** a round mic button floats on most screens (not opened).
- **Not opened:** Report, Manage Google Profile, Social Connect Guide, Business Details, Hashtags & Automation.

### Dhanda pricing table ("Compare plans", read on screen 26 Nov 2026; "All features subject to change")
| Feature | Starter, Rs. 999/month | Pro (Bestseller), Rs. 16,000/year | 3 Year Plan, Rs. 36,000/3 years |
|---|---|---|---|
| Growth (claimed) | - | "2x Growth" | "10x Growth" |
| Keywords | Up to 20 | Unlimited | Unlimited |
| Posts per month | 10 | 25+ | 25+ |
| Photo uploads | 20/month | Unlimited | Unlimited |
| Video uploads | 5/month | Unlimited | Unlimited |
| Website creation | No | Included | Included |
| Instagram & Facebook | No | Yes | Yes |
| AI mode | Basic | Advanced | Advanced |
| Account verification | No | Yes | Yes |
| New account creation | No | Yes | Yes |
| Keyword analysis | Basic (limited) | Unlimited | Unlimited |
| Reports | - | Monthly | Monthly and yearly |
| Expert support | Email, 5 tickets/month | Unlimited | Unlimited |
| Onboarding team | No | Dedicated | Dedicated |
| Review reply | Within 24 hours | Real-time | Real-time |
Footer: "Go Premium" button. Notes: the "2x / 10x Growth" claims are marketing promises with no stated basis; the
Starter plan cannot post to Instagram or Facebook even though the intro slides advertise them. This is the screen
behind the "999" ticker, so the Starter price is 999 per month (the user review's "999 for 3 months" was likely an
older offer).

### Dhanda Review Replies settings (header "Settings" button on Review Replies)
Account card with the business name, its Google email and a "0 replies in 24 hours" pill; **Select reply category**:
3-5 Stars / 1-2 Stars (separate settings per group); **Sample reply** (a generic text about "our collection" and
"trendy and comfortable styles", not tailored to the business); **Reply settings**: Reply Length slider (Ultra
Short, Short, Medium, Long; default Short) "How long AI replies should be for 3-5 star reviews"; **Reply Language**:
English (selected), Hindi, plus a "Search Language" field; a Save button in the header. Review Replies also has a
Reviews Trend chart (W1-W4) with a date filter (This Month, Last 6 Months, Last 12 Months), All / Pending / Replied
tabs, a filter icon, reply cards with delete and edit icons, and a floating "Request Review" button.

### Dhanda AI Post extras
- Filters: Scheduled / Posted / Not Posted and Pending / Approved / Rejected; Posted shows "00 Posts" with a
  Lifetime dropdown; empty states "Nothing Posted Yet - Approve or create AI posts to keep your profile active" and
  "Nothing Rejected". Header has a help (?) icon. "Review 07 Pending Posts - Auto post in 16:51:21" countdown.
- **Viral video templates** ("Select video template", "Tap to preview"): Promo Video, Baseball Hit, Snow Rock Fall,
  Glass Break, Hammer Smash, Aeroplane Flyby, Basketball Dunk, Whenever I See, and more below; each "Freebie Offer -
  FREE Till 15th Sept!" (one says 15th Nov) at 0 rupees. Preview is full-screen with a PREVIEW watermark, "Swipe up
  for more" and a "Generate Viral Video" button. The stock clips are unrelated to the business.
- Pending post detail: "Scheduled for", editable caption with the keyword highlighted, the image (expandable), and
  Approve Post / Reject Post. One poster style mimics a Google search result for "digital marketing near Pune" with
  the business as the answer and its phone number; another is a magazine spread. Not approved or rejected in testing.

### Dhanda refund terms (Settings > Refund Request, read on screen 26 Nov 2026)
- Three accordions: **1 Year Business Growth Plan**, **3 Years Long-Term Growth Plan**, **Monthly Autopay Plan**.
- 1 Year and 3 Years (same text): "One-time purchase with manual renewal", Pro Support. Refund only **within 7 days
  of purchase**; if onboarding/setup is done, **25% is deducted** as onboarding and service charges; **3% payment
  gateway charges** deducted; if the GST invoice was filed, **another 18% GST** deducted. Money in 5-7 business days
  after an approval email. Each has a red **Request Refund** button (not tapped).
- Monthly Autopay: "Auto renew via Autopay", Standard support. "Customer can pause or cancel Autopay anytime.
  **Refund are not possible** since this is an autopay plan." No Request Refund button.
- "Services included" lists for all plans: Google account optimisation, automatic replies to Google reviews with SEO
  keywords, **daily posting on Google, Facebook and Instagram** with SEO descriptions and hashtags, daily WhatsApp
  updates, Google account recovery help, weekly growth report on WhatsApp; app features: viral posts, post directly
  to Google/Instagram/Facebook, download posts for WhatsApp status. (The in-app plan table says Starter has no
  Instagram/Facebook, which conflicts with "Daily posting on Google, Facebook, and Instagram" listed for Monthly.)
- For RevYne: a plain, in-app cancel with no deductions is a clear advantage over 25% + 3% + 18% deductions.

### Dhanda Delete Account screen (reached by accident while navigating; nothing tapped on it)
Lists what deletion does ("All your profiles will be deleted", "Delete all account information", "Remove business
data"), a "Have questions about data retention?" note saying communication details are **kept in their DND (Do Not
Disturb) records even after deletion**, a support email, a named Data Protection Officer with an address, and two
buttons: **Delete Account Permanently** (red) and **Keep My Account**. Neither was tapped.

### Dhanda Preference, all sections (images 22_preference_img_01-04, 22b_business_details_img_01-06)
- **"Create your own website" (Premium feature, locked):** card at the top of Preference: "Creating your SEO website
  is a Premium feature. Upgrade to get discovered on search." Four promised parts: Show up on Google, Call & Message,
  Photos & Services, Location & Business Hours; Upgrade button. The plan table lists "Website creation" for Pro and
  3-year only. The site itself was not seen (locked).
- **Business Details (2/16):** Store Front photo (upload, up to 5 MB), Founder Name, Founder Photo, Founder Gender,
  **"Use Founder Image In Post"** toggle (on), Communication Phone, City Name, Business Tagline, **Brand Color**
  (hex, default #4169E1), Business Description, Target Gender, Target Age Group, Target Region, **Model Ethnicity**
  (for AI-generated people in posters), Audience, Call to Action (CTA).
- **Hashtags & Automation (1/5):** Custom Hashtags (max 10), Hashtag Mode (exact only / add to auto-generated),
  **"Auto Reply to Reviews" toggle, ON by default** ("every new review gets a smart reply automatically. Turn OFF to
  reply to reviews yourself"), Customer Growth Report Language, "Pause Auto Campaigns till" date.
- Take-away for RevYne: Dhanda replies to reviews automatically unless the owner finds and turns off this toggle.
  RevYne keeps approve-first. A brand-color and founder-photo setting would help our poster studio.

### Dhanda Preference dropdowns (opened, read and closed without selecting, 26 Nov 2026)
Behaviour: single-choice fields (Founder Gender, Target Gender) are **locked until the pencil is tapped**; edit mode
then shows an X (cancel) and a check (save) on the card. Multi-select fields ("Select options") open directly as a
checkbox list under the field and close by tapping the field again.
- **Founder Gender:** Male, Female.
- **Target Gender:** Male, Female, Unisex.
- **Target Age Group (multi):** 25 year Female, 25 year Male, 45 year Female, 45 year Male, Couple in 30s, Couple in
  50s, Family, Toddler, Kids, 65 year Female, 65 year Male. (These describe the people shown in AI posters.)
- **Target Region (multi):** USA/Canada, India, Global, Middle East, Europe, Southeast Asia, Latin America, Africa.
- **Model Ethnicity (multi):** empty until a region is picked: "Pick a Target Region first to see its ethnicities."
  Not opened further, because that would need saving a region.
- **Audience (multi):** Customer, Couple, Client, Guest, Patient, Patron, Member, Pet Parent, Student, Passenger,
  Visitor, User, Subscriber, Buyer, Donor.
- **Call to Action (multi):** Visit Us Today, Call Now, Book Your Appointment, Grab the Offer, Order Now, Find Us Near
  You, Try It Free, Chat on WhatsApp, Get a Free Quote.
- **Customer Growth Report Language (single):** English, Hindi (Devanagari), Hinglish (Hindi in Latin script).
- **Publish Time Slot (single, opens inline as a radio list titled "Choose a posting time"):** "As scheduled - Our
  usual posting time" (default, selected) plus 12 two-hour IST slots, each with a label: 12-2 AM Midnight, 2-4 AM
  Late Night, 4-6 AM Early Morning, 6-8 AM Morning, 8-10 AM Morning, 10 AM-12 PM Forenoon, 12-2 PM Afternoon, 2-4 PM
  Afternoon, 4-6 PM Evening, 6-8 PM Evening, 8-10 PM Night, 10 PM-12 AM Late Night. Moon or sun icon per slot.
- Image: 23_dd_target_age_img_01 (open list example).

### Dhanda filters, sheets and forms (opened and closed without changes, 26 Nov 2026)
- **Home > Marketing Tracker filter** ("Date Filters" popover, radio): This Week (default), This Month, Last 3
  Months, Last 12 Months. **Home > Google's Performance filter:** 30 Days (default), 60 Days, 120 Days.
- **Bell (notifications):** a plain page, empty state "No notifications yet".
- **Growth Action sheet** (tap the pill; it turns into "Growth Action - Tap an action to complete" with an X and the
  page dims): four stacked cards with a coloured left edge, round icon, progress bar and action button: Complete your
  Profile (02/06 done, "Complete now", green), Request Review (0 done, 15 this week, "Request", purple), Upload Media
  (0 done, 5 this week, "Upload", pink), Approve Post (0 done, 5 this week, "Approve", orange).
- **Review Replies filter icon** ("Filter Reviews"): All Reviews (default, tick), 5 Star, 4 Star, 3 Star, 2 Star, 1 Star.
  The Reviews Trend card is a 2-page carousel; page 2 is a "Google Ratings" card (5.0, stars, "Based on 1 ratings").
- **Request Review form:** Phone Number* with a +91 country picker (bottom sheet with search; India, United States,
  United Kingdom, UAE and Australia pinned at the top, then all countries A-Z with flags and dial codes), Name
  (optional), Date of Birth (optional, DD/MM with a calendar icon), and a bottom button "Send using Personal Whatsapp"
  with the WhatsApp logo. The number field auto-focuses and opens the numeric keypad. Back does not close the
  country sheet; tapping the dimmed area does.
- **Help button (header, phone icon):** not tapped, because it may start a phone call.

### Dhanda review settings for 1-2 stars and other review screens
- **Reply Settings, 1-2 Stars tab:** same layout as 3-5 Stars; Reply Length default **Long** for 1-2 star reviews
  (Short for 3-5). The **sample reply is the same positive text** ("Thank you so much for your kind words! ... liked
  our collection ... trendy and comfortable styles"), which does not fit a negative review or a marketing agency:
  the sample is generic and not per-category. Reply Language: English / Hindi chips plus "Search Language", which
  opens a **"Select Language" bottom sheet** listing every ISO language A-Z with its native name (Afar, Abkhaz,
  Avestan, Afrikaans, Akan, Amharic, Aragonese, Arabic, ...), with search and an X. Image 29, 29b.
- **Review Request Log** (Request Review button when no request has been sent yet): "Start Collecting Reviews Now -
  Send your first review request" and one option card "Request from one customer - Enter a number and send manually"
  (phone icon). Image 28c.
- For RevYne: per-rating reply settings are a good idea, but the preview must show a realistic sample for that
  rating and business type, generated from the business, not a fixed retail sample.

### Dhanda viral video templates, full list (read from screen text, 26 Nov 2026)
All shown at 0 rupees with a "Freebie Offer - FREE Till 15th Sept!" tag (Promo Video says 15th Nov), both dates already
past: Promo Video (promotional video), Baseball Hit, Snow Rock Fall, Glass Break, Car Stepney (spare-tyre reveal),
Video Viral Ho Gayi (trending clip), Fire Blast, **Lesson From Jethalal** (a TV-show character moment), Hammer Smash,
Aeroplane Flyby, Basketball Dunk, Whenever I See (relatable reel), Audio Loading (loading beat), Dekho Na Guys (chatty
reel), Zatpat Patpat (quick cuts), Glass Jar Break, Beauty Of Planet Earth, Accidentally Open My Gallery. Most are meme or
stock clips with the business offer at the end. "Lesson From Jethalal" uses a well-known TV character, which raises
rights questions; RevYne should not copy that kind of template.
- Google Post's **"Optimise keywords"** button opens the same Keyword Planner page.

### Dhanda remaining items (checked 27 Nov 2026 on the owner's request)
- **Auto-posting to the real profile:** AI Post > Posted now shows "01 Posts": a Dhanda AI post (stock photo of a
  man with a tablet, caption with six hashtags) marked "Posted - 27 Nov" on **Google**, Instagram and Facebook "not
  posted yet". Nobody approved it: Dhanda's default auto-approval published it to the owner's real Vistrow
  Technologies Google profile. Home's tracker now reads AI Post Published 01. Image 31.
- **Lifetime filter (AI Post > Posted):** This Week, This Month, Last 3 Months, Lifetime (default).
- **Hindi switch** (Complete your profile header): translates that page only (headings, labels, buttons into
  Hindi; business name stays); the button then reads "English". Home stays English, and the page is back in English
  the next time it opens, so the choice is not saved. Image 30.
- **Voice assistant (mic):** tapping turns the button orange with a "Connecting..." label; on this free account it
  dropped back to idle within about 2 seconds without connecting, and the phone logged no recording by Dhanda. The
  microphone permission had already been granted to Dhanda on this phone. Image 32.
- **Help** (header): opens a single card "Talk to Sales - Know about pricing and features" with a phone icon; no
  support, FAQ or ticket option. Not tapped. Image 33.
- **What a customer receives** from a review request: not checked; it needs a real WhatsApp message to a real
  customer number.

### Owner plan: standee with NFC chip (future product, to sell)
The owner plans a physical standee with an NFC chip, sold alongside the app. Evidence from Dhanda: it already has a
standee pairing flow (printed short code, scan or enter code). Notes for RevYne (design ideas, not yet built):
- Each standee gets a unique short code and the NFC chip is written with the same review link
  (`<review base>/r/<code>` or a dedicated `/s/<code>`), so a tap or a scan lands on RevYne's review page.
- Pair a standee to a business in the app by scanning its QR or typing its code (as Dhanda does), with a visible
  scan and tap count per standee.
- Keep RevYne's rules: the link opens the normal review page, the Google button shows for every rating, no
  gating, no incentives.
- Open questions the owner must decide: chip type and supplier, whether tags are locked read-only, who prints and
  ships, price, how a lost or moved standee is unpaired, and whether NFC taps are counted separately from QR scans.

### Google's own photo and video rules (read in full on 26 Nov 2026)
Sources: Google Business Profile Help answers 6103862 (photos and videos), 6123536 (tips for business photos)
and 7213077 (content policy), plus the Maps policy pages it points to, contributionpolicy answers 7400114
(prohibited and restricted content) and 7411351 (tips for posting media). The last two are Maps policy pages
that govern Business Profile media; they are not Business Profile help text themselves.

**Specs** (same on 6103862 and 6123536)
- Photos: JPG or PNG; 10 KB to 5 MB; recommended 720 x 720 px; minimum 250 x 250 px.
- Videos: up to 30 seconds; up to 75 MB; 720p or higher. Video format is not stated.
- Quality: in focus, well lit, no significant alteration, no excessive filters (6123536 adds "or AI");
  must represent reality.
- Media shows on Search and Maps only after the profile is verified. Status: Pending, Not approved or Live;
  going live can take 24 to 48 hours.

**What not to upload** (policy category names, as written)
- Fake and misleading content and behaviour (fake engagement, rating manipulation, impersonation,
  misinformation, misrepresentation); Inappropriate content and behaviour (harassment, hate speech, offensive
  content, personal information, obscenity, sexually explicit or adult-themed content, violence and gore);
  Restricted content; Dangerous content; Child safety; Terrorist content; Off-topic; Advertising and
  solicitation; Unclear and repetitive content; Defacement and mischief.
- Photo-relevant details: no identifiable people without consent; no sales calls to action, prices or deals
  for regulated goods (alcohol, gambling, tobacco, guns, medical, financial and similar), though incidental
  depictions such as a menu are fine; no time-bound promotions, pricing or direct calls to action in listing
  content; no posting the same content repeatedly; no meaningless content.
- Low-quality media may be removed and quality removals cannot be appealed.

**Stock, edits, text, AI, other people's photos** (7411351 unless noted)
- Avoid stock photos; upload media you captured with a camera at the location.
- Avoid screenshots, GIFs, collages, heavily edited images, borders, added text, and imagery made by other
  parties. Superimposed text or graphics must be relevant to the place and not distracting.
- Filters are acceptable only if the image still gives a clear, accurate picture.
- The place should be the main subject; selfies that emphasise a person are discouraged.
- AI: only the "no excessive filters or AI" wording on 6123536 was found; no further AI rule on these pages.
- Logos: no size or overlay rule found; the logo is highlighted once basic info is complete.

**Per-category tips** (6123536): Exterior at least 3, shot from each approach direction and at different times
of day. Interior at least 3, truthful view from a customer's position, capture atmosphere. Product at least 3,
the most popular items, evenly lit. At work at least 3, team providing different services. Food and drink at
least 3, most popular items, evenly lit. Common areas at least 1 each. Rooms at least 3, all room types. Team at
least 3, informal, show personalities. Cover and logo: no category tip beyond "best represents the business".

## RevmeAI (RevmeAI Labs; Play id com.bj1technologies.revmeai.revmeai_mobile)
- 500+ installs; no star rating shown. Product Hunt: "Turn simple Google reviews
  into detailed reviews with AI", launched about May 2026, 0 reviews.
- Login: Continue with Google (account picker). Logout: one tap, no confirm.
- Free plan screens: Home (empty "No Business Found" plus a "Best offer" banner),
  Ai Post (2 of 2 posts left per week, AI topic suggestions, describe-your-post box),
  Edit Business (needs a 10-digit mobile number before anything else),
  Ai Replies (owner types customer name, stars and review text by hand; button
  says "Plan Expired"; tip to reply to only 1 or 2 reviews a day),
  Pricing, Profile (about, order history, contact us by email only, edit website
  subdomain once only, terms, refund policy, five themes, logout).
- Pricing: Free; 249 (1 month, +15 days); 849 (6 months, +30 days); 1,499 (1 year,
  +60 days); franchise 2,299 for 6 months with +2 businesses. Paid plans list
  unlimited QR scans, 5 AI review suggestions, editable keywords, brand name in
  keywords, SEO-friendly replies, multi-language support.
- No Delete account item found in Profile (Google Play requires one).

## Where RevYne stands
- Ahead: reads real reviews live; approve-first for everything published;
  connect-only ownership proof; no sales calls; QR + WhatsApp + review page that
  shows the Google button for every rating; activity log.
- Behind: done-for-you image posts (Dhanda's hook), festival templates, weekly
  suggestions (in progress), nearby competitor comparison and keyword advice,
  per-screen Hindi how-to videos, 10+ Indian languages, billing.
- Do not copy: sales calls, bundled promo-call consent at sign-up, auto-reply
  without approval, five-star imagery in review requests, bonus-days banners.

## Still to see in Dhanda
Dashboard and every tab after sign-in (Google score audit, keywords, competitor
analysis, posts and image templates, review replies, WhatsApp requests, plans
and payment, settings, logout, delete account). Do not enter payment details.
