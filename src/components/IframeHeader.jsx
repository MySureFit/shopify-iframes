import { navigateTo } from '../hooks/useIframeComms';
import { useFittingRoom } from '../context/FittingRoomContext';

export default function IframeHeader({
  fullNav = false,
  hideFrLabel = false,
  mobileIconBar = null,
}) {
  const { products } = useFittingRoom();
  const count = products?.length ?? 0;

  return (
    <header className={`tec_header${mobileIconBar ? ' tec_header--mobile-icons' : ''}`}>
      <div className="tec_header_top">
      <div className="tec_logo_box">
        <a href="/" data-posthog="mysurefit_logo_header">
          <img
            src="/assets/msf-main-logo-light-bg.png"
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
        <div id="fr_mobile_fr_btn_origin_box" className="tec_enter_fr_origin">
          <div className="tec_enter_fr_box">
            <a
              className="tec_enter_fr_link"
              title="Smart Fitting Room"
              onClick={(e) => { e.preventDefault(); navigateTo('fitting-room'); }}
            >
              {!hideFrLabel && <span className="hidden-xs">Enter Smart Fitting Room</span>}
              <img
                src="/assets/try-it-on.png"
                className="try_on_logo tec_msf_logo"
                alt="Try it on"
              />
              {count > 0 && <span id="fr_count">{count}</span>}
            </a>
          </div>
        </div>

        {fullNav && (
          <>
            <div className="gst_fr_right_menu_box">
              <div className="gst_right_header_login_box">
                <p className="gst_right_header_text">
                  <a href="#" onClick={(e) => e.preventDefault()} className="gst_right_header_login">Log in</a>
                  {' | '}
                  <a href="#" onClick={(e) => e.preventDefault()} className="gst_right_header_signup">Sign up</a>
                </p>
              </div>
              <div id="fr_mobile_cart_btn_origin_box">
                <div className="gst_fr_cart_dropdown_box tec_cart_box">
                  <div className="top-cart">
                    <a href="#" onClick={(e) => e.preventDefault()}>
                      <img src="/assets/tec-icon-cart.png" className="shopping_cart_icon" alt="Cart" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="tec_rewards_box">
                <a href="#" onClick={(e) => e.preventDefault()} className="tec_rewards_link">
                  <p className="tec_rewards_value">$0.00</p>
                  <p className="tec_rewards_desc">CREDITS</p>
                </a>
              </div>
            </div>

            <div className="tec_menu_box">
              <button type="button" className="menu_dropdown_btn" aria-label="Menu">
                <span className="icon-bar" />
                <span className="icon-bar" />
                <span className="icon-bar" />
              </button>
            </div>
          </>
        )}
      </div>
      </div>

      {mobileIconBar}
    </header>
  );
}
