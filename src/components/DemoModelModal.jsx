import { useEffect } from 'react';
import { useFittingRoom } from '../context/FittingRoomContext';

export default function DemoModelModal({ onClose }) {
  const { allModels, currentModel, isLoadingModels, loadModels, selectModel } = useFittingRoom();

  useEffect(() => {
    if (allModels.length === 0) loadModels();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSelect = async (modelId) => {
    await selectModel(modelId);
    onClose();
  };

  const genderLabel = (model) => {
    if (!model.gender || model.gender === null) return 'My Model';
    return model.gender === 'f' ? 'Female' : 'Male';
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-sheet">
        <div className="modal-header">
          <h2 className="modal-title">Select a Model</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {isLoadingModels ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" style={{ borderTopColor: '#1a1a1a' }} />
          </div>
        ) : allModels.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: 24 }}>No models available.</p>
        ) : (
          <div className="model-grid">
            {allModels.map((model) => {
              const isSelected = currentModel?.id === model.id;
              const img = model.image_no_cloths ?? model.default_top ?? model.image;
              return (
                <div
                  key={model.id}
                  className={`model-grid-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(model.id)}
                >
                  {img ? (
                    <img src={img} alt={`Model ${model.id}`} />
                  ) : (
                    <div style={{ aspectRatio: '2/3', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 11 }}>
                      No image
                    </div>
                  )}
                  {isSelected && <span className="model-selected-badge">✓ Active</span>}
                  <div className="model-grid-item-label">
                    {genderLabel(model)}
                    {model.height ? ` · ${model.height}cm` : ''}
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
