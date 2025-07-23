import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import ProductCard from '../components/ProductCard';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', 'search', searchQuery],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:profiles(
            business_name,
            stripe_account_id,
            stripe_onboarding_completed
          )
        `)
        .textSearch('name', searchQuery)
        .or(`description.ilike.%${searchQuery}%`);

      if (error) throw error;
      return data || [];
    },
    enabled: !!searchQuery
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Loading results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Search Results for "{searchQuery}"
      </h1>

      {products.length === 0 ? (
        <div className="text-center text-gray-600">
          <p>No products found matching "{searchQuery}"</p>
          <p className="mt-2">Try using different keywords or browse our categories</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage; 