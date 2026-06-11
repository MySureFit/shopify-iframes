import { useFittingRoom } from '../context/FittingRoomContext';

export default function ProductCard({ product }) {
  const { isInFittingRoom, toggleProduct } = useFittingRoom();
  const id       = product.product_id;
  const shopifyId = product.shopify_product_id;
  const brand    = product.shopify_vendor ?? product.brand_name ?? '';
  const price    = product.item_price ?? product.shopify_variant_price ?? product.price ?? '';
  const image    = product.image_src ?? product.image?.low_res ?? (typeof product.image === 'string' ? product.image : null);
  const title    = product.shopify_title ?? '';
  const added    = isInFittingRoom(id);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleProduct(id, shopifyId);
  };

  return (
    <div className={`tec_product_box withoutModel${added ? ' activeproduct' : ''}`}>
      <a href="javascript:void(0);" className="fitting_room_cl_prod_link withoutModel">
        <p className="fitting_room_cl_brand_new">{brand}</p>
        <p className="tec_price_text">${Math.trunc(parseFloat(price) || 0)}</p>
        {image
          ? <img src={image} alt={title} className="tec_product_box_img" loading="lazy" />
          : <div className="tec_product_box_img tec_product_no_img" />
        }
      </a>
      <div className="tt_add_to_fr_launcher" />
      <button
        type="button"
        className={`tec_product_box_msf tec_add_msf${added ? ' activeproduct' : ''}`}
        onClick={handleToggle}
        title={added ? 'Remove from Smart Fitting Room' : 'Add to Smart Fitting Room'}
      >
        <img src="/try-on-green.png" className="fr_product_try_btn fr_product_in_fr" alt="" />
        <img src="/try-on-black.png" className="fr_product_try_btn" alt="Add to fitting room" />
      </button>
    </div>
  );
}
