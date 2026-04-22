import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

/**
 * Searchable combobox. Panel is portaled to document.body with fixed positioning
 * so it is not clipped by parent overflow (e.g. horizontal filter bars).
 */
export default function SearchableSelect({ value, onChange, options = [], className = '', disabled = false }) {
  const searchInputId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [panelRect, setPanelRect] = useState({ top: 0, left: 0, width: 280 });

  const selectedLabel = useMemo(() => {
    const found = options.find((o) => o.value === value);
    return found?.label ?? '—';
  }, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q)
    );
  }, [options, query]);

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const maxW = Math.min(360, window.innerWidth - 16);
    const w = Math.min(Math.max(260, r.width + 40), maxW);
    let left = r.left;
    if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8);
    if (left < 8) left = 8;
    const panelMaxH = 320;
    let top = r.bottom + 6;
    if (top + panelMaxH > window.innerHeight - 12 && r.top > panelMaxH + 12) {
      top = Math.max(8, r.top - panelMaxH - 6);
    }
    setPanelRect({ top, left, width: w });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const t = e.target;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
      setQuery('');
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const panel =
    open &&
    createPortal(
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: panelRect.top,
          left: panelRect.left,
          width: panelRect.width,
          zIndex: 9999,
        }}
        className="rounded-xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden max-h-[min(22rem,calc(100vh-2rem))]"
        role="listbox"
      >
        <div className="shrink-0 border-b border-slate-100 bg-slate-50/90 p-2">
          <label htmlFor={searchInputId} className="sr-only">
            Search list
          </label>
          <input
            id={searchInputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            autoComplete="off"
            autoFocus
          />
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-sm text-slate-400">No matches</li>
          ) : (
            filtered.map((o) => (
              <li key={o.value === '' ? '__all__' : String(o.value)}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === o.value}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                    value === o.value ? 'bg-blue-50 font-semibold text-blue-900' : 'text-slate-800'
                  }`}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  {o.label}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>,
      document.body
    );

  return (
    <>
      <div ref={triggerRef} className={className}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
          title={selectedLabel}
          className="w-full flex items-center justify-between gap-1 bg-slate-50 border border-slate-200 py-2 px-2 rounded-lg text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 disabled:opacity-50"
        >
          <span className="truncate text-left min-w-0">{selectedLabel}</span>
          <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {panel}
    </>
  );
}
