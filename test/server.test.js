import test, { before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EventEmitter } from 'node:events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ORIGINAL_POSTS_PATH = path.join(ROOT_DIR, 'data', 'posts.json');
const TEST_POSTS_PATH = path.join(ROOT_DIR, 'data', `posts.server.test.${process.pid}.json`);

fs.copyFileSync(ORIGINAL_POSTS_PATH, TEST_POSTS_PATH);
process.env.POSTS_FILE_PATH = TEST_POSTS_PATH;

const { app, handleRequest } = await import('../server.js');

const originalContent = fs.readFileSync(ORIGINAL_POSTS_PATH, 'utf8');

afterEach(() => {
  fs.writeFileSync(TEST_POSTS_PATH, originalContent, 'utf8');
});

after(() => {
  try {
    if (fs.existsSync(TEST_POSTS_PATH)) fs.unlinkSync(TEST_POSTS_PATH);
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
          json: async () => JSON.parse(text)
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

test('app.listen interface exists and returns server', () => {
  assert.ok(typeof app.listen === 'function');
  const server = app.listen(0);
  assert.ok(server);
  server.close();
});

test('GET /api/posts returns array of 10 posts', async () => {
  const res = await simulateRequest('GET', '/api/posts');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.length, 10);
});

test('POST /api/posts/:id/schedule rejects personal profile', async () => {
  const res = await simulateRequest('POST', '/api/posts/1/schedule', {
    facebookPage: 'Sannaya Mughal personal Facebook profile'
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error, 'Facebook destination is personal profile. Select Girlies Glow Facebook Page.');
});

test('GET /api/posts/:id returns single post and 404 for missing post', async () => {
  const res = await simulateRequest('GET', '/api/posts/1');
  assert.equal(res.status, 200);
  const post = await res.json();
  assert.equal(String(post.id), '1');
  assert.equal(post.title, 'Myth Buster');

  const notFound = await simulateRequest('GET', '/api/posts/999');
  assert.equal(notFound.status, 404);
  const err = await notFound.json();
  assert.ok(err.error);
});

test('PUT /api/posts/:id updates post fields and persists to disk', async () => {
  const updatePayload = {
    title: 'Updated Myth Buster Title',
    angle: 'Updated Angle text'
  };
  const res = await simulateRequest('PUT', '/api/posts/1', updatePayload);
  assert.equal(res.status, 200);
  const updated = await res.json();
  assert.equal(updated.title, 'Updated Myth Buster Title');
  assert.equal(updated.angle, 'Updated Angle text');

  // Verify persistence to test file
  const diskContent = JSON.parse(fs.readFileSync(TEST_POSTS_PATH, 'utf8'));
  const diskPost1 = diskContent.find(p => String(p.id) === '1');
  assert.equal(diskPost1.title, 'Updated Myth Buster Title');
});

test('POST /api/posts/:id/approve marks post as Approved and persists', async () => {
  const res = await simulateRequest('POST', '/api/posts/1/approve');
  assert.equal(res.status, 200);
  const approved = await res.json();
  assert.equal(approved.status, 'Approved');

  const diskContent = JSON.parse(fs.readFileSync(TEST_POSTS_PATH, 'utf8'));
  const diskPost1 = diskContent.find(p => String(p.id) === '1');
  assert.equal(diskPost1.status, 'Approved');
});

test('POST /api/posts/:id/schedule succeeds with valid Facebook Page and marks Scheduled', async () => {
  const res = await simulateRequest('POST', '/api/posts/1/schedule', {
    facebookPage: 'Girlies Glow Facebook Business Page'
  });
  assert.equal(res.status, 200);
  const scheduled = await res.json();
  assert.equal(scheduled.status, 'Scheduled');

  const diskContent = JSON.parse(fs.readFileSync(TEST_POSTS_PATH, 'utf8'));
  const diskPost1 = diskContent.find(p => String(p.id) === '1');
  assert.equal(diskPost1.status, 'Scheduled');
});

test('POST /api/posts/approve-all marks all posts Approved and persists', async () => {
  const res = await simulateRequest('POST', '/api/posts/approve-all');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.posts.length, 10);
  assert.ok(body.posts.every(p => p.status === 'Approved'));

  const diskContent = JSON.parse(fs.readFileSync(TEST_POSTS_PATH, 'utf8'));
  assert.ok(diskContent.every(p => p.status === 'Approved'));
});

test('POST /api/posts/schedule-all validates destinations and marks approved posts Scheduled', async () => {
  // 1. Approve all posts first
  await simulateRequest('POST', '/api/posts/approve-all');

  // 2. Schedule all
  const res = await simulateRequest('POST', '/api/posts/schedule-all');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.posts.every(p => p.status === 'Scheduled'));

  // 3. Test destination guard failure on schedule-all
  // Corrupt one post destination on disk to personal profile
  const diskPosts = JSON.parse(fs.readFileSync(TEST_POSTS_PATH, 'utf8'));
  diskPosts[2].destinations.facebookPage = 'Sannaya Personal Page';
  fs.writeFileSync(TEST_POSTS_PATH, JSON.stringify(diskPosts, null, 2), 'utf8');

  const failRes = await simulateRequest('POST', '/api/posts/schedule-all');
  assert.equal(failRes.status, 400);
  const failBody = await failRes.json();
  assert.equal(failBody.error, 'Facebook destination is personal profile. Select Girlies Glow Facebook Page.');
});

test('POST /api/posts/:id/regenerate-media invokes creative generator and succeeds', async () => {
  const res = await simulateRequest('POST', '/api/posts/1/regenerate-media');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.message.includes('post 1'));
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'public', 'generated', 'post_1_static.png')));
});

test('GET /api/export/csv returns valid CSV format with required headers', async () => {
  const res = await simulateRequest('GET', '/api/export/csv');
  assert.equal(res.status, 200);
  assert.ok(res.headers.get('content-type')?.includes('text/csv'));
  const csv = await res.text();
  const expectedHeader = 'Post Number,Post Title,Content Type,Instagram,Facebook Page,Media File,Caption,Hashtags,Scheduled Date,Scheduled Time,Status';
  assert.ok(csv.startsWith(expectedHeader), 'CSV must start with required header');
  assert.ok(csv.includes('Myth Buster'));
  assert.ok(csv.includes('@girli_esglow'));
});

test('GET /api/export/json returns full JSON export of 10 posts', async () => {
  const res = await simulateRequest('GET', '/api/export/json');
  assert.equal(res.status, 200);
  assert.ok(res.headers.get('content-type')?.includes('application/json'));
  const data = await res.json();
  assert.equal(data.length, 10);
  assert.equal(data[0].title, 'Myth Buster');
});

test('Static file serving serves files from public/ and workspace assets', async () => {
  // 1. Check generated asset from public/generated/
  const generatedRes = await simulateRequest('GET', '/generated/post_1_static.png');
  assert.equal(generatedRes.status, 200);
  assert.equal(generatedRes.headers.get('content-type'), 'image/png');

  // 2. Check workspace root asset
  const assetRes = await simulateRequest('GET', '/GirliesGlow_Logo_NoBG.png');
  assert.equal(assetRes.status, 200);
  assert.equal(assetRes.headers.get('content-type'), 'image/png');

  // 3. Check workspace asset with spaces
  const cardRes = await simulateRequest('GET', '/Card%201.png');
  assert.equal(cardRes.status, 200);
  assert.equal(cardRes.headers.get('content-type'), 'image/png');

  // 4. Check 404 for missing file
  const missingRes = await simulateRequest('GET', '/non-existent-file.xyz');
  assert.equal(missingRes.status, 404);
});
