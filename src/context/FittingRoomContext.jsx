import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import syncApi from '../api/syncApi';
import coreApi from '../api/coreApi';
import { useAuth } from './AuthContext';

const FittingRoomContext = createContext(null);
const LS_KEY = 'ss_fr';
const LS_FR_USER_ID = 'ss_fr_user_id';
const MODELS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

const DEFAULT = { products: [], currentModel: null, allModels: [], modelsLoadedAt: null, userDetail: null, favorites: [] };

function readLS() {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(LS_KEY)) }; }
  catch { return DEFAULT; }
}

function writeLS(next) {
  localStorage.setItem(LS_KEY, JSON.stringify(next));
}

// Map integer layer_name (0–9) to CSS z-index
// default_bottom=2, layers 0-3=4-7, default_top=8 (between 3 and 4), layers 4-9=9-14
const LAYER_Z = { 0:4,1:5,2:6,3:7,4:9,5:10,6:11,7:12,8:13,9:14 };
export const getLayerZ = (layerName) => LAYER_Z[parseInt(layerName)] ?? 9;

// Layers that hide default_bottom when active (bottom, maxi dress, full dress)
export const BOTTOM_HIDES_DEFAULT = new Set([1, 3, 5, 6]);
// Layers that hide default_top when active (basic top, jacket, maxi dress, full dress)
// Outerwear (7,8,9) does NOT hide default_top — it shows underneath the jacket
export const TOP_HIDES_DEFAULT    = new Set([2, 4, 5, 6]);

// Pure bottom/top sets used only to derive the product's target field
const BOTTOM_LAYERS = new Set([1, 3]);
const TOP_LAYERS    = new Set([2, 4, 7, 8, 9]);

// When activating layer X, these other active layers get deactivated (from selfie-bundle.js)
const LAYER_CONFLICTS = {
  3: [5, 6],
  4: [2, 6, 7, 8, 9],
  5: [2, 3, 4, 6, 7, 8, 9],
  6: [3, 4, 5, 7, 8, 9],
  7: [5, 6, 8, 9],
  8: [2, 4, 5, 6, 7, 9],
  9: [5, 6, 7, 8],
};

export function FittingRoomProvider({ children }) {
  const { token } = useAuth();
  const [state, setStateRaw] = useState(readLS);
  const loadedForToken = useRef(null); // guard: only load once per unique token

  // Sync from other iframes via storage events (fires in all frames EXCEPT the one that wrote)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== LS_KEY) return;
      try { setStateRaw({ ...DEFAULT, ...JSON.parse(e.newValue) }); }
      catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setState = useCallback((updater) => {
    setStateRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      writeLS(next);
      return next;
    });
  }, []);

  const { products, currentModel, allModels, modelsLoadedAt, userDetail, favorites } = state;
  const [isLoadingModels,      setLoadingModels]      = useState(false);
  const [isLoadingMorph,       setLoadingMorph]       = useState(false);
  const [productsServerLoaded, setProductsServerLoaded] = useState(false);

  // Load fitting room products from server once per unique token
  useEffect(() => {
    if (!token || loadedForToken.current === token) return;
    loadedForToken.current = token;
    const frUserId = localStorage.getItem(LS_FR_USER_ID) ?? '';
    const load = async () => {
      try {
        const { data } = await coreApi.get('search/filter/products', {
          params: { collection: 'fitting-room', fr_user_id: frUserId },
        });
        const variants = data.data ?? data.products ?? (Array.isArray(data) ? data : []);

        // Group flat variant list by shopify_product_id → one product entry per unique product
        const productMap = {};
        for (const v of variants) {
          const key = v.shopify_product_id;
          if (!productMap[key]) {
            // Extract layer_name from shopify_tags (e.g. "layer_number:3")
            const layerMatch = v.shopify_tags?.match(/layer_number:(\d+)/);
            const layerName  = layerMatch ? parseInt(layerMatch[1]) : null;
            const target     = BOTTOM_LAYERS.has(layerName) ? 'bottom'
                             : TOP_LAYERS.has(layerName)    ? 'top'
                             : '';
            productMap[key] = {
              v3_product_id:      v.product_id,
              z_global_id:        v.product_id,
              shopify_product_id: v.shopify_product_id,
              detail: {
                vendor:     v.shopify_vendor ?? v.brand_name,
                brand_name: v.brand_name,
                title:      v.shopify_title ?? v.product_name,
                price:      v.item_price,
                image_src:  v.image_src,
                layer_name: layerName,
                target,
                items:      [],
              },
              selectedColorId: v.color_id ?? null,
              isTryingOn:      false,
              morphedImage:    null,
            };
          }
          productMap[key].detail.items.push({
            color_id:   v.color_id,
            color_name: v.color_title ?? v.shopify_color_title,
            item_id:    v.item_id,
            size_label: v.size_title ?? v.shopify_size_title,
            size_id:    v.size_id,
            image:      v.image_src,
          });
        }

        const mapped = Object.values(productMap);
        setState(prev => ({ ...prev, products: mapped }));
        setProductsServerLoaded(true);
      } catch (err) {
        console.error('loadFittingRoom:', err);
        setProductsServerLoaded(true);
      }
    };
    load();
  }, [token]);

  const isModelsStale = !modelsLoadedAt || (Date.now() - modelsLoadedAt > MODELS_CACHE_TTL);

  const isInFittingRoom = useCallback(
    (v3Id) => products.some((p) => p.v3_product_id === v3Id),
    [products]
  );

  const addProduct = useCallback(async (v3Id, shopifyId) => {
    const frUserId = localStorage.getItem(LS_FR_USER_ID) ?? '';
    try {
      const [detailRes] = await Promise.all([
        syncApi.get(`shopify/product_detail_shopv3/${v3Id}`),
        syncApi.post('fitting_room/add_product', { product_id: String(v3Id), fr_user_id: frUserId }),
      ]);
      const detail = detailRes.data.data ?? detailRes.data;
      if (detail.layer_name == null) {
        const layerMatch = detail.shopify_tags?.match(/layer_number:(\d+)/);
        detail.layer_name = layerMatch ? parseInt(layerMatch[1]) : null;
      }
      setState((prev) => ({
        ...prev,
        products: [
          ...prev.products,
          { v3_product_id: v3Id, z_global_id: v3Id, shopify_product_id: shopifyId, detail, selectedColorId: detail.items?.[0]?.color_id ?? null, isTryingOn: false, morphedImage: null },
        ],
      }));
    } catch (err) {
      console.error('addProduct:', err);
    }
  }, [setState]);

  // Resolves shopify_product_id → v3_product_id then delegates to addProduct.
  // Used by SS_ADD_PRODUCTS postMessage handler (Chris sends only shopify_product_id).
  const addProductByShopifyId = useCallback(async (shopifyProductId) => {
    try {
      const { data } = await syncApi.get(`shopify/resolve_product?shopify_product_id=${shopifyProductId}`);
      const v3Id = data.v3_product_id;
      if (!v3Id) return;
      await addProduct(v3Id, shopifyProductId);
    } catch (err) {
      if (err?.response?.status === 404) return; // product not yet prepared — silent skip
      console.error('addProductByShopifyId:', err);
    }
  }, [addProduct]);

  const removeProduct = useCallback(async (v3Id) => {
    const frUserId = localStorage.getItem(LS_FR_USER_ID) ?? '';
    setState((prev) => ({ ...prev, products: prev.products.filter((p) => p.v3_product_id !== v3Id) }));
    try {
      await syncApi.post('fitting_room/remove_product', { product_id: String(v3Id), fr_user_id: frUserId });
    } catch (err) {
      console.error('removeProduct:', err);
    }
  }, [setState]);

  const toggleProduct = useCallback((v3Id, shopifyId) => {
    if (products.some((p) => p.v3_product_id === v3Id)) removeProduct(v3Id);
    else addProduct(v3Id, shopifyId);
  }, [products, addProduct, removeProduct]);

  const updateProductColor = useCallback((v3Id, colorId) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.v3_product_id === v3Id ? { ...p, selectedColorId: colorId, morphedImage: null } : p
      ),
    }));
  }, [setState]);

  const toggleTryOn = useCallback((v3Id) => {
    setState((prev) => {
      const clicked = prev.products.find(p => p.v3_product_id === v3Id);
      if (!clicked) return prev;
      const isActivating  = !clicked.isTryingOn;
      const clickedLayer  = clicked.detail?.layer_name;
      const conflictSet   = new Set(isActivating ? (LAYER_CONFLICTS[clickedLayer] ?? []) : []);

      return {
        ...prev,
        products: prev.products.map((p) => {
          if (p.v3_product_id === v3Id) return { ...p, isTryingOn: !p.isTryingOn };
          if (isActivating && p.isTryingOn) {
            // Same-layer slot: only one product per layer at a time
            if (clickedLayer != null && p.detail?.layer_name === clickedLayer) {
              return { ...p, isTryingOn: false };
            }
            // Cross-layer conflict: deactivate products whose layer conflicts with the activated one
            if (conflictSet.has(p.detail?.layer_name)) {
              return { ...p, isTryingOn: false };
            }
          }
          return p;
        }),
      };
    });
  }, [setState]);

  const loadModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const { data } = await syncApi.get('demomodel/list_all_models');
      const models = data.selfie_model ?? data.data ?? [];
      const selected = models.find((m) => m.is_selected) ?? null;
      setState((prev) => ({
        ...prev,
        allModels: models,
        currentModel: selected ?? prev.currentModel,
        modelsLoadedAt: Date.now(),
      }));
      return models;
    } catch (err) {
      console.error('loadModels:', err);
      return [];
    } finally {
      setLoadingModels(false);
    }
  }, [setState]);

  const selectModel = useCallback(async (modelId) => {
    try {
      await syncApi.post('demomodel/save_model', { selected_model_id: modelId });
      // Optimistic local update
      setState((prev) => ({
        ...prev,
        currentModel: prev.allModels.find((m) => m.id === modelId) ?? null,
        allModels: prev.allModels.map((m) => ({ ...m, is_selected: m.id === modelId })),
        modelsLoadedAt: null, // invalidate cache so next view re-fetches
        products: prev.products.map((p) => ({ ...p, isTryingOn: false, morphedImage: null })),
      }));
      // Re-fetch from backend to sync is_selected state
      const { data } = await syncApi.get('demomodel/list_all_models');
      const models = data.selfie_model ?? data.data ?? [];
      const selected = models.find((m) => m.is_selected) ?? null;
      setState((prev) => ({
        ...prev,
        allModels: models,
        currentModel: selected ?? prev.currentModel,
        modelsLoadedAt: Date.now(),
      }));
    } catch (err) {
      console.error('selectModel:', err);
    }
  }, [setState]);

  const loadUserDetail = useCallback(async () => {
    try {
      const { data } = await syncApi.get('user/detail?device=webfr');
      const userDetail = data.data ?? data;
      setState((prev) => ({ ...prev, userDetail }));
      return userDetail;
    } catch (err) {
      console.error('loadUserDetail:', err);
      return null;
    }
  }, [setState]);

  const loadFavorites = useCallback(async (memberId) => {
    if (!memberId) return;
    try {
      const { data } = await syncApi.get(`favourite/get_all_fav_product/${memberId}`);
      const raw = data.data ?? {};
      const favorites = Object.values(raw).map((f) => f.z_global_id ?? f.product_id ?? f.id).filter(Boolean);
      setState((prev) => ({ ...prev, favorites }));
    } catch (err) {
      console.error('loadFavorites:', err);
    }
  }, [setState]);

  const fetchMorphedImages = useCallback(async () => {
    if (!currentModel || products.length === 0) return;
    setLoadingMorph(true);
    try {
      const { data } = await coreApi.post('get_morph_styles', {
        product_ids: products.map((p) => p.z_global_id ?? p.v3_product_id),
        user_id:     currentModel.user_id,
      });
      const results = Array.isArray(data) ? data : data.data ?? [];
      setState((prev) => ({
        ...prev,
        products: prev.products.map((p) => {
          const gid = p.z_global_id ?? p.v3_product_id;
          const m = results.find((r) => String(r.product_id) === String(gid));
          const item = m?.items?.find((i) => i.color_id === p.selectedColorId) ?? m?.items?.[0];
          return { ...p, morphedImage: item?.morphed_image ?? item?.image ?? null };
        }),
      }));
    } catch (err) {
      console.error('fetchMorphedImages:', err);
    } finally {
      setLoadingMorph(false);
    }
  }, [currentModel, products, setState]);

  return (
    <FittingRoomContext.Provider value={{
      products, currentModel, allModels, modelsLoadedAt, isModelsStale,
      isLoadingModels, isLoadingMorph, productsServerLoaded,
      userDetail, favorites,
      isInFittingRoom, toggleProduct, addProduct, addProductByShopifyId, removeProduct,
      updateProductColor, toggleTryOn, loadModels, selectModel, fetchMorphedImages,
      loadUserDetail, loadFavorites,
    }}>
      {children}
    </FittingRoomContext.Provider>
  );
}

export const useFittingRoom = () => useContext(FittingRoomContext);
