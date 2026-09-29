import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('index.html contains essential dashboard elements', () => {
  const html = fs.readFileSync('public/index.html', 'utf8');
  assert.ok(html.includes('Girlies Glow'), 'must contain brand title');
  assert.ok(html.includes('APPROVE ALL') || html.includes('approve-all-btn'), 'must contain approve all button');
  assert.ok(html.includes('SCHEDULE ALL') || html.includes('schedule-all-btn'), 'must contain schedule all button');
  assert.ok(html.includes('editModal') || html.includes('edit-modal'), 'must contain edit modal');
  assert.ok(html.includes('Pakistan Standard Time') || html.includes('PKT'), 'must specify PKT timezone');
  assert.ok(html.includes('@girli_esglow'), 'must display Instagram handle');
  assert.ok(html.includes('Girlies Glow Facebook Business Page') || html.includes('61592791861631'), 'must display verified Facebook Business Page');
});

test('app.js openEditModal and action handlers handle numeric and string IDs properly', async () => {
  const vm = await import('node:vm');
  const rawPosts = JSON.parse(fs.readFileSync('data/posts.json', 'utf8'));
  const code = fs.readFileSync('public/app.js', 'utf8');

  let modalDisplayed = false;
  let modalTitle = '';

  const context = {
    posts: rawPosts,
    document: {
      addEventListener: () => {},
      getElementById: (id) => {
        if (id === 'edit-modal') {
          return {
            style: {
              set display(val) { modalDisplayed = (val === 'flex'); },
              get display() { return modalDisplayed ? 'flex' : 'none'; }
            }
          };
        }
        if (id === 'modal-title') {
          return { set textContent(val) { modalTitle = val; }, get textContent() { return modalTitle; } };
        }
        return { value: '', textContent: '', style: {}, classList: { toggle: () => {} }, appendChild: () => {} };
      },
      createElement: () => ({ setAttribute: () => {}, classList: { add: () => {} }, appendChild: () => {} })
    },
    setTimeout,
    clearTimeout,
    console
  };

  context.window = context;
  context.scrollTo = () => {};
  vm.createContext(context);
  vm.runInContext(code, context);
  context.setPosts(rawPosts);

  // Must have findPost helper or match both numeric and string IDs
  assert.equal(typeof context.findPost, 'function', 'app.js should export or declare findPost helper');
  assert.ok(context.findPost(1), 'findPost(1) with number must resolve post');
  assert.ok(context.findPost('1'), 'findPost("1") with string must resolve post');
  assert.ok(context.findPost(3), 'findPost(3) with number must resolve post 3');

  // openEditModal(1) with numeric ID
  context.openEditModal(1);
  assert.equal(modalDisplayed, true, 'openEditModal(1) must open modal when passed number');
  assert.ok(modalTitle.includes('Myth Buster'), 'modal title must be populated');

  // openEditModal('1') with string ID
  modalDisplayed = false;
  context.openEditModal('1');
  assert.equal(modalDisplayed, true, 'openEditModal("1") must open modal when passed string');

  // closeEditModal
  context.closeEditModal();
  assert.equal(modalDisplayed, false, 'closeEditModal must hide modal');

  // changeSlide with numeric and string ID
  context.changeSlide(3, 1);
  assert.equal(context.carouselIndexState['3'], 1, 'changeSlide(3, 1) must advance slide for post 3');
  context.changeSlide('3', -1);
  assert.equal(context.carouselIndexState['3'], 0, 'changeSlide("3", -1) must return to slide 0 for post 3');

  // Mock fetch for schedule and approve
  let lastFetchUrl = '';
  let lastFetchMethod = '';
  context.fetch = async (url, opts) => {
    lastFetchUrl = url;
    lastFetchMethod = opts?.method || 'GET';
    const targetPost = context.findPost(1);
    const body = opts?.body ? JSON.parse(opts.body) : {};
    if (url.includes('/approve')) {
      return { ok: true, json: async () => ({ ...targetPost, status: 'Approved' }) };
    }
    if (url.includes('/schedule')) {
      return { ok: true, json: async () => ({ ...targetPost, status: 'Scheduled' }) };
    }
    return { ok: true, json: async () => ({ ...targetPost, ...body }) };
  };

  // 1. toggleApprove(1) when Draft -> approves
  context.findPost(1).status = 'Draft';
  await context.toggleApprove(1);
  assert.equal(lastFetchUrl, '/api/posts/1/approve', 'toggleApprove(1) from Draft must call /api/posts/1/approve');
  assert.equal(context.findPost(1).status, 'Approved', 'post status must update to Approved in memory');

  // 2. toggleApprove(1) when Approved -> reverts to Draft
  await context.toggleApprove(1);
  assert.equal(lastFetchUrl, '/api/posts/1', 'toggleApprove(1) from Approved must call PUT /api/posts/1 to revert to Draft');
  assert.equal(context.findPost(1).status, 'Draft', 'post status must revert to Draft in memory');

  // schedulePost(1)
  await context.schedulePost(1);
  assert.equal(lastFetchUrl, '/api/posts/1/schedule', 'schedulePost(1) must call /api/posts/1/schedule');
  assert.equal(context.findPost(1).status, 'Scheduled', 'post status must update to Scheduled in memory');
});




