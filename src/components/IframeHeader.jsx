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
        <div id="fr_mobile_fr_btn_origin_box" style={{ position: 'relative' }}>
          <div className="tec_enter_fr_box">
            <a
              href="javascript:void(0);"
              className="tec_enter_fr_link"
              title="Smart Fitting Room"
              onClick={(e) => { e.preventDefault(); navigateTo('fitting-room'); }}
            >
              <span className="hidden-xs">Enter Smart Fitting Room</span>
              <img
                src="/assets/try-it-on.png"
                className="try_on_logo tec_msf_logo"
                alt="Try it on"
              />
              {count > 0 && <span id="fr_count">{count}</span>}
            </a>
          </div>
        </div>

        <div className="gst_fr_right_menu_box">
          <div className="gst_right_header_login_box">
            <p className="gst_right_header_text">
              <a
                href="javascript:void(0);"
                className="gst_right_header_login"
                onClick={(e) => { e.preventDefault(); navigateTo('models'); }}
              >
                Log in
              </a>
              {' | '}
              <a
                href="javascript:void(0);"
                id="gst_right_header_signup"
                onClick={(e) => { e.preventDefault(); navigateTo('models'); }}
              >
                Sign up
              </a>
            </p>
          </div>

          <div className="gst_fr_cart_dropdown_box tec_cart_box">
            <p className="top-cart">
              <a href="javascript:void(0);">
                <span className="first">
                  <img
                    src="/assets/tec-icon-cart.png"
                    className="shopping_cart_icon"
                    alt="Cart"
                  />
                </span>
              </a>
            </p>
          </div>

          <div className="tec_rewards_box">
            <a href="javascript:void(0);" className="tec_rewards_link">
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
      </div>
    </header>
  );
}
