/**
 * Girlies Glow Social Media Content Scheduler - Destination Safety Guardrails
 * 
 * Enforces zero personal profile publishing and destination safety for:
 * - Facebook: Girlies Glow Facebook Business Page (ID: 61592791861631)
 * - Instagram: @girli_esglow
 * Also validates mandatory pricing (Rs. 599) and Cash on Delivery (COD) terms.
 */

export const OFFICIAL_FACEBOOK_PAGE_NAME = 'Girlies Glow Facebook Business Page';
export const OFFICIAL_FACEBOOK_PAGE_ID = '61592791861631';
export const OFFICIAL_FACEBOOK_PAGE_URL = 'https://www.facebook.com/p/Girlies-Glow-61592791861631/';

export const OFFICIAL_INSTAGRAM_HANDLE = '@girli_esglow';
export const OFFICIAL_INSTAGRAM_URL = 'https://www.instagram.com/girli_esglow/';

export const ERROR_MESSAGES = {
  FACEBOOK_PERSONAL: 'Facebook destination is personal profile. Select Girlies Glow Facebook Page.',
  INSTAGRAM_INVALID: 'Instagram destination must match @girli_esglow or URL https://www.instagram.com/girli_esglow/.',
  COD_REQUIRED: 'Post must explicitly mention Cash on Delivery (COD).',
  COD_NOT_AVAILABLE: 'Cash on Delivery must be explicitly available for this post.',
  PRICE_INVALID: 'Post pricing must specify Rs. 599.',
};

/**
 * Validates whether a Facebook destination refers to the verified Girlies Glow Business Page.
 * Strictly blocks personal profiles (e.g., Sannaya Mughal), unofficial groups, and non-business destinations.
 * 
 * @param {string} fb - Facebook destination string (name, ID, or URL)
 * @returns {boolean}
 */
export function isValidFacebookDestination(fb) {
  if (typeof fb !== 'string') return false;
  const trimmed = fb.trim();
  const lower = trimmed.toLowerCase();

  // Strict check: personal profile indicators, groups, or unofficial pages
  if (
    lower.includes('personal') ||
    lower.includes('sannaya') ||
    lower.includes('group') ||
    lower.includes('unofficial')
  ) {
    return false;
  }

  // Exact canonical business page matches
  if (trimmed === OFFICIAL_FACEBOOK_PAGE_NAME) return true;
  if (trimmed === OFFICIAL_FACEBOOK_PAGE_ID) return true;
  if (trimmed === OFFICIAL_FACEBOOK_PAGE_URL) return true;

  // Normalized URL or ID match
  if (lower.includes(OFFICIAL_FACEBOOK_PAGE_ID)) return true;

  // Verified business page name variations (strictly requiring business page, not groups)
  if (
    lower.includes('girlies glow') &&
    (lower.includes('business page') || lower.includes('facebook business page'))
  ) {
    return true;
  }

  return false;
}

/**
 * Validates whether an Instagram destination refers to @girli_esglow or its official URL.
 * 
 * @param {string} ig - Instagram destination string (handle or URL)
 * @returns {boolean}
 */
export function isValidInstagramDestination(ig) {
  if (typeof ig !== 'string') return false;
  const trimmed = ig.trim();
  const lower = trimmed.toLowerCase();

  if (lower === '@girli_esglow' || lower === 'girli_esglow') return true;
  if (lower === 'https://www.instagram.com/girli_esglow/' || lower === 'https://www.instagram.com/girli_esglow') return true;
  if (lower === 'http://www.instagram.com/girli_esglow/' || lower === 'http://www.instagram.com/girli_esglow') return true;

  return false;
}

/**
 * Validates destinations of a post or a destination update payload.
 * 
 * @param {Object} post - Post object with destinations or destination payload directly
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateDestinations(post) {
  if (!post || typeof post !== 'object') {
    return {
      isValid: false,
      error: ERROR_MESSAGES.FACEBOOK_PERSONAL
    };
  }

  const dest = post.destinations || post;
  const fb = dest.facebookPage !== undefined ? dest.facebookPage : dest.facebook;
  const ig = dest.instagram;

  // If facebookPage is provided, or if neither fb nor ig is provided (empty payload)
  if (fb !== undefined || ig === undefined) {
    if (!isValidFacebookDestination(fb)) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.FACEBOOK_PERSONAL
      };
    }
  }

  // If instagram is provided
  if (ig !== undefined) {
    if (!isValidInstagramDestination(ig)) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.INSTAGRAM_INVALID
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates a complete post payload against destination safety and business rules:
 * - Verified Facebook Business Page & Instagram destinations (both required)
 * - Strict Cash on Delivery availability (codAvailable === true)
 * - Post pricing must specify Rs. 599
 * - Explicit Cash on Delivery (COD) mention in content
 * 
 * @param {Object} post
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validatePost(post) {
  if (!post || typeof post !== 'object') {
    return {
      isValid: false,
      error: 'Post payload is missing or invalid.'
    };
  }

  // 1. Mandatory Destination Safety Guardrails for Full Posts
  if (!post.destinations || typeof post.destinations !== 'object') {
    return {
      isValid: false,
      error: ERROR_MESSAGES.FACEBOOK_PERSONAL
    };
  }

  if (!post.destinations.facebookPage || !isValidFacebookDestination(post.destinations.facebookPage)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.FACEBOOK_PERSONAL
    };
  }

  if (!post.destinations.instagram || !isValidInstagramDestination(post.destinations.instagram)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INSTAGRAM_INVALID
    };
  }

  // 2. Strict COD Availability Flag (must be explicitly true)
  if (post.codAvailable !== true) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.COD_NOT_AVAILABLE
    };
  }

  // 3. Price Rs. 599 Validation
  const pricing = post.pricing !== undefined 
    ? post.pricing 
    : (/(?:rs\.?\s*599|599)/i.test(post.captionIg || '') 
        ? 'Rs. 599' 
        : (/(?:rs\.?\s*599|599)/i.test(post.captionFb || '') ? 'Rs. 599' : null));

  if (!pricing || !String(pricing).includes('599')) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.PRICE_INVALID
    };
  }

  // 4. Cash on Delivery (COD) Explicit Mention in Content
  const textContent = [
    post.captionIg,
    post.captionFb,
    post.caption,
    post.hook,
    Array.isArray(post.slides) ? post.slides.join(' ') : ''
  ].filter(Boolean).join(' ').toLowerCase();

  const hasCodMention = textContent.includes('cash on delivery') || /\bcod\b/i.test(textContent);

  if (!hasCodMention) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.COD_REQUIRED
    };
  }

  return { isValid: true };
}
