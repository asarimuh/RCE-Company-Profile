/**
 * Loading Screen Module
 * Handles full-page loading for index page only
 * Waits for critical assets before revealing content
 */

export function initLoadingScreen() {
  // Only run on index page (not on subpages)
  if (!isIndexPage()) {
    revealPageImmediately();
    return;
  }

  const loadingScreen = document.getElementById('loading-screen');
  const app = document.getElementById('app');

  if (!loadingScreen || !app) {
    console.warn('Loading screen elements not found');
    revealPageImmediately();
    return;
  }

  // Ensure body starts with hidden state
  document.body.classList.add('loading');
  loadingScreen.style.display = 'flex';
  app.style.visibility = 'hidden';

  // Collect all assets to preload
  const assetsToLoad = collectCriticalAssets();

  // Wait for all critical assets and fonts
  Promise.all([
    ...assetsToLoad,
    document.fonts.ready,
    waitForBackgroundImages(),
    waitForDOMReady(),
  ])
    .then(() => {
      // Small delay to ensure paint has completed
      return new Promise((resolve) => setTimeout(resolve, 100));
    })
    .then(() => {
      revealPage(loadingScreen, app);
    })
    .catch((error) => {
      console.error('Loading error:', error);
      // Fallback: reveal page anyway after timeout
      revealPage(loadingScreen, app);
    });

  // Safety net: force reveal after max timeout
  setTimeout(() => {
    if (document.body.classList.contains('loading')) {
      console.warn('Loading timeout reached, revealing page');
      revealPage(loadingScreen, app);
    }
  }, 8000);
}

/**
 * Check if current page is index.html
 */
function isIndexPage() {
  const pathname = window.location.pathname;
  // Match root path or explicit index.html
  return pathname === '/' || pathname.endsWith('index.html') || pathname === '';
}

/**
 * Collect all critical assets (images) to preload
 */
function collectCriticalAssets() {
  const imagePromises = [];
  const loadedSources = new Set();

  // Critical above-the-fold images (hero section, about)
  const criticalImages = [
    './assets/rce-brand-logo.svg',
    './assets/hero-image-1.png',
    './assets/hero-image-2.png',
    './assets/hero-section-bg-pattern.svg',
    './assets/hero-section-divider.png',
    './assets/about-us.png',
  ];

  // Preload critical images
  criticalImages.forEach((src) => {
    loadedSources.add(normalizePath(src));
    imagePromises.push(preloadImage(src));
  });

  // Also track images already in DOM (in case they load before this script runs)
  const domImages = document.querySelectorAll('img[src]');
  domImages.forEach((img) => {
    const normalizedSrc = normalizePath(img.src);
    // Only add if not already in critical list and is above-the-fold
    if (!loadedSources.has(normalizedSrc) && isAboveFoldImage(img)) {
      imagePromises.push(waitForImageLoad(img));
      loadedSources.add(normalizedSrc);
    }
  });

  return imagePromises;
}

/**
 * Normalize image paths for comparison
 */
function normalizePath(path) {
  // Convert relative paths to absolute-like format for comparison
  return path.replace(/^\.\//, '/').replace(/^..\//, '/');
}

/**
 * Check if image is in above-the-fold area
 */
function isAboveFoldImage(img) {
  const rect = img.getBoundingClientRect();
  // Check if image is within first viewport height or in hero section
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    const heroRect = heroSection.getBoundingClientRect();
    if (rect.top < heroRect.bottom) {
      return true;
    }
  }
  // Fallback: check if within viewport height
  return rect.top < window.innerHeight && rect.bottom > 0;
}

/**
 * Preload a single image using Image() API
 */
function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

/**
 * Wait for an already-loaded image element to fully load
 */
function waitForImageLoad(imgElement) {
  return new Promise((resolve) => {
    if (imgElement.complete && imgElement.naturalHeight > 0) {
      // Already loaded
      resolve();
    } else {
      imgElement.addEventListener('load', () => resolve(), { once: true });
      imgElement.addEventListener('error', () => resolve(), { once: true });
    }
  });
}

/**
 * Wait for background images in CSS to load
 * Detects background-image URLs from computed styles
 */
function waitForBackgroundImages() {
  return new Promise((resolve) => {
    // Look for elements with background images - prioritize hero and above-fold sections
    const elements = document.querySelectorAll('.hero, [style*="background"]');
    const bgPromises = [];
    const loadedBgImages = new Set();

    elements.forEach((el) => {
      const bgImage = window.getComputedStyle(el).backgroundImage;
      if (bgImage && bgImage !== 'none') {
        // Extract URL from url(...) format
        const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
        if (match && match[1]) {
          const bgUrl = match[1];
          // Avoid duplicate preload requests
          if (!loadedBgImages.has(bgUrl)) {
            bgPromises.push(preloadImage(bgUrl));
            loadedBgImages.add(bgUrl);
          }
        }
      }
    });

    if (bgPromises.length === 0) {
      resolve();
    } else {
      Promise.all(bgPromises)
        .then(() => resolve())
        .catch(() => resolve()); // Ignore BG image errors
    }
  });
}

/**
 * Wait for DOM to be fully ready
 */
function waitForDOMReady() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', () => resolve(), { once: true });
    }
  });
}

/**
 * Fade out loading screen and reveal content
 */
function revealPage(loadingScreen, app) {
  // Make app visible
  app.style.visibility = 'visible';

  // Trigger CSS fade-out animation
  document.body.classList.remove('loading');
  document.body.classList.add('loaded');

  // Remove loading screen from DOM after animation completes
  setTimeout(() => {
    loadingScreen.style.display = 'none';
  }, 800);
}

/**
 * Reveal page immediately without animation (for non-index pages)
 */
function revealPageImmediately() {
  const app = document.getElementById('app');
  const loadingScreen = document.getElementById('loading-screen');

  if (loadingScreen) loadingScreen.style.display = 'none';
  if (app) app.style.visibility = 'visible';
  document.body.classList.add('loaded');
}
