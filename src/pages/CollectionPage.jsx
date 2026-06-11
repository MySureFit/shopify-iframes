import { useState, useEffect } from 'react';
import syncApi from '../api/syncApi';
import ProductCard from '../components/ProductCard';

const FILTERS = [
  { label: 'Women',    value: 'women'     },
  { label: 'Men',      value: 'men'       },
  { label: 'Plus',     value: 'plus_size' },
];

export default function CollectionPage() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [filter, setFilter]       = useState('women');
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(true);
  const LIMIT = 24;

  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
  }, [filter]);

  useEffect(() => {
    fetchProducts();
  }, [filter, page]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await syncApi.get('search/products', {
        params: {
          q:            '',
          service_type: filter,
          limit:        LIMIT,
          page,
        },
      });

      // Handle varied response shapes
      const items = data.data ?? data.products ?? data.results ?? (Array.isArray(data) ? data : []);
      if (items.length < LIMIT) setHasMore(false);

      setProducts((prev) => (page === 1 ? items : [...prev, ...items]));
    } catch (err) {
      setError('Failed to load products. ' + (err.response?.data?.message ?? err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="collection-header">
        <h1 className="collection-title">Collection</h1>
        <div className="filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-tab ${filter === f.value ? 'active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: 20 }}>{error}</div>
      )}

      {products.length === 0 && loading ? (
        <div className="loading-screen">
          <div className="spinner" style={{ borderTopColor: '#888' }} />
          Loading products…
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((product, i) => (
              <ProductCard
                key={product.v3stack_product_id ?? product.id ?? i}
                product={product}
              />
            ))}
          </div>

          {products.length > 0 && hasMore && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
              <button
                className="filter-tab"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                style={{ padding: '10px 32px' }}
              >
                {loading ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}

          {products.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 14 }}>
              No products found.
            </div>
          )}
        </>
      )}
    </div>
  );
}
