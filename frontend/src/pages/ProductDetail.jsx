import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) return <div className="flex items-center justify-center min-h-screen text-2xl font-bold text-gray-800">404 - Product not found</div>;

  const isAmazon = product.platform.toLowerCase() === 'amazon';
  const badgeColor = isAmazon ? 'bg-orange-500' : 'bg-blue-600';
  const formattedPrice = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.price);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-12 lg:py-16 flex justify-center items-start">
      <div className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-100 p-8 md:p-12 relative mt-4 md:mt-10">
        <button 
            onClick={() => navigate(-1)} 
            className="absolute top-6 left-6 md:top-8 md:left-8 px-4 py-2 font-bold bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition z-20 flex items-center gap-2 shadow-sm"
            title="Go Back"
        >
          <span>←</span> Back
        </button>

        <div className="w-full md:w-5/12 flex items-center justify-center p-8 mt-12 md:mt-0 bg-white rounded-3xl border border-gray-50 max-h-[500px]">
           {product.image_url ? (
             <img src={product.image_url} alt={product.title} className="object-contain w-full h-full max-h-96" />
           ) : <div className="text-gray-400 font-medium">No Image Available</div>}
        </div>
        
        <div className="w-full md:w-7/12 mt-8 md:mt-0 md:pl-16 flex flex-col justify-center">
          <span className={`inline-block px-4 py-1.5 mb-6 text-sm font-extrabold text-white tracking-wide rounded-full w-max shadow-sm ${badgeColor}`}>
            {product.platform.toUpperCase()}
          </span>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
            {product.title}
          </h1>
          <div className="flex items-end gap-4 mb-10">
            <span className="text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter">{formattedPrice}</span>
          </div>
          
          <div className="w-full bg-gray-50 p-6 md:p-8 rounded-3xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Price Trend History</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6B7280', fontWeight: 600}} tickLine={false} axisLine={false} dy={10} />
                  <YAxis tickFormatter={(val) => `₹${val}`} tick={{fontSize: 12, fill: '#6B7280', fontWeight: 600}} tickLine={false} axisLine={false} domain={['auto', 'auto']} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                    itemStyle={{ fontWeight: 'bold', color: '#1F2937' }}
                    formatter={(value) => [`₹${value}`, 'Recorded Price']}
                  />
                  <Line type="monotone" dataKey="price" stroke="#4F46E5" strokeWidth={4} dot={{r: 4, fill: '#4F46E5', strokeWidth: 0}} activeDot={{r: 8, fill: '#3730A3', strokeWidth: 0, stroke: '#FFFFFF', strokeWidth: 2}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row w-full gap-4">
            <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="w-full md:w-1/2 flex items-center justify-center px-8 py-5 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-xl font-extrabold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all">
               Buy on {product.platform}
            </a>
            <button onClick={() => setShowTrackModal(true)} className="w-full md:w-1/2 flex items-center justify-center px-8 py-5 bg-white border-2 border-indigo-600 text-indigo-700 text-xl font-extrabold rounded-2xl shadow-md hover:bg-indigo-50 hover:scale-[1.02] transition-all">
               Track Price Alerts
            </button>
          </div>
        </div>
      </div>

      {showTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-fadeIn">
            <button onClick={() => { setShowTrackModal(false); setTrackStatus(''); setEmail(''); setTargetPrice(''); }} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800">
               ✕
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Track Price Drop</h2>
            <p className="text-gray-500 mb-6">Receive an email instantly when {product.title.slice(0,30)}... drops below your target price.</p>
            
            {trackStatus === 'success' ? (
              <div className="bg-green-50 text-green-700 p-4 rounded-2xl font-bold border border-green-200">Alert successfully created! We'll notify you on price drops.</div>
            ) : (
              <form onSubmit={handleTrackSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Target Price (₹)</label>
                  <input required type="number" step="0.01" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} placeholder={`e.g. ${product.price - 100}`} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none" />
                </div>
                <button disabled={trackStatus === 'submitting'} type="submit" className="mt-2 w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-70 disabled:cursor-not-allowed">
                  {trackStatus === 'submitting' ? 'Saving...' : 'Set Alert'}
                </button>
                {trackStatus === 'error' && <div className="text-red-500 text-sm mt-2 text-center">An error occurred. Please try again.</div>}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
