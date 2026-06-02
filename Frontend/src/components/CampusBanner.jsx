import { useState } from 'react';
import { MapPin, X, ChevronDown, Navigation } from 'lucide-react';
import { useLocation } from '../store/LocationContext';
import './CampusBanner.css';

/**
 * Thin campus-selection bar shown at the top of the home/trending pages.
 * - If no campus is set: shows "Set your campus" prompt.
 * - If campus is set: shows the campus name with a change button.
 * The picker is a slide-up sheet on mobile / popover on desktop.
 */
export default function CampusBanner() {
  const { campus, setCampus, clearCampus, schools, loading } = useLocation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const filtered = q.trim()
    ? schools.filter((s) =>
        s.label.toLowerCase().includes(q.toLowerCase()) ||
        (s.city || '').toLowerCase().includes(q.toLowerCase())
      )
    : schools;

  const pick = (school) => {
    setCampus(school);
    setOpen(false);
    setQ('');
  };

  return (
    <>
      <div className={`campus-bar ${campus ? 'set' : 'unset'}`}>
        <MapPin size={14} className="campus-bar-ic" />
        {campus ? (
          <>
            <span className="campus-bar-name">{campus.label}</span>
            {campus.city && <span className="campus-bar-city">{campus.city}</span>}
            <button className="campus-bar-change" onClick={() => setOpen(true)}>
              Change <ChevronDown size={12} />
            </button>
            <button className="campus-bar-clear" onClick={clearCampus} aria-label="Clear campus">
              <X size={12} />
            </button>
          </>
        ) : (
          <button className="campus-bar-set" onClick={() => setOpen(true)}>
            <Navigation size={13} />
            Set your campus to see local deals
          </button>
        )}
      </div>

      {open && (
        <div className="campus-overlay" onClick={() => setOpen(false)}>
          <div className="campus-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="campus-sheet-h">
              <strong>Choose your campus</strong>
              <button className="campus-sheet-close" onClick={() => setOpen(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <input
              className="campus-search"
              placeholder="Search campus or city…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
            <ul className="campus-list">
              {loading && <li className="campus-loading">Loading campuses…</li>}
              {!loading && filtered.length === 0 && (
                <li className="campus-loading">No campuses match "{q}"</li>
              )}
              {filtered.map((school) => (
                <li key={school.id}>
                  <button
                    className={`campus-opt ${campus?.id === school.id ? 'active' : ''}`}
                    onClick={() => pick(school)}
                  >
                    <span className="campus-opt-name">{school.label}</span>
                    {school.city && <span className="campus-opt-city">{school.city}</span>}
                    {campus?.id === school.id && <span className="campus-opt-tick">✓</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
