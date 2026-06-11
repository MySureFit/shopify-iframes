/**
 * SelfieStyler Embed Script
 *
 * Add to any Shopify store via:
 *   <script src="https://app.selfiestyler.com/embed.js" defer></script>
 *
 * Or inject programmatically via the Shopify Script Tags API when the app is installed.
 *
 * How it works:
 *   1. Detects the current Shopify shop domain
 *   2. Creates an overlay system with three iframes (products, models, fitting-room)
 *   3. Listens for postMessage events from iframes to navigate between them
 *   4. Exposes window.SelfieStyler for manual control
 */
(function (win, doc) {
  'use strict';

  var APP_URL = 'https://app.selfiestyler.com';
  var SHOP    = (win.Shopify && win.Shopify.shop) || win.location.hostname;
  var SOURCE  = 'selfiestyler';

  // ── DOM references ─────────────────────────────────────────────────
  var overlay, overlayBody, closeBtn;
  var iframes = {};   // { products, models, 'fitting-room' }

  // ── Build overlay ──────────────────────────────────────────────────
  function buildOverlay() {
    overlay = doc.createElement('div');
    overlay.id = 'ss-overlay';
    overlay.style.cssText = [
      'display:none',
      'position:fixed',
      'inset:0',
      'z-index:2147483647',
      'background:rgba(0,0,0,0.55)',
      'align-items:center',
      'justify-content:center',
    ].join(';');

    overlayBody = doc.createElement('div');
    overlayBody.style.cssText = [
      'position:relative',
      'width:min(480px,95vw)',
      'height:min(780px,90vh)',
      'background:#fff',
      'border-radius:14px',
      'overflow:hidden',
      'box-shadow:0 24px 80px rgba(0,0,0,0.35)',
    ].join(';');

    closeBtn = doc.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = [
      'position:absolute',
      'top:10px',
      'right:10px',
      'z-index:10',
      'width:32px',
      'height:32px',
      'border-radius:50%',
      'border:none',
      'background:rgba(0,0,0,0.15)',
      'color:#fff',
      'font-size:20px',
      'line-height:1',
      'cursor:pointer',
    ].join(';');
    closeBtn.onclick = closeOverlay;

    overlay.appendChild(overlayBody);
    overlay.appendChild(closeBtn);
    doc.body.appendChild(overlay);

    // Close on backdrop click
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeOverlay();
    });
  }

  // ── Create iframe (lazy — only when first opened) ──────────────────
  function getIframe(name) {
    if (iframes[name]) return iframes[name];

    var frame = doc.createElement('iframe');
    frame.src = APP_URL + '/iframe/' + name + '?shop=' + encodeURIComponent(SHOP);
    frame.style.cssText = 'width:100%;height:100%;border:none;display:none;';
    frame.setAttribute('allow', 'camera;microphone');
    frame.setAttribute('allowfullscreen', '');
    overlayBody.appendChild(frame);
    iframes[name] = frame;
    return frame;
  }

  // ── Show a specific iframe, hide others ───────────────────────────
  function showIframe(name) {
    Object.keys(iframes).forEach(function (key) {
      iframes[key].style.display = 'none';
    });
    var frame = getIframe(name);
    frame.style.display = 'block';
  }

  // ── Open overlay on a specific iframe ─────────────────────────────
  function openOverlay(startIframe) {
    if (!overlay) buildOverlay();
    showIframe(startIframe || 'products');
    overlay.style.display = 'flex';
    doc.body.style.overflow = 'hidden';
  }

  // ── Close overlay ─────────────────────────────────────────────────
  function closeOverlay() {
    if (!overlay) return;
    overlay.style.display = 'none';
    doc.body.style.overflow = '';
  }

  // ── Listen for messages from iframes ──────────────────────────────
  win.addEventListener('message', function (e) {
    if (!e.data || e.data.source !== SOURCE) return;

    switch (e.data.type) {
      case 'SS_NAVIGATE':
        var target = e.data.target;
        if (target === 'products') {
          showIframe('products');
        } else if (target === 'models') {
          showIframe('models');
        } else if (target === 'fitting-room') {
          showIframe('fitting-room');
        } else if (target === 'activation') {
          // Activation flow — open in same overlay or redirect
          // Placeholder: show alert until activation iframe is built
          alert('Activation coming soon. Please select a demo model.');
          showIframe('models');
        }
        break;

      case 'SS_CLOSE':
        closeOverlay();
        break;

      default:
        break;
    }
  });

  // ── Inject "Try On" button on Shopify product pages ───────────────
  function injectProductPageButton() {
    // Wait for the Add-to-Cart form to be present
    var form = doc.querySelector('form[action*="/cart/add"]');
    if (!form) return;

    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.id = 'ss-try-on-btn';
    btn.textContent = '👗 Virtual Try-On';
    btn.style.cssText = [
      'display:block',
      'width:100%',
      'margin-top:10px',
      'padding:14px',
      'background:#1a1a1a',
      'color:#fff',
      'border:none',
      'border-radius:8px',
      'font-size:15px',
      'font-weight:600',
      'cursor:pointer',
      'letter-spacing:0.2px',
    ].join(';');
    btn.onmouseover = function () { btn.style.background = '#333'; };
    btn.onmouseout  = function () { btn.style.background = '#1a1a1a'; };
    btn.onclick = function () { openOverlay('products'); };

    form.insertAdjacentElement('afterend', btn);
  }

  // ── Init ──────────────────────────────────────────────────────────
  function init() {
    // Auto-inject on product pages
    if (win.location.pathname.indexOf('/products/') !== -1) {
      if (doc.readyState === 'loading') {
        doc.addEventListener('DOMContentLoaded', injectProductPageButton);
      } else {
        injectProductPageButton();
      }
    }

    // Pre-build overlay structure so first open is instant
    buildOverlay();
  }

  // ── Public API ────────────────────────────────────────────────────
  win.SelfieStyler = {
    open:  openOverlay,
    close: closeOverlay,
    show:  showIframe,
  };

  init();

}(window, document));
