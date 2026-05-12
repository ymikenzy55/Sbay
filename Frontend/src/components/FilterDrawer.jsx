import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, X, Check, RotateCcw, ChevronDown } from 'lucide-react';
import { sbay } from '../api/client';
import './FilterDrawer.css';

/**
 * Reusable filter drawer used by the Home and Categories pages.
 *
 * Props:
 *  - value: { universities: string[], priceMin: number, priceMax: number }
 *  - onApply(next): called when the user taps Apply
 *  - onReset(): clear all filters
 *  - inline: render as an inline pill button instead of fixed/floating
 *  - label: button label override
 */
const DEFAULT = { universities: [], priceMin: 0, priceMax: 10000 };

export default function FilterDrawer({ value, onApply, onReset, inline, label = 'Filter' }) {
  const [open, setOpen]               = useState(false);
  const [unis, setUnis]               = useState([]);
  const [draft, setDraft]             = useState({ ...DEFAULT, ...(value || {}) });

  useEffect(() => { sbay.getUniversities().then(setUnis); }, []);

  // Keep local draft in sync when the parent's value changes (e.g. reset).
  useEffect(() => { setDraft({ ...DEFAULT, ...(value || {}) }); }, [value, open]);

  const setUni = (id) => {
    setDraft((d) => ({
      ...d,
      universities: id ? [id] : [],
    }));
  };

  const activeCount =
    (value?.universities?.length || 0) +
    ((value?.priceMin ?? DEFAULT.priceMin) !== DEFAULT.priceMin ? 1 : 0) +
    ((value?.priceMax ?? DEFAULT.priceMax) !== DEFAULT.priceMax ? 1 : 0);

  return (
    <>
      <button
        className={`filter-btn ${inline ? 'inline' : ''} ${activeCount > 0 ? 'has-active' : ''}`}
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal size={16} />
        <span>{label}</span>
        {activeCount > 0 && <span className="filter-count">{activeCount}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="filter-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <div className="filter-sheet-wrap" onClick={() => setOpen(false)}>
            <motion.div
              className="filter-sheet"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <header className="filter-head">
                <h3>Filter results</h3>
                <button onClick={() => setOpen(false)} aria-label="Close">
                  <X size={20} />
                </button>
              </header>

              <section className="filter-section">
                <h4>School / Campus</h4>
                <div className="uni-select-wrap">
                  <select
                    className="uni-select"
                    value={draft.universities[0] || ''}
                    onChange={(e) => setUni(e.target.value)}
                  >
                    <option value="">All schools</option>
                    {unis.map((u) => (
                      <option key={u.id} value={u.id}>{u.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="uni-select-caret" />
                </div>
              </section>

              <section className="filter-section">
                <h4>Price range</h4>
                <div className="price-pills">
                  <label className="price-pill">
                    <span>Min</span>
                    <input
                      type="number"
                      min="0"
                      value={draft.priceMin}
                      onChange={(e) =>
                        setDraft({ ...draft, priceMin: Math.max(0, +e.target.value || 0) })
                      }
                    />
                    <span className="currency">GH₵</span>
                  </label>
                  <label className="price-pill">
                    <span>Max</span>
                    <input
                      type="number"
                      min="0"
                      value={draft.priceMax}
                      onChange={(e) =>
                        setDraft({ ...draft, priceMax: Math.max(0, +e.target.value || 0) })
                      }
                    />
                    <span className="currency">GH₵</span>
                  </label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={draft.priceMax}
                  onChange={(e) => setDraft({ ...draft, priceMax: +e.target.value })}
                  className="price-slider"
                />
                <p className="price-summary">
                  Showing items from <strong>GH₵ {draft.priceMin.toLocaleString()}</strong>{' '}
                  to <strong>GH₵ {draft.priceMax.toLocaleString()}</strong>
                </p>
              </section>

              <footer className="filter-foot">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setDraft({ ...DEFAULT });
                    onReset?.();
                  }}
                >
                  <RotateCcw size={14} /> Reset
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onApply?.(draft);
                    setOpen(false);
                  }}
                >
                  <Check size={16} /> Apply filters
                </button>
              </footer>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
