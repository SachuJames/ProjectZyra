import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import CountUp from 'react-countup';
import { Search, Brain, Tag } from 'lucide-react';

const TypewriterPlaceholder = ({ setPlaceholder }) => {
  const phrases = ['Search for iPhone 17 Pro...', 'Search for MacBook Air M4...', 'Search for Sony headphones...'];
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    let timer = setTimeout(() => {
      const i = loopNum % phrases.length;
      const fullText = phrases[i];

      setText(isDeleting ? fullText.substring(0, text.length - 1) : fullText.substring(0, text.length + 1));
      setTypingSpeed(isDeleting ? 30 : 80);

      if (!isDeleting && text === fullText) {
        timer = setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    }, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed]);

  useEffect(() => {
    setPlaceholder(text);
  }, [text, setPlaceholder]);

  return null;
};

const generateStars = (count) => {
  let shadows = '';
  for(let i = 0; i < count; i++) {
    shadows += `${Math.floor(Math.random() * window.innerWidth)}px ${Math.floor(Math.random() * window.innerHeight)}px #FFF${i < count -1 ? ',' : ''}`;
  }
  return shadows;
};

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [starShadows1, setStarShadows1] = useState('');
  const [starShadows2, setStarShadows2] = useState('');

  useEffect(() => {
    setStarShadows1(generateStars(100));
    setStarShadows2(generateStars(100));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const autofill = (term) => {
    setQuery(term);
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const pills = [
    { text: 'iPhone 17 Pro ₹1,19,900', color: '#f97316', path: 'pill-path-1', delay: '0s' },
    { text: 'MacBook Air M4 ₹89,990', color: '#3b82f6', path: 'pill-path-2', delay: '5s' },
    { text: 'Samsung S25 Ultra ₹1,09,999', color: '#3b82f6', path: 'pill-path-3', delay: '2s' },
    { text: 'iPad Pro ₹89,900', color: '#f97316', path: 'pill-path-2', delay: '12s' },
    { text: 'Sony WH-1000XM5 ₹24,990', color: '#f97316', path: 'pill-path-1', delay: '15s' },
    { text: 'OnePlus 13 ₹69,999', color: '#f97316', path: 'pill-path-3', delay: '8s' },
    { text: 'Dyson V15 ₹52,900', color: '#3b82f6', path: 'pill-path-2', delay: '18s' },
    { text: 'AirPods Pro ₹24,900', color: '#f97316', path: 'pill-path-1', delay: '22s' },
  ];

  const howItWorksRef = useRef(null);
  const isHowItWorksInView = useInView(howItWorksRef, { once: true, margin: "-100px" });

  const [platformIdx, setPlatformIdx] = useState(0);
  const platforms = ['Amazon', 'Flipkart', 'Samsung.com'];
  useEffect(() => {
    const t = setInterval(() => setPlatformIdx(prev => (prev+1)%3), 2000);
    return () => clearInterval(t);
  }, []);

  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#030308', position: 'relative', overflowX: 'hidden', display: 'flex', flexDirection: 'column', paddingTop: '2.5rem' }}>
      <TypewriterPlaceholder setPlaceholder={setPlaceholder} />
      
      {/* Deep Space Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {starShadows1 && <div className="animate-twinkle1" style={{ position: 'absolute', width: '1px', height: '1px', backgroundColor: 'transparent', boxShadow: starShadows1 }} />}
        {starShadows2 && <div className="animate-twinkle2" style={{ position: 'absolute', width: '2px', height: '2px', backgroundColor: 'transparent', boxShadow: starShadows2 }} />}
      </div>

      {/* Floating Gradient Orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="orb-1" style={{ position: 'absolute', top: '-10%', left: '-10%', width: '600px', height: '600px', backgroundColor: '#7c3aed', opacity: 0.4, filter: 'blur(120px)', borderRadius: '50%' }}></div>
        <div className="orb-2" style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '700px', height: '700px', backgroundColor: '#ec4899', opacity: 0.3, filter: 'blur(150px)', borderRadius: '50%' }}></div>
        <div className="orb-3" style={{ position: 'absolute', top: '30%', right: '20%', width: '500px', height: '500px', backgroundColor: '#06b6d4', opacity: 0.25, filter: 'blur(100px)', borderRadius: '50%' }}></div>
      </div>

      {/* Floating Product Pills */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', overflow: 'hidden' }} className="hidden md:block">
        {pills.map((pill, idx) => (
          <div key={idx} className={pill.path} style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9999px', boxShadow: '0 0 20px rgba(255,255,255,0.05)', animationDelay: pill.delay }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: pill.color, boxShadow: `0 0 10px ${pill.color}` }}></div>
            <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.025em', whiteSpace: 'nowrap' }}>{pill.text}</span>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 20, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '80rem', margin: '0 auto', padding: '0 1rem', marginBottom: '5rem', paddingTop: '10vh' }}>
        
        {/* HERO */}
        <motion.div 
          initial="hidden" animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
          style={{ textAlign: 'center', width: '100%', maxWidth: '56rem', margin: '0 auto 4rem auto' }}
        >
          <motion.h1 variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} style={{ fontSize: '4.5rem', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.1, marginBottom: '0.5rem', color: 'white', textShadow: '0 0 15px rgba(255,255,255,0.2)' }}>
            Find the Best Price.
          </motion.h1>
          <motion.h1 variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} style={{ fontSize: '4.5rem', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.1, marginBottom: '2rem' }}>
            <span className="animate-gradient-cycle" style={{ color: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text', backgroundImage: 'linear-gradient(to right, #a855f7, #ec4899, #06b6d4, #a855f7)', display: 'inline-block', paddingBottom: '0.5rem' }}>Instantly.</span>
          </motion.h1>
          
          <motion.p variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} style={{ fontSize: '1.25rem', color: '#9ca3af', fontWeight: 300, marginBottom: '4rem', maxWidth: '42rem', margin: '0 auto', letterSpacing: '0.025em', lineHeight: 1.6 }}>
            ProjectZyra scans Amazon, Flipkart, Nykaa, Myntra, Ajio and more in real time
          </motion.p>
        </motion.div>

        {/* SEARCH BAR */}
        <motion.form 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }}
          onSubmit={handleSearch} 
          style={{ width: '100%', maxWidth: '680px', margin: '0 auto', zIndex: 30, marginBottom: '2.5rem' }}
        >
          <div className="glow-border" style={{ position: 'relative', borderRadius: '9999px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', display: 'flex', alignItems: 'center', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: searchFocused ? '0 0 40px rgba(168,85,247,0.4)' : '0 0 40px rgba(0,0,0,0.5)', transition: 'all 0.3s' }}>
            <div style={{ paddingLeft: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ position: 'relative', width: '1.5rem', height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-radar-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid #a855f7' }}></div>
                <div className="animate-radar-ping animation-delay-500" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid #06b6d4' }}></div>
                <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#c084fc', borderRadius: '50%', boxShadow: '0 0 10px #a855f7' }}></div>
              </div>
            </div>
            
            <input
              type="text"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{ flexGrow: 1, padding: '1rem 1.5rem', backgroundColor: 'transparent', outline: 'none', border: 'none', color: 'white', fontSize: '1.25rem', fontWeight: 300, width: '100%' }}
              placeholder={query ? "" : placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {/^https?:\/\//i.test(query) && (
              <div className="hidden sm:flex" style={{ position: 'absolute', right: '140px', backgroundColor: 'rgba(168,85,247,0.2)', color: '#c084fc', padding: '0.4rem 0.8rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600, alignItems: 'center', gap: '0.4rem', pointerEvents: 'none' }}>
                🔗 Searching by URL
              </div>
            )}
            
            <button type="submit" style={{ padding: '1rem 2rem', background: 'linear-gradient(to right, #9333ea, #db2777)', color: 'white', borderRadius: '9999px', fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', cursor: 'pointer', border: 'none', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
              <span style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>SEARCH</span>
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            {['🔥 iPhone 17', '💻 MacBook', '📱 Samsung Galaxy'].map((chip, i) => (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} key={i} onClick={() => autofill(chip.split(' ').slice(1).join(' '))} style={{ padding: '0.375rem 1rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: '0.875rem', cursor: 'pointer', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {chip}
              </motion.div>
            ))}
          </div>
        </motion.form>

        {/* STATS */}
        <motion.div 
          initial="hidden" animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delayChildren: 1.2, staggerChildren: 0.2 } } }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '64rem', marginTop: '4rem', marginBottom: '8rem', zIndex: 30 }}
        >
          {[
            { label: 'Products Tracked', val: <><CountUp end={50000} duration={3} separator="," />+</> },
            { label: 'Platforms Scanned', val: <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}><CountUp end={3} duration={2} /> <span style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', color: '#e9d5ff', fontWeight: 500, minWidth: '120px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><motion.span key={platformIdx} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.3 }}>{platforms[platformIdx]}</motion.span></span></div> },
            { label: '% Average Savings', val: <><CountUp end={40} duration={3} />%</> }
          ].map((stat, idx) => (
            <motion.div key={idx} variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: "spring" } } }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <h3 style={{ fontSize: '3rem', fontWeight: 900, color: 'white', marginBottom: '0.75rem', textShadow: '0 4px 6px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '4rem' }}>
                {stat.val}
              </h3>
              <p style={{ fontSize: '0.875rem', letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* HOW IT WORKS */}
        <div ref={howItWorksRef} style={{ width: '100%', maxWidth: '72rem', margin: '0 auto', padding: '5rem 0', zIndex: 30, borderTop: '1px solid rgba(255,255,255,0.1)', position: 'relative', marginTop: '2.5rem' }}>
           <h2 style={{ fontSize: '1.875rem', fontWeight: 700, textAlign: 'center', color: 'white', marginBottom: '5rem', letterSpacing: '-0.025em' }}>How it Works</h2>
           
           <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative', padding: '0 2.5rem', flexWrap: 'wrap', gap: '2rem' }}>
              {/* Connection Line */}
              <div className="hidden md:block" style={{ position: 'absolute', top: '50%', left: '15%', right: '15%', height: '2px', zIndex: 0, transform: 'translateY(-50%)' }}>
                 <svg style={{ width: '100%', height: '2px', overflow: 'visible' }} preserveAspectRatio="none">
                    <line x1="0" y1="1" x2="100%" y2="1" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="10 10" className="animate-dash" />
                 </svg>
                 <div className="path-dot"></div>
              </div>

              {[
                { icon: <Search size={32} color="#22d3ee" />, title: 'Search any product' },
                { icon: <Brain size={32} color="#c084fc" />, title: 'AI scans all platforms' },
                { icon: <Tag size={32} color="#f472b6" />, title: 'Get the lowest price' }
              ].map((step, idx) => (
                 <motion.div 
                   key={idx}
                   initial={{ opacity: 0, y: 40 }} animate={isHowItWorksInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: idx * 0.3, type: "spring", stiffness: 80 }}
                   style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10, flex: '1 1 auto' }}
                 >
                   <div style={{ width: '6rem', height: '6rem', borderRadius: '50%', backgroundColor: '#030308', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 0 30px rgba(255,255,255,0.05)', position: 'relative' }}>
                     {step.icon}
                   </div>
                   <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', textAlign: 'center' }}>{step.title}</h3>
                 </motion.div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}
