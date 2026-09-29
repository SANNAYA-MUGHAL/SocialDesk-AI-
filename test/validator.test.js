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

test('blocks unofficial Facebook groups (e.g. girlies glow unofficial facebook group)', () => {
  const postGroup = {
    destinations: {
      instagram: '@girli_esglow',
      facebookPage: 'girlies glow unofficial facebook group'
    }
  };
  const resultGroup = validateDestinations(postGroup);
  assert.equal(resultGroup.isValid, false);
  assert.equal(resultGroup.error, 'Facebook destination is personal profile. Select Girlies Glow Facebook Page.');

  const postGenericGroup = {
    destinations: {
      instagram: '@girli_esglow',
      facebookPage: 'Girlies Glow Community Group'
    }
  };
  const resultGenericGroup = validateDestinations(postGenericGroup);
  assert.equal(resultGenericGroup.isValid, false);
  assert.equal(resultGenericGroup.error, 'Facebook destination is personal profile. Select Girlies Glow Facebook Page.');
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

// --- validatePost Guardrail Tests ---

test('validatePost rejects post when COD is not mentioned in caption or content', () => {
  const postWithoutCod = {
    pricing: 'Rs. 599',
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

test('validatePost rejects post when codAvailable is explicitly false or missing', () => {
  const postCodFalse = {
    pricing: 'Rs. 599',
    captionIg: 'Order now Rs. 599. Cash on Delivery available.',
    codAvailable: false,
    destinations: {
      instagram: '@girli_esglow',
      facebookPage: 'Girlies Glow Facebook Business Page'
    }
  };
  const resultFalse = validatePost(postCodFalse);
  assert.equal(resultFalse.isValid, false);
  assert.equal(resultFalse.error, 'Cash on Delivery must be explicitly available for this post.');

  const postCodUndefined = {
    pricing: 'Rs. 599',
    captionIg: 'Order now Rs. 599. Cash on Delivery available.',
    destinations: {
      instagram: '@girli_esglow',
      facebookPage: 'Girlies Glow Facebook Business Page'
    }
  };
  const resultUndefined = validatePost(postCodUndefined);
  assert.equal(resultUndefined.isValid, false);
  assert.equal(resultUndefined.error, 'Cash on Delivery must be explicitly available for this post.');
});

test('validatePost rejects post missing or invalid price Rs. 599', () => {
  const postNoPrice = {
    captionIg: 'Order now with Cash on Delivery available.',
    codAvailable: true,
    destinations: {
      instagram: '@girli_esglow',
      facebookPage: 'Girlies Glow Facebook Business Page'
    }
  };
  const resultNoPrice = validatePost(postNoPrice);
  assert.equal(resultNoPrice.isValid, false);
  assert.equal(resultNoPrice.error, 'Post pricing must specify Rs. 599.');

  const postWrongPrice = {
    pricing: 'Rs. 999',
    captionIg: 'Order now Rs. 999. Cash on Delivery available.',
    codAvailable: true,
    destinations: {
      instagram: '@girli_esglow',
      facebookPage: 'Girlies Glow Facebook Business Page'
    }
  };
  const resultWrongPrice = validatePost(postWrongPrice);
  assert.equal(resultWrongPrice.isValid, false);
  assert.equal(resultWrongPrice.error, 'Post pricing must specify Rs. 599.');
});

test('validatePost requires both Facebook and Instagram destinations on full post', () => {
  const postMissingFb = {
    pricing: 'Rs. 599',
    captionIg: 'Order now Rs. 599. Cash on Delivery available.',
    codAvailable: true,
    destinations: {
      instagram: '@girli_esglow'
    }
  };
  const resultMissingFb = validatePost(postMissingFb);
  assert.equal(resultMissingFb.isValid, false);
  assert.equal(resultMissingFb.error, 'Facebook destination is personal profile. Select Girlies Glow Facebook Page.');

  const postMissingIg = {
    pricing: 'Rs. 599',
    captionIg: 'Order now Rs. 599. Cash on Delivery available.',
    codAvailable: true,
    destinations: {
      facebookPage: 'Girlies Glow Facebook Business Page'
    }
  };
  const resultMissingIg = validatePost(postMissingIg);
  assert.equal(resultMissingIg.isValid, false);
  assert.equal(resultMissingIg.error, 'Instagram destination must match @girli_esglow or URL https://www.instagram.com/girli_esglow/.');

  const postNoDestinations = {
    pricing: 'Rs. 599',
    captionIg: 'Order now Rs. 599. Cash on Delivery available.',
    codAvailable: true
  };
  const resultNoDestinations = validatePost(postNoDestinations);
  assert.equal(resultNoDestinations.isValid, false);
  assert.equal(resultNoDestinations.error, 'Facebook destination is personal profile. Select Girlies Glow Facebook Page.');
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
