import { navigateTo, closeOverlay } from '../hooks/useIframeComms';
import { useFittingRoom } from '../context/FittingRoomContext';

export default function IframeHeader() {
  const { products } = useFittingRoom();
  const count = products?.length ?? 0;

  return (
    <header className="iframe-top-header">
      <div className="iframe-top-brand">
        <span className="iframe-top-brand-name">MY<span className="iframe-top-brand-sure">SURE</span>FIT</span>
        <span className="iframe-top-brand-tag">See it on.<br />Know it fits.</span>
      </div>

      <div className="iframe-top-actions">
        <button
          className="iframe-enter-fr-btn"
          onClick={() => navigateTo('fitting-room')}
        >
          {count > 0 && <span className="iframe-fr-count">{count}</span>}
          Enter Smart Fitting Room
          <img src="/try-on-green.png" alt="Try it on" className="iframe-fr-badge" />
        </button>

        <button className="iframe-close-btn" onClick={closeOverlay} title="Close">
          &times;
        </button>
      </div>
    </header>
  );
}
