import { Link } from 'react-router-dom';

export default function ProductCard({ product, absoluteLowest }) {
  const p = (product.platform || '').toLowerCase();
  let badgeColor = 'bg-gray-600';
  if (p.includes('amazon')) badgeColor = 'bg-orange-500';
  else if (p.includes('flipkart')) badgeColor = 'bg-blue-600';
  else if (p.includes('croma')) badgeColor = 'bg-teal-600';
  else if (p.includes('nykaa')) badgeColor = 'bg-pink-500';
  else if (p.includes('meesho')) badgeColor = 'bg-rose-500';
  else if (p.includes('reliance')) badgeColor = 'bg-indigo-700';
  else if (p.includes('vijay')) badgeColor = 'bg-red-600';
  
  const highlightClass = absoluteLowest
    ? 'ring-4 ring-green-400 transform -translate-y-2 shadow-xl'
    : 'hover:shadow-lg hover:-translate-y-1';

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  return (
    <Link to={`/product/${product.id}`} className={`block group relative bg-white rounded-3xl overflow-hidden transition-all duration-300 border border-gray-100 ${highlightClass}`}>
      {absoluteLowest && (

        <div className="absolute top-0 right-0 px-4 py-1.5 text-xs font-extrabold text-white bg-gradient-to-r from-green-400 to-green-600 rounded-bl-xl z-10 shadow-md tracking-wider">
          BEST DEAL
        </div>
      )}
      <div className="relative w-full h-64 bg-white flex items-center justify-center p-6 border-b border-gray-50">
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="object-contain max-h-full max-w-full drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />
        ) : (
           <div className="text-gray-300 font-medium">No Image Found</div>
        )}
      </div>
      <div className="p-6">
        <span className={`inline-block px-3 py-1 mb-3 text-xs font-bold text-white rounded-full ${badgeColor} shadow-sm`}>
          {product.platform}
        </span>
        <h3 className="mb-4 text-lg font-bold text-gray-800 line-clamp-2 leading-snug">
          {product.title}
        </h3>
        <div className="flex items-center justify-between mt-auto">
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{formattedPrice}</p>
        </div>
      </div>
    </Link>
  );
}
