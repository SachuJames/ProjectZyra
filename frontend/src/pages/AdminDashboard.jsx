import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import CountUp from 'react-countup';
import { Package, Users, BellRing, Layers } from 'lucide-react';

const COLORS = ['#f97316', '#3b82f6', '#ec4899', '#1e40af', '#d946ef', '#dc2626', '#0ea5e9', '#0f172a', '#db2777', '#ea580c', '#e11d48', '#8b5cf6'];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [stats, setStats] = useState(null);
  const [topSearches, setTopSearches] = useState([]);
  const [platformBreakdown, setPlatformBreakdown] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  
  const [loading, setLoading] = useState(false);

  // Hardcoded check
  const checkPassword = (e) => {
    e.preventDefault();
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchAdminData = async () => {
        setLoading(true);
        try {
          const [statsRes, topRes, pbRes, alertsRes, historyRes] = await Promise.all([
            fetch('/api/admin/stats'),
            fetch('/api/admin/top-searches'),
            fetch('/api/admin/platform-breakdown'),
            fetch('/api/admin/recent-alerts'),
            fetch('/api/admin/search-history')
          ]);
          setStats(await statsRes.json());
          setTopSearches(await topRes.json());
          setPlatformBreakdown(await pbRes.json());
          setRecentAlerts(await alertsRes.json());
          setSearchHistory(await historyRes.json());
        } catch (err) {
          console.error(err);
        } finally {
            setLoading(false);
        }
      };
      fetchAdminData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div style={{ background: '#030308', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '100px' }}>
         <motion.form 
           initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
           onSubmit={checkPassword} 
           style={{ background: 'rgba(255,255,255,0.05)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}
         >
            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800, textAlign: 'center' }}>Admin Access</h2>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter Admin Password" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
            <button type="submit" style={{ padding: '12px', borderRadius: '12px', background: 'linear-gradient(to right, #7c3aed, #ec4899)', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>Login</button>
         </motion.form>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div style={{ background: '#030308', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '4rem', height: '4rem', border: '4px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%' }} className="animate-spin"></div>
      </div>
    );
  }

  return (
    <div style={{ background: '#030308', minHeight: '100vh', padding: '32px', color: 'white', paddingTop: '100px' }}>
       <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Admin Dashboard</h1>
          
          {/* STAT CARDS */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
             {[
                { label: 'Total Products', value: stats.total_products, icon: Package, color: '#3b82f6' },
                { label: 'Total Users', value: stats.total_users, icon: Users, color: '#10b981' },
                { label: 'Active Alerts', value: stats.total_alerts, icon: BellRing, color: '#f59e0b' },
                { label: 'Platforms Tracked', value: Object.keys(stats.platform_breakdown).length, icon: Layers, color: '#8b5cf6' }
             ].map((stat, i) => (
                <motion.div 
                   key={i}
                   initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                   style={{ flex: '1 1 240px', background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}
                >
                   <div style={{ padding: '16px', borderRadius: '16px', background: `rgba(${parseInt(stat.color.slice(1,3), 16)}, ${parseInt(stat.color.slice(3,5), 16)}, ${parseInt(stat.color.slice(5,7), 16)}, 0.1)`, display: 'flex' }}>
                       <stat.icon size={28} color={stat.color} />
                   </div>
                   <div>
                       <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{stat.label}</div>
                       <div style={{ fontSize: '1.875rem', fontWeight: 800 }}>
                          <CountUp end={stat.value} duration={2} />
                       </div>
                   </div>
                </motion.div>
             ))}
          </div>

          {/* CHARTS */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
             <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                style={{ flex: '1 1 500px', background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}
             >
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Platform Breakdown</h3>
                <div style={{ width: '100%', height: '300px' }}>
                   <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                           <Pie data={platformBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(entry) => entry.name}>
                               {platformBreakdown.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                               ))}
                           </Pie>
                           <RechartsTooltip contentStyle={{ background: '#0a0a0f', borderColor: '#333' }} itemStyle={{ color: 'white' }} />
                       </PieChart>
                   </ResponsiveContainer>
                </div>
             </motion.div>

             <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                style={{ flex: '1 1 500px', background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}
             >
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Top 10 Searched Products</h3>
                <div style={{ width: '100%', height: '300px' }}>
                   <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={topSearches} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.1)" />
                           <XAxis type="number" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                           <YAxis type="category" dataKey="query" tick={{fontSize: 12, fill: 'white'}} axisLine={false} tickLine={false} width={80} />
                           <RechartsTooltip contentStyle={{ background: '#0a0a0f', borderColor: '#333' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                           <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                       </BarChart>
                   </ResponsiveContainer>
                </div>
             </motion.div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
              {/* RECENT ALERTS */}
              <motion.div 
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                 style={{ flex: '1 1 500px', background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}
              >
                 <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Recent Price Alerts</h3>
                 <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
                    <thead>
                       <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', fontSize: '0.875rem' }}>
                          <th style={{ padding: '12px 8px' }}>Product</th>
                          <th style={{ padding: '12px 8px' }}>Target (₹)</th>
                          <th style={{ padding: '12px 8px' }}>Status</th>
                       </tr>
                    </thead>
                    <tbody>
                       {recentAlerts.map(alert => (
                           <tr key={alert.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                               <td style={{ padding: '12px 8px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alert.product_name}</td>
                               <td style={{ padding: '12px 8px', fontWeight: 600 }}>{alert.target_price}</td>
                               <td style={{ padding: '12px 8px' }}>
                                  <span style={{ padding: '4px 8px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, background: alert.status === 'Triggered' ? 'rgba(16,185,129,0.2)' : 'rgba(139,92,246,0.2)', color: alert.status === 'Triggered' ? '#34d399' : '#c084fc' }}>
                                     {alert.status}
                                  </span>
                               </td>
                           </tr>
                       ))}
                    </tbody>
                 </table>
              </motion.div>

              {/* SEARCH HISTORY */}
              <motion.div 
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                 style={{ flex: '1 1 500px', background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}
              >
                 <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Search History</h3>
                 <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
                    <thead>
                       <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', fontSize: '0.875rem' }}>
                          <th style={{ padding: '12px 8px' }}>Query</th>
                          <th style={{ padding: '12px 8px' }}>Time</th>
                          <th style={{ padding: '12px 8px' }}>Results</th>
                       </tr>
                    </thead>
                    <tbody>
                       {searchHistory.map(log => (
                           <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                               <td style={{ padding: '12px 8px', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.query}</td>
                               <td style={{ padding: '12px 8px', color: '#9ca3af', fontSize: '0.875rem' }}>{new Date(log.searched_at).toLocaleString([], {month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit'})}</td>
                               <td style={{ padding: '12px 8px' }}>{log.result_count} items</td>
                           </tr>
                       ))}
                    </tbody>
                 </table>
              </motion.div>
          </div>

       </div>
    </div>
  );
}
