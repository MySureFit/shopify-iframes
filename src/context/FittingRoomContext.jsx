import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import syncApi from '../api/syncApi';
import coreApi from '../api/coreApi';
import { useAuth } from './AuthContext';

const FittingRoomContext = createContext(null);
const LS_KEY = 'ss_fr';
const LS_FR_USER_ID = 'ss_fr_user_id';
const MODELS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

const DEFAULT = { products: [], currentModel: null, allModels: [], modelsLoadedAt: null };

function readLS() {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(LS_KEY)) }; }
  catch { return DEFAULT; }
}

function writeLS(next) {
  localStorage.setItem(LS_KEY, JSON.stringify(next));
}

// Map integer layer_name (0–9) to CSS z-index
const LAYER_Z = { 0:4,1:5,2:6,3:7,4:8,5:9,6:10,7:11,8:12,9:13 };
export const getLayerZ = (layerName) => LAYER_Z[parseInt(layerName)] ?? 8;

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

  const { products, currentModel, allModels, modelsLoadedAt } = state;
  const [isLoadingModels, setLoadingModels] = useState(false);
  const [isLoadingMorph,  setLoadingMorph]  = useState(false);

  // Load fitting room products from server once per unique token
  useEffect(() => {
    if (!token || loadedForToken.current === token) return;
    loadedForToken.current = token;
    const frUserId = localStorage.getItem(LS_FR_USER_ID) ?? '';
    const load = async () => {
      try {
        const { data } = await syncApi.get(`fitting_room/get_fittingroom_products/${frUserId}`);
        const items = data.products ?? data.data ?? (Array.isArray(data) ? data : []);
        const mapped = items.map(item => ({
          v3_product_id:      item.v3_product_id ?? item.product_id,
          shopify_product_id: item.shopify_product_id,
          detail:             null,
          selectedColorId:    item.color_id ?? null,
          morphedImage:       null,
        }));
        setState(prev => ({ ...prev, products: mapped }));
      } catch (err) {
        console.error('loadFittingRoom:', err);
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
    try {
      const { data } = await syncApi.get(`shopify/product_detail_shopv3/${v3Id}`);
      const detail = data.data ?? data;
      setState((prev) => ({
        ...prev,
        products: [
          ...prev.products,
          { v3_product_id: v3Id, shopify_product_id: shopifyId, detail, selectedColorId: detail.items?.[0]?.color_id ?? null, morphedImage: null },
        ],
      }));
    } catch (err) {
      console.error('addProduct:', err);
    }
  }, [setState]);

  const removeProduct = useCallback((v3Id) => {
    setState((prev) => ({ ...prev, products: prev.products.filter((p) => p.v3_product_id !== v3Id) }));
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
      setState((prev) => ({
        ...prev,
        currentModel: prev.allModels.find((m) => m.id === modelId) ?? null,
        products: prev.products.map((p) => ({ ...p, morphedImage: null })),
      }));
    } catch (err) {
      console.error('selectModel:', err);
    }
  }, [setState]);

  const fetchMorphedImages = useCallback(async () => {
    if (!currentModel || products.length === 0) return;
    setLoadingMorph(true);
    try {
      const { data } = await coreApi.post('get_morph_styles', {
        product_ids: products.map((p) => p.v3_product_id),
        user_id:     currentModel.user_id,
      });
      const results = Array.isArray(data) ? data : data.data ?? [];
      setState((prev) => ({
        ...prev,
        products: prev.products.map((p) => {
          const m = results.find((r) => r.product_id === p.v3_product_id);
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
      isLoadingModels, isLoadingMorph,
      isInFittingRoom, toggleProduct, addProduct, removeProduct,
      updateProductColor, loadModels, selectModel, fetchMorphedImages,
    }}>
      {children}
    </FittingRoomContext.Provider>
  );
}

export const useFittingRoom = () => useContext(FittingRoomContext);
