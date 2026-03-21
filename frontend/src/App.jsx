import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100 }} 
      animate={{ y: 0 }} 
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, transition: 'all 0.5s',
        borderBottom: scrolled ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid transparent',
        background: scrolled ? 'rgba(3,3,8,0.8)' : 'transparent', 
        backdropFilter: scrolled ? 'blur(30px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(30px)' : 'none'
      }}
    >
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', height: '5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <span style={{ fontSize: '1.875rem', fontWeight: 900, letterSpacing: '-0.05em', color: 'white' }}>
            ProjectZyra
          </span>
        </Link>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>
          <a href="#" style={{ color: '#e2e8f0', textDecoration: 'none' }}>How it works</a>
          <a href="#" style={{ color: '#e2e8f0', textDecoration: 'none' }}>About</a>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: 'white', fontWeight: 700, textDecoration: 'none' }}>
                {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
              </Link>
              <button onClick={logout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.4rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>Logout</button>
            </div>
          ) : (
            <Link to="/login" style={{ background: 'white', color: '#030308', padding: '0.5rem 1.25rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, width: '100%', position: 'relative', zIndex: 10, paddingTop: '5rem' }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/search" element={<PageTransition><SearchResults /></PageTransition>} />
        <Route path="/product/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  // Replace with actual VITE_GOOGLE_CLIENT_ID or fallback
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1234567890-placeholder.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <Router>
          <div style={{ minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#030308', color: '#e5e7eb', display: 'flex', flexDirection: 'column', position: 'relative', width: '100%' }}>
            <Navbar />
            <main style={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
              <AnimatedRoutes />
            </main>
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
