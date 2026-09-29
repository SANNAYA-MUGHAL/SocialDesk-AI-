import { validateDestinations } from './validator.js';

// Configuration storage for Meta credentials
let metaConfig = {
  accessToken: process.env.META_PAGE_ACCESS_TOKEN || '',
  pageId: process.env.META_PAGE_ID || '61592791861631',
  igUserId: process.env.META_IG_USER_ID || '',
  baseUrl: process.env.APP_BASE_URL || 'https://social-desk-ai.vercel.app'
};

export function getMetaConfig() {
  return {
    isConfigured: Boolean(metaConfig.accessToken),
    pageId: metaConfig.pageId,
    igUserId: metaConfig.igUserId,
    baseUrl: metaConfig.baseUrl
  };
}

export function updateMetaConfig(newConfig = {}) {
  metaConfig = {
    ...metaConfig,
    ...newConfig
  };
  return getMetaConfig();
}

/**
 * Verify Meta Graph API connection with provided or saved token
 */
export async function verifyMetaConnection(overrideConfig = {}) {
  const cfg = { ...metaConfig, ...overrideConfig };
  if (!cfg.accessToken) {
    return {
      isValid: false,
      error: 'Meta Page Access Token is missing. Please enter your token in Settings.'
    };
  }

  try {
    // Check Facebook Page Access
    const pageUrl = `https://graph.facebook.com/v19.0/${cfg.pageId}?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(cfg.accessToken)}`;
    const pageRes = await fetch(pageUrl);
    const pageData = await pageRes.json();

    if (!pageRes.ok || pageData.error) {
      return {
        isValid: false,
        error: pageData.error?.message || `Failed to verify Facebook Page (HTTP ${pageRes.status})`
      };
    }

    // Auto-detect Instagram Business Account ID if not set
    let detectedIgId = cfg.igUserId;
    if (!detectedIgId && pageData.instagram_business_account?.id) {
      detectedIgId = pageData.instagram_business_account.id;
      metaConfig.igUserId = detectedIgId;
    }

    return {
      isValid: true,
      pageName: pageData.name || 'Girlies Glow',
      pageId: pageData.id,
      igUserId: detectedIgId || 'Not connected yet',
      message: 'Connection verified with Girlies Glow Facebook Page & Instagram!'
    };
  } catch (err) {
    return {
      isValid: false,
      error: 'Network error connecting to Meta Graph API: ' + err.message
    };
  }
}

/**
 * Publish post to Meta with strict Human-in-the-Loop approval gate & safety guard
 */
export async function publishPostToMeta(post, options = {}) {
  // 1. Strict Human Approval Gate
  const allowedStatuses = ['Approved', 'Scheduled', 'Published'];
  if (!allowedStatuses.includes(post.status)) {
    throw new Error('Human Approval Required: Post must be Approved by a human before publishing live to Meta.');
  }

  // 2. Strict Destination Safety Guardrail
  const destCheck = validateDestinations(post);
  if (!destCheck.isValid) {
    throw new Error(destCheck.error || 'Destination safety check failed.');
  }

  const cfg = { ...metaConfig, ...options };
  
  // Resolve image URL (must be public absolute URL for Meta Graph API)
  const baseAppUrl = cfg.baseUrl.replace(/\/$/, '');
  const rawMedia = Array.isArray(post.media) ? post.media[0] : post.media;
  const cleanMedia = (rawMedia || '').replace(/^\/+/, '');
  const publicImageUrl = cleanMedia.startsWith('http') ? cleanMedia : `${baseAppUrl}/${cleanMedia}`;

  // If running in mock/offline mode or without live token, return verified simulated result
  if (!cfg.accessToken || cfg.mockPublish) {
    const mockFbId = `fb_live_${post.id}_${Date.now()}`;
    const mockIgId = `ig_live_${post.id}_${Date.now()}`;
    return {
      success: true,
      mode: 'mock',
      postId: post.id,
      publishedAt: new Date().toISOString(),
      facebook: {
        pageId: cfg.pageId,
        pageName: 'Girlies Glow Facebook Business Page',
        postId: mockFbId,
        url: `https://www.facebook.com/p/Girlies-Glow-${cfg.pageId}/`
      },
      instagram: {
        igAccount: '@girli_esglow',
        mediaId: mockIgId,
        url: 'https://www.instagram.com/girli_esglow/'
      }
    };
  }

  // Live Meta Graph API Calls
  const results = {
    success: true,
    mode: 'live',
    postId: post.id,
    publishedAt: new Date().toISOString(),
    facebook: null,
    instagram: null
  };

  // 3. Publish to Facebook Business Page
  try {
    const fbEndpoint = `https://graph.facebook.com/v19.0/${cfg.pageId}/photos`;
    const fbPayload = new URLSearchParams({
      url: publicImageUrl,
      caption: post.captionFb || post.captionIg || '',
      access_token: cfg.accessToken
    });

    const fbRes = await fetch(fbEndpoint, {
      method: 'POST',
      body: fbPayload
    });
    const fbData = await fbRes.json();
    if (!fbRes.ok || fbData.error) {
      throw new Error(fbData.error?.message || `Facebook publish failed (HTTP ${fbRes.status})`);
    }

    results.facebook = {
      pageId: cfg.pageId,
      postId: fbData.post_id || fbData.id,
      url: `https://www.facebook.com/p/Girlies-Glow-${cfg.pageId}/`
    };
  } catch (err) {
    throw new Error(`Facebook Page publish failed: ${err.message}`);
  }

  // 4. Publish to Instagram Professional (@girli_esglow)
  if (cfg.igUserId) {
    try {
      // Step A: Create Media Container
      const igMediaEndpoint = `https://graph.facebook.com/v19.0/${cfg.igUserId}/media`;
      const fullCaption = `${post.captionIg || ''}\n\n${Array.isArray(post.hashtags) ? post.hashtags.join(' ') : (post.hashtags || '')}`.trim();
      const containerPayload = new URLSearchParams({
        image_url: publicImageUrl,
        caption: fullCaption,
        access_token: cfg.accessToken
      });

      const containerRes = await fetch(igMediaEndpoint, {
        method: 'POST',
        body: containerPayload
      });
      const containerData = await containerRes.json();
      if (!containerRes.ok || containerData.error) {
        throw new Error(containerData.error?.message || `Instagram container creation failed`);
      }

      // Step B: Publish Container
      const publishEndpoint = `https://graph.facebook.com/v19.0/${cfg.igUserId}/media_publish`;
      const publishPayload = new URLSearchParams({
        creation_id: containerData.id,
        access_token: cfg.accessToken
      });

      const publishRes = await fetch(publishEndpoint, {
        method: 'POST',
        body: publishPayload
      });
      const publishData = await publishRes.json();
      if (!publishRes.ok || publishData.error) {
        throw new Error(publishData.error?.message || `Instagram media publish failed`);
      }

      results.instagram = {
        igUserId: cfg.igUserId,
        mediaId: publishData.id,
        url: 'https://www.instagram.com/girli_esglow/'
      };
    } catch (err) {
      // If Instagram fails, record error but keep Facebook publish
      results.instagramError = err.message;
    }
  }

  return results;
}
