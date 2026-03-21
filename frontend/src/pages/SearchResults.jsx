import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';

const SkeletonCard = () => (
  <div style={{ 
    height: '350px', 
    borderRadius: '1.5rem', 
    background: 'rgba(255, 255, 255, 0.03)', 
    border: '1px solid rgba(255, 255, 255, 0.05)', 
    backdropFilter: 'blur(10px)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  }}>
    <div className="animate-pulse" style={{ height: '60%', backgroundColor: 'rgba(156, 163, 175, 0.1)' }}></div>
    <div style={{ padding: '1rem', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="animate-pulse" style={{ height: '1.2rem', width: '80%', backgroundColor: 'rgba(156, 163, 175, 0.2)', borderRadius: '4px' }}></div>
      <div className="animate-pulse" style={{ height: '1rem', width: '60%', backgroundColor: 'rgba(156, 163, 175, 0.2)', borderRadius: '4px' }}></div>
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="animate-pulse" style={{ height: '1.5rem', width: '40%', backgroundColor: 'rgba(156, 163, 175, 0.2)', borderRadius: '4px' }}></div>
        <div className="animate-pulse" style={{ height: '1rem', width: '20%', backgroundColor: 'rgba(156, 163, 175, 0.2)', borderRadius: '1rem' }}></div>
      </div>
    </div>
  </div>
);

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const rawQ = searchParams.get('q');
  const navigate = useNavigate();
  
  const [query, setQuery] = useState(rawQ || '');
  const [results, setResults] = useState([]);
  const [sourceProduct, setSourceProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

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
        const isUrl = /^https?:\/\//i.test(rawQ);
        let fetchUrl = `${import.meta.env.VITE_API_BASE_URL}/search?q=${encodeURIComponent(rawQ)}`;
        let options = undefined;
        if (isUrl) {
            fetchUrl = `${import.meta.env.VITE_API_BASE_URL}/search/by-url`;
            options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: rawQ })
            };
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 sec max
        
        let fetchOptions = { ...options, signal: controller.signal };
        const response = await fetch(fetchUrl, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error("Search API failed");
        const data = await response.json();
        
        if (isUrl) {
            setSourceProduct(data.source_product);
            setResults(data.results || []);
        } else {
            setResults(data);
            setSourceProduct(null);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          showToast("Search timed out. Please try again.");
          setError("Search timed out.");
        } else {
          showToast("Failed to fetch results. Please check your connection.");
          setError("Failed to fetch results. Please check your connection.");
        }
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
          {/^https?:\/\//i.test(rawQ) ? 'Results for URL Search' : <>Results for <span style={{ color: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text', backgroundImage: 'linear-gradient(to right, #a855f7, #06b6d4)' }}>"{rawQ}"</span></>}
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
            {/^https?:\/\//i.test(query) && (
              <div className="hidden sm:flex" style={{ position: 'absolute', right: '115px', backgroundColor: 'rgba(168,85,247,0.2)', color: '#c084fc', padding: '0.3rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, alignItems: 'center', pointerEvents: 'none' }}>
                🔗 URL Search
              </div>
            )}
            
            <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(to right, #9333ea, #db2777)', color: 'white', borderRadius: '9999px', fontWeight: 700, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', border: 'none', flexShrink: 0 }}>
              SEARCH
            </button>
          </div>
        </form>
      </div>

      {/* Content Area */}
      <div style={{ width: '100%', maxWidth: '80rem', margin: '0 auto', flexGrow: 1 }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem', width: '100%' }}>
            {[...Array(6)].map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
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
              return (
                <>
                  {sourceProduct && (
                    <div style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
                      <h3 style={{ color: '#9ca3af', fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 500 }}>You searched for:</h3>
                      <div style={{ maxWidth: '400px', border: '1px solid rgba(168,85,247,0.4)', borderRadius: '20px', padding: '0.5rem', background: 'rgba(168,85,247,0.05)', boxShadow: '0 0 30px rgba(168,85,247,0.1)' }}>
                        <ProductCard product={sourceProduct} absoluteLowest={false} />
                      </div>
                      <div style={{ height: '1px', width: '100%', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)', margin: '3rem 0' }} />
                      <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>Compared across platforms:</h3>
                    </div>
                  )}
                  {uniqueResults.map((product, index) => (
                    <motion.div key={product.id + '-' + index} variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { type: 'spring' } } }}>
                      <ProductCard product={product} absoluteLowest={product.is_lowest_price || (index === 0 && sourceProduct)} />
                    </motion.div>
                  ))}
                </>
              );
            })()}
          </motion.div>
        )}
      </div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100, background: 'rgba(239, 68, 68, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white', padding: '1rem 1.5rem', borderRadius: '1rem', fontWeight: 600, boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)' }}
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
}
