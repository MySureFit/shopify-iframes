import { useState, useCallback } from 'react';
import { getLayerZ, TOP_HIDES_DEFAULT, BOTTOM_HIDES_DEFAULT } from '../context/FittingRoomContext';

export default function FittingRoomViewer({ model, products, isLoading }) {
  // Track which morph images have actually finished loading in the browser.
  // Keyed by `${v3_product_id}-${morphedImage}` so a URL change resets the state.
  const [loadedKeys, setLoadedKeys] = useState({});

  const handleLoad = useCallback((key) => {
    setLoadedKeys((prev) => ({ ...prev, [key]: true }));
  }, []);

  const handleError = useCallback((key) => {
    setLoadedKeys((prev) => ({ ...prev, [key]: false }));
  }, []);

  const isMorphReady = (p) => {
    if (!p.isTryingOn || !p.morphedImage) return false;
    return loadedKeys[`${p.v3_product_id}-${p.morphedImage}`] === true;
  };

  // Only hide default clothing once the replacing morph image is confirmed loaded
  const hasTopProduct    = products.some((p) => isMorphReady(p) && TOP_HIDES_DEFAULT.has(p.detail?.layer_name));
  const hasBottomProduct = products.some((p) => isMorphReady(p) && BOTTOM_HIDES_DEFAULT.has(p.detail?.layer_name));

  // Show loading overlay while any active product's morph is in-flight or loading
  const showLoading = isLoading || products.some((p) => p.isTryingOn && !isMorphReady(p));

  if (!model) {
    return (
      <div className="viewer-empty">
        <div className="viewer-empty-icon">👗</div>
        <p>Select a model to start trying on clothes</p>
      </div>
    );
  }

  return (
    <div className="viewer-wrap">
      <div className="viewer-canvas">
        {/* Layer 1 — naked model base */}
        {model.image_no_cloths && (
          <img
            src={model.image_no_cloths}
            alt="Model"
            className="layer"
            style={{ zIndex: 1 }}
          />
        )}

        {/* default_bottom — hidden only once its replacement is loaded */}
        {!hasBottomProduct && model.default_bottom && (
          <img
            src={model.default_bottom}
            alt=""
            className="layer"
            style={{ zIndex: 2 }}
          />
        )}

        {/* default_top — hidden only once its replacement is loaded */}
        {!hasTopProduct && model.default_top && (
          <img
            src={model.default_top}
            alt=""
            className="layer"
            style={{ zIndex: 8 }}
          />
        )}

        {/* Morphed product layers — rendered but invisible until onLoad fires */}
        {products.map((p) => {
          if (!p.isTryingOn || !p.morphedImage) return null;
          const key = `${p.v3_product_id}-${p.morphedImage}`;
          const ready = loadedKeys[key] === true;
          return (
            <img
              key={key}
              src={p.morphedImage}
              alt={p.detail?.title ?? ''}
              className="layer"
              style={{ zIndex: getLayerZ(p.detail?.layer_name), opacity: ready ? 1 : 0 }}
              onLoad={() => handleLoad(key)}
              onError={() => handleError(key)}
            />
          );
        })}
      </div>

      {/* Loading overlay — covers canvas while morph images are in-flight or loading */}
      {showLoading && (
        <div className="viewer-loading-overlay">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}
