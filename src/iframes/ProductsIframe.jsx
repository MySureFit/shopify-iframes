import { useState, useEffect } from 'react';
import coreApi from '../api/coreApi';
import ProductCard from '../components/ProductCard';
import CollectionSortSelect from '../components/CollectionSortSelect';
import IframeHeader from '../components/IframeHeader';

const GENDER_TABS = [
  { label: 'Women',  value: 'f' },
  { label: 'Women+', value: 'p' },
  { label: 'Men',    value: 'm' },
];

const SORT_OPTIONS = [
  { label: 'Date, new to old', sortby: 'date',   orderby: 'desc' },
  { label: 'Price, high to low', sortby: 'price', orderby: 'desc' },
  { label: 'Price, low to high', sortby: 'price', orderby: 'asc' },
  { label: 'Date, old to new', sortby: 'date',   orderby: 'asc' },
];

export default function ProductsIframe() {
  const [products, setProducts]     = useState([]);
  const [facets, setFacets]         = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [gender, setGender]         = useState('f');
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [sortIdx, setSortIdx]       = useState(0);
  const [search, setSearch]         = useState('');
  const [openSections, setOpenSections] = useState({
    category: false, itemType: false, brand: false, color: false, price: false,
  });

  useEffect(() => { setProducts([]); setPage(1); setHasMore(true); }, [gender, sortIdx, search]);
  useEffect(() => { fetchProducts(); }, [gender, page, sortIdx, search]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    const sort = SORT_OPTIONS[sortIdx];
    try {
      const { data } = await coreApi.get('search/filter/products', {
        params: { collection: '', gender, search, sortby: sort.sortby, orderby: sort.orderby, page },
      });
      const items = data.products ?? data.data ?? (Array.isArray(data) ? data : []);
      const all   = items.slice(0, 20);
      const total = data.total_products?.total_products ?? items.length;
      if (page === 1) {
        setFacets({
          category:    data.category    ?? {},
          sub_cat:     data.sub_cat     ?? {},
          brand:       data.brand       ?? {},
          color:       data.color       ?? {},
          price_range: data.price_range ?? {},
        });
        setTotalCount(total);
      }
      setHasMore(page * 20 < total);
      setProducts(prev => page === 1 ? all : [...prev, ...all]);
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }));
  const brandCount = Object.keys(facets.brand ?? {}).length;

  return (
    <div className="iframe-page collection-page">
      <IframeHeader />

      <div className="tec_main_container">
        {/* ── Sidebar ── */}
        <div className="tec_search_filter_box">
          <div className="tec_side_search_box">
            <form className="fr_qs_form" onSubmit={e => e.preventDefault()}>
              <div className="fr_qs_input_box">
                <input
                  id="fr_search_box"
                  type="search"
                  className="fr_search_input"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <button className="fr_qs_input_btn" type="button" tabIndex={-1}>
                  <img src="/assets/search.svg" alt="" />
                </button>
              </div>
            </form>
          </div>

          <div id="fr_filter_origin_box">
            <div className="tec_side_filter_container">
              <div className="flex">
                <h2 className="tec_side_filter_heading">
                  Filter <span>{totalCount > 0 ? totalCount : ''}</span> items
                </h2>
              </div>

              <FilterSection label="CATEGORY" open={openSections.category} onToggle={() => toggle('category')}>
                <ul>
                  {Object.entries(facets.category ?? {}).map(([k, v]) => (
                    <li key={k}>
                      <a href="javascript:void(0);" className="fc_filter_link">
                        <label className="fr_mat_checkbox">
                          <input type="checkbox" readOnly />
                          <span>{k}<span className="fc_filter_num">({v})</span></span>
                        </label>
                      </a>
                    </li>
                  ))}
                </ul>
              </FilterSection>

              <FilterSection label="ITEM TYPE" open={openSections.itemType} onToggle={() => toggle('itemType')}>
                <ul>
                  {Object.entries(facets.sub_cat ?? {}).map(([k, v]) => (
                    <li key={k}>
                      <a href="javascript:void(0);" className="fc_filter_link">
                        <label className="fr_mat_checkbox">
                          <input type="checkbox" readOnly />
                          <span>{k}<span className="fc_filter_num">({v})</span></span>
                        </label>
                      </a>
                    </li>
                  ))}
                </ul>
              </FilterSection>

              <FilterSection
                label="BRAND"
                badge={brandCount > 0 ? brandCount : null}
                open={openSections.brand}
                onToggle={() => toggle('brand')}
              >
                <ul>
                  {Object.entries(facets.brand ?? {}).map(([k, v]) => (
                    <li key={k}>
                      <a href="javascript:void(0);" className="fc_filter_link">
                        <label className="fr_mat_checkbox">
                          <input type="checkbox" readOnly />
                          <span>{k}<span className="fc_filter_num">({v})</span></span>
                        </label>
                      </a>
                    </li>
                  ))}
                </ul>
              </FilterSection>

              <FilterSection label="COLOR" open={openSections.color} onToggle={() => toggle('color')}>
                <ul>
                  {Object.entries(facets.color ?? {}).map(([k, v]) => (
                    <li key={k}>
                      <a href="javascript:void(0);" className="fc_filter_link">
                        <span className="fc_filter_color" style={{ background: k }} />
                        {k}<span className="fc_filter_num"> ({v})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </FilterSection>

              <FilterSection label="PRICE" open={openSections.price} onToggle={() => toggle('price')}>
                {facets.price_range?.min_price != null && (
                  <div className="coll-price-range">
                    ${facets.price_range.min_price} – ${facets.price_range.max_price}
                  </div>
                )}
              </FilterSection>
            </div>
          </div>
        </div>

        {/* ── Main: header + grid ── */}
        <div className="tec_product_grid_container">
          <div className="tec_product_grid_header">
            <div className="handle-col">
              <h1 id="tec_collection_header_title">
                {GENDER_TABS.map(t => (
                  <a
                    key={t.value}
                    href="javascript:void(0);"
                    className={gender === t.value ? 'active' : ''}
                    onClick={() => setGender(t.value)}
                  >
                    {t.label}
                  </a>
                ))}
              </h1>
            </div>
            <div className="tec_sort_box">
              <CollectionSortSelect
                options={SORT_OPTIONS}
                value={sortIdx}
                onChange={setSortIdx}
              />
            </div>
          </div>

          {error && <div className="form-error" style={{ margin: '0 0 12px' }}>{error}</div>}

          {products.length === 0 && loading ? (
            <div className="loading-screen"><div className="spinner" />&nbsp;Loading…</div>
          ) : (
            <>
              <div id="tec_product_grid_box">
                {products.map((p, i) => (
                  <ProductCard key={p.product_id ?? i} product={p} />
                ))}
              </div>

              {products.length > 0 && hasMore && (
                <div style={{ textAlign: 'center', padding: '24px 0', clear: 'both' }}>
                  <button
                    className="btn_primary"
                    style={{ padding: '10px 32px' }}
                    onClick={() => setPage(n => n + 1)}
                    disabled={loading}
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
      </div>
    </div>
  );
}

function FilterSection({ label, badge, open, onToggle, children }) {
  return (
    <div className="tec_filter_single_filter_box">
      {badge != null && (
        <div className="tec_filter_single_clear_box faded" style={{ display: 'block' }}>
          <div className="box">
            <p className="txt" id="totalBrandsCount">{badge} TOTAL</p>
            <div className="tec_filter_active_icon" />
          </div>
        </div>
      )}
      <a
        className={`tec_filter_cat_btn btn_primary${open ? ' filter_active' : ''}`}
        onClick={onToggle}
      >
        {label}
        <span className="tec_filter_caret caret" />
      </a>
      <div className={`fc_box${open ? ' open_filter' : ''}`}>
        {children}
      </div>
    </div>
  );
}
