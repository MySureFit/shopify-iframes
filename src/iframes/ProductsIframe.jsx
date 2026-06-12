import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import coreApi from '../api/coreApi';
import ProductCard from '../components/ProductCard';
import CollectionSortSelect from '../components/CollectionSortSelect';
import PriceFilter from '../components/PriceFilter';
import IframeHeader from '../components/IframeHeader';

const GENDER_TABS = [
  { label: 'Women',  value: 'f', collection: 'women' },
  { label: 'Women+', value: 'p', collection: 'plus'  },
  { label: 'Men',    value: 'm', collection: 'men'   },
];

const SORT_OPTIONS = [
  { label: 'Date, new to old',   sortby: 'date',  orderby: 'desc' },
  { label: 'Price, high to low', sortby: 'price', orderby: 'desc' },
  { label: 'Price, low to high', sortby: 'price', orderby: 'asc'  },
  { label: 'Date, old to new',   sortby: 'date',  orderby: 'asc'  },
];

export default function ProductsIframe() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Ephemeral pagination/result state
  const [products, setProducts]     = useState([]);
  const [facets, setFacets]         = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [openSections, setOpenSections] = useState({
    category: false, itemType: false, brand: false, color: false, price: false,
  });

  // Local search input state — only committed to URL on Enter/blur
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') ?? '');

  // Filter state derived from URL
  const gender   = searchParams.get('gender')  ?? 'f';
  const sortby   = searchParams.get('sortby')  ?? 'date';
  const orderby  = searchParams.get('orderby') ?? 'desc';
  const search   = searchParams.get('search')  ?? '';
  const sortIdx  = Math.max(0, SORT_OPTIONS.findIndex(o => o.sortby === sortby && o.orderby === orderby));
  const filters  = {
    category: searchParams.getAll('category'),
    sub_cat:  searchParams.getAll('sub_cat'),
    brand:    searchParams.getAll('brand'),
    color:    searchParams.getAll('color'),
  };
  const priceStr    = searchParams.get('price');
  const activePrice = priceStr ? priceStr.split(':').map(Number) : null;

  // Effect 1: URL changed → reset + fetch page 1
  useEffect(() => {
    setProducts([]);
    setHasMore(true);
    setPage(1);
    fetchProducts(1);
  }, [searchParams]);

  // Effect 2: Load more only (page > 1)
  useEffect(() => {
    if (page === 1) return;
    fetchProducts(page);
  }, [page]);

  const fetchProducts = async (fetchPage) => {
    setLoading(true);
    setError(null);
    const sort       = SORT_OPTIONS[Math.max(0, SORT_OPTIONS.findIndex(o => o.sortby === sortby && o.orderby === orderby))];
    const tab        = GENDER_TABS.find(t => t.value === gender);
    const collection = tab?.collection ?? 'women';
    const cats   = searchParams.getAll('category');
    const subcat = searchParams.getAll('sub_cat');
    const brands = searchParams.getAll('brand');
    const colors = searchParams.getAll('color');
    const price  = searchParams.get('price');
    try {
      const { data } = await coreApi.get('search/filter/products', {
        params: {
          collection, gender, fp: false, search,
          sortby: sort.sortby, orderby: sort.orderby, page: fetchPage,
          ...(cats.length   && { category: cats   }),
          ...(subcat.length && { sub_cat:  subcat }),
          ...(brands.length && { brand:    brands }),
          ...(colors.length && { color:    colors }),
          ...(price         && { price              }),
        },
      });
      const items = data.products ?? data.data ?? (Array.isArray(data) ? data : []);
      const all   = items.slice(0, 20);
      const total = data.total_products?.total_products ?? items.length;
      if (fetchPage === 1) {
        setFacets({
          category:    data.category    ?? {},
          sub_cat:     data.sub_cat     ?? {},
          brand:       data.brand       ?? {},
          color:       data.color       ?? {},
          price_range: data.price_range ?? {},
          slider_price: data.slider_price ?? data.price_range ?? {},
        });
        setTotalCount(total);
      }
      setHasMore(fetchPage * 20 < total);
      setProducts(prev => fetchPage === 1 ? all : [...prev, ...all]);
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  // URL mutation helpers
  const setParam = (key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value == null || value === '') next.delete(key);
      else next.set(key, String(value));
      return next;
    }, { replace: true });
  };

  const toggleFilter = (key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const vals = next.getAll(key);
      next.delete(key);
      (vals.includes(value) ? vals.filter(v => v !== value) : [...vals, value])
        .forEach(v => next.append(key, v));
      return next;
    }, { replace: true });
  };

  const clearFilter = (key) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete(key);
      return next;
    }, { replace: true });
  };

  const clearAllFilters = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams();
      ['gender', 'sortby', 'orderby', 'search'].forEach(k => {
        const v = prev.get(k);
        if (v) next.set(k, v);
      });
      return next;
    }, { replace: true });
    setSearchInput('');
  };

  const applyPrice = (min, max) => setParam('price', `${min}:${max}`);
  const clearPrice = () => clearFilter('price');

  const commitSearch = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (searchInput) next.set('search', searchInput);
      else next.delete('search');
      return next;
    }, { replace: true });
  };

  const toggle = (key) => {
    setOpenSections(prev => {
      const next = { category: false, itemType: false, brand: false, color: false, price: false };
      if (!prev[key]) next[key] = true;
      return next;
    });
  };

  const brandCount  = Object.keys(facets.brand ?? {}).length;
  const totalActive = Object.values(filters).reduce((n, a) => n + a.length, 0) + (activePrice ? 1 : 0);

  return (
    <div className="iframe-page collection-page">
      <IframeHeader />

      <div className="tec_main_container">
        {/* ── Sidebar ── */}
        <div className="tec_search_filter_box">
          <div className="tec_side_search_box">
            <form className="fr_qs_form" onSubmit={e => { e.preventDefault(); commitSearch(); }}>
              <div className="fr_qs_input_box">
                <input
                  id="fr_search_box"
                  type="search"
                  className="fr_search_input"
                  placeholder="Search..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onBlur={commitSearch}
                />
                <button className="fr_qs_input_btn" type="submit" tabIndex={-1}>
                  <img src="/assets/search.svg" alt="" />
                </button>
              </div>
            </form>
          </div>

          <div id="fr_filter_origin_box">
            <div className="tec_side_filter_container">
              <div className="flex">
                <h2 className="tec_side_filter_heading">
                  Filter{' '}
                  <span className="tec_side_filter_item_count">{totalCount > 0 ? totalCount : ''}</span>
                  {' '}items
                </h2>
                {totalActive > 0 && (
                  <a className="clear_all_fltr" onClick={clearAllFilters}>
                    Clear All
                    <FilterClearIcon />
                  </a>
                )}
              </div>

              <FilterSection label="CATEGORY" open={openSections.category} onToggle={() => toggle('category')}
                activeCount={filters.category.length} onClear={() => clearFilter('category')}>
                <ul>
                  {Object.entries(facets.category ?? {}).map(([k, v]) => (
                    <li key={k}>
                      <label className="fc_filter_link fr_mat_checkbox">
                        <input type="checkbox" checked={filters.category.includes(k)} onChange={() => toggleFilter('category', k)} />
                        <span>{k}<span className="fc_filter_num">({v})</span></span>
                      </label>
                    </li>
                  ))}
                </ul>
              </FilterSection>

              <FilterSection label="ITEM TYPE" open={openSections.itemType} onToggle={() => toggle('itemType')}
                activeCount={filters.sub_cat.length} onClear={() => clearFilter('sub_cat')}>
                <ul>
                  {Object.entries(facets.sub_cat ?? {}).map(([k, v]) => (
                    <li key={k}>
                      <label className="fc_filter_link fr_mat_checkbox">
                        <input type="checkbox" checked={filters.sub_cat.includes(k)} onChange={() => toggleFilter('sub_cat', k)} />
                        <span>{k}<span className="fc_filter_num">({v})</span></span>
                      </label>
                    </li>
                  ))}
                </ul>
              </FilterSection>

              <FilterSection label="BRAND" badge={brandCount > 0 ? brandCount : null}
                open={openSections.brand} onToggle={() => toggle('brand')}
                activeCount={filters.brand.length} onClear={() => clearFilter('brand')}>
                <ul>
                  {Object.entries(facets.brand ?? {}).map(([k, v]) => (
                    <li key={k}>
                      <label className="fc_filter_link fr_mat_checkbox">
                        <input type="checkbox" checked={filters.brand.includes(k)} onChange={() => toggleFilter('brand', k)} />
                        <span>{k}<span className="fc_filter_num">({v})</span></span>
                      </label>
                    </li>
                  ))}
                </ul>
              </FilterSection>

              <FilterSection label="COLOR" open={openSections.color} onToggle={() => toggle('color')}
                activeCount={filters.color.length} onClear={() => clearFilter('color')}>
                <ul>
                  {Object.entries(facets.color ?? {}).map(([k, v]) => (
                    <li key={k}>
                      <a
                        className={`fc_filter_link${filters.color.includes(k) ? ' fc_filter_link_active' : ''}`}
                        onClick={() => toggleFilter('color', k)}>
                        <span className="fc_filter_color" style={{ background: k }} />
                        {k}<span className="fc_filter_num"> ({v})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </FilterSection>

              <FilterSection label="PRICE" open={openSections.price} onToggle={() => toggle('price')}
                activeCount={activePrice ? 1 : 0}
                activeLabel={activePrice ? `${activePrice[0]}-${activePrice[1]}` : null}
                priceFilter
                onClear={clearPrice}>
                {facets.price_range?.min_price != null && (
                  <PriceFilter
                    open={openSections.price}
                    priceRange={facets.price_range}
                    sliderRange={facets.slider_price}
                    activePrice={activePrice}
                    onApply={applyPrice}
                    onClear={clearPrice}
                  />
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
                    className={gender === t.value ? 'active' : ''}
                    onClick={() => setParam('gender', t.value)}
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
                onChange={(idx) => {
                  const opt = SORT_OPTIONS[idx];
                  setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    next.set('sortby', opt.sortby);
                    next.set('orderby', opt.orderby);
                    return next;
                  }, { replace: true });
                }}
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

function FilterClearIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" viewBox="0 0 15 15" xmlSpace="preserve">
      <path d="M7.5 1.27c3.42 0 6.2 2.8 6.2 6.23s-2.78 6.23-6.2 6.23-6.2-2.8-6.2-6.23 2.78-6.23 6.2-6.23m0-1C3.52.27.3 3.51.3 7.5s3.23 7.23 7.2 7.23 7.2-3.24 7.2-7.23S11.48.27 7.5.27z" />
      <path d="M4.42 9.66 6.6 7.48 4.44 5.32l.9-.91L7.5 6.59l2.16-2.17.92.92-2.16 2.15 2.16 2.17-.9.91L7.51 8.4l-2.17 2.18-.92-.92z" fill="#010101" />
    </svg>
  );
}

function FilterSection({ label, badge, open, onToggle, activeCount = 0, activeLabel, priceFilter, onClear, children }) {
  const showBrandTotal = badge != null && activeCount === 0;
  const showActive = activeCount > 0;
  const displayActive = activeLabel ?? activeCount;

  return (
    <div className="tec_filter_single_filter_box">
      {showBrandTotal && (
        <div className="tec_filter_single_clear_box faded" style={{ display: 'block' }}>
          <div className="box">
            <p className="txt" id="totalBrandsCount">{badge} TOTAL</p>
            <div className="tec_filter_active_icon" />
          </div>
        </div>
      )}
      {showActive && (
        <div
          className="tec_filter_single_clear_box"
          id={priceFilter ? 'tec_filter_single_clear_box_price' : undefined}
          style={{ display: 'block' }}
        >
          <div className="tec_filter_total_active_box">
            <p
              className="tec_filter_total_active_text"
              id={priceFilter ? 'tec_filter_price_total_active' : undefined}
            >
              {displayActive}
            </p>
            <div className="tec_filter_active_icon" />
          </div>
          <button
            type="button"
            className="tec_filter_cat_clear_link tec_filter_single_clear_icon"
            onClick={e => { e.stopPropagation(); onClear?.(); }}
            aria-label={`Clear ${label} filter`}
          >
            <FilterClearIcon />
          </button>
        </div>
      )}
      <a
        className={`tec_filter_cat_btn btn_primary${open ? ' filter_active' : ''}`}
        onClick={onToggle}
      >
        {label}
        <span className="tec_filter_caret caret" />
      </a>
      <div className={`fc_box${priceFilter ? ' Price' : ''}${open ? ' open_filter' : ''}`} id={priceFilter ? 'filter_Price' : undefined}>
        {children}
      </div>
    </div>
  );
}
