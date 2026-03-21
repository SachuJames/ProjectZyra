import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product, absoluteLowest }) {
  const navigate = useNavigate();

  const getPlatformColor = (platform) => {
    const p = platform.toLowerCase();
    if (p.includes('amazon')) return '#f97316';
    if (p.includes('flipkart')) return '#3b82f6';
    if (p.includes('nykaa')) return '#fc2779';
    if (p.includes('myntra')) return '#ff3f6c';
    if (p.includes('meesho')) return '#9400d3';
    if (p.includes('tata') || p.includes('cliq')) return '#6b21a8';
    if (p.includes('purplle')) return '#7e22ce';
    if (p.includes('ajio')) return '#dc2626';
    if (p.includes('snapdeal')) return '#dc2626';
    if (p.includes('reliance')) return '#dc2626';
    if (p.includes('croma')) return '#0ea5e9';
    if (p.includes('mi ') || p.includes('xiaomi')) return '#ea580c';
    if (p.includes('vijay')) return '#b91c1c';
    return '#8b5cf6';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      onClick={() => navigate(`/product/${product.id}`)}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        height: '100%'
      }}
    >
      {absoluteLowest && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'linear-gradient(to right, #10b981, #059669)', color: 'white', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '9999px', zIndex: 10, boxShadow: '0 4px 10px rgba(16,185,129,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Best Deal
        </div>
      )}
      
      <div style={{ width: '100%', height: '200px', background: 'rgba(255,255,255,0.03)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img 
          src={product.image_url} 
          alt={product.title} 
          style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'normal' }}
        />
      </div>

      <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '12px', display: 'flex' }}>
          <span style={{ background: getPlatformColor(product.platform), color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {product.platform}
          </span>
        </div>

        <h3 style={{ color: 'white', fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.4, marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', height: '3.15rem' }}>
          {product.title}
        </h3>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ color: '#a855f7', fontSize: '1.25rem', fontWeight: 800 }}>₹</span>
          <span style={{ color: 'white', fontSize: '1.875rem', fontWeight: 900, letterSpacing: '-0.025em' }}>
            {product.price.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
