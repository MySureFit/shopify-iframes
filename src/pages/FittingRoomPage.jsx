import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFittingRoom } from '../context/FittingRoomContext';
import FittingRoomViewer from '../components/FittingRoomViewer';
import DemoModelModal from '../components/DemoModelModal';

export default function FittingRoomPage() {
  const {
    products, currentModel,
    isLoadingModels, isLoadingMorph,
    loadModels, removeProduct, fetchMorphedImages,
  } = useFittingRoom();

  const [showModelModal, setShowModelModal] = useState(false);

  // Load models on first visit if not yet loaded
  useEffect(() => {
    if (!currentModel) loadModels();
  }, []);

  // Auto-fetch morphed images whenever products or model change
  useEffect(() => {
    if (currentModel && products.length > 0) fetchMorphedImages();
  }, [currentModel, products.length]);

  const modelLabel = (model) => {
    if (!model) return 'None selected';
    const gender = model.gender === 'f' ? 'Female' : model.gender === 'm' ? 'Male' : 'My Model';
    return `${gender}${model.height ? ` · ${model.height}cm` : ''}`;
  };

  return (
    <div className="page">
      <div className="fitting-room-layout">

        {/* ── Left: viewer ── */}
        <div className="fr-viewer-card">
          <div className="fr-viewer-title">
            <span>Fitting Room</span>
            <button className="btn-change-model" onClick={() => setShowModelModal(true)}>
              Change Model
            </button>
          </div>

          {isLoadingModels ? (
            <div className="viewer-empty">
              <div className="spinner" />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 12 }}>Loading models…</p>
            </div>
          ) : (
            <FittingRoomViewer
              model={currentModel}
              products={products}
              isLoading={isLoadingMorph}
            />
          )}

          {!currentModel && !isLoadingModels && (
            <button
              className="btn-change-model"
              style={{ fontSize: 14, padding: '10px 24px' }}
              onClick={() => setShowModelModal(true)}
            >
              Select a Model
            </button>
          )}
        </div>

        {/* ── Right: sidebar ── */}
        <div className="fr-sidebar">

          {/* Current model */}
          <div className="fr-sidebar-section">
            <div className="fr-sidebar-heading">Model</div>
            {currentModel ? (
              <>
                <div className="current-model-card">
                  {currentModel.image_no_cloths && (
                    <img
                      src={currentModel.image_no_cloths}
                      alt="Current model"
                      className="current-model-thumb"
                    />
                  )}
                  <div className="current-model-info">
                    <div className="current-model-name">{modelLabel(currentModel)}</div>
                    <div className="current-model-meta">Demo model #{currentModel.id}</div>
                  </div>
                </div>
                <button className="btn-select-model" onClick={() => setShowModelModal(true)}>
                  Change model
                </button>
              </>
            ) : (
              <div className="fr-empty-state">
                No model selected.
                <br />
                <button
                  className="btn-select-model"
                  style={{ marginTop: 8 }}
                  onClick={() => setShowModelModal(true)}
                >
                  Select a model
                </button>
              </div>
            )}
          </div>

          {/* Selected products */}
          <div className="fr-sidebar-section">
            <div className="fr-sidebar-heading">
              Selected Items {products.length > 0 && `(${products.length})`}
            </div>

            {products.length === 0 ? (
              <div className="fr-empty-state">
                No items added yet.
                <br />
                <Link to="/" style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 600 }}>
                  Browse collection →
                </Link>
              </div>
            ) : (
              <div className="fr-product-list">
                {products.map((p) => {
                  const title = p.detail?.title ?? p.detail?.name ?? `Product ${p.v3_product_id}`;
                  const thumb = p.detail?.items?.[0]?.image?.low_res
                    ?? p.detail?.items?.[0]?.image
                    ?? p.detail?.image;
                  return (
                    <div key={p.v3_product_id} className="fr-product-item">
                      {thumb && <img src={thumb} alt={title} className="fr-product-thumb" />}
                      <span className="fr-product-name">{title}</span>
                      <button
                        className="fr-remove-btn"
                        onClick={() => removeProduct(p.v3_product_id)}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Try on button */}
          {products.length > 0 && currentModel && (
            <button
              className="btn-try-on"
              onClick={fetchMorphedImages}
              disabled={isLoadingMorph}
            >
              {isLoadingMorph ? 'Generating…' : 'Try On'}
            </button>
          )}
        </div>
      </div>

      {showModelModal && <DemoModelModal onClose={() => setShowModelModal(false)} />}
    </div>
  );
}
