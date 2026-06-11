import { useFittingRoom } from '../context/FittingRoomContext';

export default function ProductDetail({ product, onClose }) {
  const { updateProductColor, fetchMorphedImages } = useFittingRoom();

  const detail       = product.detail ?? {};
  const title        = detail.title ?? detail.name ?? `Product ${product.v3_product_id}`;
  const colors       = detail.prod_colors ?? detail.items ?? [];
  const sizes        = detail.sizes ?? [];
  const price        = detail.price ?? detail.price_min;
  const selectedColor = product.selectedColorId;

  const handleColorClick = async (colorId) => {
    updateProductColor(product.v3_product_id, colorId);
    await fetchMorphedImages();
  };

  return (
    <div className="product-detail-panel">
      <div className="product-detail-header">
        <h3 className="product-detail-title">{title}</h3>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>

      {/* Main image */}
      {(() => {
        const activeItem = detail.items?.find((i) => i.color_id === selectedColor) ?? detail.items?.[0];
        const img = activeItem?.image?.low_res ?? activeItem?.image ?? detail.image;
        return img ? (
          <div className="product-detail-img-wrap">
            <img src={img} alt={title} />
          </div>
        ) : null;
      })()}

      {price && <p className="product-detail-price">${parseFloat(price).toFixed(2)}</p>}

      {/* Color swatches */}
      {colors.length > 0 && (
        <div className="product-detail-section">
          <div className="product-detail-section-label">Color</div>
          <div className="color-swatches">
            {colors.map((c) => {
              const colorId  = c.color_id ?? c.id;
              const colorHex = c.hex_value ?? c.color_hex ?? c.color ?? '#ccc';
              const isActive = colorId === selectedColor;
              return (
                <button
                  key={colorId}
                  className={`color-swatch ${isActive ? 'active' : ''}`}
                  style={{ background: colorHex }}
                  title={c.color_name ?? c.name ?? colorId}
                  onClick={() => handleColorClick(colorId)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Sizes */}
      {sizes.length > 0 && (
        <div className="product-detail-section">
          <div className="product-detail-section-label">Size</div>
          <div className="size-options">
            {sizes.map((s) => {
              const sizeId    = s.size_id ?? s.id;
              const sizeLabel = s.size_name ?? s.name ?? sizeId;
              const isRec = sizeId === (detail.items?.find((i) => i.color_id === selectedColor)?.recommended_size_id);
              return (
                <span key={sizeId} className={`size-chip ${isRec ? 'recommended' : ''}`}>
                  {sizeLabel}{isRec ? ' ✓' : ''}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
