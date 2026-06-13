import { getLayerZ } from '../context/FittingRoomContext';

// Theme layer classification: layers 1,3 = bottom; 2,4-9 = top
const BOTTOM_LAYERS = new Set([1, 3]);
const TOP_LAYERS    = new Set([2, 4, 5, 6, 7, 8, 9]);

export default function FittingRoomViewer({ model, products, isLoading }) {
  const hasTopProduct    = products.some((p) => p.isTryingOn && p.morphedImage && TOP_LAYERS.has(p.detail?.layer_name));
  const hasBottomProduct = products.some((p) => p.isTryingOn && p.morphedImage && BOTTOM_LAYERS.has(p.detail?.layer_name));

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

        {/* default_bottom — behind all product layers (z:2) */}
        {!hasBottomProduct && model.default_bottom && (
          <img
            src={model.default_bottom}
            alt=""
            className="layer"
            style={{ zIndex: 2 }}
          />
        )}

        {/* default_top — sits between layer 3 (z:7) and layer 4 (z:9), matching theme stacking */}
        {!hasTopProduct && model.default_top && (
          <img
            src={model.default_top}
            alt=""
            className="layer"
            style={{ zIndex: 8 }}
          />
        )}

        {/* Layers 4–13 — morphed product images for active (isTryingOn) products */}
        {products.map((p) =>
          p.isTryingOn && p.morphedImage ? (
            <img
              key={p.v3_product_id}
              src={p.morphedImage}
              alt={p.detail?.title ?? ''}
              className="layer"
              style={{ zIndex: getLayerZ(p.detail?.layer_name) }}
            />
          ) : null
        )}
      </div>

      {/* Loading overlay while morph is fetching */}
      {isLoading && (
        <div className="viewer-loader">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}
