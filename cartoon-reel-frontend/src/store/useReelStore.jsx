/**
 * useReelStore.js
 * Central application state as a React context + reducer.
 * Keeps all screen transitions, user choices, and loader state in one place.
 */
import { createContext, useContext, useReducer, useCallback } from 'react';
import TEMPLATES from '../data/templates';

/* ── Default section style ─────────────────────────────── */
const mkSection = (text = '', color = '#FFFFFF', align = 'center', font = 'modern') =>
  ({ text, color, align, font });

/* ── State shape ──────────────────────────────────────── */
const initialState = {
  /** Current screen: 'home' | 'create' | 'loading' | 'preview' */
  screen: 'home',

  /** User inputs */
  text: '',
  templateId: null,
  musicFile: null,
  musicName: '',
  musicDuration: null,
  customSprites: [null, null, null],
  animationEnabled: true,
  customMedia: null,
  customMediaCrop: { x: 0, y: 0, scale: 1, type: null },

  /** Three-section rich text */
  sections: {
    title:      mkSection('', '#FFD700', 'center', 'bold'),
    content:    mkSection('', '#FFFFFF', 'center', 'modern'),
    conclusion: mkSection('', '#C084FC', 'center', 'bold'),
  },
  language: 'en', // 'en' | 'ta' | 'hi'

  /** Character frame position on the canvas (fractional 0-1) */
  charPosition: { x: 0.72, y: 0.78 },

  /** Dynamic DB State */
  categories: [],
  templates: [],

  /** Generation results */
  reelUrl: null,
  reelVersion: 0,

  /** Loading step */
  loadingStep: 0,

  /** Error message */
  error: null,
};

const ACTIONS = {
  SET_TEXT:            'SET_TEXT',
  SET_TEMPLATE:        'SET_TEMPLATE',
  SET_MUSIC:           'SET_MUSIC',
  REMOVE_MUSIC:        'REMOVE_MUSIC',
  START_LOADING:       'START_LOADING',
  SET_LOADING_STEP:    'SET_LOADING_STEP',
  FINISH_REEL:         'FINISH_REEL',
  REGENERATE:          'REGENERATE',
  GO_HOME:             'GO_HOME',
  GO_CREATE:           'GO_CREATE',
  GO_ADMIN:            'GO_ADMIN',
  SET_ERROR:           'SET_ERROR',
  SET_DB:              'SET_DB',
  SET_CUSTOM_SPRITE:   'SET_CUSTOM_SPRITE',
  TOGGLE_ANIMATION:    'TOGGLE_ANIMATION',
  SET_CUSTOM_MEDIA:    'SET_CUSTOM_MEDIA',
  SET_CUSTOM_MEDIA_CROP: 'SET_CUSTOM_MEDIA_CROP',
  REMOVE_CUSTOM_MEDIA: 'REMOVE_CUSTOM_MEDIA',
  SET_SECTION_TEXT:    'SET_SECTION_TEXT',
  SET_SECTION_STYLE:   'SET_SECTION_STYLE',
  SET_LANGUAGE:        'SET_LANGUAGE',
  SET_CHAR_POSITION:   'SET_CHAR_POSITION',
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_TEXT:
      return { ...state, text: action.payload, error: null };

    case ACTIONS.SET_TEMPLATE:
      return { ...state, templateId: action.payload };

    case ACTIONS.SET_MUSIC:
      return {
        ...state,
        musicFile:     action.payload.file,
        musicName:     action.payload.name,
        musicDuration: action.payload.duration,
        error: null,
      };

    case ACTIONS.REMOVE_MUSIC:
      return { ...state, musicFile: null, musicName: '', musicDuration: null };

    case ACTIONS.START_LOADING:
      return { ...state, screen: 'loading', loadingStep: 0, error: null };

    case ACTIONS.SET_LOADING_STEP:
      return { ...state, loadingStep: action.payload };

    case ACTIONS.FINISH_REEL:
      return {
        ...state,
        screen:     'preview',
        reelUrl:    action.payload,
        reelVersion: state.reelVersion + 1,
        loadingStep: 0,
      };

    case ACTIONS.REGENERATE:
      return { ...state, screen: 'loading', loadingStep: 0, error: null };

    case ACTIONS.GO_HOME:
      if (state.reelUrl) URL.revokeObjectURL(state.reelUrl);
      return { ...state, screen: 'home', reelUrl: null };

    case ACTIONS.GO_CREATE:
      return { ...state, screen: 'create' };

    case ACTIONS.GO_ADMIN:
      return { ...state, screen: 'admin' };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };

    case ACTIONS.SET_DB:
      return {
        ...state,
        categories: action.payload.categories || [],
        templates: action.payload.templates || [],
        templateId: state.templateId || (action.payload.templates?.[0]?.id)
      };

    case ACTIONS.SET_CUSTOM_SPRITE: {
      const newSprites = [...state.customSprites];
      newSprites[action.payload.index] = action.payload.file;
      return { ...state, customSprites: newSprites };
    }

    case ACTIONS.TOGGLE_ANIMATION:
      return { ...state, animationEnabled: !state.animationEnabled };

    case ACTIONS.SET_CUSTOM_MEDIA:
      return {
        ...state,
        customMedia: action.payload.file,
        customMediaCrop: { x: 0, y: 0, scale: 1, type: action.payload.mediaType },
      };

    case ACTIONS.SET_CUSTOM_MEDIA_CROP:
      return { ...state, customMediaCrop: { ...state.customMediaCrop, ...action.payload } };

    case ACTIONS.REMOVE_CUSTOM_MEDIA:
      return { ...state, customMedia: null, customMediaCrop: { x: 0, y: 0, scale: 1, type: null } };

    case ACTIONS.SET_SECTION_TEXT: {
      const { key, text } = action.payload;
      return {
        ...state,
        sections: {
          ...state.sections,
          [key]: { ...state.sections[key], text },
        },
        error: null,
      };
    }

    case ACTIONS.SET_SECTION_STYLE: {
      const { key, prop, value } = action.payload;
      return {
        ...state,
        sections: {
          ...state.sections,
          [key]: { ...state.sections[key], [prop]: value },
        },
      };
    }

    case ACTIONS.SET_LANGUAGE:
      return { ...state, language: action.payload };

    case ACTIONS.SET_CHAR_POSITION:
      return { ...state, charPosition: { ...state.charPosition, ...action.payload } };

    default:
      return state;
  }
}

/* ── Context ──────────────────────────────────────────── */
const ReelContext = createContext(null);

export function ReelProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = {
    setText:        useCallback((t) => dispatch({ type: ACTIONS.SET_TEXT, payload: t }), []),
    setTemplate:    useCallback((id) => dispatch({ type: ACTIONS.SET_TEMPLATE, payload: id }), []),
    setMusic:       useCallback((p) => dispatch({ type: ACTIONS.SET_MUSIC, payload: p }), []),
    removeMusic:    useCallback(() => dispatch({ type: ACTIONS.REMOVE_MUSIC }), []),
    startLoading:   useCallback(() => dispatch({ type: ACTIONS.START_LOADING }), []),
    setLoadingStep: useCallback((n) => dispatch({ type: ACTIONS.SET_LOADING_STEP, payload: n }), []),
    finishReel:     useCallback((url) => dispatch({ type: ACTIONS.FINISH_REEL, payload: url }), []),
    regenerate:     useCallback(() => dispatch({ type: ACTIONS.REGENERATE }), []),
    goHome:         useCallback(() => dispatch({ type: ACTIONS.GO_HOME }), []),
    goCreate:       useCallback(() => dispatch({ type: ACTIONS.GO_CREATE }), []),
    goAdmin:        useCallback(() => dispatch({ type: ACTIONS.GO_ADMIN }), []),
    setError:       useCallback((msg) => dispatch({ type: ACTIONS.SET_ERROR, payload: msg }), []),
    setDb:          useCallback((data) => dispatch({ type: ACTIONS.SET_DB, payload: data }), []),
    setCustomSprite:useCallback((index, file) => dispatch({ type: ACTIONS.SET_CUSTOM_SPRITE, payload: {index, file} }), []),
    toggleAnimation:useCallback(() => dispatch({ type: ACTIONS.TOGGLE_ANIMATION }), []),
    setCustomMedia: useCallback((file, mediaType) => dispatch({ type: ACTIONS.SET_CUSTOM_MEDIA, payload: { file, mediaType } }), []),
    setCustomMediaCrop: useCallback((crop) => dispatch({ type: ACTIONS.SET_CUSTOM_MEDIA_CROP, payload: crop }), []),
    removeCustomMedia: useCallback(() => dispatch({ type: ACTIONS.REMOVE_CUSTOM_MEDIA }), []),
    setSectionText: useCallback((key, text) => dispatch({ type: ACTIONS.SET_SECTION_TEXT, payload: { key, text } }), []),
    setSectionStyle:useCallback((key, prop, value) => dispatch({ type: ACTIONS.SET_SECTION_STYLE, payload: { key, prop, value } }), []),
    setLanguage:    useCallback((lang) => dispatch({ type: ACTIONS.SET_LANGUAGE, payload: lang }), []),
    setCharPosition: useCallback((pos) => dispatch({ type: ACTIONS.SET_CHAR_POSITION, payload: pos }), []),
  };

  return (
    <ReelContext.Provider value={{ state, ...actions }}>
      {children}
    </ReelContext.Provider>
  );
}

export function useReelStore() {
  const ctx = useContext(ReelContext);
  if (!ctx) throw new Error('useReelStore must be used within ReelProvider');
  return ctx;
}
