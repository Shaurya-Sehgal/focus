# Development checklist

## Decisions made in milestone 1

- **Stack:** React + TypeScript + Vite, plain CSS split into tokens, base, shared layout and homepage files. Only runtime dependencies: React and the Archivo font (bundled locally, so no requests go to Google or any other server).
- **Palette:** white `#ffffff`, dark navy `#0e1a3d`, clear blue `#1f5eff` (5.1:1 contrast on white), pale blue `#eef2fd` for bands, slate `#4a5575` for secondary text.
- **Lemon accent:** proposed, not used. Suggested value `#f2e14c`, for one small highlight only, such as the "Registration isn't open yet" panel or the challenge-week strip. It needs approval because it isn't an existing brand colour.
- **Type:** Archivo (variable, SIL Open Font License), heavy weights for headlines and regular for body text. Chosen because its heavy weights sit close to the logo's bold sans-serif.
- **Logo:** cropped from `focusLogo.JPG` with the original motion blur and proportions kept (360×124 px, ratio 2.90), then recoloured navy for light backgrounds and white for the footer.
- **Hero (milestone 1.1):** dark navy hero (`--night #081230`) and header, white logo, and a ribbon of blue/cyan light drawn on a `<canvas>` (now part of `src/components/PageRibbon.tsx`, see 1.5). No new dependency: a 3D library would add around 150 KB for an effect 2D drawing handles. The strands start scattered and soft (the logo's motion blur) and gather into one tight band just above the habit choices.
- **Hero choices:** "Studying" and "Before bed" are native radio buttons (Tab to reach them, arrow keys to switch). Studying: a bright beam rising to the top right. Before bed: slower, deeper blue light drifting down into a soft, level band. The card below shows the matching campaign habit and announces changes to screen readers.
- **Motion limits:** slow movement, about 1.3 s to settle into a new shape, and a small pointer response on desktop only. Phones get fewer strands at 30 fps. The animation stops whenever the hero is off screen or the tab is hidden. A "Pause animation" button freezes it. With reduced motion on, the hero draws one still frame and hides the pause button. Light cyan `--cyan #4fd1ff` is used only for the light and focus rings on dark.
- **Research section:** each finding's claim and source link stay visible. "How it was studied and its limits" is a native `<details>` element holding the method and the "Keep in mind" qualifications.
- **Hero cursor (1.2):** on desktop, strands within about 150 px of the pointer bend toward it. The bend follows quickly and eases back over about half a second when the pointer leaves. Pause and reduced motion turn it off.
- **Research (1.2):** topic list on the left (Sleep, Close to home, Attention and school) and one large evidence panel on the right: claim, who and how, keep in mind, and source links. It's a keyboard tab list (arrow keys, Home and End).
- **Habits (1.2):** a dark band with the same Studying / Before bed choice as the hero (the two stay in step), and a poster-style panel: the habit in large type with the hero's light behind it, rising for studying and low and calm before bed. The earlier small drawn scenes were removed because they looked generic. **The Studying and Sleep posters should replace this panel's background once supplied.**
- **Challenge (1.2):** labelled "Preview". Three numbered steps (Record your usual week, Try one habit, Reflect and compare) work as a keyboard tab list with a "Next" button. A calendar illustration lights the relevant week and shows a Compare bracket in step 3. It holds no data and records nothing. Proposed rules and the closed registration notice are unchanged below it.
- **Chapter nav (1.3):** each row is a fixed 20 px marker column, a 10 px gap, then the label. The active marker grows within its own column only. Checked at 1536 and 1920 px for all four sections.
- **Calendar (1.3):** no per-day dots or legend. Each week has one line saying what happens that week. Squares are slimmer, with 1.5 px borders and 6 px corners. The active week shows as a navy outline (baseline) or solid blue (challenge week), and the inactive week stays readable in slate. Shows dates only, no progress or results.
- **Ribbon (1.5):** the whole ribbon, hero included, is drawn by `src/components/PageRibbon.tsx` on one canvas, so every strand is a single unbroken line.
  - *Seam fix:* the earlier split at the hero edge came from two canvases clipped at the same line, two different pointer models, and an easing lag at the join. All three are gone.
  - *Narrow transition:* strands gather in the lowest quarter of the hero. Each strand's own continuation is blended into its place on the route (smootherstep), so there are no hooks or corners.
  - *Pointer:* one smooth, capped field moves nearby strands together, using the band's middle as reference.
  - *Scrolling:* the canvas scrolls with the page (it sits in a page-height layer) and is repositioned when it redraws, so the light never lags or jumps while scrolling.
  - *Moments (1.6):* both habits are variations of one band. They share the lower-left gathering and the route down the page. Switching changes only the right-hand sweep, the width, the speed and the colour.
  - Hero sets the shape and pause state through `setMotion` in `src/ribbon/core.ts`.
- **Habits artwork (v4, glass pass):**
  - *Panel:* the thick blue double frame is gone. The artwork is the panel: 5:4, one fine edge, a faint top-edge reflection, a soft shadow and a broad sheen. A smaller translucent caption surface (navy at 55%, 16 px backdrop blur, faint cyan corner) overlaps its lower left on desktop and its lower edge on phones. Without backdrop-filter the caption turns 88% opaque.
  - *Heading:* one habit name at about 1.6 rem (was a poster-sized 3.25 rem). Both captions share one grid cell, so switching habits changes the layout by 0 px.
  - *Motion (1.6):* tilt up to 5.5° (sideways) and 4.5° (up and down) with a 6 px lift. A response curve gives about 70% of the tilt half-way across the panel. The scene turns 1.6° and 1.0° against the panel, and the caption shifts up to 7 px and 5 px, so the layers read as depth. The sheen moves further and brightens a little with the angle. Everything follows one 0.16 s easing and returns with no overshoot. Touch and reduced motion: no tilt, a still sheen.
  - *Desktop layout:* the artwork column is wider (copy 0.8fr, artwork 1.4fr).
- **Habit scenes (Blender):**
  - *Sources:* `concepts/habits-study/v3` and `concepts/habits-bedtime/v2`, rebuilt from v2 and v1 (both kept unchanged) by `concepts/tools/study_v3.py` and `bedtime_v2.py`. Both are framed for 5:4.
  - *Study v3:* thicker cover in a deeper blue, darker desk with a warm pool of key light (so the glass caption has light and dark to show through).
  - *Bedtime v2:* lower camera, so the bulb isn't seen through the shade. Rebuilt pillow (outward normals, one clean seam, its own grid UVs). Bedding 5 cm thick with a quieter weave. Thicker shade, dimmer bulb, softer lamp light.
  - *Web export:* `concepts/tools/bake_export.py` renders the still (1600 × 1280 and 800 × 640 WebP), bakes lighting atlases, bakes a phone contact-shadow decal (light with phone ÷ without), and exports a meshopt GLB. It writes a separate `-baked.blend`.
  - *Finding:* the earlier softness and seams came from the bake, not the modelling. Half-intensity linear bakes clipped the paper and left few 8-bit levels for the navy. Automatic unwrapping cut the pillow's rim into stair-stepped islands. Bakes now store display colours (AgX applied in Blender), and three.js shows them without tone mapping. Only the moving phone is tone mapped, so the live scene matches the still.
- **Light sections:** shared surface tokens in `tokens.css` (`--edge`, `--lift`, `--surface-light`). The evidence panel and calendar box get a fine edge, a top reflection and a soft shadow. The topic list is light glass over the ribbon. The "Registration isn't open yet" notice gets the caption's dark finish. The calendar's day and week styling and the chapter nav are unchanged.
- **Ribbon habit switch (1.6):**
  - *Cause of the snap:* the hero-to-page join existed only while the band still crossed the gathering line and the blend was under halfway. Before bed came in from above and used a separate route, so mid-switch the lower tail and the join vanished or reappeared in one frame. The page route then restarted as a separate stub.
  - *Other contributors:* the shape eased exponentially, starting at full speed and then crawling for about 1.3 s, between two opposite shapes. The habit card also changed height with its text, which moved the gathering point by 8 px. On phones the hero re-measured and jumped at once.
  - *Fix:* one route, and the join is always computed. Every shape property follows one critically damped spring (`OMEGA` 6.3 in `src/ribbon/core.ts`): it starts from rest, takes about 0.75 s, never overshoots, and keeps its velocity when you switch again mid-way. Strand order is held through the join. The habit card keeps the height of the longer habit. Pausing freezes the current frame. Choosing a habit while paused or with reduced motion shows the finished shape.
  - *Shape:* narrower scatter (0.26–0.3 S instead of 0.6–0.75), long in-phase strand waves (no loops), a defined core instead of a single-pixel white line, a peak colour below white, and a partial fade (55%) behind hero text.
  - *Measured* in headless Edge with a frame-difference probe: before the fix, the lower tail visibly disappeared between frames. After it, no frame changes more than 1.8× its neighbours at 1440, 1024 and 390 px. That holds with the pointer on or off the band, under rapid re-switching, pausing mid-way, near the hero's lower edge, and on pointer exit and re-entry.
- **Dev server:** `vite.config.ts` checks for file changes by polling, because OneDrive sometimes drops file-change events, which left the preview showing stale CSS.
- **Navigation:** the header links jump to homepage sections until the separate Learn, Challenge, Resources and About pages exist. "Explore the challenge" currently goes to `#challenge`.

## Research used on the homepage (verified by reading the source)

| Claim on site | Source | Status |
| --- | --- | --- |
| Intense/problematic social-media use linked with higher odds of poor sleep, Grades 6–10, Canada | Lafontaine-Poissant et al. 2024, HPCDP | Verified (cross-sectional, 2018 data) |
| Most Halton Grade 7 and Grade 10 students reported more screen time and less sleep than guidelines | Our Kids Network 2024 | Verified on the web page; full PDF not read |
| Heavier short-video use linked with weaker attention/self-control (48 adults) | Yan et al. 2024, Frontiers | Abstract verified |
| Heavier short-video use linked with lower grades (1,052 elementary students, Shenzhen) | Gong & Tao 2024, PLOS ONE | Abstract verified |

**Numbers awaiting your approval** (not on the site yet): Halton 2023, with 73% of Grade 7 and 83% of Grade 10 students over the screen-time guideline, and 65% and 71% getting less sleep than recommended. The source page doesn't explain how the two sets of figures relate, so check the full PDF before using them.

**Sources not yet verified** (pages wouldn't load for automated reading): the CAMH OSDUHS 2025 summary PDF, BMC Psychology `10.1186/s40359-024-01865-9`, Heliyon `10.1016/j.heliyon.2024.e30346` and PubMed `37167877`. Ontario screen-time figures should come from the OSDUHS PDF once someone reads it.

## Needed before the next pages

- [ ] Design feedback on this homepage (palette, type, hero animation, section order).
- [ ] Decision on the lemon accent.
- [ ] Final poster files (Studying and Sleep go into the Habits panel first): Attention, Studying, Sleep, and Your Time. Your Choice. (high-resolution PDF/PNG), plus credits for any photographs in them.
- [ ] A vector (SVG) or high-resolution version of the logo, if one exists. The current one is cut from a 720 px JPG.
- [ ] Approval for any statistics before adding them.
- [ ] Challenge eligibility, final rules, consent process, data handling and any prizes (all currently "to be confirmed").
- [ ] Hosting choice, so the Privacy note can describe the real arrangement.
- [ ] Whether the existing survey (owned by a teammate) should be linked anywhere. It has not been touched.

## Not built, on purpose

Accounts, registration form, waitlist, participant database, leaderboard, prize entries, screen-time tracking, analytics, app downloads, partner logos.
