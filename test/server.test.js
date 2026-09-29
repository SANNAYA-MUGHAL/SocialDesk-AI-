import test, { before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app } from '../server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const POSTS_PATH = path.join(ROOT_DIR, 'data', 'posts.json');

const originalPostsContent = fs.readFileSync(POSTS_PATH, 'utf8');

afterEach(() => {
  fs.writeFileSync(POSTS_PATH, originalPostsContent, 'utf8');
});

after(() => {
  fs.writeFileSync(POSTS_PATH, originalPostsContent, 'utf8');
});

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

test('GET /api/posts/:id returns single post and 404 for missing post', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://localhost:${port}/api/posts/1`);
    assert.equal(res.status, 200);
    const post = await res.json();
    assert.equal(String(post.id), '1');
    assert.equal(post.title, 'Myth Buster');

    const notFound = await fetch(`http://localhost:${port}/api/posts/999`);
    assert.equal(notFound.status, 404);
    const err = await notFound.json();
    assert.ok(err.error);
  } finally {
    server.close();
  }
});

test('PUT /api/posts/:id updates post fields and persists to disk', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const updatePayload = {
      title: 'Updated Myth Buster Title',
      angle: 'Updated Angle text'
    };
    const res = await fetch(`http://localhost:${port}/api/posts/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });
    assert.equal(res.status, 200);
    const updated = await res.json();
    assert.equal(updated.title, 'Updated Myth Buster Title');
    assert.equal(updated.angle, 'Updated Angle text');

    // Verify persistence to disk
    const diskContent = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'));
    const diskPost1 = diskContent.find(p => String(p.id) === '1');
    assert.equal(diskPost1.title, 'Updated Myth Buster Title');
  } finally {
    server.close();
  }
});

test('POST /api/posts/:id/approve marks post as Approved and persists', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://localhost:${port}/api/posts/1/approve`, {
      method: 'POST'
    });
    assert.equal(res.status, 200);
    const approved = await res.json();
    assert.equal(approved.status, 'Approved');

    const diskContent = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'));
    const diskPost1 = diskContent.find(p => String(p.id) === '1');
    assert.equal(diskPost1.status, 'Approved');
  } finally {
    server.close();
  }
});

test('POST /api/posts/:id/schedule succeeds with valid Facebook Page and marks Scheduled', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://localhost:${port}/api/posts/1/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facebookPage: 'Girlies Glow Facebook Business Page' })
    });
    assert.equal(res.status, 200);
    const scheduled = await res.json();
    assert.equal(scheduled.status, 'Scheduled');

    const diskContent = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'));
    const diskPost1 = diskContent.find(p => String(p.id) === '1');
    assert.equal(diskPost1.status, 'Scheduled');
  } finally {
    server.close();
  }
});

test('POST /api/posts/approve-all marks all posts Approved and persists', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://localhost:${port}/api/posts/approve-all`, {
      method: 'POST'
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.posts.length, 10);
    assert.ok(body.posts.every(p => p.status === 'Approved'));

    const diskContent = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'));
    assert.ok(diskContent.every(p => p.status === 'Approved'));
  } finally {
    server.close();
  }
});

test('POST /api/posts/schedule-all validates destinations and marks approved posts Scheduled', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    // 1. Approve all posts first
    await fetch(`http://localhost:${port}/api/posts/approve-all`, { method: 'POST' });

    // 2. Schedule all
    const res = await fetch(`http://localhost:${port}/api/posts/schedule-all`, {
      method: 'POST'
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.posts.every(p => p.status === 'Scheduled'));

    // 3. Test destination guard failure on schedule-all
    // Corrupt one post destination on disk to personal profile
    const diskPosts = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'));
    diskPosts[2].destinations.facebookPage = 'Sannaya Personal Page';
    fs.writeFileSync(POSTS_PATH, JSON.stringify(diskPosts, null, 2), 'utf8');

    const failRes = await fetch(`http://localhost:${port}/api/posts/schedule-all`, {
      method: 'POST'
    });
    assert.equal(failRes.status, 400);
    const failBody = await failRes.json();
    assert.equal(failBody.error, 'Facebook destination is personal profile. Select Girlies Glow Facebook Page.');
  } finally {
    server.close();
  }
});

test('POST /api/posts/:id/regenerate-media invokes creative generator and succeeds', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://localhost:${port}/api/posts/1/regenerate-media`, {
      method: 'POST'
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.message.includes('post 1'));
    assert.ok(fs.existsSync(path.join(ROOT_DIR, 'public', 'generated', 'post_1_static.png')));
  } finally {
    server.close();
  }
});

test('GET /api/export/csv returns valid CSV format with required headers', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://localhost:${port}/api/export/csv`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('text/csv'));
    const csv = await res.text();
    const expectedHeader = 'Post Number,Post Title,Content Type,Instagram,Facebook Page,Media File,Caption,Hashtags,Scheduled Date,Scheduled Time,Status';
    assert.ok(csv.startsWith(expectedHeader), 'CSV must start with required header');
    assert.ok(csv.includes('Myth Buster'));
    assert.ok(csv.includes('@girli_esglow'));
  } finally {
    server.close();
  }
});

test('GET /api/export/json returns full JSON export of 10 posts', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://localhost:${port}/api/export/json`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('application/json'));
    const data = await res.json();
    assert.equal(data.length, 10);
    assert.equal(data[0].title, 'Myth Buster');
  } finally {
    server.close();
  }
});

test('Static file serving serves files from public/ and workspace assets', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    // 1. Check generated asset from public/generated/
    const generatedRes = await fetch(`http://localhost:${port}/generated/post_1_static.png`);
    assert.equal(generatedRes.status, 200);
    assert.equal(generatedRes.headers.get('content-type'), 'image/png');

    // 2. Check workspace root asset
    const assetRes = await fetch(`http://localhost:${port}/GirliesGlow_Logo_NoBG.png`);
    assert.equal(assetRes.status, 200);
    assert.equal(assetRes.headers.get('content-type'), 'image/png');

    // 3. Check workspace asset with spaces
    const cardRes = await fetch(`http://localhost:${port}/Card%201.png`);
    assert.equal(cardRes.status, 200);
    assert.equal(cardRes.headers.get('content-type'), 'image/png');

    // 4. Check 404 for missing file
    const missingRes = await fetch(`http://localhost:${port}/non-existent-file.xyz`);
    assert.equal(missingRes.status, 404);
  } finally {
    server.close();
  }
});
