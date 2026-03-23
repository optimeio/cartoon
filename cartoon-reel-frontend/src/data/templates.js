/**
 * templates.js — CartoonReel template definitions
 *
 * Two categories:
 *  1. CARTOON — character-driven animations (Shinchan, Chota Bheem, Ben 10, Jackie Chan)
 *  2. NATURE  — scenic Indian nature themes (Grass, Forest, Turmeric, Chilli, Sambar)
 */

export const CATEGORIES = [
  { id: 'cartoon', label: 'Cartoon', emoji: '🎭' },
  { id: 'nature',  label: 'Nature',  emoji: '🌿' },
];

export const TEMPLATES = [
  /* ═══════════════════ CARTOON ═══════════════════ */
  {
    id:          'shinchan',
    category:    'cartoon',
    name:        'Shinchan',
    emoji:       '😄',
    badge:       'Happy & Roaming',
    badgeClass:  'badge-purple',
    description: 'Silly kid roaming freely, dancing and having fun!',
    mood:        'playful',
    palette: {
      skyTop:    '#87CEEB',
      skyBottom: '#FFF9C4',
      ground:    '#7CFC00',
      groundDark:'#228B22',
      charColor: '#FFD700',
      accent:    '#FF6B35',
    },
    scenes: [
      { type: 'shin_run',      duration: 8,  transition: 'slide' },
      { type: 'shin_dance',    duration: 8,  transition: 'zoom-in' },
      { type: 'shin_silly',    duration: 7,  transition: 'shake' },
      { type: 'shin_happy',    duration: 7,  transition: 'zoom-out' },
    ],
  },
  {
    id:          'chota-bheem',
    category:    'cartoon',
    name:        'Chota Bheem',
    emoji:       '💪',
    badge:       'Friendship',
    badgeClass:  'badge-cyan',
    description: 'Bheem and friends — strength, friendship, laddoo power!',
    mood:        'heroic',
    palette: {
      skyTop:    '#1A237E',
      skyBottom: '#283593',
      ground:    '#4CAF50',
      groundDark:'#1B5E20',
      charColor: '#FF8F00',
      accent:    '#FFC107',
    },
    scenes: [
      { type: 'bheem_power',    duration: 8,  transition: 'zoom-in' },
      { type: 'bheem_friends',  duration: 8,  transition: 'pan-right' },
      { type: 'bheem_laddoo',   duration: 7,  transition: 'bounce' },
      { type: 'bheem_victory',  duration: 7,  transition: 'zoom-out' },
    ],
  },
  {
    id:          'ben10',
    category:    'cartoon',
    name:        'Ben 10',
    emoji:       '⚡',
    badge:       'Alien Power',
    badgeClass:  'badge-pink',
    description: 'Omnitrix transformations and alien power sequences!',
    mood:        'epic',
    palette: {
      skyTop:    '#0D0D0D',
      skyBottom: '#1A1A2E',
      ground:    '#16213E',
      groundDark:'#0F3460',
      charColor: '#00FF41',
      accent:    '#00D4FF',
    },
    scenes: [
      { type: 'ben_omnitrix',   duration: 8,  transition: 'flash' },
      { type: 'ben_transform',  duration: 8,  transition: 'spin' },
      { type: 'ben_battle',     duration: 7,  transition: 'shake' },
      { type: 'ben_hero',       duration: 7,  transition: 'zoom-out' },
    ],
  },
  {
    id:          'jackie',
    category:    'cartoon',
    name:        'Jackie Chan',
    emoji:       '🥋',
    badge:       'Fighting Action',
    badgeClass:  'badge-purple',
    description: 'Epic martial arts moves, kicks, punches, and dodges!',
    mood:        'action',
    palette: {
      skyTop:    '#B71C1C',
      skyBottom: '#880E4F',
      ground:    '#4E342E',
      groundDark:'#3E2723',
      charColor: '#FFB300',
      accent:    '#FF6F00',
    },
    scenes: [
      { type: 'jackie_kick',    duration: 8,  transition: 'shake' },
      { type: 'jackie_dodge',   duration: 8,  transition: 'slide' },
      { type: 'jackie_combo',   duration: 7,  transition: 'flash' },
      { type: 'jackie_win',     duration: 7,  transition: 'zoom-out' },
    ],
  },

  /* ═══════════════════ NATURE ═══════════════════ */
  {
    id:          'grass',
    category:    'nature',
    name:        'Grass Fields',
    emoji:       '🌾',
    badge:       'Peaceful',
    badgeClass:  'badge-cyan',
    description: 'Swaying green fields, butterflies and gentle breeze',
    mood:        'calm',
    palette: {
      skyTop:    '#87CEEB',
      skyBottom: '#B2EBF2',
      ground:    '#66BB6A',
      groundDark:'#2E7D32',
      charColor: '#A5D6A7',
      accent:    '#FFD54F',
    },
    scenes: [
      { type: 'grass_sway',     duration: 8,  transition: 'fade' },
      { type: 'grass_butterfly',duration: 8,  transition: 'pan-right' },
      { type: 'grass_breeze',   duration: 7,  transition: 'pan-left' },
      { type: 'grass_sunset',   duration: 7,  transition: 'fade' },
    ],
  },
  {
    id:          'forest',
    category:    'nature',
    name:        'Deep Forest',
    emoji:       '🌲',
    badge:       'Mystical',
    badgeClass:  'badge-purple',
    description: 'Tall trees, waterfalls, birds and forest magic',
    mood:        'mystical',
    palette: {
      skyTop:    '#1B5E20',
      skyBottom: '#388E3C',
      ground:    '#2E7D32',
      groundDark:'#1B5E20',
      charColor: '#81C784',
      accent:    '#C8E6C9',
    },
    scenes: [
      { type: 'forest_canopy',  duration: 8,  transition: 'fade' },
      { type: 'forest_water',   duration: 8,  transition: 'pan-left' },
      { type: 'forest_birds',   duration: 7,  transition: 'pan-right' },
      { type: 'forest_mist',    duration: 7,  transition: 'fade' },
    ],
  },
  {
    id:          'turmeric',
    category:    'nature',
    name:        'Turmeric Farm',
    emoji:       '🟡',
    badge:       'Golden',
    badgeClass:  'badge-purple',
    description: 'Golden turmeric fields, harvest time and earthy warmth',
    mood:        'warm',
    palette: {
      skyTop:    '#FF8F00',
      skyBottom: '#FFB300',
      ground:    '#6D4C41',
      groundDark:'#4E342E',
      charColor: '#FFC107',
      accent:    '#FF6F00',
    },
    scenes: [
      { type: 'turmeric_field', duration: 8,  transition: 'pan-right' },
      { type: 'turmeric_harvest',duration: 9, transition: 'zoom-in' },
      { type: 'turmeric_glow',  duration: 7,  transition: 'fade' },
      { type: 'turmeric_dusk',  duration: 6,  transition: 'fade' },
    ],
  },
  {
    id:          'chilli',
    category:    'nature',
    name:        'Chilli Garden',
    emoji:       '🌶️',
    badge:       'Spicy',
    badgeClass:  'badge-pink',
    description: 'Fiery red chilli plants glowing vibrant in Indian sun',
    mood:        'vibrant',
    palette: {
      skyTop:    '#B71C1C',
      skyBottom: '#E53935',
      ground:    '#5D4037',
      groundDark:'#4E342E',
      charColor: '#FF5252',
      accent:    '#FF8A65',
    },
    scenes: [
      { type: 'chilli_garden',  duration: 8,  transition: 'zoom-in' },
      { type: 'chilli_glow',    duration: 8,  transition: 'pan-right' },
      { type: 'chilli_rain',    duration: 7,  transition: 'shake' },
      { type: 'chilli_harvest', duration: 7,  transition: 'fade' },
    ],
  },
  {
    id:          'sambar',
    category:    'nature',
    name:        'Sambar Magic',
    emoji:       '🍲',
    badge:       'Flavourful',
    badgeClass:  'badge-cyan',
    description: 'Tamil kitchen magic — bubbling sambar, spices & steam',
    mood:        'cozy',
    palette: {
      skyTop:    '#4A148C',
      skyBottom: '#6A1B9A',
      ground:    '#4E342E',
      groundDark:'#3E2723',
      charColor: '#FF7043',
      accent:    '#FFCCBC',
    },
    scenes: [
      { type: 'sambar_cook',    duration: 8,  transition: 'zoom-in' },
      { type: 'sambar_spice',   duration: 8,  transition: 'pan-right' },
      { type: 'sambar_steam',   duration: 7,  transition: 'fade' },
      { type: 'sambar_feast',   duration: 7,  transition: 'zoom-out' },
    ],
  },
];

export const TOTAL_DURATION_S = 30;
export const MAX_CHAR_LIMIT   = 100;
export default TEMPLATES;
