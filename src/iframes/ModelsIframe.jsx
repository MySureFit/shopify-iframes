import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFittingRoom } from '../context/FittingRoomContext';
import { navigateTo, closeOverlay } from '../hooks/useIframeComms';
import syncApi from '../api/syncApi';

// Inline login form used when the user is not authenticated
function InlineLogin() {
  const { login, loading, error } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
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
  );
}

export default function ModelsIframe() {
  const { isAuthenticated } = useAuth();
  const { allModels, currentModel, isLoadingModels, loadModels, selectModel } = useFittingRoom();
  const [calibrated, setCalibrated] = useState(null); // null=unknown, 0=no, 1=yes

  // Load models and check calibration once authenticated
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

  const handleUploadPhoto = () => {
    if (calibrated === 1) {
      // Already calibrated — navigate to re-upload / activation
      navigateTo('activation');
    } else {
      // Not calibrated — navigate to activation flow
      navigateTo('activation');
    }
  };

  // Not logged in → show inline login
  if (!isAuthenticated) return <InlineLogin />;

  const genderLabel = (m) => {
    if (!m.gender) return 'My Model';
    return m.gender === 'f' ? 'Female' : 'Male';
  };

  return (
    <div className="iframe-page">
      {/* Header */}
      <div className="iframe-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-icon-back" onClick={closeOverlay} title="Close">✕</button>
          <h1 className="iframe-title">Select Model</h1>
        </div>

        {/* Continue with current model shortcut */}
        {currentModel && (
          <button
            className="btn-continue"
            onClick={() => navigateTo('fitting-room')}
          >
            Continue →
          </button>
        )}
      </div>

      <div className="iframe-scroll">
        {/* Upload Your Photo CTA */}
        <div className="upload-photo-card" onClick={handleUploadPhoto}>
          <div className="upload-photo-icon">📸</div>
          <div>
            <div className="upload-photo-title">Upload Your Photo</div>
            <div className="upload-photo-sub">
              {calibrated === 1
                ? 'Re-upload for a more accurate fit'
                : 'Get a personalised try-on experience'}
            </div>
          </div>
          <div className="upload-photo-arrow">›</div>
        </div>

        {/* Divider */}
        <div className="models-divider">
          <span>or choose a model</span>
        </div>

        {/* Model grid */}
        {isLoadingModels ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : allModels.length === 0 ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: 32 }}>No models available.</p>
        ) : (
          <div className="model-grid model-grid-full">
            {allModels.map((model) => {
              const isSelected = currentModel?.id === model.id;
              const img = model.image_no_cloths ?? model.default_top ?? model.image;
              return (
                <div
                  key={model.id}
                  className={`model-grid-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectModel(model.id)}
                >
                  {img
                    ? <img src={img} alt={genderLabel(model)} />
                    : <div className="model-img-placeholder" />
                  }
                  {isSelected && <span className="model-selected-badge">✓ Active</span>}
                  <div className="model-grid-item-label">
                    {genderLabel(model)}{model.height ? ` · ${model.height}cm` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
