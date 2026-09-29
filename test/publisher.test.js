import test from 'node:test';
import assert from 'node:assert/strict';
import { publishPostToMeta, getMetaConfig, updateMetaConfig } from '../src/meta_publisher.js';

test('Meta Publisher - requires human approval before publishing', async () => {
  const draftPost = {
    id: '1',
    title: 'Test Post',
    status: 'Draft',
    destinations: {
      facebookPage: 'Girlies Glow Facebook Business Page',
      instagram: '@girli_esglow'
    },
    media: 'generated/post_1_static.png',
    captionIg: 'Test caption',
    captionFb: 'Test caption'
  };

  await assert.rejects(
    async () => {
      await publishPostToMeta(draftPost);
    },
    /Human Approval Required/
  );
});

test('Meta Publisher - strictly blocks personal Facebook profiles', async () => {
  const personalProfilePost = {
    id: '1',
    title: 'Test Post',
    status: 'Approved',
    destinations: {
      facebookPage: 'Sannaya Mughal personal Facebook profile',
      instagram: '@girli_esglow'
    },
    media: 'generated/post_1_static.png',
    captionIg: 'Test caption',
    captionFb: 'Test caption'
  };

  await assert.rejects(
    async () => {
      await publishPostToMeta(personalProfilePost);
    },
    /Facebook destination is personal profile/
  );
});

test('Meta Publisher - publishes approved post in mock mode with verified destinations', async () => {
  const approvedPost = {
    id: '1',
    title: 'Myth Buster',
    status: 'Approved',
    destinations: {
      facebookPage: 'Girlies Glow Facebook Business Page',
      instagram: '@girli_esglow'
    },
    media: 'generated/post_1_static.png',
    captionIg: 'Myth buster caption with COD Rs. 599',
    captionFb: 'Myth buster caption with COD Rs. 599'
  };

  const result = await publishPostToMeta(approvedPost, { mockPublish: true });
  assert.equal(result.success, true);
  assert.equal(result.facebook.pageId, '61592791861631');
  assert.equal(result.instagram.igAccount, '@girli_esglow');
  assert.ok(result.facebook.postId);
  assert.ok(result.instagram.mediaId);
});

test('Meta Publisher - allows configuration updates', () => {
  updateMetaConfig({ pageId: '61592791861631', igUserId: '1784140001' });
  const cfg = getMetaConfig();
  assert.equal(cfg.pageId, '61592791861631');
  assert.equal(cfg.igUserId, '1784140001');
});
