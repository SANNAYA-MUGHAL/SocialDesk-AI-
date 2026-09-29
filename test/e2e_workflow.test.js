import test, { after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EventEmitter } from 'node:events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ORIGINAL_POSTS_PATH = path.join(ROOT_DIR, 'data', 'posts.json');
const E2E_POSTS_PATH = path.join(ROOT_DIR, 'data', `posts.e2e.test.${process.pid}.json`);

fs.copyFileSync(ORIGINAL_POSTS_PATH, E2E_POSTS_PATH);
process.env.POSTS_FILE_PATH = E2E_POSTS_PATH;

const { handleRequest } = await import('../server.js');

const originalContent = fs.readFileSync(ORIGINAL_POSTS_PATH, 'utf8');

afterEach(() => {
  fs.writeFileSync(E2E_POSTS_PATH, originalContent, 'utf8');
});

after(() => {
  try {
    if (fs.existsSync(E2E_POSTS_PATH)) fs.unlinkSync(E2E_POSTS_PATH);
  } catch {}
});

function simulateRequest(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    class MockReq extends EventEmitter {
      constructor() {
        super();
        this.method = method;
        this.url = url;
        this.headers = { ...headers };
      }
    }

    class MockRes extends EventEmitter {
      constructor() {
        super();
        this.statusCode = 200;
        this.headers = {};
        this._bodyChunks = [];
      }
      writeHead(code, headers = {}) {
        this.statusCode = code;
        for (const [k, v] of Object.entries(headers)) {
          this.headers[k.toLowerCase()] = v;
        }
        return this;
      }
      setHeader(name, val) {
        this.headers[name.toLowerCase()] = val;
      }
      getHeader(name) {
        return this.headers[name.toLowerCase()];
      }
      write(chunk) {
        if (chunk) this._bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return true;
      }
      end(chunk) {
        if (chunk) this._bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        const fullBuffer = Buffer.concat(this._bodyChunks);
        const text = fullBuffer.toString('utf8');
        resolve({
          status: this.statusCode,
          headers: {
            get: (name) => this.headers[name.toLowerCase()] || null
          },
          text: async () => text,
          json: async () => {
            try {
              return JSON.parse(text);
            } catch (e) {
              return { rawText: text };
            }
          }
        });
      }
    }

    const req = new MockReq();
    const res = new MockRes();

    handleRequest(req, res).catch(reject);

    if (body !== null) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      req.emit('data', Buffer.from(payload));
    }
    req.emit('end');
  });
}

test('Full E2E Workflow: Load, Edit, Approve, Personal FB Block, Page Schedule, Export', async () => {
  // 1. Fetch initial posts
  const listRes = await simulateRequest('GET', '/api/posts');
  assert.equal(listRes.status, 200);
  const posts = await listRes.json();
  assert.equal(posts.length, 10, 'Must load exactly 10 posts');

  // Verify all 10 posts adhere to core constraints
  for (const post of posts) {
    assert.equal(post.codAvailable, true, 'Cash on Delivery must be explicitly available');
    assert.ok(post.pricing.includes('599'), 'Pricing must be Rs. 599');
    assert.equal(post.destinations.instagram, '@girli_esglow');
    assert.equal(post.destinations.facebookPage, 'Girlies Glow Facebook Business Page');
    assert.equal(post.schedule.timezone, 'PKT');
  }

  // 2. Edit Post 1 caption and date
  const updateRes = await simulateRequest('PUT', '/api/posts/1', {
    captionIg: 'Updated E2E caption. Girlies Glow Facial Razor Rs. 599. Cash on Delivery available across Pakistan.',
    schedule: {
      date: '2026-09-29',
      time: '20:00',
      timezone: 'PKT'
    }
  });
  assert.equal(updateRes.status, 200);
  const updatedPost1 = await updateRes.json();
  assert.ok(updatedPost1.captionIg.includes('Updated E2E caption'));

  // 3. Approve Post 1
  const appRes = await simulateRequest('POST', '/api/posts/1/approve');
  assert.equal(appRes.status, 200);
  const approvedPost1 = await appRes.json();
  assert.equal(approvedPost1.status, 'Approved');

  // 4. Attempt scheduling Post 1 to personal profile (MUST FAIL with 400 error)
  const badSchedRes = await simulateRequest('POST', '/api/posts/1/schedule', {
    facebookPage: 'Sannaya Mughal personal Facebook profile'
  });
  assert.equal(badSchedRes.status, 400);
  const badSchedBody = await badSchedRes.json();
  assert.equal(badSchedBody.error, 'Facebook destination is personal profile. Select Girlies Glow Facebook Page.');

  // 5. Schedule Post 1 to verified Girlies Glow Business Page (MUST SUCCEED)
  const goodSchedRes = await simulateRequest('POST', '/api/posts/1/schedule', {
    facebookPage: 'Girlies Glow Facebook Business Page'
  });
  assert.equal(goodSchedRes.status, 200);
  const scheduledPost1 = await goodSchedRes.json();
  assert.equal(scheduledPost1.status, 'Scheduled');

  // 6. Test Bulk Approve
  const bulkAppRes = await simulateRequest('POST', '/api/posts/approve-all');
  assert.equal(bulkAppRes.status, 200);
  const bulkAppData = await bulkAppRes.json();
  assert.equal(bulkAppData.success, true);
  assert.ok(bulkAppData.posts.every(p => p.status === 'Approved' || p.status === 'Scheduled'));

  // 7. Test Bulk Schedule
  const bulkSchedRes = await simulateRequest('POST', '/api/posts/schedule-all');
  assert.equal(bulkSchedRes.status, 200);
  const bulkSchedData = await bulkSchedRes.json();
  assert.equal(bulkSchedData.success, true);
  assert.ok(bulkSchedData.posts.every(p => p.status === 'Scheduled'));

  // 8. Test CSV and JSON Export
  const csvRes = await simulateRequest('GET', '/api/export/csv');
  assert.equal(csvRes.status, 200);
  const csv = await csvRes.text();
  assert.ok(csv.startsWith('Post Number,Post Title'));
  assert.ok(csv.includes('Scheduled'));
  assert.ok(csv.includes('Girlies Glow Facebook Business Page'));

  const jsonRes = await simulateRequest('GET', '/api/export/json');
  assert.equal(jsonRes.status, 200);
  const jsonExport = await jsonRes.json();
  assert.equal(jsonExport.length, 10);
  assert.ok(jsonExport.every(p => p.status === 'Scheduled'));

  // 9. Test Regenerate Media
  const regenRes = await simulateRequest('POST', '/api/posts/1/regenerate-media');
  assert.equal(regenRes.status, 200);
  const regenData = await regenRes.json();
  assert.equal(regenData.success, true);
});
