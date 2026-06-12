import { useEffect, useRef, useState, useCallback } from 'react';
import noUiSlider from 'nouislider';
import wNumb from 'wnumb';
import 'nouislider/dist/nouislider.css';

function parsePrice(val) {
  return Math.round(Number(String(val).replace(/[^0-9.]/g, '')) || 0);
}

export default function PriceFilter({ open, priceRange, sliderRange, activePrice, onApply, onClear }) {
  const sliderRef = useRef(null);
  const sliderApi = useRef(null);
  const activePriceRef = useRef(activePrice);
  const [minVal, setMinVal] = useState('');
  const [maxVal, setMaxVal] = useState('');
  const [canApply, setCanApply] = useState(false);

  activePriceRef.current = activePrice;

  const rangeMin = Number(priceRange?.min_price ?? 0);
  const rangeMax = Number(priceRange?.max_price ?? 100);
  const totalMin = Number(sliderRange?.min_price ?? rangeMin);
  const totalMax = Number(sliderRange?.max_price ?? rangeMax);

  const syncCanApply = useCallback((min, max) => {
    const applied = activePriceRef.current;
    if (!applied) {
      setCanApply(min !== rangeMin || max !== rangeMax);
      return;
    }
    setCanApply(applied[0] !== min || applied[1] !== max);
  }, [rangeMin, rangeMax]);

  useEffect(() => {
    if (!open || !sliderRef.current || priceRange?.min_price == null) return;

    const applied = activePriceRef.current;
    const startMin = applied?.[0] ?? rangeMin;
    const startMax = applied?.[1] ?? rangeMax;

    setMinVal(String(startMin));
    setMaxVal(String(startMax));
    syncCanApply(startMin, startMax);

    if (sliderApi.current) {
      sliderApi.current.destroy();
      sliderApi.current = null;
    }

    noUiSlider.create(sliderRef.current, {
      start: [startMin, startMax],
      connect: true,
      range: { min: totalMin, max: totalMax },
      pips: {
        mode: 'steps',
        stepped: true,
        density: 5,
        format: wNumb({ decimals: 0, prefix: '$' }),
      },
      format: wNumb({ decimals: 0, prefix: '$' }),
    });

    sliderApi.current = sliderRef.current.noUiSlider;

    sliderRef.current.noUiSlider.on('update', (values) => {
      const min = parsePrice(values[0]);
      const max = parsePrice(values[1]);
      setMinVal(String(min));
      setMaxVal(String(max));
      syncCanApply(min, max);
    });

    return () => {
      if (sliderApi.current) {
        sliderApi.current.destroy();
        sliderApi.current = null;
      }
    };
  }, [open, rangeMin, rangeMax, totalMin, totalMax, priceRange?.min_price, syncCanApply]);

  const handleMinChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setMinVal(val);
    const num = Number(val);
    if (!Number.isNaN(num) && sliderApi.current) {
      sliderApi.current.setHandle(0, num);
    }
  };

  const handleMaxChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setMaxVal(val);
    const num = Number(val);
    if (!Number.isNaN(num) && sliderApi.current) {
      sliderApi.current.setHandle(1, num);
    }
  };

  const handleApply = () => {
    onApply(Number(minVal), Number(maxVal));
    setCanApply(false);
  };

  const handleClear = () => {
    onClear();
    if (sliderApi.current) {
      sliderApi.current.set([rangeMin, rangeMax]);
    }
    setMinVal(String(rangeMin));
    setMaxVal(String(rangeMax));
    setCanApply(false);
  };

  return (
    <>
      <div className="fr_range_lbl">
        <p><span>Min</span> <input id="fr_from" type="text" value={minVal} onChange={handleMinChange} /></p>
        <p><span>Max</span> <input id="fr_to" type="text" value={maxVal} onChange={handleMaxChange} /></p>
      </div>
      <div
        id="fr_price_slider"
        ref={sliderRef}
        data-min={rangeMin}
        data-max={rangeMax}
        data-total-min={totalMin}
        data-total-max={totalMax}
      />
      <div className="fr_price_submit_btn_box">
        <button
          type="button"
          className={`fr_price_submit_btn btn_primary${canApply ? '' : ' disabled'}`}
          disabled={!canApply}
          onClick={handleApply}
        >
          Apply
        </button>
        <button
          type="button"
          className="clear_filter_link btn_primary"
          data-filter="price_range"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
    </>
  );
}
