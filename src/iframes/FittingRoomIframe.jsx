import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFittingRoom } from '../context/FittingRoomContext';
import { navigateTo } from '../hooks/useIframeComms';
import IframeHeader from '../components/IframeHeader';
import FittingRoomViewer from '../components/FittingRoomViewer';

export default function FittingRoomIframe() {
  const { isAuthenticated } = useAuth();
  const {
    products, currentModel, userDetail, favorites,
    isLoadingModels, isLoadingMorph,
    loadModels, removeProduct, updateProductColor, toggleTryOn, fetchMorphedImages, isModelsStale,
    loadUserDetail, loadFavorites,
  } = useFittingRoom();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!currentModel || isModelsStale) loadModels();
    loadUserDetail().then((detail) => {
      const memberId = detail?.user?.id;
      if (memberId) loadFavorites(memberId);
    });
  }, [isAuthenticated]);


  if (!isAuthenticated) {
    return (
      <div className="iframe-page fitting-room-page">
        <IframeHeader />
        <div className="fr-auth-wall">
          <p>Please sign in to use the fitting room.</p>
          <button className="btn_primary" onClick={() => navigateTo('models')}>Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="iframe-page fitting-room-page">
      <IframeHeader />

      <div className="fr_page_container">

        {/* ── Left: product thumbnails ── */}
        <div className="fr_products_section">
          <div className="fr_products_header">
            <h1 className="fr_headline_left">
              MY <span className="green">SMART</span> FITTING ROOM
            </h1>
            <a className="fr_continue_shopping" onClick={() => navigateTo('products')}>
              Continue shopping
            </a>
          </div>

          {products.length === 0 ? (
            <div className="fr_empty_state">
              <p>No items in your fitting room.</p>
              <button className="btn_primary" onClick={() => navigateTo('products')}>
                Browse collection
              </button>
            </div>
          ) : (
            <ul id="edit_look_container">
              {products.map((p) => {
                const brand = p.detail?.vendor ?? p.detail?.brand_name ?? '';
                const price = p.detail?.price ?? p.detail?.item_price ?? '';
                const thumb = p.detail?.shopify_image?.src
                  ?? p.detail?.items?.[0]?.image?.low_res
                  ?? p.detail?.items?.[0]?.image
                  ?? p.detail?.image_src
                  ?? p.detail?.image;

                return (
                  <li key={p.v3_product_id} className={`fitting_room_cl_box${p.isTryingOn ? ' activeproduct' : ''}`}>
                    <button
                      className="fitting_room_cl_trash"
                      onClick={() => removeProduct(p.v3_product_id)}
                      title="Remove"
                    >
                      <TrashIcon />
                    </button>
                    <a className="fitting_room_cl_prod_link withoutModel">
                      {thumb
                        ? <img src={thumb} alt={brand} className="tec_product_box_img" loading="lazy" />
                        : <div className="tec_product_box_img tec_product_no_img" />
                      }
                    </a>
                    {/* try-on icon — toggles per-product active state */}
                    <div
                      className={`tec_product_box_msf tec_add_msf${p.isTryingOn ? ' activeproduct' : ''}`}
                      onClick={() => {
                        const activating = !p.isTryingOn;
                        toggleTryOn(p.v3_product_id);
                        if (activating && !p.morphedImage && currentModel) fetchMorphedImages();
                      }}
                      title="Try it on"
                      style={{ cursor: 'pointer' }}
                    >
                      <img src="/assets/try-it-on-green.png" className="fr_product_try_btn fr_product_in_fr" alt="" />
                      <img src="/assets/try-it-on.png"       className="fr_product_try_btn" alt="" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Center: model canvas ── */}
        <div className="fitting_canv_hldr" id="fitting_canv_hldr">
          <a className="change-modal-link" onClick={() => navigateTo('models')}>
            Change<br />Model
          </a>

          {isLoadingModels ? (
            <div className="fr_canvas_loading">
              <div className="spinner" />
            </div>
          ) : !currentModel ? (
            <div className="fr_canvas_loading">
              <p style={{ color: '#aaa', fontSize: 13 }}>No model selected</p>
              <button className="btn_primary" style={{ marginTop: 12 }} onClick={() => navigateTo('models')}>
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

          {/* Action icons */}
          <div className="fr_share_fav_box">
            <div className="fr_change_model_box icon_fitt_room" onClick={() => navigateTo('models')} title="Change model">
              <img src="/assets/try-it-on.png" className="fr_change_model_icon" alt="Change model" />
            </div>
            <div className="fitting_room_icon_box">
              <a className="btn-fav icon_fitt_room" title="Favourite">
                <HeartIcon />
              </a>
              <a className="share_look_link icon_fitt_room" title="Share">
                <ShareIcon />
              </a>
            </div>
          </div>
        </div>

        {/* ── Right: current outfit detail ── */}
        <div className="fr_current_items_container">
          <h3 className="fr_headline fr_headline_right">My Current Outfit</h3>

          {products.filter(p => p.isTryingOn).length === 0 ? (
            <div className="fr_empty_state" style={{ marginTop: 40 }}>
              <p style={{ color: '#aaa', fontSize: 13 }}>Click "Try it on" to see your outfit here.</p>
            </div>
          ) : (
            <div className="fr_outfit_list">
              {products.filter(p => p.isTryingOn).map((p) => {
                const brand = p.detail?.vendor ?? p.detail?.brand_name ?? '';
                const title = p.detail?.title ?? p.detail?.name ?? '';
                const price = p.detail?.price ?? p.detail?.item_price ?? '';

                const selectedItem = p.detail?.items?.find(i => i.color_id === p.selectedColorId)
                  ?? p.detail?.items?.[0];
                const thumb = p.detail?.shopify_image?.src
                  ?? selectedItem?.image?.low_res ?? selectedItem?.image
                  ?? p.detail?.image_src ?? p.detail?.image;

                // Unique colors
                const colors = [];
                const seenColors = new Set();
                for (const item of p.detail?.items ?? []) {
                  if (!seenColors.has(item.color_id)) {
                    seenColors.add(item.color_id);
                    colors.push({ id: item.color_id, name: item.color_name ?? item.color ?? String(item.color_id) });
                  }
                }

                // Sizes for selected color
                const sizes = (p.detail?.items ?? [])
                  .filter(i => i.color_id === p.selectedColorId)
                  .map(i => ({ id: i.item_id ?? i.id, label: i.size_label ?? i.size ?? '' }))
                  .filter(s => s.label);

                const isFav = favorites.includes(p.v3_product_id);

                return (
                  <div key={p.v3_product_id} className="fitting_room_cl_container">
                    <div className="fr_outfit_item">
                      {thumb && (
                        <div className="fr_outfit_thumb">
                          <img src={thumb} alt={brand} className="fr_outfit_thumb_img" />
                        </div>
                      )}
                      <div className="fr_outfit_info">
                        <div className="fr_outfit_header">
                          <div>
                            <p className="fitting_room_cl_brand">{brand}</p>
                            <p className="fitting_room_cl_title">{title}</p>
                            {price && <p className="fitting_room_cl_price">${Math.trunc(parseFloat(price) || 0)}</p>}
                          </div>
                          <button className="fitting_room_cl_trash" onClick={() => removeProduct(p.v3_product_id)} title="Remove">
                            <TrashIcon />
                          </button>
                        </div>

                        {p.detail && (
                          <div className="fr_outfit_selectors">
                            <div className="fr_selector_row">
                              <span className="fr_selector_label">SIZE:</span>
                              <select className="fr_selector_select">
                                <option value="">Select a size</option>
                                {sizes.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                              </select>
                            </div>
                            <div className="fr_selector_row">
                              <span className="fr_selector_label">COLOR:</span>
                              <select
                                className="fr_selector_select"
                                value={p.selectedColorId ?? ''}
                                onChange={e => updateProductColor(p.v3_product_id, Number(e.target.value))}
                              >
                                {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>
                          </div>
                        )}

                        <div className="fr_outfit_actions">
                          <button className="btn_primary fitting_room_add_to_cart_btn">Add to cart</button>
                          <HeartIcon filled={isFav} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {products.some(p => p.isTryingOn) && currentModel && (
                <button
                  className="btn_primary fr_refresh_btn"
                  onClick={fetchMorphedImages}
                  disabled={isLoadingMorph}
                >
                  {isLoadingMorph ? 'Generating…' : '↺ Refresh look'}
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function HeartIcon({ filled = false }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill={filled ? '#e74c3c' : 'none'}
      stroke={filled ? '#e74c3c' : '#aaa'}
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, cursor: 'default' }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
