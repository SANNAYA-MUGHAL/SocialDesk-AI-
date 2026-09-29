import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function getPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${filePath} must have valid PNG signature`);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

test('generated creatives exist for all static, carousel, and reel posts', () => {
  assert.ok(fs.existsSync('public/generated/post_1_static.png'), 'post 1 image must exist');
  assert.ok(fs.existsSync('public/generated/post_3_slide_1.png'), 'post 3 slide 1 must exist');
  assert.ok(fs.existsSync('public/generated/post_10_offer.png'), 'post 10 image must exist');
});

test('all required static and carousel post creatives exist with size > 0', () => {
  const expectedFiles = [
    'public/generated/post_1_static.png',
    'public/generated/post_3_slide_1.png',
    'public/generated/post_3_slide_2.png',
    'public/generated/post_3_slide_3.png',
    'public/generated/post_3_slide_4.png',
    'public/generated/post_4_static.png',
    'public/generated/post_6_static.png',
    'public/generated/post_8_slide_1.png',
    'public/generated/post_8_slide_2.png',
    'public/generated/post_8_slide_3.png',
    'public/generated/post_8_slide_4.png',
    'public/generated/post_8_slide_5.png',
    'public/generated/post_9_static.png',
    'public/generated/post_10_offer.png'
  ];

  for (const file of expectedFiles) {
    assert.ok(fs.existsSync(file), `Expected ${file} to exist`);
    const stat = fs.statSync(file);
    assert.ok(stat.size > 0, `Expected ${file} to have size > 0, got ${stat.size}`);
  }
});

test('all reel covers and media assets exist with size > 0', () => {
  const reelFiles = [
    'public/generated/post_2_reel.png',
    'public/generated/post_2_cover.png',
    'public/generated/post_2_reel.mp4',
    'public/generated/post_5_reel.png',
    'public/generated/post_5_cover.png',
    'public/generated/post_5_reel.mp4',
    'public/generated/post_7_reel.png',
    'public/generated/post_7_cover.png',
    'public/generated/post_7_reel.mp4'
  ];

  for (const file of reelFiles) {
    assert.ok(fs.existsSync(file), `Expected ${file} to exist`);
    const stat = fs.statSync(file);
    assert.ok(stat.size > 0, `Expected ${file} to have size > 0, got ${stat.size}`);
  }
});

test('all 10 posts in data/posts.json have their referenced media existing on disk', () => {
  const raw = fs.readFileSync('data/posts.json', 'utf8');
  const posts = JSON.parse(raw);
  assert.equal(posts.length, 10);

  for (const post of posts) {
    if (Array.isArray(post.media)) {
      for (const item of post.media) {
        const filePath = path.join('public', item.replace(/^\//, ''));
        assert.ok(fs.existsSync(filePath), `Media file for Post ${post.id} (${filePath}) must exist`);
        assert.ok(fs.statSync(filePath).size > 0, `Media file ${filePath} must have size > 0`);
      }
    } else if (typeof post.media === 'string') {
      const filePath = path.join('public', post.media.replace(/^\//, ''));
      assert.ok(fs.existsSync(filePath), `Media file for Post ${post.id} (${filePath}) must exist`);
      assert.ok(fs.statSync(filePath).size > 0, `Media file ${filePath} must have size > 0`);
    }
  }
});

test('static and carousel images have exact 4:5 aspect ratio (1080x1350)', () => {
  const fourByFiveFiles = [
    'public/generated/post_1_static.png',
    'public/generated/post_3_slide_1.png',
    'public/generated/post_3_slide_2.png',
    'public/generated/post_3_slide_3.png',
    'public/generated/post_3_slide_4.png',
    'public/generated/post_4_static.png',
    'public/generated/post_6_static.png',
    'public/generated/post_8_slide_1.png',
    'public/generated/post_8_slide_2.png',
    'public/generated/post_8_slide_3.png',
    'public/generated/post_8_slide_4.png',
    'public/generated/post_8_slide_5.png',
    'public/generated/post_9_static.png',
    'public/generated/post_10_offer.png'
  ];

  for (const file of fourByFiveFiles) {
    const dim = getPngDimensions(file);
    assert.equal(dim.width, 1080, `${file} width must be 1080`);
    assert.equal(dim.height, 1350, `${file} height must be 1350`);
  }
});

test('reel covers have exact 9:16 aspect ratio (1080x1920)', () => {
  const nineBySixteenFiles = [
    'public/generated/post_2_reel.png',
    'public/generated/post_2_cover.png',
    'public/generated/post_5_reel.png',
    'public/generated/post_5_cover.png',
    'public/generated/post_7_reel.png',
    'public/generated/post_7_cover.png'
  ];

  for (const file of nineBySixteenFiles) {
    const dim = getPngDimensions(file);
    assert.equal(dim.width, 1080, `${file} width must be 1080`);
    assert.equal(dim.height, 1920, `${file} height must be 1920`);
  }
});
