import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFittingRoom } from '../context/FittingRoomContext';
import { navigateTo } from '../hooks/useIframeComms';
import IframeHeader from '../components/IframeHeader';
import syncApi from '../api/syncApi';

function InlineLogin() {
  const { login, loading, error } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="iframe-page select-model-page">
      <IframeHeader />
      <div className="iframe-auth-wall">
        <div className="iframe-auth-card">
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Sign in</h2>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
            Sign in to access the fitting room
          </p>
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function UploadPhotoBanner({ onClick }) {
  return (
    <div className="see-it-on-you">
      <div className="upload-photo-box text-center" onClick={onClick}>
        <div className="inner-photo-box">
          <h3>Upload Your Photo</h3>
        </div>
      </div>
    </div>
  );
}

function UploadModelCard({ onClick }) {
  return (
    <div className="dm_selection_box dm_cta_box" onClick={onClick}>
      <img
        src="/assets/demo-model-blank_large.jpg"
        className="img100 dm_cta_img"
        alt=""
      />
      <button type="button" className="btn_primary dm_cta_btn" onClick={(e) => { e.stopPropagation(); onClick(); }}>
        Upload Your Photo
      </button>
      <p className="dm_selection_label">See it on you</p>
    </div>
  );
}

function DemoModelCard({ model, isSelected, onSelect }) {
  const img = model.image?.web_res ?? model.image_no_cloths ?? model.image;
  const showClothes = Number(model.id) > 100;

  return (
    <div
      className={`dm_selection_box${isSelected ? ' dm_Selected' : ''}`}
      onClick={() => !isSelected && onSelect(model.id)}
    >
      {img && (
        <img
          src={img}
          className={`dm_selection_img${isSelected ? ' dm_Selected' : ''}`}
          alt=""
        />
      )}
      {isSelected && <p className="dm_selection_label">Current model</p>}
      {showClothes && model.default_bottom && (
        <img src={model.default_bottom} className="dm_default_clothes_img dm_selection_img" alt="" />
      )}
      {showClothes && model.default_top && (
        <img src={model.default_top} className="dm_default_clothes_img dm_selection_img" alt="" />
      )}
    </div>
  );
}

export default function ModelsIframe() {
  const { isAuthenticated } = useAuth();
  const { allModels, currentModel, isLoadingModels, loadModels, selectModel } = useFittingRoom();
  const [calibrated, setCalibrated] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (allModels.length === 0) loadModels();
    checkCalibration();
  }, [isAuthenticated]);

  const checkCalibration = async () => {
    try {
      const { data } = await syncApi.get('user/selfie');
      setCalibrated(data.user_calibrated ?? 0);
    } catch {
      setCalibrated(0);
    }
  };

  const handleSelectModel = async (modelId) => {
    await selectModel(modelId);
    navigateTo('fitting-room');
  };

  const handleUploadPhoto = () => navigateTo('activation');

  if (!isAuthenticated) return <InlineLogin />;

  const showUpload = calibrated !== 1;
  const sortedModels = [...allModels].sort((a, b) => {
    if (a.is_selected) return -1;
    if (b.is_selected) return 1;
    return 0;
  });

  return (
    <div className="iframe-page select-model-page">
      <IframeHeader />
      <div id="select_model_contents">
        <div className="demo_model_select_modal">
          <div className="modal-body">
            <div className="demo-modal-top text-center">
              {showUpload && <UploadPhotoBanner onClick={handleUploadPhoto} />}
              <h5>Choose your model</h5>
            </div>

            <div id="dm_selection_main_container">
              {isLoadingModels ? (
                <div className="loading-screen"><div className="spinner" /></div>
              ) : (
                <div id="dm_selection_container" className="list">
                  {showUpload && <UploadModelCard onClick={handleUploadPhoto} />}
                  {sortedModels.map((model) => (
                    <DemoModelCard
                      key={model.id}
                      model={model}
                      isSelected={currentModel?.id === model.id || model.is_selected}
                      onSelect={handleSelectModel}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
