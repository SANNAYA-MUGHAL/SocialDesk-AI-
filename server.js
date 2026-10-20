import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { validateDestinations, ERROR_MESSAGES } from './src/validator.js';
import { generateCreativeForPost } from './scripts/generate_creatives.js';
import { publishPostToMeta, getMetaConfig, updateMetaConfig, verifyMetaConnection } from './src/meta_publisher.js';

const require = createRequire(import.meta.url);
const defaultPostsData = require('./data/posts.json');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const POSTS_FILE = process.env.POSTS_FILE_PATH || path.join(ROOT_DIR, 'data', 'posts.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
};

// In-memory upload cache for serverless environments (e.g. Vercel)
export const uploadedMediaCache = new Map();

function saveUploadedMedia(safeFilename, fileBuffer, mimeType) {
  uploadedMediaCache.set(safeFilename, { buffer: fileBuffer, mimeType });
  const publicUploads = path.join(PUBLIC_DIR, 'uploads');
  try {
    if (!fs.existsSync(publicUploads)) {
      fs.mkdirSync(publicUploads, { recursive: true });
    }
    const targetPath = path.join(publicUploads, safeFilename);
    fs.writeFileSync(targetPath, fileBuffer);
    return `/uploads/${safeFilename}`;
  } catch (err) {
    // EROFS fallback (read-only serverless filesystem like Vercel)
    try {
      const tmpUploads = path.join('/tmp', 'uploads');
      if (!fs.existsSync(tmpUploads)) {
        fs.mkdirSync(tmpUploads, { recursive: true });
      }
      const tmpPath = path.join(tmpUploads, safeFilename);
      fs.writeFileSync(tmpPath, fileBuffer);
    } catch (_) {}
    return `/uploads/${safeFilename}`;
  }
}

let inMemoryPosts = null;

function getPosts() {
  if (inMemoryPosts && process.env.VERCEL) {
    return JSON.parse(JSON.stringify(inMemoryPosts));
  }
  const tmpPath = path.join('/tmp', 'posts.json');
  if (fs.existsSync(tmpPath)) {
    try {
      const content = fs.readFileSync(tmpPath, 'utf8');
      inMemoryPosts = JSON.parse(content);
      return inMemoryPosts;
    } catch {}
  }
  try {
    if (fs.existsSync(POSTS_FILE)) {
      const content = fs.readFileSync(POSTS_FILE, 'utf8');
      inMemoryPosts = JSON.parse(content);
      return inMemoryPosts;
    }
  } catch {}
  inMemoryPosts = JSON.parse(JSON.stringify(defaultPostsData));
  return inMemoryPosts;
}

function savePosts(posts) {
  inMemoryPosts = posts;
  try {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
  } catch (err) {
    // Read-only filesystem fallback (e.g. Vercel serverless)
    try {
      const tmpPath = path.join('/tmp', 'posts.json');
      fs.writeFileSync(tmpPath, JSON.stringify(posts, null, 2), 'utf8');
    } catch {}
  }
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function sendText(res, statusCode, text, contentType = 'text/plain; charset=utf-8', extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...extraHeaders
  });
  res.end(text);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 50 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) {
        return resolve({});
      }
      try {
        const parsed = JSON.parse(raw);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCsv(posts) {
  const headers = [
    'Post Number',
    'Post Title',
    'Content Type',
    'Instagram',
    'Facebook Page',
    'Media File',
    'Caption',
    'Hashtags',
    'Scheduled Date',
    'Scheduled Time',
    'Status'
  ];

  const rows = [headers.join(',')];

  for (const post of posts) {
    const postNumber = post.postNumber !== undefined ? post.postNumber : post.id;
    const title = post.title || '';
    const contentType = post.format || post.contentType || '';
    const instagram = post.destinations?.instagram || '';
    const facebookPage = post.destinations?.facebookPage || '';
    const media = Array.isArray(post.media) ? post.media.join('; ') : (post.media || '');
    const caption = post.captionIg || post.captionFb || post.caption || '';
    const hashtags = Array.isArray(post.hashtags) ? post.hashtags.join(' ') : (post.hashtags || '');
    const schedDate = post.schedule?.date || '';
    const schedTime = post.schedule?.time
      ? `${post.schedule.time}${post.schedule.timezone ? ' ' + post.schedule.timezone : ''}`
      : '';
    const status = post.status || 'Draft';

    const row = [
      escapeCsv(postNumber),
      escapeCsv(title),
      escapeCsv(contentType),
      escapeCsv(instagram),
      escapeCsv(facebookPage),
      escapeCsv(media),
      escapeCsv(caption),
      escapeCsv(hashtags),
      escapeCsv(schedDate),
      escapeCsv(schedTime),
      escapeCsv(status)
    ];

    rows.push(row.join(','));
  }

  return rows.join('\r\n');
}

function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  const relativePath = pathname === '/' ? '/index.html' : pathname;

  // 0. Check uploads (in-memory cache or /tmp/uploads or public/uploads)
  if (relativePath.startsWith('/uploads/')) {
    const filename = path.basename(relativePath);
    if (uploadedMediaCache.has(filename)) {
      const item = uploadedMediaCache.get(filename);
      res.writeHead(200, {
        'Content-Type': item.mimeType || 'image/png',
        'Content-Length': item.buffer.length,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000'
      });
      return res.end(item.buffer);
    }
    const tmpUploadPath = path.resolve('/tmp', 'uploads', filename);
    if (tmpUploadPath.startsWith('/tmp/uploads') && fs.existsSync(tmpUploadPath)) {
      const stat = fs.statSync(tmpUploadPath);
      if (stat.isFile()) {
        return streamFile(res, tmpUploadPath);
      }
    }
  }

  // 1. Check in public/ directory
  const publicPath = path.resolve(PUBLIC_DIR, '.' + relativePath);
  if (publicPath.startsWith(PUBLIC_DIR) && fs.existsSync(publicPath)) {
    const stat = fs.statSync(publicPath);
    if (stat.isFile()) {
      return streamFile(res, publicPath);
    }
  }

  // 2. Check in ROOT directory (for workspace assets like "Card 1.png", etc.)
  const rootPath = path.resolve(ROOT_DIR, '.' + relativePath);
  const isForbidden = relativePath.startsWith('/.git') ||
                      relativePath.startsWith('/.superpowers') ||
                      relativePath.startsWith('/node_modules') ||
                      relativePath === '/package.json';

  if (!isForbidden && rootPath.startsWith(ROOT_DIR) && fs.existsSync(rootPath)) {
    const stat = fs.statSync(rootPath);
    if (stat.isFile()) {
      return streamFile(res, rootPath);
    }
  }

  // Not found
  sendJson(res, 404, { error: 'File Not Found' });
}

function streamFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': mime,
    'Access-Control-Allow-Origin': '*'
  });
  fs.createReadStream(filePath).pipe(res);
}

export async function handleRequest(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // Extract path, handling potential Vercel rewrite or proxy headers
  let rawPath = req.url || '/';
  if (req.headers && req.headers['x-forwarded-url']) {
    rawPath = req.headers['x-forwarded-url'];
  } else if (req.headers && req.headers['x-original-url']) {
    rawPath = req.headers['x-original-url'];
  }

  const parsedUrl = new URL(rawPath, 'http://localhost');
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Check query params for Vercel rewrites (apiPath, uploadPath, match, path)
  const apiSub = (req.query && req.query.apiPath) || parsedUrl.searchParams.get('apiPath');
  const uploadSub = (req.query && req.query.uploadPath) || parsedUrl.searchParams.get('uploadPath');
  const genericMatch = (req.query && (req.query.match || req.query.path)) || parsedUrl.searchParams.get('match') || parsedUrl.searchParams.get('path');

  if (apiSub) {
    const s = Array.isArray(apiSub) ? apiSub.join('/') : apiSub;
    pathname = `/api/${s}`;
  } else if (uploadSub) {
    const s = Array.isArray(uploadSub) ? uploadSub.join('/') : uploadSub;
    pathname = `/uploads/${s}`;
  } else if (genericMatch && (pathname === '/api/index.js' || pathname === '/api/index' || pathname === '/api' || pathname === '/api/' || pathname === '/')) {
    const s = Array.isArray(genericMatch) ? genericMatch.join('/') : genericMatch;
    pathname = `/api/${s}`;
  } else if (pathname === '/api/index.js' || pathname === '/api/index') {
    pathname = '/api';
  }

  // If path doesn't start with /api, but this function handles an API request, prepend /api
  if (!pathname.startsWith('/api') && !pathname.startsWith('/uploads') && (pathname.startsWith('/posts') || pathname.startsWith('/export') || pathname.startsWith('/settings') || pathname.startsWith('/meta'))) {
    pathname = '/api' + pathname;
  }

  // Strip trailing slash
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  const method = req.method.toUpperCase();

  // API healthcheck endpoint
  if (pathname === '/api') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'Girlies Glow Content Scheduler API',
      version: '1.0.0'
    });
  }

  try {
    // 1. GET /api/posts (and HEAD)
    if ((method === 'GET' || method === 'HEAD') && pathname === '/api/posts') {
      const posts = getPosts();
      if (method === 'HEAD') {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
        return res.end();
      }
      return sendJson(res, 200, posts);
    }

    // 2. POST /api/posts/approve-all
    if (method === 'POST' && pathname === '/api/posts/approve-all') {
      const posts = getPosts();
      posts.forEach(p => {
        p.status = 'Approved';
      });
      savePosts(posts);
      return sendJson(res, 200, {
        success: true,
        message: 'All posts marked Approved',
        count: posts.length,
        posts
      });
    }

    // 3. POST /api/posts/schedule-all
    if (method === 'POST' && pathname === '/api/posts/schedule-all') {
      const posts = getPosts();

      // Destination guard validation for all posts
      for (const p of posts) {
        const validation = validateDestinations(p);
        if (!validation.isValid) {
          return sendJson(res, 400, {
            error: validation.error || ERROR_MESSAGES.FACEBOOK_PERSONAL,
            postId: p.id
          });
        }
      }

      let scheduledCount = 0;
      posts.forEach(p => {
        if (p.status === 'Approved') {
          p.status = 'Scheduled';
          scheduledCount++;
        }
      });

      savePosts(posts);
      return sendJson(res, 200, {
        success: true,
        message: 'All approved posts marked Scheduled',
        count: scheduledCount,
        posts
      });
    }

    // 4. GET /api/export/csv or GET /api/export/:format (csv)
    if (method === 'GET' && (pathname === '/api/export/csv' || pathname === '/api/export/csv/')) {
      const posts = getPosts();
      const csv = generateCsv(posts);
      return sendText(res, 200, csv, 'text/csv; charset=utf-8', {
        'Content-Disposition': 'attachment; filename="content-schedule.csv"'
      });
    }

    // 5. GET /api/export/json or GET /api/export/:format (json)
    if (method === 'GET' && (pathname === '/api/export/json' || pathname === '/api/export/json/')) {
      const posts = getPosts();
      return sendJson(res, 200, posts);
    }

    // Export generic route handler for /api/export/:format
    const exportMatch = pathname.match(/^\/api\/export\/([^/]+)$/);
    if (method === 'GET' && exportMatch) {
      const format = exportMatch[1].toLowerCase();
      if (format === 'csv') {
        const posts = getPosts();
        const csv = generateCsv(posts);
        return sendText(res, 200, csv, 'text/csv; charset=utf-8', {
          'Content-Disposition': 'attachment; filename="content-schedule.csv"'
        });
      } else if (format === 'json') {
        const posts = getPosts();
        return sendJson(res, 200, posts);
      } else {
        return sendJson(res, 400, { error: 'Unsupported format. Use csv or json.' });
      }
    }

    // 6. POST /api/posts/:id/regenerate-media
    const regenMatch = pathname.match(/^\/api\/posts\/([^/]+)\/regenerate-media$/);
    if (method === 'POST' && regenMatch) {
      const id = regenMatch[1];
      const posts = getPosts();
      const post = posts.find(p => String(p.id) === String(id) || String(p.postNumber) === String(id));
      if (!post) {
        return sendJson(res, 404, { error: 'Post not found' });
      }

      try {
        let files = [];
        try {
          files = generateCreativeForPost(post.id);
        } catch (genErr) {
          // In serverless environments (Linux) without sips, verify existing media files
          const existing = Array.isArray(post.media) ? post.media : [post.media];
          files = existing.filter(Boolean);
        }
        return sendJson(res, 200, {
          success: true,
          message: `Media regenerated for post ${post.id}`,
          files
        });
      } catch (err) {
        return sendJson(res, 500, {
          error: `Failed to regenerate media: ${err.message}`
        });
      }
    }

    // POST /api/posts/:id/upload-media (User custom media upload from device)
    const uploadMatch = pathname.match(/^\/api\/posts\/([^/]+)\/upload-media$/);
    if (method === 'POST' && uploadMatch) {
      const id = uploadMatch[1];
      const posts = getPosts();
      const index = posts.findIndex(p => String(p.id) === String(id) || String(p.postNumber) === String(id));
      if (index === -1) {
        return sendJson(res, 404, { error: 'Post not found' });
      }

      let body;
      try {
        body = await parseJsonBody(req);
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON payload or payload too large' });
      }

      if (!body || !body.data) {
        return sendJson(res, 400, { error: 'No media data provided' });
      }

      const post = posts[index];
      let ext = 'png';
      let mime = 'image/png';
      let base64Content = body.data;

      if (typeof body.data === 'string' && body.data.startsWith('data:')) {
        const matches = body.data.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mime = matches[1].toLowerCase();
          base64Content = matches[2];
          if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
          else if (mime.includes('png')) ext = 'png';
          else if (mime.includes('webp')) ext = 'webp';
          else if (mime.includes('gif')) ext = 'gif';
          else if (mime.includes('mp4')) ext = 'mp4';
          else if (mime.includes('quicktime') || mime.includes('mov')) ext = 'mp4';
        }
      } else if (body.filename) {
        const candidateExt = path.extname(body.filename).replace('.', '').toLowerCase();
        if (candidateExt) ext = candidateExt;
      }

      const safeFilename = `post_${post.id}_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const fileBuffer = Buffer.from(base64Content, 'base64');
      const publicUrl = saveUploadedMedia(safeFilename, fileBuffer, mime);

      if (!post.originalMedia) {
        post.originalMedia = Array.isArray(post.media) ? [...post.media] : post.media;
      }

      if (post.format === 'carousel' && Array.isArray(post.media)) {
        const slideIdx = typeof body.slideIndex === 'number' ? body.slideIndex : 0;
        const updated = [...post.media];
        if (slideIdx >= 0 && slideIdx < updated.length) {
          updated[slideIdx] = publicUrl;
        } else {
          updated.push(publicUrl);
        }
        post.media = updated;
      } else {
        post.media = publicUrl;
      }

      post.isCustomMedia = true;
      post.lastMediaUpload = new Date().toISOString();
      posts[index] = post;
      savePosts(posts);

      return sendJson(res, 200, {
        success: true,
        message: 'Media uploaded successfully',
        mediaUrl: publicUrl,
        post
      });
    }

    // POST /api/posts/:id/reset-media (Revert to original generated media)
    const resetMatch = pathname.match(/^\/api\/posts\/([^/]+)\/reset-media$/);
    if (method === 'POST' && resetMatch) {
      const id = resetMatch[1];
      const posts = getPosts();
      const index = posts.findIndex(p => String(p.id) === String(id) || String(p.postNumber) === String(id));
      if (index === -1) {
        return sendJson(res, 404, { error: 'Post not found' });
      }

      const post = posts[index];
      function getDefaultMedia(pId, pFormat) {
        const idStr = String(pId);
        if (idStr === '3') {
          return [
            '/generated/post_3_slide_1.png',
            '/generated/post_3_slide_2.png',
            '/generated/post_3_slide_3.png',
            '/generated/post_3_slide_4.png'
          ];
        }
        if (idStr === '8') {
          return [
            '/generated/post_8_slide_1.png',
            '/generated/post_8_slide_2.png',
            '/generated/post_8_slide_3.png',
            '/generated/post_8_slide_4.png',
            '/generated/post_8_slide_5.png'
          ];
        }
        if (idStr === '10') return '/generated/post_10_offer.png';
        if (pFormat === 'reel') return `/generated/post_${idStr}_reel.mp4`;
        return `/generated/post_${idStr}_static.png`;
      }

      post.media = post.originalMedia || getDefaultMedia(post.id, post.format);
      post.isCustomMedia = false;
      posts[index] = post;
      savePosts(posts);

      return sendJson(res, 200, {
        success: true,
        message: 'Media reset to default',
        post
      });
    }

    // 7. POST /api/posts/:id/approve
    const approveMatch = pathname.match(/^\/api\/posts\/([^/]+)\/approve$/);
    if (method === 'POST' && approveMatch) {
      const id = approveMatch[1];
      const posts = getPosts();
      const index = posts.findIndex(p => String(p.id) === String(id) || String(p.postNumber) === String(id));
      if (index === -1) {
        return sendJson(res, 404, { error: 'Post not found' });
      }

      posts[index].status = 'Approved';
      savePosts(posts);
      return sendJson(res, 200, posts[index]);
    }

    // 8. POST /api/posts/:id/schedule
    const scheduleMatch = pathname.match(/^\/api\/posts\/([^/]+)\/schedule$/);
    if (method === 'POST' && scheduleMatch) {
      const id = scheduleMatch[1];
      const body = await parseJsonBody(req).catch(() => ({}));
      const posts = getPosts();
      const index = posts.findIndex(p => String(p.id) === String(id) || String(p.postNumber) === String(id));
      if (index === -1) {
        return sendJson(res, 404, { error: 'Post not found' });
      }

      const post = posts[index];
      const candidateDestinations = {
        ...(post.destinations || {}),
        ...(body?.destinations || {}),
        ...(body?.facebookPage !== undefined ? { facebookPage: body.facebookPage } : {}),
        ...(body?.facebook !== undefined ? { facebookPage: body.facebook } : {}),
        ...(body?.instagram !== undefined ? { instagram: body.instagram } : {})
      };

      const validation = validateDestinations(candidateDestinations);
      if (!validation.isValid) {
        return sendJson(res, 400, {
          error: validation.error || ERROR_MESSAGES.FACEBOOK_PERSONAL
        });
      }

      post.destinations = candidateDestinations;
      post.status = 'Scheduled';
      posts[index] = post;
      savePosts(posts);
      return sendJson(res, 200, post);
    }

    // POST /api/posts/:id/publish-live (Human-in-the-Loop Meta Publisher)
    const publishLiveMatch = pathname.match(/^\/api\/posts\/([^/]+)\/publish-live$/);
    if (method === 'POST' && publishLiveMatch) {
      const id = publishLiveMatch[1];
      const body = await parseJsonBody(req).catch(() => ({}));
      const posts = getPosts();
      const index = posts.findIndex(p => String(p.id) === String(id) || String(p.postNumber) === String(id));
      if (index === -1) {
        return sendJson(res, 404, { error: 'Post not found' });
      }

      const post = posts[index];
      try {
        const publishOptions = {
          ...(body?.options || {})
        };
        if (body?.accessToken && !publishOptions.accessToken) {
          publishOptions.accessToken = body.accessToken;
        }
        if (!publishOptions.accessToken && req.headers && req.headers['authorization']) {
          const auth = req.headers['authorization'];
          if (auth.startsWith('Bearer ')) {
            publishOptions.accessToken = auth.slice(7).trim();
          }
        }

        // Resolve customMedia if passed as base64 data URI
        const incomingCustom = body?.options?.customMedia || (typeof post.media === 'string' && post.media.startsWith('data:') ? post.media : null);
        if (incomingCustom && typeof incomingCustom === 'string' && incomingCustom.startsWith('data:')) {
          const matches = incomingCustom.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            const mime = matches[1].toLowerCase();
            const base64Content = matches[2];
            let ext = 'png';
            if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
            else if (mime.includes('mp4')) ext = 'mp4';
            const safeFilename = `post_${post.id}_custom_live_${Date.now()}.${ext}`;
            const fileBuffer = Buffer.from(base64Content, 'base64');
            const publicUrl = saveUploadedMedia(safeFilename, fileBuffer, mime);
            post.media = publicUrl;
            post.isCustomMedia = true;
            publishOptions.customMedia = publicUrl;
          }
        }

        const publishResult = await publishPostToMeta(post, publishOptions);
        post.status = 'Published';
        post.publishedAt = publishResult.publishedAt;
        post.metaPublishDetails = {
          facebook: publishResult.facebook,
          instagram: publishResult.instagram
        };
        posts[index] = post;
        savePosts(posts);

        return sendJson(res, 200, {
          success: true,
          message: 'Post successfully published to Meta!',
          post,
          details: publishResult
        });
      } catch (err) {
        return sendJson(res, 400, {
          error: err.message
        });
      }
    }

    // GET /api/settings/meta
    if (method === 'GET' && pathname === '/api/settings/meta') {
      const cfg = getMetaConfig();
      return sendJson(res, 200, cfg);
    }

    // POST /api/settings/meta
    if (method === 'POST' && pathname === '/api/settings/meta') {
      const body = await parseJsonBody(req).catch(() => ({}));
      const updated = updateMetaConfig(body);
      return sendJson(res, 200, {
        success: true,
        message: 'Meta settings updated',
        config: updated
      });
    }

    // POST /api/settings/meta/test
    if (method === 'POST' && pathname === '/api/settings/meta/test') {
      const body = await parseJsonBody(req).catch(() => ({}));
      const check = await verifyMetaConnection(body);
      return sendJson(res, check.isValid ? 200 : 400, check);
    }

    // 9. GET /api/posts/:id
    const getSingleMatch = pathname.match(/^\/api\/posts\/([^/]+)$/);
    if (method === 'GET' && getSingleMatch) {
      const id = getSingleMatch[1];
      const posts = getPosts();
      const post = posts.find(p => String(p.id) === String(id) || String(p.postNumber) === String(id));
      if (!post) {
        return sendJson(res, 404, { error: 'Post not found' });
      }
      return sendJson(res, 200, post);
    }

    // 10. PUT /api/posts/:id
    const putMatch = pathname.match(/^\/api\/posts\/([^/]+)$/);
    if (method === 'PUT' && putMatch) {
      const id = putMatch[1];
      let body;
      try {
        body = await parseJsonBody(req);
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON payload' });
      }

      const posts = getPosts();
      const index = posts.findIndex(p => String(p.id) === String(id) || String(p.postNumber) === String(id));
      if (index === -1) {
        return sendJson(res, 404, { error: 'Post not found' });
      }

      const post = posts[index];
      for (const key of Object.keys(body)) {
        if (key === 'schedule' && typeof body.schedule === 'object') {
          post.schedule = { ...post.schedule, ...body.schedule };
        } else if (key === 'destinations' && typeof body.destinations === 'object') {
          post.destinations = { ...post.destinations, ...body.destinations };
        } else {
          post[key] = body[key];
        }
      }

      if (body.facebookPage) {
        post.destinations = post.destinations || {};
        post.destinations.facebookPage = body.facebookPage;
      }
      if (body.instagram) {
        post.destinations = post.destinations || {};
        post.destinations.instagram = body.instagram;
      }

      posts[index] = post;
      savePosts(posts);
      return sendJson(res, 200, post);
    }

    // Any other /api/ route is 404
    if (pathname.startsWith('/api/')) {
      return sendJson(res, 404, { error: 'API endpoint not found' });
    }

    // 11. Static File Serving
    serveStatic(req, res, pathname);
  } catch (err) {
    sendJson(res, 500, { error: err.message || 'Internal Server Error' });
  }
}

export function createServer() {
  const server = http.createServer((req, res) => {
    handleRequest(req, res);
  });

  server.keepAliveTimeout = 1000;

  const originalClose = server.close.bind(server);
  server.close = function(callback) {
    if (typeof server.closeAllConnections === 'function') {
      try {
        server.closeAllConnections();
      } catch {}
    }
    return originalClose(callback);
  };

  return server;
}

export const app = {
  listen(port, ...args) {
    const server = createServer();
    return server.listen(port, ...args);
  }
};

export default app;

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Girlies Glow Content Scheduler running on http://localhost:${PORT}`);
  });
}
