import ProductCard from './ProductCard.jsx';
import { LoadingState, ErrorState, ProductsEmptyState } from './StateBlocks.jsx';

export default function ProductGrid({ products = [], loading = false, error = null, onRetry, onClear, emptyMessage }) {
  if (loading) {
    return <LoadingState label="Loading products" />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }
  if (!products.length) {
    return (
      <ProductsEmptyState
        title="No products found"
        message={emptyMessage || 'Try a different search term or choose another category.'}
        onClear={onClear}
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
