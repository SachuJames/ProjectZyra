import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-2xl px-4 text-center">
        <h1 className="mb-4 text-6xl font-extrabold tracking-tight text-blue-600">
          ProjectZyra
        </h1>
        <p className="mb-8 text-xl text-gray-500">
          ProjectZyra — Find the lowest price across Amazon, Flipkart and more instantly.
        </p>

        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-full shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
            placeholder="Search for laptops, phones, electronics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="absolute top-2 right-2 px-6 py-2.5 text-white bg-blue-600 rounded-full hover:bg-blue-700 transition font-bold"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
