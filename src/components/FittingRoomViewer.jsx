import { getLayerZ } from '../context/FittingRoomContext';

// A product targets 'top'/'dress'/'jacket' → hide default top layer
// A product targets 'bottom'/'pants'        → hide default bottom layer
const TOP_TARGETS    = new Set(['top', 'dress', 'jacket', 'blouse', 'shirt']);
const BOTTOM_TARGETS = new Set(['bottom', 'pants', 'skirt', 'shorts', 'jeans']);

export default function FittingRoomViewer({ model, products, isLoading }) {
  const hasTopProduct    = products.some((p) => p.isTryingOn && p.morphedImage && TOP_TARGETS.has(p.detail?.target ?? ''));
  const hasBottomProduct = products.some((p) => p.isTryingOn && p.morphedImage && BOTTOM_TARGETS.has(p.detail?.target ?? ''));

  if (!model) {
    return (
      <div className="viewer-empty">
        <div className="viewer-empty-icon">👗</div>
        <p>Select a model to start trying on clothes</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
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

        {/* Layer 2 — default bottom (hidden when a bottom product is selected) */}
        {!hasBottomProduct && model.default_bottom && (
          <img
            src={model.default_bottom}
            alt=""
            className="layer"
            style={{ zIndex: 2 }}
          />
        )}

        {/* Layer 3 — default top (hidden when a top/dress product is selected) */}
        {!hasTopProduct && model.default_top && (
          <img
            src={model.default_top}
            alt=""
            className="layer"
            style={{ zIndex: 3 }}
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
