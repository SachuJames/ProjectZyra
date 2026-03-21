import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.access_token);
        navigate('/dashboard');
      } else {
        setError(data.detail || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenResponse.access_token })
        });
        const data = await res.json();
        if (res.ok) {
          login(data.access_token);
          navigate('/dashboard');
        } else {
          setError(data.detail || 'Google Login failed');
        }
      } catch (err) {
        setError('Google Login network error');
      }
    },
    onError: () => {
      setError('Google Login Failed');
    }
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'rgba(255,255,255,0.03)', padding: '2.5rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
      >
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center', color: 'white' }}>Create Account</h2>
        <p style={{ color: '#9ca3af', textAlign: 'center', marginBottom: '2rem' }}>Join ProjectZyra today</p>
        
        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#d1d5db' }}>Full Name</label>
            <input 
              type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white', outline: 'none' }}
              placeholder="John Doe"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#d1d5db' }}>Email Address</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white', outline: 'none' }}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#d1d5db' }}>Password</label>
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white', outline: 'none' }}
              placeholder="••••••••"
            />
          </div>
          <button 
            disabled={loading}
            style={{ width: '100%', padding: '0.875rem', background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: 'white', fontWeight: 600, borderRadius: '0.5rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <span style={{ padding: '0 1rem', color: '#9ca3af', fontSize: '0.875rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
        </div>

        <button 
          onClick={() => googleLogin()}
          style={{ width: '100%', padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'white', color: '#1f2937', fontWeight: 600, borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px' }} />
          Sign in with Google
        </button>

        <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: '#9ca3af' }}>
          Already have an account? <Link to="/login" style={{ color: '#a855f7', textDecoration: 'none', fontWeight: 600 }}>Login</Link>
        </p>
      </motion.div>
    </div>
  );
}
