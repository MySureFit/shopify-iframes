import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFittingRoom } from '../context/FittingRoomContext';
import { navigateTo, closeOverlay } from '../hooks/useIframeComms';
import FittingRoomViewer from '../components/FittingRoomViewer';
import ProductDetail from '../components/ProductDetail';

export default function FittingRoomIframe() {
  const { isAuthenticated } = useAuth();
  const {
    products, currentModel,
    isLoadingModels, isLoadingMorph,
    loadModels, removeProduct, fetchMorphedImages,
  } = useFittingRoom();

  const [selectedProduct, setSelectedProduct] = useState(null);

  // Load models if not yet loaded
  useEffect(() => {
    if (isAuthenticated && !currentModel) loadModels();
  }, [isAuthenticated]);

  // Fetch morphed images whenever products or model change
  useEffect(() => {
    if (currentModel && products.length > 0) fetchMorphedImages();
  }, [currentModel?.id, products.length]);

  if (!isAuthenticated) {
    return (
      <div className="iframe-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <p style={{ fontSize: 16, marginBottom: 16 }}>Please sign in to use the fitting room.</p>
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 28px' }}
            onClick={() => navigateTo('models')}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="iframe-page iframe-fr">
      {/* Top bar */}
      <div className="fr-topbar">
        <button className="btn-icon-back" onClick={closeOverlay} title="Close">✕</button>
        <span className="fr-topbar-title">Fitting Room</span>
        <button className="btn-text-sm" onClick={() => navigateTo('products')}>+ Add items</button>
      </div>

      <div className="fr-body">
        {/* ── Viewer (left) ── */}
        <div className="fr-viewer-area">
          {isLoadingModels ? (
            <div className="viewer-empty">
              <div className="spinner" />&nbsp;
            </div>
          ) : !currentModel ? (
            <div className="viewer-empty">
              <div className="viewer-empty-icon">👗</div>
              <p>No model selected</p>
              <button className="btn-change-model" style={{ marginTop: 12 }}
                onClick={() => navigateTo('models')}>
                Select Model
              </button>
            </div>
          ) : (
            // FittingRoomViewer — clicking the model image opens model selection
            <div
              onClick={() => { if (!isLoadingMorph) navigateTo('models'); }}
              style={{ cursor: 'pointer' }}
              title="Click to change model"
            >
              <FittingRoomViewer
                model={currentModel}
                products={products}
                isLoading={isLoadingMorph}
              />
            </div>
          )}

          {/* "Change model" hint below viewer */}
          {currentModel && (
            <button className="btn-text-sm" style={{ marginTop: 10 }}
              onClick={() => navigateTo('models')}>
              Change model
            </button>
          )}
        </div>

        {/* ── Sidebar (right) ── */}
        <div className="fr-sidebar-area">
          {products.length === 0 ? (
            <div className="fr-empty-state" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🪝</div>
              <p>No items selected</p>
              <button className="btn-select-model" style={{ marginTop: 12 }}
                onClick={() => navigateTo('products')}>
                Browse collection
              </button>
            </div>
          ) : (
            <div className="fr-product-list">
              {products.map((p) => {
                const title = p.detail?.title ?? p.detail?.name ?? `Item ${p.v3_product_id}`;
                const thumb = p.detail?.items?.[0]?.image?.low_res
                  ?? p.detail?.items?.[0]?.image
                  ?? p.detail?.image;

                return (
                  <div
                    key={p.v3_product_id}
                    className={`fr-product-item clickable ${selectedProduct?.v3_product_id === p.v3_product_id ? 'selected' : ''}`}
                    onClick={() => setSelectedProduct(
                      selectedProduct?.v3_product_id === p.v3_product_id ? null : p
                    )}
                  >
                    {thumb && <img src={thumb} alt={title} className="fr-product-thumb" />}
                    <span className="fr-product-name">{title}</span>
                    <button
                      className="fr-remove-btn"
                      onClick={(e) => { e.stopPropagation(); removeProduct(p.v3_product_id); }}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Refresh morph button */}
          {products.length > 0 && currentModel && (
            <button
              className="btn-try-on"
              style={{ marginTop: 16 }}
              onClick={fetchMorphedImages}
              disabled={isLoadingMorph}
            >
              {isLoadingMorph ? 'Generating…' : '↺ Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Product detail panel — slides in when a product is clicked */}
      {selectedProduct && (
        <div className="product-detail-overlay">
          <ProductDetail
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        </div>
      )}
    </div>
  );
}
