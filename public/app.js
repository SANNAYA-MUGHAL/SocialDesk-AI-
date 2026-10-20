// Girlies Glow Content Scheduler Frontend Client
let posts = [];
let currentView = 'grid';
let filterFormat = 'all';
let filterStatus = 'all';
const platformTabState = {}; // postId -> 'ig' | 'fb'
const carouselIndexState = {}; // postId -> current slide index
const mediaCacheBusters = {}; // postId -> timestamp for cache busting
let currentEditPostId = null;
let currentEditSlideIndex = 0;
let currentQuickUploadPostId = null;

// Helper to look up a post by string ID, numeric ID, or postNumber
function findPost(postId) {
  if (postId === undefined || postId === null) return undefined;
  return posts.find(p => String(p.id) === String(postId) || String(p.postNumber) === String(postId));
}

function findPostIndex(postId) {
  if (postId === undefined || postId === null) return -1;
  return posts.findIndex(p => String(p.id) === String(postId) || String(p.postNumber) === String(postId));
}

function setPosts(data) {
  posts = data;
}

function getFilteredPosts() {
  return posts.filter(post => {
    if (filterFormat !== 'all' && post.format !== filterFormat) return false;
    if (filterStatus !== 'all' && post.status !== filterStatus) return false;
    return true;
  });
}

if (typeof window !== 'undefined') {
  window.findPost = findPost;
  window.findPostIndex = findPostIndex;
  window.setPosts = setPosts;
  window.carouselIndexState = carouselIndexState;
  window.platformTabState = platformTabState;
  window.mediaCacheBusters = mediaCacheBusters;
  window.openEditModal = openEditModal;
  window.closeEditModal = closeEditModal;
  window.savePostEdit = savePostEdit;
  window.toggleApprove = toggleApprove;
  window.schedulePost = schedulePost;
  window.regenerateMedia = regenerateMedia;
  window.setPostTab = setPostTab;
  window.changeSlide = changeSlide;
  window.handleApproveAll = handleApproveAll;
  window.handleScheduleAll = handleScheduleAll;
  window.exportData = exportData;
  window.selectEditSlide = selectEditSlide;
  window.triggerFileInput = triggerFileInput;
  window.handleDragOver = handleDragOver;
  window.handleDragLeave = handleDragLeave;
  window.handleFileDrop = handleFileDrop;
  window.handleFileSelected = handleFileSelected;
  window.resetCurrentPostMedia = resetCurrentPostMedia;
  window.quickUploadForPost = quickUploadForPost;
  window.setFormatFilter = setFormatFilter;
  window.setStatusFilter = setStatusFilter;
  window.copyCaption = copyCaption;
  window.copyHashtags = copyHashtags;
  window.openMobilePreview = openMobilePreview;
  window.closeMobilePreview = closeMobilePreview;
  window.updateCharCounters = updateCharCounters;
  window.getFilteredPosts = getFilteredPosts;
  window.openPublishConfirmModal = openPublishConfirmModal;
  window.closePublishConfirmModal = closePublishConfirmModal;
  window.executeLivePublish = executeLivePublish;
  window.openMetaSettingsModal = openMetaSettingsModal;
  window.closeMetaSettingsModal = closeMetaSettingsModal;
  window.toggleTokenVisibility = toggleTokenVisibility;
  window.testMetaConnection = testMetaConnection;
  window.saveMetaSettings = saveMetaSettings;
  window.getMediaUrlWithCacheBuster = getMediaUrlWithCacheBuster;
  window.handleCardDragOver = handleCardDragOver;
  window.handleCardDragLeave = handleCardDragLeave;
  window.handleCardDrop = handleCardDrop;
}

// Safe Cache Buster helper: NEVER append query string to data: or blob: URIs
function getMediaUrlWithCacheBuster(url, postId) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const buster = mediaCacheBusters[postId] ? `?t=${mediaCacheBusters[postId]}` : '';
  return url + buster;
}

// IndexedDB storage for unlimited, permanent client-side media persistence
const GG_DB_NAME = 'GirliesGlowMediaDB';
const GG_DB_VERSION = 1;
const GG_STORE_NAME = 'custom_media';
let cachedMediaDB = null;

function openMediaDB() {
  if (cachedMediaDB) return Promise.resolve(cachedMediaDB);
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, 400);

    try {
      const request = indexedDB.open(GG_DB_NAME, GG_DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(GG_STORE_NAME)) {
          db.createObjectStore(GG_STORE_NAME, { keyPath: 'key' });
        }
      };
      request.onsuccess = (e) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          cachedMediaDB = e.target.result;
          resolve(cachedMediaDB);
        }
      };
      request.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(null);
        }
      };
      request.onblocked = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(null);
        }
      };
    } catch (_) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(null);
      }
    }
  });
}

async function setPersistedMedia(key, value) {
  // 1. Also try localStorage if available and within quota
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch (_) {}
  }
  // 2. IndexedDB (handles large images & videos without quota limits)
  const db = await openMediaDB();
  if (db) {
    try {
      await new Promise((resolve) => {
        const timer = setTimeout(() => resolve(false), 500);
        try {
          const tx = db.transaction(GG_STORE_NAME, 'readwrite');
          tx.objectStore(GG_STORE_NAME).put({ key, value, updatedAt: Date.now() });
          tx.oncomplete = () => {
            clearTimeout(timer);
            resolve(true);
          };
          tx.onerror = () => {
            clearTimeout(timer);
            resolve(false);
          };
        } catch (_) {
          clearTimeout(timer);
          resolve(false);
        }
      });
    } catch (e) {
      console.warn('IndexedDB set warning:', e);
    }
  }
}

async function getPersistedMedia(key) {
  // 1. Fast synchronous check from localStorage first
  if (typeof localStorage !== 'undefined') {
    try {
      const val = localStorage.getItem(key);
      if (val) return val;
    } catch (_) {}
  }
  // 2. Try IndexedDB with safety timeout
  const db = await openMediaDB();
  if (db) {
    try {
      return await new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 350);
        try {
          const tx = db.transaction(GG_STORE_NAME, 'readonly');
          const req = tx.objectStore(GG_STORE_NAME).get(key);
          req.onsuccess = () => {
            clearTimeout(timer);
            resolve(req.result ? req.result.value : null);
          };
          req.onerror = () => {
            clearTimeout(timer);
            resolve(null);
          };
        } catch (_) {
          clearTimeout(timer);
          resolve(null);
        }
      });
    } catch (_) {}
  }
  return null;
}

async function removePersistedMedia(key) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  }
  const db = await openMediaDB();
  if (db) {
    try {
      await new Promise((resolve) => {
        const timer = setTimeout(() => resolve(false), 350);
        try {
          const tx = db.transaction(GG_STORE_NAME, 'readwrite');
          tx.objectStore(GG_STORE_NAME).delete(key);
          tx.oncomplete = () => {
            clearTimeout(timer);
            resolve(true);
          };
          tx.onerror = () => {
            clearTimeout(timer);
            resolve(false);
          };
        } catch (_) {
          clearTimeout(timer);
          resolve(false);
        }
      });
    } catch (_) {}
  }
}

// Client-side image optimization: scales high-res phone photos to clean, crisp ~300KB
function optimizeImageFile(file) {
  return new Promise((resolve, reject) => {
    // If not an image or is SVG/GIF/video, read directly as data URL
    if (!file.type || !file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      if (typeof Image === 'undefined') {
        return resolve(e.target.result);
      }
      const img = new Image();
      img.onerror = () => resolve(e.target.result);
      img.onload = () => {
        try {
          const MAX_DIM = 1440;
          let w = img.width;
          let h = img.height;
          if (w > MAX_DIM || h > MAX_DIM) {
            if (w > h) {
              h = Math.round((h * MAX_DIM) / w);
              w = MAX_DIM;
            } else {
              w = Math.round((w * MAX_DIM) / h);
              h = MAX_DIM;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const isPng = file.type === 'image/png';
          // Use high quality JPEG (0.90) for non-transparent photos, PNG for transparent
          const outMime = isPng ? 'image/png' : 'image/jpeg';
          const optimizedData = canvas.toDataURL(outMime, 0.90);
          resolve(optimizedData);
        } catch (_) {
          resolve(e.target.result);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Drag & drop handlers for post cards in grid view
function handleCardDragOver(e, postId) {
  e.preventDefault();
  e.stopPropagation();
  const el = e.currentTarget;
  if (el) el.classList.add('drag-active');
}

function handleCardDragLeave(e, postId) {
  e.preventDefault();
  e.stopPropagation();
  const el = e.currentTarget;
  if (el) el.classList.remove('drag-active');
}

function handleCardDrop(e, postId) {
  e.preventDefault();
  e.stopPropagation();
  const el = e.currentTarget;
  if (el) el.classList.remove('drag-active');
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    const post = findPost(postId);
    const slideIdx = post && post.format === 'carousel' ? (carouselIndexState[post.id] || 0) : 0;
    uploadSelectedFile(e.dataTransfer.files[0], postId, slideIdx);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadPosts();
  loadMetaSettings();

  const editModal = document.getElementById('edit-modal');
  if (editModal) {
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) closeEditModal();
    });
  }

  const igModal = document.getElementById('ig-preview-modal');
  if (igModal) {
    igModal.addEventListener('click', (e) => {
      if (e.target === igModal) closeMobilePreview();
    });
  }

  const metaModal = document.getElementById('meta-settings-modal');
  if (metaModal) {
    metaModal.addEventListener('click', (e) => {
      if (e.target === metaModal) closeMetaSettingsModal();
    });
  }

  const pubModal = document.getElementById('publish-confirm-modal');
  if (pubModal) {
    pubModal.addEventListener('click', (e) => {
      if (e.target === pubModal) closePublishConfirmModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEditModal();
      closeMobilePreview();
      closeMetaSettingsModal();
      closePublishConfirmModal();
    }
  });
});

async function loadPosts() {
  try {
    const res = await fetch('/api/posts');
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP ${res.status}`);
    }
    posts = await res.json();

    // 1. Instant synchronous localStorage rehydration
    if (typeof localStorage !== 'undefined') {
      const BATCH_VERSION = 'v2_october_batch';
      if (localStorage.getItem('gg_batch_version') !== BATCH_VERSION) {
        for (let i = 1; i <= 10; i++) {
          localStorage.removeItem(`gg_custom_media_${i}_main`);
          for (let s = 0; s < 10; s++) {
            localStorage.removeItem(`gg_custom_media_${i}_${s}`);
          }
        }
        localStorage.setItem('gg_batch_version', BATCH_VERSION);
      }
      posts.forEach(p => {
        const customMain = localStorage.getItem(`gg_custom_media_${p.id}_main`);
        if (customMain) {
          if (!p.originalMedia) p.originalMedia = p.media;
          p.media = customMain;
          p.isCustomMedia = true;
        }
        if (p.format === 'carousel' && Array.isArray(p.media)) {
          p.media = p.media.map((s, idx) => {
            const customSlide = localStorage.getItem(`gg_custom_media_${p.id}_${idx}`);
            if (customSlide) {
              p.isCustomMedia = true;
              return customSlide;
            }
            return s;
          });
        }
      });
    }

    // 2. Render UI IMMEDIATELY so the grid is never blank
    updateStats();
    renderCurrentView();

    // 3. Non-blocking background IndexedDB sync
    rehydrateFromIndexedDB();
  } catch (err) {
    console.error('Failed to load posts:', err);
    showToast('Failed to load posts: ' + err.message, 'error');
    const container = document.getElementById('posts-grid');
    if (container && (!posts || posts.length === 0)) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 48px; text-align: center; background: white; border-radius: 16px; border: 1px dashed #DC2626; margin: 20px 0;">
          <p style="font-size: 18px; font-weight: 700; color: #DC2626; margin-bottom: 8px;">⚠️ Unable to Load Posts</p>
          <p style="font-size: 14px; color: #4B3B68; margin-bottom: 16px;">${escapeHtml(err.message)}</p>
          <button type="button" class="btn btn-outline-primary" onclick="loadPosts()" style="padding: 8px 20px; font-weight: 700; cursor: pointer;">
            🔄 Retry Loading
          </button>
        </div>
      `;
    }
  }
}

async function rehydrateFromIndexedDB() {
  try {
    let hasChanges = false;
    for (const p of posts) {
      const customMain = await getPersistedMedia(`gg_custom_media_${p.id}_main`);
      if (customMain && p.media !== customMain) {
        if (!p.originalMedia) p.originalMedia = p.media;
        p.media = customMain;
        p.isCustomMedia = true;
        hasChanges = true;
      }
      if (p.format === 'carousel' && Array.isArray(p.media)) {
        for (let idx = 0; idx < p.media.length; idx++) {
          const customSlide = await getPersistedMedia(`gg_custom_media_${p.id}_${idx}`);
          if (customSlide && p.media[idx] !== customSlide) {
            p.isCustomMedia = true;
            p.media[idx] = customSlide;
            hasChanges = true;
          }
        }
      }
    }
    if (hasChanges) {
      renderCurrentView();
    }
  } catch (e) {
    console.warn('Background storage sync warning:', e);
  }
}

function updateStats() {
  const totalEl = document.getElementById('stat-total');
  if (totalEl) totalEl.textContent = posts.length;

  const drafts = posts.filter(p => p.status === 'Draft').length;
  const approved = posts.filter(p => p.status === 'Approved').length;
  const scheduled = posts.filter(p => p.status === 'Scheduled').length;
  const published = posts.filter(p => p.status === 'Published').length;

  const draftsEl = document.getElementById('stat-drafts');
  const approvedEl = document.getElementById('stat-approved');
  const scheduledEl = document.getElementById('stat-scheduled');
  const publishedEl = document.getElementById('stat-published');

  if (draftsEl) draftsEl.textContent = `${drafts} Drafts`;
  if (approvedEl) approvedEl.textContent = `${approved} Approved`;
  if (scheduledEl) scheduledEl.textContent = `${scheduled} Scheduled`;
  if (publishedEl) publishedEl.textContent = `${published} Published`;

  const showingEl = document.getElementById('showing-posts-count');
  if (showingEl) {
    const filtered = getFilteredPosts();
    showingEl.textContent = `Showing ${filtered.length} of ${posts.length} posts`;
  }
}

function switchView(view) {
  currentView = view;
  const gridBtn = document.getElementById('view-grid-btn');
  const tableBtn = document.getElementById('view-table-btn');
  const calBtn = document.getElementById('view-calendar-btn');

  if (gridBtn) gridBtn.classList.toggle('active', view === 'grid');
  if (tableBtn) tableBtn.classList.toggle('active', view === 'table');
  if (calBtn) calBtn.classList.toggle('active', view === 'calendar');

  const gridContainer = document.getElementById('posts-grid');
  const tableContainer = document.getElementById('table-container');
  const calContainer = document.getElementById('calendar-container');

  if (gridContainer) gridContainer.style.display = view === 'grid' ? 'grid' : 'none';
  if (tableContainer) tableContainer.style.display = view === 'table' ? 'block' : 'none';
  if (calContainer) calContainer.style.display = view === 'calendar' ? 'block' : 'none';

  renderCurrentView();
}

function renderCurrentView() {
  if (currentView === 'grid') {
    renderGrid();
  } else if (currentView === 'table') {
    renderTable();
  } else if (currentView === 'calendar') {
    renderCalendar();
  }
}

// Render Grid View
function renderGrid() {
  const container = document.getElementById('posts-grid');
  if (!container) return;
  container.innerHTML = '';

  const filteredPosts = getFilteredPosts();
  if (filteredPosts.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 48px; text-align: center; background: white; border-radius: 16px; border: 1px dashed var(--color-border);">
        <p style="font-size: 16px; font-weight: 700; color: var(--color-purple-plum); margin-bottom: 8px;">No posts match your selected filter criteria.</p>
        <p style="font-size: 13px; color: var(--color-text-muted);">Try selecting "All Formats" or "All Status".</p>
      </div>
    `;
    return;
  }

  filteredPosts.forEach(post => {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.id = `post-card-${post.id}`;

    // Active platform tab
    if (!platformTabState[post.id]) platformTabState[post.id] = 'ig';
    const activeTab = platformTabState[post.id];

    // Carousel state
    if (carouselIndexState[post.id] === undefined) carouselIndexState[post.id] = 0;
    const currentSlide = carouselIndexState[post.id];

    // Format badge class
    let formatClass = 'type-static';
    let formatLabel = 'Static Feed (4:5)';
    if (post.format === 'reel') {
      formatClass = 'type-reel';
      formatLabel = 'Instagram Reel (9:16)';
    } else if (post.format === 'carousel') {
      formatClass = 'type-carousel';
      const slideCount = Array.isArray(post.media) ? post.media.length : 4;
      formatLabel = `Carousel (4:5 • ${slideCount} Slides)`;
    }

    // Status pill class
    const statusClass = `status-${(post.status || 'draft').toLowerCase()}`;

    // Media HTML
    const mediaHtml = renderMediaPreview(post, currentSlide);

    card.innerHTML = `
      <div class="post-card-header">
        <div class="post-card-title-group">
          <span class="post-number-badge">Post ${post.postNumber || post.id}</span>
          <span class="post-title">${escapeHtml(post.title)}</span>
        </div>
        <span class="post-type-badge ${formatClass}">${formatLabel}</span>
      </div>

      <div class="media-preview-container ${post.format === 'reel' ? 'media-aspect-9-16' : 'media-aspect-4-5'}" ondragover="handleCardDragOver(event, '${post.id}')" ondragleave="handleCardDragLeave(event, '${post.id}')" ondrop="handleCardDrop(event, '${post.id}')">
        ${mediaHtml}
        <div class="card-media-change-overlay">
          <button type="button" class="btn-change-media-quick" onclick="quickUploadForPost('${post.id}')" title="Upload custom photo or video from device">
            <span>📷</span> Change Media
          </button>
        </div>
      </div>

      <div class="card-quick-tools">
        <button type="button" class="quick-tool-btn btn-ig-preview" onclick="openMobilePreview('${post.id}')" title="Preview post in phone mockup">
          <span>📱</span> IG Phone Preview
        </button>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="quick-tool-btn" onclick="quickUploadForPost('${post.id}')" title="Upload custom photo or video from device">
            <span>📤</span> Upload
          </button>
          <button type="button" class="quick-tool-btn" onclick="copyCaption('${post.id}')" title="Copy current preview caption">
            <span>📋</span> Copy Caption
          </button>
          <button type="button" class="quick-tool-btn" onclick="copyHashtags('${post.id}')" title="Copy hashtags">
            <span>🏷️</span> Copy Tags
          </button>
        </div>
      </div>

      <div class="post-card-body">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div class="schedule-pill" title="Scheduled in Pakistan Standard Time (PKT)">
            <span>🕒</span>
            <span>${escapeHtml(post.schedule?.date || '')} • ${escapeHtml(post.schedule?.time || '')} PKT</span>
          </div>
          <span class="pill-status ${statusClass}">${post.status || 'Draft'}</span>
        </div>

        <div class="post-meta-badges">
          <span class="meta-pill pill-price">Rs. 599</span>
          <span class="meta-pill pill-cod">🚚 COD Available</span>
          <span class="meta-pill" style="background: #F3E8FF; color: #683DA9;">Safe FB Page</span>
        </div>

        <div class="platform-tabs">
          <button type="button" class="tab-btn ${activeTab === 'ig' ? 'active' : ''}" onclick="setPostTab('${post.id}', 'ig')">
            Instagram Preview
          </button>
          <button type="button" class="tab-btn ${activeTab === 'fb' ? 'active' : ''}" onclick="setPostTab('${post.id}', 'fb')">
            Facebook Page Preview
          </button>
        </div>

        <div class="caption-box">
          ${activeTab === 'ig' ? escapeHtml(post.captionIg) : escapeHtml(post.captionFb)}
        </div>

        <div class="hashtags-box">
          ${Array.isArray(post.hashtags) ? post.hashtags.map(h => escapeHtml(h)).join(' ') : escapeHtml(post.hashtags || '')}
        </div>

        ${post.status === 'Published' && post.metaPublishDetails ? `
          <div class="live-meta-links">
            ${post.metaPublishDetails.instagram?.url ? `<a href="${escapeHtml(post.metaPublishDetails.instagram.url)}" target="_blank" class="live-link-pill">📸 View on Instagram</a>` : ''}
            ${post.metaPublishDetails.facebook?.url ? `<a href="${escapeHtml(post.metaPublishDetails.facebook.url)}" target="_blank" class="live-link-pill">👍 View on Facebook Page</a>` : ''}
          </div>
        ` : ''}
      </div>

      <div class="post-card-actions">
        <button type="button" class="card-action-btn" onclick="openEditModal('${post.id}')" title="Edit caption, dates, or destinations">
          <span>✏️</span> EDIT
        </button>
        <button type="button" class="card-action-btn btn-approve-toggle" onclick="toggleApprove('${post.id}')" title="Toggle post approval">
          <span>${post.status === 'Approved' || post.status === 'Scheduled' || post.status === 'Published' ? '✓' : '○'}</span>
          ${post.status === 'Approved' || post.status === 'Scheduled' || post.status === 'Published' ? 'APPROVED' : 'APPROVE'}
        </button>
        <button type="button" class="card-action-btn" onclick="regenerateMedia('${post.id}')" title="Re-render creative graphics">
          <span>🎨</span> REGEN
        </button>
        ${post.status === 'Published' ? `
          <button type="button" class="card-action-btn btn-published-done" onclick="openPublishConfirmModal('${post.id}')" title="Published live to Meta. Click to republish if needed.">
            <span>🟢</span> PUBLISHED
          </button>
        ` : (post.status === 'Approved' || post.status === 'Scheduled') ? `
          <button type="button" class="card-action-btn btn-publish-live" onclick="openPublishConfirmModal('${post.id}')" title="Human Approval: Click to review and publish live to Instagram & Facebook">
            <span>⚡</span> PUBLISH LIVE
          </button>
        ` : `
          <button type="button" class="card-action-btn btn-publish-locked" onclick="showToast('Human Approval Required: Click APPROVE first before publishing live!', 'info')" title="Human Approval Required: Post must be Approved first">
            <span>🔒</span> PUBLISH LIVE
          </button>
        `}
      </div>
    `;

    container.appendChild(card);
  });
}

function renderMediaPreview(post, currentSlideIndex) {
  if (post.format === 'carousel' && Array.isArray(post.media)) {
    const totalSlides = post.media.length;
    const safeIndex = Math.min(Math.max(0, currentSlideIndex), totalSlides - 1);
    const mediaPath = getMediaUrlWithCacheBuster(post.media[safeIndex], post.id);

    return `
      <img src="${escapeHtml(mediaPath)}" alt="${escapeHtml(post.title)} Slide ${safeIndex + 1}" class="media-img" loading="lazy">
      <div class="carousel-overlay-controls">
        <button type="button" class="carousel-arrow" onclick="changeSlide('${post.id}', -1)">&larr;</button>
        <button type="button" class="carousel-arrow" onclick="changeSlide('${post.id}', 1)">&rarr;</button>
      </div>
      <div class="carousel-badge">Slide ${safeIndex + 1} of ${totalSlides}</div>
      ${post.isCustomMedia ? '<div class="custom-media-badge-pill">Custom Media</div>' : ''}
    `;
  }

  if (post.format === 'reel') {
    const rawMedia = Array.isArray(post.media) ? post.media[0] : (post.media || `/generated/post_${post.id}_reel.png`);
    const isVideo = String(rawMedia).toLowerCase().endsWith('.mp4') || String(rawMedia).startsWith('data:video');
    const safeMediaUrl = getMediaUrlWithCacheBuster(rawMedia, post.id);

    if (isVideo) {
      return `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #180B28;">
          <video src="${escapeHtml(safeMediaUrl)}" class="media-video" autoplay muted loop playsinline style="object-fit: cover; width: 100%; height: 100%;"></video>
          <div style="position: absolute; top: 12px; left: 12px; background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(8px); color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; border: 1px solid rgba(255, 255, 255, 0.2); z-index: 4;">
            ▶ REEL (9:16)
          </div>
          ${post.isCustomMedia ? '<div class="custom-media-badge-pill">Custom Media</div>' : ''}
        </div>
      `;
    }

    return `
      <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #180B28;">
        <img src="${escapeHtml(safeMediaUrl)}" alt="${escapeHtml(post.title)} Reel Cover" class="media-img" style="object-fit: cover; width: 100%; height: 100%;">
        <div style="position: absolute; top: 12px; left: 12px; background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(8px); color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; border: 1px solid rgba(255, 255, 255, 0.2); z-index: 4;">
            ▶ REEL (9:16)
        </div>
        ${post.isCustomMedia ? '<div class="custom-media-badge-pill">Custom Media</div>' : ''}
      </div>
    `;
  }

  // Static post
  const rawMedia = Array.isArray(post.media) ? post.media[0] : post.media;
  const mediaFile = getMediaUrlWithCacheBuster(rawMedia, post.id);
  return `
    <img src="${escapeHtml(mediaFile)}" alt="${escapeHtml(post.title)}" class="media-img" loading="lazy">
    ${post.isCustomMedia ? '<div class="custom-media-badge-pill">Custom Media</div>' : ''}
  `;
}

function changeSlide(postId, delta) {
  const post = findPost(postId);
  if (!post || !Array.isArray(post.media)) return;

  const total = post.media.length;
  let next = (carouselIndexState[post.id] || 0) + delta;
  if (next < 0) next = total - 1;
  if (next >= total) next = 0;

  carouselIndexState[post.id] = next;
  renderGrid();
}

function setPostTab(postId, tab) {
  const post = findPost(postId);
  if (!post) return;
  platformTabState[post.id] = tab;
  renderGrid();
}

// Render Table View
function renderTable() {
  const tbody = document.getElementById('table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const filteredPosts = getFilteredPosts();
  if (filteredPosts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align: center; padding: 32px; color: var(--color-text-muted);">
          No posts match your selected filter criteria.
        </td>
      </tr>
    `;
    return;
  }

  filteredPosts.forEach(post => {
    const tr = document.createElement('tr');
    const statusClass = `status-${(post.status || 'draft').toLowerCase()}`;
    const mediaText = Array.isArray(post.media) ? `${post.media.length} files` : post.media;

    tr.innerHTML = `
      <td><strong>${post.postNumber || post.id}</strong></td>
      <td>
        <div style="font-weight: 700; color: #2D1B4E;">${escapeHtml(post.title)}</div>
        <div style="font-size: 11.5px; color: #6B5D82;">${escapeHtml(post.angle || '')}</div>
      </td>
      <td><span class="post-type-badge type-${post.format}">${post.format}</span></td>
      <td><code>${escapeHtml(post.destinations?.instagram || '')}</code></td>
      <td><code style="color: #166534;">${escapeHtml(post.destinations?.facebookPage || '')}</code></td>
      <td><span style="font-size: 11.5px;">${escapeHtml(mediaText)}</span></td>
      <td style="max-width: 260px;">
        <div style="max-height: 48px; overflow: hidden; text-overflow: ellipsis; font-size: 12px;">
          ${escapeHtml(post.captionIg)}
        </div>
      </td>
      <td><span style="color: #683DA9; font-size: 11px;">${escapeHtml(Array.isArray(post.hashtags) ? post.hashtags.join(' ') : post.hashtags)}</span></td>
      <td><strong>${escapeHtml(post.schedule?.date || '')}</strong><br><span style="font-size: 11px; color: #6B5D82;">${escapeHtml(post.schedule?.time || '')} PKT</span></td>
      <td><span class="pill-status ${statusClass}">${post.status || 'Draft'}</span></td>
      <td>
        <div style="display: flex; gap: 4px;">
          <button type="button" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="openEditModal('${post.id}')">Edit</button>
          <button type="button" class="btn btn-primary" style="padding: 4px 8px; font-size: 11px;" onclick="schedulePost('${post.id}')">Schedule</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Calendar Timeline View
function renderCalendar() {
  const container = document.getElementById('timeline-grid');
  if (!container) return;
  container.innerHTML = '';

  const filteredPosts = getFilteredPosts();
  if (filteredPosts.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 48px; text-align: center; background: white; border-radius: 16px; border: 1px dashed var(--color-border);">
        <p style="font-size: 16px; font-weight: 700; color: var(--color-purple-plum); margin-bottom: 8px;">No scheduled dates match your filters.</p>
      </div>
    `;
    return;
  }

  filteredPosts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'timeline-day-card';

    const statusClass = `status-${(post.status || 'draft').toLowerCase()}`;

    card.innerHTML = `
      <div class="timeline-date-header">
        <span>📅 ${escapeHtml(post.schedule?.date || '')}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span class="post-type-badge type-${post.format}">${post.format}</span>
        <span class="pill-status ${statusClass}">${post.status || 'Draft'}</span>
      </div>
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #2D1B4E;">
        Post ${post.postNumber}: ${escapeHtml(post.title)}
      </div>
      <div style="font-size: 12px; color: #683DA9; margin-bottom: 12px; font-weight: 600;">
        🕒 ${escapeHtml(post.schedule?.time || '')} PKT (Peak Window)
      </div>
      <p style="font-size: 12px; color: #4B3B68; line-height: 1.4; max-height: 60px; overflow: hidden; margin-bottom: 12px;">
        ${escapeHtml(post.captionIg.substring(0, 110))}...
      </p>
      <div style="display: flex; gap: 6px;">
        <button type="button" class="btn btn-secondary" style="flex: 1; padding: 6px 8px; font-size: 11px;" onclick="openEditModal('${post.id}')">Edit</button>
        <button type="button" class="btn btn-success" style="flex: 1; padding: 6px 8px; font-size: 11px;" onclick="schedulePost('${post.id}')">Schedule</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Modal Handlers
function openEditModal(postId) {
  const post = findPost(postId);
  if (!post) {
    console.error('Post not found for id:', postId);
    showToast('Post not found', 'error');
    return;
  }

  currentEditPostId = post.id;
  currentEditSlideIndex = 0;

  document.getElementById('edit-post-id').value = post.id;
  document.getElementById('modal-title').textContent = `Edit Post ${post.postNumber || post.id} — ${post.title}`;
  document.getElementById('edit-title').value = post.title || '';
  document.getElementById('edit-angle').value = post.angle || '';

  const fbSelect = document.getElementById('edit-fb-dest');
  if (fbSelect) {
    fbSelect.value = post.destinations?.facebookPage || 'Girlies Glow Facebook Business Page';
  }

  const statusSelect = document.getElementById('edit-status');
  if (statusSelect) {
    statusSelect.value = post.status || 'Draft';
  }

  document.getElementById('edit-ig-dest').value = post.destinations?.instagram || '@girli_esglow';
  document.getElementById('edit-date').value = post.schedule?.date || '';
  document.getElementById('edit-time').value = post.schedule?.time || '';
  document.getElementById('edit-caption-ig').value = post.captionIg || '';
  document.getElementById('edit-caption-fb').value = post.captionFb || '';
  document.getElementById('edit-hashtags').value = Array.isArray(post.hashtags) ? post.hashtags.join(' ') : (post.hashtags || '');

  updateCharCounters();
  updateModalMediaPreview(post, currentEditSlideIndex);

  const modal = document.getElementById('edit-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function updateModalMediaPreview(post, slideIdx = 0) {
  const previewWrap = document.getElementById('edit-media-preview-wrap');
  const customBadge = document.getElementById('custom-media-badge');
  const resetBtn = document.getElementById('btn-reset-media');
  const carouselGroup = document.getElementById('carousel-slide-selector-group');
  const carouselPills = document.getElementById('carousel-slide-pills');
  const statusEl = document.getElementById('upload-status');
  if (statusEl) statusEl.style.display = 'none';

  if (customBadge) customBadge.style.display = post.isCustomMedia ? 'inline-block' : 'none';
  if (resetBtn) resetBtn.style.display = post.isCustomMedia ? 'inline-block' : 'none';

  // Setup carousel slide pills if format === 'carousel'
  if (post.format === 'carousel' && Array.isArray(post.media)) {
    if (carouselGroup) carouselGroup.style.display = 'block';
    if (carouselPills) {
      carouselPills.innerHTML = post.media.map((_, i) => `
        <button type="button" class="slide-pill-btn ${i === slideIdx ? 'active' : ''}" onclick="selectEditSlide(${i})">
          Slide ${i + 1}
        </button>
      `).join('');
    }

    const safeIdx = Math.min(Math.max(0, slideIdx), post.media.length - 1);
    const mediaSrc = getMediaUrlWithCacheBuster(post.media[safeIdx], post.id);
    if (previewWrap) {
      previewWrap.innerHTML = `<img src="${escapeHtml(mediaSrc)}" alt="Slide ${safeIdx + 1}" style="width: 100%; height: 100%; object-fit: cover;">`;
    }
    return;
  }

  if (carouselGroup) carouselGroup.style.display = 'none';

  // Reel preview
  if (post.format === 'reel') {
    const rawMedia = Array.isArray(post.media) ? post.media[0] : (post.media || `/generated/post_${post.id}_reel.png`);
    const isVideo = String(rawMedia).toLowerCase().endsWith('.mp4') || String(rawMedia).startsWith('data:video');
    const safeMediaUrl = getMediaUrlWithCacheBuster(rawMedia, post.id);
    if (previewWrap) {
      if (isVideo) {
        previewWrap.innerHTML = `
          <video src="${escapeHtml(safeMediaUrl)}" controls autoplay muted style="width: 100%; height: 100%; object-fit: cover;"></video>
        `;
      } else {
        previewWrap.innerHTML = `
          <img src="${escapeHtml(safeMediaUrl)}" alt="Reel Cover" style="width: 100%; height: 100%; object-fit: cover;">
        `;
      }
    }
    return;
  }

  // Static preview
  const rawMedia = Array.isArray(post.media) ? post.media[0] : (post.media || `/generated/post_${post.id}_static.png`);
  const safeMediaUrl = getMediaUrlWithCacheBuster(rawMedia, post.id);
  if (previewWrap) {
    previewWrap.innerHTML = `
      <img src="${escapeHtml(safeMediaUrl)}" alt="${escapeHtml(post.title)}" style="width: 100%; height: 100%; object-fit: cover;">
    `;
  }
}

function selectEditSlide(slideIndex) {
  currentEditSlideIndex = slideIndex;
  const post = findPost(currentEditPostId);
  if (post) updateModalMediaPreview(post, currentEditSlideIndex);
}

function triggerFileInput() {
  const input = document.getElementById('media-file-input');
  if (input) input.click();
}

function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  const dropzone = document.getElementById('media-dropzone');
  if (dropzone) dropzone.classList.add('drag-active');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  const dropzone = document.getElementById('media-dropzone');
  if (dropzone) dropzone.classList.remove('drag-active');
}

function handleFileDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  const dropzone = document.getElementById('media-dropzone');
  if (dropzone) dropzone.classList.remove('drag-active');

  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    uploadSelectedFile(e.dataTransfer.files[0], currentEditPostId, currentEditSlideIndex);
  }
}

function handleFileSelected(e) {
  if (e.target.files && e.target.files[0]) {
    uploadSelectedFile(e.target.files[0], currentEditPostId, currentEditSlideIndex);
    e.target.value = '';
  }
}

async function uploadSelectedFile(file, postId, slideIndex = 0) {
  const post = findPost(postId);
  if (!post) {
    showToast('Post not found', 'error');
    return;
  }

  // Validate size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    showToast('File too large. Maximum size is 50MB.', 'error');
    return;
  }

  showToast(`⏳ Processing ${file.name}...`, 'info');
  const statusEl = document.getElementById('upload-status');
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.style.color = '#683DA9';
    statusEl.textContent = `⏳ Processing ${file.name}...`;
  }

  try {
    // Automatically optimize images client-side (scales photos to crisp ~300KB)
    const base64Data = await optimizeImageFile(file);

    // Save permanently to IndexedDB and localStorage
    const storageKey = `gg_custom_media_${post.id}_${post.format === 'carousel' ? slideIndex : 'main'}`;
    await setPersistedMedia(storageKey, base64Data);

    // Immediately update in-memory post and UI
    const idx = findPostIndex(post.id);
    if (idx !== -1) {
      if (post.format === 'carousel' && Array.isArray(posts[idx].media)) {
        if (!posts[idx].originalMedia) posts[idx].originalMedia = [...posts[idx].media];
        posts[idx].media[slideIndex] = base64Data;
      } else {
        if (!posts[idx].originalMedia) posts[idx].originalMedia = posts[idx].media;
        posts[idx].media = base64Data;
      }
      posts[idx].isCustomMedia = true;
      posts[idx].lastMediaUpload = new Date().toISOString();
      mediaCacheBusters[post.id] = Date.now();
      updateModalMediaPreview(posts[idx], slideIndex);
      renderCurrentView();
    }

    // Background sync to server if size allows (under 4MB)
    if (base64Data.length < 4 * 1024 * 1024) {
      try {
        const res = await fetch(`/api/posts/${post.id}/upload-media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            data: base64Data,
            slideIndex: post.format === 'carousel' ? slideIndex : undefined
          })
        });

        if (res.ok) {
          const result = await res.json();
          if (idx !== -1 && result.post) {
            // Keep base64Data active for crisp local display while server records public URL
            if (posts[idx].format === 'carousel' && Array.isArray(posts[idx].media)) {
              posts[idx].media[slideIndex] = base64Data;
            } else {
              posts[idx].media = base64Data;
            }
            posts[idx].isCustomMedia = true;
          }
        }
      } catch (serverErr) {
        console.warn('Server upload background sync warning:', serverErr.message);
      }
    }

    if (statusEl) {
      statusEl.style.color = '#15803D';
      statusEl.textContent = `✓ Uploaded successfully from device!`;
    }

    showToast(`✓ Media updated successfully for Post ${post.id}!`, 'success');
  } catch (err) {
    if (statusEl) {
      statusEl.style.color = '#DC2626';
      statusEl.textContent = `✕ Upload failed: ${err.message}`;
    }
    showToast(err.message, 'error');
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

async function resetCurrentPostMedia() {
  const post = findPost(currentEditPostId);
  if (!post) return;

  // Clear persisted storage for this post
  await removePersistedMedia(`gg_custom_media_${post.id}_main`);
  for (let i = 0; i < 10; i++) {
    await removePersistedMedia(`gg_custom_media_${post.id}_${i}`);
  }

  try {
    const res = await fetch(`/api/posts/${post.id}/reset-media`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reset media');
    }

    const result = await res.json();
    const idx = findPostIndex(post.id);
    if (idx !== -1 && result.post) {
      posts[idx] = result.post;
    }

    mediaCacheBusters[post.id] = Date.now();
    updateModalMediaPreview(posts[idx], currentEditSlideIndex);
    renderCurrentView();
    showToast(`Media reset to generated default for Post ${post.id}`, 'info');
  } catch (err) {
    // Client-side fallback if server fails
    const idx = findPostIndex(post.id);
    if (idx !== -1) {
      const idStr = String(post.id);
      let def = `/generated/post_${idStr}_static.png`;
      if (idStr === '3') def = ['/generated/post_3_slide_1.png', '/generated/post_3_slide_2.png', '/generated/post_3_slide_3.png', '/generated/post_3_slide_4.png'];
      else if (idStr === '8') def = ['/generated/post_8_slide_1.png', '/generated/post_8_slide_2.png', '/generated/post_8_slide_3.png', '/generated/post_8_slide_4.png', '/generated/post_8_slide_5.png'];
      else if (idStr === '10') def = '/generated/post_10_offer.png';
      else if (post.format === 'reel') def = `/generated/post_${idStr}_reel.mp4`;

      posts[idx].media = def;
      posts[idx].isCustomMedia = false;
      updateModalMediaPreview(posts[idx], currentEditSlideIndex);
      renderCurrentView();
    }
    showToast(`Media reset to default`, 'info');
  }
}

function quickUploadForPost(postId) {
  const post = findPost(postId);
  if (!post) return;
  currentQuickUploadPostId = post.id;
  const currentSlide = post.format === 'carousel' ? (carouselIndexState[post.id] || 0) : 0;
  const input = document.getElementById('global-quick-media-input');
  if (input) {
    input.onchange = (e) => {
      if (e.target.files && e.target.files[0]) {
        uploadSelectedFile(e.target.files[0], currentQuickUploadPostId, currentSlide);
        e.target.value = '';
      }
    };
    input.click();
  }
}

function closeEditModal() {
  const modal = document.getElementById('edit-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function savePostEdit() {
  const id = document.getElementById('edit-post-id').value;
  const post = findPost(id);
  if (!post) {
    showToast('Post not found', 'error');
    return;
  }

  const updatedPayload = {
    title: document.getElementById('edit-title').value,
    angle: document.getElementById('edit-angle').value,
    status: document.getElementById('edit-status')?.value || post.status || 'Draft',
    destinations: {
      instagram: document.getElementById('edit-ig-dest').value,
      facebookPage: document.getElementById('edit-fb-dest').value
    },
    schedule: {
      ...post.schedule,
      date: document.getElementById('edit-date').value,
      time: document.getElementById('edit-time').value,
      timezone: 'PKT'
    },
    captionIg: document.getElementById('edit-caption-ig').value,
    captionFb: document.getElementById('edit-caption-fb').value,
    hashtags: document.getElementById('edit-hashtags').value.split(/\s+/).filter(Boolean)
  };

  try {
    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPayload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update post');
    }
    const saved = await res.json();
    const idx = findPostIndex(post.id);
    if (idx !== -1) {
      const currentMedia = posts[idx].media;
      const wasCustom = posts[idx].isCustomMedia;
      const originalMedia = posts[idx].originalMedia;
      posts[idx] = { ...posts[idx], ...saved };
      if (wasCustom) {
        posts[idx].media = currentMedia;
        posts[idx].isCustomMedia = true;
        posts[idx].originalMedia = originalMedia;
      }
    }

    closeEditModal();
    updateStats();
    renderCurrentView();
    showToast(`Post ${post.id} updated successfully`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Action Handlers
async function toggleApprove(postId) {
  const post = findPost(postId);
  if (!post) {
    console.error('Post not found for id:', postId);
    showToast('Post not found', 'error');
    return;
  }

  const willApprove = post.status !== 'Approved' && post.status !== 'Scheduled';
  const newStatus = willApprove ? 'Approved' : 'Draft';

  try {
    let res;
    if (willApprove) {
      res = await fetch(`/api/posts/${post.id}/approve`, { method: 'POST' });
    } else {
      res = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Draft' })
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update post status');
    }

    const updated = await res.json();
    const idx = findPostIndex(post.id);
    if (idx !== -1) {
      const currentMedia = posts[idx].media;
      const wasCustom = posts[idx].isCustomMedia;
      const originalMedia = posts[idx].originalMedia;
      posts[idx] = { ...posts[idx], ...updated };
      if (wasCustom) {
        posts[idx].media = currentMedia;
        posts[idx].isCustomMedia = true;
        posts[idx].originalMedia = originalMedia;
      }
    }

    updateStats();
    renderCurrentView();
    showToast(`Post ${post.id} status: ${updated.status}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function schedulePost(postId) {
  const post = findPost(postId);
  if (!post) {
    console.error('Post not found for id:', postId);
    showToast('Post not found', 'error');
    return;
  }

  try {
    const res = await fetch(`/api/posts/${post.id}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facebookPage: post.destinations?.facebookPage })
    });

    const data = await res.json();

    if (!res.ok) {
      // Guardrail tripped!
      showGuardrailAlert(data.error);
      showToast(data.error, 'error');
      return;
    }

    const idx = findPostIndex(post.id);
    if (idx !== -1) {
      const currentMedia = posts[idx].media;
      const wasCustom = posts[idx].isCustomMedia;
      const originalMedia = posts[idx].originalMedia;
      posts[idx] = { ...posts[idx], ...data };
      if (wasCustom) {
        posts[idx].media = currentMedia;
        posts[idx].isCustomMedia = true;
        posts[idx].originalMedia = originalMedia;
      }
    }

    dismissGuardrailAlert();
    updateStats();
    renderCurrentView();
    showToast(`Post ${post.id} scheduled to Girlies Glow Facebook Page & Instagram!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function regenerateMedia(postId) {
  const post = findPost(postId);
  if (!post) {
    console.error('Post not found for id:', postId);
    showToast('Post not found', 'error');
    return;
  }

  showToast(`Regenerating creative for Post ${post.id}...`, 'info');
  try {
    const res = await fetch(`/api/posts/${post.id}/regenerate-media`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to regenerate creative');

    // Add cache buster so browser immediately displays newly generated asset
    mediaCacheBusters[post.id] = Date.now();

    showToast(`Creative for Post ${post.id} regenerated!`, 'success');
    renderCurrentView();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleApproveAll() {
  try {
    const res = await fetch('/api/posts/approve-all', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to approve all');
    const data = await res.json();
    const prevMediaMap = new Map(posts.map(p => [p.id, { media: p.media, isCustomMedia: p.isCustomMedia, originalMedia: p.originalMedia }]));
    posts = data.posts.map(p => {
      const prev = prevMediaMap.get(p.id);
      if (prev && prev.isCustomMedia) {
        return { ...p, media: prev.media, isCustomMedia: true, originalMedia: prev.originalMedia };
      }
      return p;
    });
    updateStats();
    renderCurrentView();
    showToast('All 10 posts marked as Approved! ✓', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleScheduleAll() {
  try {
    const res = await fetch('/api/posts/schedule-all', { method: 'POST' });
    const data = await res.json();

    if (!res.ok) {
      showGuardrailAlert(data.error);
      showToast(data.error, 'error');
      return;
    }

    const prevMediaMap = new Map(posts.map(p => [p.id, { media: p.media, isCustomMedia: p.isCustomMedia, originalMedia: p.originalMedia }]));
    posts = data.posts.map(p => {
      const prev = prevMediaMap.get(p.id);
      if (prev && prev.isCustomMedia) {
        return { ...p, media: prev.media, isCustomMedia: true, originalMedia: prev.originalMedia };
      }
      return p;
    });
    dismissGuardrailAlert();
    updateStats();
    renderCurrentView();
    showToast('All 10 posts scheduled across Instagram & Girlies Glow Facebook Page! 🚀', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function exportData(format) {
  window.open(`/api/export/${format}`, '_blank');
}

// Guardrail Alert UI
function showGuardrailAlert(msg) {
  const alertEl = document.getElementById('guardrail-alert');
  const msgEl = document.getElementById('guardrail-error-msg');
  if (msgEl) msgEl.textContent = msg;
  if (alertEl) alertEl.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function dismissGuardrailAlert() {
  const alertEl = document.getElementById('guardrail-alert');
  if (alertEl) alertEl.style.display = 'none';
}

// Toast System
function showToast(msg, type = 'info', duration = 5000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const typeClass = type === 'error' ? 'toast-error' : type === 'success' ? 'toast-success' : type === 'warning' ? 'toast-warning' : '';
  const icon = type === 'error' ? '⚠️' : type === 'success' ? '✓' : type === 'warning' ? '⚠️' : 'ℹ️';
  toast.className = `toast ${typeClass}`;
  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast && toast.style) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }
    setTimeout(() => {
      if (toast && typeof toast.remove === 'function') toast.remove();
    }, 300);
  }, duration);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Filter Actions (UI/UX Pro Max)
function setFormatFilter(fmt) {
  filterFormat = fmt;
  const chips = document.querySelectorAll('#format-filter-chips .filter-chip');
  chips.forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-format') === fmt);
  });
  updateStats();
  renderCurrentView();
}

function setStatusFilter(status) {
  filterStatus = status;
  const chips = document.querySelectorAll('#status-filter-chips .filter-chip');
  chips.forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-status') === status);
  });
  updateStats();
  renderCurrentView();
}

// Quick Copy Actions (Social Media Skills)
async function copyCaption(postId) {
  const post = findPost(postId);
  if (!post) return;
  const activeTab = platformTabState[post.id] || 'ig';
  const text = activeTab === 'ig' ? post.captionIg : post.captionFb;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    showToast(`Copied ${activeTab === 'ig' ? 'Instagram' : 'Facebook'} caption to clipboard! 📋`, 'success');
  } catch (err) {
    showToast('Failed to copy caption: ' + err.message, 'error');
  }
}

async function copyHashtags(postId) {
  const post = findPost(postId);
  if (!post) return;
  const text = Array.isArray(post.hashtags) ? post.hashtags.join(' ') : (post.hashtags || '');
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    showToast('Copied hashtags to clipboard! 🏷️', 'success');
  } catch (err) {
    showToast('Failed to copy hashtags: ' + err.message, 'error');
  }
}

// Live Instagram Mobile Feed Preview (Canvas Design & UI/UX Pro Max)
function openMobilePreview(postId) {
  const post = findPost(postId);
  if (!post) {
    showToast('Post not found', 'error');
    return;
  }
  const modal = document.getElementById('ig-preview-modal');
  const mediaContainer = document.getElementById('ig-preview-media-container');
  const captionEl = document.getElementById('ig-preview-caption-text');
  const tagsEl = document.getElementById('ig-preview-hashtags');

  if (!modal || !mediaContainer) return;

  let mediaHtml = '';
  if (post.format === 'carousel' && Array.isArray(post.media)) {
    const curIndex = carouselIndexState[post.id] || 0;
    const safeIdx = Math.min(Math.max(0, curIndex), post.media.length - 1);
    const safeMediaUrl = getMediaUrlWithCacheBuster(post.media[safeIdx], post.id);
    mediaHtml = `<img src="${escapeHtml(safeMediaUrl)}" alt="Carousel Preview" style="max-height: 400px; width: 100%; object-fit: contain;">`;
  } else if (post.format === 'reel') {
    const rawMedia = Array.isArray(post.media) ? post.media[0] : (post.media || `/generated/post_${post.id}_reel.png`);
    const isVideo = String(rawMedia).toLowerCase().endsWith('.mp4') || String(rawMedia).startsWith('data:video');
    const safeMediaUrl = getMediaUrlWithCacheBuster(rawMedia, post.id);
    if (isVideo) {
      mediaHtml = `<video src="${escapeHtml(safeMediaUrl)}" controls autoplay muted loop style="max-height: 480px; width: 100%; object-fit: contain;"></video>`;
    } else {
      mediaHtml = `<img src="${escapeHtml(safeMediaUrl)}" alt="Reel Preview" style="max-height: 480px; width: 100%; object-fit: contain;">`;
    }
  } else {
    const rawMedia = Array.isArray(post.media) ? post.media[0] : post.media;
    const safeMediaUrl = getMediaUrlWithCacheBuster(rawMedia, post.id);
    mediaHtml = `<img src="${escapeHtml(safeMediaUrl)}" alt="Static Preview" style="max-height: 400px; width: 100%; object-fit: contain;">`;
  }

  mediaContainer.innerHTML = mediaHtml;
  if (captionEl) captionEl.textContent = ' ' + (post.captionIg || '');
  if (tagsEl) {
    tagsEl.textContent = Array.isArray(post.hashtags) ? post.hashtags.join(' ') : (post.hashtags || '');
  }

  modal.style.display = 'flex';
}

function closeMobilePreview() {
  const modal = document.getElementById('ig-preview-modal');
  if (modal) modal.style.display = 'none';
}

// Character Counters in Edit Modal
function updateCharCounters() {
  const igEl = document.getElementById('edit-caption-ig');
  const fbEl = document.getElementById('edit-caption-fb');
  const tagsEl = document.getElementById('edit-hashtags');

  const igCountEl = document.getElementById('caption-ig-counter');
  const fbCountEl = document.getElementById('caption-fb-counter');
  const tagsCountEl = document.getElementById('hashtags-counter');

  if (igEl && igCountEl) {
    igCountEl.textContent = `${igEl.value.length} chars`;
  }
  if (fbEl && fbCountEl) {
    fbCountEl.textContent = `${fbEl.value.length} chars`;
  }
  if (tagsEl && tagsCountEl) {
    const count = tagsEl.value.split(/\s+/).filter(Boolean).length;
    tagsCountEl.textContent = `${count} hashtags`;
  }
}

// Human Approval & Live Publish Modal Handlers
let pendingPublishPostId = null;

function openPublishConfirmModal(postId) {
  const post = findPost(postId);
  if (!post) {
    showToast('Post not found', 'error');
    return;
  }

  // Strict human approval verification
  if (post.status !== 'Approved' && post.status !== 'Scheduled' && post.status !== 'Published') {
    showToast('Human Approval Required: Click APPROVE first before publishing live!', 'error');
    return;
  }

  pendingPublishPostId = post.id;
  const idInput = document.getElementById('publish-post-id');
  if (idInput) idInput.value = post.id;

  const titleEl = document.getElementById('publish-modal-title');
  if (titleEl) titleEl.textContent = `Post ${post.postNumber || post.id} — ${post.title}`;

  const thumbContainer = document.getElementById('publish-preview-thumb');
  if (thumbContainer) {
    let mediaFile = Array.isArray(post.media) ? post.media[0] : post.media;
    if (!post.isCustomMedia && (post.format === 'reel' || (typeof mediaFile === 'string' && mediaFile.endsWith('.mp4')))) {
      mediaFile = `/generated/post_${post.id}_reel.png`;
    }
    const safeThumbUrl = getMediaUrlWithCacheBuster(mediaFile, post.id);
    thumbContainer.innerHTML = `<img src="${escapeHtml(safeThumbUrl)}" alt="Preview" style="width: 100%; height: 100%; object-fit: contain;">`;
  }

  const checkEl = document.getElementById('human-approval-check');
  if (checkEl) checkEl.checked = true;

  // Check token status and populate banner
  const localToken = localStorage.getItem('meta_page_access_token') || '';
  const statusBanner = document.getElementById('publish-meta-status-banner');
  const mockCheckbox = document.getElementById('publish-mock-checkbox');

  if (statusBanner) {
    if (localToken) {
      statusBanner.innerHTML = `
        <div style="padding: 10px 14px; border-radius: 8px; background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; font-size: 12.5px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
          <span>🟢</span>
          <span><strong>Meta Token Connected:</strong> Ready for real live publishing to @girli_esglow and Facebook Page!</span>
        </div>
      `;
      if (mockCheckbox) mockCheckbox.checked = false;
    } else {
      statusBanner.innerHTML = `
        <div style="padding: 12px 14px; border-radius: 8px; background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; font-size: 12.5px; line-height: 1.5;">
          <div style="font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <span>⚠️</span> No Meta Access Token Connected
          </div>
          <div>Live posts cannot be sent to real accounts without a Meta Page Access Token.</div>
          <div style="margin-top: 6px;">
            <a href="#" onclick="event.preventDefault(); openMetaSettingsFromPublishModal();" style="color: #683DA9; font-weight: 700; text-decoration: underline;">👉 Click here to enter your Meta Token</a>
            <span style="color: #78350F; margin: 0 4px;">or check "Test Simulation Mode" below.</span>
          </div>
        </div>
      `;
      if (mockCheckbox) mockCheckbox.checked = true;
    }
  }

  const modal = document.getElementById('publish-confirm-modal');
  if (modal) modal.style.display = 'flex';
}

function closePublishConfirmModal() {
  pendingPublishPostId = null;
  const modal = document.getElementById('publish-confirm-modal');
  if (modal) modal.style.display = 'none';
}

function openMetaSettingsFromPublishModal() {
  closePublishConfirmModal();
  openMetaSettingsModal();
}

async function executeLivePublish() {
  const idInput = document.getElementById('publish-post-id');
  const postId = pendingPublishPostId || (idInput ? idInput.value : null);
  const post = findPost(postId);
  if (!post) {
    showToast('Post not found', 'error');
    return;
  }

  const approvalChecked = document.getElementById('human-approval-check')?.checked;
  if (!approvalChecked) {
    showToast('Please check the human approval box to confirm publishing authorization.', 'error');
    return;
  }

  const isMock = Boolean(document.getElementById('publish-mock-checkbox')?.checked);
  const token = localStorage.getItem('meta_page_access_token') || '';
  const pageId = localStorage.getItem('meta_page_id') || '61592791861631';
  const igUserId = localStorage.getItem('meta_ig_user_id') || '17841434751103617';

  if (!isMock && !token) {
    showToast('⚠️ Meta Page Access Token is missing! Please enter your token in Meta API Settings first.', 'error');
    openMetaSettingsFromPublishModal();
    return;
  }

  const confirmBtn = document.getElementById('confirm-publish-btn');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span>⏳</span> ' + (isMock ? 'Running Simulation...' : 'Publishing to Meta Live...');
  }

  try {
    const rawMedia = Array.isArray(post.media) ? post.media[0] : post.media;
    const isDataUri = typeof rawMedia === 'string' && rawMedia.startsWith('data:');

    const res = await fetch(`/api/posts/${post.id}/publish-live`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        humanApproved: true,
        options: {
          accessToken: token,
          pageId,
          igUserId,
          mockPublish: isMock,
          customMedia: isDataUri ? rawMedia : undefined
        }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to publish to Meta');
    }

    const idx = findPostIndex(post.id);
    if (idx !== -1 && data.post) {
      // Preserve custom media view on client
      if (isDataUri) {
        data.post.media = post.media;
        data.post.isCustomMedia = true;
      }
      posts[idx] = data.post;
    }

    closePublishConfirmModal();
    updateStats();
    renderCurrentView();

    if (data.details?.mode === 'mock') {
      showToast(`🧪 Test Simulation: Post ${post.id} verified! (No real post sent - token required for live posting)`, 'info');
    } else {
      const fbSuccess = Boolean(data.details?.facebook);
      const igSuccess = Boolean(data.details?.instagram);

      if (fbSuccess && igSuccess) {
        showToast(`🎉 Congratulations! Post ${post.id} is LIVE on both Instagram & Facebook Page!`, 'success', 8000);
      } else if (fbSuccess && !igSuccess) {
        const igReason = data.details?.instagramError || 'Instagram account not linked or permission missing';
        showToast(`✅ Posted to Facebook Page! ⚠️ Instagram: ${igReason}`, 'warning', 14000);
      } else if (!fbSuccess && igSuccess) {
        const fbReason = data.details?.facebookError || 'Facebook error';
        showToast(`✅ Posted to Instagram! ⚠️ Facebook Page: ${fbReason}`, 'warning', 14000);
      } else {
        showToast(`Post published with notices: ${data.details?.warning || data.message}`, 'warning', 10000);
      }
    }
  } catch (err) {
    showToast(`Publishing Error: ${err.message}`, 'error', 10000);
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<span>⚡</span> CONFIRM & PUBLISH LIVE';
    }
  }
}

// Meta API Settings Modal Handlers
async function openMetaSettingsModal() {
  const modal = document.getElementById('meta-settings-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  await loadMetaSettings();
}

function closeMetaSettingsModal() {
  const modal = document.getElementById('meta-settings-modal');
  if (modal) modal.style.display = 'none';
}

function toggleTokenVisibility() {
  const input = document.getElementById('meta-access-token');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

async function loadMetaSettings() {
  const localToken = localStorage.getItem('meta_page_access_token') || '';
  const localPageId = localStorage.getItem('meta_page_id') || '61592791861631';
  const localIgUserId = localStorage.getItem('meta_ig_user_id') || '17841434751103617';

  const tokenInput = document.getElementById('meta-access-token');
  const pageIdEl = document.getElementById('meta-page-id');
  const igIdEl = document.getElementById('meta-ig-user-id');

  if (tokenInput && localToken) tokenInput.value = localToken;
  if (pageIdEl) pageIdEl.value = localPageId || '61592791861631';
  if (igIdEl) igIdEl.value = localIgUserId || '17841434751103617';

  try {
    const res = await fetch('/api/settings/meta');
    if (!res.ok) return;
    const cfg = await res.json();
    if (pageIdEl && cfg.pageId) pageIdEl.value = cfg.pageId;
    if (igIdEl && cfg.igUserId && !localIgUserId) igIdEl.value = cfg.igUserId;

    const hasToken = Boolean(localToken || cfg.isConfigured);
    const statusEl = document.getElementById('meta-connection-status');
    if (statusEl) {
      statusEl.style.display = 'block';
      if (hasToken) {
        statusEl.style.background = '#ECFDF5';
        statusEl.style.color = '#065F46';
        statusEl.style.border = '1px solid #A7F3D0';
        statusEl.textContent = '🟢 Meta Access Token is configured and ready for live publishing!';
      } else {
        statusEl.style.display = 'block';
        statusEl.style.background = '#FFFBEB';
        statusEl.style.color = '#92400E';
        statusEl.style.border = '1px solid #FDE68A';
        statusEl.textContent = '⚠️ No Meta Token set yet. Enter your Page Access Token to publish to real accounts.';
      }
    }
  } catch (err) {
    console.warn('Could not load meta settings:', err.message);
  }
}

async function testMetaConnection() {
  const token = document.getElementById('meta-access-token').value.trim() || localStorage.getItem('meta_page_access_token') || '';
  const pageId = document.getElementById('meta-page-id').value.trim() || '61592791861631';
  const igUserId = document.getElementById('meta-ig-user-id').value.trim() || '17841434751103617';

  const statusEl = document.getElementById('meta-connection-status');
  if (!statusEl) return;
  statusEl.style.display = 'block';
  statusEl.style.background = '#EFF6FF';
  statusEl.style.color = '#1D4ED8';
  statusEl.style.border = '1px solid #BFDBFE';
  statusEl.textContent = 'Testing connection with Meta Graph API...';

  if (!token) {
    statusEl.style.background = '#FEF2F2';
    statusEl.style.color = '#991B1B';
    statusEl.style.border = '1px solid #FECACA';
    statusEl.textContent = '❌ Please paste your Meta Page Access Token before testing.';
    return;
  }

  try {
    const res = await fetch('/api/settings/meta/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: token, pageId, igUserId })
    });
    const data = await res.json();

    if (!res.ok || !data.isValid) {
      statusEl.style.background = '#FEF2F2';
      statusEl.style.color = '#991B1B';
      statusEl.style.border = '1px solid #FECACA';
      statusEl.textContent = `❌ Meta Error: ${data.error || 'Connection failed'}`;
    } else {
      const hasIg = data.igUserId && data.igUserId !== 'Not connected yet';
      statusEl.style.background = hasIg ? '#ECFDF5' : '#FFFBEB';
      statusEl.style.color = hasIg ? '#065F46' : '#92400E';
      statusEl.style.border = hasIg ? '1px solid #A7F3D0' : '1px solid #FDE68A';
      statusEl.textContent = data.message || `Connected to "${data.pageName}" (Page ID: ${data.pageId}, Instagram: ${data.igUserId})!`;

      // Save valid credentials to localStorage
      if (data.resolvedPageToken) {
        document.getElementById('meta-access-token').value = data.resolvedPageToken;
        localStorage.setItem('meta_page_access_token', data.resolvedPageToken);
      } else {
        localStorage.setItem('meta_page_access_token', token);
      }
      const finalPageId = data.pageId || '61592791861631';
      document.getElementById('meta-page-id').value = finalPageId;
      localStorage.setItem('meta_page_id', finalPageId);

      const finalIgId = data.igUserId || '17841434751103617';
      if (finalIgId && finalIgId !== 'Not connected yet') {
        document.getElementById('meta-ig-user-id').value = finalIgId;
        localStorage.setItem('meta_ig_user_id', finalIgId);
      }
      showToast('Meta connection verified successfully!', 'success');
    }
  } catch (err) {
    statusEl.style.background = '#FEF2F2';
    statusEl.style.color = '#991B1B';
    statusEl.style.border = '1px solid #FECACA';
    statusEl.textContent = '❌ Network error: ' + err.message;
  }
}

async function saveMetaSettings() {
  const token = document.getElementById('meta-access-token').value.trim();
  const pageId = document.getElementById('meta-page-id').value.trim() || '61592791861631';
  const igUserId = document.getElementById('meta-ig-user-id').value.trim() || '17841434751103617';

  if (token) localStorage.setItem('meta_page_access_token', token);
  localStorage.setItem('meta_page_id', pageId);
  localStorage.setItem('meta_ig_user_id', igUserId);

  try {
    const res = await fetch('/api/settings/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(token ? { accessToken: token } : {}),
        pageId,
        igUserId
      })
    });
    if (!res.ok) throw new Error('Failed to save settings');
    showToast('Meta API settings saved successfully! ⚙️', 'success');
    closeMetaSettingsModal();
  } catch (err) {
    showToast('Settings saved to browser storage! ⚙️', 'success');
    closeMetaSettingsModal();
  }
}


