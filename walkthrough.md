# Girlies Glow Social Media Content Scheduler & Preview Dashboard

## Overview
A purpose-built social media content scheduling workflow and interactive dashboard for Pakistani e-commerce beauty brand **Girlies Glow**, featuring 10 multi-format posts scheduled across Instagram (`@girli_esglow`) and the official **Girlies Glow Facebook Business Page** (Page ID `61592791861631`).

---

## Brand Standards Enforced
- **Hero Product**: Eco-Friendly Wheat-Straw Curved Facial Razor for facial shaving / dermaplaning.
- **Physical Razor Integrity**: Cream / off-white razor body with natural beige/brown wheat-straw speckles, cream blade housing, silver stainless-steel micro-guard blade. Never recolored purple (purple reserved for Girlies Glow branding/backgrounds only).
- **Price & Payment**: Rs. 599 with **Cash on Delivery (COD)** explicitly stated across Pakistan.
- **Strict Destination Rule**: Scheduling or cross-posting to Sannaya Mughal's personal Facebook profile is strictly prevented. Any attempt triggers an immediate hard block:
  > 🛑 **"Facebook destination is personal profile. Select Girlies Glow Facebook Page."**
- **Schedule Timezone**: Pakistan Standard Time (PKT / UTC+5), daily Sep 29 – Oct 8, 2026 during high-engagement evening windows.

---

## 10-Post Content Schedule & Registry

| Post # | Format | Angle / Title | Scheduled Date | Scheduled Time (PKT) | Status |
| :---: | :---: | :--- | :---: | :---: | :---: |
| **Post 1** | Static (4:5) | Myth Buster: Hair Doesn't Grow Back Thicker | Sep 29, 2026 | 8:00 PM | Draft / Approved |
| **Post 2** | Reel (9:16) | Product in Action: Close-Up Dermaplaning Demo | Sep 30, 2026 | 7:30 PM | Draft / Approved |
| **Post 3** | Carousel (4:5) | Makeup Benefits: Why Isn't My Base Sitting Smooth? (4 slides) | Oct 01, 2026 | 6:30 PM | Draft / Approved |
| **Post 4** | Static (4:5) | Salon vs Home: "Parlour jaane ka mood nahi?" | Oct 02, 2026 | 8:15 PM | Draft / Approved |
| **Post 5** | Reel (9:16) | Relatable UGC: "Mujhe bhi lagta tha shave karungi toh..." | Oct 03, 2026 | 7:45 PM | Draft / Approved |
| **Post 6** | Static (4:5) | Product Benefits: "Small razor. Big glow energy. ✨" | Oct 04, 2026 | 5:30 PM | Draft / Approved |
| **Post 7** | Reel (9:16) | GRWM Transformation: "Peach fuzz has to go 👀" | Oct 05, 2026 | 8:00 PM | Draft / Approved |
| **Post 8** | Carousel (4:5) | How to Use: 4-Step Beginner Routine (5 slides) | Oct 06, 2026 | 7:00 PM | Draft / Approved |
| **Post 9** | Creator UGC (4:5) | Creator Review: "I was SO scared my facial hair would come back thicker 😭" | Oct 07, 2026 | 7:30 PM | Draft / Approved |
| **Post 10** | Static (4:5) | Conversion / Offer: "Ready to ditch the peach fuzz? ✨" | Oct 08, 2026 | 8:30 PM | Draft / Approved |

---

## Interactive Dashboard Features
1. **Visual Grid View**: 10 post cards displaying authentic high-resolution creatives:
   - 4:5 image viewer for static feed posts.
   - 9:16 video/GIF demonstration player for Reels.
   - Multi-slide swipeable slider for Carousels (with `<` and `>` buttons and slide dots).
2. **Dual Platform Preview**: Toggle between Instagram (`@girli_esglow`) and Facebook Business Page formatting.
3. **Action Suite on Every Card**:
   - `EDIT`: Opens an interactive modal to modify captions, hashtags, dates, times, and destinations.
   - `APPROVE`: Toggles approval state for the post.
   - `REGENERATE MEDIA`: Re-renders the post creative with custom branding overlays.
   - `SCHEDULE`: Validates destination safety. Blocks personal profiles and schedules to the verified page.
4. **Global Controls**:
   - `APPROVE ALL`: One-click approval for all 10 posts.
   - `SCHEDULE ALL`: Validates all posts against destination rules and schedules them.
   - View switchers: **Visual Grid**, **Scheduler Table**, and **Calendar Timeline**.
   - Export: Download the complete schedule as **CSV** or **JSON**.
5. **Guardrail Simulation in Edit Modal**: You can select the test option *"Sannaya Mughal personal Facebook profile"* in any post's edit modal and click **Schedule** to observe the security guardrail in action!

---

## How to Launch the Dashboard

Run the server with:
```bash
npm start
```
Then open your browser to:
[http://localhost:3000](http://localhost:3000)

To run the complete automated test suite:
```bash
npm test
```
All 39 unit, creative, validator, server, and end-to-end workflow tests pass with 100% coverage.
