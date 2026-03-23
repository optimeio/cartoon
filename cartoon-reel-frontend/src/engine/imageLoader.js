/**
 * imageLoader.js — Preloads all background images once, returns a cache map.
 */
const BG_IMAGES = {
  shinchan:  '/assets/bg_shinchan.png',
  bheem:     '/assets/bg_bheem.png',
  ben10:     '/assets/bg_ben10.png',
  jackie:    '/assets/bg_jackie.png',
  grass:     '/assets/bg_grass.png',
  forest:    '/assets/bg_forest.png',
  turmeric:  '/assets/bg_turmeric.png',
  chilli:    '/assets/bg_chilli.png',
  sambar:    '/assets/bg_sambar.png',
};

// Character sprite frames (3 per genre)
const SPRITES = {
  shinchan: ['/assets/shinchan1.png', '/assets/shinchan2.png', '/assets/shinchan3.png'],
  bheem:    ['/assets/bheem1.png', '/assets/bheem2.png', '/assets/bheem3.png'],
  ben10:    ['/assets/ben1.png', '/assets/ben2.png', '/assets/ben3.png'],
  jackie:   ['/assets/jack1.png', '/assets/jack2.png', '/assets/jack3.png'],
};

// Map: templateId → bgKey
export const TEMPLATE_BG = {
  'shinchan':      'shinchan',
  'chota-bheem':   'bheem',
  'ben10':         'ben10',
  'jackie':        'jackie',
  'grass':         'grass',
  'forest':        'forest',
  'turmeric':      'turmeric',
  'chilli':        'chilli',
  'sambar':        'sambar',
};

const cache = {};

export function preloadImages() {
  const promises = [];

  // Load Backgrounds
  Object.entries(BG_IMAGES).forEach(([key, src]) => {
    promises.push(new Promise((resolve) => {
      if (cache[key]) return resolve();
      const img = new Image();
      img.onload  = () => { cache[key] = img; resolve(); };
      img.onerror = () => { console.warn('Could not load', src); resolve(); };
      img.src = src;
    }));
  });

  // Load Sprites
  Object.entries(SPRITES).forEach(([charKey, frames]) => {
    frames.forEach((src, idx) => {
      const cacheKey = `${charKey}_${idx}`;
      promises.push(new Promise((resolve) => {
        if (cache[cacheKey]) return resolve();
        const img = new Image();
        img.onload  = () => { cache[cacheKey] = img; resolve(); };
        img.onerror = () => { console.warn('Could not load', src); resolve(); };
        img.src = src;
      }));
    });
  });

  return Promise.all(promises);
}

export function getImage(key) {
  return cache[key] || null;
}
