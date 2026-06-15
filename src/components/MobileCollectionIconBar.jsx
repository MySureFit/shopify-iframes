import { navigateTo } from '../hooks/useIframeComms';
import { useFittingRoom } from '../context/FittingRoomContext';

export default function MobileCollectionIconBar({
  totalCount,
  totalActive,
  activeIcon = 'filter',
  onFilterClick,
  onSearchClick,
}) {
  const { products } = useFittingRoom();
  const frCount = products?.length ?? 0;

  return (
    <>
      <div className="fr_mobile_menu_box">
        <button
          type="button"
          id="fitting_room_filter_btn"
          className="fr_mobile_menu_filter_btn fr_mobile_menu_btn"
          onClick={onFilterClick}
          aria-label="Filter"
        >
          <img
            src="/assets/tec-icon-filter.png"
            className="tec_msf_logo tec_msc_filter_icon"
            alt=""
          />
          <span id="filter_count_box">
            <span style={{ position: 'relative' }}>
              {totalActive > 0 && <span id="filter_count">{totalActive}</span>}
              {totalCount > 0 && <span id="filter_item_count">{totalCount}</span>}
            </span>
          </span>
        </button>

        <button
          type="button"
          id="fitting_room_search_btn"
          className="fr_mobile_menu_search_btn fr_mobile_menu_btn"
          onClick={onSearchClick}
          aria-label="Search"
        >
          <img
            src="/assets/tec-icon-search.png"
            className="tec_msf_logo tec_msc_search_icon"
            alt=""
          />
        </button>

        <div id="fr_mobile_fr_btn_box">
          <a
            href="/iframe/fitting-room"
            className="tec_enter_fr_link"
            title="Smart Fitting Room"
            onClick={(e) => { e.preventDefault(); navigateTo('fitting-room'); }}
          >
            <img
              src="/assets/try-it-on.png"
              className="try_on_logo tec_msf_logo"
              alt="Try it on"
            />
            {frCount > 0 && <span id="fr_count">{frCount}</span>}
          </a>
        </div>
      </div>

      <div className="tec_arrow_history_box">
        <div
          id="tec_filter_arrow_box"
          className={`tec_arrow_box${activeIcon === 'filter' ? ' active_arrow' : ''}`}
        >
          <div className="arrow-up" />
        </div>
        <div
          id="tec_search_arrow_box"
          className={`tec_arrow_box${activeIcon === 'search' ? ' active_arrow' : ''}`}
        >
          <div className="arrow-up" />
        </div>
        <div
          id="tec_fittingroom_arrow_box"
          className={`tec_arrow_box${activeIcon === 'fittingroom' ? ' active_arrow' : ''}`}
        >
          <div className="arrow-up" />
        </div>
      </div>
    </>
  );
}
