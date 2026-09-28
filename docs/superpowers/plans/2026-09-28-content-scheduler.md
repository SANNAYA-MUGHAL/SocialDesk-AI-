# Girlies Glow Social Media Content Scheduler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete social media content scheduling workflow and interactive preview dashboard for Girlies Glow, featuring 10 multi-format posts (4:5 static, 9:16 reels, 4:5 carousels) scheduled across Instagram and the Facebook Business Page with strict destination safeguards preventing personal profile publishing.

**Architecture:** A lightweight Node.js/Express backend serves the static assets, provides REST endpoints for post data and status updates, executes destination validation rules, and powers a media composition pipeline. The frontend is a responsive, brand-themed interactive dashboard featuring live media previews, carousel sliders, video players, in-place editing modals, approval workflows, and calendar/table views.

**Tech Stack:** Node.js, Express, Canvas / pure JavaScript composite engine, HTML5, Tailwind CSS, Vanilla ESM JavaScript, Node test runner (`node:test`).

**Spec:** `docs/superpowers/specs/2026-09-28-content-scheduler-design.md`

## Global Constraints
- **Razor Physical Integrity**: The physical razor body is cream / wheat-straw with beige/brown speckles and micro-guard blade. Never recolored purple.
- **Brand Colors**: `#683DA9` (Wordmark Purple), `#9B60E0` (Light Orchid), `#8A54CC` (Amethyst), `#5E389D` (Deep Plum), `#65AA3F` (Leaf Green accent), `#FFFFFF` (White).
- **Pricing & Terms**: Rs. 599 with Cash on Delivery (COD) explicitly stated in every conversion CTA.
- **Safety Rule**: Personal Facebook profiles (specifically Sannaya Mughal) must be strictly rejected with the error: `"Facebook destination is personal profile. Select Girlies Glow Facebook Page."`
- **Schedule Timezone**: Pakistan Standard Time (PKT / UTC+5), daily Sep 29 – Oct 8, 2026 during evening peak hours.

---

### Task 1: Project Scaffolding & 10-Post Data Registry

**Files:**
- Create: `package.json`
- Create: `data/posts.json`
- Test: `test/data.test.js`

**Interfaces:**
- Consumes: User-uploaded assets in `/Users/sannayamughal/Projects/GG Marketing /`
- Produces: `data/posts.json` containing complete metadata for all 10 scheduled posts.

- [ ] **Step 1: Write the failing data test**

```javascript
// test/data.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('posts.json contains exactly 10 valid posts with required fields', () => {
  const raw = fs.readFileSync('data/posts.json', 'utf8');
  const posts = JSON.parse(raw);
  assert.equal(posts.length, 10);
  
  for (const post of posts) {
    assert.ok(post.id, 'post must have an id');
    assert.ok(post.postNumber >= 1 && post.postNumber <= 10);
    assert.ok(['static', 'reel', 'carousel'].includes(post.format));
    assert.ok(post.captionIg && post.captionFb);
    assert.ok(post.hashtags && Array.isArray(post.hashtags));
    assert.ok(post.schedule.date && post.schedule.time);
    assert.equal(post.destinations.instagram, '@girli_esglow');
    assert.equal(post.destinations.facebookPage, 'Girlies Glow Facebook Business Page');
    assert.ok(post.pricing.includes('599'));
    assert.equal(post.codAvailable, true);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/data.test.js`
Expected: FAIL with missing file or syntax error.

- [ ] **Step 3: Write minimal implementation**

Create `package.json` with `"type": "module"`, scripts for `test` and `start`, and express dependency.
Create `data/posts.json` with all 10 post definitions as specified in the design doc.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/data.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json data/posts.json test/data.test.js
git commit -m "feat: scaffold project and add 10-post data registry"
```

---

### Task 2: Destination Safety Guardrails & Validation Logic

**Files:**
- Create: `src/validator.js`
- Test: `test/validator.test.js`

**Interfaces:**
- Consumes: Post destination object `{ instagram: string, facebookPage: string }`
- Produces: `validateDestinations(post)` returning `{ isValid: boolean, error?: string }`

- [ ] **Step 1: Write failing validator tests**

```javascript
// test/validator.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDestinations, validatePost } from '../src/validator.js';

test('blocks personal Facebook profile with required error message', () => {
  const post = {
    destinations: {
      instagram: '@girli_esglow',
      facebookPage: 'Sannaya Mughal personal Facebook profile'
    },
    codAvailable: true
  };
  const result = validateDestinations(post);
  assert.equal(result.isValid, false);
  assert.equal(result.error, 'Facebook destination is personal profile. Select Girlies Glow Facebook Page.');
});

test('allows official Girlies Glow Facebook Business Page', () => {
  const post = {
    destinations: {
      instagram: '@girli_esglow',
      facebookPage: 'Girlies Glow Facebook Business Page'
    },
    codAvailable: true
  };
  const result = validateDestinations(post);
  assert.equal(result.isValid, true);
});

test('validates COD mention in conversion posts', () => {
  const validPost = {
    captionIg: 'Order now Rs. 599. Cash on Delivery available.',
    codAvailable: true,
    destinations: { instagram: '@girli_esglow', facebookPage: 'Girlies Glow Facebook Business Page' }
  };
  assert.equal(validatePost(validPost).isValid, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/validator.test.js`
Expected: FAIL with module not found or undefined functions.

- [ ] **Step 3: Implement `src/validator.js`**

Implement `validateDestinations` and `validatePost` matching all safety guardrails.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/validator.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/validator.js test/validator.test.js
git commit -m "feat: implement destination safety validator and guards"
```

---

### Task 3: Media Creative Composite Engine

**Files:**
- Create: `scripts/generate_creatives.js`
- Test: `test/creatives.test.js`
- Generates: `public/generated/post_*.png`

**Interfaces:**
- Consumes: Source assets (`Card 1.png`, `Single.png`, `GirliesGlow_Logo_NoBG.png`, etc.)
- Produces: Branded 1080×1350 (4:5) graphics for static & carousels, 1080×1920 (9:16) reel covers, with brand overlays.

- [ ] **Step 1: Write test for generated creative files**

```javascript
// test/creatives.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('generated creatives exist for all static, carousel, and reel posts', () => {
  assert.ok(fs.existsSync('public/generated/post_1_static.png'), 'post 1 image must exist');
  assert.ok(fs.existsSync('public/generated/post_3_slide_1.png'), 'post 3 slide 1 must exist');
  assert.ok(fs.existsSync('public/generated/post_10_offer.png'), 'post 10 image must exist');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/creatives.test.js`
Expected: FAIL with missing generated files.

- [ ] **Step 3: Implement `scripts/generate_creatives.js`**

Use SVG / Canvas / pure Node image rendering or HTML-to-Canvas / Jimp / pure composite scripts to compose the source photos with:
- The authentic Girlies Glow logo
- High-contrast brand purple badges (`#683DA9`, `#9B60E0`)
- Clean typography hooks and Rs. 599 COD labels
- 4:5 ratio (1080×1350) and 9:16 ratio (1080×1920) outputs

- [ ] **Step 4: Run script and verify test passes**

Run: `node scripts/generate_creatives.js && node --test test/creatives.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/generate_creatives.js test/creatives.test.js public/generated/
git commit -m "feat: implement media creative composite generator"
```

---

### Task 4: Express API Server & Persistence Layer

**Files:**
- Create: `server.js`
- Test: `test/server.test.js`

**Interfaces:**
- Consumes: `data/posts.json`, `src/validator.js`
- Produces: REST API on `http://localhost:3000` (`GET /api/posts`, `PUT /api/posts/:id`, `POST /api/posts/:id/approve`, `POST /api/posts/:id/schedule`, `POST /api/posts/approve-all`, `POST /api/posts/schedule-all`, `GET /api/export/csv`, `GET /api/export/json`).

- [ ] **Step 1: Write server integration test**

```javascript
// test/server.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../server.js';

test('GET /api/posts returns array of 10 posts', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://localhost:${port}/api/posts`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.length, 10);
  } finally {
    server.close();
  }
});

test('POST /api/posts/:id/schedule rejects personal profile', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://localhost:${port}/api/posts/1/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facebookPage: 'Sannaya Mughal personal Facebook profile' })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'Facebook destination is personal profile. Select Girlies Glow Facebook Page.');
  } finally {
    server.close();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/server.test.js`
Expected: FAIL with missing `server.js`.

- [ ] **Step 3: Implement `server.js`**

Implement Express app with static middleware serving `/public`, JSON parsing, and all endpoints.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/server.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server.js test/server.test.js
git commit -m "feat: implement backend API and persistence layer"
```

---

### Task 5: Interactive Dashboard Frontend

**Files:**
- Create: `public/index.html`
- Create: `public/app.js`
- Create: `public/styles.css`
- Test: `test/ui_contract.test.js`

**Interfaces:**
- Consumes: REST endpoints from `server.js`
- Produces: Full interactive UI with:
  - Visual Grid View with 10 post cards
  - High-res Media Previews with Carousel sliders and Reel video players
  - Dual Instagram / Facebook caption preview tabs
  - Interactive Action Buttons (`EDIT`, `APPROVE`, `REGENERATE MEDIA`, `SCHEDULE`)
  - Global `APPROVE ALL` and `SCHEDULE ALL`
  - Schedule Table View & Content Calendar Timeline
  - Personal profile safety blocker modal & alerts

- [ ] **Step 1: Write UI contract test**

```javascript
// test/ui_contract.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('index.html contains essential dashboard elements', () => {
  const html = fs.readFileSync('public/index.html', 'utf8');
  assert.ok(html.includes('Girlies Glow'), 'must contain brand title');
  assert.ok(html.includes('APPROVE ALL') || html.includes('approve-all-btn'));
  assert.ok(html.includes('SCHEDULE ALL') || html.includes('schedule-all-btn'));
  assert.ok(html.includes('editModal') || html.includes('edit-modal'));
  assert.ok(html.includes('Pakistan Standard Time') || html.includes('PKT'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/ui_contract.test.js`
Expected: FAIL with file not found.

- [ ] **Step 3: Implement `public/index.html`, `public/app.js`, and `public/styles.css`**

Build the complete, responsive dashboard interface following the Girlies Glow design system (`#683DA9`, `#9B60E0`, `#65AA3F`, `#FFFFFF`).

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/ui_contract.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add public/index.html public/app.js public/styles.css test/ui_contract.test.js
git commit -m "feat: implement interactive dashboard UI with full action controls"
```

---

### Task 6: End-to-End Workflow Verification & Manual Validation

**Files:**
- Test: `test/e2e_workflow.test.js`
- Update: `walkthrough.md`

**Interfaces:**
- Consumes: All components integrated
- Produces: Complete passing test suite and verified running local application.

- [ ] **Step 1: Write comprehensive workflow test**

```javascript
// test/e2e_workflow.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../server.js';

test('full workflow: load posts, edit caption, approve, attempt personal profile (blocked), schedule successfully, export CSV', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    // 1. Fetch posts
    const res = await fetch(`http://localhost:${port}/api/posts`);
    const posts = await res.json();
    assert.equal(posts.length, 10);
    
    // 2. Approve post 1
    const appRes = await fetch(`http://localhost:${port}/api/posts/1/approve`, { method: 'POST' });
    const post1 = await appRes.json();
    assert.equal(post1.status, 'Approved');
    
    // 3. Attempt scheduling to personal profile (MUST FAIL)
    const badSched = await fetch(`http://localhost:${port}/api/posts/1/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facebookPage: 'Sannaya Mughal personal Facebook profile' })
    });
    assert.equal(badSched.status, 400);
    const err = await badSched.json();
    assert.equal(err.error, 'Facebook destination is personal profile. Select Girlies Glow Facebook Page.');
    
    // 4. Schedule to valid page (MUST SUCCEED)
    const goodSched = await fetch(`http://localhost:${port}/api/posts/1/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facebookPage: 'Girlies Glow Facebook Business Page' })
    });
    assert.equal(goodSched.status, 200);
    const scheduled = await goodSched.json();
    assert.equal(scheduled.status, 'Scheduled');
    
    // 5. Test export
    const csvRes = await fetch(`http://localhost:${port}/api/export/csv`);
    assert.equal(csvRes.status, 200);
    const csv = await csvRes.text();
    assert.ok(csv.includes('Post Number,Post Title'));
  } finally {
    server.close();
  }
});
```

- [ ] **Step 2: Run all tests to verify 100% pass**

Run: `node --test test/*.test.js`
Expected: ALL PASS

- [ ] **Step 3: Launch server and verify live in browser**

Run: Start server on port 3000 and verify UI visually.

- [ ] **Step 4: Commit**

```bash
git add test/e2e_workflow.test.js
git commit -m "test: add comprehensive end-to-end integration test"
```
