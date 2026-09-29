// Girlies Glow Content Scheduler Frontend Client
let posts = [];
let currentView = 'grid';
const platformTabState = {}; // postId -> 'ig' | 'fb'
const carouselIndexState = {}; // postId -> current slide index

document.addEventListener('DOMContentLoaded', () => {
  loadPosts();
});

async function loadPosts() {
  try {
    const res = await fetch('/api/posts');
    if (!res.ok) throw new Error('Failed to fetch posts');
    posts = await res.json();
    updateStats();
    renderCurrentView();
  } catch (err) {
    showToast('Failed to load posts: ' + err.message, 'error');
  }
}

function updateStats() {
  document.getElementById('stat-total').textContent = posts.length;
  const drafts = posts.filter(p => p.status === 'Draft').length;
  const approved = posts.filter(p => p.status === 'Approved').length;
  const scheduled = posts.filter(p => p.status === 'Scheduled').length;

  document.getElementById('stat-drafts').textContent = `${drafts} Drafts`;
  document.getElementById('stat-approved').textContent = `${approved} Approved`;
  document.getElementById('stat-scheduled').textContent = `${scheduled} Scheduled`;
}

function switchView(view) {
  currentView = view;
  document.getElementById('view-grid-btn').classList.toggle('active', view === 'grid');
  document.getElementById('view-table-btn').classList.toggle('active', view === 'table');
  document.getElementById('view-calendar-btn').classList.toggle('active', view === 'calendar');

  document.getElementById('posts-grid').style.display = view === 'grid' ? 'grid' : 'none';
  document.getElementById('table-container').style.display = view === 'table' ? 'block' : 'none';
  document.getElementById('calendar-container').style.display = view === 'calendar' ? 'block' : 'none';

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
  container.innerHTML = '';

  posts.forEach(post => {
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
          <button class="tab-btn ${activeTab === 'ig' ? 'active' : ''}" onclick="setPostTab(${post.id}, 'ig')">
            Instagram Preview
          </button>
          <button class="tab-btn ${activeTab === 'fb' ? 'active' : ''}" onclick="setPostTab(${post.id}, 'fb')">
            Facebook Page Preview
          </button>
        </div>

        <div class="caption-box">
          ${activeTab === 'ig' ? escapeHtml(post.captionIg) : escapeHtml(post.captionFb)}
        </div>

        <div class="hashtags-box">
          ${Array.isArray(post.hashtags) ? post.hashtags.map(h => escapeHtml(h)).join(' ') : escapeHtml(post.hashtags || '')}
        </div>
      </div>

      <div class="post-card-actions">
        <button class="card-action-btn" onclick="openEditModal(${post.id})" title="Edit caption, dates, or destinations">
          <span>✏️</span> EDIT
        </button>
        <button class="card-action-btn btn-approve-toggle" onclick="toggleApprove(${post.id})" title="Toggle post approval">
          <span>${post.status === 'Approved' || post.status === 'Scheduled' ? '✓' : '○'}</span>
          ${post.status === 'Approved' || post.status === 'Scheduled' ? 'APPROVED' : 'APPROVE'}
        </button>
        <button class="card-action-btn" onclick="regenerateMedia(${post.id})" title="Re-render creative graphics">
          <span>🎨</span> REGEN
        </button>
        <button class="card-action-btn btn-schedule-action" onclick="schedulePost(${post.id})" title="Validate safety & schedule">
          <span>🚀</span> ${post.status === 'Scheduled' ? 'SCHEDULED' : 'SCHEDULE'}
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

function renderMediaPreview(post, currentSlideIndex) {
  if (post.format === 'carousel' && Array.isArray(post.media)) {
    const totalSlides = post.media.length;
    const safeIndex = Math.min(Math.max(0, currentSlideIndex), totalSlides - 1);
    const mediaPath = post.media[safeIndex];

    return `
      <img src="${escapeHtml(mediaPath)}" alt="${escapeHtml(post.title)} Slide ${safeIndex + 1}" class="media-img" loading="lazy">
      <div class="carousel-overlay-controls">
        <button type="button" class="carousel-arrow" onclick="changeSlide(${post.id}, -1)">&larr;</button>
        <button type="button" class="carousel-arrow" onclick="changeSlide(${post.id}, 1)">&rarr;</button>
      </div>
      <div class="carousel-badge">Slide ${safeIndex + 1} of ${totalSlides}</div>
    `;
  }

  if (post.format === 'reel') {
    const mediaFile = Array.isArray(post.media) ? post.media[0] : post.media;
    // Reel preview with animated video or GIF demonstration
    const gifSource = post.sourceAssets?.find(a => a.endsWith('.gif')) || mediaFile;
    return `
      <div style="position: relative; width: 100%; height: 100%;">
        <img src="/${escapeHtml(gifSource)}" alt="Reel Demo" class="media-img" style="object-fit: cover;">
        <div style="position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">
          ▶ Reel (9:16 Demonstration)
        </div>
      </div>
    `;
  }

  // Static post
  const mediaFile = Array.isArray(post.media) ? post.media[0] : post.media;
  return `
    <img src="${escapeHtml(mediaFile)}" alt="${escapeHtml(post.title)}" class="media-img" loading="lazy">
  `;
}

function changeSlide(postId, delta) {
  const post = posts.find(p => p.id === postId);
  if (!post || !Array.isArray(post.media)) return;

  const total = post.media.length;
  let next = (carouselIndexState[postId] || 0) + delta;
  if (next < 0) next = total - 1;
  if (next >= total) next = 0;

  carouselIndexState[postId] = next;
  renderGrid();
}

function setPostTab(postId, tab) {
  platformTabState[postId] = tab;
  renderGrid();
}

// Render Table View
function renderTable() {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';

  posts.forEach(post => {
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
          <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="openEditModal(${post.id})">Edit</button>
          <button class="btn btn-primary" style="padding: 4px 8px; font-size: 11px;" onclick="schedulePost(${post.id})">Schedule</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Calendar Timeline View
function renderCalendar() {
  const container = document.getElementById('timeline-grid');
  container.innerHTML = '';

  posts.forEach(post => {
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
        <button class="btn btn-secondary" style="flex: 1; padding: 6px 8px; font-size: 11px;" onclick="openEditModal(${post.id})">Edit</button>
        <button class="btn btn-success" style="flex: 1; padding: 6px 8px; font-size: 11px;" onclick="schedulePost(${post.id})">Schedule</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Modal Handlers
function openEditModal(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  document.getElementById('edit-post-id').value = post.id;
  document.getElementById('modal-title').textContent = `Edit Post ${post.postNumber || post.id} — ${post.title}`;
  document.getElementById('edit-title').value = post.title || '';
  document.getElementById('edit-angle').value = post.angle || '';

  const fbSelect = document.getElementById('edit-fb-dest');
  fbSelect.value = post.destinations?.facebookPage || 'Girlies Glow Facebook Business Page';

  document.getElementById('edit-ig-dest').value = post.destinations?.instagram || '@girli_esglow';
  document.getElementById('edit-date').value = post.schedule?.date || '';
  document.getElementById('edit-time').value = post.schedule?.time || '';
  document.getElementById('edit-caption-ig').value = post.captionIg || '';
  document.getElementById('edit-caption-fb').value = post.captionFb || '';
  document.getElementById('edit-hashtags').value = Array.isArray(post.hashtags) ? post.hashtags.join(' ') : (post.hashtags || '');

  document.getElementById('edit-modal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
}

async function savePostEdit() {
  const id = document.getElementById('edit-post-id').value;
  const post = posts.find(p => String(p.id) === String(id));
  if (!post) return;

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
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPayload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update post');
    }
    const saved = await res.json();
    const idx = posts.findIndex(p => String(p.id) === String(id));
    if (idx !== -1) posts[idx] = saved;

    closeEditModal();
    updateStats();
    renderCurrentView();
    showToast(`Post ${id} updated successfully`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Action Handlers
async function toggleApprove(postId) {
  try {
    const res = await fetch(`/api/posts/${postId}/approve`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to approve post');
    const updated = await res.json();
    const idx = posts.findIndex(p => p.id === postId);
    if (idx !== -1) posts[idx] = updated;

    updateStats();
    renderCurrentView();
    showToast(`Post ${postId} status: ${updated.status}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function schedulePost(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  try {
    const res = await fetch(`/api/posts/${postId}/schedule`, {
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

    const idx = posts.findIndex(p => p.id === postId);
    if (idx !== -1) posts[idx] = data;

    dismissGuardrailAlert();
    updateStats();
    renderCurrentView();
    showToast(`Post ${postId} scheduled to Girlies Glow Facebook Page & Instagram!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function regenerateMedia(postId) {
  showToast(`Regenerating creative for Post ${postId}...`, 'info');
  try {
    const res = await fetch(`/api/posts/${postId}/regenerate-media`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to regenerate creative');

    showToast(`Creative for Post ${postId} regenerated!`, 'success');
    renderGrid();
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
  document.getElementById('guardrail-error-msg').textContent = msg;
  alertEl.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function dismissGuardrailAlert() {
  document.getElementById('guardrail-alert').style.display = 'none';
}

// Toast System
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : type === 'success' ? 'toast-success' : ''}`;
  toast.innerHTML = `<span>${type === 'error' ? '⚠️' : type === 'success' ? '✓' : 'ℹ️'}</span> <span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
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
