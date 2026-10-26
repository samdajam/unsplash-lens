/**
 * Unsplash Image Search Application
 * Connects to the n8n automation webhook and renders high-resolution photos
 * with interactive gallery, lightbox, and formatted JSON inspector.
 */

(() => {
  'use strict';

  // --- Configuration ---
  const CONFIG = {
    WEBHOOK_URL: 'https://hopeu.app.n8n.cloud/webhook/a9bd47d1-aab4-4a9e-9605-7432f746ca10',
    REQUEST_TIMEOUT_MS: 20000,
    TOAST_DURATION_MS: 3000
  };

  // --- Application State ---
  const state = {
    currentQuery: '',
    currentData: null,
    images: [],
    isLoading: false,
    abortController: null,
    activeLightboxIndex: 0
  };

  // --- DOM Element References ---
  const elements = {
    // Search elements
    searchForm: document.getElementById('search-form'),
    searchInput: document.getElementById('search-input'),
    clearBtn: document.getElementById('clear-btn'),
    searchBtn: document.getElementById('search-btn'),
    btnText: document.querySelector('#search-btn .btn-text'),
    btnIcon: document.querySelector('#search-btn .btn-icon'),
    btnSpinner: document.querySelector('#search-btn .btn-spinner'),
    tagChips: document.getElementById('tag-chips'),

    // Gallery & States
    gallerySection: document.getElementById('gallery-section'),
    resultsHeading: document.getElementById('gallery-heading'),
    resultsQueryPill: document.getElementById('results-query-pill'),
    currentQueryLabel: document.getElementById('current-query-label'),
    resultsCount: document.getElementById('results-count'),
    resultsLatency: document.getElementById('results-latency'),
    welcomeState: document.getElementById('welcome-state'),
    loadingState: document.getElementById('loading-state'),
    photoGrid: document.getElementById('photo-grid'),
    emptyState: document.getElementById('empty-state'),
    errorState: document.getElementById('error-state'),
    errorTitle: document.getElementById('error-title'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),

    // JSON Inspector
    jsonToggle: document.getElementById('json-toggle'),
    inspectorBody: document.getElementById('inspector-body'),
    jsonCode: document.getElementById('json-code'),
    jsonStatusPill: document.getElementById('json-status-pill'),
    copyJsonBtn: document.getElementById('copy-json-btn'),

    // Lightbox Modal
    lightboxModal: document.getElementById('lightbox-modal'),
    lightboxBackdrop: document.getElementById('lightbox-backdrop'),
    lightboxDialog: document.querySelector('.lightbox-dialog'),
    lightboxClose: document.getElementById('lightbox-close'),
    lightboxImg: document.getElementById('lightbox-img'),
    lightboxSpinner: document.getElementById('lightbox-spinner'),
    lightboxExternal: document.getElementById('lightbox-external'),
    lightboxCounter: document.getElementById('lightbox-counter'),

    // Toast & Accessibility
    toast: document.getElementById('toast-notification'),
    toastText: document.getElementById('toast-text'),
    ariaLive: document.getElementById('aria-live-status')
  };

  let toastTimeoutId = null;

  // --- Initialization ---
  function init() {
    closeLightbox();
    bindEvents();
    // Default focus to search input
    if (elements.searchInput) {
      elements.searchInput.focus();
    }
  }

  // --- Event Bindings ---
  function bindEvents() {
    // Form search submission
    elements.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = elements.searchInput.value.trim();
      if (!query) {
        showToast('Please enter a search keyword');
        announceToScreenReader('Please enter a search keyword');
        elements.searchInput.focus();
        return;
      }
      performSearch(query);
    });

    // Clear search input button
    elements.searchInput.addEventListener('input', () => {
      elements.clearBtn.hidden = !elements.searchInput.value.trim();
    });

    elements.clearBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      elements.clearBtn.hidden = true;
      elements.searchInput.focus();
    });

    // Quick suggestion tag chips
    elements.tagChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.tag-chip');
      if (!chip) return;
      const query = chip.getAttribute('data-query');
      if (query) {
        elements.searchInput.value = query;
        elements.clearBtn.hidden = false;
        setActiveChip(query);
        performSearch(query);
      }
    });

    // Retry button in error state
    elements.retryBtn.addEventListener('click', () => {
      if (state.currentQuery) {
        performSearch(state.currentQuery);
      }
    });

    // JSON Inspector collapsible toggle
    elements.jsonToggle.addEventListener('click', toggleJsonInspector);
    elements.jsonToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleJsonInspector();
      }
    });

    // Copy JSON Payload button
    elements.copyJsonBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyJsonToClipboard();
    });

    // Lightbox closing actions
    elements.lightboxClose.addEventListener('click', closeLightbox);
    elements.lightboxBackdrop.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !elements.lightboxModal.hidden) {
        closeLightbox();
      }
    });
  }

  // --- Tag Highlight Management ---
  function setActiveChip(query) {
    const chips = elements.tagChips.querySelectorAll('.tag-chip');
    chips.forEach(chip => {
      if (chip.getAttribute('data-query')?.toLowerCase() === query.toLowerCase()) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  // --- Webhook Search Execution ---
  async function performSearch(keyword) {
    if (state.isLoading && state.abortController) {
      state.abortController.abort();
    }

    state.abortController = new AbortController();
    state.currentQuery = keyword;
    state.isLoading = true;

    const startTime = performance.now();

    // Update UI to loading state
    setLoadingUI(true);
    updateInspectorStatus('loading');
    announceToScreenReader(`Searching photos for ${keyword}`);

    // Build URL with sanitized query string parameter
    const requestUrl = `${CONFIG.WEBHOOK_URL}?q=${encodeURIComponent(keyword)}`;

    // Set a timeout to prevent hanging requests
    const timeoutId = setTimeout(() => {
      if (state.abortController) {
        state.abortController.abort('Request timed out');
      }
    }, CONFIG.REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: state.abortController.signal
      });

      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        throw new Error(`Webhook responded with HTTP status ${response.status} (${response.statusText || 'Error'})`);
      }

      const data = await response.json();
      state.currentData = data;
      state.images = Array.isArray(data.images) ? data.images : [];

      renderSuccessResults(state.images, keyword, latencyMs);
      renderJsonPayload(data, latencyMs);
      announceToScreenReader(`Found ${state.images.length} images for ${keyword}`);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.log('Search aborted for newer query.');
        return;
      }
      console.error('Webhook fetch failure:', err);
      renderErrorState(err.message || 'Unable to connect to the n8n webhook.');
      renderJsonError(err);
      announceToScreenReader('Error fetching images. Please try again.');
    } finally {
      state.isLoading = false;
      setLoadingUI(false);
    }
  }

  // --- UI State Management ---
  function setLoadingUI(isLoading) {
    elements.searchBtn.disabled = isLoading;
    elements.btnSpinner.hidden = !isLoading;
    elements.btnIcon.hidden = isLoading;

    if (isLoading) {
      elements.welcomeState.hidden = true;
      elements.emptyState.hidden = true;
      elements.errorState.hidden = true;
      elements.photoGrid.hidden = true;
      elements.loadingState.hidden = false;
    } else {
      elements.loadingState.hidden = true;
    }
  }

  function renderSuccessResults(images, keyword, latencyMs) {
    elements.welcomeState.hidden = true;
    elements.errorState.hidden = true;

    // Update Header Meta
    elements.resultsQueryPill.hidden = false;
    elements.currentQueryLabel.textContent = `"${keyword}"`;
    elements.resultsCount.hidden = false;
    elements.resultsCount.textContent = `${images.length} Image${images.length === 1 ? '' : 's'}`;
    elements.resultsLatency.hidden = false;
    elements.resultsLatency.textContent = `${latencyMs}ms`;

    if (!images || images.length === 0) {
      elements.emptyState.hidden = false;
      elements.photoGrid.hidden = true;
      return;
    }

    elements.emptyState.hidden = true;
    elements.photoGrid.hidden = false;
    elements.photoGrid.innerHTML = '';

    images.forEach((imageUrl, index) => {
      const card = createPhotoCard(imageUrl, index, keyword);
      elements.photoGrid.appendChild(card);
    });
  }

  function renderErrorState(message) {
    elements.welcomeState.hidden = true;
    elements.loadingState.hidden = true;
    elements.photoGrid.hidden = true;
    elements.emptyState.hidden = true;

    elements.errorState.hidden = false;
    elements.errorTitle.textContent = 'Webhook Error';
    elements.errorMessage.textContent = message;

    elements.resultsQueryPill.hidden = true;
    elements.resultsCount.hidden = true;
    elements.resultsLatency.hidden = true;
  }

  // --- Photo Card Component Builder ---
  function createPhotoCard(imageUrl, index, query) {
    const card = document.createElement('article');
    card.className = 'photo-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View photo ${index + 1} of ${query}`);

    // Image tag with loading optimization
    const img = document.createElement('img');
    img.className = 'card-img';
    img.src = imageUrl;
    img.alt = `Unsplash photo of ${query} (${index + 1})`;
    img.loading = 'lazy';
    img.decoding = 'async';

    // Handle image load error gracefully
    img.onerror = () => {
      img.remove();
      const fallback = document.createElement('div');
      fallback.className = 'img-fallback';
      fallback.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
        <span>Image preview unavailable</span>
      `;
      card.prepend(fallback);
    };

    // Overlay with interactive actions
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const badge = document.createElement('span');
    badge.className = 'card-badge';
    badge.textContent = `Photo ${index + 1}`;

    const actionGroup = document.createElement('div');
    actionGroup.className = 'card-action-group';

    // Preview Fullscreen Button
    const viewBtn = document.createElement('button');
    viewBtn.type = 'button';
    viewBtn.className = 'card-btn';
    viewBtn.title = 'View enlarged preview';
    viewBtn.setAttribute('aria-label', 'View photo fullscreen');
    viewBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="11" y1="8" x2="11" y2="14"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    `;
    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(index);
    });

    // Open Original in New Tab Link
    const openLink = document.createElement('a');
    openLink.href = imageUrl;
    openLink.target = '_blank';
    openLink.rel = 'noopener noreferrer';
    openLink.className = 'card-btn';
    openLink.title = 'Open high-res in new tab';
    openLink.setAttribute('aria-label', 'Open high-res in new tab');
    openLink.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    `;
    openLink.addEventListener('click', (e) => e.stopPropagation());

    // Copy Image URL Button
    const copyUrlBtn = document.createElement('button');
    copyUrlBtn.type = 'button';
    copyUrlBtn.className = 'card-btn';
    copyUrlBtn.title = 'Copy image URL';
    copyUrlBtn.setAttribute('aria-label', 'Copy image URL');
    copyUrlBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
      </svg>
    `;
    copyUrlBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyToClipboard(imageUrl, 'Image URL copied to clipboard');
    });

    actionGroup.appendChild(viewBtn);
    actionGroup.appendChild(openLink);
    actionGroup.appendChild(copyUrlBtn);

    actions.appendChild(badge);
    actions.appendChild(actionGroup);
    overlay.appendChild(actions);

    card.appendChild(img);
    card.appendChild(overlay);

    // Clicking card opens lightbox
    card.addEventListener('click', () => openLightbox(index));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(index);
      }
    });

    return card;
  }

  // --- Lightbox Modal Logic ---
  function openLightbox(index) {
    if (!state.images || !state.images[index]) return;
    state.activeLightboxIndex = index;
    const url = state.images[index];

    elements.lightboxCounter.textContent = `Photo ${index + 1} of ${state.images.length} — "${state.currentQuery}"`;
    elements.lightboxExternal.href = url;

    // Loading spinner while full-res image downloads
    if (elements.lightboxSpinner) {
      elements.lightboxSpinner.hidden = false;
    }
    elements.lightboxImg.style.opacity = '0';

    elements.lightboxImg.onload = () => {
      if (elements.lightboxSpinner) {
        elements.lightboxSpinner.hidden = true;
      }
      elements.lightboxImg.style.opacity = '1';
    };

    elements.lightboxImg.onerror = () => {
      if (elements.lightboxSpinner) {
        elements.lightboxSpinner.hidden = true;
      }
      elements.lightboxImg.style.opacity = '1';
    };

    elements.lightboxImg.src = url;

    elements.lightboxModal.hidden = false;
    elements.lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    elements.lightboxClose.focus();
    announceToScreenReader(`Photo ${index + 1} preview opened`);
  }

  function closeLightbox() {
    elements.lightboxModal.hidden = true;
    elements.lightboxModal.classList.remove('active');
    elements.lightboxImg.src = '';
    elements.lightboxImg.style.opacity = '0';
    if (elements.lightboxSpinner) {
      elements.lightboxSpinner.hidden = true;
    }
    document.body.style.overflow = '';
    announceToScreenReader('Photo preview closed');
  }

  // --- JSON Inspector & Syntax Highlighting ---
  function renderJsonPayload(data, latencyMs) {
    elements.copyJsonBtn.disabled = false;
    updateInspectorStatus('success', `HTTP 200 OK (${latencyMs}ms)`);

    const rawFormatted = JSON.stringify(data, null, 2);
    elements.jsonCode.innerHTML = syntaxHighlightJson(rawFormatted);
  }

  function renderJsonError(error) {
    elements.copyJsonBtn.disabled = true;
    updateInspectorStatus('error', 'Request Failed');

    const errPayload = {
      error: true,
      message: error.message || 'Network request failed',
      timestamp: new Date().toISOString()
    };
    elements.jsonCode.innerHTML = syntaxHighlightJson(JSON.stringify(errPayload, null, 2));
  }

  function updateInspectorStatus(type, label) {
    elements.jsonStatusPill.className = 'status-chip';
    if (type === 'loading') {
      elements.jsonStatusPill.classList.add('chip-loading');
      elements.jsonStatusPill.textContent = 'Querying Webhook...';
    } else if (type === 'success') {
      elements.jsonStatusPill.classList.add('chip-success');
      elements.jsonStatusPill.textContent = label || 'HTTP 200 OK';
    } else if (type === 'error') {
      elements.jsonStatusPill.classList.add('chip-error');
      elements.jsonStatusPill.textContent = label || 'Error';
    } else {
      elements.jsonStatusPill.classList.add('chip-idle');
      elements.jsonStatusPill.textContent = 'Awaiting Query';
    }
  }

  function toggleJsonInspector() {
    const isExpanded = elements.jsonToggle.getAttribute('aria-expanded') === 'true';
    elements.jsonToggle.setAttribute('aria-expanded', !isExpanded);
    elements.inspectorBody.classList.toggle('collapsed', isExpanded);
  }

  function copyJsonToClipboard() {
    if (!state.currentData) return;
    const text = JSON.stringify(state.currentData, null, 2);
    copyToClipboard(text, 'Webhook JSON payload copied to clipboard');
  }

  function copyToClipboard(text, successMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMessage);
      }).catch(() => {
        fallbackCopy(text, successMessage);
      });
    } else {
      fallbackCopy(text, successMessage);
    }
  }

  function fallbackCopy(text, successMessage) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(successMessage);
    } catch (e) {
      showToast('Unable to copy to clipboard');
    }
  }

  function syntaxHighlightJson(jsonString) {
    if (!jsonString) return '';
    // Escape HTML special characters
    const escaped = jsonString
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  }

  // --- Toast Notifications ---
  function showToast(message) {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }
    elements.toastText.textContent = message;
    elements.toast.hidden = false;

    toastTimeoutId = setTimeout(() => {
      elements.toast.hidden = true;
      toastTimeoutId = null;
    }, CONFIG.TOAST_DURATION_MS);
  }

  function announceToScreenReader(message) {
    if (elements.ariaLive) {
      elements.ariaLive.textContent = message;
    }
  }

  // Start the application on DOM content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
