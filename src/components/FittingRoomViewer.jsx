import { getLayerZ, TOP_HIDES_DEFAULT, BOTTOM_HIDES_DEFAULT } from '../context/FittingRoomContext';

export default function FittingRoomViewer({ model, products, isLoading }) {
  const hasTopProduct    = products.some((p) => p.isTryingOn && p.morphedImage && TOP_HIDES_DEFAULT.has(p.detail?.layer_name));
  const hasBottomProduct = products.some((p) => p.isTryingOn && p.morphedImage && BOTTOM_HIDES_DEFAULT.has(p.detail?.layer_name));

  // Show a small corner badge while any morph is in-flight — no canvas overlay so the model never disappears
  const showLoadingBadge = isLoading || products.some((p) => p.isTryingOn && !p.morphedImage);

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

      {/* Small corner badge — morph in-flight; model + existing layers stay fully visible */}
      {showLoadingBadge && (
        <div className="viewer-loading-badge">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}
