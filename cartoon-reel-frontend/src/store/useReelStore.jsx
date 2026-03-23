/**
 * useReelStore.js
 * Central application state as a React context + reducer.
 * Keeps all screen transitions, user choices, and loader state in one place.
 */
import { createContext, useContext, useReducer, useCallback } from 'react';
import TEMPLATES from '../data/templates';

/* ── State shape ──────────────────────────────────────── */
const initialState = {
  /** Current screen: 'home' | 'create' | 'loading' | 'preview' */
  screen: 'home',

  /** User inputs */
  text: '',
  templateId: null, // will be set once templates load
  musicFile: null,      // File object
  musicName: '',
  musicDuration: null,  // seconds
  customSprites: [null, null, null], // Users 3 uploaded image slots for custom templates
  animationEnabled: true, // Toggle character/frame motion physics
  
  /** Dynamic DB State */
  categories: [],
  templates: [],

  /** Generation results */
  reelUrl: null,        // blob URL of generated reel (Canvas recording)
  reelVersion: 0,       // incremented on each regenerate

  /** Loading step */
  loadingStep: 0,       // 0-3 index into LOADING_STEPS

  /** Error message */
  error: null,
};

const ACTIONS = {
  SET_TEXT:         'SET_TEXT',
  SET_TEMPLATE:     'SET_TEMPLATE',
  SET_MUSIC:        'SET_MUSIC',
  REMOVE_MUSIC:     'REMOVE_MUSIC',
  START_LOADING:    'START_LOADING',
  SET_LOADING_STEP: 'SET_LOADING_STEP',
  FINISH_REEL:      'FINISH_REEL',
  REGENERATE:       'REGENERATE',
  GO_HOME:          'GO_HOME',
  GO_CREATE:        'GO_CREATE',
  GO_ADMIN:         'GO_ADMIN',
  SET_ERROR:        'SET_ERROR',
  SET_DB:           'SET_DB',
  SET_CUSTOM_SPRITE:'SET_CUSTOM_SPRITE',
  TOGGLE_ANIMATION: 'TOGGLE_ANIMATION',
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

    case ACTIONS.SET_CUSTOM_SPRITE:
      const newSprites = [...state.customSprites];
      newSprites[action.payload.index] = action.payload.file;
      return { ...state, customSprites: newSprites };

    case ACTIONS.TOGGLE_ANIMATION:
      return { ...state, animationEnabled: !state.animationEnabled };

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
