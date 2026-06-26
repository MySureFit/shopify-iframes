import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFittingRoom } from '../context/FittingRoomContext';
import { navigateTo, useParentMessages } from '../hooks/useIframeComms';
import useMobileMode from '../hooks/useMobileMode';
import IframeHeader from '../components/IframeHeader';
import FittingRoomViewer from '../components/FittingRoomViewer';

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function CaretIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
    </svg>
  );
}

function FittingRoomProductCard({ product, onRemove, onToggleTryOn, onFetchMorph, currentModel }) {
  const thumb = product.detail?.shopify_image?.src
    ?? product.detail?.items?.[0]?.image?.low_res
    ?? product.detail?.items?.[0]?.image
    ?? product.detail?.image_src
    ?? product.detail?.image;

  const handleTryOn = () => {
    const activating = !product.isTryingOn;
    onToggleTryOn(product.v3_product_id);
    if (activating && !product.morphedImage && currentModel) onFetchMorph();
  };

  return (
    <div
      className={`tec_product_box withModel${product.isTryingOn ? ' activeproduct' : ''}`}
      id={`tec_product_box_${product.v3_product_id}`}
    >
      <button
        type="button"
        className="tec_fr_rem_btn"
        onClick={() => onRemove(product.v3_product_id)}
        title="Remove"
      >
        <TrashIcon />
      </button>
      <a
        href="#"
        className={`hanger${product.isTryingOn ? ' activeproduct' : ''}`}
        onClick={(e) => { e.preventDefault(); handleTryOn(); }}
      />
      <a href="#" onClick={(e) => e.preventDefault()}>
        {thumb
          ? <img src={thumb} alt="" className="tec_product_box_img" loading="lazy" />
          : <div className="tec_product_box_img tec_product_no_img" />
        }
      </a>
      <button
        type="button"
        className="tec_product_in_fr tec_product_box_msf tec_add_msf"
        onClick={handleTryOn}
        title="Try it on"
      >
        <img src="/assets/try-it-on-green.png" className="fr_product_try_btn fr_product_in_fr" alt="" />
        <img src="/assets/try-it-on.png" className="fr_product_try_btn" alt="" />
      </button>
    </div>
  );
}

function OutfitItem({ product, onRemove, onColorChange }) {
  const brand = product.detail?.vendor ?? product.detail?.brand_name ?? '';
  const title = product.detail?.title ?? product.detail?.name ?? '';
  const price = product.detail?.price ?? product.detail?.item_price ?? '';

  const selectedItem = product.detail?.items?.find(i => i.color_id === product.selectedColorId)
    ?? product.detail?.items?.[0];
  const thumb = product.detail?.shopify_image?.src
    ?? selectedItem?.image?.low_res ?? selectedItem?.image
    ?? product.detail?.image_src ?? product.detail?.image;

  const colors = [];
  const seenColors = new Set();
  for (const item of product.detail?.items ?? []) {
    if (!seenColors.has(item.color_id)) {
      seenColors.add(item.color_id);
      colors.push({ id: item.color_id, name: item.color_name ?? item.color ?? String(item.color_id) });
    }
  }

  const sizes = (product.detail?.items ?? [])
    .filter(i => i.color_id === product.selectedColorId)
    .map(i => ({ id: i.item_id ?? i.id, label: i.size_label ?? i.size ?? '' }))
    .filter(s => s.label);

  return (
    <div className="fitting_room_cl_container">
      <div className="fitting_room_cl_image_box product_img">
        {thumb && <img src={thumb} alt={brand} />}
      </div>
      <div className="fitting_room_cl_price_box">
        <button
          type="button"
          className="fitting_room_cl_trash fitting_room_cl_take_off_btn"
          onClick={() => onRemove(product.v3_product_id)}
          title="Remove"
        >
          <TrashIcon />
        </button>

        <p className="fitting_room_cl_brand">{brand}</p>
        <p className="fitting_room_cl_title">{title}</p>
        <p className="fitting_room_cl_price">
          $<span>{Math.trunc(parseFloat(price) || 0)}</span>
        </p>

        {product.detail && (
          <div className="fr_size_dropdown_container fr_cl_member">
            <div className="fr_selector_col">
              <label>SIZE:</label>
              <div className="fr_dropdown">
                <select className="fr_dropdown_native" defaultValue="">
                  <option value="">Select a size</option>
                  {sizes.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="fr_selector_col">
              <label>COLOR:</label>
              <div className="fr_dropdown fr_dropdown_color">
                <select
                  className="fr_dropdown_native"
                  value={product.selectedColorId ?? ''}
                  onChange={e => onColorChange(product.v3_product_id, Number(e.target.value))}
                >
                  {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        <a href="#" onClick={(e) => e.preventDefault()} className="fitting_room_cl_prod_link">
          Product details
          <CaretIcon />
        </a>

        <div className="fitting_room_cl_add_cart_box">
          <button type="button" className="fitting_room_add_to_cart_btn" disabled>
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FittingRoomIframe() {
  const { isAuthenticated, setExternalSession } = useAuth();
  const {
    products, currentModel,
    isLoadingModels, isLoadingMorph,
    loadModels, removeProduct, updateProductColor, toggleTryOn, fetchMorphedImages, isModelsStale,
    loadUserDetail, loadFavorites, addProductByShopifyId, isInFittingRoom,
  } = useFittingRoom();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!currentModel || isModelsStale) loadModels();
    loadUserDetail().then((detail) => {
      const memberId = detail?.user?.id;
      if (memberId) loadFavorites(memberId);
    });
  }, [isAuthenticated]);

  // Pre-fetch morphed images for all fitting-room products as soon as model + products are ready.
  // Mirrors the legacy theme's per-layer pre-loader (lyr_prod_loader_N) — images are ready
  // before the user clicks try-on, so toggling is instant with no nude flash.
  useEffect(() => {
    if (!currentModel || products.length === 0 || isLoadingMorph) return;
    if (!products.some((p) => !p.morphedImage)) return; // all already fetched
    fetchMorphedImages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModel?.id, products.length]);

  // Accept products from the merchant's native Shopify pages via postMessage.
  // Chris sends only shopify_product_id — we resolve to v3_product_id internally.
  useParentMessages({
    SS_AUTH: ({ auth_token, fr_user_id }) => {
      setExternalSession(auth_token, fr_user_id);
    },
    SS_ADD_PRODUCTS: ({ products: incoming = [] }) => {
      if (!isAuthenticated) return;
      for (const { shopify_product_id } of incoming) {
        const alreadyIn = products.some((p) => String(p.shopify_product_id) === String(shopify_product_id));
        if (!alreadyIn) addProductByShopifyId(shopify_product_id);
      }
    },
    SS_REMOVE_PRODUCTS: ({ products: incoming = [] }) => {
      if (!isAuthenticated) return;
      for (const { shopify_product_id } of incoming) {
        const match = products.find((p) => String(p.shopify_product_id) === String(shopify_product_id));
        if (match) removeProduct(match.v3_product_id);
      }
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="iframe-page fitting-room-page collection_fitting-room">
        <IframeHeader hideFrLabel />
        <div className="fr-auth-wall">
          <p>Please sign in to use the fitting room.</p>
          <button className="btn_primary" type="button" onClick={() => navigateTo('models')}>Sign In</button>
        </div>
      </div>
    );
  }

  const tryingOnProducts = products.filter(p => p.isTryingOn);
  const mobileMode = useMobileMode();

  return (
    <div className={`iframe-page fitting-room-page collection_fitting-room${mobileMode ? ' mobile_mode' : ''}`}>
      <IframeHeader hideFrLabel />

      <div className="fr_main_container fitting_room_main_container">
        <div className="fr_fitting_room_header">
          <h1 className="fr_fitting_room_h1">
            <span className="green">Smart</span>
            {' '}Fitting Room
            <a
              href="#"
              className="fr_fitting_room_h1_link fr_collection_h1_link"
              onClick={(e) => { e.preventDefault(); navigateTo('products'); }}
            >
              Continue shopping
            </a>
          </h1>
        </div>

        <div className="fr_product_grid_container">
          <h3 className="fr_headline fr_headline_left">
            My <span className="green">Smart</span> Fitting Room
            <a
              href="#"
              className="fr_fitting_room_h1_link"
              onClick={(e) => { e.preventDefault(); navigateTo('products'); }}
            >
              Continue shopping
            </a>
          </h3>

          {products.length === 0 ? (
            <div className="fr_empty_state">
              <p>No items in your fitting room.</p>
              <button className="btn_primary" type="button" onClick={() => navigateTo('products')}>
                Browse collection
              </button>
            </div>
          ) : (
            <div className="tec_product_grid_box" id="tec_product_grid_box">
              {products.map((p) => (
                <FittingRoomProductCard
                  key={p.v3_product_id}
                  product={p}
                  onRemove={removeProduct}
                  onToggleTryOn={toggleTryOn}
                  onFetchMorph={fetchMorphedImages}
                  currentModel={currentModel}
                />
              ))}
            </div>
          )}
        </div>

        <div className="fr_canvas_container">
          <a
            href="#"
            className="change-modal-link open_model_modal_btn"
            onClick={(e) => { e.preventDefault(); navigateTo('models'); }}
          >
            Change<br />Model
          </a>

          <div className="fitting_canv_hldr" id="fitting_canv_hldr">
            {isLoadingModels ? (
              <div className="fr_canvas_loading">
                <div className="spinner" />
              </div>
            ) : !currentModel ? (
              <div className="fr_canvas_loading">
                <p>No model selected</p>
                <button className="btn_primary" type="button" onClick={() => navigateTo('models')}>
                  Select Model
                </button>
              </div>
            ) : (
              <FittingRoomViewer
                model={currentModel}
                products={products}
                isLoading={isLoadingMorph}
              />
            )}

            <div className="fr_share_fav_box">
              <div className="fr_change_model_box icon_fitt_room open_model_modal_btn" onClick={() => navigateTo('models')} title="Change model">
                <img src="/assets/change_moda_new.svg" className="fr_change_model_icon" alt="" />
              </div>
              <div className="fitting_room_icon_box">
                <a href="#" onClick={(e) => e.preventDefault()} className="btn-fav icon_fitt_room" title="Favourite">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </a>
                <a href="#" onClick={(e) => e.preventDefault()} className="share_look_link icon_fitt_room" title="Share">
                  <img src="/assets/share-dark.svg" className="fr_share_icon" alt="" />
                </a>
              </div>
              <div className="fr_add_to_cart_box">
                <button type="button" className="btn_primary fr_add_to_cart_btn" title="Add outfit to cart">
                  <img src="/assets/cart-plus.svg" className="add_to_cart_icon" alt="" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="fr_current_items_container" id="fitting_room_right_sidebar_box">
          <h3 className="fr_headline fr_headline_left">My Current Outfit</h3>

          <div className="fitting_room_right_sidebar">
            {tryingOnProducts.length === 0 ? (
              <div className="fr_empty_state">
                <p>Click try-on to see your outfit here.</p>
              </div>
            ) : (
              <div id="edit_look_main_container">
                <ul id="edit_look_container" className="list">
                  {tryingOnProducts.map((p) => (
                    <li key={p.v3_product_id} className="fitting_room_cl_box look_list">
                      <OutfitItem
                        product={p}
                        onRemove={removeProduct}
                        onColorChange={updateProductColor}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
