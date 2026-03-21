import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [searches, setSearches] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      try {
        const [histRes, alertsRes, searchesRes] = await Promise.all([
          fetch('http://localhost:8000/dashboard/history', { headers }),
          fetch('http://localhost:8000/dashboard/alerts', { headers }),
          fetch('http://localhost:8000/dashboard/searches', { headers })
        ]);
        
        if (histRes.ok) setHistory(await histRes.json());
        if (alertsRes.ok) setAlerts(await alertsRes.json());
        if (searchesRes.ok) setSearches(await searchesRes.json());
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };
    
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (!user) return <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem', fontSize: '1.25rem' }}>Loading dashboard...</div>;

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem', ...gradientText }}>Personal Dashboard</h1>
        <p style={{ color: '#9ca3af', fontSize: '1.125rem' }}>{user.full_name} <span style={{ opacity: 0.5, margin: '0 0.5rem' }}>•</span> {user.email}</p>
      </header>

      <section>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#a855f7' }}>✦</span> My Tracked Products
        </h2>
        {history.length === 0 ? (
          <div style={{ color: '#9ca3af', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', textAlign: 'center' }}>You are not tracking any products yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {history.map((product) => (
              <motion.div key={product.id} whileHover={{ y: -5 }} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '200px', width: '100%', background: 'white', padding: '1rem' }}>
                  <img src={product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.title}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Current Price</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>₹{product.current_price}</div>
                    </div>
                    {product.buy_status === 'Good Time to Buy' && (
                      <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>Best Time To Buy</div>
                    )}
                    {product.buy_status === 'Wait' && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>Wait</div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '3rem' }}>
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#a855f7' }}>✦</span> Price Alerts
          </h2>
          {alerts.length === 0 ? (
            <div style={{ color: '#9ca3af', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', textAlign: 'center' }}>No active price alerts.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {alerts.map((alert) => (
                <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '50px', height: '50px', background: 'white', borderRadius: '0.5rem', padding: '0.25rem', flexShrink: 0 }}>
                    <img src={alert.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alert.product_name}</h4>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                      <span style={{ color: '#9ca3af' }}>Target: <span style={{ color: 'white', fontWeight: 600 }}>₹{alert.target_price}</span></span>
                      <span style={{ color: '#9ca3af' }}>Current: <span style={{ color: 'white', fontWeight: 600 }}>₹{alert.current_price}</span></span>
                    </div>
                  </div>
                  <div style={{ background: alert.status === 'Active' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: alert.status === 'Active' ? '#3b82f6' : '#22c55e', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600 }}>
                    {alert.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#a855f7' }}>✦</span> Recent Searches
          </h2>
          {searches.length === 0 ? (
            <div style={{ color: '#9ca3af', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', textAlign: 'center' }}>No recent searches.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {searches.map((search) => (
                <Link to={`/search?q=${encodeURIComponent(search.query)}`} key={search.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem 1.25rem', borderRadius: '0.75rem', textDecoration: 'none', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white', fontWeight: 500 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    {search.query}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    {new Date(search.created_at).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

    </div>
  );
}

const gradientText = {
  background: 'linear-gradient(to right, #a855f7, #6366f1)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};
