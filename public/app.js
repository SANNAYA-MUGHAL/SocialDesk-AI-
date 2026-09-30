// Girlies Glow Content Scheduler Frontend Client
let posts = [];
let currentView = 'grid';
let filterFormat = 'all';
let filterStatus = 'all';
const platformTabState = {}; // postId -> 'ig' | 'fb'
const carouselIndexState = {}; // postId -> current slide index
const mediaCacheBusters = {}; // postId -> timestamp for cache busting

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
    updateStats();
    renderCurrentView();
  } catch (err) {
    showToast('Failed to load posts: ' + err.message, 'error');
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

      <div class="media-preview-container ${post.format === 'reel' ? 'media-aspect-9-16' : 'media-aspect-4-5'}">
        ${mediaHtml}
      </div>

      <div class="card-quick-tools">
        <button type="button" class="quick-tool-btn btn-ig-preview" onclick="openMobilePreview('${post.id}')" title="Preview post in phone mockup">
          <span>📱</span> IG Phone Preview
        </button>
        <div style="display: flex; gap: 6px;">
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
  const cacheBuster = mediaCacheBusters[post.id] ? `?t=${mediaCacheBusters[post.id]}` : '';

  if (post.format === 'carousel' && Array.isArray(post.media)) {
    const totalSlides = post.media.length;
    const safeIndex = Math.min(Math.max(0, currentSlideIndex), totalSlides - 1);
    const mediaPath = post.media[safeIndex] + cacheBuster;

    return `
      <img src="${escapeHtml(mediaPath)}" alt="${escapeHtml(post.title)} Slide ${safeIndex + 1}" class="media-img" loading="lazy">
      <div class="carousel-overlay-controls">
        <button type="button" class="carousel-arrow" onclick="changeSlide('${post.id}', -1)">&larr;</button>
        <button type="button" class="carousel-arrow" onclick="changeSlide('${post.id}', 1)">&rarr;</button>
      </div>
      <div class="carousel-badge">Slide ${safeIndex + 1} of ${totalSlides}</div>
    `;
  }

  if (post.format === 'reel') {
    const reelCover = `/generated/post_${post.id}_reel.png` + cacheBuster;
    return `
      <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #180B28;">
        <img src="${escapeHtml(reelCover)}" alt="${escapeHtml(post.title)} Reel Cover" class="media-img" style="object-fit: contain; width: 100%; height: 100%;">
        <div style="position: absolute; top: 12px; left: 12px; background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(8px); color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; border: 1px solid rgba(255, 255, 255, 0.2);">
          ▶ REEL (9:16)
        </div>
      </div>
    `;
  }

  // Static post
  const rawMedia = Array.isArray(post.media) ? post.media[0] : post.media;
  const mediaFile = rawMedia + cacheBuster;
  return `
    <img src="${escapeHtml(mediaFile)}" alt="${escapeHtml(post.title)}" class="media-img" loading="lazy">
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

  document.getElementById('edit-post-id').value = post.id;
  document.getElementById('modal-title').textContent = `Edit Post ${post.postNumber || post.id} — ${post.title}`;
  document.getElementById('edit-title').value = post.title || '';
  document.getElementById('edit-angle').value = post.angle || '';

  const fbSelect = document.getElementById('edit-fb-dest');
  if (fbSelect) {
    fbSelect.value = post.destinations?.facebookPage || 'Girlies Glow Facebook Business Page';
  }

  document.getElementById('edit-ig-dest').value = post.destinations?.instagram || '@girli_esglow';
  document.getElementById('edit-date').value = post.schedule?.date || '';
  document.getElementById('edit-time').value = post.schedule?.time || '';
  document.getElementById('edit-caption-ig').value = post.captionIg || '';
  document.getElementById('edit-caption-fb').value = post.captionFb || '';
  document.getElementById('edit-hashtags').value = Array.isArray(post.hashtags) ? post.hashtags.join(' ') : (post.hashtags || '');

  updateCharCounters();

  const modal = document.getElementById('edit-modal');
  if (modal) {
    modal.style.display = 'flex';
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
    if (idx !== -1) posts[idx] = saved;

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
      posts[idx] = updated;
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
    if (idx !== -1) posts[idx] = data;

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
    posts = data.posts;
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

    posts = data.posts;
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
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : type === 'success' ? 'toast-success' : ''}`;
  toast.innerHTML = `<span>${type === 'error' ? '⚠️' : type === 'success' ? '✓' : 'ℹ️'}</span> <span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast && toast.style) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }
    setTimeout(() => {
      if (toast && typeof toast.remove === 'function') toast.remove();
    }, 300);
  }, 4000);
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

  const cacheBuster = mediaCacheBusters[post.id] ? `?t=${mediaCacheBusters[post.id]}` : '';
  let mediaHtml = '';
  if (post.format === 'carousel' && Array.isArray(post.media)) {
    const curIndex = carouselIndexState[post.id] || 0;
    const safeIdx = Math.min(Math.max(0, curIndex), post.media.length - 1);
    mediaHtml = `<img src="${escapeHtml(post.media[safeIdx]) + cacheBuster}" alt="Carousel Preview" style="max-height: 400px; width: 100%; object-fit: contain;">`;
  } else if (post.format === 'reel') {
    const reelCover = `/generated/post_${post.id}_reel.png` + cacheBuster;
    mediaHtml = `<img src="${escapeHtml(reelCover)}" alt="Reel Preview" style="max-height: 480px; width: 100%; object-fit: contain;">`;
  } else {
    const rawMedia = Array.isArray(post.media) ? post.media[0] : post.media;
    mediaHtml = `<img src="${escapeHtml(rawMedia) + cacheBuster}" alt="Static Preview" style="max-height: 400px; width: 100%; object-fit: contain;">`;
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
    const cacheBuster = mediaCacheBusters[post.id] ? `?t=${mediaCacheBusters[post.id]}` : '';
    let mediaFile = Array.isArray(post.media) ? post.media[0] : post.media;
    if (post.format === 'reel' || (typeof mediaFile === 'string' && mediaFile.endsWith('.mp4'))) {
      mediaFile = `/generated/post_${post.id}_reel.png`;
    }
    mediaFile += cacheBuster;
    thumbContainer.innerHTML = `<img src="${escapeHtml(mediaFile)}" alt="Preview" style="width: 100%; height: 100%; object-fit: contain;">`;
  }

  const checkEl = document.getElementById('human-approval-check');
  if (checkEl) checkEl.checked = true;

  const modal = document.getElementById('publish-confirm-modal');
  if (modal) modal.style.display = 'flex';
}

function closePublishConfirmModal() {
  pendingPublishPostId = null;
  const modal = document.getElementById('publish-confirm-modal');
  if (modal) modal.style.display = 'none';
}

async function executeLivePublish() {
  const idInput = document.getElementById('publish-post-id');
  const postId = pendingPublishPostId || (idInput ? idInput.value : null);
  const post = findPost(postId);
  if (!post) {
    showToast('Post not found', 'error');
    return;
  }

  const checkEl = document.getElementById('human-approval-check');
  if (checkEl && !checkEl.checked) {
    showToast('Please check the human approval box to confirm publishing authorization.', 'error');
    return;
  }

  const confirmBtn = document.getElementById('confirm-publish-btn');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span>⏳</span> Publishing to Meta...';
  }

  try {
    const res = await fetch(`/api/posts/${post.id}/publish-live`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options: {} })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to publish to Meta');
    }

    const idx = findPostIndex(post.id);
    if (idx !== -1 && data.post) {
      posts[idx] = data.post;
    }

    closePublishConfirmModal();
    updateStats();
    renderCurrentView();

    const modeText = data.details?.mode === 'mock' ? ' (Simulated - Add token in Meta Settings to publish live)' : '';
    showToast(`Post ${post.id} successfully published to Meta! 🎉${modeText}`, 'success');
  } catch (err) {
    showToast(`Publishing Error: ${err.message}`, 'error');
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
  try {
    const res = await fetch('/api/settings/meta');
    if (!res.ok) return;
    const cfg = await res.json();
    const pageIdEl = document.getElementById('meta-page-id');
    const igIdEl = document.getElementById('meta-ig-user-id');
    if (pageIdEl && cfg.pageId) pageIdEl.value = cfg.pageId;
    if (igIdEl && cfg.igUserId) igIdEl.value = cfg.igUserId;

    const statusEl = document.getElementById('meta-connection-status');
    if (statusEl) {
      if (cfg.isConfigured) {
        statusEl.style.display = 'block';
        statusEl.style.background = '#ECFDF5';
        statusEl.style.color = '#065F46';
        statusEl.style.border = '1px solid #A7F3D0';
        statusEl.textContent = '🟢 Meta Access Token is configured and ready for live publishing!';
      } else {
        statusEl.style.display = 'block';
        statusEl.style.background = '#FFFBEB';
        statusEl.style.color = '#92400E';
        statusEl.style.border = '1px solid #FDE68A';
        statusEl.textContent = 'ℹ️ No Meta Token set yet. Live publish runs in verified safe mode until a token is entered.';
      }
    }
  } catch (err) {
    console.warn('Could not load meta settings:', err.message);
  }
}

async function testMetaConnection() {
  const token = document.getElementById('meta-access-token').value;
  const pageId = document.getElementById('meta-page-id').value;
  const igUserId = document.getElementById('meta-ig-user-id').value;

  const statusEl = document.getElementById('meta-connection-status');
  if (!statusEl) return;
  statusEl.style.display = 'block';
  statusEl.style.background = '#EFF6FF';
  statusEl.style.color = '#1D4ED8';
  statusEl.style.border = '1px solid #BFDBFE';
  statusEl.textContent = 'Testing connection with Meta Graph API...';

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
      statusEl.style.background = '#ECFDF5';
      statusEl.style.color = '#065F46';
      statusEl.style.border = '1px solid #A7F3D0';
      statusEl.textContent = `✅ Connected to "${data.pageName}" (Page ID: ${data.pageId}, Instagram: ${data.igUserId})!`;
      if (data.igUserId && !igUserId) {
        document.getElementById('meta-ig-user-id').value = data.igUserId;
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
  const token = document.getElementById('meta-access-token').value;
  const pageId = document.getElementById('meta-page-id').value;
  const igUserId = document.getElementById('meta-ig-user-id').value;

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
    showToast(err.message, 'error');
  }
}


