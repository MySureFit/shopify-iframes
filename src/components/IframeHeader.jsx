import { navigateTo } from '../hooks/useIframeComms';
import { useFittingRoom } from '../context/FittingRoomContext';

export default function IframeHeader() {
  const { products } = useFittingRoom();
  const count = products?.length ?? 0;

  return (
    <header className="tec_header">
      <div className="tec_logo_box">
        <a href="/" data-posthog="mysurefit_logo_header">
          <img
            src="/assets/msf-main-logo-light-bg.png"
            width="190"
            height="46"
            className="tec_logo_img"
            alt="MySureFit"
          />
        </a>
        <div className="taglines">
          <div>See it on.</div>
          <div>Know it fits.</div>
        </div>
      </div>

      <div className="tec_right_icon_box">
        <div className="tec_enter_fr_box">
          <a
            className="tec_enter_fr_link"
            title="Smart Fitting Room"
            onClick={(e) => { e.preventDefault(); navigateTo('fitting-room'); }}
          >
            <span>Enter Smart Fitting Room</span>
            <img
              src="/assets/try-it-on.png"
              className="try_on_logo tec_msf_logo"
              alt="Try it on"
            />
            {count > 0 && <span id="fr_count">{count}</span>}
          </a>
        </div>
      </div>
    </header>
  );
}
