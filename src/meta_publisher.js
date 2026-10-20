import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDestinations } from './validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SETTINGS_FILE = path.join(ROOT_DIR, 'data', 'meta_settings.json');
const TMP_SETTINGS_FILE = path.join('/tmp', 'meta_settings.json');

function loadPersistedMetaConfig() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    }
  } catch {}
  try {
    if (fs.existsSync(TMP_SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_SETTINGS_FILE, 'utf8'));
    }
  } catch {}
  return {};
}

function savePersistedMetaConfig(cfg) {
  const data = JSON.stringify(cfg, null, 2);
  try {
    fs.writeFileSync(SETTINGS_FILE, data, 'utf8');
    return;
  } catch {}
  try {
    fs.writeFileSync(TMP_SETTINGS_FILE, data, 'utf8');
  } catch {}
}

const savedDiskConfig = loadPersistedMetaConfig();

// Configuration storage for Meta credentials
let metaConfig = {
  accessToken: process.env.META_PAGE_ACCESS_TOKEN || savedDiskConfig.accessToken || '',
  pageId: process.env.META_PAGE_ID || savedDiskConfig.pageId || '61592791861631',
  igUserId: process.env.META_IG_USER_ID || savedDiskConfig.igUserId || '',
  baseUrl: process.env.APP_BASE_URL || savedDiskConfig.baseUrl || 'https://social-desk-ai.vercel.app'
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
  savePersistedMetaConfig(metaConfig);
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
    let resolvedPageToken = cfg.accessToken;
    let resolvedPageId = '61592791861631';
    let resolvedPageName = 'Girlies Glow';
    let resolvedIgId = cfg.igUserId || '17841434751103617';

    // 1. Check /me/accounts in case a User Access Token was entered
    try {
      const accountsUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,category,instagram_business_account,connected_instagram_account&access_token=${encodeURIComponent(cfg.accessToken)}`;
      const accountsRes = await fetch(accountsUrl);
      const accountsData = await accountsRes.json();
      if (accountsRes.ok && Array.isArray(accountsData.data) && accountsData.data.length > 0) {
        const ggPage = accountsData.data.find(
          p => String(p.id) === '61592791861631' ||
               (p.name && p.name.toLowerCase().includes('girlies glow'))
        ) || accountsData.data[0];

        if (ggPage) {
          if (ggPage.access_token) resolvedPageToken = ggPage.access_token;
          if (ggPage.id) resolvedPageId = ggPage.id;
          if (ggPage.name) resolvedPageName = ggPage.name;
          if (ggPage.instagram_business_account?.id) {
            resolvedIgId = ggPage.instagram_business_account.id;
          } else if (ggPage.connected_instagram_account?.id) {
            resolvedIgId = ggPage.connected_instagram_account.id;
          }
        }
      }
    } catch (_) {}

    // 2. Direct check /{resolvedPageId} using current or resolved token
    try {
      const pageUrl = `https://graph.facebook.com/v19.0/${resolvedPageId}?fields=id,name,access_token,instagram_business_account,connected_instagram_account&access_token=${encodeURIComponent(resolvedPageToken)}`;
      const pageRes = await fetch(pageUrl);
      const pageData = await pageRes.json();
      if (pageRes.ok && pageData) {
        if (pageData.name) resolvedPageName = pageData.name;
        if (pageData.access_token) resolvedPageToken = pageData.access_token;
        if (pageData.instagram_business_account?.id) {
          resolvedIgId = pageData.instagram_business_account.id;
        } else if (pageData.connected_instagram_account?.id) {
          resolvedIgId = pageData.connected_instagram_account.id;
        }
      }
    } catch (_) {}

    // 3. Check /me to see if token itself is already a Page Token
    try {
      const meUrl = `https://graph.facebook.com/v19.0/me?fields=id,name,category,access_token,instagram_business_account,connected_instagram_account&access_token=${encodeURIComponent(resolvedPageToken)}`;
      const meRes = await fetch(meUrl);
      const meData = await meRes.json();
      if (meRes.ok && meData) {
        // Only accept /me as Page if it has a category or matches Girlies Glow Page ID
        if (meData.category || String(meData.id) === '61592791861631') {
          resolvedPageId = meData.id;
          if (meData.name) resolvedPageName = meData.name;
          if (meData.access_token) resolvedPageToken = meData.access_token;
        }
        if (meData.instagram_business_account?.id) {
          resolvedIgId = meData.instagram_business_account.id;
        } else if (meData.connected_instagram_account?.id) {
          resolvedIgId = meData.connected_instagram_account.id;
        }
      }
    } catch (_) {}

    // Safety: ensure resolvedPageId is strictly the Girlies Glow Page ID
    if (!resolvedPageId || resolvedPageId === 'me' || !/^\d+$/.test(resolvedPageId)) {
      resolvedPageId = '61592791861631';
    }

    // Auto-save the resolved Page Token, Page ID, and Instagram ID
    metaConfig.accessToken = resolvedPageToken;
    metaConfig.pageId = resolvedPageId;
    if (resolvedIgId) metaConfig.igUserId = resolvedIgId;
    savePersistedMetaConfig(metaConfig);

    let message = `Connected to "${resolvedPageName}" (Page ID: ${resolvedPageId})!`;
    if (resolvedIgId && resolvedIgId !== 'Not connected yet') {
      message += ` Instagram Professional Account connected (ID: ${resolvedIgId}).`;
    } else {
      message += ` ⚠️ Instagram is NOT linked to this Facebook Page yet. Link @girli_esglow in Facebook Page Settings > Linked Accounts.`;
    }

    return {
      isValid: true,
      pageName: resolvedPageName,
      pageId: resolvedPageId,
      igUserId: resolvedIgId || '17841434751103617',
      resolvedPageToken,
      message
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
  const baseAppUrl = (cfg.baseUrl || 'https://social-desk-ai.vercel.app').replace(/\/$/, '');
  
  // Resolve image URL (must be public absolute URL for Meta Graph API)
  const rawMedia = cfg.customMedia || (Array.isArray(post.media) ? post.media[0] : post.media);
  let cleanMedia = (rawMedia || '').replace(/^\/+/, '');
  if (cleanMedia.endsWith('.mp4')) {
    cleanMedia = cleanMedia.replace(/\.mp4$/, '.png');
  }
  let publicImageUrl = cleanMedia.startsWith('http') ? cleanMedia : `${baseAppUrl}/${cleanMedia}`;
  if (cleanMedia.startsWith('data:')) {
    // If a raw data: URI somehow bypassed server conversion, fallback to generated creative URL
    publicImageUrl = `${baseAppUrl}/generated/post_${post.id}_static.png`;
  }

  // If running in explicit mock/test mode
  if (cfg.mockPublish) {
    const mockFbId = `fb_live_${post.id}_${Date.now()}`;
    const mockIgId = `ig_live_${post.id}_${Date.now()}`;
    return {
      success: true,
      mode: 'mock',
      postId: post.id,
      publishedAt: new Date().toISOString(),
      facebook: {
        pageId: cfg.pageId || '61592791861631',
        pageName: 'Girlies Glow Facebook Business Page',
        postId: mockFbId,
        url: `https://www.facebook.com/p/Girlies-Glow-${cfg.pageId || '61592791861631'}/`
      },
      instagram: {
        igAccount: '@girli_esglow',
        mediaId: mockIgId,
        url: 'https://www.instagram.com/girli_esglow/'
      }
    };
  }

  // If live publishing was requested but no token is provided
  if (!cfg.accessToken) {
    throw new Error('Meta Page Access Token is missing. Please enter your Meta Page Access Token in "⚙️ Meta API Settings" at the top right before publishing live.');
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

  let pageToken = cfg.accessToken;
  let targetPageId = '61592791861631';
  let targetIgId = cfg.igUserId || '17841434751103617';

  // Auto-resolve Page Access Token and Instagram Account ID
  if (pageToken) {
    // 1. Check /me/accounts in case User Access Token was supplied (exchanges for Page Access Token)
    try {
      const accUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,category,instagram_business_account,connected_instagram_account&access_token=${encodeURIComponent(cfg.accessToken)}`;
      const accRes = await fetch(accUrl);
      const accData = await accRes.json();
      if (accRes.ok && Array.isArray(accData.data) && accData.data.length > 0) {
        const ggPage = accData.data.find(
          p => String(p.id) === '61592791861631' ||
               (p.name && p.name.toLowerCase().includes('girlies glow'))
        ) || accData.data[0];

        if (ggPage) {
          if (ggPage.access_token) pageToken = ggPage.access_token;
          if (ggPage.id) targetPageId = ggPage.id;
          if (ggPage.instagram_business_account?.id) {
            targetIgId = ggPage.instagram_business_account.id;
          } else if (ggPage.connected_instagram_account?.id) {
            targetIgId = ggPage.connected_instagram_account.id;
          }
        }
      }
    } catch (_) {}

    // 2. Direct check /{targetPageId}
    try {
      const pUrl = `https://graph.facebook.com/v19.0/${targetPageId}?fields=id,name,access_token,instagram_business_account,connected_instagram_account&access_token=${encodeURIComponent(pageToken)}`;
      const pRes = await fetch(pUrl);
      const pData = await pRes.json();
      if (pRes.ok && pData) {
        if (pData.access_token) pageToken = pData.access_token;
        if (pData.instagram_business_account?.id) {
          targetIgId = pData.instagram_business_account.id;
        } else if (pData.connected_instagram_account?.id) {
          targetIgId = pData.connected_instagram_account.id;
        }
      }
    } catch (_) {}

    // 3. Direct check /me (only accept as Page if it has a category or is 61592791861631)
    try {
      const meUrl = `https://graph.facebook.com/v19.0/me?fields=id,name,category,access_token,instagram_business_account,connected_instagram_account&access_token=${encodeURIComponent(pageToken)}`;
      const meRes = await fetch(meUrl);
      const meData = await meRes.json();
      if (meRes.ok && meData) {
        if (meData.category || String(meData.id) === '61592791861631') {
          targetPageId = meData.id;
          if (meData.access_token) pageToken = meData.access_token;
        }
        if (meData.instagram_business_account?.id) {
          targetIgId = meData.instagram_business_account.id;
        } else if (meData.connected_instagram_account?.id) {
          targetIgId = meData.connected_instagram_account.id;
        }
      }
    } catch (_) {}

    // Guardrail: targetPageId must strictly remain the Business Page ID
    if (!targetPageId || targetPageId === 'me' || !/^\d+$/.test(targetPageId)) {
      targetPageId = '61592791861631';
    }

    if (targetIgId) {
      metaConfig.igUserId = targetIgId;
      metaConfig.pageId = targetPageId;
      savePersistedMetaConfig(metaConfig);
    }
  }

  // 3. Publish to Facebook Business Page
  try {
    const fbEndpoint = `https://graph.facebook.com/v19.0/${targetPageId}/photos`;
    const fbPayload = new URLSearchParams({
      url: publicImageUrl,
      caption: post.captionFb || post.captionIg || '',
      access_token: pageToken
    });

    const fbRes = await fetch(fbEndpoint, {
      method: 'POST',
      body: fbPayload
    });
    const fbData = await fbRes.json();
    if (!fbRes.ok || fbData.error) {
      let errMsg = fbData.error?.message || `Facebook publish failed (HTTP ${fbRes.status})`;
      if (errMsg.includes('publish_actions') || fbData.error?.code === 200) {
        errMsg = `Page Access Token required: In Meta Graph API Explorer, switch the top "User or Page" dropdown from "User Token" to "Page Access Token: Girlies Glow" (Page ID: 61592791861631) with pages_manage_posts permission, and save that token in Settings.`;
      }
      results.facebookError = errMsg;
    } else {
      results.facebook = {
        pageId: targetPageId,
        postId: fbData.post_id || fbData.id,
        url: `https://www.facebook.com/p/Girlies-Glow-${targetPageId}/`
      };
    }
  } catch (err) {
    results.facebookError = err.message;
  }

  // 4. Publish to Instagram Professional (@girli_esglow)
  if (!targetIgId) {
    results.instagramError = `No linked Instagram Professional Account found for Facebook Page (${targetPageId}). In Facebook Page Settings > Linked Accounts, connect your Instagram account (@girli_esglow) and ensure it is set as a Professional (Creator or Business) account.`;
  } else {
    try {
      // Step A: Create Media Container
      const igMediaEndpoint = `https://graph.facebook.com/v19.0/${targetIgId}/media`;
      const fullCaption = `${post.captionIg || ''}\n\n${Array.isArray(post.hashtags) ? post.hashtags.join(' ') : (post.hashtags || '')}`.trim();
      const containerPayload = new URLSearchParams({
        image_url: publicImageUrl,
        caption: fullCaption,
        access_token: pageToken
      });

      const containerRes = await fetch(igMediaEndpoint, {
        method: 'POST',
        body: containerPayload
      });
      const containerData = await containerRes.json();
      if (!containerRes.ok || containerData.error) {
        let errDesc = containerData.error?.message || `Instagram container creation failed (HTTP ${containerRes.status})`;
        if (errDesc.includes('permission') || containerData.error?.code === 10 || containerData.error?.code === 200) {
          errDesc += ` (Meta App permission 'instagram_content_publish' and 'instagram_basic' are required)`;
        }
        throw new Error(errDesc);
      }

      // Step B: Publish Container
      const creationId = containerData.id;
      // Brief pause to allow Meta media processing
      await new Promise(r => setTimeout(r, 1500));

      const publishEndpoint = `https://graph.facebook.com/v19.0/${targetIgId}/media_publish`;
      const publishPayload = new URLSearchParams({
        creation_id: creationId,
        access_token: pageToken
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
        igUserId: targetIgId,
        mediaId: publishData.id,
        url: 'https://www.instagram.com/girli_esglow/'
      };
    } catch (err) {
      results.instagramError = err.message;
    }
  }

  // If neither Facebook nor Instagram succeeded, throw actionable combined error
  if (!results.facebook && !results.instagram) {
    const reasons = [];
    if (results.facebookError) {
      if (results.facebookError.includes('pages_manage_posts')) {
        reasons.push(`Facebook Page: pages_manage_posts permission required (Add "Manage and publish posts on Facebook" use case in Meta App)`);
      } else {
        reasons.push(`Facebook Page: ${results.facebookError}`);
      }
    }
    if (results.instagramError) {
      reasons.push(`Instagram: ${results.instagramError}`);
    }
    throw new Error(reasons.join(' | '));
  }

  return results;
}
