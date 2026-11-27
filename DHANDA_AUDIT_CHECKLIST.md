# Dhanda audit checklist

Hard rule: an item is ticked only after its saved result was checked by eye (screenshot opened,
number and email blacked out, notes written to `COMPETITOR_STUDY.md`). "Seen" means the
behaviour is written up; "Image" means redacted design screenshots are saved in
`Revyen-tools/dhanda-spec/`; "Measured" means sizes, font sizes and colours were recorded.
Last updated: 26 Nov 2026.

Legend: [x] done and verified, [ ] not done, [~] partly done (the note says what is missing), [-] dropped by the owner.

## A. Before sign-in
- [x] Intro carousel, 3 slides (seen; images in `shots/dhanda/00-07`)
- [x] Phone + OTP sign-in screen, promo consent line (seen)
- [x] Onboarding steps 1-4: business name, top item with chips, city, pick business (seen; images 10-20)
- [x] Google consent screens (seen; images deleted on purpose because they show the email)
- [x] Four pitch screens after sign-in: keywords, score 9%, keyword replies, auto replies (seen; images 24-27)
- [x] Notification permission prompt (seen)

## B. Main tabs
- [x] Home: seen, image (01_home_img_01-07); measured (CLONE_SPEC 2.4)
- [x] Review Replies: seen, image (03_review_replies_img); measured (CLONE_SPEC 2.4)
- [x] Review reply settings: seen, image (03b, 29 for 1-2 Stars, 29b language sheet); measured (CLONE_SPEC 2.4)
- [x] AI Post list and filters: seen, image (04_ai_post, 04a, 04b); measured (CLONE_SPEC 2.4)
- [x] Post detail (approve/reject): seen, image (04f, 04j); measured (CLONE_SPEC 2.4)
- [x] Viral video templates and preview: seen, image (04g, 04h, 04i); measured (CLONE_SPEC 2.4)
- [x] Google Post: seen, image (05); "Optimise keywords" opens Keyword Planner (verified)
- [x] Google Media: seen, image (06, 06b explainer, upload sheet and "What to upload" cards; checked clean)

## C. Side menu and pages
- [x] Side menu: seen, image (02_drawer_img_01)
- [x] Report, Growth Action tab: seen, image (14, 14b); measured (CLONE_SPEC 2.4)
- [x] Report, Performance tab: seen, image (14c_report_performance_img_01-05): Growth in Score (weekly Marketing Score, "first point lands next week"), Views (6-month line + insight banner), Engagement, Leads, Calls, Direction Requests, Views v/s Engagements Conversion; data "pulled from your Google Business profile once a day"; header Download button
- [x] My Plan: seen, image (21_my_plan_img_01; 21b_billing_details_img_01: VAT/GSTIN, Billing Address, "same as billing" checkbox, Shipping Address, Save; nothing entered or saved)
- [x] Plan comparison table: seen, image (12_plan_compare_img_01), table written in study
- [x] Settings page: seen, image (15_settings_img_01-03; number and Google email blacked out and checked). Legal also has "Refund Request"; footer "Dhanda AI · #68b6"
- [x] Preference: seen, image (22_preference_img_01-04, poster phone blacked out; 22b_business_details_img_01-06), all sections incl. Business Details and Hashtags & Automation; website builder card noted
- [x] Manage Google Profile: seen, image and measured (10_mgp_01-04)
- [x] Social Connect Guide + Facebook + Instagram help: seen, image (13, 13b, 13c)

## D. Settings tools
- [x] Keyword Planner: seen, image (16_keyword_planner_img_01-02): Added Keywords list (7, with city and a volume number, remove X), Keyword Search form (Country, Locality/City, Keyword, Search), Search Results; credits counter appears after a search
- [x] Google Review QR: seen, image (17 My QRs, 17b Suggestions/Assisted Review, 17c review location panel)
- [x] Configure QR Standee: seen, image (18_qr_standee_enter_code_img_01: Enter standee code dialog). The live camera view is deliberately not saved
- [x] Change Profile: seen, image (19_change_profile_img_01, email blacked out): connected Google email with business count, business card (#68b6), floating Hindi how-to video, "Connect with Google - Use Google to add more emails", trust badges (connects to Google Business only, can't read your emails, 100% safe and secure, disconnect anytime). Connect not tapped
- [x] Analytics & Personalisation toggle: seen and written up; left unchanged on purpose

- [x] Refund Request: seen, image (20_refund_request_img_01, 20b_refund_1year_img_01-03, 20c_refund_3year_img_01, 20d_refund_monthly_img_01-02); terms written in study
- [x] Delete Account screen: seen (reached by accident, nothing tapped); text written in study; no image kept

- [x] Preference dropdowns: all opened and read, closed without saving (Founder Gender, Target Gender, Target Age Group, Target Region, Model Ethnicity [locked until region], Audience, CTA, Report Language, Publish Time Slot); options written in study

- [x] Home filters (Marketing Tracker, Google's Performance) and Review Replies filter + trend carousel page 2: seen, images (24, 27, 27b)

- [x] AI Post "Lifetime" dropdown: This Week, This Month, Last 3 Months, Lifetime (image 31)
- [x] Full list of 18 viral video templates: read from screen text, written in study

## E. Other surfaces
- [x] Growth Action checklist sheet: seen, image (26_growth_action_sheet_img_01)
- [x] Complete your profile: seen, image and measured (07_complete_profile_01-02)
- [x] Request Review form: seen, image (28_request_review_form_img_01, 28b_country_picker_img_01); nothing entered or sent
- [x] Notifications (bell): seen, image (25_notifications_img_01): empty state
- [x] Help button: opens one "Talk to Sales" card (image 33); not tapped
- [x] Voice assistant (mic): "Connecting..." then idle within ~2 s on the free account; no recording logged (image 32)
- [x] Hindi language switch: page-only translation, not saved (image 30)
- [ ] Customer side of a review request: not seen (would need sending a real WhatsApp request). Needs owner's OK

## F. Motion and behaviour
- [-] Side menu open/close animation (needs the owner's screen recording; adb recording is blocked on this phone) — dropped 27 Nov: owner wants RevYne's own motion, not a copy
- [-] Tab switch animation — dropped 27 Nov: owner wants RevYne's own motion, not a copy
- [-] Button press feedback — dropped 27 Nov: owner wants RevYne's own motion, not a copy
- [-] Accordion expand/collapse (Preference) — dropped 27 Nov: owner wants RevYne's own motion, not a copy
- [-] Bottom sheet open/close (Growth Action, upload explainer) — dropped 27 Nov: owner wants RevYne's own motion, not a copy
- [-] Page push/back transition — dropped 27 Nov: owner wants RevYne's own motion, not a copy

## G. Deliverables
- [x] `COMPETITOR_STUDY.md` written and kept current
- [x] Animator scale restored to 1 on the phone (verified with `settings get`)
- [x] Measurements for image-only screens: `CLONE_SPEC.md` 2.4, from on-device text recognition of the saved images, calibrated against measured Manage Google Profile (within about 2 sp)
- [x] Clone spec written: `CLONE_SPEC.md` (tokens with sampled colours, 20 components, nav map, screens, flows, desktop layout, build order). Values tagged Measured/Sampled/Estimated/Observed/Unknown; colours re-sampled along rows from saved images (verified)
- [~] Desktop browser layout: target written in `CLONE_SPEC.md` section 8; building it belongs to the desktop session (`DESKTOP_CHECKLIST.md`)
- [x] Final privacy sweep (27 Nov): all 181 images in `dhanda-spec/` and `shots/` read with on-device text recognition, at normal size and 3x zoom; 6 leaks found (number on two posters and the profile, two Gmail addresses, number in poster preview), blacked out, re-scanned clean, posters also checked by eye. Only remaining email is RevmeAI's public support address
