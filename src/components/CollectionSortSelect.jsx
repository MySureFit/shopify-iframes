import { useState, useRef, useEffect } from 'react';

export default function CollectionSortSelect({ options, value, onChange, id = 'fr_select_sort' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options[value];

  useEffect(() => {
    const close = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const toggle = () => setOpen(o => !o);

  return (
    <div className="fc_sort_box" ref={rootRef}>
      <div className="custom_select">
        <select
          className="collection-sort__input s-hidden"
          id={id}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          tabIndex={-1}
          aria-hidden="true"
        >
          {options.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
        </select>
        <div className="c_select">
          <div
            className={`styledSelect${open ? ' active' : ''}`}
            onClick={toggle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
              }
            }}
            role="button"
            tabIndex={0}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <label htmlFor={id}>Sort by</label>
            <div className="selected_option">{selected?.label}</div>
          </div>
          <ul className="options" style={{ display: open ? 'block' : 'none' }} role="listbox">
            {options.map((o, i) => (
              <li
                key={i}
                role="option"
                aria-selected={i === value}
                className={i === value ? 'selected' : ''}
                onClick={() => { onChange(i); setOpen(false); }}
              >
                {o.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
