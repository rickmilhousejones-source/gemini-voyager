/**
 * Fetch Interceptor - Injected into MAIN world
 *
 * This script runs in the page context (MAIN world) to intercept native fetch calls.
 * It catches Gemini download requests and modifies them to fetch the original resolution image
 * without watermark parameters.
 *
 * The script respects the user's watermark remover setting and communicates with the
 * content script via DOM-based bridge for watermark removal processing.
 * (CustomEvents don't cross world boundaries in Firefox, so we use a hidden DOM element)
 */

(function () {
  'use strict';

  /** Timeout for watermark processing in milliseconds */
  const WATERMARK_PROCESSING_TIMEOUT_MS = 30000;
  const DOWNLOAD_INTENT_ATTRIBUTE = 'data-download-intent-expires-at';
  /** Bump when interceptor logic changes so re-inject can replace a stale wrapper. */
  const INTERCEPTOR_REVISION = 2;
  /** How long after a PNG process we rewrite <a download="*.jfif"> to .png */
  const PNG_FILENAME_ARM_MS = 60000;
  const IMAGE_EXT_RE = /\.(jfif|jpe?g|webp|gif)$/i;

  if (window.__gvFetchInterceptorRevision === INTERCEPTOR_REVISION) {
    console.log(
      '[Gemini Voyager] Fetch interceptor already at revision',
      INTERCEPTOR_REVISION,
      '- skipping',
    );
    return;
  }

  // Unwrap a previous Voyager wrapper so we don't stack fetch hooks on upgrade.
  if (typeof window.__gvOriginalFetch === 'function') {
    window.fetch = window.__gvOriginalFetch;
  }

  window.__gvOriginalFetch = window.fetch.bind(window);
  window.__gvFetchInterceptorRevision = INTERCEPTOR_REVISION;
  window.__gvFetchInterceptorInstalled = true;

  console.log(
    '[Gemini Voyager] Fetch interceptor loading (MAIN world, revision',
    INTERCEPTOR_REVISION + ')...',
  );

  /**
   * Gemini's image download is a multi-step chain on `googleusercontent.com`:
   *
   *   /gg-dl/...=d-I        → text body containing the next URL (~450B)
   *   /...usercontent.google.com/rd-gg-dl/...=s0-d-I  → another text body
   *   /rd-gg-dl/...=s0-d-I  → the actual image bytes
   *
   * We intercept ONLY the final image step. Intercepting the text-body steps
   * would consume `consumeDownloadIntent()` on the first hop and feed the
   * watermark pipeline a 450-byte text blob (which fails to decode as an
   * image), so they MUST pass through untouched.
   *
   *   /rd-gg-dl/  — current image endpoint
   *   /rd-gg/     — older image endpoint, still occasionally seen
   */
  const GEMINI_DOWNLOAD_PATTERN =
    /https:\/\/[^/]+(\.googleusercontent\.com|\.ggpht\.com)\/(?:rd-gg-dl|rd-gg)\//;
  const CSP_BLOCKED_TELEMETRY_PATTERNS = [/^https:\/\/www\.googletagmanager\.com\/td\?/i];
  /**
   * Matches Google's size token `=sNNN` / `=wNNN` / `=hNNN`. The size number is
   * captured tightly (without trailing flags like `-d-I`) so a URL such as
   * `=s0-d-I` keeps its download flag when we replace the size.
   */
  const GOOGLE_SIZE_PATTERN = /=[swh]\d+/;
  /**
   * Matches a URL that already requests the original size (`=s0` optionally
   * followed by a `-flag` suffix). Such URLs should not be rewritten.
   */
  const ORIGINAL_SIZE_PATTERN = /=s0(?:-[A-Za-z0-9]+)?(?=[?#]|$)/;
  /**
   * Matches Google's download parameter `=d` / `=d-I`. URLs ending in this
   * already serve the original-sized image so we must not append `-s0`.
   */
  const GOOGLE_DOWNLOAD_PARAM_PATTERN = /=d(?:-[A-Za-z0-9]+)?(?=[?#]|$)/;

  /**
   * Replace size parameter with =s0 for original size
   * Gemini uses =sNNN format for resized images, =s0 means original
   */
  const replaceWithOriginalSize = (src) => {
    // Already requesting original (e.g. `=s0`, `=s0-d-I`). Leave it alone.
    if (ORIGINAL_SIZE_PATTERN.test(src)) {
      return src;
    }
    // `=d` / `=d-I` URLs already serve the original-sized image; leave them untouched
    // to avoid producing an invalid URL like `...=d-I?alr=yes-s0`.
    if (GOOGLE_DOWNLOAD_PARAM_PATTERN.test(src)) {
      return src;
    }
    // Replace size token while preserving any trailing flags (e.g. `=s512-d-I` → `=s0-d-I`).
    if (GOOGLE_SIZE_PATTERN.test(src)) {
      return src.replace(GOOGLE_SIZE_PATTERN, '=s0');
    }
    // Fallback: if no size param but it's a google image, append =s0
    return src.includes('=') ? src + '-s0' : src + '=s0';
  };

  const isKnownCspBlockedTelemetryRequest = (requestUrl) =>
    CSP_BLOCKED_TELEMETRY_PATTERNS.some((pattern) => pattern.test(requestUrl));

  /**
   * DOM-based communication bridge
   * CustomEvents don't cross world boundaries in Firefox, so we use a hidden DOM element
   */
  const GV_BRIDGE_ID = 'gv-watermark-bridge';

  const getBridgeElement = () => {
    let bridge = document.getElementById(GV_BRIDGE_ID);
    if (!bridge) {
      bridge = document.createElement('div');
      bridge.id = GV_BRIDGE_ID;
      bridge.style.display = 'none';
      document.documentElement.appendChild(bridge);
    }
    return bridge;
  };

  /**
   * Update status on the bridge for the content script to pick up (and show Toasts)
   */
  const updateStatus = (status, details = {}) => {
    const bridge = getBridgeElement();
    if (bridge) {
      bridge.dataset.status = JSON.stringify({
        type: status, // 'START', 'PROGRESS', 'SUCCESS', 'ERROR', 'WARNING'
        timestamp: Date.now(),
        ...details,
      });
    }
  };

  /**
   * Check if watermark remover is enabled by reading from bridge element
   */
  const isWatermarkRemoverEnabled = () => {
    const bridge = getBridgeElement();
    return bridge.dataset.enabled === 'true';
  };

  let pngFilenameArmUntil = 0;

  const armPngFilename = () => {
    pngFilenameArmUntil = Date.now() + PNG_FILENAME_ARM_MS;
  };

  const toPngFilename = (name) => {
    const base = String(name || 'Gemini_Generated_Image').replace(/["\r\n]/g, '');
    if (IMAGE_EXT_RE.test(base)) return base.replace(IMAGE_EXT_RE, '.png');
    if (/\.png$/i.test(base)) return base;
    return `${base}.png`;
  };

  const rewriteDownloadNameIfArmed = (name) => {
    if (typeof name !== 'string' || !name || Date.now() > pngFilenameArmUntil) return name;
    return toPngFilename(name);
  };
  // Keep the active rewriter on window so prototype patches survive interceptor upgrades.
  window.__gvRewriteDownloadName = rewriteDownloadNameIfArmed;

  const extractDownloadFilename = (disposition) => {
    if (!disposition) return null;
    const star = disposition.match(/filename\*\s*=\s*(?:UTF-8''|utf-8'')([^;\s]+)/i);
    if (star) {
      try {
        return decodeURIComponent(star[1].replace(/["']/g, ''));
      } catch {
        // keep going
      }
    }
    const plain =
      disposition.match(/filename\s*=\s*"([^"]+)"/i) ||
      disposition.match(/filename\s*=\s*([^;\s]+)/i);
    return plain ? plain[1].replace(/["']/g, '') : null;
  };

  /**
   * Build response headers for the watermark-stripped download.
   * Processed output is PNG (canvas.toDataURL), but Gemini's original response
   * still advertises image/jpeg + a .jfif/.jpg filename — Chrome then saves PNG
   * bytes as .jfif. Align Content-Type / Content-Disposition with the actual
   * blob so the browser downloads a real .png. Drop Content-Length so the UA
   * derives it from the new body (keeping the JPEG length would truncate).
   *
   * Note: Gemini often ignores these headers and sets <a download="*.jfif"> on a
   * blob: URL instead — see armPngFilename / download-property patch below.
   */
  const buildProcessedDownloadHeaders = (originalHeaders, processedBlob) => {
    const headers = new Headers();
    originalHeaders.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === 'content-length' || lower === 'content-disposition') return;
      headers.set(key, value);
    });

    headers.set('Content-Type', processedBlob.type || 'image/png');
    const originalName = extractDownloadFilename(originalHeaders.get('Content-Disposition'));
    headers.set('Content-Disposition', `attachment; filename="${toPngFilename(originalName)}"`);

    return headers;
  };

  /**
   * Gemini saves via blob URL + <a download="….jfif">, which overrides Response
   * Content-Disposition. After a successful PNG process, rewrite that attribute.
   */
  const installDownloadNamePatch = () => {
    const proto = HTMLAnchorElement.prototype;
    const rewrite = (name) =>
      typeof window.__gvRewriteDownloadName === 'function'
        ? window.__gvRewriteDownloadName(name)
        : name;

    if (!proto.__gvDownloadPatched) {
      const desc = Object.getOwnPropertyDescriptor(proto, 'download');
      try {
        Object.defineProperty(proto, 'download', {
          configurable: true,
          enumerable: desc?.enumerable ?? true,
          get() {
            if (typeof desc?.get === 'function') return desc.get.call(this);
            return this.getAttribute('download') || '';
          },
          set(value) {
            const next = rewrite(value);
            if (typeof desc?.set === 'function') {
              desc.set.call(this, next);
              return;
            }
            if (next == null || next === '') {
              this.removeAttribute('download');
            } else {
              // Bypass our setAttribute hook to avoid double-rewriting.
              Element.prototype.setAttribute.call(this, 'download', String(next));
            }
          },
        });
        proto.__gvDownloadPatched = true;
      } catch (error) {
        console.warn('[Gemini Voyager] Failed to patch <a download> property:', error);
      }
    }

    if (!proto.__gvSetAttributePatched) {
      const originalSetAttribute = proto.setAttribute;
      proto.setAttribute = function (name, value) {
        if (String(name).toLowerCase() === 'download') {
          return originalSetAttribute.call(this, name, rewrite(value));
        }
        return originalSetAttribute.call(this, name, value);
      };
      proto.__gvSetAttributePatched = true;
    }
  };

  installDownloadNamePatch();

  /**
   * Only user-initiated native download clicks should use the heavier
   * watermark-removal download pipeline. Gemini may fetch rd-gg-dl URLs while
   * an image is still being generated, and treating those as downloads creates
   * confusing progress/success notifications.
   */
  const consumeDownloadIntent = () => {
    const bridge = getBridgeElement();
    const expiresAt = Number(bridge.dataset.downloadIntentExpiresAt || 0);
    bridge.removeAttribute(DOWNLOAD_INTENT_ATTRIBUTE);
    return Number.isFinite(expiresAt) && expiresAt >= Date.now();
  };

  // Store original fetch (unwrapped page fetch, not a prior Voyager hook)
  const originalFetch = window.__gvOriginalFetch;

  // Intercept fetch
  // IMPORTANT: This must be a regular function (NOT async) to preserve the original Promise
  // chain for passthrough requests. An async function always wraps the return value in a new
  // Promise, which breaks Angular's zone.js change detection and causes link-block elements
  // to render with empty href attributes.
  window.fetch = function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;

    // Gemini page regularly triggers GTM telemetry requests that are blocked by page CSP.
    // Since this interceptor wraps window.fetch in MAIN world, those blocked requests get
    // attributed to this extension in chrome://extensions. Short-circuit known blocked
    // telemetry endpoints to avoid noisy extension error reports.
    if (url && typeof url === 'string' && isKnownCspBlockedTelemetryRequest(url)) {
      return Promise.resolve(new Response(null, { status: 204, statusText: 'No Content' }));
    }

    // Check if this is a Gemini download request (specifically rd-gg-dl for downloads)
    if (url && typeof url === 'string' && GEMINI_DOWNLOAD_PATTERN.test(url)) {
      const shouldProcessDownload = isWatermarkRemoverEnabled() && consumeDownloadIntent();
      if (!shouldProcessDownload) {
        return originalFetch.apply(this, args);
      }

      // Replace with original size URL
      const origSizeUrl = replaceWithOriginalSize(url);

      // Modify the request to use original size
      if (typeof args[0] === 'string') {
        args[0] = origSizeUrl;
      } else if (args[0]?.url) {
        // For Request objects, we need to create a new one with the modified URL
        const init = args[1] || {};
        args[0] = new Request(origSizeUrl, {
          ...init,
          method: args[0].method,
          headers: args[0].headers,
          body: args[0].body,
          mode: args[0].mode,
          credentials: args[0].credentials,
          cache: args[0].cache,
          redirect: args[0].redirect,
          referrer: args[0].referrer,
          integrity: args[0].integrity,
        });
      }

      // Use async IIFE only for the user-initiated watermark removal path.
      return (async () => {
        console.log('[Gemini Voyager] Intercepting download for watermark removal');

        // Declare response and blob outside try block so they're accessible in catch
        let response, blob;

        try {
          // Check content length first (via HEAD request) to show appropriate message
          // But we'll just show "downloading" first and update if large
          updateStatus('DOWNLOADING');

          // Fetch the original size image
          response = await originalFetch.apply(this, args);

          if (!response.ok) {
            updateStatus('ERROR', { message: `HTTP Error: ${response.status}` });
            return response;
          }

          // Check content length for large files (5MB) - update status
          const contentLength = response.headers.get('content-length');
          if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
            updateStatus('DOWNLOADING_LARGE');
          }

          // Clone response to read blob
          blob = await response.blob();

          // Step 2: Processing
          updateStatus('PROCESSING');

          // Send blob to content script for watermark removal via DOM bridge
          const processedBlob = await new Promise((resolve, reject) => {
            const requestId = 'gv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const bridge = getBridgeElement();

            // Watch for response via MutationObserver (works across worlds in Firefox)
            const observer = new MutationObserver(() => {
              const response = bridge.dataset.response;
              if (response) {
                try {
                  const data = JSON.parse(response);
                  if (data.requestId === requestId) {
                    observer.disconnect();
                    bridge.removeAttribute('data-response');

                    if (data.error) reject(new Error(data.error));
                    else
                      fetch(data.base64)
                        .then((r) => r.blob())
                        .then(resolve)
                        .catch(reject);
                  }
                } catch (e) {
                  console.warn('[Gemini Voyager] Failed to parse bridge response:', e);
                }
              }
            });
            observer.observe(bridge, { attributes: true, attributeFilter: ['data-response'] });

            // Send request via DOM bridge
            const reader = new FileReader();
            reader.onloadend = () => {
              bridge.dataset.request = JSON.stringify({ requestId, base64: reader.result });
            };
            reader.onerror = () => reject(new Error('Failed to read blob'));
            reader.readAsDataURL(blob);

            // Timeout for watermark processing
            setTimeout(() => {
              observer.disconnect();
              reject(new Error('Processing timeout'));
            }, WATERMARK_PROCESSING_TIMEOUT_MS);
          });

          updateStatus('SUCCESS');
          // Arm <a download> rewrite: Gemini names blob downloads *.jfif itself.
          armPngFilename();

          // Return processed response with headers matching the PNG body
          return new Response(processedBlob, {
            status: response.status,
            statusText: response.statusText,
            headers: buildProcessedDownloadHeaders(response.headers, processedBlob),
          });
        } catch (error) {
          console.warn('[Gemini Voyager] Watermark processing failed, using original:', error);
          updateStatus('ERROR', { message: error.message || 'Unknown error' });
          // Return the original blob if available, otherwise fall through to originalFetch
          if (blob && response) {
            return new Response(blob, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });
          }
          // If blob/response not available (error before fetch completed), fall through
          return originalFetch.apply(this, args);
        }
      })();
    }

    // Pass through: return the ORIGINAL Promise directly (no async wrapping)
    return originalFetch.apply(this, args);
  };

  console.log('[Gemini Voyager] Fetch interceptor active');
})();
