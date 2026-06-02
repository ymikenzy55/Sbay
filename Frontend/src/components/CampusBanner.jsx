import { useState } from 'react';
import { MapPin, X, ChevronDown, Navigation, Loader2 } from 'lucide-react';
import { useLocation } from '../store/LocationContext';
import './CampusBanner.css';

/**
 * Thin campus bar:
 * - No campus + idle/denied: shows "Allow location" button that triggers geolocation.
 * - No campus + prompting: shows "Detecting…" spinner.
 * - Campus set: shows campus name with change/clear options.
 * "Change" opens a manual picker sheet as fallback.
 */
export default function CampusBanner() {
  const { campus, setCampus, clearCampus, schools, loading, locStatus, autoDetect } = useLocation();
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
        ) : locStatus === 'prompting' ? (
          <span className="campus-bar-detecting">
            <Loader2 size={13} className="spin" />
            Detecting your location…
          </span>
        ) : (
          <div className="campus-bar-actions">
            <button className="campus-bar-set" onClick={autoDetect}>
              <Navigation size={13} />
              Allow location for local deals
            </button>
            <button className="campus-bar-set campus-bar-manual" onClick={() => setOpen(true)}>
              or pick manually
            </button>
          </div>
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
