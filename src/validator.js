/**
 * Girlies Glow Social Media Content Scheduler - Destination Safety Guardrails
 * 
 * Enforces zero personal profile publishing and destination safety for:
 * - Facebook: Girlies Glow Facebook Business Page (ID: 61592791861631)
 * - Instagram: @girli_esglow
 * Also validates mandatory Cash on Delivery (COD) terms on conversion posts.
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
  COD_NOT_AVAILABLE: 'Cash on Delivery (COD) must be enabled.',
};

/**
 * Validates whether a Facebook destination refers to the verified Girlies Glow Business Page.
 * Strictly blocks personal profiles (e.g., Sannaya Mughal) and any non-business page destinations.
 * 
 * @param {string} fb - Facebook destination string (name, ID, or URL)
 * @returns {boolean}
 */
export function isValidFacebookDestination(fb) {
  if (typeof fb !== 'string') return false;
  const trimmed = fb.trim();
  const lower = trimmed.toLowerCase();

  // Strict check: personal profile indicators
  if (lower.includes('personal') || lower.includes('sannaya')) {
    return false;
  }

  // Exact canonical business page matches
  if (trimmed === OFFICIAL_FACEBOOK_PAGE_NAME) return true;
  if (trimmed === OFFICIAL_FACEBOOK_PAGE_ID) return true;
  if (trimmed === OFFICIAL_FACEBOOK_PAGE_URL) return true;

  // Normalized URL or ID match
  if (lower.includes(OFFICIAL_FACEBOOK_PAGE_ID)) return true;

  // Verified business page name variations
  if (lower.includes('girlies glow') && (lower.includes('business') || lower.includes('page') || lower.includes('facebook'))) {
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
 * - Verified Facebook & Instagram destinations
 * - Explicit Cash on Delivery (COD) mention in content
 * - codAvailable flag enabled
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

  // 1. Destination Safety Guardrails
  const destResult = validateDestinations(post);
  if (!destResult.isValid) {
    return destResult;
  }

  // 2. COD Availability Flag
  if (post.codAvailable === false) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.COD_NOT_AVAILABLE
    };
  }

  // 3. Cash on Delivery (COD) Mention in Content
  const textContent = [
    post.captionIg,
    post.captionFb,
    post.caption,
    post.hook,
    Array.isArray(post.slides) ? post.slides.join(' ') : ''
  ].filter(Boolean).join(' ').toLowerCase();

  const hasCodMention = textContent.includes('cash on delivery') || /\bcod\b/i.test(textContent);

  if (post.captionIg || post.captionFb || post.caption || post.codAvailable) {
    if (!hasCodMention) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.COD_REQUIRED
      };
    }
  }

  return { isValid: true };
}
