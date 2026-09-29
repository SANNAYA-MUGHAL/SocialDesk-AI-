import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateDestinations, validatePost } from '../src/validator.js';

// --- Tests from Brief ---

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

// --- Mandatory Security & Platform Constraint Tests ---

test('allows Facebook destination by Page ID 61592791861631', () => {
  const post = {
    destinations: {
      instagram: '@girli_esglow',
      facebookPage: '61592791861631'
    }
  };
  const result = validateDestinations(post);
  assert.equal(result.isValid, true);
});

test('allows Facebook destination by official URL', () => {
  const post = {
    destinations: {
      instagram: '@girli_esglow',
      facebookPage: 'https://www.facebook.com/p/Girlies-Glow-61592791861631/'
    }
  };
  const result = validateDestinations(post);
  assert.equal(result.isValid, true);
});

test('blocks Facebook destination containing sannaya regardless of casing', () => {
  const post = {
    destinations: {
      instagram: '@girli_esglow',
      facebookPage: 'Sannaya Mughal profile'
    }
  };
  const result = validateDestinations(post);
  assert.equal(result.isValid, false);
  assert.equal(result.error, 'Facebook destination is personal profile. Select Girlies Glow Facebook Page.');
});

test('blocks arbitrary or non-business Facebook destination', () => {
  const post = {
    destinations: {
      instagram: '@girli_esglow',
      facebookPage: 'Random Facebook Account'
    }
  };
  const result = validateDestinations(post);
  assert.equal(result.isValid, false);
  assert.equal(result.error, 'Facebook destination is personal profile. Select Girlies Glow Facebook Page.');
});

test('allows Instagram destination with official URL', () => {
  const post = {
    destinations: {
      instagram: 'https://www.instagram.com/girli_esglow/',
      facebookPage: 'Girlies Glow Facebook Business Page'
    }
  };
  const result = validateDestinations(post);
  assert.equal(result.isValid, true);
});

test('blocks invalid Instagram destination handle or URL', () => {
  const post = {
    destinations: {
      instagram: '@personal_feed',
      facebookPage: 'Girlies Glow Facebook Business Page'
    }
  };
  const result = validateDestinations(post);
  assert.equal(result.isValid, false);
  assert.ok(result.error.includes('Instagram destination must match @girli_esglow or URL https://www.instagram.com/girli_esglow/.'));
});

test('validates destination payload passed directly without outer post wrapper', () => {
  const destPayload = {
    instagram: '@girli_esglow',
    facebookPage: 'Girlies Glow Facebook Business Page'
  };
  const result = validateDestinations(destPayload);
  assert.equal(result.isValid, true);
});

test('validates top-level facebookPage in partial update payload (Task 4 compatibility)', () => {
  const partialValid = { facebookPage: 'Girlies Glow Facebook Business Page' };
  assert.equal(validateDestinations(partialValid).isValid, true);

  const partialInvalid = { facebookPage: 'Sannaya Mughal personal Facebook profile' };
  const res = validateDestinations(partialInvalid);
  assert.equal(res.isValid, false);
  assert.equal(res.error, 'Facebook destination is personal profile. Select Girlies Glow Facebook Page.');
});

test('validatePost rejects post when COD is not mentioned in caption or content', () => {
  const postWithoutCod = {
    captionIg: 'Order now Rs. 599 for glowing skin! Click bio link.',
    codAvailable: true,
    destinations: {
      instagram: '@girli_esglow',
      facebookPage: 'Girlies Glow Facebook Business Page'
    }
  };
  const result = validatePost(postWithoutCod);
  assert.equal(result.isValid, false);
  assert.equal(result.error, 'Post must explicitly mention Cash on Delivery (COD).');
});

test('validatePost rejects post when codAvailable is explicitly false', () => {
  const postCodDisabled = {
    captionIg: 'Order now Rs. 599. Cash on Delivery available.',
    codAvailable: false,
    destinations: {
      instagram: '@girli_esglow',
      facebookPage: 'Girlies Glow Facebook Business Page'
    }
  };
  const result = validatePost(postCodDisabled);
  assert.equal(result.isValid, false);
  assert.equal(result.error, 'Cash on Delivery (COD) must be enabled.');
});

test('validatePost passes for all 10 registered posts in data/posts.json', () => {
  const posts = JSON.parse(fs.readFileSync('data/posts.json', 'utf8'));
  assert.equal(posts.length, 10);
  for (const post of posts) {
    const destResult = validateDestinations(post);
    assert.equal(destResult.isValid, true, `Post ${post.id} destinations must be valid`);

    const postResult = validatePost(post);
    assert.equal(postResult.isValid, true, `Post ${post.id} must pass validatePost: ${postResult.error}`);
  }
});
