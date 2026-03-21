import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const [showTrackModal, setShowTrackModal] = useState(false);
  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [trackStatus, setTrackStatus] = useState('');

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    setTrackStatus('submitting');
    try {
      const res = await fetch(`/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, product_id: parseInt(id), target_price: parseFloat(targetPrice) })
      });
      if (res.ok) setTrackStatus('success');
      else setTrackStatus('error');
    } catch (err) {
      setTrackStatus('error');
    }
  };

  const fetchAISummary = async () => {
    setAiLoading(true);
    setAiError('');
    try {
        const res = await fetch(`/api/product/${id}/summary`);
        const data = await res.json();
        if (res.ok) {
            setAiSummary(data.summary);
        } else {
            setAiError(data.detail || 'Failed to fetch summary');
        }
    } catch (err) {
        setAiError('Network error while fetching summary');
    } finally {
        setAiLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const prodRes = await fetch(`/api/product/${id}`);
        const prodData = await prodRes.json();
        setProduct(prodData);
        
        const histRes = await fetch(`/api/product/${id}/history`);
        const histData = await histRes.json();
        
        const formatted = histData.map(h => ({
            date: new Date(h.recorded_at).toLocaleTimeString([], { month: 'short', day:'2-digit', hour: '2-digit', minute:'2-digit' }),
            price: h.price
        }));
        setHistory(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: '#030308', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '4rem', height: '4rem', border: '4px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%' }} className="animate-spin"></div>
      </div>
    );
  }

  if (!product) return <div style={{ background: '#030308', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>404 - Product not found</div>;

  const getPlatformColor = (platform) => {
    const p = platform.toLowerCase();
    if (p.includes('amazon')) return '#f97316';
    if (p.includes('flipkart')) return '#3b82f6';
    if (p.includes('myntra')) return '#ec4899';
    if (p.includes('ajio')) return '#1e40af';
    if (p.includes('meesho')) return '#d946ef';
    if (p.includes('reliance')) return '#dc2626';
    if (p.includes('croma')) return '#0ea5e9';
    if (p.includes('tata') || p.includes('cliq')) return '#0f172a';
    if (p.includes('nykaa')) return '#db2777';
    if (p.includes('mi ') || p.includes('xiaomi')) return '#ea580c';
    if (p.includes('vijay')) return '#b91c1c';
    if (p.includes('snapdeal')) return '#e11d48';
    return '#8b5cf6';
  };
  const badgeColor = getPlatformColor(product.platform);
  
  const formattedPrice = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.price);
  const lowestHistory = history.length > 0 ? Math.min(...history.map(h => h.price)) : product.price;

  const flipCardVariants = {
    hidden: { rotateX: 90, opacity: 0 },
    visible: i => ({
      rotateX: 0,
      opacity: 1,
      transition: { delay: i * 0.15 + 0.5, type: 'spring', stiffness: 120, damping: 15 }
    })
  };

  return (
    <div style={{ background: '#030308', minHeight: '100vh', padding: '32px', color: 'white', display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}
      >
        <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)} 
            style={{ position: 'absolute', top: 0, left: 0, padding: '10px 24px', fontWeight: 'bold', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '9999px', zIndex: 20, display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', cursor: 'pointer' }}
        >
          <span>←</span> Back
        </motion.button>

        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '60px', gap: '32px' }}>
          
          {/* IMAGE SECTION */}
          <div style={{ flex: '1 1 400px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', maxHeight: '500px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
             {product.image_url ? (
               <motion.img 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ duration: 0.5 }}
                 src={product.image_url} 
                 alt={product.title} 
                 style={{ objectFit: 'contain', width: '100%', height: '100%', maxHeight: '400px' }} 
               />
             ) : <div style={{ color: '#9ca3af', fontWeight: 500 }}>No Image Available</div>}
          </div>
          
          <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', marginBottom: '24px' }}>
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                style={{ background: badgeColor, color: 'white', fontSize: '0.875rem', fontWeight: 800, padding: '6px 16px', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                {product.platform}
              </motion.span>
            </div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', marginBottom: '24px', lineHeight: 1.2 }}
            >
              {product.title}
            </motion.h1>
            
            {/* FLIP CARDS */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '32px', perspective: 1000 }}>
              {[
                { label: 'Current Price', value: formattedPrice },
                { label: 'Lowest History', value: `₹${lowestHistory.toLocaleString('en-IN')}` }
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  custom={i}
                  initial="hidden" animate="visible" variants={flipCardVariants}
                  style={{ flex: '1 1 200px', background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{stat.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{stat.value}</div>
                </motion.div>
              ))}
            </div>
            
            {/* CHART */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px' }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '24px' }}>Price Trend History</h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={history} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: 'white', fontWeight: 500}} tickLine={false} axisLine={false} dy={10} />
                    <YAxis tickFormatter={(val) => `₹${val}`} tick={{fontSize: 12, fill: 'white', fontWeight: 500}} tickLine={false} axisLine={false} domain={['auto', 'auto']} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)', padding: '12px', backgroundColor: '#0f172a', color: 'white' }}
                      itemStyle={{ fontWeight: 'bold', color: 'white' }}
                      formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Recorded Price']}
                    />
                    <Line isAnimationActive={true} animationDuration={2500} animationEasing="ease-out" type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={4} dot={{r: 4, fill: '#8b5cf6', strokeWidth: 0}} activeDot={{r: 8, fill: '#c084fc', stroke: '#FFFFFF', strokeWidth: 2}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* AI ANALYSIS SECTION */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              style={{ width: '100%', background: 'rgba(139, 92, 246, 0.05)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '32px', position: 'relative', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <span style={{ fontSize: '1.5rem' }}>✨</span> AI Analysis
                  </h3>
                  <button onClick={fetchAISummary} disabled={aiLoading} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.3)', cursor: aiLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                     {aiLoading ? 'Analyzing...' : 'Refresh Analysis'}
                  </button>
               </div>
               
               {aiLoading ? (
                   <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                       <div style={{ width: '2rem', height: '2rem', border: '3px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%' }} className="animate-spin"></div>
                   </div>
               ) : aiError ? (
                   <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>{aiError}</div>
               ) : aiSummary && aiSummary.length > 0 ? (
                   <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                       {aiSummary.map((point, idx) => (
                           <li key={idx} style={{ lineHeight: 1.6 }}>{point}</li>
                       ))}
                   </ul>
               ) : (
                   <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>Click refresh to generate AI insights based on the latest price.</div>
               )}
            </motion.div>

            {/* ACTION BUTTONS */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', width: '100%' }}
            >
              <motion.a 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href={product.product_url} target="_blank" rel="noopener noreferrer" 
                style={{ flex: '1 1 250px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '1.125rem', fontWeight: 800, borderRadius: '16px', textDecoration: 'none', cursor: 'pointer' }}
              >
                 Buy on {product.platform}
              </motion.a>
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowTrackModal(true)} 
                style={{ flex: '1 1 250px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'linear-gradient(to right, #7c3aed, #ec4899)', border: 'none', color: 'white', fontSize: '1.125rem', fontWeight: 800, borderRadius: '16px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(124, 58, 237, 0.3)' }}
              >
                 Track Price Alerts
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* MODAL */}
      <AnimatePresence>
        {showTrackModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', padding: '20px' }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px', maxWidth: '400px', width: '100%', position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
            >
              <button onClick={() => { setShowTrackModal(false); setTrackStatus(''); setEmail(''); setTargetPrice(''); }} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '1.5rem', cursor: 'pointer' }}>
                 ✕
              </button>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '12px' }}>Track Price Drop</h2>
              <p style={{ color: '#9ca3af', marginBottom: '24px', fontSize: '0.9rem', lineHeight: 1.5 }}>Receive an email instantly when {product.title.slice(0,30)}... drops below your target price.</p>
              
              {trackStatus === 'success' ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', padding: '16px', borderRadius: '12px', fontWeight: 700, border: '1px solid rgba(16,185,129,0.2)' }}>Alert successfully created! We'll notify you on price drops.</motion.div>
              ) : (
                <form onSubmit={handleTrackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#d1d5db', marginBottom: '8px' }}>Email Address</label>
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#d1d5db', marginBottom: '8px' }}>Target Price (₹)</label>
                    <input required type="number" step="0.01" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} placeholder={`e.g. ${product.price - 100}`} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} disabled={trackStatus === 'submitting'} type="submit" style={{ marginTop: '16px', width: '100%', padding: '16px', background: 'linear-gradient(to right, #7c3aed, #ec4899)', color: 'white', fontWeight: 800, borderRadius: '12px', border: 'none', cursor: trackStatus === 'submitting' ? 'not-allowed' : 'pointer', opacity: trackStatus === 'submitting' ? 0.7 : 1 }}>
                    {trackStatus === 'submitting' ? 'Saving...' : 'Set Alert'}
                  </motion.button>
                  {trackStatus === 'error' && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '8px', textAlign: 'center', fontWeight: 600 }}>An error occurred. Please try again.</div>}
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
