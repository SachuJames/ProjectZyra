import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';

const FullScreenLoader = () => {
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = ['Scanning Amazon...', 'Scanning Flipkart...', 'Finding best prices...', 'Almost there...'];

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0f', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#1f2937', overflow: 'hidden' }}>
        <div className="animate-progress" style={{ width: '100%', height: '100%', backgroundImage: 'linear-gradient(to right, transparent, #a855f7, #3b82f6)', transformOrigin: 'left' }}></div>
      </div>

      {[...Array(15)].map((_, i) => (
        <div 
          key={i} 
          className="animate-float-up"
          style={{ position: 'absolute', color: 'rgba(168,85,247,0.3)', fontWeight: 'bold', pointerEvents: 'none', left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s`, animationDuration: `${8 + Math.random() * 5}s`, fontSize: `${1 + Math.random()}rem` }}
        >
          ₹
        </div>
      ))}

      <div style={{ position: 'relative', width: '10rem', height: '10rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '3rem' }}>
        <div className="animate-radar-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(168,85,247,0.5)' }}></div>
        <div className="animate-radar-ping animation-delay-500" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(59,130,246,0.5)' }}></div>
        <div className="animate-radar-ping animation-delay-1000" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.5)' }}></div>
        
        <div style={{ position: 'relative', zIndex: 10, width: '5rem', height: '5rem', backgroundImage: 'linear-gradient(to bottom right, #4f46e5, #9333ea)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(124,58,237,0.7)' }}>
          <span style={{ color: 'white', fontSize: '2.25rem', fontFamily: 'serif', fontWeight: 900, textShadow: '0 0 15px rgba(255,255,255,0.9)' }}>Z</span>
        </div>
      </div>

      <div style={{ height: '3rem', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.h3
            key={msgIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'absolute', fontSize: '1.5rem', fontWeight: 'bold', color: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text', backgroundImage: 'linear-gradient(to right, #60a5fa, #c084fc)', width: 'max-content', textAlign: 'center' }}
          >
            {messages[msgIdx]}
          </motion.h3>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const rawQ = searchParams.get('q');
  const navigate = useNavigate();
  
  const [query, setQuery] = useState(rawQ || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (!rawQ) {
        navigate('/');
        return;
    }
    setQuery(rawQ);
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(rawQ)}`);
        if (!response.ok) throw new Error("Search API failed");
        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [rawQ, navigate]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div style={{ background: '#030308', minHeight: '100vh', padding: '24px', paddingTop: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Search Header Row */}
      <div style={{ width: '100%', maxWidth: '80rem', margin: '0 auto 3rem auto', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.025em' }}>
          Results for <span style={{ color: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text', backgroundImage: 'linear-gradient(to right, #a855f7, #06b6d4)' }}>"{rawQ}"</span>
        </h2>
        
        <form 
          onSubmit={handleSearch} 
          style={{ flexGrow: 1, maxWidth: '600px', position: 'relative', zIndex: 30 }}
        >
          <div className="glow-border" style={{ position: 'relative', borderRadius: '9999px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.3rem', display: 'flex', alignItems: 'center', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: searchFocused ? '0 0 30px rgba(168,85,247,0.3)' : '0 4px 10px rgba(0,0,0,0.3)', transition: 'all 0.3s' }}>
            <div style={{ paddingLeft: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ position: 'relative', width: '1.2rem', height: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-radar-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid #a855f7' }}></div>
                <div className="animate-radar-ping animation-delay-500" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid #06b6d4' }}></div>
                <div style={{ width: '0.4rem', height: '0.4rem', backgroundColor: '#c084fc', borderRadius: '50%', boxShadow: '0 0 10px #a855f7' }}></div>
              </div>
            </div>
            
            <input
              type="text"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{ flexGrow: 1, padding: '0.75rem 1rem', backgroundColor: 'transparent', outline: 'none', border: 'none', color: 'white', fontSize: '1.1rem', fontWeight: 400, width: '100%' }}
              placeholder="Search again..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            
            <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(to right, #9333ea, #db2777)', color: 'white', borderRadius: '9999px', fontWeight: 700, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', border: 'none', flexShrink: 0 }}>
              SEARCH
            </button>
          </div>
        </form>
      </div>

      {/* Content Area */}
      <div style={{ width: '100%', maxWidth: '80rem', margin: '0 auto', flexGrow: 1 }}>
        {loading ? (
          <FullScreenLoader />
        ) : error ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '2rem', textAlign: 'center', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 500 }}>
            Error: {error}
          </motion.div>
        ) : results.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af', backgroundColor: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', marginTop: '4rem' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>No deals found</h3>
            <p style={{ fontSize: '1.25rem' }}>Try broadening your search terms.</p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '2rem', 
              width: '100%' 
            }}
          >
            {(() => {
              const uniqueResults = Array.isArray(results) ? results.filter((item, index, self) => index === self.findIndex(p => p.id === item.id)) : [];
              return uniqueResults.map((product, index) => (
                <motion.div key={product.id + '-' + index} variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { type: 'spring' } } }}>
                  <ProductCard product={product} absoluteLowest={product.is_lowest_price} />
                </motion.div>
              ));
            })()}
          </motion.div>
        )}
      </div>
    </div>
  );
}
