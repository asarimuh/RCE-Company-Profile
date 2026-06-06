/**
 * Skeleton Loading Module
 * Handles skeleton placeholder loading for subpages only
 * Shows skeletons while content assets load, then reveals actual content
 */

export function initSkeletonLoader() {
  // Only run on non-index subpages
  if (isIndexPage()) {
    revealContent();
    return;
  }

  // Support both page-wrapper (services) and blog-wrapper (blogs)
  const pageWrapper = document.querySelector('.page-wrapper, .blog-wrapper');

  if (!pageWrapper) {
    console.warn('Page or blog wrapper not found');
    revealContent();
    return;
  }

  // Add loading state to show skeleton
  pageWrapper.classList.add('loading');

  // Wait for critical assets to load
  Promise.all([
    document.fonts.ready,
    waitForDOMReady(),
    waitForPageImages(),
    waitForBackgroundImages(),
  ])
    .then(() => {
      // Small delay to ensure render is complete
      return new Promise((resolve) => setTimeout(resolve, 150));
    })
    .then(() => {
      revealContent(pageWrapper);
    })
    .catch((error) => {
      console.error('Skeleton loader error:', error);
      // Fallback: reveal anyway
      revealContent(pageWrapper);
    });

  // Safety net: force reveal after timeout
  setTimeout(() => {
    if (!pageWrapper.classList.contains('loaded')) {
      console.warn('Skeleton loading timeout, revealing content');
      revealContent(pageWrapper);
    }
  }, 6000);
}

/**
 * Check if current page is index.html
 */
function isIndexPage() {
  const pathname = window.location.pathname;
  return pathname === '/' || pathname.endsWith('index.html') || pathname === '';
}

/**
 * Wait for all images in the page to load
 */
function waitForPageImages() {
  return new Promise((resolve) => {
    const images = document.querySelectorAll('img[src]');

    if (images.length === 0) {
      resolve();
      return;
    }

    let loadedCount = 0;
    let errorCount = 0;

    const checkComplete = () => {
      if (loadedCount + errorCount === images.length) {
        resolve();
      }
    };

    images.forEach((img) => {
      if (img.complete) {
        // Already loaded or failed
        loadedCount++;
        checkComplete();
      } else {
        img.addEventListener('load', () => {
          loadedCount++;
          checkComplete();
        }, { once: true });

        img.addEventListener('error', () => {
          errorCount++;
          checkComplete();
        }, { once: true });
      }
    });

    // Timeout: if images take too long, continue anyway
    setTimeout(() => {
      if (loadedCount + errorCount < images.length) {
        resolve();
      }
    }, 4000);
  });
}

/**
 * Wait for background images in CSS to load
 */
function waitForBackgroundImages() {
  return new Promise((resolve) => {
    const elements = document.querySelectorAll('[style*="background"], main, .page-header, .feature-card');
    const bgPromises = [];
    const loadedBgImages = new Set();

    elements.forEach((el) => {
      const bgImage = window.getComputedStyle(el).backgroundImage;
      if (bgImage && bgImage !== 'none') {
        const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
        if (match && match[1]) {
          const bgUrl = match[1];
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
        .catch(() => resolve());
    }
  });
}

/**
 * Preload a single image using Image() API
 */
function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(); // Don't fail on image errors
    img.src = src;
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
 * Fade out skeleton and reveal actual content
 */
function revealContent(pageWrapper) {
  if (!pageWrapper) {
    pageWrapper = document.querySelector('.page-wrapper');
  }

  if (!pageWrapper) return;

  // Add loaded state to hide skeleton and show content
  pageWrapper.classList.add('loaded');
  pageWrapper.classList.remove('loading');
}
