import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ReelProvider, useReelStore } from './store/useReelStore';
import MeshBackground  from './components/MeshBackground';
import HomeScreen    from './screens/HomeScreen';
import CreateScreen  from './screens/CreateScreen';
import LoadingScreen from './screens/LoadingScreen';
import PreviewScreen from './screens/PreviewScreen';
import AdminScreen   from './screens/AdminScreen';

// Check current URL hash or path to decide which app to render (fixes 404s on static hosting)
const isAdminRoute = window.location.hash.includes('admin') || window.location.pathname.startsWith('/admin');

const screenVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit:    { opacity: 0, x: -40, transition: { duration: 0.2 } },
};

/* ── Customer App ───────────────────────────────────────── */
function CustomerApp() {
  const { state, setDb } = useReelStore();

  React.useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || '/api';
    fetch(`${API_URL}/db`)
      .then(res => res.json())
      .then(data => setDb(data))
      .catch(err => console.error('DB Fetch Error:', err));
  }, [setDb]);

  return (
    <>
      <MeshBackground />
      <AnimatePresence mode="wait">
        <motion.div
          key={state.screen}
          variants={screenVariants}
          initial="initial" animate="animate" exit="exit"
          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100dvh' }}
        >
          {state.screen === 'home'    && <HomeScreen />}
          {state.screen === 'create'  && <CreateScreen />}
          {state.screen === 'loading' && <LoadingScreen />}
          {state.screen === 'preview' && <PreviewScreen />}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

/* ── Main App ───────────────────────────────────────────── */
export default function App() {
  // Admin has entirely separate UI — no mesh background, no customer state
  if (isAdminRoute) {
    return (
      <ReelProvider>
        <AdminScreen />
      </ReelProvider>
    );
  }

  return (
    <ReelProvider>
      <CustomerApp />
    </ReelProvider>
  );
}
