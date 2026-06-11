import { useState } from 'react';
import { useFittingRoom } from '../context/FittingRoomContext';

export default function HangerButton({ v3Id, shopifyId }) {
  const { isInFittingRoom, toggleProduct } = useFittingRoom();
  const [busy, setBusy] = useState(false);
  const added = isInFittingRoom(v3Id);

  const handleClick = async (e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    await toggleProduct(v3Id, shopifyId);
    setBusy(false);
  };

  return (
    <button
      className={`hanger-btn${busy ? ' loading' : ''}`}
      onClick={handleClick}
      title={added ? 'Remove from fitting room' : 'Add to fitting room'}
    >
      {busy ? (
        <span className="hanger-spinner" />
      ) : (
        <img
          src={added ? '/try-on-green.png' : '/try-on-black.png'}
          alt="Try it on"
        />
      )}
    </button>
  );
}
