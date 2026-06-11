import { navigateTo } from '../hooks/useIframeComms';
import { useFittingRoom } from '../context/FittingRoomContext';

export default function VFRBar() {
  const { products } = useFittingRoom();
  if (products.length === 0) return null;

  return (
    <div className="vfr-bar">
      <div className="vfr-bar-left">
        <span className="vfr-bar-badge">{products.length}</span>
        <span className="vfr-bar-label">
          {products.length === 1 ? '1 item' : `${products.length} items`} selected
        </span>
      </div>
      <button className="vfr-bar-btn" onClick={() => navigateTo('models')}>
        Try On →
      </button>
    </div>
  );
}
