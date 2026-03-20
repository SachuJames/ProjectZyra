import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q');
  const navigate = useNavigate();
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!q) {
        navigate('/');
        return;
    }
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:8000/search?q=${encodeURIComponent(q)}`);
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
  }, [q, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:py-12 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between mb-10">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight shrink-0">
            Results for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">"{q}"</span>
          </h2>
          <form onSubmit={(e) => { e.preventDefault(); const val = e.target.elements.sq.value.trim(); if(val) navigate(`/search?q=${encodeURIComponent(val)}`); }} className="relative w-full md:w-auto flex-1 max-w-lg mx-0 md:mx-6">
            <input name="sq" type="text" defaultValue={q} className="w-full px-5 py-2.5 rounded-full border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" placeholder="Search again..." />
            <button type="submit" className="absolute right-1 top-1 bottom-1 px-5 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition">Search</button>
          </form>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 font-bold text-blue-600 bg-white rounded-full shadow-sm hover:shadow-md hover:bg-gray-50 border border-gray-200 transition-all shrink-0">
            Home
          </button>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
             <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
             <p className="mt-6 text-xl font-bold text-gray-800 animate-pulse">Scanning platforms...</p>
             <p className="mt-2 text-gray-500">Extracting and deduplicating the best deals</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 bg-red-50 rounded-3xl border border-red-100 font-medium">
            Error: {error}
          </div>
        ) : results.length === 0 ? (
          <div className="p-16 text-center text-gray-600 bg-white rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">No matching products found</h3>
            <p className="text-lg">Try searching with broader terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((product) => {
              const minPrice = results.length > 0 ? Math.min(...results.filter(r => r.price > 0).map(r => r.price)) : 0;
              return <ProductCard key={product.id} product={product} absoluteLowest={product.price > 0 && product.price === minPrice} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
