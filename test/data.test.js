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
